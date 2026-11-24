from typing import List, Optional, Tuple
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.product import Category, Product
from app.db.models.digital_key import DigitalKey
from app.db.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    def __init__(self, session: AsyncSession):
        super().__init__(Product, session)

    # Categories
    async def create_category(self, category: Category) -> Category:
        self.session.add(category)
        await self.session.flush()
        return category

    async def get_category_by_id(self, category_id: int) -> Optional[Category]:
        stmt = select(Category).where(Category.id == category_id)
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_active_categories(self) -> List[Category]:
        stmt = select(Category).where(Category.is_active == True).order_by(Category.id.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_all_categories(self) -> List[Category]:
        stmt = select(Category).order_by(Category.id.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    # Products
    async def get_products_by_category(self, category_id: int, only_active: bool = True) -> List[Product]:
        stmt = select(Product).where(Product.category_id == category_id)
        if only_active:
            stmt = stmt.where(Product.is_active == True)
        stmt = stmt.order_by(Product.id.asc())
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    async def get_product_with_stock(self, product_id: int) -> Optional[Tuple[Product, int]]:
        """Returns product entity along with remaining unsold keys count."""
        stmt = (
            select(
                Product,
                func.count(DigitalKey.id).filter(DigitalKey.is_sold == False).label("stock_count"),
            )
            .outerjoin(DigitalKey, DigitalKey.product_id == Product.id)
            .where(Product.id == product_id)
            .group_by(Product.id)
        )
        res = await self.session.execute(stmt)
        row = res.first()
        if not row:
            return None
        return row[0], row[1]

    async def get_products_by_category_with_stock(self, category_id: int) -> List[Tuple[Product, int]]:
        """Single-query bulk fetch: returns all active products in a category with their real-time unsold key counts."""
        stmt = (
            select(
                Product,
                func.count(DigitalKey.id).filter(DigitalKey.is_sold == False).label("stock_count"),
            )
            .outerjoin(DigitalKey, DigitalKey.product_id == Product.id)
            .where(Product.category_id == category_id, Product.is_active == True)
            .group_by(Product.id)
            .order_by(Product.id.asc())
        )
        res = await self.session.execute(stmt)
        return list(res.all())

    async def get_all_products_with_stock(self) -> List[Tuple[Product, int]]:
        stmt = (
            select(
                Product,
                func.count(DigitalKey.id).filter(DigitalKey.is_sold == False).label("stock_count"),
            )
            .outerjoin(DigitalKey, DigitalKey.product_id == Product.id)
            .group_by(Product.id)
            .order_by(Product.id.desc())
        )
        res = await self.session.execute(stmt)
        return list(res.all())

    async def count_low_stock_products(self, threshold: int = 5) -> int:
        """Counts active products with available unsold key stock below threshold."""
        subquery = (
            select(
                Product.id,
                func.count(DigitalKey.id).filter(DigitalKey.is_sold == False).label("stock_count"),
            )
            .outerjoin(DigitalKey, DigitalKey.product_id == Product.id)
            .where(Product.is_active == True)
            .group_by(Product.id)
            .subquery()
        )
        stmt = select(func.count(subquery.c.id)).where(subquery.c.stock_count <= threshold)
        res = await self.session.execute(stmt)
        return res.scalar_one() or 0
