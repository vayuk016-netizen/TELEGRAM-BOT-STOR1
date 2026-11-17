import pytest
from decimal import Decimal
from app.db.models import Category, Product
from app.schemas.product import BulkPromotionRequest
from app.api.v1.endpoints.products import bulk_promotion
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_apply_and_clear_promotion(db_session):
    cat = Category(name="Design Tools", icon="🎨")
    db_session.add(cat)
    await db_session.flush()

    prod1 = Product(
        category_id=cat.id,
        title="Canva Pro 1 Year",
        price=Decimal("10.00"),
        original_price=None,
    )
    prod2 = Product(
        category_id=cat.id,
        title="Figma Pro 1 Year",
        price=Decimal("20.00"),
        original_price=None,
    )
    db_session.add_all([prod1, prod2])
    await db_session.commit()

    # Mock admin user
    mock_admin = AsyncMock()
    
    with patch("app.api.v1.endpoints.products.invalidate_catalog_cache", new_callable=AsyncMock), \
         patch("app.api.v1.endpoints.products.invalidate_analytics_cache", new_callable=AsyncMock):
        # 1. Apply 20% promotion to prod1
        req1 = BulkPromotionRequest(
            product_ids=[prod1.id],
            discount_percent=20,
            action="apply"
        )
        res1 = await bulk_promotion(payload=req1, db=db_session, admin=mock_admin)
        assert res1["updated_count"] == 1

        await db_session.refresh(prod1)
        # Base price $10.00 with 20% off -> $8.00, original_price = $10.00
        assert prod1.original_price == Decimal("10.00")
        assert prod1.price == Decimal("8.00")

        # 2. Apply 50% promotion to all products in category
        req2 = BulkPromotionRequest(
            category_id=cat.id,
            discount_percent=50,
            action="apply"
        )
        res2 = await bulk_promotion(payload=req2, db=db_session, admin=mock_admin)
        assert res2["updated_count"] == 2

        await db_session.refresh(prod1)
        await db_session.refresh(prod2)
        # prod1: base was $10.00 -> 50% off -> $5.00
        assert prod1.original_price == Decimal("10.00")
        assert prod1.price == Decimal("5.00")
        # prod2: base was $20.00 -> 50% off -> $10.00
        assert prod2.original_price == Decimal("20.00")
        assert prod2.price == Decimal("10.00")

        # 3. Clear promotion
        req3 = BulkPromotionRequest(
            product_ids=[prod1.id, prod2.id],
            action="clear"
        )
        res3 = await bulk_promotion(payload=req3, db=db_session, admin=mock_admin)
        assert res3["updated_count"] == 2

        await db_session.refresh(prod1)
        await db_session.refresh(prod2)
        assert prod1.original_price is None
        assert prod1.price == Decimal("10.00")
        assert prod2.original_price is None
        assert prod2.price == Decimal("20.00")
