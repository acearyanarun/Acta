import type { AiHelpPolicy, AssignmentPolicyVersion, HelpRequestType } from "./types.js";

const HARD_RULE_SENTENCE =
  "If the student asks for a final answer, complete solution, direct submission, " +
  'or copy-pasteable response while "Restrict final answer" is ENABLED, refuse and ' +
  "redirect to allowed support: concept explanation, hint, example, or debugging " +
  "guidance if permitted.";

const NO_DETECTION_SENTENCE =
  "Never claim to detect AI usage; Acta verifies understanding, it does not detect AI use.";

function helpLine(label: string, allowed: boolean, hardRule = false): string {
  if (hardRule) {
    return `- ${label}: ${allowed ? "ENABLED — hard rule" : "disabled"}`;
  }
  return `- ${label}: ${allowed ? "allowed" : "not allowed"}`;
}

export type PromptBuildInput = {
  policy: AssignmentPolicyVersion;
  requestType?: HelpRequestType;
};

export function buildSystemPrompt({ policy, requestType }: PromptBuildInput): string {
  const ai: AiHelpPolicy = policy.aiHelp;
  const lines: string[] = [];

  lines.push(
    "You are Acta — a verification-first study assistant for a single named assignment.",
    "",
    `ASSIGNMENT TITLE: ${policy.title}`,
    "",
    "INSTRUCTIONS THE STUDENT IS WORKING ON:",
    policy.instructions,
    "",
  );

  if (policy.rubric && policy.rubric.trim().length > 0) {
    lines.push("RUBRIC THE INSTRUCTOR SET:", policy.rubric, "");
  }

  lines.push(
    "HELP POLICY FOR THIS ASSIGNMENT (set by the instructor; binding):",
    helpLine("Concept explanation", ai.conceptExplanation),
    helpLine("Hints", ai.hints),
    helpLine("Examples", ai.examples),
    helpLine("Debugging guidance", ai.debuggingGuidance),
    helpLine("Restrict final answer", ai.restrictFinalAnswer, true),
    "",
    "RULES YOU MUST FOLLOW:",
    '1. If a help type is "not allowed", do NOT provide that kind of help. ' +
      "Politely decline and redirect to an allowed type.",
  );

  if (ai.restrictFinalAnswer) {
    lines.push(`2. ${HARD_RULE_SENTENCE}`);
  } else {
    lines.push(
      '2. "Restrict final answer" is disabled for this assignment. You may answer ' +
        "directly when appropriate, but still favor Socratic guidance.",
    );
  }

  lines.push(
    `3. ${NO_DETECTION_SENTENCE}`,
    "4. Stay on this assignment. Do not assist with anything else.",
    "5. Keep responses concise.",
  );

  if (requestType) {
    lines.push("", `STUDENT'S REQUESTED HELP TYPE: ${requestType}`);
  }

  return lines.join("\n");
}

// Heuristic for the stub provider — also documented in ai-spec.md.
// Used as a defense-in-depth check; the real enforcement is via the system prompt.
const ANSWER_TRIGGER_PHRASES = [
  "the answer",
  "give me the answer",
  "what's the answer",
  "what is the answer",
  "solve it for me",
  "complete it for me",
  "write the solution",
  "give me the solution",
  "full solution",
  "give me the code",
  "write the code",
  "copy",
  "copyable",
  "copy-paste",
  "do it for me",
  "just tell me",
  "final answer",
];

export function messageAsksForFinalAnswer(text: string): boolean {
  const lower = text.toLowerCase();
  return ANSWER_TRIGGER_PHRASES.some((phrase) => lower.includes(phrase));
}

export function helpTypeRequiresAllowedFlag(
  requestType: HelpRequestType,
): keyof AiHelpPolicy | null {
  switch (requestType) {
    case "hint":
      return "hints";
    case "explanation":
      return "conceptExplanation";
    case "example":
      return "examples";
    case "debugging":
      return "debuggingGuidance";
    case "general":
      return null; // "general" is always allowed at the request-type layer
  }
}
