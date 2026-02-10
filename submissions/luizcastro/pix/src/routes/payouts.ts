import { Elysia } from "elysia";
import { processBatch } from "../services/payout.service";
import { batchInput, batchReport, errorResponse } from "../types/payout.types";

export const payoutsRoutes = new Elysia()
  .onError(({ code, error, status }) => {
    if (code === "VALIDATION") {
      return status(422, { error: "Validation failed", details: error.message });
    }

    return status(500, { error: "Internal server error" });
  })
  .post(
    "/payouts/batch",
    async ({ body }) => {
      return await processBatch(body);
    },
    {
      body: batchInput,
      response: {
        200: batchReport,
        422: errorResponse,
        500: errorResponse,
      },
    },
  );
