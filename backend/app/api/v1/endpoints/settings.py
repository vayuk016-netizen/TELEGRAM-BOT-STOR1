import os
import shutil
from typing import Optional
from pathlib import Path
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.api.dependencies import get_current_admin
from app.core.config import settings
from app.bot.bot import reload_bot

router = APIRouter(prefix="/settings", tags=["Settings"])


class SettingsUpdate(BaseModel):
    bot_token: Optional[str] = Field(None, description="The Telegram Bot Token")
    bakong_api_token: Optional[str] = Field(None, description="NBC Bakong Open API Token")
    bakong_account_id: Optional[str] = Field(None, description="Bakong Account ID (e.g. username@abaa)")
    khqr_merchant_name: Optional[str] = Field(None, description="KHQR Merchant Name")
    khqr_merchant_city: Optional[str] = Field(None, description="KHQR Merchant City")
    aba_account_name: Optional[str] = Field(None, description="ABA Account Name")
    aba_account_number: Optional[str] = Field(None, description="ABA Account Number")
    aba_qr_link: Optional[str] = Field(None, description="ABA QR image link")


class SettingsResponse(BaseModel):
    bot_token: str
    bakong_api_token: Optional[str] = None
    bakong_account_id: Optional[str] = None
    khqr_merchant_name: Optional[str] = None
    khqr_merchant_city: Optional[str] = None
    aba_account_name: Optional[str] = None
    aba_account_number: Optional[str] = None
    aba_qr_link: Optional[str] = None


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


def get_current_settings_response() -> SettingsResponse:
    return SettingsResponse(
        bot_token=settings.BOT_TOKEN,
        bakong_api_token=settings.BAKONG_API_TOKEN,
        bakong_account_id=settings.BAKONG_ACCOUNT_ID,
        khqr_merchant_name=settings.KHQR_MERCHANT_NAME,
        khqr_merchant_city=settings.KHQR_MERCHANT_CITY,
        aba_account_name=settings.ABA_ACCOUNT_NAME,
        aba_account_number=settings.ABA_ACCOUNT_NUMBER,
        aba_qr_link=settings.ABA_QR_LINK,
    )


@router.get("", response_model=SettingsResponse)
async def get_settings(admin=Depends(get_current_admin)):
    return get_current_settings_response()


@router.post("", response_model=SettingsResponse)
async def update_settings(payload: SettingsUpdate, admin=Depends(get_current_admin)):
    try:
        # Update Bot Token if provided
        if payload.bot_token is not None and payload.bot_token.strip():
            token = payload.bot_token.strip()
            update_env_variable("BOT_TOKEN", token)
            settings.BOT_TOKEN = token
            try:
                await reload_bot(token)
            except Exception as e:
                pass

        # Update Bakong and Payment fields
        mapping = {
            "bakong_api_token": "BAKONG_API_TOKEN",
            "bakong_account_id": "BAKONG_ACCOUNT_ID",
            "khqr_merchant_name": "KHQR_MERCHANT_NAME",
            "khqr_merchant_city": "KHQR_MERCHANT_CITY",
            "aba_account_name": "ABA_ACCOUNT_NAME",
            "aba_account_number": "ABA_ACCOUNT_NUMBER",
            "aba_qr_link": "ABA_QR_LINK",
        }

        for field, env_key in mapping.items():
            val = getattr(payload, field)
            if val is not None:
                cleaned_val = str(val).strip()
                update_env_variable(env_key, cleaned_val)
                setattr(settings, env_key, cleaned_val)

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

    return get_current_settings_response()


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
