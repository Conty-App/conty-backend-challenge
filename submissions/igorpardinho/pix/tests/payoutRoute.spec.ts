import { describe, it, expect, beforeEach } from "vitest";
import Fastify from "fastify";
import payoutsRoutes from "../src/routes/payout";
import { knex } from "../src/database/connection";

const buildApp = () => {
  const app = Fastify();
  app.register(payoutsRoutes);
  return app;
};

beforeEach(async () => {
  await knex("payouts").del();
});

describe("POST /payouts/batch", () => {
  it("should return 400 for invalid body", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/batch",
      payload: { wrong: "data" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should return batch report for valid request", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/batch",
      payload: {
        batch_id: "b1",
        items: [{ external_id: "i1", user_id: "u1", amount_cents: 1000, pix_key: "u1@test.com" }],
      },
    });

    expect(response.statusCode).toBe(200);
    const data = JSON.parse(response.body);
    expect(data.processed).toBe(1);
    expect(data.details[0].external_id).toBe("i1");
  });
});