import os
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, Any
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)


class InvoiceGenerator:
    _base_template_path = Path(__file__).resolve().parent.parent / "static" / "invoice_base_template.png"
    _invoices_cache_dir = Path(__file__).resolve().parent.parent / "static" / "invoices"
    _fonts_dir = Path(__file__).resolve().parent.parent / "static" / "fonts"

    @classmethod
    def get_fonts(cls):
        bold_candidates = [
            cls._fonts_dir / "bold.ttf",
            Path("app/static/fonts/bold.ttf"),
            Path("backend/app/static/fonts/bold.ttf"),
            Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
            Path("/System/Library/Fonts/Helvetica.ttc"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        ]
        regular_candidates = [
            cls._fonts_dir / "regular.ttf",
            Path("app/static/fonts/regular.ttf"),
            Path("backend/app/static/fonts/regular.ttf"),
            Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
            Path("/System/Library/Fonts/Helvetica.ttc"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        ]

        bold_path = next((str(p) for p in bold_candidates if Path(p).exists()), None)
        regular_path = next((str(p) for p in regular_candidates if Path(p).exists()), None)

        def make_font(path, size):
            if path:
                try:
                    return ImageFont.truetype(path, size)
                except Exception as e:
                    logger.debug(f"Could not load font {path}: {e}")
            return ImageFont.load_default()

        return {
            "title_bold": make_font(bold_path, 16),
            "label_bold": make_font(bold_path, 14),
            "body_regular": make_font(regular_path, 13),
            "body_small": make_font(regular_path, 11),
            "amount_bold": make_font(bold_path, 16),
        }

    @classmethod
    def generate_order_invoice_image(
        cls,
        order_id: int,
        customer_name: str,
        customer_id: Any,
        product_title: str,
        quantity: int,
        unit_price: float,
        total_amount: float,
        delivered_payload: str,
        created_at: Optional[datetime] = None,
        force_regenerate: bool = False,
    ) -> Path:
        """
        Renders the official SP Shop Invoice PNG from the user's custom template.
        Fills customer info, order number, bank details, date, items, delivered keys, and subtotal.
        Returns the absolute Path to the generated image file.
        """
        cls._invoices_cache_dir.mkdir(parents=True, exist_ok=True)
        output_path = cls._invoices_cache_dir / f"invoice_{order_id:05d}.png"

        if output_path.exists() and not force_regenerate:
            return output_path

        # Resolve base template path safely across environments
        template_candidates = [
            cls._base_template_path,
            Path("app/static/invoice_base_template.png"),
            Path("backend/app/static/invoice_base_template.png"),
        ]
        template_file = next((p for p in template_candidates if p.exists()), None)

        if not template_file:
            logger.error("Base invoice template not found!")
            raise FileNotFoundError("Base invoice template not found at app/static/invoice_base_template.png")

        im = Image.open(template_file).convert("RGB")
        draw = ImageDraw.Draw(im)
        fonts = cls.get_fonts()

        # Format date in Cambodia Time (UTC+7)
        cambodia_tz = timezone(timedelta(hours=7))
        if created_at is None:
            created_at = datetime.now(timezone.utc)
        elif created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        local_time = created_at.astimezone(cambodia_tz)
        date_str = local_time.strftime("%d/%m/%Y")

        # 1. Customer Name under 'INVOICE TO:'
        display_name = (customer_name or f"Customer_{customer_id}").strip()
        if not display_name.lower().startswith("mr.") and not display_name.lower().startswith("ms."):
            display_name = f"Mr. {display_name}"
        draw.text((70, 240), f"{display_name} (ID: {customer_id})", fill=(20, 20, 20), font=fonts["title_bold"])

        # 2. Invoice Number under 'INVOICE NUMBER'
        inv_no_str = f"INV-{order_id:05d}"
        draw.text((580, 238), inv_no_str, fill=(5, 89, 227), font=fonts["title_bold"])

        # 3. Bank Details under 'BANK DETAILS'
        draw.text((70, 355), "ABA Bank / KHQR (Instant Transfer)", fill=(40, 40, 40), font=fonts["body_regular"])
        draw.text((70, 378), "Account Name : SOPHA SOK", fill=(40, 40, 40), font=fonts["body_regular"])
        draw.text((70, 401), "Account Number : 126103017113061", fill=(40, 40, 40), font=fonts["body_regular"])

        # 4. Date under 'DATE:'
        draw.text((580, 355), date_str, fill=(20, 20, 20), font=fonts["title_bold"])

        # 5. Table Row: DESCRIPTION, QTY, PRICE, TOTAL
        display_title = product_title if len(product_title) <= 30 else product_title[:28] + "..."
        qty_str = str(quantity)
        price_str = f"${unit_price:.2f}"
        total_str = f"${total_amount:.2f}"

        draw.text((90, 568), display_title, fill=(20, 20, 20), font=fonts["label_bold"])
        draw.text((325, 568), qty_str, fill=(40, 40, 40), font=fonts["body_regular"])
        draw.text((475, 568), price_str, fill=(40, 40, 40), font=fonts["body_regular"])
        draw.text((630, 568), total_str, fill=(40, 40, 40), font=fonts["body_regular"])

        # Delivered Keys & Order Status
        if delivered_payload:
            payload_lines = [line.strip() for line in delivered_payload.split("\n") if line.strip()]
            first_line = payload_lines[0] if payload_lines else "Delivered to account"
            if len(first_line) > 42:
                first_line = first_line[:40] + "..."
            draw.text((90, 605), f"Key/Account: {first_line}", fill=(5, 89, 227), font=fonts["label_bold"])
            if len(payload_lines) > 1:
                draw.text((90, 626), f"+ {len(payload_lines)-1} additional key(s)", fill=(70, 70, 70), font=fonts["body_small"])
                draw.text((90, 646), "Status: PAID / DELIVERED", fill=(16, 185, 129), font=fonts["label_bold"])
            else:
                draw.text((90, 630), "Status: PAID / DELIVERED", fill=(16, 185, 129), font=fonts["label_bold"])

        # 6. Subtotal
        draw.text((630, 825), total_str, fill=(5, 89, 227), font=fonts["amount_bold"])

        im.save(output_path, "PNG", optimize=True)
        logger.info(f"Generated official invoice image: {output_path}")
        return output_path
