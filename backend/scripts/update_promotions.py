import asyncio
from sqlalchemy import text, select
from app.core.database import AsyncSessionLocal, engine
from app.core.redis import invalidate_catalog_cache
from app.db.models.product import Product


async def update_promotions():
    print("🔄 Updating product promotions...")
    async with AsyncSessionLocal() as session:
        # 1. Remove promotions from all products except Canva Pro
        await session.execute(
            text("UPDATE products SET original_price = NULL WHERE LOWER(title) NOT LIKE '%canva%';")
        )
        
        # 2. Ensure Canva Pro has 50% discount (original_price = 2 * price)
        await session.execute(
            text("UPDATE products SET original_price = price * 2.0 WHERE LOWER(title) LIKE '%canva%' AND (original_price IS NULL OR original_price <= price);")
        )
        await session.commit()

        # 3. Fetch and display all products
        stmt = select(Product)
        res = await session.execute(stmt)
        products = res.scalars().all()
        print("\n📦 Current Product Promotion Status:")
        print("-" * 65)
        for p in products:
            pct = p.discount_percent
            if pct > 0:
                print(f"🔥 [PROMO -{pct}%] ID: {p.id:2d} | {p.title:<30} | ${p.price:.2f} (Orig: ${float(p.original_price):.2f})")
            else:
                print(f"   [REGULAR]    ID: {p.id:2d} | {p.title:<30} | ${p.price:.2f}")
        print("-" * 65)

    # 4. Invalidate Redis catalog cache
    try:
        await invalidate_catalog_cache()
        print("✅ Redis catalog cache invalidated successfully.")
    except Exception as e:
        print(f"Notice: Redis cache invalidation skipped ({e}).")

    print("✨ Product promotions update completed successfully!")


if __name__ == "__main__":
    asyncio.run(update_promotions())
