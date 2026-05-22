# Route 3 Checkpoint — `/submissions/[id]` (concept-check flow with role toggle)

> **Status:** Built + close-outs applied. Ready for final Track A manual review.
> **Spec:** [`docs/track-a-screen-specs.md`](../track-a-screen-specs.md) §3
> **Date:** 2026-05-17
>
> **Close-outs applied 2026-05-17 (pre-final-review):**
> 1. **Eyebrow `//` prefix dropped** across all three routes. Every eyebrow now renders as plain uppercase label (`SUBMISSION`, `YOUR SUBMISSION`, `CONCEPT CHECKS`, etc.). The `.eyebrow` styling is unchanged. See `docs/decisions.md` for the revision entry.
> 2. **H1 fix landed** — H1 now reads `assignment.policy.title` (e.g. "Cellular respiration — short answer") instead of generic "Your Submission Review" / "Student Submission Review". Implemented via a chained `getStudentAssignment` / `getAssignment` fetch after the submission loads. H1 stays in the DOM at all times with a skeleton-line nested inside while the chained fetch is in flight (route 2 H1-stability pattern). On chained-fetch failure, the H1 keeps the skeleton until navigation — by-design fallback, since the assignment title is chrome-level, not load-bearing.
> 3. **`ConceptCheckDisplay` flat-layout refactor parked** as `docs/future-phases.md` Entry 3 with Q1–Q3 open decisions for founder spec'ing.

The shared submission view. Both students and instructors land here; the role toggle in the header band drives which view's role stripe + eyebrow copy renders. Voice-answer authoring and per-attempt verification result rendering live inside the embedded ConceptCheckDisplay component (whose internal restructure is parked — see "Skipped vs. spec" §1).

---

## Files changed

| Path | Change |
|---|---|
| `src/frontend/app/submissions/[id]/page.tsx` | Full rewrite. Replaced the old custom role-toggle div with two `<Pill as="link">` elements (STUDENT VIEW / INSTRUCTOR VIEW), one active per `?role=` param. Added `// SUBMISSION` page eyebrow, hash chip row beneath H1 (submitted-date eyebrow + content HashChip + optional student id eyebrow for instructor view), submission body card with role-matched stripe + `// YOUR SUBMISSION` or `// STUDENT SUBMISSION` eyebrow. Added `// CONCEPT CHECKS` and `// PROVENANCE` section eyebrows. Wrapped the concept-check section and provenance disclosure in role-striped cards. Added `readStateOverride()` for `?state=empty\|loading` (matches routes 1+2). Removed the legacy `primary-action-card` block; the spec's flat layout does not include it. Loading branch keeps `<h1>` present in the DOM with the skeleton-line nested inside (pattern locked at route 2 sign-off, Phase 0 §6 a11y floor). |
| `src/frontend/app/surfaces.css` | Added `.role-toggle-group` (flex layout for the pill pair). Added `.submission-body` (mono-font styled `<pre>` for the submission content rendered inside the role-striped card). |
| `docs/checkpoints/route-3-submission.md` | This file. |

No changes to atoms.css. No changes to `ConceptCheckDisplay`, `VerificationForm`, `VerificationResultDisplay`, or `voice-capture.tsx` — those are deeper component internals, parked per "Skipped vs. spec" §1 below.

---

## Atoms each surface consumes

Per spec §3.2:

| Element | Atom |
|---|---|
| Back-link | `.back-link` (kept verbatim as surface) |
| Evidence-report breadcrumb (instructor view only) | `.back-row__link` (kept verbatim as surface) |
| Page eyebrow `// SUBMISSION` | `.eyebrow` |
| H1 | raw `<h1>`, surfaces.css — see §"Skipped vs. spec" item 2 for the heading-text decision |
| Submitted-at label + student id (instructor) | `<span className="eyebrow eyebrow--muted">` |
| Content hash chip | `<HashChip hash={submission.contentHash} label="content" prefix={7} />` |
| Role toggle group | two `<Pill as="link" active={...}>` with `href` to the same route + opposite `?role` |
| Submission body card | `<section className="card role-{view}">` with `.submission-body` `<pre>` |
| Submission eyebrow | `// YOUR SUBMISSION` (student view) or `// STUDENT SUBMISSION` (instructor view) |
| Concept-checks section eyebrow | `.eyebrow` |
| Concept-checks card | `<section className="card role-{view}">` wrapping `<ConceptCheckDisplay>` |
| Provenance section eyebrow | `.eyebrow` |
| Provenance disclosure | `.disclosure` (surface, not atom — per spec) |
| Provenance hash chips | `<HashChip>` for content hash + policy hash inside the disclosure body |
| Error banner | `<div className="banner banner--error" role="alert">` |
| Skeleton card | `<section className="card card--skeleton">` |

---

## URL-accessible states

All four URLs return HTTP 200. Submission id can be any string; `?state=empty` injects a `DEMO_SUBMISSION` stub locally so the route renders without a backend.

| State + role | URL |
|---|---|
| **Loaded, student view** (uses stub data — no backend needed) | http://localhost:3000/submissions/demo?state=empty |
| **Loaded, instructor view** (same stub data, instructor stripe + eyebrows) | http://localhost:3000/submissions/demo?role=instructor&state=empty |
| **Loading, either role** | http://localhost:3000/submissions/demo?state=loading |
| **Loaded, live backend** | http://localhost:3000/submissions/{id} (requires backend on :4000 + the submission id to exist; falls into not-found branch on mismatch) |
| **Not found** | Any submission id the backend rejects — exercises the `.banner.banner--error` branch with the role-mode hint |

The `DEMO_SUBMISSION` stub uses a verbatim cellular-respiration answer body matching the spec §3.1's "Cellular respiration converts glucose into ATP…" example.

---

## Visually intentional things that might look like bugs

1. **H1 reads "Your Submission Review" / "Student Submission Review" — not the assignment title.** Spec §3.1 shows the H1 as `Cellular respiration — short answer` (the assignment title). The `Submission` type does not include the assignment title; getting it requires a cascading `getStudentAssignment(submission.assignmentId)` call after the submission loads. Track A v1 ships the generic heading; see "Skipped vs. spec" §2.
2. **Two pill role toggle — one active, one navigable.** Click STUDENT VIEW or INSTRUCTOR VIEW to flip the `?role=` param. The URL changes; the page re-renders with the new role stripe color + eyebrow copy. Both pills look like real buttons but render as `<a>` elements (Pill `as="link"` → Next.js `<Link>`). Mobile (<768px): the pair wraps via `flex-wrap: wrap` per TSS2 resolution (stacked pills, not `<Select>` — `<Select>` deferred to Track B).
3. **Role stripe matches the active view.** Student view → cyan `.role-student` stripe on every card. Instructor view → forest-green `.role-instructor` stripe. Eyebrow copy follows: `// YOUR SUBMISSION` vs `// STUDENT SUBMISSION`, etc.
4. **Submission content renders in a styled `<pre>` inside the card**, not in a disclosure. Spec §3.1 puts the submission body in a primary card, not collapsed behind a toggle. Long submissions wrap via `white-space: pre-wrap; word-break: break-word`.
5. **Submitted-date is uppercase inside the eyebrow** (`// SUBMITTED MAY 12, 2026`), not the lowercase ISO timestamp the old chrome rendered. This matches the spec's all-caps eyebrow convention; the actual full ISO timestamp lives in the HashChip's hover title and in the provenance disclosure.
6. **Provenance disclosure is collapsed by default** and lives inside a role-striped card. Spec §3.1 doesn't enumerate it, but it's load-bearing for evidence-chain verification — keeping it consistent with the route's role-stripe + eyebrow pattern.
7. **No `primary-action-card` ("Jump to checks" / "Open evidence report") in the new layout.** The old route shipped a custom "above the fold" action card to nudge students toward generating concept checks. Spec §3.1's flat layout doesn't include it; the page's natural flow (submission → concept checks → submit) replaces the explicit nudge. Easier to evaluate the spec without the extra surface; can be reintroduced if pilot feedback wants it.
8. **`ConceptCheckDisplay` inside the concept-checks card still uses its existing multi-set collapsible chrome** — disclosures per set, per-attempt verification rows nested inside. Spec §3.1 shows a flatter per-question card layout. The current rendering is more capable (handles multiple verification attempts, multiple regenerated sets) but doesn't match the spec exactly. See "Skipped vs. spec" §1.

---

## Skipped vs. spec — resolved or parked

1. **`ConceptCheckDisplay` flat-layout restructure — PARKED** as `docs/future-phases.md` Entry 3 (Concept-check flow flat-layout refactor) with Q1–Q3 open decisions for founder spec'ing. The existing multi-set collapsible chrome ships in Track A v1; the per-question-card / TYPE-VOICE-toggle / single-SUBMIT-button restructure rides Entry 3.
2. **H1 generic-text issue — RESOLVED in this close-out.** H1 now reads `assignment.policy.title` via a chained `getStudentAssignment` / `getAssignment` fetch. Falls back to skeleton-inside-H1 during the in-between state. Heading landmark stays in the DOM at all times (route 2 H1-stability pattern).
3. **Voice-mode toggle (TYPE · 🎤 VOICE) per question — PARKED** as part of Entry 3, DOD2. Voice capture still works at the component level (`voice-capture.tsx` unchanged); the user-facing per-question toggle becomes prominent when Entry 3 ships.
4. **Single SUBMIT FOR VERIFICATION primary button — PARKED** as part of Entry 3, DOD4.
5. **`VerificationResultDisplay` pre-atoms styling — PARKED** as part of Entry 3. Per-question status pill rebase to the `<StatusPill>` atom rides the same refactor.

---

## Ready for manual review — sign-off ask

Open the URLs at desktop and a narrow mobile width (~375px) in BOTH student view and instructor view. Confirm:

- [ ] **Loaded, student view, desktop (`?state=empty`):** Back-link → // SUBMISSION eyebrow → H1 "Your Submission Review" → hash chip row (// SUBMITTED MAY 12, 2026 + content hash chip) → STUDENT VIEW pill active (cyan), INSTRUCTOR VIEW pill inactive → submission body card with cyan stripe + // YOUR SUBMISSION eyebrow → // CONCEPT CHECKS eyebrow → concept-checks card with cyan stripe → // PROVENANCE eyebrow → collapsed Hash pins disclosure.
- [ ] **Loaded, instructor view, desktop (`?role=instructor&state=empty`):** Same composition; cards switch to forest-green `.role-instructor` stripe; STUDENT VIEW pill inactive, INSTRUCTOR VIEW pill active; submission eyebrow reads "// STUDENT SUBMISSION"; back-row also shows "→ Open evidence report" breadcrumb. Eyebrow row adds "// STUDENT {id-prefix}".
- [ ] **Loaded, student view, mobile:** Layout collapses cleanly; role toggle pills wrap to a second line if needed; no horizontal scroll; submission body wraps via `pre-wrap`.
- [ ] **Loaded, instructor view, mobile:** Same as above; stripe and eyebrows still reflect instructor role.
- [ ] **Loading, either role:** Back-link renders; // SUBMISSION eyebrow renders; `<h1>` is present in the DOM with a skeleton-line nested inside (verified via curl-inspect — see below); skeleton card body + // CONCEPT CHECKS eyebrow + second skeleton card render. Pattern matches route 2's loading state.
- [ ] **Not found:** Back-link renders; // SUBMISSION eyebrow; H1 "Submission not found"; `.banner.banner--error` with role-mode hint copy; helper paragraph linking to the opposite role mode.
- [ ] **Role toggle navigation works:** clicking STUDENT VIEW from instructor view (or vice versa) updates the `?role=` param and re-renders with the new stripe + eyebrows.

**Loading-state H1 stability — already verified via `curl + grep <h1>`:**

```
<h1><span class="skeleton-line skeleton-line--wide" aria-busy="true"
    aria-label="Loading submission"></span></h1>
```

The heading element is present in the DOM during loading; the skeleton-line sits inside it. Same pattern as route 2. Screen readers still find the heading landmark.

Reply **signed** or list flagged issues.

- If the five "skipped vs. spec" items feel too far from the spec to sign route 3 in its current state, the natural follow-up is a third future-phases entry: "Concept-check flat-layout refactor" (parking items 1, 3, 4, 5) plus a small fix for item 2 (H1 assignment title). Both can be scoped together.
- If you want the assignment-title H1 (item 2) before sign-off, that's a one-shot fix in the same PR — say so and I'll add the cascading fetch + flag the chained-call latency cost in this checkpoint.

After sign-off, all three Track A routes have shipped. The next step is consolidating the future-phases entries that accumulated over the build (Entry 2 plus a new concept-check flat-layout entry) and confirming Track A is closed for Phase 4 QA hand-off.
