# /research-mvp

Kicks off Phase 1: parallel market research, customer discovery, and compliance scoping.

---

## What this command does

1. Activates market-research-agent, customer-discovery-agent, and qa-security-devops-agent
   in parallel.
2. Each agent reads `docs/agent-brief.md` before beginning.
3. Each agent produces its Phase 1 deliverables (see below).
4. chief-of-staff-orchestrator merges outputs and surfaces all open decisions.

---

## Agent assignments

**market-research-agent**
- Produce `docs/market-research.md`, `docs/competitor-map.md`, `docs/source-log.md`,
  `docs/research-claims.md`
- All claims labeled per `.claude/policies/research-quality.md`
- Surface Q3 (third moat) candidates with evidence — do not assert a winner

**customer-discovery-agent**
- Produce `docs/customer-discovery.md`, `docs/icp.md`, `docs/interview-questions.md`,
  `docs/objections.md`
- Map all five buyer types for Q1 — do not default to faculty
- Evaluate all Q2 beachhead candidates — do not default to community college

**qa-security-devops-agent**
- Begin FERPA applicability scoping
- Scope state AI-in-ed laws: CA, NY, TX minimum
- Surface compliance risks in `docs/security-review.md` (Phase 1 section)

---

## chief-of-staff-orchestrator merge

After all three agents deliver:
1. Verify all claims are labeled per research-quality policy.
2. Compile Q1–Q6 status table in `docs/decisions.md` — mark each as Open or Resolved.
3. Surface any C1–C6 violations found in the research phase.
4. Produce a merged summary for the founder.

---

## Acta-specific rule (first run)

On the first run for Acta, the orchestrator must surface Q1–Q6 as open decisions in the
merged output. The workflow must NOT proceed to `/select-mvp` until Q1 (buyer/ICP), Q2
(beachhead), and Q3 (third moat) have founder answers recorded in `docs/decisions.md`.

---

## Phase exit gate

Before `/select-mvp` can run:
- Q1 must have a founder decision recorded in `docs/decisions.md`
- Q2 must have a founder decision recorded in `docs/decisions.md`
- Q3 must have a founder decision recorded in `docs/decisions.md`
- All research claims must be labeled
- No critical compliance blockers outstanding without a founder acknowledgment
