import { z } from "zod";

export const createRatingSchema = z.object({
  score: z.coerce
    .number()
    .int()
    .min(1, "Score must be at least 1")
    .max(5, "Score must be at most 5"),
  comment: z
    .string()
    .trim()
    .max(2000, "Comment must be at most 2000 characters")
    .optional()
    .or(z.literal("")),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;
