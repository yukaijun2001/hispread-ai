// origin: assets/QuotePeriodPanel-D3BWLIuY.js
import {
  C as e,
  S as t,
  X as n,
  Z as r,
  ct as i,
  g as a,
  h as o,
  j as s,
  lt as c,
  mt as l,
  rt as u,
  s as ee,
  ut as d,
  v as f,
  vt as p
} from "./index-Dnr0i-H9.js";
import {
  t as m
} from "./DateRangePicker-DtOG4QUZ.js";
import {
  i as h
} from "./systemLabels-DqpNuQ-_.js";
import {
  a as g,
  c as _,
  d as v,
  l as y,
  p as b,
  r as te
} from "./quoteHelpers-Fmn-ErWD.js";
import {
  n as ne
} from "./Quotes-BL6CyQ42.js";
var x = p(r(), 1),
  S = n();

function C({
  quote: n,
  canRequest: r,
  canReview: p,
  defaultAdjustPrice: C = !1,
  referenceRates: re,
  referenceRatesLoading: ie,
  referenceRatesError: w,
  multiplierBounds: T,
  multiplierBoundsError: E,
  suggestedMultiplier: D,
  onChanged: O
}) {
  let { user: currentUser } = e(), k = t(`/quotes/${encodeURIComponent(n.id)}/period-change`),
    [A, j] = (0, x.useState)(n.effectiveFrom),
    [M, N] = (0, x.useState)(n.effectiveTo),
    [P, F] = (0, x.useState)(() => n.pricingType === `FIXED` ? _(n) : i(_(n))),
    [I, L] = (0, x.useState)(C),
    [R, z] = (0, x.useState)(() => n.effectiveFrom > s() ? n.effectiveFrom : s()),
    [B, V] = (0, x.useState)(!1),
    H = (0, x.useRef)(!1),
    [U, W] = (0, x.useState)(``),
    {
      notify: G
    } = e(),
    K = k.data?.state === `PENDING` ? k.data : null,
    q = s(),
    J = n.effectiveFrom < q,
    Y = y(n, R),
    X = I && !v(n.pricingType === `FIXED` ? P : c(P), Y),
    Z = A !== n.effectiveFrom || M !== n.effectiveTo,
    Q = n.pricingType === `FIXED`,
    $ = A > q ? A : q;
  async function ae() {
    if (!(B || H.current)) {
      if (!A || !M || M < A) {
        W(l(`请选择有效的起止日期`));
        return
      }
      if (n.effectiveTo < q || M < q) {
        W(l(`历史报价不能修改，结束日期不能早于北京时间今天`));
        return
      }
      if (J ? A !== n.effectiveFrom : A < q) {
        W(l(J ? `历史开始日期不可修改` : `生效日期不能早于北京时间今天`));
        return
      }
      if (I) {
        if (!te.test(P)) {
          W(l(Q ? `请填写不小于 0 的单位价格` : `请填写不小于 0 的折扣`));
          return
        }
        if (!Q && (P.split(`.`)[0].replace(/^0+/, ``).length > 8 || (P.split(`.`)[1] || ``).length > 6)) {
          W(l(`折扣整数部分最多 8 位，小数部分最多 6 位`));
          return
        }
        if (!Q) {
          if (E) {
            W(l(`报价折扣范围读取失败`));
            return
          }
          if (!T) {
            W(l(`正在读取报价折扣范围`));
            return
          }
          let e = g(c(P), T);
          if (e) {
            W(e);
            return
          }
        }
        if (!R || R < $ || R > M) {
          W(l(`改价生效日期须为北京时间今天或未来，且在调整后的报价期间内`));
          return
        }
      }
      if (!X && !Z) {
        W(l(`报价日期和价格没有变化`));
        return
      }
      H.current = !0, V(!0), W(``);
      try {
        await u(`/quotes/${encodeURIComponent(n.id)}/period-change`, {
          effectiveFrom: A,
          effectiveTo: M,
          ...X ? {
            ...Q ? {
              unitPrice: P
            } : {
              multiplier: c(P)
            },
            priceEffectiveFrom: R
          } : {}
        }), G(l(`报价调整已提交审核`)), O()
      } catch (e) {
        W(e.message)
      } finally {
        H.current = !1, V(!1)
      }
    }
  }
  return (0, S.jsxs)(`section`, {
    children: [k.loading && (0, S.jsx)(o, {}), k.error && (0, S.jsxs)(a, {
      tone: `red`,
      children: [l(`调整状态加载失败：`), k.error]
    }), !r && !K && !k.loading && !k.error && (0, S.jsx)(a, {
      children: l(`暂无待审核的报价调整。`)
    }), K && (0, S.jsxs)(a, {
      children: [(0, S.jsxs)(`p`, {
        children: [l(`待审核：`), K.oldFrom, l(` 至 `), K.oldTo, ` → `, K.proposedFrom, l(` 至`), ` `, K.proposedTo, l(`。 `)]
      }), K.priceEffectiveFrom && (0, S.jsxs)(`p`, {
        children: [l(`价格： `), Q ? `${n.currency} ${K.oldUnitPrice??`—`}` : l(`{0}`, [d(String(K.oldMultiplier ?? `—`))]), ` → `, Q ? `${n.currency} ${K.proposedUnitPrice??`—`}` : l(`{0}`, [d(String(K.proposedMultiplier ?? `—`))]), l(`， `), K.priceEffectiveFrom === q ? l(`今天生效`) : l(`{0} 生效`, [K.priceEffectiveFrom]), l(`。 `)]
      }), (0, S.jsx)(`p`, {
        children: l(`审核前原期间和价格继续生效，历史费用不变。`)
      })]
    }), p && K && K.submittedBy !== currentUser.id && K.createdBy !== currentUser.id && (0, S.jsx)(f, {
      approveConfirmation: l(`是否确认审核通过该报价调整？`),
      onReview: async (e, t) => {
        await u(`/quotes/${encodeURIComponent(n.id)}/period-change/review`, {
          approved: e,
          note: t
        }), G(l(e ? `报价调整已通过` : `报价调整已退回`)), O()
      }
    }), r && !K && !k.loading && !k.error && (0, S.jsxs)(S.Fragment, {
      children: [(0, S.jsx)(`p`, {
        className: `muted`,
        children: l(`今天调价今天生效，历史价格不变。未来调价按所选日期生效，审核前旧价继续有效。 `)
      }), (0, S.jsxs)(`div`, {
        className: `form-grid quote-adjustment-form`,
        children: [(0, S.jsxs)(`div`, {
          className: `field`,
          children: [(0, S.jsx)(`span`, {
            children: l(`适用期间`)
          }), (0, S.jsx)(m, {
            from: A,
            to: M,
            disabled: B,
            minDate: q,
            fromLocked: J,
            onChange: (e, t) => {
              j(e), N(t), W(``)
            }
          }), J && (0, S.jsx)(`small`, {
            children: l(`开始日期已锁定，只能调整今天或未来的结束日期。`)
          })]
        }), (0, S.jsxs)(`label`, {
          className: `quote-price-adjust-toggle`,
          children: [(0, S.jsx)(`input`, {
            type: `checkbox`,
            checked: I,
            disabled: B,
            onChange: e => {
              L(e.target.checked), F(Q ? Y : i(Y)), W(``)
            }
          }), l(`同时调价 `)]
        }), I && (0, S.jsxs)(`label`, {
          className: `field`,
          children: [(0, S.jsx)(`span`, {
            children: Q ? l(`单位价格（{0} / {1}）`, [n.currency, h(n.unit)]) : l(`报价折扣`)
          }), (0, S.jsx)(`input`, {
            "aria-label": l(Q ? `调整单位价格` : `调整报价折扣`),
            type: `number`,
            min: `0`,
            step: `any`,
            value: P,
            disabled: B,
            onChange: e => {
              F(e.target.value), W(``)
            }
          }), !Q && T && (0, S.jsxs)(`small`, {
            children: [l(`允许范围 `), i(T.min), l(` 至 `), i(T.max), l(`，可填小数 `)]
          }), b(D) && (0, S.jsx)(`small`, {
            className: `quote-suggested-note`,
            children: b(D)
          }), (0, S.jsxs)(`small`, {
            children: [l(`所选生效日原价格： `), Q ? `${n.currency} ${Y}` : l(`{0}`, [d(String(Y))])]
          }), (0, S.jsx)(ne, {
            value: Q ? P : c(P),
            currency: n.currency,
            unit: Q ? h(n.unit) : void 0,
            referenceRates: re,
            loading: ie,
            error: w
          })]
        }), I && (0, S.jsxs)(`label`, {
          className: `field`,
          children: [(0, S.jsx)(`span`, {
            children: l(`改价生效日期（北京时间）`)
          }), (0, S.jsx)(`input`, {
            "aria-label": l(`改价生效日期`),
            type: `date`,
            min: $,
            max: M,
            value: R,
            disabled: B,
            onChange: e => {
              z(e.target.value), W(``)
            }
          }), (0, S.jsx)(`small`, {
            children: l(R === q ? `今天调价今天生效。` : `按所选日期生效。`)
          })]
        })]
      }), U && (0, S.jsx)(a, {
        tone: `red`,
        children: U
      }), (0, S.jsx)(ee, {
        disabled: B || !Z && !X,
        onClick: () => void ae(),
        children: l(B ? `提交中…` : `提交调整审核`)
      })]
    })]
  })
}
export {
  C as QuotePeriodPanel
};
