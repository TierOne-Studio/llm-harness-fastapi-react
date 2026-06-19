"""Repository port — the domain owns the abstraction; infrastructure implements it."""
from typing import Protocol

from .models import Order


class OrderRepository(Protocol):
    async def get_for_update(self, order_id: str, organization_id: str) -> Order | None:
        """Load an order and lock the row for a read-modify-write transition."""
        ...

    async def save(self, order: Order) -> None:
        """Persist an order's state (insert or update) into the current transaction."""
        ...
