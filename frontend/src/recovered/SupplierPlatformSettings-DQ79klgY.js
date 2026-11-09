// origin: assets/SupplierPlatformSettings-DQ79klgY.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/IntakePolicyPanel-DHvOkPUU.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/labels-DaPzz6Ie.js", "assets/intake-D282aV6G.css"]))) => i.map(i => d[i]);
import {
  C as e,
  S as t,
  X as n,
  Z as r,
  d as i,
  g as a,
  h as o,
  i as s,
  it as c,
  mt as l,
  s as u,
  vt as d
} from "./index-Dnr0i-H9.js";
var f = d(r(), 1),
  p = n(),
  m = (0, f.lazy)(() => s(() => import(`./IntakePolicyPanel-DHvOkPUU.js`), __vite__mapDeps([0, 1, 2, 3, 4]))),
  h = (0, f.lazy)(() => s(() => import(`./IntakePolicyPanel-DHvOkPUU.js`).then(e => ({
    default: e.MemberPrioritySettings
  })), __vite__mapDeps([0, 1, 2, 3, 4])));

function g({
  supplierId: n
}) {
  let {
    user: r,
    has: s,
    notify: d
  } = e(), m = !r.supplierId && ![`SUPPLIER`, `SUPPLIER_AGENT`].includes(r.role) && s(`supplier.read`), h = `/suppliers/${encodeURIComponent(n)}/settings`, g = t(m ? h : null), [_, v] = (0, f.useState)(null), [y, b] = (0, f.useState)(``), [x, S] = (0, f.useState)(!1), [C, w] = (0, f.useState)(!1), [T, E] = (0, f.useState)(!1), [D, O] = (0, f.useState)(!1), [k, A] = (0, f.useState)(!1), [j, M] = (0, f.useState)(!1), [N, P] = (0, f.useState)(``);
  return (0, f.useEffect)(() => {
    g.data && (v(g.data), b(String(g.data.defaultProxyMaxResources)), S(g.data.allowPro), w(g.data.allowCcmax), E(g.data.allowCcmaxReauthorization), O(g.data.allowCcmaxPause), A(g.data.allowCcmaxSafeRemoval), P(``))
  }, [g.data]), m ? g.error ? (0, p.jsxs)(a, {
    tone: `red`,
    children: [g.error, ` `, (0, p.jsx)(u, {
      onClick: g.reload,
      children: l(`重新加载配置`)
    })]
  }) : !_ || g.loading ? (0, p.jsx)(o, {}) : (0, p.jsxs)(`form`, {
    className: `supplier-platform-settings`,
    onSubmit: async e => {
      if (e.preventDefault(), !j && r.role === `ADMIN` && s(`system.settings`)) {
        if (!/^\d+$/.test(y) || !Number.isSafeInteger(Number(y)) || Number(y) > 2147483647) {
          P(l(`请填写有效的非负整数`));
          return
        }
        M(!0), P(``);
        try {
          let e = await c(h, {
            defaultProxyMaxResources: Number(y),
            allowPro: x,
            allowCcmax: C,
            allowCcmaxReauthorization: T,
            allowCcmaxPause: D,
            allowCcmaxSafeRemoval: k,
            version: _.version
          });
          v(e), b(String(e.defaultProxyMaxResources)), S(e.allowPro), w(e.allowCcmax), E(e.allowCcmaxReauthorization), O(e.allowCcmaxPause), A(e.allowCcmaxSafeRemoval), d(l(`供应商配置已保存`))
        } catch (e) {
          P(e.message)
        } finally {
          M(!1)
        }
      }
    },
    children: [(0, p.jsxs)(`section`, {
      className: `subsection`,
      children: [(0, p.jsx)(`h3`, {
        children: l(`CCMAX 上号`)
      }), (0, p.jsxs)(`label`, {
        className: `settings-switch`,
        children: [(0, p.jsxs)(`span`, {
          children: [(0, p.jsx)(`strong`, {
            children: l(`允许该供应商 CCMAX 上号`)
          }), (0, p.jsx)(`small`, {
            children: l(`系统参数的全局开关关闭时，按此配置判断。`)
          })]
        }), (0, p.jsx)(`input`, {
          type: `checkbox`,
          checked: C,
          disabled: j || !(r.role === `ADMIN` && s(`system.settings`)),
          onChange: e => w(e.target.checked)
        }), (0, p.jsx)(`span`, {
          className: `settings-switch-track`,
          "aria-hidden": `true`
        })]
      }), (0, p.jsx)(`p`, {
        className: `muted`,
        children: _.forceStopCcmaxIntake ? l(`平台已强制停止 CCMAX 新增上号；该供应商当前停收，已保存的允许配置保持不变。`) : _.globalAllowCcmax ? l(`当前全局已开启，所有供应商均可 CCMAX 上号。`) : l(`当前全局已关闭，按该供应商的开关判断。`)
      })]
    }), (0, p.jsxs)(`section`, {
      className: `subsection`,
      children: [(0, p.jsx)(`h3`, {
        children: l(`CCMAX 重新授权`)
      }), (0, p.jsx)(`p`, {
        className: `muted`,
        children: l(`同时控制 OAuth、手动凭据和强制刷新授权；关闭后仍可查询已有操作。`)
      }), (0, p.jsxs)(`label`, {
        className: `settings-switch`,
        children: [(0, p.jsxs)(`span`, {
          children: [(0, p.jsx)(`strong`, {
            children: l(`允许该供应商 CCMAX 重新授权`)
          }), (0, p.jsx)(`small`, {
            children: l(`独立于新增上号；全局关闭后按各供应商的重新授权开关判断。`)
          })]
        }), (0, p.jsx)(`input`, {
          type: `checkbox`,
          checked: T,
          disabled: j || !(r.role === `ADMIN` && s(`system.settings`)),
          onChange: e => E(e.target.checked)
        }), (0, p.jsx)(`span`, {
          className: `settings-switch-track`,
          "aria-hidden": `true`
        })]
      }), (0, p.jsx)(`p`, {
        className: `muted`,
        children: _.globalAllowCcmaxReauthorization ? l(`当前全局已开启，所有供应商均可 CCMAX 重新授权。`) : l(`当前全局已关闭，按该供应商的开关判断。`)
      })]
    }), (0, p.jsxs)(`section`, {
      className: `subsection`,
      children: [(0, p.jsx)(`h3`, {
        children: l(`CCMAX 资源操作`)
      }), (0, p.jsx)(`p`, {
        className: `muted`,
        children: l(`分别开放供应商端的暂停和移除；仅可操作其权限内的已交付资源。`)
      }), (0, p.jsxs)(`label`, {
        className: `settings-switch`,
        children: [(0, p.jsxs)(`span`, {
          children: [(0, p.jsx)(`strong`, {
            children: l(`允许该供应商暂停资源`)
          }), (0, p.jsx)(`small`, {
            children: l(`暂停后停止接收新请求，保留凭据并等待在途请求完成。`)
          })]
        }), (0, p.jsx)(`input`, {
          type: `checkbox`,
          checked: D,
          disabled: j || !(r.role === `ADMIN` && s(`system.settings`)),
          onChange: e => O(e.target.checked)
        }), (0, p.jsx)(`span`, {
          className: `settings-switch-track`,
          "aria-hidden": `true`
        })]
      }), (0, p.jsxs)(`label`, {
        className: `settings-switch`,
        children: [(0, p.jsxs)(`span`, {
          children: [(0, p.jsx)(`strong`, {
            children: l(`允许该供应商移除资源`)
          }), (0, p.jsx)(`small`, {
            children: l(`释放完成后无法恢复；本地资源和账单历史保留。`)
          })]
        }), (0, p.jsx)(`input`, {
          type: `checkbox`,
          checked: k,
          disabled: j || !(r.role === `ADMIN` && s(`system.settings`)),
          onChange: e => A(e.target.checked)
        }), (0, p.jsx)(`span`, {
          className: `settings-switch-track`,
          "aria-hidden": `true`
        })]
      })]
    }), (0, p.jsxs)(`section`, {
      className: `subsection`,
      children: [(0, p.jsx)(`h3`, {
        children: l(`PRO 推送`)
      }), (0, p.jsxs)(`label`, {
        className: `settings-switch`,
        children: [(0, p.jsxs)(`span`, {
          children: [(0, p.jsx)(`strong`, {
            children: l(`允许该供应商推送 PRO`)
          }), (0, p.jsx)(`small`, {
            children: l(`全局关闭时按此配置判断；全局开启时所有供应商均允许。`)
          })]
        }), (0, p.jsx)(`input`, {
          type: `checkbox`,
          checked: x,
          disabled: j || !(r.role === `ADMIN` && s(`system.settings`)),
          onChange: e => S(e.target.checked)
        }), (0, p.jsx)(`span`, {
          className: `settings-switch-track`,
          "aria-hidden": `true`
        })]
      }), (0, p.jsx)(`p`, {
        className: `muted`,
        children: _.globalAllowPro ? l(`当前全局已开启，所有供应商均允许推送 PRO。`) : l(`当前全局已关闭，按该供应商的开关判断。`)
      }), (0, p.jsx)(`p`, {
        className: `muted`,
        children: l(`配置在下次新账号上号时生效；关闭后 CCMAX 会核验套餐并拒绝 PRO，无法核验时也不会创建账号。`)
      })]
    }), (0, p.jsxs)(`section`, {
      className: `subsection`,
      children: [(0, p.jsx)(`h3`, {
        children: l(`代理默认配置`)
      }), (0, p.jsx)(`p`, {
        className: `muted`,
        children: l(`用于该供应商及其团队成员后续新建的代理；已有代理保持原绑定上限。`)
      }), (0, p.jsxs)(`label`, {
        className: `field`,
        children: [(0, p.jsx)(`span`, {
          children: l(`每条代理默认可绑定资源数`)
        }), (0, p.jsx)(`input`, {
          type: `number`,
          min: `0`,
          max: `2147483647`,
          step: `1`,
          required: !0,
          value: y,
          disabled: j || !(r.role === `ADMIN` && s(`system.settings`)),
          onChange: e => b(e.target.value)
        }), (0, p.jsx)(`small`, {
          children: l(`0 表示不限。新建或导入代理时未单独指定上限，将使用此默认值。`)
        })]
      })]
    }), N && (0, p.jsx)(a, {
      tone: `red`,
      children: N
    }), (0, p.jsxs)(`footer`, {
      className: `dialog-footer`,
      children: [(0, p.jsx)(u, {
        disabled: j,
        onClick: g.reload,
        children: l(`重新加载配置`)
      }), r.role === `ADMIN` && s(`system.settings`) && (0, p.jsx)(u, {
        variant: `primary`,
        type: `submit`,
        disabled: j,
        children: l(j ? `保存中…` : `保存配置`)
      })]
    })]
  }) : (0, p.jsx)(i, {
    text: l(`当前账号无权访问此页面`),
    error: !0
  })
}

function _({
  supplierId: t
}) {
  let {
    user: n,
    has: r
  } = e(), i = !n.supplierId && ![`SUPPLIER`, `SUPPLIER_AGENT`].includes(n.role) && r(`supplier.read`);
  return (0, p.jsxs)(p.Fragment, {
    children: [(0, p.jsx)(g, {
      supplierId: t
    }), i && (0, p.jsxs)(f.Suspense, {
      fallback: (0, p.jsx)(o, {}),
      children: [(0, p.jsx)(m, {
        supplierId: t
      }), (0, p.jsx)(h, {
        supplierId: t
      })]
    })]
  })
}
export {
  _ as
  default
};