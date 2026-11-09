// origin: assets/PaymentsTab-c0WtyzS3.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/PaymentForm-DYdHXH-C.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/usePaymentEvidence-DFI1SOk7.js", "assets/usePaymentEvidence-_R0G9P04.css"]))) => i.map(i => d[i]);
import {
  $ as e,
  A as t,
  B as n,
  C as r,
  G as i,
  M as a,
  P as o,
  S as s,
  V as c,
  X as l,
  Z as u,
  _ as d,
  c as f,
  f as p,
  g as m,
  h,
  i as g,
  l as _,
  mt as v,
  o as y,
  ot as b,
  p as x,
  rt as S,
  s as C,
  v as w,
  vt as T
} from "./index-Dnr0i-H9.js";
import {
  n as E,
  r as D,
  t as O
} from "./usePaymentEvidence-DFI1SOk7.js";
var k = T(u(), 1),
  A = l();

function j(e, t) {
  if (e.type === `text`) return (0, A.jsx)(k.Fragment, {
    children: e.text
  }, t);
  if (e.type === `br`) return (0, A.jsx)(`br`, {}, t);
  let n = e.children.map(j);
  switch (e.type) {
    case `doc`:
      return (0, A.jsx)(k.Fragment, {
        children: n
      }, t);
    case `paragraph`:
      return (0, A.jsx)(`p`, {
        children: n
      }, t);
    case `bold`:
      return (0, A.jsx)(`strong`, {
        children: n
      }, t);
    case `italic`:
      return (0, A.jsx)(`em`, {
        children: n
      }, t);
    case `underline`:
      return (0, A.jsx)(`u`, {
        children: n
      }, t);
    case `bulletList`:
      return (0, A.jsx)(`ul`, {
        children: n
      }, t);
    case `orderedList`:
      return (0, A.jsx)(`ol`, {
        children: n
      }, t);
    case `listItem`:
      return (0, A.jsx)(`li`, {
        children: n
      }, t);
    default:
      return null
  }
}

function M({
  value: e,
  canDownload: t
}) {
  return (0, A.jsxs)(`section`, {
    className: `payment-evidence-view`,
    children: [(0, A.jsx)(`h3`, {
      children: v(`付款说明与凭证`)
    }), D(e.content).trim() && (0, A.jsx)(`div`, {
      className: `payment-evidence-content`,
      children: j(e.content, 0)
    }), (0, A.jsx)(`div`, {
      className: `payment-evidence-files`,
      children: e.attachments.map(e => {
        let n = `/api/documents/${encodeURIComponent(e.id)}/download`;
        return (0, A.jsxs)(`div`, {
          className: `payment-evidence-file`,
          children: [t && e.contentType.startsWith(`image/`) && (0, A.jsx)(`a`, {
            href: n,
            target: `_blank`,
            rel: `noreferrer`,
            children: (0, A.jsx)(`img`, {
              src: n,
              alt: e.name,
              loading: `lazy`
            })
          }), (0, A.jsxs)(`div`, {
            children: [t ? (0, A.jsx)(`a`, {
              href: n,
              target: `_blank`,
              rel: `noreferrer`,
              children: e.name
            }) : (0, A.jsx)(`strong`, {
              children: e.name
            }), (0, A.jsxs)(`small`, {
              children: [(e.bytes / 1024).toFixed(1), ` KB`]
            })]
          })]
        }, e.id)
      })
    })]
  })
}

function N({
  payment: e,
  onUpdated: n
}) {
  let {
    notify: a,
    has: o
  } = r(), c = o(`payment.execute`), l = c || o(`payout.reconcile`), u = s(c && e.paymentMethod !== `OFFLINE` ? `/payments/providers` : null), [d, f] = (0, k.useState)(!1), [p, h] = (0, k.useState)(!1), [g, y] = (0, k.useState)(null), [w, T] = (0, k.useState)(!1), [E, D] = (0, k.useState)(``), O = g?.provider === `AIRWALLEX` ? v(`Airwallex 空中云汇`) : g?.provider === `BINANCE_USDT` ? `Binance USDT` : `OKX USDT`, j = g?.provider === `AIRWALLEX`;
  async function M() {
    T(!0), D(``);
    try {
      n(await S(`/payments/${e.id}/reconcile`, { version: e.version })), a(v(`已查询通道状态`))
    } catch (e) {
      D(e.message)
    } finally {
      T(!1)
    }
  }
  return (0, A.jsxs)(`section`, {
    className: `subsection`,
    children: [e.verificationMode === `SIMULATED` && (0, A.jsx)(m, {
      tone: `amber`,
      children: v(`这是一笔本地模拟付款，没有发生真实款项支出。`)
    }), c && u.error && (0, A.jsx)(m, {
      tone: `red`,
      children: u.error
    }), E && (0, A.jsx)(m, {
      tone: `red`,
      children: E
    }), c && e.state === `APPROVED` && e.reviewedBy && e.reviewedBy !== e.createdBy && (0, A.jsxs)(A.Fragment, {
      children: [!u.loading && !u.data?.length && (0, A.jsx)(m, {
        children: v(`当前未接入线上出款，仅支持独立审核后的线下登记。`)
      }), !!u.data?.length && (0, A.jsx)(`div`, {
        className: `dialog-footer`,
        children: (0, A.jsx)(C, {
          variant: `primary`,
          icon: `bank`,
          onClick: () => f(!0),
          children: v(`通过支付通道执行 `)
        })
      })]
    }), l && [`PROCESSING`, `UNKNOWN`].includes(e.state) && (0, A.jsxs)(A.Fragment, {
      children: [e.state === `UNKNOWN` && (0, A.jsx)(m, {
        tone: `amber`,
        children: v(`结果尚未核实，应付金额继续占用。请先查询，不要另建付款重复出款。 `)
      }), (0, A.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, A.jsx)(C, {
          disabled: w,
          onClick: M,
          children: v(w ? `查询中…` : `查询通道结果`)
        }), c && e.verificationMode === `SIMULATED` && e.externalRef && (0, A.jsx)(C, {
          onClick: () => h(!0),
          children: v(`模拟返回结果`)
        })]
      })]
    }), d && (0, A.jsx)(x, {
      title: v(`执行付款`),
      fields: [{
        name: `provider`,
        label: v(`支付通道`),
        type: `select`,
        full: !0,
        visual: `account`,
        options: (u.data || []).map(e => ({
          value: e.code,
          label: b(e.name),
          tone: e.simulated ? `draft` : `blue`
        }))
      }],
      initial: {
        provider: u.data?.length === 1 ? u.data[0].code : ``
      },
      extra: n => (0, A.jsxs)(m, {
        tone: u.data?.find(e => e.code === n.provider)?.simulated ? `amber` : `blue`,
        children: [v(`本次向供应商支付`), ` `, (0, A.jsxs)(`b`, {
          children: [e.payoutCurrency, ` `, t(e.payoutAmount, e.payoutCurrency)]
        }), v(`；抵扣应付 `), e.obligationCurrency, ` `, t(e.obligationAmount, e.obligationCurrency), v(`。 `), u.data?.find(e => e.code === n.provider)?.simulated ? v(`当前是本地模拟，绝不执行真实转账。`) : v(`执行后需等待支付机构核验结果。`)]
      }),
      onClose: () => f(!1),
      onSubmit: async t => {
        if(!u.data?.some(provider => provider.code === t.provider)) throw Error(v(`当前没有可执行的线上出款通道。`));
        if (u.data?.find(e => e.code === t.provider)?.simulated) {
          n(await S(`/payments/${e.id}/execute`, { ...t, version: e.version })), a(v(`本地模拟请求已受理，未发生真实出款`));
          return
        }
        let r = await S(`/payments/${e.id}/payout-preview`, { ...t, version: e.version });
        if (!r.executable) throw Error(v(`当前无法付款，请稍后重试`));
        y({
          provider: t.provider,
          data: r
        })
      },
      submitLabel: v(`生成执行预检`)
    }), g && (0, A.jsxs)(i, {
      title: v(`确认 {0} 出款`, [O]),
      onClose: () => !w && y(null),
      children: [(0, A.jsx)(_, {
        items: [
          [v(`收款目标`), g.data.recipientMasked],
          [v(`转账方式`), j ? g.data.transferMethod === `SWIFT` ? v(`国际汇款 SWIFT`) : v(`本地清算 LOCAL`) : g.data.transferType === `INTERNAL_UID` ? v(`OKX UID 内部转账`) : v(`链上转账`)], ...j ? [] : [
            [v(`网络`), g.data.network || v(`内部转账`)]
          ],
          [v(`供应商到账`), `${g.data.currency} ${t(g.data.amount,g.data.currency)}`], ...g.provider === `OKX_USDT` ? [
            [v(`预检结果`), v(`可以付款`)]
          ] : [
            [v(j ? `转账手续费` : `网络手续费`), `${g.data.currency} ${t(g.data.fee,g.data.currency)}`],
            [v(`平台总扣款`), `${g.data.currency} ${t(g.data.totalDebit,g.data.currency)}`],
            [v(`当前可用余额`), `${g.data.currency} ${t(g.data.availableBalance,g.data.currency)}`]
          ]
        ]
      }), (0, A.jsxs)(m, {
        tone: `amber`,
        children: [v(`确认后将发起真实 `), O, ` `, v(j ? `转账` : `提币`), v(`；受理不等于到账，结果不明时只能查单。 `)]
      }), (0, A.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, A.jsx)(C, {
          disabled: w,
          onClick: () => y(null),
          children: v(`取消 `)
        }), (0, A.jsx)(C, {
          variant: `primary`,
          disabled: w,
          onClick: async () => {
            T(!0), D(``);
            try {
              n(await S(`/payments/${e.id}/execute`, {
                provider: g.provider,
                version: e.version
              })), y(null), a(v(`请求已受理，请查看实际通道状态`))
            } catch (e) {
              D(e.message)
            } finally {
              T(!1)
            }
          },
          children: v(w ? `执行中…` : `确认执行本笔付款`)
        })]
      })]
    }), p && (0, A.jsx)(x, {
      title: v(`模拟支付返回（仅本地）`),
      fields: [{
        name: `status`,
        label: v(`模拟结果`),
        type: `select`,
        full: !0,
        options: [{
          value: `SUCCEEDED`,
          label: v(`模拟成功`),
          tone: `confirmed`
        }, {
          value: `FAILED`,
          label: v(`模拟确定失败`),
          tone: `rejected`
        }, {
          value: `UNKNOWN`,
          label: v(`模拟结果不明`),
          tone: `pending`
        }]
      }],
      initial: {
        status: `SUCCEEDED`,
        eventId: crypto.randomUUID()
      },
      onClose: () => h(!1),
      submitLabel: v(`提交模拟事件`),
      onSubmit: async t => {
        n(await S(`/payments/sandbox/events`, {
          paymentId: e.id,
          eventId: t.eventId,
          providerReference: e.externalRef,
          status: t.status,
          amount: e.payoutAmount,
          currency: e.payoutCurrency
        })), a(v(`模拟事件已处理，未发生实际出款`))
      }
    })]
  })
}
var P = (0, k.lazy)(() => g(() => import(`./PaymentForm-DYdHXH-C.js`), __vite__mapDeps([0, 1, 2, 3, 4])));

function F({
  initialPayment: a,
  settlementId: c = ``
}) {
  let {
    has: l,
    user: u,
    refresh: h,
    notify: g
  } = r(), b = !!u.supplierId, [T, E] = (0, k.useState)(1), [D, O] = (0, k.useState)(10), [j, P] = (0, k.useState)(a || null), [F, R] = (0, k.useState)(!1), [z, B] = (0, k.useState)(!1), [V, H] = (0, k.useState)(!1), [U, W] = (0, k.useState)(null), G = e => !b && l(`settlement.read`) && (l(`payment.create`) && l(`account.read`) || l(`payment.record`) && l(`file.write`)) && [`FAILED`, `CANCELLED`, `REJECTED`].includes(e.state), K = s(`/payments?page=${T}&size=${D}&settlementId=${encodeURIComponent(c)}`), q = a?.id || (!c && n(`tab`) === `payments` ? n(`id`) : ``);
  (0, k.useEffect)(() => {
    let t = !0;
    return q && e(`/payments/` + encodeURIComponent(q)).then(e => {
      t && P(e)
    }).catch(e => {
      t && g(e.message, !0)
    }), () => {
      t = !1
    }
  }, [q]);
  let J = t => {
    P(t), e(`/payments/` + encodeURIComponent(t.id)).then(e => P(n => n?.id === t.id ? e : n)).catch(e => g(e.message, !0))
  };
  return (0, A.jsxs)(A.Fragment, {
    children: [(0, A.jsxs)(`section`, {
      className: `panel`,
      children: [(0, A.jsx)(p, {
        actions: (0, A.jsx)(C, {
          icon: `refresh`,
          "aria-label": v(`刷新款项记录`),
          onClick: h
        }),
        children: (0, A.jsx)(`span`, {
          children: v(b ? `我的收款记录` : `付款记录`)
        })
      }), (0, A.jsx)(f, {
        data: K.data?.items || [],
        loading: K.loading,
        error: K.error,
        onRow: J,
        columns: [{
          label: v(b ? `对应账单 / 记录` : `供应商 / 付款单`),
          render: e => (0, A.jsxs)(`div`, {
            className: `stack`,
            children: [(0, A.jsx)(`strong`, {
              children: b ? e.settlementCode : e.supplierName
            }), (0, A.jsx)(`small`, {
              children: e.code
            })]
          })
        }, {
          label: v(b ? `本次应收抵扣` : `本次应付抵扣`),
          render: e => (0, A.jsxs)(`strong`, {
            className: `money`,
            children: [e.obligationCurrency, ` `, t(e.obligationAmount, e.obligationCurrency)]
          })
        }, {
          label: v(b ? `预计收款` : `付款金额`),
          render: e => (0, A.jsxs)(`div`, {
            className: `stack`,
            children: [(0, A.jsxs)(`strong`, {
              className: `money`,
              children: [e.payoutCurrency, ` `, t(e.payoutAmount, e.payoutCurrency)]
            }), (0, A.jsx)(`small`, {
              children: e.obligationCurrency === e.payoutCurrency ? v(`同币种`) : `1 ${e.obligationCurrency} = ${e.fxRate} ${e.payoutCurrency}`
            })]
          })
        }, {
          label: v(`付款时间`),
          render: e => e.state === `SUCCEEDED` && e.verificationMode !== `SIMULATED` ? (0, A.jsx)(`span`, {
            className: `mono`,
            title: e.statusUpdatedAt,
            children: o(e.statusUpdatedAt)
          }) : `—`
        }, {
          label: v(`平台付款状态`),
          render: e => (0, A.jsxs)(`div`, {
            className: `stack`,
            children: [(0, A.jsx)(y, {
              state: e.state
            }), e.paymentMethod === `OFFLINE` && (0, A.jsx)(`small`, {
              children: v(`线下付款 · 凭证登记`)
            }), e.verificationMode === `SIMULATED` && (0, A.jsx)(`small`, {
              children: v(`模拟 · 未真实出款`)
            })]
          })
        }, {
          label: v(`供应商收款状态`),
          render: e => (0, A.jsx)(y, {
            state: e.receiptState || `PENDING`,
            label: e.receiptState === `CONFIRMED` ? v(`已确认到账`) : e.receiptState === `DISPUTED` ? v(`有异议`) : v(`待确认到账`)
          })
        }, {
          label: v(`操作`),
          render: e => (0, A.jsxs)(`div`, {
            className: `row-actions`,
            children: [(0, A.jsx)(`button`, {
              className: `text-button`,
              onClick: () => J(e),
              children: b && e.state === `SUCCEEDED` && e.receiptState !== `CONFIRMED` ? v(`核对收款`) : v(`查看`)
            }), G(e) && (0, A.jsx)(`button`, {
              className: `text-button`,
              onClick: t => {
                t.stopPropagation(), W(e)
              },
              children: v(`重新申请付款`)
            })]
          })
        }]
      }), (0, A.jsx)(d, {
        data: K.data,
        page: T,
        onPage: E,
        size: D,
        onSizeChange: e => {
          O(e), E(1)
        }
      })]
    }), U && (0, A.jsx)(I, {
      payment: U,
      onClose: () => W(null),
      onPayment: e => {
        W(null), P(e), h()
      }
    }), j && (0, A.jsxs)(i, {
      drawer: !0,
      title: j.code,
      subtitle: j.supplierName,
      onClose: () => P(null),
      children: [(0, A.jsxs)(`div`, {
        className: `settlement-hero`,
        children: [(0, A.jsxs)(`div`, {
          children: [(0, A.jsx)(`span`, {
            children: v(b ? `本次收款` : `付款金额`)
          }), (0, A.jsxs)(`h2`, {
            children: [(0, A.jsx)(`small`, {
              children: j.payoutCurrency
            }), t(j.payoutAmount, j.payoutCurrency)]
          })]
        }), (0, A.jsx)(y, {
          state: j.state,
          label: j.verificationMode === `SIMULATED` ? v(`模拟 · `) + (j.state === `SUCCEEDED` ? v(`完成`) : j.state) : void 0
        })]
      }), (0, A.jsx)(_, {
        items: [
          [v(`对应结算单`), j.settlementCode || j.settlementId],
          [v(b ? `抵扣原币应收` : `抵扣原币应付`), `${j.obligationCurrency} ${t(j.obligationAmount,j.obligationCurrency)}`],
          [v(`汇率方向`), `1 ${j.obligationCurrency} = ${j.fxRate} ${j.payoutCurrency}`],
          [v(`汇率依据`), j.fxSource],
          [v(`付款方式`), j.paymentMethod === `OFFLINE` || j.verificationMode === `MANUAL` ? v(`线下付款`) : j.paymentMethod === `CHANNEL` ? v(`线上付款`) : v(`历史付款`)],
          [v(`转账流水号 / 凭证编号`), j.externalRef || (j.state === `SUCCEEDED` ? v(`未填写`) : v(`尚未登记`))],
          [v(`供应商到账确认`), j.receiptState === `CONFIRMED` ? v(`已确认到账`) : j.receiptState === `DISPUTED` ? v(`收款有异议`) : v(`尚未确认`)],
          [v(`收款备注`), j.receiptNote],
          [v(`确认时间`), o(j.receivedAt)]
        ]
      }), j.evidence ? (0, A.jsx)(M, {
        value: j.evidence,
        canDownload: l(`supplier.read`)
      }) : j.evidenceId && l(`supplier.read`) && (0, A.jsx)(`div`, {
        className: `dialog-footer`,
        children: (0, A.jsx)(`a`, {
          className: `text-button`,
          href: `/api/documents/${j.evidenceId}/download`,
          children: v(`查看 / 下载付款凭证 `)
        })
      }), !b && j.state === `SUCCEEDED` && j.receiptState !== `CONFIRMED` && (0, A.jsx)(m, {
        children: v(`平台已登记付款，等待供应商确认到账。`)
      }), !b && j.state === `PENDING` && l(`payment.review`) && j.createdBy !== u.id && (0, A.jsx)(w, {
        title: v(`付款申请审核`),
        onReview: async (e, t) => {
          await S(`/payments/${j.id}/review`, {
            approved: e,
            version: j.version,
            note: t
          }), h(), P(null), g(v(`付款审核已处理`))
        }
      }), b && j.state === `SUCCEEDED` && j.receiptState !== `CONFIRMED` && l(`payment.receipt`) && (0, A.jsx)(`div`, {
        className: `dialog-footer`,
        children: (0, A.jsx)(C, {
          variant: `primary`,
          onClick: () => B(!0),
          children: v(`核对到账情况 `)
        })
      }), G(j) && (0, A.jsx)(`div`, {
        className: `dialog-footer`,
        children: (0, A.jsx)(C, {
          variant: `primary`,
          onClick: () => W(j),
          children: v(`重新申请付款`)
        })
      }), !b && l(`payment.record`) && [`PENDING`, `APPROVED`].includes(j.state) && (0, A.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, A.jsx)(C, {
          onClick: () => H(!0),
          children: v(`作废申请`)
        }), j.state === `APPROVED` && j.reviewedBy && j.reviewedBy !== j.createdBy && (0, A.jsx)(C, {
          variant: `primary`,
          onClick: () => R(!0),
          children: v(`线下付款 / 上传凭证 `)
        })]
      }), !b && u.role === `ADMIN` && !u.supplierId && j.paymentMethod !== `OFFLINE` && (l(`payment.execute`) || l(`payout.reconcile`)) && (0, A.jsx)(N, {
        payment: j,
        onUpdated: e => {
          P(e), h()
        }
      }), z && (0, A.jsx)(x, {
        title: v(`核对到账情况`),
        fields: [{
          name: `confirmed`,
          label: v(`核对结果`),
          type: `select`,
          full: !0,
          options: [{
            value: `true`,
            label: v(`已核实到账`),
            tone: `confirmed`
          }, {
            value: `false`,
            label: v(`未到账或金额有异议`),
            tone: `rejected`
          }]
        }, {
          name: `note`,
          label: v(`说明`),
          type: `textarea`,
          full: !0,
          required: !1
        }],
        initial: {
          confirmed: `true`,
          note: ``
        },
        onClose: () => B(!1),
        onSubmit: async e => {
          await S(`/payments/${j.id}/receipt`, {
            confirmed: e.confirmed === `true`,
            note: e.note || ``
          }), P(null), h(), g(v(`收款核对已保存`))
        }
      }), V && (0, A.jsx)(x, {
        title: v(`作废付款申请`),
        fields: [{
          name: `state`,
          label: v(`处理结果`),
          type: `select`,
          options: [{
            value: `CANCELLED`,
            label: v(`作废申请`),
            tone: `withdrawn`
          }, ...j.paymentMethod === `CHANNEL` ? [] : [{
            value: `FAILED`,
            label: v(`付款失败`),
            tone: `rejected`
          }]]
        }, {
          name: `note`,
          label: v(`原因`),
          type: `textarea`,
          full: !0
        }],
        initial: {
          state: `CANCELLED`
        },
        onClose: () => H(!1),
        onSubmit: async e => {
          await S(`/payments/${j.id}/close`, { ...e, version: j.version }), P(null), h(), g(v(e.state === `CANCELLED` ? `申请已作废，金额占用已释放` : `申请已关闭，金额占用已释放`))
        }
      }), F && (0, A.jsx)(L, {
        payment: j,
        onClose: () => R(!1),
        onDone: () => {
          R(!1), P(null)
        }
      })]
    })]
  })
}

function I({
  payment: e,
  onClose: t,
  onPayment: n
}) {
  let r = s(`/settlements/${encodeURIComponent(e.settlementId)}`),
    o = r.data;
  return !r.loading && !r.error && o && o.state === `CONFIRMED` && o.supplierConfirmed && o.workflowVersion === 2 && a(c(o.total, o.reservedAmount, o.currency), `0`) > 0 ? (0, A.jsx)(k.Suspense, {
    fallback: (0, A.jsx)(h, {}),
    children: (0, A.jsx)(P, {
      settlement: o,
      onClose: t,
      onPayment: n
    })
  }) : (0, A.jsx)(i, {
    title: v(`重新申请付款`),
    onClose: t,
    children: r.loading ? (0, A.jsx)(h, {}) : r.error ? (0, A.jsxs)(m, {
      tone: `red`,
      children: [r.error, (0, A.jsx)(C, {
        onClick: r.reload,
        children: v(`重试`)
      })]
    }) : (0, A.jsx)(m, {
      children: v(`该结算单尚未确认或已无可申请付款金额，请刷新后核对。`)
    })
  })
}

function L({
  payment: e,
  onClose: t,
  onDone: n
}) {
  let {
    notify: a,
    refresh: o
  } = r(), s = O(), [c, l] = (0, k.useState)(``), [u, d] = (0, k.useState)(!1), [f, p] = (0, k.useState)(``), h = (0, k.useRef)(!1);
  return (0, A.jsx)(i, {
    title: v(`线下付款 / 上传凭证`),
    subtitle: v(`本申请已由独立审核人通过。请核对实际转账结果并上传真实凭证，登记后通知供应商确认到账。`),
    onClose: u ? () => {} : t,
    children: (0, A.jsxs)(`form`, {
      onSubmit: async t => {
        if (t.preventDefault(), !h.current) {
          h.current = !0, d(!0), p(``);
          try {
            let t = await s.prepare(e.supplierId);
            await S(`/payments/${e.id}/offline-record`, {
              externalRef: c,
              version: e.version,
              ...t
            }), o(), a(v(`付款结果已登记`)), n()
          } catch (e) {
            p(e.message)
          } finally {
            h.current = !1, d(!1)
          }
        }
      },
      children: [(0, A.jsxs)(`label`, {
        className: `field`,
        children: [(0, A.jsx)(`span`, {
          children: v(`转账流水号 / 凭证编号（选填）`)
        }), (0, A.jsx)(`input`, {
          disabled: u,
          maxLength: 160,
          value: c,
          onChange: e => l(e.target.value)
        })]
      }), (0, A.jsx)(E, {
        value: s,
        disabled: u
      }), f && (0, A.jsx)(m, {
        tone: `red`,
        children: f
      }), (0, A.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, A.jsx)(C, {
          type: `button`,
          onClick: t,
          children: v(`取消 `)
        }), (0, A.jsx)(C, {
          type: `submit`,
          variant: `primary`,
          disabled: u,
          children: v(u ? `正在登记…` : `确认登记`)
        })]
      })]
    })
  })
}
export {
  F as PaymentsTab
};
