import { z } from "zod";

export const queryDocumentsSchema = z.object({
  question: z.string().trim().min(1),
  documentIds: z.array(z.string().uuid()).optional(),
});

export type QueryDocumentsInput = z.infer<typeof queryDocumentsSchema>;
