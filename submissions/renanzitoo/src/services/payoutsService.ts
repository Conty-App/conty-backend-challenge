import { PayoutBatch, BatchReport, PayoutResult } from "../types/payout";
import { simulatePixPayment } from "../utils/simulatePix";
import { prisma } from "../models/db";

export async function handleBatch(batchData: PayoutBatch): Promise<BatchReport> {
  const {batch_id, items} = batchData;

  let successful = 0;
  let failed = 0;
  let duplicates = 0;
  const details: PayoutResult[] = [];

  for(const item of items){
    const {external_id, amount_cents, user_id, pix_key} = item;

    const existing = await prisma.payment.findUnique({
      where: {external_id}
    })
    
    if(existing){
      duplicates++;
      details.push({
        external_id,
        status: 'duplicate',
        amount_cents: existing.amount_cents
      });
      continue;
    }

    const isSuccess = await simulatePixPayment(item);
    const status = isSuccess ? 'paid' : 'failed';

    await prisma.payment.create({
      data: {
        external_id,
        user_id,
        amount_cents,
        pix_key,
        batch_id,
        status
      }
    });

    if(isSuccess){
      successful++;
    }else{
      failed++;
    }

    details.push({
      external_id,
      status,
      amount_cents
    });

  }
  return {
    batch_id,
    processed: items.length,
    successful,
    failed,
    duplicate: duplicates,
    details
  }
}
