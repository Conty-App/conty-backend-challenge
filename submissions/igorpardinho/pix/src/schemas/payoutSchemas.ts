import { z } from "zod";

export const payoutItemSchema = z.object({
  external_id: z.string().min(1),
  user_id: z.string().min(1),
  amount_cents: z.number().int().positive(),
  pix_key: z.string().min(1),
});

export const payoutBatchSchema = z.object({
  batch_id: z.string().min(1),
  items: z.array(payoutItemSchema).nonempty(),
});

export const payoutResultItemSchema = z.object({
  external_id: z.string(),
  status: z.enum(["paid", "duplicate","failed"]),
  amount_cents: z.number(),
});

export const payoutBatchResultSchema = z.object({
  batch_id: z.string(),
  processed: z.number(),
  successful: z.number(),
  duplicates: z.number(),
  failed: z.number(),
  details: z.array(payoutResultItemSchema),
});

export type PayoutItem = z.infer<typeof payoutItemSchema>;
export type PayoutBatch = z.infer<typeof payoutBatchSchema>;
export type PayoutResultItem = z.infer<typeof payoutResultItemSchema>;
export type PayoutBatchResult = z.infer<typeof payoutBatchResultSchema>;
