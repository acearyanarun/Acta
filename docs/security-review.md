# Security Review

**Purpose:** FERPA exposure, EU AI Act compliance, state AI-in-ed law scoping, prompt
injection surface, and provenance/ledger risks for Acta verification.
**Owner:** qa-security-devops-agent
**Last updated:** 2026-05-05
**Status:** Phase 1 compliance scoping complete — build-phase review pending

---

## Phase 1: Compliance scoping (active — required before architecture lock)

This section must be completed in Phase 1, before architecture decisions are made,
because compliance requirements constrain architecture choices.

---

### FERPA applicability

**Status:** [VERIFIED — multiple primary sources]

FERPA (20 U.S.C. § 1232g; 34 CFR Part 99) applies to educational institutions and their
vendors. For Acta, the following data types are education records under FERPA:

| Data type | FERPA status | Acta handling requirement |
|-----------|-------------|--------------------------|
| Student submissions (work product) | Education record | FERPA-protected PII in all pipelines |
| Concept check questions generated | Likely education record (tied to specific student work) | Treat as PII |
| Student concept check responses | Education record | FERPA-protected; log by ID only |
| Concept check scores / grades | Education record | FERPA-protected |
| Ledger entries | Education record (contains all of the above) | Append-only, access-controlled |
| Model prompt containing student content | Education record derivative | Cannot send to third-party without DPA |

**2025 enforcement context:**
- DOE required compliance documentation submissions from institutions by April 2025.
- FERPA lacks clear cybersecurity standards for vendors — an emerging liability area.
  Acta should apply security controls that exceed FERPA minimum to reduce institutional risk.
- COPPA 2025 amendments shifted to opt-in consent (applies to under-13; note for any K-12 scope).

**Vendor obligations:**
- Acta must act as a "School Official" under FERPA: bound by institutional data governance,
  cannot use student records for any purpose outside the contract scope.
- DPA with each institution is required before processing student submission data.
- Model training on student data: explicitly prohibited in DPA unless separately consented.

**Critical open question:** Do Acta's AI model providers (TBD — Level 3 decision) have
signed FERPA-compliant DPAs? Any third-party API call containing student submission
content requires this. Until the model provider is selected and a DPA is in place,
student submissions must not enter any third-party inference endpoint.
**Label:** [VERIFIED — NEA Federal AI Regulations PDF; SchoolAI FERPA guide; ArentFox Schiff]

---

### EU AI Act — high-risk classification (significant compliance finding)

**Status:** [VERIFIED — EU AI Act Annex III; euaicompass.com EU AI Act for Education]

**Finding:** Acta's concept check grading and verification features almost certainly
qualify as high-risk AI systems under EU AI Act Annex III, which covers AI systems
that "evaluate learning outcomes" and "assess appropriate education levels."

**Applicable obligations for Acta as a provider/deployer:**
1. Human oversight: instructors must be able to review and override any AI assessment
   before it becomes final. The "confidence score" mode satisfies this; the "required gate"
   mode creates tension — a hard gate without instructor override may not comply.
2. Logging: Acta must maintain logs of system operation sufficient for audit.
   The signed ledger satisfies this requirement natively.
3. AI literacy: teaching staff who use Acta must receive adequate AI literacy training.
   This is an institutional obligation but Acta should provide onboarding materials.
4. Transparency: students must be informed that AI is involved in their assessment.
   Acta's UI must make this explicit.
5. Accuracy and robustness standards: the AI system must meet accuracy thresholds
   for the assessment use case. This drives the eval suite requirements.

**Go-to-market angle:**
Institutions with EU exposure (EU campuses, EU-based online programs, EU partnership programs)
face a compliance deadline and need exactly what Acta's ledger produces. This is a
concrete sales lever, not a hypothetical.

**Compliance cost:**
Acta itself must comply with the above obligations before marketing to EU-exposed institutions.
The qa-security-devops-agent recommends designing for EU AI Act compliance from v1 —
it is easier to build in than to retrofit.

**Emotion recognition note:** The EU AI Act's February 2025 prohibition on emotion recognition
in educational contexts prohibits affect detection features. Acta must never implement
student affect/engagement detection. (C4 adjacent — this is not a detection tool.)

---

### State-level AI-in-education laws

**Status:** Partial — primary source review required for each state

#### California
- The CCC Chancellor's Office published an AI Workplan (July 2025) — Acta's primary
  beachhead risk state given Nectir's presence.
- California's CPPA (Consumer Privacy Protection Agency) has active rulemaking on AI.
- SB 1047 context: California has the most active AI regulatory environment in the US.
- **Action required:** qa-security-devops-agent must read the CCC AI Workplan and
  identify specific obligations for AI tools processing student data in CA institutions.
**Label:** [HYPOTHESIS — specific statutes not yet fully read; CCC workplan cited as pending]

#### New York
- New York has proposed student data privacy legislation and is an active regulatory state.
- Specific statutes applicable to Acta's use case require primary source research.
**Label:** [HYPOTHESIS — requires primary source review]

#### Texas
- No specific AI-in-ed statute confirmed in Phase 1 searches.
- Texas has general student data privacy requirements (FERPA-aligned).
**Label:** [HYPOTHESIS — requires primary source review]

---

### Signed ledger — provenance and tamper-evidence requirements

**Finding from market research:** No commercial competitor has a cryptographic provenance
ledger. This is a first-mover position with no established legal precedent for admissibility.

**Requirements for legal admissibility (design targets — not legally confirmed):**
- Chain of custody: every write to the ledger must be timestamped and attributed.
- Tamper evidence: hash chain over entries — modifying any entry breaks the chain.
- Non-repudiation: Acta's signing key must be separate from application keys.
- Export: ledger must be exportable in a format readable without the Acta application.
- Retention: ledger entries must be retained per institutional policy (FERPA allows
  institutions to set their own record retention for education records).

**DECISION REQUIRED:**
```
DECISION REQUIRED:
Question:
Has legal counsel reviewed whether a hash-chained, cryptographically signed
append-only log constitutes legally admissible evidence in US grade appeal
proceedings? What jurisdiction(s) should govern this review?

Why this matters:
Acta's positioning claims the ledger is "legally admissible" and "defensible."
These are legal claims. Without legal opinion, the qa-security-devops-agent
cannot confirm this positioning is accurate, and marketing or selling on this
basis without legal backing creates liability risk.

Options:
A. Obtain legal opinion before using "legally admissible" in any marketing or
   sales material. Design the ledger to meet the legal standard, whatever it is.
B. Use more defensible language ("cryptographically signed," "tamper-evident,"
   "auditable") rather than "legally admissible" until legal review is complete.
C. Proceed with current positioning and obtain legal review before first institutional
   sale with a grade-appeal use case.

Recommendation:
Option B for now — remove "legally admissible" from all materials until legal
review is complete. Use "tamper-evident, cryptographically signed audit trail."

Default if founder does not know:
Option B. The signed ledger's technical properties are real; the legal conclusion
requires a lawyer.
```

---

### Prompt injection via student-submitted content

**Risk level:** High — this is a mandatory red-team category

Students submit work that enters the AI concept-check generation pipeline. An adversarial
student could embed instruction-like text in their submission designed to:
- Override the system prompt (change the concept check topic or difficulty)
- Extract another student's submission from context
- Force a "pass" grade regardless of actual response quality
- Exfiltrate prompt templates

**Mitigation requirements for v1 (non-negotiable):**
1. Student submission content must be in a clearly delimited, role-labeled context segment
   that the model is instructed to treat as data, not instructions.
2. Output validation layer: concept checks generated from submissions must be validated
   for topic coherence relative to the assignment before delivery.
3. Grading pipeline: student responses must be validated as answers to the specific
   questions asked, not evaluated as freeform instructions.
4. No other student's data may appear in the same model context window.

Full test cases in `docs/prompt-injection-tests.md`.

---

### FERPA exposure paths (to be red-teamed in Phase 4)

| Exposure path | Description | Mitigation target |
|--------------|-------------|------------------|
| FP-001 | Student PII in plaintext application logs | Log IDs only; resolve via ledger |
| FP-002 | Cross-tenant data access (institution A reads institution B's data) | Multi-tenant isolation from v1 |
| FP-003 | Student submission sent to third-party model without DPA | Block until DPA confirmed |
| FP-004 | Ledger export accessible without authentication | Export requires instructor/admin auth |
| FP-005 | Concept check cache returns another student's content | Cache scoped to student+assignment |
| FP-006 | Model training on student data without consent | Prohibited in DPA by default |

---

## Phase 3: Build-phase review (pending)

_To be completed after MVP scope is approved and architecture is locked._

---

## Open findings requiring founder decision

| Finding | Severity | Action required |
|---------|---------|----------------|
| "Legally admissible" positioning requires legal review | High | Founder must decide whether to obtain legal opinion before using this claim |
| Third-party model provider DPA required for student data | Critical | Cannot process student submissions through any third-party API without DPA |
| EU AI Act high-risk classification | High | Required gate mode may conflict with human oversight requirement — design review needed |
| CA state AI-in-ed law scoping incomplete | Medium | Full primary source review needed before CA go-to-market |

---

## Open questions for founder

- **Legal admissibility:** Has legal counsel reviewed the ledger positioning?
- **Model provider DPA:** Which provider is selected (Level 3), and does a DPA exist?
- **EU AI Act human oversight:** Should the "required gate" mode include an instructor
  override option to maintain EU compliance? This is a C3 / C6 tension — adding an
  override option may add instructor burden.
- **Retention policy:** What is the intended ledger retention period? FERPA allows
  institutional variation; Acta's default should be explicit.
- **State law scoping:** Approve scope expansion for CA, NY, TX primary source review.
