import type { NormalizedtzadikConfig, tzadikMetric, tzadikReportPayload } from '../config.js';
import { currentRoute, isBrowser } from '../env.js';

export type Reporter = {
  push(metric: tzadikMetric): void;
  flush(): Promise<void>;
  snapshot(): tzadikMetric[];
};

export function createReporter(config: NormalizedtzadikConfig): Reporter {
  const queue: tzadikMetric[] = [];
  let flushing = false;

  const flush = async (): Promise<void> => {
    if (!config.reporting.endpoint || flushing || queue.length === 0) {
      return;
    }

    flushing = true;
    const metrics = queue.splice(0, queue.length);
    const payload: tzadikReportPayload = {
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
