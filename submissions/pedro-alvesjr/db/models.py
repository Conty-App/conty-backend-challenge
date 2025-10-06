from sqlalchemy import Column, Integer, String, Boolean, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class PayoutItemModel(Base):
    __tablename__ = "payout_items"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, index=True)
    external_id = Column(String, unique=True, nullable=False)
    user_id = Column(String, nullable=False)
    amount_cents = Column(Integer, nullable=False)
    pix_key = Column(String, nullable=False)
    status = Column(String, nullable=False)

    __table_args__ = (
        UniqueConstraint("external_id", name="uq_external_id"),
    )