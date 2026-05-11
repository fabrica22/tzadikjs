import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import type { NormalizedTzadikConfig, TzadikMetric } from '../config.js';
import { currentRoute, getConnectionInfo, getDeviceInfo, isBrowser } from '../env.js';

export type MetricSink = (metric: TzadikMetric) => void;

export function observeWebVitals(config: NormalizedTzadikConfig, sink: MetricSink): void {
  if (!isBrowser() || !config.metrics.webVitals || Math.random() > config.metrics.sampleRate) {
    return;
  }

  const emit = (metric: Metric) => {
    sink({
      name: metric.name as TzadikMetric['name'],
      value: metric.value,
      rating: metric.rating,
      route: currentRoute(),
      timestamp: Date.now(),
      attribution: config.metrics.attribution ? metricAttribution(metric) : undefined,
      connection: getConnectionInfo(),
      device: getDeviceInfo(),
    });
  };

  onCLS(emit);
  onFCP(emit);
  onINP(emit);
  onLCP(emit);
  onTTFB(emit);
}

function metricAttribution(metric: Metric): Record<string, unknown> | undefined {
  const candidate = metric as Metric & { attribution?: Record<string, unknown> };
  return candidate.attribution;
}
