import { describe, expect, it } from 'vitest';
import { checkBudgets, type tzadikManifest } from '../src/index.js';

describe('checkBudgets', () => {
  it('returns violations when bundle totals exceed limits', () => {
    const manifest: tzadikManifest = {
      generatedAt: new Date(0).toISOString(),
      assets: [],
      totals: {
        jsBytes: 200 * 1024,
        cssBytes: 10 * 1024,
        assetBytes: 0,
      },
    };

    const violations = checkBudgets(manifest, { jsKb: 180, cssKb: 20 });

    expect(violations).toHaveLength(1);
    expect(violations[0]?.budget).toBe('jsKb');
  });
});
