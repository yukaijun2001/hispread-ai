// origin: assets/PayoutCallLogs-DpLZK7rw.js
import {
  C as e,
  P as t,
  S as n,
  X as r,
  Z as i,
  _ as a,
  c as o,
  g as s,
  mt as c,
  o as l,
  s as u,
  u as d,
  vt as f,
  y as p
} from "./index-Dnr0i-H9.js";
var m = f(i(), 1),
  h = r();

function g() {
  let {
    refresh: r
  } = e(), [i, f] = (0, m.useState)(``), [g, _] = (0, m.useState)(``), [v, y] = (0, m.useState)(``), [b, x] = (0, m.useState)(1), [S, C] = (0, m.useState)(10), [w, T] = (0, m.useState)(!1);
  (0, m.useEffect)(() => {
    let e = setTimeout(() => {
      _(i.trim()), x(1)
    }, 300);
    return () => clearTimeout(e)
  }, [i]);
  let E = new URLSearchParams({
      search: g,
      state: v,
      page: String(b),
      size: String(S)
    }),
    D = n(`/payout-calls?${E.toString()}`, w ? 5e3 : 0);
  (0, m.useEffect)(() => {
    T((D.data?.items || []).some(e => e.state === `PROCESSING` || e.state === `UNKNOWN`))
  }, [D.data]);
  let O = {
    PROCESSING: c(`付款处理中`),
    UNKNOWN: c(`付款待核实`),
    SUCCEEDED: c(`付款成功`),
    FAILED: c(`付款失败`)
  };
  return (0, h.jsxs)(h.Fragment, {
    children: [(0, h.jsx)(s, {
      children: c(`每笔付款只显示一条，状态随查单结果更新。`)
    }), (0, h.jsxs)(`section`, {
      className: `panel payout-call-panel`,
      children: [(0, h.jsxs)(`div`, {
        className: `panel-toolbar`,
        children: [(0, h.jsx)(p, {
          value: i,
          onChange: f,
          placeholder: c(`搜索付款单、供应商或通道`)
        }), (0, h.jsxs)(`div`, {
          className: `toolbar-right`,
          children: [(0, h.jsx)(d, {
            compact: !0,
            ariaLabel: c(`付款状态`),
            value: v,
            onChange: e => {
              y(e), x(1)
            },
            options: [{
              value: ``,
              label: c(`全部状态`)
            }, {
              value: `PROCESSING`,
              label: O.PROCESSING,
              tone: `pending`
            }, {
              value: `UNKNOWN`,
              label: O.UNKNOWN,
              tone: `unpaid`
            }, {
              value: `SUCCEEDED`,
              label: O.SUCCEEDED,
              tone: `approved`
            }, {
              value: `FAILED`,
              label: O.FAILED,
              tone: `rejected`
            }]
          }), (0, h.jsx)(u, {
            icon: `refresh`,
            "aria-label": c(`刷新付款状态`),
            onClick: r
          })]
        })]
      }), (0, h.jsx)(o, {
        data: D.data?.items || [],
        loading: D.loading,
        error: D.error,
        columns: [{
          label: c(`付款单 / 供应商`),
          render: e => (0, h.jsxs)(`div`, {
            className: `stack`,
            children: [(0, h.jsx)(`strong`, {
              className: `mono`,
              children: e.paymentCode
            }), (0, h.jsx)(`small`, {
              children: e.supplierName
            })]
          })
        }, {
          label: c(`资金通道`),
          render: e => (0, h.jsx)(`strong`, {
            children: e.provider
          })
        }, {
          label: c(`付款状态`),
          render: e => (0, h.jsx)(l, {
            state: e.state,
            label: O[e.state]
          })
        }, {
          label: c(`更新时间`),
          render: e => (0, h.jsx)(`span`, {
            className: `mono subtle`,
            children: t(e.updatedAt)
          })
        }]
      }), (0, h.jsx)(a, {
        data: D.data,
        page: b,
        onPage: x,
        size: S,
        onSizeChange: e => {
          C(e), x(1)
        }
      })]
    })]
  })
}
export {
  g as
  default
};