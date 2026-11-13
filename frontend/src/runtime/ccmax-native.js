import { ReactShim as hooks, jsxRuntime as view } from './vue-compat.js';
import { $ as get, C as context, G as Dialog, S as useData, g as Notice, l as Details, rt as post, s as Button } from '../recovered/index-Dnr0i-H9.js';

const jsx = view.jsx;
const field = (label, element) => jsx('label', { className: 'field full', children: [jsx('span', { children: label }), element] });
export const isNativeCcmax = resource => resource.upstreamProtocol === 'CCMAX_NATIVE' || !!resource.upstreamAccountId;
const stateLabel = resource => ({ ACTIVE: '已启用', PAUSED: '已停用', GONE: '已归档', ERROR: '异常' }[resource.operationalState] || '待查询');

export function NativeCcmaxDialog({ resource, onClose, onChanged }) {
  const { user, has, notify } = context();
  const capabilities = useData('/resources/submission-capabilities', 30000);
  const refreshStatus = useData(`/resources/${encodeURIComponent(resource.id)}/credential-refresh`);
  const reauthorizationStatus = useData(`/resources/${encodeURIComponent(resource.id)}/reauthorizations/current`);
  const [current, setCurrent] = hooks.useState(resource);
  const [busy, setBusy] = hooks.useState(false);
  const [error, setError] = hooks.useState('');
  const [confirmation, setConfirmation] = hooks.useState('');
  const [weight, setWeight] = hooks.useState(String(resource.upstreamPriority ?? ''));
  const [oauth, setOauth] = hooks.useState(null);
  const [callback, setCallback] = hooks.useState('');
  const [pendingOperation, setPendingOperation] = hooks.useState(null);
  const attemptedRequests = hooks.useRef(new Map());
  const pendingStates = ['UNKNOWN', 'SUBMITTING', 'PENDING', 'RUNNING'];
  const refreshUncertain = pendingStates.includes(refreshStatus.data?.state);
  const authorizationUncertain = pendingStates.includes(reauthorizationStatus.data?.state);
  const checkingRefresh = (!refreshStatus.data && !refreshStatus.error) || (!reauthorizationStatus.data && !reauthorizationStatus.error);
  const blockedByRefresh = checkingRefresh || !!refreshStatus.error || !!reauthorizationStatus.error || refreshUncertain || authorizationUncertain;
  hooks.useEffect(() => {
    const previous = refreshStatus.data;
    if (previous?.operationId && pendingStates.includes(previous.state)) {
      setPendingOperation(existing => existing || { kind: 'operation', id: previous.operationId });
    }
  }, [refreshStatus.data]);
  hooks.useEffect(() => {
    const previous = reauthorizationStatus.data;
    if (previous?.id && pendingStates.includes(previous.state)) {
      setPendingOperation(existing => existing || { kind: 'reauthorization', id: previous.id });
      setCallback('');
    }
  }, [reauthorizationStatus.data]);
  const removed = current.operationalState === 'GONE';
  const allowed = !current.readOnly && has(user.supplierId ? 'resource.write' : 'resource.dispatch');
  const knownCapabilities = !!capabilities.data && !capabilities.error;
  const canPause = knownCapabilities && capabilities.data.allowCcmaxPause === true;
  const canReauthorize = knownCapabilities && capabilities.data.allowCcmaxReauthorization === true;
  const canRemove = knownCapabilities && capabilities.data.allowCcmaxSafeRemoval === true;
  const confirmationAllowed = confirmation === 'REMOVE' ? canRemove : confirmation === 'credential-refresh' ? canReauthorize : canPause;
  async function run(action) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const latest = await get(`/resources/${encodeURIComponent(current.id)}`);
      if (latest.operationalState === 'GONE' && action !== 'reconcile-pending') throw new Error('账号已归档，仅可查看历史信息');
      let result;
      if (pendingOperation && action !== 'reconcile-pending') throw new Error('原操作尚未确认，请先核对原操作');
      if (action === 'reconcile-pending') {
        const original = pendingOperation;
        result = original.kind === 'priority'
          ? await post(`/cc-intake/admin/priority/jobs/${encodeURIComponent(original.id)}/reconcile`, {})
          : original.kind === 'reauthorization'
            ? await get(`/resources/${encodeURIComponent(current.id)}/reauthorizations/${encodeURIComponent(original.id)}`)
          : original.kind === 'operation'
            ? await post(`/resources/${encodeURIComponent(current.id)}/operations/${encodeURIComponent(original.id)}/reconcile`, {})
            : await post(`/resource-lifecycle-jobs/${encodeURIComponent(original.id)}/reconcile`, {});
        if (!['UPDATED', 'SUCCESS', 'COMPLETED'].includes(result.state)) throw new Error(result.message || `原操作仍未确认：${result.state}，请人工核对，勿重复提交`);
        setPendingOperation(null);
        refreshStatus.reload();
        reauthorizationStatus.reload();
      }
      if (action === 'usage' || action === 'credential-refresh') {
        const requestKey = attemptedRequests.current.get(action) || crypto.randomUUID();
        attemptedRequests.current.set(action, requestKey);
        try { result = await post(`/resources/${encodeURIComponent(current.id)}/${action}`, { requestKey }); }
        catch (failure) {
          if (failure.status >= 500 || !failure.status || failure.details?.code === 'RESOURCE_OPERATION_UNCERTAIN') {
            try {
              const receipt = action === 'credential-refresh'
                ? await get(`/resources/${encodeURIComponent(current.id)}/credential-refresh`)
                : await post(`/resources/${encodeURIComponent(current.id)}/${action}`, { requestKey });
              if (receipt.operationId && pendingStates.includes(receipt.state)) setPendingOperation({ kind: 'operation', id: receipt.operationId });
            } catch { /* Keep the original request key while the server is unavailable. */ }
          } else {
            attemptedRequests.current.delete(action);
          }
          if (action === 'credential-refresh') refreshStatus.reload();
          throw failure;
        }
        if (pendingStates.includes(result.state) && result.operationId) setPendingOperation({ kind: 'operation', id: result.operationId });
        if (!['UPDATED', 'SUCCESS'].includes(result.state)) throw new Error(`操作未确认：${result.state}`);
        attemptedRequests.current.delete(action);
      } else if (['PAUSE', 'RESUME', 'REMOVE'].includes(action)) {
        result = await post('/resource-lifecycle-jobs', { requestKey: crypto.randomUUID(), action, items: [{ resourceId: current.id, resourceVersion: latest.version }] });
        if (result.state !== 'COMPLETED') { setPendingOperation({ kind: 'lifecycle', id: result.id }); throw new Error(`操作未完成：${result.state}，请核对原操作`); }
      } else if (action === 'priority') {
        if (!/^\d+$/.test(weight) || Number(weight) > 1000) throw new Error('权重须为0至1000的整数');
        const preview = await post('/cc-intake/admin/priority/jobs', { resourceIds: [current.id], targetId: current.targetId, priority: Number(weight), requestKey: crypto.randomUUID() });
        setPendingOperation({ kind: 'priority', id: preview.id });
        result = await post(`/cc-intake/admin/priority/jobs/${encodeURIComponent(preview.id)}/start`, {});
        if (result.state !== 'COMPLETED') throw new Error(`权重未确认：${result.state}，请核对原任务`);
        setPendingOperation(null);
      } else if (action === 'reauthorize') {
        result = await post(`/resources/${encodeURIComponent(current.id)}/reauthorizations`, { requestKey: crypto.randomUUID() });
        setOauth(result); setCallback('');
        return;
      } else if (action === 'reauthorize-complete') {
        if (!oauth?.id || !callback.trim()) throw new Error('请先生成链接并填写本次回调');
        const requestKey = attemptedRequests.current.get(oauth.id) || crypto.randomUUID();
        attemptedRequests.current.set(oauth.id, requestKey);
        try {
          result = await post(`/resources/${encodeURIComponent(current.id)}/reauthorizations/${encodeURIComponent(oauth.id)}`, { code: callback.trim(), requestKey });
        } catch (failure) {
          if (failure.status >= 500 || !failure.status || failure.details?.code === 'OAUTH_SESSION_NOT_READY') {
            setPendingOperation({ kind: 'reauthorization', id: oauth.id });
            setCallback('');
            reauthorizationStatus.reload();
          }
          throw failure;
        }
        if (result.state !== 'SUCCESS') {
          setPendingOperation({ kind: 'reauthorization', id: oauth.id }); setCallback('');
          reauthorizationStatus.reload();
          throw new Error(`重新授权未确认：${result.state}，请查询原授权，勿再次兑换`);
        }
        attemptedRequests.current.delete(oauth.id);
        reauthorizationStatus.reload();
        setOauth(null); setCallback('');
      }
      const refreshed = await get(`/resources/${encodeURIComponent(current.id)}`);
      setCurrent(refreshed); onChanged(); notify('CCMAX 账号信息已更新');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); setConfirmation(''); }
  }
  return jsx(Dialog, { title: 'CCMAX 原生账号详情', onClose, children: [
    jsx(Details, { items: [['资源名称', current.name], ['上游账号 ID', current.upstreamAccountId || current.laneId], ['供应商', current.supplierName || '—'], ['项目', current.projectName], ['账号状态', stateLabel(current)], ['调度权重', String(current.upstreamPriority ?? '未查询')]] }),
    jsx(Notice, { children: '关联上游已有账号不代表新建交付；累计用量仅作观察，不会自动生成或结算账单。原生“移除”对应上游归档。' }),
    current.usage && jsx('p', { children: `上游累计费用：${current.usage.amount ?? '未查询'} ${current.usage.currency || ''}；查询时间：${current.usage.queriedAt || '未查询'}` }),
    error && jsx('div', { role: 'alert', children: jsx(Notice, { tone: 'red', children: error }) }),
    pendingOperation && jsx(Button, { disabled: busy, onClick: () => run('reconcile-pending'), children: pendingOperation.kind === 'reauthorization' ? '查询原授权结果（不再次兑换）' : '核对原操作（不重复写入）' }),
    refreshUncertain && jsx(Notice, { tone: 'amber', children: '原凭据刷新结果尚未确认。账号可读取不能证明刷新成功，请核对原操作，勿重新刷新。' }),
    authorizationUncertain && jsx(Notice, { tone: 'amber', children: '原授权已提交兑换，结果尚未确认。请查询原授权结果，勿再次提交回调或生成新的授权。' }),
    refreshStatus.error && jsx('div', { role: 'alert', children: jsx(Notice, { tone: 'red', children: ['原凭据刷新记录读取失败，暂不能发起新的操作。', jsx(Button, { disabled: busy, onClick: refreshStatus.reload, children: '重新读取原操作' })] }) }),
    reauthorizationStatus.error && jsx('div', { role: 'alert', children: jsx(Notice, { tone: 'red', children: ['原授权记录读取失败，暂不能发起新的操作。', jsx(Button, { disabled: busy, onClick: reauthorizationStatus.reload, children: '重新读取原授权' })] }) }),
    removed && jsx(Notice, { tone: 'amber', children: '账号已归档，所有上游操作均已禁用。' }),
    allowed && !removed && capabilities.error && jsx(Notice, { tone: 'red', children: ['操作权限读取失败，请重试。', jsx(Button, { onClick: capabilities.reload, children: '重新读取权限' })] }),
    allowed && !removed && knownCapabilities && (!canPause || !canReauthorize) && jsx(Notice, { children: [!canPause && '当前账号未开通资源启停。', !canReauthorize && '当前账号未开通凭据刷新和重新授权。'] }),
    allowed && jsx('div', { className: 'form-actions', children: [
      jsx(Button, { disabled: busy || removed || !!pendingOperation || blockedByRefresh || !canPause, onClick: () => setConfirmation(current.operationalState === 'PAUSED' ? 'RESUME' : 'PAUSE'), children: current.operationalState === 'PAUSED' ? '恢复启用' : '停用账号' }),
      jsx(Button, { disabled: busy || removed || !!pendingOperation || blockedByRefresh || !canReauthorize, onClick: () => setConfirmation('credential-refresh'), children: '刷新凭据' }),
      jsx(Button, { disabled: busy || removed || !!pendingOperation || blockedByRefresh || !canReauthorize, onClick: () => run('reauthorize'), children: '生成重新授权链接' }),
      user.role === 'ADMIN' && jsx(Button, { disabled: busy || removed || !!pendingOperation || blockedByRefresh || !canRemove, onClick: () => setConfirmation('REMOVE'), children: '归档账号' }),
    ] }),
    confirmation && jsx(Notice, { tone: 'amber', children: [confirmation === 'REMOVE' ? '确认归档该真实账号？归档后将退出调度。' : confirmation === 'credential-refresh' ? '确认刷新该真实账号凭据？' : '确认修改该真实账号启停状态？', jsx(Button, { disabled: busy || !confirmationAllowed, onClick: () => run(confirmation), children: '确认执行' }), jsx(Button, { disabled: busy, onClick: () => setConfirmation(''), children: '取消' })] }),
    user.role === 'ADMIN' && jsx('section', { className: 'subsection', children: [field('调度权重（0–1000）', jsx('input', { type: 'number', min: 0, max: 1000, value: weight, disabled: busy || removed || !!pendingOperation || blockedByRefresh, onChange: event => setWeight(event.target.value) })), jsx(Button, { disabled: busy || removed || !!pendingOperation || blockedByRefresh, onClick: () => run('priority'), children: '保存调度权重' })] }),
    oauth && !pendingOperation && jsx('section', { className: 'subsection', children: [jsx('p', { children: `授权有效至 ${oauth.expiresAt || '以官方页面为准'}` }), jsx('textarea', { readOnly: true, rows: 4, value: oauth.authUrl }), jsx('a', { href: oauth.authUrl, target: '_blank', rel: 'noopener noreferrer', children: '打开官方授权页面' }), field('完整回调地址或 code#state', jsx('textarea', { rows: 3, value: callback, onChange: event => setCallback(event.target.value) })), jsx(Button, { disabled: busy || !callback.trim(), onClick: () => run('reauthorize-complete'), children: '回填并更新原账号凭据' })] }),
    jsx('footer', { className: 'dialog-footer', children: [has('resource.usage') && jsx(Button, { disabled: busy || removed || !!pendingOperation || blockedByRefresh, onClick: () => run('usage'), children: busy ? '处理中…' : '刷新上游用量' }), jsx(Button, { onClick: onClose, children: '关闭' })] }),
  ] });
}

export function NativeCcmaxLinkDialog({ onClose, onLinked }) {
  const targets = useData('/resource-targets');
  const resources = useData('/resources?page=1&size=100');
  const [targetId, setTargetId] = hooks.useState('');
  const [resourceId, setResourceId] = hooks.useState('');
  const [accountId, setAccountId] = hooks.useState('');
  const [busy, setBusy] = hooks.useState(false);
  const [error, setError] = hooks.useState('');
  const [accounts, setAccounts] = hooks.useState({ items: [], total: 0, loading: false, error: '' });
  const [search, setSearch] = hooks.useState('');
  const [page, setPage] = hooks.useState(1);
  const [revision, setRevision] = hooks.useState(0);
  hooks.useEffect(() => {
    if (!targetId) { setAccounts({ items: [], total: 0, loading: false, error: '' }); return; }
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 65000);
    setAccounts({ items: [], total: 0, loading: true, error: '' });
    get(`/resource-targets/${encodeURIComponent(targetId)}/accounts?page=${page}&search=${encodeURIComponent(search)}`, { signal: controller.signal })
      .then(result => { if (alive) setAccounts({ items: result.items || [], total: result.total || 0, loading: false, error: '' }); })
      .catch(failure => { if (alive) setAccounts({ items: [], total: 0, loading: false, error: controller.signal.aborted ? '上游账号读取超时，请重试' : failure.message }); })
      .finally(() => clearTimeout(timer));
    return () => { alive = false; controller.abort(); clearTimeout(timer); };
  }, [targetId, revision, page]);
  const eligible = (resources.data?.items || []).filter(row => row.resourceType === 'CCMAX' && row.state === 'DRAFT' && !row.laneId && !row.upstreamChannelId && (!row.targetId || row.targetId === targetId));
  async function save(event) {
    event.preventDefault(); if (busy) return;
    if (!targetId || !resourceId || !accountId) { setError('请选择目标、本地草稿和上游账号'); return; }
    setBusy(true); setError('');
    try {
      const resource = await get(`/resources/${encodeURIComponent(resourceId)}`);
      const result = await post(`/resources/${encodeURIComponent(resourceId)}/upstream-account`, { targetId, accountId, version: resource.version });
      onLinked(result);
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }
  return jsx(Dialog, { title: '关联 CCMAX 原生账号', onClose, children: jsx('form', { onSubmit: save, children: [
    jsx(Notice, { children: '仅核验并关联已有账号，不修改上游账号、凭据、归属和调度状态。' }),
    field('CCMAX 原生目标', jsx('select', { value: targetId, onChange: event => { setTargetId(event.target.value); setAccountId(''); setPage(1); }, children: [jsx('option', { value: '', children: '请选择目标' }), ...(targets.data || []).filter(target => target.enabled && target.protocol === 'CCMAX_NATIVE').map(target => jsx('option', { value: target.id, children: target.name }, target.id))] })),
    field('本地资源草稿', jsx('select', { value: resourceId, onChange: event => setResourceId(event.target.value), children: [jsx('option', { value: '', children: '请选择未关联草稿' }), ...eligible.map(resource => jsx('option', { value: resource.id, children: `${resource.name} · ${resource.supplierName || '供应商'}` }, resource.id))] })),
    field('搜索上游账号', jsx('input', { value: search, placeholder: '上游账号名称', onChange: event => setSearch(event.target.value) })),
    jsx(Button, { type: 'button', disabled: !targetId || accounts.loading, onClick: () => { setAccountId(''); setPage(1); setRevision(value => value + 1); }, children: '查询上游账号' }),
    field('上游账号', jsx('select', { value: accountId, disabled: accounts.loading, onChange: event => setAccountId(event.target.value), children: [jsx('option', { value: '', children: accounts.loading ? '正在读取上游账号，请稍候…' : '请选择上游账号' }), ...accounts.items.map(account => jsx('option', { value: account.id, children: `${account.name} · ${account.status} · ${account.id}` }, account.id))] })),
    accounts.error && jsx(Button, { type: 'button', onClick: () => setRevision(value => value + 1), children: '重新读取上游账号' }),
    accounts.total > 20 && jsx('div', { className: 'form-actions', children: [jsx(Button, { type: 'button', disabled: page <= 1 || accounts.loading, onClick: () => { setAccountId(''); setPage(value => value - 1); }, children: '上一页' }), jsx('span', { children: `第 ${page} 页，共 ${accounts.total} 个账号` }), jsx(Button, { type: 'button', disabled: page * 20 >= accounts.total || accounts.loading, onClick: () => { setAccountId(''); setPage(value => value + 1); }, children: '下一页' })] }),
    (error || targets.error || resources.error || accounts.error) && jsx(Notice, { tone: 'red', children: error || targets.error || resources.error || accounts.error }),
    jsx('footer', { className: 'dialog-footer', children: [jsx(Button, { type: 'button', onClick: onClose, children: '取消' }), jsx(Button, { type: 'submit', variant: 'primary', disabled: busy || !targetId || !resourceId || !accountId, children: busy ? '核验中…' : '核验并关联' })] }),
  ] }) });
}
