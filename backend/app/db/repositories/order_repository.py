from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.order import Order, OrderItem
from app.db.models.user import User
from app.db.models.product import Product
from app.db.repositories.base import BaseRepository


class OrderRepository(BaseRepository[Order]):
    def __init__(self, session: AsyncSession):
        super().__init__(Order, session)

    async def create_order_with_item(
        self,
        user_id: int,
        product_id: int,
        unit_price: Decimal,
        delivered_payload: Optional[str] = None,
        total_amount: Optional[Decimal] = None,
        source: str = "telegram",
        payment_method: str = "balance",
        status: str = "COMPLETED",
        receipt_url: Optional[str] = None,
    ) -> Order:
        order = Order(
            user_id=user_id,
            total_amount=total_amount if total_amount is not None else unit_price,
            status=status,
            source=source,
            payment_method=payment_method,
            receipt_url=receipt_url,
        )
        self.session.add(order)
        await self.session.flush()

        item = OrderItem(
            order_id=order.id,
            product_id=product_id,
            unit_price=unit_price,
            delivered_payload=delivered_payload,
        )
        self.session.add(item)
        await self.session.flush()
        return order

    async def get_user_orders(self, user_id: int, limit: int = 20) -> List[Order]:
        stmt = (
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.product))
            .where(Order.user_id == user_id)
            .order_by(Order.id.desc())
            .limit(limit)
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_recent_orders_with_user(self, limit: int = 10) -> List[Tuple[Order, User, Product]]:
        stmt = (
            select(Order, User, Product)
            .join(User, Order.user_id == User.id)
            .join(OrderItem, OrderItem.order_id == Order.id)
            .join(Product, OrderItem.product_id == Product.id)
            .order_by(Order.id.desc())
            .limit(limit)
        )
        res = await self.session.execute(stmt)
        return list(res.all())

    async def get_all_orders_paginated(self, skip: int = 0, limit: int = 50) -> List[Order]:
        stmt = (
            select(Order)
            .options(
                selectinload(Order.user),
                selectinload(Order.items).selectinload(OrderItem.product),
            )
            .order_by(Order.id.desc())
            .offset(skip)
            .limit(limit)
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_dashboard_metrics(self) -> dict:
        now = datetime.now(timezone.utc)
        today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        from sqlalchemy import case
        stmt = select(
            func.sum(case((Order.created_at >= today_start, Order.total_amount), else_=0)),
            func.sum(Order.total_amount),
            func.count(case((Order.created_at >= today_start, Order.id), else_=None)),
            func.count(Order.id)
        ).where(Order.status == "COMPLETED")

        res = await self.session.execute(stmt)
        row = res.first()
        if row:
            revenue_today, total_revenue, sold_today, total_orders = row
        else:
            revenue_today, total_revenue, sold_today, total_orders = 0, 0, 0, 0

        return {
            "revenue_today": float(revenue_today or 0.0),
            "total_revenue": float(total_revenue or 0.0),
            "sold_today": sold_today or 0,
            "total_orders": total_orders or 0,
        }

    async def get_weekly_sales_chart(self) -> List[dict]:
        now = datetime.now(timezone.utc)
        chart_data = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            day_start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
            day_end = day_start + timedelta(days=1)
            
            stmt = select(
                func.sum(Order.total_amount),
                func.count(Order.id)
            ).where(
                Order.status == "COMPLETED",
                Order.created_at >= day_start,
                Order.created_at < day_end
            )
            res = await self.session.execute(stmt)
            row = res.first()
            rev, sales = 0, 0
            if row:
                rev = float(row[0] or 0.0)
                sales = int(row[1] or 0)
            
            day_name = day.strftime("%a")
            chart_data.append({
                "name": day_name,
                "revenue": rev,
                "sales": sales
            })
        return chart_data

