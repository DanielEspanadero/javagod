#!/usr/bin/env node
/**
 * Authoring scaffolder for documentation chapters (S9).
 *
 * Creating a chapter is one Markdown file with valid frontmatter and nothing
 * else, so this script writes exactly that file: the section comes from the
 * registry, the `order` is one more than the highest one already used in the
 * section, and the URL derives from the path (S12).
 *
 *   node scripts/new-doc.mjs <sección> <slug> --title "<Título>" [--description "<frase>"]
 *
 * Node only, no dependencies: the registry is imported from
 * `src/lib/sections.mjs` and the existing `order` values are read with a plain
 * regex over the frontmatter, so there is no YAML parser to keep up to date.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { sectionIds } from '../src/lib/sections.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src', 'content', 'docs');

/** Kebab-case: lowercase words joined by single hyphens, so the slug is URL safe. */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const USAGE = `Uso: pnpm new:doc <sección> <slug> --title "<Título>" [--description "<frase>"]

  <sección>   id de una sección del registro: ${sectionIds.join(', ')}
  <slug>      nombre del archivo en kebab-case, por ejemplo tipos-primitivos
  --title     título del capítulo, obligatorio
  --description  frase que se ve en el índice y en los metadatos

Ejemplo: pnpm new:doc fundamentos tipos-primitivos --title "Tipos primitivos"`;

/**
 * Split argv into the two positional arguments and the two known flags.
 *
 * @param {string[]} argv
 * @returns {{ error?: string, section?: string, slug?: string, title?: string, description?: string }}
 */
function parseArgs(argv) {
  const positional = [];
  const flags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--title' || arg === '--description') {
      const value = argv[index + 1];

      if (value === undefined || value.startsWith('-')) {
        return { error: `Falta el valor de ${arg}.` };
      }

      flags[arg.slice(2)] = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('-')) {
      return { error: `Opción desconocida: ${arg}.` };
    }

    positional.push(arg);
  }

  if (positional.length > 2) {
    return { error: `Sobran argumentos: ${positional.slice(2).join(' ')}.` };
  }

  return {
    section: positional[0],
    slug: positional[1],
    title: flags.title,
    description: flags.description,
  };
}

/** YAML single-quoted scalar: one newline becomes a space and a quote is doubled. */
function quote(value) {
  return `'${value.replace(/[\r\n]+/g, ' ').replace(/'/g, "''")}'`;
}

/** Chapter file names of a section directory, or none when it does not exist yet. */
async function chapterFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md')).map((entry) => entry.name);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

/**
 * Highest `order` already declared in a section directory, or 0 when there is
 * none. Only the frontmatter block is inspected, so an `order:` in prose can
 * never change the result.
 */
async function highestOrder(dir) {
  let highest = 0;

  for (const file of await chapterFiles(dir)) {
    const source = await readFile(path.join(dir, file), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) continue;

    const order = frontmatter[1].match(/^order:[ \t]*(\d+)[ \t]*$/m);
    if (order) highest = Math.max(highest, Number(order[1]));
  }

  return highest;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.error) {
    console.error(`✗ ${args.error}`);
    console.error(USAGE);
    return 1;
  }

  const { section, slug, title } = args;

  if (!section || !slug) {
    console.error('✗ Faltan la sección o el slug del capítulo.');
    console.error(USAGE);
    return 1;
  }

  if (!title || title.trim() === '') {
    console.error('✗ Falta --title: el capítulo necesita un título no vacío.');
    console.error(USAGE);
    return 1;
  }

  if (!sectionIds.includes(section)) {
    console.error(`✗ Sección desconocida: "${section}".`);
    console.error(`· Usa una de: ${sectionIds.join(', ')}.`);
    return 1;
  }

  if (!SLUG_PATTERN.test(slug)) {
    console.error(`✗ Slug inválido: "${slug}".`);
    console.error('· Usa kebab-case en minúsculas, por ejemplo tipos-primitivos.');
    return 1;
  }

  const dir = path.join(CONTENT_DIR, section);
  const file = path.join(dir, `${slug}.md`);
  const existing = await chapterFiles(dir);

  if (existing.includes(`${slug}.md`)) {
    console.error(`✗ Ya existe src/content/docs/${section}/${slug}.md. No se sobrescribe nada.`);
    console.error('· Cambia el slug o edita el capítulo que ya está.');
    return 1;
  }

  const order = (await highestOrder(dir)) + 1;
  const description = args.description?.trim() ? args.description : title.trim();

  const frontmatter = [
    '---',
    `title: ${quote(title.trim())}`,
    `description: ${quote(description)}`,
    `section: ${section}`,
    `order: ${order}`,
    '---',
    '',
  ].join('\n');

  await mkdir(dir, { recursive: true });

  try {
    await writeFile(file, frontmatter, { flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') {
      console.error(`✗ Ya existe src/content/docs/${section}/${slug}.md. No se sobrescribe nada.`);
      return 1;
    }
    throw error;
  }

  if (description === title.trim()) {
    console.log('· Sin --description: se usa el título como descripción.');
  }

  console.log(`✓ Creado src/content/docs/${section}/${slug}.md (order ${order})`);
  console.log(`· URL: /docs/${section}/${slug}/`);
  return 0;
}

process.exitCode = await main();
