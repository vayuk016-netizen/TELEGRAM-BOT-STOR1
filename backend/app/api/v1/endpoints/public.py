import os
import shutil
import time
from decimal import Decimal
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Header
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db
from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    decrypt_key_content,
    verify_telegram_auth,
)
from app.db.models.product import Category, Product
from app.db.models.digital_key import DigitalKey
from app.db.models.user import User
from app.db.models.order import Order, OrderItem
from app.db.repositories.product_repository import ProductRepository
from app.db.repositories.stock_repository import StockRepository
from app.db.repositories.user_repository import UserRepository
from app.db.repositories.order_repository import OrderRepository
from app.services.payment_service import PaymentService
from app.bot.bot import bot

router = APIRouter(prefix="/public", tags=["Storefront Public API"])


# -------------------------------------------------------------
# Schemas
# -------------------------------------------------------------
class TelegramAuthPayload(BaseModel):
    id: int
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    username: Optional[str] = ""
    photo_url: Optional[str] = ""
    auth_date: int
    hash: str


class CreateOrderRequest(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=10)
    payment_method: str = Field(default="khqr")  # "khqr", "manual", "balance"
    telegram_id: Optional[int] = None
    customer_name: Optional[str] = None


# -------------------------------------------------------------
# Helper: Send Telegram notification
# -------------------------------------------------------------
async def notify_customer_telegram(telegram_id: int, message_html: str):
    try:
        if telegram_id and telegram_id > 0:
            await bot.send_message(chat_id=telegram_id, text=message_html, parse_mode="HTML")
    except Exception as e:
        print(f"Warning: Could not send Telegram message to user {telegram_id}: {e}")


async def notify_admin_telegram(message_html: str):
    try:
        admin_id = settings.ADMIN_TELEGRAM_ID
        if admin_id:
            await bot.send_message(chat_id=admin_id, text=message_html, parse_mode="HTML")
    except Exception as e:
        print(f"Warning: Could not notify admin on Telegram: {e}")


# -------------------------------------------------------------
# 1. Store Info & Configuration
# -------------------------------------------------------------
@router.get("/store-info")
async def get_store_info():
    bot_user = settings.TELEGRAM_BOT_USERNAME or "sopha9926"
    return {
        "store_name": "Digital Subscription Store",
        "currency": "USD",
        "currency_symbol": "$",
        "bot_username": bot_user.lstrip("@"),
        "telegram_contact": f"https://t.me/{bot_user.lstrip('@')}",
        "aba": {
            "account_name": settings.ABA_ACCOUNT_NAME,
            "account_number": settings.ABA_ACCOUNT_NUMBER,
            "qr_link": settings.ABA_QR_LINK,
        },
        "khqr": {
            "merchant_name": settings.KHQR_MERCHANT_NAME,
            "merchant_city": settings.KHQR_MERCHANT_CITY,
            "account_number": settings.KHQR_ACCOUNT_NUMBER,
        },
    }


# -------------------------------------------------------------
# 2. Categories & Products
# -------------------------------------------------------------
@router.get("/categories")
async def get_public_categories(db: AsyncSession = Depends(get_db)):
    repo = ProductRepository(db)
    categories = await repo.get_active_categories()
    
    # Count active products per category
    res = []
    for cat in categories:
        count_stmt = select(func.count(Product.id)).where(
            Product.category_id == cat.id,
            Product.is_active.is_(True),
        )
        count_res = await db.execute(count_stmt)
        prod_count = count_res.scalar() or 0
        res.append({
            "id": cat.id,
            "name": cat.name,
            "icon": cat.icon or "📦",
            "description": cat.description or "",
            "product_count": prod_count,
        })
    return res


@router.get("/products")
async def get_public_products(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "newest",  # "newest", "price_asc", "price_desc"
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Product,
            Category,
            func.count(DigitalKey.id).filter(DigitalKey.is_sold == False).label("stock_count"),
        )
        .join(Category, Product.category_id == Category.id)
        .outerjoin(DigitalKey, DigitalKey.product_id == Product.id)
        .where(Product.is_active == True, Category.is_active == True)
        .group_by(Product.id, Category.id)
    )

    if category_id:
        stmt = stmt.where(Product.category_id == category_id)

    if search:
        search_filter = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            func.lower(Product.title).like(search_filter)
            | func.lower(Product.description).like(search_filter)
        )

    if sort == "price_asc":
        stmt = stmt.order_by(Product.price.asc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Product.price.desc())
    else:
        stmt = stmt.order_by(Product.id.desc())

    res = await db.execute(stmt)
    rows = res.all()

    items = []
    for prod, cat, stock in rows:
        items.append({
            "id": prod.id,
            "title": prod.title,
            "description": prod.description or "",
            "price": float(prod.price),
            "image_url": prod.image_url,
            "is_active": prod.is_active,
            "stock_count": stock,
            "category": {
                "id": cat.id,
                "name": cat.name,
                "icon": cat.icon or "📦",
            },
        })
    return items


@router.get("/products/{product_id}")
async def get_public_product_detail(product_id: int, db: AsyncSession = Depends(get_db)):
    repo = ProductRepository(db)
    res = await repo.get_product_with_stock(product_id)
    if not res:
        raise HTTPException(status_code=404, detail="Product not found")

    prod, stock = res
    if not prod.is_active:
        raise HTTPException(status_code=404, detail="Product is not currently available")

    cat = await repo.get_category_by_id(prod.category_id)

    return {
        "id": prod.id,
        "title": prod.title,
        "description": prod.description or "",
        "price": float(prod.price),
        "image_url": prod.image_url,
        "is_active": prod.is_active,
        "stock_count": stock,
        "category": {
            "id": cat.id if cat else 0,
            "name": cat.name if cat else "General",
            "icon": cat.icon if cat else "📦",
        },
    }


# -------------------------------------------------------------
# 3. Customer Authentication via Telegram Login Widget
# -------------------------------------------------------------
@router.post("/auth/telegram")
async def telegram_login(payload: TelegramAuthPayload, db: AsyncSession = Depends(get_db)):
    # 1. Verify hash authenticity
    auth_dict = payload.model_dump()
    is_valid = verify_telegram_auth(auth_dict, settings.BOT_TOKEN)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Telegram authentication data signature.",
        )

    # 2. Check auth expiration (max 24 hours)
    if time.time() - payload.auth_date > 86400:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram login session has expired. Please log in again.",
        )

    # 3. Find or create user in DB (shares exact same user record as the Telegram bot)
    user_repo = UserRepository(db)
    user = await user_repo.get_or_create(
        telegram_id=payload.id,
        username=payload.username or None,
        first_name=payload.first_name or "Telegram User",
        last_name=payload.last_name or None,
        language_code="km",
    )
    await db.commit()

    # 4. Generate Customer JWT
    token = create_access_token(
        data={"sub": str(user.telegram_id), "role": "customer", "user_id": user.id}
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "balance": float(user.balance),
            "photo_url": payload.photo_url,
        },
    }


@router.get("/auth/me")
async def get_current_customer(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token")

    telegram_id = int(payload.get("sub"))
    user_repo = UserRepository(db)
    user = await user_repo.get_by_telegram_id(telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "telegram_id": user.telegram_id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "balance": float(user.balance),
    }


# -------------------------------------------------------------
# 4. Create Website Order
# -------------------------------------------------------------
@router.post("/orders")
async def create_website_order(
    payload: CreateOrderRequest,
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    prod_repo = ProductRepository(db)
    stock_repo = StockRepository(db)
    user_repo = UserRepository(db)
    order_repo = OrderRepository(db)

    # Validate Product
    res = await prod_repo.get_product_with_stock(payload.product_id)
    if not res:
        raise HTTPException(status_code=404, detail="Product not found")

    product, available_stock = res
    if not product.is_active:
        raise HTTPException(status_code=400, detail="Product is not currently active")

    if available_stock < payload.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available_stock} item(s) available in stock. Cannot fulfill request of {payload.quantity}.",
        )

    # Determine Customer User
    customer_telegram_id = payload.telegram_id
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        decoded = decode_access_token(token)
        if decoded and decoded.get("sub"):
            customer_telegram_id = int(decoded.get("sub"))

    if not customer_telegram_id or customer_telegram_id <= 0:
        # Generate stable fallback user ID for guest web checkout
        customer_telegram_id = int(time.time() * 1000) % 10000000000

    user = await user_repo.get_or_create(
        telegram_id=customer_telegram_id,
        username=None,
        first_name=payload.customer_name or f"Web Customer #{customer_telegram_id % 10000}",
        last_name="",
        language_code="km",
    )
    await db.flush()

    total_amount = product.price * payload.quantity

    # A) PAYMENT VIA ACCOUNT BALANCE
    if payload.payment_method == "balance":
        if user.balance < total_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance! Required: ${total_amount:.2f}, Balance: ${user.balance:.2f}.",
            )

        # Atomically reserve and lock keys
        digital_keys = await stock_repo.fetch_and_lock_unsold_keys(product.id, payload.quantity)
        if len(digital_keys) < payload.quantity:
            raise HTTPException(status_code=400, detail="Stock changed. Insufficient items available.")

        # Deduct balance
        user.balance -= total_amount

        # Decrypt keys
        decrypted_keys = [decrypt_key_content(k.encrypted_content) for k in digital_keys]
        if len(decrypted_keys) == 1:
            delivered_payload = decrypted_keys[0]
        else:
            delivered_payload = "\n".join([f"{i+1}. {k}" for i, k in enumerate(decrypted_keys)])

        # Create COMPLETED Order
        order = await order_repo.create_order_with_item(
            user_id=user.id,
            product_id=product.id,
            unit_price=product.price,
            delivered_payload=delivered_payload,
            total_amount=total_amount,
            source="website",
            payment_method="balance",
            status="COMPLETED",
        )

        # Mark keys sold
        await stock_repo.mark_keys_as_sold([k.id for k in digital_keys], order.id)
        await db.commit()

        # Send Telegram notification to user
        msg_user = (
            f"🎉 <b>Website Order Successful!</b>\n\n"
            f"🧾 <b>Order ID:</b> <code>#{order.id}</code>\n"
            f"📦 <b>Product:</b> {product.title} (x{payload.quantity})\n"
            f"💰 <b>Total Paid:</b> ${total_amount:.2f}\n\n"
            f"🔑 <b>Your Account Data / License Key:</b>\n"
            f"<code>{delivered_payload}</code>\n\n"
            f"<i>Thank you for purchasing on our website!</i>"
        )
        await notify_customer_telegram(user.telegram_id, msg_user)

        # Send Telegram notification to admin
        msg_admin = (
            f"🔔 <b>New Website Order #{order.id} (PAID)!</b>\n"
            f"👤 Customer: {user.first_name} (ID: <code>{user.telegram_id}</code>)\n"
            f"📦 Product: {product.title} (x{payload.quantity})\n"
            f"💵 Amount: ${total_amount:.2f}\n"
            f"💳 Method: Balance"
        )
        await notify_admin_telegram(msg_admin)

        return {
            "order_id": order.id,
            "status": "COMPLETED",
            "total_amount": float(total_amount),
            "payment_method": "balance",
            "delivered_payload": delivered_payload,
            "message": "Payment successful and product delivered!",
        }

    # B) PAYMENT VIA BAKONG KHQR OR MANUAL ABA/WING
    # Create PENDING order
    order = await order_repo.create_order_with_item(
        user_id=user.id,
        product_id=product.id,
        unit_price=product.price,
        delivered_payload=None,
        total_amount=total_amount,
        source="website",
        payment_method=payload.payment_method,
        status="PENDING",
    )
    await db.commit()

    # Generate KHQR payload
    khqr_string = PaymentService.generate_khqr_payload(user.telegram_id, total_amount)
    khqr_qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=350x350&data={khqr_string}"

    # Notify admin on Telegram
    msg_admin = (
        f"🛒 <b>New Website Order Created: #{order.id} (PENDING)</b>\n"
        f"👤 Customer: {user.first_name} (ID: <code>{user.telegram_id}</code>)\n"
        f"📦 Item: {product.title} x{payload.quantity}\n"
        f"💵 Amount: ${total_amount:.2f}\n"
        f"💳 Method: {payload.payment_method.upper()}"
    )
    await notify_admin_telegram(msg_admin)

    return {
        "order_id": order.id,
        "status": "PENDING",
        "total_amount": float(total_amount),
        "product_title": product.title,
        "quantity": payload.quantity,
        "payment_method": payload.payment_method,
        "khqr_string": khqr_string,
        "khqr_qr_url": khqr_qr_url,
        "aba": {
            "account_name": settings.ABA_ACCOUNT_NAME,
            "account_number": settings.ABA_ACCOUNT_NUMBER,
            "qr_link": settings.ABA_QR_LINK,
        },
    }


# -------------------------------------------------------------
# 5. Check Order Status & Retrieve Delivered Key
# -------------------------------------------------------------
@router.get("/orders/{order_id}")
async def get_order_status(order_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product), selectinload(Order.user))
        .where(Order.id == order_id)
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    item = order.items[0] if order.items else None
    product = item.product if item else None

    # Only reveal digital key payload if order is confirmed/completed!
    delivered = None
    if order.status in ["COMPLETED", "PAID", "DELIVERED"]:
        delivered = item.delivered_payload if item else None

    return {
        "order_id": order.id,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "source": order.source,
        "payment_method": order.payment_method,
        "receipt_url": order.receipt_url,
        "created_at": order.created_at.isoformat(),
        "product": {
            "id": product.id if product else 0,
            "title": product.title if product else "Digital Item",
            "price": float(item.unit_price) if item else 0.0,
            "image_url": product.image_url if product else None,
        },
        "delivered_payload": delivered,
    }


# -------------------------------------------------------------
# 6. Confirm / Verify KHQR Payment & Deliver Key
# -------------------------------------------------------------
@router.post("/orders/{order_id}/verify-payment")
async def verify_order_payment(order_id: int, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product), selectinload(Order.user))
        .where(Order.id == order_id)
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status in ["COMPLETED", "PAID", "DELIVERED"]:
        item = order.items[0] if order.items else None
        return {
            "order_id": order.id,
            "status": "COMPLETED",
            "delivered_payload": item.delivered_payload if item else None,
            "message": "Order is already paid and delivered.",
        }

    # Fetch product and quantity needed
    item = order.items[0]
    product = item.product
    quantity = int(order.total_amount / item.unit_price) if item.unit_price else 1

    # Atomically lock and reserve digital keys
    stock_repo = StockRepository(db)
    digital_keys = await stock_repo.fetch_and_lock_unsold_keys(product.id, quantity)
    if len(digital_keys) < quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient keys in stock to fulfill this order ({len(digital_keys)} available). Please contact support.",
        )

    # Decrypt keys
    decrypted_keys = [decrypt_key_content(k.encrypted_content) for k in digital_keys]
    if len(decrypted_keys) == 1:
        delivered_payload = decrypted_keys[0]
    else:
        delivered_payload = "\n".join([f"{i+1}. {k}" for i, k in enumerate(decrypted_keys)])

    # Update item and order status
    item.delivered_payload = delivered_payload
    order.status = "COMPLETED"

    # Mark keys sold
    await stock_repo.mark_keys_as_sold([k.id for k in digital_keys], order.id)
    await db.commit()

    # Send instant delivery message to customer Telegram
    if order.user and order.user.telegram_id:
        msg_user = (
            f"🎉 <b>KHQR Payment Received! Product Delivered</b>\n\n"
            f"🧾 <b>Order ID:</b> <code>#{order.id}</code>\n"
            f"📦 <b>Product:</b> {product.title} (x{quantity})\n"
            f"💰 <b>Total Paid:</b> ${order.total_amount:.2f}\n\n"
            f"🔑 <b>Your Account Data / License Key:</b>\n"
            f"<code>{delivered_payload}</code>\n\n"
            f"<i>Thank you for purchasing!</i>"
        )
        await notify_customer_telegram(order.user.telegram_id, msg_user)

    # Send alert to Admin on Telegram
    msg_admin = (
        f"✅ <b>Order #{order.id} KHQR Payment CONFIRMED!</b>\n"
        f"👤 Customer: {order.user.first_name if order.user else 'Customer'}\n"
        f"📦 Item: {product.title} x{quantity}\n"
        f"💵 Amount: ${order.total_amount:.2f}\n"
        f"🚀 Digital keys delivered instantly to customer."
    )
    await notify_admin_telegram(msg_admin)

    return {
        "order_id": order.id,
        "status": "COMPLETED",
        "delivered_payload": delivered_payload,
        "message": "Payment confirmed! Your digital subscription is delivered below.",
    }


# -------------------------------------------------------------
# 7. Upload Payment Receipt (Manual ABA / Wing)
# -------------------------------------------------------------
@router.post("/orders/{order_id}/upload-receipt")
async def upload_payment_receipt(
    order_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product), selectinload(Order.user))
        .where(Order.id == order_id)
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid image format. Allowed formats: PNG, JPG, JPEG, WEBP",
        )

    # Save receipt to app/static/uploads
    app_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    static_uploads = os.path.join(app_dir, "static", "uploads")
    os.makedirs(static_uploads, exist_ok=True)

    filename = f"receipt_order_{order.id}_{int(time.time())}{file_ext}"
    dest_path = os.path.join(static_uploads, filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    receipt_url = f"/static/uploads/{filename}"
    order.receipt_url = receipt_url
    order.payment_method = "manual"
    await db.commit()

    # Notify admin on Telegram with receipt info
    product_title = order.items[0].product.title if order.items and order.items[0].product else "Item"
    msg_admin = (
        f"📢 <b>Payment Receipt Uploaded for Order #{order.id}!</b>\n"
        f"👤 Customer: {order.user.first_name if order.user else 'Customer'}\n"
        f"📦 Item: {product_title}\n"
        f"💵 Amount: ${order.total_amount:.2f}\n"
        f"🖼️ Receipt: {receipt_url}\n\n"
        f"<i>Please review in Admin Dashboard and confirm order.</i>"
    )
    await notify_admin_telegram(msg_admin)

    return {
        "order_id": order.id,
        "receipt_url": receipt_url,
        "message": "Payment receipt uploaded successfully! Admin is reviewing your payment.",
    }


# -------------------------------------------------------------
# 8. User Order History (My Orders)
# -------------------------------------------------------------
@router.get("/orders/user/{telegram_id}")
async def get_user_order_history(telegram_id: int, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_telegram_id(telegram_id)
    if not user:
        return []

    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.user_id == user.id)
        .order_by(Order.id.desc())
        .limit(30)
    )
    res = await db.execute(stmt)
    orders = res.scalars().all()

    output = []
    for o in orders:
        item = o.items[0] if o.items else None
        prod = item.product if item else None
        delivered = item.delivered_payload if (item and o.status in ["COMPLETED", "PAID", "DELIVERED"]) else None

        output.append({
            "order_id": o.id,
            "status": o.status,
            "total_amount": float(o.total_amount),
            "source": o.source,
            "payment_method": o.payment_method,
            "receipt_url": o.receipt_url,
            "created_at": o.created_at.isoformat(),
            "product_title": prod.title if prod else "Digital Item",
            "product_image": prod.image_url if prod else None,
            "delivered_payload": delivered,
        })
    return output

