import os
import shutil
import uuid
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_admin
from app.core.config import settings
from app.core.redis import invalidate_catalog_cache, invalidate_analytics_cache
from app.db.repositories.product_repository import ProductRepository
from app.db.models.product import Category, Product
from app.schemas.product import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    BulkPromotionRequest,
)

router = APIRouter(prefix="/products", tags=["Products"])


# Category Endpoints
@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = ProductRepository(db)
    return await repo.get_all_categories()


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = ProductRepository(db)
    cat = Category(**payload.model_dump())
    created = await repo.create_category(cat)
    await invalidate_catalog_cache()
    return created


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = ProductRepository(db)
    cat = await repo.get_category_by_id(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    data = payload.model_dump(exclude_unset=True)
    for key, val in data.items():
        setattr(cat, key, val)
    await db.flush()
    await invalidate_catalog_cache()
    return cat


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = ProductRepository(db)
    cat = await repo.get_category_by_id(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(cat)
    await db.flush()
    await invalidate_catalog_cache()


# Product Endpoints
@router.get("", response_model=List[ProductResponse])
async def list_products(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = ProductRepository(db)
    items = await repo.get_all_products_with_stock()
    result = []
    for prod, stock in items:
        p_dict = ProductResponse.model_validate(prod).model_dump()
        p_dict["stock_count"] = stock
        result.append(ProductResponse(**p_dict))
    return result


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = ProductRepository(db)
    prod = Product(**payload.model_dump())
    created = await repo.create(prod)
    await invalidate_catalog_cache()
    await invalidate_analytics_cache()
    p_dict = ProductResponse.model_validate(created).model_dump()
    p_dict["stock_count"] = 0
    return ProductResponse(**p_dict)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = ProductRepository(db)
    prod = await repo.get_by_id(product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    data = payload.model_dump(exclude_unset=True)
    for key, val in data.items():
        setattr(prod, key, val)

    await db.flush()
    await invalidate_catalog_cache()
    res = await repo.get_product_with_stock(product_id)
    p, stock = res
    p_dict = ProductResponse.model_validate(p).model_dump()
    p_dict["stock_count"] = stock
    return ProductResponse(**p_dict)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = ProductRepository(db)
    prod = await repo.get_by_id(product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    await repo.delete(prod)
    await invalidate_catalog_cache()
    await invalidate_analytics_cache()


@router.post("/bulk-promotion")
async def bulk_promotion(
    payload: BulkPromotionRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """
    Applies or clears promotion discounts (5% to 50% or custom) on selected products or categories.
    """
    from sqlalchemy import select
    from decimal import Decimal

    stmt = select(Product)
    if payload.product_ids:
        stmt = stmt.where(Product.id.in_(payload.product_ids))
    elif payload.category_id:
        stmt = stmt.where(Product.category_id == payload.category_id)

    res = await db.execute(stmt)
    products = res.scalars().all()
    if not products:
        raise HTTPException(status_code=404, detail="No matching products found")

    updated_count = 0
    if payload.action == "clear":
        for prod in products:
            if prod.original_price is not None and prod.original_price > prod.price:
                prod.price = prod.original_price
            prod.original_price = None
            updated_count += 1
    else:
        # Apply promotion (5% - 50%)
        pct = payload.discount_percent or 50
        multiplier = Decimal("1.0") - (Decimal(str(pct)) / Decimal("100.0"))
        for prod in products:
            base_price = prod.original_price if (prod.original_price and prod.original_price > prod.price) else prod.price
            if base_price > 0:
                prod.original_price = base_price
                new_price = round(base_price * multiplier, 2)
                prod.price = max(Decimal("0.01"), new_price)
                updated_count += 1

    await db.commit()
    await invalidate_catalog_cache()
    await invalidate_analytics_cache()

    return {
        "success": True,
        "action": payload.action,
        "discount_percent": payload.discount_percent if payload.action == "apply" else 0,
        "updated_count": updated_count,
        "message": f"Successfully {'applied ' + str(payload.discount_percent) + '% promotion to' if payload.action == 'apply' else 'cleared promotions from'} {updated_count} product(s)!",
    }


@router.post("/upload-image")
async def upload_product_image(
    file: UploadFile = File(...),
    admin=Depends(get_current_admin),
):
    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
    if file_ext not in [".png", ".jpg", ".jpeg", ".webp", ".gif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: PNG, JPG, JPEG, WEBP, GIF",
        )

    # If Cloudinary is configured
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
            )
            upload_result = cloudinary.uploader.upload(file.file, folder="products", resource_type="image")
            secure_url = upload_result.get("secure_url")
            if secure_url:
                return {"image_url": secure_url}
        except Exception:
            pass

    # Local fallback inside static/uploads/products
    app_dir = Path(__file__).resolve().parents[3]
    upload_dir = app_dir / "static" / "uploads" / "products"
    os.makedirs(upload_dir, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = upload_dir / filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"image_url": f"/static/uploads/products/{filename}"}
