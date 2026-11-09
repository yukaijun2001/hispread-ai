// origin: assets/SettlementInputs-CZ-QKlwM.js
import {
  A as e,
  C as t,
  F as n,
  G as r,
  S as i,
  T as a,
  U as o,
  X as s,
  Z as c,
  _ as l,
  c as u,
  g as d,
  l as f,
  mt as p,
  o as m,
  p as h,
  rt as g,
  s as _,
  u as v,
  ut as y,
  vt as b,
  y as x
} from "./index-Dnr0i-H9.js";
import {
  i as S
} from "./systemLabels-DqpNuQ-_.js";
import {
  t as C
} from "./projectOptions-RFlNxqPH.js";
var w = b(c(), 1),
  T = s();

function E() {
  let {
    refresh: a,
    has: o,
    notify: s
  } = t(), [c, d] = (0, w.useState)(``), [b, C] = (0, w.useState)(1), [E, D] = (0, w.useState)(10), [O, k] = (0, w.useState)(``), [A, j] = (0, w.useState)(null), [M, N] = (0, w.useState)(!1), [P, F] = (0, w.useState)(``);
  (0, w.useEffect)(() => {
    if (P.trim() === c) return;
    let e = window.setTimeout(() => {
      d(P.trim()), C(1)
    }, 300);
    return () => window.clearTimeout(e)
  }, [P, c]);
  let I = i(`/settlement-inputs?search=${encodeURIComponent(c)}&state=${O}&page=${b}&size=${E}`);
  return (0, T.jsxs)(T.Fragment, {
    children: [(0, T.jsxs)(`section`, {
      className: `panel`,
      children: [(0, T.jsxs)(`div`, {
        className: `panel-toolbar`,
        children: [(0, T.jsx)(x, {
          value: P,
          onChange: F,
          placeholder: p(`搜索来源单号、供应商或项目`)
        }), (0, T.jsxs)(`div`, {
          className: `toolbar-right`,
          children: [(0, T.jsx)(v, {
            ariaLabel: p(`原始金额状态`),
            value: O,
            onChange: e => {
              k(e), C(1)
            },
            options: [{
              value: ``,
              label: p(`全部状态`)
            }, {
              value: `AVAILABLE`,
              label: p(`待结算`),
              tone: `available`
            }, {
              value: `ALLOCATED`,
              label: p(`已纳入结算`),
              tone: `allocated`
            }, {
              value: `VOID`,
              label: p(`已作废`),
              tone: `void`
            }]
          }), (0, T.jsx)(_, {
            icon: `refresh`,
            "aria-label": p(`刷新原始金额`),
            onClick: a
          })]
        })]
      }), (0, T.jsx)(u, {
        loading: I.loading,
        error: I.error,
        data: I.data?.items || [],
        onRow: j,
        columns: [{
          label: p(`供应商 / 项目`),
          render: e => (0, T.jsxs)(`div`, {
            className: `stack`,
            children: [(0, T.jsx)(`strong`, {
              children: e.supplierName
            }), (0, T.jsx)(`small`, {
              children: e.projectName
            })]
          })
        }, {
          label: p(`来源单号`),
          render: e => (0, T.jsx)(`span`, {
            className: `mono`,
            children: e.sourceRef
          })
        }, {
          label: p(`来源`),
          render: e => ({
            EXTERNAL: p(`外部接收`),
            MANUAL: p(`手工录入`),
            RESOURCE: p(`CC lane 资源`)
          })[e.sourceKind || `EXTERNAL`]
        }, {
          label: p(`所属期间`),
          render: e => (0, T.jsxs)(`div`, {
            className: `stack mono`,
            children: [(0, T.jsx)(`span`, {
              children: e.periodStart
            }), (0, T.jsxs)(`small`, {
              children: [p(`至 `), e.periodEnd]
            })]
          })
        }, {
          label: p(`消耗 / 原始金额`),
          className: `align-right`,
          render: t => (0, T.jsxs)(`span`, {
            className: `money`,
            children: [t.currency, ` `, e(t.originalAmount, t.currency)]
          })
        }, {
          label: p(`应付金额`),
          className: `align-right`,
          render: t => (0, T.jsxs)(`strong`, {
            className: `money`,
            children: [t.currency, ` `, e(t.finalAmount, t.currency)]
          })
        }, {
          label: p(`状态`),
          render: e => (0, T.jsx)(m, {
            state: e.state
          })
        }, {
          label: p(`操作`),
          render: e => (0, T.jsx)(`button`, {
            className: `text-button`,
            onClick: () => j(e),
            children: p(`查看依据 `)
          })
        }]
      }), (0, T.jsx)(l, {
        data: I.data,
        page: b,
        onPage: C,
        size: E,
        onSizeChange: e => {
          D(e), C(1)
        }
      })]
    }), A && (0, T.jsxs)(r, {
      drawer: !0,
      title: p(`账务金额与计算依据`),
      subtitle: A.sourceRef,
      onClose: () => j(null),
      children: [(0, T.jsxs)(`div`, {
        className: `settlement-hero`,
        children: [(0, T.jsxs)(`div`, {
          children: [(0, T.jsx)(`span`, {
            children: p(`应付金额`)
          }), (0, T.jsxs)(`h2`, {
            children: [(0, T.jsx)(`small`, {
              children: A.currency
            }), e(A.finalAmount, A.currency)]
          })]
        }), (0, T.jsx)(m, {
          state: A.state
        })]
      }), (0, T.jsx)(f, {
        items: [
          [p(`供应商`), A.supplierName],
          [p(`项目`), A.projectName],
          [p(`来源类型`), {
            EXTERNAL: p(`外部接收`),
            MANUAL: p(`手工录入`),
            RESOURCE: p(`CC lane 资源`)
          } [A.sourceKind || `EXTERNAL`]],
          [p(`来源账单期间`), `${A.periodStart} — ${A.periodEnd}`],
          [p(`原始金额（完整精度）`), `${A.currency} ${A.originalAmount}`],
          [p(`CC lane 查询消耗`), A.sourceSnapshot?.exactConsumption ? `USD ${A.sourceSnapshot.exactConsumption}` : null],
          [p(`CC lane 查询时间`), A.sourceSnapshot?.queriedAt],
          [p(`款项说明`), A.baseReference],
          [p(`对应报价`), A.quoteSnapshot.pricingType === `DIRECT` ? p(`无需报价`) : A.quoteSnapshot.code],
          [p(`计算方式`), A.quoteSnapshot.pricingType === `DIRECT` ? p(`直接录入真实结算金额`) : A.quoteSnapshot.pricingType === `DISCOUNT` ? p(`{0} × {1}`, [A.originalAmount, y(String(A.quoteSnapshot.multiplier ?? n(String(A.quoteSnapshot.ratePercent))))]) : `${A.quantity} ${S(A.quoteSnapshot.unit)||p(`个数`)} × ${A.quoteSnapshot.unitPrice}`],
          [p(`报价有效期`), A.quoteSnapshot.pricingType === `DIRECT` ? p(`无需报价`) : `${A.quoteSnapshot.effectiveFrom} — ${A.quoteSnapshot.effectiveTo}`],
          [p(`作废原因`), A.voidNote]
        ]
      }), A.state === `AVAILABLE` && o(`usage.import`) && (0, T.jsx)(`div`, {
        className: `dialog-footer`,
        children: (0, T.jsx)(_, {
          onClick: () => N(!0),
          children: p(`作废本条原始金额`)
        })
      }), M && (0, T.jsx)(h, {
        title: p(`作废未结算的原始金额`),
        fields: [{
          name: `note`,
          label: p(`作废原因`),
          type: `textarea`,
          full: !0
        }],
        onClose: () => N(!1),
        onSubmit: async e => {
          await g(`/settlement-inputs/${A.id}/void`, e), N(!1), j(null), a(), s(p(`已作废，来源单号仍保留用于防重`))
        }
      })]
    })]
  })
}

function D({
  supplierField: e,
  projects: n,
  mode: r = `external`,
  onClose: i
}) {
  let {
    refresh: s,
    notify: c
  } = t(), l = e => r === `manual` && e.pricingMode === `DIRECT`, u = e => !l(e) && n.find(t => t.id === e.projectId)?.settlementMethod === `ACCOUNT_BUYOUT`, f = [...r === `manual` ? [{
    name: `pricingMode`,
    label: p(`金额录入方式`),
    type: `select`,
    full: !0,
    options: [{
      value: `QUOTE`,
      label: p(`按报价计算应付`)
    }, {
      value: `DIRECT`,
      label: p(`直接录入真实结算金额`)
    }]
  }] : [], e, {
    name: `projectId`,
    label: p(`项目`),
    type: `select`,
    visual: `project`,
    full: !0,
    options: n.filter(e => e.enabled && e.settlementMethod !== `LEGACY`).map((e, t, n) => C(e, n))
  }, {
    name: `sourceRef`,
    label: p(r === `manual` ? `手工款项编号` : `现行系统来源单号`),
    full: !0,
    hint: p(`同一供应商和项目下保持唯一，用于防止重复结算`)
  }, ...r === `manual` ? [{
    name: `baseReference`,
    label: p(`款项说明`),
    full: !0
  }] : [], {
    name: `periodStart`,
    label: p(`金额所属开始日期`),
    type: `date`
  }, {
    name: `periodEnd`,
    label: p(`金额所属结束日期`),
    type: `date`
  }, {
    name: `currency`,
    label: p(`原始金额币种`),
    type: `select`,
    visual: `currency`,
    visible: e => !l(e),
    options: a.map(e => ({
      value: e,
      label: e
    }))
  }, {
    name: `originalAmount`,
    label: p(r === `manual` ? `原始金额` : `现行系统原始金额`),
    type: `number`,
    min: `0`,
    step: `0.00000001`,
    visible: e => !l(e)
  }, {
    name: `currency`,
    label: p(`结算币种`),
    type: `select`,
    visual: `currency`,
    options: a.map(e => ({
      value: e,
      label: e
    })),
    visible: l
  }, {
    name: `originalAmount`,
    label: p(`真实结算金额`),
    type: `number`,
    min: `0`,
    step: `0.01`,
    visible: l
  }, {
    name: `quantity`,
    label: p(`买断账号数量`),
    type: `number`,
    min: `1`,
    step: `1`,
    visible: u
  }].map(e => ({
    ...e,
    section: [`pricingMode`, `supplierId`, `projectId`].includes(e.name) ? p(`关联对象与录入方式`) : [`sourceRef`, `baseReference`].includes(e.name) ? p(`款项信息`) : p(`所属期间与金额`)
  }));
  return (0, T.jsx)(h, {
    title: p(r === `manual` ? `录入手工应付依据` : `接收原始金额`),
    fields: f,
    initial: {
      pricingMode: `QUOTE`,
      currency: `USD`,
      periodStart: o(),
      periodEnd: o()
    },
    onClose: i,
    submitLabel: e => l(e) ? p(`保存真实结算金额`) : p(`校验报价并计算应付`),
    extra: e => (0, T.jsx)(d, {
      children: l(e) ? p(`仅关联供应商和项目，无需报价；填写金额即为应付金额。提交后进入待结算，付款仍需先完成供应商金额确认。`) : p(r === `manual` ? `填写原始金额后，系统按该供应商和项目的有效报价计算应付。提交后进入待结算，付款仍需先完成供应商金额确认。` : `仅接收现行系统已核算的原始金额，不在此生成日/月账单。跨越调价日期的账单，需要先拆分原始金额。`)
    }),
    onSubmit: async e => {
      let t = await g(r === `manual` ? l(e) ? `/settlement-inputs/manual-direct` : `/settlement-inputs/manual` : `/settlement-inputs`, {
        supplierId: e.supplierId,
        projectId: e.projectId,
        pricingMode: r === `manual` ? e.pricingMode : `QUOTE`,
        rows: [{
          sourceRef: e.sourceRef,
          periodStart: e.periodStart,
          periodEnd: e.periodEnd,
          currency: e.currency,
          originalAmount: e.originalAmount,
          quantity: u(e) ? e.quantity : null,
          baseReference: r === `manual` ? e.baseReference : null
        }]
      });
      s(), c(p(l(e) ? `已录入 {0} 条，重复 {1} 条；已按真实结算金额保存` : `已录入 {0} 条，重复 {1} 条；应付金额由服务端按报价计算`, [t.inserted, t.skipped]))
    }
  })
}
export {
  D as ReceiveAmountModal, E as SettlementInputs
};