// origin: assets/SettlementResourceTable-DOsIIJjV.js
import {
  A as e,
  F as t,
  X as n,
  Z as r,
  c as i,
  mt as a,
  ut as o
} from "./index-Dnr0i-H9.js";
var s = n();

function c({
  lines: t,
  currency: n
}) {
  return (0, s.jsx)(i, {
    ariaLabel: a(`日账汇总`),
    data: t,
    columns: [{
      label: a(`账务日期`),
      render: e => e.businessDate
    }, {
      label: a(`来源笔数`),
      render: e => e.sourceCount
    }, {
      label: a(`原始金额`),
      className: `align-right`,
      render: e => `${n} ${e.originalAmount}`
    }, {
      label: a(`应付金额`),
      className: `align-right`,
      render: t => (0, s.jsxs)(`strong`, {
        className: `money`,
        children: [n, ` `, e(t.finalAmount, n)]
      })
    }]
  })
}
r();

function l({
  groups: n,
  currency: r
}) {
  return (0, s.jsx)(i, {
    data: n,
    ariaLabel: a(`按资源汇总的结算明细`),
    columns: [{
      label: a(`资源编号 / 款项`),
      render: e => (0, s.jsxs)(`div`, {
        className: `settlement-preview-source`,
        children: [(0, s.jsx)(`strong`, {
          children: e.resourceName === `资源编号缺失` ? a(`资源编号缺失`) : e.resourceName || a(`历史记录`)
        }), (0, s.jsxs)(`small`, {
          children: [e.periodStart, e.periodEnd === e.periodStart ? `` : ` — ${e.periodEnd}`, ` · `, a(`{0} 笔来源`, [e.sourceCount])]
        })]
      })
    }, {
      label: a(`计价依据`),
      render: n => (0, s.jsx)(`div`, {
        className: `settlement-preview-source`,
        children: n.prices.map((i, c) => (0, s.jsxs)(`div`, {
          children: [(0, s.jsx)(`span`, {
            children: i.quote.pricingType === `DIRECT` ? a(`直接录入真实结算金额`) : i.quote.pricingType === `FIXED` ? a(`{0} 个 · 单价 {1} {2}`, [i.quantity, r, i.quote.unitPrice ?? `—`]) : i.quote.multiplier != null || i.quote.ratePercent != null ? a(`原额 {0} · {1}`, [e(i.originalAmount, r), o(String(i.quote.multiplier ?? t(String(i.quote.ratePercent))))]) : a(`历史报价依据缺失`)
          }), n.prices.length > 1 && i.quote.pricingType !== `DIRECT` && (0, s.jsxs)(`small`, {
            children: [i.quote.effectiveFrom, ` — `, i.quote.effectiveTo]
          })]
        }, c))
      })
    }, {
      label: a(`应付金额`),
      className: `align-right`,
      render: t => (0, s.jsxs)(`strong`, {
        children: [r, ` `, e(t.finalAmount, r)]
      })
    }]
  })
}
export {
  c as n, l as t
};