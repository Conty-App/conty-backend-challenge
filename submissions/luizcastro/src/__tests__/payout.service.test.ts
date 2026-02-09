import { describe, it, expect, beforeEach } from "bun:test";
import { processBatch } from "../services/payout.service";
import { paymentStore } from "../store/payment.store";
import type { BatchInput } from "../types/payout.types";

const makeBatch = (items: BatchInput["items"]): BatchInput => ({
  batch_id: "test-batch",
  items,
});

describe("processBatch", () => {
  beforeEach(() => {
    paymentStore.clear();
  });

  it("should process a batch and return a report", async () => {
    const batch = makeBatch([
      { external_id: "e1", user_id: "u1", amount_cents: 1000, pix_key: "a@b.com" },
      { external_id: "e2", user_id: "u2", amount_cents: 2000, pix_key: "c@d.com" },
    ]);

    const report = await processBatch(batch);

    expect(report.batch_id).toBe("test-batch");
    expect(report.processed).toBe(2);
    expect(report.successful + report.failed).toBe(2);
    expect(report.duplicates).toBe(0);
    expect(report.details).toHaveLength(2);
  });

  it("should mark duplicates on second call with same external_ids", async () => {
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
    const first = makeBatch([
      { external_id: "m-1", user_id: "u1", amount_cents: 100, pix_key: "a@b.com" },
    ]);
    await processBatch(first);

    const second = makeBatch([
      { external_id: "m-1", user_id: "u1", amount_cents: 100, pix_key: "a@b.com" },
      { external_id: "m-2", user_id: "u2", amount_cents: 200, pix_key: "c@d.com" },
    ]);
    const report = await processBatch(second);

    expect(report.processed).toBe(2);
    expect(report.duplicates).toBe(1);
    expect(report.successful + report.failed).toBe(1);
  });

  it("should handle empty batch", async () => {
    const report = await processBatch(makeBatch([]));

    expect(report.processed).toBe(0);
    expect(report.successful).toBe(0);
    expect(report.failed).toBe(0);
    expect(report.duplicates).toBe(0);
    expect(report.details).toHaveLength(0);
  });

  it("should preserve amount_cents in results", async () => {
    const batch = makeBatch([
      { external_id: "amt-1", user_id: "u1", amount_cents: 99999, pix_key: "x@y.com" },
    ]);

    const report = await processBatch(batch);
    expect(report.details[0].amount_cents).toBe(99999);
  });
});
