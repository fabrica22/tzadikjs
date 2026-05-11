import type { SchedulerPriority } from '../config.js';

export type TaskOptions = {
  priority?: SchedulerPriority;
  delay?: number;
  signal?: AbortSignal;
};

export function task<T>(callback: () => T | Promise<T>, options: TaskOptions = {}): Promise<T> {
  const run = async (): Promise<T> => callback();
  const maybeScheduler = globalThis as typeof globalThis & {
    scheduler?: {
      postTask?: <R>(callback: () => R | Promise<R>, options?: TaskOptions) => Promise<R>;
    };
  };

  if (typeof maybeScheduler.scheduler?.postTask === 'function') {
    return maybeScheduler.scheduler.postTask(run, options);
  }

  return new Promise<T>((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(options.signal.reason);
      return;
    }

    const timeout = setTimeout(() => {
      if (options.signal?.aborted) {
        reject(options.signal.reason);
        return;
      }

      void run().then(resolve, reject);
    }, options.delay ?? 0);

    options.signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        reject(options.signal?.reason);
      },
      { once: true },
    );
  });
}
