import { createHash } from "node:crypto";

// SHA-256 hex of the input string. Used for `content_hash` on submissions (D-029)
// and reused by the future `submission.created` ledger event.
export function computeContentHash(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}
