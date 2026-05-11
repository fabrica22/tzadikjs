import { tzadik } from '@tzadik/core';
import './styles.css';

tzadik.init({
  appName: 'vite-basic',
  metrics: true,
  scheduler: true,
  scripts: {
    defaultStrategy: 'idle',
    registry: [
      {
        id: 'demo-script',
        src: '/demo-third-party.js',
        strategy: 'interaction',
        category: 'demo',
      },
    ],
  },
  navigation: {
    prefetch: true,
    strategy: 'balanced',
    ignore: ['/logout', '/checkout', '/api/*'],
  },
  devtools: {
    consoleHints: true,
  },
});

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  app.innerHTML = `
    <section class="shell">
      <header>
        <h1>tzadik.js Vite example</h1>
        <p>Runtime metrics, main-thread yielding, script strategies, and prefetching are enabled.</p>
      </header>
      <div class="actions">
        <button id="heavy">Run chunked work</button>
        <a href="/pricing">Pricing</a>
        <a href="/checkout">Checkout</a>
      </div>
      <pre id="output">Ready.</pre>
    </section>
  `;
}

document.querySelector('#heavy')?.addEventListener('click', async () => {
  const output = document.querySelector('#output');
  const items = Array.from({ length: 10_000 }, (_, index) => index);
  let total = 0;

  await tzadik.chunk(
    items,
    (item) => {
      total += Math.sqrt(item);
    },
    { budgetMs: 6 },
  );

  if (output) {
    output.textContent = `Processed ${items.length.toLocaleString()} items. Total: ${total.toFixed(2)}`;
  }
});
