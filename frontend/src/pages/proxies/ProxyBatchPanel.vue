<script setup lang="ts">
// Progress and per-proxy results of a batch test.
import { computed } from 'vue';
import Button from '../../components/ui/Button.vue';
import Badge from '../../components/ui/Badge.vue';
import Spinner from '../../components/ui/Spinner.vue';
import { t } from '../../lib/i18n';
import type { BatchProgress } from './proxies';

const props = defineProps<{ progress: BatchProgress }>();
const emit = defineEmits<{ stop: []; dismiss: [] }>();

const running = computed(() => ['collecting', 'running', 'stopping'].includes(props.progress.phase));
const heading = computed(() => {
  switch (props.progress.phase) {
    case 'collecting': return t('正在收集当前筛选的全部代理');
    case 'stopping': return t('正在停止检测，等待在途请求完成');
    case 'running': return t('批量检测中');
    case 'stopped': return t('批量检测已停止');
    case 'error': return t('批量检测未开始');
    default: return t('批量检测完成');
  }
});
const summary = computed(() => {
  const p = props.progress;
  return p.phase === 'collecting' ? t('已读取 {0} 条', [p.collected])
    : t('已完成 {0} / {1} · 正常 {2} · 失败 {3} · 请求失败 {4} · 无检测权限 {5}', [p.completed, p.total, p.ok, p.failed, p.requestFailed, p.skipped]);
});
</script>

<template>
  <section class="batch" :aria-label="t('批量检测进度')">
    <div class="head">
      <div class="status" role="status" aria-live="polite">
        <strong><Spinner v-if="running" :size="14" />{{ heading }}</strong>
        <p>{{ summary }}</p>
      </div>
      <Button v-if="running" size="sm" :disabled="progress.phase === 'stopping'" @click="emit('stop')">{{ t('停止检测') }}</Button>
      <Button v-else size="sm" variant="ghost" @click="emit('dismiss')">{{ t('收起') }}</Button>
    </div>
    <progress v-if="progress.phase !== 'collecting' && progress.total > 0" class="bar" :aria-label="t('检测完成进度')" :max="progress.total" :value="progress.completed" />
    <p class="hint">{{ t('按启动时的筛选条件检测全部分页；停止后，已发出的请求继续完成。') }}</p>
    <div v-if="progress.results.length" class="results" role="list" :aria-label="t('逐条检测结果')">
      <div v-for="result in progress.results" :key="result.id" role="listitem" class="result">
        <strong>{{ result.name }}</strong>
        <Badge :tone="result.state === 'OK' ? 'success' : 'danger'" dot>
          {{ result.state === 'OK' ? t('正常') : result.state === 'FAILED' ? t('失败') : t('请求失败') }}
        </Badge>
        <span v-if="result.message" class="message">{{ result.message }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.batch { display: grid; gap: 10px; padding: 14px 16px; background: var(--hs-surface); border: 1px solid var(--hs-border); border-radius: var(--hs-radius-card); }
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.status strong { display: inline-flex; align-items: center; gap: 8px; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.status p { margin: 3px 0 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.bar { width: 100%; height: 6px; accent-color: var(--hs-accent); }
.hint { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.results { display: grid; max-height: 220px; overflow: auto; border: 1px solid var(--hs-divider); border-radius: 10px; }
.result { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; padding: 8px 12px; font-size: var(--hs-text-xs); border-bottom: 1px solid var(--hs-divider); }
.result:last-child { border-bottom: 0; }
.result strong { color: var(--hs-text); font-weight: 500; }
.message { color: var(--hs-text-3); overflow-wrap: anywhere; }
</style>
