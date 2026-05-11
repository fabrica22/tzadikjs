<p align="center">
  <img src="./logoz.png" alt="tzadik.js logo" width="700">
</p>

<h1 align="center">tzadik.js</h1>

<p align="center">
  A framework-agnostic JavaScript performance layer for measuring real-user speed, protecting the main thread, governing third-party scripts, and enforcing build budgets.
</p>

<p align="center">
  <a href="./LICENSE">MIT License</a>
</p>

---

## Why tzadik.js?

Modern web performance work is fragmented. Teams often combine Web Vitals reporting, custom idle scheduling, third-party script loading rules, prefetch libraries, Lighthouse budgets, and framework-specific plugins by hand.

`tzadik.js` brings those concerns into one small, explicit toolkit:

- Real-user performance metrics with Web Vitals support.
- Long-task and resource observation.
- Main-thread scheduling helpers for expensive work.
- Third-party script loading strategies.
- Navigation prefetching with conservative defaults.
- Vite build integration with bundle manifests and budget checks.
- CLI report generation for local and CI workflows.

It does not claim to magically make every app fast. It gives developers practical runtime and build-time controls that make performance problems visible and easier to fix.

## Packages

| Package | Purpose |
|---|---|
| `@tzadik/core` | Browser runtime: metrics, scheduler, script loading, prefetching, reporting |
| `@tzadik/vite` | Vite plugin for runtime injection, manifest generation, and budget checks |
| `tzadik` | CLI for project initialization and report generation |
| `@tzadik/server` | Lightweight helpers for receiving RUM payloads |
| `@tzadik/dashboard` | Local dashboard placeholder for future RUM and manifest views |

## Installation

```bash
pnpm add @tzadik/core
```

For Vite projects:

```bash
pnpm add @tzadik/core @tzadik/vite
```

For CLI usage:

```bash
pnpm add -D tzadik
```

## Runtime Usage

```ts
import { tzadik } from '@tzadik/core';

tzadik.init({
  appName: 'my-app',
  metrics: true,
  scheduler: true,
  scripts: {
    defaultStrategy: 'idle',
    registry: [
      {
        id: 'analytics',
        src: 'https://example.com/analytics.js',
        strategy: 'interaction',
        category: 'analytics',
      },
    ],
  },
  navigation: {
    prefetch: true,
    strategy: 'balanced',
    ignore: ['/logout', '/checkout', '/api/*'],
  },
  reporting: {
    endpoint: '/api/tzadik',
  },
  devtools: {
    consoleHints: true,
  },
});
```

## Scheduler Helpers

Use scheduler helpers to split expensive work and keep interactions responsive.

```ts
import { tzadik } from '@tzadik/core';

await tzadik.yieldToMain();

await tzadik.task(() => {
  expensiveWork();
}, { priority: 'background' });

await tzadik.chunk(items, async (item) => {
  processItem(item);
}, { budgetMs: 8 });
```

## Script Loading

Register third-party scripts with explicit loading strategies.

```ts
tzadik.init({
  scripts: {
    defaultStrategy: 'idle',
    registry: [
      {
        id: 'gtm',
        src: 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX',
        strategy: 'interaction',
        category: 'analytics',
      },
    ],
  },
});
```

Supported initial strategies:

- `critical`
- `after-interactive`
- `idle`
- `interaction`
- `visible`
- `consent`
- `worker`
- `worker-try-main-fallback`

Worker strategies are currently reserved for compatibility-focused future work and fall back safely.

## Vite Plugin

```ts
import { defineConfig } from 'vite';
import { tzadikVite } from '@tzadik/vite';

export default defineConfig({
  plugins: [
    tzadikVite({
      config: {
        appName: 'my-app',
        budgets: {
          jsKb: 180,
          cssKb: 80,
        },
      },
      failOnBudget: false,
    }),
  ],
});
```

The plugin currently:

- Injects the runtime into HTML.
- Emits `tzadik-manifest.json`.
- Calculates JS/CSS totals.
- Warns or fails on budget violations.

## CLI

```bash
npx tzadik init
npx tzadik analyze
npx tzadik report dist/tzadik-manifest.json tzadik-report.html
```

Commands:

| Command | Description |
|---|---|
| `init` | Creates `tzadik.config.ts` |
| `analyze` | Prints analysis workflow guidance |
| `report` | Generates a static HTML report from a manifest |

## Reporting Endpoint

Runtime reports use this payload shape:

```ts
type tzadikReportPayload = {
  app: string;
  sessionId: string;
  route: string;
  metrics: tzadikMetric[];
};
```

`@tzadik/server` includes helpers for validating payloads and storing them in memory during development.

## Example App

This repository includes a Vite example:

```bash
pnpm install
pnpm --filter @tzadik/example-vite-basic dev
```

Build it with:

```bash
pnpm --filter @tzadik/example-vite-basic build
```

Generate a report:

```bash
node packages/cli/dist/index.js report examples/vite-basic/dist/tzadik-manifest.json examples/vite-basic/tzadik-report.html
```

## Development

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Useful scripts:

| Script | Description |
|---|---|
| `pnpm typecheck` | Type-check all package workspaces |
| `pnpm test` | Run Vitest tests |
| `pnpm build` | Build library packages and dashboard |
| `pnpm dev:example` | Start the Vite example app |

## Current Status

`tzadik.js` is in early MVP development. The first implementation focuses on a small, safe runtime plus Vite budget reporting. The roadmap includes deeper script attribution, a full dev overlay, speculation rules support, framework adapters, and a local dashboard.

## License

MIT. See [LICENSE](./LICENSE).
