// Fields safe to hand back to any API caller. Excludes the internal
// database id (never expose it) and the paymentToken, which belongs only
// inside a payment link URL, never in a general API response.
export function toPublicOrder(order) {
  const { id, paymentToken, paymentProviderTransactionId, ...safe } = order;
  return safe;
}
