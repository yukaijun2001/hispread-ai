// origin: assets/CcmaxDistribution-DQLKF7Js.js
import {
  X as e,
  mt as t
} from "./index-Dnr0i-H9.js";
import {
  c as n,
  f as r,
  o as i,
  s as a,
  t as o
} from "./ccmaxAnalysis-BjOYJv3E.js";
var s = e();

function c({
  title: e,
  values: c,
  dimension: l,
  context: u,
  selected: d = ``,
  onSelect: f
}) {
  let p = i(c).filter(([, e]) => e > 0),
    m = p.reduce((e, [, t]) => e + t, 0),
    h = l === `states` ? n : r;
  return (0, s.jsxs)(`section`, {
    className: `panel ccmax-analysis-breakdown`,
    children: [(0, s.jsxs)(`header`, {
      className: `ccmax-distribution-heading`,
      children: [(0, s.jsx)(`h2`, {
        children: e
      }), u && (0, s.jsx)(`span`, {
        children: u
      })]
    }), (0, s.jsx)(`ul`, {
      children: p.map(([e, n], r) => {
        let i = `${(n*100/m).toFixed(1)}%`,
          c = (0, s.jsxs)(s.Fragment, {
            children: [(0, s.jsxs)(`span`, {
              className: `ccmax-distribution-label`,
              children: [(0, s.jsx)(`i`, {
                className: `ccmax-series-${l===`states`?a(e):r%8}`
              }), h(e)]
            }), (0, s.jsx)(`span`, {
              className: `ccmax-analysis-track`,
              "aria-hidden": `true`,
              children: (0, s.jsx)(`span`, {
                className: `ccmax-series-${l===`states`?a(e):r%8}`,
                style: {
                  width: i
                }
              })
            }), (0, s.jsx)(`strong`, {
              children: o(n)
            }), (0, s.jsx)(`small`, {
              children: i
            })]
          });
        return (0, s.jsx)(`li`, {
          children: f ? (0, s.jsx)(`button`, {
            type: `button`,
            className: `ccmax-distribution-row`,
            "aria-pressed": d === e,
            "aria-label": t(`筛选包含{0}的套餐`, [h(e)]),
            onClick: () => f(d === e ? `` : e),
            children: c
          }) : (0, s.jsx)(`div`, {
            className: `ccmax-distribution-row`,
            children: c
          })
        }, e)
      })
    })]
  })
}
export {
  c as t
};