// origin: assets/PaymentForm-DYdHXH-C.js
import {
  A as e,
  C as t,
  G as n,
  N as r,
  P as i,
  S as a,
  T as o,
  V as s,
  X as c,
  Z as l,
  g as u,
  k as d,
  mt as f,
  p,
  rt as m,
  vt as h
} from "./index-Dnr0i-H9.js";
import {
  n as g,
  t as _
} from "./usePaymentEvidence-DFI1SOk7.js";
var v = h(l(), 1),
  y = c();

function b({
  settlement: c,
  onClose: l,
  onPayment: h
}) {
  let {
    has: b,
    notify: x,
    refresh: S
  } = t(), C = _(), [w, T] = (0, v.useState)(``), [E, D] = (0, v.useState)(!1), O = b(`payment.create`) && b(`file.write`), canRequestChannel = b(`payment.create`) && b(`account.read`) && b(`payment.execute`), A = a(b(`account.read`) ? `/accounts?supplierId=` + c.supplierId : null), j = a(b(`exchange_rate.read`) ? `/exchange-rates/current` : null), M = a(b(`payment.execute`) ? `/payments/providers` : null), k = canRequestChannel && !M.loading && !M.error && !!M.data?.length, N = e => e.paymentMethod === `CHANNEL` && e.payoutCurrency === `USDT` && M.data?.some(e => e.code === `OKX_USDT`) && !M.data?.some(e => e.code === `BINANCE_USDT`), P = e => j.data?.find(t => t.id === e.exchangeRateId), F = [{
    name: `paymentMethod`,
    label: f(`付款方式`),
    type: `select`,
    full: !0,
    options: [{
      value: `OFFLINE`,
      label: f(`线下付款 · 提交独立审核`),
      disabled: !O
    }, {
      value: `CHANNEL`,
      label: f(`线上付款 · 审核后通道执行`),
      disabled: !k
    }]
  }, {
    name: `obligationAmount`,
    label: f(`本次抵扣应付（{0}）`, [c.currency]),
    type: `number`,
    min: `0.01`,
    max: s(c.total, c.reservedAmount, c.currency),
    full: !0
  }, {
    name: `payoutCurrency`,
    label: f(`实际付款币种`),
    type: `select`,
    visual: `currency`,
    clearOnChange: [`accountId`, `exchangeRateId`],
    options: o.map(e => ({
      value: e,
      label: e
    }))
  }, {
    name: `accountId`,
    label: f(`收款账户`),
    type: `select`,
    visual: `account`,
    visible: e => e.paymentMethod === `CHANNEL`,
    options: e => (A.data || []).filter(t => t.state === `APPROVED` && t.currency === e.payoutCurrency).map(e => ({
      value: e.id,
      label: `${d(e)} · ${e.lastFour}`
    }))
  }, {
    name: `exchangeRateId`,
    label: f(`当前汇率版本（1 {0} ＝）`, [c.currency]),
    type: `select`,
    full: !0,
    visible: e => e.payoutCurrency !== c.currency,
    options: e => (j.data || []).filter(t => t.baseCurrency === c.currency && t.quoteCurrency === e.payoutCurrency).map(e => ({
      value: e.id,
      label: `V${e.version} · ${e.rate} ${e.quoteCurrency} · ${i(e.effectiveFrom)}`
    })),
    hint: f(`采用当前已生效的版本，提交后冻结`)
  }, {
    name: `fee`,
    label: f(`平台承担的手续费（付款币种）`),
    type: `number`,
    min: `0`,
    visible: e => !N(e)
  }].map(e => ({
    ...e,
    section: [`paymentMethod`, `obligationAmount`, `payoutCurrency`].includes(e.name) ? f(`付款安排`) : e.name === `fee` ? f(`手续费`) : f(`收款与汇率`)
  }));
  return !O && !k ? (0, y.jsx)(n, {
    title: f(`申请付款`),
    onClose: l,
    children: (0, y.jsx)(u, {
      tone: `red`,
      children: canRequestChannel && !M.loading && !M.error && !M.data?.length ? f(`当前未接入线上出款，仅支持独立审核后的线下登记。你没有线下申请权限，请联系管理员。`) : f(`缺少线下付款申请/附件上传权限，或线上付款申请/账户读取权限，请联系管理员。 `)
    })
  }) : (0, y.jsx)(p, {
    title: f(`申请付款`),
    subtitle: `${c.supplierName} · ${c.code}`,
    fields: F,
    initial: {
      paymentMethod: O ? `OFFLINE` : `CHANNEL`,
      obligationAmount: s(c.total, c.reservedAmount, c.currency),
      payoutCurrency: c.currency,
      fee: `0`,
      requestKey: crypto.randomUUID()
    },
    onClose: E ? () => {} : l,
    submitLabel: e => e.paymentMethod === `OFFLINE` ? f(`提交线下付款申请`) : f(`提交线上付款审核`),
    extra: t => (0, y.jsxs)(y.Fragment, {
      children: [canRequestChannel && !M.loading && !M.error && !M.data?.length && (0, y.jsx)(u, {
        children: f(`当前未接入线上出款，仅支持独立审核后的线下登记。`)
      }), M.error && canRequestChannel && (0, y.jsx)(u, { tone: `red`, children: M.error }), (0, y.jsxs)(`div`, {
        className: `conversion-preview`,
        children: [(0, y.jsx)(`span`, {
          children: f(`预计向供应商支付`)
        }), (0, y.jsxs)(`strong`, {
          children: [t.payoutCurrency, ` `, t.payoutCurrency === c.currency ? e(t.obligationAmount, t.payoutCurrency) : P(t) ? e(r(t.obligationAmount, P(t).rate, t.payoutCurrency), t.payoutCurrency) : f(`请选择当前汇率`)]
        }), (0, y.jsx)(`small`, {
          children: t.payoutCurrency === c.currency ? f(`同币种，无换汇`) : P(t) ? f(`采用V{0} · {1}`, [P(t).version, P(t).source]) : f(`该币种对暂无当前生效汇率。`)
        })]
      }), t.paymentMethod === `OFFLINE` ? (0, y.jsxs)(y.Fragment, {
        children: [(0, y.jsx)(u, {
          children: f(`提交后进入待审核，不登记已付款。须由另一位财务或管理员审核通过，再登记真实转账结果和付款凭证；申请人不能审核自己的申请。 `)
        }), (0, y.jsxs)(`div`, {
          className: `field`,
          children: [(0, y.jsx)(`span`, {
            children: f(`付款说明与凭证`)
          }), (0, y.jsx)(g, {
            value: C,
            disabled: E
          })]
        }), (0, y.jsxs)(`label`, {
          className: `field`,
          children: [(0, y.jsx)(`span`, {
            children: f(`转账流水号 / 凭证编号（选填）`)
          }), (0, y.jsx)(`input`, {
            value: w,
            maxLength: 160,
            disabled: E,
            onChange: e => T(e.target.value)
          })]
        })]
      }) : (0, y.jsxs)(y.Fragment, {
        children: [(0, y.jsx)(u, {
          children: f(`线上付款提交后先审核，审核通过后再通过支付通道执行。金额、账户及汇率版本会冻结。 `)
        }), A.error && (0, y.jsx)(u, {
          tone: `red`,
          children: A.error
        }), !A.loading && !A.error && !(A.data || []).some(e => e.state === `APPROVED` && e.currency === t.payoutCurrency) && (0, y.jsx)(u, {
          tone: `amber`,
          children: f(`暂无该币种已通过的收款账户，请先维护并审核账户。`)
        })]
      })]
    }),
    onSubmit: async e => {
      if(e.paymentMethod === `CHANNEL` && !k) throw Error(f(`当前未接入可执行的线上出款通道，请使用独立审核后的线下登记。`));
      D(!0);
      try {
        let t = {
            settlementId: c.id,
            obligationAmount: e.obligationAmount,
            payoutCurrency: e.payoutCurrency,
            exchangeRateId: e.payoutCurrency === c.currency ? null : e.exchangeRateId,
            fee: N(e) ? `0` : e.fee,
            requestKey: e.requestKey
          },
          n;
        if (e.paymentMethod === `OFFLINE`) {
          let e = await C.prepare(c.supplierId);
          n = await m(`/payments/offline`, {
            ...t,
            ...e,
            externalRef: w
          })
        } else n = await m(`/payments`, {
          ...t,
          accountId: e.accountId,
          paymentMethod: `CHANNEL`
        });
        S(), x(e.paymentMethod === `OFFLINE` ? f(`线下付款申请已提交，等待独立审核`) : f(`线上付款申请已提交审核`)), h(n)
      } finally {
        D(!1)
      }
    }
  })
}
export {
  b as
  default
};
