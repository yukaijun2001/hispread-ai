// origin: assets/MoneyDisplay-Bphc56N8.js
import {
  A as e,
  X as t,
  Z as n,
  mt as r,
  vt as i
} from "./index-Dnr0i-H9.js";
var a = i(n(), 1),
  o = t();

function s({
  currency: t,
  value: n
}) {
  let [i, s] = (0, a.useState)(!1);
  if (n == null) return (0, o.jsx)(`span`, {
    className: `money-display missing`,
    children: `—`
  });
  let c = e(n, t),
    l = e => {
      let [t, n = ``] = e.replaceAll(`,`, ``).split(`.`);
      return `${t.replace(/^(-?)0+(?=\d)/,`$1`)}.${n.replace(/0+$/,``)}`
    },
    u = l(c) !== l(n),
    d = u && /^0(?:\.0+)?$/.test(c),
    f = d ? `${n.startsWith(`-`)?`> -`:`< `}${t===`JPY`?`1`:`0.01`}` : c;
  return (0, o.jsxs)(`span`, {
    className: `money-display`,
    children: [(0, o.jsxs)(`span`, {
      className: `money-display-summary`,
      children: [t && (0, o.jsx)(`small`, {
        children: t
      }), (0, o.jsxs)(`button`, {
        type: `button`,
        title: `${t} ${n}`.trim(),
        "aria-label": r(`查看完整金额：{0} {1}`, [t, n]),
        "aria-expanded": i,
        onClick: e => {
          e.stopPropagation(), s(e => !e)
        },
        onKeyDown: e => {
          e.key === `Escape` && i && (e.preventDefault(), e.stopPropagation(), s(!1))
        },
        children: [u && !d && (0, o.jsx)(`span`, {
          className: `money-approximate`,
          children: `≈ `
        }), f]
      })]
    }), i && (0, o.jsxs)(`span`, {
      className: `money-display-exact`,
      children: [(0, o.jsx)(`small`, {
        children: r(`完整原值`)
      }), (0, o.jsx)(`span`, {
        children: n
      })]
    })]
  })
}
export {
  s as t
};