import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const assignments = pgTable(
  "assignments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    instructorId: text("instructor_id").notNull(),
    currentVersion: integer("current_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantInstructorIdx: index("assignments_tenant_instructor_idx").on(t.tenantId, t.instructorId),
  }),
);

export const assignmentPolicyVersions = pgTable(
  "assignment_policy_versions",
  {
    id: text("id").primaryKey(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "restrict" }),
    tenantId: text("tenant_id").notNull(),
    instructorId: text("instructor_id").notNull(),
    version: integer("version").notNull(),
    title: text("title").notNull(),
    instructions: text("instructions").notNull(),
    rubric: text("rubric"),
    aiHelp: jsonb("ai_help").notNull(),
    // D-047: master AI-help toggle. Defaults to true at the column level so
    // pre-existing rows (without this column) keep working after the migration.
    aiHelpEnabled: boolean("ai_help_enabled").notNull().default(true),
    verificationMode: text("verification_mode").notNull(),
    policyHash: text("policy_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    assignmentVersionUnique: uniqueIndex("apv_assignment_version_unique").on(
      t.assignmentId,
      t.version,
    ),
    assignmentIdx: index("apv_assignment_idx").on(t.assignmentId, t.version),
    tenantIdx: index("apv_tenant_idx").on(t.tenantId),
  }),
);

export type AssignmentRow = typeof assignments.$inferSelect;
export type AssignmentPolicyVersionRow = typeof assignmentPolicyVersions.$inferSelect;

export const submissions = pgTable(
  "submissions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "restrict" }),
    studentId: text("student_id").notNull(),
    policyVersionId: text("policy_version_id")
      .notNull()
      .references(() => assignmentPolicyVersions.id, { onDelete: "restrict" }),
    policyVersion: integer("policy_version").notNull(),
    policyHash: text("policy_hash").notNull(),
    content: text("content").notNull(),
    contentHash: text("content_hash").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    assignmentIdx: index("submissions_assignment_idx").on(t.assignmentId, t.submittedAt),
    studentIdx: index("submissions_student_idx").on(t.tenantId, t.studentId, t.submittedAt),
    tenantIdx: index("submissions_tenant_idx").on(t.tenantId),
  }),
);

export type SubmissionRow = typeof submissions.$inferSelect;

export const conceptCheckSets = pgTable(
  "concept_check_sets",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "restrict" }),
    submissionId: text("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "restrict" }),
    studentId: text("student_id").notNull(),
    policyVersionId: text("policy_version_id")
      .notNull()
      .references(() => assignmentPolicyVersions.id, { onDelete: "restrict" }),
    policyVersion: integer("policy_version").notNull(),
    policyHash: text("policy_hash").notNull(),
    submissionContentHash: text("submission_content_hash").notNull(),
    questions: jsonb("questions").notNull(),
    questionCount: integer("question_count").notNull(),
    provider: text("provider").notNull(),
    model: text("model"),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
    // D-041: reference pin (nullable). FK declared lazily to avoid TDZ on the
    // `assignmentReferenceSolutions` table defined later in this module.
    referenceSolutionId: text("reference_solution_id").references(
      () => assignmentReferenceSolutions.id,
      { onDelete: "restrict" },
    ),
    referenceVersion: integer("reference_version"),
    referenceHash: text("reference_hash"),
  },
  (t) => ({
    submissionIdx: index("ccs_submission_idx").on(t.submissionId, t.generatedAt),
    tenantStudentIdx: index("ccs_tenant_student_idx").on(t.tenantId, t.studentId),
    assignmentIdx: index("ccs_assignment_idx").on(t.assignmentId, t.generatedAt),
  }),
);

export type ConceptCheckSetRow = typeof conceptCheckSets.$inferSelect;

export const conceptCheckVerifications = pgTable(
  "concept_check_verifications",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "restrict" }),
    submissionId: text("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "restrict" }),
    conceptCheckSetId: text("concept_check_set_id")
      .notNull()
      .references(() => conceptCheckSets.id, { onDelete: "restrict" }),
    studentId: text("student_id").notNull(),
    policyVersionId: text("policy_version_id")
      .notNull()
      .references(() => assignmentPolicyVersions.id, { onDelete: "restrict" }),
    policyVersion: integer("policy_version").notNull(),
    policyHash: text("policy_hash").notNull(),
    submissionContentHash: text("submission_content_hash").notNull(),
    answers: jsonb("answers").notNull(),
    result: text("result").notNull(),
    overallFeedback: text("overall_feedback").notNull(),
    perQuestionFeedback: jsonb("per_question_feedback").notNull(),
    provider: text("provider").notNull(),
    model: text("model"),
    evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull().defaultNow(),
    // D-041: reference pin (nullable).
    referenceSolutionId: text("reference_solution_id").references(
      () => assignmentReferenceSolutions.id,
      { onDelete: "restrict" },
    ),
    referenceVersion: integer("reference_version"),
    referenceHash: text("reference_hash"),
    // D-048: flag set true at write time when any answer has modality === "voice".
    hasVoiceAnswers: boolean("has_voice_answers").notNull().default(false),
  },
  (t) => ({
    setIdx: index("ccv_set_idx").on(t.conceptCheckSetId, t.evaluatedAt),
    tenantStudentIdx: index("ccv_tenant_student_idx").on(t.tenantId, t.studentId),
    submissionIdx: index("ccv_submission_idx").on(t.submissionId, t.evaluatedAt),
  }),
);

export type ConceptCheckVerificationRow = typeof conceptCheckVerifications.$inferSelect;

export const assignmentReferenceSolutions = pgTable(
  "assignment_reference_solutions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    assignmentId: text("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "restrict" }),
    instructorId: text("instructor_id").notNull(),
    version: integer("version").notNull(),
    expectedSolution: text("expected_solution").notNull(),
    keyConcepts: jsonb("key_concepts").notNull(),
    requiredReasoningSteps: jsonb("required_reasoning_steps").notNull(),
    commonMistakes: jsonb("common_mistakes").notNull(),
    correctnessCriteria: text("correctness_criteria").notNull(),
    optionalNotes: text("optional_notes"),
    referenceHash: text("reference_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    assignmentVersionUnique: uniqueIndex("ars_assignment_version_unique").on(
      t.assignmentId,
      t.version,
    ),
    assignmentIdx: index("ars_assignment_idx").on(t.assignmentId, t.version),
    tenantIdx: index("ars_tenant_idx").on(t.tenantId),
  }),
);

export type AssignmentReferenceSolutionRow = typeof assignmentReferenceSolutions.$inferSelect;
