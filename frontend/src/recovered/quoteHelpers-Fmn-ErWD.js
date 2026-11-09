// origin: assets/quoteHelpers-Fmn-ErWD.js
import {
  F as e,
  ct as t,
  j as n,
  mt as r,
  pt as i,
  ut as a
} from "./index-Dnr0i-H9.js";
var o = /^\d+(?:\.\d+)?$/;

function s(e, t) {
  let n = e => {
    let [t, n = ``] = e.split(`.`);
    return `${t.replace(/^0+(?=\d)/,``)}.${n.replace(/0+$/,``)}`
  };
  return o.test(e) && o.test(t) && n(e) === n(t)
}

function c() {
  let [e, t] = n().split(`-`).map(Number);
  return new Date(Date.UTC(e, t, 0)).toISOString().slice(0, 10)
}

function l(t) {
  return t.pricingType === `FIXED` ? String(t.unitPrice ?? ``) : String(t.multiplier ?? e(String(t.ratePercent)))
}

function u(e) {
  return [...e].sort((e, t) => new Date(e.effectiveAt).getTime() - new Date(t.effectiveAt).getTime() || (e.approvedAt || ``).localeCompare(t.approvedAt || ``))
}

function d(t, r) {
  let i = r === n() ? Date.now() : new Date(`${r}T23:59:59.999+08:00`).getTime(),
    a = u(t.priceHistory || []).filter(e => new Date(e.effectiveAt).getTime() <= i).at(-1);
  return a ? t.pricingType === `FIXED` ? String(a.unitPrice ?? ``) : String(a.multiplier ?? e(String(a.ratePercent))) : l(t)
}

function f(e) {
  let t = new Date(e);
  return Number.isNaN(t.getTime()) ? e : new Intl.DateTimeFormat(i(), {
    timeZone: `Asia/Shanghai`,
    year: `numeric`,
    month: `2-digit`,
    day: `2-digit`
  }).format(t)
}
var p = 0;

function m() {
  return p += 1, `quote-${Date.now()}-${p}`
}

function h(e, r, i = !1) {
  return {
    key: m(),
    id: i ? r?.id : void 0,
    source: i ? r : void 0,
    supplierId: r?.supplierId || e,
    projectId: r?.projectId || ``,
    currency: i && r ? r.currency : `USD`,
    unitPrice: r?.unitPrice == null || !i && r.currency !== `USD` ? `` : String(r.unitPrice),
    multiplier: r?.multiplier == null ? r?.ratePercent == null ? `80` : String(r.ratePercent) : t(String(r.multiplier)),
    taxInclusive: r?.taxInclusive === !1 ? `false` : `true`,
    serviceCapacityNote: r?.serviceCapacityNote || ``,
    effectiveFrom: r && !i ? `` : r?.effectiveFrom || n(),
    effectiveTo: r && !i ? `` : r?.effectiveTo || c(),
    pending: !1,
    error: ``,
    accountCount: r?.accountCount || ``,
    accountQuota: r?.accountQuota || ``,
    rpm: r?.rpm || ``,
    tpm: r?.tpm || ``
  }
}
var g = /^[1-9]\d*$/;

function _(e) {
  return e.capacityType === `ACCOUNT_COUNT` ? e.accountCount ? r(`{0} 个`, [e.accountCount]) : r(`未填写`) : e.capacityType === `ACCOUNT_QUOTA` ? e.accountQuota ? `${e.accountQuota} ${e.capacityCurrency||``}`.trim() : r(`未填写`) : e.capacityType === `THROUGHPUT` && e.rpm && e.tpm ? `${e.rpm} RPM / ${e.tpm} TPM` : r(`未填写`)
}
var v = [{
  value: `CURRENT`,
  label: r(`待审 / 已通过`),
  tone: `all`
}, {
  value: ``,
  label: r(`全部报价状态`),
  tone: `all`
}, {
  value: `PENDING`,
  label: r(`待审核`),
  tone: `pending`
}, {
  value: `CHANGE_PENDING`,
  label: r(`调价待审`),
  tone: `pending`
}, {
  value: `APPROVED`,
  label: r(`已通过`),
  tone: `approved`
}, {
  value: `REJECTED`,
  label: r(`已退回`),
  tone: `rejected`
}, {
  value: `WITHDRAWN`,
  label: r(`已撤回`),
  tone: `withdrawn`
}];

function y(e) {
  return e == null || e.trim() === `` ? `` : r(`建议折扣 {0}`, [a(e.trim())])
}

function b(e) {
  let t = e.pendingChange;
  if (!t || t.state !== `PENDING`) return ``;
  let n = [];
  return e.pricingType === `DISCOUNT` && t.proposedMultiplier != null ? n.push(r(`折扣改为 {0}`, [a(t.proposedMultiplier)])) : t.proposedUnitPrice != null && n.push(r(`单价改为 {0} {1}`, [e.currency, t.proposedUnitPrice])), t.priceEffectiveFrom && n.push(r(`{0} 起`, [t.priceEffectiveFrom])), t.proposedFrom && t.proposedTo && (t.proposedFrom !== t.oldFrom || t.proposedTo !== t.oldTo) && n.push(r(`期间改为 {0} 至 {1}`, [t.proposedFrom, t.proposedTo])), n.length ? r(`待审：{0}`, [n.join(r(`，`))]) : r(`调价待审`)
}

function x(e, t) {
  let n = e => {
      let t = e.trim().replace(/^\+/, ``),
        n = t.startsWith(`-`),
        [r, i = ``] = t.replace(/^-/, ``).split(`.`);
      return {
        negative: n,
        whole: r.replace(/^0+/, ``) || `0`,
        fraction: i.replace(/0+$/, ``)
      }
    },
    r = e => e.whole === `0` && !e.fraction ? 0 : e.negative ? -1 : 1,
    i = n(e),
    a = n(t),
    o = r(i),
    s = r(a);
  if (o !== s) return o < s ? -1 : 1;
  if (o === 0) return 0;
  let c = Math.max(i.fraction.length, a.fraction.length),
    l = BigInt(i.whole + i.fraction.padEnd(c, `0`)),
    u = BigInt(a.whole + a.fraction.padEnd(c, `0`)),
    d = l < u ? -1 : +(l > u);
  return o < 0 ? -d : d
}

function S(e, n) {
  return !n?.min || !n.max ? `` : x(e, n.min) < 0 || x(e, n.max) > 0 ? r(`报价折扣必须在 {0} 至 {1} 之间`, [t(n.min), t(n.max)]) : ``
}

function C(e) {
  let t = e.upcomingPrice;
  return t?.effectiveFrom ? e.pricingType === `DISCOUNT` && t.multiplier != null ? r(`后续 {0} · {1} 起`, [a(t.multiplier), t.effectiveFrom]) : t.unitPrice == null ? `` : r(`后续 {0} {1} · {2} 起`, [e.currency, t.unitPrice, t.effectiveFrom]) : ``
}
export {
  S as a, l as c, s as d, u as f, h as i, d as l, C as m, _ as n, b as o, y as p, o as r, g as s, f as t, v as u
};