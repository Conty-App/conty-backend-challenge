from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List, Literal
import uuid
import random

app = FastAPI()

class PayoutItem(BaseModel):
    amount_cents: int
    pix_key: str
    external_id: Optional[str] = None
    user_id: Optional[str] = None

class PayoutBatch(BaseModel):
    batch_id: Optional[str] = None
    items: List[PayoutItem]

class PayoutResultItem(BaseModel):
    external_id: str
    status: Literal["paid", "failed", "duplicate"]
    amount_cents: int

class PayoutBatchResult(BaseModel):
    batch_id: str
    processed: int
    successful: int
    failed: int
    duplicates: int
    details: List[PayoutResultItem]

paid_external_ids = set()

@app.post("/payouts/batch", response_model=PayoutBatchResult)
def process_payout_batch(batch: PayoutBatch):
    batch_id = batch.batch_id or f"batch-{uuid.uuid4().hex[:8]}"
    successful = 0
    failed = 0
    duplicates = 0
    details = []

    for item in batch.items:
        external_id = item.external_id or str(uuid.uuid4())[:8]

        if external_id in paid_external_ids:
            duplicates += 1
            details.append(PayoutResultItem(
                external_id=external_id,
                status="duplicate",
                amount_cents=item.amount_cents
            ))
            continue

        success = random.random() > 0.1

        if success:
            successful += 1
            paid_external_ids.add(external_id)
            details.append(PayoutResultItem(
                external_id=external_id,
                status="paid",
                amount_cents=item.amount_cents
            ))
        else:
            failed += 1
            details.append(PayoutResultItem(
                external_id=external_id,
                status="failed",
                amount_cents=item.amount_cents
            ))

    processed = successful + failed + duplicates

    return PayoutBatchResult(
        batch_id=batch_id,
        processed=processed,
        successful=successful,
        failed=failed,
        duplicates=duplicates,
        details=details
    )