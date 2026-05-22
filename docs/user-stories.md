# User Stories

**Purpose:** User stories for Acta verification MVP, organized by persona.
**Owner:** product-manager-agent
**Last updated:** 2026-05-05
**Status:** Draft — blocked until MVP scope is approved

---

## Personas

- **Instructor** — primary buyer interaction surface; must configure, monitor, and trust the system
- **Student** — primary end-user of verification; must complete concept checks
- **Administrator / Accreditor** — read-only ledger viewer; must trust and export evidence

---

## Instructor stories

_To be populated by product-manager-agent after MVP scope approval._

### Assignment configuration

**Shipped 2026-05-10 (feature: teacher-assignment-policy):**

- [x] As an instructor, I can create a new assignment with a title and instructions,
  so that students can be given a structured task.
- [x] As an instructor, I can attach an optional rubric or policy text to the assignment,
  so that I can spell out grading criteria.
- [x] As an instructor, I can define which AI help types are allowed (concept explanation,
  hints, examples, debugging guidance) and whether the AI is restricted from giving the
  final answer, so that my course AI policy is captured in the assignment.
- [x] As an instructor, I can select a verification mode (score / gate / fail-only) for
  each assignment, so that I control how verification affects grading.
- [x] As an instructor, I can update an assignment policy without losing the previous
  version, so that any future appeal can reference the policy in effect at the time of
  the student's interaction.
- [x] As an instructor, I can view the full version history of an assignment policy,
  so that I can confirm changes over time.
- [x] As an instructor, I cannot see or modify another tenant's assignments,
  so that institutional boundaries are preserved.

**Future (not shipped here):**
- [ ] As an instructor, I can review the signed ledger for a student's verification session,
  so that I can defend a grade if it is challenged.

### Submissions (shipped 2026-05-10, feature: student-submission)
- [x] As an instructor, I can see the list of student submissions for one of my assignments.
- [x] As an instructor, I can open a single student submission to read its content.

### Reference-RAG retrieval (shipped 2026-05-11, feature: reference-rag-retrieval)
- [x] As an instructor, when I have authored a reference solution, concept checks
  generated against student submissions probe the keyConcepts and reasoning steps
  I specified — not generic LLM knowledge.
- [x] As an instructor, when I have authored a reference solution, verification
  grading evaluates the student against my expected solution path and uses my
  commonMistakes list to flag misunderstandings.
- [x] As an instructor, when I have NOT authored a reference solution, the system
  still works exactly as it did before — no regression.
- [x] As an instructor, each generated concept-check set and each verification
  attempt records the exact `referenceSolutionId` + `referenceVersion` + `referenceHash`
  in effect at generation/evaluation time, so a future ledger replay can prove which
  instructor truth was used.
- [x] As a student, I cannot access the instructor's reference content directly,
  through any route, regardless of role queries.
- [x] As a student, the system never claims to detect AI use.

### Instructor Solution Guide (shipped 2026-05-11, feature: instructor-reference-rag)
- [x] As an instructor, I can author a reference solution for an assignment (expected
  solution, key concepts, required reasoning steps, common mistakes, correctness criteria,
  optional instructor-only notes).
- [x] As an instructor, editing the reference creates a NEW version. Prior versions remain
  on record so future verification rows can replay against the exact reference truth.
- [x] As an instructor, I can view the version history and inspect any earlier version inline.
- [x] As an instructor, my reference content is never shown to students at the API or UI layer.
- [x] As a student, I cannot fetch or view any reference solution content. Any attempt
  returns 404.

### Evidence export (shipped 2026-05-11, feature: evidence-export)
- [x] As an instructor or TA, I can open a single printable evidence-ready report
  for any student submission in my tenant that summarizes the assignment policy,
  the Instructor Solution Guide, the submission, all concept-check sets, all
  verification attempts, and the hash pins that anchor the record.
- [x] As an instructor, I open `/submissions/[id]/evidence-report`, click `Print
  / Save as PDF`, and get a clean printable report via the browser print dialog
  with chrome (nav, toolbar, back link, print button) hidden.
- [x] As an instructor, the report shows the policy text that was active when
  the student submitted — not whatever is current.
- [x] As an instructor, when a submission has multiple verification attempts I
  see all of them in the report, newest first.
- [x] As a student, the evidence report URL and API return 404; no link to it
  ever appears in student-facing UI.
- [x] As an instructor working in tenant A, I cannot fetch tenant B's evidence
  reports; the API returns 404 (D-019 pattern).
- [x] The report contains no "legally admissible / legal proof / court-ready /
  guaranteed integrity / AI detection" claims; the disclaimer explicitly states
  it is not an AI-detection result, not a final course grade, and not a legal
  determination.

### Review dashboard (shipped 2026-05-11, feature: basic-teacher-review-dashboard)
- [x] As an instructor, I open `/instructor/dashboard` and see at a glance how many
  assignments, submissions, pending concept checks, pending verifications, passes,
  needs-review, and failures exist in my tenant.
- [x] As an instructor, I see a "Needs attention" queue of submissions where I should
  follow up (`submitted_no_checks`, `checks_no_verification`, `needs_review`, `fail`),
  ordered by oldest last-activity first, capped at 50 rows.
- [x] As an instructor, I see the 20 most recent submissions across all my assignments,
  newest first, each linking to the existing review page for that submission.
- [x] As an instructor, I see the 20 most recent verification attempts across all my
  assignments, with provider, model, and reference-pin information surfaced.
- [x] As an instructor on an empty tenant, the dashboard renders with zero counts and
  empty tables — never an error.
- [x] As a student, the dashboard URL is invisible to me; hitting it returns 404 and no
  link to it ever renders in student-facing UI.

### Ledger review (future)
- [ ] As an instructor, I can view the signed ledger for a student's verification session,
  so that I can defend a grade if it is challenged.

_Additional stories to be added._

---

## Student stories

_To be populated._

### Submission (shipped 2026-05-10, feature: student-submission)
- [x] As a student, I can submit text work for an assignment, so that my work is on record.
- [x] As a student, I can see a list of my prior submissions for an assignment.
- [x] As a student, I can view one of my submissions on its own page.
- [x] As a student, I cannot view another student's submission, even in the same tenant.
- [x] When the instructor updates the assignment policy after I submit, my submission keeps
  the policy snapshot that was in effect at the time I submitted.

### Concept check (shipped 2026-05-11, feature: submission-grounded-concept-checks)
- [x] As a student, after I submit my work, I can generate concept-check questions that
  reference what I actually wrote, so I can see whether I can defend my own submission.
- [x] As a student, I can re-generate a new set without losing my previous ones.
- [x] As a student, I cannot generate concept checks against another student's submission.
- [x] Each generated set is pinned to the policy version and the exact submission content
  hash that was in effect when I asked for it; later policy edits don't change my old sets.

### Concept-check answering (shipped 2026-05-11, feature: text-verification-grading)
- [x] As a student, I can answer the generated concept-check questions in text.
- [x] As a student, I can submit my answers and receive a verification signal
  (`pass | needs_review | fail`) plus overall and per-question feedback.
- [x] As a student, I can retry as a NEW attempt without losing prior attempts.
- [x] As a student, my submitted answers remain visible alongside the feedback so I can
  compare my reasoning with the result.
- [x] As an instructor, I can see the student's answers, overall feedback, per-question
  feedback, and verification result for any attempt in my tenant.
- [x] As an instructor, I cannot submit a verification on behalf of a student.
- [x] Verification results are NOT a final grade; they are a signal for instructor review.

_Additional stories to be added._

---

## Administrator / Accreditor stories

_To be populated._

### Ledger export
- [ ] As an administrator, I can export a signed ledger record for a student, so that I can
  provide evidence to an accreditation reviewer or in a grade appeal.

_Additional stories to be added._

---

## Definition of done (applies to all stories)

- Acceptance criteria defined and signed off by product-manager-agent
- qa-security-devops-agent has reviewed the story for FERPA implications
- No C1–C6 violations introduced
