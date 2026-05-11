import type { NormalizedtzadikConfig, tzadikMetric } from '../config.js';

export function createDevLogger(config: NormalizedtzadikConfig): (metric: tzadikMetric) => void {
  return (metric) => {
    if (!config.devtools.consoleHints || typeof console === 'undefined') {
      return;
    }

    const value = Number.isInteger(metric.value) ? metric.value : Number(metric.value.toFixed(2));
    console.info(`[tzadik] ${metric.name}`, {
      value,
      rating: metric.rating,
      route: metric.route,
      attribution: metric.attribution,
    });
  };
}
