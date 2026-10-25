#!/usr/bin/env node
/**
 * URL contract check for the JavaGod static site (S12).
 *
 * URLs are public: the slug derives from the file path, and moving a file is a
 * breaking change unless `public/_redirects` declares where the old URL goes.
 * `src/urls.json` is the committed manifest of everything that is published, so
 * a rename cannot pass silently by simply dropping the old URL from it.
 *
 * Enforces four rules:
 *   (a) every URL in the manifest is still built or covered by a redirect source
 *   (b) no redirect source is also a live route, which would shadow the redirect
 *   (c) every redirect target is a live route
 *   (d) every live route is registered in the manifest
 *
 *   node scripts/check-urls.mjs            check
 *   node scripts/check-urls.mjs --update   register the live routes that are missing
 *
 * `--update` only adds: it never removes an entry, and it still runs rules (a),
 * (b) and (c) afterwards so a rename cannot be papered over by registering the
 * new URL.
 *
 * Node only, no dependencies. Exits 1 when anything fails.
 */
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const MANIFEST = path.join(ROOT, 'src', 'urls.json');
const REDIRECTS = path.join(ROOT, 'public', '_redirects');

const update = process.argv.slice(2).includes('--update');

const failures = [];

const fail = (message) => {
  failures.push(message);
  console.log(`✗ ${message}`);
};

const note = (message) => {
  console.log(`· ${message}`);
};

/** Recursively list every file under `dir`, as absolute paths. */
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }

  return files;
}

/**
 * Trailing slashes are optional in a request, so `/docs/x` and `/docs/x/` are
 * the same route. Comparisons always go through here.
 */
const normalize = (url) => url.replace(/\/+$/, '') || '/';

/** Absolute redirect targets point outside the site and are not built routes. */
const isExternal = (url) => /^[a-z][a-z0-9+.-]*:/i.test(url);

/** Every `index.html` in dist/ as the URL it is served at. */
async function builtRoutes() {
  const files = await walk(DIST);
  const routes = files
    .map((file) => path.relative(DIST, file).split(path.sep).join('/'))
    .filter((name) => name === 'index.html' || name.endsWith('/index.html'))
    .map((name) => `/${name.slice(0, name.length - 'index.html'.length)}`);

  return [...new Set(routes)].sort();
}

/**
 * Read the manifest. The file is the published contract, so a missing or
 * unreadable one is a hard error rather than an empty list.
 *
 * @returns {Promise<string[]>}
 */
async function readManifest() {
  const source = await readFile(MANIFEST, 'utf8');
  const parsed = JSON.parse(source);

  if (parsed === null || typeof parsed !== 'object' || !Array.isArray(parsed.urls)) {
    throw new Error('le falta el array "urls"');
  }

  return parsed.urls.map(String);
}

/**
 * Parse `public/_redirects` (Cloudflare Pages format: `/from /to [status]`),
 * ignoring blank lines and `#` comments. A line with fewer than two fields is
 * reported with its line number instead of being skipped silently.
 *
 * @returns {Promise<{ redirects: { from: string, to: string, status?: string }[], errors: { line: number, text: string }[] }>}
 */
async function readRedirects() {
  let source;

  try {
    source = await readFile(REDIRECTS, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      note('No existe public/_redirects: no hay redirects declarados.');
      return { redirects: [], errors: [] };
    }
    throw error;
  }

  const redirects = [];
  const errors = [];

  source.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) return;

    const [from, to, status] = line.split(/\s+/);

    if (!from || !to) {
      errors.push({ line: index + 1, text: line });
      return;
    }

    redirects.push({ from, to, status });
  });

  return { redirects, errors };
}

/** Rewrite the manifest sorted, keeping every entry that was already there. */
async function writeManifest(urls) {
  const sorted = [...urls].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  await writeFile(MANIFEST, `${JSON.stringify({ urls: sorted }, null, 2)}\n`, 'utf8');
  return sorted;
}

async function main() {
  try {
    const info = await stat(DIST);
    if (!info.isDirectory()) throw new Error('not a directory');
  } catch (error) {
    fail(`No existe dist/. Corre \`pnpm build\` antes de comprobar las URLs.`);
    return 1;
  }

  let routes;

  try {
    routes = await builtRoutes();
  } catch (error) {
    fail(`No se pudo leer dist/: ${error.message}.`);
    return 1;
  }

  if (routes.length === 0) {
    fail('No se generó ninguna ruta en dist/: no hay ningún index.html.');
    return 1;
  }

  let manifest;

  try {
    manifest = await readManifest();
  } catch (error) {
    fail(`No se pudo leer src/urls.json: ${error.message}.`);
    return 1;
  }

  const { redirects, errors: invalidLines } = await readRedirects();

  const routeSet = new Set(routes.map(normalize));
  const sourceSet = new Set(redirects.map((redirect) => normalize(redirect.from)));

  /* ---- Optional registration of the live routes that are missing ---- */
  if (update) {
    const registered = new Set(manifest.map(normalize));
    const missing = routes.filter((route) => !registered.has(normalize(route)));

    if (missing.length === 0) {
      note('src/urls.json ya tiene todas las rutas generadas.');
    } else {
      manifest = await writeManifest([...manifest, ...missing]);
      console.log(`✓ src/urls.json actualizado: +${missing.length} URL(s) (${missing.join(', ')})`);
    }
  }

  const manifestSet = new Set(manifest.map(normalize));

  /* ---- Rule (a): the manifest still describes what is published ---- */
  const missed = manifest.filter((url) => !routeSet.has(normalize(url)) && !sourceSet.has(normalize(url)));

  for (const url of missed) {
    fail(
      `URL desaparecida: ${url} ya no se genera y ningún redirect la cubre. ` +
        `Añade una línea en public/_redirects (/ruta-vieja/ /ruta-nueva/ 301) o recupera la página.`,
    );
  }

  /* ---- Rule (b): a redirect source must not be a live route ---- */
  const shadowed = redirects.filter((redirect) => routeSet.has(normalize(redirect.from)));

  for (const redirect of shadowed) {
    fail(
      `Redirect tapado: ${redirect.from} está en public/_redirects y además se genera como ruta. ` +
        `Un redirect solo cubre URLs que ya no existen.`,
    );
  }

  for (const error of invalidLines) {
    fail(
      `Línea inválida en public/_redirects (línea ${error.line}): "${error.text}". ` +
        `Necesita al menos origen y destino.`,
    );
  }

  /* ---- Rule (c): a redirect target must be a live route ---- */
  const broken = redirects.filter(
    (redirect) => !isExternal(redirect.to) && !routeSet.has(normalize(redirect.to)),
  );

  for (const redirect of broken) {
    fail(
      `Destino roto: el redirect ${redirect.from} -> ${redirect.to} apunta a una ruta que no se genera. ` +
        `Corrige el destino en public/_redirects.`,
    );
  }

  /* ---- Rule (d): a live route must be registered ---- */
  const unregistered = routes.filter((route) => !manifestSet.has(normalize(route)));

  for (const route of unregistered) {
    fail(
      `URL sin registrar: ${route} se genera y no está en src/urls.json. ` +
        `Corre \`pnpm urls:update\` y commitea el archivo.`,
    );
  }

  /* ---- One summary line per rule ---- */
  const allRulesOk = failures.length === 0;

  console.log('');
  note(
    `Rutas generadas: ${routes.length} · redirects: ${redirects.length} · ` +
      `URLs en src/urls.json: ${manifest.length}`,
  );

  if (missed.length === 0) {
    note(`(a) contrato: las ${manifest.length} URL(s) de src/urls.json siguen publicadas`);
  } else {
    note(`(a) contrato: ${missed.length} URL(s) de src/urls.json ya no se publican`);
  }

  if (shadowed.length === 0 && invalidLines.length === 0) {
    note(`(b) redirects: ${redirects.length} declarado(s), ninguno pisa una ruta viva`);
  } else {
    note(`(b) redirects: ${shadowed.length} pisan una ruta viva, ${invalidLines.length} línea(s) inválida(s)`);
  }

  if (broken.length === 0) {
    note(`(c) destinos: los ${redirects.length} destino(s) de redirect existen`);
  } else {
    note(`(c) destinos: ${broken.length} destino(s) de redirect no existen`);
  }

  if (unregistered.length === 0) {
    note(`(d) registro: las ${routes.length} rutas generadas están en el manifiesto`);
  } else {
    note(`(d) registro: ${unregistered.length} ruta(s) generadas sin registrar`);
  }

  if (!allRulesOk) {
    console.log('');
    console.log(`✗ Contrato de URLs roto: ${failures.length} problema(s).`);
    return 1;
  }

  console.log('');
  console.log('✓ Contrato de URLs limpio.');
  return 0;
}

process.exitCode = await main();
