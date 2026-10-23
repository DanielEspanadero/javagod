// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { remarkCallouts } from './src/lib/remark-callouts';
import { rehypeCodeBlocks } from './src/lib/rehype-code-blocks';
import { rehypeTableWrap } from './src/lib/rehype-table-wrap';

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
    // The remark/rehype pipeline (Astro's official opt-in processor) is what
    // lets content stay Markdown-only: callouts and code chrome are derived at
    // build time from the source, never by hand in a component.
    processor: unified({
      remarkPlugins: [remarkCallouts],
      rehypePlugins: [rehypeCodeBlocks, rehypeTableWrap],
    }),
    // Dual themes: tokens carry both palettes as CSS variables and docs.css
    // picks one from the site's own theme attribute, not only from the OS.
    shikiConfig: {
      themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
      defaultColor: false,
    },
  },
});
