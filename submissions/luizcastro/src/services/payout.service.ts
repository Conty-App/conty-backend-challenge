import type { BatchInput, BatchReport, PaymentResult } from "../types/payout.types";
import { paymentStore } from "../store/payment.store";
import { simulatePixPayment } from "../utils/pix-simulator";

export async function processBatch(input: BatchInput): Promise<BatchReport> {
  const details: PaymentResult[] = [];
  let successful = 0;
  let failed = 0;
  let duplicates = 0;

  for (const item of input.items) {
    const existing = paymentStore.get(item.external_id);

    if (existing) {
      details.push({ ...existing, status: "duplicate" });
      duplicates++;
      continue;
    }

    const paid = await simulatePixPayment();
    const result: PaymentResult = {
      external_id: item.external_id,
      status: paid ? "paid" : "failed",
      amount_cents: item.amount_cents,
    };

    paymentStore.set(item.external_id, result);
    details.push(result);

    if (paid) successful++;
    else failed++;
  }

  return {
    batch_id: input.batch_id,
    processed: input.items.length,
    successful,
    failed,
    duplicates,
    details,
  };
}
