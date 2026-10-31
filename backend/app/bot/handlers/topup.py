import logging
from decimal import Decimal
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.user import User
from app.bot.keyboards.inline import get_topup_preset_keyboard
from app.bot.states.topup_states import TopUpStatesGroup
from app.services.payment_service import PaymentService
from app.bot.utils.localization import get_text

logger = logging.getLogger(__name__)
router = Router()


@router.message(F.text.in_({"💰 បញ្ចូលថវិកា", "💰 បញ្ចូលទឹកប្រាក់", "💰 Top Up"}))
async def topup_menu_handler(message: Message, db_user: User):
    lang = db_user.language_code or "km"
    text = get_text(lang, "topup_menu")
    await message.answer(text, reply_markup=get_topup_preset_keyboard())


@router.callback_query(F.data == "cancel_topup")
async def cancel_topup_handler(callback: CallbackQuery, state: FSMContext, db_user: User):
    lang = db_user.language_code or "km"
    await state.clear()
    await callback.message.edit_text(get_text(lang, "cancel_topup"))
    await callback.answer()


@router.callback_query(F.data.startswith("topup_amt:"))
async def topup_preset_selected(callback: CallbackQuery, session: AsyncSession, db_user: User):
    amount_str = callback.data.split(":")[1]
    amount = Decimal(amount_str)
    await generate_topup_qr_response(callback, session, db_user, amount)
    await callback.answer()


@router.callback_query(F.data == "topup_custom")
async def topup_custom_prompt(callback: CallbackQuery, state: FSMContext, db_user: User):
    lang = db_user.language_code or "km"
    await state.set_state(TopUpStatesGroup.waiting_for_amount)
    await callback.message.edit_text(get_text(lang, "custom_topup_prompt"))
    await callback.answer()


@router.message(TopUpStatesGroup.waiting_for_amount)
async def process_custom_topup_amount(message: Message, state: FSMContext, session: AsyncSession, db_user: User):
    lang = db_user.language_code or "km"
    try:
        amount = Decimal(message.text.strip())
        if amount <= 0:
            raise ValueError()
    except Exception:
        await message.answer(get_text(lang, "invalid_amount"))
        return

    await state.clear()

    # Generate real Bakong KHQR
    import time
    from app.core.config import settings
    from app.services.bakong_service import BakongService
    from app.db.models.transaction import Transaction

    khqr_info = BakongService.generate_khqr(
        amount=amount,
        bill_number=f"TOP_{db_user.telegram_id}_{int(time.time())}",
        currency="USD",
    )
    khqr_string = khqr_info["khqr_string"]
    md5 = khqr_info["md5"]
    qr_url = khqr_info["qr_url"]
    png_bytes = khqr_info.get("qr_png_bytes")

    # Record pending transaction in DB
    tx = Transaction(
        user_id=db_user.id,
        amount=amount,
        payment_method="KHQR",
        khqr_md5=md5,
        status="PENDING",
        description=f"Telegram KHQR Top-up (${amount:.2f})",
    )
    session.add(tx)
    await session.flush()

    if png_bytes:
        from aiogram.types import BufferedInputFile
        photo = BufferedInputFile(png_bytes, filename=f"topup_{md5[:8]}.png")
    else:
        photo = khqr_info.get("external_qr_url") or qr_url
    caption = get_text(
        lang,
        "topup_qr_caption",
        telegram_id=db_user.telegram_id,
        amount=amount,
        aba_name=settings.ABA_ACCOUNT_NAME,
        aba_number=settings.ABA_ACCOUNT_NUMBER,
    )

    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
    support_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🔄 ពិនិត្យការទូទាត់ (Check Payment)" if lang == "km" else "🔄 Check Payment",
                    callback_data=f"check_topup:{md5}",
                ),
            ],
            [
                InlineKeyboardButton(text="💬 Supporters : @sopha9926", url="https://t.me/sopha9926"),
            ]
        ]
    )

    await message.answer_photo(photo=photo, caption=caption, reply_markup=support_kb)


async def generate_topup_qr_response(callback: CallbackQuery, session: AsyncSession, db_user: User, amount: Decimal):
    lang = db_user.language_code or "km"

    # Instant loading feedback
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

    import time
    from app.core.config import settings
    from app.services.bakong_service import BakongService
    from app.db.models.transaction import Transaction

    khqr_info = BakongService.generate_khqr(
        amount=amount,
        bill_number=f"TOP_{db_user.telegram_id}_{int(time.time())}",
        currency="USD",
    )
    khqr_string = khqr_info["khqr_string"]
    md5 = khqr_info["md5"]
    qr_url = khqr_info["qr_url"]
    png_bytes = khqr_info.get("qr_png_bytes")

    # Record pending transaction in DB
    tx = Transaction(
        user_id=db_user.id,
        amount=amount,
        payment_method="KHQR",
        khqr_md5=md5,
        status="PENDING",
        description=f"Telegram KHQR Top-up (${amount:.2f})",
    )
    session.add(tx)
    await session.flush()

    if png_bytes:
        from aiogram.types import BufferedInputFile
        photo = BufferedInputFile(png_bytes, filename=f"topup_{md5[:8]}.png")
    else:
        photo = khqr_info.get("external_qr_url") or qr_url
    caption = get_text(
        lang,
        "topup_qr_caption",
        telegram_id=db_user.telegram_id,
        amount=amount,
        aba_name=settings.ABA_ACCOUNT_NAME,
        aba_number=settings.ABA_ACCOUNT_NUMBER,
    )

    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
    support_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🔄 ពិនិត្យការទូទាត់ (Check Payment)" if lang == "km" else "🔄 Check Payment",
                    callback_data=f"check_topup:{md5}",
                ),
            ],
            [
                InlineKeyboardButton(text="💬 Supporters : @sopha9926", url="https://t.me/sopha9926"),
            ]
        ]
    )

    try:
        await callback.bot.send_photo(
            chat_id=callback.message.chat.id,
            photo=photo,
            caption=caption,
            reply_markup=support_kb,
        )
        try:
            await callback.message.delete()
        except Exception:
            pass

        import asyncio
        asyncio.create_task(auto_verify_topup_loop(md5, callback.message.chat.id, amount, lang))
    except Exception as e:
        logger.warning(f"topup send_photo failed: {e}. Falling back to text.")
        try:
            await callback.message.edit_text(text=caption, reply_markup=support_kb)
        except Exception:
            await callback.bot.send_message(
                chat_id=callback.message.chat.id,
                text=caption,
                reply_markup=support_kb,
            )
        import asyncio
        asyncio.create_task(auto_verify_topup_loop(md5, callback.message.chat.id, amount, lang))


async def auto_verify_topup_loop(md5: str, chat_id: int, amount: Decimal, lang: str):
    """
    Smart non-blocking background verification for an active top-up:
    Checks Bakong at 12s, 24s, and 39s automatically while user is scanning & paying.
    When payment is confirmed -> automatically credits balance and notifies user!
    """
    import asyncio
    from app.core.database import AsyncSessionLocal
    from app.services.bakong_service import BakongService

    check_delays = [12, 12, 15]  # Interval checkpoints: 12s, 24s, 39s
    for delay in check_delays:
        await asyncio.sleep(delay)
        try:
            async with AsyncSessionLocal() as db_session:
                success, new_balance = await BakongService.check_and_credit_topup_by_md5(md5, db_session)
                if success:
                    logger.info(f"Smart Auto-Verification SUCCEEDED for Top-up MD5 {md5}!")
                    msg_topup = (
                        f"🎉 <b>ទទួលបានការបញ្ចូលថវិកាជោគជ័យ!</b>\n\n"
                        f"💵 <b>ចំនួនទឹកប្រាក់:</b> ${amount:.2f}\n"
                        f"💳 <b>តុល្យភាពគណនីបច្ចុប្បន្ន:</b> ${new_balance:.2f}\n\n"
                        f"<i>សូមអរគុណសម្រាប់ការប្រើប្រាស់សេវាកម្ម!</i>"
                        if lang == "km"
                        else f"🎉 <b>Top-up Confirmed Automatically!</b>\n\n"
                             f"💵 <b>Amount Added:</b> ${amount:.2f}\n"
                             f"💳 <b>Current Balance:</b> ${new_balance:.2f}\n\n"
                             f"<i>Thank you for using our service!</i>"
                    )
                    from app.bot.bot import bot
                    await bot.send_message(chat_id=chat_id, text=msg_topup)
                    return
        except Exception as e:
            logger.debug(f"Smart auto-check for top-up MD5 {md5} checkpoint failed: {e}")
            break


_last_topup_check_timestamps = {}


@router.callback_query(F.data.startswith("check_topup:"))
async def check_topup_handler(callback: CallbackQuery, session: AsyncSession, db_user: User):
    import time
    parts = callback.data.split(":")
    md5 = parts[1]
    lang = db_user.language_code or "km"

    # Rate-limit checks per transaction (5-second debounce) to save 100/day API quota
    now = time.time()
    last_check = _last_topup_check_timestamps.get(md5, 0)
    if now - last_check < 5.0:
        wait_msg = (
            "⏳ សូមរង់ចាំបន្តិច (៥ វិនាទី) មុននឹងចុចពិនិត្យម្តងទៀត!"
            if lang == "km"
            else "⏳ Please wait 5 seconds before checking again!"
        )
        await callback.answer(wait_msg)
        return
    _last_topup_check_timestamps[md5] = now

    from app.services.bakong_service import BakongService

    success, new_balance = await BakongService.check_and_credit_topup_by_md5(md5, session)
    if success:
        msg_alert = (
            f"🎉 ការទូទាត់ជោគជ័យ! បានបញ្ចូលទឹកប្រាក់។ តុល្យភាពថ្មី: ${new_balance:.2f}"
            if lang == "km"
            else f"🎉 Payment Confirmed! Balance topped up. New balance: ${new_balance:.2f}"
        )
        await callback.answer(msg_alert, show_alert=True)
        try:
            await callback.message.delete()
        except Exception:
            pass
        await callback.message.answer(
            f"✅ <b>បញ្ចូលទឹកប្រាក់បានជោគជ័យ!</b>\n\n💵 <b>តុល្យភាពបច្ចុប្បន្ន:</b> ${new_balance:.2f}"
            if lang == "km"
            else f"✅ <b>Top-up Successful!</b>\n\n💵 <b>Current Balance:</b> ${new_balance:.2f}"
        )
    else:
        msg_unpaid = (
            "⏳ មិនទាន់ទទួលបានការទូទាត់ទេ។ សូមស្កេនទូទាត់តាម App ធនាគារ រួចចុចពិនិត្យម្តងទៀត!"
            if lang == "km"
            else "⏳ Payment not detected yet. Please complete the scan in your bank app and try again!"
        )
        await callback.answer(msg_unpaid, show_alert=True)
