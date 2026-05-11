import type { NormalizedTzadikConfig, TzadikMetric } from '../config.js';
import { currentRoute, getConnectionInfo, getDeviceInfo, isBrowser } from '../env.js';
import type { MetricSink } from './webVitals.js';

export function observeLongTasks(config: NormalizedTzadikConfig, sink: MetricSink): void {
  if (!isBrowser() || !config.metrics.longTasks || typeof PerformanceObserver === 'undefined') {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        sink(toMetric(entry));
      }
    });

    observer.observe({ type: 'longtask', buffered: true });
  } catch {
    // Long Task API is not available in every browser.
  }
}

function toMetric(entry: PerformanceEntry): TzadikMetric {
  return {
    name: 'LONG_TASK',
    value: entry.duration,
    route: currentRoute(),
    timestamp: Date.now(),
    rating: entry.duration >= 200 ? 'poor' : 'needs-improvement',
    attribution: {
      startTime: entry.startTime,
      entryType: entry.entryType,
      name: entry.name,
    },
    connection: getConnectionInfo(),
    device: getDeviceInfo(),
  };
}
