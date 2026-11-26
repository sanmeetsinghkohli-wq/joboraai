import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./apps/web/src', import.meta.url)) },
  },
  test: {
    include: ['apps/web/src/**/*.test.ts'],
    environment: 'node',
    // career-ops' checker is a Node script with a #! line; let Node load it as-is.
    server: { deps: { external: [/career-ops[\\/]verify-ats\.mjs$/] } },
    env: {
      TOKEN_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      JWT_SECRET: 'test-only-secret',
    },
  },
});
