"""APIRouter for orders. Wires FastAPI dependencies and calls the application
service. Contains NO SQL and no persistence detail — that lives in infrastructure.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from ..application.services import OrderNotFound, OrderService
from .schemas import OrderRead

router = APIRouter(prefix="/orders", tags=["orders"])


def get_order_service() -> OrderService:  # provider wired at app composition
    ...


def get_current_org_id() -> str:  # resolves the authenticated principal's tenant
    ...


# Tenant comes from the authenticated principal, never from request input — a
# caller-supplied org id would allow cross-tenant actions (IDOR).
ServiceDep = Annotated[OrderService, Depends(get_order_service)]
OrgIdDep = Annotated[str, Depends(get_current_org_id)]


@router.post("/{order_id}/submit")
async def submit_order(order_id: str, service: ServiceDep, org_id: OrgIdDep) -> OrderRead:
    try:
        order = await service.submit_order(order_id, org_id)
    except OrderNotFound:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="order not found")
    return OrderRead(id=order.id, status=order.status, lines=order.lines)
