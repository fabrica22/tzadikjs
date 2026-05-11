import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type Manifest = {
  generatedAt: string;
  assets: Array<{ fileName: string; type: string; sizeBytes: number }>;
  totals: { jsBytes: number; cssBytes: number; assetBytes: number };
};

export async function generateReport(manifestPath = 'dist/tzadik-manifest.json', outPath = 'tzadik-report.html'): Promise<string> {
  const manifest = JSON.parse(await readFile(resolve(manifestPath), 'utf8')) as Manifest;
  const rows = manifest.assets
    .map(
      (asset) =>
        `<tr><td>${escapeHtml(asset.fileName)}</td><td>${asset.type}</td><td>${formatKb(asset.sizeBytes)}</td></tr>`,
    )
    .join('\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>tzadik.js report</title>
    <style>
      body { font-family: Inter, system-ui, sans-serif; margin: 40px; color: #17202a; }
      table { border-collapse: collapse; width: 100%; margin-top: 24px; }
      th, td { border-bottom: 1px solid #d8dee4; padding: 10px 8px; text-align: left; }
      .totals { display: flex; gap: 16px; margin-top: 24px; }
      .total { border: 1px solid #d8dee4; border-radius: 8px; padding: 12px 16px; }
    </style>
  </head>
  <body>
    <h1>tzadik.js report</h1>
    <p>Generated from manifest created at ${escapeHtml(manifest.generatedAt)}.</p>
    <section class="totals">
      <div class="total"><strong>JS</strong><br>${formatKb(manifest.totals.jsBytes)}</div>
      <div class="total"><strong>CSS</strong><br>${formatKb(manifest.totals.cssBytes)}</div>
      <div class="total"><strong>Assets</strong><br>${formatKb(manifest.totals.assetBytes)}</div>
    </section>
    <table>
      <thead><tr><th>File</th><th>Type</th><th>Size</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`;

  await writeFile(resolve(outPath), html);
  return resolve(outPath);
}

function formatKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char] ?? char;
  });
}
