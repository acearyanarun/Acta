# /review-demo

Kicks off Phase 4 demo readiness review. Checks that the build is presentable, the demo
flow is rehearsed, and the go/no-go checklist is complete.

---

## What this command does

1. qa-security-devops-agent executes the demo readiness checklist.
2. ux-ui-designer-agent confirms the demo flow in `docs/demo-flow.md` matches the built product.
3. chief-of-staff-orchestrator reviews `docs/bug-list.md` for any open critical/high items.
4. All agents confirm their owned files are complete and accurate.
5. chief-of-staff-orchestrator produces a final go/no-go decision in `docs/go-no-go.md`.

---

## Demo readiness checklist (minimum)

**Verification core**
- [ ] Concept check generation works end-to-end from a student submission
- [ ] All three grading modes (or founder-approved subset) are functional
- [ ] Instructor can configure grading mode per assignment
- [ ] Student receives and completes a concept check
- [ ] Ledger records the interaction with cryptographic signature

**Ledger defends a grade**
- [ ] Instructor can view the signed ledger for a student
- [ ] Ledger entry is tamper-evident (qa-security-devops-agent has verified)
- [ ] A contested grade scenario can be walked through using only ledger output
- [ ] Export or audit trail is demonstrable

**Instructor UX**
- [ ] Instructor setup flow completes in under 5 minutes for a new assignment
- [ ] Grading-mode selector is clear and functional
- [ ] No unnecessary friction in the instructor-facing flow (C6 check)

**Student UX**
- [ ] Student submission and concept check flow is complete
- [ ] Student experience is not punitive or intimidating

**Security and compliance**
- [ ] No open critical security findings in `docs/red-team-report.md`
- [ ] FERPA exposure paths reviewed and addressed
- [ ] Multi-tenant isolation verified

---

## Go/no-go gate

`docs/go-no-go.md` must be signed off by the chief-of-staff-orchestrator before the demo.
Any open critical or high severity finding blocks go/no-go unless the founder explicitly
approves the risk in `docs/decisions.md`.
