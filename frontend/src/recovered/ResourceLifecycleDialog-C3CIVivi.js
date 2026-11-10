// origin: assets/ResourceLifecycleDialog-C3CIVivi.js
import {
  G as e,
  P as t,
  S as n,
  X as r,
  Z as i,
  _ as a,
  c as o,
  d as s,
  g as c,
  h as l,
  mt as u,
  o as d,
  rt as f,
  s as p,
  vt as m
} from "./index-Dnr0i-H9.js";
var h = m(i(), 1),
  g = r(),
  _ = `/resource-lifecycle-jobs`,
  v = {
    PENDING: u(`等待提交`),
    SUBMITTING: u(`提交中`),
    UNKNOWN: u(`结果待核对`),
    DRAINING: u(`正在移除`),
    PAUSED: u(`已停用`),
    RESUMED: u(`已恢复`),
    GONE: u(`已移除`),
    FAILED: u(`失败`)
  },
  y = (e, t) => {
    let n = e || (t || []).map(e => e.state).find(Boolean);
    return u(n === `PAUSE` || n === `PAUSED` ? `停用` : n === `RESUME` || n === `RESUMED` ? `恢复` : n === `REMOVE` || n === `GONE` || n === `DRAINING` ? `移除` : `操作`)
  },
  actionText = e => e === `RUNNING` ? u(`处理中`) : e === `NEEDS_REVIEW` || e === `UNKNOWN` ? u(`需要人工核对`) : e === `FAILED` ? u(`失败`) : e === `PARTIAL` || e === `PARTIAL_FAILED` ? u(`部分失败`) : e === `COMPLETED` ? u(`已完成`) : u(`处理结束`);

function b(e) {
  return e.state.mode === `progress` ? (0, g.jsx)(x, {
    ...e,
    state: e.state
  }) : (0, g.jsx)(S, {
    ...e
  })
}

function x({
  state: t,
  onClose: r,
  onChanged: i
}) {
  let [a, s] = (0, h.useState)(!0), [m, b] = (0, h.useState)(!1), [x, S] = (0, h.useState)(``), C = (0, h.useRef)(!1), w = n(`${_}/${encodeURIComponent(t.id)}`, a ? 3e3 : 0);
  (0, h.useEffect)(() => {
    w.data && w.data.state !== `RUNNING` && (s(!1), C.current || (C.current = !0, i()))
  }, [w.data, i]);
  async function T() {
    if (!m) {
      b(!0), S(``);
      try {
        await f(`${_}/${encodeURIComponent(t.id)}/reconcile`, {}), C.current = !1, s(!0), w.reload()
      } catch (e) {
        S(e.message)
      } finally {
        b(!1)
      }
    }
  }
  return (0, g.jsxs)(e, {
    title: u(`启停与移除进度`),
    onClose: r,
    wide: !0,
    children: [w.error ? (0, g.jsxs)(c, {
      tone: `red`,
      children: [w.error, (0, g.jsx)(p, {
        onClick: w.reload,
        children: u(`重新加载`)
      })]
    }) : w.loading ? (0, g.jsx)(l, {}) : w.data ? (0, g.jsxs)(g.Fragment, {
      children: [(0, g.jsxs)(`p`, {
        children: [y(w.data.action, w.data.items), ` · `, u(`共 {0} 个资源`, [w.data.total]), ` · `, actionText(w.data.state)]
      }), (0, g.jsx)(c, {
        children: u(w.data.action === `PAUSE` ? `已受理停用。结果不明时只查询状态，不自动重复提交。` : w.data.action === `RESUME` ? `已受理恢复。结果不明时只查询状态，不自动重复提交。` : `已受理移除后继续核对至已移除；结果不明时只查询状态，不自动重复提交。关闭窗口后可从操作记录继续查看。`)
      }), (0, g.jsx)(o, {
        data: w.data.items.map(e => ({
          ...e,
          id: e.resourceId
        })),
        columns: [{
          label: u(`资源名称`),
          render: e => e.resourceName
        }, {
          label: u(`目标`),
          render: e => e.targetName
        }, {
          label: u(`状态`),
          render: e => (0, g.jsx)(d, {
            state: e.state === `PAUSED` ? `COOLING` : e.state === `RESUMED` ? `SUCCESS` : e.state,
            label: v[e.state]
          })
        }, {
          label: u(`说明`),
          render: e => e.errorMessage || `—`
        }]
      }), (0, g.jsxs)(`div`, {
        className: `form-actions`,
        children: [(0, g.jsx)(p, {
          disabled: w.refreshing,
          onClick: w.reload,
          children: u(`刷新进度`)
        }), w.data.items.some(e => e.state === `UNKNOWN`) && (0, g.jsx)(p, {
          disabled: m,
          onClick: () => void T(),
          children: u(m ? `核对中…` : `重新核对状态`)
        }), (0, g.jsx)(p, {
          onClick: r,
          children: u(`关闭`)
        })]
      })]
    }) : null, x && (0, g.jsx)(c, {
      tone: `red`,
      children: x
    })]
  })
}

function S({
  onClose: r,
  onOpen: i
}) {
  let [d, f] = (0, h.useState)(1), [m, v] = (0, h.useState)(20), b = n(`${_}?page=${d}&size=${m}`);
  return (0, g.jsx)(e, {
    title: u(`启停与移除记录`),
    onClose: r,
    wide: !0,
    children: b.error ? (0, g.jsxs)(c, {
      tone: `red`,
      children: [b.error, (0, g.jsx)(p, {
        onClick: b.reload,
        children: u(`重新加载`)
      })]
    }) : b.loading ? (0, g.jsx)(l, {}) : b.data?.total ? (0, g.jsxs)(g.Fragment, {
      children: [(0, g.jsx)(o, {
        data: b.data.items,
        columns: [{
          label: u(`操作`),
          render: e => y(e.action, e.items)
        }, {
          label: u(`资源数量`),
          render: e => e.total
        }, {
          label: u(`状态`),
          render: e => actionText(e.state)
        }, {
          label: u(`创建时间`),
          render: e => t(e.createdAt)
        }, {
          label: u(`操作`),
          render: e => (0, g.jsx)(p, {
            onClick: () => i(e.id),
            children: u(`查看结果`)
          })
        }]
      }), (0, g.jsx)(a, {
        data: b.data,
        page: d,
        size: m,
        onPage: f,
        onSizeChange: e => {
          v(e), f(1)
        }
      })]
    }) : (0, g.jsx)(s, {})
  })
}
export {
  b as
  default
};
