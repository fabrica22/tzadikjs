import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import type { NormalizedtzadikConfig, tzadikMetric } from '../config.js';
import { currentRoute, getConnectionInfo, getDeviceInfo, isBrowser } from '../env.js';

export type MetricSink = (metric: tzadikMetric) => void;

export function observeWebVitals(config: NormalizedtzadikConfig, sink: MetricSink): void {
  if (!isBrowser() || !config.metrics.webVitals || Math.random() > config.metrics.sampleRate) {
    return;
  }

  const emit = (metric: Metric) => {
    sink({
      name: metric.name as tzadikMetric['name'],
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
