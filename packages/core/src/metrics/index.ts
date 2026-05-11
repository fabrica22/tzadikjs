import type { NormalizedtzadikConfig, tzadikMetric } from '../config.js';
import { observeLongTasks } from './longTasks.js';
import { observeResources } from './resources.js';
import { observeWebVitals } from './webVitals.js';

export type MetricSink = (metric: tzadikMetric) => void;

export function startMetrics(config: NormalizedtzadikConfig, sink: MetricSink): void {
  observeWebVitals(config, sink);
  observeLongTasks(config, sink);
  observeResources(config, sink);
}
