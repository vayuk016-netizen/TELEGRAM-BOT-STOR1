import html
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.filters import Command
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories.product_repository import ProductRepository
from app.bot.keyboards.inline import (
    get_categories_inline_keyboard,
    get_products_paginated_keyboard,
    get_product_detail_keyboard,
)
from app.bot.utils.localization import get_text, format_bot_price_html
from app.db.models.user import User

router = Router()


async def show_categories(message_or_query, session: AsyncSession, db_user: User):
    lang = db_user.language_code or "km"
    product_repo = ProductRepository(session)
    categories = await product_repo.get_active_categories()

    if not categories:
        text = get_text(lang, "no_categories")
        if isinstance(message_or_query, CallbackQuery):
            await message_or_query.message.edit_text(text)
        else:
            await message_or_query.answer(text)
        return

    text = get_text(lang, "select_category")
    kb = get_categories_inline_keyboard(categories)

    if isinstance(message_or_query, CallbackQuery):
        await message_or_query.message.edit_text(text, reply_markup=kb)
    else:
        await message_or_query.answer(text, reply_markup=kb)


@router.message(Command("products"))
@router.message(Command("catalog"))
@router.message(F.text.in_({"🛍️ ផលិតផល", "🛍️ Products", "ផលិតផល", "Products"}))
async def products_menu_handler(message: Message, session: AsyncSession, db_user: User):
    await show_categories(message, session, db_user)


@router.callback_query(F.data == "back_to_categories")
async def back_to_categories_handler(callback: CallbackQuery, session: AsyncSession, db_user: User):
    await show_categories(callback, session, db_user)
    await callback.answer()


@router.callback_query(F.data.startswith("cat:"))
async def category_select_handler(callback: CallbackQuery, session: AsyncSession, db_user: User):
    category_id = int(callback.data.split(":")[1])
    await show_category_products(callback, session, category_id, db_user, page=1)
    await callback.answer()


@router.callback_query(F.data.startswith("cat_page:"))
async def category_page_handler(callback: CallbackQuery, session: AsyncSession, db_user: User):
    _, category_id_str, page_str = callback.data.split(":")
    await show_category_products(callback, session, int(category_id_str), db_user, page=int(page_str))
    await callback.answer()


async def show_category_products(callback: CallbackQuery, session: AsyncSession, category_id: int, db_user: User, page: int):
    from datetime import datetime, timedelta, timezone as dt_timezone
    
    lang = db_user.language_code or "km"
    product_repo = ProductRepository(session)
    category = await product_repo.get_category_by_id(category_id)
    if not category:
        await callback.answer("⚠️ Category not found!", show_alert=True)
        return

    products = await product_repo.get_products_by_category(category_id, only_active=True)
    products_with_stock = []

    for prod in products:
        prod_tuple = await product_repo.get_product_with_stock(prod.id)
        if prod_tuple:
            products_with_stock.append(prod_tuple)

    if not products_with_stock:
        text = get_text(lang, "no_products", icon=category.icon or "📦", name=category.name)
        await callback.message.edit_text(
            text,
            reply_markup=get_products_paginated_keyboard([], category_id, page=1, total_pages=1, lang=lang),
        )
        return

    # Pagination calculation
    per_page = 15  # 15 items per page
    total_items = len(products_with_stock)
    total_pages = max(1, (total_items + per_page - 1) // per_page)
    page = max(1, min(page, total_pages))

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    current_items = products_with_stock[start_idx:end_idx]

    # Time in Cambodia (UTC+7)
    cambodia_time = datetime.now(dt_timezone.utc) + timedelta(hours=7)
    local_time = cambodia_time.strftime("%I:%M:%S %p")

    # Construct formatted product list text
    title_text = "បញ្ជីផលិតផល (PRODUCT LIST)" if lang == "km" else "PRODUCT LIST"
    balance_label = "សមតុល្យ" if lang == "km" else "Balance"
    update_label = "ធ្វើបច្ចុប្បន្នភាព" if lang == "km" else "Updated"
    terms_text = (
        "⚠️ ផលិតផលឌីជីថល - មិនអាចប្តូរ ឬសងប្រាក់វិញបានទេបន្ទាប់ពីប្រគល់ជូន។"
        if lang == "km"
        else "⚠️ Digital products - Non-refundable after delivery."
    )

    max_promo = max((getattr(p, "discount_percent", 0) for p, _ in current_items), default=0)
    promo_line = f"{get_text(lang, 'promo_sticker', percent=max_promo)}\n" if max_promo > 0 else ""

    text = (
        f"🛍️ <b>{title_text}</b>\n\n"
        f"{promo_line}"
        f"💰 <b>{balance_label}:</b> <code>${db_user.balance:.2f} USD</code>\n"
        f"🕒 <b>{update_label}:</b> <code>{local_time}</code>\n"
        f"<b>{terms_text}</b>\n"
        f"--------------------------------------------------\n"
    )

    product_lines = []
    for idx, (prod, stock) in enumerate(current_items, start=start_idx + 1):
        line = f"{idx}. {html.escape(prod.title)} — {format_bot_price_html(prod)}"
        if stock > 0:
            line += f" 🟢 {stock}"
        product_lines.append(line)

    text += "\n".join(product_lines)

    kb = get_products_paginated_keyboard(
        current_items=current_items,
        category_id=category_id,
        page=page,
        total_pages=total_pages,
        lang=lang
    )
    await callback.message.edit_text(text, reply_markup=kb)


@router.callback_query(F.data.startswith("prod:"))
async def product_detail_handler(callback: CallbackQuery, session: AsyncSession, db_user: User):
    lang = db_user.language_code or "km"
    product_id = int(callback.data.split(":")[1])
    product_repo = ProductRepository(session)

    res = await product_repo.get_product_with_stock(product_id)
    if not res:
        await callback.answer("⚠️ Product not found!", show_alert=True)
        return

    product, stock_count = res
    is_available = stock_count > 0

    if is_available:
        stock_status = get_text(lang, "stock_available", count=stock_count)
    else:
        stock_status = get_text(lang, "stock_empty")

    pct = getattr(product, "discount_percent", 0)
    if pct > 0 and product.original_price is not None:
        save_amt = float(product.original_price) - float(product.price)
        save_note = get_text(lang, "product_save_label", amount=save_amt, percent=pct)
        promo_header = f"{get_text(lang, 'promo_sticker', percent=pct)}\n\n"
        price_block = (
            f"{get_text(lang, 'product_orig_price_label')} <s>${float(product.original_price):.2f}</s>\n"
            f"{get_text(lang, 'product_promo_price_label')} <code>${float(product.price):.2f}</code> "
            f"<i>({save_note})</i>\n"
        )
    else:
        promo_header = ""
        price_block = f"{get_text(lang, 'product_price_label')} <code>${product.price:.2f}</code>\n"

    desc_safe = html.escape(product.description) if product.description else "N/A"
    detail_text = (
        f"{promo_header}"
        f"📦 <b>{html.escape(product.title)}</b>\n\n"
        f"{get_text(lang, 'product_desc_label')} {desc_safe}\n\n"
        f"{price_block}"
        f"{get_text(lang, 'product_status_label')} {stock_status}\n"
    )

    kb = get_product_detail_keyboard(product.id, product.category_id, is_available, lang=lang)
    await callback.message.edit_text(detail_text, reply_markup=kb)
    await callback.answer()
