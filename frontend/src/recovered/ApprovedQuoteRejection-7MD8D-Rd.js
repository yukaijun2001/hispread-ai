// origin: assets/ApprovedQuoteRejection-7MD8D-Rd.js
import {
  G as e,
  S as t,
  X as n,
  Z as r,
  g as i,
  h as a,
  l as o,
  mt as s,
  rt as c,
  s as l,
  vt as u
} from "./index-Dnr0i-H9.js";
var d = u(r(), 1),
  f = n();

function p({
  quote: n,
  onClose: r,
  onRejected: u
}) {
  let p = t(`/quotes/${encodeURIComponent(n.id)}`),
    [m, h] = (0, d.useState)(``),
    [g, _] = (0, d.useState)(!1),
    [v, y] = (0, d.useState)(``),
    b = (0, d.useRef)(!1),
    x = p.data || n,
    S = !p.loading && !p.error && p.data?.state === `APPROVED`,
    C = () => {
      b.current || r()
    };
  async function w() {
    if (b.current || !S) return;
    let e = m.trim();
    if (!e) {
      y(s(`请填写拒绝原因`));
      return
    }
    b.current = !0, _(!0), y(``);
    try {
      if ((await c(`/quotes/${encodeURIComponent(n.id)}/reject-approved`, {
          note: e
        })).state !== `REJECTED`) throw Error(s(`报价状态未更新，请刷新后核对`));
      u()
    } catch (e) {
      y(e.message)
    } finally {
      b.current = !1, _(!1)
    }
  }
  return (0, f.jsxs)(e, {
    title: s(`拒绝已通过报价`),
    onClose: C,
    children: [(0, f.jsx)(o, {
      items: [
        [s(`报价编号`), x.code],
        [s(`供应商`), x.supplierName],
        [s(`报价项目`), x.projectName],
        [s(`适用期间`), s(`{0} 至 {1}`, [x.effectiveFrom, x.effectiveTo])]
      ]
    }), (0, f.jsx)(i, {
      tone: `amber`,
      children: s(`拒绝后，该报价不再用于新的交付和计价，未完成的调价申请一并关闭。已冻结的交付、账务和结算记录保留。 `)
    }), p.loading && (0, f.jsx)(a, {}), p.error && (0, f.jsxs)(i, {
      tone: `red`,
      children: [s(`报价加载失败：`), p.error]
    }), !p.loading && !p.error && p.data?.state !== `APPROVED` && (0, f.jsx)(i, {
      tone: `red`,
      children: s(`报价已不处于已通过状态，请刷新列表。`)
    }), (0, f.jsxs)(`label`, {
      className: `field`,
      children: [(0, f.jsx)(`span`, {
        children: s(`拒绝原因（必填）`)
      }), (0, f.jsx)(`textarea`, {
        "aria-label": s(`拒绝原因`),
        placeholder: s(`填写拒绝原因，最多500字`),
        maxLength: 500,
        required: !0,
        disabled: g,
        value: m,
        onChange: e => h(e.target.value)
      })]
    }), v && (0, f.jsx)(i, {
      tone: `red`,
      children: v
    }), (0, f.jsxs)(`footer`, {
      className: `dialog-footer`,
      children: [(0, f.jsx)(l, {
        disabled: g,
        onClick: C,
        children: s(`取消 `)
      }), (0, f.jsx)(l, {
        variant: `danger`,
        disabled: g || !S || !m.trim(),
        onClick: () => void w(),
        children: s(g ? `正在拒绝…` : `确认拒绝`)
      })]
    })]
  })
}
export {
  p as ApprovedQuoteRejection
};