import { ReactShim as hooks, jsxRuntime as view } from './vue-compat.js';
import { $ as get, C as context, G as Dialog, S as useData, g as Notice, l as Details, rt as post, s as Button } from '../recovered/index-Dnr0i-H9.js';

export const isNewApi = resource => !!resource.upstreamChannelId || resource.upstreamProtocol === 'NEWAPI' || resource.resourceType === 'NEWAPI_CHANNEL';
export const channelLabel = resource => ({ ACTIVE: '已启用', PAUSED: '已停用', GONE: '已移除' }[resource.operationalState] || '待查询');
const jsx = view.jsx;
const field = (label, children) => jsx('label', { className: 'field full', children: [jsx('span', { children: label }), children] });
const number = value => value == null ? '未查询' : String(value);

export function ChannelUsage({ resource }) {
  const usage = resource.usage;
  return jsx('div', { className: 'stack', children: usage?.unit === 'NEWAPI_QUOTA' ? [
    jsx('span', { children: `已用配额：${number(usage.used_quota)}` }),
    jsx('span', { children: `余额原值：${number(usage.balance)}` }),
    jsx('small', { children: 'NEWAPI_QUOTA · 上游原始单位，不换算为 USD' }),
  ] : '尚未查询渠道用量' });
}

export function NewApiChannelDialog({ resource, onClose, onChanged }) {
  const { has, user, notify } = context();
  const [current, setCurrent] = hooks.useState(resource);
  const [busy, setBusy] = hooks.useState(false);
  const [error, setError] = hooks.useState('');
  const [priority, setPriority] = hooks.useState(String(resource.upstreamPriority ?? ''));
  const [confirmation, setConfirmation] = hooks.useState('');
  const [uncertainJob, setUncertainJob] = hooks.useState(null);
  const [priorityJob, setPriorityJob] = hooks.useState(null);
  const allowed = !current.readOnly && has(user.supplierId ? 'resource.write' : 'resource.dispatch');
  const changed = data => { setCurrent(data); onChanged(); };
  async function run(action) {
    if (busy) return;
    setBusy(true); setError('');
    try {
    const latest = await get(`/resources/${encodeURIComponent(current.id)}`);
      let result;
      if (action === 'usage') {
        result = await post(`/resources/${encodeURIComponent(current.id)}/usage`, { requestKey: crypto.randomUUID() });
        if (result.state !== 'UPDATED') throw new Error(`用量暂未更新：${result.state}`);
      }
      if (action === 'test') {
        result = await post(`/resources/${encodeURIComponent(current.id)}/say-hi`, { requestKey: crypto.randomUUID() });
        if (result.state !== 'SUCCESS' || result.ok !== true) throw new Error(`渠道连通性未确认：${result.state}`);
      }
      if (action === 'PAUSE' || action === 'RESUME') {
        result = await post('/resource-lifecycle-jobs', { action, requestKey: crypto.randomUUID(), items: [{ resourceId: current.id, resourceVersion: latest.version }] });
        if (!['COMPLETED', 'SUCCESS'].includes(result.state)) {
          if (result.state === 'UNKNOWN') setUncertainJob(result.id);
          throw new Error(`渠道操作未完成：${result.state}（${result.items?.[0]?.errorCode || '请核对状态'}）`);
        }
      }
      if (action === 'reconcile') {
        result = await post(`/resource-lifecycle-jobs/${encodeURIComponent(uncertainJob)}/reconcile`, {});
        if (!['COMPLETED', 'SUCCESS'].includes(result.state)) throw new Error(`原操作仍未确认：${result.state}`);
        setUncertainJob(null);
      }
      if (action === 'priority') {
        if (!/^\d+$/.test(priority) || Number(priority) > 1000) throw new Error('优先级须为0至1000的整数');
        result = await post('/cc-intake/admin/priority/jobs', { resourceIds: [current.id], targetId: current.targetId, priority: Number(priority), requestKey: crypto.randomUUID() });
        setPriorityJob(result.id);
        result = await post(`/cc-intake/admin/priority/jobs/${encodeURIComponent(result.id)}/start`, {});
        if (result.state !== 'COMPLETED') throw new Error(`优先级未确认：${result.state}，请到批量调整记录核对原操作`);
        setPriorityJob(null);
      }
      if (action === 'priority-reconcile') {
        result = await post(`/cc-intake/admin/priority/jobs/${encodeURIComponent(priorityJob)}/reconcile`, {});
        if (result.state !== 'COMPLETED') throw new Error(`原优先级任务仍未确认：${result.state}，请到批量调整记录处理`);
        setPriorityJob(null);
      }
      changed(await get(`/resources/${encodeURIComponent(current.id)}`));
      notify(action === 'test' ? `渠道连通性测试成功${result.time == null ? '' : `，耗时 ${result.time} 秒`}` : '渠道信息已更新');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); setConfirmation(''); }
  }
  return jsx(Dialog, { title: 'New API 渠道详情', onClose, children: [
    jsx(Details, { items: [['资源名称', current.name], ['渠道 ID', current.upstreamChannelId], ['供应商', current.supplierName || '—'], ['项目', current.projectName], ['渠道状态', channelLabel(current)], ['上游优先级', number(current.upstreamPriority)]] }),
    jsx(Notice, { children: '此资源关联上游已有渠道，不代表新建交付成功；配额保持上游原始单位。' }),
    jsx('section', { className: 'subsection', children: [jsx('h3', { children: '渠道用量' }), jsx(ChannelUsage, { resource: current }), jsx('p', { className: 'muted', children: `查询时间：${current.usage?.queriedAt || '未查询'}` })] }),
    error && jsx(Notice, { tone: 'red', children: error }),
    uncertainJob && jsx(Button, { disabled: busy, onClick: () => run('reconcile'), children: '核对原启停操作' }),
    allowed && !uncertainJob && jsx('div', { className: 'form-actions', children: [
      confirmation ? jsx(Notice, { tone: 'amber', children: [confirmation === 'PAUSE' ? '确认临时停用该真实渠道？' : '确认恢复该真实渠道？', jsx(Button, { disabled: busy, onClick: () => run(confirmation), children: '确认执行' }), jsx(Button, { disabled: busy, onClick: () => setConfirmation(''), children: '取消' })] })
        : jsx(Button, { disabled: busy || current.operationalState === 'GONE', onClick: () => setConfirmation(current.operationalState === 'PAUSED' ? 'RESUME' : 'PAUSE'), children: current.operationalState === 'PAUSED' ? '恢复启用' : '停用渠道' }),
    ] }),
    user.role === 'ADMIN' && has('resource.dispatch') && jsx('section', { className: 'subsection', children: [field('上游优先级（0–1000）', jsx('input', { type: 'number', min: 0, max: 1000, value: priority, disabled: !!priorityJob, onChange: event => setPriority(event.target.value) })), jsx(Button, { disabled: busy, onClick: () => run(priorityJob ? 'priority-reconcile' : 'priority'), children: priorityJob ? '核对原优先级任务' : '保存渠道优先级' })] }),
    jsx('footer', { className: 'dialog-footer', children: [has('resource.usage') && jsx(Button, { disabled: busy, onClick: () => run('usage'), children: busy ? '处理中…' : '刷新状态和用量' }), jsx(Button, { disabled: busy, onClick: () => run('test'), children: '测试连通性（会调用模型）' }), jsx(Button, { onClick: onClose, children: '关闭' })] }),
  ] });
}

export function NewApiLinkDialog({ onClose, onLinked }) {
  const [search, setSearch] = hooks.useState('');
  const targets = useData('/resource-targets');
  const resources = useData(`/resources?page=1&size=100&search=${encodeURIComponent(search)}`);
  const [targetId, setTargetId] = hooks.useState('');
  const [resourceId, setResourceId] = hooks.useState('');
  const [channelId, setChannelId] = hooks.useState('');
  const [busy, setBusy] = hooks.useState(false);
  const [error, setError] = hooks.useState('');
  const eligible = (resources.data?.items || []).filter(row => !row.readOnly && !isNewApi(row) && row.resourceType !== 'NEWAPI_INTAKE' && (!row.targetId || row.targetId === targetId));
  async function save(event) {
    event.preventDefault(); if (busy) return;
    setError('');
    if (!targetId || !resourceId || !/^[1-9][0-9]{0,17}$/.test(channelId)) { setError('请选择目标、本地资源，并填写有效渠道 ID'); return; }
    setBusy(true);
    try {
      const resource = await get(`/resources/${encodeURIComponent(resourceId)}`);
      const saved = await post(`/resources/${encodeURIComponent(resourceId)}/upstream-channel`, { targetId, channelId, version: resource.version });
      onLinked(saved);
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  return jsx(Dialog, { title: '关联 New API 渠道', onClose, children: jsx('form', { onSubmit: save, children: [
    jsx(Notice, { children: '关联上游已有渠道，只读取并核验渠道，不创建渠道、不导入密钥，也不改变交付和账务状态。' }),
    field('New API 资源目标', jsx('select', { required: true, value: targetId, onChange: event => setTargetId(event.target.value), children: [jsx('option', { value: '', children: '请选择目标' }), ...(targets.data || []).filter(row => row.enabled && row.protocol === 'NEWAPI').map(row => jsx('option', { value: row.id, children: row.name }, row.id))] })),
    field('搜索本地资源', jsx('input', { type: 'search', placeholder: '按资源名称、账号或 Lane ID 搜索', value: search, onChange: event => { setSearch(event.target.value); setResourceId(''); } })),
    field('本地资源', jsx('select', { required: true, value: resourceId, onChange: event => setResourceId(event.target.value), children: [jsx('option', { value: '', children: '请选择未关联资源' }), ...eligible.map(row => jsx('option', { value: row.id, children: `${row.name} · ${row.supplierName || '未命名供应商'}` }, row.id))] })),
    field('上游渠道 ID', jsx('input', { required: true, inputMode: 'numeric', pattern: '[1-9][0-9]{0,17}', value: channelId, onChange: event => setChannelId(event.target.value) })),
    !resources.loading && !eligible.length && jsx(Notice, { tone: 'amber', children: '没有可关联资源，请先由供应商创建本地资源草稿。' }),
    (error || targets.error || resources.error) && jsx(Notice, { tone: 'red', children: error || targets.error || resources.error }),
    jsx('footer', { className: 'dialog-footer', children: [jsx(Button, { type: 'button', onClick: onClose, children: '取消' }), jsx(Button, { type: 'submit', variant: 'primary', disabled: busy || resources.loading || targets.loading || !eligible.length, children: busy ? '核验中…' : '核验并关联' })] }),
  ] }) });
}
