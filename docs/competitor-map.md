# Competitor Map

**Purpose:** Feature-by-feature competitor comparison seeded from internal competitive analysis PDF.
All ratings from the PDF are labeled [INTERNAL ASSESSMENT]. External verification is required
before any rating is treated as confirmed.
**Owner:** market-research-agent
**Last updated:** 2026-05-05
**Status:** Phase 1 in progress — ratings are hypotheses pending external verification

---

## Source note

This map is seeded from: "Competitive Analysis (5_5_26) - Feature Matrix.pdf" (internal document).
See `docs/source-log.md` entry S-001 for full citation details.

The PDF uses the internal working name "Learning OS." Per Acta naming policy, all analysis
in this file uses "Acta" and "Acta verification." The PDF content is quoted verbatim where
relevant but is not taken as external proof.

---

## DECISION REQUIRED — Expanded competitor set

```
DECISION REQUIRED:
Question:
The internal PDF includes 13 competitors. The founder-pre-approved set contains 5
(Nectir, Canvas IgniteAI, OneTutor, Khanmigo, LearnWise). The PDF adds 8 additional
entries: QuadC, Blackboard/Anthology, Cognii, Packback, Risely AI, DRUID AI,
IU Syntea, UCSD SLH. Should these 8 be added to the primary research set?

Why this matters:
Per market-research-agent policy, adding or removing competitors from the primary
set requires founder approval. Including them affects research scope and resourcing.
Some (e.g. Cognii) have meaningfully different profiles that may affect gap analysis.

Options:
A. Add all 8 to the primary research set — broadens competitive picture.
B. Add selected entries only (e.g. Cognii, Packback as most differentiated).
C. Keep the pre-approved set of 5; treat the other 8 as "reference only — not primary."

Recommendation:
Option C for now — preserve all data in this map labeled [PENDING APPROVAL],
but focus external verification effort on the pre-approved 5 until founder decides.

Default if founder does not know:
Option C (reference only, not primary). The 5 pre-approved competitors cover the
major market positions. The additional 8 can be verified if the founder approves expansion.
```

All 13 competitors are included in the matrix below. Entries beyond the pre-approved 5 are
marked **[PENDING APPROVAL — REFERENCE ONLY]** until the founder decides.

---

## Rating key

| Rating | Meaning |
|--------|---------|
| Core | Foundational to the product — central to its identity |
| Strong | Present, well-developed, differentiating |
| Moderate | Present but limited depth or coverage |
| Weak | Minimal, partial, or inconsistently applied |
| None | Not present |
| N/A | Not applicable to this product |

**All competitor ratings: [INTERNAL ASSESSMENT — UNVERIFIED]**
Source: internal PDF competitive analysis dated 5/5/26. Not independently confirmed.

---

## Capability definitions (from source PDF)

| Capability | Why It Matters (per source) |
|-----------|---------------------------|
| Teacher-authored per-assignment policy | Teachers control what AI can/cannot do per assignment |
| Course-specific RAG over materials | Course docs, rubrics, and policies ground the AI |
| Submission-grounded concept checks | Verifies understanding from the student's own work |
| Multi-modal answer capture (audio + text) | Oral verification is the strongest learning evidence |
| Configurable grading modes (score / gate / fail-only) | Different faculty want different defaults |
| Signed provenance ledger | Defensible evidence of policy, prompts, outputs, and verification |
| Accreditation-ready export | ABET, regional accreditors, EU AI Act evidence |
| Copy-paste resistance | Forces students to explain and apply concepts |
| Syllabus feedback loop | Turns confusion patterns into course improvements |
| Student coordination (deadlines, OH, TA routing) | Coordinates deadlines, office hours, resources, next steps |
| Cost-aware multi-tier model routing | Cache → SLM → mid-tier → frontier keeps inference under $7/student/month |
| Multi-LMS neutrality | Works across Canvas, Blackboard, Moodle, D2L equally |
| Higher-ed CS-grade rigor | Understands autograder rules, recursion limits, banned functions |
| Teacher / TA analytics | Surfaces struggle points, risk signals, intervention opportunities |

---

## Full feature matrix

_All competitor ratings: [INTERNAL ASSESSMENT — UNVERIFIED] per source S-001_
_Acta column reflects internal product target, not shipped capability_

| Capability | Acta (Target) | Nectir AI ★ | Canvas IgniteAI ★ | Khanmigo ★ | OneTutor ★ | LearnWise AI ★ | QuadC † | Blackboard/Anthology † | Cognii † | Packback † | Risely AI † | DRUID AI † | IU Syntea † | UCSD SLH † |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Teacher-authored per-assignment policy | Core | Moderate | Weak | Moderate | Strong | Moderate | Moderate | Moderate | Weak | Moderate | Weak | Weak | Moderate | Moderate |
| Course-specific RAG over materials | Core | Core | Strong | Strong | Core | Strong | Moderate | Moderate | Weak | Moderate | Weak | Weak | Strong | Strong |
| Submission-grounded concept checks | Core | None | Weak | Weak | Weak | Weak | Weak | Weak | Strong | Moderate | None | None | Moderate | Weak |
| Multi-modal answer capture (audio + text) | Core | None | None | None | None | None | None | None | None | None | None | None | None | None |
| Configurable grading modes (score / gate / fail-only) | Core | None | None | None | None | None | None | None | Weak | Weak | None | None | None | None |
| Signed provenance ledger | Core | Weak | Weak | Weak | Weak | Weak | Weak | Weak | Weak | Weak | Weak | Weak | Weak | None |
| Accreditation-ready export | Core | None | Weak | None | None | Weak | Weak | Weak | Weak | Weak | None | None | None | None |
| Copy-paste resistance | Core | Moderate | Moderate | Moderate | Moderate | Moderate | Moderate | Moderate | Strong | Strong | Weak | Weak | Moderate | Moderate |
| Syllabus feedback loop | Core | Moderate | Weak | Moderate | Moderate | Moderate | Moderate | Weak | Moderate | Strong | Moderate | Moderate | Moderate | Weak |
| Student coordination (deadlines, OH, TA routing) | Core | Strong | Moderate | Moderate | Moderate | Strong | Strong | Moderate | Weak | Weak | Strong | Strong | Moderate | Weak |
| Cost-aware multi-tier model routing | Core | Weak | Moderate | Weak | Weak | Weak | Strong | Weak | N/A | Weak | Weak | Weak | Weak | Weak |
| Multi-LMS neutrality | Core | Strong | None | Strong | Moderate | Strong | Moderate | None | Moderate | Strong | Moderate | Moderate | None | None |
| Higher-ed CS-grade rigor | Core | Weak | Weak | Weak | Moderate | Moderate | Moderate | Weak | Weak | Weak | None | None | Weak | Strong |
| Teacher / TA analytics | Core | Strong | Strong | Strong | Strong | Strong | Strong | Strong | Strong | Strong | Strong | Strong | Strong | Moderate |

★ = Pre-approved competitor set
† = Pending founder approval to include in primary research set

---

## Gap analysis summary (from matrix — all [INTERNAL ASSESSMENT])

### Capabilities where Acta has a unique or near-unique position across ALL 13 competitors

| Capability | Best competitor rating | Gap severity |
|-----------|----------------------|--------------|
| Multi-modal answer capture (audio + text) | **None** (0 of 13) | **Total gap** |
| Configurable grading modes | **Weak** (2 of 13: Cognii, Packback) | **Total gap for pre-approved 5** |
| Accreditation-ready export | **Weak** (5 of 13) | **Strong gap** |
| Signed provenance ledger | **Weak** (all 13 at Weak or None) | **Strong gap** |

### Capabilities where competitors are strong (no clear Acta advantage per matrix)

| Capability | Competitors rated Strong | Note |
|-----------|------------------------|------|
| Teacher / TA analytics | All 13 at Strong | Undifferentiated |
| Course-specific RAG | Nectir Core, Canvas Strong, Khanmigo Strong, OneTutor Core, LearnWise Strong, IU Syntea Strong, UCSD SLH Strong | Table stakes in the market |
| Multi-LMS neutrality | Nectir Strong, Khanmigo Strong, LearnWise Strong, Packback Strong | Common among tutors |
| Student coordination | Nectir Strong, LearnWise Strong, QuadC Strong, Risely Strong, DRUID Strong | Solved by incumbents |

### Capabilities where Acta's wedge sits alone

The three capabilities with the largest verified moat potential (all ratings None or Weak for all pre-approved 5):
1. **Submission-grounded concept checks** — None for Nectir; Weak for all others in pre-approved set. Cognii is Strong († pending approval).
2. **Signed provenance ledger** — Weak for every competitor, None for UCSD SLH.
3. **Configurable grading modes** — None for all pre-approved 5. Weak for Cognii only.

**Notable finding:** Cognii († pending approval) shows Strong on submission-grounded concept checks. This is the closest thing in the market to Acta's core verification thesis. Market-research-agent should prioritize external verification of Cognii's actual capability.

---

## Pricing note

The source PDF states a cost target of "$7/student/month" for the cost-aware multi-tier model routing capability. This is an internal target figure and constitutes a pricing assumption.

**This is a Level 3 decision — see docs/decisions.md. Do not treat $7/student/month as confirmed or public pricing.**

---

## Open questions for founder

- **[Q — Competitor set]:** Approve or reject the 8 additional competitors for primary research scope.
- **[Q — Pricing]:** Is $7/student/month the intended public-facing cost target, an internal engineering constraint, or a benchmark for comparison?
- **Q1:** Buyer/ICP not yet decided — affects which competitor profiles matter most.
- **Q2:** Beachhead not yet decided — affects which competitors are head-to-head threats.
- **[Cognii flag]:** Cognii's Strong rating on submission-grounded concept checks should be externally verified before Acta's positioning on this capability is considered unique.
