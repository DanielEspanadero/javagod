// @ts-check
import { defineConfig } from 'astro/config';

// Canonical origin per environment: production sets JAVAGOD_SITE_URL, any Cloudflare
// deployment falls back to its own URL, and local builds use the placeholder.
const site =
  process.env.JAVAGOD_SITE_URL ?? process.env.CF_PAGES_URL ?? 'https://javagod.pages.dev';

export default defineConfig({
  site,
  build: {
    inlineStylesheets: 'auto',
  },
  markdown: {
    // Dual themes: tokens carry both palettes as CSS variables and docs.css
    // picks one from the site's own theme attribute, not only from the OS.
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
