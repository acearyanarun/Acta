# Market Research

**Purpose:** Market landscape, competitive gap analysis, regulatory environment, and third-moat
candidates for Acta verification. Produced during /research-mvp Phase 1.
**Owner:** market-research-agent
**Last updated:** 2026-05-05
**Status:** Phase 1 complete — all claims labeled; external verification integrated

---

## Summary

- The "help is solved, proof isn't" thesis holds: every major competitor is tutoring-first,
  and none treats a cryptographic evidence chain as a product. [VERIFIED via product research]
- The submission-grounded concept check gap is real but requires precision: Cognii grades
  open responses to pre-authored questions; that is not the same as generating checks from
  a specific student's submission. The distinction is Acta's defensible position.
- Nectir launched quiz generation in February 2026 — this closes the gap partially on
  "formative assessment" but does NOT touch the submission-grounded or provenance gap.
- The EU AI Act Annex III classifies AI systems that "evaluate learning outcomes" and
  "assess appropriate education levels" as high-risk. Acta's verification features almost
  certainly qualify. This is both a compliance burden and a go-to-market lever.
- The market window is open but competitors are moving. Speed matters.

---

## Market context

### Canvas LMS penetration
Canvas holds approximately 39% of North American higher ed institutions and ~50% share
scaled by enrollment (Spring 2025).
**Label:** [VERIFIED — edutechnica Spring 2025 LMS data; Phil Hill On EdTech]

Canvas IgniteAI (the AI layer on Canvas) is used by 30,000+ educators as of March 2026.
The agent-brief claim "approximately 40% of higher ed" refers to Canvas LMS, not IgniteAI.
IgniteAI's educator count is not equivalent to institutional adoption.
**Label:** [VERIFIED for Canvas LMS share; VENDOR CLAIM for IgniteAI educator count — Instructure press release, March 2026]

### Nectir funding and market footprint
Nectir raised $12.5M led by Rethink Impact (announced March 2026). The company operates
across 116+ California Community Colleges with 2.1 million students, following a 2024–25
pilot with the Chancellor's Office. The pilot is being extended for 2025–26 with tripled
faculty participation.
**Label:** [VERIFIED — Nectir press release March 2026; nectir.io/blog CCC announcement]

**Nectir capability update (February 2026):** Nectir launched an "interactive quiz feature"
that generates multiple-choice, true/false, fill-in-the-blank, and short-answer questions
through the AI assistant. This is formative assessment, not submission-grounded concept
checks. The questions are generated from course materials, not from a specific student's
submission. The S-001 rating of "None" on submission-grounded concept checks is still
directionally correct but should be updated to "Weak" to reflect quiz capability.
**Label:** [VERIFIED — Nectir February 2026 product update blog]

---

## The core thesis: "Help is solved. Proof isn't."

### Evidence FOR the thesis

1. **No competitor has a cryptographic signed provenance ledger as a product.**
   Web search across all pre-approved competitors and the expanded set found zero commercial
   products offering a signed, chain-of-custody, audit-ready evidence trail.
   Academic research exists (blockchain for credentials) but no commercial AI tutor treats
   it as a product surface. [VERIFIED — no primary source found for any competitor]

2. **No competitor has configurable grading modes (score / gate / fail-only) as a product.**
   Cognii has a Weak implementation; Packback has AI-assisted grading suggestions (instructor
   overrides); no competitor has the three-mode control system Acta targets.
   [VERIFIED for absence in pre-approved 5; INTERNAL ASSESSMENT for extended set]

3. **No competitor has multi-modal audio capture for oral verification.**
   All 13 competitors in S-001 rated None. No external source contradicts this.
   [VERIFIED by absence — no product found offering student oral answer capture tied to
   submission-grounded verification]

4. **Submission-grounded concept checks are absent from all pre-approved competitors.**
   Nectir's quiz feature generates questions from course materials — not the student's
   specific submission. Cognii grades answers to pre-authored questions. Neither is
   submission-grounded concept check generation.
   [VERIFIED — Nectir product docs Feb 2026; Cognii product documentation]

### Evidence AGAINST (or complicating) the thesis

1. **Nectir's February 2026 quiz launch shows the space is moving.** The gap on formative
   assessment is narrowing. A well-resourced competitor with 116-campus distribution
   could move toward submission-grounded checks within 12–18 months. [HYPOTHESIS]

2. **LearnWise AI launched an AI Assessment Companion and feedback/grading solution in 2025.**
   Per their press release, an educator-led study showed AI-generated feedback preferred
   84% of the time. This is submission-based feedback, closer to Acta's territory.
   [VENDOR CLAIM — LearnWise press release via Send2Press]

3. **Cognii's open-response assessment is the closest existing analog to Acta's concept
   checks.** If Cognii adds submission-grounding (generating from the submission rather
   than pre-authored questions), they become a direct competitor on the core thesis.
   Cognii has university partnerships (FIU, Cal State East Bay).
   [HYPOTHESIS — based on Cognii product architecture]

4. **Analytics is table stakes.** All competitors are Strong on teacher/TA analytics.
   Acta cannot differentiate on analytics alone.
   [INTERNAL ASSESSMENT — S-001; consistent with general market observation]

---

## Regulatory landscape

### EU AI Act — high-risk classification (significant finding)

AI systems that "evaluate learning outcomes" and "determine or materially influence access
to educational institutions" are classified as high-risk under EU AI Act Annex III.

**Implications for Acta:**
- Acta's concept check grading and grading-mode features almost certainly qualify as
  high-risk AI under Annex III. This triggers: human oversight requirements (teacher
  reviews AI assessment before it becomes final), logging obligations, AI literacy
  requirements for teaching staff, and transparency obligations to students.
- **This is a go-to-market lever:** Acta's signed ledger and accreditation-ready export
  are precisely the infrastructure needed for EU AI Act compliance evidence. Institutions
  with EU exposure (or US institutions with EU partnerships) need this.
- **This is also a compliance cost:** Acta itself must comply with these obligations.
  The qa-security-devops-agent must scope this in the security review.
**Label:** [VERIFIED — EU AI Act Annex III; Digital Education Council analysis; EU AI Act compliance resource euaicompass.com]

### FERPA (US)

FERPA applies to student education records. For Acta:
- Student submissions, concept check responses, scores, and ledger entries are likely
  "education records" under FERPA.
- AI vendors must act as "School Officials" under FERPA — bound by the institution's
  data governance policy, cannot use student records for purposes outside the contract.
- 2025 saw stricter enforcement and new transparency requirements from the DOE.
- FERPA lacks clear cybersecurity standards for vendors — this is an emerging liability area.
**Label:** [VERIFIED — NEA Federal Regulations AI overview; SchoolAI FERPA/COPPA guide; ArentFox Schiff AI blog]

### State-level AI-in-education laws

- **California:** Active regulatory environment. AB 2876 and SB 1047 context noted.
  California Community Colleges Chancellor's Office has a published AI Workplan (July 2025).
  Full scoping of California state obligations is a qa-security-devops-agent deliverable.
  **Label:** [HYPOTHESIS — specific statutes require primary source review; CCC AI Workplan cited as source pending full read]
- **New York:** Active state-level privacy discussion. Specific edtech AI statutes require
  primary source research.
  **Label:** [HYPOTHESIS]
- **Texas:** No specific AI-in-ed statute confirmed in this search pass.
  **Label:** [HYPOTHESIS — requires primary source research]

---

## Third-moat candidates (Q3 — for founder decision, not assertion)

The following are research-supported candidates. None is asserted as the moat. Founder decides.

### Candidate A: Data flywheel from accumulated verification interactions
**Evidence for:** Each concept check + student response + rubric + outcome is a training
signal for better check generation. At scale, Acta's verification data would be unique —
no competitor collects it. The verification interaction dataset (submission → check →
response → grade) does not exist anywhere in the market.
**Evidence against:** Cold-start problem is real. Data flywheel only matters at scale
(likely 100K+ interactions). Early competitors could also start collecting if the market
moves this direction.
**Label:** [HYPOTHESIS]

### Candidate B: Accreditation body relationships
**Evidence for:** The EU AI Act and ABET accreditation documentation requirements create
an institutional need for exactly what Acta's ledger produces. Becoming the standard
evidence format for accreditation review would create regulatory entrenchment.
**Evidence against:** Accreditation body adoption cycles are very long (5–10 years).
No evidence of any vendor successfully making this moat work quickly.
**Label:** [HYPOTHESIS]

### Candidate C: Institutional switching cost via ledger lock-in
**Evidence for:** Once an institution has 2+ years of signed verification ledger data
for grade appeals and accreditation, switching means losing the evidentiary chain.
The ledger creates switching cost that grows with time and usage.
**Evidence against:** Only a moat if the ledger is not portable. If Acta makes the
ledger fully exportable (which is required for legal admissibility), the switching cost
is lower than it would be for a proprietary format.
**Label:** [HYPOTHESIS]

**Note for founder:** These three candidates are not mutually exclusive. Candidate C
depends on Candidate A (data density). Candidate B could accelerate Candidates A and C
if accreditation bodies endorse the format. Market-research-agent recommends surfacing
all three for the founder to rank or combine.

---

## Open questions for founder

- **Q3:** Which third-moat candidate do you want to invest in first? (All three are
  hypotheses requiring validation; they have different go-to-market and product implications.)
- **Q1:** Does the EU AI Act go-to-market angle change your buyer priority? Institutions
  with EU exposure or international partnerships have a stronger compliance pull.
- **Q2:** Does Nectir's CA Community College dominance rule out that beachhead entirely,
  or is there a head-to-head play?
- **[Competitor set]:** Approve or reject the expanded 8-competitor set for primary research.
- **[Cognii]:** Cognii is the closest competitor to Acta's core thesis. Should it be elevated
  to primary research priority regardless of the competitor set decision?
