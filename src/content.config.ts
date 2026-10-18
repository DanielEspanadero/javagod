import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { sectionIds } from './lib/sections';

/**
 * Documentation chapters (S9, S10, S12).
 *
 * One Markdown file per chapter under `src/content/docs/<section>/<page>.md`.
 * The URL derives from that path: `/docs/<section>/<page>/`. Frontmatter is
 * strict: unknown keys fail the build, which is what stops a `slug` from
 * quietly diverging from the file path (S12).
 */
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z
    .object({
      title: z.string().min(1),
      description: z.string().min(1),
      section: z.string().refine((value) => sectionIds.includes(value), {
        message: `Sección desconocida. Usa una de: ${sectionIds.join(', ')}`,
      }),
      order: z.number().int().positive(),
    })
    .strict(),
});

export const collections = { docs };
