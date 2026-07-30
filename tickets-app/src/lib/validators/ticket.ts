import { z } from "zod";
import { Priority } from "@prisma/client";

export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be at most 200 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(10000, "Description must be at most 10000 characters"),
  priority: z.nativeEnum(Priority, {
    message: "Please select a priority",
  }),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
