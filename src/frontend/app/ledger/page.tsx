export default function LedgerPlaceholder() {
  return (
    <section>
      <span className="placeholder-tag">Roadmap</span>
      <h1>Acta roadmap</h1>
      <p>Provenance ledger ships next. Every record below is already hash-pinned.</p>

      <section className="placeholder-card">
        <h2>Hash-pinned today</h2>
        <ul className="ledger-anchors">
          <li>
            <strong>policyHash</strong>
            <span>
              on every <code>assignment_policy_versions</code> row
            </span>
          </li>
          <li>
            <strong>contentHash</strong>
            <span>
              on every <code>submissions</code> row
            </span>
          </li>
          <li>
            <strong>referenceHash</strong>
            <span>
              on every <code>assignment_reference_solutions</code> row
            </span>
          </li>
        </ul>
      </section>
    </section>
  );
}
