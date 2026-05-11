export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}

export function currentRoute(): string {
  if (!isBrowser()) {
    return '/';
  }

  return `${window.location.pathname}${window.location.search}`;
}

export function getConnectionInfo(): { effectiveType?: string; saveData?: boolean } | undefined {
  if (!isBrowser()) {
    return undefined;
  }

  const navigatorWithConnection = navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean };
  };

  const connection = navigatorWithConnection.connection;
  if (!connection) {
    return undefined;
  }

  const info: { effectiveType?: string; saveData?: boolean } = {};
  if (connection.effectiveType != null) {
    info.effectiveType = connection.effectiveType;
  }
  if (connection.saveData != null) {
    info.saveData = connection.saveData;
  }
  return info;
}

export function getDeviceInfo(): { memory?: number; cores?: number } | undefined {
  if (!isBrowser()) {
    return undefined;
  }

  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };

  const info: { memory?: number; cores?: number } = {};
  if (navigatorWithMemory.deviceMemory != null) {
    info.memory = navigatorWithMemory.deviceMemory;
  }
  if (navigator.hardwareConcurrency != null) {
    info.cores = navigator.hardwareConcurrency;
  }
  return info;
}
