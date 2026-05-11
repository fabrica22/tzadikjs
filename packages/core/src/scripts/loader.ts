import type { NormalizedTzadikConfig, ScriptDefinition, ScriptStrategy, TzadikMetric } from '../config.js';
import { currentRoute, isBrowser, now } from '../env.js';
import { idle } from '../scheduler/idle.js';

export type ScriptLoadResult = {
  id: string;
  status: 'loaded' | 'skipped' | 'error';
  element?: HTMLScriptElement;
  error?: unknown;
};

export type ScriptMetricSink = (metric: TzadikMetric) => void;

export type ScriptRegistry = {
  register(script: ScriptDefinition): Promise<ScriptLoadResult>;
  load(script: ScriptDefinition): Promise<ScriptLoadResult>;
};

const loadedScripts = new Set<string>();

export function createScriptRegistry(config: NormalizedTzadikConfig, sink: ScriptMetricSink): ScriptRegistry {
  const load = (script: ScriptDefinition): Promise<ScriptLoadResult> => loadScript(script, sink);

  return {
    register(script) {
      const strategy = script.strategy ?? config.scripts.defaultStrategy;
      return waitForStrategy(strategy, script).then(() => load(script));
    },
    load,
  };
}

export function startRegisteredScripts(config: NormalizedTzadikConfig, registry: ScriptRegistry): void {
  if (!config.scripts.enabled || !isBrowser()) {
    return;
  }

  for (const script of config.scripts.registry) {
    void registry.register(script);
  }
}

export function waitForStrategy(strategy: ScriptStrategy, script?: ScriptDefinition): Promise<void> {
  if (!isBrowser()) {
    return Promise.resolve();
  }

  switch (strategy) {
    case 'critical':
      return Promise.resolve();
    case 'after-interactive':
      return waitForInteractive();
    case 'idle':
      return idle(() => undefined, { timeout: 2000 });
    case 'interaction':
      return waitForInteraction();
    case 'visible':
      return waitForVisible(script);
    case 'consent':
      return waitForConsent(script?.consent ?? script?.category ?? script?.id ?? 'default');
    case 'worker':
    case 'worker-try-main-fallback':
      return idle(() => undefined, { timeout: 1000 });
  }
}

async function loadScript(script: ScriptDefinition, sink: ScriptMetricSink): Promise<ScriptLoadResult> {
  if (!isBrowser() || loadedScripts.has(script.id) || document.querySelector(`script[data-tzadik-id="${script.id}"]`)) {
    return { id: script.id, status: 'skipped' };
  }

  const start = now();

  return new Promise<ScriptLoadResult>((resolve) => {
    const element = document.createElement('script');
    element.src = script.src;
    element.async = script.async ?? true;
    element.defer = script.defer ?? false;
    element.dataset.tzadikId = script.id;

    for (const [name, value] of Object.entries(script.attrs ?? {})) {
      if (typeof value === 'boolean') {
        if (value) {
          element.setAttribute(name, '');
        }
      } else {
        element.setAttribute(name, value);
      }
    }

    element.addEventListener(
      'load',
      () => {
        loadedScripts.add(script.id);
        sink(scriptMetric(script, now() - start, 'good'));
        resolve({ id: script.id, status: 'loaded', element });
      },
      { once: true },
    );

    element.addEventListener(
      'error',
      (error) => {
        sink(scriptMetric(script, now() - start, 'poor'));
        resolve({ id: script.id, status: 'error', element, error });
      },
      { once: true },
    );

    document.head.append(element);
  });
}

function scriptMetric(script: ScriptDefinition, duration: number, rating: TzadikMetric['rating']): TzadikMetric {
  return {
    name: 'SCRIPT',
    value: duration,
    route: currentRoute(),
    timestamp: Date.now(),
    rating,
    attribution: {
      id: script.id,
      src: script.src,
      category: script.category,
      strategy: script.strategy,
    },
  };
}

function waitForInteractive(): Promise<void> {
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
  });
}

function waitForInteraction(): Promise<void> {
  return new Promise((resolve) => {
    const eventNames: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    const listenerOptions: AddEventListenerOptions = { passive: true, once: true };
    const done = () => {
      for (const eventName of eventNames) {
        window.removeEventListener(eventName, done);
      }
      resolve();
    };

    for (const eventName of eventNames) {
      window.addEventListener(eventName, done, listenerOptions);
    }
  });
}

function waitForVisible(script?: ScriptDefinition): Promise<void> {
  const selector = typeof script?.attrs?.['data-visible-selector'] === 'string' ? script.attrs['data-visible-selector'] : undefined;
  const target = selector ? document.querySelector(selector) : document.body;

  if (!target || typeof IntersectionObserver === 'undefined') {
    return idle(() => undefined, { timeout: 2000 });
  }

  return new Promise((resolve) => {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(target);
  });
}

function waitForConsent(consentKey: string): Promise<void> {
  const globalConsent = window as Window & { tzadikConsent?: Record<string, boolean> };
  if (globalConsent.tzadikConsent?.[consentKey]) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.addEventListener(
      `tzadik:consent:${consentKey}`,
      () => {
        resolve();
      },
      { once: true },
    );
  });
}
