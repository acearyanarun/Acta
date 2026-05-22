import { describe, expect, it } from "vitest";
import { createStubVerificationProvider } from "../src/backend/src/ai/verification/stub-verification-provider.js";
import type { VerificationProviderRequest } from "../src/backend/src/ai/verification/types.js";
import type {
  AiHelpPolicy,
  AssignmentPolicyVersion,
  ConceptCheckQuestion,
  ReferenceSolution,
  Submission,
  VerificationAnswer,
} from "../src/backend/src/lib/types.js";
import { buildVerificationSystemPrompt } from "../src/backend/src/lib/verification-prompt-builder.js";

// Generalized calibration: the stub's specificity signal must come from
// (a) generic reasoning connectives or (b) the instructor's own vocabulary
// — NEVER from a hardcoded domain checklist.
//
// To prove that, every fixture in this file uses a DIFFERENT domain
// (history essay, math proof, business case, generic "no reference" case).

const ALL_AI: AiHelpPolicy = {
  conceptExplanation: true,
  hints: true,
  examples: true,
  debuggingGuidance: true,
  restrictFinalAnswer: true,
};

function policyFor(title: string, instructions: string): AssignmentPolicyVersion {
  return {
    id: "pv-1",
    assignmentId: "a-1",
    tenantId: "t",
    instructorId: "i",
    version: 1,
    title,
    instructions,
    rubric: null,
    aiHelp: ALL_AI,
    aiHelpEnabled: true,
    verificationMode: "score",
    policyHash: "f".repeat(64),
    createdAt: new Date().toISOString(),
  };
}

function submissionFor(content: string): Submission {
  return {
    id: "sub-1",
    tenantId: "t",
    assignmentId: "a-1",
    studentId: "s",
    policyVersionId: "pv-1",
    policyVersion: 1,
    policyHash: "f".repeat(64),
    content,
    contentHash: "c".repeat(64),
    submittedAt: new Date().toISOString(),
  };
}

function refFor(opts: {
  keyConcepts: string[];
  requiredReasoningSteps: string[];
  commonMistakes?: string[];
}): ReferenceSolution {
  return {
    id: "rs-1",
    tenantId: "t",
    assignmentId: "a-1",
    instructorId: "i",
    version: 1,
    expectedSolution: "(instructor authoritative solution — not echoed in feedback)",
    keyConcepts: opts.keyConcepts,
    requiredReasoningSteps: opts.requiredReasoningSteps,
    commonMistakes: opts.commonMistakes ?? [],
    correctnessCriteria: "Correct when student names the required concepts and explains why.",
    optionalNotes: null,
    referenceHash: "a".repeat(64),
    createdAt: new Date().toISOString(),
  };
}

function makeReq(opts: {
  policy: AssignmentPolicyVersion;
  submission: Submission;
  questions: ConceptCheckQuestion[];
  answers: VerificationAnswer[];
  reference?: ReferenceSolution | null;
}): VerificationProviderRequest {
  return {
    policy: opts.policy,
    submission: opts.submission,
    questions: opts.questions,
    answers: opts.answers,
    systemPrompt: "(ignored by stub)",
    referenceSolution: opts.reference ?? null,
  };
}

// ---------- Prompt-builder rubric assertions (domain-neutral) ----------

describe("verification prompt — generalized rubric (D-047-adjacent)", () => {
  const prompt = buildVerificationSystemPrompt({
    policy: policyFor("Any assignment", "Any instructions."),
    submission: submissionFor("Any submission."),
    questions: [{ id: "q1", ordinal: 1, prompt: "?" }],
    answers: [{ questionId: "q1", answer: "x" }],
  });

  it("declares the evaluator is general-purpose / domain-neutral", () => {
    expect(prompt).toMatch(/DOMAIN-NEUTRAL EVALUATION/);
    expect(prompt).toMatch(/general-purpose evaluator/);
  });

  it("forbids a built-in domain checklist and lists the four allowed sources of specificity", () => {
    expect(prompt).toMatch(/Do NOT apply any built-in domain checklist/);
    expect(prompt).toContain("TRUSTED INSTRUCTOR REFERENCE CONTEXT");
    expect(prompt).toContain("ASSIGNMENT INSTRUCTIONS");
    expect(prompt).toContain("CONCEPT-CHECK QUESTION");
    expect(prompt).toContain("STUDENT SUBMISSION");
  });

  it("names the instructor's reference as the ONLY source of domain-specific expectation", () => {
    expect(prompt).toContain("The instructor's reference is the only");
  });

  it("uses GENERIC examples (no security/math/business jargon)", () => {
    expect(prompt).toContain("Because it is important.");
    expect(prompt).toContain("It helps because the system needs it.");
    expect(prompt).toContain("I would check if it looks wrong.");
    // No phishing/security jargon should appear in the prompt template itself.
    expect(prompt).not.toMatch(/phishing/i);
    expect(prompt).not.toMatch(/SPF|DKIM|DMARC/);
  });

  it("retains the safety contract: no course grade, no AI-detection claim", () => {
    expect(prompt).toContain("do NOT produce a course grade");
    expect(prompt).toContain("Never claim to detect AI usage");
  });

  it("retains the JSON-only output contract", () => {
    expect(prompt).toContain("Output JSON ONLY");
    expect(prompt).toContain('"perQuestionFeedback"');
  });

  it("with reference present, adds the reference-context rules block", () => {
    const withRef = buildVerificationSystemPrompt({
      policy: policyFor("X", "Y"),
      submission: submissionFor("Z"),
      questions: [{ id: "q1", ordinal: 1, prompt: "?" }],
      answers: [{ questionId: "q1", answer: "x" }],
      referenceSolution: refFor({
        keyConcepts: ["concept A"],
        requiredReasoningSteps: ["step 1"],
      }),
    });
    expect(withRef).toMatch(/REFERENCE-CONTEXT RULES/);
    expect(withRef).toMatch(/requiredReasoningStep/);
    expect(withRef).toMatch(/Do NOT echo the instructor's expectedSolution/);
  });
});

// ---------- Stub: GENERIC vague answers cap at partial (no reference) ----------

describe("stub — generic vague answers (NO instructor reference)", () => {
  const provider = createStubVerificationProvider();
  const policy = policyFor("Generic assignment", "Explain your thinking on the topic.");
  const submission = submissionFor("My short submission about the topic.");
  const questions: ConceptCheckQuestion[] = [
    { id: "q1", ordinal: 1, prompt: "Why does this matter?" },
    { id: "q2", ordinal: 2, prompt: "How would you check it?" },
    { id: "q3", ordinal: 3, prompt: "What does it help with?" },
    { id: "q4", ordinal: 4, prompt: "Why is training relevant?" },
  ];

  it("brief's exact generic examples are NOT sufficient", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions,
        answers: [
          { questionId: "q1", answer: "Because it is important." },
          { questionId: "q2", answer: "I would check if it looks wrong." },
          { questionId: "q3", answer: "It helps the process." },
          { questionId: "q4", answer: "Training helps people understand." },
        ],
      }),
    );
    expect(r.result).not.toBe("pass");
    expect(["needs_review", "fail"]).toContain(r.result);
    for (const f of r.perQuestionFeedback) {
      expect(f.status).not.toBe("sufficient");
    }
  });

  it("'I do not know.' / 'idk' → insufficient", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions: questions.slice(0, 2),
        answers: [
          { questionId: "q1", answer: "I do not know." },
          { questionId: "q2", answer: "idk" },
        ],
      }),
    );
    expect(r.perQuestionFeedback.every((f) => f.status === "insufficient")).toBe(true);
  });

  it("dismissive 'it is not important' / 'doesn't matter' → insufficient", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions: questions.slice(0, 2),
        answers: [
          { questionId: "q1", answer: "This is not important for the assignment." },
          { questionId: "q2", answer: "It doesn't matter for what we are doing." },
        ],
      }),
    );
    expect(r.perQuestionFeedback.every((f) => f.status === "insufficient")).toBe(true);
  });

  it("'the opposite of the correct method is best' → insufficient (contradiction)", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions: questions.slice(0, 1),
        answers: [{ questionId: "q1", answer: "The opposite of the correct approach is best." }],
      }),
    );
    expect(r.perQuestionFeedback[0]?.status).toBe("insufficient");
  });
});

// ---------- Stub: HISTORY essay — instructor vocabulary drives specificity ----------

describe("stub — history essay (domain: industrial revolution)", () => {
  const provider = createStubVerificationProvider();
  const policy = policyFor(
    "Industrial Revolution causes",
    "Explain the main causes of the British Industrial Revolution.",
  );
  const submission = submissionFor(
    "The Industrial Revolution started in Britain because of coal, capital, and labour mobility from the enclosures.",
  );
  const reference = refFor({
    keyConcepts: [
      "coal supply",
      "capital accumulation",
      "enclosure movement",
      "agricultural surplus",
    ],
    requiredReasoningSteps: [
      "name an economic factor",
      "name a social factor",
      "explain why Britain specifically",
    ],
    commonMistakes: ["confusing First and Second Industrial Revolutions"],
  });
  const questions: ConceptCheckQuestion[] = [
    { id: "q1", ordinal: 1, prompt: "Why does coal matter in your account?" },
    { id: "q2", ordinal: 2, prompt: "What role did enclosure play?" },
  ];

  it("vague 'it was important because of resources' → partial (no reference overlap, no specificity)", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions: questions.slice(0, 1),
        answers: [
          {
            questionId: "q1",
            answer: "It was important because resources were available at the time.",
          },
        ],
        reference,
      }),
    );
    expect(r.perQuestionFeedback[0]?.status).not.toBe("sufficient");
  });

  it("specific answer that names instructor keyConcepts AND uses 'because' → sufficient", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions: questions.slice(0, 1),
        answers: [
          {
            questionId: "q1",
            answer:
              "Coal supply was the binding energy input because steam engines were rate-limited by fuel; abundant British coal enabled the capital accumulation that funded factory expansion.",
          },
        ],
        reference,
      }),
    );
    expect(r.perQuestionFeedback[0]?.status).toBe("sufficient");
  });

  it("answer that overlaps instructor vocabulary (enclosure) reaches sufficient via reference overlap", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions: questions.slice(1, 2),
        answers: [
          {
            questionId: "q2",
            answer:
              "Enclosure pushed agricultural labour into towns and created the wage-labour pool the new factories needed; without that mobility the surplus would not have been usable.",
          },
        ],
        reference,
      }),
    );
    expect(r.perQuestionFeedback[0]?.status).toBe("sufficient");
  });
});

// ---------- Stub: MATH proof — instructor vocabulary drives specificity ----------

describe("stub — math proof (domain: induction on naturals)", () => {
  const provider = createStubVerificationProvider();
  const policy = policyFor("Proof by induction", "Prove the sum 1+2+...+n = n(n+1)/2.");
  const submission = submissionFor(
    "I proved it by induction on n. Base case n=1. Inductive step assumes for k, shows for k+1.",
  );
  const reference = refFor({
    keyConcepts: ["base case", "inductive hypothesis", "inductive step"],
    requiredReasoningSteps: [
      "state the base case",
      "state the inductive hypothesis",
      "derive the k+1 case",
    ],
  });
  const questions: ConceptCheckQuestion[] = [
    { id: "q1", ordinal: 1, prompt: "Why is the base case necessary?" },
    { id: "q2", ordinal: 2, prompt: "How does the inductive step use the hypothesis?" },
  ];

  it("vague 'because that's how induction works' → not sufficient", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions: questions.slice(0, 1),
        answers: [{ questionId: "q1", answer: "Because that is how induction works." }],
        reference,
      }),
    );
    expect(r.perQuestionFeedback[0]?.status).not.toBe("sufficient");
  });

  it("answer that names 'base case' and explains why → sufficient (instructor vocab + connective)", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions: questions.slice(0, 1),
        answers: [
          {
            questionId: "q1",
            answer:
              "The base case anchors the chain because without proving n=1 the inductive step would never connect to a true statement; it is the foothold the inductive hypothesis builds on.",
          },
        ],
        reference,
      }),
    );
    expect(r.perQuestionFeedback[0]?.status).toBe("sufficient");
  });
});

// ---------- Stub: BUSINESS case (no reference) — generic reasoning wins ----------

describe("stub — business case study (NO reference)", () => {
  const provider = createStubVerificationProvider();
  const policy = policyFor(
    "Pricing strategy",
    "Justify a pricing strategy for a new SaaS product.",
  );
  const submission = submissionFor(
    "I recommend value-based pricing because our willingness-to-pay study showed wide variance across segments.",
  );
  const questions: ConceptCheckQuestion[] = [
    { id: "q1", ordinal: 1, prompt: "Why value-based and not cost-plus?" },
  ];

  it("vague 'because pricing is important' → partial (no reference, no connective + mechanism)", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions,
        answers: [{ questionId: "q1", answer: "Because pricing is important for revenue." }],
        // No reference solution — only generic signals available.
      }),
    );
    expect(r.perQuestionFeedback[0]?.status).not.toBe("sufficient");
  });

  it("detailed answer with reasoning connectives reaches sufficient even WITHOUT a reference", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions,
        answers: [
          {
            questionId: "q1",
            answer:
              "Value-based works here because the segment variance we measured means a single cost-plus number would either leave money on the table at the top of the curve or price out the bottom; tiered value-based pricing captures both ends and lets us steer toward the segment that scales.",
          },
        ],
      }),
    );
    expect(r.perQuestionFeedback[0]?.status).toBe("sufficient");
  });
});

// ---------- Stub: aggregator thresholds ----------

describe("stub — aggregator thresholds (general)", () => {
  const provider = createStubVerificationProvider();
  const policy = policyFor("Any", "Any");
  const submission = submissionFor("Any submission.");
  const questions: ConceptCheckQuestion[] = [
    { id: "q1", ordinal: 1, prompt: "?" },
    { id: "q2", ordinal: 2, prompt: "?" },
    { id: "q3", ordinal: 3, prompt: "?" },
    { id: "q4", ordinal: 4, prompt: "?" },
  ];

  const STRONG_ANSWERS: VerificationAnswer[] = [
    {
      questionId: "q1",
      answer:
        "The first step matters because it establishes the structural assumption that the rest of the argument depends on; without it the next step would not be justified.",
    },
    {
      questionId: "q2",
      answer:
        "I chose this approach because my submission relies on the property of monotonicity, and the alternative would not have preserved that property in the second case.",
    },
    {
      questionId: "q3",
      answer:
        "The mechanism is that each unit of effort produces a proportional change in the outcome, which is why the linear model fits and a non-linear one would be overkill for this assignment.",
    },
    {
      questionId: "q4",
      answer:
        "Training works because it forces the practitioner to rehearse the inference under low-stakes conditions; therefore when the stakes are real the habit is already in place.",
    },
  ];

  const VAGUE_ANSWERS: VerificationAnswer[] = [
    { questionId: "q1", answer: "Because it is important." },
    { questionId: "q2", answer: "I would check if it looks wrong." },
    { questionId: "q3", answer: "It helps the process." },
    { questionId: "q4", answer: "Training helps people understand." },
  ];

  it("STRONG all-sufficient → pass", async () => {
    const r = await provider.evaluate(
      makeReq({ policy, submission, questions, answers: STRONG_ANSWERS }),
    );
    expect(r.result).toBe("pass");
    expect(r.perQuestionFeedback.every((f) => f.status === "sufficient")).toBe(true);
  });

  it("WEAK generic attempt → needs_review or fail; no sufficient", async () => {
    const r = await provider.evaluate(
      makeReq({ policy, submission, questions, answers: VAGUE_ANSWERS }),
    );
    expect(["needs_review", "fail"]).toContain(r.result);
    expect(r.perQuestionFeedback.every((f) => f.status !== "sufficient")).toBe(true);
  });

  it("MIXED (sufficient + partial + partial + insufficient) → needs_review", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions,
        answers: [
          STRONG_ANSWERS[0] as VerificationAnswer,
          VAGUE_ANSWERS[1] as VerificationAnswer,
          VAGUE_ANSWERS[2] as VerificationAnswer,
          { questionId: "q4", answer: "idk" },
        ],
      }),
    );
    expect(r.result).toBe("needs_review");
    const s = r.perQuestionFeedback.map((f) => f.status).sort();
    expect(s).toEqual(["insufficient", "partial", "partial", "sufficient"]);
  });

  it("MOSTLY-INSUFFICIENT attempt → fail", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions,
        answers: [
          { questionId: "q1", answer: "I don't know." },
          { questionId: "q2", answer: "idk" },
          { questionId: "q3", answer: "This is not important." },
          STRONG_ANSWERS[3] as VerificationAnswer,
        ],
      }),
    );
    expect(r.result).toBe("fail");
  });

  it("three sufficient + one partial → pass (at-most-one-partial threshold)", async () => {
    const r = await provider.evaluate(
      makeReq({
        policy,
        submission,
        questions,
        answers: [
          STRONG_ANSWERS[0] as VerificationAnswer,
          STRONG_ANSWERS[1] as VerificationAnswer,
          STRONG_ANSWERS[2] as VerificationAnswer,
          VAGUE_ANSWERS[3] as VerificationAnswer,
        ],
      }),
    );
    expect(r.result).toBe("pass");
  });

  it("deterministic — same inputs produce same outputs", async () => {
    const a = await provider.evaluate(
      makeReq({ policy, submission, questions, answers: VAGUE_ANSWERS }),
    );
    const b = await provider.evaluate(
      makeReq({ policy, submission, questions, answers: VAGUE_ANSWERS }),
    );
    expect(a.result).toBe(b.result);
    expect(a.perQuestionFeedback.map((f) => f.status)).toEqual(
      b.perQuestionFeedback.map((f) => f.status),
    );
  });

  it("no AI-detection claim in any stub feedback", async () => {
    const r = await provider.evaluate(
      makeReq({ policy, submission, questions, answers: VAGUE_ANSWERS }),
    );
    const all = (
      r.overallFeedback + r.perQuestionFeedback.map((f) => f.feedback).join(" ")
    ).toLowerCase();
    expect(all).not.toContain(`${"ai"} ${"detection"}`);
    expect(all).not.toContain(`${"ai"}-${"detection"}`);
  });
});

// ---------- Provenance check: stub has NO hardcoded domain vocabulary ----------

describe("stub source — no hardcoded domain vocabulary (regression guard)", () => {
  it("source file does not contain phishing / security / photosynthesis tokens", () => {
    const src = require("node:fs").readFileSync(
      "src/backend/src/ai/verification/stub-verification-provider.ts",
      "utf8",
    );
    // These tokens would have hardcoded a domain. The whole point of the
    // generalization is that they're absent.
    const forbidden = [
      "chloroplast",
      "chlorophyll",
      "phishing",
      "SPF",
      "DKIM",
      "DMARC",
      "regression",
      "gaussian",
      "outlier",
    ];
    for (const tok of forbidden) {
      expect(src.toLowerCase()).not.toContain(tok.toLowerCase());
    }
  });
});
