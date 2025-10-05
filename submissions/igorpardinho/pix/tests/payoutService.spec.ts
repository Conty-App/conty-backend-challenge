import { beforeEach, describe, expect, it, vi } from "vitest";
import { PayoutService } from "../src/services/payoutService";
import { knex } from "../src/database/connection";

const service = new PayoutService();

beforeEach(async () => {
  await knex("payouts").del();
});

describe("PayoutService", () => {
  it("should process a batch and return correct counts", async () => {
    const batchId = "test-1";
    const items = [
      {
        external_id: "u1-001",
        user_id: "u1",
        amount_cents: 1000,
        pix_key: "u1@test.com",
      },
      {
        external_id: "u2-002",
        user_id: "u2",
        amount_cents: 2000,
        pix_key: "u2@test.com",
      },
    ];

    const result = await service.processBatch(batchId, items);

    expect(result.batch_id).toBe(batchId);
    expect(result.processed).toBe(2);
    expect(result.details).toHaveLength(2);
  });

  it("should handle duplicates idempotenly", async () => {
    const batchId = "test-2";
    const items = [
      {
        external_id: "dup-001",
        user_id: "u1",
        amount_cents: 500,
        pix_key: "u1@test.com",
      },
    ];
    await service.processBatch(batchId, items);

    const result2 = await service.processBatch(batchId, items);
    expect(result2.duplicates).toBe(1);
    expect(result2.successful).toBe(0);
  });

  it("should handle failed payments", async () => {
    
    const randomSpy = vi.spyOn(global.Math, "random").mockReturnValue(0.01);

    const batchId = "test-3";
    const items = [{ external_id: "fail-001", user_id: "u1", amount_cents: 700, pix_key: "u1@test.com" }];

    const result = await service.processBatch(batchId, items);

    expect(result.failed).toBe(1);
    expect(result.details[0].status).toBe("failed");

    randomSpy.mockRestore();
  });
});
