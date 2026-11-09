// origin: assets/ccmaxAnalysis-BjOYJv3E.js
import {
  mt as e,
  pt as t
} from "./index-Dnr0i-H9.js";

function n(e, t = [], n = ``) {
  let i = [],
    a = new Map;
  if (!e) return {
    dates: i,
    suppliers: [...a.values()]
  };
  for (let t = new Date(`${e.from}T00:00:00Z`); t.toISOString().slice(0, 10) <= e.to; t.setUTCDate(t.getUTCDate() + 1)) i.push(t.toISOString().slice(0, 10));
  for (let e of t)(!n || e.id === n) && a.set(e.id, {
    ...e,
    total: 0,
    days: r()
  });
  let o = new Set(i);
  for (let t of e.rows) {
    if (!o.has(t.createdDate) || n && t.supplierId !== n) continue;
    let e = a.get(t.supplierId) || {
      id: t.supplierId,
      name: t.supplierName,
      code: t.supplierCode,
      total: 0,
      days: r()
    };
    e.total += t.count, e.days[t.createdDate] = (e.days[t.createdDate] || 0) + t.count, a.set(t.supplierId, e)
  }
  return {
    dates: i,
    suppliers: [...a.values()].sort((e, t) => t.total - e.total || e.code.localeCompare(t.code))
  }
}
var r = () => Object.create(null);

function i(e, t) {
  let n = e.trim().replace(/\s+/g, ` `) || `UNKNOWN`,
    r = [`Pro`, `Ultra`, `Plus`, `Free`, `UNKNOWN`].find(e => e.toLowerCase() === n.toLowerCase()),
    i = /^max\s*(\d+)\s*x$/i.exec(n),
    a = r || (i ? `Max ${i[1]}x` : n),
    o = a.toLowerCase();
  return t.has(o) || t.set(o, a), t.get(o)
}
var a = [`READY`, `PAUSED`, `COOLING`, `INVALID`, `DEAD`, `PROVISIONING`, `DRAINING`, `GONE`, `UNKNOWN`];

function o(e) {
  let t = new Map,
    n = new Map,
    a = r();
  for (let o of e?.rows || []) {
    let e = i(o.resourceType, n),
      s = t.get(e) || {
        id: `plan:${e}`,
        type: e,
        total: 0,
        states: r()
      };
    s.total += o.count, s.states[o.operationalState] = (s.states[o.operationalState] || 0) + o.count, a[o.operationalState] = (a[o.operationalState] || 0) + o.count, t.set(e, s)
  }
  return {
    plans: [...t.values()].sort((e, t) => t.total - e.total || e.type.localeCompare(t.type)),
    states: a
  }
}
var s = e => new Intl.NumberFormat(t()).format(e),
  c = (e, t) => Math.max(0, e - (t.GONE || 0)),
  l = t => t === `UNKNOWN` ? e(`套餐未提供`) : t;

function u(t) {
  let n = {
    READY: e(`就绪`),
    PAUSED: e(`已暂停`),
    PROVISIONING: e(`初始化中`),
    COOLING: e(`冷却中`),
    DRAINING: e(`退出中`),
    DEAD: e(`不可用`),
    GONE: e(`已移除`),
    INVALID: e(`账号失效`),
    DELETED: e(`已删除`),
    UNKNOWN: e(`状态未知`)
  };
  return Object.hasOwn(n, t) ? n[t] : n.UNKNOWN
}
var d = e => Object.entries(e).sort((e, t) => t[1] - e[1] || e[0].localeCompare(t[0])),
  f = {
    READY: 1,
    PAUSED: 5,
    COOLING: 3,
    INVALID: 4,
    DEAD: 4,
    PROVISIONING: 0,
    DRAINING: 2,
    GONE: 7,
    DELETED: 7,
    UNKNOWN: 7
  },
  p = e => Object.hasOwn(f, e) ? f[e] : 7;

function m(t, n) {
  let r = d(t),
    i = n === `types` && r.length > 8,
    a = (i ? r.slice(0, 7) : r).map(([e], t) => ({
      id: `value:${e}`,
      keys: [e],
      label: n === `types` ? l(e) : u(e),
      color: n === `types` ? t : p(e)
    }));
  return i && a.push({
    id: `group:other`,
    keys: r.slice(7).map(([e]) => e),
    label: e(`其他`),
    color: 7
  }), a
}

function h(e, t) {
  let n = e => t === `ready` ? e.states.READY || 0 : t === `rate` ? e.total ? (e.states.READY || 0) / e.total : 0 : e.total;
  return [...e].sort((e, t) => n(t) - n(e) || t.total - e.total || e.type.localeCompare(t.type))
}

function g(e) {
  let t = new Map,
    n = new Map,
    a = new Map,
    o = r(),
    s = r();
  if (e) {
    let c = new Date(`${e.to}T00:00:00Z`).getTime();
    for (let t = new Date(`${e.from}T00:00:00Z`).getTime(); t <= c; t += 864e5) {
      let e = new Date(t).toISOString().slice(0, 10);
      n.set(e, {
        date: e,
        total: 0,
        types: r(),
        states: r()
      })
    }
    for (let c of e.rows) {
      let e = n.get(c.createdDate);
      if (!e) continue;
      let l = i(c.resourceType, t),
        u = c.operationalState;
      e.total += c.count, e.types[l] = (e.types[l] || 0) + c.count, e.states[u] = (e.states[u] || 0) + c.count, o[l] = (o[l] || 0) + c.count, s[u] = (s[u] || 0) + c.count;
      let d = JSON.stringify([e.date, l]),
        f = a.get(d) || {
          id: d,
          date: e.date,
          type: l,
          total: 0,
          states: r()
        };
      f.total += c.count, f.states[u] = (f.states[u] || 0) + c.count, a.set(d, f)
    }
  }
  return {
    days: [...n.values()],
    types: o,
    states: s,
    details: [...a.values()].sort((e, t) => t.date.localeCompare(e.date) || e.type.localeCompare(t.type))
  }
}
export {
  h as a, u as c, n as d, l as f, a as i, g as l, m as n, d as o, c as r, p as s, s as t, o as u
};