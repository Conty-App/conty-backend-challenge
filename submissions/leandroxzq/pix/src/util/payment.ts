export function simulatePayment(item: any): Promise<string> {
  return new Promise((resolve) => {
    const delay = Math.floor(Math.random() * 400) + 100;

    setTimeout(() => {
      const success = Math.random() < 0.8;
      if (success) resolve("paid");
      else resolve("failed");
    }, delay);
  });
}
