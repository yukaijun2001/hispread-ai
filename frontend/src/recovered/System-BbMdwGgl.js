// origin: assets/System-BbMdwGgl.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/Users-B5SmzLla.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/AccountDialogs-DkF7YQod.js", "assets/QueryFilters-CwGBc_NH.js", "assets/systemLabels-DqpNuQ-_.js", "assets/system-user-roles-CUQaL0u7.css", "assets/Roles-BkB5m-qF.js", "assets/Audits-BxINf5wz.js", "assets/DateRangePicker-DtOG4QUZ.js"]))) => i.map(i => d[i]);
import {
  X as e,
  Z as t,
  h as n,
  i as r,
  vt as i
} from "./index-Dnr0i-H9.js";
var a = i(t(), 1),
  o = e(),
  s = (0, a.lazy)(() => r(() => import(`./Users-B5SmzLla.js`).then(e => ({
    default: e.Users
  })), __vite__mapDeps([0, 1, 2, 3, 4, 5, 6]))),
  c = (0, a.lazy)(() => r(() => import(`./Roles-BkB5m-qF.js`).then(e => ({
    default: e.Roles
  })), __vite__mapDeps([7, 1, 2, 5]))),
  l = (0, a.lazy)(() => r(() => import(`./Audits-BxINf5wz.js`).then(e => ({
    default: e.Audits
  })), __vite__mapDeps([8, 1, 2, 9])));

function u({
  section: e
}) {
  return (0, o.jsx)(a.Suspense, {
    fallback: (0, o.jsx)(n, {}),
    children: e === `users` ? (0, o.jsx)(s, {}) : e === `roles` ? (0, o.jsx)(c, {}) : (0, o.jsx)(l, {})
  })
}
export {
  u as
  default
};