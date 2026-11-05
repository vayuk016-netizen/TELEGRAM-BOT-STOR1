from aiogram import Router, F
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.user import User
from app.db.repositories.order_repository import OrderRepository
from app.bot.utils.localization import get_text

router = Router()


@router.message(F.text.in_({"👤 គណនី", "👤 Account"}))
async def user_account_handler(message: Message, db_user: User):
    lang = db_user.language_code or "km"
    name = f"{db_user.first_name} {db_user.last_name or ''}".strip()
    text = get_text(
        lang,
        "account_overview",
        telegram_id=db_user.telegram_id,
        name=name,
        username=db_user.username or "N/A",
        balance=db_user.balance,
        joined_date=db_user.created_at.strftime('%Y-%m-%d'),
    )
    account_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="💬 Supporters : @sopha9926", url="https://t.me/sopha9926"),
                InlineKeyboardButton(text="🌐 Website Store", url="https://sophasok.store"),
            ]
        ]
    )
    await message.answer(text, reply_markup=account_kb)


@router.message(F.text.in_({"📜 ប្រវត្តិទិញ", "🌀 ប្រវត្តិការទិញ", "🌀 ប្រវត្តិការបញ្ជាទិញ", "🌀 Order History"}))
async def purchase_history_handler(message: Message, session: AsyncSession, db_user: User):
    lang = db_user.language_code or "km"
    order_repo = OrderRepository(session)
    orders = await order_repo.get_user_orders(user_id=db_user.id, limit=10)

    if not orders:
        await message.answer(get_text(lang, "no_history"))
        return

    history_lines = [get_text(lang, "history_title")]
    for idx, order in enumerate(orders, 1):
        item_names = [item.product.title if item.product else "Product" for item in order.items]
        prod_str = ", ".join(item_names)
        date_str = order.created_at.strftime("%Y-%m-%d %H:%M")

        # Get key delivered string
        delivered_str = ""
        if order.items and order.items[0].delivered_payload:
            delivered_str = f"\n   🔑 K: <code>{order.items[0].delivered_payload}</code>"

        history_lines.append(
            f"<b>{idx}. #{order.id}</b> | {prod_str}\n"
            f"   💰 ${order.total_amount:.2f} | 📅 {date_str}"
            f"{delivered_str}\n"
        )

    # Attach Invoice button for the latest order & Supporters
    kb_rows = []
    if orders:
        latest = orders[0]
        inv_label = f"🧾 មើលវិក្កយបត្រ (Invoice #{latest.id})" if lang == "km" else f"🧾 View Invoice #{latest.id}"
        kb_rows.append([InlineKeyboardButton(text=inv_label, callback_data=f"invoice:{latest.id}")])

    kb_rows.append([InlineKeyboardButton(text="💬 Supporters : @sopha9926", url="https://t.me/sopha9926")])
    history_kb = InlineKeyboardMarkup(inline_keyboard=kb_rows)

    await message.answer("\n".join(history_lines), reply_markup=history_kb)


@router.message(F.text.in_({"💸 កម្មវិធីណែនាំ", "💸 Referral Program"}))
async def referral_program_handler(message: Message, db_user: User):
    lang = db_user.language_code or "km"
    bot_info = await message.bot.get_me()
    bot_username = bot_info.username or "bot"
    text = get_text(
        lang,
        "referral_info",
        bot_username=bot_username,
        telegram_id=db_user.telegram_id,
    )
    await message.answer(text)


@router.message(F.text.in_({"💳 ប្រវត្តិការទូទាត់", "💳 Payment History"}))
async def payment_history_handler(message: Message, db_user: User):
    lang = db_user.language_code or "km"
    text = get_text(lang, "payment_history_empty")
    await message.answer(text)
