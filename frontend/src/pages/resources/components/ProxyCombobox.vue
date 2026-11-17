<script setup lang="ts">
// Proxy picker: type to filter existing proxies, or (with `canRecord`) paste a
// new proxy address. Options that are disabled, full or of an unsupported
// protocol cannot be picked. Options render 50 at a time.
import { computed, nextTick, ref, useId } from 'vue';
import Icon from '../../../components/ui/Icon.vue';
import { t } from '../../../lib/i18n';
import type { ProxyOption } from '../composables/useDeliveryProxies';

const props = withDefaults(defineProps<{
  value: string;
  selected: ProxyOption | null;
  options: ProxyOption[];
  loading?: boolean;
  loadingMore?: boolean;
  error?: string;
  disabled?: boolean;
  canRecord: boolean;
  ownProxyId?: string | null;
  allowFull?: boolean;
  supportedProtocols?: string[];
  description?: string;
}>(), { allowFull: false });
const emit = defineEmits<{ input: [value: string]; select: [proxy: ProxyOption]; retry: [] }>();

const listId = useId();
const inputId = useId();
const input = ref<HTMLInputElement | null>(null);
const open = ref(false);
const active = ref(-1);
const query = ref('');
const limit = ref(50);

const term = computed(() => (props.selected ? '' : query.value.trim().toLowerCase()));
const filtered = computed(() => props.options.filter((option) => `${option.name} ${option.protocol} ${option.endpoint}`.toLowerCase().includes(term.value)));
const shown = computed(() => filtered.value.slice(0, limit.value));
const unsupported = (option: ProxyOption) => !!props.supportedProtocols && !props.supportedProtocols.includes(option.protocol);
const unavailable = (option: ProxyOption) => unsupported(option) || !option.enabled
  || (!props.allowFull && option.maxResources > 0 && option.usedResources + option.reservedResources >= option.maxResources && option.id !== props.ownProxyId);
const displayValue = computed(() => (props.selected ? `${props.selected.name} · ${props.selected.protocol} · ${props.selected.endpoint}` : props.value));
const statusText = computed(() => {
  if (props.loading) return t('正在加载代理…');
  if (props.error) return t('代理列表加载失败：{0}', [props.error]);
  if (term.value && props.canRecord) return term.value.includes(':') ? t('使用时自动保存，重复代理会复用') : t('暂无匹配，可直接粘贴代理地址');
  return t('暂无匹配代理');
});

function choose(option: ProxyOption) {
  if (unavailable(option)) return;
  emit('select', option);
  open.value = false;
  active.value = -1;
  input.value?.focus();
}

function move(step: number) {
  open.value = true;
  const list = filtered.value;
  if (!list.length) return;
  let index = active.value < 0 ? (step > 0 ? -1 : 0) : active.value;
  for (let i = 0; i < list.length; i++) {
    index = (index + step + list.length) % list.length;
    if (!unavailable(list[index])) {
      limit.value = Math.max(limit.value, index + 1);
      active.value = index;
      nextTick(() => document.getElementById(`${listId}-${index}`)?.scrollIntoView({ block: 'nearest' }));
      return;
    }
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.isComposing) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); move(event.key === 'ArrowDown' ? 1 : -1); }
  else if (event.key === 'Enter' && open.value && active.value >= 0) {
    event.preventDefault();
    const option = filtered.value[active.value];
    if (option) choose(option);
  } else if (event.key === 'Escape' && open.value) { event.preventDefault(); event.stopPropagation(); open.value = false; active.value = -1; }
}

function onFocus(event: FocusEvent) {
  open.value = true; query.value = ''; active.value = -1; limit.value = 50;
  if (props.selected) (event.target as HTMLInputElement).select();
}
function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  emit('input', value);
  query.value = value; limit.value = 50; open.value = true; active.value = -1;
}
function onFocusOut(event: FocusEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) open.value = false;
}
const usage = (option: ProxyOption) => (unsupported(option) ? t('（暂不支持换绑）')
  : option.enabled ? `${option.usedResources + option.reservedResources}/${option.maxResources || t('不限')}` : t('已停用'));
</script>

<template>
  <div class="rs-proxy" @focusout="onFocusOut">
    <label class="rs-proxy-label" :for="inputId">{{ t('代理') }}</label>
    <div class="rs-proxy-control" :class="{ disabled }">
      <input
        :id="inputId"
        ref="input"
        role="combobox"
        type="text"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        :aria-expanded="open && !disabled"
        :aria-controls="listId"
        :aria-activedescendant="open && active >= 0 && active < filtered.length ? `${listId}-${active}` : undefined"
        autocomplete="off"
        spellcheck="false"
        :disabled="disabled"
        :placeholder="canRecord ? t('选择已有代理或粘贴代理地址') : t('搜索并选择已有代理')"
        :value="displayValue"
        @focus="onFocus"
        @click="open = true; query = ''"
        @input="onInput"
        @keydown="onKeydown"
      >
      <Icon name="down" :size="16" class="rs-proxy-chevron" />
    </div>
    <div v-if="open && !disabled" :id="listId" class="rs-proxy-list" role="listbox" :aria-label="t('已有代理')">
      <button
        v-for="(option, index) in shown"
        :id="`${listId}-${index}`"
        :key="option.id"
        type="button"
        role="option"
        tabindex="-1"
        :aria-selected="selected?.id === option.id"
        :disabled="unavailable(option)"
        :class="{ active: active === index }"
        @mousedown.prevent
        @mouseenter="active = index"
        @click="choose(option)"
      >
        <strong>{{ option.name }}</strong>
        <span>{{ option.protocol }} · {{ option.endpoint }} · {{ usage(option) }}</span>
      </button>
      <button v-if="filtered.length > shown.length" type="button" class="rs-proxy-more" @mousedown.prevent @click="limit += 50">
        {{ t('显示更多代理（已显示 {0} / {1}）', [shown.length, filtered.length]) }}
      </button>
      <p v-if="loadingMore" role="status">{{ t('正在继续加载代理，已加载的可直接选择…') }}</p>
      <div v-if="error" role="alert" class="rs-proxy-error">
        <p>{{ t('部分代理尚未加载：') }}{{ error }}</p>
        <button type="button" @mousedown.prevent @click="emit('retry')">{{ t('重试加载代理') }}</button>
      </div>
      <p v-if="!filtered.length" role="status">{{ statusText }}</p>
    </div>
    <small class="rs-proxy-hint">{{ description || (canRecord ? t('支持 SOCKS5、HTTP、HTTPS，重复代理自动复用。') : t('当前账号仅可选择已有代理。')) }}</small>
  </div>
</template>

<style scoped>
.rs-proxy { display: grid; gap: 6px; min-width: 0; }
.rs-proxy-label { color: var(--hs-text-2); font-size: var(--hs-text-sm); font-weight: 500; }
.rs-proxy-control { position: relative; display: flex; align-items: center; }
.rs-proxy-control input {
  width: 100%; height: var(--hs-control-height); padding: 0 34px 0 12px; color: var(--hs-text); font: inherit; font-size: var(--hs-text-sm);
  background: var(--hs-surface); border: 1px solid var(--hs-border-strong); border-radius: var(--hs-radius-control); box-shadow: var(--hs-shadow-control); outline: none;
}
.rs-proxy-control input:focus { border-color: var(--hs-accent); box-shadow: var(--hs-accent-ring); }
.rs-proxy-control.disabled input { color: var(--hs-text-3); background: var(--hs-surface-subtle); }
.rs-proxy-chevron { position: absolute; right: 10px; color: var(--hs-text-3); pointer-events: none; }
.rs-proxy-list { display: grid; max-height: 280px; overflow: auto; padding: 4px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-control); box-shadow: var(--hs-shadow-pop); }
.rs-proxy-list button { display: grid; gap: 2px; padding: 7px 10px; color: var(--hs-text); text-align: left; font: inherit; background: none; border: 0; border-radius: var(--hs-radius-small); cursor: pointer; }
.rs-proxy-list button span { color: var(--hs-text-3); font-size: var(--hs-text-xs); overflow-wrap: anywhere; }
.rs-proxy-list button.active, .rs-proxy-list button:hover:not(:disabled) { background: var(--hs-surface-hover); }
.rs-proxy-list button[aria-selected="true"] { background: var(--hs-accent-soft); }
.rs-proxy-list button:disabled { opacity: .5; cursor: not-allowed; }
.rs-proxy-list .rs-proxy-more { color: var(--hs-accent); font-size: var(--hs-text-xs); }
.rs-proxy-list p { margin: 0; padding: 8px 10px; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.rs-proxy-error { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--hs-danger); }
.rs-proxy-error p { color: var(--hs-danger); }
.rs-proxy-hint { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
</style>
