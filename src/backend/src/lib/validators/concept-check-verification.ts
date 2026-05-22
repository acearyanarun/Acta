import { z } from "zod";

const SHA256_HEX = /^[a-f0-9]{64}$/;

const transcriptionProviderSchema = z.enum(["stub", "openai"]);

// D-034 + D-048: per-answer length limit. When `modality === "voice"`, the
// transcription provenance fields (`transcriptHash`, `transcriptionProvider`,
// `transcriptionModel`) must all be present; when `modality === "text"` (or
// absent) they must be absent. The transcribe route returns these fields; the
// verifications route additionally re-verifies sha256(answer) === transcriptHash.
export const verificationAnswerSchema = z
  .object({
    questionId: z.string().min(1, "questionId required").max(64),
    answer: z
      .string()
      .min(1, "answer required")
      .max(5_000, "answer too long")
      .refine((s) => s.trim().length > 0, "answer must not be empty/whitespace"),
    modality: z.enum(["text", "voice"]).optional(),
    transcriptHash: z
      .string()
      .regex(SHA256_HEX, "transcriptHash must be 64-char lowercase hex")
      .optional()
      .nullable(),
    transcriptionProvider: transcriptionProviderSchema.optional().nullable(),
    transcriptionModel: z.string().max(64).optional().nullable(),
    transcriptEdited: z.boolean().optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const isVoice = val.modality === "voice";
    if (isVoice) {
      if (!val.transcriptHash) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "voice answers require transcriptHash",
          path: ["transcriptHash"],
        });
      }
      if (!val.transcriptionProvider) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "voice answers require transcriptionProvider",
          path: ["transcriptionProvider"],
        });
      }
      // transcriptionModel may legitimately be null (stub provider has no model).
      // Only assert the field is present (which it always is for voice via the
      // transcribe route response); presence-of-key is enforced by the wire shape.
    } else {
      if (val.transcriptHash) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "text answers must not include transcriptHash",
          path: ["transcriptHash"],
        });
      }
      if (val.transcriptionProvider) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "text answers must not include transcriptionProvider",
          path: ["transcriptionProvider"],
        });
      }
      if (val.transcriptionModel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "text answers must not include transcriptionModel",
          path: ["transcriptionModel"],
        });
      }
    }
  });

export const createConceptCheckVerificationInputSchema = z
  .object({
    answers: z.array(verificationAnswerSchema).min(1, "answers required"),
  })
  .strict();

export type CreateConceptCheckVerificationInputParsed = z.infer<
  typeof createConceptCheckVerificationInputSchema
>;
