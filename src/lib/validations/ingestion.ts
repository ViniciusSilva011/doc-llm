import { z } from "zod";

export const createIngestionJobSchema = z.object({
  title: z.string().trim().min(1).max(255),
  content: z.string().trim().min(1),
  mimeType: z.string().trim().min(1).default("text/plain"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateIngestionJobInput = z.infer<typeof createIngestionJobSchema>;
