from decimal import Decimal
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from app.db.models.user import User
from app.bot.keyboards.inline import get_topup_preset_keyboard
from app.bot.states.topup_states import TopUpStatesGroup
from app.services.payment_service import PaymentService
from app.bot.utils.localization import get_text

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
async def topup_preset_selected(callback: CallbackQuery, db_user: User):
    amount_str = callback.data.split(":")[1]
    amount = Decimal(amount_str)
    await generate_topup_qr_response(callback, db_user, amount)
    await callback.answer()


@router.callback_query(F.data == "topup_custom")
async def topup_custom_prompt(callback: CallbackQuery, state: FSMContext, db_user: User):
    lang = db_user.language_code or "km"
    await state.set_state(TopUpStatesGroup.waiting_for_amount)
    await callback.message.edit_text(get_text(lang, "custom_topup_prompt"))
    await callback.answer()


@router.message(TopUpStatesGroup.waiting_for_amount)
async def process_custom_topup_amount(message: Message, state: FSMContext, db_user: User):
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
    from app.core.database import async_session_factory
    from app.db.models.transaction import Transaction

    khqr_info = BakongService.generate_khqr(
        amount=amount,
        bill_number=f"TOP_{db_user.telegram_id}_{int(time.time())}",
        currency="USD",
    )
    khqr_string = khqr_info["khqr_string"]
    md5 = khqr_info["md5"]
    qr_url = khqr_info["qr_url"]

    # Record pending transaction in DB
    async with async_session_factory() as session:
        tx = Transaction(
            user_id=db_user.id,
            amount=amount,
            payment_method="KHQR",
            khqr_md5=md5,
            status="PENDING",
            description=f"Telegram KHQR Top-up (${amount:.2f})",
        )
        session.add(tx)
        await session.commit()

    photo = qr_url
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


async def generate_topup_qr_response(callback: CallbackQuery, db_user: User, amount: Decimal):
    lang = db_user.language_code or "km"
    import time
    from app.core.config import settings
    from app.services.bakong_service import BakongService
    from app.core.database import async_session_factory
    from app.db.models.transaction import Transaction

    khqr_info = BakongService.generate_khqr(
        amount=amount,
        bill_number=f"TOP_{db_user.telegram_id}_{int(time.time())}",
        currency="USD",
    )
    khqr_string = khqr_info["khqr_string"]
    md5 = khqr_info["md5"]
    qr_url = khqr_info["qr_url"]

    # Record pending transaction in DB
    async with async_session_factory() as session:
        tx = Transaction(
            user_id=db_user.id,
            amount=amount,
            payment_method="KHQR",
            khqr_md5=md5,
            status="PENDING",
            description=f"Telegram KHQR Top-up (${amount:.2f})",
        )
        session.add(tx)
        await session.commit()

    photo = qr_url
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

    await callback.message.delete()
    await callback.message.answer_photo(photo=photo, caption=caption, reply_markup=support_kb)


@router.callback_query(F.data.startswith("check_topup:"))
async def check_topup_handler(callback: CallbackQuery, db_user: User):
    parts = callback.data.split(":")
    md5 = parts[1]
    lang = db_user.language_code or "km"

    from app.core.database import async_session_factory
    from app.services.bakong_service import BakongService

    async with async_session_factory() as session:
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
