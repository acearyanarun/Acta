import type {
  AssignmentPolicyVersion,
  ConceptCheckQuestion,
  PerQuestionFeedback,
  ReferenceSolution,
  Submission,
  VerificationAnswer,
  VerificationResult,
} from "../../lib/types.js";

export type VerificationProviderRequest = {
  policy: AssignmentPolicyVersion;
  submission: Submission;
  questions: ConceptCheckQuestion[];
  answers: VerificationAnswer[];
  systemPrompt: string;
  referenceSolution?: ReferenceSolution | null;
};

export type VerificationProviderResult = {
  result: VerificationResult;
  overallFeedback: string;
  perQuestionFeedback: PerQuestionFeedback[];
};

export type VerificationProvider = {
  readonly name: "stub" | "anthropic" | "openai";
  readonly model: string | null;
  evaluate(req: VerificationProviderRequest): Promise<VerificationProviderResult>;
};
