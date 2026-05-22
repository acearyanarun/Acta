import Link from "next/link";

export default function AboutDataPage() {
  return (
    <section>
      <Link href="/" className="back-link">
        ← Back to home
      </Link>
      <h1>How Acta handles student data</h1>
      <p className="page-sub">Short version, written for pilot conversations.</p>

      <section className="placeholder-card">
        <h2>Synthetic data only — today</h2>
        <p>
          The current build runs against synthetic demo data. The backend refuses to boot if{" "}
          <code>ALLOW_REAL_STUDENT_DATA=true</code> is set without a signed FERPA Data Processing
          Agreement reference. No real student records are stored or sent to any LLM provider in
          this build.
        </p>
      </section>

      <section className="placeholder-card">
        <h2>Per-tenant scope</h2>
        <p>
          Every submission, concept-check set, verification attempt, and reference solution is
          scoped to a tenant. Cross-tenant reads return 404. Instructors only see records in their
          own tenant; students only see their own work. Defense-in-depth tests assert this on every
          privileged route.
        </p>
      </section>

      <section className="placeholder-card">
        <h2>No training on student data</h2>
        <p>
          The LLM provider is either a deterministic stub (default) or OpenAI gated behind{" "}
          <code>USE_REAL_LLM=true</code> + <code>OPENAI_API_KEY</code>. When OpenAI is enabled,
          calls go through the standard API with <code>OpenAI-Beta: zero-data-retention</code>
          -compatible settings; we do not opt into training. A signed institutional DPA before any
          pilot launch will codify this.
        </p>
      </section>

      <section className="placeholder-card">
        <h2>Hash-pinned audit trail</h2>
        <p>
          Every record carries cryptographic hash anchors (policy hash, content hash, reference
          hash) so an instructor can later defend any verification result against the exact policy
          version + submission text + Instructor Solution Guide that produced it. The evidence
          report bundles all of this into a single printable PDF.
        </p>
      </section>

      <section className="placeholder-card">
        <h2>No AI detection</h2>
        <p>
          Acta does <strong>not</strong> claim to detect whether a submission was AI-written. The
          product is verification of understanding — concept checks grounded in the student&apos;s
          own work — not provenance guessing.
        </p>
      </section>

      <p style={{ color: "var(--muted)", fontSize: 13 }}>
        Last updated 2026-05-12. Pilot DPAs supersede anything on this page.
      </p>
    </section>
  );
}
