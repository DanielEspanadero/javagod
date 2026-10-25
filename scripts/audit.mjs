#!/usr/bin/env node
/**
 * Post-build audit for the JavaGod static site.
 *
 * Enforces three build rules from the project specs (S7, S2, S10):
 *   1. every internal href resolves to something that actually exists in dist/
 *   2. every generated page has exactly one <h1>
 *   3. every class used in markup has a matching class rule in the built CSS
 *
 * Node only, no dependencies. Exits 1 when anything fails.
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DIST = path.resolve(process.argv[2] ?? 'dist');

const failures = [];

const note = (message) => {
  console.log(`· ${message}`);
};

const fail = (message) => {
  failures.push(message);
  console.log(`✗ ${message}`);
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

/** Strip HTML comments so commented-out markup never affects the audit. */
const stripHtmlComments = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

/**
 * Collect class names from CSS source.
 *
 * The text before every `{` is treated as a selector prelude. Junk picked up
 * from declaration tails only ever adds harmless extra names; a real selector
 * can never be missed, which is the direction that matters here.
 */
function collectCssClasses(css, into) {
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, ' ');

  for (const match of cleaned.matchAll(/([^{}]+)\{/g)) {
    const prelude = match[1].trim();
    if (!prelude || prelude.startsWith('@')) continue;

    for (const name of prelude.matchAll(/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g)) {
      into.add(name[1]);
    }
  }

  return into;
}

/** Extract `class="..."` values from an HTML fragment. */
function collectMarkupClasses(html, into) {
  for (const match of html.matchAll(/\bclass\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const value = match[2] ?? match[3] ?? '';
    for (const token of value.split(/\s+/)) {
      if (token) into.add(token);
    }
  }

  return into;
}

/** Extract `href="..."` values from an HTML fragment. */
function collectHrefs(html) {
  const hrefs = [];
  for (const match of html.matchAll(/\bhref\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const value = (match[2] ?? match[3] ?? '').trim();
    if (value) hrefs.push(value);
  }
  return hrefs;
}

async function main() {
  try {
    const info = await stat(DIST);
    if (!info.isDirectory()) throw new Error('not a directory');
  } catch (error) {
    fail(`No existe el directorio ${path.relative(process.cwd(), DIST) || DIST}. Corré \`pnpm build\` primero.`);
    return 1;
  }

  const files = await walk(DIST);
  const relativeFiles = new Map(files.map((file) => [path.relative(DIST, file).split(path.sep).join('/'), file]));
  const htmlFiles = [...relativeFiles.entries()].filter(([name]) => name.endsWith('.html'));
  const cssFiles = [...relativeFiles.entries()].filter(([name]) => name.endsWith('.css'));

  if (htmlFiles.length === 0) {
    fail('No se generó ninguna página HTML en dist/.');
    return 1;
  }

  /* ---- CSS knowledge: built stylesheets plus inline <style> blocks ---- */
  const cssClasses = new Set();

  for (const [, file] of cssFiles) {
    collectCssClasses(await readFile(file, 'utf8'), cssClasses);
  }

  const pages = [];

  for (const [name, file] of htmlFiles) {
    const html = await readFile(file, 'utf8');

    for (const block of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
      collectCssClasses(block[1], cssClasses);
    }

    const withoutStyles = stripHtmlComments(html).replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
    const markup = withoutStyles.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');

    pages.push({ name, markup });
  }

  /* ---- Check 1: internal links resolve ---- */
  const assetExtensions = /\.(svg|png|jpe?g|webp|avif|gif|ico|css|js|mjs|json|txt|xml|webmanifest|woff2?|ttf|otf|pdf)$/i;
  let checkedLinks = 0;

  for (const page of pages) {
    for (const href of collectHrefs(page.markup)) {
      if (href.startsWith('#')) continue;
      if (!href.startsWith('/') || href.startsWith('//')) continue;

      checkedLinks += 1;

      const [rawPath] = href.split('#')[0].split('?');
      const decoded = decodeURIComponent(rawPath);
      const trimmed = decoded.replace(/\/+$/, '');
      const isAsset = assetExtensions.test(trimmed);

      const candidates = isAsset
        ? [trimmed.replace(/^\/+/, '')]
        : trimmed === ''
          ? ['index.html']
          : [`${trimmed.replace(/^\/+/, '')}/index.html`, `${trimmed.replace(/^\/+/, '')}.html`];

      const resolved = candidates.some((candidate) => relativeFiles.has(path.posix.normalize(candidate)));

      if (!resolved) {
        const kind = isAsset ? 'recurso' : 'página';
        fail(`Link interno roto en ${page.name}: ${href} (no hay ${kind} en dist/)`);
      }
    }
  }

  /* ---- Check 2: exactly one <h1> per page ---- */
  let headingsOk = true;

  for (const page of pages) {
    const count = [...page.markup.matchAll(/<h1[\s>]/gi)].length;

    if (count !== 1) {
      headingsOk = false;
      fail(`${page.name}: esperaba exactamente 1 <h1> y encontré ${count}.`);
    }
  }

  /* ---- Check 3: every markup class has a CSS rule ---- */
  const markupClasses = new Set();
  const missing = new Map();

  for (const page of pages) {
    const pageClasses = collectMarkupClasses(page.markup, new Set());

    for (const className of pageClasses) {
      markupClasses.add(className);
      if (!cssClasses.has(className)) {
        if (!missing.has(className)) missing.set(className, new Set());
        missing.get(className).add(page.name);
      }
    }
  }

  for (const [className, where] of [...missing.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    fail(`Clase sin regla CSS: .${className} (usada en ${[...where].join(', ')})`);
  }

  /* ---- Check 4: forbidden punctuation in published pages ---- */
  const FORBIDDEN = [
    { char: '\u2014', name: 'guion largo (em dash)' },
    { char: '\u2013', name: 'guion medio (en dash)' },
  ];

  let forbiddenOk = true;

  for (const page of pages) {
    for (const { char, name } of FORBIDDEN) {
      const at = page.markup.indexOf(char);
      if (at === -1) continue;

      forbiddenOk = false;
      const context = page.markup.slice(Math.max(0, at - 40), at + 40).replace(/\s+/g, ' ');
      fail(`Carácter no permitido en ${page.name}: ${name} en "…${context}…"`);
    }
  }

  if (forbiddenOk) {
    note('Puntuación: sin guiones largos ni medios en el HTML publicado');
  }

  /* ---- Check 5: delivery budget ---- */
  const PAGE_BUDGET = 150 * 1024;
  const CSS_BUDGET = 70 * 1024;
  const THIRD_PARTY = /<(?:script|img|iframe|source|link)\b[^>]*\b(?:src|href)="https?:\/\//i;

  let budgetOk = true;

  for (const page of pages) {
    const bytes = Buffer.byteLength(page.markup, 'utf8');
    if (bytes > PAGE_BUDGET) {
      budgetOk = false;
      fail(`${page.name}: ${Math.round(bytes / 1024)} KB de HTML, por encima del presupuesto de ${PAGE_BUDGET / 1024} KB.`);
    }

    const remote = THIRD_PARTY.exec(page.markup);
    if (remote) {
      budgetOk = false;
      fail(`${page.name}: recurso de terceros en el HTML (${remote[0].slice(0, 60)}…).`);
    }
  }

  let cssBytes = 0;

  for (const [name, file] of cssFiles) {
    const css = await readFile(file, 'utf8');
    /* Pagefind ships its own stylesheets and only loads them with the dialog;
       the budget covers the CSS this repository authors. */
    if (name.startsWith('_astro/')) cssBytes += Buffer.byteLength(css, 'utf8');

    if (/@import\s+(?:url\()?\s*['"]?https?:/i.test(css)) {
      budgetOk = false;
      fail(`${name}: importa una hoja de estilos de terceros.`);
    }

    for (const match of css.matchAll(/url\((['"]?)(\/fonts\/[^)'"]+)\1\)/g)) {
      const asset = match[2].replace(/^\/+/, '');
      if (!relativeFiles.has(asset)) {
        budgetOk = false;
        fail(`${name}: la tipografía ${match[2]} no está en dist/.`);
      }
    }
  }

  if (cssBytes > CSS_BUDGET) {
    budgetOk = false;
    fail(`CSS: ${Math.round(cssBytes / 1024)} KB, por encima del presupuesto de ${CSS_BUDGET / 1024} KB.`);
  }

  if (budgetOk) {
    note(`Presupuesto: HTML máximo ${Math.round(Math.max(...pages.map((page) => Buffer.byteLength(page.markup, 'utf8'))) / 1024)} KB de ${PAGE_BUDGET / 1024} · CSS ${Math.round(cssBytes / 1024)} KB de ${CSS_BUDGET / 1024} · sin recursos de terceros`);
  }

  note(`Páginas generadas: ${pages.length}`);
  note(`Hojas de estilo: ${cssFiles.length} archivo(s) + bloques <style> inline`);
  note(`Links internos verificados: ${checkedLinks}`);
  note(`Clases en markup: ${markupClasses.size} · clases con regla: ${cssClasses.size}`);
  if (headingsOk) {
    note('<h1> por página: exactamente 1 en todas');
  }

  if (failures.length > 0) {
    console.log('');
    console.log(`✗ Auditoría falló: ${failures.length} problema(s).`);
    return 1;
  }

  console.log('');
  console.log('✓ Auditoría limpia.');
  return 0;
}

process.exitCode = await main();
