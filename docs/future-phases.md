# Future Phases — Entry Criteria

**Purpose:** Track entry criteria for phases that have been scheduled but not yet started. Each entry is a discrete piece of work that unlocks a future phase, with a clearly-defined definition of done.

**Owner:** chief-of-staff-orchestrator

**Last updated:** 2026-05-17

**Status:** Active. New entries appended as they are signed. Entries are removed when the work lands.

---

## Conventions

- Each entry has a **trigger** (which phase or decision it unlocks), a **work statement** (what must be done), and a **definition of done** (the observable signal that the criterion has been met).
- Entries are not implementation tickets. They are commitments to do specific work when the corresponding phase opens.
- An entry is removed from this document only when the work it describes has shipped. If a phase opens and the criterion has not been met, the phase is blocked until it is.
- Entries that name a specific spec must link to that spec by absolute path.

---

## Entry 1 — TTS migration to tappable audio source

**Source decision:** [`docs/decisions.md`](decisions.md) — Acta TA Lab sphere (ActaSphere) spec, Q4 sign-off, 2026-05-17.

**Triggered by:** The phase that follows Phase 4 QA (Phase 5, or wherever TTS rework lands).

**Work statement (verbatim from the ActaSphere spec Q4 sign-off):**

> Migrate Acta TTS from `window.speechSynthesis` to a tappable audio source (streamed `<audio>` element via ElevenLabs or equivalent). When complete, wire `ActaSphere.ttsAudioElement` prop to the new audio element and remove the synthetic-pulse fallback for ta-output mode. The synthetic pulse is interim v1 behavior; it is debt with a scheduled paydown, not a permanent design choice.

**Why this is debt and not optional:** the TA Lab is the demo surface for investors and pilot instructors. A synthetic 1.2 Hz pulse that does not track real TTS speech rhythm is a small visual lie that sharp-eyed observers will catch ("the sphere pulses through the voice pauses"). Acceptable in v1, not acceptable as permanent design.

**Definition of done:**

1. The TA reply audio is delivered via a streamed `<audio>` HTMLAudioElement (backed by ElevenLabs streaming or an equivalent backend TTS endpoint), not via `window.speechSynthesis.speak()`.
2. The `<audio>` element reference is plumbed into `<ActaSphere ttsAudioElement={ref} />` (the prop already exists in the v1 component API).
3. A `useTtsAnalyzer(audioElement)` hook is added beside the existing `useMicAnalyzer`, mirroring its shape: builds `MediaElementAudioSource` → `AnalyserNode`, exposes `level` and `frequencies` refs, tears down on unmount.
4. The sphere's `ta-output` mode reads from the TTS analyzer when `ttsAudioElement` is present, and from the synthetic 1.2 Hz pulse only when it is absent.
5. After this work lands, the synthetic-pulse path may be deleted entirely (no `ttsAudioElement` consumers will be left without an audio source).
6. The user-facing TTS behavior is at least as good as `window.speechSynthesis` was: same or better voice quality, same or shorter time-to-first-audio, no new privacy surface, no new cost surface that hasn't been founder-approved.

**Out of scope for this entry:** changing what the TA says, changing the voice character defaults, adding voice picker UI beyond what `VoiceSettingsPanel` already supports. This entry is the plumbing change, not the product change.

**Cross-references:**
- ActaSphere spec: `~/Downloads/acta-ta-lab-sphere-spec.md` (§5 audio reactivity, §8 component API, §13 Q4 sign-off)
- Component API surface for `ttsAudioElement`: already present in `<ActaSphere>` v1; this entry consumes the prop, does not add it.

**Removal criterion:** delete this entry from `future-phases.md` once the TTS migration has shipped and the synthetic-pulse path has been removed from `acta-sphere-canvas.tsx`.

---

## Entry 2 — Track A horizontal cleanup pass

**Source decisions:** Route 1 sign-off 2026-05-17, Route 2 sign-off 2026-05-17. Track A's surface composition shipped pragmatic v1 treatments for four classes of constraint that share the same root cause: each one would require touching code outside Track A's surface-composition scope (a domain component, the HTML `<a>`/`<button>` nesting rule, or a non-atom legacy component). Each is structurally similar, and consolidating the fixes into one scoped pass produces better consistency and a single documented pattern set rather than rotating through routes.

**Triggered by:** A scoped polish pass after Track A ships, before Track B begins (or after, depending on schedule). Not bundled with any individual route. Single PR or single short-lived branch covering all four sub-items below.

**Sub-item A — Card-as-button refactor (list-card semantics)**

Spec §1.5 calls for a visible `<Button variant="ghost">OPEN →</Button>` inside each assignment card while also preserving the whole-card click target via a wrapping `<Link>`. That combination is invalid HTML (`<a><button>` nesting). Track A shipped the visually-equivalent styled-span treatment (`.assignment-card__open-cue`).

Work statement:
- Remove the `<a>`/`<Link>` that wraps the card body on every list-style card surface.
- Make the card root a `<div role="link" tabindex="0">` (or a real `<a>` with `display:block`, depending on accessibility review).
- Bind `onClick → router.push(href)` and `onKeyDown` for Enter/Space activation.
- Replace the styled-span `.assignment-card__open-cue` with a real `<Button variant="ghost">OPEN →</Button>` inside the card footer.
- Preserve Next.js `<Link>` prefetch behavior via `router.prefetch` on hover.
- Confirm screen-reader behavior: the card announces as a link; the inner button does not double-announce.

Candidate surfaces (all five share the pattern): `/student` assignment list, `/student/[id]` Step 4 submissions list, instructor assignment list (Track B), instructor submissions list (Track B), ledger list (Track C).

**Sub-item B — TA Lab CTA refactor**

The single `[ OPEN TA LAB → ]` CTA inside `/student/[id]` Step 2's card body is a `<Link>` styled with `.btn.btn--ghost.ta-lab-cta` because Next.js routing wants `<Link>` and we can't nest a `<button>` inside an anchor. Same root cause as Sub-item A but for a one-off CTA rather than a card wrapper. The cleanest path: once Sub-item A's card-as-button pattern is documented, the TA Lab CTA can become a real `<Button>` that calls `router.push(href)` on click and emits prefetch on hover via the same documented pattern. The `.ta-lab-cta` surface class is removed.

**Sub-item C — PolicyBanner refactor to `.banner.banner--policy`**

`PolicyBanner` is a domain component used inside `/student/[id]` Step 1's "AI help rules" disclosure body and on the instructor surface. It carries its own `.policy-banner` / `.policy-banner--disabled` legacy classnames that pre-date the atoms.css `.banner.banner--policy` family. Track A spec §2.2 row "Policy banner inside Step 1 | `<Banner variant="policy">`" calls for it to consume the atoms.banner CSS, but the component is shared with instructor surfaces (out of Track A scope).

Work statement:
- Migrate `PolicyBanner` to render `<div className="banner banner--policy">` (or `banner--disabled` for the off case).
- Replace `.policy-banner__row` with appropriate banner-internal structure (`.banner__body`, `.banner__title`, `.banner__detail`).
- Verify the AI-help-allowed / not-allowed copy still reads identically at the visual level.
- Delete the orphan `.policy-banner` rules from surfaces.css once no consumers remain.

**Sub-item D — HelpChat mic/send button rebase to `<Button>`**

`HelpChat` consumes the legacy `.btn` classes for its mic toggle and send buttons (per spec §4 voice surface integration). Track A's surface composition leaves HelpChat internals alone per §6.4 ("HelpChat internals — it already consumes BrainAssistant; only its mic/send buttons rebase onto `<Button>`"). The rebase itself is in scope for Track A by §4, but blocked because Track A's scope discipline ("touch only surface composition, not internals of shared components") trumps the §4 ask. This sub-item lifts that block.

Work statement:
- In `help-chat.tsx`, swap the mic toggle button to `<Button variant="ghost">🎤 …</Button>` (mode-aware label per the existing state machine).
- Swap the send button to `<Button variant="primary" type="submit">SEND</Button>` or equivalent (verify against current copy).
- Repeat for `voice-chat-input.tsx`'s record / stop / re-record buttons per spec §4 table.
- Confirm BrainAssistant state-machine transitions still fire on the button clicks (the button wrapper passes through `onClick`).

**Definition of done (all four sub-items):**

1. A single documented pattern doc (`docs/patterns/list-card-as-button.md` or `docs/patterns/track-a-cleanup.md`) describing card-as-button structure, ARIA roles, keyboard handling, prefetch behavior, and atom-rebase conventions for domain components.
2. `/student` assignment cards, `/student/[id]` Step 4 submission rows, and every other list-style card in Acta use the card-as-button pattern. No remaining `<Link>` wrapping a clickable card region.
3. `.assignment-card__open-cue` span treatment removed from surfaces.css.
4. The TA Lab CTA in `/student/[id]` Step 2 is a real `<Button>`. The `.ta-lab-cta` surface class is removed.
5. `PolicyBanner` renders `<div className="banner banner--policy">` (or `--disabled`). The legacy `.policy-banner*` rules in surfaces.css are deleted.
6. `HelpChat` mic + send buttons use `<Button>` atoms. `voice-chat-input.tsx` record/stop/re-record buttons use `<Button>` atoms.
7. All routes still pass their checkpoint visual review at desktop + mobile.
8. Whole-card click target behavior is preserved on every list-card surface.
9. Keyboard activation works on every list-card: Tab → Enter or Space navigates. Tab to inner Button → Enter activates. No double-fire.
10. Prefetch on hover behaves the same as `<Link>` does today.

**Out of scope for this entry:**

- Changing what cards link to, what banners say, or what buttons do functionally.
- Visual restyling beyond what the atom rebases naturally produce.
- Touching the BrainAssistant SVG itself (still owned by FI-2 Phase 4 evaluation).

**Cross-references:**
- Track A spec §1.5, §2.2, §4: [`docs/track-a-screen-specs.md`](track-a-screen-specs.md)
- Route 1 checkpoint: [`docs/checkpoints/route-1-student.md`](checkpoints/route-1-student.md) §"Skipped vs. spec" item 1
- Route 2 checkpoint: [`docs/checkpoints/route-2-student-detail.md`](checkpoints/route-2-student-detail.md) §"Skipped vs. spec" items 1, 2, 3

**Removal criterion:** delete this entry from `future-phases.md` once all four sub-items have shipped and the documented pattern lives in `docs/patterns/`.

---

## Entry 3 — Concept-check flow flat-layout refactor

**Source decision:** Route 3 (`/submissions/[id]`) sign-off, 2026-05-17. Spec §3.1 calls for a flat per-question card layout with a `TYPE · 🎤 VOICE` pill toggle per question and a single `SUBMIT FOR VERIFICATION` primary button at the bottom of the page. The current `ConceptCheckDisplay` renders multiple sets in collapsible disclosures with nested per-attempt verification result rows. Track A shipped the existing pattern intact and parked the refactor — this is a product UX change, not structural cleanup, so it gets its own entry rather than riding under Entry 2.

**Why this gets its own entry instead of riding under Entry 2:**
- Entry 2's scope is structural cleanup with one anchor pattern (card-as-button refactor). Sub-items B/C/D ride along cleanly because they're all atom-swap mechanical work.
- The ConceptCheckDisplay refactor is a product UX change. It affects how students experience verification. Different category of work, different decision gates.
- The refactor has its own open questions that need founder spec'ing before implementation (see Q1–Q3 below).
- Bundling these into Entry 2 either bloats it beyond a single PR scope or quietly de-prioritizes the concept-check work.

**Triggered by:** Resolution of Q1–Q3 below, then a scoped polish pass after Track A surfaces ship.

**Scope:**

Restructure `ConceptCheckDisplay`, `VerificationForm`, and `VerificationResultDisplay` to a flat per-question card layout per Deliverable 3 §3.1. Replace the current collapsible-disclosures-with-nested-attempt-history pattern with a single per-question card containing the question text, a `TYPE`/`VOICE` pill toggle, an inline answer surface (`TextArea` or voice capture), and a unified `SUBMIT FOR VERIFICATION` primary button at the bottom of the page.

**Open decisions (require founder spec before implementation):**

**Q1 — Attempt history visibility.** Where does the per-attempt verification history move when the per-question layout flattens?
- (A) Move to the evidence report only — students see latest attempt inline, history lives at `/submissions/[id]/evidence-report`.
- (B) Stay visible to students inline — render history as a chronological list below the verification result block.
- (C) Surface in a separate `/submissions/[id]/history` sub-route accessible via a link from the main view.

**Q2 — Backward compatibility for existing sets.** What happens to concept-check sets created under the old multi-set layout when a student opens an old submission after the refactor ships?
- (A) Migrate the data — convert old multi-set records to flat-layout equivalents on read.
- (B) Render in old layout for legacy sets — keep both renderers, branch on a schema flag.
- (C) Block old submissions from re-opening — show a "this submission predates the new verification flow" notice; new submissions only.

**Q3 — `TYPE`/`VOICE` toggle default.**
- (A) Default to TYPE per question every time — explicit student choice each time.
- (B) Remember the last choice across questions in the same session — first toggle sets the pattern, subsequent questions inherit.
- (C) Persist across sessions in user preferences — student picks once, sticks until they change it.

**Definition of done:**

**DOD1.** Per-question card layout: one card per concept check, stacked vertically, `.role-student` stripe, eyebrow label `QUESTION N OF M` inside each card.

**DOD2.** `TYPE`/`VOICE` pill toggle integrated into each question card. Default behavior per Q3 resolution.

**DOD3.** Inline answer surface swaps between `<TextArea>` (TYPE mode) and voice capture (VOICE mode) without page navigation.

**DOD4.** Single `SUBMIT FOR VERIFICATION` primary `<Button>` at page bottom, replacing per-question submit logic.

**DOD5.** Attempt history handled per Q1 resolution.

**DOD6.** Legacy submission compatibility handled per Q2 resolution.

**DOD7.** ARIA: each question card has `aria-labelledby` pointing to its question heading, `TYPE`/`VOICE` toggle has `aria-pressed`, submit button has `aria-describedby` pointing to a hint about how many questions are answered.

**DOD8.** Mobile collapse at 375px: per-question cards stack full width, pill toggle stays inline beneath the question, answer surface fills available width.

**Cross-references:**
- Track A spec §3.1: [`docs/track-a-screen-specs.md`](track-a-screen-specs.md)
- Route 3 checkpoint: [`docs/checkpoints/route-3-submission.md`](checkpoints/route-3-submission.md) §"Skipped vs. spec" items 1, 3, 4, 5
- Components in scope: `src/frontend/components/concept-check-display.tsx`, `verification-form.tsx`, `verification-result-display.tsx`, `voice-capture.tsx`

**Removal criterion:** delete this entry when all 8 DoD criteria are met and shipped to main.
