from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_admin
from app.db.models.order import Order, OrderItem
from app.db.repositories.order_repository import OrderRepository
from app.schemas.order import OrderResponse
from app.services.bakong_service import BakongService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    repo = OrderRepository(db)
    return await repo.get_all_orders_paginated(skip=skip, limit=limit)


@router.post("/{order_id}/verify-bakong")
async def admin_verify_order_bakong(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """
    Checks Bakong Open API for this specific order MD5 and auto-fulfills if payment found.
    """
    fulfilled, payload = await BakongService.check_and_fulfill_order_by_id(order_id, db)
    if fulfilled:
        return {"status": "COMPLETED", "message": "Order verified with Bakong and fulfilled successfully!", "delivered_payload": payload}
    return {"status": "PENDING", "message": "No confirmed payment found on Bakong yet."}


@router.post("/{order_id}/fulfill")
async def admin_manually_fulfill_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """
    Admin manual fulfillment: locks & decrypts license keys and delivers directly to customer.
    Used for manual ABA receipt approvals or direct customer service.
    """
    stmt = (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user)
        )
        .where(Order.id == order_id)
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status in ["COMPLETED", "DELIVERED"]:
        return {"status": "COMPLETED", "message": "Order was already completed."}

    fulfilled, delivered_payload = await BakongService.verify_and_fulfill_order(
        order, db, tx_data={"hash": "admin_manual_override"}
    )
    if not fulfilled:
        raise HTTPException(
            status_code=400,
            detail=delivered_payload or "Failed to fulfill order. Check available stock keys."
        )

    return {
        "status": "COMPLETED",
        "delivered_payload": delivered_payload,
        "message": f"Order #{order_id} fulfilled manually and keys delivered!",
    }


@router.post("/{order_id}/cancel")
async def admin_cancel_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """
    Cancels a pending order.
    """
    repo = OrderRepository(db)
    order = await repo.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot cancel an already completed order.")

    order.status = "CANCELLED"
    await db.commit()
    return {"status": "CANCELLED", "message": f"Order #{order_id} has been cancelled."}
