from sqlalchemy import Column, String, Integer, Enum
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

class PaymentStatus(str, enum.Enum):
    paid = "paid"
    failed = "failed"
    duplicate = "duplicate"

class Payout(Base):
    __tablename__ = "payouts"

    external_id = Column(String, primary_key=True, index=True)
    batch_id = Column(String, index=True)
    pix_key = Column(String, nullable=False)
    amount_cents = Column(Integer, nullable=False)
    user_id = Column(String, nullable=True)
    status = Column(Enum(PaymentStatus), nullable=False)
