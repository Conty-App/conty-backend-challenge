import { PayoutItem } from "../types/payout";

export async function simulatePixPayment(item: PayoutItem): Promise<boolean> {
  return new Promise((resolve) => {
    const delay = Math.random() * 1000 + 300;
    setTimeout(() => {
      const isSuccess = Math.random() < 0.9;
      resolve(isSuccess);
    }, delay);
  });
}