"""SQLAlchemy adapter implementing the domain repository port.

Owns query construction and tenant scoping. Does NOT commit — the application
service owns the transaction boundary.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..domain.models import Order, OrderLine
from ..domain.repositories import OrderRepository
from .models import OrderModel  # ORM table model (elided)


class SqlAlchemyOrderRepository(OrderRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_for_update(self, order_id: str, organization_id: str) -> Order | None:
        # `with_for_update()` locks the row for the read-modify-write; always scope
        # by tenant — defense in depth, even behind an auth dependency.
        result = await self._session.execute(
            select(OrderModel)
            .where(OrderModel.id == order_id)
            .where(OrderModel.organization_id == organization_id)
            .with_for_update()
        )
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return Order(
            id=row.id,
            organization_id=row.organization_id,
            status=row.status,
            lines=[OrderLine(sku=l.sku, quantity=l.quantity) for l in row.lines],
        )

    async def save(self, order: Order) -> None:
        # `merge()` reconciles with the identity map, so persisting a loaded order's
        # transition is an UPDATE — `add()` here would re-insert the PK and conflict.
        await self._session.merge(OrderModel.from_domain(order))
