import { PayoutBatchResult, PayoutItem } from "../schemas/payoutSchemas";
import { knex } from "../database/connection";
import { randomUUID } from "node:crypto";

export class PayoutService {
  async processBatch(
    batchId: string,
    items: PayoutItem[]
  ): Promise<PayoutBatchResult> {
    const results: PayoutBatchResult["details"] = [];

    for (const item of items) {
      const statusAttempt: "paid" | "failed" =
        Math.random() < 0.05 ? "failed" : "paid";

      const inserted = await knex("payouts")
        .insert({
          id: randomUUID(),
          external_id: item.external_id,
          user_id: item.user_id,
          amount_cents: item.amount_cents,
          pix_key: item.pix_key,
          status: statusAttempt,
        })
        .onConflict("external_id")
        .merge({
          status: knex.raw(` CASE
        WHEN "payouts"."status" = 'failed' THEN 'failed'        
        WHEN "payouts"."status" = 'paid' THEN 'duplicate'
        WHEN "payouts"."status" = 'duplicate' THEN 'duplicate'
        ELSE EXCLUDED.status                                    
      END`),
        })
        .returning(["external_id", "status", "amount_cents"]);

      const payout: {
        external_id: string;
        amount_cents: number;
        status: "failed" | "paid" | "duplicate";
      } = {
        external_id: inserted[0].external_id,
        amount_cents: inserted[0].amount_cents,
        status: inserted[0].status as "failed" | "paid" | "duplicate",
      };

      results.push(payout);
    }
    return {
      batch_id: batchId,
      processed: items.length,
      successful: results.filter((r) => r.status === "paid").length,
      duplicates: results.filter((r) => r.status === "duplicate").length,
      failed: results.filter((r) => r.status === "failed").length,
      details: results,
    };
  }
}
