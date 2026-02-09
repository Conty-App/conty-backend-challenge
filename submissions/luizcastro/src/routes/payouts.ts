import { Elysia } from "elysia";
import { processBatch } from "../services/payout.service";
import { batchInput } from "../types/payout.types";

export const payoutsRoutes = new Elysia().post(
  "/payouts/batch",
  async ({ body }) => processBatch(body),
  {
    body: batchInput,
  },
);
