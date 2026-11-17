<script setup lang="ts">
// Payment note with basic formatting plus attachments. Pasted or dropped files
// become attachments; pasted text is inserted as plain text. The note is kept
// as an evidence tree, not as HTML.
import { onMounted, ref } from 'vue';
import Button from '../../../components/ui/Button.vue';
import Notice from '../../../components/ui/Notice.vue';
import EvidenceFileChip from './EvidenceFileChip.vue';
import { t } from '../../../lib/i18n';
import { docToDom, docToPlainText, domToDoc, type EvidenceState } from './evidence';

const props = withDefaults(defineProps<{ evidence: EvidenceState; disabled?: boolean }>(), { disabled: false });

const editor = ref<HTMLDivElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const pressed = ref<Record<string, boolean>>({});
let range: Range | null = null;

const COMMANDS = [
  { command: 'bold', label: t('加粗'), text: 'B', style: 'bold' },
  { command: 'italic', label: t('斜体'), text: 'I', style: 'italic' },
  { command: 'underline', label: t('下划线'), text: 'U', style: 'underline' },
  { command: 'insertUnorderedList', label: t('无序列表'), text: t('无序列表'), style: '' },
  { command: 'insertOrderedList', label: t('有序列表'), text: t('有序列表'), style: '' },
];

onMounted(() => {
  if (!editor.value) return;
  const root = docToDom(props.evidence.content.value);
  editor.value.replaceChildren(...Array.from(root.childNodes));
});

function remember() {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor.value?.contains(selection.anchorNode)) return;
  range = selection.getRangeAt(0).cloneRange();
  pressed.value = Object.fromEntries(COMMANDS.map(({ command }) => [command, document.queryCommandState(command)]));
}
function sync() {
  if (editor.value) props.evidence.content.value = domToDoc(editor.value);
  remember();
}
function run(command: string, value?: string) {
  if (props.disabled) return;
  editor.value?.focus();
  const selection = window.getSelection();
  if (range && editor.value?.contains(range.commonAncestorContainer)) {
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  document.execCommand('styleWithCSS', false, 'false');
  document.execCommand(command, false, value);
  sync();
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  if (!props.disabled) dragging.value = true;
}
function onDragLeave(event: DragEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) dragging.value = false;
}
function onDrop(event: DragEvent) {
  event.preventDefault();
  dragging.value = false;
  if (props.disabled || !event.dataTransfer) return;
  if (event.dataTransfer.files.length) props.evidence.addFiles(Array.from(event.dataTransfer.files));
  else run('insertText', event.dataTransfer.getData('text/plain'));
}
function onPaste(event: ClipboardEvent) {
  event.preventDefault();
  if (props.disabled || !event.clipboardData) return;
  const files = Array.from(event.clipboardData.items).filter((item) => item.kind === 'file').map((item) => item.getAsFile()).filter((file): file is File => !!file);
  if (files.length) props.evidence.addFiles(files);
  else run('insertText', event.clipboardData.getData('text/plain'));
}
function onFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  props.evidence.addFiles(Array.from(input.files || []));
  input.value = '';
}
</script>

<template>
  <div class="ev-editor" :class="{ dragging, disabled }" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop" @paste="onPaste">
    <div class="ev-toolbar" role="toolbar" :aria-label="t('付款说明格式')">
      <button
        v-for="item in COMMANDS"
        :key="item.command"
        type="button"
        class="ev-tool"
        :class="item.style"
        :disabled="disabled"
        :aria-label="item.label"
        :title="item.label"
        :aria-pressed="!!pressed[item.command]"
        @mousedown.prevent
        @click="run(item.command)"
      >{{ item.text }}</button>
      <span class="ev-spacer" />
      <Button size="sm" icon="upload" :disabled="disabled" @click="fileInput?.click()">{{ t('添加文件') }}</Button>
      <input ref="fileInput" class="ev-input" type="file" multiple accept="application/pdf,image/png,image/jpeg" :disabled="disabled" :aria-label="t('添加付款凭证文件')" @change="onFiles" />
    </div>
    <div
      ref="editor"
      class="ev-content"
      role="textbox"
      :aria-label="t('付款说明')"
      aria-multiline="true"
      :contenteditable="!disabled"
      spellcheck="false"
      :data-empty="!docToPlainText(evidence.content.value).trim()"
      :data-placeholder="t('填写付款说明，可直接粘贴图片或将文件拖到这里')"
      @input="sync"
      @mouseup="remember"
      @keyup="remember"
      @blur="remember"
    />
    <div v-if="evidence.files.value.length" class="ev-files">
      <EvidenceFileChip v-for="draft in evidence.files.value" :key="draft.key" :file="draft.file" :disabled="disabled" @remove="evidence.removeFile(draft.key)" />
    </div>
    <p class="ev-hint">{{ t('支持拖入文件、粘贴图片；PDF / PNG / JPG，单个最多10 MB，最多10个附件') }}</p>
    <Notice v-if="evidence.error.value" tone="danger">{{ evidence.error.value }}</Notice>
  </div>
</template>

<style scoped>
.ev-editor { display: grid; gap: 8px; padding: 10px; background: var(--hs-surface); border: 1px solid var(--hs-border-strong); border-radius: var(--hs-radius-control); transition: border-color .12s, box-shadow .12s; }
.ev-editor:focus-within { border-color: var(--hs-accent); box-shadow: var(--hs-accent-ring); }
.ev-editor.dragging { border-style: dashed; border-color: var(--hs-accent); background: var(--hs-accent-soft); }
.ev-editor.disabled { opacity: .7; }
.ev-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding-bottom: 8px; border-bottom: 1px solid var(--hs-divider); }
.ev-tool { min-width: 28px; height: 28px; min-height: 0; padding: 0 8px; color: var(--hs-text-2); background: none; border: 1px solid transparent; border-radius: 7px; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.ev-tool.bold { font-weight: 700; }
.ev-tool.italic { font-style: italic; }
.ev-tool.underline { text-decoration: underline; }
.ev-tool:hover:not(:disabled) { color: var(--hs-text); background: var(--hs-surface-subtle); }
.ev-tool[aria-pressed='true'] { color: var(--hs-text); background: var(--hs-surface-subtle); border-color: var(--hs-border); }
.ev-tool:disabled { opacity: .5; cursor: not-allowed; }
.ev-spacer { flex: 1; }
.ev-input { display: none; }
.ev-content { min-height: 96px; max-height: 280px; overflow-y: auto; padding: 4px 2px; color: var(--hs-text); font-size: var(--hs-text-sm); line-height: 1.7; outline: none; overflow-wrap: anywhere; }
.ev-content[data-empty='true']::before { content: attr(data-placeholder); color: var(--hs-text-4); pointer-events: none; }
.ev-content :deep(p) { margin: 0 0 4px; }
.ev-content :deep(ul), .ev-content :deep(ol) { margin: 0 0 4px; padding-left: 22px; }
.ev-files { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
.ev-hint { margin: 0; color: var(--hs-text-3); font-size: 11px; }
</style>
