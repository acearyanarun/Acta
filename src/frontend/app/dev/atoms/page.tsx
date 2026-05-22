"use client";

/**
 * Phase 1.5 atom playground.
 *
 * Temporary surface for visual review of the four atoms being built in
 * Phase 1.5 (TextField, Checkbox, Radio + RadioGroup, StatusPill workflow
 * + DataTable). Each section renders one atom across its variants.
 *
 * This route is deleted at Phase 1.5 step 5 before Track B surfaces ship.
 * It is NOT linked from any other route; reachable only via direct URL.
 *
 * Reachable at: http://localhost:3000/dev/atoms
 */

import { useState } from "react";
import { TextField } from "../../../components/atoms/text-field";

export default function AtomPlaygroundPage() {
  const [textDefault, setTextDefault] = useState("");
  const [textRequired, setTextRequired] = useState("");
  const [textWithHint, setTextWithHint] = useState("");
  const [textWithError, setTextWithError] = useState("ab");
  const [textDisabled, setTextDisabled] = useState("Cannot edit");
  const [textPrefilled, setTextPrefilled] = useState("Photosynthesis — short answer");

  return (
    <section>
      <p className="eyebrow">PHASE 1.5 ATOM PLAYGROUND</p>
      <h1>Atom playground</h1>
      <p className="page-sub">
        Visual review surface for the four Phase 1.5 atoms. This route is temporary and gets
        deleted in step 5 polish before Track B surfaces ship. Not linked from any other route.
      </p>

      <section className="card role-instructor">
        <p className="eyebrow">TEXTFIELD ATOM</p>
        <p className="section-helper">
          Mirrors the TextArea atom signature (D1 allowlist, ARIA wiring, no inputProps escape
          hatch). Reuses the same <code>.field</code> cascade — base <code>.field__control</code>
          works for both <code>&lt;input&gt;</code> and <code>&lt;textarea&gt;</code>. Cursor-blink
          pseudo-caret should appear at the text-start position when the field is focused AND
          empty (matches the <code>:placeholder-shown</code> selector per D3).
        </p>

        <h2 style={{ marginTop: "var(--space-5)" }}>Default state</h2>
        <TextField
          name="text-default"
          label="Default state"
          value={textDefault}
          onChange={setTextDefault}
          placeholder="Type here to see the caret transition"
        />

        <h2>Required</h2>
        <TextField
          name="text-required"
          label="Required field"
          value={textRequired}
          onChange={setTextRequired}
          placeholder="Required — note the asterisk on the label"
          required
        />

        <h2>With hint</h2>
        <TextField
          name="text-with-hint"
          label="With hint"
          value={textWithHint}
          onChange={setTextWithHint}
          placeholder="Anything"
          hint="The hint paragraph sits below the input, in --text-muted."
        />

        <h2>With error</h2>
        <TextField
          name="text-with-error"
          label="With error"
          value={textWithError}
          onChange={setTextWithError}
          placeholder="Min length 3"
          minLength={3}
          error="Value must be at least 3 characters."
        />

        <h2>Disabled</h2>
        <TextField
          name="text-disabled"
          label="Disabled"
          value={textDisabled}
          onChange={setTextDisabled}
          disabled
        />

        <h2>Prefilled (placeholder-shown rule bypassed)</h2>
        <TextField
          name="text-prefilled"
          label="Prefilled"
          value={textPrefilled}
          onChange={setTextPrefilled}
          hint="Caret pseudo-element should NOT appear here even when focused — the field has content."
        />

        <h2>Email + autoComplete + inputMode</h2>
        <TextField
          name="text-email"
          label="Email"
          type="email"
          value=""
          onChange={() => {}}
          placeholder="instructor@school.edu"
          autoComplete="email"
          inputMode="email"
          hint="Exercises the D1 allowlist (autoComplete, inputMode)."
        />
      </section>

      <section className="card role-instructor" style={{ marginTop: "var(--space-5)" }}>
        <p className="eyebrow">CHECKBOX ATOM</p>
        <p className="section-helper">Phase 1.5 step 2 — not yet shipped.</p>
      </section>

      <section className="card role-instructor" style={{ marginTop: "var(--space-5)" }}>
        <p className="eyebrow">RADIO + RADIOGROUP ATOMS</p>
        <p className="section-helper">Phase 1.5 step 3 — not yet shipped.</p>
      </section>

      <section className="card role-instructor" style={{ marginTop: "var(--space-5)" }}>
        <p className="eyebrow">STATUSPILL WORKFLOW VARIANT + DATA-TABLE</p>
        <p className="section-helper">Phase 1.5 step 4 — not yet shipped.</p>
      </section>
    </section>
  );
}
