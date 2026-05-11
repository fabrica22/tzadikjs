import type { TzadikReportPayload } from '@tzadik/core';

export type RumStore = {
  save(payload: TzadikReportPayload): Promise<void> | void;
};

export type RequestLike = {
  json(): Promise<unknown>;
};

export async function readTzadikPayload(request: RequestLike): Promise<TzadikReportPayload> {
  const payload = await request.json();

  if (!isPayload(payload)) {
    throw new Error('Invalid tzadik RUM payload');
  }

  return payload;
}

export function createMemoryStore(): RumStore & { entries: TzadikReportPayload[] } {
  const entries: TzadikReportPayload[] = [];

  return {
    entries,
    save(payload) {
      entries.push(payload);
    },
  };
}

function isPayload(payload: unknown): payload is TzadikReportPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<TzadikReportPayload>;
  return typeof candidate.app === 'string' && typeof candidate.sessionId === 'string' && Array.isArray(candidate.metrics);
}
