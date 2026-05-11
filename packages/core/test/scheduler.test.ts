import { describe, expect, it, vi } from 'vitest';
import { chunk, task, yieldToMain } from '../src/scheduler/index.js';

describe('scheduler helpers', () => {
  it('runs fallback tasks', async () => {
    await expect(task(() => 42)).resolves.toBe(42);
  });

  it('yields with timeout fallback', async () => {
    vi.useFakeTimers();
    const yielded = yieldToMain();
    await vi.runAllTimersAsync();
    await expect(yielded).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it('processes chunks in order', async () => {
    const processed: number[] = [];
    await chunk([1, 2, 3], (item) => {
      processed.push(item);
    });

    expect(processed).toEqual([1, 2, 3]);
  });
});
