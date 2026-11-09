// origin: assets/QuoteRankingResults-cj8V1Hgu.js
import {
  A as e,
  F as t,
  S as n,
  X as r,
  Z as i,
  c as a,
  ct as o,
  mt as s,
  pt as c,
  vt as l
} from "./index-Dnr0i-H9.js";
import {
  i as u,
  t as d
} from "./systemLabels-DqpNuQ-_.js";
import {
  n as f
} from "./Quotes-BL6CyQ42.js";
var p = l(i(), 1),
  m = r();

function h({
  project: r,
  currency: i,
  onDate: l,
  referenceRates: h,
  referenceRatesError: g,
  referenceRatesLoading: _,
  onQuote: v
}) {
  let [y, b] = (0, p.useState)(`PRICE`), [x, S] = (0, p.useState)(`ASC`), C = e => {
    e === y ? S(e => e === `ASC` ? `DESC` : `ASC`) : (b(e), S(e === `PRICE` ? `ASC` : `DESC`))
  }, w = (e, t) => (0, m.jsxs)(`button`, {
    type: `button`,
    className: `quote-sort-button${y===e?` active`:``}`,
    onClick: () => C(e),
    children: [t, y === e ? x === `ASC` ? ` ↑` : ` ↓` : ``]
  }), T = `/quotes/ranking?projectId=${encodeURIComponent(r.id)}&currency=${encodeURIComponent(i)}&onDate=${encodeURIComponent(l)}&sortBy=${y}&sortDirection=${x}`, E = n(T), D = r.capacityType === `ACCOUNT_COUNT` ? [{
    label: w(`ACCOUNT_COUNT`, s(`账号数`)),
    ariaSort: y === `ACCOUNT_COUNT` ? x === `ASC` ? `ascending` : `descending` : `none`,
    render: e => e.accountCount || s(`未填写`)
  }] : r.capacityType === `ACCOUNT_QUOTA` ? [{
    label: w(`ACCOUNT_QUOTA`, d(r)),
    ariaSort: y === `ACCOUNT_QUOTA` ? x === `ASC` ? `ascending` : `descending` : `none`,
    render: e => e.accountQuota ? `${e.accountQuota} ${e.capacityCurrency}` : s(`未填写`)
  }] : r.capacityType === `THROUGHPUT` ? [{
    label: w(`RPM`, `RPM`),
    ariaSort: y === `RPM` ? x === `ASC` ? `ascending` : `descending` : `none`,
    render: e => e.rpm || s(`未填写`)
  }, {
    label: w(`TPM`, `TPM`),
    ariaSort: y === `TPM` ? x === `ASC` ? `ascending` : `descending` : `none`,
    render: e => e.tpm || s(`未填写`)
  }] : [];
  return (0, m.jsxs)(m.Fragment, {
    children: [(0, m.jsxs)(`p`, {
      className: `muted small quote-ranking-current`,
      children: [s(`当前：`), y === `PRICE` ? s(`价格优先`) : s(`{0} 优先`, [y])]
    }), (0, m.jsx)(a, {
      data: E.data || [],
      loading: E.loading,
      error: E.error,
      columns: [{
        label: s(`名次`),
        render: e => (0, m.jsx)(`strong`, {
          children: e.rank == null ? `—` : `#${e.rank}`
        })
      }, {
        label: s(`供应商`),
        render: e => (0, m.jsx)(`strong`, {
          children: e.supplierName
        })
      }, {
        label: w(`PRICE`, s(`报价`)),
        ariaSort: y === `PRICE` ? x === `ASC` ? `ascending` : `descending` : `none`,
        render: n => {
          if (n.pricingType !== `DISCOUNT`) return `${n.currency} ${e(n.unitPrice,n.currency)} / ${u(n.unit)}`;
          let r = String(n.multiplier ?? t(String(n.ratePercent)));
          return (0, m.jsxs)(`div`, {
            className: `quote-ranking-price`,
            children: [(0, m.jsxs)(`strong`, {
              children: [o(r), c() === `zh-CN` ? `折` : `%`]
            }), (0, m.jsx)(f, {
              value: r,
              currency: n.currency,
              referenceRates: h,
              loading: _,
              error: g
            })]
          })
        }
      }, ...D, {
        label: s(`能力说明`),
        render: e => e.serviceCapacityNote?.trim() || `—`
      }, {
        label: s(`适用期间`),
        render: e => s(`{0} 至 {1}`, [e.effectiveFrom, e.effectiveTo])
      }, {
        label: s(`操作`),
        render: e => (0, m.jsx)(`button`, {
          className: `text-button`,
          onClick: () => v(e),
          children: s(`查看 `)
        })
      }]
    })]
  })
}
export {
  h as QuoteRankingResults
};