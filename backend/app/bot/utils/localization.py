# -*- coding: utf-8 -*-

TRANSLATIONS = {
    "km": {
        "welcome": (
            "👋 សួស្ដី <b>{name}</b>!\n\n"
            "សូមស្វាគមន៍មកកាន់ <b>Store Manager Digital Bot</b> 🛍\n"
            "ហាងលក់អាខោន និង License Keys ឌីជីថលស្វ័យប្រវត្តិ 24/7!\n\n"
            "💵 តុល្យភាពបច្ចុប្បន្ន: <b>${balance:.2f}</b>\n"
            "🆔 Telegram ID: <code>{telegram_id}</code>\n\n"
            "សូមជ្រើសរើសម៉ឺនុយខាងក្រោមដើម្បីចាប់ផ្តើម៖"
        ),
        "help": (
            "<b>❓ មជ្ឈមណ្ឌលជំនួយ (Support & Help)</b>\n\n"
            "• <b>🛍️ ផលិតផល:</b> មើលបញ្ជីអាខោន/License Keys ដែលមានលក់\n"
            "• <b>💰 បញ្ចូលទឹកប្រាក់:</b> បញ្ចូលទឹកប្រាក់តាមរយៈ KHQR ស្វ័យប្រវត្តិ\n"
            "• <b>Referral Program:</b> ណែនាំមិត្តភក្ដិដើម្បីទទួលបានប្រាក់បន្ថែម\n"
            "• <b>ប្រវត្តិបញ្ជាទិញ:</b> ពិនិត្យមើលកូដ/អាខោនដែលបានទិញរួច\n\n"
            "📞 ទំនាក់ទំនងផ្នែកសេវាអតិថិជន: @sopha9926"
        ),
        "lang_select": "<b>🌐 សូមជ្រើសរើសភាសារបស់អ្នក (Please choose your language)៖</b>",
        "lang_updated": "🌐 ភាសារបស់អ្នកត្រូវបានផ្លាស់ប្តូរទៅជា <b>ភាសាខ្មែរ 🇰🇭</b> រួចរាល់ហើយ!",
        "no_categories": "⚠️ បច្ចុប្បន្នមិនទាន់មានជំពូកផលិតផលនៅឡើយទេ។",
        "select_category": "<b>🛍️ សូមជ្រើសរើសជំពូកផលិតផល៖</b>",
        "no_products": "<b>{icon} {name}</b>\n\n⚠️ មិនទាន់មានផលិតផលនៅក្នុងជំពូកនេះទេ!",
        "select_product_prompt": "ជ្រើសរើសផលិតផលខាងក្រោមដើម្បីទិញ៖",
        "click_product_desc": "💡 ចុចលើឈ្មោះផលិតផលដើម្បីមើលព័ត៌មានលម្អិត",
        "back_to_categories_btn": "🔙 ត្រឡប់ទៅជំពូក",
        "buy_now_btn": "🛒 ទិញឥឡូវនេះ (Buy Now)",
        "out_of_stock_btn": "❌ អស់ស្តុក (Out of Stock)",
        "back_btn": "🔙 ត្រឡប់ក្រោយ",
        "buy_confirm_title": "<b>⚠️ បញ្ជាក់ការបញ្ជាទិញ (Order Confirmation)</b>",
        "confirm_btn": "✅ បញ្ជាក់ការទិញ (Confirm)",
        "cancel_btn": "❌ បោះបង់ (Cancel)",
        "order_cancelled": "❌ ការបញ្ជាទិញត្រូវបានបោះបង់!",
        "order_success": (
            "🎉 <b>ការទិញបានជោគជ័យ! (Purchase Successful)</b>\n\n"
            "🧾 <b>លេខវិក្កយបត្រ:</b> <code>#{order_id}</code>\n"
            "💰 <b>ចំនួនទឹកប្រាក់:</b> ${amount:.2f}\n\n"
            "🔑 <b>ទិន្នន័យ/កូដផលិតផលរបស់អ្នក៖</b>\n"
            "<code>{payload}</code>\n\n"
            "<i>💡 អរគុណសម្រាប់ការគាំទ្រហាងរបស់យើងខ្ញុំ!</i>"
        ),
        "insufficient_balance": (
            "<b>⚠️ តុល្យភាពគណនីមិនគ្រប់គ្រាន់ទេ! (Insufficient Balance)</b>\n\n"
            "💵 <b>តម្លៃទំនិញ:</b> <code>${price:.2f}</code>\n"
            "💳 <b>តុល្យភាពបច្ចុប្បន្ន:</b> <code>${balance:.2f}</code>\n\n"
            "សូមចុចប៊ូតុងខាងក្រោមដើម្បីទូទាត់ប្រាក់ដោយផ្ទាល់តាម <b>ABA App (ABA Pay)</b> ឬបង្ហាញ <b>Bakong KHQR</b> សម្រាប់ស្កេន៖"
        ),
        "aba_pay_btn": "🏦 ABA Pay (Direct App)",
        "show_qr_btn": "🇰🇭 បង្ហាញ Bakong KHQR",
        "direct_qr_title": (
            "<b>🇰🇭 KHQR / 🏦 ABA ទូទាត់ប្រាក់ផ្ទាល់</b>\n\n"
            "👤 Telegram ID: <code>{telegram_id}</code>\n"
            "💵 ចំនួនទឹកប្រាក់: <b>${price:.2f}</b>\n\n"
            "🏦 <b>គណនី ABA សម្រាប់ផ្ទេរ៖</b>\n"
            "• ឈ្មោះគណនី: <b>{aba_name}</b>\n"
            "• លេខគណនី: <code>{aba_number}</code>\n\n"
            "📌 <b>ចំណាំ:</b> បន្ទាប់ពីលោកអ្នកស្កេនទូទាត់ប្រាក់តាម ABA Mobile ឬ Bakong App រួចរាល់ សូមចុចប៊ូតុង <b>'🔄 ពិនិត្យការទូទាត់ (Check Payment)'</b> ខាងក្រោមដើម្បីទទួលបានទំនិញ/កូដភ្លាមៗ!"
        ),
        "account_overview": (
            "<b>👤 ព័ត៌មានគណនីរបស់អ្នក (Account Overview)</b>\n\n"
            "🆔 <b>Telegram ID:</b> <code>{telegram_id}</code>\n"
            "👤 <b>ឈ្មោះ:</b> {name}\n"
            "🏷️ <b>Username:</b> @{username}\n"
            "💵 <b>តុល្យភាព (Balance):</b> <code>${balance:.2f}</code>\n"
            "📅 <b>កាលបរិច្ឆេទចូលរួម:</b> {joined_date}\n"
        ),
        "no_history": "📜 អ្នកមិនទាន់មានប្រវត្តិបញ្ជាទិញនៅឡើយទេ។",
        "history_title": "<b>📜 ប្រវត្តិបញ្ជាទិញ ១០ លើកចុងក្រោយ៖</b>\n",
        "referral_info": (
            "<b>👥 កម្មវិធីណែនាំមិត្តភក្ដិ (Referral Program)</b>\n\n"
            "ណែនាំមិត្តភក្ដិរបស់អ្នកឱ្យប្រើប្រាស់ Bot នេះ ដើម្បីទទួលបានអត្ថប្រយោជន៍គណៈកម្មការ 5% រាល់ពេលដែលពួកគេទិញទំនិញ!\n\n"
            "🔗 <b>តំណភ្ជាប់ណែនាំរបស់អ្នក៖</b>\n"
            "<code>https://t.me/{bot_username}?start=ref_{telegram_id}</code>\n\n"
            "🎁 <i>រាល់ការទិញរបស់សមាជិកដែលអ្នកណែនាំ ទឹកប្រាក់គណៈកម្មការនឹងចូលទៅក្នុងតុល្យភាពគណនីរបស់អ្នកដោយស្វ័យប្រវត្តិ!</i>"
        ),
        "payment_history_empty": (
            "<b>💳 ប្រវត្តិការទូទាត់ប្រាក់ (Payment History)</b>\n\n"
            "មិនទាន់មានប្រវត្តិទូទាត់ប្រាក់/បញ្ចូលថវិកានៅឡើយទេ។\n\n"
            "រាល់ប្រតិបត្តិការបញ្ចូលថវិកាជោគជ័យនឹងបង្ហាញនៅទីនេះ।"
        ),
        "topup_menu": (
            "<b>💰 បញ្ចូលថវិកាស្វ័យប្រវត្តិ 24/7 (KHQR Auto Top-up)</b>\n\n"
            "សូមជ្រើសរើសចំនួនទឹកប្រាក់ដែលអ្នកចង់បញ្ចូល ៖"
        ),
        "cancel_topup": "❌ បដិសេធការបញ្ចូលថវិកា!",
        "custom_topup_prompt": (
            "✏️ <b>សូមវាយបញ្ចូលចំនួនទឹកប្រាក់ ($) ដែលអ្នកចង់បញ្ចូល៖</b>\n"
            "<i>ឧទហរណ៍: 2.50 ឬ 15</i>"
        ),
        "invalid_amount": "⚠️ សូមវាយបញ្ចូលចំនួនលេខទឹកប្រាក់ត្រឹមត្រូវ (ឧទាហរណ៍: 5.00) ៖",
        "topup_qr_caption": (
            "<b>🇰🇭 KHQR / 🏦 ABA បញ្ចូលថវិកាស្វ័យប្រវត្តិ</b>\n\n"
            "👤 Telegram ID: <code>{telegram_id}</code>\n"
            "💵 ចំនួនទឹកប្រាក់: <b>${amount:.2f}</b>\n\n"
            "🏦 <b>គណនី ABA សម្រាប់ផ្ទេរ៖</b>\n"
            "• ឈ្មោះគណនី: <b>{aba_name}</b>\n"
            "• លេខគណនី: <code>{aba_number}</code>\n\n"
            "📌 <b>ចំណាំ:</b> បន្ទាប់ពីលោកអ្នកបានទូទាត់ប្រាក់តាម Bakong App ឬ ABA Mobile រួចរាល់ ទឹកប្រាក់នឹងចូលគណនីស្វ័យប្រវត្តិ!"
        ),
        "keys_encrypted": "Keys are encrypted with AES-256 upon submission.",
        "product_desc_label": "📝 <b>ពិពណ៌នា:</b>",
        "product_price_label": "💰 <b>តម្លៃ:</b>",
        "product_status_label": "📊 <b>ស្ថានភាព:</b>",
        "stock_available": "🟢 មានស្តុក ({count})",
        "stock_empty": "🔴 អស់ស្តុក",
        "buy_confirm_prompt": "តើអ្នកពិតជាចង់បន្តការទិញផលិតផលនេះមែនទេ?",
    },
    "en": {
        "welcome": (
            "👋 Hello <b>{name}</b>!\n\n"
            "Welcome to <b>Store Manager Digital Bot</b> 🛍\n"
            "Automated Digital Accounts & License Keys Shop 24/7!\n\n"
            "💵 Current Balance: <b>${balance:.2f}</b>\n"
            "🆔 Telegram ID: <code>{telegram_id}</code>\n\n"
            "Please choose a menu option below to start:"
        ),
        "help": (
            "<b>❓ Help & Support Center</b>\n\n"
            "• <b>🛍️ Products:</b> Browse available accounts & license keys\n"
            "• <b>💰 Top Up:</b> Fund your account with automatic KHQR\n"
            "• <b>Referral Program:</b> Invite friends to earn commission rewards\n"
            "• <b>Order History:</b> View bought keys and license details\n\n"
            "📞 Customer Support: @sopha9926"
        ),
        "lang_select": "<b>🌐 Please choose your language (សូមជ្រើសរើសភាសារបស់អ្នក):</b>",
        "lang_updated": "🌐 Your language has been updated to <b>English 🇬🇧</b>!",
        "no_categories": "⚠️ No product categories are available at the moment.",
        "select_category": "<b>🛍️ Please select a category:</b>",
        "no_products": "<b>{icon} {name}</b>\n\n⚠️ No products available in this category!",
        "select_product_prompt": "Choose a product below to purchase:",
        "click_product_desc": "💡 Tap on a product name to view details",
        "back_to_categories_btn": "🔙 Back to Categories",
        "buy_now_btn": "🛒 Buy Now",
        "out_of_stock_btn": "❌ Out of Stock",
        "back_btn": "🔙 Back",
        "buy_confirm_title": "<b>⚠️ Order Confirmation</b>",
        "confirm_btn": "✅ Confirm Purchase",
        "cancel_btn": "❌ Cancel",
        "order_cancelled": "❌ Order has been cancelled!",
        "order_success": (
            "🎉 <b>Purchase Successful!</b>\n\n"
            "🧾 <b>Order ID:</b> <code>#{order_id}</code>\n"
            "💰 <b>Amount Paid:</b> ${amount:.2f}\n\n"
            "🔑 <b>Your Account Data / Key:</b>\n"
            "<code>{payload}</code>\n\n"
            "<i>💡 Thank you for choosing our store!</i>"
        ),
        "insufficient_balance": (
            "<b>⚠️ Insufficient Account Balance!</b>\n\n"
            "💵 <b>Product Price:</b> <code>${price:.2f}</code>\n"
            "💳 <b>Your Balance:</b> <code>${balance:.2f}</code>\n\n"
            "Please click below to pay directly via <b>ABA Mobile (ABA Pay)</b> or display <b>Bakong KHQR</b> to scan:"
        ),
        "aba_pay_btn": "🏦 ABA Pay (Direct App)",
        "show_qr_btn": "🇰🇭 Show Bakong KHQR",
        "direct_qr_title": (
            "<b>🇰🇭 Direct KHQR / 🏦 ABA Payment</b>\n\n"
            "👤 Telegram ID: <code>{telegram_id}</code>\n"
            "💵 Amount Due: <b>${price:.2f}</b>\n\n"
            "🏦 <b>ABA Bank Transfer Details:</b>\n"
            "• Name: <b>{aba_name}</b>\n"
            "• Account No: <code>{aba_number}</code>\n\n"
            "📌 <b>Note:</b> After completing your scan payment via ABA Mobile or Bakong, tap <b>'🔄 Check Payment'</b> below to get your digital keys immediately!"
        ),
        "account_overview": (
            "<b>👤 Your Account Overview</b>\n\n"
            "🆔 <b>Telegram ID:</b> <code>{telegram_id}</code>\n"
            "👤 <b>Name:</b> {name}\n"
            "🏷️ <b>Username:</b> @{username}\n"
            "💵 <b>Balance:</b> <code>${balance:.2f}</code>\n"
            "📅 <b>Joined Date:</b> {joined_date}\n"
        ),
        "no_history": "📜 You do not have any purchase history yet.",
        "history_title": "<b>📜 Your Last 10 Orders:</b>\n",
        "referral_info": (
            "<b>👥 Referral Commission Program</b>\n\n"
            "Refer your friends to use this bot and earn 5% commission every time they purchase products!\n\n"
            "🔗 <b>Your Referral Link:</b>\n"
            "<code>https://t.me/{bot_username}?start=ref_{telegram_id}</code>\n\n"
            "🎁 <i>Whenever your referrals purchase, commission funds are instantly credited to your balance!</i>"
        ),
        "payment_history_empty": (
            "<b>💳 Payment History</b>\n\n"
            "No deposits or payments recorded yet.\n\n"
            "All successful top-up transactions will show up here."
        ),
        "topup_menu": (
            "<b>💰 Automatic 24/7 Balance Top-up (KHQR)</b>\n\n"
            "Please select the amount you would like to top up:"
        ),
        "cancel_topup": "❌ Top-up cancelled!",
        "custom_topup_prompt": (
            "✏️ <b>Please type the amount ($) you want to top up:</b>\n"
            "<i>Example: 2.50 or 15</i>"
        ),
        "invalid_amount": "⚠️ Please enter a valid number format (e.g. 5.00):",
        "topup_qr_caption": (
            "<b>🇰🇭 KHQR / 🏦 ABA Automatic Balance Top-up</b>\n\n"
            "👤 Telegram ID: <code>{telegram_id}</code>\n"
            "💵 Amount: <b>${amount:.2f}</b>\n\n"
            "🏦 <b>ABA Bank Transfer Details:</b>\n"
            "• Name: <b>{aba_name}</b>\n"
            "• Account No: <code>{aba_number}</code>\n\n"
            "📌 <b>Note:</b> Once paid via Bakong App or ABA Mobile, the balance credits immediately!"
        ),
        "keys_encrypted": "Keys are encrypted with AES-256 upon submission.",
        "product_desc_label": "📝 <b>Description:</b>",
        "product_price_label": "💰 <b>Price:</b>",
        "product_status_label": "📊 <b>Status:</b>",
        "stock_available": "🟢 In Stock ({count})",
        "stock_empty": "🔴 Out of Stock",
        "buy_confirm_prompt": "Are you sure you want to purchase this product?",
    }
}


def get_text(lang_code: str, key: str, **kwargs) -> str:
    lang = lang_code if lang_code in TRANSLATIONS else "km"
    template = TRANSLATIONS[lang].get(key, "")
    if not template:
        template = TRANSLATIONS["km"].get(key, "")
    return template.format(**kwargs)
