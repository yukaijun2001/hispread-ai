// origin: assets/SettlementManagement-DAgYDp-f.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/SettlementInputs-CZ-QKlwM.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/systemLabels-DqpNuQ-_.js", "assets/projectOptions-RFlNxqPH.js", "assets/SettlementPreview-CEv04HyA.js", "assets/SettlementResourceTable-DOsIIJjV.js", "assets/DailyAccounting-z_8v-GqX.js", "assets/QueryFilters-CwGBc_NH.js", "assets/DateRangePicker-DtOG4QUZ.js", "assets/useSummaryRefresh-B-5uMwFV.js", "assets/MoneyDisplay-Bphc56N8.js", "assets/SupplierBills-BVKniq6z.js", "assets/SupplierBills-CGqfyoKg.css", "assets/ExchangeRatesTab-FzGMcdR6.js", "assets/PaymentsTab-c0WtyzS3.js", "assets/usePaymentEvidence-DFI1SOk7.js", "assets/usePaymentEvidence-_R0G9P04.css", "assets/SettlementDetail-B_4PzTZg.js", "assets/SettlementBatch-C6NFYAZd.js"]))) => i.map(i => d[i]);
import {
  A as e,
  B as t,
  C as n,
  G as r,
  I as i,
  M as a,
  P as o,
  S as s,
  T as c,
  V as l,
  X as u,
  Y as ee,
  Z as d,
  _ as te,
  a as ne,
  c as re,
  et as ie,
  f as ae,
  g as f,
  h as p,
  i as m,
  j as h,
  m as oe,
  mt as g,
  n as se,
  o as ce,
  p as le,
  pt as _,
  rt as v,
  s as y,
  tt as ue,
  u as b,
  vt as x,
  y as de,
  z as fe
} from "./index-Dnr0i-H9.js";
import {
  i as pe
} from "./QueryFilters-CwGBc_NH.js";
import {
  n as me,
  t as he
} from "./DateRangePicker-DtOG4QUZ.js";
import {
  t as ge
} from "./MoneyDisplay-Bphc56N8.js";
import {
  t as _e
} from "./projectOptions-RFlNxqPH.js";
var S = x(d(), 1),
  C = u();

function ve(e) {
  return e ? new Date(e).toLocaleString(_(), {
    timeZone: `Asia/Shanghai`,
    year: `numeric`,
    month: `2-digit`,
    day: `2-digit`,
    hour: `2-digit`,
    minute: `2-digit`,
    hour12: !1
  }) : `—`
}

function ye() {
  let e = new Date(`${h()}T12:00:00`);
  return e.setDate(e.getDate() - 1), `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`
}

function be() {
  let e = new Date(Date.now() + 432e6);
  return e.setMinutes(Math.ceil(e.getMinutes() / 15) * 15, 0, 0), new Date(e.getTime() - e.getTimezoneOffset() * 6e4).toISOString().slice(0, 16)
}

function xe(e) {
  let t = -new Date(e).getTimezoneOffset();
  return `${e}:00${t>=0?`+`:`-`}${String(Math.floor(Math.abs(t)/60)).padStart(2,`0`)}:${String(Math.abs(t)%60).padStart(2,`0`)}`
}

function Se({
  value: e,
  onChange: t
}) {
  let [n, r] = (0, S.useState)(``), [i, a] = (0, S.useState)(``), o = (0, S.useRef)(new Map);
  (0, S.useEffect)(() => {
    let e = window.setTimeout(() => a(n.trim()), 300);
    return () => window.clearTimeout(e)
  }, [n]);
  let s = pe(!0, ``, i);
  for (let e of s.data?.items || []) o.current.set(e.id, e);
  let c = n.trim() !== i || s.loading,
    l = o.current.get(e),
    u = c ? [] : s.data?.items || [];
  return (0, C.jsxs)(C.Fragment, {
    children: [(0, C.jsx)(b, {
      compact: !0,
      ariaLabel: g(`供应商`),
      visual: `supplier`,
      value: e,
      onChange: t,
      searchPlaceholder: g(`搜索供应商名称或编码`),
      onSearchChange: r,
      options: [{
        value: ``,
        label: g(`全部供应商`)
      }, ...c ? [{
        value: `__loading__`,
        label: g(`供应商加载中…`),
        disabled: !0
      }] : [], ...!c && !s.error && !u.length ? [{
        value: `__empty__`,
        label: g(`没有匹配的供应商`),
        disabled: !0
      }] : [], ...l && !u.some(t => t.id === e) ? [l] : [], ...u].map(e => `value` in e ? e : {
        value: e.id,
        label: e.name,
        detail: e.code
      })
    }), s.error && (0, C.jsx)(f, {
      tone: `red`,
      children: s.error
    })]
  })
}
var Ce = [...c, `EUR`, `HKD`, `SGD`, `JPY`, `GBP`],
  we = (0, S.lazy)(() => m(() => import(`./SettlementInputs-CZ-QKlwM.js`).then(e => ({
    default: e.SettlementInputs
  })), __vite__mapDeps([0, 1, 2, 3, 4]))),
  Te = (0, S.lazy)(() => m(() => import(`./SettlementInputs-CZ-QKlwM.js`).then(e => ({
    default: e.ReceiveAmountModal
  })), __vite__mapDeps([0, 1, 2, 3, 4]))),
  Ee = (0, S.lazy)(() => m(() => import(`./SettlementPreview-CEv04HyA.js`), __vite__mapDeps([5, 1, 2, 6])));

function w({
  tab: u
}) {
  let {
    has: d,
    user: m,
    refresh: h,
    notify: _
  } = n(), x = !!m.supplierId, [w, Ne] = (0, S.useState)(`USD`), [T, Pe] = (0, S.useState)(``), [Fe, Ie] = (0, S.useState)(``), [Le, Re] = (0, S.useState)(``), [ze, Be] = (0, S.useState)(``), [E, Ve] = (0, S.useState)(() => {
    let {
      from: e,
      to: t
    } = me()[1];
    return {
      from: e,
      to: t
    }
  }), [D, He] = (0, S.useState)(``), [Ue, O] = (0, S.useState)(1), [We, Ge] = (0, S.useState)(10), [Ke, k] = (0, S.useState)(u === `payments` || !d(`settlement.read`) ? null : t(`id`) || null), [A, j] = (0, S.useState)(!1), [qe, Je] = (0, S.useState)(!1), [Ye, Xe] = (0, S.useState)(null), [M, N] = (0, S.useState)(null), [P, F] = (0, S.useState)(!1), [I, L] = (0, S.useState)(!1), [R, Ze] = (0, S.useState)(``), z = new URLSearchParams({
    search: D,
    supplierId: Fe,
    currency: T,
    state: Le,
    paymentProgress: ze,
    periodStart: E.from,
    periodEnd: E.to
  }).toString(), [Qe, B] = (0, S.useState)({
    scope: ``,
    ids: []
  });
  (0, S.useEffect)(() => B({
    scope: z,
    ids: []
  }), [z]);
  let V = Qe.scope === z ? Qe.ids : [],
    [H, $e] = (0, S.useState)(!1),
    et = (0, S.useRef)(!1),
    tt = (e, t) => {
      B(n => {
        let r = new Set(n.scope === z ? n.ids : []);
        return e.forEach(e => t ? r.add(e) : r.delete(e)), {
          scope: z,
          ids: [...r]
        }
      })
    },
    nt = async e => {
      if (!et.current) {
        et.current = !0, $e(!0);
        try {
          await ue(z, e ? [] : V), _(g(`结算单已导出`))
        } catch (e) {
          _(e instanceof Error ? e.message : g(`导出失败，请重试`), !0)
        } finally {
          et.current = !1, $e(!1)
        }
      }
    }, [rt, it] = (0, S.useState)(new Set), at = async e => {
      if (!rt.has(e)) {
        it(t => new Set(t).add(e));
        try {
          await ie(e)
        } catch (e) {
          _(e instanceof Error ? e.message : g(`导出失败，请重试`), !0)
        } finally {
          it(t => {
            let n = new Set(t);
            return n.delete(e), n
          })
        }
      }
    };
  (0, S.useEffect)(() => {
    if (R.trim() === D) return;
    let e = window.setTimeout(() => {
      He(R.trim()), O(1)
    }, 300);
    return () => window.clearTimeout(e)
  }, [R, D]);
  let [U, ot] = (0, S.useState)(``), [st, ct] = (0, S.useState)(``), lt = (0, S.useRef)(new Map);
  (0, S.useEffect)(() => {
    let e = window.setTimeout(() => ct(U.trim()), 300);
    return () => window.clearTimeout(e)
  }, [U]), (0, S.useEffect)(() => {
    !A && !P && !I && (ot(``), ct(``), lt.current.clear())
  }, [A, P, I]);
  let W = s(u === `statements` ? `/settlements/summary?currency=` + w : null),
    ut = T || w,
    dt = new URLSearchParams(z);
  dt.set(`currency`, ut);
  let G = s(u === `statements` ? `/settlements/pending-summary?${dt}` : null),
    ft = G.loading || G.error ? void 0 : G.data,
    K = s(u === `statements` ? `/settlements?${z}&page=${Ue}&size=${We}` : null),
    q = pe(!x && (A || P || I) && d(`supplier.read`)),
    J = pe(!x && (A || P || I) && d(`supplier.read`) && !!st, `APPROVED`, st);
  for (let e of J.data?.items || []) lt.current.set(e.id, e);
  let Y = !!U.trim(),
    X = Y && (U.trim() !== st || J.loading),
    pt = Y ? X ? [] : J.data?.items || [] : [...new Map([...q.data?.items || [], ...lt.current.values()].map(e => [e.id, e])).values()],
    mt = {
      name: `supplierId`,
      label: g(`供应商`),
      type: `select`,
      visual: `supplier`,
      full: !0,
      searchPlaceholder: g(`搜索供应商名称或编码`),
      onSearchChange: ot,
      searchLoading: X,
      searchError: Y && !X ? J.error : ``,
      searchEmptyText: Y && !X && !pt.some(e => e.state === `APPROVED` && e.enabled) ? g(`没有匹配的供应商`) : ``,
      options: pt.filter(e => e.state === `APPROVED` && e.enabled).map(e => ({
        value: e.id,
        label: e.name,
        detail: e.code
      }))
    },
    Z = s(!x && (A || P || I) && d(`project.read`) ? `/projects?size=100` : null),
    ht = d(`supplier.read`) && d(`project.read`),
    gt = q.error || Z.error,
    Q = ht && !q.loading && !Z.loading && !gt && !!q.data && !!Z.data,
    _t = () => {
      j(!1), F(!1), L(!1)
    },
    vt = e => {
      k(null), d(`payment.read`) && i(`settlements?tab=payments&id=${encodeURIComponent(e.id)}&settlementId=${encodeURIComponent(e.settlementId)}`)
    },
    $ = W.error ? void 0 : W.data,
    yt = () => {
      Pe(ut), Re(`PENDING`), O(1)
    };
  return (0, C.jsxs)(C.Fragment, {
    children: [(0, C.jsxs)(oe, {
      title: se(m).find(e => e.id === u)?.label || ``,
      children: [!x && d(`usage.import`) && (0, C.jsx)(y, {
        icon: `plus`,
        onClick: () => L(!0),
        children: g(`录入手工款 `)
      }), !x && d(`usage.import`) && (0, C.jsxs)(y, {
        icon: `upload`,
        onClick: () => F(!0),
        title: g(`现行系统自动接入待完成；当前仅支持平台人工接收`),
        children: [g(`接收外部金额 `), (0, C.jsx)(`span`, {
          className: `action-pending-mark`,
          children: g(`待完成`)
        })]
      }), !x && d(`settlement.create`) && (0, C.jsx)(y, {
        onClick: () => j(!0),
        children: g(`单张新建`)
      }), !x && d(`settlement.create`) && (0, C.jsx)(y, {
        variant: `primary`,
        icon: `plus`,
        onClick: () => Je(!0),
        children: g(`批量新建结算单 `)
      })]
    }), qe && !x && d(`settlement.create`) && (0, C.jsx)(S.Suspense, {
      fallback: (0, C.jsx)(p, {}),
      children: (0, C.jsx)(Me, {
        open: qe,
        onClose: () => Je(!1),
        onSettlement: k
      })
    }), u === `daily` && x && d(`settlement.read`) && (0, C.jsx)(S.Suspense, {
      fallback: (0, C.jsx)(p, {}),
      children: (0, C.jsx)(Oe, {})
    }), u === `daily` && !x && d(`usage.read`) && (0, C.jsx)(S.Suspense, {
      fallback: (0, C.jsx)(p, {}),
      children: (0, C.jsx)(De, {
        onOpenPeriods: () => i(`settlements?tab=inputs`)
      })
    }), u === `statements` && (0, C.jsxs)(C.Fragment, {
      children: [(0, C.jsxs)(`div`, {
        className: `stats-caption`,
        children: [(0, C.jsx)(`span`, {
          children: g(x ? `应收汇总` : `应付汇总`)
        }), (0, C.jsx)(b, {
          ariaLabel: g(`统计币种`),
          visual: `currency`,
          value: w,
          onChange: Ne,
          options: Ce.map(e => ({
            value: e,
            label: e
          }))
        })]
      }), (0, C.jsx)(`div`, {
        className: `stat-grid settlement-stat-grid`,
        children: [{
          label: g(`历史未结算金额`),
          value: $?.unsettledPayable,
          icon: `wallet`,
          tone: `blue`,
          history: !0
        }, {
          label: g(x ? `待确认金额` : `待供应商确认`),
          value: ft?.pendingTotal,
          icon: `clock`,
          tone: `amber`,
          pending: !0
        }, {
          label: g(x ? `已确认应收` : `已确认应付`),
          value: $?.total,
          icon: `wallet`,
          tone: `blue`
        }, {
          label: g(x ? `已确认收款` : `已完成付款`),
          value: x ? $?.received : $?.paid,
          icon: `bank`,
          tone: `teal`
        }, {
          label: g(x ? `待确认收款` : `待付金额`),
          value: $ ? l($.total, x ? $.received : $.paid, w) : void 0,
          icon: `clock`,
          tone: `amber`
        }].map(e => (0, C.jsxs)(`div`, {
          className: `stat-card ` + e.tone,
          children: [(0, C.jsxs)(`div`, {
            className: `stat-top`,
            children: [(0, C.jsx)(`span`, {
              children: e.label
            }), (0, C.jsx)(`span`, {
              className: `stat-icon`,
              children: (0, C.jsx)(ee, {
                name: e.icon,
                size: 19
              })
            })]
          }), (0, C.jsx)(`div`, {
            className: `stat-number`,
            children: (0, C.jsx)(ge, {
              currency: e.pending ? ut : w,
              value: e.value
            })
          }), e.history && (0, C.jsx)(`div`, {
            className: `stat-foot`,
            children: g(`全部历史已入账、尚未生成结算单的金额`)
          }), e.pending && (0, C.jsx)(`div`, {
            className: `stat-foot`,
            children: (0, C.jsx)(`button`, {
              className: `text-button`,
              "aria-label": g(`查看待确认结算单`),
              onClick: yt,
              disabled: G.loading || !!G.error,
              children: ft ? g(`{0} 笔待确认 · 查看`, [ft.pendingCount]) : `—`
            })
          })]
        }, e.label))
      }), W.error && (0, C.jsx)(f, {
        tone: `red`,
        children: W.error
      }), G.error && (0, C.jsx)(f, {
        tone: `red`,
        children: G.error
      }), (0, C.jsxs)(`section`, {
        className: `panel settlement-bills-panel`,
        children: [(0, C.jsxs)(ae, {
          actions: (0, C.jsxs)(C.Fragment, {
            children: [d(`settlement.export`) && (0, C.jsxs)(C.Fragment, {
              children: [(0, C.jsx)(y, {
                icon: `download`,
                onClick: () => void nt(!0),
                disabled: H || K.loading || !!K.error || !K.data?.total || R.trim() !== D,
                title: g(`导出当前筛选下的全部结算单，包含所有分页`),
                children: g(H ? `正在导出…` : `导出筛选结果`)
              }), (0, C.jsx)(y, {
                icon: `download`,
                onClick: () => void nt(!1),
                disabled: H || K.loading || !!K.error || !V.length || R.trim() !== D,
                children: g(`批量导出已选（{0}）`, [V.length])
              }), V.length > 0 && (0, C.jsx)(y, {
                onClick: () => B({
                  scope: z,
                  ids: []
                }),
                children: g(`清空选择`)
              })]
            }), (0, C.jsx)(y, {
              icon: `refresh`,
              onClick: h,
              "aria-label": g(`刷新结算单`)
            })]
          }),
          children: [(0, C.jsx)(de, {
            value: R,
            onChange: Ze,
            placeholder: g(x ? `搜索结算单号` : `搜索供应商或结算单号`)
          }), !x && d(`supplier.read`) && (0, C.jsx)(Se, {
            value: Fe,
            onChange: e => {
              Ie(e), O(1)
            }
          }), (0, C.jsx)(b, {
            ariaLabel: g(`结算币种筛选`),
            visual: `currency`,
            value: T,
            onChange: e => {
              Pe(e), O(1)
            },
            options: [{
              value: ``,
              label: g(`全部币种`)
            }, ...Ce.map(e => ({
              value: e,
              label: e
            }))]
          }), (0, C.jsx)(b, {
            ariaLabel: g(`结算状态`),
            value: Le,
            onChange: e => {
              Re(e), O(1)
            },
            options: [{
              value: ``,
              label: g(`全部状态`)
            }, {
              value: `PENDING`,
              label: g(x ? `待确认` : `待供应商确认`),
              tone: `pending`
            }, {
              value: `CONFIRMED`,
              label: g(`已确认`),
              tone: `confirmed`
            }, {
              value: `REJECTED`,
              label: g(`有金额异议`),
              tone: `rejected`
            }, {
              value: `WITHDRAWN`,
              label: g(`已撤回`),
              tone: `withdrawn`
            }, {
              value: `VOID`,
              label: g(`已作废`),
              tone: `void`
            }]
          }), (0, C.jsx)(b, {
            ariaLabel: g(x ? `收款进度` : `付款进度`),
            value: ze,
            onChange: e => {
              Be(e), O(1)
            },
            options: [{
              value: ``,
              label: g(x ? `全部收款进度` : `全部付款进度`)
            }, {
              value: `UNPAID`,
              label: g(x ? `待收款` : `待付款`),
              tone: `pending`
            }, {
              value: `PARTIAL`,
              label: g(x ? `部分已收款` : `部分付款`),
              tone: `approved`
            }, {
              value: `PAID`,
              label: g(x ? `全额已收款` : `已付清`),
              tone: `confirmed`
            }]
          })]
        }), (0, C.jsxs)(`div`, {
          className: `settlement-period-filter`,
          children: [(0, C.jsx)(`span`, {
            children: g(`结算周期`)
          }), (0, C.jsx)(he, {
            from: E.from,
            to: E.to,
            label: g(`结算周期`),
            onChange: (e, t) => {
              Ve({
                from: e,
                to: t
              }), O(1)
            }
          }), (E.from || E.to) && (0, C.jsx)(y, {
            onClick: () => {
              Ve({
                from: ``,
                to: ``
              }), O(1)
            },
            children: g(`清除筛选`)
          }), (0, C.jsx)(`small`, {
            children: g(`显示与所选周期有交集的结算单（含起止当天）。`)
          })]
        }), (0, C.jsx)(re, {
          data: K.data?.items || [],
          loading: K.loading,
          error: K.error,
          onRow: e => k(e.id),
          columns: [...d(`settlement.export`) ? [{
            className: `settlement-selection-column`,
            label: (0, C.jsx)(`input`, {
              type: `checkbox`,
              "aria-label": g(`选择本页结算单`),
              disabled: K.loading || !!K.error || !K.data?.items.length,
              checked: !!K.data?.items.length && K.data.items.every(e => V.includes(e.id)),
              ref: e => {
                e && (e.indeterminate = !!K.data?.items.some(e => V.includes(e.id)) && !K.data.items.every(e => V.includes(e.id)))
              },
              onChange: e => tt((K.data?.items || []).map(e => e.id), e.target.checked)
            }),
            render: e => (0, C.jsx)(`input`, {
              type: `checkbox`,
              "aria-label": g(`选择结算单 {0}`, [e.code]),
              checked: V.includes(e.id),
              onClick: e => e.stopPropagation(),
              onChange: t => tt([e.id], t.target.checked)
            })
          }] : [], {
            label: g(x ? `结算单` : `供应商 / 结算单`),
            className: `settlement-identity-column`,
            render: (e, t) => (0, C.jsxs)(`div`, {
              className: `identity`,
              children: [!x && (0, C.jsx)(ne, {
                name: e.supplierName,
                index: t
              }), (0, C.jsxs)(`div`, {
                children: [(0, C.jsx)(`strong`, {
                  children: x ? e.code : e.supplierName
                }), (0, C.jsx)(`small`, {
                  children: x ? e.projectName : e.code
                })]
              })]
            })
          }, ...x ? [] : [{
            label: g(`项目`),
            render: e => (0, C.jsx)(`span`, {
              children: e.projectName || g(`历史多项目结算`)
            })
          }], {
            label: g(`结算期间`),
            render: e => (0, C.jsxs)(`div`, {
              className: `stack mono`,
              children: [(0, C.jsx)(`span`, {
                children: e.periodStart
              }), (0, C.jsxs)(`small`, {
                children: [g(`至 `), e.periodEnd]
              })]
            })
          }, {
            label: g(`创建时间`),
            render: e => (0, C.jsx)(`time`, {
              className: `stack mono`,
              dateTime: e.createdAt,
              children: ve(e.createdAt).split(` `).map((e, t) => t === 0 ? (0, C.jsx)(`span`, {
                children: e.replace(/,$/, ``)
              }, t) : (0, C.jsx)(`small`, {
                children: e
              }, t))
            })
          }, {
            label: g(`原始金额`),
            className: `align-right`,
            render: t => (0, C.jsx)(`span`, {
              className: `money`,
              children: t.originalTotal == null ? g(`历史未记录`) : (0, C.jsxs)(C.Fragment, {
                children: [(0, C.jsx)(`span`, {
                  children: t.currency
                }), e(t.originalTotal, t.currency)]
              })
            })
          }, {
            label: g(x ? `最终应收` : `最终应付`),
            className: `align-right`,
            render: t => (0, C.jsxs)(`strong`, {
              className: `money`,
              children: [(0, C.jsx)(`span`, {
                children: t.currency
              }), e(t.total, t.currency)]
            })
          }, {
            label: g(`结算状态`),
            render: e => (0, C.jsxs)(`div`, {
              className: `stack`,
              children: [(0, C.jsx)(ce, {
                state: e.state,
                label: e.confirmationMode === `AUTO_DEADLINE` ? g(`逾期自动确认`) : e.state === `PENDING` ? g(`待供应商确认`) : void 0
              }), e.state === `PENDING` && e.confirmationDeadline && (0, C.jsxs)(`small`, {
                children: [g(`截止 `), o(e.confirmationDeadline)]
              })]
            })
          }, {
            label: g(x ? `收款进度` : `付款进度`),
            render: e => (0, C.jsx)(ce, {
              state: x ? a(e.receivedAmount, e.total) >= 0 && e.state === `CONFIRMED` ? `CONFIRMED` : `PENDING` : fe(e),
              label: e.state === `PENDING` ? g(`待确认金额`) : x ? a(e.receivedAmount, e.total) >= 0 && e.state === `CONFIRMED` ? g(`全额已收款`) : a(e.receivedAmount, `0`) > 0 ? g(`部分已收款`) : g(`待收款`) : void 0
            })
          }, {
            label: g(`操作`),
            render: e => (0, C.jsxs)(`div`, {
              className: `row-actions`,
              children: [(0, C.jsx)(`button`, {
                type: `button`,
                className: `text-button`,
                onClick: () => k(e.id),
                children: e.state === `PENDING` ? g(`核对`) : g(`查看`)
              }), d(`settlement.export`) && (0, C.jsx)(`button`, {
                type: `button`,
                className: `text-button`,
                disabled: rt.has(e.id),
                "aria-label": g(`导出结算单 {0}`, [e.code]),
                onClick: t => {
                  t.stopPropagation(), at(e.id)
                },
                children: rt.has(e.id) ? g(`导出中…`) : g(`导出`)
              })]
            })
          }]
        }), (0, C.jsx)(te, {
          data: K.data,
          loading: K.loading,
          queryKey: z,
          page: Ue,
          onPage: O,
          size: We,
          onSizeChange: e => {
            Ge(e), O(1)
          }
        })]
      })]
    }), u === `inputs` && !x && d(`usage.read`) && (0, C.jsx)(S.Suspense, {
      fallback: (0, C.jsx)(p, {}),
      children: (0, C.jsx)(we, {})
    }), u === `payments` && d(`payment.read`) && (0, C.jsx)(S.Suspense, {
      fallback: (0, C.jsx)(p, {}),
      children: (0, C.jsx)(Ae, {
        settlementId: t(`settlementId`)
      })
    }), u === `rates` && d(`exchange_rate.read`) && (0, C.jsx)(S.Suspense, {
      fallback: (0, C.jsx)(p, {}),
      children: (0, C.jsx)(ke, {
        supplierSide: x
      })
    }), Ke && (0, C.jsx)(S.Suspense, {
      fallback: (0, C.jsx)(p, {}),
      children: (0, C.jsx)(je, {
        id: Ke,
        onClose: () => k(null),
        onPayment: vt
      })
    }), (A || P || I) && !Q && (0, C.jsx)(r, {
      title: g(A ? `新建结算单` : I ? `录入手工应付依据` : `接收原始金额`),
      onClose: _t,
      children: ht ? gt ? (0, C.jsxs)(f, {
        tone: `red`,
        children: [g(`供应商或项目加载失败：`), gt, ` `, (0, C.jsx)(`button`, {
          className: `text-button`,
          onClick: h,
          children: g(`重新加载选项 `)
        })]
      }) : (0, C.jsx)(p, {}) : (0, C.jsx)(f, {
        tone: `red`,
        children: g(`当前账号缺少读取供应商或项目的权限，无法填写此表单。`)
      })
    }), A && Q && (0, C.jsx)(le, {
      title: g(`新建结算单`),
      fields: [{
        ...mt,
        section: g(`结算对象`)
      }, {
        name: `projectId`,
        section: g(`结算对象`),
        label: g(`项目`),
        type: `select`,
        visual: `project`,
        full: !0,
        options: (Z.data?.items || []).map((e, t, n) => _e(e, n))
      }, {
        name: `periodStart`,
        section: g(`结算期间`),
        label: g(`来源开始日期`),
        type: `date`
      }, {
        name: `periodEnd`,
        section: g(`结算期间`),
        label: g(`来源结束日期`),
        type: `date`
      }, {
        name: `confirmationDeadline`,
        section: g(`结算期间`),
        label: g(`供应商确认截止时间`),
        type: `datetime-local`,
        full: !0,
        hint: g(`截止时间前可确认或提出异议；逾期未处理将按无异议自动确认。`)
      }, {
        name: `currency`,
        section: g(`结算金额`),
        label: g(`应付币种`),
        type: `select`,
        visual: `currency`,
        options: c.map(e => ({
          value: e,
          label: e
        }))
      }],
      initial: Ye || {
        periodStart: ye(),
        periodEnd: ye(),
        confirmationDeadline: be(),
        currency: `USD`,
        requestKey: crypto.randomUUID()
      },
      onClose: () => j(!1),
      submitLabel: g(`预览结算单`),
      submitDisabled: X || Y && !!J.error,
      extra: () => (0, C.jsx)(f, {
        children: g(`按已生成的日账汇总金额结算，正式生成后冻结本单金额。`)
      }),
      onSubmit: async e => {
        let t = {
            supplierId: e.supplierId,
            projectId: e.projectId,
            periodStart: e.periodStart,
            periodEnd: e.periodEnd,
            currency: e.currency,
            requestKey: e.requestKey,
            inputIds: [],
            basisMode: `DAILY_SUMMARY`,
            confirmationDeadline: xe(e.confirmationDeadline)
          },
          n = await v(`/settlements/preview`, t);
        Xe({
          ...e
        }), N({
          document: n,
          request: {
            ...t,
            expectedSnapshotHash: n.snapshotHash
          }
        })
      }
    }), M && (0, C.jsx)(S.Suspense, {
      fallback: (0, C.jsx)(p, {}),
      children: (0, C.jsx)(Ee, {
        initialDocument: M.document,
        loadPage: (e, t) => v(`/settlements/preview?page=${e}&size=${t}`, M.request),
        onClose: () => N(null),
        onBack: () => {
          N(null), j(!0)
        },
        onConfirm: async () => {
          let e = await v(`/settlements`, M.request);
          N(null), Xe(null), h(), _(g(`已发起结算，等待供应商确认金额`)), k(e.id)
        }
      })
    }), P && Q && (0, C.jsx)(S.Suspense, {
      fallback: (0, C.jsx)(p, {}),
      children: (0, C.jsx)(Te, {
        supplierField: mt,
        projects: Z.data?.items || [],
        onClose: () => F(!1)
      })
    }), I && Q && (0, C.jsx)(S.Suspense, {
      fallback: (0, C.jsx)(p, {}),
      children: (0, C.jsx)(Te, {
        supplierField: mt,
        projects: Z.data?.items || [],
        mode: `manual`,
        onClose: () => L(!1)
      })
    })]
  })
}
var De = (0, S.lazy)(() => m(() => import(`./DailyAccounting-z_8v-GqX.js`), __vite__mapDeps([7, 1, 2, 8, 9, 10, 11]))),
  Oe = (0, S.lazy)(() => m(() => import(`./SupplierBills-BVKniq6z.js`), __vite__mapDeps([12, 1, 2, 9, 10, 11, 13]))),
  ke = (0, S.lazy)(() => m(() => import(`./ExchangeRatesTab-FzGMcdR6.js`).then(e => ({
    default: e.ExchangeRatesTab
  })), __vite__mapDeps([14, 1, 2]))),
  Ae = (0, S.lazy)(() => m(() => import(`./PaymentsTab-c0WtyzS3.js`).then(e => ({
    default: e.PaymentsTab
  })), __vite__mapDeps([15, 1, 2, 16, 17]))),
  je = (0, S.lazy)(() => m(() => import(`./SettlementDetail-B_4PzTZg.js`).then(e => ({
    default: e.SettlementDetail
  })), __vite__mapDeps([18, 1, 2, 3, 6]))),
  Me = (0, S.lazy)(() => m(() => import(`./SettlementBatch-C6NFYAZd.js`), __vite__mapDeps([19, 1, 2])));
export {
  w as SettlementManagement, ve as t
};