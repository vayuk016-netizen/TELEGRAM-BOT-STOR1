import logging
from pathlib import Path
from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message, InlineKeyboardMarkup, InlineKeyboardButton, FSInputFile
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.user import User
from app.db.models.order import Order, OrderItem
from app.db.repositories.product_repository import ProductRepository
from app.services.purchase_service import PurchaseService
from app.bot.keyboards.inline import get_buy_confirm_keyboard
from app.core.exceptions import (
    OutOfStockException,
    InsufficientBalanceException,
    ProductNotFoundException,
)
from app.bot.utils.localization import get_text

logger = logging.getLogger(__name__)
router = Router()


def build_buy_confirmation_text(product, db_user, qty: int, stock_count: int, lang: str) -> str:
    prod_lbl = "Product" if lang == "en" else "ផលិតផល"
    qty_lbl = "Quantity" if lang == "en" else "ចំនួន"
    unit_price_lbl = "Unit Price" if lang == "en" else "តម្លៃ"
    total_lbl = "Total Price" if lang == "en" else "តម្លៃសរុប"
    bal_lbl = "Your Balance" if lang == "en" else "តុល្យភាពរបស់អ្នក"
    stock_lbl = "In Stock" if lang == "en" else "ស្តុកនៅសល់"

    total_price = product.price * qty

    if qty == 1:
        return (
            f"{get_text(lang, 'buy_confirm_title')}\n\n"
            f"📦 <b>{prod_lbl}:</b> {product.title}\n"
            f"🔢 <b>{qty_lbl}:</b> <b>{qty}</b>\n"
            f"💵 <b>{unit_price_lbl}:</b> ${product.price:.2f}\n"
            f"💳 <b>{bal_lbl}:</b> ${db_user.balance:.2f}\n"
            f"📊 <b>{stock_lbl}:</b> {stock_count}\n\n"
            f"{get_text(lang, 'buy_confirm_prompt')}"
        )

    return (
        f"{get_text(lang, 'buy_confirm_title')}\n\n"
        f"📦 <b>{prod_lbl}:</b> {product.title}\n"
        f"🔢 <b>{qty_lbl}:</b> <b>{qty}</b>\n"
        f"💵 <b>{unit_price_lbl}:</b> ${product.price:.2f}\n"
        f"💰 <b>{total_lbl}:</b> <b>${total_price:.2f}</b>\n"
        f"💳 <b>{bal_lbl}:</b> ${db_user.balance:.2f}\n"
        f"📊 <b>{stock_lbl}:</b> {stock_count}\n\n"
        f"{get_text(lang, 'buy_confirm_prompt')}"
    )


@router.callback_query(F.data.startswith("buy_confirm:"))
async def buy_confirm_prompt(callback: CallbackQuery, session: AsyncSession, db_user: User):
    lang = db_user.language_code or "km"
    parts = callback.data.split(":")
    product_id = int(parts[1])
    qty = int(parts[2]) if len(parts) > 2 else 1

    product_repo = ProductRepository(session)
    res = await product_repo.get_product_with_stock(product_id)

    if not res:
        msg = "Product not found!" if lang == "en" else "មិនរកឃើញផលិតផល!"
        await callback.answer(f"⚠️ {msg}", show_alert=True)
        return

    product, stock_count = res

    if stock_count <= 0:
        msg = "Product out of stock!" if lang == "en" else "ស្តុកត្រូវបានលក់អស់ហើយ!"
        await callback.answer(f"⚠️ {msg}", show_alert=True)
        return

    text = build_buy_confirmation_text(product, db_user, qty, stock_count, lang)
    kb = get_buy_confirm_keyboard(product.id, current_qty=qty, available_stock=stock_count, lang=lang)
    await callback.message.edit_text(text, reply_markup=kb)
    await callback.answer()


@router.callback_query(F.data.startswith("buy_qty:"))
async def buy_qty_handler(callback: CallbackQuery, session: AsyncSession, db_user: User):
    lang = db_user.language_code or "km"
    parts = callback.data.split(":")
    product_id = int(parts[1])
    qty = int(parts[2])

    product_repo = ProductRepository(session)
    res = await product_repo.get_product_with_stock(product_id)

    if not res:
        msg = "Product not found!" if lang == "en" else "មិនរកឃើញផលិតផល!"
        await callback.answer(f"⚠️ {msg}", show_alert=True)
        return

    product, stock_count = res

    if qty > stock_count:
        msg = f"Only {stock_count} item(s) left in stock!" if lang == "en" else f"ស្តុកនៅសល់ត្រឹមតែ {stock_count} ប៉ុណ្ណោះ!"
        await callback.answer(f"⚠️ {msg}", show_alert=True)
        return

    text = build_buy_confirmation_text(product, db_user, qty, stock_count, lang)
    kb = get_buy_confirm_keyboard(product.id, current_qty=qty, available_stock=stock_count, lang=lang)
    try:
        await callback.message.edit_text(text, reply_markup=kb)
    except Exception:
        pass
    await callback.answer()


@router.callback_query(F.data.startswith("noop_stock:"))
async def noop_stock_handler(callback: CallbackQuery, db_user: User):
    lang = db_user.language_code or "km"
    limit = callback.data.split(":")[1]
    msg = f"Only {limit} item(s) left in stock!" if lang == "en" else f"ស្តុកនៅសល់ត្រឹមតែ {limit} ប៉ុណ្ណោះ!"
    await callback.answer(f"⚠️ {msg}", show_alert=True)


@router.callback_query(F.data == "cancel_buy")
async def cancel_buy_handler(callback: CallbackQuery, db_user: User):
    lang = db_user.language_code or "km"
    await callback.message.edit_text(get_text(lang, "order_cancelled"))
    await callback.answer()


@router.callback_query(F.data.startswith("buy_execute:"))
async def execute_purchase_handler(callback: CallbackQuery, session: AsyncSession, db_user: User):
    lang = db_user.language_code or "km"
    parts = callback.data.split(":")
    product_id = int(parts[1])
    qty = int(parts[2]) if len(parts) > 2 else 1
    purchase_service = PurchaseService(session)

    try:
        order, plain_key_content = await purchase_service.execute_purchase(
            telegram_id=db_user.telegram_id,
            product_id=product_id,
            quantity=qty,
        )

        delivery_text = get_text(
            lang,
            "order_success",
            order_id=order.id,
            amount=order.total_amount,
            payload=plain_key_content,
        )

        await callback.message.edit_text(
            delivery_text,
            reply_markup=make_order_success_keyboard(order.id, lang),
        )
        alert_msg = "Purchase successful!" if lang == "en" else "ប្រគល់ទំនិញជោគជ័យ!"
        await callback.answer(f"🎉 {alert_msg}", show_alert=True)

    except OutOfStockException as e:
        await callback.answer(f"❌ {str(e)}", show_alert=True)
    except InsufficientBalanceException:
        product_repo = ProductRepository(session)
        res = await product_repo.get_product_with_stock(product_id)
        unit_price = res[0].price if res else 0.0
        total_price = float(unit_price) * qty
        
        text = get_text(
            lang,
            "insufficient_balance",
            price=total_price,
            balance=db_user.balance,
        )
        from app.bot.keyboards.inline import get_insufficient_balance_keyboard
        kb = get_insufficient_balance_keyboard(product_id, float(total_price), db_user.telegram_id, lang)
        
        await callback.message.edit_text(text, reply_markup=kb)
        await callback.answer()
    except ProductNotFoundException:
        msg = "Product not found!" if lang == "en" else "មិនរកឃើញផលិតផល!"
        await callback.answer(f"⚠️ {msg}", show_alert=True)
    except Exception:
        msg = "Technical error, please try again!" if lang == "en" else "មានបញ្ហាបច្ចេកទេស ៖ សូមព្យាយាមម្តងទៀត!"
        await callback.answer(f"⚠️ {msg}", show_alert=True)


@router.callback_query(F.data.startswith("show_buy_qr:"))
async def show_buy_qr_handler(callback: CallbackQuery, session: AsyncSession, db_user: User):
    from decimal import Decimal
    import time
    import os
    lang = db_user.language_code or "km"
    parts = callback.data.split(":")
    product_id = int(parts[1])
    price = Decimal(parts[2])

    # 1. Provide instant loading feedback to user
    loading_toast = (
        "⏳ កំពុងបង្កើត Bakong KHQR... សូមរង់ចាំបន្តិច!"
        if lang == "km"
        else "⏳ Generating Bakong KHQR... Please wait!"
    )
    try:
        await callback.answer(loading_toast)
    except Exception:
        pass

    try:
        loading_text = (
            "⏳ <b>កំពុងបង្កើត Bakong KHQR Code...</b>\n\n"
            "<i>សូមរង់ចាំមួយភ្លែត ប្រព័ន្ធកំពុងរៀបចំកូដទូទាត់សម្រាប់លោកអ្នក...</i>"
            if lang == "km"
            else "⏳ <b>Generating Bakong KHQR Code...</b>\n\n"
                 "<i>Please wait a moment while we prepare your payment QR...</i>"
        )
        await callback.message.edit_text(loading_text)
    except Exception:
        pass

    from app.core.config import settings
    from app.services.bakong_service import BakongService
    from app.db.repositories.order_repository import OrderRepository
    from app.db.repositories.product_repository import ProductRepository

    try:
        prod_repo = ProductRepository(session)
        product = await prod_repo.get(product_id)
        if not product:
            await callback.answer("⚠️ Product not found!", show_alert=True)
            return

        order_repo = OrderRepository(session)
        order = await order_repo.create_order_with_item(
            user_id=db_user.id,
            product_id=product.id,
            unit_price=price,
            delivered_payload=None,
            total_amount=price,
            source="telegram",
            payment_method="khqr",
            status="PENDING",
            khqr_md5=None,
        )
        await session.flush()
        order_id = order.id

        khqr_info = BakongService.generate_khqr(
            amount=price,
            bill_number=f"ORD_{order_id}",
            currency="USD",
        )
        khqr_string = khqr_info["khqr_string"]
        md5 = khqr_info["md5"]
        qr_url = khqr_info["qr_url"]
        png_bytes = khqr_info.get("qr_png_bytes")

        order.khqr_md5 = md5
        await session.commit()

        if png_bytes:
            from aiogram.types import BufferedInputFile
            photo = BufferedInputFile(png_bytes, filename=f"khqr_order_{order_id}.png")
        else:
            photo = khqr_info.get("external_qr_url") or f"https://api.qrserver.com/v1/create-qr-code/?size=350x350&data={khqr_string}"

        caption = get_text(
            lang,
            "direct_qr_title",
            telegram_id=db_user.telegram_id,
            price=price,
            aba_name=settings.ABA_ACCOUNT_NAME,
            aba_number=settings.ABA_ACCOUNT_NUMBER,
        )

        from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
        qr_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="🔄 ពិនិត្យការទូទាត់ (Check Payment)" if lang == "km" else "🔄 Check Payment",
                        callback_data=f"check_buy:{order_id}",
                    ),
                ],
                [
                    InlineKeyboardButton(text="💬 Supporters : @sopha9926", url="https://t.me/sopha9926"),
                ],
                [
                    InlineKeyboardButton(text="🔙 Back" if lang == "en" else "🔙 ត្រឡប់ក្រោយ", callback_data=f"prod:{product_id}"),
                ]
            ]
        )

        try:
            await callback.bot.send_photo(
                chat_id=callback.message.chat.id,
                photo=photo,
                caption=caption,
                reply_markup=qr_kb,
            )
            try:
                await callback.message.delete()
            except Exception:
                pass

            # Launch Smart Auto-Verification background task (Auto-delivers product without clicking button)
            import asyncio
            asyncio.create_task(auto_verify_order_loop(order_id, callback.message.chat.id, lang))
        except Exception as photo_err:
            logger.warning(f"send_photo with BufferedInputFile failed: {photo_err}. Trying external URL...")
            try:
                ext_url = khqr_info.get("external_qr_url") or f"https://api.qrserver.com/v1/create-qr-code/?size=350x350&data={khqr_string}"
                await callback.bot.send_photo(
                    chat_id=callback.message.chat.id,
                    photo=ext_url,
                    caption=caption,
                    reply_markup=qr_kb,
                )
                try:
                    await callback.message.delete()
                except Exception:
                    pass
                import asyncio
                asyncio.create_task(auto_verify_order_loop(order_id, callback.message.chat.id, lang))
            except Exception as url_err:
                logger.error(f"send_photo with URL also failed: {url_err}. Falling back to text.")
                try:
                    await callback.message.edit_text(text=caption, reply_markup=qr_kb)
                except Exception:
                    await callback.bot.send_message(
                        chat_id=callback.message.chat.id,
                        text=caption,
                        reply_markup=qr_kb,
                    )
                import asyncio
                asyncio.create_task(auto_verify_order_loop(order_id, callback.message.chat.id, lang))

    except Exception as e:
        logger.error(f"Error in show_buy_qr_handler: {e}", exc_info=True)
        print(f"❌ [SHOW_BUY_QR_ERROR]: {e}", flush=True)
        err_msg = (
            "⚠️ មានបញ្ហាក្នុងការបង្កើត KHQR Code សូមព្យាយាមម្តងទៀត!"
            if lang == "km"
            else f"⚠️ Error generating KHQR: {e}"
        )
        try:
            await callback.message.answer(err_msg)
        except Exception:
            pass


def make_order_success_keyboard(order_id: int, lang: str = "km") -> InlineKeyboardMarkup:
    invoice_text = "🧾 វិក្កយបត្រ (Invoice)" if lang == "km" else "🧾 View Invoice"
    shop_more_text = "🛍️ ទិញបន្ថែម" if lang == "km" else "🛍️ Shop More"
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=invoice_text,
                    callback_data=f"invoice:{order_id}",
                )
            ],
            [
                InlineKeyboardButton(
                    text="💬 Supporters : @sopha9926",
                    url="https://t.me/sopha9926",
                )
            ],
            [
                InlineKeyboardButton(
                    text=shop_more_text,
                    callback_data="cmd_products",
                ),
                InlineKeyboardButton(
                    text="🌐 Website Store",
                    url="https://sophasok.store",
                ),
            ],
        ]
    )


async def auto_verify_order_loop(order_id: int, chat_id: int, lang: str):
    """
    Smart non-blocking background verification for an active order:
    Automatically checks Bakong at 12s, 24s, and 39s while customer is scanning & paying.
    When payment is confirmed -> automatically fulfills and delivers key to customer!
    """
    import asyncio
    from app.core.database import AsyncSessionLocal
    from app.services.bakong_service import BakongService

    check_delays = [12, 12, 15]  # Interval checkpoints: 12s, 24s, 39s
    for delay in check_delays:
        await asyncio.sleep(delay)
        try:
            async with AsyncSessionLocal() as db_session:
                fulfilled, delivered_payload = await BakongService.check_and_fulfill_order_by_id(order_id, db_session)
                if fulfilled:
                    logger.info(f"Smart Auto-Verification SUCCEEDED for Order #{order_id}!")
                    msg_keys = (
                        f"🎉 <b>ទទួលបានការទូទាត់ជោគជ័យ!</b>\n\n"
                        f"✅ <b>ការបញ្ជាទិញ #{order_id} ត្រូវបានប្រគល់ជូនស្វ័យប្រវត្តិ៖</b>\n\n"
                        f"🔑 <b>កូដទំនិញ / គណនីរបស់អ្នក៖</b>\n"
                        f"<code>{delivered_payload}</code>\n\n"
                        f"<i>សូមអរគុណសម្រាប់ការទិញ!</i>"
                        if lang == "km"
                        else f"🎉 <b>Payment Confirmed Automatically!</b>\n\n"
                             f"✅ <b>Order #{order_id} Delivered:</b>\n\n"
                             f"🔑 <b>Your Account / License Key:</b>\n"
                             f"<code>{delivered_payload}</code>\n\n"
                             f"<i>Thank you for your purchase!</i>"
                    )
                    from app.bot.bot import bot
                    await bot.send_message(
                        chat_id=chat_id,
                        text=msg_keys,
                        reply_markup=make_order_success_keyboard(order_id, lang),
                    )
                    return
        except Exception as e:
            logger.debug(f"Smart auto-check for order #{order_id} checkpoint failed: {e}")
            break


_last_order_check_timestamps = {}


@router.callback_query(F.data.startswith("check_buy:"))
async def check_buy_handler(callback: CallbackQuery, session: AsyncSession, db_user: User):
    import time
    parts = callback.data.split(":")
    order_id = int(parts[1])
    lang = db_user.language_code or "km"

    # Rate-limit checks per order (5-second debounce) to save 100/day API quota
    now = time.time()
    last_check = _last_order_check_timestamps.get(order_id, 0)
    if now - last_check < 5.0:
        wait_msg = (
            "⏳ សូមរង់ចាំបន្តិច (៥ វិនាទី) មុននឹងចុចពិនិត្យម្តងទៀត!"
            if lang == "km"
            else "⏳ Please wait 5 seconds before checking again!"
        )
        await callback.answer(wait_msg)
        return
    _last_order_check_timestamps[order_id] = now

    from app.services.bakong_service import BakongService

    fulfilled, delivered_payload = await BakongService.check_and_fulfill_order_by_id(order_id, session)
    if fulfilled:
        msg_alert = (
            "🎉 ការទូទាត់ជោគជ័យ! ទំនិញត្រូវបានបញ្ជូនទៅ Telegram របស់អ្នករួចរាល់។"
            if lang == "km"
            else "🎉 Payment confirmed! Digital keys delivered below."
        )
        await callback.answer(msg_alert, show_alert=True)
        try:
            await callback.message.delete()
        except Exception:
            pass
        msg_keys = (
            f"✅ <b>ការបញ្ជាទិញ #{order_id} ទទួលបានជោគជ័យ!</b>\n\n"
            f"🔑 <b>កូដទំនិញ / គណនីរបស់អ្នក៖</b>\n"
            f"<code>{delivered_payload}</code>\n\n"
            f"<i>សូមអរគុណសម្រាប់ការទិញ!</i>"
            if lang == "km"
            else f"✅ <b>Order #{order_id} Completed Successfully!</b>\n\n"
                 f"🔑 <b>Your Account / License Key:</b>\n"
                 f"<code>{delivered_payload}</code>\n\n"
                 f"<i>Thank you for your purchase!</i>"
        )
        await callback.message.answer(
            msg_keys,
            reply_markup=make_order_success_keyboard(order_id, lang),
        )
    else:
        msg_unpaid = (
            "⏳ មិនទាន់ទទួលបានការទូទាត់ទេ។ សូមស្កេនទូទាត់តាម App ធនាគារ រួចចុចពិនិត្យម្តងទៀត!"
            if lang == "km"
            else "⏳ Payment not detected yet. Please complete the scan in your bank app and try again!"
        )
        await callback.answer(msg_unpaid, show_alert=True)


@router.callback_query(F.data.startswith("invoice:"))
async def show_order_invoice_handler(callback: CallbackQuery, session: AsyncSession, db_user: User):
    """
    Renders and sends the official formatted SP Shop invoice with the SP Shop 3D logo.
    """
    parts = callback.data.split(":")
    order_id = int(parts[1])
    lang = db_user.language_code or "km"

    stmt = (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.user),
        )
        .where(Order.id == order_id)
    )
    res = await session.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        await callback.answer("⚠️ មិនអាចស្វែងរកវិក្កយបត្របានទេ (Order not found).", show_alert=True)
        return

    # Check ownership
    if order.user_id != db_user.id and getattr(db_user, "role", "") != "admin":
        await callback.answer("⚠️ គ្មានសិទ្ធិមើលវិក្កយបត្រនេះទេ (Unauthorized).", show_alert=True)
        return

    item = order.items[0] if order.items else None
    product_title = item.product.title if item and item.product else "Digital License"
    unit_price = float(item.unit_price) if item else float(order.total_amount)
    delivered_payload = item.delivered_payload if item and item.delivered_payload else "Delivered to your account"
    quantity = len(order.items) if order.items else 1

    # Date formatting in Cambodia Time (UTC+7)
    from datetime import timezone, timedelta
    cambodia_tz = timezone(timedelta(hours=7))
    created_at = order.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    local_time = created_at.astimezone(cambodia_tz)
    date_str = local_time.strftime("%d/%m/%Y, %I:%M:%S %p")

    cust_name = db_user.first_name or db_user.username or "Customer"
    cust_id = db_user.telegram_id

    invoice_caption = (
        f"🧾 <b>វិក្កយបត្រទូទាត់ប្រាក់ / OFFICIAL INVOICE</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🏬 <b>ហាង / STORE:</b> <b>SP Shop</b> (Official Store)\n"
        f"🆔 <b>លេខវិក្កយបត្រ (Invoice No):</b> <code>#INV-{order.id:06d}</code>\n"
        f"📅 <b>កាលបរិច្ឆេទ (Date):</b> {date_str}\n"
        f"👤 <b>អតិថិជន (Customer):</b> {cust_name} (ID: <code>{cust_id}</code>)\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"📦 <b>ព័ត៌មានទំនិញ / ORDER ITEM:</b>\n"
        f"• <b>{product_title}</b>\n"
        f"  ចំនួន (Qty): {quantity}  |  តម្លៃឯកតា: ${unit_price:.2f}\n\n"
        f"💵 <b>ទឹកប្រាក់សរុប (Total Paid):</b> <b>${float(order.total_amount):.2f}</b>\n"
        f"💳 <b>ការទូទាត់ (Payment):</b> KHQR / ABA Mobile (Instant)\n"
        f"📌 <b>ស្ថានភាព (Status):</b> <b>PAID / បង់ប្រាក់ជោគជ័យ ✅</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🔑 <b>កូដទំនិញទទួលបាន / DELIVERED ITEM:</b>\n"
        f"<code>{delivered_payload}</code>\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🙏 <i>សូមអរគុណសម្រាប់ការគាំទ្រ SP Shop!</i>\n"
        f"💬 <i>សេវាកម្មអតិថិជន / Support: @sopha9926</i>"
    )

    inv_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="💬 Supporters : @sopha9926", url="https://t.me/sopha9926"),
                InlineKeyboardButton(text="🌐 Website Store", url="https://sophasok.store"),
            ],
            [
                InlineKeyboardButton(text="🔙 ត្រឡប់ក្រោយ" if lang == "km" else "🔙 Back", callback_data="cmd_products"),
            ]
        ]
    )

    await callback.answer()

    # 1. Try sending the official custom SP Shop Invoice PNG (generated from user template)
    try:
        from app.services.invoice_generator import InvoiceGenerator
        inv_img_path = InvoiceGenerator.generate_order_invoice_image(
            order_id=order.id,
            customer_name=cust_name,
            customer_id=cust_id,
            product_title=product_title,
            quantity=quantity,
            unit_price=unit_price,
            total_amount=float(order.total_amount),
            delivered_payload=delivered_payload,
            created_at=order.created_at,
        )
        if inv_img_path and inv_img_path.exists():
            await callback.message.answer_photo(
                photo=FSInputFile(str(inv_img_path)),
                reply_markup=inv_kb,
            )
            return
    except Exception as inv_err:
        logger.warning(f"Failed to generate custom invoice photo: {inv_err}")

    # 2. Fallback to SP Shop 3D logo photo
    logo_candidates = [
        Path(__file__).resolve().parent.parent.parent / "static" / "sp-shop-logo.jpg",
        Path("app/static/sp-shop-logo.jpg"),
        Path("backend/app/static/sp-shop-logo.jpg"),
        Path("/Users/sp/Desktop/TELEGRAM-BOT-STOR1/backend/app/static/sp-shop-logo.jpg"),
    ]
    logo_file = None
    for cand in logo_candidates:
        if cand.exists():
            logo_file = cand
            break

    if logo_file:
        try:
            await callback.message.answer_photo(
                photo=FSInputFile(str(logo_file)),
                caption=invoice_caption,
                reply_markup=inv_kb,
            )
            return
        except Exception as photo_err:
            logger.warning(f"Failed to send invoice photo: {photo_err}")

    await callback.message.answer(text=invoice_caption, reply_markup=inv_kb)


@router.message(Command("invoice"))
async def command_invoice_handler(message: Message, session: AsyncSession, db_user: User):
    """
    Allows user to type `/invoice [id]` or `/invoice` to view their latest or specific invoice.
    """
    lang = db_user.language_code or "km"
    args = (message.text or "").split()
    target_order_id = None
    if len(args) > 1 and args[1].isdigit():
        target_order_id = int(args[1])

    if target_order_id:
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product),
                selectinload(Order.user),
            )
            .where(Order.id == target_order_id)
        )
    else:
        # Default to latest completed order
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product),
                selectinload(Order.user),
            )
            .where(Order.user_id == db_user.id)
            .order_by(Order.id.desc())
            .limit(1)
        )

    res = await session.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        not_found_msg = (
            "⚠️ មិនទាន់មានវិក្កយបត្រនៅឡើយទេ!"
            if lang == "km"
            else "⚠️ No invoice found!"
        )
        await message.answer(not_found_msg)
        return

    # Check ownership
    if order.user_id != db_user.id and getattr(db_user, "role", "") != "admin":
        await message.answer("⚠️ គ្មានសិទ្ធិមើលវិក្កយបត្រនេះទេ (Unauthorized).")
        return

    item = order.items[0] if order.items else None
    product_title = item.product.title if item and item.product else "Digital License"
    unit_price = float(item.unit_price) if item else float(order.total_amount)
    delivered_payload = item.delivered_payload if item and item.delivered_payload else "Delivered"
    quantity = len(order.items) if order.items else 1

    from datetime import timezone, timedelta
    cambodia_tz = timezone(timedelta(hours=7))
    created_at = order.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    local_time = created_at.astimezone(cambodia_tz)
    date_str = local_time.strftime("%d/%m/%Y, %I:%M:%S %p")

    cust_name = db_user.first_name or db_user.username or "Customer"
    cust_id = db_user.telegram_id

    invoice_caption = (
        f"🧾 <b>វិក្កយបត្រទូទាត់ប្រាក់ / OFFICIAL INVOICE</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🏬 <b>ហាង / STORE:</b> <b>SP Shop</b> (Official Store)\n"
        f"🆔 <b>លេខវិក្កយបត្រ (Invoice No):</b> <code>#INV-{order.id:06d}</code>\n"
        f"📅 <b>កាលបរិច្ឆេទ (Date):</b> {date_str}\n"
        f"👤 <b>អតិថិជន (Customer):</b> {cust_name} (ID: <code>{cust_id}</code>)\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"📦 <b>ព័ត៌មានទំនិញ / ORDER ITEM:</b>\n"
        f"• <b>{product_title}</b>\n"
        f"  ចំនួន (Qty): {quantity}  |  តម្លៃឯកតា: ${unit_price:.2f}\n\n"
        f"💵 <b>ទឹកប្រាក់សរុប (Total Paid):</b> <b>${float(order.total_amount):.2f}</b>\n"
        f"💳 <b>ការទូទាត់ (Payment):</b> KHQR / ABA Mobile (Instant)\n"
        f"📌 <b>ស្ថានភាព (Status):</b> <b>PAID / បង់ប្រាក់ជោគជ័យ ✅</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🔑 <b>កូដទំនិញទទួលបាន / DELIVERED ITEM:</b>\n"
        f"<code>{delivered_payload}</code>\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🙏 <i>សូមអរគុណសម្រាប់ការគាំទ្រ SP Shop!</i>\n"
        f"💬 <i>សេវាកម្មអតិថិជន / Support: @sopha9926</i>"
    )

    inv_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="💬 Supporters : @sopha9926", url="https://t.me/sopha9926"),
                InlineKeyboardButton(text="🌐 Website Store", url="https://sophasok.store"),
            ],
            [
                InlineKeyboardButton(text="🔙 ត្រឡប់ក្រោយ" if lang == "km" else "🔙 Back", callback_data="cmd_products"),
            ]
        ]
    )

    # 1. Try sending the official custom SP Shop Invoice PNG (generated from user template)
    try:
        from app.services.invoice_generator import InvoiceGenerator
        inv_img_path = InvoiceGenerator.generate_order_invoice_image(
            order_id=order.id,
            customer_name=cust_name,
            customer_id=cust_id,
            product_title=product_title,
            quantity=quantity,
            unit_price=unit_price,
            total_amount=float(order.total_amount),
            delivered_payload=delivered_payload,
            created_at=order.created_at,
        )
        if inv_img_path and inv_img_path.exists():
            await message.answer_photo(
                photo=FSInputFile(str(inv_img_path)),
                reply_markup=inv_kb,
            )
            return
    except Exception as inv_err:
        logger.warning(f"Failed to generate custom invoice photo: {inv_err}")

    # 2. Fallback to SP Shop 3D logo photo
    logo_path = Path(__file__).resolve().parent.parent.parent / "static" / "sp-shop-logo.jpg"
    if logo_path.exists():
        try:
            await message.answer_photo(
                photo=FSInputFile(str(logo_path)),
                caption=invoice_caption,
                reply_markup=inv_kb,
            )
            return
        except Exception as e:
            logger.warning(f"Failed to send invoice photo: {e}")

    await message.answer(text=invoice_caption, reply_markup=inv_kb)

