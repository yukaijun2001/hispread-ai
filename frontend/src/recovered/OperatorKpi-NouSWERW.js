// origin: assets/OperatorKpi-NouSWERW.js
import {
  A as e,
  C as t,
  G as n,
  P as r,
  S as i,
  X as a,
  Z as o,
  _ as s,
  c,
  g as l,
  m as u,
  mt as d,
  s as f,
  u as p,
  vt as m,
  x as h,
  y as g
} from "./index-Dnr0i-H9.js";
import {
  OwnerSection as _
} from "./OwnerSection-BV_jBT2b.js";
var v = m(o(), 1),
  y = a(),
  b = () => {
    let e = new Date;
    return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}`
  },
  x = (e, t) => [{
    value: ``,
    label: d(`全部归属`)
  }, {
    value: `UNASSIGNED`,
    label: t
  }, ...(e || []).map(e => ({
    value: e.id,
    label: d(`{0}（{1}）`, [e.displayName, e.username])
  }))];

function S() {
  let {
    refresh: a
  } = t(), [o, m] = (0, v.useState)(`owners`), [S, C] = (0, v.useState)(``), [w, T] = (0, v.useState)(``), [E, D] = (0, v.useState)(1), [O, k] = (0, v.useState)(10), [A, j] = (0, v.useState)(b), [M, N] = (0, v.useState)(``), [P, F] = (0, v.useState)(``), [I, L] = (0, v.useState)(1), [R, z] = (0, v.useState)(10), [B, V] = (0, v.useState)(``), [H, U] = (0, v.useState)(1), [W, G] = (0, v.useState)(10), [K, q] = (0, v.useState)(null), [J, Y] = (0, v.useState)(null), X = i(`/suppliers/owner-candidates?includeHistory=true`), Z = i(o === `owners` ? `/suppliers?search=${encodeURIComponent(S)}&owner=${encodeURIComponent(w)}&page=${E}&size=${O}` : null), Q = i(o === `report` ? `/reports/operator-kpi?month=${A}&currency=${M}&owner=${encodeURIComponent(P)}&page=${I}&size=${R}` : null), $ = i(K ? `/reports/operator-kpi/lines?month=${A}&currency=${K.currency}&ownerUserId=${K.ownerUserId||``}&unassigned=${K.ownerUserId?`false`:`true`}&search=${encodeURIComponent(B)}&page=${H}&size=${W}` : null);
  return (0, y.jsxs)(y.Fragment, {
    children: [(0, y.jsx)(u, {
      title: d(`运营归属`),
      children: (0, y.jsx)(f, {
        icon: `refresh`,
        onClick: a,
        "aria-label": d(`刷新归属`)
      })
    }), (0, y.jsx)(l, {
      children: d(`按确认月份统计已确认结算。指定和改挂不改变已经结算的归属。`)
    }), (0, y.jsx)(h, {
      value: o,
      onChange: m,
      items: [{
        id: `owners`,
        label: d(`负责运营`)
      }, {
        id: `report`,
        label: d(`月度绩效`)
      }]
    }), o === `owners` ? (0, y.jsxs)(`section`, {
      className: `panel`,
      children: [(0, y.jsxs)(`div`, {
        className: `panel-toolbar`,
        children: [(0, y.jsx)(g, {
          value: S,
          onChange: e => {
            C(e), D(1)
          },
          placeholder: d(`搜索供应商名称、编码或联系人`)
        }), (0, y.jsx)(p, {
          ariaLabel: d(`归属筛选`),
          value: w,
          onChange: e => {
            T(e), D(1)
          },
          options: x(X.data, d(`待分配`))
        })]
      }), (0, y.jsx)(c, {
        data: Z.data?.items || [],
        loading: Z.loading,
        error: Z.error,
        columns: [{
          label: d(`供应商`),
          render: e => (0, y.jsxs)(`div`, {
            children: [(0, y.jsx)(`strong`, {
              children: e.name
            }), (0, y.jsx)(`small`, {
              children: e.code
            })]
          })
        }, {
          label: d(`负责运营`),
          render: e => e.ownerName || d(`待分配`)
        }, {
          label: d(`操作`),
          render: e => (0, y.jsx)(`button`, {
            className: `text-button`,
            onClick: t => {
              t.stopPropagation(), Y(e)
            },
            children: e.ownerName ? d(`改挂`) : d(`指定`)
          })
        }]
      }), (0, y.jsx)(s, {
        data: Z.data,
        page: E,
        onPage: D,
        size: O,
        onSizeChange: k
      })]
    }) : (0, y.jsxs)(`section`, {
      className: `panel`,
      children: [(0, y.jsxs)(`div`, {
        className: `panel-toolbar`,
        children: [(0, y.jsxs)(`label`, {
          className: `field`,
          children: [d(`月份 `), (0, y.jsx)(`input`, {
            type: `month`,
            value: A,
            onChange: e => {
              j(e.target.value), L(1), q(null)
            }
          })]
        }), (0, y.jsx)(p, {
          ariaLabel: d(`币种`),
          value: M,
          onChange: e => {
            N(e), L(1), q(null)
          },
          options: [{
            value: ``,
            label: d(`全部币种`)
          }, {
            value: `CNY`,
            label: `CNY`
          }, {
            value: `USD`,
            label: `USD`
          }, {
            value: `USDT`,
            label: `USDT`
          }]
        }), (0, y.jsx)(p, {
          ariaLabel: d(`绩效负责人`),
          value: P,
          onChange: e => {
            F(e), L(1), q(null)
          },
          options: x(X.data, d(`未归属`))
        })]
      }), (0, y.jsx)(c, {
        data: (Q.data?.items || []).map((e, t) => ({
          ...e,
          id: `${e.ownerUserId||`none`}-${e.currency}-${t}`
        })),
        loading: Q.loading,
        error: Q.error,
        onRow: e => {
          V(``), U(1), q(e)
        },
        columns: [{
          label: d(`负责运营`),
          render: e => e.ownerName
        }, {
          label: d(`币种`),
          render: e => e.currency
        }, {
          label: d(`已确认应付`),
          render: t => e(t.total, t.currency)
        }, {
          label: d(`结算笔数`),
          render: e => String(e.settlementCount)
        }]
      }), (0, y.jsx)(s, {
        data: Q.data,
        page: I,
        onPage: L,
        size: R,
        onSizeChange: z
      })]
    }), J && (0, y.jsx)(n, {
      title: J.name,
      subtitle: J.code,
      onClose: () => Y(null),
      wide: !0,
      children: (0, y.jsx)(_, {
        embedded: !0,
        supplierId: J.id,
        version: J.version,
        ownerUserId: J.ownerUserId,
        ownerName: J.ownerName,
        onClose: () => Y(null),
        onChanged: () => {
          Y(null), a()
        }
      })
    }), K && (0, y.jsxs)(n, {
      title: `${K.ownerName} · ${A} · ${K.currency}`,
      onClose: () => q(null),
      wide: !0,
      children: [(0, y.jsx)(g, {
        value: B,
        onChange: e => {
          V(e), U(1)
        },
        placeholder: d(`搜索结算编号或供应商`)
      }), (0, y.jsx)(c, {
        data: $.data?.items || [],
        loading: $.loading,
        error: $.error,
        columns: [{
          label: d(`结算编号`),
          render: e => e.code
        }, {
          label: d(`供应商`),
          render: e => e.supplierName
        }, {
          label: d(`确认时间`),
          render: e => r(e.confirmedAt)
        }, {
          label: d(`应付`),
          render: t => e(t.total, t.currency)
        }]
      }), (0, y.jsx)(s, {
        data: $.data,
        page: H,
        onPage: U,
        size: W,
        onSizeChange: G
      })]
    })]
  })
}
export {
  _ as OwnerSection, S as
  default
};