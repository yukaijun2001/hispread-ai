// origin: assets/Roles-BkB5m-qF.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/RoleEditor-D-Ljkwz-.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/system-user-roles-CUQaL0u7.css"]))) => i.map(i => d[i]);
import {
  C as e,
  S as t,
  X as n,
  Z as r,
  _ as i,
  c as a,
  f as o,
  i as s,
  m as c,
  mt as l,
  s as u,
  vt as d,
  y as f
} from "./index-Dnr0i-H9.js";
import {
  n as p
} from "./systemLabels-DqpNuQ-_.js";
var m = d(r(), 1),
  h = n();

function g() {
  let {
    refresh: n,
    notify: r
  } = e(), [s, d] = (0, m.useState)(``), [g, v] = (0, m.useState)(1), [y, b] = (0, m.useState)(10), [x, S] = (0, m.useState)(null), C = new URLSearchParams({
    search: s,
    page: String(g),
    size: String(y)
  }), w = t(`/system/roles/page?${C.toString()}`), T = w.data?.items || [];
  return (0, h.jsxs)(h.Fragment, {
    children: [(0, h.jsx)(c, {
      title: l(`角色与权限`),
      children: (0, h.jsx)(u, {
        icon: `plus`,
        variant: `primary`,
        onClick: () => S(`new`),
        children: l(`新建角色 `)
      })
    }), (0, h.jsxs)(`section`, {
      className: `panel`,
      children: [(0, h.jsx)(o, {
        actions: (0, h.jsx)(u, {
          icon: `refresh`,
          "aria-label": l(`刷新角色`),
          onClick: n
        }),
        children: (0, h.jsx)(f, {
          value: s,
          onChange: e => {
            d(e), v(1)
          },
          placeholder: l(`搜索角色名称或标识`)
        })
      }), (0, h.jsx)(a, {
        data: T,
        loading: w.loading,
        error: w.error,
        columns: [{
          label: l(`角色名称`),
          render: e => (0, h.jsx)(`strong`, {
            children: p(e)
          })
        }, {
          label: l(`角色标识`),
          render: e => (0, h.jsx)(`code`, {
            children: e.code
          })
        }, {
          label: l(`类型`),
          render: e => (0, h.jsx)(`span`, {
            className: `platform-tag`,
            children: e.builtIn ? l(`内置`) : l(`自定义`)
          })
        }, {
          label: l(`授权数量`),
          render: e => l(`{0} 项`, [e.permissions.length])
        }, {
          label: l(`操作`),
          render: e => (0, h.jsx)(`button`, {
            className: `text-button`,
            onClick: () => S(e),
            children: [`ADMIN`, `SUPPLIER`, `SUPPLIER_AGENT`].includes(e.code) ? l(`权限配置`) : l(`编辑`)
          })
        }]
      }), (0, h.jsx)(i, {
        data: w.data,
        page: g,
        onPage: v,
        size: y,
        onSizeChange: e => {
          b(e), v(1)
        }
      })]
    }), x && (0, h.jsx)(_, {
      role: x,
      permissions: w.data?.permissions || [],
      scopeTypes: w.data?.scopeTypes || [],
      onClose: () => S(null),
      onSaved: () => {
        n(), r(l(`角色已保存`)), S(null)
      }
    }, x === `new` ? `new` : x.code)]
  })
}
var _ = (0, m.lazy)(() => s(() => import(`./RoleEditor-D-Ljkwz-.js`).then(e => ({
  default: e.RoleEditor
})), __vite__mapDeps([0, 1, 2, 3])));
export {
  g as Roles
};
