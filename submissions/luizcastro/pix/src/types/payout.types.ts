import { t } from "elysia";

export const payoutItem = t.Object({
  external_id: t.String(),
  user_id: t.String(),
  amount_cents: t.Number(),
  pix_key: t.String(),
});

export type PayoutItem = typeof payoutItem.static;

export const batchInput = t.Object({
  batch_id: t.String(),
  items: t.Array(payoutItem),
});

export type BatchInput = typeof batchInput.static;

export const paymentStatus = t.Union([
  t.Literal("paid"),
  t.Literal("failed"),
  t.Literal("duplicate"),
]);

export type PaymentStatus = typeof paymentStatus.static;

export const paymentResult = t.Object({
  external_id: t.String(),
  status: paymentStatus,
  amount_cents: t.Number(),
  retries: t.Number(),
});

export type PaymentResult = typeof paymentResult.static;

export const batchReport = t.Object({
  batch_id: t.String(),
  processed: t.Number(),
  successful: t.Number(),
  failed: t.Number(),
  duplicates: t.Number(),
  details: t.Array(paymentResult),
});

export type BatchReport = typeof batchReport.static;

export const errorResponse = t.Object({
  error: t.String(),
  details: t.Optional(t.String()),
});

export type ErrorResponse = typeof errorResponse.static;
