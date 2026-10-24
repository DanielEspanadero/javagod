import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

// External Playwright installation: no browser dependency is added to the site.
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const base = process.env.SEARCH_BASE_URL ?? 'http://localhost:4321';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const requests = [];
const entries = Array.from({ length: 19 }, (_, index) => ({
  url: `/docs/resultado-${index + 1}/`,
  excerpt: 'Un <mark>resultado</mark> de prueba.',
  meta: { title: `Resultado ${index + 1}`, since: '8' },
}));
// Hidden matches precede visible matches, so filtering after slicing would fail.
const filteredEntries = [
  { ...entries[0], meta: { title: 'Futuro', since: '21' } },
  { ...entries[0], meta: { title: 'Retirado', since: '8', hasta: '11' } },
  ...entries.map((entry, index) => index === 0
    ? { ...entry, meta: { title: entry.meta.title } }
    : { ...entry, meta: { ...entry.meta, hasta: '17' } }),
];
await context.route(/\/pagefind\/pagefind\.js(?:\?.*)?$/, (route) => route.fulfill({
  contentType: 'text/javascript',
  body: `export async function options() {}
    export async function search(query) {
      await fetch('/search-test-query?q=' + encodeURIComponent(query));
      if (query === 'lenta') await new Promise(resolve => setTimeout(resolve, 500));
      const entries = query === 'vacía' ? [] : query === 'uno'
        ? ${JSON.stringify(entries.slice(0, 1))} : query === 'ocho'
        ? ${JSON.stringify(entries.slice(0, 8))} : query === 'dieciséis'
        ? ${JSON.stringify(entries.slice(0, 16))} : query === 'ocultos'
        ? ${JSON.stringify(filteredEntries.slice(0, 2))} : ${JSON.stringify(filteredEntries)};
      return { results: entries.map(entry => ({ data: async () => entry })) };
    }`,
}));
await context.route('**/search-test-query?*', (route) => {
  requests.push(new URL(route.request().url()).searchParams.get('q'));
  return route.fulfill({ body: 'ok' });
});
const page = await context.newPage();
const runtimeRequests = [];
page.on('request', (request) => {
  if (request.url().includes('pagefind')) runtimeRequests.push(request.url());
});
const links = page.locator('[data-search-results] a');
const more = page.getByRole('button', { name: 'Mostrar más', exact: true });
const input = page.locator('[data-search-input]');
const status = page.locator('[data-search-status]');
const opener = page.locator('[data-search-open]').first();
async function waitFor(check) {
  await page.waitForFunction(check);
}
async function count(expected) {
  await waitFor(() => !document.querySelector('[data-search-status]').textContent.includes('Buscando'));
  assert.equal(await links.count(), expected, `Filas para el estado: ${await status.textContent()}`);
}
async function query(value, expected) {
  await input.fill(value);
  await count(expected);
}
async function focused(locator) {
  assert.equal(await locator.evaluate((element) => element === document.activeElement), true);
}
async function hiddenMore() {
  assert.equal(await more.isVisible(), false);
}
try {
  await page.goto(`${base}/?v=17`);
  await opener.click();
  await hiddenMore();
  await query('muchos', 8);
  assert.equal(await status.textContent(), '8 de 19 resultados, 2 ocultos por el modo Java 17');
  assert.equal(await more.isVisible(), true, 'Debe ofrecer Mostrar más cuando quedan resultados');
  await more.click();
  await count(16);
  assert.equal(await status.textContent(), '16 de 19 resultados, 2 ocultos por el modo Java 17');
  assert.deepEqual(await links.allTextContents(), entries.slice(0, 16).map((entry) =>
    `${entry.meta.title}Un resultado de prueba.`));
  await links.last().focus();
  await page.keyboard.press('Tab');
  await focused(more);
  await page.keyboard.press('Enter');
  await count(19);
  await focused(links.nth(16));
  await hiddenMore();
  assert.equal(await status.textContent(), '19 resultados, 2 ocultos por el modo Java 17');
  assert.deepEqual(await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href'))),
    entries.map((entry) => entry.url));
  assert.deepEqual(requests, ['muchos'], 'Mostrar más no debe repetir la búsqueda');

  await input.focus();
  await page.keyboard.press('ArrowDown');
  await focused(links.first());
  await page.keyboard.press('ArrowDown');
  await focused(links.nth(1));
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await focused(input);
  // Observe native activation without navigating away from the test page.
  await page.evaluate(() => document.querySelector('[data-search-results]').addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      event.preventDefault();
      document.querySelector('[data-search-input]').setAttribute('data-activated', event.target.closest('a').getAttribute('href'));
    }
  }));
  await page.keyboard.press('Enter');
  assert.equal(await input.getAttribute('data-activated'), entries[0].url);
  await input.evaluate((element) => element.removeAttribute('data-activated'));
  await links.last().focus();
  await page.keyboard.press('Enter');
  assert.equal(await input.getAttribute('data-activated'), entries[18].url);

  await query('otra', 8);
  await more.focus();
  await page.keyboard.press('Space');
  await count(16);
  await focused(links.nth(8));

  // A mouse reader who reaches the last batch keeps focus inside the dialog:
  // the button holding it disappears, so the new rows take over.
  await query('muchos', 8);
  await more.click();
  await count(16);
  await more.click();
  await count(19);
  assert.equal(
    await page.evaluate(() => document.querySelector('[data-search-dialog]').contains(document.activeElement)),
    true,
    'El foco debe quedarse dentro del diálogo al agotar las tandas con el ratón',
  );
  await focused(links.nth(16));
  await hiddenMore();
  assert.equal(await status.textContent(), '19 resultados, 2 ocultos por el modo Java 17');
  await page.keyboard.press('Escape');
  await focused(opener);
  await opener.click();
  await input.fill('lenta');
  assert.equal(await links.count(), 0);
  await hiddenMore();
  await waitFor(() => document.querySelector('[data-search-status]').textContent === 'Buscando...');
  await page.waitForTimeout(200);
  await query('uno', 1);
  await page.waitForTimeout(550);
  await count(1);
  await hiddenMore();
  assert.equal(await status.textContent(), '1 resultado');
  await query('ocho', 8);
  assert.equal(await status.textContent(), '8 resultados');
  await hiddenMore();
  await query('dieciséis', 8);
  await more.focus();
  await page.keyboard.press('Enter');
  await count(16);
  await focused(links.nth(8));
  await hiddenMore();
  assert.equal(await status.textContent(), '16 resultados');
  await query('ocultos', 0);
  assert.equal(await status.textContent(), 'Ningún resultado para «ocultos» en el modo Java 17, 2 ocultos por el modo Java 17.');
  await hiddenMore();
  await query('vacía', 0);
  assert.equal(await status.textContent(), 'Sin resultados para «vacía».');
  await hiddenMore();
  await input.fill('');
  await page.waitForTimeout(200);
  assert.equal(await links.count(), 0);
  assert.equal(await status.isVisible(), false);
  await hiddenMore();
  await query('muchos', 8);
  await input.fill('lenta');
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await focused(opener);
  await page.waitForTimeout(550);
  assert.equal(await page.locator('[data-search-dialog]').evaluate((element) => element.open), false);
  assert.equal(await links.count(), 0);
  await hiddenMore();

  // Query beats storage; invalid and absent modes retain the existing all policy.
  for (const mode of ['?v=all', '?v=99', '']) {
    await page.goto(`${base}/${mode}`);
    await opener.click();
    await query('muchos', 8);
    assert.equal(await status.textContent(), '8 de 21 resultados');
  }
  await page.evaluate(() => localStorage.setItem('javagod:version', '17'));
  await page.goto(`${base}/`);
  await opener.click();
  await query('muchos', 8);
  assert.equal(await status.textContent(), '8 de 19 resultados, 2 ocultos por el modo Java 17');
  await page.goto(`${base}/?v=25`);
  await opener.click();
  await query('muchos', 2);
  assert.equal(await status.textContent(), '2 resultados, 19 ocultos por el modo Java 25');
  await hiddenMore();

  await context.route(/\/pagefind\/pagefind\.js(?:\?.*)?$/, (route) => route.abort());
  await page.goto(`${base}/`);
  await opener.click();
  await query('error', 0);
  assert.equal(await status.textContent(), 'La búsqueda no está disponible todavía: ejecuta `pnpm build` para generar el índice.');
  await hiddenMore();
  console.log('PASS: tandas, orden, filtros, teclado, reinicio, respuestas obsoletas y error de carga');
} catch (error) {
  console.error(`FAIL: ${error.message}; consultas observadas: ${JSON.stringify(requests)}; runtime: ${JSON.stringify(runtimeRequests)}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
