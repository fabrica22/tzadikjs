import type { TzadikBudgets } from '@tzadik/core';

type BundleItem =
  | {
      type: 'chunk';
      fileName: string;
      code: string;
      imports?: string[];
    }
  | {
      type: 'asset';
      fileName: string;
      source: string | Uint8Array;
    };

export type TzadikBundleAsset = {
  fileName: string;
  type: 'js' | 'css' | 'asset';
  sizeBytes: number;
  imports?: string[] | undefined;
};

export type TzadikManifest = {
  generatedAt: string;
  assets: TzadikBundleAsset[];
  totals: {
    jsBytes: number;
    cssBytes: number;
    assetBytes: number;
  };
};

export type BudgetViolation = {
  budget: keyof TzadikBudgets;
  limit: number;
  actual: number;
  message: string;
};

export function createManifest(bundle: Record<string, BundleItem>): TzadikManifest {
  const assets: TzadikBundleAsset[] = [];

  for (const item of Object.values(bundle)) {
    const fileName = item.fileName;
    const source = item.type === 'chunk' ? item.code : item.source;
    const sizeBytes = typeof source === 'string' ? Buffer.byteLength(source) : source.byteLength;

    assets.push({
      fileName,
      type: fileName.endsWith('.js') ? 'js' : fileName.endsWith('.css') ? 'css' : 'asset',
      sizeBytes,
      imports: item.type === 'chunk' ? item.imports : undefined,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    assets,
    totals: {
      jsBytes: sumByType(assets, 'js'),
      cssBytes: sumByType(assets, 'css'),
      assetBytes: sumByType(assets, 'asset'),
    },
  };
}

export function checkBudgets(manifest: TzadikManifest, budgets: TzadikBudgets = {}): BudgetViolation[] {
  const violations: BudgetViolation[] = [];

  if (budgets.jsKb != null) {
    pushViolation(violations, 'jsKb', budgets.jsKb, bytesToKb(manifest.totals.jsBytes));
  }

  if (budgets.cssKb != null) {
    pushViolation(violations, 'cssKb', budgets.cssKb, bytesToKb(manifest.totals.cssBytes));
  }

  return violations;
}

function pushViolation(violations: BudgetViolation[], budget: keyof TzadikBudgets, limit: number, actual: number): void {
  if (actual <= limit) {
    return;
  }

  violations.push({
    budget,
    limit,
    actual,
    message: `${budget} budget exceeded: ${actual.toFixed(1)} KB > ${limit} KB`,
  });
}

function bytesToKb(bytes: number): number {
  return bytes / 1024;
}

function sumByType(assets: TzadikBundleAsset[], type: TzadikBundleAsset['type']): number {
  return assets.filter((asset) => asset.type === type).reduce((sum, asset) => sum + asset.sizeBytes, 0);
}
