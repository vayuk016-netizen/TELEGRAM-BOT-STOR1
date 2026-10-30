from typing import Any, Awaitable, Callable, Dict
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject
from app.core.database import AsyncSessionLocal


class DbSessionMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        import logging
        from aiogram.types import Message, CallbackQuery
        logger = logging.getLogger("uvicorn.error")
        
        try:
            async with AsyncSessionLocal() as session:
                data["session"] = session
                try:
                    result = await handler(event, data)
                    if session.is_active:
                        await session.commit()
                    return result
                except Exception as e:
                    if session.is_active:
                        await session.rollback()
                    raise e
        except Exception as e:
            logger.error(f"Database connection/operation failed in bot: {e}")
            warning_text = (
                "⚠️ <b>កំហុសប្រព័ន្ធ (System Database Error)</b>\n\n"
                "មិនអាចភ្ជាប់ទៅកាន់ប្រព័ន្ធទិន្នន័យ (Database) បានឡើយ។\n"
                "សូមប្រាកដថា PostgreSQL Server កំពុងដំណើរការ និងរត់ Migration ត្រឹមត្រូវ!"
            )
            try:
                if isinstance(event, Message):
                    await event.answer(warning_text)
                elif isinstance(event, CallbackQuery):
                    await event.answer(warning_text, show_alert=True)
            except Exception as send_err:
                logger.error(f"Could not send database warning to user: {send_err}")
            return None
