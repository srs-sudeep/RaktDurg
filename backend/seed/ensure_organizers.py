"""Ensure directory contacts + organizer login accounts exist (idempotent)."""

import asyncio

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from seed.organizers_directory import (
    ORGANIZER_ACCOUNT_PASSWORD,
    seed_organizer_accounts,
    seed_organizer_directory,
)


async def run() -> None:
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as db:
        dir_count = await seed_organizer_directory(db)
        created = await seed_organizer_accounts(db)
        await db.commit()
        print(f"Directory upserted/new: {dir_count}")
        print(f"Organizer accounts created: {created}")
        print(f"Login: org_<serial> / {ORGANIZER_ACCOUNT_PASSWORD}")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run())
