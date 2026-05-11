import { defineConfig } from 'vite';
import { tzadikVite } from '@tzadik/vite';

export default defineConfig({
  plugins: [
    tzadikVite({
      config: {
        appName: 'vite-basic',
        metrics: true,
        scheduler: true,
        navigation: {
          prefetch: true,
          strategy: 'balanced',
          ignore: ['/logout', '/checkout', '/api/*'],
        },
        budgets: {
          jsKb: 180,
          cssKb: 80,
        },
        devtools: {
          consoleHints: true,
        },
      },
    }),
  ],
});
