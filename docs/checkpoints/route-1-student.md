# Route 1 Checkpoint — `/student` (assignment list)

> **Status:** SIGNED 2026-05-17 (desktop + mobile both confirmed). Eyebrow `//` prefix dropped pre-Track-A signoff — the three eyebrows on this page now read `STUDENT WORKSPACE`, `ASSIGNMENT`, `EMPTY STATE` without the `//` prefix. See `docs/decisions.md` for the revision entry.
> **Spec:** [`docs/track-a-screen-specs.md`](../track-a-screen-specs.md) §1
> **Date:** 2026-05-17

---

## Files changed

| Path | Change |
|---|---|
| `src/frontend/app/student/page.tsx` | Added three `.eyebrow` elements (page-level `// STUDENT WORKSPACE`, per-card `// ASSIGNMENT`, empty-state `// EMPTY STATE`). Refactored empty-state from inline-styled `<p><strong>...</strong></p>` to semantic `empty-state__headline / __body / __action` classes. Added `role="alert"` to error banner and `aria-busy / aria-label / aria-hidden` to skeleton cards. |
| `src/frontend/app/surfaces.css` | Added `.assignment-card .eyebrow` margin override (tight to title). Added `.empty-state__headline / __body / __action` rules to back the new semantic classnames. |
| `docs/track-a-screen-specs.md` | New file. Canonical Deliverable 3 spec extracted from the prior signed session transcript, with CL1, CL2, TSS1–3 folded in. |
| `docs/checkpoints/route-1-student.md` | This file. |

No changes to atoms.css, no new atoms, no new dependencies.

---

## Atoms each surface consumes

Per spec §1.2:

| Element | Atom |
|---|---|
| Page header eyebrow `// STUDENT WORKSPACE` | `.eyebrow` |
| H1 "Your assignments" | raw `<h1>`, styled in surfaces.css |
| Page subtitle | raw `<p className="page-sub">`, surfaces.css |
| Each assignment row | `<li className="card card--interactive role-student">` |
| Card-internal eyebrow `// ASSIGNMENT` | `.eyebrow` |
| Card title | raw `<div className="assignment-card__title">`, surfaces.css |
| Verification-mode tag | `<Pill as="span">` |
| Policy hash chip | `<HashChip hash={policy.policyHash} prefix={7} label="policy" />` |
| "Final answer restricted" flag (conditional) | `<Pill as="span">` |
| OPEN affordance | `<span className="assignment-card__open-cue">` styled as a CTA (NOT a real `<Button>` — see §"Skipped vs. spec" below) |
| Back link in empty state | `.back-link` |
| Error banner | `<div className="banner banner--error" role="alert">` |
| Skeleton card | `<section className="card card--skeleton role-student">` + two `<span className="skeleton-line">` children |

---

## URL-accessible states

All three states return HTTP 200. Open each in your browser at both desktop (≥1024px) and a narrow mobile viewport (~390px).

| State | URL | Branch in `page.tsx` |
|---|---|---|
| **Loaded** | http://localhost:3000/student | Calls `listStudentAssignments()`. Requires backend on `http://localhost:4000` to be running (the dev server can't fake this — without the backend, you'll see the loading skeleton followed by the empty/error state). For visual review, easiest is the empty + loading URLs below; if you have the backend up, this shows the full populated list. |
| **Empty** | http://localhost:3000/student?state=empty | `readStateOverride()` forces `items=[]`. Shows the single empty-state card. |
| **Loading** | http://localhost:3000/student?state=loading | `readStateOverride()` leaves `items=null` permanently. Shows three skeleton cards. |

The `?state=` overrides are wired in `readStateOverride()` ([`page.tsx:15-20`](../../src/frontend/app/student/page.tsx)) explicitly for demo / visual-review use. They're inert in any non-browser context.

---

## Visually intentional things that might look like bugs

1. **Skeleton cards have a horizontal shimmer animation.** A pale gradient sweeps across each `.skeleton-line` every 1.2s on a linear loop. This is `@keyframes acta-skeleton-shimmer` in atoms.css. If the shimmer were missing the loading state would look static / broken. With `prefers-reduced-motion: reduce`, the shimmer collapses to a static `--bg-elevated` block — also intentional per spec §1.7.
2. **Banner mount slides in over ~180ms.** When the error banner appears, it uses `@keyframes acta-banner-mount` (`--duration-base --ease-out-snap`). This is by design — the banner is meaningful state, the small entrance animation pulls the eye. Phase 0 motion catalog.
3. **HashChip flashes briefly on mount.** First render of each policy hash chip applies a one-shot signal-color flash to draw attention to the hash (the verification provenance). Subtle, ~180ms. Intentional per atoms.css.
4. **Three skeleton cards on `?state=loading` — not one, not five.** Spec §1.7 calls for exactly three. The number is deliberate (it sets the eye's expectation for "a few rows incoming," not "tens").
5. **`OPEN →` cue is uppercase signal-green and shifts to ink on hover** (`.card--interactive:hover .assignment-card__open-cue`). The hover transition is the affordance — without it the cue might read as decorative text rather than an action.
6. **Empty state has only a back-link, no primary CTA.** Spec §1.6: "no primary CTA — the path forward is on the instructor, not the student." Adding a "Get assignments" button would be wrong — it implies the student can fix this themselves, they can't.
7. **Page-level eyebrow `// STUDENT WORKSPACE` replaces the old `.workspace-badge--student` pill.** The pill rule still lives in surfaces.css (line 816) — orphan, harmless cascade-wise. It can be deleted in a sweep when Track B touches that section.
8. **Card-internal eyebrow margin is tightened.** `.assignment-card .eyebrow { margin: 0 0 var(--space-1) }` overrides the global `.eyebrow { margin: 0 0 var(--space-2) }` because inside the link block the eyebrow sits hard against the title; the default 8px gap reads loose.

---

## Skipped vs. spec — resolved

1. **`<Button variant="ghost">OPEN →</Button>` in §1.5 — RESOLVED.** Founder signed off on the current styled-span treatment (`.assignment-card__open-cue`) for Track A v1. The literal `<button>` element refactor is tracked as a horizontal cleanup in [`docs/future-phases.md`](../future-phases.md) Entry 2 ("Card-as-button refactor"). When that lands, every list-style card across Acta gets the structural refactor in one scoped pass — `/student`, `/student/[id]` step 4, instructor lists (Track B), ledger (Track C).
2. **Mobile-stack at <768px — RESOLVED.** Media query landed in `surfaces.css`. At <768px the `.assignment-card__open-cue` claims a full flex-basis (100%), drops `margin-left: auto`, and gains an 8px top margin. Meta row pills (verification-mode, hash chip, optional restrict flag) wrap naturally. Title row, role stripe, corner ticks, empty-state and loading-state cards are unaffected. Re-confirm at a narrow window before final sign-off.
3. **TOP NAV redesign per G11** (spec §1.1's first line) is not re-verified by this checkpoint. The G11 redesign was Phase 1 step 8; assumed shipped per `decisions.md`. If the top nav doesn't show `[ACTA] // HOME · INSTRUCTOR · STUDENT + session pill`, it's a Phase 1 regression, not a route 1 issue.

---

## Ready for manual review — sign-off ask

Open all three URLs at desktop and a narrow mobile width. Confirm:

- [ ] **Loaded (desktop):** STUDENT WORKSPACE eyebrow above H1; assignment cards each show ASSIGNMENT eyebrow + title + verification-mode pill + policy hash chip + OPEN → cue; left-edge cyan stripe visible on each card.
- [ ] **Loaded (mobile):** same composition, single column, no horizontal scroll. (Known gap: CTA does not yet stack below title — see §"Skipped vs. spec" item 2.)
- [ ] **Empty (desktop):** single card with EMPTY STATE eyebrow + "No assignments yet." headline + muted body paragraph + back-link.
- [ ] **Empty (mobile):** same, card fits viewport.
- [ ] **Loading (desktop):** three identical skeleton cards with horizontal shimmer; H1 + subtitle visible above; no error banner.
- [ ] **Loading (mobile):** same.

Reply with **signed** or list flagged issues. If item 2 (mobile stack) is the only gap, say "sign with mobile-polish followup" and I'll add the media query before moving to route 2.
