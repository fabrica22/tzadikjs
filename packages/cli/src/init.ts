import { access, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEFAULT_CONFIG = `import { defineTzadikConfig } from '@tzadik/core';

export default defineTzadikConfig({
  appName: 'my-app',
  metrics: {
    webVitals: true,
    longTasks: true,
    resources: false,
  },
  scheduler: true,
  scripts: {
    defaultStrategy: 'idle',
    registry: [],
  },
  navigation: {
    prefetch: true,
    strategy: 'balanced',
    ignore: ['/logout', '/checkout', '/auth/*', '/api/*'],
  },
  budgets: {
    jsKb: 180,
    cssKb: 80,
    lcpMs: 2500,
    inpMs: 200,
    cls: 0.1,
  },
  reporting: {
    endpoint: '/api/tzadik',
  },
  devtools: {
    consoleHints: true,
  },
});
`;

export async function initProject(path = 'tzadik.config.ts'): Promise<string> {
  const target = resolve(path);

  try {
    await access(target);
    return target;
  } catch {
    await writeFile(target, DEFAULT_CONFIG);
    return target;
  }
}
