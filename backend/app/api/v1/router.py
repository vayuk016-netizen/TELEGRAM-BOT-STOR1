from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    analytics,
    products,
    stock,
    orders,
    users,
    webhooks,
    broadcast,
    settings,
    public,
)

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(public.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(analytics.router)
api_v1_router.include_router(products.router)
api_v1_router.include_router(stock.router)
api_v1_router.include_router(orders.router)
api_v1_router.include_router(users.router)
api_v1_router.include_router(webhooks.router)
api_v1_router.include_router(broadcast.router)
api_v1_router.include_router(settings.router)
