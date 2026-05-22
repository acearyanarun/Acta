import { z } from "zod";

export const helpRequestTypeSchema = z.enum([
  "hint",
  "explanation",
  "example",
  "debugging",
  "general",
]);

export const chatMessageSchema = z.object({
  role: z.enum(["student", "assistant"]),
  content: z.string().min(1, "message content required").max(20_000),
});

export const helpRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, "at least one message required"),
  requestType: helpRequestTypeSchema.optional(),
});

export type HelpRequestParsed = z.infer<typeof helpRequestSchema>;
