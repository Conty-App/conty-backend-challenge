import { prisma } from "../database/connection.js";
import { simulatePayment } from "../util/payment.js";

export async function getAllBatches() {
  return await prisma.batch.findMany({
    include: { items: true },
  });
}

export async function processBatchPayment(batch_id: string, items: any[]) {
  const batch = await prisma.batch.upsert({
    where: { batchId: batch_id },
    update: {},
    create: { batchId: batch_id },
  });

  const details: any[] = [];
  let successful = 0;
  let failed = 0;
  let duplicates = 0;

  for (const item of items) {
    try {
      const existing = await prisma.payoutItem.findUnique({
        where: {
          batchId_externalId: {
            batchId: batch.id,
            externalId: item.external_id,
          },
        },
      });

      if (existing) {
        duplicates++;
        details.push({
          external_id: item.external_id,
          status: "duplicate",
          amount_cents: item.amount_cents,
        });
        continue;
      }

      const status = await simulatePayment(item);

      await prisma.payoutItem.create({
        data: {
          externalId: item.external_id,
          batchId: batch.id,
          userId: item.user_id,
          pixKey: item.pix_key,
          amountCents: item.amount_cents,
          status,
        },
      });

      if (status === "paid") successful++;
      else failed++;

      details.push({
        external_id: item.external_id,
        status,
        amount_cents: item.amount_cents,
      });
    } catch (error) {
      console.error("Erro ao criar payoutItem:", error);
      failed++;
      details.push({
        external_id: item.external_id,
        status: "failed",
        amount_cents: item.amount_cents,
      });
    }
  }

  return {
    batch_id,
    processed: items.length,
    successful,
    failed,
    duplicates,
    details,
  };
}
