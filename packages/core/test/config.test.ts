import { describe, expect, it } from 'vitest';
import { normalizeConfig } from '../src/config.js';

describe('normalizeConfig', () => {
  it('applies safe defaults', () => {
    const config = normalizeConfig({ appName: 'demo' });

    expect(config.appName).toBe('demo');
    expect(config.mode).toBe('safe');
    expect(config.metrics.webVitals).toBe(true);
    expect(config.scheduler.enabled).toBe(true);
    expect(config.navigation.ignore).toContain('/checkout');
  });

  it('maps reportTo into reporting.endpoint', () => {
    const config = normalizeConfig({ reportTo: '/rum' });

    expect(config.reporting.endpoint).toBe('/rum');
  });
});
