import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_db, get_current_admin
from app.core.config import settings
from app.db.models.broadcast_schedule import BroadcastSchedule
from app.db.models.user import User
from app.services.broadcast_scheduler import run_broadcast_worker

router = APIRouter(prefix="/broadcast", tags=["Broadcast Engine"])

# Resolve the absolute path of backend/app/static/uploads
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "static", "uploads"))


class BroadcastPayload(BaseModel):
    title: Optional[str] = None
    message_text: str = Field(..., description="HTML or plain text broadcast message content")
    interval_delay: int = 3
    image_path: Optional[str] = None


class BroadcastSchedulePayload(BaseModel):
    title: Optional[str] = None
    message_text: str = Field(..., description="HTML or plain text broadcast message content")
    scheduled_at: datetime = Field(..., description="Datetime to start sending the message")
    interval_delay: int = 3
    image_path: Optional[str] = None


class BroadcastScheduleResponse(BaseModel):
    id: int
    title: Optional[str]
    message_text: str
    image_path: Optional[str]
    scheduled_at: datetime
    interval_delay: int
    status: str
    total_targets: int
    sent_successfully: int
    failed_or_blocked: int
    sent_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    admin=Depends(get_current_admin),
):
    """Accepts an image or video file and saves it to static/uploads directory."""
    if not (file.content_type and (file.content_type.startswith("image/") or file.content_type.startswith("video/"))):
        raise HTTPException(status_code=400, detail="File must be an image or a video.")

    try:
        # Check if Cloudinary credentials are fully configured
        if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
            try:
                import cloudinary
                import cloudinary.uploader
                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=settings.CLOUDINARY_API_KEY,
                    api_secret=settings.CLOUDINARY_API_SECRET,
                    secure=True,
                )
                upload_result = cloudinary.uploader.upload(file.file, resource_type="auto")
                cloudinary_url = upload_result.get("secure_url")
                if cloudinary_url:
                    return {"image_path": cloudinary_url}
            except Exception as c_err:
                print(f"[Broadcast Upload Warning] Cloudinary upload failed, falling back to local: {c_err}")

        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)

        await file.seek(0)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return a relative path starting with /static
        return {"image_path": f"/static/uploads/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload media file: {str(e)}")


@router.post("")
async def send_immediate_broadcast(
    payload: BroadcastPayload,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Creates a broadcast schedule record and launches it immediately in a background task."""
    try:
        # Write the broadcast to database
        schedule = BroadcastSchedule(
            title=payload.title,
            message_text=payload.message_text,
            image_path=payload.image_path,
            scheduled_at=datetime.now(timezone.utc),
            interval_delay=payload.interval_delay,
            status="pending",
        )
        db.add(schedule)
        await db.commit()
        await db.refresh(schedule)

        # Dispatch to background runner immediately
        background_tasks.add_task(run_broadcast_worker, schedule.id)

        # Return standard response structure for legacy compatibility if needed
        return {
            "total_targets": 0,  # Background runner will update this
            "sent_successfully": 0,
            "failed_or_blocked": 0,
            "message": "Immediate broadcast initiated in the background.",
            "schedule_id": schedule.id
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Database or system error: {str(e)}. Please check if your database schema is updated by running migrations."
        )


@router.post("/schedule", response_model=BroadcastScheduleResponse)
async def schedule_broadcast(
    payload: BroadcastSchedulePayload,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Registers a new scheduled broadcast in the database."""
    try:
        # Enforce timezone-aware UTC datetime
        if payload.scheduled_at.tzinfo is None:
            payload.scheduled_at = payload.scheduled_at.replace(tzinfo=timezone.utc)

        schedule = BroadcastSchedule(
            title=payload.title,
            message_text=payload.message_text,
            image_path=payload.image_path,
            scheduled_at=payload.scheduled_at,
            interval_delay=payload.interval_delay,
            status="pending",
        )
        db.add(schedule)
        await db.commit()
        await db.refresh(schedule)
        return schedule
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Database or system error: {str(e)}. Please check if your database schema is updated by running migrations."
        )


@router.get("/schedules", response_model=List[BroadcastScheduleResponse])
async def get_schedules(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Retrieves all broadcast schedules, sorted by creation date descending."""
    stmt = select(BroadcastSchedule).order_by(BroadcastSchedule.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.delete("/schedules/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Cancels/deletes a pending scheduled broadcast from the system."""
    stmt = select(BroadcastSchedule).where(BroadcastSchedule.id == schedule_id)
    res = await db.execute(stmt)
    schedule = res.scalar_one_or_none()

    if not schedule:
        raise HTTPException(status_code=404, detail="Scheduled broadcast not found.")

    if schedule.status not in ["pending", "failed"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a broadcast that is currently sending or has completed."
        )

    await db.delete(schedule)
    await db.commit()
    return {"message": "Scheduled broadcast cancelled and deleted successfully."}
