import type { NormalizedtzadikConfig, tzadikMetric } from '../config.js';
import { currentRoute, getConnectionInfo, getDeviceInfo, isBrowser } from '../env.js';
import type { MetricSink } from './webVitals.js';

export function observeResources(config: NormalizedtzadikConfig, sink: MetricSink): void {
  if (!isBrowser() || !config.metrics.resources || typeof PerformanceObserver === 'undefined') {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntriesByType('resource') as PerformanceResourceTiming[]) {
        sink(toMetric(entry));
      }
    });

    observer.observe({ type: 'resource', buffered: true });
  } catch {
    // Resource Timing observer support varies by runtime.
  }
}

function toMetric(entry: PerformanceResourceTiming): tzadikMetric {
  const transferSize = entry.transferSize || 0;

  return {
    name: 'RESOURCE',
    value: transferSize,
    route: currentRoute(),
    timestamp: Date.now(),
    rating: transferSize > 250_000 ? 'needs-improvement' : 'good',
    attribution: {
      name: entry.name,
      initiatorType: entry.initiatorType,
      duration: entry.duration,
      transferSize,
    },
    connection: getConnectionInfo(),
    device: getDeviceInfo(),
  };
}
