import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/server.ts',
      formats: ['es'],
      fileName: 'server',
    },
    rollupOptions: {
      external: ['express', 'cors', 'dotenv', 'drizzle-orm', 'better-sqlite3'],
    },
  },
});
