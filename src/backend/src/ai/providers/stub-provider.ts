import { messageAsksForFinalAnswer } from "../../lib/prompt-builder.js";
import type { HelpRequestType } from "../../lib/types.js";
import type { AiProvider, AiProviderRequest, AiProviderResult } from "./types.js";

const CANNED_BY_TYPE: Record<HelpRequestType, string> = {
  hint:
    "Here is a small nudge. Think about which part of the instructions matches the " +
    "step you're stuck on, and try to name the underlying concept before drafting.",
  explanation:
    "Concept explanation: this question is about the relationship between the inputs and " +
    "the criteria in the instructions. Re-read the third paragraph carefully — the answer " +
    "depends on which dimension you choose to apply first.",
  example:
    "Example to anchor your thinking: imagine a simpler case with two inputs instead of " +
    "the full set. How would the criteria apply? Now scale that reasoning up.",
  debugging:
    "Debugging guidance: walk through your current attempt one step at a time. Where do " +
    "your assumptions stop matching what the instructions ask? Try to isolate that line.",
  general:
    "Let me know what specifically is blocking you. I can offer a hint, walk through a " +
    "concept, sketch an analogous example, or help you debug your current attempt — " +
    "whichever the instructor's policy permits.",
};

function redirectMessage(policy: AiProviderRequest["policy"]): string {
  const allowed: string[] = [];
  if (policy.aiHelp.hints) allowed.push("a hint");
  if (policy.aiHelp.conceptExplanation) allowed.push("a concept explanation");
  if (policy.aiHelp.examples) allowed.push("an analogous example");
  if (policy.aiHelp.debuggingGuidance) allowed.push("debugging guidance");
  const list = allowed.length === 0 ? "guidance" : allowed.join(", ");
  return `I can't give you the final answer for this assignment — the instructor has the "Restrict final answer" rule on. I can offer ${list}. Which would help?`;
}

export function createStubProvider(): AiProvider {
  return {
    name: "stub",
    async respond(req: AiProviderRequest): Promise<AiProviderResult> {
      const last = req.messages[req.messages.length - 1];
      const lastStudentText = last && last.role === "student" ? last.content : "";

      // Hard-rule defense in depth: even if requestType is "general", trigger
      // phrases asking for a final answer get refused when the rule is on.
      if (req.policy.aiHelp.restrictFinalAnswer && messageAsksForFinalAnswer(lastStudentText)) {
        return {
          content: redirectMessage(req.policy),
          outcome: "refused",
          outcomeReason: "Final-answer request blocked by instructor policy.",
        };
      }

      const requestType: HelpRequestType = req.requestType ?? "general";
      const content = CANNED_BY_TYPE[requestType];
      return { content, outcome: "answered" };
    },
  };
}
