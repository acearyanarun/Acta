# Phase 1.5 Step 1 Checkpoint — `<TextField>` atom

> **Status:** Built. Ready for manual visual review.
> **Spec:** [`docs/track-b-screen-specs.md`](../track-b-screen-specs.md) §A.1
> **Date:** 2026-05-18

First of the four Phase 1.5 atoms (TextField → Checkbox → Radio → StatusPill+DataTable → polish). Atom-only steps don't have direct route coverage — the `/dev/atoms` playground is the review surface and gets deleted at step 5 before Track B surfaces ship.

---

## Files changed

| Path | Change |
|---|---|
| `src/frontend/components/atoms/text-field.tsx` | NEW. Mirrors the `<TextArea>` atom signature (ARIA wiring, D1 allowlist, no `inputProps` escape hatch). Single-line `<input>` with type union `text \| email \| url \| tel \| search`. |
| `src/frontend/app/dev/atoms/page.tsx` | NEW. Phase 1.5 review playground. Mounts TextField across seven variants. Placeholder sections for Checkbox / Radio / StatusPill — fill in as steps 2-4 land. Route is **temporary** — deleted at step 5 before Track B surfaces ship. Not linked from any other route. |
| `src/frontend/app/atoms.css` | UNCHANGED — base `.field` cascade already supports `<input>` since `.field__control` doesn't restrict by element type. The `--textarea` modifier is the only element-specific style (resize / min-height). TextField uses `.field--text` modifier; no CSS rule keyed on it yet but the class is in the markup for future targeting. |

---

## Atom API surface

The full prop shape (matches spec §A.1):

```typescript
type TextFieldType = "text" | "email" | "url" | "tel" | "search";

type Props = {
  name: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  type?: TextFieldType;
  // D1 allowlist (per Deliverable 3 §0 D1):
  autoComplete?: string;
  autoFocus?: boolean;
  pattern?: string;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "url" | "search" | "tel";
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  readOnly?: boolean;
  spellCheck?: boolean;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};
```

### ARIA wiring (mirrors `<TextArea>`)

- `htmlFor` on the `<label>` matches `id` on the `<input>`.
- `aria-required` set when `required`.
- `aria-describedby` points to `${inputId}-hint` when a hint is rendered.
- `aria-errormessage` points to `${inputId}-error` when an error is rendered.
- `aria-invalid` set to `true` when an error is rendered.

### What's NOT in the API

Per D1, no `inputProps`, no `style`, no `className` passthrough, no `data-*` spread, no `id` override. If a surface needs more, the wrapper spec changes — not the surface.

---

## CSS class structure

The atom renders the same DOM shell as `<TextArea>`:

```
<div class="field field--text [field--invalid] [field--required]">
  <label class="field__label" for={inputId}>
    {label}
  </label>
  <div class="field__wrap">
    <input
      class="field__control"
      id={inputId}
      type={type}
      …
    />
  </div>
  [<p class="field__hint" id={hintId}>…</p>]
  [<p class="field__error" id={errorId}>…</p>]
</div>
```

The `.field` cascade (atoms.css lines 668-730) already supports this shape — no CSS additions needed. The cursor-blink pseudo-caret (`.field__wrap::before` at line 738, gated by `:has(.field__control:placeholder-shown:focus)`) works on both `<input>` and `<textarea>` since `:placeholder-shown` is element-agnostic.

The `.field--text` modifier class is added to the wrapper for future targeting (e.g. if Track B ever needs text-specific styling), but no CSS rule is keyed on it today — same pattern as `.field--textarea` being added before any textarea-specific rule existed.

---

## URL-accessible review

| URL | Use |
|---|---|
| http://localhost:3000/dev/atoms | TextField playground — seven variants |

Returns HTTP 200. The page hosts seven TextField instances:

| Variant | Renders |
|---|---|
| **Default** | Empty value + placeholder. Caret pseudo-element should appear at the text-start position when focused. |
| **Required** | Empty value + required prop. Label shows the asterisk after the text (`.field--required .field__label::after`). |
| **With hint** | Empty value + hint paragraph rendered in muted text below the input. |
| **With error** | Prefilled "ab" + minLength=3 + error message. Border switches to `--error` bordeaux. The cursor-blink pseudo-caret should NOT appear (the field has content). |
| **Disabled** | Prefilled value, `disabled` set. Input is muted at 0.55 opacity, cursor `not-allowed`. |
| **Prefilled** | Prefilled "Photosynthesis — short answer". Cursor-blink pseudo-caret SHOULD NOT appear even when focused, because the field doesn't match `:placeholder-shown`. |
| **Email + autoComplete + inputMode** | Empty, `type="email"`, `autoComplete="email"`, `inputMode="email"`. On mobile, the email keyboard variant should show on focus. |

### Render confirmation

Curl + grep audit confirms:
- `TEXTFIELD ATOM` eyebrow present
- 7 `.field__control` inputs rendered
- `<h1>Atom playground</h1>` is the page heading
- The "Type here to see the caret transition" placeholder shows up

---

## Visually intentional things that might look like bugs

1. **The cursor-blink pseudo-caret is a 2px tall blue bar at the text-start of the field, blinking on a 1s cycle.** Only visible when (a) the field is focused AND (b) the field matches `:placeholder-shown` (i.e. empty). Once the user types, it hides — the native caret takes over. This is the D3-locked pattern; works the same way on TextArea.
2. **The label is signal-color uppercase mono.** That's the `.field__label` cascade (atoms.css line 674-681). It reads as part of the eyebrow family — intentional, ties the field to the design system's typography.
3. **Border darkens on focus (no glow halo).** `--border-strong` replaces `--border` on `:focus` — this is the cream-vellum focus treatment per Phase 0. Dark backgrounds use glow halos; cream paper uses border darkening.
4. **The disabled state mutes the entire field at 55% opacity** including the label. Matches the `<TextArea disabled>` behavior.
5. **The error variant doesn't auto-validate on `minLength`.** The `error` prop is the source of truth — surfaces decide when to set it. This is by design (passive validation; see spec §3.6 step "Form validation failure").

---

## No regressions

All four Track A routes still return HTTP 200 after the TextField + playground additions:

```
200  http://localhost:3000/student?state=empty
200  http://localhost:3000/student/demo?state=empty
200  http://localhost:3000/submissions/demo?state=empty
200  http://localhost:3000/dev/atoms
```

No existing surface consumes `<TextField>` yet, so visual regression risk on Track A routes is zero — the atom is reachable only via the playground.

---

## Ready for review — sign-off ask

Open http://localhost:3000/dev/atoms at desktop + a narrow mobile width. Confirm:

- [ ] **Seven TextField variants render** as labeled. No layout overlap, no broken spacing.
- [ ] **Cursor-blink pseudo-caret appears** at the text-start position when focusing an empty field (Default, Required, With hint, Email). It blinks on a 1s cycle.
- [ ] **Cursor-blink pseudo-caret hides** as soon as you type any character. The native caret takes over.
- [ ] **Cursor-blink pseudo-caret does NOT appear** on the Prefilled or With-error variants (both have content).
- [ ] **Required asterisk** shows on the Required field's label (after the text, in `--error` bordeaux).
- [ ] **Error variant** shows a bordeaux border + a bordeaux error message below the input.
- [ ] **Disabled variant** shows muted opacity, `not-allowed` cursor on hover.
- [ ] **Email variant on mobile** opens the email keyboard variant when focused (test on a real device or DevTools mobile emulation).
- [ ] **Mobile layout (375px)** — fields full-width, no horizontal scroll, label still readable.
- [ ] **Track A routes unaffected** — open `/student?state=empty` and `/student/demo?state=empty` at desktop; confirm no visual change.

Reply **signed** to proceed to step 2 (`<Checkbox>` atom). If anything looks off, flag it.

---

## Next step preview

Phase 1.5 step 2: `<Checkbox>` wrapper + `.checkbox` styles + `hardRule` variant. Estimated 5 hours. The playground at `/dev/atoms` gains a populated CHECKBOX section; everything else remains.
