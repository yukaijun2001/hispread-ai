// origin: assets/useDeliveryProxies-DGHL4QCT.js
import {
  $ as e,
  C as t,
  Z as n,
  mt as r,
  vt as i
} from "./index-Dnr0i-H9.js";
var a = i(n(), 1);

function o() {
  let {
    user: n,
    epoch: i
  } = t(), [o, s] = (0, a.useState)([]), [c, l] = (0, a.useState)(``), [u, d] = (0, a.useState)(!0), [f, p] = (0, a.useState)(!1), [m, h] = (0, a.useState)(0), g = (0, a.useCallback)(() => h(e => e + 1), []);
  return (0, a.useEffect)(() => {
    let t = new AbortController;
    s([]), l(``), d(!0), p(!1);
    async function n() {
      let n = new Map;
      for (let r = 1;; r++) {
        let i = await e(`/outbound-proxies/options?page=${r}&size=100`, {
          signal: t.signal
        });
        if (t.signal.aborted) return;
        i.items.forEach(e => n.set(e.id, e)), s([...n.values()]), d(!1);
        let a = r * i.size < i.total && i.items.length > 0;
        if (p(a), !a) break
      }
    }
    return n().catch(e => {
      t.signal.aborted || l(e instanceof Error ? e.message : r(`请求失败`))
    }).finally(() => {
      t.signal.aborted || (d(!1), p(!1))
    }), () => t.abort()
  }, [n.id, i, m]), {
    data: o,
    error: c,
    loading: u,
    loadingMore: f,
    retry: g
  }
}
export {
  o as t
};