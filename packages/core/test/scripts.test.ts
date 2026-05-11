import { describe, expect, it, vi } from 'vitest';
import { waitForStrategy } from '../src/scripts/index.js';

describe('script strategies', () => {
  it('resolves critical immediately', async () => {
    await expect(waitForStrategy('critical')).resolves.toBeUndefined();
  });

  it('waits for interaction', async () => {
    const pending = waitForStrategy('interaction');
    window.dispatchEvent(new Event('pointerdown'));

    await expect(pending).resolves.toBeUndefined();
  });

  it('uses idle fallback for idle strategy', async () => {
    vi.useFakeTimers();
    const pending = waitForStrategy('idle');
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
