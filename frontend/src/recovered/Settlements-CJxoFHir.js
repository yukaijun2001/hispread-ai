// origin: assets/Settlements-CJxoFHir.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/SettlementManagement-DAgYDp-f.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/QueryFilters-CwGBc_NH.js", "assets/DateRangePicker-DtOG4QUZ.js", "assets/MoneyDisplay-Bphc56N8.js", "assets/projectOptions-RFlNxqPH.js", "assets/SupplierBills-BVKniq6z.js", "assets/useSummaryRefresh-B-5uMwFV.js", "assets/SupplierBills-CGqfyoKg.css"]))) => i.map(i => d[i]);
import {
  B as e,
  C as t,
  X as n,
  Z as r,
  d as i,
  i as a,
  mt as o,
  t as s,
  vt as c
} from "./index-Dnr0i-H9.js";
var l = c(r(), 1),
  u = n();

function d() {
  let {
    user: n
  } = t(), r = s(n, e(`tab`));
  return r ? r.id === `departments` ? (0, u.jsx)(p, {
    departmentView: !0
  }, `departments`) : n.supplierId && n.role === `SUPPLIER_AGENT` ? (0, u.jsx)(p, {}, `daily`) : (0, u.jsx)(f, {
    tab: r.id
  }) : (0, u.jsx)(i, {
    text: o(`当前账号无权访问此页面`),
    error: !0
  })
}
var f = (0, l.lazy)(() => a(() => import(`./SettlementManagement-DAgYDp-f.js`).then(e => ({
    default: e.SettlementManagement
  })), __vite__mapDeps([0, 1, 2, 3, 4, 5, 6]))),
  p = (0, l.lazy)(() => a(() => import(`./SupplierBills-BVKniq6z.js`), __vite__mapDeps([7, 1, 2, 4, 8, 5, 9])));
export {
  d as
  default
};