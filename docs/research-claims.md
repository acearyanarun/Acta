# Research Claims

**Purpose:** Master claim register. Every factual claim used in product, market, or
competitive analysis must appear here with a source label before it can be used in
decisions or documents.
**Owner:** market-research-agent
**Last updated:** 2026-05-05
**Status:** Phase 1 seeded from S-001 (internal PDF). All claims below are [INTERNAL ASSESSMENT]
until confirmed by primary sources.

---

## Label definitions

| Label | Meaning |
|-------|---------|
| `[VERIFIED]` | Primary source cited and confirmed |
| `[VENDOR CLAIM]` | From vendor marketing — not treated as proven capability |
| `[INTERNAL ASSESSMENT]` | From internal competitive analysis — team judgment, not externally confirmed |
| `[HYPOTHESIS]` | Reasoned inference — not yet confirmed by evidence |
| `[ASSUMPTION]` | Required to proceed — flagged for founder review |

---

## Claims from S-001 — Internal Competitive Analysis PDF

All claims below: **[INTERNAL ASSESSMENT — Source: S-001]**
These are hypotheses to validate with external primary sources. Do not treat as facts.

### Competitor capability ratings

#### CL-001 — Nectir AI: No submission-grounded concept checks
**Claim:** Nectir AI has None capability for submission-grounded concept checks.
**Label:** [INTERNAL ASSESSMENT — S-001]
**Verification priority:** High — this is central to Acta's differentiation claim
**Verification approach:** Review Nectir product docs, request demo, search for customer reviews

#### CL-002 — Canvas IgniteAI: No submission-grounded concept checks
**Claim:** Canvas IgniteAI has Weak capability for submission-grounded concept checks.
**Label:** [INTERNAL ASSESSMENT — S-001]
**Verification priority:** High
**Verification approach:** Review Canvas IgniteAI product documentation and release notes

#### CL-003 — All pre-approved 5 competitors: No multi-modal answer capture
**Claim:** Nectir, Canvas IgniteAI, Khanmigo, OneTutor, and LearnWise all have None
capability for multi-modal answer capture (audio + text).
**Label:** [INTERNAL ASSESSMENT — S-001]
**Verification priority:** High — if any competitor has launched audio capture, Acta's
multi-modal position changes significantly
**Verification approach:** Product docs, recent release notes, app store reviews

#### CL-004 — All 13 competitors: No or Weak configurable grading modes
**Claim:** No competitor in the matrix has Strong or Core configurable grading modes
(score / gate / fail-only). Cognii and Packback are rated Weak; all others None.
**Label:** [INTERNAL ASSESSMENT — S-001]
**Verification priority:** High — this is a core constraint (C3) and product differentiator
**Verification approach:** Direct product evaluation; search for grading integration docs

#### CL-005 — All 13 competitors: Signed provenance ledger at Weak or None
**Claim:** Every competitor is rated Weak (11 of 13) or None (UCSD SLH) for signed
provenance ledger. No competitor treats a cryptographic evidence chain as a product.
**Label:** [INTERNAL ASSESSMENT — S-001]
**Verification priority:** Critical — this is Acta's second moat (C2)
**Verification approach:** Search for competitor transparency/audit features; review any
published data governance documentation

#### CL-006 — All pre-approved 5: No accreditation-ready export
**Claim:** Nectir has None; Canvas IgniteAI, Khanmigo, OneTutor have None or Weak;
LearnWise has Weak for accreditation-ready export.
**Label:** [INTERNAL ASSESSMENT — S-001]
**Verification priority:** Medium — affects accreditation lever in go-to-market
**Verification approach:** Search for competitor accreditation or compliance documentation

#### CL-007 — Nectir AI: Strong on student coordination and multi-LMS neutrality
**Claim:** Nectir is rated Strong for student coordination and multi-LMS neutrality.
**Label:** [INTERNAL ASSESSMENT — S-001]
**Verification priority:** Medium — affects differentiation on non-wedge features
**Verification approach:** Nectir product documentation and case studies

#### CL-008 — Teacher / TA analytics: Strong across all 13 competitors
**Claim:** All 13 competitors are rated Strong or Moderate for teacher/TA analytics.
**Label:** [INTERNAL ASSESSMENT — S-001]
**Interpretation:** Analytics is table stakes. Not a differentiator for Acta.
**Verification priority:** Low

#### CL-009 — Cognii: Strong on submission-grounded concept checks
**Claim:** Cognii is rated Strong for submission-grounded concept checks — the highest
rating among any competitor in the matrix on this capability.
**Label:** [INTERNAL ASSESSMENT — S-001]
**Verification priority:** Critical — if confirmed, Cognii is the closest existing
competitor to Acta's core verification thesis and should be analyzed in depth
**Verification approach:** Cognii product documentation, published research, customer reviews
**Note:** Cognii is in the [PENDING APPROVAL] competitor set — founder must approve including
it in primary research before this claim drives positioning decisions

#### CL-010 — Course-specific RAG: Table stakes among major tutoring platforms
**Claim:** Nectir, Canvas IgniteAI, Khanmigo, OneTutor, LearnWise, IU Syntea, UCSD SLH
all rated Core or Strong for course-specific RAG.
**Label:** [INTERNAL ASSESSMENT — S-001]
**Interpretation:** RAG over course materials is not a differentiator — it is expected
infrastructure. Acta should not lead with this as a capability advantage.
**Verification priority:** Low for differentiation purposes; relevant for build planning

---

### Product claims (Acta internal targets from PDF)

#### CL-011 — Acta target cost: $7/student/month inference ceiling
**Claim:** The cost-aware multi-tier model routing capability is described as keeping
inference costs "under $7/student/month" (Cache → SLM → mid-tier → frontier).
**Label:** [INTERNAL ASSESSMENT — S-001] + [ASSUMPTION — pricing decision not approved]
**Verification priority:** This is an internal engineering target, not a market-validated
price point. Treat as a constraint for AI/LLM architecture planning only.
**Decision flag:** Do not use $7/student/month as a public pricing claim without founder
approval. See docs/decisions.md for pricing decision gate.

#### CL-012 — Acta target: All 14 capabilities rated Core
**Claim:** The internal PDF rates Acta's target product as Core for all 14 capabilities.
**Label:** [INTERNAL ASSESSMENT — S-001]
**Interpretation:** This is the product vision, not the MVP. The product-manager-agent
must determine which subset is feasible for MVP (Phase 2). Not all Core capabilities are v1.

#### CL-013 — Accreditation-ready export references ABET and EU AI Act
**Claim:** The accreditation-ready export capability "why it matters" column cites
"ABET, regional accreditors, EU AI Act evidence."
**Label:** [INTERNAL ASSESSMENT — S-001]
**Verification needed:** EU AI Act obligations for higher-ed AI tools require primary
source verification (see S-012 — PENDING). ABET accreditation evidence requirements
also require primary source verification before using in sales claims.

---

### Market context claims (from agent-brief — pre-established)

#### CL-020 — Nectir raised $12.5M and operates at 116 California Community Colleges
**Label:** [HYPOTHESIS — source not yet confirmed in this research log]
**Verification priority:** High — this is used as a market sizing anchor
**Verification approach:** Crunchbase, press releases, California Community Colleges Chancellor's Office

#### CL-021 — Canvas IgniteAI ships native to approximately 40% of higher ed
**Label:** [HYPOTHESIS — source not yet confirmed in this research log]
**Verification priority:** High — used as market penetration anchor
**Verification approach:** Instructure/Canvas press releases, higher ed market reports

---

## Claims requiring immediate external verification before use in decisions

Priority order for market-research-agent during /research-mvp:

1. CL-009 — Cognii's Strong on concept checks (competitive moat risk)
2. CL-005 — Zero competitors have a real provenance ledger (moat 2 validation)
3. CL-003 — Zero competitors have multi-modal audio capture (moat / Q4 validation)
4. CL-004 — Zero competitors have configurable grading modes (C3 differentiator)
5. CL-020 — Nectir funding and market footprint
6. CL-021 — Canvas penetration figure
