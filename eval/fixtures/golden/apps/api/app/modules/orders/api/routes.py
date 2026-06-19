"""APIRouter for orders. Wires FastAPI dependencies and calls the application
service. Contains NO SQL and no persistence detail — that lives in infrastructure.
"""
from fastapi import APIRouter, Depends, HTTPException, status

from ..application.services import OrderNotFound, OrderService
from .schemas import OrderRead

router = APIRouter(prefix="/orders", tags=["orders"])


def get_order_service() -> OrderService:  # provider wired at app composition
    ...


@router.post("/{order_id}/submit", response_model=OrderRead)
async def submit_order(
    order_id: str,
    org_id: str,
    service: OrderService = Depends(get_order_service),
) -> OrderRead:
    try:
        order = await service.submit_order(order_id, org_id)
    except OrderNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="order not found")
    return OrderRead(id=order.id, status=order.status, lines=order.lines)
