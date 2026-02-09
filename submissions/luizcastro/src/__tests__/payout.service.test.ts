import { describe, it, expect, beforeEach, mock } from "bun:test";
import { paymentStore } from "../store/payment.store";
import type { BatchInput } from "../types/payout.types";

const makeBatch = (items: BatchInput["items"]): BatchInput => ({
  batch_id: "test-batch",
  items,
});

describe("processBatch", () => {
  beforeEach(() => {
    paymentStore.clear();
    mock.restore();
  });

  it("should process a batch and return a report", async () => {
    mock.module("../utils/pix-simulator", () => ({
      simulatePixPayment: () => Promise.resolve(true),
    }));
    const { processBatch } = await import("../services/payout.service");

    const batch = makeBatch([
      { external_id: "e1", user_id: "u1", amount_cents: 1000, pix_key: "a@b.com" },
      { external_id: "e2", user_id: "u2", amount_cents: 2000, pix_key: "c@d.com" },
    ]);

    const report = await processBatch(batch);

    expect(report.batch_id).toBe("test-batch");
    expect(report.processed).toBe(2);
    expect(report.successful).toBe(2);
    expect(report.failed).toBe(0);
    expect(report.duplicates).toBe(0);
    expect(report.details).toHaveLength(2);
  });

  it("should mark duplicates on second call with same external_ids", async () => {
    mock.module("../utils/pix-simulator", () => ({
      simulatePixPayment: () => Promise.resolve(true),
    }));
    const { processBatch } = await import("../services/payout.service");

    const batch = makeBatch([
      { external_id: "dup-1", user_id: "u1", amount_cents: 500, pix_key: "x@y.com" },
    ]);

    await processBatch(batch);
    const second = await processBatch(batch);

    expect(second.duplicates).toBe(1);
    expect(second.successful).toBe(0);
    expect(second.failed).toBe(0);
    expect(second.details[0].status).toBe("duplicate");
  });

  it("should handle mixed new and duplicate items", async () => {
    mock.module("../utils/pix-simulator", () => ({
      simulatePixPayment: () => Promise.resolve(true),
    }));
    const { processBatch } = await import("../services/payout.service");

    await processBatch(makeBatch([
      { external_id: "m-1", user_id: "u1", amount_cents: 100, pix_key: "a@b.com" },
    ]));

    const report = await processBatch(makeBatch([
      { external_id: "m-1", user_id: "u1", amount_cents: 100, pix_key: "a@b.com" },
      { external_id: "m-2", user_id: "u2", amount_cents: 200, pix_key: "c@d.com" },
    ]));

    expect(report.processed).toBe(2);
    expect(report.duplicates).toBe(1);
    expect(report.successful).toBe(1);
  });

  it("should handle empty batch", async () => {
    const { processBatch } = await import("../services/payout.service");
    const report = await processBatch(makeBatch([]));

    expect(report.processed).toBe(0);
    expect(report.successful).toBe(0);
    expect(report.failed).toBe(0);
    expect(report.duplicates).toBe(0);
    expect(report.details).toHaveLength(0);
  });

  it("should preserve amount_cents in results", async () => {
    mock.module("../utils/pix-simulator", () => ({
      simulatePixPayment: () => Promise.resolve(true),
    }));
    const { processBatch } = await import("../services/payout.service");

    const report = await processBatch(makeBatch([
      { external_id: "amt-1", user_id: "u1", amount_cents: 99999, pix_key: "x@y.com" },
    ]));
    expect(report.details[0].amount_cents).toBe(99999);
  });

  it("should retry failed payments up to 3 times before marking as failed", async () => {
    mock.module("../utils/pix-simulator", () => ({
      simulatePixPayment: () => Promise.resolve(false),
    }));
    const { processBatch } = await import("../services/payout.service");

    const report = await processBatch(makeBatch([
      { external_id: "fail-1", user_id: "u1", amount_cents: 1000, pix_key: "a@b.com" },
    ]));

    expect(report.failed).toBe(1);
    expect(report.successful).toBe(0);
    expect(report.details[0].status).toBe("failed");
    expect(report.details[0].retries).toBe(3);
  });

  it("should succeed on retry after initial failures", async () => {
    let callCount = 0;
    mock.module("../utils/pix-simulator", () => ({
      simulatePixPayment: () => {
        callCount++;
        return Promise.resolve(callCount >= 3);
      },
    }));
    const { processBatch } = await import("../services/payout.service");

    const report = await processBatch(makeBatch([
      { external_id: "retry-1", user_id: "u1", amount_cents: 5000, pix_key: "a@b.com" },
    ]));

    expect(report.successful).toBe(1);
    expect(report.failed).toBe(0);
    expect(report.details[0].status).toBe("paid");
    expect(report.details[0].retries).toBe(2);
  });

  it("should handle timeout as a failure and retry", async () => {
    let callCount = 0;
    mock.module("../utils/pix-simulator", () => ({
      simulatePixPayment: () => {
        callCount++;
        if (callCount === 1) return Promise.resolve(false);
        return Promise.resolve(true);
      },
    }));
    const { processBatch } = await import("../services/payout.service");

    const report = await processBatch(makeBatch([
      { external_id: "timeout-1", user_id: "u1", amount_cents: 3000, pix_key: "a@b.com" },
    ]));

    expect(report.successful).toBe(1);
    expect(report.details[0].status).toBe("paid");
    expect(report.details[0].retries).toBe(1);
  });
});
