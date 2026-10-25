/**
 * Section registry (S9).
 *
 * This is the only place where documentation section titles and ordering are
 * declared. Chapters name a section by `id` in their frontmatter; the content
 * schema validates that id against this list, so an unknown section fails the
 * build instead of producing an unreachable page.
 *
 * Adding a section is one entry here. Adding a chapter is one Markdown file.
 *
 * Plain JavaScript on purpose: `scripts/new-doc.mjs` reads this registry to
 * validate the section of a new chapter, and Node cannot import a TypeScript
 * file without a loader flag (`.node-version` pins Node 22.12). Types live in
 * JSDoc so the site still type-checks while the scaffolder stays dependency free.
 */

/**
 * One documentation section.
 *
 * @typedef {object} Section
 * @property {string} id Stable identifier used in frontmatter and anchors. Never translated.
 * @property {string} title Title shown in navigation, breadcrumbs and the docs index.
 * @property {string} summary One line explaining what the section covers.
 */

/** @type {readonly Section[]} */
export const sections = [
  {
    id: 'fundamentos',
    title: 'Fundamentos',
    summary: 'La JVM, los tipos y el control de flujo, desde un Hola, mundo.',
  },
  {
    id: 'objetos',
    title: 'Programación Orientada a Objetos',
    summary:
      'Clases y objetos, y los cuatro pilares: encapsulamiento, herencia, polimorfismo y abstracción, con la memoria a la vista.',
  },
  {
    id: 'colecciones',
    title: 'Collections y Streams',
    summary: 'Listas, mapas, conjuntos y el pipeline funcional de Stream.',
  },
  {
    id: 'concurrencia',
    title: 'Concurrencia',
    summary: 'Hilos, estados, locks y memoria compartida, sin humo.',
  },
  {
    id: 'novedades',
    title: 'Novedades por versión',
    summary: 'Qué trajo cada LTS, qué se quedó por el camino y qué cambió sin avisar.',
  },
];

/** Section ids in registry order, for the content schema and ordering. */
export const sectionIds = sections.map((section) => section.id);

/**
 * Resolve a section id, or `undefined` when it is not registered.
 *
 * @param {string} id
 * @returns {Section | undefined}
 */
export function findSection(id) {
  return sections.find((section) => section.id === id);
}

/**
 * Registry position, used to sort chapters across sections.
 *
 * @param {string} id
 * @returns {number}
 */
export function sectionRank(id) {
  const index = sections.findIndex((section) => section.id === id);
  return index === -1 ? sections.length : index;
}
