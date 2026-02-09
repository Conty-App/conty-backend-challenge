const SUCCESS_RATE = 0.7;
const MIN_DELAY_MS = 50;
const MAX_DELAY_MS = 200;
const TIMEOUT_MS = 5000;

export async function simulatePixPayment(): Promise<boolean> {
  const delay =
    Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) +
    MIN_DELAY_MS;

  const payment = new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(Math.random() < SUCCESS_RATE), delay);
  });

  const timeout = new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(false), TIMEOUT_MS);
  });

  return Promise.race([payment, timeout]);
}
