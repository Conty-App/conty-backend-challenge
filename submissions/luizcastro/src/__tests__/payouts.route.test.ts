import { describe, it, expect, beforeEach } from "bun:test";
import { Elysia } from "elysia";
import { payoutsRoutes } from "../routes/payouts";
import { paymentStore } from "../store/payment.store";

const app = new Elysia().use(payoutsRoutes);

const postBatch = (body: unknown) =>
  app.handle(
    new Request("http://localhost/payouts/batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );

describe("POST /payouts/batch", () => {
  beforeEach(() => {
    paymentStore.clear();
  });

  it("should return 200 with valid batch", async () => {
    const res = await postBatch({
      batch_id: "b1",
      items: [
        { external_id: "r1", user_id: "u1", amount_cents: 1000, pix_key: "a@b.com" },
      ],
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.batch_id).toBe("b1");
    expect(json.processed).toBe(1);
  });

  it("should return 422 for invalid body", async () => {
    const res = await postBatch({ invalid: true });
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("should return 422 for missing required fields", async () => {
    const res = await postBatch({
      batch_id: "b3",
      items: [{ external_id: "x1" }],
    });
    expect(res.status).toBe(422);
  });

  it("should enforce idempotency across requests", async () => {
    const body = {
      batch_id: "b2",
      items: [
        { external_id: "id1", user_id: "u1", amount_cents: 500, pix_key: "x@y.com" },
      ],
    };

    await postBatch(body);
    const res = await postBatch(body);
    const json = await res.json();

    expect(json.duplicates).toBe(1);
    expect(json.successful).toBe(0);
  });
});
