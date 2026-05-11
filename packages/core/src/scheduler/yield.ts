export async function yieldToMain(): Promise<void> {
  const maybeScheduler = globalThis as typeof globalThis & {
    scheduler?: { yield?: () => Promise<void> };
  };

  if (typeof maybeScheduler.scheduler?.yield === 'function') {
    await maybeScheduler.scheduler.yield();
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}
