# MVP Scope

**Purpose:** The approved, bounded MVP feature set for Acta verification. Reflects
/select-mvp recommendation of Option A (text-first verification).
**Owner:** product-manager-agent
**Last updated:** 2026-05-10
**Status:** APPROVED 2026-05-10 — Option A is the v1 build target. Founder approval
recorded in docs/decisions.md (MVP-APPROVAL entry).

---

## Pre-condition status

- Q1, Q2, Q3 resolved 2026-05-05 ✓
- Q4 resolved 2026-05-10 (oral deferred) ✓
- docs/research-backed-mvp-options.md complete ✓
- docs/final-mvp-plan.md with scored comparison complete ✓
- Founder option approval — ✓ **APPROVED 2026-05-10**

---

## Approved v1 thesis (founder language — bind to all positioning)

> Acta lets educators allow AI help while requiring students to prove understanding
> through text-first, submission-grounded concept checks, configurable verification
> modes, and a provenance-backed ledger.

---

## Approved scope — Option A (text-only verification)

### In scope (v1 must-ship — founder language)

| # | Feature | C-mapping | Owner agent |
|---|--------|----------|------------|
| 1 | Teacher assignment policy configuration | C6 | ux-ui + frontend + product-manager |
| 2 | Course / assignment grounding | C1 supporting | ai-llm-engineer |
| 3 | Student guided-help experience | C1 | ux-ui + frontend + ai-llm-engineer |
| 4 | Submission-grounded concept checks | C1 | ai-llm-engineer + backend |
| 5 | Three verification modes: score, gate, fail-only | C3 | product-manager + frontend + backend |
| 6 | Required-gate instructor override | C6, EU AI Act D-004 | frontend + backend |
| 7 | Provenance-backed ledger (append-only, hash-chained, signed) | C2 | software-architect + backend |
| 8 | Evidence / export report (signed structured document) | C2 | backend + qa-security |
| 9 | Basic teacher review dashboard | C6 | ux-ui + frontend |
| 10 | Standalone-first architecture (LTI stub only) | — | software-architect |
| 11 | Reserved fields for future oral/WebRTC and LMS expansion | — | software-architect |
| 12 | Multi-tenant isolation (DB row-level) | C5 | software-architect + backend |
| 13 | FERPA-aligned data handling (IDs-only logs; no real data until D-003) | C5 | qa-security + backend |

### Out of scope (v1 — founder-stated exclusions)

- Oral / WebRTC verification (Option B — v2 / post-MVP)
- Zoom / Teams integration (rejected; never)
- Native app (rejected; never)
- Deep LMS integration (Option C — v1.5 / post-MVP)
- Full LTI 1.3 integration (stub-only OK in v1; full integration v1.5)
- AI detection / classifier product (C4 — never)
- Legal admissibility claims (positioning constraint — never use this language)
- Full accreditation automation (basic export only in v1; full automation later)
- Full EU AI Act compliance automation (manual posture in v1; automation later)
- Analytics dashboards beyond basic teacher review (defer to v2)
- Syllabus feedback loop (defer to v2)

---

## Hard constraint compliance

| Constraint | Compliant | Notes |
|------------|-----------|-------|
| C1 — Verification is the wedge | ✓ | All in-scope items serve the verification loop |
| C2 — Signed ledger in v1 | ✓ | Item #3, plus export #6 |
| C3 — All three grading modes | ✓ | Item #2 ships all three |
| C4 — No detection features | ✓ | No classifiers anywhere |
| C5 — FERPA compliance | ⚠ Conditional | Items #9 + #11; gated on D-003 (model DPA) for real data |
| C6 — Minimal instructor burden | ✓ | Item #4 targets < 2 min config; item #10 keeps override one click |

---

## What is NOT in this MVP

See [docs/not-building.md](not-building.md) for the full enumerated list with deferral
rationale and reopen conditions.

---

## Approved positioning language (binding on all agents)

- Use: "audit-ready," "evidence-ready," "provenance-backed," "defensible record."
- Do NOT use: "legally admissible." (D-002 closed.)
- $7/student/month is a SOFT internal cost target only; never appears in external
  pricing or sales material. (D-005 closed.)

---

## Open items remaining

- **D-003** (model provider + FERPA DPA): Critical. Architecture, schemas, prompts, evals
  may proceed using synthetic data only. No real student data until resolved.
- **Q5** (LMS depth): Deferred to v1.5. Stub-only in v1.
- **Q6** (pilot model): Partial — dept chair signs; full pilot structure still open.
- **D-006 remaining**: Visual direction (formal/trustworthy vs. modern/minimal) — open.

---

## Activation status

✓ Scope approved by founder 2026-05-10.
✓ Phase 3 backlog activated in docs/sprint-backlog.md.
✓ software-architect-agent + ai-llm-engineer-agent cleared to begin ledger design.
✗ Real-student-data integration remains gated on D-003.
