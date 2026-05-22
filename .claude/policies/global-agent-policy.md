# Global Agent Policy

All agents operating in this system must follow every rule in this file without exception.
Role-specific details live in each agent's own file; this file governs shared behavior.

---

## Identity and naming

- The company is **Acta**.
- The product is **the verification layer** or **Acta verification**.
- Do NOT call it a tutor, an AI learning platform, an LMS add-on, or any other framing.
- This naming rule is non-negotiable and must not drift across any output, doc, or recommendation.

---

## Pre-flight requirement

Every agent must read `docs/agent-brief.md` before making any recommendation, writing any doc,
or producing any output. The brief is the source of truth for company context, hard constraints
(C1–C6), open questions (Q1–Q6), and naming conventions.

---

## Behavioral rules

- Stay within your assigned role. Do not perform work owned by another agent.
- Respect file ownership rules defined in `.claude/policies/file-ownership.md`.
- Separate facts, assumptions, hypotheses, and recommendations in all outputs. Label each clearly.
- Keep outputs concise, specific, and actionable. Avoid padding.
- Do not overbuild. Optimize for a research-backed, demo-ready MVP.
- Do not mark work complete if critical blockers remain.
- Do not invent customer quotes, market facts, competitor capabilities, pricing, or technical constraints.

---

## Hard constraint enforcement (C1–C6)

Full text of C1–C6 is in `docs/agent-brief.md`. Summary for quick reference:

- **C1** — The wedge is verification. Do not lead with tutoring. Reject scope that demotes verification.
- **C2** — The signed ledger is a v1 requirement. Not a v2 feature.
- **C3** — All three grading modes must be in MVP or have explicit founder-approved justification to defer.
- **C4** — Do NOT propose, design, or build AI cheating-detection features. This is the failed paradigm.
- **C5** — Student data is FERPA-regulated. Treat all student work as sensitive PII.
- **C6** — Faculty time is the scarcest resource. Any feature adding instructor burden is a Level 3 decision.

Any proposal that violates C1–C6 must be flagged as a **Level 3 decision** immediately.
Do not silently accommodate constraint violations.

---

## Open question handling (Q1–Q6)

Full text of Q1–Q6 is in `docs/agent-brief.md`. When your work encounters any of them:

- Surface the open question explicitly in an **"Open questions for founder"** section.
- Do NOT pick a default and continue.
- Do NOT resolve them by assumption.
- List which of Q1–Q6 you encountered and why it matters for your deliverable.

---

## Decision gate compliance

Follow the three-level decision gate defined in `.claude/policies/decision-gates.md`.

- Level 1: proceed freely.
- Level 2: proceed if within approved docs and scope.
- Level 3: stop and ask the founder before continuing.

---

## Absolute prohibitions

- Never propose detection-style features (classifier, perplexity, watermark — C4 violation).
- Never silently change product direction, MVP scope, architecture, security posture, AI behavior, or file ownership.
- Never invent the third moat. Surface candidates with evidence; let the founder choose.
- Never default to "faculty" as ICP without surfacing Q1 and Q2 tradeoffs.
- Never overbuild. Three lines is better than a premature abstraction.
