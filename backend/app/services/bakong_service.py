import hashlib
import json
import logging
import time
from decimal import Decimal
from typing import Any, Dict, Optional, Tuple
import urllib.parse
import httpx
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models.order import Order, OrderItem
from app.db.models.transaction import Transaction
from app.db.models.user import User
from app.db.repositories.stock_repository import StockRepository
from app.db.repositories.user_repository import UserRepository
from app.core.security import decrypt_key_content

logger = logging.getLogger(__name__)


def calculate_crc16(data: str) -> str:
    """
    Computes standard CRC-16-CCITT checksum for EMVCo / Bakong KHQR.
    Polynomial: 0x1021, Initial Value: 0xFFFF
    """
    crc = 0xFFFF
    polynomial = 0x1021
    for byte in data.encode("utf-8"):
        crc ^= (byte << 8)
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ polynomial
            else:
                crc <<= 1
            crc &= 0xFFFF
    return format(crc, "04X")


def format_tlv(tag: str, value: str) -> str:
    """Formats Tag-Length-Value (TLV) segment for EMVCo KHQR."""
    val_str = str(value).strip()
    return f"{tag}{len(val_str):02d}{val_str}"


class BakongService:
    @staticmethod
    def generate_khqr(
        amount: Decimal,
        bill_number: str = "ORD",
        currency: str = "USD",
        account_id: Optional[str] = None,
        merchant_name: Optional[str] = None,
        merchant_city: Optional[str] = None,
        expiration_hours: int = 24,
    ) -> Dict[str, str]:
        """
        Generates genuine EMVCo KHQR compliant payload with 24h expiration and returns:
        - khqr_string: The raw KHQR text
        - md5: The 32-character MD5 checksum hash required by Bakong Open API
        - qr_url: QR code image URL for rendering in web / bot
        - expires_at_ms: Expiration timestamp in milliseconds
        """
        acc = (account_id or settings.BAKONG_ACCOUNT_ID or "sopha@abaa").strip()
        m_name = (merchant_name or settings.KHQR_MERCHANT_NAME or "DIGITAL STORE KH").strip()[:25]
        m_city = (merchant_city or settings.KHQR_MERCHANT_CITY or "PHNOM PENH").strip()[:15]
        currency_code = "840" if currency.upper() == "USD" else "116"

        parts = [
            "000201",  # Tag 00: Payload Format Indicator (01)
            "010212",  # Tag 01: Point of Initiation (12 = Dynamic)
        ]

        # Tag 29: Merchant Account Information Individual
        sub_acc = format_tlv("00", acc)
        parts.append(format_tlv("29", sub_acc))

        # Tag 52: Merchant Category Code (5999 = General / Digital)
        parts.append("52045999")

        # Tag 53: Transaction Currency (840 = USD, 116 = KHR)
        parts.append(format_tlv("53", currency_code))

        # Tag 54: Transaction Amount
        formatted_amount = f"{float(amount):.2f}"
        parts.append(format_tlv("54", formatted_amount))

        # Tag 58: Country Code (KH)
        parts.append("5802KH")

        # Tag 59: Merchant Name
        parts.append(format_tlv("59", m_name))

        # Tag 60: Merchant City
        parts.append(format_tlv("60", m_city))

        # Tag 62: Additional Data Field (Tag 01: Bill Number)
        clean_bill = str(bill_number).replace(" ", "_")[:25]
        sub_bill = format_tlv("01", clean_bill)
        parts.append(format_tlv("62", sub_bill))

        # Tag 99: Timestamp and Expiration (Default: 24h)
        now_ms = int(time.time() * 1000)
        exp_ms = now_ms + (expiration_hours * 3600 * 1000)
        now_str = str(now_ms)
        exp_str = str(exp_ms)
        tag99_sub = f"00{len(now_str):02d}{now_str}01{len(exp_str):02d}{exp_str}"
        parts.append(format_tlv("99", tag99_sub))

        # Tag 63: CRC Placeholder
        raw_payload = "".join(parts) + "6304"
        crc_val = calculate_crc16(raw_payload)
        khqr_string = raw_payload + crc_val

        # Compute MD5
        md5_hash = hashlib.md5(khqr_string.encode("utf-8")).hexdigest()

        encoded_qr = urllib.parse.quote(khqr_string)
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=350x350&data={encoded_qr}"

        return {
            "khqr_string": khqr_string,
            "md5": md5_hash,
            "qr_url": qr_url,
            "expires_at_ms": exp_ms,
        }

    @staticmethod
    async def check_transaction_by_md5(md5: str) -> Optional[Dict[str, Any]]:
        """
        Queries NBC Bakong Open API endpoint (/v1/check_transaction_by_md5)
        Returns transaction dict if payment confirmed, None if not found or pending.
        """
        if not settings.BAKONG_API_TOKEN or not md5:
            return None

        url = f"{settings.BAKONG_API_URL.rstrip('/')}/check_transaction_by_md5"
        headers = {
            "Authorization": f"Bearer {settings.BAKONG_API_TOKEN.strip()}",
            "Content-Type": "application/json",
        }
        payload = {"md5": md5.strip()}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    # Bakong responseCode == 0 means payment confirmed!
                    if data.get("responseCode") == 0:
                        logger.info(f"Bakong payment CONFIRMED for MD5 {md5}: {data.get('data')}")
                        return data.get("data")
                    else:
                        logger.debug(f"Bakong check MD5 {md5}: {data.get('responseMessage')}")
                elif res.status_code == 401:
                    logger.error("Bakong API returned 401 Unauthorized. Please renew BAKONG_API_TOKEN.")
                else:
                    logger.warning(f"Bakong API check HTTP {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Error querying Bakong API for MD5 {md5}: {e}")

        return None

    @classmethod
    async def verify_and_fulfill_order(
        cls,
        order: Order,
        db: AsyncSession,
        tx_data: Optional[Dict[str, Any]] = None,
    ) -> Tuple[bool, Optional[str]]:
        """
        Fulfills a pending KHQR order:
        - Locks & decrypts digital keys
        - Sets order status COMPLETED
        - Dispatches Telegram notifications to customer and admin
        - Records successful transaction
        """
        if order.status in ["COMPLETED", "PAID", "DELIVERED"]:
            item = order.items[0] if order.items else None
            return True, item.delivered_payload if item else None

        if not order.items:
            return False, None

        item = order.items[0]
        product = item.product
        quantity = int(order.total_amount / item.unit_price) if item.unit_price else 1

        # Atomically lock and reserve digital keys
        stock_repo = StockRepository(db)
        digital_keys = await stock_repo.fetch_and_lock_unsold_keys(product.id, quantity)
        if len(digital_keys) < quantity:
            logger.error(f"Order #{order.id} paid via Bakong but insufficient keys in stock ({len(digital_keys)} available, need {quantity}).")
            # Mark order as PAID so admin can fulfill manually
            order.status = "PAID"
            await db.commit()
            return False, "Insufficient stock. Admin alerted for manual fulfillment."

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

        # Record transaction if not already logged
        tx_hash = tx_data.get("hash") if tx_data else None
        tx = Transaction(
            user_id=order.user_id,
            amount=order.total_amount,
            payment_method="KHQR",
            khqr_md5=order.khqr_md5,
            status="SUCCESS",
            description=f"Auto KHQR Payment for Order #{order.id} (Hash: {tx_hash or 'verified'})",
        )
        db.add(tx)
        await db.commit()

        # Send instant delivery message to customer Telegram
        from app.bot.bot import bot
        if order.user and order.user.telegram_id:
            try:
                msg_user = (
                    f"🎉 <b>KHQR Payment Received! Product Delivered</b>\n\n"
                    f"🧾 <b>Order ID:</b> <code>#{order.id}</code>\n"
                    f"📦 <b>Product:</b> {product.title} (x{quantity})\n"
                    f"💰 <b>Total Paid:</b> ${order.total_amount:.2f}\n\n"
                    f"🔑 <b>Your Account Data / License Key:</b>\n"
                    f"<code>{delivered_payload}</code>\n\n"
                    f"<i>Thank you for purchasing!</i>"
                )
                await bot.send_message(chat_id=order.user.telegram_id, text=msg_user)
            except Exception as e:
                logger.warning(f"Could not notify customer telegram: {e}")

        # Send alert to Admin on Telegram
        if settings.ADMIN_TELEGRAM_ID:
            try:
                msg_admin = (
                    f"✅ <b>Order #{order.id} Auto Bakong Payment CONFIRMED!</b>\n"
                    f"👤 Customer: {order.user.first_name if order.user else 'Customer'}\n"
                    f"📦 Item: {product.title} x{quantity}\n"
                    f"💵 Amount: ${order.total_amount:.2f}\n"
                    f"🚀 Digital keys delivered instantly to customer."
                )
                await bot.send_message(chat_id=settings.ADMIN_TELEGRAM_ID, text=msg_admin)
            except Exception as e:
                logger.warning(f"Could not notify admin telegram: {e}")

        return True, delivered_payload

    @classmethod
    async def check_and_fulfill_order_by_id(cls, order_id: int, db: AsyncSession) -> Tuple[bool, Optional[str]]:
        """
        Looks up order, checks Bakong API if pending, and fulfills if paid.
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
            return False, None

        if order.status in ["COMPLETED", "PAID", "DELIVERED"]:
            item = order.items[0] if order.items else None
            return True, item.delivered_payload if item else None

        if not order.khqr_md5:
            return False, None

        # Check with Bakong Open API
        tx_data = await cls.check_transaction_by_md5(order.khqr_md5)
        if tx_data:
            return await cls.verify_and_fulfill_order(order, db, tx_data)

        return False, None

    @classmethod
    async def check_and_credit_topup_by_md5(cls, md5: str, db: AsyncSession) -> Tuple[bool, Decimal]:
        """
        Checks Bakong API for a topup transaction MD5 and credits user balance if paid.
        """
        # Check if transaction exists
        stmt = select(Transaction).options(selectinload(Transaction.user)).where(Transaction.khqr_md5 == md5)
        res = await db.execute(stmt)
        tx = res.scalar_one_or_none()
        if not tx:
            return False, Decimal("0.00")

        if tx.status == "SUCCESS":
            user_repo = UserRepository(db)
            user = await user_repo.get(tx.user_id)
            return True, user.balance if user else Decimal("0.00")

        # Query Bakong
        tx_data = await cls.check_transaction_by_md5(md5)
        if tx_data:
            user_repo = UserRepository(db)
            updated_user = await user_repo.add_balance(tx.user_id, tx.amount)
            tx.status = "SUCCESS"
            tx_hash = tx_data.get("hash")
            tx.description = f"Bakong KHQR Topup Confirmed (Hash: {tx_hash or 'verified'})"
            await db.commit()

            # Send bot notification to user
            from app.bot.bot import bot
            try:
                user = await user_repo.get(tx.user_id)
                if user and user.telegram_id:
                    msg = (
                        f"🎉 <b>បញ្ចូលថវិកាបានជោគជ័យ! (Top-up Successful)</b>\n\n"
                        f"💵 <b>ចំនួន:</b> ${tx.amount:.2f}\n"
                        f"💳 <b>តុល្យភាពថ្មី:</b> ${updated_user.balance:.2f}\n"
                        f"🧾 <b>Transaction:</b> <code>#{tx.id}</code>\n\n"
                        f"អរគុណសម្រាប់ការប្រើប្រាស់សេវាកម្ម!"
                    )
                    await bot.send_message(chat_id=user.telegram_id, text=msg)
            except Exception as e:
                logger.warning(f"Could not notify user of topup: {e}")

            # Send admin alert
            if settings.ADMIN_TELEGRAM_ID:
                try:
                    admin_msg = (
                        f"💰 <b>User Balance Top-up Verified via Bakong!</b>\n"
                        f"👤 Customer: {updated_user.first_name} (ID: <code>{updated_user.telegram_id}</code>)\n"
                        f"💵 Amount: ${tx.amount:.2f}\n"
                        f"💳 New Balance: ${updated_user.balance:.2f}"
                    )
                    await bot.send_message(chat_id=settings.ADMIN_TELEGRAM_ID, text=admin_msg)
                except Exception:
                    pass

            return True, updated_user.balance

        return False, Decimal("0.00")

