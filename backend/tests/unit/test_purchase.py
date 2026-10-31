import pytest
from decimal import Decimal
from app.core.security import encrypt_key_content, decrypt_key_content
from app.db.models import User, Category, Product, DigitalKey
from app.services.purchase_service import PurchaseService
from app.services.stock_service import StockService
from app.core.exceptions import InsufficientBalanceException, OutOfStockException


def test_encryption_decryption():
    raw_key = "user:password123@capcut.com"
    encrypted = encrypt_key_content(raw_key)
    assert encrypted != raw_key
    decrypted = decrypt_key_content(encrypted)
    assert decrypted == raw_key


@pytest.mark.asyncio
async def test_bulk_stock_upload_and_purchase_flow(db_session):
    # Setup test category and product
    cat = Category(name="Streaming Apps", icon="🎬")
    db_session.add(cat)
    await db_session.flush()

    prod = Product(
        category_id=cat.id,
        title="CapCut Pro 1 Year",
        description="Premium subscription account",
        price=Decimal("10.00"),
    )
    db_session.add(prod)
    await db_session.flush()

    # Upload 2 keys using StockService
    stock_service = StockService(db_session)
    keys_text = "account1:pass1\naccount2:pass2"
    uploaded_count, _, _ = await stock_service.bulk_upload_keys(prod.id, keys_text)
    assert uploaded_count == 2

    # Create user with sufficient balance ($15.00)
    user = User(
        telegram_id=999888777,
        first_name="TestUser",
        balance=Decimal("15.00"),
    )
    db_session.add(user)
    await db_session.commit()

    # Execute purchase 1
    purchase_service = PurchaseService(db_session)
    order1, key_content1 = await purchase_service.execute_purchase(user.telegram_id, prod.id)
    assert order1.total_amount == Decimal("10.00")
    assert key_content1 in ["account1:pass1", "account2:pass2"]
    assert user.balance == Decimal("5.00")

    # Execute purchase 2 (User balance is $5.00, required is $10.00 -> should raise InsufficientBalanceException)
    with pytest.raises(InsufficientBalanceException):
        await purchase_service.execute_purchase(user.telegram_id, prod.id)
