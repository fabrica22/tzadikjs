import { isBrowser } from '../env.js';

export type SpeculationRule = {
  source: 'list';
  urls: string[];
};

export function injectSpeculationRules(urls: string[]): boolean {
  if (!isBrowser() || urls.length === 0) {
    return false;
  }

  const script = document.createElement('script');
  script.type = 'speculationrules';
  script.textContent = JSON.stringify({
    prefetch: [
      {
        source: 'list',
        urls,
      },
    ],
  });
  document.head.append(script);
  return true;
}
