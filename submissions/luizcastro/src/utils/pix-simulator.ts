const SUCCESS_RATE = 0.9;
const MIN_DELAY_MS = 50;
const MAX_DELAY_MS = 200;

export async function simulatePixPayment(): Promise<boolean> {
  const delay = Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
  await new Promise((resolve) => setTimeout(resolve, delay));
  return Math.random() < SUCCESS_RATE;
}
