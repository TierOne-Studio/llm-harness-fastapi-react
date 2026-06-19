import { useState } from "react";
import { submitOrderRequest, type OrderRead } from "./api";

export function SubmitOrderButton({ orderId, orgId }: { orderId: string; orgId: string }) {
  const [order, setOrder] = useState<OrderRead | null>(null);
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      setOrder(await submitOrderRequest(orderId, orgId));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={onClick} disabled={loading}>
      {loading ? "Submitting…" : order ? `Status: ${order.status}` : "Submit order"}
    </button>
  );
}
