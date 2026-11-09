// origin: assets/SettlementDetail-B_4PzTZg.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/PaymentForm-DYdHXH-C.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/usePaymentEvidence-DFI1SOk7.js", "assets/usePaymentEvidence-_R0G9P04.css"]))) => i.map(i => d[i]);
import {
  A as e,
  C as t,
  F as n,
  G as r,
  H as i,
  M as a,
  P as o,
  S as ee,
  T as s,
  V as c,
  X as l,
  Y as te,
  Z as u,
  _ as d,
  c as f,
  d as ne,
  et as p,
  g as m,
  h,
  i as g,
  l as _,
  mt as v,
  o as re,
  p as y,
  rt as b,
  s as x,
  ut as S,
  v as C,
  vt as w
} from "./index-Dnr0i-H9.js";
import {
  i as T
} from "./systemLabels-DqpNuQ-_.js";
import {
  n as E,
  t as D
} from "./SettlementResourceTable-DOsIIJjV.js";
import {
  t as O
} from "./SettlementManagement-DAgYDp-f.js";
var k = w(u(), 1),
  A = l(),
  j = (0, k.lazy)(() => g(() => import(`./PaymentForm-DYdHXH-C.js`), __vite__mapDeps([0, 1, 2, 3, 4])));

function M({
  id: i,
  onClose: l,
  onPayment: u
}) {
  let {
    has: g,
    refresh: w,
    notify: M,
    user: ae
  } = t(), N = !!ae.supplierId, [P, F] = (0, k.useState)(1), [I, L] = (0, k.useState)(50), R = ee(`/settlements/${i}?page=${P}&size=${I}`), [z, B] = (0, k.useState)(!1), [V, H] = (0, k.useState)(!1), [U, W] = (0, k.useState)(!1), [G, K] = (0, k.useState)(!1), [q, oe] = (0, k.useState)(0), J = R.data;
  (0, k.useEffect)(() => {
    if (!J?.confirmationDeadline || J.state !== `PENDING`) return;
    let e = Date.parse(J.confirmationDeadline) - Date.now();
    if (!Number.isFinite(e) || e <= 0) return;
    let t = window.setTimeout(() => oe(e => e + 1), Math.min(e + 1, 2147483647));
    return () => window.clearTimeout(t)
  }, [J?.confirmationDeadline, J?.state, q]);
  let Y = !!J?.confirmationDeadline && Date.parse(J.confirmationDeadline) <= Date.now(),
    X = !!J && !N && g(`settlement.create`) && J.state === `PENDING` && J.workflowVersion === 2,
    se = X && !Y,
    Z = (J?.adjustments || []).filter(e => !N || e.supplierVisible),
    Q = !!J && J.state === `CONFIRMED` && J.supplierConfirmed && !N && (g(`payment.create`) || g(`payment.record`)) && s.some(e => e === J.currency) && a(J.total, J.reservedAmount) > 0,
    $ = !!J?.canVoid && !N && g(`settlement.create`);
  return (0, A.jsx)(r, {
    drawer: !0,
    title: J?.code || v(`结算单详情`),
    subtitle: J?.supplierName,
    onClose: l,
    children: J ? (0, A.jsxs)(A.Fragment, {
      children: [(0, A.jsxs)(`div`, {
        className: `settlement-hero`,
        children: [(0, A.jsxs)(`div`, {
          children: [(0, A.jsx)(`span`, {
            children: v(N ? `本期应收` : `本期应付`)
          }), (0, A.jsxs)(`h2`, {
            children: [(0, A.jsx)(`small`, {
              children: J.currency
            }), e(J.total, J.currency)]
          })]
        }), (0, A.jsx)(re, {
          state: J.state,
          label: J.confirmationMode === `AUTO_DEADLINE` ? v(`逾期自动确认`) : J.state === `PENDING` ? v(`待供应商确认`) : void 0
        })]
      }), J.state === `VOID` && (0, A.jsxs)(m, {
        children: [(0, A.jsx)(`strong`, {
          children: v(`结算单已作废`)
        }), (0, A.jsx)(`p`, {
          children: J.voidNote
        }), (0, A.jsx)(`span`, {
          children: o(J.voidedAt)
        })]
      }), J.sourceChanged && (0, A.jsx)(m, {
        tone: `red`,
        children: v(`来源金额或归属已变化，当前结算单暂停确认。请由平台撤回后重新生成。 `)
      }), (0, A.jsxs)(`div`, {
        className: `balance-split`,
        children: [(0, A.jsxs)(`div`, {
          children: [(0, A.jsx)(`span`, {
            children: v(`平台已完成付款`)
          }), (0, A.jsxs)(`strong`, {
            children: [J.currency, ` `, e(J.paidAmount, J.currency)]
          })]
        }), (0, A.jsxs)(`div`, {
          children: [(0, A.jsx)(`span`, {
            children: v(`供应商已确认收款`)
          }), (0, A.jsxs)(`strong`, {
            children: [J.currency, ` `, e(J.receivedAmount, J.currency)]
          })]
        }), !N && (0, A.jsxs)(`div`, {
          children: [(0, A.jsx)(`span`, {
            children: v(`申请中占用`)
          }), (0, A.jsxs)(`strong`, {
            children: [J.currency, ` `, e(c(J.reservedAmount, J.paidAmount, J.currency), J.currency)]
          })]
        })]
      }), (0, A.jsx)(_, {
        items: [
          [v(`项目`), J.projectName || v(`历史多项目结算`)],
          [v(`结算期间`), `${J.periodStart} — ${J.periodEnd}`],
          [v(`创建时间`), O(J.createdAt)],
          [v(`确认截止时间`), J.confirmationDeadline ? o(J.confirmationDeadline) : v(`历史单据未设置`)],
          [v(`原始金额`), J.originalTotal == null ? v(`历史单据未记录`) : J.currency + ` ` + J.originalTotal], ...N ? [] : [
            [v(`调整前应付`), `${J.currency} ${e(J.calculatedTotal??c(J.total,J.adjustmentTotal??`0`,J.currency),J.currency)}`],
            [v(`人工调整合计`), `${J.currency} ${e(J.adjustmentTotal??`0`,J.currency)}`],
            [v(`最终应付`), `${J.currency} ${e(J.total,J.currency)}`]
          ],
          [v(`金额确认`), J.confirmationMode === `AUTO_DEADLINE` ? v(`逾期未提出异议，系统已自动确认`) : J.supplierConfirmed ? v(`供应商已手动确认`) : v(`尚未获供应商确认`)],
          [v(`计价口径`), J.basisMode === `DAILY_SUMMARY` ? v(`以本单冻结的日账静态汇总金额确认`) : v(N ? `按原始金额和对应报价计算；以本单最终应收金额确认` : `按原始金额和对应报价计算，叠加人工调整；确认后金额冻结`)]
        ]
      }), J.state === `PENDING` && J.confirmationDeadline && (0, A.jsx)(m, {
        tone: `amber`,
        children: Y ? (0, A.jsxs)(A.Fragment, {
          children: [v(`本单确认截止时间已到，请刷新查看最新状态。 `), X && v(`当前不能再添加人工调整。`), (0, A.jsx)(`button`, {
            className: `text-button`,
            onClick: w,
            children: v(`刷新状态 `)
          })]
        }) : (0, A.jsxs)(A.Fragment, {
          children: [v(`请于 `), o(J.confirmationDeadline), ` `, v(`前完成确认或提出异议；逾期未处理将默认确认无误。 `)]
        })
      }), J.state === `CONFIRMED` && J.supplierConfirmed && !N && g(`payment.create`) && !s.some(e => e === J.currency) && a(J.total, J.reservedAmount) > 0 && (0, A.jsx)(m, {
        tone: `amber`,
        children: v(`该历史币种仅供查看；新付款申请只支持 USD、CNY 和 USDT。`)
      }), (Q || $) && (0, A.jsxs)(`div`, {
        className: `settlement-detail-actions`,
        role: `group`,
        "aria-label": v(`结算单操作`),
        children: [$ && (0, A.jsx)(x, {
          variant: `danger`,
          onClick: () => W(!0),
          children: v(`作废结算单`)
        }), Q && (0, A.jsx)(x, {
          variant: `primary`,
          icon: `wallet`,
          onClick: () => B(!0),
          children: v(`申请付款 `)
        })]
      }), (0, A.jsxs)(`section`, {
        className: `subsection`,
        children: [(0, A.jsxs)(`div`, {
          className: `section-title`,
          children: [(0, A.jsx)(`h3`, {
            children: v(J.basisMode === `DAILY_SUMMARY` ? `日账汇总` : `计价明细`)
          }), g(`settlement.export`) && (0, A.jsxs)(`button`, {
            className: `text-button`,
            onClick: async () => {
              try {
                await p(i)
              } catch (e) {
                M(e.message, !0)
              }
            },
            children: [(0, A.jsx)(te, {
              name: `download`,
              size: 15
            }), v(J.basisMode === `DAILY_SUMMARY` ? `导出结算单` : `导出明细 `)]
          })]
        }), J.dailyLines ? (0, A.jsx)(E, {
          lines: J.dailyLines,
          currency: J.currency
        }) : J.resourceGroups ? (0, A.jsx)(D, {
          groups: J.resourceGroups,
          currency: J.currency
        }) : (0, A.jsx)(f, {
          data: J.lines || [],
          columns: [{
            label: v(`项目 / 记录`),
            render: e => (0, A.jsxs)(`div`, {
              className: `stack`,
              children: [(0, A.jsx)(`strong`, {
                children: e.quoteSnapshot.title || e.quoteSnapshot.projectName || v(`未命名项目`)
              }), (0, A.jsx)(`small`, {
                children: e.externalId
              })]
            })
          }, {
            label: v(`计算依据`),
            render: t => (0, A.jsxs)(`div`, {
              className: `stack`,
              children: [(0, A.jsx)(`span`, {
                children: t.quoteSnapshot.pricingType === `DIRECT` ? v(`直接录入真实结算金额`) : t.quoteSnapshot.pricingType === `FIXED` ? `${t.quantity} ${T(t.quoteSnapshot.unit)||v(`个数`)} × ${t.quoteSnapshot.unitPrice}` : v(`{0} × {1}`, [e(t.baseAmount, J.currency), S(String(t.quoteSnapshot.multiplier ?? n(String(t.quoteSnapshot.ratePercent))))])
              }), (0, A.jsx)(`small`, {
                children: t.quoteSnapshot.pricingType === `DIRECT` ? v(`无需报价`) : t.quoteSnapshot.code
              })]
            })
          }, {
            label: v(`金额`),
            className: `align-right`,
            render: t => (0, A.jsx)(`strong`, {
              className: `money`,
              children: e(t.amount, J.currency)
            })
          }]
        }), J.linePage && (0, A.jsx)(d, {
          data: {
            ...J.linePage,
            items: J.dailyLines || J.resourceGroups || J.lines || []
          },
          page: P,
          onPage: F,
          size: I,
          onSizeChange: e => {
            L(e), F(1)
          }
        })]
      }), (!N || Z.length > 0) && (0, A.jsxs)(`section`, {
        className: `subsection`,
        children: [(0, A.jsxs)(`div`, {
          className: `section-title`,
          children: [(0, A.jsx)(`h3`, {
            children: v(`人工调整记录`)
          }), se && (0, A.jsx)(x, {
            icon: `plus`,
            onClick: () => K(!0),
            children: v(`加减金额 `)
          })]
        }), Z.length > 0 ? (0, A.jsx)(f, {
          ariaLabel: v(`结算人工调整记录`),
          data: Z,
          columns: [{
            label: v(`结算日期`),
            render: e => e.businessDate
          }, {
            label: v(`加减金额`),
            className: `align-right`,
            render: t => (0, A.jsxs)(`strong`, {
              className: `money`,
              children: [J.currency, ` `, a(t.amount, `0`) > 0 ? `+` : ``, e(t.amount, J.currency)]
            })
          }, {
            label: v(`调整说明`),
            render: e => e.note
          }, ...N ? [] : [{
            label: v(`供应商可见`),
            render: e => e.supplierVisible ? v(`可见`) : v(`仅内部可见`)
          }, {
            label: v(`操作人`),
            render: e => e.createdByName || `—`
          }], {
            label: v(`记录时间`),
            render: e => o(e.createdAt)
          }]
        }) : (0, A.jsx)(m, {
          children: v(`暂无人工调整记录。`)
        })]
      }), J.note && (0, A.jsx)(m, {
        children: J.note
      }), J.state === `PENDING` && N && J.workflowVersion === 2 && g(`settlement.confirm`) && (0, A.jsx)(C, {
        title: v(`核对本期应收金额`),
        approveDisabled: J.sourceChanged,
        rejectLabel: v(`提出金额异议`),
        approveLabel: v(N ? `确认本期应收` : `确认本期应付`),
        onReview: async (e, t) => {
          await b(`/settlements/${i}/confirm`, {
            approved: e,
            note: t,
            version: J.version
          }), w(), M(v(e ? `本期金额已确认` : `已退回核对`))
        }
      }), U && (0, A.jsx)(y, {
        title: v(`作废结算单`),
        submitLabel: v(`确认作废`),
        subtitle: v(`作废后原始金额重新可选，原结算及确认记录保留。`),
        fields: [{
          name: `note`,
          label: v(`作废原因`),
          type: `textarea`,
          full: !0
        }],
        onClose: () => W(!1),
        onSubmit: async e => {
          await b(`/settlements/${i}/void`, {
            note: e.note,
            version: J.version
          }), W(!1), w(), M(v(`结算单已作废，原始金额重新可选`))
        }
      }), J.state === `PENDING` && !N && g(`settlement.create`) && J.workflowVersion === 2 && (0, A.jsx)(`div`, {
        className: `dialog-footer`,
        children: (0, A.jsx)(x, {
          onClick: () => H(!0),
          children: v(`撤回结算单`)
        })
      }), V && (0, A.jsx)(y, {
        title: v(`撤回结算单`),
        fields: [{
          name: `note`,
          label: v(`撤回原因`),
          type: `textarea`,
          full: !0
        }],
        onClose: () => H(!1),
        onSubmit: async e => {
          await b(`/settlements/${i}/withdraw`, {
            approved: !1,
            note: e.note,
            version: J.version
          }), H(!1), w(), M(v(`已撤回，原始金额重新可选`))
        }
      }), G && X && (0, A.jsx)(ie, {
        settlement: J,
        onClose: () => K(!1),
        onSaved: () => {
          w(), M(v(`人工调整已保存，最终应付金额已更新`))
        }
      }), z && (0, A.jsx)(k.Suspense, {
        fallback: (0, A.jsx)(h, {}),
        children: (0, A.jsx)(j, {
          settlement: J,
          onClose: () => B(!1),
          onPayment: u
        })
      })]
    }) : R.error ? (0, A.jsx)(ne, {
      text: R.error,
      error: !0
    }) : (0, A.jsx)(h, {})
  })
}

function ie({
  settlement: t,
  onClose: n,
  onSaved: r
}) {
  return (0, A.jsx)(y, {
    title: v(`加减结算金额`),
    subtitle: `${t.code} · ${t.currency}`,
    fields: [{
      name: `businessDate`,
      label: v(`结算日期`),
      type: `date`,
      min: t.periodStart,
      max: t.periodEnd,
      full: !0
    }, {
      name: `amount`,
      label: v(`加减金额（{0}）`, [t.currency]),
      type: `number`,
      step: t.currency === `JPY` ? `1` : `0.01`,
      hint: v(`正数增加，负数扣减；不会修改原始金额和报价快照。`),
      full: !0
    }, {
      name: `note`,
      label: v(`调整说明`),
      type: `textarea`,
      full: !0
    }, {
      name: `supplierVisible`,
      label: v(`供应商是否可见`),
      type: `select`,
      options: [{
        value: `false`,
        label: v(`仅平台内部可见`)
      }, {
        value: `true`,
        label: v(`供应商可见`)
      }],
      hint: v(`供应商始终可见最终应收；选择仅内部可见时，不展示本条加减金额与说明。`),
      full: !0
    }],
    initial: {
      businessDate: t.periodStart,
      amount: ``,
      note: ``,
      supplierVisible: `false`,
      requestKey: crypto.randomUUID()
    },
    submitLabel: v(`保存调整`),
    onClose: n,
    extra: n => {
      if (t.confirmationDeadline && Date.parse(t.confirmationDeadline) <= Date.now()) return (0, A.jsx)(m, {
        tone: `amber`,
        children: v(`本单确认截止时间已到，请关闭弹窗并刷新结算单状态。`)
      });
      let r = /^-?\d+(?:\.\d+)?$/.test(n.amount);
      return (0, A.jsxs)(m, {
        children: [v(`当前最终应付：`), t.currency, ` `, e(t.total, t.currency), r && (0, A.jsxs)(A.Fragment, {
          children: [` `, v(`→ 调整后预览：`), t.currency, ` `, e(i([t.total, n.amount]), t.currency)]
        }), v(`。确认后金额冻结。 `)]
      })
    },
    onSubmit: async e => {
      if (t.confirmationDeadline && Date.parse(t.confirmationDeadline) <= Date.now()) throw Error(v(`本单确认截止时间已到，请关闭弹窗并刷新结算单状态`));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(e.businessDate) || e.businessDate < t.periodStart || e.businessDate > t.periodEnd) throw Error(v(`结算日期必须在本单结算期间内`));
      if (!(t.currency === `JPY` ? /^-?\d+$/ : /^-?\d+(?:\.\d{1,2})?$/).test(e.amount)) throw Error(t.currency === `JPY` ? v(`请输入整数加减金额`) : v(`加减金额最多保留两位小数`));
      if (a(e.amount, `0`) === 0) throw Error(v(`加减金额不能为零`));
      if (a(i([t.total, e.amount]), `0`) < 0) throw Error(v(`调整后的最终应付不能小于零`));
      let n = e.note.trim();
      if (!n) throw Error(v(`请填写调整说明`));
      await b(`/settlements/${t.id}/adjustments`, {
        businessDate: e.businessDate,
        amount: e.amount,
        note: n,
        supplierVisible: e.supplierVisible === `true`,
        version: t.version,
        requestKey: e.requestKey
      }), r()
    }
  })
}
export {
  M as SettlementDetail
};