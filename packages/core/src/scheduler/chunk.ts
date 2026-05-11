import type { SchedulerPriority } from '../config.js';
import { now } from '../env.js';
import { yieldToMain } from './yield.js';

export type ChunkOptions = {
  budgetMs?: number;
  priority?: SchedulerPriority;
  signal?: AbortSignal;
};

export async function chunk<T>(
  items: Iterable<T>,
  callback: (item: T, index: number) => void | Promise<void>,
  options: ChunkOptions = {},
): Promise<void> {
  const budgetMs = options.budgetMs ?? 8;
  let index = 0;
  let sliceStart = now();

  for (const item of items) {
    if (options.signal?.aborted) {
      throw options.signal.reason;
    }

    await callback(item, index);
    index += 1;

    if (now() - sliceStart >= budgetMs) {
      await yieldToMain();
      sliceStart = now();
    }
  }
}
