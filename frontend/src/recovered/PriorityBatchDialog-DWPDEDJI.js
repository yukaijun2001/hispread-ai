// Read-only access to historical routing adjustments; new adjustments live in the upstream console.
import { ReactShim as hooks, jsxRuntime as view } from '../runtime/vue-compat.js';
import { C as context, G as Dialog, P as date, S as useData, c as Table, g as Notice, l as Details, rt as post, s as Button } from './index-Dnr0i-H9.js';

const jsx = view.jsx;
const root = '/cc-intake/admin/priority/jobs';
const label = value => ({ PREVIEW: '旧预览（已停用）', RUNNING: '处理中', UNKNOWN: '待核对', PARTIAL_FAILED: '部分失败', FAILED: '失败', COMPLETED: '已完成', SUCCESS: '成功' }[value] || value || '—');

export default function PriorityHistory({ onClose }) {
  const { user, has, notify } = context();
  const permitted = user.role === 'ADMIN' && has('resource.dispatch');
  const history = useData(permitted ? root : null);
  const [selected, setSelected] = hooks.useState(null);
  const [busy, setBusy] = hooks.useState(false);
  const [error, setError] = hooks.useState('');
  const detail = useData(permitted && selected ? `${root}/${encodeURIComponent(selected.id)}` : null);
  const current = detail.data || selected;
  async function reconcile() {
    if (busy || !current) return;
    setBusy(true); setError('');
    try {
      const result = await post(`${root}/${encodeURIComponent(current.id)}/reconcile`, {});
      setSelected(result); detail.reload(); history.reload();
      notify(result.state === 'COMPLETED' ? '原结果已确认' : result.state === 'PREVIEW' ? '此旧任务未执行，已停用' : '已查询原结果，请核对记录');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return jsx(Dialog, { title: '历史调度记录', wide: true, onClose: () => { if (!busy) onClose(); }, children: [
    jsx('p', { className: 'muted', children: '保留旧调整记录供核对。新的权重与优先级调整请在上游管理台处理。' }),
    !permitted ? jsx(Notice, { tone: 'red', children: '当前账号无权访问历史记录' }) : current ? [
      jsx(Details, { items: [['创建时间', date(current.createdAt)], ['账号数量', String(current.total ?? '—')], ['结果', label(current.state)]] }),
      jsx(Table, { data: current.items || [], loading: detail.loading, error: detail.error,
        columns: [{ label: '资源', render: item => item.resourceName || item.resourceId || '—' }, { label: '原调整值', render: item => item.priority ?? '—' }, { label: '结果', render: item => label(item.state) }] }),
      !['NEWAPI', 'CCMAX_NATIVE'].includes(current.protocol) && jsx(Notice, { children: '此旧接入没有只读核对协议，请在上游核实结果。' }),
    ] : jsx(Table, { data: history.data || [], loading: history.loading, error: history.error, onRow: row => { setSelected(row); setError(''); },
      columns: [{ label: '创建时间', render: row => date(row.createdAt) }, { label: '账号数量', render: row => row.total ?? '—' }, { label: '结果', render: row => label(row.state) },
        { label: '操作', render: row => jsx(Button, { onClick: () => { setSelected(row); setError(''); }, children: '查看' }) }] }),
    error && jsx('div', { role: 'alert', children: jsx(Notice, { tone: 'red', children: error }) }),
    jsx('footer', { className: 'dialog-footer', children: [
      current && jsx(Button, { disabled: busy, onClick: () => { setSelected(null); setError(''); }, children: '返回记录' }),
      current && ['NEWAPI', 'CCMAX_NATIVE'].includes(current.protocol) && ['PREVIEW', 'UNKNOWN', 'RUNNING', 'PREPARING', 'PARTIAL_FAILED'].includes(current.state) && jsx(Button, { disabled: busy || detail.loading || !!detail.error, onClick: reconcile, children: busy ? '正在查询…' : '查询原结果' }),
      jsx(Button, { disabled: busy, onClick: onClose, children: '关闭' }),
    ] }),
  ] });
}
