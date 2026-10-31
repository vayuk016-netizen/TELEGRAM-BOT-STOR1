import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.db.models.order import Order
from app.db.models.transaction import Transaction
from app.services.bakong_service import BakongService

logger = logging.getLogger("uvicorn.error")

_payment_scheduler_task = None


async def run_payment_poller():
    """
    Background worker that continuously polls Bakong API for pending KHQR orders and top-ups.
    Auto-fulfills orders and top-ups when customer payment is confirmed.
    """
    logger.info("Bakong Auto-Payment Poller service started.")
    while True:
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
            async with AsyncSessionLocal() as db:
                # 1. Check pending Orders (active within 24h)
                stmt_orders = (
                    select(Order.id)
                    .where(
                        (Order.status == "PENDING")
                        & (Order.payment_method == "khqr")
                        & (Order.khqr_md5.isnot(None))
                        & (Order.created_at >= cutoff)
                    )
                    .limit(20)
                )
                res_orders = await db.execute(stmt_orders)
                pending_order_ids = res_orders.scalars().all()

                for order_id in pending_order_ids:
                    try:
                        fulfilled, _ = await BakongService.check_and_fulfill_order_by_id(order_id, db)
                        if fulfilled:
                            logger.info(f"Auto-fulfilled Order #{order_id} via Bakong Poller!")
                    except Exception as e:
                        logger.error(f"Error auto-verifying Order #{order_id}: {e}")

                # 2. Check pending Top-up Transactions (active within 24h)
                stmt_tx = (
                    select(Transaction.khqr_md5)
                    .where(
                        (Transaction.status == "PENDING")
                        & (Transaction.payment_method == "KHQR")
                        & (Transaction.khqr_md5.isnot(None))
                        & (Transaction.created_at >= cutoff)
                    )
                    .limit(20)
                )
                res_tx = await db.execute(stmt_tx)
                pending_md5s = res_tx.scalars().all()

                for md5 in pending_md5s:
                    try:
                        success, bal = await BakongService.check_and_credit_topup_by_md5(md5, db)
                        if success:
                            logger.info(f"Auto-credited Top-up for MD5 {md5} (${bal}) via Bakong Poller!")
                    except Exception as e:
                        logger.error(f"Error auto-verifying Top-up MD5 {md5}: {e}")

        except Exception as e:
            logger.error(f"Error in Bakong payment poller loop: {e}")

        await asyncio.sleep(8)  # Check every 8 seconds


def start_payment_scheduler():
    global _payment_scheduler_task
    if _payment_scheduler_task is None or _payment_scheduler_task.done():
        _payment_scheduler_task = asyncio.create_task(run_payment_poller())
    return _payment_scheduler_task


def stop_payment_scheduler():
    global _payment_scheduler_task
    if _payment_scheduler_task and not _payment_scheduler_task.done():
        _payment_scheduler_task.cancel()
        logger.info("Bakong payment poller stopped.")

