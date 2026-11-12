// origin: assets/IntakeToday-Digz-vi6.js
import {
  C as e,
  S as t,
  X as n,
  g as r,
  h as i,
  mt as a,
  s
} from "./index-Dnr0i-H9.js";
import { t as u } from "./labels-DaPzz6Ie.js"; /* empty css               */
var d = n();

function f({
  active: n = !0
}) {
  let {
    user: f
  } = e(), p = t(n && f.supplierId ? `/cc-intake/mine` : null, 3e4);
  return f.supplierId ? (0, d.jsxs)(`div`, {
    className: `cc-intake-today`,
    "aria-label": a(`今日上号统计`),
    children: [(0, d.jsxs)(`div`, {
      className: `cc-intake-today-heading`,
      children: [(0, d.jsxs)(`div`, {
        className: `cc-intake-today-summary`,
        children: [(0, d.jsx)(`h3`, {
          children: a(`今日上号统计`)
        }), p.data && !p.error && (0, d.jsxs)(`div`, {
          className: `cc-intake-today-totals`,
          children: [(0, d.jsxs)(`span`, {
            children: [f.role === `SUPPLIER` ? a(`供应商今日成功总数`) : a(`本人今日成功总数`), ` `, (0, d.jsx)(`strong`, {
              children: u(p.data.total)
            })]
          }), (0, d.jsxs)(`span`, {
            children: [a(`套餐未识别`), ` `, (0, d.jsx)(`strong`, {
              children: u(p.data.unknown)
            })]
          }), (0, d.jsxs)(`span`, {
            children: [a(`处理中及待核实`), ` `, (0, d.jsx)(`strong`, {
              children: u(p.data.processing)
            })]
          })]
        })]
      }), (0, d.jsxs)(`span`, {
        children: [a(`北京时间`), p.data ? ` · ${p.data.date}` : ``]
      })]
    }), p.error ? (0, d.jsxs)(r, {
      tone: `red`,
      children: [p.error, (0, d.jsx)(s, {
        onClick: p.reload,
        children: a(`重新加载`)
      })]
    }) : p.data ? (0, d.jsx)(r, {
      tone: `amber`,
      children: a(`套餐分类和额度暂未接入，当前仅显示今日成功总数及待核实数量；请勿依据额度配置判断能否上号。`)
    }) : (0, d.jsx)(i, {})]
  }) : null
}
export {
  f as
  default
};
