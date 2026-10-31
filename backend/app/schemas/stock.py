from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class BulkKeyUploadPayload(BaseModel):
    product_id: int
    raw_keys_text: str = Field(..., description="Multi-line text with 1 key / account per line")
    skip_duplicates: bool = Field(default=True, description="Skip duplicate keys within batch or already in vault")


class BulkKeyUploadResponse(BaseModel):
    product_id: int
    keys_added: int
    current_stock: int
    duplicates_skipped: int = 0
    message: str


class StockAuditItemResponse(BaseModel):
    id: int
    product_id: int
    is_sold: bool
    order_id: Optional[int] = None
    created_at: datetime
    sold_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StockKeyItemResponse(BaseModel):
    id: int
    product_id: int
    is_sold: bool
    order_id: Optional[int] = None
    created_at: datetime
    sold_at: Optional[datetime] = None
    key_preview: str
    raw_content: Optional[str] = None


class DeleteKeyResponse(BaseModel):
    success: bool
    message: str
    product_id: int
    current_stock: int
