// origin: assets/QuotePriceHistory-MZUPeopf.js
import {
  F as e,
  X as t,
  c as n,
  j as r,
  mt as i,
  ut as a
} from "./index-Dnr0i-H9.js";
import {
  i as o
} from "./systemLabels-DqpNuQ-_.js";
import {
  f as s,
  t as c
} from "./quoteHelpers-Fmn-ErWD.js";
var l = t();

function u({
  quote: t,
  history: u
}) {
  let d = s(u),
    f = new Set(d.filter((e, t) => d.slice(t + 1).some(t => new Date(t.effectiveAt).getTime() === new Date(e.effectiveAt).getTime())).map(e => e.id)),
    p = Date.now(),
    m = d.reduce((e, t, n) => new Date(t.effectiveAt).getTime() <= p ? n : e, -1),
    h = t.effectiveTo < r();
  return (0, l.jsxs)(`section`, {
    className: `subsection`,
    children: [(0, l.jsx)(`h3`, {
      children: i(`价格版本`)
    }), (0, l.jsx)(`p`, {
      className: `muted small`,
      children: i(`按北京时间的日期生效；历史价格和已形成的费用快照保留。`)
    }), (0, l.jsx)(n, {
      data: d,
      columns: [{
        label: i(`价格`),
        render: n => t.pricingType === `FIXED` ? `${t.currency} ${n.unitPrice??`—`} / ${o(t.unit)}` : i(`{0}`, [a(String(n.multiplier ?? e(String(n.ratePercent))))])
      }, {
        label: i(`生效日期`),
        render: e => c(e.effectiveAt)
      }, {
        label: i(`状态`),
        render: e => {
          let t = d.indexOf(e),
            n = new Date(e.effectiveAt).getTime() > p;
          return f.has(e.id) ? i(`已替代价格`) : i(h || !n && t !== m ? `历史价格` : n ? `未来价格` : `当前价格`)
        }
      }]
    })]
  })
}
export {
  u as QuotePriceHistory
};