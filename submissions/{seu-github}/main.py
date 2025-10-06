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