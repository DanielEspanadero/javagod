/**
 * Horizontal scroll container for Markdown tables (S2, S13).
 *
 * A table cannot shrink below the width of its content, so a wide table used
 * to widen the whole page on a narrow viewport. The wrapper is rendered in
 * the build, the same way code blocks get their chrome: no script has to move
 * nodes at runtime, and the table stays a plain table in the source.
 */

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

function isTable(node: HastNode): boolean {
  return node.type === 'element' && node.tagName === 'table';
}

/** Put one table inside a container that can scroll on its own. */
function wrap(table: HastNode): HastNode {
  return {
    type: 'element',
    tagName: 'div',
    properties: {
      className: ['table-wrap'],
      // A scroll container has to be reachable without a pointer, otherwise a
      // keyboard user can never move a wide table into view.
      tabIndex: 0,
    },
    children: [table],
  };
}

export function rehypeTableWrap() {
  return (tree: HastNode): void => {
    const transform = (node: HastNode): void => {
      if (!node.children) return;

      node.children = node.children.map((child) => {
        if (isTable(child)) return wrap(child);

        transform(child);
        return child;
      });
    };

    transform(tree);
  };
}
