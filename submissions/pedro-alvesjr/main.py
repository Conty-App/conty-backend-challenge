from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List, Literal
from db.database import engine, async_session
from db.models import Base, Payout
import uuid
import random

async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

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

@app.post("/payouts/batch", response_model=PayoutBatchResult)
async def process_payout_batch(batch: PayoutBatch):
    batch_id = batch.batch_id or f"batch-{uuid.uuid4().hex[:8]}"
    successful, failed, duplicates = 0, 0, 0
    details = []

    async with async_session() as session:
        async with session.begin():
            for item in batch.items:
                external_id = item.external_id or str(uuid.uuid4())[:8]

                exists = await session.get(Payout, external_id)
                if exists:
                    duplicates += 1
                    details.append(PayoutResultItem(
                        external_id=external_id,
                        status="duplicate",
                        amount_cents=item.amount_cents
                    ))
                    continue

                success = random.random() > 0.1
                status = "paid" if success else "failed"

                if success:
                    successful += 1
                else:
                    failed += 1

                payout = Payout(
                    external_id=external_id,
                    batch_id=batch_id,
                    pix_key=item.pix_key,
                    amount_cents=item.amount_cents,
                    user_id=item.user_id,
                    status=status
                )
                session.add(payout)

                details.append(PayoutResultItem(
                    external_id=external_id,
                    status=status,
                    amount_cents=item.amount_cents
                ))

    return PayoutBatchResult(
        batch_id=batch_id,
        processed=successful + failed + duplicates,
        successful=successful,
        failed=failed,
        duplicates=duplicates,
        details=details
    )
