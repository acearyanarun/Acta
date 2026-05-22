# Model Routing

**Purpose:** Routing table for AI model selection per pipeline task, with rationale, privacy
implications, and cost estimates.
**Owner:** ai-llm-engineer-agent
**Last updated:** 2026-05-05
**Status:** Draft — blocked until model/provider choices are founder-approved

---

## Pre-condition

Model and provider selection requires founder approval (Level 3).
This document may define the routing framework now; specific model choices populated after approval.

---

## Routing framework

Each pipeline task is routed based on:
1. **Privacy sensitivity** — does the input contain student PII?
2. **Latency requirement** — synchronous (student-facing) vs. async (background)
3. **Cost per invocation** — volume × token count estimate
4. **Quality requirement** — rubric adherence, hallucination tolerance

---

## Routing table

| Task | Input sensitivity | Latency | Quality req | Model options (TBD) | Privacy note |
|------|-----------------|---------|-------------|---------------------|-------------|
| Concept check generation | High (student submission) | Async OK | High rubric adherence | — | Requires DPA if third-party |
| Response grading | High (student response) | Async OK | High accuracy | — | Requires DPA if third-party |
| Live oral facilitation | High | Real-time | — | — | Q4 dependency |
| Rubric generation from syllabus | Low | Async | Medium | — | |

---

## Privacy routing rule

If a task input contains student PII and the selected model is a third-party API (not
self-hosted), this is a Level 3 decision. A data processing agreement must be in place
before routing student work to any external model endpoint.

---

## Cost model

_To be estimated by ai-llm-engineer-agent once model choices are approved._

---

## Open questions for founder

- Model and provider selection (Level 3)
- Self-hosted vs. third-party API tradeoff
- Data processing agreement requirements
