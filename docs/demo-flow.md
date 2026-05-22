# Demo Flow

**Purpose:** Annotated demo script derived from the capability gap analysis. Each scenario
is anchored to a gap where every competitor is None or Weak — making the demo moment
uniquely Acta's.
**Owner:** ux-ui-designer-agent
**Last updated:** 2026-05-05
**Status:** Phase 1 complete — gap-driven demo scenarios defined; screen-level spec pending build

---

## Demo design principle

Every hero moment in the demo must correspond to a gap in the competitor matrix.
If a demo moment could be shown by Nectir, Canvas, or Khanmigo, it is not a hero moment.

The three demo moments no competitor can replicate (per matrix, pending verification):
1. **Submission-grounded concept checks** — checks generated from THIS student's submission
2. **Signed provenance ledger** — tamper-evident record of the full interaction
3. **Grading-mode selector** — the instructor controls what verification means for this assignment

The demo must make these three moments unmistakable.

---

## Narrative arc (10 minutes)

> "You can't prove a student understood something they submitted. Detection guesses.
> Acta knows — and can prove it."

| Minute | Scene | Hero gap shown |
|--------|-------|---------------|
| 0–1 | Problem framing (no product) | — |
| 1–3 | Instructor configures an assignment | Grading-mode selector |
| 3–5 | Student submits and receives concept checks | Submission-grounded checks |
| 5–7 | Grade is contested — instructor opens ledger | Signed provenance ledger |
| 7–9 | Accreditor export | Accreditation-ready export |
| 9–10 | Close | — |

---

## Scene-by-scene script

### Minute 0–1: Problem framing (narration only)

**Narrator says:**
> "Every AI tutor on the market solves the same problem: help students get unstuck.
> Canvas, Khanmigo, Nectir — all of them. Help is solved.
>
> What none of them solve is proof. When a student submits AI-assisted work, nobody
> can tell you whether they understood it. And when a grade is challenged, nobody
> has evidence.
>
> Acta is the proof layer."

**No product on screen yet.**

---

### Minute 1–3: Instructor configures an assignment

**Screen:** Assignment configuration — instructor view
**Hero surface:** The grading-mode selector

**Narrator says:**
> "An instructor is setting up a programming assignment. Before students submit,
> she picks how verification affects the grade."

**Show:** The grading-mode selector with three clearly labeled options:
- **Confidence score** — "I'll see a score. My call what to do with it."
- **Required gate** — "Students must pass the check to receive credit."
- **Fail-only escalation** — "Only triggered if a student's check fails."

**Narrator says:**
> "No other tool gives faculty this control. Every competitor gives you one mode —
> or none."

**Demo action:** Instructor selects "Fail-only escalation" for this assignment.
Instructor saves. Setup takes under 2 minutes.

**Gap shown:** Configurable grading modes — None for all pre-approved competitors.

---

### Minute 3–5: Student submits and receives concept checks

**Screen:** Student view — assignment submission, then concept check prompt
**Hero surface:** Submission-grounded concept checks

**Demo action:** Student submits a programming solution.
Immediately after: concept check appears.

**Narrator says:**
> "Acta reads the student's actual submission and generates questions from it.
> Not generic quiz questions. Not questions from the syllabus.
> Questions from what this student wrote."

**Show on screen:**
- Concept check question 1: [Derived from the student's specific code/approach]
- Concept check question 2: [Testing a concept the student's submission applied]
- Concept check question 3: [Probing a decision the student made in their work]

**Narrator says:**
> "If a student pasted AI-generated code, they still have to explain it.
> In their own words. Right now."

**Gap shown:** Submission-grounded concept checks — None for Nectir; Weak for all pre-approved 5.

---

### Minute 5–7: Grade is contested — instructor opens the ledger

**Screen:** Ledger viewer — instructor view
**Hero surface:** Signed provenance ledger

**Setup:** A student has contested their grade. The instructor opens the ledger.

**Narrator says:**
> "Six weeks later, a student disputes their grade. They claim the concept check
> was unfair. The instructor opens the ledger."

**Show on screen (ledger viewer):**
- Assignment policy (what the instructor configured — time-stamped, signed)
- The student's original submission (hash-linked)
- The exact concept check questions generated (with the prompt that generated them, hashed)
- The student's responses (time-stamped)
- The rubric used for grading (signed)
- The grade output
- A chain integrity indicator: "✓ Ledger intact — no entries modified"

**Narrator says:**
> "Every step is here. Signed. The questions came from the student's own work.
> The responses are the student's own words. Nobody edited anything.
> The ledger proves it."

**Gap shown:** Signed provenance ledger — Weak or None for every competitor.

---

### Minute 7–9: Accreditor export

**Screen:** Export view — admin/accreditor role
**Hero surface:** Accreditation-ready export

**Demo action:** Admin clicks "Export for accreditation review."
A signed, structured document downloads.

**Narrator says:**
> "When your accreditor asks for evidence of student learning verification —
> not a description of your policy, actual evidence — you send them this."

**Show:** The exported document includes: institution name, course, assignment,
student ID, verification interaction record, cryptographic signature, chain-of-custody header.

**Narrator says:**
> "No competitor produces this. Every other tool gives you analytics dashboards.
> Acta gives you a defensible record."

**Gap shown:** Accreditation-ready export — None for Nectir and the pre-approved majority.

---

### Minute 9–10: Close

**Narrator says:**
> "Detection guesses. Detection gets sued. Acta produces evidence.
>
> The ledger doesn't care whether a student used AI.
> It proves whether they understood what they submitted.
>
> That's the difference."

---

## Demo readiness checklist (for ux-ui-designer-agent to verify at Phase 4)

- [ ] Grading-mode selector renders all three modes with clear, distinct labels
- [ ] Assignment configuration completes in under 2 minutes
- [ ] Concept check delivery shows questions that are visibly derived from the submission
      (not generic)
- [ ] Ledger viewer shows full chain: policy → submission → checks → responses → grade
- [ ] Chain integrity indicator is visible and clearly legible
- [ ] Accreditor export produces a downloadable, human-readable document
- [ ] No competitor-replicable moment is presented as a hero moment

---

## Capability gap → demo moment map

| Gap (from matrix) | Demo scene | Competitors with None/Weak |
|------------------|------------|--------------------------|
| Submission-grounded concept checks | Scene 2 (minutes 3–5) | All pre-approved 5 at None or Weak |
| Configurable grading modes | Scene 1 (minutes 1–3) | All pre-approved 5 at None |
| Signed provenance ledger | Scene 3 (minutes 5–7) | All 13 at Weak or None |
| Accreditation-ready export | Scene 4 (minutes 7–9) | Nectir None; 4 of 5 None or Weak |

---

## Deferred demo scenarios (await Q4 resolution)

### Multi-modal oral verification (Q4 dependency)
If Q4 is resolved as browser WebRTC in v1, a fifth demo scene should be added:
a student completing an oral concept check with audio capture.
This gap is total (all 13 competitors at None) and is the strongest visual demo moment,
but cannot be built without Q4 decision.

---

## Open questions for founder

- **Q4:** If oral verification is in v1, it should be the strongest demo moment — a live
  oral check is the most visceral proof that Acta is different. Does this affect the
  priority of Q4?
- **Visual direction:** Demo will be shown to [faculty / provost / investor]?
  The audience affects tone. Provost: emphasize legal defensibility. Faculty: emphasize
  time saved. Investor: emphasize gap uniqueness. Visual direction requires founder approval (Level 3).
- **Demo environment:** Instructor persona for the demo — should this be a specific program
  type (e.g., nursing, CS, law) to make the stakes visceral? Program choice depends on Q2.
