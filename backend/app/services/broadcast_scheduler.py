import asyncio
import logging
import os
import re
import traceback
from datetime import datetime, timezone
from typing import Optional, Union, Tuple
from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.db.models.broadcast_schedule import BroadcastSchedule
from app.db.models.user import User
from app.bot.bot import bot
from aiogram.types import FSInputFile, BufferedInputFile, URLInputFile, LinkPreviewOptions

logger = logging.getLogger("uvicorn.error")


def get_input_file(file_path: str):
    """Creates a Telegram InputFile using FSInputFile, with fallback to BufferedInputFile."""
    try:
        return FSInputFile(file_path)
    except Exception:
        with open(file_path, "rb") as f:
            return BufferedInputFile(f.read(), filename=os.path.basename(file_path))


def smart_prepare_caption(title: Optional[str], message_text: Optional[str], max_caption_len: int = 1024) -> Tuple[str, bool]:
    """
    Prepares a clean caption that fits in ONE Telegram message bubble (max 1024 chars).
    Returns (prepared_caption, fits_in_one_bubble).
    """
    text = (message_text or "").strip()
    title = (title or "").strip()

    # Avoid duplicating title if text already begins with title
    has_title = False
    if title:
        first_line = text.split("\n")[0].strip().lower()
        clean_title = re.sub(r'[^a-zA-Z0-9\u1780-\u17ff]', '', title.lower())
        clean_first = re.sub(r'[^a-zA-Z0-9\u1780-\u17ff]', '', first_line)
        if clean_title and clean_title in clean_first:
            has_title = True

    if title and not has_title:
        combined = f"<b>{title}</b>\n\n{text}"
    else:
        combined = text

    if len(combined) <= max_caption_len:
        return combined, True

    # Attempt 1: Compress excessive 3+ newlines to 2
    c1 = re.sub(r'\n{3,}', '\n\n', combined)
    if len(c1) <= max_caption_len:
        return c1, True

    # Attempt 2: Tighten spacing between emoji / bullet list items
    c2 = re.sub(r'\n\n(?=[✅\-\*•▶️🔥✨⏳💸💬📩🤖🪩📲🌟\d+\.])', '\n', c1)
    if len(c2) <= max_caption_len:
        return c2, True

    # Attempt 3: Collapse all remaining \n\n into \n
    c3 = re.sub(r'\n{2,}', '\n', c2)
    if len(c3) <= max_caption_len:
        return c3, True

    # Attempt 4: If slightly over by <= 30 chars, trim trailing whitespace
    if len(c3) <= max_caption_len + 30:
        c4 = c3[:max_caption_len].rstrip()
        return c4, True

    return combined, False


async def send_broadcast_message_to_target(
    chat_id: Union[int, str],
    formatted_text: str,
    image_path: Optional[str],
    local_path: Optional[str],
    is_remote_url: bool,
    single_bubble_caption: Optional[str] = None,
):
    """
    Sends broadcast message to a single target (user, group, or channel).
    Guarantees that photo + text fit into ONE single bubble whenever possible:
    1. If media + caption <= 1024 characters: sends as native photo/video with embedded caption (1 BUBBLE).
    2. If media + text > 1024 characters and remote URL: sends as single message with LinkPreviewOptions (1 BUBBLE).
    3. Fallback: only if single-bubble is impossible, sends media + separate text.
    """
    if image_path:
        is_video = False
        if is_remote_url:
            url_path = image_path.lower()
            is_video = any(ext in url_path for ext in [".mp4", ".mov", ".avi", ".webm", ".mkv", "/video/"])
            input_file = URLInputFile(image_path)
        elif local_path and os.path.exists(local_path):
            is_video = any(local_path.lower().endswith(ext) for ext in [".mp4", ".mov", ".avi", ".webm", ".mkv", ".3gp"])
            input_file = get_input_file(local_path)
        else:
            input_file = None

        if input_file:
            caption_text = single_bubble_caption or formatted_text
            
            # Case 1: Caption fits in Telegram's 1024 limit -> Send as ONE native bubble!
            if len(caption_text) <= 1024:
                try:
                    if is_video:
                        await bot.send_video(chat_id=chat_id, video=input_file, caption=caption_text, parse_mode="HTML")
                    else:
                        await bot.send_photo(chat_id=chat_id, photo=input_file, caption=caption_text, parse_mode="HTML")
                    return
                except Exception as caption_html_err:
                    logger.warning(f"HTML caption parse failed for {chat_id}: {caption_html_err}. Retrying with plain text caption...")
                    # Retry without HTML parsing to maintain 1 single bubble!
                    try:
                        if is_remote_url:
                            input_file_retry = URLInputFile(image_path)
                        else:
                            input_file_retry = get_input_file(local_path)

                        if is_video:
                            await bot.send_video(chat_id=chat_id, video=input_file_retry, caption=caption_text, parse_mode=None)
                        else:
                            await bot.send_photo(chat_id=chat_id, photo=input_file_retry, caption=caption_text, parse_mode=None)
                        return
                    except Exception as caption_retry_err:
                        logger.warning(f"Plain text caption retry also failed for {chat_id}: {caption_retry_err}")

            # Case 2: Caption > 1024 characters, but remote image URL -> Use Telegram LinkPreviewOptions for ONE bubble!
            if is_remote_url and formatted_text.strip():
                try:
                    await bot.send_message(
                        chat_id=chat_id,
                        text=formatted_text,
                        parse_mode="HTML",
                        link_preview_options=LinkPreviewOptions(
                            url=image_path,
                            prefer_large_media=True,
                            show_above_text=True,
                        ),
                    )
                    return
                except Exception as preview_err:
                    logger.warning(f"LinkPreviewOptions single bubble failed for {chat_id}: {preview_err}")

            # Case 3: Ultimate Fallback -> Media + separate text message
            if is_remote_url:
                fallback_file = URLInputFile(image_path)
            else:
                fallback_file = get_input_file(local_path)

            if is_video:
                await bot.send_video(chat_id=chat_id, video=fallback_file)
            else:
                await bot.send_photo(chat_id=chat_id, photo=fallback_file)

            if formatted_text.strip():
                try:
                    await bot.send_message(chat_id=chat_id, text=formatted_text, parse_mode="HTML")
                except Exception:
                    await bot.send_message(chat_id=chat_id, text=formatted_text, parse_mode=None)
            return

    # Text-only message (Telegram allows up to 4096 characters for text messages)
    try:
        await bot.send_message(chat_id=chat_id, text=formatted_text, parse_mode="HTML")
    except Exception as parse_err:
        logger.warning(f"HTML parse failed for text message to {chat_id}, falling back to plain text: {parse_err}")
        await bot.send_message(chat_id=chat_id, text=formatted_text, parse_mode=None)


async def run_broadcast_worker(schedule_id: int):
    """Executes a single broadcast in the background."""
    async with AsyncSessionLocal() as db:
        # Fetch the schedule
        stmt = select(BroadcastSchedule).where(BroadcastSchedule.id == schedule_id)
        res = await db.execute(stmt)
        schedule = res.scalar_one_or_none()
        if not schedule or schedule.status not in ["pending", "sending"]:
            return

        # Mark as sending
        schedule.status = "sending"
        await db.commit()

        target_type = schedule.target_type or "users"
        target_ids = []

        if target_type in ["users", "both"]:
            # Fetch all active users
            stmt_users = select(User.telegram_id).where(User.is_blocked.is_(False))
            res_users = await db.execute(stmt_users)
            user_ids = res_users.scalars().all()
            target_ids.extend(user_ids)

        if target_type in ["group", "both"] and schedule.group_chat_id:
            raw_group_id = schedule.group_chat_id.strip()
            for g in raw_group_id.split(","):
                g = g.strip()
                if not g:
                    continue
                if (g.startswith("-") and g[1:].isdigit()) or g.isdigit():
                    target_ids.append(int(g))
                else:
                    target_ids.append(g)

        # Remove duplicates while preserving order
        seen = set()
        unique_targets = []
        for tid in target_ids:
            if tid not in seen:
                seen.add(tid)
                unique_targets.append(tid)

        schedule.total_targets = len(unique_targets)
        await db.commit()

    success_count = 0
    fail_count = 0

    # Prepare title + message content
    formatted_text = schedule.message_text or ""
    if schedule.title and schedule.title.strip():
        formatted_text = f"<b>{schedule.title.strip()}</b>\n\n{formatted_text}"

    # Generate smart caption that fits in 1 single Telegram bubble (photo + text together)
    single_bubble_caption, fits_one_bubble = smart_prepare_caption(schedule.title, schedule.message_text)

    # Resolve local or remote media path if provided
    local_path = None
    is_remote_url = False
    if schedule.image_path:
        if schedule.image_path.startswith("http://") or schedule.image_path.startswith("https://"):
            is_remote_url = True
        else:
            app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            rel_path = os.path.normpath(schedule.image_path.lstrip("/\\"))
            
            target_path = os.path.join(app_dir, rel_path)
            alt_path1 = os.path.join(app_dir, "api", rel_path)
            alt_path2 = os.path.join(app_dir, "app", rel_path)

            if os.path.exists(target_path):
                local_path = target_path
            elif os.path.exists(alt_path1):
                local_path = alt_path1
            elif os.path.exists(alt_path2):
                local_path = alt_path2
            else:
                local_path = target_path

    # Process each target (user, group, channel)
    for target in unique_targets:
        try:
            await send_broadcast_message_to_target(
                chat_id=target,
                formatted_text=formatted_text,
                image_path=schedule.image_path,
                local_path=local_path,
                is_remote_url=is_remote_url,
                single_bubble_caption=single_bubble_caption,
            )
            success_count += 1
        except Exception as e:
            logger.error(f"Failed to send broadcast to target {target}: {e}")
            traceback.print_exc()
            fail_count += 1

        # Delay between sends to avoid Telegram spam rate limits
        if schedule.interval_delay > 0:
            await asyncio.sleep(schedule.interval_delay)

    # Mark as completed
    async with AsyncSessionLocal() as db:
        stmt = select(BroadcastSchedule).where(BroadcastSchedule.id == schedule_id)
        res = await db.execute(stmt)
        schedule = res.scalar_one_or_none()
        if schedule:
            schedule.status = "completed"
            schedule.sent_successfully = success_count
            schedule.failed_or_blocked = fail_count
            schedule.sent_at = datetime.now(timezone.utc)
            await db.commit()
            logger.info(f"Broadcast schedule {schedule_id} completed: {success_count} success, {fail_count} failed.")


async def start_scheduler():
    """Polls database for pending scheduled broadcasts and runs them."""
    logger.info("Broadcast scheduler service started.")

    # Reset any 'sending' status back to 'pending' on startup
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(
                update(BroadcastSchedule)
                .where(BroadcastSchedule.status == "sending")
                .values(status="pending")
            )
            await db.commit()
    except Exception as e:
        logger.error(f"Failed to reset stuck broadcast schedules: {e}")

    while True:
        try:
            now = datetime.now(timezone.utc)
            async with AsyncSessionLocal() as db:
                stmt = select(BroadcastSchedule).where(
                    (BroadcastSchedule.status == "pending") &
                    (BroadcastSchedule.scheduled_at <= now)
                )
                res = await db.execute(stmt)
                pending_schedules = res.scalars().all()

                for schedule in pending_schedules:
                    # Run each schedule task in the background
                    asyncio.create_task(run_broadcast_worker(schedule.id))

        except Exception as e:
            logger.error(f"Error in broadcast scheduler loop: {e}")

        await asyncio.sleep(15)  # Poll every 15 seconds


async def stop_scheduler(task: asyncio.Task):
    """Stops the scheduler loop."""
    logger.info("Stopping broadcast scheduler...")
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        logger.info("Broadcast scheduler stopped successfully.")
