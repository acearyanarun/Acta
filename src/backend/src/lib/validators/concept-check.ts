import { z } from "zod";

// D-030: default questionCount=4, range 1..8.
export const generateConceptChecksInputSchema = z
  .object({
    questionCount: z.number().int().min(1).max(8).optional(),
  })
  .strict()
  .default({});

export const DEFAULT_QUESTION_COUNT = 4;
