# Not Building

**Purpose:** Explicit log of features and capabilities deferred from the MVP, with justification.
Scope discipline requires this list. An empty not-building list is a red flag.
**Owner:** product-manager-agent
**Last updated:** 2026-05-05
**Last updated:** 2026-05-10
**Status:** Locked — reflects approved Option A scope (founder approval 2026-05-10)

---

## Why this doc exists

An MVP without explicit deferrals has no real scope. This document makes the scope boundary
concrete and gives the team a shared answer to "why aren't we building X?"

---

## Deferred features

| Feature | Rationale for deferral | Reopen condition |
|---------|----------------------|-----------------|
| AI cheating detection | C4 — hard constraint, explicitly excluded from product thesis | Never — requires founder waiver |
| **Live oral verification (browser WebRTC)** | Q4 — deferred from v1 per founder 2026-05-10. Adds engineering complexity (WebRTC, audio storage), FERPA audio PII exposure, accessibility/consent risk, demo fragility | **Post-MVP expansion** — after Option A pilot validates core thesis; preferred approach: browser WebRTC |
| Zoom/Teams oral integration | Q4 — explicitly rejected. Vendor lock-in, scheduling friction, opaque audio path | Never — superseded by future WebRTC approach |
| Native mobile app for oral | Q4 — explicitly rejected. Deployment friction, App Store review for student-facing flow | Never — browser-first is the chosen path |
| Required live oral assessment as v1 default | Q4 — explicitly rejected. Accessibility risk, scheduling burden | Never as default; may be opt-in mode post-MVP |
| **Deep LMS integration** | Founder 2026-05-10 — Option C reframed as v1.5/post-MVP. Standalone-first architecture | **v1.5 expansion** after Option A pilot |
| **Full LTI 1.3 integration** | Founder 2026-05-10 — stub-only in v1. Standalone-first | **v1.5 expansion** — LTI 1.3 likely first deep integration |
| **Legal admissibility claims** | Founder 2026-05-10 — positioning language constraint. Use "audit-ready," "evidence-ready," "provenance-backed," "defensible record" instead | Never as "legally admissible." Stronger claims require formal legal opinion first |
| **Full accreditation automation** | Founder 2026-05-10 — v1 ships basic evidence/export report only | After pilot validation + accreditor feedback loop |
| **Full EU AI Act compliance automation** | Founder 2026-05-10 — v1 takes manual compliance posture (logging via ledger, transparency in UI, instructor override on required-gate). Full automation later | After EU pilot opportunity is concrete |
| Canvas-specific API integration | Adds platform-specific surface beyond LTI 1.3 | After LTI 1.3 ships and demand confirmed |
| Analytics dashboard for instructors | Not a hero gap; competitors already provide; defer to focus build effort | v2 if pilot users request |
| Syllabus feedback loop | V1-Hard per ai-spec.md; weak gap vs. competitors | v2 if differentiated approach emerges |
| Student coordination beyond deadline display | No gap vs. incumbents; not the wedge | Defer indefinitely — not Acta's lane |
| TA portal | Adds complexity; deferred until instructor flow is validated | v2 if demand confirmed |
| Affect / engagement detection | EU AI Act Feb 2025 prohibition — emotion recognition in education | Never — regulatory prohibition |
| K-12 support | Out of scope; different regulatory regime (COPPA, state K-12 statutes) | Explicit founder approval; separate compliance pass |
| Parent/guardian access | Higher ed primary; not relevant to dept chair / prof grad ICP | Requires K-12 approval first |
| Open-response grading of pre-authored questions | This is Cognii's space, not Acta's. Acta grades against student's OWN submission | Never — would dilute methodology moat |

---

## Features requiring explicit founder approval to add back

- AI detection (C4 violation — requires founder waiver plus documented rationale)
- Any feature adding instructor burden without C6 gate approval
- Any feature that repositions Acta as a tutor (C1 violation)
