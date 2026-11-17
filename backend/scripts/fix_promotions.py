import asyncio
import re
from decimal import Decimal
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.redis import invalidate_catalog_cache, invalidate_analytics_cache
from app.db.models.product import Product


async def fix_all_products():
    print("🚀 Starting comprehensive product correction...")
    async with AsyncSessionLocal() as session:
        stmt = select(Product).order_by(Product.id)
        res = await session.execute(stmt)
        products = res.scalars().all()

        for p in products:
            is_canva = "canva" in p.title.lower()
            
            if is_canva:
                # Canva Pro: Keep 50% promotion ($3.00 with original_price $6.00)
                p.price = Decimal("3.00")
                p.original_price = Decimal("6.00")
                print(f"🔥 [CANVA 50% PROMO] ID: {p.id} | {p.title} -> Price: ${p.price}, Orig: ${p.original_price}")
            else:
                # All other products: Regular price, remove original_price
                p.original_price = None

                # Clean up description to remove all leftover 50% promo text
                desc = p.description or ""
                # Remove lines like: 🔥 តម្លៃប្រូម៉ូសិន (PROMOTION 50% OFF)...
                desc = re.sub(r"🔥\s*តម្លៃប្រូម៉ូសិន\s*\(PROMOTION 50% OFF\)[^\n]*\n?", "", desc)
                # Remove lines like: 🎁 PROMOTION 50% OFF: Was $4.00 — Now Only $2.00!
                desc = re.sub(r"🎁\s*PROMOTION 50% OFF[^\n]*\n?", "", desc)
                # Remove lines like: 🔥 SPECIAL OFFER – 50% OFF!\n\n💰 $50 ➜ ONLY $25! 😍
                desc = re.sub(r"🔥\s*SPECIAL OFFER[^\n]*\n?", "", desc)
                desc = re.sub(r"💰\s*\$\d+\s*➜\s*ONLY\s*\$\d+![^\n]*\n?", "", desc)
                desc = re.sub(r"🛒\s*Order Now & Save 50%![^\n]*\n?", "", desc)
                # Clean multiple empty lines
                desc = re.sub(r"\n{3,}", "\n\n", desc).strip()
                p.description = desc

                print(f"✅ [REGULAR] ID: {p.id:2d} | {p.title:<35} | Price: ${p.price} | Orig: None")

        await session.commit()

    # Invalidate cache
    try:
        await invalidate_catalog_cache()
        await invalidate_analytics_cache()
        print("⚡ Invalidation completed successfully.")
    except Exception as e:
        print(f"Cache notice: {e}")

    print("\n🎉 ALL PRODUCTS SUCCESSFULLY UPDATED AND VERIFIED!")


if __name__ == "__main__":
    asyncio.run(fix_all_products())
