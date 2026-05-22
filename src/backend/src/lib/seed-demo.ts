import type { AssignmentsRepo } from "../repo/assignments-repo.js";
import type { ConceptCheckSetsRepo } from "../repo/concept-check-sets-repo.js";
import type { ConceptCheckVerificationsRepo } from "../repo/concept-check-verifications-repo.js";
import type { ReferenceSolutionsRepo } from "../repo/reference-solutions-repo.js";
import type { SubmissionsRepo } from "../repo/submissions-repo.js";

/**
 * Boot-time seed for the demo tenant. Only runs when SEED_DEMO_DATA=true AND
 * memory repos are in use (no real DB writes). The seed uses the same default
 * tenant/instructor/student IDs that the frontend api-client falls back to
 * (`demo-tenant` / `demo-instructor` / `demo-student`), so the existing UI hits
 * the seeded data without any header changes.
 *
 * Content is deliberately generic (biology short-answer) to avoid biasing
 * demos toward any one domain — the verification rubric is domain-neutral and
 * the seed should be too.
 *
 * The seed returns the resulting record IDs so the server can log them at
 * boot. Frontend discovers them by hitting GET /v1/instructor/dashboard with
 * the default demo headers.
 */
export type DemoSeedRepos = {
  assignmentsRepo: AssignmentsRepo;
  referenceSolutionsRepo: ReferenceSolutionsRepo;
  submissionsRepo: SubmissionsRepo;
  conceptCheckSetsRepo: ConceptCheckSetsRepo;
  conceptCheckVerificationsRepo: ConceptCheckVerificationsRepo;
};

export type DemoSeedIds = {
  tenantId: string;
  instructorId: string;
  studentId: string;
  assignmentId: string;
  referenceSolutionId: string;
  submissionId: string;
  conceptCheckSetId: string;
  verificationId: string;
};

const TENANT = "demo-tenant";
const INSTRUCTOR = "demo-instructor";
const STUDENT = "demo-student";

export async function seedDemoData(repos: DemoSeedRepos): Promise<DemoSeedIds> {
  const auth = { tenantId: TENANT, instructorId: INSTRUCTOR };

  // 1. Assignment policy.
  const assignment = await repos.assignmentsRepo.create(auth, {
    title: "Cellular respiration — short answer",
    instructions:
      "In your own words, explain how cellular respiration converts glucose into ATP. " +
      "Cover the three main stages (glycolysis, the citric acid cycle, and the electron " +
      "transport chain) and how they connect. Aim for 4–8 sentences.",
    rubric:
      "Correct if the student names the three stages, gives at least one input/output per " +
      "stage, and explains how the electron transport chain drives ATP synthesis.",
    aiHelp: {
      conceptExplanation: true,
      hints: true,
      examples: true,
      debuggingGuidance: false,
      restrictFinalAnswer: true,
    },
    aiHelpEnabled: true,
    verificationMode: "score",
  });

  // 2. Instructor Solution Guide.
  const reference = await repos.referenceSolutionsRepo.createNextVersion({
    tenantId: TENANT,
    assignmentId: assignment.id,
    instructorId: INSTRUCTOR,
    body: {
      expectedSolution:
        "Glycolysis splits glucose into two pyruvate, yielding a small amount of ATP and NADH. " +
        "The citric acid cycle oxidizes pyruvate-derived acetyl-CoA, producing CO2, NADH, and FADH2. " +
        "The electron transport chain uses the electrons in NADH/FADH2 to pump protons across the " +
        "inner mitochondrial membrane, and ATP synthase uses the resulting gradient to phosphorylate " +
        "ADP into ATP. The three stages are coupled: each stage's products are the next stage's inputs.",
      keyConcepts: [
        "glycolysis splits glucose into pyruvate",
        "citric acid cycle oxidizes acetyl-CoA",
        "electron transport chain pumps protons",
        "ATP synthase uses the proton gradient",
      ],
      requiredReasoningSteps: [
        "name the three stages",
        "state at least one input and one output per stage",
        "explain that the electron transport chain drives ATP synthesis via the proton gradient",
      ],
      commonMistakes: [
        "skipping the proton gradient and treating ATP synthase as magic",
        "confusing the citric acid cycle with glycolysis",
        "claiming oxygen is the input to glycolysis",
      ],
      correctnessCriteria:
        "Correct when the student names the three stages, gives at least one input/output per stage, " +
        "and connects the electron transport chain's proton gradient to ATP synthase's role.",
      optionalNotes: null,
    },
  });

  // 3. Student submission — solid but imperfect.
  const submission = await repos.submissionsRepo.create({
    assignment,
    studentId: STUDENT,
    body: {
      content:
        "Cellular respiration converts glucose into ATP in three main stages. First, glycolysis " +
        "breaks glucose into two pyruvate molecules in the cytoplasm, making a small amount of " +
        "ATP and NADH. Then the citric acid cycle in the mitochondrion takes acetyl-CoA from the " +
        "pyruvate and produces CO2, more NADH, and FADH2. Finally the electron transport chain " +
        "uses NADH and FADH2 to drive ATP synthesis through ATP synthase, which is how most of " +
        "the ATP is actually made.",
    },
  });

  // 4. Concept-check set (3 questions, generated grounded in the student's submission).
  const conceptCheckSet = await repos.conceptCheckSetsRepo.create({
    submission,
    questions: [
      {
        id: "demo-q1",
        ordinal: 1,
        prompt:
          "You wrote that glycolysis produces a 'small amount of ATP and NADH'. What are " +
          "glycolysis's inputs and outputs in your own words, and where in the cell does it happen?",
        conceptTag: "glycolysis",
      },
      {
        id: "demo-q2",
        ordinal: 2,
        prompt:
          "Your submission says the electron transport chain 'uses NADH and FADH2 to drive ATP " +
          "synthesis'. What is the mechanism that connects the electron transport chain to ATP " +
          "synthase? Be specific about what gets pumped where.",
        conceptTag: "ATP synthase",
      },
      {
        id: "demo-q3",
        ordinal: 3,
        prompt:
          "Why does this process require oxygen at all? In your account, what would happen if " +
          "oxygen were absent at the electron transport chain stage?",
        conceptTag: "role of oxygen",
      },
    ],
    provider: "stub",
    model: null,
    referencePin: {
      referenceSolutionId: reference.id,
      referenceVersion: reference.version,
      referenceHash: reference.referenceHash,
    },
  });

  // 5. Student verification answers — deliberately mixed so the result is
  //    `needs_review`. This is the most useful demo state: it shows pass/needs/fail
  //    isn't a rubber-stamp.
  const verification = await repos.conceptCheckVerificationsRepo.create({
    set: conceptCheckSet,
    answers: [
      {
        questionId: "demo-q1",
        answer:
          "Glycolysis happens in the cytoplasm. The input is one glucose molecule. The outputs " +
          "are two pyruvate molecules, two ATP (net), and two NADH. It does not need oxygen.",
      },
      {
        questionId: "demo-q2",
        answer:
          "The electron transport chain moves electrons through proteins in the inner " +
          "mitochondrial membrane, and this pumps protons (H+) from the matrix into the " +
          "intermembrane space. The resulting gradient drives protons back through ATP synthase, " +
          "which uses that motion to phosphorylate ADP into ATP.",
      },
      {
        questionId: "demo-q3",
        answer: "Oxygen is needed at the end of the chain to accept the electrons.",
      },
    ],
    result: "needs_review",
    overallFeedback:
      "Strong on glycolysis and on the chemiosmotic mechanism — the student names inputs, " +
      "outputs, location, and the role of the proton gradient. The third answer is correct " +
      "but undercooked: it states the conclusion (oxygen accepts electrons) without explaining " +
      "what would happen if oxygen were absent. Instructor should ask the student to expand on " +
      "the consequences of an absent terminal electron acceptor.",
    perQuestionFeedback: [
      {
        questionId: "demo-q1",
        status: "sufficient",
        feedback:
          "Names inputs, outputs, location, and notes the anaerobic nature of glycolysis. " +
          "Specific enough to demonstrate understanding.",
      },
      {
        questionId: "demo-q2",
        status: "sufficient",
        feedback:
          "Correctly identifies the proton-gradient mechanism connecting the electron transport " +
          "chain to ATP synthase, with the right anatomical detail (inner mitochondrial membrane).",
      },
      {
        questionId: "demo-q3",
        status: "partial",
        feedback:
          "States that oxygen is the terminal electron acceptor but does not explain the " +
          "consequence of its absence — the gradient would collapse, ATP synthesis would halt, " +
          "and the chain would back up. Recommend follow-up.",
      },
    ],
    provider: "stub",
    model: null,
    referencePin: {
      referenceSolutionId: reference.id,
      referenceVersion: reference.version,
      referenceHash: reference.referenceHash,
    },
    hasVoiceAnswers: false,
  });

  return {
    tenantId: TENANT,
    instructorId: INSTRUCTOR,
    studentId: STUDENT,
    assignmentId: assignment.id,
    referenceSolutionId: reference.id,
    submissionId: submission.id,
    conceptCheckSetId: conceptCheckSet.id,
    verificationId: verification.id,
  };
}
