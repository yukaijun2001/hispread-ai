// origin: assets/SettlementPreview-CEv04HyA.js
import {
  A as e,
  F as t,
  G as n,
  P as r,
  X as i,
  Z as a,
  _ as o,
  c as s,
  g as c,
  h as l,
  l as u,
  mt as d,
  s as f,
  ut as p,
  vt as m
} from "./index-Dnr0i-H9.js";
import {
  n as h,
  t as g
} from "./SettlementResourceTable-DOsIIJjV.js";
var _ = m(a(), 1),
  v = i();

function y(e) {
  return e.includes(`.`) ? e.replace(/0+$/, ``).replace(/\.$/, ``) : e
}

function b(n, r) {
  if (n.quote.pricingType === `DIRECT`) return d(`直接录入真实结算金额`);
  if (n.quote.pricingType === `DISCOUNT`) {
    let e = n.quote.multiplier ?? (n.quote.ratePercent == null ? null : t(n.quote.ratePercent));
    return e == null ? d(`报价折扣缺失`) : p(e)
  }
  return n.quote.pricingType === `FIXED` ? n.quote.unitPrice == null ? d(`报价单价缺失`) : d(`{0} {1} / 个`, [r, e(n.quote.unitPrice, r)]) : d(`历史报价依据缺失`)
}

function x({
  initialDocument: t,
  loadPage: i,
  onClose: a,
  onBack: p,
  onConfirm: m,
  navigation: x
}) {
  let [S, C] = (0, _.useState)(t), [w, T] = (0, _.useState)(1), [E, D] = (0, _.useState)(t?.size || 50), [O, k] = (0, _.useState)(!t), [A, j] = (0, _.useState)(``), [M, N] = (0, _.useState)(!1), [P, F] = (0, _.useState)(0), I = (0, _.useRef)(!0), L = (0, _.useRef)(!1);
  (0, _.useEffect)(() => {
    if (I.current && t) {
      I.current = !1;
      return
    }
    I.current = !1;
    let e = !0;
    return k(!0), j(``), i(w, E).then(t => {
      e && C(t)
    }).catch(t => {
      e && (C(void 0), j(t.message))
    }).finally(() => {
      e && k(!1)
    }), () => {
      e = !1
    }
  }, [w, E, P]);
  async function R() {
    if (m && !L.current) {
      L.current = !0, N(!0), j(``);
      try {
        await m()
      } catch (e) {
        j(e.message)
      } finally {
        L.current = !1, N(!1)
      }
    }
  }
  let z = {
    MANUAL: d(`手工款`),
    EXTERNAL: d(`外部金额`),
    CCMAX: d(`日账`),
    RESOURCE: d(`资源费用`)
  };
  return (0, v.jsxs)(n, {
    title: d(`结算单预览`),
    wide: !0,
    className: `settlement-document-modal`,
    onClose: () => {
      M || a()
    },
    children: [x && (0, v.jsxs)(`div`, {
      className: `settlement-preview-navigation`,
      children: [(0, v.jsx)(f, {
        disabled: M || x.index === 0,
        onClick: x.onPrevious,
        children: d(`上一张 `)
      }), (0, v.jsxs)(`span`, {
        children: [d(`第 `), x.index + 1, ` / `, x.count, d(` 张 `)]
      }), (0, v.jsx)(f, {
        disabled: M || x.index + 1 === x.count,
        onClick: x.onNext,
        children: d(`下一张 `)
      })]
    }), O && (0, v.jsx)(l, {}), A && (0, v.jsxs)(c, {
      tone: `red`,
      children: [A, (0, v.jsx)(f, {
        disabled: M || O,
        onClick: () => F(e => e + 1),
        children: d(`重新核对 `)
      })]
    }), !O && S && (0, v.jsxs)(`article`, {
      className: `settlement-preview-sheet`,
      "aria-label": d(`结算单预览内容`),
      children: [(0, v.jsxs)(`header`, {
        className: `settlement-preview-heading`,
        children: [(0, v.jsx)(`h3`, {
          children: d(`结算单`)
        }), (0, v.jsx)(`span`, {
          children: d(`预览 · 尚未生成`)
        })]
      }), (0, v.jsx)(u, {
        items: [
          [d(`供应商`), S.supplierName],
          [d(`项目`), S.projectName],
          [d(`结算期间`), d(`{0} 至 {1}`, [S.periodStart, S.periodEnd])],
          [d(`应付币种`), S.currency],
          [d(`供应商确认截止时间`), r(S.confirmationDeadline)],
          [d(`金额来源`), S.basisMode === `DAILY_SUMMARY` ? d(`已生成的日账静态汇总`) : d(`{0} 笔已选日账`, [S.lineCount])]
        ]
      }), (0, v.jsx)(`div`, {
        className: `settlement-preview-lines`,
        children: S.dailyLines ? (0, v.jsx)(h, {
          lines: S.dailyLines,
          currency: S.currency
        }) : S.resourceGroups ? (0, v.jsx)(g, {
          groups: S.resourceGroups,
          currency: S.currency
        }) : (0, v.jsx)(s, {
          data: S.lines,
          ariaLabel: d(`结算单预览明细`),
          columns: [{
            label: d(`账务日期`),
            render: e => e.businessDate
          }, {
            label: d(`来源`),
            render: e => (0, v.jsxs)(`div`, {
              className: `settlement-preview-source`,
              children: [(0, v.jsxs)(`span`, {
                children: [z[e.sourceKind] || e.sourceKind, e.modelKey ? ` · ${e.modelKey}` : ``]
              }), (0, v.jsx)(`small`, {
                children: e.sourceRef
              })]
            })
          }, {
            label: d(`原始金额`),
            render: e => `${S.currency} ${y(e.originalAmount)}`
          }, {
            label: d(`报价`),
            render: e => (0, v.jsxs)(`div`, {
              className: `settlement-preview-source`,
              children: [(0, v.jsx)(`span`, {
                children: e.quote.pricingType === `DIRECT` ? d(`无需报价`) : e.quote.code || d(`历史报价`)
              }), (0, v.jsxs)(`small`, {
                children: [e.quote.effectiveFrom || `—`, d(` 至 `), e.quote.effectiveTo || `—`]
              })]
            })
          }, {
            label: d(`计价依据`),
            render: e => b(e, S.currency)
          }, ...S.lines.some(e => e.quote.pricingType === `FIXED`) ? [{
            label: d(`个数`),
            render: e => e.quantity ?? `—`
          }] : [], {
            label: d(`应付金额`),
            render: t => (0, v.jsxs)(`strong`, {
              children: [S.currency, ` `, e(t.finalAmount, S.currency)]
            })
          }]
        })
      }), (S.dailyLineCount ?? S.resourceGroupCount ?? S.lineCount) > E && (0, v.jsx)(o, {
        data: {
          items: S.dailyLines || S.resourceGroups || S.lines,
          total: S.dailyLineCount ?? S.resourceGroupCount ?? S.lineCount,
          page: S.page,
          size: S.size
        },
        page: w,
        onPage: T,
        size: E,
        onSizeChange: e => {
          D(e), T(1)
        }
      }), (0, v.jsxs)(`footer`, {
        className: `settlement-preview-total`,
        children: [(0, v.jsxs)(`span`, {
          children: [d(`原始金额合计 `), S.currency, ` `, y(S.originalTotal)]
        }), (0, v.jsxs)(`div`, {
          children: [(0, v.jsx)(`span`, {
            children: d(`本次应付合计`)
          }), (0, v.jsxs)(`strong`, {
            children: [S.currency, ` `, e(S.total, S.currency)]
          })]
        })]
      }), (0, v.jsx)(`p`, {
        className: `muted`,
        children: S.basisMode === `DAILY_SUMMARY` ? d(`按已生成的日账汇总金额结算，正式生成后冻结本单金额。`) : (0, v.jsxs)(v.Fragment, {
          children: [d(`合计包含全部 `), S.lineCount, ` `, d(`笔来源。按各笔日账的冻结报价计价，正式生成前再次核对金额。 `)]
        })
      }), (0, v.jsx)(`p`, {
        className: `muted`,
        children: d(`请核对后手动确认或提出异议；到期不会自动确认。`)
      })]
    }), (0, v.jsxs)(`div`, {
      className: `settlement-batch-actions`,
      children: [p && (0, v.jsx)(f, {
        disabled: M,
        onClick: p,
        children: d(`返回修改 `)
      }), (0, v.jsx)(f, {
        disabled: M,
        onClick: a,
        children: d(m ? `取消` : `返回批量预览`)
      }), m && (0, v.jsx)(f, {
        variant: `primary`,
        disabled: M || O || !S || !!A,
        onClick: R,
        children: d(M ? `正在生成…` : `确认生成`)
      })]
    })]
  })
}
export {
  x as
  default
};