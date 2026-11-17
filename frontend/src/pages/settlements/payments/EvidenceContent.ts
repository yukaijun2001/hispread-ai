// Renders an evidence tree as Vue vnodes. Text is always a text child, so
// stored content can never inject markup.
import { h, type FunctionalComponent, type VNodeChild } from 'vue';
import type { EvidenceNode } from './evidence';

const TAGS: Record<string, string> = {
  paragraph: 'p', bold: 'strong', italic: 'em', underline: 'u', bulletList: 'ul', orderedList: 'ol', listItem: 'li',
};

function render(node: EvidenceNode): VNodeChild {
  if (node.type === 'text') return node.text;
  if (node.type === 'br') return h('br');
  const children = Array.isArray(node.children) ? node.children.map(render) : [];
  if (node.type === 'doc') return children;
  const tag = TAGS[node.type];
  return tag ? h(tag, children) : null;
}

const EvidenceContent: FunctionalComponent<{ node: EvidenceNode }> = (props) => render(props.node);
EvidenceContent.props = ['node'];

export default EvidenceContent;
