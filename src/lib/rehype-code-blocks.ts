/**
 * Code blocks with a header and a copy button (S2, S4).
 *
 * The wrapper is rendered in the build, not created by a script: the block
 * keeps its language label and its copy control in the static HTML, and
 * JavaScript only wires the click. Without JavaScript the button stays hidden
 * through the `.js` class, so nothing promises an action it cannot perform.
 *
 * User rehype plugins run after the highlighter in Astro's pipeline, and the
 * highlighted `<pre>` carries its class as a plain string plus a
 * `data-language` attribute, so both shapes are read here.
 */

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

/** Human readable label for the languages the documentation writes today. */
const languageLabels: Record<string, string> = {
  bash: 'bash',
  java: 'java',
  json: 'json',
  properties: 'properties',
  sql: 'sql',
  text: 'texto',
  txt: 'texto',
  xml: 'xml',
  yaml: 'yaml',
};

/** Class tokens of an element, whatever shape the pipeline left them in. */
function classList(node: HastNode): string[] {
  const value = node.properties?.className ?? node.properties?.class;

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  if (typeof value === 'string') {
    return value.split(/\s+/).filter(Boolean);
  }

  return [];
}

/** Language of a code block, from the highlighter or from Markdown itself. */
function codeLanguage(node: HastNode): string | undefined {
  const attribute = node.properties?.dataLanguage;
  if (typeof attribute === 'string' && attribute) return attribute;

  for (const name of classList(node)) {
    if (name.startsWith('language-')) return name.slice('language-'.length);
  }

  return undefined;
}

function isCodeBlock(node: HastNode): boolean {
  if (node.type !== 'element' || node.tagName !== 'pre') return false;

  return codeLanguage(node) !== undefined || classList(node).includes('astro-code');
}

function wrap(pre: HastNode, language: string): HastNode {
  const label = languageLabels[language] ?? language;

  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['code-block'] },
    children: [
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['code-block__bar'] },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['code-block__lang'] },
            children: [{ type: 'text', value: label }],
          },
          {
            type: 'element',
            tagName: 'button',
            properties: {
              type: 'button',
              className: ['code-block__copy'],
              dataCopy: true,
              ariaLive: 'polite',
            },
            children: [{ type: 'text', value: 'Copiar' }],
          },
        ],
      },
      pre,
    ],
  };
}

export function rehypeCodeBlocks() {
  return (tree: HastNode): void => {
    const transform = (node: HastNode): void => {
      if (!node.children) return;

      node.children = node.children.map((child) => {
        if (isCodeBlock(child)) return wrap(child, codeLanguage(child) ?? 'text');

        transform(child);
        return child;
      });
    };

    transform(tree);
  };
}
