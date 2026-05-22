# Customer Discovery

**Purpose:** Buyer landscape, pain segmentation, and beachhead candidate analysis for Acta
verification, informed by the competitive gap analysis from the feature matrix.
**Owner:** customer-discovery-agent
**Last updated:** 2026-05-05
**Status:** Phase 1 complete — gaps from matrix converted to buyer pain map; Q1 and Q2 open

---

## Pre-condition note

Q1 (buyer) and Q2 (beachhead) are not resolved here. This document surfaces evidence and
tradeoffs. The founder decides.

---

## Capability gaps mapped to buyer pain

The feature matrix reveals three clusters of gaps that map to distinct buyer pain:

### Gap cluster 1 — Verification and evidence (submission-grounded checks, signed ledger, accreditation export)
**Who feels this pain most acutely:**
- **Provost / VP Academic Affairs:** Responsible for institutional integrity posture,
  accreditation compliance, and legal exposure from grade disputes. The signed ledger
  and accreditation-ready export map directly to their liability surface.
- **General Counsel / Academic Affairs:** Grade appeals that cannot be defended with
  evidence are institutional liability. No current tool produces a defensible record.
- **Dept. chairs in high-stakes programs:** Nursing, law, engineering — where grade
  disputes are costly and integrity is professionally regulated.
**Pain intensity:** High for institutional buyers; Medium for individual faculty
**Buying authority:** Provost / VP level for institutional purchase; dept. chair for dept-level

### Gap cluster 2 — Configurable grading modes (score / gate / fail-only)
**Who feels this pain:**
- **Individual faculty** who want to control how AI verification affects their grading
  without committing to a single institutional policy.
- **Dept. chairs** trying to implement consistent integrity policy across varied faculty
  preferences.
**Pain intensity:** High for faculty who have tried one-size-fits-all tools and found them
too rigid or too lenient
**Buying authority:** Faculty (bottom-up, assignment-level); dept. chair (policy-level)

### Gap cluster 3 — Multi-modal oral verification
**Who feels this pain:**
- **Faculty in high-stakes programs** who want live oral assessment for finals or
  major projects but lack infrastructure.
- **Online-only programs** where in-person oral exams are impossible and the integrity
  problem is most acute.
**Pain intensity:** High for programs that already conduct oral defenses; untested elsewhere
**Buying authority:** Faculty + IT (Q4 dependency — delivery method determines procurement)

---

## Buyer map (Q1 — all candidates, no selection)

### Candidate 1: Individual faculty (bottom-up)
- **Sales motion:** Direct outreach, product-led, no procurement cycle
- **ACV estimate:** $200–$2,000/year per faculty [ASSUMPTION — not market-validated]
- **Cycle:** Days to weeks
- **Pain profile:** Integrity case workload, lack of evidence for grade appeals,
  detection tool frustration (lawsuits, false positives)
- **Capability gaps that resonate:** Submission-grounded checks (saves time), configurable
  modes (control without burden), signed ledger (grade defense)
- **Risk:** Low ACV, hard to scale, no institutional contract protection, loses access
  if faculty leave or institution blocks
- **Acta fit:** Strong on pain; weak on scale. Good for early design partners.

### Candidate 2: Department chair (mid-motion)
- **Sales motion:** 2–4 month cycle, dean approval often needed, policy motivation
- **ACV estimate:** $10,000–$50,000/year per department [ASSUMPTION]
- **Cycle:** 2–6 months
- **Pain profile:** Consistency across faculty, accreditation audit prep, liability exposure
- **Capability gaps that resonate:** Accreditation-ready export (direct audit prep value),
  configurable modes (policy flexibility), signed ledger (appeals defense)
- **Risk:** Requires political alignment with faculty; faculty adoption not guaranteed
- **Acta fit:** Good for beachhead in high-stakes depts (nursing, law, CS)

### Candidate 3: Provost / VP Academic Affairs (top-down)
- **Sales motion:** 12–18 month procurement cycle, IT and legal review, board-level
  visibility for large institutions
- **ACV estimate:** $100,000–$500,000+/year institutional [ASSUMPTION]
- **Cycle:** 12–24 months
- **Pain profile:** Institutional legal liability from AI detection lawsuits, accreditation
  review pressure, faculty burnout at scale, reputation risk
- **Capability gaps that resonate:** Signed ledger (legal admissibility replaces detection),
  accreditation-ready export (direct regulatory evidence), EU AI Act compliance
- **Risk:** Very long cycle, many stakeholders, IT security review is a gate
- **Acta fit:** Highest ACV but slowest path. Best for year 2+.

### Candidate 4: LMS partnership (Canvas / Blackboard / D2L)
- **Sales motion:** Partnership / OEM, requires their product roadmap alignment
- **ACV estimate:** Revenue share model; Instructure sets terms [ASSUMPTION]
- **Cycle:** 6–18 months to partnership agreement
- **Pain profile:** Canvas IgniteAI has no verification layer; Instructure is actively
  building out AI features. Canvas is in 39–50% of institutions.
- **Capability gaps that resonate:** Signed ledger + accreditation export as a Canvas
  add-on would give Instructure a defensibility story they currently lack
- **Risk:** Requires their partnership priorities to align. Can be acqui-hired or
  shut out if Canvas builds it internally.
- **Acta fit:** Highest leverage if it works; highest dependency risk.

### Candidate 5: Accreditation bodies
- **Sales motion:** Regulatory pull — if ABET or regional accreditors require ledger
  evidence, every accredited institution needs Acta
- **Cycle:** 3–7 years to regulatory adoption
- **Pain profile:** EU AI Act Annex III creates real pressure on European institutions;
  US accreditors have not yet formalized AI evidence requirements
- **Capability gaps that resonate:** Accreditation-ready export is purpose-built for this
- **Risk:** Extremely long cycle. Not an MVP strategy.
- **Acta fit:** Moat Candidate B (accreditation relationships). Long-term, not near-term.

---

## Beachhead analysis (Q2 — all candidates, no selection)

### Option A: R1 universities
- Pain: High (integrity stakes, graduate program complexity, accreditation pressure)
- Procurement: Slow (12–24 months, IT/legal/faculty senate)
- ACV: High
- Nectir overlap: Low (Nectir is community college-focused)
- Head-to-head risk: Canvas IgniteAI at some R1s already
- **Assessment:** High pain, slow path. Best if provost is the buyer.

### Option B: Community colleges [CAUTION — Nectir overlap]
- Pain: Medium-high (open enrollment, highest AI tool adoption, integrity concerns)
- Procurement: Moderate (Chancellor's Office state contracts possible)
- ACV: Lower
- Nectir overlap: **Direct** — Nectir is at all 116 CA Community Colleges
- **Assessment:** Nectir's footprint makes this a head-to-head fight on Nectir's home
  turf. Not recommended as primary beachhead without a specific differentiation strategy.
  [HYPOTHESIS — founder may have a view on this]

### Option C: Online-only programs
- Pain: Highest (integrity problem is most acute; no in-person fallback)
- Procurement: Moderate (often smaller institutions or program-level decisions)
- ACV: Variable
- Nectir overlap: Low
- **Assessment:** Highest pain concentration. Strong beachhead candidate if faculty
  or program directors are the buyer. Multi-modal oral verification (Q4) is especially
  compelling here.

### Option D: Professional graduate programs (MBA, law, nursing)
- Pain: High (stakes are highest; integrity failures are career-ending for graduates)
- Procurement: Moderate (dept/program level possible; strong ACV)
- ACV: High
- Nectir overlap: Low
- **Assessment:** Strongest combination of pain intensity, ACV, and procurement speed.
  Nursing programs face specific accreditation requirements (ACEN, CCNE) that the
  signed ledger directly addresses. Law programs face bar exam integrity pressure.
  [HYPOTHESIS — requires interview validation]

### Option E: K-12
- **Do not pursue without explicit founder approval.**
  Different regulatory regime (COPPA, state-level K-12 privacy laws). Different buyer
  (superintendent, not provost). Different ACV. Requires separate product and legal analysis.

---

## Pain map by stakeholder

| Stakeholder | Primary pain | Secondary pain | Acta capability that addresses it |
|-------------|-------------|---------------|----------------------------------|
| Faculty | Integrity case workload; detection tool liability | Grade appeal evidence | Submission-grounded checks, signed ledger |
| Dept. chair | Faculty inconsistency; accreditation prep | Policy control | Configurable grading modes, accreditation export |
| Provost / VP Acad. | Legal liability; reputation; AI policy | EU AI Act compliance | Signed ledger (legal admissibility), accreditation export |
| General Counsel | Grade dispute evidence; vendor FERPA liability | Audit trail | Signed ledger, FERPA-compliant data handling |
| Student | Unfair detection accusation | Lack of appeal path | Signed ledger (appeals), transparent concept checks |
| Accreditor | Evidence of learning outcomes | AI governance | Accreditation-ready export |

---

## Open questions for founder

- **Q1:** Which buyer type is the primary target for the first 3–5 pilots?
- **Q2:** Which beachhead segment? (Recommendation to surface: online-only or professional
  grad show strongest pain-to-procurement-speed ratio, but this is a hypothesis.)
- **Q6:** Institutional contract vs. instructor-purchased pilot for first design partners?
- **[Nursing flag]:** Nursing programs (ACEN/CCNE accreditation) are a specific high-pain
  sub-segment within professional grad. Worth founder consideration as a beachhead within Q2.
- **[EU AI Act flag]:** Institutions with EU exposure or partnerships face compliance pressure
  that makes the Acta ledger not optional. Is there a specific EU-adjacent segment to target?
