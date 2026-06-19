// AUTO-GENERATED from the FastAPI OpenAPI schema. Do not edit by hand.
// This is the single source of truth for FE↔BE contract types.
export interface OrderRead {
  id: string;
  status: string;
  lines: { sku: string; quantity: number }[];
}

// The server derives the tenant from the authenticated session, so the client
// never sends an org id.
export async function submitOrder(orderId: string): Promise<OrderRead> {
  const res = await fetch(`/api/orders/${orderId}/submit`, { method: "POST" });
  if (!res.ok) throw new Error(`submitOrder failed: ${res.status}`);
  return res.json();
}
