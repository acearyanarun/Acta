# Track B Screen Specs (Instructor Surfaces) — Deliverable 4

> **Status:** DRAFT for sign-off, 2026-05-18.
> Phase 0 + Track A lessons folded into §0 before any screen detail.
> Scope: five routes — `/instructor`, `/instructor/[id]`, `/instructor/[id]/edit`, `/instructor/new`, `/instructor/dashboard` — plus four embedded form/data components and one new atom group (TextField, Checkbox, Radio, DataTable).

---

## 0. Deltas applied (Track A learnings folded in)

These were resolved during Track A and apply uniformly to Track B; they are NOT open for relitigation.

### LA1 — Eyebrow has no `//` prefix
Established in the Track A pre-signoff revision (`docs/decisions.md`, 2026-05-17). Every `.eyebrow` element renders as plain uppercase tracked-mono label (e.g. `INSTRUCTOR WORKSPACE`, `BASICS`, `AI HELP POLICY`). Bracketed CTAs (`[ EDIT POLICY ]`) and bracketed stepper-like numbering remain as specced; the `//` was the one pattern that read as developer-tool syntax to non-technical buyers.

### LA2 — H1 stability across all states
Every route's H1 element stays in the DOM at all times. During the loading state, a `<span class="skeleton-line skeleton-line--wide">` nests INSIDE the `<h1>` rather than replacing it. Screen readers still find the heading landmark. Phase 0 §6 a11y floor — pattern locked at Route 2 sign-off and confirmed on Route 3.

### LA3 — Mobile breakpoint discipline
Three breakpoints, same as Track A:

```
1024px and above:   default layout
768px – 1023px:     tablet adjustments
375px – 767px:      mobile adjustments
below 375px:        not supported (falls through to mobile, may overflow)
```

Tables on `/instructor/dashboard` need explicit mobile treatment — see §4.3.

### LA4 — Role stripe arbitration
Every content card on an instructor-scoped route carries `.role-instructor` (forest-green left stripe). The shared `/submissions/[id]` route already honors view-driven arbitration (Track A §3.3). All Track B cards default to `.role-instructor` because every Track B route IS instructor-scoped.

### LA5 — Skipped-spec parking discipline
Any deviation from this spec is either resolved in-PR or parked as a future-phases entry with a definition of done. No silent deferrals. The Track A horizontal cleanup pass ([`docs/future-phases.md`](future-phases.md) Entry 2) already absorbs the Track-A-touched-but-deferred items; Track B's analogous parking lot is §10 of this spec.

### LA6 — `?state=` URL overrides for visual review
Every Track B page.tsx that has loaded/empty/loading branches plumbs a `readStateOverride()` helper that reads `?state=empty | ?state=loading` from the URL. Stub data is local to the file (matches the Track A pattern); review uses these URLs to inspect non-default branches without a backend.

---

## Atom prerequisites — Phase 1.5

**Track B implementation cannot start until the four atoms below ship.** They were stubbed but not built during Phase 1 per Track A spec §6.2.

| Atom | Used by | Why required |
|---|---|---|
| `<TextField>` | AssignmentForm (title), ReferenceSolutionSection (single-line fields) | Single-line text input with D1 attribute allowlist |
| `<Checkbox>` | AiHelpPolicyControl (5 per-type rows) | Form-level multi-select; needs ARIA + disabled state |
| `<Radio>` (group) | AssignmentForm (master AI-help toggle), VerificationModeSelector (3-card group) | Mutually-exclusive choice with `role="radiogroup"` |
| `<DataTable>` (CSS atom — class-only) | `/instructor/dashboard` three tables | Promoted from the existing `.dashboard-table` surface class to `.data-table` in atoms.css so Track C (ledger) inherits |

**Existing atoms reused:** `<Button>`, `<TextArea>`, `<Pill>`, `<StatusPill>`, `<HashChip>`, `.eyebrow`, `.card` (+ `.card--skeleton`, `.skeleton-line`), `.banner` (all variants), `.role-instructor`.

**Still deferred (NOT in Track B):** `<Select>` — Track B does NOT use it. AssignmentForm's selection patterns (master toggle, verification mode) are radio groups; the dashboard does NOT include filter controls in this scope. `<Select>` remains parked for Track C or whenever first needed.

### A.1 `<TextField>` spec

```typescript
type TextFieldProps = {
  name: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'url' | 'tel' | 'search';
  // D1 allowlist
  autoComplete?: string;
  autoFocus?: boolean;
  pattern?: string;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'url' | 'search' | 'tel';
  min?: number; max?: number; step?: number;
  minLength?: number; maxLength?: number;
  readOnly?: boolean;
  spellCheck?: boolean;
  disabled?: boolean;
};
```

Renders the same `.field` / `.field__label` / `.field__wrap` / `.field__control` DOM structure as `<TextArea>`. The cursor-blink pseudo-caret pattern (D3, gated on `:placeholder-shown`) applies. No `inputProps` escape hatch.

### A.2 `<Checkbox>` spec

```typescript
type CheckboxProps = {
  name: string;
  label: ReactNode;            // allows inline strong/pill
  helper?: ReactNode;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  hardRule?: boolean;          // adds .checkbox--hard-rule styling + inline "hard rule" pill
};
```

Wraps the native `<input type="checkbox">` with a custom-rendered visible box, the native input visually hidden but still focusable for accessibility. Per Phase 0 a11y floor: the native checkbox is the click target; the label is `<label>`-wrapped for click-anywhere activation. Disabled state visually mutes both the box AND the label text — matches the AiHelpPolicyControl's "AI help disabled → all rows muted" pattern.

**`hardRule` variant — LOCKED semantics (Step 2 sign-off, 2026-05-18):**

The `hardRule` prop is **visual differentiation only** — slightly heavier border (`--border-width-strong` 2px instead of hairline 1px) and signal-color check fill when checked. **No semantic weight differences from default Checkbox:** no confirmation tooltip, no sticky focus, no interaction guards, no `aria-required` escalation, no per-click confirmation modal.

Rationale:
- The AI help policy is set during assignment authoring (a deliberate flow with a final Publish gate).
- Friction at individual-toggle time is friction without value; the gate is at publish time.
- Visual weight signals "this is policy authoring chrome" without changing interaction.

A `hardRule` checkbox is just a checkbox with a heavier border and an inline `hard rule` pill next to its label. Any future enforcement (confirmation step, sticky focus) lives at the form level, not the atom level.

### A.3 `<Radio>` and `<RadioGroup>` spec

```typescript
type RadioGroupProps = {
  name: string;
  label: string;                  // legend for the fieldset
  value: string;
  onChange: (next: string) => void;
  ariaLabel?: string;
  layout?: 'stack' | 'grid';      // stack = vertical, grid = mode-card style
  children: ReactNode;            // <Radio> items
};

type RadioProps = {
  value: string;
  label: ReactNode;
  helper?: ReactNode;
  disabled?: boolean;
};
```

`<RadioGroup>` renders a `<fieldset>` with `<legend>`. Each `<Radio>` is a native `<input type="radio">` + `<label>` pair. The `mode-card` visual (large card with selected-state border, currently in surfaces.css) becomes the `layout="grid"` variant. The default `layout="stack"` is the master-toggle visual.

### A.4 `.data-table` CSS atom

Promote the existing `.dashboard-table` to `.data-table` in atoms.css. Keeps the same DOM shape (`<table>` with `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`). Mobile behavior: at <768px, the table converts to a card list — each row renders as a `.card.role-instructor` with the column headers as inline labels. The conversion is purely CSS-driven via `display: block` on `tr`/`td` plus `data-label` attributes injected by surface code. See §4.3 for the locked mobile transform pattern and §B for the label-formatting rule.

### A.5 `<StatusPill kind="workflow">` — LOCKED color mapping (TSS-B1 + ADD 3 resolution)

The workflow variant maps four workflow states to the locked tokens below. Track C ledger inherits this mapping; **Track B implementation must not invent additional values or change the colors.**

| `value` | Color token | Rationale |
|---|---|---|
| `submitted` | `--quiet` (ink blue) | Informational — work has arrived, nothing more |
| `in_progress` | `--quiet` (ink blue) | Informational — system is doing something |
| `complete` | `--signal` (forest green) | Affirmative — terminal-state success |
| `pending` | `--text-muted` (warm gray) | Neutral — waiting on an external action |

**Default token is `--quiet` ink blue (informational), NOT `--signal` forest green (affirmative).** Workflow states are NOT outcomes. Forest green is reserved for terminal-state success (`complete`). This pairs with TSS-B1's `kind="workflow"` adoption and prevents the visual ambiguity that would result from using `--signal` for in-flight states.

`StatusPill kind="verification"` retains its existing color mapping (`pass`/`needs_review`/`fail` → `--signal`/`--warn`/`--error` respectively); the workflow variant is additive, not a replacement.

---

## 1. Route — `/instructor` (assignment list)

### 1.1 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ TOP NAV                                                           │
├──────────────────────────────────────────────────────────────────┤
│ INSTRUCTOR WORKSPACE                          (Eyebrow)           │
│ Assignments                                   (h1, --type-2xl)    │
│ Create a policy, then review what students    (p, --type-md muted)│
│ submit.                                                            │
│                                                                   │
│ [Button: ghost] REVIEW DASHBOARD                                  │
│ [Button: primary] CREATE ASSIGNMENT POLICY                        │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ ┌─                                                          ─│ │   ← corner ticks
│ │   ASSIGNMENT                                                 │ │
│ │   Cellular respiration — short answer                        │ │
│ │                                                              │ │
│ │   [HashChip: policy v3]  [Pill: Confidence score]            │ │
│ │   updated 2026-05-17 10:24                                   │ │
│ │                                                              │ │
│ │   [OPEN →]                                                   │ │
│ │ └─                                                          ─│ │
│ └──────────────────────────────────────────────────────────────┘ │
│ … (more cards)                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Atoms composed

| Element | Atom |
|---|---|
| Page eyebrow `INSTRUCTOR WORKSPACE` | `.eyebrow` |
| H1 "Assignments" | raw `<h1>`, surfaces.css |
| Page subtitle | raw `<p className="page-sub">`, surfaces.css |
| Header action — Review Dashboard | `<Button variant="ghost">REVIEW DASHBOARD</Button>` (link styled as button — same pattern as Track A's `[ OPEN TA LAB → ]`) |
| Header action — Create | `<Button variant="primary">CREATE ASSIGNMENT POLICY</Button>` |
| Each assignment row | `<li className="card card--interactive role-instructor">` |
| Card eyebrow `ASSIGNMENT` | `.eyebrow` |
| Card title | raw `<div className="assignment-card__title">`, surfaces.css |
| Policy version chip | `<HashChip hash={policy.policyHash} prefix={7} label={`policy v${policy.policyVersion}`} />` (per C3 contract; replaces `VersionBadge`) |
| Verification-mode tag | `<Pill as="span">` |
| Updated-at text | raw `<span>`, surfaces.css `.assignment-card__meta` |
| OPEN affordance | `<span className="assignment-card__open-cue">OPEN →</span>` (same Track A treatment — styled span, not real button, per future-phases Entry 2) |
| Error banner | `<div className="banner banner--error" role="alert">` |

### 1.3 Role stripe + eyebrow placement

- Page level: `INSTRUCTOR WORKSPACE` eyebrow above H1, replacing today's `.workspace-badge--instructor` block.
- Card level: every assignment card gets `.role-instructor` modifier (forest-green stripe). Card-internal `ASSIGNMENT` eyebrow tells the user what kind of row.
- The two header CTAs are NOT inside cards — they're page-chrome and don't need eyebrows.

### 1.4 BrainAssistant placement

None on this route. No TA context.

### 1.5 Copy changes (per Track A G10/SS3 convention)

| Where | Today | After | Risk |
|---|---|---|---|
| Workspace badge | `Instructor Workspace` (pill) | `INSTRUCTOR WORKSPACE` (eyebrow) | Visual only |
| Header CTA — dashboard | "Review dashboard" | "REVIEW DASHBOARD" (uppercase) | Visual only |
| Header CTA — create | "Create assignment policy" | "CREATE ASSIGNMENT POLICY" (uppercase) | Visual only |
| Card open-affordance | (current: no visible button, whole card is a Link) | Visible `<span class="assignment-card__open-cue">OPEN →</span>` | Same pattern as Track A `/student` list |
| Loading | `Loading…` plain text | Three `.card.card--skeleton.role-instructor` rows | Same pattern as Track A |

### 1.6 Empty state

When `listAssignments()` returns `[]`:

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌─                                                              ─│ │
│   EMPTY STATE                                                    │
│                                                                   │
│   No assignments yet.                                             │
│                                                                   │
│   Create your first policy to set instructions, AI-help rules,   │
│   and verification mode.                                          │
│                                                                   │
│   [Button: primary] CREATE ASSIGNMENT POLICY                     │
│ └─                                                              ─│ │
└──────────────────────────────────────────────────────────────────┘
```

Unlike `/student` (where the empty-state action is `← Back to home`), `/instructor` empty state has a primary CTA — the instructor CAN fix this by creating an assignment.

- Single `.card.role-instructor` with corner ticks
- `.eyebrow` reads `EMPTY STATE`
- Headline + body in `--text-muted`
- `<Button variant="primary">CREATE ASSIGNMENT POLICY</Button>`

### 1.7 Loading state

Per LA3: three `.card.card--skeleton.role-instructor` rows, each with two `<span class="skeleton-line">` children. Page eyebrow + H1 + subtitle render immediately above. Header CTAs render immediately.

---

## 2. Route — `/instructor/[id]` (assignment detail)

This is Track B's signature route. Heavy — current implementation is 276 lines with five disclosures, two banners, status checklist, two embedded sections (submissions list + reference solution). The Track B spec preserves the information density but rebases all chrome onto atoms.

### 2.1 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ TOP NAV                                                           │
├──────────────────────────────────────────────────────────────────┤
│ [back-link] ← Back to assignments                                 │
│ [back-row__link] → Open review dashboard                          │
│                                                                   │
│ INSTRUCTOR WORKSPACE                                              │
│ Cellular respiration — short answer            (h1, --type-2xl)   │
│ POLICY v3 · #7964f79 · [Pill: Confidence score]                   │
│                                                                   │
│ [Button: primary] EDIT POLICY                                     │
├──────────────────────────────────────────────────────────────────┤
│ [if historical version]                                           │
│ <Banner --policy>Viewing historical version 2. This is no longer  │
│                  the active policy. [link: Back to current]</Banner>│
│                                                                   │
│ [if no Solution Guide]                                            │
│ <Banner --policy>                                                 │
│   Add a Solution Guide                                            │
│   Strengthens concept-check generation and grading.               │
│   [Button: primary inline] ADD SOLUTION GUIDE                     │
│ </Banner>                                                         │
├──────────────────────────────────────────────────────────────────┤
│ STATUS                                                            │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ STATUS                                                        │  │
│ │ Assignment policy             [StatusPill: pass] Done · v3   │  │
│ │ Student AI help               [StatusPill: pass] Enabled     │  │
│ │ Instructor Solution Guide     [StatusPill: warn] Missing     │  │
│ │ Student submissions           [count: 12] view ↓             │  │
│ └─────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│ STUDENT SUBMISSIONS                                               │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ STUDENT SUBMISSIONS                                           │  │
│ │ (SubmissionList renders here)                                 │  │
│ └─────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│ SOLUTION GUIDE                                                    │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ SOLUTION GUIDE                                                │  │
│ │ Trusted evaluation context. Students never see this content.  │  │
│ │ (ReferenceSolutionSection renders here)                       │  │
│ └─────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│ POLICY DETAILS                                                    │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ POLICY DETAILS                                                │  │
│ │ <details> Instructions / <hint>what the student will see</hint> │
│ │ <details> Rubric / <hint>grading criteria</hint>                │
│ │ <details> AI help policy / <hint>state</hint>                   │
│ │ <details> Verification mode / <hint>mode label</hint>           │
│ │ <details> Provenance & version history / <hint>hash pins</hint> │
│ └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Atoms composed

| Element | Atom |
|---|---|
| Back row | `.back-link` + `.back-row__link` (kept verbatim as surface) |
| Page eyebrow `INSTRUCTOR WORKSPACE` | `.eyebrow` |
| H1 | raw `<h1>` |
| Policy hash row | `<span className="eyebrow eyebrow--muted">POLICY v{n}</span>` + `<HashChip>` + `<Pill as="span">{modeLabel}</Pill>` |
| Edit CTA | `<Button variant="primary">EDIT POLICY</Button>` (link-styled-as-button) |
| Historical banner | `<Banner variant="policy">` (replaces `.historical-banner`) |
| Solution-guide nudge | `<Banner variant="policy">` with inline `<Button variant="primary" size="md">` (replaces `.nudge-banner`) |
| Section eyebrows (STATUS, STUDENT SUBMISSIONS, SOLUTION GUIDE, POLICY DETAILS) | `.eyebrow` |
| Status checklist card | `<section className="card role-instructor">` (replaces `.task-card`) |
| Status row | `<div className="card-row">` (NEW surface class — see §2.4) |
| Status row pill | `<StatusPill kind="verification" value={"pass"\|"warn"\|"info"}>` |
| Submission rows (instructor view) | `SubmissionList` already rebased in Track A — reuse |
| Solution-guide card | `<section className="card role-instructor">` wrapping `ReferenceSolutionSection` |
| Policy-details card | `<section className="card role-instructor">` wrapping the five `<details>` disclosures |
| Each disclosure | `.disclosure` (kept verbatim as surface per Track A spec §2.2) |
| Disclosure-internal hash chips | `<HashChip>` for policy hash, content hash in provenance |
| Version-history rows | series of `.card-row` items (one per version) inside the provenance disclosure |
| Error banner | `<Banner variant="error">` |
| Skeleton step body | `<section className="card card--skeleton role-instructor">` |

### 2.3 Role stripe + eyebrow placement

- Page level: `INSTRUCTOR WORKSPACE` eyebrow above H1.
- Section level: every section card carries `.role-instructor` (forest-green stripe). The card-internal eyebrow (`STATUS`, `STUDENT SUBMISSIONS`, `SOLUTION GUIDE`, `POLICY DETAILS`) tells the user what's inside.
- Banners (historical, solution-guide-nudge) do NOT carry role stripe — they're chrome, not content sections. Banners get their own variant styling.

### 2.4 New surface helper — `.card-row`

The current `.task-card__row` pattern (key-value row inside a card body) is generic and needed for both the status checklist on `/instructor/[id]` and the dashboard summary cards on `/instructor/dashboard`. Promote it to a surface helper in `surfaces.css`:

```
.card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--divider);
}
.card-row:last-child {
  border-bottom: none;
}
.card-row__label { color: var(--text-muted); }
.card-row__value { font-weight: var(--weight-strong); display: flex; gap: var(--space-2); align-items: center; }
```

Not promoted to atoms.css — it's surface-level glue. If Track C ledger also wants it, then promotion is justified.

### 2.5 BrainAssistant placement

None on this route. No TA context.

### 2.6 Copy changes (per Track A G10/SS3)

| Where | Today | After | Risk |
|---|---|---|---|
| Workspace badge | `Instructor Workspace` pill | `INSTRUCTOR WORKSPACE` eyebrow | Visual only |
| Edit CTA | "Edit policy" | "EDIT POLICY" (uppercase) | Visual only |
| Status section H2 | `Status` | `STATUS` eyebrow + card | Visual only |
| Submissions section H2 | `Student submissions` | `STUDENT SUBMISSIONS` eyebrow + card | Visual only |
| Solution Guide section H2 | `Instructor Solution Guide` | `SOLUTION GUIDE` eyebrow + card | **Flag**: shortens label. "Instructor" qualifier is implicit on this route. |
| Solution-guide nudge | "Add a Solution Guide" + "Strengthens concept-check generation and grading. Visible to instructors only." | Same copy, but wrapped in `<Banner variant="policy">` | Visual only |
| Historical-version banner | `Viewing historical version 2. This is no longer the active policy.` | Same copy, but wrapped in `<Banner variant="policy">` | Visual only |
| Status pills | mix of `.task-card__state--done` / `--missing` color classes | `<StatusPill kind="verification">` with mapped values (done→pass, missing→warn, enabled→pass, disabled→warn) | Visual only — semantic mapping is the same |

### 2.7 Empty / partial states

| State | Trigger | Treatment |
|---|---|---|
| **No submissions yet** | `submissions.length === 0` | Inside STUDENT SUBMISSIONS card: `<Banner variant="policy">No student submissions yet.</Banner>` (per Track A §2.7 pattern) |
| **No Solution Guide** | `reference === null` | Top-level Solution-guide nudge banner + the SOLUTION GUIDE card body renders the ReferenceSolutionSection's empty/draft state |
| **Historical version** | `version !== current` | Top-level historical banner + the rest of the page renders read-only (existing logic preserved) |
| **No older versions** | `versions.length <= 1` | Version-history row list inside provenance disclosure hides; only the current-version metadata renders |

### 2.8 Loading state

Per LA3: top nav + back-row render immediately. Page eyebrow + H1 + hash row render with skeleton lines for H1 and chip (route 2 pattern). All four major section cards (STATUS, STUDENT SUBMISSIONS, SOLUTION GUIDE, POLICY DETAILS) render as `.card.card--skeleton.role-instructor` placeholders. Edit CTA renders as a disabled `<Button>` shimmer.

---

## 3. Routes — `/instructor/new` + `/instructor/[id]/edit` (paired form routes)

The two routes share `<AssignmentForm>` and ship as a paired refactor. The wrappers themselves are thin (28 and 49 lines today); the work is in §6.1 below.

### 3.1 Wrapper layout (both routes)

```
┌──────────────────────────────────────────────────────────────────┐
│ TOP NAV                                                           │
├──────────────────────────────────────────────────────────────────┤
│ [back-link] ← Back to assignment(s)                               │
│                                                                   │
│ INSTRUCTOR WORKSPACE                                              │
│ New assignment policy            (new) or                         │
│ Edit policy — {title}            (edit)                           │
│ Define instructions, AI-help     (new) or                         │
│ Saves a new version. Older       (edit)                           │
│ submissions keep their original policy.                           │
├──────────────────────────────────────────────────────────────────┤
│ <AssignmentForm /> (renders 4 sections — see §6.1)                │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Atoms composed at the wrapper level

| Element | Atom |
|---|---|
| Back link | `.back-link` |
| Page eyebrow | `.eyebrow` reading `INSTRUCTOR WORKSPACE` |
| H1 | raw `<h1>` — "New assignment policy" or "Edit policy — {title}" |
| Page subtitle | raw `<p className="page-sub">` |
| Form | `<AssignmentForm>` — see §6.1 |
| Error banner | `<Banner variant="error">` (replaces `.form-error` in this layer) |

### 3.3 Role stripe + eyebrow placement

Wrapper level: `INSTRUCTOR WORKSPACE` eyebrow only. The wrapper renders no cards itself; the form's four section cards (`<AssignmentForm>` internals) carry their own `.role-instructor` stripes.

### 3.4 BrainAssistant placement

None on either route. No TA context.

### 3.5 Copy changes

| Where | Today | After | Risk |
|---|---|---|---|
| Workspace badge | `Instructor Workspace` pill | `INSTRUCTOR WORKSPACE` eyebrow | Visual only |
| New-page H1 | "New assignment policy" | "New assignment policy" (unchanged — already sentence-case per Phase 0 G7) | None |
| Edit-page H1 | "Edit policy — {title}" | Same | None |
| New-page subtitle | "Define instructions, AI-help rules, and verification mode." | Same | None |
| Edit-page subtitle | "Saves a new version. Older submissions keep their original policy." | Same | None |
| Submit button | "Create assignment policy" / "Save new version" | uppercase: "CREATE ASSIGNMENT POLICY" / "SAVE NEW VERSION" | Visual only — see §6.1 |
| Cancel button | "Cancel" | "CANCEL" (uppercase) | Visual only |
| Loading state | `Loading…` plain text on edit page | Skeleton-inside-H1 + four `.card.card--skeleton.role-instructor` placeholders | Same pattern as route 2 |

### 3.6 Empty / partial states

| State | Trigger | Treatment |
|---|---|---|
| **New-page initial state** | always | Form renders with defaults (title empty, instructions empty, AI help enabled with sane defaults, mode "score") |
| **Edit-page loading** | `assignment === null` | Skeleton card placeholders for each form section |
| **Edit-page not found** | `getAssignment` throws | `<Banner variant="error">` with the error message, plus a back-link to `/instructor` |
| **Form submission in flight** | `saving === true` | Submit button enters loading state (`<Button loading>...`); textarea + inputs disable |
| **Form validation failure** | title or instructions blank | Submit button disables; no error message until submit attempted (passive validation) |

### 3.7 Loading state

Per LA3, the edit page is the only one with a loading state (new page has no fetch). H1 stays in DOM with skeleton-line nested inside until `getAssignment` resolves; four `.card.card--skeleton.role-instructor` placeholders represent the four form sections.

---

## 4. Route — `/instructor/dashboard` (data tables)

The data-density route. Three tables, two summary-card groups, two collapsible disclosures.

### 4.1 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ TOP NAV                                                           │
├──────────────────────────────────────────────────────────────────┤
│ [back-link] ← Back to assignments                                 │
│                                                                   │
│ INSTRUCTOR WORKSPACE                                              │
│ Teacher Review Dashboard                                          │
│ Review submissions and follow-up needs at a glance.               │
├──────────────────────────────────────────────────────────────────┤
│ ACTIVITY                                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                            │
│ │ 12       │ │ 47       │ │ 8        │                            │
│ │ Total    │ │ Total    │ │ Pending  │                            │
│ │ assignmts│ │ submissns│ │ checks   │                            │
│ └──────────┘ └──────────┘ └──────────┘                            │
├──────────────────────────────────────────────────────────────────┤
│ OUTCOMES                                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ 31 Passed│ │ 9 Needs  │ │ 7 Failed │ │ 4 Pending│               │
│ │          │ │ review   │ │          │ │ verifctn │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
├──────────────────────────────────────────────────────────────────┤
│ NEEDS ATTENTION                                                   │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ NEEDS ATTENTION                                               │  │
│ │ Stale items first.                                            │  │
│ │ <data-table>                                                  │  │
│ │   Assignment │ Student │ Status │ Latest │ Submitted │ Last │ │
│ │   ...                                                         │  │
│ │ </data-table>                                                 │  │
│ └─────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│ <details> RECENT SUBMISSIONS (12)                                 │
│ <details> RECENT VERIFICATION ATTEMPTS (8)                        │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Atoms composed

| Element | Atom |
|---|---|
| Back link | `.back-link` |
| Page eyebrow | `.eyebrow` |
| H1 "Teacher Review Dashboard" | raw `<h1>` |
| Subtitle | raw `<p className="page-sub">` |
| Group label (ACTIVITY, OUTCOMES) | `.eyebrow` (replaces `.dashboard-group__label` styling — same visual treatment, atomized) |
| Summary cards | `<section className="card role-instructor card--compact">` per metric (replaces `.dashboard-card`) with `.summary-card__value` (large mono number) and `.summary-card__label` (muted small) — see §4.4 |
| NEEDS ATTENTION section | `<section className="card role-instructor">` with `.eyebrow` + helper line + `.data-table` |
| Status pill in tables | `<StatusPill kind="...">` — see §4.5 mapping |
| Result pill in tables | `<StatusPill kind="verification">` |
| Provider tag in tables | `<Pill as="span">` |
| Hash columns (policy, reference) | `<HashChip prefix={7} label={`v${n}`}>` per C3 |
| Recent submissions disclosure | `.disclosure` (kept verbatim as surface) |
| Recent verifications disclosure | `.disclosure` (kept verbatim as surface) |
| Error banner | `<Banner variant="error">` |
| Skeleton state | `.card.card--skeleton.role-instructor` per summary-card group + per table |

### 4.3 Mobile behavior — tables convert to card lists (LOCKED pattern, TSS-B6 ADD 2)

**Founder decision (2026-05-18):** At <768px, every `.data-table` row converts to a stacked card with **full label/value pairs visible for every cell — no horizontal scroll, no "View details" CTA, no hidden columns.** Rationale: instructors don't care about phone-view page length if every piece of information is reachable without horizontal scroll or modals. Three candidates were considered:

- (a) **Stacked cards with full label/value pairs per row — every cell visible, accept page length cost** ← **LOCKED**
- (b) Horizontally-scrollable strip with column headers as eyebrows — rejected (introduces horizontal scroll)
- (c) Compact card with 2-3 important columns + "View details" CTA — rejected (hides data)

**Implementation:**

```css
@media (max-width: 767px) {
  .data-table,
  .data-table thead,
  .data-table tbody,
  .data-table tr,
  .data-table td { display: block; }
  .data-table thead { display: none; }   /* column headers hidden — labels inline per cell */
  .data-table tr {
    border: 1px solid var(--border);
    border-left-width: 2px;
    border-left-color: var(--role-instructor);
    margin-bottom: var(--space-3);
    padding: var(--space-3);
  }
  .data-table td { padding: var(--space-1) 0; }
  .data-table td:last-child { padding-bottom: 0; }
  .data-table td::before {
    content: attr(data-label);
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    letter-spacing: var(--track-eyebrow);
    text-transform: uppercase;
    display: block;
    margin-bottom: 2px;
  }
}
```

**Label-formatting rule (locked):**

1. **Every `<td>` MUST carry a `data-label` attribute** matching the column's `<th>` text (uppercase). Surface code generates these as part of the table render. Empty `data-label` is a build error.
2. **The label is uppercase tracked-mono** — same typography as `.eyebrow`. It reads as "STUDENT", "STATUS", "SUBMITTED" above each value, separated by `margin-bottom: 2px`.
3. **Action cells** (the column with "Review submission · Evidence report" links) get `data-label="ACTIONS"`. Even when the desktop `<th>` is empty (`aria-label="Action"`), the mobile label exists.
4. **Cells that render `null` / `—`** still emit the label. The pattern "LABEL: —" reads as missing-but-acknowledged, not skipped.
5. **Per-row stripe** is forest-green (`--role-instructor`) regardless of which Track B table renders. Tables on `/submissions/[id]/evidence-report` (Track C) will inherit this; the stripe matches the surface's role, not the row's entity, because **tables are always instructor-scoped chrome.** This is one of two exceptions to C5 (the other is the role toggle on `/submissions/[id]`).

**Mobile QA gates the dashboard checkpoint at <768px.** Every column in every Track B table must be readable as `LABEL\nVALUE` pairs in the rendered card. No truncation; long values wrap.

### 4.4 Summary card spec — replace `.dashboard-card`

Today `.dashboard-card` renders as a small box with a big number + label. Track B rebases to a `.card.role-instructor.card--compact` with two internal classes:

```
<section class="card role-instructor card--compact">
  <p class="eyebrow eyebrow--muted">PENDING CHECKS</p>
  <div class="summary-card__value">8</div>
</section>
```

The big number sits below the eyebrow; the label IS the eyebrow. Saves a row of vertical chrome and inherits the corner-tick / role-stripe pattern. `.card--compact` is an existing atom modifier (atoms.css line 180) — reduces padding.

### 4.5 StatusPill kind mapping for the dashboard

| Source enum | StatusPill kind | Value |
|---|---|---|
| `NeedsAttentionStatus.submitted_no_checks` | `verification` | maps to "info" — needs visual support (NEW StatusPill variant?) |
| `NeedsAttentionStatus.checks_no_verification` | `verification` | maps to "info" |
| `NeedsAttentionStatus.needs_review` | `verification` | "partial" |
| `NeedsAttentionStatus.fail` | `verification` | "insufficient" |
| `VerificationResult.pass` | `verification` | "sufficient" |
| `VerificationResult.needs_review` | `verification` | "partial" |
| `VerificationResult.fail` | `verification` | "insufficient" |

**Flag (TSS-B1):** StatusPill currently supports `kind="verification" | "perQuestion"`. The dashboard's `submitted_no_checks` and `checks_no_verification` statuses are NOT verification results — they're workflow states. Either:

- (a) Add a new `kind="workflow"` variant to StatusPill with `{ submitted, in_progress, complete, pending }` values
- (b) Use `<Pill as="span">` for these workflow states (lighter, no enum mapping)
- (c) Repurpose `kind="verification"` with neutral "info" / "neutral" values

Recommend (a) — gives StatusPill a clean workflow vocabulary; the dashboard isn't the only place workflow status will surface (Track C ledger likely needs it too).

### 4.6 Empty / partial states

| State | Trigger | Treatment |
|---|---|---|
| **No follow-up needed** | `needsAttention.length === 0` | Inside the NEEDS ATTENTION card: `<Banner variant="success">No follow-up needed right now.</Banner>` |
| **No recent submissions** | `recentSubmissions.length === 0` | Disclosure expanded shows `<Banner variant="policy">No student submissions yet.</Banner>` |
| **No recent verifications** | `recentVerifications.length === 0` | Disclosure expanded shows `<Banner variant="policy">No verification attempts yet.</Banner>` |
| **All summary numbers are 0** | brand new tenant | Summary cards still render (zeros are informative). No special empty state. |

### 4.7 Loading state

Per LA3: page header (eyebrow + H1 + subtitle) renders immediately. The two summary-card groups render as a row of `.card.card--skeleton.role-instructor.card--compact` placeholders (3 + 4 of them). NEEDS ATTENTION renders as a single full-width skeleton card. The two collapsed disclosures render normally (their bodies skeleton when expanded if data isn't ready).

---

## 5. Embedded component rebases

The forms and data-rich sub-components shared across Track B's five routes. Each gets a scoped refactor; surface routes inherit the rebased components.

### 5.1 `AssignmentForm` (currently 178 lines)

Used by `/instructor/new` and `/instructor/[id]/edit`. Four sections today (Verification mode, Basics, Rubric, AI help policy). After rebase:

**Section 1 — VERIFICATION MODE** (hero card per current pattern):

| Element | Today | After |
|---|---|---|
| Section wrapper | `.placeholder-card.placeholder-card--hero` | `<section className="card role-instructor card--hero">` with eyebrow `VERIFICATION MODE` (new modifier — adds slightly elevated visual emphasis) |
| Section H2 "Verification mode" | raw `<h2>` | Removed — eyebrow replaces |
| Helper text | `.section-helper` | Kept |
| Mode selector | `<VerificationModeSelector>` (raw radios + .mode-card classes) | `<RadioGroup layout="grid" name="verificationMode">` with three `<Radio value="score|gate|fail_only" label={meta.label} helper={meta.subtitle} />` items |

**Section 2 — BASICS:**

| Element | Today | After |
|---|---|---|
| Section wrapper | `.placeholder-card` | `<section className="card role-instructor">` with eyebrow `BASICS` |
| Title field | `.field` + raw `<input type="text">` | `<TextField name="title" label="Title" required maxLength={200} />` |
| Instructions field | `.field` + raw `<textarea rows={6}>` | `<TextArea name="instructions" label="Instructions" required rows={6} maxLength={20000} />` |

**Section 3 — RUBRIC (optional):**

| Element | Today | After |
|---|---|---|
| Section wrapper | `.placeholder-card` | `<section className="card role-instructor">` with eyebrow `RUBRIC (OPTIONAL)` |
| Rubric textarea | `.field` + raw `<textarea>` | `<TextArea name="rubric" label="Rubric" rows={4} placeholder="Optional grading criteria or policy text" />` |

**Section 4 — AI HELP POLICY:**

| Element | Today | After |
|---|---|---|
| Section wrapper | `.placeholder-card` | `<section className="card role-instructor">` with eyebrow `AI HELP POLICY` |
| Section H2 | raw `<h2>` | Removed |
| Master toggle | `<fieldset>` + two raw `<input type="radio">` | `<RadioGroup name="ai-help-enabled" layout="stack" label="Student AI help">` with two `<Radio value="enabled|disabled" label="Enabled\|Disabled" helper="..." />` items |
| Hint paragraph | `<p style="color:var(--muted)">` | `<p className="form-hint">` (uses `--text-muted` via surface class) |
| Per-type checkboxes | `<AiHelpPolicyControl>` (raw checkboxes) | `<AiHelpPolicyControl>` after §5.2 rebase |

**Form footer:**

| Element | Today | After |
|---|---|---|
| Cancel button | raw `<button class="btn btn--ghost">` | `<Button variant="ghost">CANCEL</Button>` |
| Submit button | raw `<button class="btn btn--primary">` with "Saving…" pending state | `<Button variant="primary" type="submit" loading={saving}>{submitLabel.toUpperCase()}</Button>` |
| Form-level error | `<p className="form-error">` | `<Banner variant="error" role="alert">` |
| Form-level note | `<p className="form-note">` | `<p className="form-hint">` |

### 5.2 `AiHelpPolicyControl` (currently 49 lines)

After rebase: a single `.ai-help-grid` container with five `<Checkbox>` atoms — one per `AI_HELP_LABELS` key. The "hard rule" row (`restrictFinalAnswer`) uses the `hardRule` prop which adds the "hard rule" pill inline with the label.

```
<div className="ai-help-grid">
  {ORDER.map((key) => (
    <Checkbox
      key={key}
      name={key}
      label={meta.label}
      helper={meta.helper}
      checked={value[key]}
      onChange={(next) => onChange({ ...value, [key]: next })}
      disabled={disabled}
      hardRule={key === 'restrictFinalAnswer'}
    />
  ))}
</div>
```

No new DOM structure — the existing `.ai-help-grid` / `.ai-help-row` classes can stay as surface chrome that wraps the Checkbox atom output. Alternatively, promote the grid layout into the Checkbox atom itself — TSS-B2 below.

### 5.3 `VerificationModeSelector` (currently 35 lines)

After rebase: a `<RadioGroup layout="grid">` with three `<Radio>` items. The `.mode-card` / `.mode-card--selected` visual moves into the `<Radio layout="grid">` styling. The 35-line component becomes 8 lines.

### 5.4 `ReferenceSolutionSection` (substantial component)

Today: complex draft/save flow with six textareas + version history list + collapsed/expanded states. Has its own `.reference-solution-section` chrome.

**Spec position:** Track B's surface composition layer rebases the OUTER chrome (eyebrow + role-striped card + atom-driven save buttons) but does NOT refactor the internal draft state machine. The six textareas convert to `<TextArea>` atoms in a separate pass — flagged as TSS-B3.

**Minimum Track B touch:**

- Outer `<section>` rebased from `.placeholder-card` to `.card.role-instructor` (handled at the parent route level — see §2.2)
- The save/cancel buttons inside the component rebase to `<Button>` atoms
- Error banners inside the component rebase to `<Banner variant="error">`
- Version-history "Save new version" → "SAVE NEW VERSION" (uppercase)

**Deferred to TSS-B3 resolution:** the six internal textareas → `<TextArea>` rebase + draft/saved state visual treatment.

### 5.5 `SubmissionList` (already rebased in Track A)

No changes. The component already consumes `.card.role-student` for student-view rows. For instructor view, the eyebrow + card stripe come from the parent route's section wrapping, not from `SubmissionList` itself.

**One inconsistency to flag — TSS-B4:** `SubmissionList` always renders `.role-student` cards. On `/instructor/[id]` (an instructor-scoped route), the cards should arguably carry `.role-instructor` instead. Three options:

- (a) Pass a `viewerRole` prop and have SubmissionList apply the matching role stripe per row
- (b) Drop the role stripe from SubmissionList rows entirely; the parent section's stripe is enough
- (c) Keep `.role-student` everywhere — the rows are STUDENT submissions, the stripe color matches the entity type, not the viewer

Recommend (c) — the stripe matches the entity (a student's work), regardless of which workspace is rendering it. Quick founder confirm.

---

## 6. Voice surface integration

**N/A for Track B.** No instructor surface integrates voice capture or TTS playback. The voice path is student-only (TA Lab, verification voice mode). Track B inherits Track A's voice surface integration unchanged.

---

## 7. Responsive breakpoints

Per LA3 (three breakpoints). Per-route deltas:

### 7.1 `/instructor` (list)

| Breakpoint | Change |
|---|---|
| 1024px+ | Default — single column, max-width 960px, header CTAs right-aligned |
| 768–1023px | Header CTAs stack to a new row beneath the H1 + subtitle |
| 375–767px | Cards shrink to viewport-32px; OPEN cue stacks below meta (same pattern as Track A `/student`) |

### 7.2 `/instructor/[id]` (detail)

| Breakpoint | Change |
|---|---|
| 1024px+ | Default — single column, max-width 960px |
| 768–1023px | Edit CTA moves below the policy hash row instead of right-aligned with H1 |
| 375–767px | Status row two-column layout collapses to stacked (label above value); banners reflow full-width |

### 7.3 `/instructor/new` + `/instructor/[id]/edit` (forms)

| Breakpoint | Change |
|---|---|
| 1024px+ | Default — single column, max-width 720px (forms are narrower than reading content) |
| 768–1023px | Same single column |
| 375–767px | Verification-mode grid (3 cards horizontal) collapses to stacked vertical; cancel/submit buttons stack |

### 7.4 `/instructor/dashboard` (data tables)

| Breakpoint | Change |
|---|---|
| 1024px+ | Default — summary cards in 3-column / 4-column grids, tables full-width |
| 768–1023px | Summary cards collapse to 2-column grid; tables remain horizontal-scroll-on-overflow |
| 375–767px | Summary cards collapse to 1-column; **data-tables convert to card-list layout** per §4.3 |

### 7.5 Top nav

Inherited from Phase 1 G11 redesign. No Track B changes.

---

## 8. Cross-route consistency contracts

Three existing contracts from Track A (C1, C2, C3) plus two new (C4, C5):

**C1 — Eyebrow above every section header.** Every `<h2>` and every card-internal heading is preceded by an `.eyebrow`. No bare H2s. (Track A C1.)

**C2 — Role stripe on every content card on role-scoped routes.** Every Track B card carries `.role-instructor` (forest-green). Track A's `.role-student` continues to apply on student-scoped routes. `/submissions/[id]` continues to flip per view toggle.

**C3 — HashChip wherever a hash is shown.** `VersionBadge` is rebased onto `<HashChip>` on `/instructor` and `/instructor/[id]`. No bare `<span>` rendering a hash anywhere in Track B.

**C4 — `<StatusPill>` for every enum-driven status surface.** Workflow status (NeedsAttentionStatus), verification result (VerificationResult), and per-question result (VerificationStatus) ALL render via `<StatusPill kind="..." value="...">`. No raw `.dashboard-pill` or `.verification-status--*` divs in surface code. The pill enum→variant mapping lives inside the StatusPill atom.

**C5 (NEW, locked Track B sign-off ADD 1) — Role stripe matches the entity's author, not the viewer's workspace.**

Student-authored entities (submissions, voice answers, concept-check responses) always carry `.role-student`. Instructor-authored entities (policies, assignments, evidence reports, instructor solution guide) always carry `.role-instructor`. Track C will need this for the evidence report — every row in the evidence-report assembly that quotes a student submission carries `.role-student`; every policy/reference-solution citation carries `.role-instructor`.

**Two explicit exceptions:**
1. **The role toggle on `/submissions/[id]`** flips the surface's stripe to match the active view (`?role=student` → all submission-view chrome stripes student; `?role=instructor` → all chrome stripes instructor). The toggle is the surface acting as a chameleon; the underlying entity (the student's submission) is unchanged.
2. **`.data-table` rows** always carry `--role-instructor` regardless of which entity is in the row. Tables are instructor-scoped chrome (dashboards, evidence-report assembly indices, ledger lists). See §4.3 label-formatting rule (5).

Outside these two exceptions, the stripe communicates whose work is on the surface, not who's looking at it. The principle is "I know whose voice is in this card without reading the eyebrow."

---

## 9. Phase 1.5 — atom build order

Track B implementation cannot begin until Phase 1.5 ships the four new atoms below. Estimated total: ~22 hours.

1. **`<TextField>` wrapper + `.field` cascade adjustments** (4 hours)
2. **`<Checkbox>` wrapper + `.checkbox` styles + hardRule variant** (5 hours)
3. **`<Radio>` + `<RadioGroup>` wrappers + `.radio` styles (stack + grid layouts)** (6 hours)
4. **`<StatusPill>` workflow variant + `.data-table` atom + mobile transform** (5 hours)
5. **Eyebrow + role-stripe + `.card--hero` polish for the new atoms** (2 hours)

Phase 1.5 ships before any Track B surface work begins. Same discipline as Phase 1 → Track A.

---

## 10. Sign-off — RESOLVED (2026-05-18)

Six TSS-B questions signed off; three additions (ADD 1, ADD 2, ADD 3) folded into the spec body.

**TSS-B1 — StatusPill workflow variant: RESOLVED → (a).** New `kind="workflow"` StatusPill variant added with locked color mapping per ADD 3 (see §A.5). Workflow states default to `--quiet` ink blue (informational), NOT `--signal` forest green (affirmative). Track C ledger inherits.

**TSS-B2 — AiHelpPolicyControl grid layout: RESOLVED → (a).** Surface wrapper for `.ai-help-grid`. No `<CheckboxGroup>` atom. The five checkboxes are independent toggles in a visual grid; grouping is layout not semantic.

**TSS-B3 — ReferenceSolutionSection internals: RESOLVED → (b).** Park as future-phases Entry 4. Track B v1 only touches the outer chrome (card + eyebrow + Buttons + Banner). When Entry 4 is written, it follows Entry 2's structure: anchor pattern (domain components wrapping multiple inputs but not yet migrated to atom-based input chrome) plus sub-items discovered during Track B + DoD.

**TSS-B4 — SubmissionList role stripe: RESOLVED → (a).** Always `.role-student` regardless of viewer. Codified as cross-route contract C5 (§8).

**TSS-B5 — SOLUTION GUIDE eyebrow: RESOLVED → (a).** Drop the "Instructor" qualifier. Context is structural — the section card body already explains.

**TSS-B6 — Dashboard table mobile transform: RESOLVED → (a).** Stacked cards with full label/value pairs visible for every cell. No horizontal scroll, no "View details" CTA. Page length cost accepted in exchange for full reachability. Pattern locked in §4.3.

**ADD 1 — Cross-route contract C5** (role stripe matches entity author) added to §8.

**ADD 2 — TSS-B6 dashboard table mobile transform** documented in §4.3 with the label-formatting rule.

**ADD 3 — Workflow StatusPill color mapping** locked in §A.5.

---

## 11. Phase 1.5 + Track B implementation plan

Phase 1.5 implementation begins per §9 build order. Five atom steps, ~22 hours. Same checkpoint discipline as Track A.

**Phase 1.5 atom checkpoints:**
1. `<TextField>` — `docs/checkpoints/phase-1.5-step-1-text-field.md`
2. `<Checkbox>` — `docs/checkpoints/phase-1.5-step-2-checkbox.md`
3. `<Radio>` + `<RadioGroup>` — `docs/checkpoints/phase-1.5-step-3-radio.md`
4. `<StatusPill kind="workflow">` + `.data-table` atom + mobile transform — `docs/checkpoints/phase-1.5-step-4-status-pill-data-table.md`
5. Eyebrow + role-stripe + `.card--hero` polish — `docs/checkpoints/phase-1.5-step-5-polish.md`

**Atom-checkpoint review approach:** atoms don't have URLs to render in isolation. Each atom checkpoint surfaces (i) the atom file path with the prop shape, (ii) the CSS class structure added to atoms.css, (iii) a temporary `/dev/atoms` playground route that mounts the atom in each of its variants (default, error, disabled, etc.) — manual review in browser. The playground route is deleted in step 5 before Track B surfaces ship.

**Track B surface checkpoints** (after Phase 1.5 closes):
1. `/instructor` (list) — `docs/checkpoints/route-4-instructor-list.md`
2. `/instructor/[id]` (detail) — `docs/checkpoints/route-5-instructor-detail.md`
3. `/instructor/new` + `/instructor/[id]/edit` (paired) — `docs/checkpoints/route-6-instructor-forms.md`
4. `/instructor/dashboard` — `docs/checkpoints/route-7-instructor-dashboard.md`

Five Phase 1.5 checkpoints + four Track B surface checkpoints = nine total before Track B sign-off.

---

## Files this spec touches (when implementation lands)

Wrapper routes:
- `src/frontend/app/instructor/page.tsx`
- `src/frontend/app/instructor/[id]/page.tsx`
- `src/frontend/app/instructor/[id]/edit/page.tsx`
- `src/frontend/app/instructor/new/page.tsx`
- `src/frontend/app/instructor/dashboard/page.tsx`

Embedded components:
- `src/frontend/components/assignment-form.tsx`
- `src/frontend/components/ai-help-policy.tsx`
- `src/frontend/components/verification-mode-selector.tsx`
- `src/frontend/components/reference-solution-section.tsx` (outer chrome only — TSS-B3)
- `src/frontend/components/version-badge.tsx` (rebases onto HashChip per C3)

New atoms (Phase 1.5):
- `src/frontend/components/atoms/text-field.tsx` (NEW)
- `src/frontend/components/atoms/checkbox.tsx` (NEW)
- `src/frontend/components/atoms/radio.tsx` + `radio-group.tsx` (NEW)

CSS:
- `src/frontend/app/atoms.css` — adds `.field` cascade for text-field, `.checkbox`, `.radio`, `.radio-group`, `.data-table` (promotion of `.dashboard-table`), `.card--hero` modifier
- `src/frontend/app/surfaces.css` — promotes `.card-row` from `.task-card__row`, deletes `.placeholder-card`/`.workspace-badge*` orphan rules, deletes `.dashboard-table` (now in atoms.css), deletes `.task-card*`, `.historical-banner`, `.nudge-banner`, `.dashboard-card*`, `.dashboard-pill*`, `.mode-card*`, `.ai-help-master*` rules that are now atom-driven

Tests:
- `tests/instructor-dashboard.test.ts` — string assertions update (e.g. "Review dashboard" → "REVIEW DASHBOARD")
- `tests/assignment-policy.test.ts` — same
- ~10–15 string assertions across the test suite per Track A's analogous pattern

Total estimated effort: Phase 1.5 ~22h + Track B surfaces ~28h = ~50 hours.
