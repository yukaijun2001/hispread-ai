<script setup lang="ts">
// Proxy picker for one replacement: searches the proxies this resource may move
// to (250 ms debounce, paged) or, with `canRecord`, accepts a typed proxy
// address (including host:port:username:password).
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import Pagination from '../../../components/ui/Pagination.vue';
import { useApiData } from '../../../composables/useApiData';
import { t } from '../../../lib/i18n';
import type { ProxyOption } from '../composables/useDeliveryProxies';
import type { ReplacementChoice, ReplacementProxy } from '../proxyReplacement';
import { enc, proxySearchText } from '../resources';
import ProxyCombobox from './ProxyCombobox.vue';

const props = defineProps<{ resourceId: string; value: ReplacementChoice; canRecord: boolean }>();
const emit = defineEmits<{ change: [choice: ReplacementChoice] }>();

const typed = ref('');
const search = ref('');
const page = ref(1);
const size = ref(20);
let timer: number | undefined;

watch(typed, (value) => {
  window.clearTimeout(timer);
  if (value.trim() === search.value) return;
  timer = window.setTimeout(() => { search.value = value.trim(); page.value = 1; }, 250);
});
onBeforeUnmount(() => window.clearTimeout(timer));

const options = useApiData<{ items: ReplacementProxy[]; total: number }>(() =>
  `/resource-proxy-replacements/proxy-options?resourceId=${enc(props.resourceId)}&search=${enc(search.value)}&page=${page.value}&size=${size.value}`);

const asOption = (proxy: ReplacementProxy) => ({ ...proxy, enabled: true }) as ProxyOption;
const items = computed(() => (options.data.value?.items ?? []).map(asOption));
const selected = computed(() => (props.value.proxy ? asOption(props.value.proxy) : null));
const paged = computed(() => {
  const data = options.data.value;
  return (proxySearchText(props.value.url) !== '' || !props.value.url.trim()) && !!data && (data.total > size.value || page.value > 1);
});

function onInput(value: string) {
  emit('change', { url: value });
  typed.value = proxySearchText(value);
}
function onSelect(option: ProxyOption) {
  const proxy = options.data.value?.items.find((item) => item.id === option.id);
  if (proxy?.supported) emit('change', { proxy, url: '' });
  typed.value = '';
}
</script>

<template>
  <div class="rs-replacement-picker">
    <ProxyCombobox
      :value="value.url"
      :selected="selected"
      :options="items"
      :loading="options.loading.value"
      :loading-more="false"
      :error="options.error.value"
      :disabled="false"
      :can-record="canRecord"
      allow-full
      :supported-protocols="['SOCKS5', 'HTTP']"
      :description="canRecord ? t('支持 SOCKS5、HTTP 或 host:port:username:password，重复代理自动复用。') : t('当前账号仅可选择已有代理。')"
      @input="onInput"
      @select="onSelect"
      @retry="options.reload()"
    />
    <Pagination
      v-if="paged"
      v-model:page="page"
      v-model:size="size"
      :total="options.data.value?.total ?? 0"
      :loading="options.loading.value"
      :sizes="[10, 20, 50, 100]"
    />
  </div>
</template>

<style scoped>
.rs-replacement-picker { display: grid; gap: 8px; min-width: 0; }
</style>
