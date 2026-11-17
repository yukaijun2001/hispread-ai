<script setup lang="ts">
// Step-by-step guide for quoting, delivering and reconciling, built from the
// account's permissions. Can be hidden; the choice is remembered per account.
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import Card from '../../components/ui/Card.vue';
import Tabs from '../../components/ui/Tabs.vue';
import Icon from '../../components/ui/Icon.vue';
import { t } from '../../lib/i18n';
import { settlementTabs } from '../../navigation/access';
import { useSessionStore } from '../../stores/session';

defineEmits<{ hide: [] }>();
const session = useSessionStore();

interface Guide { id: 'quote' | 'delivery' | 'billing'; title: string; steps: string[]; note: string; links: Array<{ label: string; path: string; query?: Record<string, string> }> }

const guides = computed<Guide[]>(() => {
  const user = session.user!;
  const supplier = !!user.supplierId;
  const agent = supplier && user.role === 'SUPPLIER_AGENT';
  const tabs = settlementTabs(user);
  const canDeliver = supplier && session.has('resource.write');
  const result: Guide[] = [];
  if (!agent && session.has('quote.read')) {
    const reviewer = session.has('quote.review');
    result.push({
      id: 'quote',
      title: t(supplier ? '提交报价' : reviewer ? '审核报价' : '查看报价'),
      steps: supplier
        ? [t('进入「我的报价」，点击「新增报价行」并选择项目。'), t('按项目填写倍率或单价、服务量级说明和适用期间。'), t('提交该行报价，等待平台审核；通过且在有效期内后即可交付。')]
        : reviewer
          ? [t('进入「报价管理」，筛选待审核报价并打开详情。'), t('核对供应商、项目、倍率或单价、服务量级和适用期间。'), t('有审核权限时通过或退回报价；退回时填写原因，供供应商修改。')]
          : [t('进入「报价管理」，按供应商或项目查询报价。'), t('打开详情，核对倍率或单价、服务量级和适用期间。'), t('查看报价状态与价格历史；审核操作由有权限的账号处理。')],
      note: t(supplier ? '项目暂不可交付时，先检查报价是否已通过且生效。' : '报价审核通过后，供应商才能在有效期间内交付对应项目。'),
      links: [{ label: supplier && session.has('quote.write') ? t('去报价') : t('查看报价'), path: 'quotes' }],
    });
  }
  if (session.has('resource.read')) {
    result.push({
      id: 'delivery',
      title: t(supplier ? '交付资源' : '查看资源'),
      steps: canDeliver
        ? [t(agent ? '先由供应商主账号或本组管理员分配项目，再进入「我的交付」。' : '报价审核生效后，进入「我的交付」，点击「新增交付」。'), t('选择项目和账号名称；CCMAX 原生账号通过 OAuth 授权，按页面提示回填本次回调。'), t('检查信息并提交，在列表中查看交付结果和失败说明。')]
        : [t(supplier ? '进入「我的交付」，按项目或账号查询已交付资源。' : '进入「资源管理」，按供应商、项目或账号查询交付资源。'), t('点击资源行打开详情，核对交付结果和账号状态。'), t('需要更新状态时，使用有权限的查询操作，再查看实际结果。')],
      note: t(supplier ? '保存草稿不算交付；正式提交前需有有效报价和项目权限。' : '交付结果与付款进度分别查看，交付成功不代表已完成结算。'),
      links: [{ label: supplier ? (session.has('resource.write') ? t('去交付') : t('查看交付')) : t('查看资源'), path: supplier ? 'deliveries' : 'resources' }],
    });
  }
  if (tabs.length) {
    const hasTab = (id: string) => tabs.some((tab) => tab.id === id);
    result.push({
      id: 'billing',
      title: t('查看账单'),
      steps: agent
        ? [t('进入「收款管理 → 日账」，按日期查询每日消耗。'), user.teamAdminGroup?.id ? t('小组管理员可查看本组成员的消耗，并按成员筛选。') : t('普通团队成员仅可查看本人交付资源产生的消耗。'), t('点击账单查看明细，核对对应资源和日期。')]
        : supplier
          ? [
            ...(hasTab('daily') ? [t('进入「收款管理 → 日账」，按日期、项目或资源核对消耗与应收。')] : []),
            ...(hasTab('statements') ? [t('平台发起结算后，在「金额确认」中核对结算明细并确认金额。')] : []),
            ...(hasTab('payments') ? [t('在「收款记录」查看付款进度，实际收到款项后再确认到账。')] : []),
          ]
          : [
            ...(hasTab('daily') ? [t('进入「账务管理 → 日账」，按供应商和日期核对消耗与应付。')] : []),
            ...(hasTab('statements') ? [t('在「结算单」发起结算，等待供应商核对并确认金额。')] : []),
            ...(hasTab('payments') ? [t('金额确认后按权限申请付款，在「付款记录」查看后续进度。')] : []),
          ],
      note: t(agent ? '团队日账只展示消耗；应收、结算和收款由供应商主账号处理。' : '金额确认在付款前完成，到账确认在实际收到款项后完成。'),
      links: tabs.filter((tab) => tab.id !== 'inputs' && tab.id !== 'rates').map((tab) => ({ label: tab.label, path: 'settlements', query: { tab: tab.id } })),
    });
  }
  return result.filter((guide) => guide.links.length > 0);
});

const selected = ref<Guide['id']>('quote');
const current = computed(() => guides.value.find((guide) => guide.id === selected.value) ?? guides.value[0]);
const tabItems = computed(() => guides.value.map((guide) => ({ id: guide.id, label: guide.title })));
const tabModel = computed({ get: () => current.value?.id ?? 'quote', set: (value: Guide['id']) => { selected.value = value; } });
</script>

<template>
  <Card v-if="current" id="workbench-operation-guide" :title="t('操作指引')" :description="t('按步骤完成报价、交付与对账')">
    <template #actions>
      <button type="button" class="hide" :aria-label="t('隐藏操作指引')" @click="$emit('hide')">{{ t('隐藏') }}</button>
    </template>
    <Tabs v-model="tabModel" :items="tabItems" :label="t('操作指引')" />
    <ol class="steps" role="tabpanel" :aria-label="current.title">
      <li v-for="(step, index) in current.steps" :key="step"><span class="number" aria-hidden="true">{{ index + 1 }}</span><span>{{ step }}</span></li>
    </ol>
    <div class="foot">
      <p>{{ current.note }}</p>
      <div class="links">
        <RouterLink v-for="link in current.links" :key="link.label" :to="{ path: `/${link.path}`, query: link.query }" class="link">
          {{ link.label }}<Icon name="arrow" :size="14" />
        </RouterLink>
      </div>
    </div>
  </Card>
</template>

<style scoped>
.hide { min-height: 0; padding: 0; color: var(--hs-text-3); background: none; border: 0; font: inherit; font-size: var(--hs-text-xs); cursor: pointer; }
.hide:hover { color: var(--hs-text); }
.steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 16px 24px; margin: 16px 0 0; padding: 0; list-style: none; }
.steps li { display: flex; align-items: flex-start; gap: 10px; color: var(--hs-text-2); font-size: var(--hs-text-sm); line-height: 1.7; }
.number { display: grid; place-items: center; width: 22px; height: 22px; margin-top: 1px; color: var(--hs-text); background: #f0f0f0; border-radius: 7px; font-size: 11px; font-weight: 600; flex: none; }
.foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 20px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--hs-divider); }
.foot p { flex: 1 1 260px; margin: 0; color: var(--hs-text-3); font-size: var(--hs-text-xs); line-height: 1.7; }
.links { display: flex; flex-wrap: wrap; gap: 8px 16px; }
.link { display: inline-flex; align-items: center; gap: 5px; color: var(--hs-accent); font-size: var(--hs-text-sm); text-decoration: none; }
.link:hover { color: var(--hs-accent-hover); text-decoration: underline; text-underline-offset: 3px; }
</style>
