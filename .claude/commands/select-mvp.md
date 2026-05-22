# /select-mvp

Kicks off Phase 2: MVP scope synthesis and founder approval gate.

---

## Pre-conditions (enforced before running)

This command must not run until:
- Q1 (buyer/ICP) has a founder decision in `docs/decisions.md`
- Q2 (beachhead) has a founder decision in `docs/decisions.md`
- Q3 (third moat) has a founder decision in `docs/decisions.md`
- Phase 1 deliverables exist: `docs/market-research.md`, `docs/customer-discovery.md`,
  `docs/competitor-map.md`, `docs/icp.md`

If any pre-condition is unmet, the chief-of-staff-orchestrator must block and report which
items are missing.

---

## What this command does

1. Activates product-manager-agent to synthesize research into MVP options.
2. product-manager-agent produces `docs/research-backed-mvp-options.md` with 2–3 options,
   each scored against hard constraints C1–C6.
3. chief-of-staff-orchestrator reviews for constraint compliance and presents to founder.
4. Founder selects and approves one option.
5. product-manager-agent produces approved `docs/mvp-scope.md`, `docs/product-requirements.md`,
   `docs/user-stories.md`, and `docs/not-building.md`.

---

## Constraint verification (enforced for every MVP option)

For each option, verify:
- **C1:** Verification is the wedge. Tutoring is not the lead. Reject if violated.
- **C2:** Signed ledger is in v1 scope. Reject if deferred without explicit founder waiver.
- **C3:** All three grading modes included, or founder-approved waiver recorded. Reject otherwise.
- **C4:** No detection-style features in the option. Reject any that appear.
- **C5:** FERPA handling addressed in scope. Flag if absent.
- **C6:** No features adding instructor burden without a Level 3 gate.

Any MVP option that violates C1–C6 without an explicit founder waiver recorded in
`docs/decisions.md` must be rejected — not modified silently.

---

## Phase exit gate

Before `/build-feature` can run:
- Founder has approved exactly one MVP option in `docs/decisions.md`
- `docs/mvp-scope.md` exists and is marked approved
- `docs/not-building.md` exists with explicit deferrals
