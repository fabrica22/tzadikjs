import type { NormalizedTzadikConfig, TzadikMetric } from '../config.js';
import { observeLongTasks } from './longTasks.js';
import { observeResources } from './resources.js';
import { observeWebVitals } from './webVitals.js';

export type MetricSink = (metric: TzadikMetric) => void;

export function startMetrics(config: NormalizedTzadikConfig, sink: MetricSink): void {
  observeWebVitals(config, sink);
  observeLongTasks(config, sink);
  observeResources(config, sink);
}
