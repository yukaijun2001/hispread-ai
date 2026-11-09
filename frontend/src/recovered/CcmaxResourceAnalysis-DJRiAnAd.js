// origin: assets/CcmaxResourceAnalysis-DJRiAnAd.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/CurrentResourceOverview-Dl-e28oo.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/QueryFilters-CwGBc_NH.js", "assets/ccmaxAnalysis-BjOYJv3E.js", "assets/CcmaxDistribution-DQLKF7Js.js", "assets/DailyCreationAnalysis-MGRzns81.js", "assets/DateRangePicker-DtOG4QUZ.js", "assets/SupplierDailyCreations-C04GFRSJ.js"]))) => i.map(i => d[i]);
import {
  C as e,
  X as t,
  Z as n,
  h as r,
  i,
  mt as a,
  vt as o,
  x as s
} from "./index-Dnr0i-H9.js";
import {
  i as c
} from "./QueryFilters-CwGBc_NH.js";
var l = o(n(), 1),
  u = t(),
  d = (0, l.lazy)(() => i(() => import(`./CurrentResourceOverview-Dl-e28oo.js`), __vite__mapDeps([0, 1, 2, 3, 4, 5]))),
  f = (0, l.lazy)(() => i(() => import(`./DailyCreationAnalysis-MGRzns81.js`), __vite__mapDeps([6, 1, 2, 3, 4, 5, 7]))),
  p = (0, l.lazy)(() => i(() => import(`./SupplierDailyCreations-C04GFRSJ.js`), __vite__mapDeps([8, 1, 2, 3, 4, 7])));

function m() {
  let {
    has: t
  } = e(), n = c(t(`supplier.read`)), [i, o] = (0, l.useState)(`current`), [m, h] = (0, l.useState)({
    current: !0,
    creations: !1,
    suppliers: !1
  }), g = {
    current: a(`当前资源情况`),
    creations: a(`每日创建分析`),
    suppliers: a(`供应商每日上号`)
  };
  return (0, u.jsxs)(`div`, {
    className: `ccmax-analysis-page`,
    children: [(0, u.jsx)(s, {
      value: i,
      items: [{
        id: `current`,
        label: g.current
      }, {
        id: `creations`,
        label: g.creations
      }, {
        id: `suppliers`,
        label: g.suppliers
      }],
      onChange: e => {
        let t = e;
        h(e => ({
          ...e,
          [t]: !0
        })), o(t)
      }
    }), m.current && (0, u.jsx)(`section`, {
      role: `tabpanel`,
      "aria-label": g.current,
      hidden: i !== `current`,
      children: (0, u.jsx)(l.Suspense, {
        fallback: (0, u.jsx)(r, {}),
        children: (0, u.jsx)(d, {
          catalog: n
        })
      })
    }), m.creations && (0, u.jsx)(`section`, {
      role: `tabpanel`,
      "aria-label": g.creations,
      hidden: i !== `creations`,
      children: (0, u.jsx)(l.Suspense, {
        fallback: (0, u.jsx)(r, {}),
        children: (0, u.jsx)(f, {
          catalog: n
        })
      })
    }), m.suppliers && (0, u.jsx)(`section`, {
      role: `tabpanel`,
      "aria-label": g.suppliers,
      hidden: i !== `suppliers`,
      children: (0, u.jsx)(l.Suspense, {
        fallback: (0, u.jsx)(r, {}),
        children: (0, u.jsx)(p, {
          catalog: n
        })
      })
    })]
  })
}
export {
  m as
  default
};