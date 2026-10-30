from aiogram import Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.user import User
from app.bot.keyboards.reply import get_main_reply_keyboard
from app.bot.utils.localization import get_text

router = Router()


def get_language_inline_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🇰🇭 ភាសាខ្មែរ (Khmer)", callback_data="set_lang:km"),
                InlineKeyboardButton(text="🇬🇧 English", callback_data="set_lang:en"),
            ]
        ]
    )


@router.message(CommandStart())
async def start_handler(message: Message, db_user: User):
    lang = db_user.language_code or "km"
    welcome_text = get_text(
        lang,
        "welcome",
        name=message.from_user.first_name,
        balance=db_user.balance,
        telegram_id=db_user.telegram_id,
    )
    await message.answer(welcome_text, reply_markup=get_main_reply_keyboard(lang))


@router.message(Command("help"))
@router.message(F.text.in_({"❓ ជំនួយ", "❓ Help"}))
async def help_handler(message: Message, db_user: User):
    lang = db_user.language_code or "km"
    help_text = get_text(lang, "help")
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="💬 Supporters : @sopha9926", url="https://t.me/sopha9926"),
            ]
        ]
    )
    await message.answer(help_text, reply_markup=kb)


@router.message(F.text.in_({"🌐 ភាសា", "🌐 Language"}))
async def language_handler(message: Message, db_user: User):
    lang = db_user.language_code or "km"
    text = get_text(lang, "lang_select")
    await message.answer(text, reply_markup=get_language_inline_keyboard())


@router.callback_query(F.data.startswith("set_lang:"))
async def set_language_callback(callback: CallbackQuery, session: AsyncSession, db_user: User):
    lang = callback.data.split(":")[1]
    
    # Update language code in db
    db_user.language_code = lang
    await session.commit()
    
    confirm_text = get_text(lang, "lang_updated")
    
    await callback.message.delete()
    await callback.message.answer(confirm_text, reply_markup=get_main_reply_keyboard(lang))
    await callback.answer()
