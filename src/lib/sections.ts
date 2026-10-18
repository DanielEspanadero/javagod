/**
 * Section registry (S9).
 *
 * This is the only place where documentation section titles and ordering are
 * declared. Chapters name a section by `id` in their frontmatter; the content
 * schema validates that id against this list, so an unknown section fails the
 * build instead of producing an unreachable page.
 *
 * Adding a section is one entry here. Adding a chapter is one Markdown file.
 */

export type Section = {
  /** Stable identifier used in frontmatter and anchors. Never translated. */
  id: string;
  /** Title shown in navigation, breadcrumbs and the docs index. */
  title: string;
  /** One line explaining what the section covers. */
  summary: string;
};

export const sections: readonly Section[] = [
  {
    id: 'fundamentos',
    title: 'Fundamentos',
    summary: 'La JVM, los tipos y el control de flujo, desde un Hola, mundo.',
  },
  {
    id: 'objetos',
    title: 'Orientación a Objetos',
    summary: 'Clases, encapsulamiento, herencia e interfaces, con la memoria a la vista.',
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
];

/** Section ids in registry order, for the content schema and ordering. */
export const sectionIds: readonly string[] = sections.map((section) => section.id);

/** Resolve a section id, or `undefined` when it is not registered. */
export function findSection(id: string): Section | undefined {
  return sections.find((section) => section.id === id);
}

/** Registry position, used to sort chapters across sections. */
export function sectionRank(id: string): number {
  const index = sections.findIndex((section) => section.id === id);
  return index === -1 ? sections.length : index;
}
