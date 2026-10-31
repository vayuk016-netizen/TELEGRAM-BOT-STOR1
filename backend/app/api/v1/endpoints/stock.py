from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_admin
from app.services.stock_service import StockService
from app.schemas.stock import (
    BulkKeyUploadPayload,
    BulkKeyUploadResponse,
    StockKeyItemResponse,
    DeleteKeyResponse,
)
from app.core.exceptions import ProductNotFoundException

router = APIRouter(prefix="/stock", tags=["Stock Vault"])


@router.post("/bulk-upload", response_model=BulkKeyUploadResponse, status_code=status.HTTP_201_CREATED)
async def bulk_upload_keys(
    payload: BulkKeyUploadPayload,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    service = StockService(db)
    try:
        count, current_stock, duplicates_skipped = await service.bulk_upload_keys(
            product_id=payload.product_id,
            raw_text_data=payload.raw_keys_text,
            skip_duplicates=payload.skip_duplicates,
        )
        msg = f"Successfully encrypted & uploaded {count} keys into vault! Current stock: {current_stock}"
        if duplicates_skipped > 0:
            msg += f" ({duplicates_skipped} duplicate keys skipped)"
            
        return BulkKeyUploadResponse(
            product_id=payload.product_id,
            keys_added=count,
            current_stock=current_stock,
            duplicates_skipped=duplicates_skipped,
            message=msg,
        )
    except ProductNotFoundException as e:
        raise HTTPException(status_code=404, detail=e.message)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"Stock upload failed: {str(e)}")


@router.get("/audit/{product_id}")
async def audit_stock(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    service = StockService(db)
    stats = await service.stock_repo.get_stock_stats_by_product(product_id)
    return {"product_id": product_id, "stats": stats}


@router.get("/keys/{product_id}", response_model=List[StockKeyItemResponse])
async def list_product_keys(
    product_id: int,
    limit: int = Query(default=100, ge=1, le=500),
    is_sold: Optional[bool] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Inspect digital keys for a product in the vault."""
    service = StockService(db)
    return await service.get_product_keys_audit(product_id=product_id, limit=limit, is_sold=is_sold)


@router.delete("/keys/{key_id}", response_model=DeleteKeyResponse)
async def delete_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Deletes an unsold digital key by ID."""
    service = StockService(db)
    success, product_id, current_stock = await service.delete_unsold_key(key_id)
    if not success:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete this key. It either does not exist or has already been sold.",
        )
    return DeleteKeyResponse(
        success=True,
        message=f"Key #{key_id} removed from vault.",
        product_id=product_id,
        current_stock=current_stock,
    )


@router.delete("/clear-unsold/{product_id}", response_model=DeleteKeyResponse)
async def clear_unsold_stock(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Clears all unsold keys for a product."""
    service = StockService(db)
    count, current_stock = await service.clear_unsold_keys_for_product(product_id)
    return DeleteKeyResponse(
        success=True,
        message=f"Cleared {count} unsold keys from vault.",
        product_id=product_id,
        current_stock=current_stock,
    )
