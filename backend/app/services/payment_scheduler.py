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
    Background worker disabled to conserve 100 daily quota of Bakong Open API.
    Bakong Open API is called strictly ON-DEMAND when customer clicks 'Check Payment'
    or admin checks in dashboard.
    """
    logger.info("Bakong Background Auto-Poller is DISABLED (preserving 100/day API quota for customer on-demand payments).")
    return


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

