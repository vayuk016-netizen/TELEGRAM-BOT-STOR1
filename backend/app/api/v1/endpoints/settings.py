import os
import shutil
from pathlib import Path
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.api.dependencies import get_current_admin
from app.core.config import settings
from app.bot.bot import reload_bot

router = APIRouter(prefix="/settings", tags=["Settings"])


class SettingsUpdate(BaseModel):
    bot_token: str = Field(..., description="The Telegram Bot Token")


class SettingsResponse(BaseModel):
    bot_token: str


def update_env_variable(key: str, value: str):
    # settings.py -> endpoints -> v1 -> api -> app -> backend (5 levels up)
    backend_dir = Path(__file__).resolve().parents[4]
    env_path = backend_dir / ".env"

    lines = []
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

    updated = False
    for i, line in enumerate(lines):
        if line.strip().startswith(f"{key}="):
            lines[i] = f"{key}={value}\n"
            updated = True
            break

    if not updated:
        lines.append(f"\n{key}={value}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)


@router.get("", response_model=SettingsResponse)
async def get_settings(admin=Depends(get_current_admin)):
    return SettingsResponse(
        bot_token=settings.BOT_TOKEN,
    )


@router.post("", response_model=SettingsResponse)
async def update_settings(payload: SettingsUpdate, admin=Depends(get_current_admin)):
    try:
        token = payload.bot_token.strip()

        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bot Token is required",
            )

        # 1. Update .env file
        try:
            update_env_variable("BOT_TOKEN", token)
        except Exception as e:
            raise Exception(f"Failed to update config (.env) file. Please check file write permissions. Error: {str(e)}")

        # 2. Reload the bot with the new token
        try:
            await reload_bot(token)
        except Exception as e:
            raise Exception(f"Failed to hot-reload bot client. Please make sure the bot token is valid. Error: {str(e)}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

    return SettingsResponse(
        bot_token=settings.BOT_TOKEN,
    )


@router.post("/upload-qr")
async def upload_qr(
    file: UploadFile = File(...),
    admin=Depends(get_current_admin)
):
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".png", ".jpg", ".jpeg", ".webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format. Allowed formats: PNG, JPG, JPEG, WEBP"
        )

    # Check if Cloudinary credentials are fully configured
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
            )
            upload_result = cloudinary.uploader.upload(file.file, resource_type="image")
            cloudinary_url = upload_result.get("secure_url")
            return {"qr_link": cloudinary_url}
        except Exception as e:
            # Fallback to local storage if Cloudinary fails
            pass

    # Ensure static directory exists
    app_dir = Path(__file__).resolve().parents[3]
    static_dir = app_dir / "static"
    os.makedirs(static_dir, exist_ok=True)

    filename = f"aba_qr{file_ext}"
    file_path = os.path.join(static_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"qr_link": f"/static/{filename}"}
