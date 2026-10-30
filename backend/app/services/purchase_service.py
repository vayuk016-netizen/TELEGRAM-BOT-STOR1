from decimal import Decimal
from typing import Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories.user_repository import UserRepository
from app.db.repositories.product_repository import ProductRepository
from app.db.repositories.stock_repository import StockRepository
from app.db.repositories.order_repository import OrderRepository
from app.db.models.order import Order
from app.core.security import decrypt_key_content
from app.core.exceptions import (
    OutOfStockException,
    InsufficientBalanceException,
    ProductNotFoundException,
    UserNotFoundException,
)


class PurchaseService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)
        self.product_repo = ProductRepository(session)
        self.stock_repo = StockRepository(session)
        self.order_repo = OrderRepository(session)

    async def execute_purchase(self, telegram_id: int, product_id: int, quantity: int = 1) -> Tuple[Order, str]:
        """
        Executes a race-condition safe digital item purchase for 1 or more keys.
        
        Steps in an Atomic DB Transaction:
        1. Fetch & lock product entity.
        2. Safely lock `quantity` unsold digital keys via PostgreSQL FOR UPDATE SKIP LOCKED.
        3. Lock user row with FOR UPDATE and verify balance sufficiency.
        4. Deduct total price from user.
        5. Decrypt digital key contents for instant delivery.
        6. Log Order & OrderItem records.
        7. Flag digital keys as sold with order reference.
        """
        if quantity < 1:
            quantity = 1

        # Step 1: Check product validity
        product = await self.product_repo.get_by_id(product_id)
        if not product or not product.is_active:
            raise ProductNotFoundException("Product is not available for purchase.")

        # Step 2: Lock `quantity` unsold keys safely
        digital_keys = await self.stock_repo.fetch_and_lock_unsold_keys(product_id, quantity)
        if len(digital_keys) < quantity:
            left = len(digital_keys)
            if left == 0:
                raise OutOfStockException(f"Sorry, '{product.title}' is currently out of stock!")
            else:
                raise OutOfStockException(f"Sorry, '{product.title}' only has {left} item(s) available in stock!")

        # Step 3: Fetch & lock user record
        user = await self.user_repo.get_by_telegram_id_for_update(telegram_id)
        if not user:
            raise UserNotFoundException("User profile not found. Please type /start first.")

        if user.is_blocked:
            raise InsufficientBalanceException("Your account is currently suspended.")

        # Step 4: Verify balance
        total_price = product.price * quantity
        if user.balance < total_price:
            needed = total_price - user.balance
            raise InsufficientBalanceException(
                f"Insufficient balance! Required: ${total_price:.2f}, Balance: ${user.balance:.2f}. "
                f"Please top up ${needed:.2f} more."
            )

        # Step 5: Deduct balance
        user.balance -= total_price

        # Step 6: Decrypt key contents
        decrypted_keys = [decrypt_key_content(k.encrypted_content) for k in digital_keys]
        if len(decrypted_keys) == 1:
            plain_key_content = decrypted_keys[0]
        else:
            plain_key_content = "\n".join([f"{i+1}. {k}" for i, k in enumerate(decrypted_keys)])

        # Step 7: Record Order & OrderItem
        order = await self.order_repo.create_order_with_item(
            user_id=user.id,
            product_id=product.id,
            unit_price=product.price,
            delivered_payload=plain_key_content,
            total_amount=total_price,
        )

        # Step 8: Mark keys as sold
        key_ids = [k.id for k in digital_keys]
        await self.stock_repo.mark_keys_as_sold(key_ids=key_ids, order_id=order.id)

        # Commit explicit transaction
        await self.session.commit()

        return order, plain_key_content
