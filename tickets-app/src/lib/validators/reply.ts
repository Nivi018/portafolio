import { z } from "zod";

export const createReplySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Reply cannot be empty")
    .max(10000, "Reply must be at most 10000 characters"),
  isInternal: z
    .union([z.literal("on"), z.literal("true"), z.literal(""), z.boolean()])
    .optional()
    .transform((v) => v === "on" || v === "true" || v === true),
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;
