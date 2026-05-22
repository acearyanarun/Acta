# Red Team Report

**Purpose:** Results of red-team testing including ledger tamper, evidence-chain integrity,
prompt injection, FERPA exposure paths, and grade-appeal stress test.
**Owner:** qa-security-devops-agent
**Last updated:** 2026-05-05
**Status:** Draft — to be populated after /run-red-team executes

---

## Summary

_To be completed by qa-security-devops-agent after red-team run._

---

## Results by category

### 1. Ledger tamper resistance

| Test ID | Test case | Result | Severity | Remediation | Status |
|---------|-----------|--------|---------|-------------|--------|
| LT-001 | Edit ledger entry after creation | — | — | — | — |
| LT-002 | Delete ledger entry | — | — | — | — |
| LT-003 | Replay signed entry with modified content | — | — | — | — |
| LT-004 | Hash chain integrity after sequence | — | — | — | — |

### 2. Accreditation evidence-chain integrity

| Test ID | Test case | Result | Severity | Remediation | Status |
|---------|-----------|--------|---------|-------------|--------|
| AC-001 | Accreditor export request — chain-of-custody complete | — | — | — | — |
| AC-002 | Export legible without the application | — | — | — | — |
| AC-003 | Contested grade defended using exported ledger only | — | — | — | — |

### 3. Prompt injection via student-submitted content

_See docs/prompt-injection-tests.md for test case definitions._

| Test ID | Result | Severity | Remediation | Status |
|---------|--------|---------|-------------|--------|
| PI-001 | — | — | — | — |

### 4. FERPA exposure paths

| Test ID | Test case | Result | Severity | Remediation | Status |
|---------|-----------|--------|---------|-------------|--------|
| FP-001 | Student PII in plaintext logs | — | — | — | — |
| FP-002 | Cross-tenant data access | — | — | — | — |
| FP-003 | Third-party model call with un-anonymized PII | — | — | — | — |

### 5. Grade-appeal stress test

| Test ID | Test case | Result | Severity | Status |
|---------|-----------|--------|---------|--------|
| GA-001 | Instructor reconstructs session from ledger | — | — | — |
| GA-002 | Ledger legible to non-technical reviewer | — | — | — |

---

## Open findings requiring remediation before demo

_To be populated._

---

## Go/no-go recommendation

_To be completed by qa-security-devops-agent._
