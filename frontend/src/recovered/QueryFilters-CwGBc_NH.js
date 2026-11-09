// origin: assets/QueryFilters-CwGBc_NH.js
import {
  $ as e,
  C as t,
  G as n,
  X as r,
  Y as i,
  Z as a,
  f as o,
  mt as s,
  r as c,
  s as l,
  u,
  vt as d,
  y as f
} from "./index-Dnr0i-H9.js";
var p = d(a(), 1),
  m = r();

function h({
  primarySearch: e,
  mobileCompact: t = !1,
  searches: r,
  selectors: a,
  children: u,
  className: d = ``,
  appliedFilters: f = [],
  onReset: h,
  onFilterCleared: g,
  actions: _
}) {
  let v = c(),
    [y, b] = (0, p.useState)(!1),
    x = (0, p.useId)(),
    S = t && v;
  return (0, p.useEffect)(() => {
    v || b(!1)
  }, [v]), (0, m.jsxs)(o, {
    className: `query-filters ${d}`,
    children: [(0, m.jsxs)(`div`, {
      className: `query-filter-searches`,
      children: [e, S ? (0, m.jsxs)(l, {
        icon: `filter`,
        "aria-expanded": y,
        "aria-controls": x,
        onClick: () => b(!0),
        children: [s(`筛选`), f.length > 0 && ` (${f.length})`]
      }) : r]
    }), S ? y && (0, m.jsxs)(n, {
      title: s(`筛选`),
      onClose: () => b(!1),
      className: `mobile-filter-dialog`,
      children: [(0, m.jsxs)(`div`, {
        id: x,
        className: `mobile-filter-fields`,
        children: [r, a]
      }), (0, m.jsxs)(`div`, {
        className: `mobile-filter-actions`,
        children: [h && (0, m.jsx)(l, {
          onClick: h,
          children: s(`重置筛选`)
        }), (0, m.jsx)(l, {
          variant: `primary`,
          onClick: () => b(!1),
          children: s(`查看结果`)
        })]
      })]
    }) : (0, m.jsxs)(`div`, {
      className: `query-filter-choices`,
      children: [a, h && !_ && (0, m.jsx)(l, {
        onClick: h,
        children: s(`重置筛选`)
      })]
    }), u, (f.length > 0 || _) && (0, m.jsxs)(`div`, {
      className: `query-filter-footer`,
      children: [(0, m.jsxs)(`div`, {
        className: `query-applied-filters`,
        "aria-label": s(`已应用的筛选`),
        children: [f.length > 0 && (0, m.jsxs)(`span`, {
          className: `muted small`,
          children: [s(`已筛选 `), f.length, s(` 项`)]
        }), f.map(e => (0, m.jsxs)(`span`, {
          className: `query-filter-chip`,
          children: [(0, m.jsxs)(`span`, {
            title: s(`{0}：{1}`, [e.label, e.value]),
            children: [e.label, s(`：`), e.value]
          }), (0, m.jsx)(`button`, {
            type: `button`,
            "aria-label": s(`清除{0}筛选`, [e.label]),
            onClick: () => {
              e.clear(), g?.()
            },
            children: (0, m.jsx)(i, {
              name: `close`,
              size: 12
            })
          })]
        }, e.label))]
      }), _ && (0, m.jsxs)(`div`, {
        className: `query-filter-footer-actions`,
        children: [_, h && (0, m.jsx)(l, {
          onClick: h,
          children: s(`重置筛选`)
        })]
      })]
    })]
  })
}

function g({
  value: e,
  onChange: t,
  options: n,
  label: r,
  allLabel: i,
  searchPlaceholder: a,
  onSearchChange: o,
  loading: c = !1,
  error: l = ``,
  visual: d
}) {
  let f = n.find(t => t.value === e);
  return (0, m.jsx)(u, {
    compact: !0,
    ariaLabel: r,
    visual: d,
    value: e,
    onChange: t,
    searchPlaceholder: a,
    onSearchChange: o,
    disabled: c && !e && !o,
    options: [{
      value: ``,
      label: c ? s(`{0}加载中…`, [r]) : l ? s(`{0}加载失败`, [r]) : i
    }, ...n, ...e && !f && !o ? [{
      value: e,
      label: s(`已选{0}`, [r])
    }] : []]
  })
}

function _(n, r = ``, i = ``) {
  let {
    user: a,
    epoch: o
  } = t(), c = `${a.id}:${n}:${r}:${i}:${o}`, [l, u] = (0, p.useState)({
    key: c,
    data: null,
    loading: n,
    error: ``
  });
  return (0, p.useEffect)(() => {
    let t = new AbortController;
    return u({
      key: c,
      data: null,
      loading: n,
      error: ``
    }), n && (async () => {
      let n = [],
        a = new Set,
        o = 1;
      for (; !t.signal.aborted;) {
        let c = await e(`/suppliers?page=${o}&size=100&state=${encodeURIComponent(r)}&search=${encodeURIComponent(i)}`, {
          signal: t.signal
        });
        for (let e of c.items) a.has(e.id) || (n.push(e), a.add(e.id));
        if (n.length >= c.total) break;
        if (!c.items.length) throw Error(s(`供应商目录已变化，请刷新重试`));
        o++
      }
      t.signal.aborted || u({
        key: c,
        data: {
          items: n,
          total: n.length,
          page: 1,
          size: n.length
        },
        loading: !1,
        error: ``
      })
    })().catch(e => {
      t.signal.aborted || u({
        key: c,
        data: null,
        loading: !1,
        error: e.message
      })
    }), () => t.abort()
  }, [c, n, r, i]), l.key === c ? l : {
    data: null,
    loading: n,
    error: ``
  }
}

function v({
  label: e = s(`供应商`),
  allLabel: t = s(`全部供应商`),
  searchPlaceholder: n = s(`搜索供应商名称或编码`),
  fallbackToText: r = !1,
  ...i
}) {
  return r ? (0, m.jsx)(f, {
    value: i.value,
    onChange: i.onChange,
    placeholder: n
  }) : (0, m.jsx)(g, {
    ...i,
    label: e,
    allLabel: t,
    searchPlaceholder: n,
    visual: `supplier`
  })
}
export {
  _ as i, g as n, v as r, h as t
};