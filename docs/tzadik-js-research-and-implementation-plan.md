# tzadik.js — Research Analysis + Cursor Implementation Plan

> Product idea: a framework-agnostic JavaScript/TypeScript performance library that improves perceived speed, protects the main thread, measures real-user performance, and optionally integrates with build tools/frameworks.

---

## 1. Executive Summary

`tzadik.js` should **not** be positioned as a magic library that makes every React/Vue/Svelte/Angular app automatically fast. That claim would be technically false.

The realistic and strong positioning is:

> **tzadik.js is a framework-agnostic performance operating layer for web apps. It measures real user performance, protects the main thread, delays non-critical work, optimizes third-party scripts, predicts likely navigation, and gives developers actionable fixes.**

The opportunity is not to invent one completely new primitive. The opportunity is to combine several proven performance patterns into one clean, safe, DX-friendly library:

- Real User Monitoring (RUM) for Core Web Vitals.
- Main-thread long-task detection and scheduling helpers.
- Third-party script deferral and optional worker offloading.
- Smart prefetch / prerender rules.
- Lazy hydration / lazy activation helpers where possible.
- Performance budgets and regression reports.
- Framework adapters only where needed.
- A developer dashboard that shows exactly what is hurting the app.

The key product gap: existing tools are fragmented. Developers currently need separate tools for Web Vitals, third-party script control, prefetching, Lighthouse auditing, performance budgets, and framework-specific loading strategies. `tzadik.js` can become the unified layer.

---

## 2. What Already Exists

### 2.1 Measurement / RUM Libraries

#### `web-vitals`
Official Google library for measuring Web Vitals in real users. It is tiny and modular. It measures metrics in a way that matches Chrome and Google tooling.

Relevant source:
- https://github.com/GoogleChrome/web-vitals

What it does well:
- LCP, CLS, INP, FCP, TTFB.
- Attribution builds for identifying causes.
- Very small footprint.
- Trusted source.

What it does not do:
- It does not fix performance.
- It does not schedule work.
- It does not optimize third-party scripts.
- It does not provide a full dashboard by itself.

#### Perfume.js

Perfume.js is a small web performance monitoring library with support for Performance APIs, Web Vitals scoring, analytics reporting, and idle callback strategies.

Relevant sources:
- https://github.com/Zizzamia/perfume.js
- https://zizzamia.github.io/perfume/

What it does well:
- Good RUM abstraction.
- Flexible analytics endpoint.
- Small size.
- User timing and action tracking.

What it does not do:
- No automatic runtime optimization.
- No build optimization.
- No third-party script control comparable to Partytown/Nuxt Scripts.
- No opinionated performance operating layer.

---

### 2.2 Third-Party Script Optimization

#### Partytown

Partytown moves resource-intensive third-party scripts into a Web Worker to reduce main-thread pressure.

Relevant sources:
- https://partytown.qwik.dev/
- https://github.com/QwikDev/partytown
- https://partytown.qwik.dev/how-does-partytown-work/

What it does well:
- Worker-based third-party script execution.
- Keeps main thread more available.
- Innovative proxying model.

Limitations:
- It is still not guaranteed to work for every third-party script.
- Scripts usually need opt-in configuration.
- DOM-heavy scripts may have compatibility issues.
- The developer still needs to understand which scripts are safe to move.

#### Next.js Script

Next.js has a framework-specific `<Script>` component with strategies such as `afterInteractive`, `lazyOnload`, and experimental worker loading.

Relevant sources:
- https://nextjs.org/docs/pages/api-reference/components/script
- https://nextjs.org/docs/pages/guides/scripts
- https://developer.chrome.com/blog/script-component

What it does well:
- Great DX inside Next.js.
- Provides safe loading strategies.
- Reduces impact of third-party scripts.

Limitations:
- Next.js-only.
- Does not help raw Vite, SvelteKit, Vue, Astro, Laravel, WordPress, etc.
- Does not provide a universal dashboard or cross-framework optimizer.

#### Nuxt Scripts

Nuxt Scripts improves performance, privacy, security, and DX for third-party scripts in Nuxt apps.

Relevant sources:
- https://scripts.nuxt.com/
- https://scripts.nuxt.com/docs/getting-started
- https://nuxt.com/blog/nuxt-scripts

What it does well:
- Strong Nuxt-specific third-party script registry.
- Trigger-based loading.
- Privacy-focused features.
- Better DX.

Limitations:
- Nuxt-only.
- Not a generic performance layer.

---

### 2.3 Prefetching / Predictive Navigation

#### Quicklink

Quicklink prefetches links visible in the viewport during idle time.

Relevant sources:
- https://getquick.link/
- https://github.com/GoogleChromeLabs/quicklink
- https://web.dev/articles/quicklink

What it does well:
- Very small.
- Works across sites.
- Great for improving perceived navigation speed.
- Simple drop-in behavior.

Limitations:
- Mostly viewport-based.
- Can waste bandwidth if too aggressive.
- Does not include full RUM feedback loop.

#### Guess.js

Guess.js uses analytics data to predict likely next pages and prefetch resources.

Relevant sources:
- https://guess-js.github.io/docs/
- https://web.dev/articles/predictive-prefetching
- https://blog.mgechev.com/2018/05/09/introducing-guess-js-data-driven-user-experiences-web/

What it does well:
- Data-driven predictive prefetching.
- Can use analytics patterns.
- More intelligent than simple viewport prefetching.

Limitations:
- Requires analytics/data setup.
- Not commonly integrated into modern everyday frontend workflows.
- Does not optimize third-party scripts or runtime task scheduling.

#### Speculation Rules API

Modern browser API for prefetching/prerendering future navigations.

Relevant sources:
- https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API
- https://developer.chrome.com/docs/web-platform/implementing-speculation-rules
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/speculationrules

What it does well:
- Browser-native future-navigation optimization.
- Supports prefetch and prerender.
- Good fit for MPAs and document navigation.

Limitations:
- Browser support is not universal.
- Needs safety rules.
- Can waste bandwidth or cause side effects if misused.

---

### 2.4 Main Thread Scheduling / INP Optimization

Modern Core Web Vitals now focus strongly on INP. INP replaced FID as a Core Web Vital in March 2024.

Relevant sources:
- https://web.dev/blog/inp-cwv-march-12
- https://web.dev/blog/inp-cwv-launch
- https://web.dev/articles/inp
- https://web.dev/articles/optimize-long-tasks
- https://web.dev/articles/top-cwv

Known best practices:
- Break up long tasks.
- Yield to the main thread.
- Avoid unnecessary JavaScript.
- Avoid large rendering updates.
- Move suitable work to Web Workers.

#### Scheduler API

The browser Scheduler API includes `scheduler.postTask()` and `scheduler.yield()`, but support is still limited.

Relevant sources:
- https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask
- https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield
- https://developer.chrome.com/blog/use-scheduler-yield
- https://wicg.github.io/scheduling-apis/

Opportunity:
`tzadik.js` can expose a safe scheduler wrapper:

```ts
await tzadik.yield();
tzadik.task(() => expensiveWork(), { priority: 'background' });
tzadik.chunk(items, async (item) => process(item), { budgetMs: 8 });
```

This should feature-detect modern APIs and fall back to safe alternatives.

---

### 2.5 Lab Auditing / Budgets

#### Lighthouse CI

Lighthouse CI can run audits in CI/CD and enforce budgets.

Relevant sources:
- https://googlechrome.github.io/lighthouse-ci/docs/configuration.html
- https://web.dev/articles/use-lighthouse-for-performance-budgets
- https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Performance_budgets

What it does well:
- CI regression protection.
- Lab metrics.
- Performance budgets.

Limitations:
- Lab-only by default.
- Not a runtime optimizer.
- Requires separate configuration.

#### Unlighthouse

Unlighthouse runs Lighthouse across many pages and creates a unified performance report.

Relevant sources:
- https://unlighthouse.dev/
- https://unlighthouse.dev/guide/recipes/large-sites
- https://unlighthouse.dev/learn-lighthouse/lighthouse-ci/budgets

What it does well:
- Site-wide scanning.
- Parallel crawling.
- Useful reports.

Limitations:
- Lab scanner, not runtime performance layer.
- Does not change application behavior.

---

### 2.6 Framework-Level Approaches

#### Qwik

Qwik uses resumability to avoid traditional hydration.

Relevant sources:
- https://qwik.dev/docs/concepts/resumable/
- https://qwik.dev/

What it does well:
- Very strong architecture for instant interactivity.
- Avoids hydration cost by design.

Limitation for `tzadik.js`:
- This is framework-level architecture. A generic library cannot fully reproduce Qwik-style resumability inside React/Vue/Svelte without framework/compiler control.

#### Astro

Astro uses islands architecture and partial hydration.

Relevant source:
- https://docs.astro.build/en/concepts/islands/

What it does well:
- Ships less JS by default.
- Hydrates only interactive islands.

Limitation for `tzadik.js`:
- Generic `tzadik.js` can imitate lazy activation patterns but cannot automatically convert arbitrary apps into island architecture.

---

## 3. Market Gap

Existing tools are powerful but fragmented:

| Need | Existing Tools | Gap |
|---|---|---|
| Measure real user performance | web-vitals, Perfume.js | Mostly measurement only |
| Optimize third-party scripts | Partytown, Next Script, Nuxt Scripts | Either worker-only or framework-specific |
| Prefetch navigation | Quicklink, Guess.js, Speculation Rules | Usually separate from RUM and scheduling |
| Protect INP / main thread | Manual scheduler patterns | No simple universal DX layer |
| CI performance budgets | Lighthouse CI, Unlighthouse | Lab-only, not connected to runtime insights |
| Framework optimization | Next/Nuxt/Astro/Qwik | Not cross-framework |

`tzadik.js` can win by being:

1. **Framework-agnostic first.**
2. **Runtime + build-time optional.**
3. **Safe by default.**
4. **Opinionated but configurable.**
5. **Focused on INP, LCP, CLS, third-party bloat, and perceived navigation speed.**
6. **Developer-friendly: one install, one config, useful report.**

---

## 4. What `tzadik.js` Can Realistically Make Better

### 4.1 Unified Performance Runtime

One runtime that includes:

- Core Web Vitals measurement.
- Long-task detection.
- Script loading control.
- Main-thread yielding helpers.
- Idle task scheduling.
- Link prefetch/prerender strategy.
- Resource hints.
- Error-safe reporting.
- Debug overlay in development.

### 4.2 Automatic Third-Party Script Governance

Instead of telling developers:

> “Use Partytown, or next/script, or Nuxt Scripts, or manual defer.”

`tzadik.js` can provide:

```ts
tzadik.scripts.register({
  id: 'gtm',
  src: 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX',
  strategy: 'after-interaction',
  category: 'analytics',
  consent: 'analytics',
  worker: 'try',
});
```

Strategies:

- `critical`
- `afterInteractive`
- `idle`
- `visible`
- `onInteraction`
- `onConsent`
- `worker`
- `worker-try-main-fallback`

Better than existing tools because:
- Framework agnostic.
- Has compatibility scoring.
- Can report script cost.
- Can fall back safely.
- Can integrate with consent.

### 4.3 INP Guard

A runtime tool focused specifically on responsiveness:

```ts
tzadik.inpGuard.enable({
  longTaskThreshold: 50,
  autoYield: true,
  warnInDev: true,
});
```

It cannot automatically rewrite all framework render work, but it can:
- Detect long tasks.
- Wrap developer-declared work.
- Provide chunking helpers.
- Delay non-critical scripts during interaction.
- Pause background work while the user is typing/clicking.
- Warn about heavy event handlers.

### 4.4 Smart Navigation Layer

Combine several levels:

1. Basic viewport prefetch like Quicklink.
2. Intent prefetch on hover/touchstart.
3. Route prediction from local session behavior.
4. Optional server-fed popularity map.
5. Speculation Rules where supported.
6. Network-aware throttling.

Example:

```ts
tzadik.navigation.enable({
  mode: 'balanced',
  prefetch: true,
  prerender: 'safe',
  maxConcurrent: 2,
  respectSaveData: true,
});
```

### 4.5 Build-Time Plugin

Runtime alone is limited. A Vite plugin gives much more power:

```ts
// vite.config.ts
import { tzadikVite } from '@tzadik/vite';

export default {
  plugins: [
    tzadikVite({
      budgets: {
        jsKb: 180,
        cssKb: 80,
        lcpMs: 2500,
        inpMs: 200,
      },
      analyze: true,
    }),
  ],
};
```

The plugin can:
- Analyze bundles.
- Warn about huge dependencies.
- Generate a route manifest.
- Inject runtime config.
- Generate speculation rules.
- Enforce budgets.
- Create a local dashboard.

### 4.6 Developer Dashboard

`tzadik.js` should include a local dashboard:

```bash
npx tzadik dev
npx tzadik analyze
npx tzadik report
```

Dashboard sections:
- Core Web Vitals.
- Long tasks by route.
- Worst third-party scripts.
- Bundle size by route.
- LCP element candidates.
- CLS sources.
- INP interaction sources.
- Prefetch hit/miss rate.
- Budget failures.
- Recommendations.

This dashboard is what makes the product feel complete.

---

## 5. What Does Not Yet Exist Clearly Enough

The unique product angle:

> **A universal performance governance layer that connects runtime RUM, third-party loading, main-thread scheduling, navigation prediction, and build budgets into one framework-agnostic package.**

Specific gaps to build:

### Gap 1 — Framework-Agnostic Script Strategy Registry

Next and Nuxt have good framework-specific solutions. Partytown has worker offloading. But there is room for a generic library that gives every app script strategies, consent triggers, idle triggers, worker fallback, and cost reporting.

### Gap 2 — INP-First Runtime Scheduler API

Developers know they should break long tasks, but most apps do not have a clean shared utility for it. `tzadik.js` can provide a standard API with modern feature detection.

### Gap 3 — RUM Feedback Loop Into Optimization

Most measurement libraries only report. `tzadik.js` should use collected data to suggest or apply config changes:
- “This script causes long tasks on 42% of visits. Move to idle.”
- “This route has high INP after search input. Wrap filtering in `tzadik.chunk()`.”
- “This link is prefetched often but clicked rarely. Reduce eagerness.”

### Gap 4 — One Config for Runtime + Build + CI

A `tzadik.config.ts` file can control:
- Runtime behavior.
- Script loading.
- Navigation hints.
- Budgets.
- Reporting endpoint.
- Framework adapter.
- Dashboard options.

### Gap 5 — Performance Debug Overlay

A developer overlay can show:
- Current route metrics.
- Long tasks in real time.
- Cost of each script.
- Resource waterfall warnings.
- Layout shift source.
- “Why is this page slow?” summary.

This is more useful than raw metrics.

---

## 6. Hard Technical Truths

### 6.1 A Single File Cannot Magically Optimize Everything

A runtime-only script cannot:
- Remove already-downloaded JS.
- Tree-shake dependencies.
- Change React/Vue/Svelte internals.
- Convert hydration to resumability.
- Guarantee all third-party scripts work in workers.
- Fix server TTFB.
- Optimize images already served incorrectly.
- Prevent all layout shifts without knowing layout.

### 6.2 The Real Power Requires Three Layers

1. **Runtime package**
   - Works everywhere.
   - Measures and controls browser behavior.

2. **Build plugin**
   - Vite first.
   - Later Rollup/Webpack/esbuild.
   - Analyzes and injects optimizations.

3. **Framework adapters**
   - SvelteKit, Next.js, Nuxt, Astro, React Router, Vue Router.
   - Small adapters, not a framework.

---

## 7. Recommended Architecture

```txt
tzadik/
  packages/
    core/
      src/
        index.ts
        init.ts
        config.ts
        metrics/
          webVitals.ts
          longTasks.ts
          resources.ts
          navigation.ts
          attribution.ts
        scheduler/
          yield.ts
          task.ts
          chunk.ts
          idle.ts
        scripts/
          registry.ts
          loader.ts
          strategies.ts
          workerBridge.ts
          consent.ts
        navigation/
          prefetch.ts
          speculationRules.ts
          intent.ts
          prediction.ts
        resources/
          hints.ts
          images.ts
          fonts.ts
        reporting/
          beacon.ts
          queue.ts
          endpoint.ts
        devtools/
          overlay.ts
          logger.ts
    vite/
      src/
        plugin.ts
        bundleAnalyzer.ts
        routeManifest.ts
        budgetCheck.ts
        injectRuntime.ts
    cli/
      src/
        commands/
          init.ts
          dev.ts
          analyze.ts
          report.ts
    dashboard/
      src/
        app/
        components/
        charts/
    adapters/
      sveltekit/
      next/
      nuxt/
      astro/
      react-router/
```

---

## 8. Core API Design

### 8.1 Basic Usage

```ts
import { tzadik } from '@tzadik/core';

tzadik.init({
  appName: 'my-app',
  mode: 'auto',
  metrics: true,
  scheduler: true,
  scripts: true,
  navigation: true,
  reportTo: '/api/tzadik',
});
```

### 8.2 Config File

```ts
// tzadik.config.ts
import { definetzadikConfig } from '@tzadik/core';

export default definetzadikConfig({
  app: {
    name: 'my-app',
    environment: process.env.NODE_ENV,
  },

  metrics: {
    webVitals: true,
    longTasks: true,
    resources: true,
    attribution: true,
    sampleRate: 1,
  },

  scheduler: {
    enabled: true,
    defaultPriority: 'user-visible',
    autoYield: false,
    longTaskBudgetMs: 50,
  },

  scripts: {
    defaultStrategy: 'idle',
    consentMode: true,
    registry: [
      {
        id: 'gtm',
        src: 'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX',
        category: 'analytics',
        strategy: 'after-interaction',
        worker: 'try',
      },
    ],
  },

  navigation: {
    prefetch: true,
    speculationRules: true,
    strategy: 'balanced',
    maxConcurrent: 2,
    respectSaveData: true,
    ignore: ['/logout', '/checkout', '/api/*'],
  },

  budgets: {
    jsKb: 180,
    cssKb: 80,
    lcpMs: 2500,
    inpMs: 200,
    cls: 0.1,
  },

  reporting: {
    endpoint: '/api/tzadik/rum',
    batch: true,
    flushOnHidden: true,
  },

  devtools: {
    overlay: true,
    consoleHints: true,
  },
});
```

---

## 9. Runtime Modules

### 9.1 Metrics Module

Use:
- `PerformanceObserver`.
- `web-vitals`.
- Resource Timing API.
- Navigation Timing API.
- Long Task API where available.
- Event Timing for interaction attribution where available.

Output event shape:

```ts
type tzadikMetric = {
  name: 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB' | 'LONG_TASK' | 'RESOURCE';
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  route: string;
  timestamp: number;
  attribution?: Record<string, unknown>;
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
  device?: {
    memory?: number;
    cores?: number;
  };
};
```

### 9.2 Scheduler Module

Implement:

```ts
export async function yieldToMain(): Promise<void> {
  if ('scheduler' in globalThis && 'yield' in (globalThis as any).scheduler) {
    await (globalThis as any).scheduler.yield();
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}
```

Task API:

```ts
tzadik.task(callback, {
  priority: 'user-blocking' | 'user-visible' | 'background',
  delay?: number,
  signal?: AbortSignal,
});
```

Chunk API:

```ts
await tzadik.chunk(items, async (item) => {
  process(item);
}, {
  budgetMs: 8,
  priority: 'background',
});
```

### 9.3 Scripts Module

Script lifecycle:
1. Register script.
2. Wait for trigger.
3. Check consent if needed.
4. Decide strategy.
5. Try worker if enabled and compatible.
6. Fallback to main thread if needed.
7. Measure load and long-task impact.
8. Report script cost.

Script strategies:

```ts
type ScriptStrategy =
  | 'critical'
  | 'after-interactive'
  | 'idle'
  | 'visible'
  | 'interaction'
  | 'consent'
  | 'worker'
  | 'worker-try-main-fallback';
```

### 9.4 Navigation Module

Capabilities:
- Link viewport detection.
- Hover/touch intent.
- Idle prefetch.
- Speculation Rules injection.
- Network-aware throttling.
- Route denylist.
- Max concurrency.
- Prefetch hit-rate reporting.

Pseudo API:

```ts
tzadik.navigation.prefetch('/pricing');

tzadik.navigation.enable({
  strategy: 'balanced',
  prerender: false,
  speculationRules: true,
});
```

### 9.5 Dev Overlay

Show in dev:
- LCP / INP / CLS.
- Long tasks.
- Script cost.
- Resource warnings.
- Prefetch activity.
- Suggestions.

---

## 10. Vite Plugin

### Goals

The Vite plugin should:
- Read `tzadik.config.ts`.
- Inject the runtime.
- Build a route/resource manifest.
- Analyze bundle size.
- Warn about large dependencies.
- Generate dashboard data.
- Enforce budgets.

Example:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tzadikVite } from '@tzadik/vite';

export default defineConfig({
  plugins: [
    tzadikVite({
      config: './tzadik.config.ts',
    }),
  ],
});
```

Implementation steps:
1. Create plugin with `configResolved`, `transformIndexHtml`, `generateBundle`.
2. Inject runtime script into HTML.
3. Emit `tzadik-manifest.json`.
4. Inspect generated chunks.
5. Compare with budgets.
6. Print terminal report.
7. Optionally fail build on budget violation.

---

## 11. CLI

Commands:

```bash
npx tzadik init
npx tzadik dev
npx tzadik analyze
npx tzadik report
```

### `tzadik init`
Creates:
- `tzadik.config.ts`
- Example Vite plugin setup
- Example reporting endpoint
- Example script registry

### `tzadik dev`
Starts local dashboard:
- Reads dev RUM events.
- Shows live overlay.
- Shows recommendations.

### `tzadik analyze`
Runs bundle analysis and optional Lighthouse/Unlighthouse integration.

### `tzadik report`
Generates static HTML/JSON report.

---

## 12. Backend / Reporting Endpoint

For MVP, do not build a full SaaS. Provide a simple endpoint contract.

Request:

```json
{
  "app": "my-app",
  "sessionId": "anon-id",
  "route": "/pricing",
  "metrics": [
    {
      "name": "INP",
      "value": 180,
      "rating": "good",
      "timestamp": 1710000000000
    }
  ]
}
```

Storage options:
- Local JSON during dev.
- SQLite for self-hosted dashboard.
- Postgres later.
- User can forward to analytics providers.

MVP server package:

```txt
@tzadik/server
  sqlite adapter
  express middleware
  hono middleware
  sveltekit endpoint helper
  next route handler helper
```

---

## 13. MVP Scope

### v0.1 — Realistic First Release

Must include:
- `@tzadik/core`
- Web Vitals metrics using `web-vitals`
- Long-task observer
- Scheduler helpers: `yield`, `task`, `chunk`, `idle`
- Script loader with `idle`, `interaction`, `consent`, `visible`
- Basic prefetcher
- Dev console hints
- Vite plugin MVP
- `tzadik.config.ts`
- Markdown/HTML report

Do not include yet:
- Full worker bridge clone of Partytown.
- Full SaaS dashboard.
- Complex ML predictions.
- Framework adapters for every ecosystem.
- Automatic code rewriting.

### v0.2

Add:
- Speculation Rules support.
- Script cost attribution.
- Dev overlay UI.
- Better route manifest.
- Budget fail/warn modes.
- SvelteKit adapter.

### v0.3

Add:
- Next/Nuxt/Astro adapters.
- Worker experimental mode.
- Consent integrations.
- SQLite dashboard.
- Prefetch hit-rate learning.

### v1.0

Add:
- Stable APIs.
- Full docs.
- Compatibility table.
- Plugin ecosystem.
- Production dashboard.
- Hosted optional SaaS.

---

## 14. Cursor Implementation Prompt

Use this prompt in Cursor:

```md
You are building `tzadik.js`, a framework-agnostic TypeScript performance library.

Goal:
Create a monorepo with a runtime package, Vite plugin, CLI, and basic local dashboard/reporting. The library must not claim magic performance. It should provide real web performance tools: Web Vitals measurement, long-task detection, scheduler helpers, third-party script loading strategies, smart prefetching, and build-time budget reporting.

Tech:
- TypeScript
- pnpm workspaces
- tsup for package builds
- Vite for examples/dashboard
- Vitest for tests
- ESLint + Prettier
- No heavy runtime dependencies except `web-vitals`

Create this structure:

packages/
  core/
  vite/
  cli/
  server/
  dashboard/
examples/
  vite-basic/
docs/

Implement first:
1. `packages/core`
   - `tzadik.init(config)`
   - metrics module using `web-vitals`
   - long task observer
   - resource timing observer
   - scheduler module with `yieldToMain`, `task`, `chunk`, `idle`
   - script registry/loader with strategies: `critical`, `after-interactive`, `idle`, `interaction`, `visible`, `consent`
   - navigation prefetch module
   - reporting queue using `navigator.sendBeacon` with fetch fallback
   - dev logger

2. `packages/vite`
   - Vite plugin called `tzadikVite`
   - read config
   - inject runtime into HTML
   - inspect generated chunks in `generateBundle`
   - compare with budgets
   - emit `tzadik-manifest.json`
   - print terminal report

3. `packages/cli`
   - commands: `init`, `analyze`, `report`
   - `init` creates `tzadik.config.ts`
   - `report` reads manifest and outputs `tzadik-report.html`

4. `examples/vite-basic`
   - demo app with heavy task example
   - third-party script example
   - prefetch example
   - dashboard/report example

Important behavior:
- Feature-detect browser APIs.
- Never break the app if an optimization fails.
- Default to safe mode.
- Respect `navigator.connection.saveData`.
- Avoid prefetching logout, checkout, auth, API, or destructive URLs.
- Keep runtime small.
- Add tests for scheduler, config parsing, script strategy timing, and budget checks.

Public API example:

```ts
import { tzadik } from '@tzadik/core';

tzadik.init({
  appName: 'demo',
  metrics: true,
  scheduler: true,
  scripts: {
    defaultStrategy: 'idle',
    registry: [
      {
        id: 'analytics',
        src: 'https://example.com/analytics.js',
        strategy: 'interaction',
        category: 'analytics'
      }
    ]
  },
  navigation: {
    prefetch: true,
    strategy: 'balanced',
    ignore: ['/logout', '/checkout', '/api/*']
  },
  reporting: {
    endpoint: '/api/tzadik'
  }
});
```

Acceptance criteria:
- `pnpm build` works.
- `pnpm test` works.
- Example app runs.
- Runtime can be imported in a plain TypeScript app.
- Vite plugin injects runtime.
- Report is generated.
- No framework lock-in.
```

---

## 15. Naming / Brand

`tzadik.js` can work as a name. It feels memorable and has meaning: a “righteous” helper that protects the page from bad performance.

Possible tagline:

> **tzadik.js — the righteous performance layer for modern web apps.**

Alternative tagline:

> **Make any web app behave better under pressure.**

---

## 16. Final Recommendation

Build `tzadik.js` as:

1. **A small runtime first.**
2. **A Vite plugin second.**
3. **A dashboard/report third.**
4. **Framework adapters later.**

The killer feature should be:

> “Install once and see exactly what hurts your page, then let `tzadik.js` safely delay, schedule, prefetch, and report.”

Do not compete directly with React, SvelteKit, Next.js, Nuxt, Astro, or Qwik.

Compete with the pain of fragmented performance tooling.
