export type MetricName =
  | 'CLS'
  | 'FCP'
  | 'INP'
  | 'LCP'
  | 'TTFB'
  | 'LONG_TASK'
  | 'RESOURCE'
  | 'NAVIGATION'
  | 'SCRIPT';

export type MetricRating = 'good' | 'needs-improvement' | 'poor';

export type tzadikMetric = {
  name: MetricName;
  value: number;
  route: string;
  timestamp: number;
  rating?: MetricRating | undefined;
  attribution?: Record<string, unknown> | undefined;
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  } | undefined;
  device?: {
    memory?: number;
    cores?: number;
  } | undefined;
};

export type tzadikReportPayload = {
  app: string;
  sessionId: string;
  route: string;
  metrics: tzadikMetric[];
};

export type SchedulerPriority = 'user-blocking' | 'user-visible' | 'background';

export type ScriptStrategy =
  | 'critical'
  | 'after-interactive'
  | 'idle'
  | 'interaction'
  | 'visible'
  | 'consent'
  | 'worker'
  | 'worker-try-main-fallback';

export type ScriptDefinition = {
  id: string;
  src: string;
  strategy?: ScriptStrategy;
  category?: string;
  consent?: string;
  async?: boolean;
  defer?: boolean;
  attrs?: Record<string, string | boolean>;
};

export type tzadikBudgets = {
  jsKb?: number;
  cssKb?: number;
  lcpMs?: number;
  inpMs?: number;
  cls?: number;
};

export type MetricsConfig = {
  webVitals?: boolean;
  longTasks?: boolean;
  resources?: boolean;
  attribution?: boolean;
  sampleRate?: number;
};

export type SchedulerConfig = {
  enabled?: boolean;
  defaultPriority?: SchedulerPriority;
  autoYield?: boolean;
  longTaskBudgetMs?: number;
};

export type ScriptsConfig = {
  enabled?: boolean;
  defaultStrategy?: ScriptStrategy;
  consentMode?: boolean;
  registry?: ScriptDefinition[];
};

export type NavigationConfig = {
  prefetch?: boolean;
  strategy?: 'conservative' | 'balanced' | 'eager';
  speculationRules?: boolean;
  maxConcurrent?: number;
  respectSaveData?: boolean;
  ignore?: string[];
};

export type ReportingConfig = {
  endpoint?: string;
  batch?: boolean;
  flushOnHidden?: boolean;
  sessionId?: string;
};

export type DevtoolsConfig = {
  overlay?: boolean;
  consoleHints?: boolean;
};

export type tzadikConfig = {
  appName?: string;
  mode?: 'auto' | 'safe' | 'manual';
  metrics?: boolean | MetricsConfig;
  scheduler?: boolean | SchedulerConfig;
  scripts?: boolean | ScriptsConfig;
  navigation?: boolean | NavigationConfig;
  reporting?: ReportingConfig;
  reportTo?: string;
  budgets?: tzadikBudgets;
  devtools?: boolean | DevtoolsConfig;
};

export type NormalizedtzadikConfig = {
  appName: string;
  mode: 'auto' | 'safe' | 'manual';
  metrics: Required<MetricsConfig>;
  scheduler: Required<SchedulerConfig>;
  scripts: Required<Omit<ScriptsConfig, 'registry'>> & { registry: ScriptDefinition[] };
  navigation: Required<NavigationConfig>;
  reporting: Required<Omit<ReportingConfig, 'endpoint'>> & { endpoint?: string | undefined };
  budgets: tzadikBudgets;
  devtools: Required<DevtoolsConfig>;
};

export function definetzadikConfig(config: tzadikConfig): tzadikConfig {
  return config;
}

export function normalizeConfig(config: tzadikConfig = {}): NormalizedtzadikConfig {
  const metrics = config.metrics === false ? {} : config.metrics === true || config.metrics == null ? { webVitals: true } : config.metrics;
  const scheduler =
    config.scheduler === false ? { enabled: false } : config.scheduler === true || config.scheduler == null ? { enabled: true } : config.scheduler;
  const scripts =
    config.scripts === false ? { enabled: false } : config.scripts === true || config.scripts == null ? { enabled: true } : config.scripts;
  const navigation =
    config.navigation === false
      ? { prefetch: false }
      : config.navigation === true || config.navigation == null
        ? { prefetch: false }
        : config.navigation;
  const devtools =
    config.devtools === false ? {} : config.devtools === true || config.devtools == null ? { consoleHints: false } : config.devtools;

  return {
    appName: config.appName ?? 'tzadik-app',
    mode: config.mode ?? 'safe',
    metrics: {
      webVitals: metrics.webVitals ?? true,
      longTasks: metrics.longTasks ?? true,
      resources: metrics.resources ?? false,
      attribution: metrics.attribution ?? true,
      sampleRate: metrics.sampleRate ?? 1,
    },
    scheduler: {
      enabled: scheduler.enabled ?? true,
      defaultPriority: scheduler.defaultPriority ?? 'user-visible',
      autoYield: scheduler.autoYield ?? false,
      longTaskBudgetMs: scheduler.longTaskBudgetMs ?? 50,
    },
    scripts: {
      enabled: scripts.enabled ?? true,
      defaultStrategy: scripts.defaultStrategy ?? 'idle',
      consentMode: scripts.consentMode ?? false,
      registry: scripts.registry ?? [],
    },
    navigation: {
      prefetch: navigation.prefetch ?? false,
      strategy: navigation.strategy ?? 'balanced',
      speculationRules: navigation.speculationRules ?? false,
      maxConcurrent: navigation.maxConcurrent ?? 2,
      respectSaveData: navigation.respectSaveData ?? true,
      ignore: navigation.ignore ?? ['/logout', '/checkout', '/auth/*', '/api/*'],
    },
    reporting: {
      endpoint: config.reporting?.endpoint ?? config.reportTo,
      batch: config.reporting?.batch ?? true,
      flushOnHidden: config.reporting?.flushOnHidden ?? true,
      sessionId: config.reporting?.sessionId ?? createSessionId(),
    },
    budgets: config.budgets ?? {},
    devtools: {
      overlay: devtools.overlay ?? false,
      consoleHints: devtools.consoleHints ?? false,
    },
  };
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `tzadik-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}
