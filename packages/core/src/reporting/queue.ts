import type { NormalizedTzadikConfig, TzadikMetric, TzadikReportPayload } from '../config.js';
import { currentRoute, isBrowser } from '../env.js';

export type Reporter = {
  push(metric: TzadikMetric): void;
  flush(): Promise<void>;
  snapshot(): TzadikMetric[];
};

export function createReporter(config: NormalizedTzadikConfig): Reporter {
  const queue: TzadikMetric[] = [];
  let flushing = false;

  const flush = async (): Promise<void> => {
    if (!config.reporting.endpoint || flushing || queue.length === 0) {
      return;
    }

    flushing = true;
    const metrics = queue.splice(0, queue.length);
    const payload: TzadikReportPayload = {
      app: config.appName,
      sessionId: config.reporting.sessionId,
      route: currentRoute(),
      metrics,
    };

    try {
      const body = JSON.stringify(payload);
      if (isBrowser() && typeof navigator.sendBeacon === 'function') {
        const sent = navigator.sendBeacon(config.reporting.endpoint, new Blob([body], { type: 'application/json' }));
        if (sent) {
          return;
        }
      }

      if (typeof fetch === 'function') {
        await fetch(config.reporting.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
          keepalive: true,
        });
      }
    } catch {
      queue.unshift(...metrics);
    } finally {
      flushing = false;
    }
  };

  if (isBrowser() && config.reporting.flushOnHidden) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        void flush();
      }
    });
  }

  return {
    push(metric) {
      queue.push(metric);
      if (!config.reporting.batch) {
        void flush();
      }
    },
    flush,
    snapshot() {
      return [...queue];
    },
  };
}
