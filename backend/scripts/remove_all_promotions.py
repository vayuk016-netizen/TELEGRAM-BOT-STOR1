import asyncio
import re
from decimal import Decimal
from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.core.redis import invalidate_catalog_cache, invalidate_analytics_cache
from app.db.models.product import Product


async def remove_all_promotions():
    print("🚀 Removing all promotions from all products...")
    async with AsyncSessionLocal() as session:
        # 1. Clear original_price for ALL products
        await session.execute(
            update(Product).values(original_price=None)
        )
        
        # 2. Fetch all products and clean any remaining promo text in descriptions
        stmt = select(Product).order_by(Product.id)
        res = await session.execute(stmt)
        products = res.scalars().all()

        for p in products:
            desc = p.description or ""
            # Clean Khmer & English promotion phrases
            desc = re.sub(r"🔥\s*តម្លៃប្រូម៉ូសិន[^\n]*\n?", "", desc)
            desc = re.sub(r"🎁\s*PROMOTION[^\n]*\n?", "", desc)
            desc = re.sub(r"🔥\s*SPECIAL OFFER[^\n]*\n?", "", desc)
            desc = re.sub(r"💰\s*\$\d+.*ONLY\s*\$\d+![^\n]*\n?", "", desc)
            desc = re.sub(r"🛒\s*Order Now & Save[^\n]*\n?", "", desc)
            desc = re.sub(r"\n{3,}", "\n\n", desc).strip()
            p.description = desc
            p.original_price = None

            print(f"✅ ID: {p.id:2d} | Title: {p.title:<35} | Price: ${p.price:.2f} | Orig: None | Promo: None")

        await session.commit()

    # Invalidate cache
    try:
        await invalidate_catalog_cache()
        await invalidate_analytics_cache()
        print("⚡ Cache invalidation completed successfully.")
    except Exception as e:
        print(f"Cache notice: {e}")

    print("\n🎉 ALL PROMOTIONS REMOVED SUCCESSFULLY! ALL PRODUCTS ARE REGULAR.")


if __name__ == "__main__":
    asyncio.run(remove_all_promotions())
