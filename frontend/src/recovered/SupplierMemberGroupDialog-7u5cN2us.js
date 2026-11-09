// origin: assets/SupplierMemberGroupDialog-7u5cN2us.js
import {
  C as e,
  G as t,
  X as n,
  Z as r,
  g as i,
  it as a,
  mt as o,
  s,
  u as c,
  vt as l
} from "./index-Dnr0i-H9.js";
var u = l(r(), 1),
  d = n();

function f({
  agent: n,
  groups: r,
  onClose: l,
  onSaved: f
}) {
  let {
    notify: p
  } = e(), m = r.find(e => e.memberIds.includes(n.id)), [h, g] = (0, u.useState)(``), [_, v] = (0, u.useState)(!1), [y, b] = (0, u.useState)(``), x = r.find(e => e.id === h);
  async function S() {
    if (!_ && x) {
      v(!0), b(``);
      try {
        await a(`/supplier-team-groups/${encodeURIComponent(x.id)}`, {
          name: x.name,
          adminUserId: x.adminUserId,
          memberIds: [...new Set([...x.memberIds, n.id])],
          version: x.version,
          sourceVersions: m ? {
            [m.id]: m.version
          } : {}
        }), p(o(`成员分组已更新`)), f(), l()
      } catch (e) {
        b(e.message)
      } finally {
        v(!1)
      }
    }
  }
  return (0, d.jsxs)(t, {
    title: o(`调整分组`),
    subtitle: `${n.displayName} · ${n.username}`,
    onClose: () => !_ && l(),
    children: [(0, d.jsx)(`p`, {
      children: o(`当前部门：{0}`, [m?.name || `—`])
    }), (0, d.jsxs)(`div`, {
      className: `field`,
      children: [(0, d.jsx)(`span`, {
        children: o(`目标部门`)
      }), (0, d.jsx)(c, {
        ariaLabel: o(`目标部门`),
        value: h,
        onChange: g,
        disabled: _,
        options: [{
          value: ``,
          label: o(`请选择目标部门`)
        }, ...r.filter(e => e.id !== m?.id).map(e => ({
          value: e.id,
          label: e.name
        }))]
      })]
    }), y && (0, d.jsx)(i, {
      tone: `red`,
      children: y
    }), (0, d.jsxs)(`footer`, {
      className: `dialog-footer`,
      children: [(0, d.jsx)(s, {
        disabled: _,
        onClick: l,
        children: o(`取消`)
      }), (0, d.jsx)(s, {
        variant: `primary`,
        disabled: _ || !x,
        onClick: () => void S(),
        children: o(_ ? `保存中…` : `保存分组`)
      })]
    })]
  })
}
export {
  f as
  default
};