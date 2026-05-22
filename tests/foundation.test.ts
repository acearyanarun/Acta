import { describe, expect, it } from "vitest";
import {
  type GuardConfig,
  evaluateSyntheticDataGuard,
} from "../src/backend/src/lib/synthetic-data-guard.js";

describe("synthetic-data-guard (D-003)", () => {
  it("allows boot when real-data flag is false (default)", () => {
    const cfg: GuardConfig = { allowRealStudentData: false, ferpaDpaReference: "" };
    expect(evaluateSyntheticDataGuard(cfg)).toEqual({ ok: true });
  });

  it("allows boot when real-data is true AND a DPA reference is set", () => {
    const cfg: GuardConfig = {
      allowRealStudentData: true,
      ferpaDpaReference: "DPA-2026-ANTHROPIC-001",
    };
    expect(evaluateSyntheticDataGuard(cfg)).toEqual({ ok: true });
  });

  it("REFUSES boot when real-data is true with NO DPA reference", () => {
    const cfg: GuardConfig = { allowRealStudentData: true, ferpaDpaReference: "" };
    const result = evaluateSyntheticDataGuard(cfg);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("FERPA_DPA_REFERENCE");
    }
  });
});

describe("foundation invariants", () => {
  it("backend env defaults to synthetic-data-only mode", async () => {
    const { loadEnv } = await import("../src/backend/src/lib/env.js");
    const env = loadEnv();
    expect(env.ALLOW_REAL_STUDENT_DATA).toBe(false);
  });
});
