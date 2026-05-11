import type { NormalizedTzadikConfig, ScriptDefinition, TzadikConfig, TzadikMetric } from './config.js';
import { normalizeConfig } from './config.js';
import { createDevLogger } from './devtools/logger.js';
import { startMetrics } from './metrics/index.js';
import { createNavigation, type NavigationController } from './navigation/index.js';
import { createReporter, type Reporter } from './reporting/queue.js';
import { chunk, idle, task, yieldToMain } from './scheduler/index.js';
import { createScriptRegistry, startRegisteredScripts, type ScriptRegistry } from './scripts/index.js';

export type TzadikInstance = {
  config: NormalizedTzadikConfig;
  reporter: Reporter;
  scripts: ScriptRegistry;
  navigation: NavigationController;
  init(config?: TzadikConfig): TzadikInstance;
  emit(metric: TzadikMetric): void;
  registerScript(script: ScriptDefinition): Promise<unknown>;
  yield: typeof yieldToMain;
  yieldToMain: typeof yieldToMain;
  task: typeof task;
  chunk: typeof chunk;
  idle: typeof idle;
};

let activeInstance: TzadikInstance | undefined;

export function init(config: TzadikConfig = {}): TzadikInstance {
  const normalized = normalizeConfig(config);
  const reporter = createReporter(normalized);
  const logMetric = createDevLogger(normalized);

  const emit = (metric: TzadikMetric): void => {
    reporter.push(metric);
    logMetric(metric);
  };

  const scripts = createScriptRegistry(normalized, emit);
  const navigation = createNavigation(normalized, emit);

  activeInstance = {
    config: normalized,
    reporter,
    scripts,
    navigation,
    init,
    emit,
    registerScript: scripts.register,
    yield: yieldToMain,
    yieldToMain,
    task,
    chunk,
    idle,
  };

  startMetrics(normalized, emit);
  startRegisteredScripts(normalized, scripts);
  navigation.enable();

  return activeInstance;
}

export function getActiveInstance(): TzadikInstance | undefined {
  return activeInstance;
}

export const tzadik: TzadikInstance = {
  get config() {
    return ensureInstance().config;
  },
  get reporter() {
    return ensureInstance().reporter;
  },
  get scripts() {
    return ensureInstance().scripts;
  },
  get navigation() {
    return ensureInstance().navigation;
  },
  init,
  emit(metric) {
    ensureInstance().emit(metric);
  },
  registerScript(script) {
    return ensureInstance().registerScript(script);
  },
  yield: yieldToMain,
  yieldToMain,
  task,
  chunk,
  idle,
};

function ensureInstance(): TzadikInstance {
  if (!activeInstance) {
    return init();
  }

  return activeInstance;
}
