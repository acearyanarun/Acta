# Agent Brief — Acta

**Purpose:** Source of truth read by every agent before making any recommendation or producing
any output. Contains company context, hard constraints, open questions, and naming rules.
**Owner:** Founder / chief-of-staff-orchestrator (read-only for all other agents)
**Last updated:** 2026-05-05
**Status:** Active — do not edit without founder approval

---

## Naming convention (non-negotiable)

- The company is **Acta**.
- The product is **the verification layer** or **Acta verification**.
- Do NOT call it a tutor, an AI learning platform, an LMS add-on, or any variation thereof.
- This rule applies to all agent outputs, docs, code comments, UI copy, and external-facing content.

---

## The problem

Universities are running an AI cheating detection arms race they have already lost. Detection
tools are inaccurate enough to be sued over. Bans do not work. Faculty are burning out on
integrity cases instead of teaching. Schools that ban AI graduate students who cannot compete;
schools that allow it graduate students who did not learn. Neither side can prove what the
student actually understood.

---

## The market

**Help is solved. Proof is not.**

- Nectir: raised $12.5M, operates at all 116 California Community Colleges.
- Canvas IgniteAI: ships native to approximately 40% of higher ed.
- OneTutor, Khanmigo, LearnWise, and others: all build course-specific AI tutors that will
  not give answers.

Every major incumbent solves the same problem: AI-assisted tutoring. None treats proof of
learning as a product.

---

## The Acta solution

Acta is the proof layer for AI-era learning. After every submission, the system runs short
concept checks generated from the student's own work — async by default, live oral for
high-stakes assessments.

The instructor picks one of three grading modes per assignment:
1. **Confidence score** — informational, instructor discretion
2. **Required gate** — student must pass to receive credit
3. **Fail-only escalation** — only triggered if the check fails

Every interaction is captured in a cryptographically signed ledger that defends grades on
appeal, supports accreditation review, and replaces detection with evidence.

**Supporting features (exist to give verification context — not the wedge):**
- Course-specific tutor with per-assignment instructor policies and retrieval over course materials
- Coordination layer: deadlines, syllabus navigation, TA flagging, office-hour routing

---

## Why Acta wins — moats

1. A verification methodology that is hard to build well and harder to defend legally.
2. A legally admissible signed ledger no incumbent treats as a product.
3. **Third moat: TBD (Q3 — open, see below).** Do not invent it. Surface candidates with evidence.

---

## Hard constraints (C1–C6)

These are load-bearing. No agent may trade them away. Any proposal violating one is a
Level 3 decision requiring explicit founder approval.

**C1 — Verification is the wedge.**
Any MVP scope that leads with tutoring, positions Acta as "another AI tutor," or de-prioritizes
verification below tutor quality is wrong. The product-manager-agent must reject such proposals.

**C2 — The signed ledger is core to v1, not v2.**
Must be cryptographically signed and designed for legal admissibility (chain of custody,
tamper-evidence, exportable audit trail) from the first MVP build.

**C3 — All three grading modes are part of the product thesis.**
The MVP must support confidence score, required gate, and fail-only escalation — or have an
explicit, founder-approved reason to ship a subset.

**C4 — Acta replaces detection with evidence.**
Agents must NOT propose, design, or build AI cheating-detection features (classifier-based,
perplexity-based, watermark-based, etc.). This is the failed paradigm Acta is positioned against.

**C5 — Student data is FERPA-regulated.**
Student data is also likely subject to state-level AI-in-education laws (CA, NY, TX and others
diverging). All student work must be treated as sensitive PII for prompt design, model routing,
storage, and logging.

**C6 — Faculty time is the scarcest resource.**
Any feature that adds setup burden, grading burden, or appeal-handling burden for the instructor
is a Level 3 decision regardless of its MVP score or user request volume.

---

## Open questions (Q1–Q6)

These are Level 3 decisions the founder has not yet made. Agents must surface them — not resolve them.

**Q1 — Primary buyer / ICP**
Candidate buyers with very different sales motions:
- Individual faculty (bottom-up, fast, low ACV, hard to scale)
- Department chair (mid-motion)
- Provost / VP Academic Affairs (top-down, 12–18 month cycle, high ACV, accreditation lever)
- LMS partnership — Canvas / Blackboard / D2L (indirect, requires their roadmap)
- Accreditation bodies (regulatory pull, very long cycle)

**Q2 — Beachhead segment**
Candidates:
- R1 universities (high integrity stakes, slow procurement)
- Community colleges (Nectir's beachhead — head-to-head risk)
- Online-only programs (highest cheating exposure, most pain)
- Professional graduate programs (MBA, law, nursing — high ACV, high stakes)
- K-12 (different regulatory regime, do not assume in scope without founder approval)

**Q3 — The third moat**
Unresolved. Likely candidates: data flywheel from accumulated verification interactions,
accreditation body relationships, or institutional switching cost. Agents must NOT invent it.
Market-research-agent should surface 2–3 candidates with evidence and ask the founder to choose.

**Q4 — Live oral assessment delivery**
Browser-based WebRTC vs. native app vs. integrated with Zoom/Teams. Major architecture and
procurement implications.

**Q5 — LMS integration depth for v1**
LTI 1.3 (broad, shallow), deep Canvas API integration (narrow, deep), or standalone first.
Affects sales motion and architecture.

**Q6 — Institutional vs. instructor-purchased pilot model**
For the first 3–5 design partners: sold to the institution or sold to individual instructors?
Different go-to-market, contract, and support implications.

---

## Agent reading requirement

Every agent must read this file before making any recommendation, writing any doc, or producing
any output. If any section of this brief conflicts with an instruction in an agent file, the
founder must be asked to resolve the conflict before the agent proceeds.
