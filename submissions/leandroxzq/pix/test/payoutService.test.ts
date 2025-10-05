import { describe, it, expect } from "vitest";
import { processBatchPayment } from "../src/service/payoutService.js";

describe("processBatchPayment (sem mock)", () => {
  it("deve marcar item como duplicado quando já existe no banco", async () => {
    const batch_id = "batch-teste";

    const primeiroItem = {
      external_id: "abc123",
      user_id: "1",
      pix_key: "teste@pix.com",
      amount_cents: 5000,
    };

    await processBatchPayment(batch_id, [primeiroItem]);

    const result = await processBatchPayment(batch_id, [primeiroItem]);

    expect(result.duplicates).toBe(1);
    expect(result.details[0].status).toBe("duplicate");
    expect(result.details[0].external_id).toBe("abc123");
  });
});
