import { z } from "zod";

// D-039: body limits.
const trimmedRequired = (max: number, label: string) =>
  z
    .string()
    .min(1, `${label} required`)
    .max(max, `${label} too long`)
    .refine((s) => s.trim().length > 0, `${label} must not be empty/whitespace`);

const trimmedOptional = (max: number, label: string) =>
  z
    .string()
    .max(max, `${label} too long`)
    .nullable()
    .optional()
    .transform((v) => (v === undefined || v === "" ? null : v));

const conceptEntry = z.string().trim().min(1, "entry required").max(200, "entry too long");
const reasoningEntry = z.string().trim().min(1, "entry required").max(400, "entry too long");

export const createReferenceSolutionInputSchema = z
  .object({
    expectedSolution: trimmedRequired(50_000, "expectedSolution"),
    keyConcepts: z.array(conceptEntry).max(50, "too many entries"),
    requiredReasoningSteps: z.array(reasoningEntry).max(50, "too many entries"),
    commonMistakes: z.array(reasoningEntry).max(50, "too many entries"),
    correctnessCriteria: trimmedRequired(10_000, "correctnessCriteria"),
    optionalNotes: trimmedOptional(10_000, "optionalNotes"),
  })
  .strict();

export type CreateReferenceSolutionInputParsed = z.infer<typeof createReferenceSolutionInputSchema>;
