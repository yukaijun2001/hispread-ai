// origin: assets/projectOptions-RFlNxqPH.js
import {
  E as e,
  O as t,
  mt as n
} from "./index-Dnr0i-H9.js";

function r(r, i, a = !1) {
  let o = i.filter(e => e.name === r.name),
    s = r.categoryName || r.category || n(`未分类`),
    c = o.some(e => (e.categoryName || e.category || n(`未分类`)) !== s),
    l = r => [c ? r.categoryName || r.category || n(`未分类`) : ``, t[r.settlementMethod], e[r.deliveryMethod]].filter(Boolean).join(` · `),
    u = l(r),
    d = o.filter(e => l(e) === u).sort((e, t) => e.code.localeCompare(t.code) || e.id.localeCompare(t.id)),
    f = d.findIndex(e => e.id === r.id),
    p = [u, d.length > 1 ? n(`同名项目 {0}`, [f + 1]) : ``].filter(Boolean).join(` · `),
    m = [p, a && !r.enabled ? n(`已停用`) : ``].filter(Boolean).join(` · `);
  return {
    value: r.id,
    label: r.name,
    shortLabel: p ? `${r.name} · ${p}` : r.name,
    detail: m,
    disabled: a && !r.enabled
  }
}
export {
  r as t
};