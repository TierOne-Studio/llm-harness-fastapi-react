import { useState } from "react";
import { submitOrderRequest, type OrderRead } from "./api";

type Props = Readonly<{ orderId: string }>;

function buttonLabel(loading: boolean, order: OrderRead | null, error: string | null): string {
  if (loading) return "Submitting…";
  if (error) return `Error: ${error}`;
  if (order) return `Status: ${order.status}`;
  return "Submit order";
}

export function SubmitOrderButton({ orderId }: Props) {
  const [order, setOrder] = useState<OrderRead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      setOrder(await submitOrderRequest(orderId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={onClick} disabled={loading}>
      {buttonLabel(loading, order, error)}
    </button>
  );
}
