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

    # Generate QR response
    from app.core.config import settings
    import os
    
    khqr_string = PaymentService.generate_khqr_payload(db_user.telegram_id, amount)
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={khqr_string}"
    
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
                InlineKeyboardButton(text="💬 Supporters : @sopha9926", url="https://t.me/sopha9926"),
            ]
        ]
    )

    await message.answer_photo(photo=photo, caption=caption, reply_markup=support_kb)


async def generate_topup_qr_response(callback: CallbackQuery, db_user: User, amount: Decimal):
    lang = db_user.language_code or "km"
    from app.core.config import settings
    import os
    
    khqr_string = PaymentService.generate_khqr_payload(db_user.telegram_id, amount)
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={khqr_string}"
    
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
                InlineKeyboardButton(text="💬 Supporters : @sopha9926", url="https://t.me/sopha9926"),
            ]
        ]
    )

    await callback.message.delete()
    await callback.message.answer_photo(photo=photo, caption=caption, reply_markup=support_kb)
