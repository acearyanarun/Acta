# Final MVP Plan

**Purpose:** Consolidated /select-mvp output. Scored option comparison, V1 scope,
post-MVP roadmap, demo flow, architecture implications, risk review, and final
DECISION REQUIRED for founder.
**Owner:** chief-of-staff-orchestrator (merges product-manager-agent recommendation)
**Last updated:** 2026-05-10
**Status:** APPROVED 2026-05-10 — Option A is the v1 build target. Phase 3 unlocked (architecture only; real-student-data work blocked on D-003).

---

## 1. Final MVP recommendation

**Recommended v1 MVP: Option A — Verification-first, text-only.**

Rationale in one paragraph: Q1 (dept chair / program director buyer) and Q2 (professional
graduate / online-heavy beachhead) are best served by a working, demonstrable verification
loop within a single pilot semester. Q4 explicitly defers oral verification, eliminating
Option B from v1. Option C (LMS) extends timeline by 6–8 weeks and opens new FERPA surface
without unlocking new buyer pain — a dept chair can sign a standalone pilot without LTI.
Option A is the only path that ships the full C1–C3 thesis (verification wedge, signed
ledger, three grading modes) on a schedule that lets a chair run a fall-semester pilot
with one cohort.

---

## 2. Scored option comparison

Scoring formula:
`0.35 × Customer Pain + 0.25 × Demo Value + 0.20 × Build Speed + 0.10 × Differentiation + 0.10 × Revenue Signal`
All sub-scores on a 1–10 scale. Each score is [INTERNAL ASSESSMENT] based on Phase 1 research.

| Criterion | Weight | Option A (text-only) | Option B (text + oral) | Option C (text + LMS) |
|----------|-------:|--------------------:|----------------------:|---------------------:|
| Customer Pain | 0.35 | 8 — addresses appeals + accreditation pain for chair | 9 — nursing/law oral fits highest-stakes pain | 7 — chair does not need LMS to buy |
| Demo Value | 0.25 | 8 — three hero moments work cleanly | 10 — oral is the most visceral demo moment | 7 — LMS is plumbing, not story |
| Build Speed | 0.20 | 9 — 8–14 weeks to demo-ready | 4 — 14–20 weeks; audio + FERPA + WebRTC risk | 5 — 16–22 weeks; LTI cert review delays |
| Differentiation | 0.10 | 7 — submission-grounded + ledger uniquely Acta | 10 — total gap on oral across all 13 competitors | 6 — many tools have LTI integration |
| Revenue Signal | 0.10 | 7 — chair-level buying does not require LMS | 8 — prof grad oral exam fit, but Q4 defers | 6 — institutional buy harder without dept buy-in first |
| **Weighted total** | | **8.00** | **8.25*** | **6.40** |

\* Option B scores highest on raw weights but is **ineligible for v1** because Q4 defers
oral verification. Recorded here for transparency; reframed as post-MVP expansion below.

**Decision logic:** Of eligible options, Option A (8.00) beats Option C (6.40) by 1.60
weighted points. The gap is driven primarily by Build Speed (9 vs. 5) and Customer Pain
(8 vs. 7) — both reflect that LMS integration is not what unlocks the dept chair sale.

---

## 3. V1 feature list (Option A — text-only verification)

**Core (MVP-blocking — required for v1 ship):**
1. Submission-grounded concept check generation (text only)
2. Three grading modes: confidence score / required gate / fail-only escalation (C3)
3. Signed provenance ledger — append-only, hash-chained, cryptographically signed (C2)
4. Instructor configuration UI — per-assignment policy and grading mode (< 2 min config, C6)
5. Student-facing concept check delivery + response capture
6. Accreditation-ready export (signed, structured document)
7. Course-specific RAG for check grounding (context infrastructure, not a user-facing feature)
8. Standalone deployment (no LMS) — LTI 1.3 stub for future expansion only
9. Multi-tenant isolation from v1 (FERPA cross-tenant protection)
10. Instructor override path on "required gate" mode (single-click; satisfies EU AI Act D-004)
11. FERPA-aligned data handling — DPA in place before any real student data flows

**Supporting infrastructure (required for v1 to function):**
- Authentication (instructor + student + admin/accreditor roles)
- Audit logging by ID only (no plaintext PII in app logs — FP-001 mitigation)
- Cost-aware model routing (to hold against $7/student/month target — D-005 dependent)
- Ledger schema with modality field reserved (forward compatibility for oral, per Q4 decision)

---

## 4. Post-MVP feature list (expansion roadmap, not v1)

**v1.5 (next 3–6 months after v1 pilot validation):**
- LTI 1.3 LMS integration with grade passback (Option C scope)
- Canvas-first deep integration (after LTI 1.3 baseline)
- Instructor analytics dashboard

**v2 (after first paying institution + 2+ pilots complete):**
- Browser WebRTC oral verification (Option B scope; Q4 preferred approach)
- Audio-modal ledger entries (schema field already reserved)
- Multi-language concept check generation
- TA review workflow
- Syllabus-aligned check generation

**v2+ (longer horizon, gated by demand evidence):**
- Native LMS API integrations beyond LTI 1.3 (D2L, Blackboard, Moodle deep)
- Mobile-optimized student response capture
- API for institutional research integration

---

## 5. Not-building list

See [docs/not-building.md](not-building.md) for the full enumerated list with rationale
and reopen conditions. Key items:

- AI cheating detection (C4 hard constraint — never)
- Zoom/Teams oral integration (Q4 explicitly rejected — never)
- Native mobile app for oral (Q4 explicitly rejected — never)
- Affect/emotion detection (EU AI Act prohibition — never)
- Open-response grading of pre-authored questions (Cognii's space, dilutes moat — never)
- K-12 support (out of scope; different regulatory regime)

---

## 6. Buyer / user narrative

**Buyer (department chair / program director, e.g., MSN online nursing program):**
> "My online nursing program enrolled 90 students this fall. Last spring we had two
> grade appeals that went to the dean's office. We had no record beyond the instructor's
> rubric — no evidence of what the student actually understood. Our accreditor is starting
> to ask how we verify competency in online clinical reasoning courses. I need something
> that produces a defensible record when a grade is challenged, and that gives me
> something to show the board when they ask whether AI is being used appropriately.
> Acta does that. Faculty don't have to police. The ledger does the proving."

**Secondary user (faculty / instructor):**
> "I configure the assignment in under two minutes. I pick whether the concept check is
> a hard gate, a confidence score, or only triggered on suspected failure. The student
> submits. The check happens. I see the result. If a student appeals, I open the ledger
> and the chain is there. I don't have to remember anything."

**End user (student):**
> "I submit my work. After I submit, Acta asks me a few questions about what I just turned
> in — not generic quiz questions, questions about MY submission. I answer in my own words.
> If I actually understood what I wrote, this is easy. If I copy-pasted AI without
> understanding it, I get caught — fairly, by a question I cannot fake my way through."

---

## 7. Demo flow (10 minutes — anchored in dept chair / prof grad persona)

| Minute | Scene | Hero gap | Persona anchor |
|--------|-------|---------|---------------|
| 0–1 | Problem framing | — | Dept chair narrates: "Two appeals last spring. No evidence." |
| 1–3 | Instructor configures assignment | Grading-mode selector | Faculty in online MSN program sets fail-only escalation |
| 3–5 | Student submits + receives checks | Submission-grounded checks | Clinical case analysis (nursing) or legal brief (law) |
| 5–7 | Grade contested — ledger opened | Signed provenance ledger | Dept chair opens chain when student appeals |
| 7–9 | Accreditor export | Accreditation-ready export | Chair shows accreditor evidence — signed document |
| 9–10 | Close | — | "Detection guesses. Acta proves." |

**Differences from prior demo-flow.md (May 5):**
- Oral verification scene **removed** (Q4 deferred) — no longer a "deferred scenario," removed from v1 demo entirely
- Persona anchor shifted from generic instructor to **dept chair / program director**
- Scene 5 (accreditor export) emphasized — this is the chair's strongest buying moment
- Scene 3 should use a high-stakes professional graduate assignment (nursing/law/cybersec)

ux-ui-designer-agent owns the demo-flow.md update reflecting these changes.

---

## 8. Technical architecture implications

(Software-architect-agent owns final architecture.md — these are the implications /select-mvp
surfaces, not the architecture itself.)

**Ledger architecture (must be locked before any build):**
- Append-only event store with hash-chained entries
- Signing key separate from application keys (non-repudiation)
- Entry schema MUST include a `modality` field (default: `text`) — reserved for future audio
- Export format must be readable without the Acta application
- Multi-tenant scoping at the entry level (institution_id required on every write)

**AI pipeline (ai-llm-engineer-agent owns):**
- Model routing layer with cost ceiling targeting $7/student/month [D-005 — still pending]
- FERPA DPA confirmed with selected model provider BEFORE any real student data [D-003 blocker]
- Structural separation of student content vs. system prompt (prompt injection mitigation)
- Output validation: checks must be topic-coherent relative to assignment
- No detection classifiers anywhere in the pipeline (C4)

**Frontend architecture (frontend-developer-agent owns):**
- Three primary surfaces: instructor config, student check delivery, ledger viewer
- LTI 1.3 stub only — no live integration in v1
- WebRTC audio capture NOT in v1 — but UI scaffolding can leave a future entry point

**Compliance architecture (qa-security-devops-agent owns):**
- FERPA-aligned data handling from first commit (no plaintext PII in logs — IDs only)
- "Required gate" mode ships with low-friction instructor override (D-004 recommendation)
- "Tamper-evident, cryptographically signed" language, NOT "legally admissible" (D-002 recommendation)
- Multi-tenant isolation enforced at DB row level

**Deferred to future work (not v1 architecture):**
- WebRTC media pipeline
- Audio transcription + grading
- LTI 1.3 grade passback
- Canvas-specific API client

---

## 9. Risk review

| # | Risk | Severity | Mitigation | Owner |
|---|------|---------|-----------|-------|
| R1 | Model provider DPA not in place when build starts | Critical | Resolve D-003 before any architecture lock | Founder + qa-security |
| R2 | Positioning drift toward "legally admissible" claims | Closed via D-002 (2026-05-10) | Use only: "audit-ready," "evidence-ready," "provenance-backed," "defensible record" | All agents |
| R3 | EU AI Act "required gate" human oversight conflict | High | Ship single-click instructor override (D-004) | Software-architect + qa-security |
| R4 | Cognii narrows differentiation if customers conflate "open-response grading" with submission-grounded | Medium | Demo Scene 3 must visibly use the student's own submission text. Sales narrative must call out the methodology distinction | UX + product-manager |
| R5 | Nectir extends from quiz generation toward submission-grounded checks | Medium | Speed to first pilot is the answer; track Nectir releases monthly | Market-research |
| R6 | $7/student/month cost target proves infeasible at scale | Medium | Resolve D-005 hard-vs-soft; model routing design must allow ceiling enforcement | AI-LLM-engineer + founder |
| R7 | Prompt injection via student submission corrupts check generation | High | Structural separation + output validation; red team in Phase 4 (mandatory category) | AI-LLM-engineer + qa-security |
| R8 | Demo fails because chair-level narrative is not yet refined | Medium | UX/UI updates demo-flow.md with chair persona before first demo | UX-UI-designer |
| R9 | First pilot institution requires LTI before they sign | Medium | Have v1.5 LTI roadmap visible to buyer; standalone pilot terms ready as fallback | Product-manager |
| R10 | Building Option A and discovering chair actually wanted oral | Low (Q4 decision is recent and explicit) | Architecture reserves modality field; can ship oral in v2 without ledger migration | Software-architect |

---

## 10. Final DECISION — APPROVED 2026-05-10

**Founder approved Option A as the v1 build target on 2026-05-10.** Full record in
docs/decisions.md (MVP-APPROVAL entry). Phase 2 → Phase 3 gate is UNBLOCKED.

Binding constraints attached to the approval:
- Positioning language: do NOT use "legally admissible." Use "audit-ready,"
  "evidence-ready," "provenance-backed," or "defensible record." (D-002 closed.)
- $7/student/month is a SOFT internal cost target, not external pricing. (D-005 closed.)
- No real student data until D-003 (model provider FERPA DPA) resolved.
- Option B = v2 / post-MVP. Option C = v1.5 / post-MVP.
- Full LTI 1.3 integration is NOT v1 (stub-only is acceptable).
- Full accreditation automation and full EU AI Act compliance automation are NOT v1.

---

## 10b. Original DECISION REQUIRED block (for record)

```
DECISION REQUIRED:
Question:
Approve Option A (verification-first, text-only) as the v1 MVP scope for build?

Why this matters:
This is the Phase 2 → Phase 3 gate. Founder approval here unlocks /build-feature
and activates software-architect-agent + ai-llm-engineer-agent to lock the ledger
design (which must precede frontend/backend parallel tracks). No build begins
without this approval recorded in docs/decisions.md.

Options:
A. Approve Option A as v1 MVP. Architecture work begins immediately on ledger design.
   Post-MVP roadmap (Option C in v1.5, Option B in v2) is acknowledged but not built.
B. Approve Option A with amendments. Founder specifies what to add, remove, or change;
   product-manager-agent revises mvp-scope.md and resubmits.
C. Reject Option A and request alternative. Triggers re-scoring with new constraints.

Recommendation:
Option A. Scored 8.00 (highest among Q4-eligible options). Ships the full C1–C3
thesis on a chair-pilot-friendly timeline. Pre-build blockers (D-003 model DPA,
D-002 legal review, D-005 cost target) should be resolved in parallel with
architecture lock — not before approval.

Default if founder does not know:
Option A — but do NOT begin build until D-003 (model DPA) is resolved. Architecture
design (ledger, schemas, API contracts) may begin without resolving D-003; any work
that touches real student data may not.

Approving founder records:
Updates docs/decisions.md with Option A approved + date.
chief-of-staff-orchestrator activates Phase 3 backlog in docs/sprint-backlog.md.
```

---

## Hard constraint compliance (Option A)

| Constraint | Status | Notes |
|------------|--------|-------|
| C1 — Verification is the wedge | ✓ PASS | Scope is verification-only; no tutor features |
| C2 — Signed ledger in v1 | ✓ PASS | Ledger is core scope item #3 |
| C3 — All three grading modes | ✓ PASS | Confidence / required gate / fail-only all in v1 |
| C4 — No detection features | ✓ PASS | No classifiers in pipeline |
| C5 — FERPA compliance | ⚠ CONDITIONAL | Requires D-003 model DPA before real student data |
| C6 — Minimal instructor burden | ✓ PASS | Config target < 2 min; single-click override on required gate |

---

## Open questions remaining at plan time

- **Q5:** LMS integration depth — deferred to v1.5 but exact LTI 1.3 scope still needs founder input then
- **Q6:** Institutional vs. instructor pilot model — partial (dept chair signs); full pilot structure still open
- **D-001:** Expanded competitor set (8 additional) — reference-only recommendation pending founder
- **D-002:** "Legally admissible" positioning — legal review needed; use safer language until then
- **D-003:** Model provider selection + FERPA DPA — Critical, blocks any real-data work
- **D-005:** $7/student/month — hard constraint or estimate? Affects model routing design
- **D-006 remaining:** Visual direction (formal/trustworthy vs. modern/minimal) — open
