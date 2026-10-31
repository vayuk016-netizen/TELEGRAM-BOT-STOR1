import logging
import math
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from pathlib import Path
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc, or_, cast, String
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.api.dependencies import get_current_admin, get_db
from app.core.config import settings
from app.services.bakong_service import token_pool, BakongService
from app.db.models.order import Order, OrderItem
from app.db.models.transaction import Transaction
from app.db.models.user import User
from app.db.models.product import Product

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payment Management"])


class MerchantInfoUpdate(BaseModel):
    merchant_name: Optional[str] = None
    merchant_city: Optional[str] = None
    bakong_account_id: Optional[str] = None
    merchant_id: Optional[str] = None
    acquiring_bank: Optional[str] = None
    aba_account_name: Optional[str] = None
    aba_account_number: Optional[str] = None


class TokensUpdate(BaseModel):
    tokens: List[str] = Field(..., description="List of Bakong API token strings")


class TokenTestRequest(BaseModel):
    token: str


def update_env_variable(key: str, value: str):
    backend_dir = Path(__file__).resolve().parents[4]
    env_path = backend_dir / ".env"
    lines = []
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

    updated = False
    for i, line in enumerate(lines):
        if line.strip().startswith(f"{key}="):
            lines[i] = f"{key}={value}\n"
            updated = True
            break

    if not updated:
        lines.append(f"\n{key}={value}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)


@router.get("/status")
async def get_payment_management_status(
    admin: Any = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns complete Payment Management overview:
    - General Info (Merchant Name, MID, Bakong Gateway, ABA Bank details)
    - Multi-Token Pool Status (Tokens list, active/exhausted status, request capacity)
    - KHQR Orders & Revenue Statistics
    """
    tokens = token_pool.get_tokens()
    now = time.time()

    token_details = []
    active_count = 0
    exhausted_count = 0
    total_daily_quota = len(tokens) * 100
    total_used = 0

    for idx, tok in enumerate(tokens):
        tok_clean = tok.strip()
        tok_info = token_pool.get_token_info(tok_clean)
        is_exhausted = tok_info.get("exhausted", False)
        
        used_for_token = 100 if is_exhausted else tok_info.get("used", 0)
        remaining_for_token = max(0, 100 - used_for_token)
        total_used += used_for_token

        if is_exhausted:
            exhausted_count += 1
            status_text = tok_info.get("message") or "Exhausted (100/100 limit reached for today)"
        else:
            active_count += 1
            status_text = "Active & Ready"

        preview = f"{tok_clean[:14]}...{tok_clean[-10:]}" if len(tok_clean) > 28 else tok_clean

        token_details.append({
            "index": idx + 1,
            "preview": preview,
            "full_token": tok_clean,
            "status": "EXHAUSTED" if is_exhausted else "ACTIVE",
            "status_text": status_text,
            "requests_per_day": 100,
            "used_requests": used_for_token,
            "remaining_requests": remaining_for_token,
            "quota_display": f"{remaining_for_token}/100",
            "is_current": (idx == token_pool._current_index),
        })

    total_remaining = max(0, total_daily_quota - total_used)

    # Query payment order metrics
    stmt_khqr = select(
        func.count(Order.id),
        func.count(Order.id).filter(Order.status == "COMPLETED"),
        func.count(Order.id).filter(Order.status == "PENDING"),
        func.coalesce(func.sum(Order.total_amount).filter(Order.status == "COMPLETED"), 0),
    ).where(Order.payment_method == "khqr")
    res_orders = await db.execute(stmt_khqr)
    total_orders, completed_orders, pending_orders, total_rev = res_orders.first() or (0, 0, 0, 0)

    # Query transactions count
    stmt_tx = select(
        func.count(Transaction.id),
        func.coalesce(func.sum(Transaction.amount).filter(Transaction.status == "SUCCESS"), 0),
    ).where(Transaction.payment_method.ilike("%KHQR%"))
    res_tx = await db.execute(stmt_tx)
    total_tx, total_tx_amt = res_tx.first() or (0, 0)

    return {
        "general_info": {
            "merchant_name": settings.KHQR_MERCHANT_NAME or "SOK SOPHA",
            "merchant_city": settings.KHQR_MERCHANT_CITY or "PHNOM PENH",
            "bakong_account_id": settings.BAKONG_ACCOUNT_ID or "abaakhppxxx@abaa",
            "merchant_id": getattr(settings, "BAKONG_MERCHANT_ID", settings.KHQR_ACCOUNT_NUMBER) or "126103017113061",
            "acquiring_bank": getattr(settings, "BAKONG_ACQUIRING_BANK", "ABA Bank") or "ABA Bank",
            "aba_account_name": settings.ABA_ACCOUNT_NAME or "SOK SOPHA",
            "aba_account_number": settings.ABA_ACCOUNT_NUMBER or "126103017113061",
            "currency": "USD (840) / KHR (116)",
            "api_url": settings.BAKONG_API_URL,
        },
        "token_pool": {
            "total_tokens": len(tokens),
            "active_count": active_count,
            "exhausted_count": exhausted_count,
            "total_daily_quota": total_daily_quota,
            "used_requests": total_used,
            "remaining_quota": total_remaining,
            "quota_display": f"{total_remaining}/{total_daily_quota}",
            "tokens": token_details,
        },
        "metrics": {
            "total_khqr_orders": total_orders,
            "completed_orders": completed_orders,
            "pending_orders": pending_orders,
            "total_khqr_volume_usd": float(total_rev),
            "total_transactions": total_tx,
            "total_topup_volume_usd": float(total_tx_amt),
        }
    }


@router.post("/test-token")
async def test_bakong_token(
    payload: TokenTestRequest,
    admin: Any = Depends(get_current_admin),
):
    """
    Tests a Bakong API Token against the NBC Bakong Open API.
    Returns status, responseCode, and error message if any.
    """
    tok = payload.token.strip()
    if not tok:
        raise HTTPException(status_code=400, detail="Token cannot be empty")

    url = f"{settings.BAKONG_API_URL.rstrip('/')}/check_transaction_by_md5"
    headers = {
        "Authorization": f"Bearer {tok}",
        "Content-Type": "application/json",
    }
    test_payload = {"md5": "00000000000000000000000000000000"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(url, json=test_payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                if data.get("errorCode") == 17:
                    token_pool.mark_exhausted(tok)
                    return {
                        "valid": True,
                        "status": "EXHAUSTED",
                        "message": "Token is VALID, but daily limit of 100 has been reached for today.",
                        "raw": data,
                    }
                token_pool.record_request(tok)
                return {
                    "valid": True,
                    "status": "ACTIVE",
                    "message": "Token is ACTIVE and connecting successfully to Bakong Open API!",
                    "raw": data,
                }
            elif res.status_code == 401:
                return {
                    "valid": False,
                    "status": "UNAUTHORIZED",
                    "message": "Token is INVALID or EXPIRED (HTTP 401 Unauthorized).",
                }
            else:
                return {
                    "valid": False,
                    "status": f"HTTP_{res.status_code}",
                    "message": f"Bakong responded with HTTP {res.status_code}: {res.text}",
                }
    except Exception as e:
        return {
            "valid": False,
            "status": "CONNECTION_ERROR",
            "message": f"Could not reach Bakong API: {e}",
        }


@router.put("/tokens")
async def update_bakong_tokens(
    payload: TokensUpdate,
    admin: Any = Depends(get_current_admin),
):
    """
    Updates the list of Bakong API tokens in .env and refreshes the in-memory pool.
    """
    cleaned_tokens = [t.strip() for t in payload.tokens if t.strip()]
    if not cleaned_tokens:
        raise HTTPException(status_code=400, detail="At least one token is required")

    tokens_str = ",".join(cleaned_tokens)
    primary_token = cleaned_tokens[0]

    update_env_variable("BAKONG_API_TOKENS", f'"{tokens_str}"')
    update_env_variable("BAKONG_API_TOKEN", f'"{primary_token}"')

    settings.BAKONG_API_TOKENS = tokens_str
    settings.BAKONG_API_TOKEN = primary_token

    # Reset in-memory pool index
    token_pool._current_index = 0

    return {
        "success": True,
        "message": f"Successfully updated Bakong Token Pool with {len(cleaned_tokens)} token(s)!",
        "total_tokens": len(cleaned_tokens),
        "total_daily_quota": len(cleaned_tokens) * 100,
    }


@router.put("/merchant-info")
async def update_merchant_info(
    payload: MerchantInfoUpdate,
    admin: Any = Depends(get_current_admin),
):
    """
    Updates Merchant and ABA Bank information in .env.
    """
    if payload.merchant_name is not None:
        val = payload.merchant_name.strip()
        update_env_variable("KHQR_MERCHANT_NAME", f'"{val}"')
        settings.KHQR_MERCHANT_NAME = val

    if payload.merchant_city is not None:
        val = payload.merchant_city.strip()
        update_env_variable("KHQR_MERCHANT_CITY", f'"{val}"')
        settings.KHQR_MERCHANT_CITY = val

    if payload.bakong_account_id is not None:
        val = payload.bakong_account_id.strip()
        update_env_variable("BAKONG_ACCOUNT_ID", val)
        settings.BAKONG_ACCOUNT_ID = val

    if payload.merchant_id is not None:
        val = payload.merchant_id.strip()
        update_env_variable("BAKONG_MERCHANT_ID", val)
        update_env_variable("KHQR_ACCOUNT_NUMBER", val)
        settings.BAKONG_MERCHANT_ID = val
        settings.KHQR_ACCOUNT_NUMBER = val

    if payload.aba_account_name is not None:
        val = payload.aba_account_name.strip()
        update_env_variable("ABA_ACCOUNT_NAME", f'"{val}"')
        settings.ABA_ACCOUNT_NAME = val

    if payload.aba_account_number is not None:
        val = payload.aba_account_number.strip()
        update_env_variable("ABA_ACCOUNT_NUMBER", val)
        settings.ABA_ACCOUNT_NUMBER = val

    return {
        "success": True,
        "message": "Payment Merchant information updated successfully!",
    }


@router.get("/transactions")
async def get_recent_transactions(
    limit: int = 50,
    admin: Any = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns recent payment and topup transactions.
    """
    stmt = (
        select(Transaction)
        .order_by(Transaction.id.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    txs = res.scalars().all()
    return txs


@router.get("/history")
async def get_customer_payment_history(
    search: Optional[str] = Query(None, description="Search by customer name, username, telegram ID, MD5 hash, or order ID"),
    status: Optional[str] = Query(None, description="Filter by status: ALL, COMPLETED, PENDING, FAILED"),
    payment_type: Optional[str] = Query(None, description="Filter by type: ALL, KHQR, KHQR_ORDER, KHQR_TOPUP, BALANCE"),
    date_range: Optional[str] = Query(None, description="Filter by date: all, today, 7days, month"),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    admin: Any = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves unified Customer Payment History (Direct KHQR Orders and KHQR Balance Top-ups)
    with comprehensive search, status, payment type, and date range filters + pagination.
    """
    cutoff_time = None
    now_utc = datetime.now(timezone.utc)
    if date_range == "today":
        cutoff_time = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    elif date_range == "7days":
        cutoff_time = now_utc - timedelta(days=7)
    elif date_range == "month":
        cutoff_time = now_utc - timedelta(days=30)

    payment_items: List[Dict[str, Any]] = []

    # 1. Fetch Orders (if not exclusively filtering for TOPUP)
    should_include_orders = payment_type not in ["TOPUP", "KHQR_TOPUP"]
    if should_include_orders:
        order_stmt = (
            select(Order)
            .join(Order.user)
            .options(
                selectinload(Order.user),
                selectinload(Order.items).selectinload(OrderItem.product),
            )
        )

        # Status filter for orders
        if status and status.upper() != "ALL":
            st_u = status.upper()
            if st_u in ["COMPLETED", "SUCCESS", "PAID"]:
                order_stmt = order_stmt.where(Order.status.in_(["COMPLETED", "PAID"]))
            elif st_u == "PENDING":
                order_stmt = order_stmt.where(Order.status == "PENDING")
            elif st_u in ["FAILED", "CANCELLED"]:
                order_stmt = order_stmt.where(Order.status.in_(["FAILED", "CANCELLED"]))

        # Payment type filter for orders
        if payment_type and payment_type.upper() != "ALL":
            pt_u = payment_type.upper()
            if pt_u in ["KHQR", "KHQR_ORDER"]:
                order_stmt = order_stmt.where(Order.payment_method == "khqr")
            elif pt_u == "BALANCE":
                order_stmt = order_stmt.where(Order.payment_method == "balance")

        # Date cutoff
        if cutoff_time:
            order_stmt = order_stmt.where(Order.created_at >= cutoff_time)

        # Search filter
        if search and search.strip():
            s_term = f"%{search.strip()}%"
            order_stmt = order_stmt.where(
                or_(
                    User.username.ilike(s_term),
                    User.first_name.ilike(s_term),
                    User.last_name.ilike(s_term),
                    cast(User.telegram_id, String).ilike(s_term),
                    Order.khqr_md5.ilike(s_term),
                    cast(Order.id, String).ilike(s_term),
                )
            )

        order_stmt = order_stmt.order_by(Order.id.desc())
        order_res = await db.execute(order_stmt)
        orders = order_res.scalars().all()

        for ord_obj in orders:
            usr = ord_obj.user
            customer_name = ""
            if usr:
                customer_name = f"{usr.first_name or ''} {usr.last_name or ''}".strip()
                if not customer_name:
                    customer_name = f"@{usr.username}" if usr.username else f"User {usr.telegram_id}"

            prod_names = []
            if ord_obj.items:
                for it in ord_obj.items:
                    if it.product:
                        prod_names.append(it.product.title)

            desc_text = f"Direct Order: {', '.join(prod_names)}" if prod_names else f"Order #{ord_obj.id}"

            payment_items.append({
                "id": f"ORD-{ord_obj.id}",
                "raw_id": ord_obj.id,
                "category": "ORDER",
                "payment_type": "KHQR_ORDER" if (ord_obj.payment_method or "").lower() == "khqr" else "BALANCE_ORDER",
                "payment_method": (ord_obj.payment_method or "khqr").upper(),
                "customer": {
                    "id": usr.id if usr else None,
                    "telegram_id": usr.telegram_id if usr else None,
                    "username": usr.username if usr else None,
                    "name": customer_name or "Unknown Customer",
                },
                "amount": float(ord_obj.total_amount),
                "status": "COMPLETED" if ord_obj.status in ["COMPLETED", "PAID"] else ord_obj.status,
                "raw_status": ord_obj.status,
                "khqr_md5": ord_obj.khqr_md5,
                "description": desc_text,
                "created_at": ord_obj.created_at.isoformat() if ord_obj.created_at else None,
            })

    # 2. Fetch Transactions (if not exclusively filtering for ORDER or BALANCE)
    should_include_tx = payment_type not in ["ORDER", "KHQR_ORDER", "BALANCE"]
    if should_include_tx:
        tx_stmt = (
            select(Transaction)
            .join(Transaction.user)
            .options(selectinload(Transaction.user))
        )

        # Status filter for transactions
        if status and status.upper() != "ALL":
            st_u = status.upper()
            if st_u in ["COMPLETED", "SUCCESS", "PAID"]:
                tx_stmt = tx_stmt.where(Transaction.status.in_(["SUCCESS", "COMPLETED"]))
            elif st_u == "PENDING":
                tx_stmt = tx_stmt.where(Transaction.status == "PENDING")
            elif st_u in ["FAILED", "CANCELLED"]:
                tx_stmt = tx_stmt.where(Transaction.status.in_(["FAILED", "CANCELLED"]))

        # Payment type filter
        if payment_type and payment_type.upper() != "ALL":
            pt_u = payment_type.upper()
            if pt_u in ["KHQR", "KHQR_TOPUP"]:
                tx_stmt = tx_stmt.where(Transaction.payment_method.ilike("%KHQR%"))

        # Date cutoff
        if cutoff_time:
            tx_stmt = tx_stmt.where(Transaction.created_at >= cutoff_time)

        # Search filter
        if search and search.strip():
            s_term = f"%{search.strip()}%"
            tx_stmt = tx_stmt.where(
                or_(
                    User.username.ilike(s_term),
                    User.first_name.ilike(s_term),
                    User.last_name.ilike(s_term),
                    cast(User.telegram_id, String).ilike(s_term),
                    Transaction.khqr_md5.ilike(s_term),
                    cast(Transaction.id, String).ilike(s_term),
                    Transaction.description.ilike(s_term),
                )
            )

        tx_stmt = tx_stmt.order_by(Transaction.id.desc())
        tx_res = await db.execute(tx_stmt)
        txs = tx_res.scalars().all()

        for t in txs:
            usr = t.user
            customer_name = ""
            if usr:
                customer_name = f"{usr.first_name or ''} {usr.last_name or ''}".strip()
                if not customer_name:
                    customer_name = f"@{usr.username}" if usr.username else f"User {usr.telegram_id}"

            payment_items.append({
                "id": f"TX-{t.id}",
                "raw_id": t.id,
                "category": "TOPUP",
                "payment_type": "KHQR_TOPUP" if "khqr" in (t.payment_method or "").lower() else "TOPUP",
                "payment_method": (t.payment_method or "KHQR").upper(),
                "customer": {
                    "id": usr.id if usr else None,
                    "telegram_id": usr.telegram_id if usr else None,
                    "username": usr.username if usr else None,
                    "name": customer_name or "Unknown Customer",
                },
                "amount": float(t.amount),
                "status": "COMPLETED" if t.status in ["SUCCESS", "COMPLETED"] else t.status,
                "raw_status": t.status,
                "khqr_md5": t.khqr_md5,
                "description": t.description or f"Balance Top-up (${float(t.amount):.2f})",
                "created_at": t.created_at.isoformat() if t.created_at else None,
            })

    # Sort combined history by created_at descending
    payment_items.sort(key=lambda x: x["created_at"] or "", reverse=True)

    # Compute Summary Stats
    total_records = len(payment_items)
    completed_amount = sum(
        x["amount"] for x in payment_items if x["status"] in ["COMPLETED", "SUCCESS", "PAID"]
    )
    completed_count = sum(
        1 for x in payment_items if x["status"] in ["COMPLETED", "SUCCESS", "PAID"]
    )
    pending_count = sum(1 for x in payment_items if x["status"] == "PENDING")
    failed_count = sum(
        1 for x in payment_items if x["status"] in ["FAILED", "CANCELLED"]
    )

    # Paginate
    total_pages = max(1, math.ceil(total_records / page_size)) if total_records > 0 else 1
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_items = payment_items[start_idx:end_idx]

    return {
        "items": paginated_items,
        "total": total_records,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "summary": {
            "total_volume_usd": round(completed_amount, 2),
            "completed_count": completed_count,
            "pending_count": pending_count,
            "failed_count": failed_count,
        },
    }


@router.post("/verify/{payment_id}")
async def verify_customer_payment(
    payment_id: str,
    admin: Any = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually triggers Bakong Open API verification for a pending Order or Top-up by ID.
    If payment is confirmed on Bakong -> immediately fulfills order or credits topup!
    """
    clean_id = payment_id.strip()

    if clean_id.startswith("ORD-") or clean_id.isdigit():
        numeric_id = int(clean_id.replace("ORD-", ""))
        fulfilled, payload = await BakongService.check_and_fulfill_order_by_id(numeric_id, db)
        if fulfilled:
            return {
                "success": True,
                "status": "COMPLETED",
                "message": f"Order #{numeric_id} confirmed via Bakong Open API! Digital keys delivered.",
                "details": payload,
            }
        return {
            "success": False,
            "status": "PENDING",
            "message": f"No confirmed payment found on Bakong yet for Order #{numeric_id}.",
        }

    elif clean_id.startswith("TX-"):
        numeric_id = int(clean_id.replace("TX-", ""))
        stmt = select(Transaction).where(Transaction.id == numeric_id)
        res = await db.execute(stmt)
        tx = res.scalar_one_or_none()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")

        if not tx.khqr_md5:
            raise HTTPException(status_code=400, detail="Transaction has no Bakong MD5 hash to verify")

        success, new_balance = await BakongService.check_and_credit_topup_by_md5(tx.khqr_md5, db)
        if success:
            return {
                "success": True,
                "status": "COMPLETED",
                "message": f"Top-up confirmed via Bakong! Credited ${float(tx.amount):.2f}. New balance: ${float(new_balance):.2f}.",
            }
        return {
            "success": False,
            "status": "PENDING",
            "message": "No confirmed payment found on Bakong yet for this top-up.",
        }

    else:
        raise HTTPException(status_code=400, detail="Invalid payment ID format. Expected ORD-X or TX-X.")

