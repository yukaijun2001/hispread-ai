// Payment evidence: a formatted note stored as a JSON tree (never HTML) plus
// PDF/PNG/JPEG attachments. The editor converts its DOM to the tree with an
// allow-list of node types; everything is rendered back through text nodes.
import { ref, shallowRef } from 'vue';
import { uploadDocument } from '../../../lib/api';
import { t } from '../../../lib/i18n';

export type EvidenceNode =
  | { type: 'text'; text: string }
  | { type: 'br' }
  | { type: 'doc' | 'paragraph' | 'bold' | 'italic' | 'underline' | 'bulletList' | 'orderedList' | 'listItem'; children: EvidenceNode[] };
export type EvidenceDoc = { type: 'doc'; children: EvidenceNode[] };

export interface EvidenceAttachment { id: string; name: string; contentType: string; bytes: number }
export interface Evidence { content: EvidenceDoc; attachments: EvidenceAttachment[] }

const TAGS: Record<string, EvidenceNode['type']> = {
  P: 'paragraph', DIV: 'paragraph', B: 'bold', STRONG: 'bold', I: 'italic', EM: 'italic', U: 'underline', UL: 'bulletList', OL: 'orderedList', LI: 'listItem',
};
const ELEMENTS: Record<string, string> = {
  doc: 'div', paragraph: 'p', bold: 'strong', italic: 'em', underline: 'u', bulletList: 'ul', orderedList: 'ol', listItem: 'li',
};
const SKIPPED = ['SCRIPT', 'STYLE', 'IFRAME', 'IMG'];

export const emptyDoc = (): EvidenceDoc => ({ type: 'doc', children: [] });

/** Read the editor's DOM into the evidence tree; unknown elements keep only their text. */
export function domToDoc(root: HTMLElement): EvidenceDoc {
  const convert = (node: Node): EvidenceNode[] => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ? [{ type: 'text', text: node.textContent }] : [];
    if (!(node instanceof HTMLElement) || SKIPPED.includes(node.tagName)) return [];
    if (node.tagName === 'BR') return [{ type: 'br' }];
    const children = Array.from(node.childNodes).flatMap(convert);
    const type = TAGS[node.tagName];
    return type ? [{ type, children } as EvidenceNode] : children;
  };
  return { type: 'doc', children: Array.from(root.childNodes).flatMap(convert) };
}

export function docToPlainText(node: EvidenceNode): string {
  if (node.type === 'text') return node.text;
  if (node.type === 'br') return '\n';
  return Array.isArray(node.children) ? node.children.map(docToPlainText).join('') : '';
}

/** Build DOM for the tree with createElement/text nodes only. */
export function docToDom(node: EvidenceNode): Node {
  if (node.type === 'text') return document.createTextNode(node.text);
  if (node.type === 'br') return document.createElement('br');
  const element = document.createElement(ELEMENTS[node.type] ?? 'span');
  node.children.forEach((child) => element.append(docToDom(child)));
  return element;
}

export interface EvidenceDraft { key: string; file: File }

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

/** Draft state for one payment's evidence. Uploaded attachment ids are cached so a retry does not upload twice. */
export function useEvidence() {
  const content = shallowRef<EvidenceDoc>(emptyDoc());
  const files = ref<EvidenceDraft[]>([]);
  const error = ref('');
  const uploaded = new Map<string, string>();

  function addFiles(added: File[]) {
    const fresh = added.filter((file) => !files.value.some((draft) => draft.file.name === file.name && draft.file.size === file.size && draft.file.lastModified === file.lastModified));
    if (files.value.length + fresh.length > MAX_FILES) { error.value = t('最多添加10个付款凭证附件'); return; }
    for (const file of fresh) {
      if (!file.size || file.size > MAX_BYTES) { error.value = t('付款凭证大小须在1 B至10 MB之间'); return; }
      if (!TYPES.includes(file.type) && !/\.(pdf|png|jpe?g)$/i.test(file.name)) { error.value = t('仅支持PDF、PNG、JPG付款凭证'); return; }
    }
    error.value = '';
    files.value = [...files.value, ...fresh.map((file) => ({ key: crypto.randomUUID(), file }))];
  }

  function removeFile(key: string) {
    files.value = files.value.filter((draft) => draft.key !== key);
    error.value = '';
  }

  /** Validate, upload attachments (once each) and return the evidence fields of the payment request. */
  async function prepare(supplierId: string) {
    if (!files.value.length) throw new Error(t('请上传付款凭证'));
    if (docToPlainText(content.value).length > 10_000) throw new Error(t('付款说明过长，最多10000字'));
    const ids: string[] = [];
    for (const draft of files.value) {
      let id = uploaded.get(draft.key);
      if (!id) {
        id = (await uploadDocument(supplierId, draft.file, 'PAYMENT_PROOF') as { id: string }).id;
        uploaded.set(draft.key, id);
      }
      ids.push(id);
    }
    return { evidenceId: ids[0], evidenceIds: ids, evidenceContent: JSON.stringify(content.value) };
  }

  return { content, files, error, addFiles, removeFile, prepare };
}

export type EvidenceState = ReturnType<typeof useEvidence>;
