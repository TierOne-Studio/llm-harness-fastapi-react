"""Repository port — the domain owns the abstraction; infrastructure implements it."""
from typing import Protocol

from .models import Order


class OrderRepository(Protocol):
    async def get(self, order_id: str, organization_id: str) -> Order | None: ...

    async def add(self, order: Order) -> None: ...
