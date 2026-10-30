from typing import List, Tuple
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from app.db.models.product import Category, Product


def get_categories_inline_keyboard(categories: List[Category]) -> InlineKeyboardMarkup:
    """Render categories as 2-column grid of inline buttons."""
    buttons = []
    for cat in categories:
        icon = cat.icon or "📦"
        button_text = f"{icon} {cat.name}"
        buttons.append(InlineKeyboardButton(text=button_text, callback_data=f"cat:{cat.id}"))

    builder: List[List[InlineKeyboardButton]] = []
    for i in range(0, len(buttons), 2):
        builder.append(buttons[i:i+2])

    return InlineKeyboardMarkup(inline_keyboard=builder)



def get_products_paginated_keyboard(
    current_items: List[Tuple[Product, int]],
    category_id: int,
    page: int,
    total_pages: int,
    lang: str = "km",
) -> InlineKeyboardMarkup:
    """
    Renders product items in a 2-column grid with custom navigation controls.
    """
    rows: List[List[InlineKeyboardButton]] = []
    
    # 1. Product grid (2 columns)
    product_buttons = []
    for prod, stock in current_items:
        btn_label = prod.title
        if stock <= 0:
            out_of_stock_text = "អស់ពីស្តុក" if lang == "km" else "Out of stock"
            btn_label += f" | {out_of_stock_text}"
            
        if len(btn_label) > 28:
            btn_label = btn_label[:25] + "..."
            
        product_buttons.append(InlineKeyboardButton(text=btn_label, callback_data=f"prod:{prod.id}"))
        
    for i in range(0, len(product_buttons), 2):
        rows.append(product_buttons[i:i+2])
        
    # 2. More products button (Next page)
    if total_pages > 1:
        next_page = page + 1 if page < total_pages else 1
        more_text = "✈️ ទំនិញផ្សេងទៀត" if lang == "km" else "✈️ More Products"
        rows.append([InlineKeyboardButton(text=more_text, callback_data=f"cat_page:{category_id}:{next_page}")])
        
    # 3. Refresh and Categories buttons
    refresh_text = "🔄 ធ្វើបច្ចុប្បន្នភាព" if lang == "km" else "🔄 Refresh"
    categories_text = "📂 ជំពូកផលិតផល" if lang == "km" else "📂 Categories"
    rows.append([
        InlineKeyboardButton(text=refresh_text, callback_data=f"cat_page:{category_id}:{page}"),
        InlineKeyboardButton(text=categories_text, callback_data="back_to_categories")
    ])
    
    # 4. Back button
    back_text = "« ត្រឡប់ក្រោយ" if lang == "km" else "« Back"
    rows.append([InlineKeyboardButton(text=back_text, callback_data="back_to_categories")])
    
    return InlineKeyboardMarkup(inline_keyboard=rows)
 
 
def get_product_detail_keyboard(product_id: int, category_id: int, is_available: bool, lang: str = "km") -> InlineKeyboardMarkup:
    from app.bot.utils.localization import get_text
    rows: List[List[InlineKeyboardButton]] = []
    if is_available:
        rows.append([InlineKeyboardButton(text=get_text(lang, "buy_now_btn"), callback_data=f"buy_confirm:{product_id}")])
    else:
        rows.append([InlineKeyboardButton(text=get_text(lang, "out_of_stock_btn"), callback_data="noop")])
 
    rows.append([InlineKeyboardButton(text=get_text(lang, "back_btn"), callback_data=f"cat:{category_id}")])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def get_buy_confirm_keyboard(
    product_id: int,
    current_qty: int = 1,
    available_stock: int = 10,
    lang: str = "km",
) -> InlineKeyboardMarkup:
    rows: List[List[InlineKeyboardButton]] = []

    # Row 1: Quantity 1 - 5
    row1 = []
    for q in range(1, 6):
        if q > available_stock:
            label = f"🔒 {q}"
            cb = f"noop_stock:{available_stock}"
        elif q == current_qty:
            label = f"🟢 {q}"
            cb = f"buy_qty:{product_id}:{q}"
        else:
            label = f"{q}"
            cb = f"buy_qty:{product_id}:{q}"
        row1.append(InlineKeyboardButton(text=label, callback_data=cb))
    rows.append(row1)

    # Row 2: Quantity 6 - 10
    row2 = []
    for q in range(6, 11):
        if q > available_stock:
            label = f"🔒 {q}"
            cb = f"noop_stock:{available_stock}"
        elif q == current_qty:
            label = f"🟢 {q}"
            cb = f"buy_qty:{product_id}:{q}"
        else:
            label = f"{q}"
            cb = f"buy_qty:{product_id}:{q}"
        row2.append(InlineKeyboardButton(text=label, callback_data=cb))
    rows.append(row2)

    # Row 3: Confirm & Cancel buttons
    if current_qty > 1:
        confirm_text = f"✅ បញ្ជាក់ការទិញ x{current_qty} (Confirm)" if lang == "km" else f"✅ Confirm x{current_qty}"
    else:
        confirm_text = "✅ បញ្ជាក់ការទិញ (Confirm)" if lang == "km" else "✅ Confirm Purchase"
    cancel_text = "❌ បោះបង់ (Cancel)" if lang == "km" else "❌ Cancel"

    rows.append([
        InlineKeyboardButton(text=confirm_text, callback_data=f"buy_execute:{product_id}:{current_qty}"),
        InlineKeyboardButton(text=cancel_text, callback_data="cancel_buy"),
    ])

    return InlineKeyboardMarkup(inline_keyboard=rows)


def get_topup_preset_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="💵 $1.00", callback_data="topup_amt:1"),
                InlineKeyboardButton(text="💵 $5.00", callback_data="topup_amt:5"),
                InlineKeyboardButton(text="💵 $10.00", callback_data="topup_amt:10"),
            ],
            [
                InlineKeyboardButton(text="💵 $20.00", callback_data="topup_amt:20"),
                InlineKeyboardButton(text="💵 $50.00", callback_data="topup_amt:50"),
                InlineKeyboardButton(text="✏️ បញ្ចូលចំនួនផ្សេងៗ", callback_data="topup_custom"),
            ],
            [InlineKeyboardButton(text="❌ បោះបង់", callback_data="cancel_topup")],
        ]
    )


def get_insufficient_balance_keyboard(product_id: int, price: float, telegram_id: int, lang: str = "km") -> InlineKeyboardMarkup:
    show_qr_btn_text = "🇰🇭 Show Bakong KHQR" if lang == "en" else "🇰🇭 បង្ហាញ Bakong KHQR"
    back_btn_text = "🔙 Back" if lang == "en" else "🔙 ត្រឡប់ក្រោយ"
    
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=show_qr_btn_text, callback_data=f"show_buy_qr:{product_id}:{price}"),
            ],
            [
                InlineKeyboardButton(text="💬 Supporters : @sopha9926", url="https://t.me/sopha9926"),
            ],
            [
                InlineKeyboardButton(text=back_btn_text, callback_data=f"prod:{product_id}"),
            ]
        ]
    )

