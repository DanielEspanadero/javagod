import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { sectionIds } from './lib/sections.mjs';
import { isLtsVersion, ltsVersions } from './lib/versions.mjs';

/**
 * Documentation chapters (S9, S10, S12).
 *
 * One Markdown file per chapter under `src/content/docs/<section>/<page>.md`.
 * The URL derives from that path: `/docs/<section>/<page>/`. Frontmatter is
 * strict: unknown keys fail the build, which is what stops a `slug` from
 * quietly diverging from the file path (S12).
 *
 * `since` and `hasta` are LTS releases only (S11, S16): they feed the version
 * reading mode, which never forks the content tree.
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
      since: z
        .number({
          error: `Falta since o no es un número. Indica la primera versión LTS en la que el capítulo se lee entero: ${ltsVersions.join(', ')}.`,
        })
        .int(`since tiene que ser un número entero. Usa una versión LTS: ${ltsVersions.join(', ')}.`)
        .refine(isLtsVersion, {
          message: `since no es una versión LTS. Usa una de: ${ltsVersions.join(', ')}.`,
        }),
      hasta: z
        .number({
          error: `hasta no es un número. Indica una versión LTS o quita la clave: ${ltsVersions.join(', ')}.`,
        })
        .int(`hasta tiene que ser un número entero. Usa una versión LTS: ${ltsVersions.join(', ')}.`)
        .refine(isLtsVersion, {
          message: `hasta no es una versión LTS. Usa una de: ${ltsVersions.join(', ')}.`,
        })
        .optional(),
    })
    .strict(),
});

export const collections = { docs };
