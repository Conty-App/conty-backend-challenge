from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from db.models import Base

DATABASE_URL = "postgresql+asyncpg://postgres:his1032@localhost:5432/conty_db"

engine = create_async_engine(DATABASE_URL, echo=True)

async_session = sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)