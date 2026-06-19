"""Use-case orchestration. Depends on the domain port; owns the transaction boundary.

Does NOT import the concrete SQLAlchemy adapter (that would invert the dependency
rule) and does NOT construct SQL — persistence detail lives in infrastructure.
"""
from sqlalchemy.ext.asyncio import AsyncSession

from ..domain.models import Order
from ..domain.repositories import OrderRepository


class OrderNotFound(Exception):
    pass


class OrderService:
    def __init__(self, session: AsyncSession, repo: OrderRepository) -> None:
        self._session = session
        self._repo = repo

    async def submit_order(self, order_id: str, organization_id: str) -> Order:
        async with self._session.begin():  # service owns commit/rollback
            order = await self._repo.get(order_id, organization_id)
            if order is None:
                raise OrderNotFound(order_id)
            order.submit()
            await self._repo.add(order)
            return order
