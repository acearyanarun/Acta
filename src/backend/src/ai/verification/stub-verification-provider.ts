import type {
  ConceptCheckQuestion,
  PerQuestionFeedback,
  ReferenceSolution,
  VerificationAnswer,
  VerificationResult,
  VerificationStatus,
} from "../../lib/types.js";
import type {
  VerificationProvider,
  VerificationProviderRequest,
  VerificationProviderResult,
} from "./types.js";

// D-035: deterministic per (answers, conceptCheckSetId, question IDs).
// Heuristic — NOT a pedagogical grading model.
//
// DOMAIN-NEUTRAL by design (D-047-adjacent generalization): the classifier
// does NOT hardcode any subject-specific vocabulary. Specificity is judged via:
//   (a) generic reasoning connectives (language-level, e.g. "because"),
//   (b) overlap with the INSTRUCTOR-PROVIDED keyConcepts / requiredReasoningSteps
//       — i.e., the instructor supplies the domain vocabulary, not the stub,
//   (c) length + lexical diversity as a fallback for long detailed answers.
//
// Calibration layers (applied in order; first match wins):
//   1. Dismissive / non-answer / contradicts-self phrases    → insufficient
//   2. Generic-vague patterns (any domain)                   → partial
//   3. trimmed length < 40                                   → insufficient
//   4. 40..119                                               → partial
//   5. Long + varied + specificity signal                    → sufficient
//   6. Long + very-detailed (length & unique-word override)  → sufficient
//   7. else                                                  → partial

function uniqueWordCount(text: string): number {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length > 0);
  return new Set(tokens).size;
}

/**
 * Domain-NEUTRAL non-answer / dismissive / clearly-incorrect phrasings that
 * force `insufficient` regardless of length. Every pattern here would apply
 * across any subject (history, math, security, business, etc.).
 */
const NON_ANSWER_PATTERNS: RegExp[] = [
  // Explicit non-answer.
  /\bi\s+(do\s+not|don['’]?t)\s+know\b/i,
  /\bidk\b/i,
  // Generic dismissals — "X is not important", "X isn't important", "doesn't matter".
  /\b(is\s+not|isn['’]?t)\s+important\b/i,
  /\b(does\s+not|doesn['’]?t)\s+matter\b/i,
  /\bnot\s+useful\b/i,
  // Self-contradicting "the opposite is best" phrasing.
  /\bthe\s+opposite\s+(of|is)\b.*\b(best|correct|right)\b/i,
];

/**
 * Domain-NEUTRAL vague patterns that cap an answer at `partial`. These are
 * structural English phrasings that say nothing specific about the assignment.
 */
const VAGUE_PATTERNS: RegExp[] = [
  // "Because it is important" with no follow-on detail.
  /^\s*because\s+it\s+is\s+important[.\s]*$/i,
  // "It is important" / "It is important so" / "It is important because" with no detail
  // — stand-alone short claims.
  /^\s*it\s+is\s+important\b[^.]{0,40}$/i,
  // "It helps" / "This helps" / "That helps" with no follow-on mechanism.
  /^\s*(it|this|that)\s+helps\b[^.]{0,40}$/i,
  // "It helps the process" / "helps the system" — generic helper claim.
  /\b(it|this|that)\s+helps\s+the\s+(process|system|user|company)\b/i,
  // "I would check if it looks wrong/weird/off/strange/fishy/suspicious" — vague inspect.
  /\b(check|see)\s+if\s+it\s+looks\s+(wrong|weird|strange|off|fishy|suspicious|bad)\b/i,
  // "This works because of the concept we learned" — vague concept-reference.
  /\bworks\s+because\s+of\s+the\s+(concept|idea|thing|stuff)\b/i,
  // "Training helps people [generic verb]" without a named outcome.
  /\btraining\s+helps\s+people\b/i,
  // "X means they want you to [generic verb]" — vague intent claim.
  /\bmeans\s+(they|the\s+\w+)\s+wants?\s+you\s+to\b/i,
];

/**
 * Domain-NEUTRAL reasoning connectives. Presence of one of these is a soft
 * signal that the student is attempting causal/mechanistic explanation. Not a
 * guarantee of specificity — must combine with length + diversity.
 */
const REASONING_CONNECTIVES: RegExp[] = [
  /\bbecause\b/i,
  /\btherefore\b/i,
  /\bso\s+that\b/i,
  /\bwhich\s+(means|allows|leads|enables|results)\b/i,
  /\bin\s+order\s+to\b/i,
  /\bleads\s+to\b/i,
  /\bresults?\s+in\b/i,
  /\bfor\s+example\b/i,
  /\bspecifically\b/i,
  /\b(assumed|assume|assumption|assumptions)\b/i,
  /\bgiven\s+that\b/i,
];

function matchesAny(patterns: RegExp[], text: string): boolean {
  for (const re of patterns) if (re.test(text)) return true;
  return false;
}

/**
 * Tokenize an instructor-provided concept/step list into single words ≥ 4 chars.
 * The 4-char floor avoids common short words ("the", "and", "to") leaking in.
 */
function instructorVocabulary(ref: ReferenceSolution | null | undefined): Set<string> {
  if (!ref) return new Set();
  const sources = [...ref.keyConcepts, ...ref.requiredReasoningSteps];
  const out = new Set<string>();
  for (const src of sources) {
    for (const tok of src
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter((t) => t.length >= 4)) {
      out.add(tok);
    }
  }
  return out;
}

function hasReferenceOverlap(text: string, vocab: Set<string>): boolean {
  if (vocab.size === 0) return false;
  const lower = text.toLowerCase();
  for (const tok of vocab) {
    if (lower.includes(tok)) return true;
  }
  return false;
}

function classify(answer: string, instructorVocab: Set<string>): VerificationStatus {
  const trimmed = answer.trim();
  const len = trimmed.length;

  // 1. Non-answer / dismissive / contradicts-self → insufficient regardless of length.
  if (matchesAny(NON_ANSWER_PATTERNS, trimmed)) return "insufficient";

  // 2. Vague structural patterns cap at partial.
  if (matchesAny(VAGUE_PATTERNS, trimmed)) return "partial";

  // 3 / 4. Length-based floors.
  if (len < 40) return "insufficient";
  if (len < 120) return "partial";

  const unique = uniqueWordCount(trimmed);
  const hasConnective = matchesAny(REASONING_CONNECTIVES, trimmed);
  const hasOverlap = hasReferenceOverlap(trimmed, instructorVocab);

  // 5. Medium-long answer: needs lexical variety AND either a reasoning connective
  //    OR overlap with the instructor's named concepts/steps. The instructor's
  //    reference is the ONLY source of domain-specific vocabulary the stub uses.
  if (unique >= 8 && (hasConnective || hasOverlap)) return "sufficient";

  // 6. Very-long detailed answer override: a 150+ char, 15+ unique-word answer
  //    is treated as specific by virtue of detail, even without a connective.
  //    This catches well-formed technical explanations across any domain.
  if (len >= 150 && unique >= 15) return "sufficient";

  // 7. Otherwise: long but generic → partial.
  return "partial";
}

function snippet(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max)}…`;
}

function feedbackFor(status: VerificationStatus, answer: string): string {
  const head = snippet(answer, 40);
  if (status === "sufficient") {
    return `Answer demonstrates understanding ("${head}"). Reasoning is grounded in the submission.`;
  }
  if (status === "partial") {
    return `Answer is partial or unclear ("${head}"). Add more specific reasoning tied to the submission.`;
  }
  return `Answer is too short or generic ("${head}"). It does not demonstrate understanding of the submission.`;
}

function aggregate(statuses: VerificationStatus[]): VerificationResult {
  if (statuses.length === 0) return "fail";
  const total = statuses.length;
  const sufficient = statuses.filter((s) => s === "sufficient").length;
  const partial = statuses.filter((s) => s === "partial").length;
  const insufficient = statuses.filter((s) => s === "insufficient").length;

  // fail: "mostly insufficient" — strictly more than half of answers are
  // insufficient, regardless of whether one was sufficient. Also fail when no
  // answer is sufficient AND insufficient outweighs partial.
  if (insufficient > total / 2) return "fail";
  if (sufficient === 0 && insufficient >= partial) return "fail";

  // pass: most answers sufficient, with at most one partial and no insufficient.
  // Implements the product threshold: "at most one partial if the rest are strong".
  if (insufficient === 0 && partial <= 1 && sufficient >= total - 1) {
    return "pass";
  }

  // needs_review: anything else — mixed quality, multiple partials, or one
  // insufficient with otherwise-decent answers.
  return "needs_review";
}

function overallFeedbackFor(result: VerificationResult, statuses: VerificationStatus[]): string {
  const total = statuses.length;
  const sufficient = statuses.filter((s) => s === "sufficient").length;
  const partial = statuses.filter((s) => s === "partial").length;
  const insufficient = statuses.filter((s) => s === "insufficient").length;
  const counts = `(${sufficient} sufficient, ${partial} partial, ${insufficient} insufficient of ${total})`;
  if (result === "pass") {
    return `Verification PASS ${counts}. Answers demonstrate understanding of the student's submission.`;
  }
  if (result === "needs_review") {
    return `Verification NEEDS REVIEW ${counts}. Some answers are partial or unclear — instructor should review.`;
  }
  return `Verification FAIL ${counts}. Answers do not demonstrate understanding of the submission.`;
}

export function createStubVerificationProvider(): VerificationProvider {
  return {
    name: "stub",
    model: null,
    async evaluate(req: VerificationProviderRequest): Promise<VerificationProviderResult> {
      const byId = new Map<string, ConceptCheckQuestion>(req.questions.map((q) => [q.id, q]));
      // Build the instructor's vocabulary ONCE per attempt. When no reference exists,
      // this is empty — the classifier falls back to generic reasoning connectives.
      const instructorVocab = instructorVocabulary(req.referenceSolution);
      const perQuestion: PerQuestionFeedback[] = [];
      const statuses: VerificationStatus[] = [];
      for (const q of req.questions) {
        const answerRow = req.answers.find((a) => a.questionId === q.id);
        const text = answerRow?.answer ?? "";
        const status = classify(text, instructorVocab);
        statuses.push(status);
        perQuestion.push({
          questionId: q.id,
          status,
          feedback: feedbackFor(status, text),
        });
        void byId; // suppress unused-binding warning; map kept for future enrichment
      }
      const result = aggregate(statuses);
      let overallFeedback = overallFeedbackFor(result, statuses);
      // D-044: when a reference solution is present, append a deterministic
      // traceability note. Aggregation rules are unchanged.
      const ref = req.referenceSolution;
      if (ref) {
        const shortHash = ref.referenceHash.slice(0, 8);
        overallFeedback = `${overallFeedback} Reference applied (v${ref.version}, hash ${shortHash}).`;
      }
      return {
        result,
        overallFeedback,
        perQuestionFeedback: perQuestion,
      };
    },
  };
}
