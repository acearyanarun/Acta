/**
 * Acta demo fixtures.
 *
 * Synthetic, hand-written transcript content used to make screenshots and
 * demos reproducible without burning real LLM tokens. Loaded only when:
 *   - process.env.NEXT_PUBLIC_DEMO_FIXTURES === "true", OR
 *   - the URL carries `?demo=1`
 *
 * Default behavior (no env, no query) is the empty/idle state. The fixture
 * never leaks into a real student session by accident.
 *
 * Three turns are exercised, by design:
 *   - (a) The LONGEST realistic transcript line (TA reply) to stress wrap
 *         behavior on the transcript band.
 *   - (b) The SHORTEST realistic exchange to confirm minimum vertical density.
 *   - (c) One REFUSAL outcome to put the warn-stripe banner pattern in context.
 *
 * Copy is plain instructional language. No banned phrases, no surveillance
 * tone, no claims the TA can't honor.
 */

import type { ChatMessage, HelpResponse } from "./types/assignment";

export type DemoTurn = {
  policyVersionId: string;
  policyVersion: number;
  outcome: HelpResponse["outcome"];
  outcomeReason?: string;
  provider: HelpResponse["provider"];
};

export type DemoTranscript = {
  messages: ChatMessage[];
  /** Server-turn metadata keyed by the assistant message's index in `messages`. */
  turns: Record<number, DemoTurn>;
};

/**
 * Hand-written fixture for the TA Lab transcript. Used to drive screenshot
 * and demo flows when demo mode is on.
 */
export const DEMO_TA_LAB_TRANSCRIPT: DemoTranscript = {
  messages: [
    // (a) LONG TA REPLY — stresses wrap, eight sentences, two paragraphs of
    //     conceptual scaffolding. The TA never gives a final answer.
    {
      role: "student",
      content:
        "Can you walk me through how glycolysis, the citric acid cycle, and the electron transport chain hand off to each other in cellular respiration?",
    },
    {
      role: "assistant",
      content:
        "Think of cellular respiration as three relay legs that each pass a different kind of carrier to the next. Glycolysis starts in the cytoplasm: it splits one glucose into two pyruvate molecules and produces a small net of ATP plus reduced NAD+ (NADH). Crucially, glycolysis itself does not need oxygen — its outputs simply set up the next stage.\n\nThe citric acid cycle picks up the baton inside the mitochondrial matrix. Pyruvate is first converted to acetyl-CoA, which enters the cycle and gets oxidized step by step, releasing CO2 and producing more NADH and FADH2 along the way. The key idea here is that the cycle's most important products aren't the small bursts of ATP — they're the loaded electron carriers (NADH and FADH2) that hand off to the third leg.\n\nThe electron transport chain, embedded in the inner mitochondrial membrane, accepts those electrons from NADH and FADH2 and uses them to pump protons across the membrane. The resulting proton gradient drives ATP synthase to phosphorylate ADP into ATP. Oxygen sits at the very end as the terminal electron acceptor — without it, the chain backs up, and the whole relay stalls. Try restating in your own words where ATP gets produced at each stage; that's usually the sticking point on this kind of question.",
    },
    // (b) SHORT EXCHANGE — minimum vertical density.
    {
      role: "student",
      content: "What does the proton gradient do?",
    },
    {
      role: "assistant",
      content: "It powers ATP synthase. Specifically, can you remember what gets phosphorylated?",
    },
    // (c) REFUSAL — instructor policy restricts final answers; the TA redirects.
    {
      role: "student",
      content: "Just tell me the answer for question 3 on the assignment so I can move on.",
    },
    {
      role: "assistant",
      content:
        "I can't hand you the final answer — your instructor has restricted that. What I can do is point at the part of your own draft where the reasoning breaks down. Want to paste the sentence you're stuck on and I'll question the assumption behind it?",
    },
  ],
  turns: {
    1: {
      policyVersionId: "demo-policy-v1",
      policyVersion: 1,
      outcome: "answered",
      provider: "stub",
    },
    3: {
      policyVersionId: "demo-policy-v1",
      policyVersion: 1,
      outcome: "answered",
      provider: "stub",
    },
    5: {
      policyVersionId: "demo-policy-v1",
      policyVersion: 1,
      outcome: "refused",
      outcomeReason: "Instructor policy restricts final answers for this assignment.",
      provider: "stub",
    },
  },
};

/**
 * Returns true when the demo fixture should be loaded into the TA Lab
 * transcript on first render. Safe to call during render — checks both
 * the build-time env flag and the runtime URL query.
 */
export function shouldLoadDemoFixtures(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_FIXTURES === "true") return true;
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") return true;
  }
  return false;
}
