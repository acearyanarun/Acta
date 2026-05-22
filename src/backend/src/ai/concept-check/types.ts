import type { AssignmentPolicyVersion, ReferenceSolution, Submission } from "../../lib/types.js";

export type ConceptCheckProviderRequest = {
  policy: AssignmentPolicyVersion;
  submission: Submission;
  questionCount: number;
  systemPrompt: string;
  referenceSolution?: ReferenceSolution | null;
};

export type GeneratedQuestion = {
  prompt: string;
  conceptTag?: string;
};

export type ConceptCheckProviderResult = {
  questions: GeneratedQuestion[];
};

export type ConceptCheckProvider = {
  readonly name: "stub" | "anthropic" | "openai";
  readonly model: string | null;
  generate(req: ConceptCheckProviderRequest): Promise<ConceptCheckProviderResult>;
};
