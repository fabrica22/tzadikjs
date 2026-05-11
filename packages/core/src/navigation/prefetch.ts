import type { NavigationConfig, NormalizedtzadikConfig, tzadikMetric } from '../config.js';
import { currentRoute, getConnectionInfo, isBrowser } from '../env.js';
import { idle } from '../scheduler/idle.js';

export type NavigationMetricSink = (metric: tzadikMetric) => void;

export type NavigationController = {
  enable(): void;
  prefetch(url: string): boolean;
};

export function createNavigation(config: NormalizedtzadikConfig, sink: NavigationMetricSink): NavigationController {
  const prefetched = new Set<string>();
  let active = 0;

  const shouldPrefetch = (url: string): boolean => {
    if (!config.navigation.prefetch || active >= config.navigation.maxConcurrent) {
      return false;
    }

    if (config.navigation.respectSaveData && getConnectionInfo()?.saveData) {
      return false;
    }

    return isAllowedUrl(url, config.navigation);
  };

  const prefetch = (url: string): boolean => {
    if (!isBrowser()) {
      return false;
    }

    const normalized = normalizeUrl(url);
    if (!normalized || prefetched.has(normalized) || !shouldPrefetch(normalized)) {
      return false;
    }

    prefetched.add(normalized);
    active += 1;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = normalized;
    link.as = 'document';

    const done = () => {
      active = Math.max(0, active - 1);
    };

    link.addEventListener('load', done, { once: true });
    link.addEventListener('error', done, { once: true });
    document.head.append(link);

    sink({
      name: 'NAVIGATION',
      value: 1,
      route: currentRoute(),
      timestamp: Date.now(),
      rating: 'good',
      attribution: {
        action: 'prefetch',
        href: normalized,
      },
    });

    return true;
  };

  return {
    enable() {
      if (!isBrowser() || !config.navigation.prefetch) {
        return;
      }

      window.addEventListener(
        'pointerover',
        (event) => {
          const anchor = closestAnchor(event.target);
          if (anchor) {
            prefetch(anchor.href);
          }
        },
        { passive: true },
      );

      window.addEventListener(
        'touchstart',
        (event) => {
          const anchor = closestAnchor(event.target);
          if (anchor) {
            prefetch(anchor.href);
          }
        },
        { passive: true },
      );

      if (config.navigation.strategy !== 'conservative') {
        void idle(() => prefetchVisibleLinks(prefetch), { timeout: 1500 });
      }
    },
    prefetch,
  };
}

export function isAllowedUrl(url: string, config: Pick<NavigationConfig, 'ignore'>): boolean {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    return false;
  }

  const destination = new URL(normalized, window.location.href);
  if (destination.origin !== window.location.origin) {
    return false;
  }

  if (destination.pathname === window.location.pathname) {
    return false;
  }

  return !(config.ignore ?? []).some((pattern) => matchesPattern(destination.pathname, pattern));
}

function prefetchVisibleLinks(prefetch: (url: string) => boolean): void {
  const anchors = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')];

  if (typeof IntersectionObserver === 'undefined') {
    for (const anchor of anchors.slice(0, 5)) {
      prefetch(anchor.href);
    }
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        const anchor = entry.target instanceof HTMLAnchorElement ? entry.target : undefined;
        if (anchor) {
          prefetch(anchor.href);
        }
      }
    }
  });

  for (const anchor of anchors) {
    observer.observe(anchor);
  }
}

function closestAnchor(target: EventTarget | null): HTMLAnchorElement | undefined {
  if (!(target instanceof Element)) {
    return undefined;
  }

  return target.closest<HTMLAnchorElement>('a[href]') ?? undefined;
}

function normalizeUrl(url: string): string | undefined {
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return undefined;
  }
}

function matchesPattern(pathname: string, pattern: string): boolean {
  if (pattern.endsWith('*')) {
    return pathname.startsWith(pattern.slice(0, -1));
  }

  return pathname === pattern;
}
