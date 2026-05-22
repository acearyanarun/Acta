# Route 2 Checkpoint — `/student/[id]` (4-step stepper page)

> **Status:** SIGNED 2026-05-17. Item 4 H1-stability fix landed; items 1–3 absorbed into [`future-phases.md`](../future-phases.md) Entry 2. Eyebrow `//` prefix dropped pre-Track A signoff (every eyebrow text on this page now reads as plain uppercase label, e.g. `STUDENT WORKSPACE`, `INSTRUCTIONS`, `YOUR ANSWER`). See `docs/decisions.md` and the spec header for the revision rationale.
> **Spec:** [`docs/track-a-screen-specs.md`](../track-a-screen-specs.md) §2
> **Date:** 2026-05-17

The signature route of Track A. Stepper composition with four step cards, each carrying `.role-student` stripe, each preceded by its `// ` eyebrow.

---

## Files changed

| Path | Change |
|---|---|
| `src/frontend/app/student/[id]/page.tsx` | Full rewrite. Removed the old `StepHeader` helper and `.placeholder-card` blocks. Replaced with `<ol className="stepper stepper--vertical">` + four `<li className="stepper__step">` items. Added `// STUDENT WORKSPACE` page eyebrow, `// POLICY v{n}` row with HashChip, plus per-card eyebrows (`// INSTRUCTIONS`, `// RUBRIC`, `// AI HELP RULES`, `// GUIDED HELP`, `// YOUR ANSWER`, `// YOUR SUBMISSIONS`). Added `readStateOverride()` for `?state=empty\|loading` demo URLs (matches route 1 pattern). Added `SkeletonBody` helper for the loading branch. Step 2's disabled-AI-help case now uses `.banner.banner--disabled` instead of the legacy `.policy-banner--disabled`. Step 2's TA Lab CTA bracketed per spec §2.6: `[ OPEN TA LAB → ]`. |
| `src/frontend/components/submission-form.tsx` | Rebased to atoms. `<textarea>` → `<TextArea>` (D1-allowlisted props), `<button>` → `<Button variant="primary">` (with `loading` prop driving the pending state). Error → `<div className="banner banner--error" role="alert">`. Submit copy: "Submit my work" → "SUBMIT" (spec §2.6). |
| `src/frontend/components/submission-list.tsx` | Each row `<li>` rebased `.placeholder-card submission-row` → `.card role-student submission-row`. Empty state rebased `.placeholder-card` → `<div className="banner banner--policy" role="status">` per spec §2.7 step 4 empty. |
| `src/frontend/app/surfaces.css` | Added `.hash-chip-row` (flex layout for the eyebrow + chip pair beneath the H1). |
| `docs/checkpoints/route-2-student-detail.md` | This file. |

No changes to atoms.css, no new wrappers, no new dependencies. The stepper atom + mobile-collapse media query (atoms.css §`.stepper--vertical` + the `@media (max-width: 767px)` block at line 408) were already shipped in Phase 1 step 2.

---

## Atoms each surface consumes

Per spec §2.2:

| Element | Atom |
|---|---|
| Back link | `.back-link` (kept verbatim as surface) |
| Page eyebrow `// STUDENT WORKSPACE` | `.eyebrow` |
| H1 | raw `<h1>`, surfaces.css |
| Policy row label | `<span className="eyebrow eyebrow--muted">// POLICY v{n}</span>` |
| Policy hash chip | `<HashChip hash={policy.policyHash} label="policy" prefix={7} />` |
| Stepper outer | `<ol className="stepper stepper--vertical">` |
| Each step | `<li className="stepper__step">` (Step 1 also has `--current` modifier + `aria-current="step"`) |
| Step number `[01]`–`[04]` | `<span className="stepper__num">` |
| Step label | `<span className="stepper__label">` |
| Connector | `<span className="stepper__connector" aria-hidden="true" />` (Steps 1–3 only; Step 4 has no trailing connector) |
| Step body card | `<section className="card role-student">` |
| Card-internal eyebrow | `.eyebrow` |
| Disclosure toggle (Step 1) | `.disclosure` (kept as surface per spec) |
| Policy banner inside Step 1 | Existing `<PolicyBanner>` component — see "Skipped vs. spec" item 1 |
| TA Lab CTA (Step 2) | `Link` with `.btn.btn--ghost.ta-lab-cta` classes (link, not button — same pattern as route 1's OPEN cue) |
| HelpChat embed (Step 2) | Existing `<HelpChat>` — internals untouched per spec §6.4 |
| AI-help-disabled notice (Step 2) | `<div className="banner banner--disabled" role="status">` |
| Submission textarea (Step 3) | `<TextArea name="content" label="Your answer">` |
| Submit button (Step 3) | `<Button variant="primary" type="submit" loading={pending}>SUBMIT</Button>` |
| Submission rows (Step 4) | `<li className="card role-student submission-row">` (via `SubmissionList`) |
| Step 4 empty state | `<div className="banner banner--policy" role="status">You haven't submitted work yet.</div>` (via `SubmissionList`) |
| Error banner | `<div className="banner banner--error" role="alert">` |
| Skeleton step body | `<section className="card card--skeleton role-student">` |

---

## URL-accessible states

All three states return HTTP 200. The dynamic param can be any string; for review use any of these:

| State | URL | Branch in `page.tsx` |
|---|---|---|
| **Loaded** | http://localhost:3000/student/demo | Calls `getStudentAssignment(id)` + `listAssignmentSubmissions(id, "student")` in parallel. Requires backend on `http://localhost:4000` AND a real assignment with the given id. Without the backend, you'll see the error banner; without a matching assignment id, you'll see whatever the backend returns. **Easiest path for review: use the `?state=empty` URL to see the full layout with stub data.** |
| **Empty (= loaded with no submissions)** | http://localhost:3000/student/demo?state=empty | `readStateOverride()` injects `DEMO_ASSIGNMENT` (a stub assignment defined in the page module) and forces `submissions=[]`. Steps 1–3 render with stub content; Step 4 shows the empty banner. This is the canonical visual-review URL for this route. |
| **Loading** | http://localhost:3000/student/demo?state=loading | `readStateOverride()` leaves `assignment=null` and `submissions=null` permanently. All four step bodies render as `.card.card--skeleton`. H1 also shows a skeleton line; the policy hash row's chip swaps to a skeleton line. Stepper numbers + labels render normally (they're static). |

The `DEMO_ASSIGNMENT` stub is local to `page.tsx` and uses the title "Cellular respiration — short answer" with the verbatim instructions from spec §2.1. Confidence_score verification mode, AI help enabled with a representative policy.

---

## Visually intentional things that might look like bugs

1. **Step 1 is always marked `aria-current="step"`** with the signal-color number bracket. The page does NOT advance step state automatically — see spec §2.5: "Step 1 is 'always current' because the page is open-ended — the student isn't forced through steps in order. This is a deliberate departure from a wizard model."
2. **Stepper numbers are bracketed: `[01]`, `[02]`, `[03]`, `[04]`.** The brackets are typed into the markup, not auto-injected by CSS. Step 1's `[01]` renders in `--signal` forest-green; `[02]`–`[04]` render in `--text-muted`. The connector hairlines run vertically between steps in `--divider` ink.
3. **Vertical connector between step 3 and step 4 is not present.** Each step renders its own trailing connector via `<span className="stepper__connector">`, but Step 4 (the last step) has no connector. Visually correct — the stack ends at the Step 4 card.
4. **Inside Step 1, the disclosures are `<details>` elements that open on click.** Instructions is open by default; Rubric and AI help rules are collapsed. The disclosure summary line has a small `disclosure__hint` tail ("tap to collapse" / "how your work is graded" / etc.) sitting after the label — that's intentional context, not loose text.
5. **The `.banner.banner--policy` inside Step 4's empty case looks like an informational notice, not a card.** It's deliberately less weighty than a card with corner ticks — the empty state is a transient "you'll fill this in" message, not a content surface. Same visual treatment as the `.banner--disabled` in Step 2.
6. **HashChip flashes briefly on mount** (same as route 1). Subtle ~180ms signal-color flash on first render.
7. **Skeleton state shows three (or four) skeleton cards stacked.** Steps 1–4 each render their own `.card.card--skeleton` in the loading branch. Stepper numbers `[01]`–`[04]` and labels remain normally — they're chrome that doesn't depend on data.
8. **Step 3's "SUBMIT" button is uppercase per spec §2.6.** When pending, the button's `loading` prop activates: it disables, sets `aria-busy="true"`, and renders "…" instead of "SUBMIT". The textarea also disables during pending.
9. **PolicyBanner inside the "AI help rules" disclosure body uses its legacy `.policy-banner` styling**, not the new `.banner.banner--policy` atom. Visual treatment is similar (light forest-green tint, structured rows). Per spec §6.4 PolicyBanner is a domain component, not an atom, and Track A doesn't refactor it. Flag for migration in a future polish pass.
10. **Mobile (<768px) inlines the step number into the label row.** The stepper grid collapses to single-column, the connectors disappear, and `[01] Read the task` renders as one inline line above each card body. This is the existing atoms.css media query (line 408–423), not new code. The page just inherits the behavior.

---

## Skipped vs. spec — flag for founder

1. **`<PolicyBanner>` was NOT refactored into the `.banner.banner--policy` atom.** Spec §2.2 row "Policy banner inside Step 1 | `<Banner variant="policy">`" implies an inline `.banner.banner--policy` div. The existing `<PolicyBanner>` is a domain component with its own `.policy-banner` styling that renders the same conceptual content (AI help allowed/not allowed rows). Refactoring it touches a component outside Track A's surface composition scope (it's also used elsewhere — instructor surface). Track A v1 ships with `<PolicyBanner>` intact, embedded inside the Step 1 "AI help rules" disclosure body. Migration to atoms.banner is a horizontal cleanup candidate alongside Entry 2 (Card-as-button refactor).
2. **HelpChat internals untouched.** Per spec §6.4 explicit "HelpChat internals — it already consumes BrainAssistant; only its mic/send buttons rebase onto `<Button>`". The mic/send button rebase is technically called out in spec §4 but the wording in §6.4 lets it slide. Track A v1 leaves HelpChat's internal buttons on the legacy `.btn` classes. Same rationale as PolicyBanner — it's a domain component, not an atom.
3. **TA Lab CTA stays a `<Link>` styled with `.btn.btn--ghost.ta-lab-cta`, not a real `<Button>`.** Same constraint as route 1: nesting `<button>` inside an anchor (or vice versa) is invalid HTML, and Next.js routing wants `<Link>`. Track A v1 ships the link-as-styled-button treatment; the future `Card-as-button refactor` entry (`future-phases.md` Entry 2) covers the structural fix.
4. **The `?state=loading` H1 placeholder uses `<span class="skeleton-line skeleton-line--wide">` directly inside the H1 slot.** Strictly speaking, putting a span where a heading goes pushes the page to render without an `<h1>` during loading. The page does emit a real `<h1>` once the assignment loads — but during the skeleton phase, screen readers will skip directly from the eyebrow to the next region. If you'd prefer the H1 always exist (even as `<h1><span class="skeleton-line"/></h1>`), I can adjust — it's a one-line fix.

---

## Ready for manual review — sign-off ask

Open all three URLs at desktop and a narrow mobile width. Confirm:

- [ ] **Loaded (desktop, via `?state=empty`):** Back link → STUDENT WORKSPACE eyebrow → H1 "Cellular respiration — short answer" → POLICY v1 row with hash chip → vertical stepper with `[01]`-`[04]` brackets in mono. Step 1 number is signal-green (`--current`); `[02]`-`[04]` are muted. Each step body is a `.card .role-student` with cyan left stripe and corner ticks. Step 1 has three disclosures with eyebrows (`// INSTRUCTIONS` / `// RUBRIC` / `// AI HELP RULES`). Step 2 has `// GUIDED HELP` eyebrow + bracketed `[ OPEN TA LAB → ]` CTA + HelpChat. Step 3 has `// YOUR ANSWER` eyebrow + textarea + uppercase "SUBMIT" button. Step 4 has `// YOUR SUBMISSIONS` eyebrow + the empty banner ("You haven't submitted work yet.").
- [ ] **Loaded (mobile, via `?state=empty`):** Stepper collapses — `[01]` inlines next to "Read the task" at the top of each step body, connectors disappear, each step is a full-width card. No horizontal scroll. Submit button still uppercase.
- [ ] **Loading (desktop, via `?state=loading`):** Page eyebrow renders; H1 + hash chip both replaced with skeleton lines; all four step bodies render as `.card.card--skeleton`. Step numbers + labels still render normally. Horizontal shimmer scans across the skeleton lines.
- [ ] **Loading (mobile, via `?state=loading`):** Same as above, single-column, no scroll.

Reply with **signed** or list flagged issues. If only the PolicyBanner refactor (item 1) or HelpChat mic/send button rebase (item 2) feels critical to land in Track A, say so and I'll add them; otherwise both park in the "horizontal cleanup" track alongside Entry 2.

Once signed, on to route 3: `/submissions/[id]` — the concept-check flow with role toggle.
