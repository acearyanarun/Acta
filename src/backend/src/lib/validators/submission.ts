import { z } from "zod";

export const createSubmissionInputSchema = z.object({
  content: z
    .string()
    .min(1, "content required")
    .max(200_000, "content too long")
    .refine((s) => s.trim().length > 0, "content must not be empty/whitespace"),
});

export type CreateSubmissionInputParsed = z.infer<typeof createSubmissionInputSchema>;
