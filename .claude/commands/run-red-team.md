# /run-red-team

Runs the security and adversarial red-team suite against the current build.
Owned by the qa-security-devops-agent.

---

## What this command does

1. qa-security-devops-agent executes all red-team test cases.
2. Results are logged in `docs/red-team-report.md` with severity (Critical / High / Medium / Low).
3. ai-llm-engineer-agent reviews prompt injection results and proposes mitigations.
4. backend-developer-agent reviews ledger tamper results and proposes mitigations.
5. chief-of-staff-orchestrator reviews report and escalates Critical/High findings to founder.

---

## Required test categories (all mandatory for Acta)

### 1. Ledger tamper resistance
- Attempt to edit a ledger entry after creation
- Attempt to delete a ledger entry
- Attempt to replay a signed ledger entry with modified content
- Verify hash chain is intact after a sequence of entries
- Verify tamper detection triggers on any modification

### 2. Accreditation evidence-chain integrity
- Simulate an accreditor export request and verify chain-of-custody is complete
- Verify ledger entries are exportable in a format legible without the application
- Simulate an appeal scenario: can a grade be defended using only the exported ledger?

### 3. Prompt injection via student-submitted content
- Submit an adversarial student assignment designed to override the concept-check prompt
- Submit content designed to extract other students' data from the AI context
- Submit content designed to change the grading rubric at inference time
- Submit content designed to produce a false "pass" in the grading pipeline

### 4. FERPA exposure paths
- Verify no student PII is logged in plaintext in application logs
- Verify cross-tenant data access is not possible (tenant A cannot read tenant B's data)
- Verify third-party model calls do not include un-anonymized student work (if applicable)
- Verify student data deletion or export (right-to-access) flows exist or are documented as deferred

### 5. Grade-appeal stress test
- Simulate a student disputing a concept-check outcome
- Verify the instructor can reconstruct the full interaction from the ledger
- Verify the ledger output is legible to a non-technical reviewer (e.g., faculty committee)

---

## Acta-specific rules

- All five categories above are mandatory — none may be skipped without a founder-approved
  waiver recorded in `docs/decisions.md`.
- FERPA exposure paths are mandatory test cases — not optional security hardening.
- Any Critical finding blocks `/review-demo` go/no-go until resolved or founder-approved.
- Results must cite the specific test case, the observed behavior, and the severity rationale.

---

## Output

`docs/red-team-report.md` — complete results with:
- Test case name
- Category
- Severity (Critical / High / Medium / Low)
- Observed behavior
- Pass / Fail
- Remediation status and owner
