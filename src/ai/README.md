# `src/ai/` — AI workspace

**Synthetic fixtures only. No real student PII in this directory.** (D-003)

This workspace will host:

- `prompts/` — prompt templates for concept check generation, response grading, and rubric scoring
- `evals/` — evaluation suites for rubric adherence, hallucination rate, prompt-injection resistance, and fairness across demographic proxies

## Development model

Per D-003, the development provider is Anthropic Claude. Real student data may not be sent
to any model until a signed FERPA DPA exists with the production provider.

At the foundation stage there is no code in this directory beyond placeholders. The AI
pipeline ships in a later `/build-feature` run after the ledger design is locked.
