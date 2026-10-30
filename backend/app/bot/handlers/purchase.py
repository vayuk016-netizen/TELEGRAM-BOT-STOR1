from aiogram import Router, F
from aiogram.types import CallbackQuery
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.user import User
from app.db.repositories.product_repository import ProductRepository
from app.services.purchase_service import PurchaseService
from app.bot.keyboards.inline import get_buy_confirm_keyboard
from app.core.exceptions import (
    OutOfStockException,
    InsufficientBalanceException,
    ProductNotFoundException,
)
from app.bot.utils.localization import get_text

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

        await callback.message.edit_text(delivery_text)
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
async def show_buy_qr_handler(callback: CallbackQuery, db_user: User):
    from decimal import Decimal
    import os
    lang = db_user.language_code or "km"
    parts = callback.data.split(":")
    product_id = int(parts[1])
    price = Decimal(parts[2])
    
    from app.services.payment_service import PaymentService
    khqr_string = PaymentService.generate_khqr_payload(db_user.telegram_id, price)
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={khqr_string}"
    
    from app.core.config import settings
    photo = qr_url
    if settings.ABA_QR_LINK:
        if settings.ABA_QR_LINK.startswith("/static/"):
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            local_path = os.path.join(base_dir, "app", settings.ABA_QR_LINK.lstrip("/"))
            if os.path.exists(local_path):
                from aiogram.types import FSInputFile
                photo = FSInputFile(local_path)
        else:
            photo = settings.ABA_QR_LINK

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
                InlineKeyboardButton(text="💬 Supporters : @sopha9926", url="https://t.me/sopha9926"),
            ],
            [
                InlineKeyboardButton(text="🔙 Back" if lang == "en" else "🔙 ត្រឡប់ក្រោយ", callback_data=f"prod:{product_id}"),
            ]
        ]
    )

    await callback.message.delete()
    await callback.message.answer_photo(photo=photo, caption=caption, reply_markup=qr_kb)
    await callback.answer()

