"""Pure domain — entities, value objects, invariants. No framework or ORM imports."""
from dataclasses import dataclass, field


@dataclass
class OrderLine:
    sku: str
    quantity: int


@dataclass
class Order:
    id: str
    organization_id: str
    status: str = "draft"
    lines: list[OrderLine] = field(default_factory=list)

    def submit(self) -> None:
        if self.status != "draft":
            raise ValueError("only a draft order can be submitted")
        if not self.lines:
            raise ValueError("cannot submit an empty order")
        self.status = "submitted"
