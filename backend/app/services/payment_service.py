from decimal import Decimal
from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories.user_repository import UserRepository
from app.db.models.transaction import Transaction
from app.core.config import settings


class PaymentService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)

    async def process_khqr_topup(
        self,
        telegram_id: int,
        amount: Decimal,
        khqr_md5: Optional[str] = None,
        description: Optional[str] = "KHQR Automated Balance Topup",
    ) -> Tuple[Transaction, Decimal]:
        """
        Processes a KHQR top-up webhook, preventing double crediting via MD5 idempotency check.
        """
        if khqr_md5:
            # Check for existing transaction
            stmt = select(Transaction).where(Transaction.khqr_md5 == khqr_md5)
            res = await self.session.execute(stmt)
            existing_tx = res.scalar_one_or_none()
            if existing_tx:
                user = await self.user_repo.get_by_telegram_id(telegram_id)
                new_bal = user.balance if user else Decimal("0.00")
                return existing_tx, new_bal

        user = await self.user_repo.get_by_telegram_id(telegram_id)
        if not user:
            raise ValueError(f"User with Telegram ID {telegram_id} not found.")

        # Credit user balance
        updated_user = await self.user_repo.add_balance(user.id, amount)

        # Log transaction
        tx = Transaction(
            user_id=user.id,
            amount=amount,
            payment_method="KHQR",
            khqr_md5=khqr_md5,
            status="SUCCESS",
            description=description,
        )
        self.session.add(tx)
        await self.session.commit()

        return tx, updated_user.balance

    @staticmethod
    def generate_khqr_payload(telegram_id: int, amount: Decimal) -> str:
        """
        Generates standard Bakong EMVCo KHQR string payload for user scan.
        """
        from app.services.bakong_service import BakongService
        result = BakongService.generate_khqr(
            amount=amount,
            bill_number=f"TG_{telegram_id}",
            currency="USD",
        )
        return result["khqr_string"]
