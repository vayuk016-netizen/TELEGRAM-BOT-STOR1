from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field


# Category Schemas
class CategoryCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    icon: Optional[str] = "📦"
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Product Schemas
class ProductCreate(BaseModel):
    category_id: int
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    price: Decimal = Field(default=Decimal("0.00"), ge=0)
    image_url: Optional[str] = None
    is_active: bool = True


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductCreate):
    id: int
    price: Decimal = Field(default=Decimal("0.00"), ge=0)
    stock_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
