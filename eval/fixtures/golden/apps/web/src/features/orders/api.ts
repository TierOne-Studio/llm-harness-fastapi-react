// Consumes the generated client/types — the OpenAPI schema is the single source
// of truth. No hand-redeclared contract types live here.
import { submitOrder, type OrderRead } from "../../generated/client";

export type { OrderRead };

export function submitOrderRequest(orderId: string): Promise<OrderRead> {
  return submitOrder(orderId);
}
