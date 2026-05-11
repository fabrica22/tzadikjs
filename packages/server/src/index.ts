import type { tzadikReportPayload } from '@tzadik/core';

export type RumStore = {
  save(payload: tzadikReportPayload): Promise<void> | void;
};

export type RequestLike = {
  json(): Promise<unknown>;
};

export async function readtzadikPayload(request: RequestLike): Promise<tzadikReportPayload> {
  const payload = await request.json();

  if (!isPayload(payload)) {
    throw new Error('Invalid tzadik RUM payload');
  }

  return payload;
}

export function createMemoryStore(): RumStore & { entries: tzadikReportPayload[] } {
  const entries: tzadikReportPayload[] = [];

  return {
    entries,
    save(payload) {
      entries.push(payload);
    },
  };
}

function isPayload(payload: unknown): payload is tzadikReportPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<tzadikReportPayload>;
  return typeof candidate.app === 'string' && typeof candidate.sessionId === 'string' && Array.isArray(candidate.metrics);
}
