import type { BatchInput, BatchReport, PaymentResult, PayoutItem } from "../types/payout.types";
import { paymentStore } from "../store/payment.store";
import { simulatePixPayment } from "../utils/pix-simulator";

const MAX_RETRIES = 3;

interface QueueItem {
  item: PayoutItem;
  retries: number;
}

export async function processBatch(input: BatchInput): Promise<BatchReport> {
  const results = new Map<string, PaymentResult>();
  let duplicates = 0;

  const queue: QueueItem[] = [];

  for (const item of input.items) {
    const existing = paymentStore.get(item.external_id);

    if (existing) {
      results.set(item.external_id, { ...existing, status: "duplicate" });
      duplicates++;
    } else {
      queue.push({ item, retries: 0 });
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;

    let paid = false;
    try {
      paid = await simulatePixPayment();
    } catch {
      paid = false;
    }

    if (paid) {
      const result: PaymentResult = {
        external_id: current.item.external_id,
        status: "paid",
        amount_cents: current.item.amount_cents,
        retries: current.retries,
      };
      paymentStore.set(current.item.external_id, result);
      results.set(current.item.external_id, result);
    } else if (current.retries < MAX_RETRIES) {
      queue.push({ item: current.item, retries: current.retries + 1 });
    } else {
      const result: PaymentResult = {
        external_id: current.item.external_id,
        status: "failed",
        amount_cents: current.item.amount_cents,
        retries: current.retries,
      };
      paymentStore.set(current.item.external_id, result);
      results.set(current.item.external_id, result);
    }
  }

  const details: PaymentResult[] = input.items.map(
    (item) => results.get(item.external_id)!
  );

  const successful = details.filter((d) => d.status === "paid").length;
  const failed = details.filter((d) => d.status === "failed").length;

  return {
    batch_id: input.batch_id,
    processed: input.items.length,
    successful,
    failed,
    duplicates,
    details,
  };
}
