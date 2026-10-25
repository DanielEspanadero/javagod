/**
 * Callouts written in Markdown (S9, S10).
 *
 * A blockquote whose first line starts with a marker becomes a labelled aside,
 * so authors never need a component or an import:
 *
 *     > [!NOTA]
 *     > El texto del aviso.
 *
 * The accepted markers live here. An unknown marker fails the build with the
 * list of valid ones instead of silently rendering a plain quote.
 */

type MdastNode = {
  type: string;
  value?: string;
  children?: MdastNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
};

/** Marker in the source to the class suffix and the visible label. */
const markers: Record<string, { kind: string; label: string }> = {
  NOTA: { kind: 'nota', label: 'Nota' },
  OJO: { kind: 'ojo', label: 'Ojo' },
  AVISO: { kind: 'aviso', label: 'Aviso' },
  TRUCO: { kind: 'truco', label: 'Truco' },
};

const markerPattern = /^\[!([A-ZÁÉÍÓÚÑ]+)\][ \t]*/;

function collectBlockquotes(node: MdastNode, found: MdastNode[]): void {
  if (node.type === 'blockquote') found.push(node);
  for (const child of node.children ?? []) collectBlockquotes(child, found);
}

export function remarkCallouts() {
  return (tree: MdastNode): void => {
    const blockquotes: MdastNode[] = [];
    collectBlockquotes(tree, blockquotes);

    for (const quote of blockquotes) {
      const first = quote.children?.[0];
      if (!first || first.type !== 'paragraph') continue;

      const lead = first.children?.[0];
      if (!lead || lead.type !== 'text' || typeof lead.value !== 'string') continue;

      const match = markerPattern.exec(lead.value);
      if (!match) continue;

      const marker = markers[match[1]];

      if (!marker) {
        const valid = Object.keys(markers)
          .map((name) => `[!${name}]`)
          .join(', ');
        throw new Error(
          `Callout desconocido "[!${match[1]}]". Usa uno de: ${valid}.`,
        );
      }

      const rest = lead.value.slice(match[0].length);
      if (rest) {
        lead.value = rest;
      } else {
        first.children?.shift();
      }

      // The paragraph may have been nothing but the marker.
      if (first.children && first.children.length === 0) quote.children?.shift();

      quote.data = {
        ...quote.data,
        hName: 'aside',
        hProperties: { class: `callout callout--${marker.kind}` },
      };

      quote.children?.unshift({
        type: 'paragraph',
        data: { hName: 'p', hProperties: { class: 'callout__title' } },
        children: [{ type: 'text', value: marker.label }],
      });
    }
  };
}
