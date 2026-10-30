import asyncio
import logging
from typing import Optional
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

bot = Bot(
    token=settings.BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher(storage=MemoryStorage())

bot_task: Optional[asyncio.Task] = None


async def run_bot_polling(bot_instance: Bot, dp_instance: Dispatcher):
    """
    Auto-reconnecting long-polling loop.
    Prevents the Telegram bot task from silently terminating on temporary network hiccups or conflicts.
    """
    retry_delay = 3
    while True:
        try:
            await bot_instance.delete_webhook(drop_pending_updates=False)
            logger.info("Telegram Bot polling started successfully.")
            await dp_instance.start_polling(bot_instance, handle_signals=False)
        except asyncio.CancelledError:
            logger.info("Telegram Bot polling task stopped cleanly.")
            break
        except Exception as e:
            logger.error(f"Telegram Bot polling error: {e}. Reconnecting in {retry_delay}s...")
            await asyncio.sleep(retry_delay)


async def reload_bot(new_token: str):
    global bot_task, bot
    logger.info("Bot token reload initiated...")

    # Update settings and bot instance token
    settings.BOT_TOKEN = new_token
    
    # Safely modify the read-only token attribute in aiogram 3 Bot (using name mangling)
    try:
        if hasattr(bot, "_Bot__token"):
            bot._Bot__token = new_token
        elif hasattr(bot, "_token"):
            bot._token = new_token
        else:
            bot = Bot(
                token=new_token,
                default=DefaultBotProperties(parse_mode=ParseMode.HTML)
            )
    except Exception as e:
        logger.error(f"Error patching bot token: {e}")
        bot = Bot(
            token=new_token,
            default=DefaultBotProperties(parse_mode=ParseMode.HTML)
        )

    # If the bot was previously running in long-polling mode, stop and restart it
    if bot_task and not bot_task.done():
        logger.info("Stopping existing Bot polling task...")
        bot_task.cancel()
        try:
            await bot_task
        except asyncio.CancelledError:
            logger.info("Existing Bot polling task stopped successfully.")
        except Exception as e:
            logger.error(f"Error while stopping Bot polling task: {e}")

        logger.info("Restarting Bot polling task with new token...")
        bot_task = asyncio.create_task(run_bot_polling(bot, dp))
        logger.info("Bot polling task successfully restarted.")
    else:
        logger.info("Bot was not running in long polling mode. Token configuration updated.")



def setup_bot_handlers():
    from app.bot.middlewares.db_session import DbSessionMiddleware
    from app.bot.middlewares.auth import TelegramAuthMiddleware
    from app.bot.middlewares.rate_limit import RateLimitMiddleware

    # Register Middlewares
    dp.update.middleware(DbSessionMiddleware())
    dp.message.middleware(TelegramAuthMiddleware())
    dp.callback_query.middleware(TelegramAuthMiddleware())
    dp.message.middleware(RateLimitMiddleware())
    dp.callback_query.middleware(RateLimitMiddleware())

    # Include Handlers Routers
    from app.bot.handlers import start, products, purchase, account, topup

    dp.include_router(start.router)
    dp.include_router(products.router)
    dp.include_router(purchase.router)
    dp.include_router(account.router)
    dp.include_router(topup.router)
