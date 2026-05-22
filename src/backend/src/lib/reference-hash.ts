import { createHash } from "node:crypto";

export type HashableReferenceBody = {
  assignmentId: string;
  tenantId: string;
  instructorId: string;
  version: number;
  expectedSolution: string;
  // Lists preserve order — D-040 explicitly states reordering changes the hash.
  keyConcepts: string[];
  requiredReasoningSteps: string[];
  commonMistakes: string[];
  correctnessCriteria: string;
  optionalNotes: string | null;
};

// Canonical JSON: object keys sorted recursively. Arrays preserve insertion order
// (D-040: order is meaningful for instructors).
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

export function computeReferenceHash(body: HashableReferenceBody): string {
  const json = canonical(body);
  return createHash("sha256").update(json).digest("hex");
}
