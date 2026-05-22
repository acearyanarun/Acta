import type {
  ConceptCheckProvider,
  ConceptCheckProviderRequest,
  ConceptCheckProviderResult,
  GeneratedQuestion,
} from "./types.js";

// D-032: deterministic per (submissionContentHash, questionCount).
// Question PROMPTS depend only on those two inputs (and the submission's first 80 chars),
// so tests can assert reproducibility. IDs are added by the route layer with fresh ULIDs.

function clip(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max)}…`;
}

const STEM_TEMPLATES: Array<{ stem: (snippet: string) => string; tag: string }> = [
  {
    stem: (snippet) =>
      `In your submission you wrote: "${snippet}". Explain in your own words why you chose this approach.`,
    tag: "approach-rationale",
  },
  {
    stem: (snippet) =>
      `Identify the single most important concept your submission relies on. Reference the part that begins with "${snippet}".`,
    tag: "core-concept",
  },
  {
    stem: (snippet) =>
      "Describe one assumption you made (explicit or implicit) in your submission. Quote a short phrase from your own work that reveals it.",
    tag: "assumption-surfacing",
  },
  {
    stem: (snippet) =>
      `If a peer challenged the claim in your submission near "${snippet}", how would you defend it in two sentences?`,
    tag: "defense",
  },
  {
    stem: (snippet) =>
      "Name one alternative approach you considered but did not use, and explain why your chosen approach fits the assignment better.",
    tag: "alternatives",
  },
  {
    stem: (snippet) =>
      "Point to a specific term, formula, or step in your submission that another student in the same class might misapply. Why?",
    tag: "misuse-risk",
  },
  {
    stem: (snippet) =>
      "Walk through the reasoning that connects your opening idea to your conclusion. Anchor it in what you actually wrote.",
    tag: "argument-arc",
  },
  {
    stem: (snippet) =>
      "What single change to your submission would most improve it? Reference the specific section that would change.",
    tag: "self-revision",
  },
];

// D-044: when a reference solution is present with at least one keyConcept OR
// requiredReasoningStep, prepend one deterministic question that references the
// first such entry. The remaining N-1 questions use the existing snippet templates.
function pickReferenceAnchor(
  req: ConceptCheckProviderRequest,
): { anchor: string; kind: "keyConcept" | "requiredReasoningStep" } | null {
  const ref = req.referenceSolution;
  if (!ref) return null;
  const firstConcept = ref.keyConcepts.find((s) => s.trim().length > 0);
  if (firstConcept) return { anchor: firstConcept.trim(), kind: "keyConcept" };
  const firstStep = ref.requiredReasoningSteps.find((s) => s.trim().length > 0);
  if (firstStep) return { anchor: firstStep.trim(), kind: "requiredReasoningStep" };
  return null;
}

function buildReferenceAnchorQuestion(anchor: {
  anchor: string;
  kind: "keyConcept" | "requiredReasoningStep";
}): GeneratedQuestion {
  if (anchor.kind === "keyConcept") {
    return {
      prompt: `In your submission, explain how your work demonstrates the concept of "${anchor.anchor}". Cite the specific part of your own work that shows it.`,
      conceptTag: "reference-key-concept",
    };
  }
  return {
    prompt: `In your submission, walk through how you carried out this reasoning step: "${anchor.anchor}". Reference the part of your own work that shows it.`,
    conceptTag: "reference-reasoning-step",
  };
}

export function createStubConceptCheckProvider(): ConceptCheckProvider {
  return {
    name: "stub",
    model: null,
    async generate(req: ConceptCheckProviderRequest): Promise<ConceptCheckProviderResult> {
      const snippet = clip(req.submission.content, 80);
      const totalCap = STEM_TEMPLATES.length + 1; // reference anchor adds one possible slot
      const n = Math.max(1, Math.min(totalCap, req.questionCount));
      const out: GeneratedQuestion[] = [];

      const anchor = pickReferenceAnchor(req);
      if (anchor) {
        out.push(buildReferenceAnchorQuestion(anchor));
      }

      const remaining = n - out.length;
      const templateCap = Math.min(STEM_TEMPLATES.length, remaining);
      for (let i = 0; i < templateCap; i++) {
        // biome-ignore lint/style/noNonNullAssertion: i < templateCap <= templates.length
        const tmpl = STEM_TEMPLATES[i]!;
        out.push({ prompt: tmpl.stem(snippet), conceptTag: tmpl.tag });
      }

      return { questions: out };
    },
  };
}
