from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin

class BroadcastSchedule(Base, TimestampMixin):
    __tablename__ = "broadcast_schedules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    image_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    interval_delay: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)  # pending, sending, completed, failed
    target_type: Mapped[str] = mapped_column(String(50), default="users", nullable=False)  # users, group, both
    group_chat_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # e.g. -1001234567890 or @mygroup
    total_targets: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sent_successfully: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_or_blocked: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
