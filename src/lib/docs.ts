/**
 * Documentation navigation derived from content (S3, S9).
 *
 * Nothing here is authored by hand: the tree, the reading order, the
 * breadcrumbs and the previous/next links all come from the chapter files and
 * the section registry. A page that is not published does not appear anywhere,
 * so navigation can never point at a route that does not exist (S7).
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { findSection, sectionRank, sections } from './sections.mjs';

export type Doc = CollectionEntry<'docs'>;

/** A registry entry, inferred from the JavaScript registry (S9). */
export type Section = (typeof sections)[number];

/** Canonical URL for a chapter: derived from the content path, never a slug field. */
export function docHref(doc: Doc): string {
  return `/docs/${doc.id}/`;
}

/**
 * Enforce the content rules that only a whole-collection pass can check (S9, S10).
 *
 * Two rules, each with its own message so a failure names exactly one thing to
 * fix: the section directory must match the declared `section`, and no two
 * chapters may claim the same position in a section.
 */
function assertContentRules(docs: Doc[]): void {
  const seen = new Map<string, Doc>();

  for (const doc of docs) {
    const file = `src/content/docs/${doc.id}.md`;
    const folder = doc.id.split('/')[0];

    if (folder !== doc.data.section) {
      throw new Error(
        `Sección inconsistente en "${file}": el archivo vive en la carpeta "${folder}" ` +
          `pero su frontmatter declara section: "${doc.data.section}". ` +
          `Mueve el archivo a la carpeta "${doc.data.section}" o cambia el section del frontmatter.`,
      );
    }

    const key = `${doc.data.section}:${doc.data.order}`;
    const previous = seen.get(key);

    if (previous) {
      throw new Error(
        `Orden duplicado en la sección "${doc.data.section}": order ${doc.data.order} ` +
          `lo usan "${previous.id}" y "${doc.id}". Cambia el order de una de las dos.`,
      );
    }

    seen.set(key, doc);
  }
}

/** Reading order: section position in the registry, then chapter order. */
function compareDocs(a: Doc, b: Doc): number {
  const bySection = sectionRank(a.data.section) - sectionRank(b.data.section);
  if (bySection !== 0) return bySection;

  const byOrder = a.data.order - b.data.order;
  if (byOrder !== 0) return byOrder;

  return a.data.title.localeCompare(b.data.title, 'es');
}

/** Every chapter, validated and in reading order. */
export async function getDocs(): Promise<Doc[]> {
  const entries = await getCollection('docs');
  assertContentRules(entries);

  return entries.sort(compareDocs);
}

export type DocGroup = {
  section: Section;
  docs: Doc[];
};

/**
 * Chapters grouped by section, in registry order. Sections without published
 * chapters are omitted so no empty branch reaches the navigation.
 */
export function groupDocs(docs: Doc[]): DocGroup[] {
  return sections
    .map((section) => ({ section, docs: docs.filter((doc) => doc.data.section === section.id) }))
    .filter((group) => group.docs.length > 0);
}

/** Section that owns a chapter, when it is registered. */
export function sectionOf(doc: Doc): Section | undefined {
  return findSection(doc.data.section);
}

export type Neighbours = {
  previous?: Doc;
  next?: Doc;
};

/** Previous and next chapters in reading order, for the pager. */
export function getNeighbours(docs: Doc[], id: string): Neighbours {
  const index = docs.findIndex((doc) => doc.id === id);

  if (index === -1) return {};

  return {
    previous: index > 0 ? docs[index - 1] : undefined,
    next: index < docs.length - 1 ? docs[index + 1] : undefined,
  };
}
