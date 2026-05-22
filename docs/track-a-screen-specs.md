# Track A Screen Specs (Student Surfaces) — Deliverable 3

> **Status:** SIGNED 2026-05-12. Clarifications CL1, CL2 and TSS1–TSS3 resolutions folded in below. Phase 1 implementation has shipped per the §6.3 ship order; Track A surface work follows starting with §1 (`/student`).
>
> **Reconstruction note:** This file was committed to the repository on 2026-05-17 by extracting the spec body and signoff from the canonical session transcript (`local_9577c591-1297-4714-9afd-2b36d9ed86e8`). The signed content is unchanged from the original; only the header and §8 have been updated to reflect post-signoff status. CL1/CL2 are folded into §4 and §7 inline.
>
> **Track A pre-signoff revision 2026-05-17 — eyebrow `//` prefix dropped:** Every `// LABEL` eyebrow notation in this spec was reduced to plain `LABEL`. The `.eyebrow` class still renders the same uppercase tracked-mono treatment (signal color for default, muted for `--muted`); only the in-markup prefix was removed. Rationale: non-technical buyers (instructors, students) parse `//` as code syntax, not as a label separator. The uppercase tracked-mono treatment alone provides sufficient scaffolding. Other brutalist chrome — bracketed CTAs (`[ OPEN TA LAB → ]`), bracketed stepper numbers (`[01]`–`[04]`), corner ticks on cards — remains exactly as specced; the eyebrow `//` was the one pattern that read as developer-tool syntax. See `docs/decisions.md` for the full revision entry.
>
> **Scope:** three routes — `/student`, `/student/[id]`, `/submissions/[id]` — plus voice-surface integration, responsive breakpoints, and the Phase 1 atom prerequisite list.

---

## Clarifications applied at sign-off (2026-05-12)

**CL1 — Home-hero H1 exception (Track C, applied here for cross-reference):** The home hero H1 (per G12) stands alone without an eyebrow. Every other H1, H2, and card-internal heading carries one. Documented in §7 so Track C does not relitigate. All Track A surfaces honor C1 as written (eyebrow above every section header).

**CL2 — Voice-capture consent prose swap (§4):** The eyebrow above the voice-capture consent line carries the label-only text `PRIVACY` (not the privacy claim itself). The full privacy sentence lives in a sibling `<p>` styled with `--text-muted`, written in sentence-case prose. The eyebrow is decorative scaffolding; the privacy fact lives in the readable paragraph. Apply the same pattern anywhere else in Track A where a meaningful sentence got compressed into an eyebrow.

**TSS1 (resolved):** Skeleton/loading pattern in §1.7 + §2.8 + §3.7 ships as a sub-atom of Card. No `<Skeleton>` React wrapper. `.card--skeleton` and `.skeleton-line` stay as CSS-only patterns in atoms.css.

**TSS2 (resolved):** Option (b). Stacked pills at `<768px` on `/submissions/[id]` role toggle. `<Select>` stays deferred to Track B. Track A ships without Select.

**TSS3 (resolved):** Empty-state copy in §1.6 approved as written.

---

## 0. Deltas applied (locked before screen work)

### D1 — Field escape hatches narrowed
The three field wrappers each carry **only** their semantic-meaningful native attributes. No `inputProps`, no `style`, no `className` passthrough, no `data-*` spread.

| Wrapper | Allowlist (native HTML attrs forwarded) |
|---|---|
| `<TextField>` | `autoComplete`, `autoFocus`, `pattern`, `inputMode`, `min`, `max`, `step`, `minLength`, `maxLength`, `readOnly`, `spellCheck` |
| `<TextArea>` | `autoComplete`, `autoFocus`, `minLength`, `maxLength`, `readOnly`, `spellCheck`, `rows`, `wrap` |
| `<Select>` | `autoComplete`, `autoFocus`, `required` (already in base), `size` (visible option count) |

If a surface needs more, the wrapper spec changes — not the surface.

### D2 — Banner ARIA audit (role OR aria-live, never both)

Updated `<Banner>` a11y rule:

| Variant | Role | `aria-live` |
|---|---|---|
| `--policy` | `status` | (none — role implies polite) |
| `--drift` | `status` | (none — role implies polite) |
| `--refusal` | `status` | (none — role implies polite) |
| `--disabled` | `status` | (none — role implies polite) |
| `--success` | `status` | (none — role implies polite) |
| `--error` | `alert` | (none — role implies assertive) |

Phase 0 §6 A11y Floor matrix updated: the Banner row now reads "role only — alert for error, status elsewhere; no explicit aria-live anywhere."

### D3 — Cursor blink scoped to empty state
- The pseudo-caret on `<TextField>` and `<TextArea>` is **only visible** when the input matches `:placeholder-shown` (i.e. no user content)
- Once any character is typed, the pseudo-caret hides via the same selector; the native caret takes over
- This sidesteps wrap-line, RTL text, browser autofill, and IME composition collisions
- Reduced-motion: pseudo-caret renders as a static signal-color block (no blink)
- The keyframe definition (`@keyframes acta-cursor-blink`) lives in `atoms.css`; the rule that gates it on `:placeholder-shown` lives in the field's component CSS block

### SS1–SS4 — confirmed wrapper roster

**9 wrappers** total in `src/frontend/components/atoms/`:

```
button.tsx · text-field.tsx · text-area.tsx · select.tsx · checkbox.tsx ·
radio.tsx · pill.tsx · status-pill.tsx · hash-chip.tsx
```

Classname-only atoms: `Card`, `Panel`, `Eyebrow`, `Banner`, `Stepper`, `RoleStripe`.

§8 of Deliverable 2 is updated: **9 wrappers**, not 7.

---

## 1. Route — `/student` (assignment list)

### 1.1 Layout

Single-column page. Max-width 960px (current `.app-shell` width — unchanged). Vertical rhythm `--space-5` between sections.

```
┌──────────────────────────────────────────────────────────────────┐
│ TOP NAV  ← redesigned per G11 ([ACTA] HOME · INSTRUCTOR ·     │
│           STUDENT + session pill right)                          │
├──────────────────────────────────────────────────────────────────┤
│ [back-link]  ← Back to home                                       │
│                                                                   │
│ STUDENT WORKSPACE                          (Eyebrow)           │
│ Your assignments                              (h1, --type-2xl)    │
│ View the work your instructor has assigned    (p, --type-md muted)│
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ ┌─                                                          ─│ │   ← corner ticks
│ │   ASSIGNMENT                                              │ │
│ │   Cellular respiration — short answer                        │ │
│ │                                                              │ │
│ │   In your own words, explain how cellular respiration…       │ │
│ │                                                              │ │
│ │   [Pill: Confidence score]  [HashChip: #7964f79]   [Pill→]  │ │
│ │ └─                                                          ─│ │
│ └──────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │  (next assignment card — same shape)                          │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ … (more cards)                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Atoms composed

| Element | Atom |
|---|---|
| Page header eyebrow ("STUDENT WORKSPACE") | `.eyebrow` |
| Page title "Your assignments" | (raw `<h1>` styled via `surfaces.css`) |
| Page lede paragraph | (raw `<p>` styled via `surfaces.css`) |
| Each assignment row | `<section className="card role-student card--interactive">` |
| Card eyebrow ("ASSIGNMENT") | `.eyebrow` |
| Assignment title inside card | (raw `<h3>` styled in surface) |
| Verification mode tag ("Confidence score") | `<Pill as="span">` |
| Policy hash chip | `<HashChip hash={policy.policyHash} prefix={7} label="policy" />` |
| Continue arrow / open-link | `<Button variant="ghost" size="md">` (or the whole card wrapped in `<Link>` per §1.5) |
| Back link | `.back-link` (kept verbatim) |
| Error state | `<div className="banner banner--error">` |

### 1.3 Role stripe + eyebrow placement

- **Page level:** `STUDENT WORKSPACE` eyebrow sits above the H1, replacing today's `.workspace-badge--student` block.
- **Card level:** every assignment card gets `.role-student` modifier → 2px cyan left stripe. The card-internal `ASSIGNMENT` eyebrow communicates the row type.
- Effect: a column of cyan-striped cards under a STUDENT WORKSPACE banner reads as "this whole page is student-scope" without needing a tinted background.

### 1.4 BrainAssistant placement

**None on this route.** The brain only appears where there's a TA conversation or verification state. Listing assignments is pre-TA.

### 1.5 Copy changes (per G10 + SS3 — flagged for PR description)

| Where | Today | After | Risk |
|---|---|---|---|
| Page subtitle | "View the work your instructor has assigned. Open one to read instructions, get AI help, and submit your answer." | "View the work your instructor has assigned." | Trim — secondary detail moves to the cards |
| Card open-affordance | (the whole card is currently a `<Link>` with no visible button) | Visible `<Button variant="ghost">OPEN →</Button>` in card footer, **keep** the card itself as a `<Link>` for accessibility (whole-card click target) | UX: clearer affordance |
| Workspace label | `Student Workspace` (badge) | `STUDENT WORKSPACE` (eyebrow) | Visual only — no analytics impact |

### 1.6 Empty state

When `listStudentAssignments()` returns `items: []`:

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌─                                                              ─│ │
│   EMPTY STATE                                                 │
│                                                                   │
│   No assignments yet.                                             │
│                                                                   │
│   Your instructor hasn't published anything to your workspace.    │
│   When they do, it'll appear here.                                │
│                                                                   │
│   [← Back to home]                                                │
│ └─                                                              ─│ │
└──────────────────────────────────────────────────────────────────┘
```

- Single `.card` with corner ticks
- `.eyebrow` reads `EMPTY STATE`
- One-line headline (sentence case, not uppercase)
- One-line body in `--text-muted`
- One `.back-link` (no primary CTA — the path forward is on the instructor, not the student)

### 1.7 Loading state

While the fetch is in flight:

- The page-header block renders immediately (eyebrow + H1 + lede) — these don't depend on data
- Below it: **three skeleton cards** rendered at 80px height each with a single `.skeleton-line` placeholder
- Skeleton uses `.card .card--skeleton` — same corner ticks, but background dims to `--bg-base` and contents are replaced by 2 `<span class="skeleton-line">` blocks (one wide, one narrow)
- Animation: a horizontal shimmer scans across each skeleton line via a 1.2s `--ease-linear` keyframe (`@keyframes acta-skeleton-shimmer` — lives in atoms.css alongside the cursor-blink keyframe)
- Reduced-motion: shimmer collapses to a static `--bg-elevated` block

> **New atom:** `.card--skeleton` modifier + `.skeleton-line` helper. Added to atoms.css. Not a wrapper — just a CSS pattern surfaces opt into. No new React wrapper.

---

## 2. Route — `/student/[id]` (4-step stepper page)

### 2.1 Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ TOP NAV                                                           │
├──────────────────────────────────────────────────────────────────┤
│ [back-link]  ← Back to assignments                                │
│                                                                   │
│ STUDENT WORKSPACE                          (Eyebrow)           │
│ Cellular respiration — short answer           (h1, --type-2xl)    │
│ policy v1 · #7964f79                          (HashChip row)      │
├──────────────────────────────────────────────────────────────────┤
│ STEPPER (vertical)                                                │
│                                                                   │
│ [01]  Read the task                                               │
│  │    ┌──────────────────────────────────────────────────────┐   │
│  │    │ INSTRUCTIONS         [toggle: show/hide]           │   │
│  │    │ In your own words, explain how cellular…              │   │
│  │    │                                                       │   │
│  │    │ RUBRIC               [toggle]                      │   │
│  │    │ Correct if the student names the three stages…        │   │
│  │    │                                                       │   │
│  │    │ AI HELP RULES        [toggle]                      │   │
│  │    │ (PolicyBanner consumes <Banner variant="policy">)     │   │
│  │    └──────────────────────────────────────────────────────┘   │
│  │                                                                │
│ [02]  Ask for help                                                │
│  │    ┌──────────────────────────────────────────────────────┐   │
│  │    │ GUIDED HELP                                        │   │
│  │    │ Help follows the instructor's rules.                  │   │
│  │    │                                                       │   │
│  │    │ [Button variant="ghost"] OPEN TA LAB →                │   │
│  │    │                                                       │   │
│  │    │ HelpChat component (BrainAssistant header included)   │   │
│  │    └──────────────────────────────────────────────────────┘   │
│  │                                                                │
│ [03]  Submit your work                                            │
│  │    ┌──────────────────────────────────────────────────────┐   │
│  │    │ YOUR ANSWER                                        │   │
│  │    │ <TextArea label="Your answer" name="content" …/>      │   │
│  │    │                                                       │   │
│  │    │ [Button variant="primary"] SUBMIT                     │   │
│  │    └──────────────────────────────────────────────────────┘   │
│  │                                                                │
│ [04]  Review your submissions                                     │
│       ┌──────────────────────────────────────────────────────┐   │
│       │ YOUR SUBMISSIONS                                   │   │
│       │ (list of <Card> rows, each with submitted-at + open) │   │
│       └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Atoms composed

| Element | Atom |
|---|---|
| Page eyebrow | `.eyebrow` |
| Policy hash row | `<HashChip hash={policy.policyHash} label="policy" />` + a plain `POLICY v{n}` eyebrow span |
| Stepper outer | `<ol className="stepper stepper--vertical">` |
| Each step | `<li className="stepper__step">` (with `--current` modifier on the active step) |
| Step number | `<span className="stepper__num">[01]</span>` |
| Step label | `<span className="stepper__label">` |
| Connector between steps | `<span className="stepper__connector" aria-hidden="true" />` |
| Step body card | `<section className="card role-student">` |
| Card eyebrow | `.eyebrow` |
| Disclosure toggle | (kept verbatim — `.disclosure` is a surface, not an atom) |
| Policy banner inside Step 1 | `<Banner variant="policy">` |
| Open TA Lab CTA | `<Button variant="ghost">` |
| HelpChat | (existing component — internals not re-touched in Track A; consumes Button + TextArea via the new chat-input dock) |
| AI-help-disabled notice | `<Banner variant="disabled">` |
| Submission textarea | `<TextArea name="content" label="Your answer" …/>` |
| Submit button | `<Button variant="primary" type="submit">` |
| Submission list | series of `.card` rows under Step 4 |

### 2.3 Role stripe + eyebrow placement

- **Page level:** `STUDENT WORKSPACE` eyebrow above H1 (same pattern as `/student`)
- **Step level:** each step's body card gets `.role-student` → 2px cyan left stripe; the eyebrow inside (`INSTRUCTIONS`, `YOUR ANSWER`) tells the user what kind of content
- The stepper itself (numbers + connectors) is **not** striped — it's chrome, not content

### 2.4 BrainAssistant placement

Inside Step 2's card, **delegated to** `<HelpChat>`:
- Brain header already lives at top of HelpChat (shipped in the conversational-brain-ta build)
- States idle / thinking / responding / speaking driven by HelpChat's own state machine
- The TA Lab CTA above HelpChat is the "premium" entry point; HelpChat itself remains the inline experience

### 2.5 Step state semantics

The stepper communicates progress via `aria-current="step"` on the active step and visual treatment:

| Step state | Visual | aria |
|---|---|---|
| current (always step 1 at page load) | num bracket signal color, body card stays at default border | `aria-current="step"` |
| inactive | num bracket `--text-muted`, body card unchanged | no aria-current |

The page does NOT advance step state automatically. Step 1 is "always current" because the page is open-ended — the student isn't forced through steps in order. This is a deliberate departure from a wizard model.

### 2.6 Copy changes (per G10 + SS3 — flagged for PR description)

| Where | Today | After | Risk |
|---|---|---|---|
| Workspace badge | `Student Workspace` | `STUDENT WORKSPACE` eyebrow | Visual only |
| Step 1 disclosure label | `Instructions` / `Rubric` / `AI help rules` | Same, with `// ` eyebrow prefix above each disclosure body | None — augmentative |
| Step 2 helper | "Help follows the instructor's rules." | Same | None |
| TA Lab CTA | "Open TA Lab →" | `[ OPEN TA LAB → ]` (bracketed) | Visual only — same href |
| Step 3 button | "Submit your work" inside SubmissionForm | "SUBMIT" (uppercase, mono) | **Flag**: changes the submit-button copy. No analytics event tied to label string per `api-client.ts` |
| Step 4 helper | "Open a submission to generate concept checks and answer them." | Same | None |

### 2.7 Empty state per step

| Step | Empty condition | Treatment |
|---|---|---|
| 1 (Read) | Never empty (always has instructions) | n/a |
| 2 (Ask) | `aiHelpEnabled === false` | Replaces HelpChat with `<Banner variant="disabled">AI guided help is disabled for this assignment.</Banner>` + a one-line muted footnote "Continue to Step 3 to submit your work." |
| 3 (Submit) | First-time submission — no prior submission exists | TextArea renders normally; no empty-state UI needed (the empty TextArea IS the empty state) |
| 4 (Review) | `submissions.length === 0` | `<Banner variant="policy">You haven't submitted work yet.</Banner>` inside the Step 4 card |

### 2.8 Loading state

While `getStudentAssignment + listAssignmentSubmissions` are in flight (parallel `Promise.all`):

- Top nav + back-link render immediately
- Page-header block (eyebrow + H1 + hash chip row) — H1 and hash row render as skeleton lines until assignment resolves
- All four step bodies render as `.card .card--skeleton` placeholders (matching the live shape)
- Stepper numbers `[01]`–`[04]` and labels render normally (they're static)

If only `submissions` is pending (the assignment landed first):
- Steps 1–3 render fully
- Step 4 shows the skeleton card

---

## 3. Route — `/submissions/[id]` (concept-check flow with role toggle)

### 3.1 Layout

This route is **shared** — both student and instructor can land here. The role-toggle in the breadcrumb area is the existing UI for switching views.

```
┌──────────────────────────────────────────────────────────────────┐
│ TOP NAV                                                           │
├──────────────────────────────────────────────────────────────────┤
│ [back-link] ← Back to assignment                                  │
│ [back-row__link] View evidence report →                           │
│                                                                   │
│ SUBMISSION                                                     │
│ Cellular respiration — short answer                               │
│ submitted 2026-05-12 · #c0nten78                                  │
│                                                                   │
│ [Pill toggle group:  STUDENT VIEW · INSTRUCTOR VIEW]              │
│  (role toggle — same component pattern as today)                  │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ YOUR SUBMISSION (or STUDENT SUBMISSION for instructor) │ │
│ │ ┌─                                                          ─│ │
│ │   "Cellular respiration converts glucose into ATP…"           │ │
│ │ └─                                                          ─│ │
│ └──────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│ CONCEPT CHECKS                                                 │
│                                                                   │
│ [if no set generated:]                                            │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ NO CHECKS YET                                              │ │
│ │ Generate three short questions grounded in your answer.       │ │
│ │ [Button variant="primary"] GENERATE CONCEPT CHECKS            │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ [if set exists:]                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ QUESTION 1 / 3                                             │ │
│ │ "You wrote that glycolysis produces a small amount of ATP…"   │ │
│ │                                                                │ │
│ │ YOUR ANSWER  [Pill toggle: TYPE · 🎤 VOICE]                │ │
│ │ <BrainAssistant state inline if voice active>                  │ │
│ │ <TextArea name="answer-q1" label="Your answer">                │ │
│ │   or                                                           │ │
│ │ <voice-capture component when voice mode active>               │ │
│ │                                                                │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ QUESTION 2 / 3                                             │ │
│ │ (same shape)                                                   │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ QUESTION 3 / 3 (same shape)                                │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ [Button variant="primary"] SUBMIT FOR VERIFICATION                │
├──────────────────────────────────────────────────────────────────┤
│ [if verification result exists:]                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ VERIFICATION RESULT                                        │ │
│ │ <StatusPill kind="verification" value="needs_review" />       │ │
│ │ #v3ri51c                                                       │ │
│ │ ┌─                                                          ─│ │
│ │   Overall feedback paragraph…                                  │ │
│ │ └─                                                          ─│ │
│ │ PER QUESTION                                                │ │
│ │ Q1 <StatusPill kind="perQuestion" value="sufficient" /> body  │ │
│ │ Q2 <StatusPill kind="perQuestion" value="partial" /> body     │ │
│ │ Q3 <StatusPill kind="perQuestion" value="insufficient" /> bod │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Atoms composed

| Element | Atom |
|---|---|
| Back-link + breadcrumb link | `.back-link`, `.back-row__link` (kept verbatim as surface) |
| Page eyebrow | `.eyebrow` |
| Submission timestamp + content hash | `<HashChip hash={submission.contentHash} label="content" />` |
| Role toggle group | two `<Pill as="button" active={role === "student"}>STUDENT VIEW</Pill>` |
| Submission body card | `<section className="card">` with role-stripe matching the current view |
| Concept-checks section eyebrow | `.eyebrow` |
| "No checks yet" empty | `.card` with `.eyebrow` + body + `<Button variant="primary">` |
| Each question card | `.card` |
| Question eyebrow ("QUESTION N / 3") | `.eyebrow` |
| Type/Voice toggle | two `<Pill as="button" active={modality === "voice"}>` pills in a group |
| BrainAssistant when voice mode active | (existing component, slot remains in `verification-form.tsx`) |
| Verification answer textarea (text mode) | `<TextArea name={`answer-${q.id}`} label="Your answer">` |
| Voice capture (voice mode) | (existing `voice-capture.tsx` component — see §4) |
| Submit-for-verification CTA | `<Button variant="primary">` |
| Result block | `.card` + `<StatusPill kind="verification">` + `<HashChip>` + per-question rows with `<StatusPill kind="perQuestion">` |
| Drift / refusal banners | `<Banner variant="drift">` / `<Banner variant="refusal">` |

### 3.3 Role stripe + eyebrow placement

- This route is **role-aware**: the role toggle drives which stripe color applies.
- When `view === "student"`: every card carries `.role-student` (cyan stripe), eyebrow reads `YOUR SUBMISSION`, `YOUR ANSWER`, etc.
- When `view === "instructor"`: every card carries `.role-instructor` (signal-green stripe), eyebrow reads `STUDENT SUBMISSION`, `STUDENT ANSWER`, etc.
- The role toggle itself sits in the page-header band, not in any card.
- The toggle does **not** change the URL — it's a local view state. Refreshing the page returns to student view.

### 3.4 BrainAssistant placement

The brain appears in **two** places on this route:

1. **Inside each question card** when modality === `voice`: slot lives above the voice-capture controls. Same 8-state machine; states driven by `voice-capture.tsx`'s recorder lifecycle.
2. **Inside the verification result block** when verification was performed with voice answers: a small static brain icon at the top of the result card (NOT animated — just a glyph) to indicate "this attempt included voice answers." This is informational only; the brain stays in `idle` state.

### 3.5 Copy changes (per G10 + SS3 — flagged for PR description)

| Where | Today | After | Risk |
|---|---|---|---|
| Role toggle labels | `Student view` / `Instructor view` (current text) | `STUDENT VIEW` / `INSTRUCTOR VIEW` (uppercase mono) | Visual only |
| Verification CTA | "Submit for verification" (current button) | `SUBMIT FOR VERIFICATION` (uppercase) | Visual only |
| Voice toggle | `Type` / `🎤 Voice` | `TYPE` / `🎤 VOICE` (uppercase, emoji kept) | Visual only |
| "Generate concept checks" CTA | (current button copy preserved) | `GENERATE CONCEPT CHECKS` | Visual only |
| Verification result heading | "Verification result" | `VERIFICATION RESULT` eyebrow + body | Visual only |
| **Flag**: per-question status labels | `sufficient` / `partial` / `insufficient` (lowercase in StatusPill) | Keep lowercase — these are enum values, not display text. The wrapper handles display via `VERIFICATION_RESULT_LABELS`. | No copy change |

### 3.6 Empty states (5 distinct)

| State | Trigger | Treatment |
|---|---|---|
| **No concept-check set yet** | `conceptCheckSets.length === 0` | "No checks yet" card with `<Button variant="primary">GENERATE CONCEPT CHECKS` |
| **Concept checks exist, no verification answers entered** | set exists, user hasn't touched any answer | Question cards render with empty TextAreas; submit button disabled (per existing logic) |
| **Verification submitted, no result yet** | submission in flight | Result block shows skeleton card with `VERIFYING…` eyebrow |
| **Verification result was `needs_review`** | result.result === "needs_review" | StatusPill renders warn-colored; result body unchanged |
| **Voice answer submitted but transcription returned empty** | (existing edge case from D-048) | `<Banner variant="error">Recording too short to transcribe.</Banner>` inside the question card; user can re-record |

### 3.7 Loading state

This route fetches submission + concept-check sets + (sometimes) verifications. Treatment:

- Top nav + back-links render immediately
- Page header (eyebrow + H1 + hash) renders skeleton until `getSubmission()` resolves
- Submission body card: full `.card--skeleton` while data loads
- Concept-checks section: shows `CONCEPT CHECKS` eyebrow immediately, then either skeleton (loading) or empty-state card (no set) or question cards (set exists)
- Verification result block: only renders if a result exists; never shows a skeleton (its absence is informative)

---

## 4. Voice surface integration

The two voice components — `voice-capture.tsx` (verification answers, used on `/submissions/[id]`) and `voice-chat-input.tsx` (TA chat, used in HelpChat + TA Lab) — keep their internal state machines and DOM structure. **Only their buttons and consent text rebase onto atoms.**

| Voice element | Today | After Track A |
|---|---|---|
| Record button | `<button className="btn btn--ghost voice-capture__record">🎤 Record answer</button>` | `<Button variant="ghost">🎤 RECORD</Button>` |
| Stop button | `<button className="btn btn--ghost voice-capture__stop">⏹ Stop (Ns left)</button>` | `<Button variant="ghost">⏹ STOP ({n}s)</Button>` |
| Transcribing button | `<button className="btn btn--ghost" disabled>Transcribing…</button>` | `<Button variant="ghost" disabled>TRANSCRIBING…</Button>` |
| Re-record button | `<button className="btn btn--ghost">🎤 Re-record</button>` | `<Button variant="ghost">🎤 RE-RECORD</Button>` |
| Consent line **[CL2-applied]** | `<p className="voice-capture__consent">Your audio is sent…</p>` | **Eyebrow** `<p className="eyebrow eyebrow--muted">PRIVACY</p>` (label only — no privacy claim in the eyebrow) **plus** a sibling `<p className="voice-capture__hint">` containing the full sentence stating audio handling, written in sentence-case prose, styled with `--text-muted`. The eyebrow stays decorative scaffolding; the privacy fact lives in the readable paragraph where users actually parse it. Same pattern applies to any other Track A surface where a meaningful sentence was compressed into an eyebrow. |
| Error fallback | `<p className="form-error">Couldn't transcribe…</p>` | `<Banner variant="error">Couldn't transcribe. Try again, or type your answer below.</Banner>` |

### 4.1 TA Lab regression check

The TA Lab consumes the **same** atoms because tokens are now global. The scoped `[data-theme="ta-lab"]` block in today's `globals.css` is deleted (Phase 0 §10 + G9). The TA Lab's surface-specific classes (`.ta-lab__pill`, `.ta-lab__topbar`, etc.) continue to exist but inherit colors from the now-global `--signal`, `--quiet`, etc.

The risk: TA Lab's `.ta-lab__pill` currently overrides `.btn` styling. After atoms.css ships, `.btn` is the new brutalist. If TA Lab's pill rules conflict, the cascade order (`atoms.css` before `surfaces.css`) means TA Lab surface rules win on equal specificity. **No visual regression expected** because TA Lab already uses the target aesthetic.

Phase 4 QA agent verifies by:
- Opening `/student/{id}/ta-lab` and comparing to a screenshot taken before token promotion
- Running the existing 18 TA Lab tests (all pass once `[data-theme="ta-lab"]` reference is removed from `tests/ta-lab.test.ts:9` — needs an update per G10 (b))

### 4.2 Brain state captions — sentence-case (G7 confirmed)

The state caption in `ta-lab-stage.tsx` reads "Listening…", "Reading reply…", etc. **No change.** Phase 0 G7 locked sentence-case for state captions; only chip labels and button text go uppercase.

---

## 5. Responsive breakpoints

Three breakpoints. Defined as CSS custom media queries (kept as raw `@media` since CSS Custom Media is not in baseline browsers):

```
1024px and above:   default layout — everything as specced above
768px–1023px:       tablet adjustments
375px–767px:        mobile adjustments
below 375px:        not supported — falls back to mobile layout, may overflow
```

### 5.1 `/student` (assignment list)

| Breakpoint | Change |
|---|---|
| 1024px+ | Default — single column, max-width 960px |
| 768–1023px | Same single column, max-width drops to viewport-32px |
| 375–767px | Cards shrink to viewport-32px; CTA `<Button>` inside card moves below the title row (stacked) instead of right-aligned |

### 5.2 `/student/[id]` (4-step stepper)

| Breakpoint | Change |
|---|---|
| 1024px+ | Default — vertical stepper with hairline connectors on the left, step bodies on the right |
| 768–1023px | Same vertical stepper; connectors collapse to flush-left (no indentation) |
| 375–767px | Stepper numbers `[01]`–`[04]` move **inline** to the top of each step's body card (no separate column). Connectors disappear. Each step renders as a full-width card with the number as the first line of the eyebrow band: `// [01] READ THE TASK` |

### 5.3 `/submissions/[id]` (concept-check flow)

| Breakpoint | Change |
|---|---|
| 1024px+ | Default |
| 768–1023px | Role toggle pills stay in header row but break to a new line below the H1 if needed |
| 375–767px | **[TSS2 resolved → option (b)]** Role toggle stays as two stacked `<Pill as="button">` (not collapsed to Select). The two pills break to a new row below the H1, full-width stacked. `<Select>` deferred to Track B. Voice toggle inside each question card stays as a pill pair (it's narrow enough). |

### 5.4 Home-page horizontal stepper (Phase 2C — Track C, but decision needed now)

Per G12, the home `/` hero has a 5-step horizontal strip. Stepper mobile decision:

| Breakpoint | Behavior |
|---|---|
| 1024px+ | 5 tiles in one row, equal width, hairline connectors between |
| 768–1023px | 5 tiles wrap to **3 + 2** layout (two rows) |
| 375–767px | 5 tiles wrap to **2 + 2 + 1** layout (three rows). Connectors render only within a row |

**No horizontal scroll**. The brutalist aesthetic doesn't tolerate hidden content behind a scroll affordance — stack instead.

### 5.5 Top nav mobile (G11 redesign)

| Breakpoint | Behavior |
|---|---|
| 1024px+ | `[ACTA] HOME · INSTRUCTOR · STUDENT` left + session pill right |
| 768–1023px | Same, slightly tighter dot separators |
| 375–767px | `[ACTA]` brand stays left; nav links collapse to a single `<Pill as="button">≡ MENU</Pill>` that opens a `<Panel --overlay>` with the three links stacked. Session pill stays visible to the right of the brand |

This is the only modal-style interaction in Track A.

---

## 6. Handoff to Phase 1 — atom prerequisites for Track A

Track A surface work cannot start until the atoms below exist. I split them into **must-exist** (Phase 1 blocks Track A) and **can-stub** (Phase 1 can ship Track A in parallel with a deferred atom).

### 6.1 Must exist before Track A starts

| Atom | Used by | Why required |
|---|---|---|
| `<Button>` | every route | Primary CTAs, submit buttons, voice buttons (after rebase) |
| `<TextArea>` | `/student/[id]` submit step, `/submissions/[id]` verification answers | The submission textarea and 3× answer textareas |
| `<Pill>` | `/submissions/[id]` role toggle + Type/Voice toggle, `/student` verification-mode pill | Toggle groups need `aria-pressed` |
| `<StatusPill>` | `/submissions/[id]` verification result + per-question rows, `/student` (if we show submission status in the future) | Maps `VerificationResult` and `VerificationStatus` enums to chips |
| `<HashChip>` | every route (policy, content, reference hashes) | Mount-flash animation requires wrapper |
| `.card` (CSS) | every route | Single most-used surface primitive |
| `.banner` (CSS) | `/student` empty, `/student/[id]` ai-help-disabled + drift, `/submissions/[id]` error states | Replaces today's `.policy-banner`, `.outcome-banner`, `.form-error` (full-width) |
| `.stepper` (CSS) | `/student/[id]` only | Without this, Track A's signature route doesn't render |
| `.eyebrow` (CSS) | every route | Every section header |
| `.role-instructor` / `.role-student` (CSS) | every route | Role stripes everywhere |
| `.card--skeleton` + `.skeleton-line` (CSS, new) | every route's loading state | Decision to add to atoms.css confirmed in §1.7 |
| Tokens (Phase 0) — already locked | every selector | Foundation |

### 6.2 Can be stubbed (Track A doesn't use them)

| Atom | First needed by | Stub approach |
|---|---|---|
| `<TextField>` | Track B (`assignment-form.tsx` title field) | Wrapper file can exist with TODO; not imported by Track A surfaces |
| `<Select>` | Track A mobile-only (`/submissions/[id]` <768px role toggle) | **[TSS2 resolved → deferred]** Not pulled forward. Track A ships with stacked Pills at <768px per §5.3. Select lands with Track B. |
| `<Checkbox>` | Track B (`ai-help-policy.tsx`) | Same as TextField — TODO wrapper |
| `<Radio>` | Track B (`verification-mode-selector.tsx`) | Same |
| `.panel` (CSS) | TA Lab (already shipped) + future modals | The TA Lab's existing `.ta-lab__voice-panel` continues working through the cascade; Phase 1 polishes the underlying `.panel` rule but doesn't block Track A |

### 6.3 Ship order within Phase 1 (revised)

1. **tokens.css** — `:root` + media queries + fonts (4 hours)
2. **atoms.css base** — reset, focus ring, eyebrow, card, banner, stepper, role-stripe, skeleton (8 hours)
3. **Button wrapper + .btn styles** (3 hours)
4. **Pill wrapper + .pill styles** (3 hours)
5. **StatusPill wrapper + .status-pill styles** (4 hours — enum→variant mapping)
6. **HashChip wrapper + .hash-chip styles + mount-flash effect** (3 hours)
7. **TextArea wrapper + .field styles + cursor-blink pseudo-caret** (5 hours)
8. **Top nav redesign** (G11) (3 hours)
9. **globals.css → 6-line import shell** + migration cleanup (2 hours)
10. **Test update pass** — ~15 string assertions and class renames (2 hours)

Total Phase 1: ~37 hours. Track A surface work starts after step 9 (atoms ready) and runs ~20 hours for three routes.

### 6.4 What Phase 1 explicitly does NOT touch

- TA Lab components (`src/frontend/components/ta-lab/*`) — they inherit token swap, no other changes
- HelpChat internals — it already consumes BrainAssistant; only its mic/send buttons rebase onto `<Button>`
- BrainAssistant SVG — already brutalist, do not modify
- Instructor surfaces (Track B) — assignment-form, ai-help-policy, verification-mode-selector
- Marketing/evidence surfaces (Track C) — home hero, ledger, evidence report, about-data
- Backend, schema, providers — zero changes

---

## 7. Cross-route consistency contracts

Three contracts every Track A surface must honor (QA agent verifies in Phase 4):

**C1 — Eyebrow above every section header.** Every `<h2>` and every card-internal heading is preceded by a `.eyebrow`. No bare H2s. The eyebrow text uses `//` prefix typed into the markup (not auto-injected via CSS).

**C1-exception (CL1, Track C only):** The home hero H1 (Track C, per G12) stands alone without an eyebrow. Every other H1, H2, and card-internal heading carries one. Documented here so Track C does not relitigate. All Track A surfaces honor C1 as written.

**C2 — Role stripe on every content card on role-scoped routes.** `/student/*` cards carry `.role-student`. Future `/instructor/*` cards carry `.role-instructor`. The shared `/submissions/[id]` route carries the stripe matching the current `view` toggle state.

**C3 — HashChip wherever a hash is shown.** No bare `<span>` rendering a hash. Today's `version-badge.tsx` rebases onto `<HashChip>`. The TA Lab's `#abc1234` chip in the topbar swaps to `<HashChip>` (one-line refactor).

---

## 8. Sign-off — RESOLVED

Three TSS decisions signed off 2026-05-12:

**TSS1 — Skeleton/loading pattern: RESOLVED → sub-atom of Card.** No `<Skeleton>` React wrapper. `.card--skeleton` modifier + `.skeleton-line` helper stay as CSS-only patterns in atoms.css.

**TSS2 — Role toggle on `/submissions/[id]` mobile: RESOLVED → option (b).** Stacked pills at <768px. `<Select>` stays deferred to Track B. Track A ships without Select. §5.3 and §6.2 updated to reflect.

**TSS3 — Empty-state copy in §1.6: RESOLVED → approved as written.**

Plus two clarifications applied at sign-off:

**CL1 — Home-hero H1 exception** (folded into §7 as C1-exception)
**CL2 — Voice-capture consent prose swap** (folded into §4)

Phase 1 implementation has shipped per §6.3. Track A surface work begins per this spec, starting with §1 (`/student`).
