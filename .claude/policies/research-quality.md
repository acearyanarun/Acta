# Research Quality Standards

All research outputs must meet these standards before being used as input to any other agent.

---

## Source labeling requirements

Every claim in a research output must carry one of these labels:

| Label | Meaning |
|---|---|
| `[VERIFIED]` | Primary source cited (link, filing, interview, docs, demo) |
| `[VENDOR CLAIM]` | From vendor marketing — not treated as proven capability |
| `[HYPOTHESIS]` | Reasoned inference — not yet confirmed by evidence |
| `[ASSUMPTION]` | Required to proceed — must be flagged for founder review |

Unlabeled claims are not acceptable. When in doubt, label as `[HYPOTHESIS]`.

---

## Citation rules

- Every factual claim requires a citation or a label.
- Direct URLs are preferred. If a URL is unavailable, describe the source specifically enough
  that it can be found and verified.
- Do not cite secondary summaries as primary sources.
- Do not treat analyst reports as ground truth — label them `[VENDOR CLAIM]` or `[HYPOTHESIS]`
  unless the underlying primary data is cited.

---

## Prohibited fabrications

- Do not invent enrollment numbers, contract values, adoption percentages, or headcount.
- Do not invent customer quotes.
- Do not invent competitor product capabilities without a primary source.
- Do not invent regulatory interpretations — cite the statute or regulator guidance directly.

---

## Acta-specific research standards

**Competitor claims:**
Capability claims about Nectir, Canvas IgniteAI, OneTutor, Khanmigo, LearnWise, and any other
named competitor must cite a primary source: vendor docs, a live demo, a customer review, or a
public filing. Vendor marketing copy must be labeled `[VENDOR CLAIM]`.

**Regulatory claims:**
Claims about university procurement cycles, accreditation requirements, or FERPA scope must cite
a primary source or be labeled `[HYPOTHESIS]`. Regulatory interpretation without a statute or
guidance citation is not acceptable.

**Third moat:**
The third moat is unresolved (Q3). When surfacing candidates, label each as `[HYPOTHESIS]` and
provide supporting evidence. Do not assert any candidate as confirmed.

**Admissibility claims:**
Claims about legal admissibility of the signed ledger must be labeled `[HYPOTHESIS]` unless
supported by legal counsel opinion or a comparable precedent.

---

## Output structure for research deliverables

Every research deliverable must include:

1. **Summary** — 3–5 bullet points, labeled claims only
2. **Evidence** — detailed findings with inline source labels
3. **Assumptions made** — explicit list of `[ASSUMPTION]` labels used
4. **Open questions for founder** — which of Q1–Q6 were encountered and could not be resolved
5. **Sources** — full citation list

---

## Staleness

Research outputs older than 30 days must be re-verified before being used in a new phase.
The chief-of-staff-orchestrator is responsible for flagging stale research in `docs/changelog.md`.
