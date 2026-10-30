import asyncio
import time
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_admin
from app.db.repositories.order_repository import OrderRepository
from app.db.repositories.user_repository import UserRepository
from app.db.repositories.product_repository import ProductRepository

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from app.db.models.product import Category, Product
from app.db.models.digital_key import DigitalKey
from app.db.models.user import User
from app.db.models.order import Order, OrderItem

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# 3-Second In-Memory Cache to prevent database overloading from admin dashboard polling
_cache_data = None
_cache_time = 0.0
CACHE_TTL = 3.0


@router.get("/overview")
async def get_analytics_overview(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    global _cache_data, _cache_time
    now = time.time()
    if _cache_data is not None and (now - _cache_time) < CACHE_TTL:
        return _cache_data

    order_repo = OrderRepository(db)
    user_repo = UserRepository(db)
    prod_repo = ProductRepository(db)

    metrics = await order_repo.get_dashboard_metrics()
    total_users = await user_repo.count_total_users()
    low_stock_count = await prod_repo.count_low_stock_products(threshold=5)
    recent_orders = await order_repo.get_recent_orders_with_user(limit=10)
    chart_data = await order_repo.get_weekly_sales_chart()
    live_feed = []

    for order, user, prod in recent_orders:
        live_feed.append(
            {
                "order_id": order.id,
                "user": f"@{user.username}" if user.username else user.first_name,
                "product_title": prod.title,
                "amount": float(order.total_amount),
                "created_at": order.created_at.isoformat(),
            }
        )

    _cache_data = {
        "today_revenue": metrics["revenue_today"],
        "total_revenue": metrics["total_revenue"],
        "sold_today": metrics["sold_today"],
        "total_orders": metrics["total_orders"],
        "total_users": total_users,
        "low_stock_alerts": low_stock_count,
        "live_feed": live_feed,
        "chart_data": chart_data,
    }
    _cache_time = now
    return _cache_data


@router.post("/seed")
@router.get("/seed")
async def seed_database(db: AsyncSession = Depends(get_db)):
    # Check if we already have categories to prevent duplicate seeding
    from sqlalchemy import select
    
    stmt_cat = select(Category)
    res_cat = await db.execute(stmt_cat)
    existing_cats = res_cat.scalars().all()
    
    if len(existing_cats) > 0:
        return {"status": "already_seeded", "message": "Database already has categories. Seeding skipped to avoid duplicates."}

    # 1. Create categories
    categories_data = [
        {"name": "Software License", "description": "Genuine OS & Office licenses", "icon": "laptop"},
        {"name": "Gift Cards", "description": "Steam, Apple, Netflix & Google Play", "icon": "gift"},
        {"name": "Premium Subscriptions", "description": "ChatGPT Plus, Spotify & Canva Pro", "icon": "sparkles"},
    ]
    
    cats = []
    for c_data in categories_data:
        cat = Category(
            name=c_data["name"],
            description=c_data["description"],
            icon=c_data["icon"],
            is_active=True
        )
        db.add(cat)
        cats.append(cat)
    await db.flush() # get category IDs
    
    # Map category by name
    cat_map = {c.name: c.id for c in cats}
    
    # 2. Create products
    products_data = [
        {"cat_name": "Software License", "title": "Windows 11 Pro Key", "description": "Genuine Retail License Key for 1 PC.", "price": Decimal("15.00")},
        {"cat_name": "Software License", "title": "Office 2021 Pro Plus", "description": "Lifetime activation key for MS Office 2021.", "price": Decimal("25.00")},
        {"cat_name": "Gift Cards", "title": "Steam $10 Gift Card", "description": "Steam digital wallet code.", "price": Decimal("10.50")},
        {"cat_name": "Gift Cards", "title": "Netflix $20 Gift Card", "description": "Netflix subscription voucher.", "price": Decimal("21.00")},
        {"cat_name": "Premium Subscriptions", "title": "ChatGPT Plus 1 Month", "description": "Access GPT-4 and advanced tools.", "price": Decimal("22.00")},
        {"cat_name": "Premium Subscriptions", "title": "Spotify Premium 1 Year", "description": "Premium subscription plan.", "price": Decimal("35.00")},
    ]
    
    prods = []
    for p_data in products_data:
        prod = Product(
            category_id=cat_map[p_data["cat_name"]],
            title=p_data["title"],
            description=p_data["description"],
            price=p_data["price"],
            is_active=True
        )
        db.add(prod)
        prods.append(prod)
    await db.flush() # get product IDs
    
    # 3. Create test users
    users_data = [
        {"telegram_id": 111111111, "username": "customer_dara", "first_name": "Dara", "last_name": "Chan", "balance": Decimal("150.00")},
        {"telegram_id": 222222222, "username": "customer_sok", "first_name": "Sok", "last_name": "Keo", "balance": Decimal("85.50")},
        {"telegram_id": 333333333, "username": "customer_vanna", "first_name": "Vanna", "last_name": "Rith", "balance": Decimal("120.00")},
    ]
    users = []
    for u_data in users_data:
        user = User(
            telegram_id=u_data["telegram_id"],
            username=u_data["username"],
            first_name=u_data["first_name"],
            last_name=u_data["last_name"],
            balance=u_data["balance"],
            role="customer",
            is_blocked=False,
            language_code="km"
        )
        db.add(user)
        users.append(user)
    await db.flush()
    
    # 4. Add Digital Keys (some unsold, some sold)
    import random
    from app.core.security import encrypt_key_content
    
    # For each product, add 8 unsold keys (to avoid low stock alert trigger)
    for prod in prods:
        for k_idx in range(8):
            key_val = f"{prod.title.replace(' ', '-').upper()}-KEY-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
            encrypted = encrypt_key_content(key_val)
            dk = DigitalKey(
                product_id=prod.id,
                encrypted_content=encrypted,
                is_sold=False
            )
            db.add(dk)
            
    # Also add 1 product with low stock (e.g. 2 keys remaining) to trigger the Low Stock Warning
    low_stock_prod = Product(
        category_id=cats[0].id,
        title="Canva Pro Lifetime (Low Stock)",
        description="Canva Pro membership key.",
        price=Decimal("8.00"),
        is_active=True
    )
    db.add(low_stock_prod)
    await db.flush()
    
    # Add only 2 keys to it
    for k_idx in range(2):
        key_val = f"CANVA-PRO-KEY-{random.randint(1000, 9999)}"
        encrypted = encrypt_key_content(key_val)
        dk = DigitalKey(
            product_id=low_stock_prod.id,
            encrypted_content=encrypted,
            is_sold=False
        )
        db.add(dk)
        
    # 5. Create orders over the last 7 days
    now = datetime.now(timezone.utc)
    seeded_orders_count = 0
    seeded_revenue = Decimal("0.00")
    
    # Daily targets
    daily_orders_config = [
        (6, 2),  # 6 days ago
        (5, 3),  # 5 days ago
        (4, 4),  # 4 days ago
        (3, 5),  # 3 days ago
        (2, 3),  # 2 days ago
        (1, 6),  # 1 day ago
        (0, 4),  # today
    ]
    
    for offset, o_count in daily_orders_config:
        day_time = now - timedelta(days=offset)
        for order_idx in range(o_count):
            user = random.choice(users)
            prod = random.choice(prods)
            
            # create order
            order = Order(
                user_id=user.id,
                total_amount=prod.price,
                status="COMPLETED",
                created_at=day_time,
                updated_at=day_time
            )
            db.add(order)
            await db.flush()
            
            # create order item
            key_payload = f"{prod.title.replace(' ', '-').upper()}-SOLD-{random.randint(10000, 99999)}"
            item = OrderItem(
                order_id=order.id,
                product_id=prod.id,
                unit_price=prod.price,
                delivered_payload=key_payload,
                created_at=day_time,
                updated_at=day_time
            )
            db.add(item)
            
            # add a sold digital key record
            dk = DigitalKey(
                product_id=prod.id,
                encrypted_content=encrypt_key_content(key_payload),
                is_sold=True,
                order_id=order.id,
                sold_at=day_time,
                created_at=day_time,
                updated_at=day_time
            )
            db.add(dk)
            
            seeded_orders_count += 1
            seeded_revenue += prod.price
            
    await db.commit()
    
    return {
        "status": "success",
        "message": f"Successfully seeded database with {len(cats)} categories, {len(prods) + 1} products, {seeded_orders_count} orders, and {len(users)} users.",
        "seeded_revenue": float(seeded_revenue),
        "seeded_orders": seeded_orders_count
    }


@router.post("/clear")
@router.get("/clear")
async def clear_database(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select, delete
    
    # 1. Get seeded users
    user_ids_res = await db.execute(
        select(User.id).where(User.telegram_id.in_([111111111, 222222222, 333333333]))
    )
    user_ids = [r[0] for r in user_ids_res.all()]
    
    # 2. Get seeded products
    prod_ids_res = await db.execute(
        select(Product.id).where(Product.title.in_([
            "Windows 11 Pro Key", "Office 2021 Pro Plus", 
            "Steam $10 Gift Card", "Netflix $20 Gift Card", 
            "ChatGPT Plus 1 Month", "Spotify Premium 1 Year", 
            "Canva Pro Lifetime (Low Stock)"
        ]))
    )
    prod_ids = [r[0] for r in prod_ids_res.all()]
    
    # 3. Get seeded categories
    cat_ids_res = await db.execute(
        select(Category.id).where(Category.name.in_([
            "Software License", "Gift Cards", "Premium Subscriptions"
        ]))
    )
    cat_ids = [r[0] for r in cat_ids_res.all()]

    deleted_orders_count = 0
    deleted_keys_count = 0
    deleted_products_count = 0
    deleted_categories_count = 0
    deleted_users_count = 0

    # Delete OrderItems and Orders related to seeded users or products
    if user_ids or prod_ids:
        # Get orders to delete
        orders_stmt = select(Order.id).where(
            (Order.user_id.in_(user_ids)) | 
            (Order.id.in_(select(OrderItem.order_id).where(OrderItem.product_id.in_(prod_ids))))
        )
        order_ids_res = await db.execute(orders_stmt)
        order_ids = [r[0] for r in order_ids_res.all()]
        
        if order_ids:
            # Delete Order items
            await db.execute(delete(OrderItem).where(OrderItem.order_id.in_(order_ids)))
            # Delete Orders
            await db.execute(delete(Order).where(Order.id.in_(order_ids)))
            deleted_orders_count = len(order_ids)

    # Delete DigitalKeys related to seeded products
    if prod_ids:
        res_dk = await db.execute(delete(DigitalKey).where(DigitalKey.product_id.in_(prod_ids)))
        deleted_keys_count = res_dk.rowcount

    # Delete Products
    if prod_ids:
        res_p = await db.execute(delete(Product).where(Product.id.in_(prod_ids)))
        deleted_products_count = res_p.rowcount

    # Delete Categories
    if cat_ids:
        res_c = await db.execute(delete(Category).where(Category.id.in_(cat_ids)))
        deleted_categories_count = res_c.rowcount

    # Delete Users
    if user_ids:
        res_u = await db.execute(delete(User).where(User.id.in_(user_ids)))
        deleted_users_count = res_u.rowcount

    await db.commit()
    
    # Reset local cache in analytics endpoint
    global _cache_data, _cache_time
    _cache_data = None
    _cache_time = None

    return {
        "status": "success",
        "message": "Successfully cleared seeded sample data from database.",
        "deleted_orders": deleted_orders_count,
        "deleted_keys": deleted_keys_count,
        "deleted_products": deleted_products_count,
        "deleted_categories": deleted_categories_count,
        "deleted_users": deleted_users_count
    }


