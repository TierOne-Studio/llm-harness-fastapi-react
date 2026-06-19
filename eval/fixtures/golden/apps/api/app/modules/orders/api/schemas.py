"""Pydantic v2 request/response models for the orders API (the DTO boundary)."""
from pydantic import BaseModel, Field


class OrderLineIn(BaseModel):
    sku: str
    quantity: int = Field(gt=0)


class OrderRead(BaseModel):
    id: str
    status: str
    lines: list[OrderLineIn]
