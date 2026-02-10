import type {
  PaymentResult,
  BatchInput,
  PayoutItem,
} from "../types/payout.types";
import { paymentStore } from "../store/payment.store";
import { simulatePixPayment } from "../utils/pix-simulator";

const MAX_RETRIES = 3;

type QueueItem = {
  item: PayoutItem;
  retries: number;
};

async function processItem(current: QueueItem): Promise<{
  queueItem: QueueItem;
  paid: boolean;
}> {
  const paid = await simulatePixPayment();
  return { queueItem: current, paid };
}

export async function processBatch(input: BatchInput) {
  const results = new Map<string, PaymentResult>();
  let queue: QueueItem[] = [];
  let duplicates = 0;

  for (const item of input.items) {
    const existing = paymentStore.get(item.external_id);

    if (existing) {
      results.set(item.external_id, { ...existing, status: "duplicate" });
      duplicates++;
      continue;
    }

    queue.push({ item, retries: 0 });
  }

  while (queue.length > 0) {
    const batch = queue.splice(0);
    const retryQueue: QueueItem[] = [];

    const promises = batch.map((current) => processItem(current));
    const settled = await Promise.allSettled(promises);

    for (const entry of settled) {
      if (entry.status === "rejected") continue;

      const { queueItem, paid } = entry.value;

      if (paid) {
        const result: PaymentResult = {
          external_id: queueItem.item.external_id,
          status: "paid",
          amount_cents: queueItem.item.amount_cents,
          retries: queueItem.retries,
        };
        paymentStore.set(queueItem.item.external_id, result);
        results.set(queueItem.item.external_id, result);
        continue;
      }

      if (!paid && queueItem.retries < MAX_RETRIES) {
        retryQueue.push({ item: queueItem.item, retries: queueItem.retries + 1 });
        continue;
      }

      const result: PaymentResult = {
        external_id: queueItem.item.external_id,
        status: "failed",
        amount_cents: queueItem.item.amount_cents,
        retries: queueItem.retries,
      };
      paymentStore.set(queueItem.item.external_id, result);
      results.set(queueItem.item.external_id, result);
    }

    queue = retryQueue;
  }

  const details: PaymentResult[] = input.items.map(
    (item) => results.get(item.external_id)!,
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
