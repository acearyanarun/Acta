# Research-Backed MVP Options

**Purpose:** Capability prioritization from Phase 1 research and three MVP options for
founder selection. Produced by product-manager-agent with chief-of-staff-orchestrator
merge of all Phase 1 agent outputs.
**Owner:** product-manager-agent
**Last updated:** 2026-05-05
**Status:** Phase 1 complete — Q1, Q2, Q3 still open; founder must answer before /select-mvp runs

---

## Chief of Staff merge note

This document merges Phase 1 outputs from: market-research-agent, customer-discovery-agent,
ai-llm-engineer-agent, qa-security-devops-agent, and ux-ui-designer-agent. All source
docs are in `docs/`. All agent-level open questions are surfaced in Section 5 below.

C1–C6 compliance check applied to all options in Section 3. Any option violating a hard
constraint is rejected before the founder sees it.

---

## Section 1: Capability prioritization from Phase 1 research

Capabilities are scored against three criteria: gap size (does any competitor do this?),
verification status (is the gap confirmed?), and v1 feasibility (from ai-llm-engineer-agent).

| Capability | Gap size | Verified? | V1 feasibility | MVP tier |
|-----------|----------|-----------|---------------|---------|
| Submission-grounded concept checks | Total (None/Weak for all pre-approved 5) | [VERIFIED] | V1-Ready | **MVP Core** |
| Signed provenance ledger | Total (Weak/None for all 13) | [VERIFIED] | V1-Ready | **MVP Core** (C2) |
| Configurable grading modes (all 3) | Total for pre-approved 5 | [INTERNAL ASSESSMENT] | V1-Ready | **MVP Core** (C3) |
| Teacher-authored per-assignment policy | Partial gap (competitors Weak/Moderate) | [INTERNAL ASSESSMENT] | V1-Ready | **MVP Core** |
| Accreditation-ready export | Strong (most at None/Weak) | [INTERNAL ASSESSMENT] | V1-Possible | **MVP Core** |
| Multi-modal oral verification (audio) | Total (all 13 None) | [VERIFIED by absence] | V1-Possible (Q4 dep.) | **Conditional** — Q4 |
| Course-specific RAG | No gap (table stakes) | [VERIFIED] | V1-Possible | **Supporting** (context only) |
| Copy-paste resistance | No gap (inherent from checks) | [INTERNAL ASSESSMENT] | V1-Ready (inherent) | **Inherent** |
| Multi-LMS neutrality | Partial gap | [INTERNAL ASSESSMENT] | V1-Possible (Q5 dep.) | **Conditional** — Q5 |
| Cost-aware model routing | Partial gap | [INTERNAL ASSESSMENT] | V1-Possible | **Infrastructure** |
| Teacher/TA analytics | No gap (table stakes) | [INTERNAL ASSESSMENT] | V1-Possible | **Defer to v2** |
| Syllabus feedback loop | Partial gap | [INTERNAL ASSESSMENT] | V1-Hard | **Defer to v2** |
| Student coordination | No gap (solved by incumbents) | [INTERNAL ASSESSMENT] | V1-Hard | **Stub only** |
| Higher-ed CS-grade rigor | Partial gap (context-dependent) | [INTERNAL ASSESSMENT] | V1-Possible | **Context config** |

**MVP Core** = Must be in v1 to deliver the product thesis. Removing any of these
requires an explicit founder waiver and violates one or more of C1–C3.

**Conditional** = Dependent on Q4 or Q5 decisions. Cannot scope until those are answered.

**Defer to v2** = Do not build in v1. Collect data infrastructure from v1 to support v2.

---

## Section 2: Key findings from Phase 1 that constrain MVP options

### Finding 1: The gap is real but the window is closing
Nectir launched quiz generation in February 2026. LearnWise launched AI grading feedback.
The submission-grounded concept check gap is confirmed, but competitors are moving toward
the space. Speed is a strategic input to option selection.
**[VERIFIED — Nectir Feb 2026 product update; LearnWise press release]**

### Finding 2: Cognii is the closest competitor — and may not be in the primary set
Cognii has Strong on open-response assessment. The distinction (submission-grounded vs.
pre-authored questions) is defensible but narrow and technical. If Cognii is approved as
a primary competitor, Acta's differentiation messaging must be very precise.
**[VERIFIED — Cognii product documentation]**

### Finding 3: EU AI Act creates a compliance-driven sales lever
Institutions with EU exposure face an active compliance obligation (Annex III high-risk
classification). Acta's ledger and accreditation export directly address this. This is
a go-to-market angle available right now, not a future opportunity.
**[VERIFIED — EU AI Act Annex III; Digital Education Council]**

### Finding 4: FERPA and legal admissibility are build constraints, not v2 features
Acta cannot process student submissions through any third-party AI model without a signed
FERPA DPA. The qa-security-devops-agent recommends this be resolved before any demo that
shows real student data. The "legally admissible" ledger claim requires legal review.
**[VERIFIED — FERPA; recommendation from qa-security-devops-agent]**

### Finding 5: "Required gate" mode may conflict with EU AI Act human oversight requirement
The EU AI Act requires human oversight of AI-driven educational assessments before they
become final. A hard gate (student cannot receive credit without passing) with no instructor
override path may not satisfy this. This is a C3/C6 tension: adding an override may add
instructor burden (C6); removing the hard gate weakens the thesis (C3). Needs founder input.
**[INTERNAL ASSESSMENT based on EU AI Act Annex III obligations — legal review recommended]**

### Finding 6: Oral verification (audio) is the single largest demo advantage — but depends on Q4
If oral verification is in v1, it is the only capability where Acta has a total gap
advantage (all 13 competitors at None) AND a visceral live demo moment. Q4 decision
directly determines whether this can be in the MVP.

---

## Section 3: MVP options

**Precondition:** Q1, Q2, and Q3 are still Open. The options below are structured to be
robust across different Q1/Q2 answers, but the founder must select an option after answering
those questions. /select-mvp is blocked until Q1, Q2, Q3 are recorded in docs/decisions.md.

---

### Option A — Verification-first, text-only (fastest path to demo-ready)

**Scope:**
- Submission-grounded concept checks (text)
- All three grading modes (score / gate / fail-only)
- Signed provenance ledger
- Instructor configuration UI (assignment policy + grading mode)
- Accreditation-ready export (basic — structured JSON with signatures)
- Course-specific RAG (for check grounding — context infrastructure only)
- Standalone deployment (no LMS integration — LTI stub only)

**Not in this option:**
- Multi-modal audio/oral verification (defer — Q4 dependency)
- Deep LMS integration (defer — Q5 dependency)
- Analytics dashboard (defer to v2)
- Syllabus feedback loop (defer to v2)
- Student coordination beyond basic deadline display (stub only)

**C1–C6 compliance check:**
| Constraint | Status |
|-----------|--------|
| C1 — Verification is the wedge | ✓ PASS — scope is verification-only |
| C2 — Signed ledger in v1 | ✓ PASS |
| C3 — All three grading modes | ✓ PASS |
| C4 — No detection features | ✓ PASS |
| C5 — FERPA addressed | ✓ PASS — requires DPA decision before build |
| C6 — Minimal instructor burden | ✓ PASS — config designed for < 2 min |

**Estimated complexity:** Medium (8–14 weeks to demo-ready)
**Demo strength:** Strong — all three hero moments available (checks, ledger, export)
**Risk:** No oral verification limits the "strongest proof" demo moment.
         Standalone deployment limits early institutional sales.
**Best buyer fit:** Faculty-first pilots (Q1 = faculty or dept. chair); any beachhead
**Worst fit:** Provost/institutional buyer who needs LMS integration before saying yes

---

### Option B — Verification + oral (stronger thesis, Q4 dependency)

**Scope:** Everything in Option A, plus:
- Multi-modal oral verification via browser WebRTC
- Audio transcription + LLM grading of oral response
- Oral mode as a fourth grading configuration (fail-only → live oral escalation)

**Not in this option:**
- Deep LMS integration (defer)
- Analytics (defer)

**C1–C6 compliance check:**
| Constraint | Status |
|-----------|--------|
| C1 — Verification is the wedge | ✓ PASS |
| C2 — Signed ledger in v1 | ✓ PASS — oral session must also be ledger-logged |
| C3 — All three grading modes | ✓ PASS — oral adds a fourth dimension |
| C4 — No detection features | ✓ PASS |
| C5 — FERPA addressed | ⚠️ CONDITIONAL — audio recording of students is PII; requires explicit student consent and clear data handling |
| C6 — Minimal instructor burden | ✓ PASS — oral is student-facing; instructor receives results |

**Estimated complexity:** Large (14–20 weeks to demo-ready)
**Demo strength:** Maximum — live oral demo is the most visceral proof moment; total gap from all 13 competitors
**Risk:** Q4 decision blocks this option entirely. Browser WebRTC has accessibility and
         browser permission complexity. Audio data is PII with FERPA implications.
         Significantly more build time.
**Best buyer fit:** Online-only programs (Q2 = online-only); high-stakes professional grad (nursing, law)
**Worst fit:** Faculty who want optional/async verification only

---

### Option C — Verification + LMS integration (institutional sales motion, Q5 dependency)

**Scope:** Everything in Option A, plus:
- LTI 1.3 integration (works across Canvas, Blackboard, D2L, Moodle)
- Assignment sync from LMS
- Grade passback to LMS gradebook
- Standalone mode remains as fallback

**Not in this option:**
- Oral verification (defer — Q4 dependency)
- Deep Canvas API integration (defer — broader than LTI 1.3)

**C1–C6 compliance check:**
| Constraint | Status |
|-----------|--------|
| C1 — Verification is the wedge | ✓ PASS |
| C2 — Signed ledger in v1 | ✓ PASS |
| C3 — All three grading modes | ✓ PASS |
| C4 — No detection features | ✓ PASS |
| C5 — FERPA addressed | ⚠️ CONDITIONAL — LMS integration surfaces new data flows requiring DPA extension |
| C6 — Minimal instructor burden | ✓ PASS — LMS integration reduces friction |

**Estimated complexity:** Large (16–22 weeks to demo-ready)
**Demo strength:** Strong — LMS integration makes the demo compelling for institutional buyers
**Risk:** LTI 1.3 certification process can be slow (institutions require security review).
         LMS integration opens new FERPA surface areas.
         Q5 must be resolved before this option can be scoped precisely.
**Best buyer fit:** Provost / VP Academic Affairs buyer (Q1 = provost); R1 or large institution beachhead (Q2 = R1)
**Worst fit:** Early faculty-only pilots where LMS access is not needed

---

## Section 4: Recommendation for founder

**Product-manager-agent recommendation (pending founder decision on Q1/Q2/Q3):**

Start with **Option A**. Here is the reasoning:

1. Option A delivers all three unique capabilities (checks, ledger, export) with the
   fastest path to a demo-ready build. Every hero moment is present.
2. Option A is not buyer-dependent — it can be piloted by faculty, dept. chairs, or
   provosts without LMS integration blocking the sale.
3. Option B adds the strongest demo moment (oral) but adds 6–8 weeks and Q4 dependency.
   If Q4 is resolved as browser WebRTC, oral can be added in v1.2 without redesigning the core.
4. Option C adds institutional sales leverage but adds 8–10 weeks and opens significant
   new FERPA surface area. LTI 1.3 is the right v1.5 or v2 investment after the core
   verification loop is proven.

**If the founder resolves Q4 = WebRTC browser before build begins:** Upgrade to Option B.
**If the founder resolves Q1 = provost and Q2 = R1:** Consider Option C alongside Option A.
**In all cases:** Option A's scope is the irreducible minimum for the verification thesis.

---

## Section 5: Open questions for founder (merged from all Phase 1 agents)

### Hard blockers before /select-mvp can run
- **Q1:** Who is the primary buyer? (Determines Option A vs. C emphasis)
- **Q2:** What is the beachhead segment? (Determines demo persona and Option B vs. A)
- **Q3:** What is the third moat? (Affects competitive positioning in all options)

### Hard blockers before build can begin (Phase 3 gates)
- **Q4:** Live oral delivery method? (Determines whether Option B is possible)
- **Q5:** LMS integration depth? (Determines whether Option C replaces or extends Option A)
- **Q6:** Institutional vs. instructor pilot model?
- **Model/provider selection (Level 3):** Cannot process student submissions without DPA
- **Legal admissibility review:** Should "legally admissible" be in positioning before legal opinion?

### Open from market-research-agent
- Expand competitor set to include QuadC, Blackboard, Cognii, Packback, Risely, DRUID,
  IU Syntea, UCSD SLH? (Level 3 — competitor set change)
- Which of the three third-moat candidates (data flywheel / accreditation relationships /
  switching cost) to prioritize?
- Does Nectir's CA Community College dominance rule out that beachhead?

### Open from qa-security-devops-agent
- "Legally admissible" in ledger positioning — legal review before use?
- EU AI Act "required gate" human oversight tension — add instructor override?
- CA, NY, TX state law scoping: approve primary source review scope.

### Open from ai-llm-engineer-agent
- $7/student/month — hard constraint or internal estimate?
- Eval data sourcing approach (no real student PII)?

### Open from ux-ui-designer-agent
- Demo audience (faculty, provost, investor)? Affects tone and hero moment emphasis.
- Demo persona program type? Depends on Q2 (beachhead segment).
- Visual direction? Level 3 decision.
