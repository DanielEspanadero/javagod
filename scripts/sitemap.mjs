#!/usr/bin/env node
/**
 * Sitemap and robots generation (S32).
 *
 * Both files are derived from the committed route manifest, which the URL
 * contract already validates, so the sitemap can never advertise a page the
 * site does not publish. No dependency: the manifest is JSON and the output is
 * plain text.
 *
 *   node scripts/sitemap.mjs
 *
 * The origin follows the same chain as `astro.config.mjs`: production sets
 * `JAVAGOD_SITE_URL`, any Cloudflare deployment falls back to its own URL, and
 * a local build uses the placeholder. Nothing is written outside `dist`.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const MANIFEST = path.join(ROOT, 'src', 'urls.json');

const origin = (
  process.env.JAVAGOD_SITE_URL ??
  process.env.CF_PAGES_URL ??
  'https://javagod.pages.dev'
).replace(/\/+$/, '');

const { urls } = JSON.parse(await readFile(MANIFEST, 'utf8'));

// The 404 page is reachable by design but is not an indexable route.
const published = urls.filter((url) => !url.includes('404'));

const today = new Date().toISOString().slice(0, 10);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${published
  .map(
    (url) => `  <url>
    <loc>${origin}${url}</loc>
    <lastmod>${today}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const robots = `# JavaGod: static documentation site, everything is public.
User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;

await writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8');
await writeFile(path.join(DIST, 'robots.txt'), robots, 'utf8');

console.log(`✓ Sitemap: ${published.length} rutas · robots.txt · origen ${origin}`);
