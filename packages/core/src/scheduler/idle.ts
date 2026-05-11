export type IdleOptions = {
  timeout?: number;
  signal?: AbortSignal;
};

export function idle<T>(callback: () => T | Promise<T>, options: IdleOptions = {}): Promise<T> {
  const browserGlobal = globalThis as typeof globalThis & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  return new Promise<T>((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(options.signal.reason);
      return;
    }

    const run = () => {
      if (options.signal?.aborted) {
        reject(options.signal.reason);
        return;
      }

      void Promise.resolve(callback()).then(resolve, reject);
    };

    if (typeof browserGlobal.requestIdleCallback === 'function') {
      const idleOptions: IdleRequestOptions | undefined =
        options.timeout == null ? undefined : { timeout: options.timeout };
      const handle = browserGlobal.requestIdleCallback(run, idleOptions);
      options.signal?.addEventListener(
        'abort',
        () => {
          browserGlobal.cancelIdleCallback?.(handle);
          reject(options.signal?.reason);
        },
        { once: true },
      );
      return;
    }

    const timeout = setTimeout(run, options.timeout ?? 1);
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
