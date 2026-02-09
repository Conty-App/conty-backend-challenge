import { Elysia, t } from "elysia";
import { processBatch } from "../services/payout.service";

export const payoutsRoutes = new Elysia().post(
  "/payouts/batch",
  async ({ body }) => processBatch(body),
  {
    body: t.Object({
      batch_id: t.String(),
      items: t.Array(
        t.Object({
          external_id: t.String(),
          user_id: t.String(),
          amount_cents: t.Number(),
          pix_key: t.String(),
        })
      ),
    }),
  }
);
