import type { PaymentResult } from "../types/payout.types";

const store = new Map<string, PaymentResult>();

export const paymentStore = {
  has: (externalId: string): boolean => store.has(externalId),
  get: (externalId: string): PaymentResult | undefined => store.get(externalId),
  set: (externalId: string, result: PaymentResult): void => {
    store.set(externalId, result);
  },
  clear: (): void => store.clear(),
};
