import { createHash } from "node:crypto";
import type { AiHelpPolicy, VerificationMode } from "./types.js";

export type HashableVersionBody = {
  assignmentId: string;
  tenantId: string;
  instructorId: string;
  version: number;
  title: string;
  instructions: string;
  rubric: string | null;
  aiHelp: AiHelpPolicy;
  aiHelpEnabled: boolean;
  verificationMode: VerificationMode;
};

// Canonical JSON: sort object keys recursively so the same logical content always
// serializes to the same string regardless of insertion order.
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`).join(",")}}`;
}

export function computePolicyHash(body: HashableVersionBody): string {
  const json = canonical(body);
  return createHash("sha256").update(json).digest("hex");
}
