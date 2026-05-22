// D-003 enforcement: real student data is forbidden until a signed FERPA DPA exists.
// This guard runs at boot. It is intentionally loud and refuses to start the server
// if the configuration claims real data is allowed without a DPA reference.

export type GuardConfig = {
  allowRealStudentData: boolean;
  ferpaDpaReference: string;
};

export type GuardResult = { ok: true } | { ok: false; reason: string };

export function evaluateSyntheticDataGuard(config: GuardConfig): GuardResult {
  if (!config.allowRealStudentData) {
    return { ok: true };
  }
  if (config.ferpaDpaReference.length === 0) {
    return {
      ok: false,
      reason:
        "ALLOW_REAL_STUDENT_DATA=true requires FERPA_DPA_REFERENCE to be set. " +
        "Real student data is forbidden until D-003 production sub-task is closed " +
        "and a signed DPA is in place. See docs/decisions.md.",
    };
  }
  return { ok: true };
}

export function assertSyntheticDataGuard(config: GuardConfig): void {
  const result = evaluateSyntheticDataGuard(config);
  if (!result.ok) {
    // Boot-time refusal — surface loudly and exit non-zero.
    // eslint-disable-next-line no-console
    console.error(`[acta] FERPA guard refused boot: ${result.reason}`);
    process.exit(1);
  }
}
