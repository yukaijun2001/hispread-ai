// Resource connection setup. Onboarding is performed from the business resource flow.
import '../runtime/upstream-scope.css';
import PriorityHistory from './PriorityBatchDialog-DWPDEDJI.js';
import { ReactShim as hooks, jsxRuntime as view } from '../runtime/vue-compat.js';
import { C as context, G as Dialog, S as useData, c as Table, d as Empty, g as Notice, it as put, l as Details, m as Heading, rt as post, s as Button } from './index-Dnr0i-H9.js';

const jsx = view.jsx;
const protocolLabel = value => ({ NEWAPI: 'New API', CCMAX_NATIVE: 'CCMAX', CUSTOM: '兼容接入（已有配置）' }[value] || value);

export default function ResourceTargets() {
  const { has, refresh, notify } = context();
  const targets = useData(has('resource.config.read') ? '/resource-targets' : null);
  const [showHistory, setShowHistory] = hooks.useState(false);
  const [selected, setSelected] = hooks.useState(null);
  const [editing, setEditing] = hooks.useState(null);
  const [busy, setBusy] = hooks.useState(false);
  const [error, setError] = hooks.useState('');
  if (!has('resource.config.read')) return jsx(Empty, { text: '当前账号无权访问此页面', error: true });
  const open = target => { setSelected(target); setError(''); };
  async function check() {
    if (busy || !selected) return;
    setBusy(true); setError('');
    try {
      const result = await post(`/resource-targets/${encodeURIComponent(selected.id)}/test`, {});
      notify(result.message || '连接检查成功');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return jsx(view.Fragment, { children: [
    jsx(Heading, { title: '资源接口配置', children: [has('resource.dispatch') && jsx(Button, { onClick: () => setShowHistory(true), children: '历史调度记录' }), has('resource.config.write') && jsx(Button, { variant: 'primary', icon: 'plus', onClick: () => setEditing('new'), children: '新增接入' })] }),
    jsx('section', { className: 'panel', children: jsx(Table, {
      data: targets.data || [], loading: targets.loading, error: targets.error, onRow: open,
      columns: [
        { label: '接入名称', render: target => jsx('strong', { children: target.name }) },
        { label: '接入类型', render: target => protocolLabel(target.protocol || 'CUSTOM') },
        ...(has('resource.config.write') ? [{ label: '服务地址', render: target => target.baseUrl || '—' }] : []),
        { label: '状态', render: target => target.enabled ? '已启用' : '已停用' },
        { label: '默认接入', render: target => target.defaultTarget ? '是' : '—' },
        { label: '操作', render: target => jsx(Button, { onClick: event => { event.stopPropagation(); open(target); }, children: '查看' }) },
      ],
    }) }),
    selected && jsx(Dialog, { title: selected.name, onClose: () => { if (!busy) setSelected(null); }, children: [
      jsx(Details, { items: [
        ['接入类型', protocolLabel(selected.protocol || 'CUSTOM')],
        ...(has('resource.config.write') ? [['服务地址', selected.baseUrl], ['管理凭据', (selected.protocol === 'CCMAX_NATIVE' ? selected.adminPasswordConfigured : selected.apiKeyConfigured) ? '已配置' : '未配置']] : []),
        ['状态', selected.enabled ? '已启用' : '已停用'], ['默认接入', selected.defaultTarget ? '是' : '否'],
      ] }),
      jsx('p', { className: 'muted', children: '在资源列表关联已有账号；新增上号请从交付流程发起。' }),
      error && jsx('div', { role: 'alert', children: jsx(Notice, { tone: 'red', children: error }) }),
      jsx('footer', { className: 'dialog-footer', children: [
        has('resource.config.test') && jsx(Button, { disabled: busy || !selected.enabled, onClick: check, children: busy ? '正在检查…' : '检查连接' }),
        has('resource.config.write') && jsx(Button, { disabled: busy, onClick: () => { setEditing(selected); setSelected(null); }, children: '编辑' }),
        jsx(Button, { disabled: busy, onClick: () => setSelected(null), children: '关闭' }),
      ] }),
    ] }),
    showHistory && jsx(PriorityHistory, { onClose: () => setShowHistory(false) }),
    editing && jsx(TargetForm, { target: editing, onClose: () => setEditing(null), onSaved: () => { targets.reload(); refresh(); notify('接入配置已保存'); } }),
  ] });
}

function TargetForm({ target, onClose, onSaved }) {
  const isNew = target === 'new';
  const [name, setName] = hooks.useState(isNew ? '' : target.name);
  const [baseUrl, setBaseUrl] = hooks.useState(isNew ? '' : target.baseUrl || '');
  const [protocol, setProtocol] = hooks.useState(isNew ? 'CCMAX_NATIVE' : target.protocol || 'CUSTOM');
  const [username, setUsername] = hooks.useState(isNew ? '' : target.adminUsername || '');
  const [password, setPassword] = hooks.useState('');
  const [apiKey, setApiKey] = hooks.useState('');
  const [userId, setUserId] = hooks.useState(isNew ? '' : String(target.newApiUserId ?? ''));
  const [allowHttp, setAllowHttp] = hooks.useState(!isNew && !!target.allowHttp);
  const [enabled, setEnabled] = hooks.useState(isNew || !!target.enabled);
  const [defaultTarget, setDefaultTarget] = hooks.useState(!isNew && !!target.defaultTarget);
  const [busy, setBusy] = hooks.useState(false);
  const [error, setError] = hooks.useState('');
  const id = hooks.useId();
  const native = protocol === 'CCMAX_NATIVE';
  const field = (key, label, props, hint) => jsx('div', { className: 'field full', children: [
    jsx('label', { htmlFor: `${id}-${key}`, children: label }),
    jsx('input', { ...props, id: `${id}-${key}`, name: key, disabled: busy, ...(hint ? { 'aria-describedby': `${id}-${key}-hint` } : {}) }),
    hint && jsx('small', { id: `${id}-${key}-hint`, children: hint }),
  ] });
  const toggle = (key, label, checked, setter, hint) => jsx('label', { className: 'settings-switch full target-config-switch', children: [
    jsx('span', { children: [jsx('strong', { children: label }), hint && jsx('small', { children: hint })] }),
    jsx('input', { type: 'checkbox', name: key, checked, disabled: busy, onChange: event => setter(event.target.checked) }),
    jsx('span', { className: 'settings-switch-track', 'aria-hidden': true }),
  ] });
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const input = { name: name.trim(), baseUrl: baseUrl.trim(), protocol, enabled, defaultTarget,
        allowHttp: allowHttp && baseUrl.trim().toLowerCase().startsWith('http://'),
        ...(native ? { adminUsername: username.trim(), ...(password ? { adminPassword: password } : {}) }
          : { ...(protocol === 'NEWAPI' ? { newApiUserId: userId.trim() } : {}), ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}) }),
        ...(!isNew ? { version: target.version } : {}),
      };
      if (isNew) await post('/resource-targets', input);
      else await put(`/resource-targets/${encodeURIComponent(target.id)}`, input);
      onSaved(); onClose();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return jsx(Dialog, { title: isNew ? '新增资源接入' : '编辑资源接入', onClose: () => { if (!busy) onClose(); }, children:
    jsx('form', { className: 'target-config-form', onSubmit: save, method: 'post', 'aria-label': '资源接入配置', children: [
      jsx('p', { className: 'muted', children: '标有 * 的项目为必填。' }),
      jsx('div', { className: 'form-grid', children: [
        field('name', '接入名称 *', { required: true, maxLength: 128, value: name, onChange: event => setName(event.target.value) }),
        field('baseUrl', '服务地址 *', { required: true, type: 'url', placeholder: 'https://example.com', spellCheck: false, autoCapitalize: 'none', value: baseUrl, onChange: event => { setBaseUrl(event.target.value); setAllowHttp(false); } }),
        isNew ? jsx('fieldset', { className: 'upstream-type full', disabled: busy, children: [
          jsx('legend', { children: '接入类型 *' }),
          ...['CCMAX_NATIVE', 'NEWAPI'].map(value => jsx('label', { children: [jsx('input', { type: 'radio', name: 'protocol', value, required: true, checked: protocol === value, onChange: () => setProtocol(value) }), ` ${protocolLabel(value)}`] }, value)),
        ] }) : jsx('p', { className: 'field full', children: `接入类型：${protocolLabel(protocol)}` }),
        native ? [
          field('adminUsername', 'CCMAX 管理员账号 *', { required: true, maxLength: 160, autoComplete: 'off', autoCapitalize: 'none', spellCheck: false, value: username, onChange: event => setUsername(event.target.value) }),
          field('adminPassword', `CCMAX 管理员密码${isNew || !target.adminPasswordConfigured ? ' *' : ''}`, { required: isNew || !target.adminPasswordConfigured, type: 'password', autoComplete: 'new-password', maxLength: 512, value: password, onChange: event => setPassword(event.target.value) }, isNew || !target.adminPasswordConfigured ? '保存后不回显。' : '留空保留已有密码。'),
        ] : [
          protocol === 'NEWAPI' && field('newApiUserId', 'New API 管理员用户 ID *', { required: true, inputMode: 'numeric', pattern: '[1-9][0-9]{0,18}', value: userId, onChange: event => setUserId(event.target.value) }),
          field('apiKey', `管理令牌${isNew || !target.apiKeyConfigured ? ' *' : ''}`, { required: isNew || !target.apiKeyConfigured, type: 'password', autoComplete: 'new-password', value: apiKey, onChange: event => setApiKey(event.target.value) }, isNew || !target.apiKeyConfigured ? '保存后不回显。' : '留空保留已有令牌。'),
        ],
        baseUrl.trim().toLowerCase().startsWith('http://') && toggle('allowHttp', '允许此 HTTP 地址', allowHttp, setAllowHttp, '仅批准当前地址，管理凭据会通过 HTTP 传输。'),
        toggle('defaultTarget', '默认接入', defaultTarget, setDefaultTarget, '多个接入启用时，只选择一个作为默认接入。'),
        toggle('enabled', '启用接入', enabled, setEnabled),
      ] }),
      error && jsx('div', { role: 'alert', children: jsx(Notice, { tone: 'red', children: error }) }),
      jsx('footer', { className: 'dialog-footer', children: [jsx(Button, { type: 'button', disabled: busy, onClick: onClose, children: '取消' }), jsx(Button, { type: 'submit', variant: 'primary', disabled: busy, children: busy ? '正在保存…' : '保存配置' })] }),
    ] }),
  });
}
