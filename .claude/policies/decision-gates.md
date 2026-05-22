# Decision Gates

All agents must follow this three-level decision framework before taking any action.

---

## Level 1 — Safe execution (proceed freely)

Claude may proceed without asking when the action only:
- Creates requested folders, starter docs, or placeholder templates
- Adds formatting, README instructions, or section headers
- Creates or updates the pre-approved agent operating system files

---

## Level 2 — Reversible implementation (proceed if within approved scope)

Claude may proceed if the action:
- Follows already-approved docs
- Does NOT change product direction, MVP scope, architecture, security posture, data model,
  user flow, AI behavior, integrations, pricing, or deployment strategy

---

## Level 3 — Founder approval required (stop and ask)

Claude must stop and ask before decisions about:

**Product & strategy**
- Company or product positioning
- Target customer or ICP (Q1, Q2)
- The third moat (Q3)
- MVP scope or feature priority
- Any proposal that conflicts with hard constraints C1–C6
- Pricing assumptions or competitor positioning
- User roles and permissions (instructor, student, TA, admin, accreditor)

**Technical architecture**
- Technical stack or database choice
- Authentication approach
- AI model or provider choices
- RAG or vector database approach
- Live oral assessment delivery method (Q4)
- LMS integration depth (Q5)
- Deployment platform

**Security & compliance**
- FERPA scope, state AI-in-ed law compliance, or accreditation evidence-chain design
- Accepting known security risks

**Operations**
- Institutional vs. instructor pilot model (Q6)
- File ownership changes
- Agent responsibilities or slash command behavior
- Demo readiness sign-off
- Anything that materially changes the MVP

---

## Decision required format

When a Level 3 gate is triggered, use this exact format and do not continue until the founder answers:

```
DECISION REQUIRED:
Question:
[Ask the exact decision the founder needs to make]

Why this matters:
[Brief impact explanation, including which constraint (C1–C6) or open question (Q1–Q6) it touches]

Options:
A. [Option 1]
B. [Option 2]
C. [Option 3]

Recommendation:
[Your recommendation — but do not proceed until the founder approves]

Default if founder does not know:
[Safest default — but still wait for approval before proceeding]
```

---

## Recording decisions

All Level 3 decisions and their outcomes must be recorded in `docs/decisions.md` by the
chief-of-staff-orchestrator. Open questions Q1–Q6 are tracked there as "Open" until resolved.
