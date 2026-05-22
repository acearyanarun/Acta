# UI Spec

**Purpose:** Per-screen UI specification including layout, components, states, interactions, and copy guidance for Acta verification.
**Owner:** ux-ui-designer-agent
**Last updated:** 2026-05-10
**Status:** Active — Instructor assignment policy screens defined (D-006 visual direction: clean higher-ed SaaS)

---

## Visual direction (D-006)

Clean higher-ed SaaS dashboard. Trustworthy, minimal, professional, evidence-oriented,
department-chair friendly. Avoid playful, futuristic, or chatbot styling.

- Type: system stack (Inter / -apple-system)
- Color: muted navy accent (`#1e3a8a`) on near-white background
- Cards: 1px border, 8px radius, generous whitespace
- Copy tone: calm authority. "Audit-ready," "evidence-ready," "provenance-backed,"
  "defensible record." Never "legally admissible" (D-002).

---

## Personas covered

- **Instructor** — primary interaction surface (this feature)
- **Student** — concept check experience (future)
- **Administrator / Accreditor** — read-only ledger viewer (future)

---

## Hero surfaces

### 1. Grading-mode selector (this feature)
Three discrete options with clear labels and one-line consequences:

- **Confidence score** — "I'll see a score. My call what to do with it."
- **Required gate** — "Students must pass the check to receive credit." *(Includes single-click instructor override)*
- **Fail-only escalation** — "Only triggered if a student's check fails."

Rendered as a radio-card group, not a dropdown. One must be selected to save.

### 2. Ledger viewer (future)
Not in this feature.

### 3. Student guided-help (this feature)
Single hero surface: the chat thread with a persistent policy banner at the top.
The banner is binding visual context — it is never hidden, even when scrolled.

---

## Screens (this feature)

### Screen 1 — Instructor assignments list
- Route: `/instructor`
- Persona: Instructor
- Layout: page heading + "New assignment" CTA + list of cards
- Each card shows: title, current version number, verification mode tag, last updated
- Empty state: "No assignments yet. Create your first one."
- Clicking a card navigates to `/instructor/[id]`

### Screen 2 — New assignment policy
- Route: `/instructor/new`
- Persona: Instructor
- Layout: single-column form, sectioned cards:
  1. **Basics** — title (required), instructions (required, multiline)
  2. **Rubric** — optional multiline text
  3. **AI help policy** — five toggles (concept explanation, hints, examples, debugging guidance, restrict final answer). Restrict-final-answer is visually distinct (emphasized as a hard rule per D-021)
  4. **Verification mode** — radio-card group (3 options)
- Footer: Cancel + Save buttons
- On save: POST → redirect to `/instructor/[id]`
- Validation errors render inline per field; first error scrolls into view

### Screen 3 — Assignment policy view
- Route: `/instructor/[id]`
- Persona: Instructor
- Layout: title + version badge ("v3 current") + sections rendering the current policy
- Top-right: "Edit policy" button → `/instructor/[id]/edit`
- Below current policy: "Version history" disclosure listing prior versions (version number + createdAt). Each is link-able to `?version=N`
- When `?version=N` ≠ current: banner "Viewing historical version N. This is no longer the active policy." with link back to current

### Screen 4 — Edit assignment policy
- Route: `/instructor/[id]/edit`
- Persona: Instructor
- Layout: same form as Screen 2, pre-filled from current version
- On save: PUT → redirect to `/instructor/[id]` with new current version
- Copy near save button: "Saving creates a new policy version. Previous versions remain on record."

---

## Components

- `AssignmentForm` — shared by Screen 2 and Screen 4
- `VerificationModeSelector` — radio-card group, hero surface
- `AiHelpPolicy` — 5 checkbox toggles with helper text per toggle
- `VersionBadge` — "v{n} current" / "v{n} archived"

---

## Copy guidance (binding per D-002)

- **Use:** "audit-ready," "evidence-ready," "provenance-backed," "defensible record," "policy version on record"
- **Do NOT use:** "legally admissible," any legal-conclusion phrasing

---

## Edge cases

- Title or instructions blank → inline validation, save disabled
- Network failure on save → toast with retry; form state preserved
- Cross-tenant URL guess (e.g., another tenant's `/instructor/[id]`) → 404 page
- Viewing a version that doesn't exist → 404 page

---

## Screens (student-guided-help feature)

### Screen 5 — Student assignment list
- Route: `/student`
- Persona: Student
- Layout: list of assignment cards for the demo tenant (no instructor filter)
- Each card shows: title, verification mode tag, "Get help" CTA
- Empty state: "No assignments available for your tenant yet."

### Screen 6 — Student guided-help chat
- Route: `/student/[id]`
- Persona: Student
- Layout (top to bottom):
  1. **Assignment header** — title + current version badge + small "Provenance: v{n} · {policyVersionId short}"
  2. **Policy banner (always visible)** — lists each AI help type as "allowed" or "not allowed". `restrictFinalAnswer` rendered as "Enabled" with a separate "Hard rule" badge (per the formatting fix)
  3. **Help-type picker chips** — Hint, Explanation, Example, Debugging, General. Disallowed types render disabled with tooltip "Disabled by instructor policy."
  4. **Chat thread** — alternating student / assistant bubbles. Refused/redirected assistant responses get a small inline tag ("Refused" / "Redirected") + `outcomeReason` shown below the message.
  5. **Input row** — textarea + Send button. Send disabled while pending.
- **Drift banner (amber)** — appears if `policyVersionId` in a server response differs from the pinned first-response value. Copy: "The instructor updated the assignment policy mid-conversation. The current policy version is v{n}. All future replies follow the new policy."

### Components
- `HelpChat` — owns the conversation state and posts to `/v1/assignments/:id/help`
- `HelpRequestTypePicker` — chips with disabled state derived from policy
- `PolicyBanner` — shows allowed/not-allowed and Hard rule badge

### Copy guidance (additional, binding per D-002)
- Use: "policy", "guidance", "hint", "concept explanation", "redirected"
- Do NOT use: "legally admissible", "AI detection", "cheating detection"

---

## Screens (submission-grounded-concept-checks feature)

### Screen 10 — Concept-check section on `/submissions/[id]` (additive)
- Inserts a new "Concept checks" card between "Submitted content" and "Provenance".
- **Student owner view:**
  - Numeric input bound 1..8, default 4
  - "Generate concept checks" button (primary)
  - Below the controls, list of prior sets (newest first)
- **Instructor view (same page, instructor role):**
  - No controls
  - List of prior sets (newest first)
- Each set card shows: provider tag (`stub` / `anthropic`), generatedAt + question count,
  policy version pin (`v{n} · {hashShort}`), optional model name.
- Questions render as a numbered list (`<ol>`); each question's `conceptTag` shows as a
  small muted label below the prompt when present.
- No answer inputs. No scoring UI. No grading UI.

### Edge cases
- Empty state: "No concept checks generated yet for this submission."
- Generate failure: inline `.form-error` with the API error message; the button re-enables.
- Cross-tenant or non-owner: handled at the route layer (404). The viewer page already
  renders a generic "Submission not found" page in those cases.

---

## Screens (text-verification-grading feature)

### Screen 11 — Verification UI inside each concept-check set card on `/submissions/[id]`
**Student-owner view (`?role=student`):**
- Each set card shows the existing question list, a divider, then a "Verification attempts" section.
- Prior attempts list (newest first). Each attempt card has:
  - A coloured result badge: green `Pass` / amber `Needs review` / red `Fail`.
  - A 1–3 sentence `overallFeedback`.
  - A numbered list of questions with status pills (`Sufficient` / `Partial` / `Insufficient`) and 1–2 sentence per-question feedback.
- Below the attempts list, a `VerificationForm`:
  - One textarea per question (1..5000 chars).
  - "Submit verification" button (disabled until every question has a non-empty answer).
  - On success, the new attempt prepends to the list. The student's typed answers REMAIN visible (D-013) so they can compare with the feedback.
  - Retry = a new attempt (no edit-in-place; matches D-033).

**Instructor view (`?role=instructor`):**
- Same attempts list, but each attempt card ALSO renders the student's `answers[i].answer` in a `<pre className="prewrap">` above each per-question feedback row.
- No textareas. No submit button.

### Empty / edge states
- "No verification attempts yet. Answer the questions below to submit one." (student)
- "Student has not submitted answers for this set yet." (instructor)

### Copy guidance (additional, binding per D-002)
- Result labels: "Pass", "Needs review", "Fail" — NEVER "graded", "scored", "final grade".
- Section title: "Verification attempts" — NEVER "Grades".
- Do not surface raw provider/model fields prominently; render them in the muted attempt metadata strip only.

---

## Screens (instructor-reference-rag feature)

### Screen 12 — Instructor Solution Guide section on `/instructor/[id]` (additive)
- Inserts a new "Instructor Solution Guide" card below "Student submissions".
- The section is **instructor-only** by route + render path. No student-facing page imports or links to it.
- **Empty state** (no version yet):
  - Subtitle: "Trusted evaluation context for this assignment. Students never see this content."
  - "Create reference solution" CTA reveals the form.
- **Form fields** (used for both create and edit):
  - Expected solution (textarea, ≤ 50,000 chars; required)
  - Key concepts (textarea, one entry per line; ≤ 50 entries × ≤ 200 chars)
  - Required reasoning steps (textarea, one per line; ≤ 50 × ≤ 400 chars)
  - Common mistakes (textarea, one per line; ≤ 50 × ≤ 400 chars)
  - Correctness criteria (textarea, ≤ 10,000 chars; required)
  - Optional notes (textarea, ≤ 10,000 chars; nullable; labeled "instructor-only")
- **Submit copy:** "Save new version" — the form note explicitly says editing creates a new version.
- **Display when a version exists:**
  - Header strip with version badge (`v{n} current` / `v{n} archived`), `referenceHash` short (8 chars), `createdAt`, "Edit (creates new version)" button.
  - Each field rendered as a labeled section. Text fields use `<pre className="prewrap">`; list fields render as `<ol>` so the visible order matches the stored (and hashed) order.
- **Version history** disclosure: list of all versions newest-first. Clicking a prior version swaps the inline view. A "View current" button restores the current view.

### Copy
- Use: "Instructor Solution Guide", "reference solution", "evaluation reference", "trusted evaluation context".
- Do NOT use: "answer key" (sounds misuse-prone for students).

### Edge cases
- Cross-tenant or student access: handled at the route layer (404). The frontend never displays the section to a student because no student-facing page imports it.
- POST 400 validation: inline `.form-error`; the button re-enables; the user's draft is preserved.
- Race: if an instructor opens the form, leaves it for a long time, and another instructor saves a new version meanwhile, this user's "Save new version" still produces a new immutable row at `version+1`. No locking; both authors' versions are preserved on record.

---

## Screens (student-submission feature)

### Screen 7 — Student submission (addition to `/student/[id]`)
- **Submit your work** section:
  - textarea (1..200,000 chars), Submit button
  - on success → row added to "My submissions" list; textarea cleared
- **My submissions** list (newest first):
  - row shows submitted-at, policy pin (`v{n} · {hash short}`), short content snippet, "View" link → `/submissions/[id]`
- Existing guided-help chat section remains untouched

### Screen 8 — Instructor submissions list (addition to `/instructor/[id]`)
- **Student submissions** section below the policy view
- Table-style list per row: studentId · submittedAt · policy pin · "View" link → `/submissions/[id]`
- Empty state: "No submissions yet."

### Screen 9 — Single submission viewer (new route `/submissions/[id]`)
- Header: assignment title (link back to `/instructor/[assignmentId]` or `/student/[assignmentId]` based on context)
- Sub-line: submitter studentId · submittedAt · policy pin (`v{n} · {hash short}`)
- Content rendered in `<pre className="prewrap">` (no markdown rendering)
- Footer: full `submissionId`, `contentHash`, `policyVersionId`, `policyHash` (small, monospace — provenance card)
- Behavior: cross-tenant or unauthorized → 404 page; student trying to view another student's submission → 404 page

---

## Demo-flow polish (instructor-student-demo-flow-polish, 2026-05-11)

### Top nav
- New `<TopNav>` client component renders the active link with bold + underline (`top-nav__link--active`) so users always know which workspace they're in.
- "Acta" brand has a small "verification layer" subline.

### Home page (`/`)
- One-sentence positioning headline + sub-paragraph.
- Numbered "Demo path" strip (5 steps) below the headline.
- Three cards: **Instructor demo**, **Student demo**, **Ledger placeholder**.
- No "Foundation" / "Not implemented yet" copy.

### Workspace badges (binding pattern)
- Instructor pages: `<span class="workspace-badge workspace-badge--instructor">Instructor Workspace</span>` near the top.
- Student pages: `<span class="workspace-badge workspace-badge--student">Student Workspace</span>`.
- Submission viewer: `Submission Review · Instructor View` or `… · Student View`.

### Section order — `/instructor/[id]`
1. Instructions
2. Rubric (if present)
3. AI help policy
4. Verification mode
5. Instructor Solution Guide
6. Student submissions
7. Policy provenance
8. Version history (only when `> 1` version exists)

Each section opens with a one-line `.section-helper` caption explaining what it proves.

### Section order — `/student/[id]`
1. Instructions
2. Rubric (if present)
3. **AI help rules** (extracted `<PolicyBanner>` shown as its own card so the student sees the rules before opening the chat)
4. Ask for guidance (chat — still renders the policy banner inside it for the moment of use)
5. Submit your work
6. My submissions

Page subtitle: "Use AI for guided support, then submit your own work and prove understanding."

### Section order — `/submissions/[id]`
- Heading: "Your Submission Review" (student) / "Student Submission Review" (instructor).
- Subline tag: "Student View" / "Instructor View — read-only review".
- Sections: Submitted content → Concept checks (incl. verification attempts) → Provenance.
- Helper copy explicitly states the verification result is a "signal for instructor review — not a final grade".

### Instructor-only reference-pin indicator (D-041 surfaced)
- On concept-check set cards: `<span class="placeholder-tag reference-pin-tag">Generated with Instructor Solution Guide v{n}</span>` rendered when `viewerRole === "instructor"` AND `set.referenceVersion != null`.
- On verification attempt cards: same pattern via the `showReferencePin` prop, controlled by the parent (`<ConceptCheckSetCard>`), only true in instructor mode.
- The tag NEVER renders for students. It shows only the integer version number; the short hash is in the tooltip. **Raw reference content is NEVER exposed.**

### Ledger page (`/ledger`)
- New copy: "The provenance ledger is planned next. Current records are already hash-pinned for future evidence."
- New "Hash-pinned today" card listing the existing anchors: `policyHash`, `contentHash`, `referenceHash`, concept-check policy + reference pins, verification policy + reference pins.

### Empty states (binding)
- `/instructor` empty: "No assignments yet. Create your first assignment policy to start the demo." + CTA.
- `/student` empty: "No assignments available yet. Switch to Instructor Workspace to create one for the demo."
- `SubmissionList` instructor empty: "No student submissions yet. Switch to Student Workspace to submit demo work."
- `SubmissionList` student empty: "You haven't submitted work for this assignment yet."
- `ConceptCheckDisplay` empty: role-aware ("Generate concept checks against your submission…" vs. "The student will generate them from their submission.").
- `ReferenceSolutionSection` empty: "Add the expected solution path so Acta can evaluate against instructor intent."

### Global usability principles (adopted 2026-05-11 /run-usability-testing-pass)
- **Progressive disclosure**: long-form content (raw instructions, rubric, AI help policy details, Instructor Solution Guide bodies, raw submission content, provenance/hash fields, version history, recent-tables) lives inside native `<details class="disclosure">` blocks, collapsed by default. The first-most-relevant section per page may be `open` by default.
- **One obvious next action per page**: where a primary task exists, a `.primary-action-card` (accent border + accent-soft background) sits above the fold with a single CTA. On `/submissions/[id]?role=student` the CTA toggles between `Generate concept checks` and `Answer concept checks below` based on `sets.length`. On `?role=instructor` the CTA is always `Open evidence report`.
- **Step numbering** for linear flows: `/student/[id]` renders Step 1 → Step 4 with `.step-header` cards containing a `.step-header__num` accent circle.
- **Task checklist** for status-driven pages: `/instructor/[id]` opens with a `.task-card` (Policy / Solution Guide / Submissions count) so the instructor sees state at a glance.
- **Short labels everywhere**: dashboard summary cards use `Pending checks` / `Passed` / `Failed` (not `Passed verification` / `Failed verification`). Helper paragraphs trimmed across all pages.
- **Print fidelity**: `@media print { details > *:not(summary) { display: block !important; }}` forces every collapsible body to render in the printed evidence report.

### Evidence report page (`/submissions/[id]/evidence-report`)
- Instructor-only printable page. Route is unguarded on the client; access is gated by the API returning 404 for non-instructor or cross-tenant requests. On 404 the page renders an empty "Evidence report not available" state instead of report content.
- Top toolbar (`.evidence-toolbar`) contains: `← Back to submission review` (links to `/submissions/[id]?role=instructor`) and a primary `Print / Save as PDF` button (`window.print()`). Both are hidden under `@media print`.
- Eight sections rendered in order, each as `.evidence-section`:
  1. **Header card** — `Instructor Workspace` badge · H1 `Evidence-ready report` · short scope disclaimer `Verification signal for instructor review. Not a final course grade.` · key/value grid: Assignment, Student ID, Submission ID, Generated at.
  2. **Assignment policy snapshot** — policyVersionId, policyVersion, policyHash, verification mode, AI help rules list, instructions, rubric (if present).
  3. **Instructor Solution Guide snapshot** — when present, all reference fields including raw `expectedSolution`, `keyConcepts`, `requiredReasoningSteps`, `commonMistakes`, `correctnessCriteria`, optional notes. Empty state: `No Instructor Solution Guide on file for this assignment.` Instructor-only page; this content is never exposed to students.
  4. **Student submission** — `submittedAt`, `contentHash`, full submission content in `<pre class="prewrap">`.
  5. **Concept checks** — one `.evidence-card` per set, newest-first. Each shows id (short), `generated`, provider, model (if any), reference-pin tag (when `referenceVersion != null`), and the question list with `conceptTag` annotation. Empty state: `No concept checks generated yet.`
  6. **Verification attempts** — one `.evidence-card` per attempt, newest-first. ALL attempts included. Each shows id (short), result pill (reuses existing `.verification-status--{sufficient,partial,insufficient}`), `evaluated`, provider/model, reference-pin tag (when present), `Overall feedback`, then per-question feedback (question prompt → student answer → status pill → feedback). Empty state: `No verification attempt yet.`
  7. **Provenance / hash summary** — key/value grid for `policyHash`, `referenceHash` (current), `contentHash`, latest concept-check reference pin, latest verification reference pin. Null values render as `—`.
  8. **Disclaimer** — exact long disclaimer: `This report is an evidence-ready instructional review artifact. It records assignment policy, reference context, student submission, concept checks, verification answers, and hash pins. It is not an AI-detection result, not a final course grade, and not a legal determination.`
- Print styles (`@media print`): hide `.top-nav`, `.evidence-toolbar`, `.back-link`, `.back-row`, all `button`. White background, max-width removed, `code` forced to `#000`, every `.evidence-section` / `.evidence-card` gets a thin grey border with `break-inside: avoid` for clean page breaks.
- Approved entry points:
  - `/submissions/[id]?role=instructor` — secondary back-row link `→ Open evidence report` (only when `role === "instructor"`).
  - `/instructor/dashboard`:
    - Recent verifications table action cell — always shows `Review submission · Evidence report` (every row already has a verification attempt).
    - Needs attention table action cell — shows `Evidence report` only when `latestVerificationResult != null` (which corresponds to `needs_review` and `fail` rows; never `submitted_no_checks` or `checks_no_verification`).
    - Recent submissions table action cell — shows `Evidence report` only when that submission appears in `recentVerifications` (i.e., has at least one verification attempt).
- Never linked from `/student`, `/student/[id]`, the student view of `/submissions/[id]`, or the top nav. Banned-language guard applies (no "legally admissible / legal proof / court-ready / guaranteed integrity / AI detection" introduced).

### Teacher Review Dashboard (`/instructor/dashboard`)
- Entry: secondary CTA `Review dashboard` on `/instructor` header (left of `Create assignment policy`), AND a secondary back-row link `→ Open Review Dashboard` on every `/instructor/[id]` page.
- Back link to `/instructor`: `← Back to Instructor Workspace`.
- Header: `Instructor Workspace` workspace badge, H1 `Teacher Review Dashboard`, sub `Review student submissions, verification outcomes, and follow-up needs across assignments.`
- Section 1 — Summary cards (`.dashboard-cards` grid, 7 cards): Total assignments · Total submissions · Pending concept checks · Pending verification · Passed verification · Needs review · Failed verification. Big number on top, label below.
- Section 2 — Needs attention table. Columns: Assignment · Student (short id, full in title attr) · Status pill · Latest result pill (or `—`) · Submitted · Last activity · `Review submission` link.
- Section 3 — Recent submissions table (≤20, newest first). Columns: Assignment · Student · Submitted · Policy (`vN · <shorthash>…`) · Reference Guide (`vN · <shorthash>` or `—`) · `Review submission` link.
- Section 4 — Recent verification attempts table (≤20, newest first). Columns: Assignment · Student · Result pill · Evaluated · Provider (+ model) · Reference Guide · `Review submission` link.
- Status / result pill mapping (binds existing CSS):
  - `pass` → `.verification-status--sufficient` (green)
  - `needs_review` → `.verification-status--partial` (amber)
  - `fail` → `.verification-status--insufficient` (red)
  - `submitted_no_checks` → `.dashboard-pill--neutral`
  - `checks_no_verification` → `.dashboard-pill--info`
- Empty states (binding):
  - Needs attention: `No follow-up needed right now.`
  - Recent submissions: `No student submissions yet. Switch to Student Workspace to submit demo work.`
  - Recent verifications: `No verification attempts yet. Generate concept checks and submit verification from the student view.`
- All `Review submission` links target `/submissions/<id>?role=instructor` so the existing instructor review view opens with the right role.
- Dashboard is instructor-only. Student auth returns 404; no UI exposure on `/student` or top nav.

### Button label catalogue (binding)
- Create assignment policy
- Add Instructor Solution Guide
- Edit Guide (creates new version)
- Save new version
- Submit my work
- View submission
- Generate concept checks
- Submit verification
- ← Back to Instructor Workspace
- ← Back to Student Workspace
- ← Back to instructor assignment (from submission detail)
- ← Back to student assignment (from submission detail)
- ← Back to current (from historical policy version)
