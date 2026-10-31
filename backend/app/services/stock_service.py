from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.digital_key import DigitalKey
from app.db.repositories.stock_repository import StockRepository
from app.db.repositories.product_repository import ProductRepository
from app.core.security import encrypt_key_content, decrypt_key_content
from app.core.exceptions import ProductNotFoundException
from app.schemas.stock import StockKeyItemResponse


def mask_key_preview(content: str) -> str:
    """Helper to create a safe masked preview for keys and account credentials."""
    content = content.strip()
    if not content:
        return ""
    
    # Check if account format (e.g. username:password)
    if ":" in content:
        parts = content.split(":", 1)
        user_part = parts[0]
        pass_part = parts[1]
        
        # Mask user
        if len(user_part) > 4:
            masked_user = f"{user_part[:2]}***{user_part[-2:]}"
        else:
            masked_user = f"{user_part[:1]}***"
            
        # Mask password
        if len(pass_part) > 4:
            masked_pass = f"{pass_part[:2]}***{pass_part[-2:]}"
        else:
            masked_pass = "***"
            
        return f"{masked_user}:{masked_pass}"
        
    # Check if license key with dashes
    if "-" in content:
        segments = content.split("-")
        if len(segments) >= 3:
            return f"{segments[0]}-****-****-{segments[-1]}"
            
    # Generic string masking
    if len(content) > 8:
        return f"{content[:3]}***{content[-3:]}"
    return f"{content[:2]}***"


class StockService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.stock_repo = StockRepository(session)
        self.product_repo = ProductRepository(session)

    async def bulk_upload_keys(
        self, product_id: int, raw_text_data: str, skip_duplicates: bool = True
    ) -> Tuple[int, int, int]:
        """
        Parses multi-line text input (1 key / account credential per line),
        encrypts each item with AES-Fernet, and inserts them into database in batch.
        Returns: (inserted_count, new_current_stock, duplicates_skipped)
        """
        product = await self.product_repo.get_by_id(product_id)
        if not product:
            raise ProductNotFoundException(f"Product ID {product_id} not found.")

        # Normalize line breaks and clean whitespace
        normalized = raw_text_data.replace("\r\n", "\n").replace("\r", "\n")
        raw_lines = [line.strip() for line in normalized.split("\n")]
        valid_lines = [l for l in raw_lines if l]

        if not valid_lines:
            stats = await self.stock_repo.get_stock_stats_by_product(product_id)
            return 0, stats["unsold_keys"], 0

        # Optional deduplication within the incoming batch
        duplicates_skipped = 0
        if skip_duplicates:
            seen = set()
            unique_lines = []
            for line in valid_lines:
                if line not in seen:
                    seen.add(line)
                    unique_lines.append(line)
                else:
                    duplicates_skipped += 1
            processed_lines = unique_lines
        else:
            processed_lines = valid_lines

        digital_keys: List[DigitalKey] = []
        for line in processed_lines:
            encrypted_val = encrypt_key_content(line)
            key_item = DigitalKey(
                product_id=product_id,
                encrypted_content=encrypted_val,
                is_sold=False,
            )
            digital_keys.append(key_item)

        inserted_count = await self.stock_repo.bulk_add_keys(digital_keys)
        await self.session.commit()

        # Fetch fresh stock statistics
        stats = await self.stock_repo.get_stock_stats_by_product(product_id)
        current_stock = stats["unsold_keys"]

        return inserted_count, current_stock, duplicates_skipped

    async def get_product_keys_audit(
        self, product_id: int, limit: int = 100, is_sold: Optional[bool] = None
    ) -> List[StockKeyItemResponse]:
        """Fetches product keys with safe preview and decrypted raw content for admin."""
        keys = await self.stock_repo.get_keys_by_product(
            product_id=product_id, limit=limit, is_sold=is_sold
        )
        result: List[StockKeyItemResponse] = []
        for k in keys:
            raw_content = ""
            preview = "Encrypted"
            try:
                raw_content = decrypt_key_content(k.encrypted_content)
                preview = mask_key_preview(raw_content)
            except Exception:
                preview = "Decryption error"

            result.append(
                StockKeyItemResponse(
                    id=k.id,
                    product_id=k.product_id,
                    is_sold=k.is_sold,
                    order_id=k.order_id,
                    created_at=k.created_at,
                    sold_at=k.sold_at,
                    key_preview=preview,
                    raw_content=raw_content,
                )
            )
        return result

    async def delete_unsold_key(self, key_id: int) -> Tuple[bool, int, int]:
        """Deletes an unsold key. Returns: (success, product_id, current_stock)"""
        product_id = await self.stock_repo.delete_key_by_id(key_id)
        if product_id is None:
            return False, 0, 0
        await self.session.commit()
        stats = await self.stock_repo.get_stock_stats_by_product(product_id)
        return True, product_id, stats["unsold_keys"]

    async def clear_unsold_keys_for_product(self, product_id: int) -> Tuple[int, int]:
        """Removes all unsold keys for a given product. Returns: (cleared_count, remaining_unsold)"""
        cleared_count = await self.stock_repo.clear_unsold_keys(product_id)
        await self.session.commit()
        stats = await self.stock_repo.get_stock_stats_by_product(product_id)
        return cleared_count, stats["unsold_keys"]
