from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.digital_key import DigitalKey
from app.db.repositories.base import BaseRepository


class StockRepository(BaseRepository[DigitalKey]):
    def __init__(self, session: AsyncSession):
        super().__init__(DigitalKey, session)

    async def fetch_and_lock_unsold_key(self, product_id: int) -> Optional[DigitalKey]:
        """
        Concurrency-Safe Key Reservation:
        Locks 1 unsold digital key using PostgreSQL FOR UPDATE SKIP LOCKED.
        If concurrent purchase requests hit the server, each worker process
        safely acquires a distinct, unique unsold key without blocking or race conditions.
        """
        stmt = (
            select(DigitalKey)
            .where(
                DigitalKey.product_id == product_id,
                DigitalKey.is_sold.is_(False),
            )
            .order_by(DigitalKey.id.asc())
            .limit(1)
            .with_for_update(skip_locked=True)
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def fetch_and_lock_unsold_keys(self, product_id: int, quantity: int = 1) -> List[DigitalKey]:
        stmt = (
            select(DigitalKey)
            .where(
                DigitalKey.product_id == product_id,
                DigitalKey.is_sold.is_(False),
            )
            .order_by(DigitalKey.id.asc())
            .limit(quantity)
            .with_for_update(skip_locked=True)
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def mark_key_as_sold(self, key_id: int, order_id: int) -> None:
        stmt = (
            update(DigitalKey)
            .where(DigitalKey.id == key_id)
            .values(
                is_sold=True,
                order_id=order_id,
                sold_at=datetime.now(timezone.utc),
            )
        )
        await self.session.execute(stmt)
        await self.session.flush()

    async def mark_keys_as_sold(self, key_ids: List[int], order_id: int) -> None:
        if not key_ids:
            return
        stmt = (
            update(DigitalKey)
            .where(DigitalKey.id.in_(key_ids))
            .values(
                is_sold=True,
                order_id=order_id,
                sold_at=datetime.now(timezone.utc),
            )
        )
        await self.session.execute(stmt)
        await self.session.flush()

    async def bulk_add_keys(self, keys: List[DigitalKey]) -> int:
        self.session.add_all(keys)
        await self.session.flush()
        return len(keys)

    async def get_stock_stats_by_product(self, product_id: int) -> dict:
        total_stmt = select(func.count(DigitalKey.id)).where(DigitalKey.product_id == product_id)
        unsold_stmt = select(func.count(DigitalKey.id)).where(
            DigitalKey.product_id == product_id,
            DigitalKey.is_sold.is_(False),
        )
        total_res = await self.session.execute(total_stmt)
        unsold_res = await self.session.execute(unsold_stmt)

        total_keys = total_res.scalar_one() or 0
        unsold_keys = unsold_res.scalar_one() or 0
        sold_keys = total_keys - unsold_keys

        return {
            "total_keys": total_keys,
            "unsold_keys": unsold_keys,
            "sold_keys": sold_keys,
        }
