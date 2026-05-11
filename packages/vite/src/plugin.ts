import type { Plugin } from 'vite';
import type { TzadikConfig } from '@tzadik/core';
import { checkBudgets, createManifest } from './budgetCheck.js';

export type TzadikViteOptions = {
  config?: TzadikConfig;
  inject?: boolean;
  failOnBudget?: boolean;
};

export function tzadikVite(options: TzadikViteOptions = {}): Plugin {
  const config = options.config ?? {};
  const inject = options.inject ?? true;
  const failOnBudget = options.failOnBudget ?? false;

  return {
    name: 'tzadik:vite',
    apply: 'build',
    transformIndexHtml(html) {
      if (!inject) {
        return html;
      }

      const runtime = `<script type="module">import { tzadik } from '@tzadik/core'; tzadik.init(${JSON.stringify(config)});</script>`;
      return html.includes('</head>') ? html.replace('</head>', `${runtime}\n</head>`) : `${runtime}\n${html}`;
    },
    generateBundle(_, bundle) {
      const manifest = createManifest(bundle);
      const violations = checkBudgets(manifest, config.budgets);

      this.emitFile({
        type: 'asset',
        fileName: 'tzadik-manifest.json',
        source: JSON.stringify(manifest, null, 2),
      });

      if (violations.length > 0) {
        for (const violation of violations) {
          this.warn(`[tzadik] ${violation.message}`);
        }

        if (failOnBudget) {
          this.error(`[tzadik] ${violations.map((violation) => violation.message).join('; ')}`);
        }
      }
    },
  };
}
