import type {
  AssignmentPolicyVersion,
  ChatMessage,
  HelpOutcome,
  HelpRequestType,
} from "../../lib/types.js";

export type AiProviderResult = {
  content: string;
  outcome: HelpOutcome;
  outcomeReason?: string;
};

export type AiProviderRequest = {
  policy: AssignmentPolicyVersion;
  requestType?: HelpRequestType;
  systemPrompt: string;
  messages: ChatMessage[];
};

export type AiProvider = {
  readonly name: "stub" | "anthropic" | "openai";
  respond(req: AiProviderRequest): Promise<AiProviderResult>;
};
