// AUTO-GENERATED from the FastAPI OpenAPI schema. Do not edit by hand.
// This is the single source of truth for FE↔BE contract types.
export interface OrderRead {
  id: string;
  status: string;
  lines: { sku: string; quantity: number }[];
}

export async function submitOrder(orderId: string, orgId: string): Promise<OrderRead> {
  const res = await fetch(`/api/orders/${orderId}/submit?org_id=${orgId}`, { method: "POST" });
  if (!res.ok) throw new Error(`submitOrder failed: ${res.status}`);
  return res.json();
}
