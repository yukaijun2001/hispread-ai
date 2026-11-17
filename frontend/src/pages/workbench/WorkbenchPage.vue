<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import PageHeader from '../../components/ui/PageHeader.vue';
import Card from '../../components/ui/Card.vue';
import Button from '../../components/ui/Button.vue';
import Icon from '../../components/ui/Icon.vue';
import Select from '../../components/ui/Select.vue';
import EmptyState from '../../components/ui/EmptyState.vue';
import Spinner from '../../components/ui/Spinner.vue';
import type { IconName } from '../../components/ui/icons';
import WorkbenchTasks from './WorkbenchTasks.vue';
import WorkbenchGuide from './WorkbenchGuide.vue';
import RecentUpdates from './RecentUpdates.vue';
import { useApiData } from '../../composables/useApiData';
import { apiPost } from '../../lib/api';
import { getLocale, t } from '../../lib/i18n';
import { CURRENCIES } from '../../lib/labels';
import { compareDecimal, formatDateTime, formatMoney, subtractMoney } from '../../lib/money';
import type { NotificationItem } from '../../lib/notifications';
import { useSessionStore } from '../../stores/session';

interface MoneySummary { currency: string; total: string; paid: string; received: string }
interface Announcement { notificationId: string; title: string; body: string; publishedAt: string }
interface WorkbenchData { money: MoneySummary[]; announcement?: Announcement | null; recent: NotificationItem[] }
interface ExchangeRate { id: string; baseCurrency: string; quoteCurrency: string; rate: string; source: string; effectiveFrom: string }

const session = useSessionStore();
const router = useRouter();
const user = computed(() => session.user!);
const supplier = computed(() => !!user.value.supplierId);

const workbench = useApiData<WorkbenchData>('/workbench');
const rates = useApiData<ExchangeRate[]>(() => (session.has('exchange_rate.read') ? '/exchange-rates/current' : null));

const today = new Date().toLocaleDateString(getLocale(), { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

// The guide can be hidden; the choice is remembered per account.
const guideKey = computed(() => `hispread.workbench.guide-hidden:${user.value.id}`);
const readGuideHidden = () => { try { return localStorage.getItem(guideKey.value) === 'true'; } catch { return false; } };
const guideHidden = ref(readGuideHidden());
function setGuideHidden(hidden: boolean) {
  guideHidden.value = hidden;
  try { localStorage.setItem(guideKey.value, String(hidden)); } catch { /* private mode */ }
  if (!hidden) nextTick(() => document.getElementById('workbench-operation-guide')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
}

// Balance: only the console's currencies, amounts kept exact.
const balances = computed(() => (workbench.data.value?.money ?? []).filter((entry) => (CURRENCIES as readonly string[]).includes(entry.currency)));
const currency = ref('');
const balance = computed(() => balances.value.find((entry) => entry.currency === currency.value) ?? balances.value[0]);
const currencyModel = computed({ get: () => balance.value?.currency ?? '', set: (value: string) => { currency.value = value; } });
const outstanding = computed(() => {
  if (!balance.value) return null;
  const settled = supplier.value ? balance.value.received : balance.value.paid;
  const difference = subtractMoney(balance.value.total, settled, balance.value.currency);
  return compareDecimal(difference, '0') < 0 ? '0' : difference;
});

interface QuickAction { route: string; label: string; icon: IconName; permission: string }
const quickActions = computed<QuickAction[]>(() => [
  { route: 'suppliers', label: t(supplier.value ? '维护资料' : '供应商管理'), permission: 'supplier.read', icon: 'users' as IconName },
  ...(supplier.value ? [] : [{ route: 'projects', label: t('维护项目'), permission: 'project.write', icon: 'grid' as IconName }]),
  { route: 'quotes', label: t(supplier.value ? '提交报价' : session.has('quote.review') ? '审核报价' : '查看报价'), permission: 'quote.read', icon: 'quote' as IconName },
  { route: 'settlements', label: t(supplier.value ? '查看收款' : '周期结算'), permission: 'settlement.read', icon: 'wallet' as IconName },
  ...(supplier.value && session.has('resource.read') ? [{ route: 'deliveries', label: t('新增交付'), permission: 'resource.write', icon: 'plus' as IconName }] : []),
].filter((action) => session.has(action.permission)));

const markingAnnouncement = ref(false);
async function markAnnouncementRead() {
  const announcement = workbench.data.value?.announcement;
  if (!announcement || markingAnnouncement.value) return;
  markingAnnouncement.value = true;
  try {
    await apiPost(`/notifications/${announcement.notificationId}/read`, {});
    session.refresh();
    session.notify(t('已标记为已读'));
  } catch (error) {
    session.notify((error as Error).message, true);
  } finally {
    markingAnnouncement.value = false;
  }
}

function dropRead(ids: string[]) {
  workbench.mutate((data) => ({ ...data, recent: data.recent.filter((item) => !ids.includes(item.id)) }));
}
</script>

<template>
  <div class="workbench">
    <PageHeader :title="t('你好，{0}', [session.displayName])" :description="today">
      <template v-if="guideHidden" #actions>
        <Button size="sm" variant="ghost" icon="quote" @click="setGuideHidden(false)">{{ t('显示操作指引') }}</Button>
      </template>
    </PageHeader>

    <section v-if="workbench.data.value?.announcement" class="announcement" aria-labelledby="workbench-announcement-title">
      <span class="announcement-icon"><Icon name="bell" :size="17" /></span>
      <div class="announcement-body">
        <div class="announcement-head">
          <strong id="workbench-announcement-title">{{ workbench.data.value.announcement.title }}</strong>
          <time :datetime="workbench.data.value.announcement.publishedAt">{{ formatDateTime(workbench.data.value.announcement.publishedAt) }}</time>
        </div>
        <p>{{ workbench.data.value.announcement.body }}</p>
      </div>
      <div class="announcement-actions">
        <RouterLink v-if="session.has('notification.publish')" to="/notice-admin" class="text-link">{{ t('管理公告') }}</RouterLink>
        <Button size="sm" icon="check" :loading="markingAnnouncement" @click="markAnnouncementRead">{{ t('标记已读') }}</Button>
      </div>
    </section>

    <div class="layout">
      <div class="primary">
        <WorkbenchTasks v-if="session.has('workbench.tasks.read')" />
        <WorkbenchGuide v-if="!guideHidden" @hide="setGuideHidden(true)" />
        <EmptyState v-if="workbench.error.value && !workbench.data.value" error :text="workbench.error.value">
          <Button size="sm" icon="refresh" @click="workbench.reload()">{{ t('重试') }}</Button>
        </EmptyState>
        <RecentUpdates v-else-if="workbench.data.value" :items="workbench.data.value.recent" @read="dropRead" />
        <div v-else class="loading"><Spinner :size="16" /></div>
      </div>

      <aside class="secondary">
        <Card v-if="session.has('settlement.read')" :title="t(supplier ? '收款概览' : '应付概览')">
          <template #actions>
            <div class="currency">
              <Select
                v-model="currencyModel"
                :options="balances.map((entry) => ({ value: entry.currency, label: entry.currency }))"
                :label="t('概览币种')"
                :placeholder="t('暂无款项')"
                :disabled="!balances.length"
                size="sm"
                pill
              />
            </div>
          </template>
          <p class="metric-label">{{ t(supplier ? '待确认收款' : '待付金额') }}</p>
          <p v-if="balance && outstanding !== null" class="metric">
            <small>{{ balance.currency }}</small>
            <span>{{ formatMoney(outstanding, balance.currency) }}</span>
          </p>
          <p v-else class="metric-empty">{{ t('暂无已确认的款项') }}</p>
          <dl v-if="balance" class="breakdown">
            <div>
              <dt>{{ t(supplier ? '已确认应收' : '已确认应付') }}</dt>
              <dd>{{ balance ? formatMoney(balance.total, balance.currency) : '—' }}</dd>
            </div>
            <div>
              <dt>{{ t(supplier ? '已确认收款' : '已登记付款') }}</dt>
              <dd>{{ balance ? formatMoney(supplier ? balance.received : balance.paid, balance.currency) : '—' }}</dd>
            </div>
          </dl>
          <template #footer>
            <RouterLink to="/settlements" class="text-link">{{ t(supplier ? '查看收款管理' : '查看结算管理') }}<Icon name="arrow" :size="14" /></RouterLink>
          </template>
        </Card>

        <Card v-if="quickActions.length" :title="t('常用操作')">
          <div class="quick">
            <button v-for="action in quickActions" :key="action.route" type="button" @click="router.push(`/${action.route}`)">
              <Icon :name="action.icon" :size="17" />
              <span>{{ action.label }}</span>
            </button>
          </div>
        </Card>

        <Card v-if="session.has('exchange_rate.read')" :title="t('参考汇率')">
          <p v-if="rates.loading.value && !rates.data.value" class="quiet">{{ t('正在读取…') }}</p>
          <p v-else-if="rates.error.value" class="quiet">{{ t('读取失败：') }}{{ rates.error.value }}</p>
          <ul v-else-if="rates.data.value?.length" class="rates">
            <li v-for="rate in rates.data.value" :key="rate.id">
              <span class="pair">{{ rate.baseCurrency }} → {{ rate.quoteCurrency }}</span>
              <span class="rate"><small>1 {{ rate.baseCurrency }} =</small> <strong>{{ rate.rate }}</strong> <small>{{ rate.quoteCurrency }}</small></span>
              <span class="source">{{ rate.source }} · {{ formatDateTime(rate.effectiveFrom) }}</span>
            </li>
          </ul>
          <p v-else class="quiet">{{ t('暂无当前生效的参考汇率') }}</p>
          <template #footer>
            <RouterLink :to="{ path: '/settlements', query: { tab: 'rates' } }" class="text-link">{{ t(supplier ? '查看汇率详情' : '查看汇率版本') }}<Icon name="arrow" :size="14" /></RouterLink>
          </template>
        </Card>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.workbench { max-width: 1320px; }
.announcement { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; padding: 14px 16px; background: var(--hs-accent-soft); border: 1px solid #dbe5fd; border-radius: 14px; }
.announcement-icon { display: grid; place-items: center; width: 30px; height: 30px; color: var(--hs-accent); background: #fff; border-radius: 9px; flex: none; }
.announcement-body { flex: 1; min-width: 0; }
.announcement-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
.announcement-head strong { color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 600; }
.announcement-head time { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.announcement-body p { margin: 4px 0 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }
.announcement-actions { display: flex; align-items: center; gap: 12px; flex: none; }

.layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 340px); gap: 18px; align-items: start; }
.primary, .secondary { display: grid; gap: 18px; min-width: 0; }
.loading { display: grid; place-items: center; padding: 40px; color: var(--hs-text-3); }

.currency { width: 104px; }
.metric-label { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.metric { display: flex; align-items: baseline; gap: 8px; margin: 6px 0 0; color: var(--hs-text); font-variant-numeric: tabular-nums; }
.metric small { color: var(--hs-text-3); font-size: var(--hs-text-sm); font-weight: 500; }
.metric span { font-size: 30px; font-weight: 600; letter-spacing: -.8px; line-height: 1.2; overflow-wrap: anywhere; }
.metric-empty { margin: 8px 0 0; color: var(--hs-text-2); font-size: var(--hs-text-sm); }
.breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0 0; padding-top: 14px; border-top: 1px solid var(--hs-divider); }
.breakdown dt { color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.breakdown dd { margin: 3px 0 0; color: var(--hs-text); font-size: var(--hs-text-sm); font-weight: 500; font-variant-numeric: tabular-nums; }

.quick { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.quick button { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 10px 12px; color: var(--hs-text-2); background: var(--hs-surface-subtle); border: 1px solid var(--hs-border); border-radius: 11px; font: inherit; font-size: var(--hs-text-sm); text-align: left; cursor: pointer; transition: background .12s, border-color .12s, color .12s; }
.quick button:hover { color: var(--hs-text); background: var(--hs-surface); border-color: var(--hs-border-strong); box-shadow: var(--hs-shadow-control); }
.quick button:focus-visible { outline: none; box-shadow: var(--hs-accent-ring); }
.quick .hs-icon { color: var(--hs-text-3); }

.rates { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
.rates li { display: grid; gap: 2px; }
.pair { color: var(--hs-text-3); font-size: var(--hs-text-xs); font-weight: 500; }
.rate { color: var(--hs-text-3); font-size: var(--hs-text-xs); font-variant-numeric: tabular-nums; }
.rate strong { color: var(--hs-text); font-size: 17px; font-weight: 600; }
.source { color: var(--hs-text-4); font-size: 11px; }
.quiet { margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); }
.text-link { display: inline-flex; align-items: center; gap: 4px; color: var(--hs-accent); font-size: var(--hs-text-sm); text-decoration: none; }
.text-link:hover { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }

@media (max-width: 1080px) { .layout { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 640px) { .announcement { flex-wrap: wrap; } .announcement-actions { width: 100%; justify-content: flex-end; } }
</style>
