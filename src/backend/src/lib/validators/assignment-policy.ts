import { z } from "zod";

export const verificationModeSchema = z.enum(["score", "gate", "fail_only"]);

export const aiHelpPolicySchema = z.object({
  conceptExplanation: z.boolean(),
  hints: z.boolean(),
  examples: z.boolean(),
  debuggingGuidance: z.boolean(),
  restrictFinalAnswer: z.boolean(),
});

export const createAssignmentInputSchema = z.object({
  title: z.string().trim().min(1, "title required").max(200, "title too long"),
  instructions: z.string().min(1, "instructions required").max(20_000, "instructions too long"),
  rubric: z
    .string()
    .max(20_000, "rubric too long")
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? null : v)),
  aiHelp: aiHelpPolicySchema,
  /**
   * D-047: master AI-help toggle. Optional on the wire; defaults to true so
   * existing demo flows keep working without supplying the field.
   */
  aiHelpEnabled: z.boolean().optional().default(true),
  verificationMode: verificationModeSchema,
});

export type CreateAssignmentInputParsed = z.infer<typeof createAssignmentInputSchema>;
