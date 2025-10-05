import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["submissions/igorpardinho/pix/tests/**/*.spec.ts"],
  },
});