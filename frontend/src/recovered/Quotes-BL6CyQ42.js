// origin: assets/Quotes-BL6CyQ42.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/ApprovedQuoteRejection-7MD8D-Rd.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/QuotePeriodPanel-D3BWLIuY.js", "assets/DateRangePicker-DtOG4QUZ.js", "assets/systemLabels-DqpNuQ-_.js", "assets/quoteHelpers-Fmn-ErWD.js", "assets/QuotePriceHistory-MZUPeopf.js", "assets/QuoteRankingResults-cj8V1Hgu.js"]))) => i.map(i => d[i]);
import {
  $ as e,
  A as t,
  B as n,
  C as r,
  E as i,
  F as a,
  G as o,
  I as ee,
  O as s,
  P as c,
  S as l,
  X as u,
  Y as te,
  Z as d,
  _ as ne,
  _t as f,
  b as re,
  c as ie,
  ct as p,
  d as m,
  ft as h,
  g,
  h as _,
  i as v,
  it as ae,
  j as y,
  l as oe,
  lt as se,
  m as ce,
  mt as b,
  o as le,
  pt as x,
  rt as ue,
  s as S,
  u as C,
  v as de,
  vt as fe,
  x as pe,
  y as me
} from "./index-Dnr0i-H9.js";
import {
  i as he,
  r as ge
} from "./QueryFilters-CwGBc_NH.js";
import {
  t as _e
} from "./DateRangePicker-DtOG4QUZ.js";
import {
  i as w,
  t as ve
} from "./systemLabels-DqpNuQ-_.js";
import {
  t as ye
} from "./projectOptions-RFlNxqPH.js";
import {
  a as be,
  i as xe,
  m as Se,
  n as Ce,
  o as we,
  p as Te,
  r as T,
  s as Ee,
  u as De
} from "./quoteHelpers-Fmn-ErWD.js";
var E = fe(d(), 1),
  D = u();

function Oe({
  value: e,
  currency: t,
  unit: n,
  referenceRates: i,
  loading: a,
  error: o
}) {
  let {
    has: ee
  } = r(), s = t === `USD`, c = h(e, t, `USD`, i);
  return (0, D.jsxs)(`div`, {
    className: `quote-cny-preview`,
    "aria-live": `polite`,
    children: [!e || !T.test(e) ? (0, D.jsx)(`small`, {
      children: b(`输入有效价格后显示折扣后金额`)
    }) : !s && a ? (0, D.jsx)(`small`, {
      children: b(`正在读取参考汇率…`)
    }) : !s && o ? (0, D.jsx)(`small`, {
      className: `error-text`,
      children: b(`参考汇率读取失败`)
    }) : !s && !ee(`exchange_rate.read`) ? (0, D.jsx)(`small`, {
      children: b(`无参考汇率查看权限`)
    }) : c ? (0, D.jsxs)(D.Fragment, {
      children: [(0, D.jsx)(`strong`, {
        children: b(n ? `参考金额约 {0} {1}` : `折扣后约 {0} {1}`, [`USD`, c])
      }), (0, D.jsxs)(`span`, {
        children: [`/ `, n || `1 ${t}`]
      }), (0, D.jsx)(`small`, {
        children: b(`仅供参考`)
      })]
    }) : (0, D.jsx)(`small`, {
      children: b(`暂无 {0} → {1} 当前参考汇率`, [t, `USD`])
    }), !n && T.test(e) && (0, D.jsx)(`small`, {
      children: b(`按原金额的 {0}% 计价`, [p(e)])
    })]
  })
}
var ke = f({
    default: () => O,
    outsideMultiplierRange: () => be
  }),
  Ae = (0, E.lazy)(() => v(() => import(`./ApprovedQuoteRejection-7MD8D-Rd.js`).then(e => ({
    default: e.ApprovedQuoteRejection
  })), __vite__mapDeps([0, 1, 2]))),
  je = (0, E.lazy)(() => v(() => import(`./QuotePeriodPanel-D3BWLIuY.js`).then(e => ({
    default: e.QuotePeriodPanel
  })), __vite__mapDeps([3, 1, 2, 4, 5, 6]))),
  Me = (0, E.lazy)(() => v(() => import(`./QuotePriceHistory-MZUPeopf.js`).then(e => ({
    default: e.QuotePriceHistory
  })), __vite__mapDeps([7, 1, 2, 5, 6]))),
  Ne = (0, E.lazy)(() => v(() => import(`./QuoteRankingResults-cj8V1Hgu.js`).then(e => ({
    default: e.QuoteRankingResults
  })), __vite__mapDeps([8, 1, 2, 5])));

function O() {
  let {
    has: u,
    user: d,
    refresh: f,
    notify: h
  } = r(), v = !!d.supplierId, [fe, ke] = (0, E.useState)(``), [O, Pe] = (0, E.useState)(``), [Fe, Ie] = (0, E.useState)(``), [Le, Re] = (0, E.useState)(``), [ze, Be] = (0, E.useState)(`USD`), [Ve, He] = (0, E.useState)(``), [Ue, We] = (0, E.useState)(`CURRENT`), [Ge, k] = (0, E.useState)(1), [Ke, qe] = (0, E.useState)(10), [A, Je] = (0, E.useState)(`list`), [Ye, Xe] = (0, E.useState)([]), [j, Ze] = (0, E.useState)(``), [Qe, $e] = (0, E.useState)(``), [et, tt] = (0, E.useState)(y()), [M, N] = (0, E.useState)(null), [P, nt] = (0, E.useState)(!1), [F, rt] = (0, E.useState)(``), I = (0, E.useRef)(0), [it, at] = (0, E.useState)(null), [L, R] = (0, E.useState)(null), [ot, z] = (0, E.useState)(!1), [st, B] = (0, E.useState)(``), V = (0, E.useRef)(0), [H, U] = (0, E.useState)([]), ct = (0, E.useRef)(new Set), lt = new URLSearchParams({
    search: fe,
    supplier: v ? `` : O,
    project: Fe,
    pricingType: Le,
    currency: ze,
    state: Ue,
    onDate: Ve,
    page: String(Ge),
    size: String(Ke)
  }), W = l(v || A === `list` ? `/quotes?${lt.toString()}` : null, 15e3), G = he(u(`supplier.read`)), ut = l(`/projects?size=100`), K = l(u(`exchange_rate.read`) ? `/exchange-rates/current` : null, 3e4), q = l(u(`quote.read`) ? `/quotes/multiplier-bounds` : null), J = W.data?.items || [], dt = (G.data?.items || []).filter(e => e.state === `APPROVED` && e.enabled !== !1), Y = (ut.data?.items || []).filter(e => e.settlementMethod !== `LEGACY`), X = Y.filter(e => e.enabled).sort((e, t) => `${e.categoryName||e.category}\u0000${e.name}`.localeCompare(`${t.categoryName||t.category}\u0000${t.name}`, x())), ft = Array.from(new Map(X.map(e => [e.category || `__uncategorized__`, e.categoryName || e.category || b(`未分类`)])).entries()).sort((e, t) => e[1].localeCompare(t[1], x())), pt = Qe.trim().toLocaleLowerCase(x()), Z = X.filter(e => {
    let t = e.category || `__uncategorized__`;
    return j && t !== j ? !1 : !pt || [e.name, e.categoryName, e.category, s[e.settlementMethod], i[e.deliveryMethod]].filter(Boolean).some(e => e.toLocaleLowerCase(x()).includes(pt))
  }), mt = Z.filter(e => !Ye.includes(e.id));
  (0, E.useEffect)(() => {
    let t = n(`id`);
    if (t && n(`review`) === `change`) {
      let n = ++V.current;
      R({
        id: t,
        projectName: ``,
        code: ``
      }), z(!0), B(``), e(`/quotes/` + encodeURIComponent(t)).then(e => {
        n === V.current && R(e)
      }).catch(e => {
        n === V.current && B(e.message)
      }).finally(() => {
        n === V.current && z(!1)
      })
    } else if (t) {
      let n = ++I.current;
      e(`/quotes/` + encodeURIComponent(t)).then(e => {
        n === I.current && N(e)
      }).catch(e => {
        n === I.current && h(e.message, !0)
      })
    }
    return () => {
      I.current += 1, V.current += 1
    }
  }, []);
  let Q = () => {
      I.current += 1, N(null), nt(!1), rt(``)
    },
    ht = async t => {
      let n = ++I.current;
      N(t), nt(!0), rt(``);
      try {
        let r = await e(`/quotes/${encodeURIComponent(t.id)}`);
        n === I.current && N(r)
      } catch (e) {
        n === I.current && rt(e.message)
      } finally {
        n === I.current && nt(!1)
      }
    }, gt = e => {
      Q(), at(e)
    }, _t = () => {
      V.current += 1, R(null), z(!1), B(``)
    }, vt = async t => {
      Q();
      let n = ++V.current;
      R(t), z(!0), B(``);
      try {
        let r = await e(`/quotes/${encodeURIComponent(t.id)}`);
        n === V.current && R(r)
      } catch (e) {
        n === V.current && B(e.message)
      } finally {
        n === V.current && z(!1)
      }
    }, $ = (e, t, n) => {
      U(r => r.map(r => {
        if (r.key !== e) return r;
        let i = {
          ...r,
          [t]: n,
          error: ``
        };
        if (t === `projectId`) {
          let e = Y.find(e => e.id === n);
          i.unitPrice = ``, i.multiplier = e?.settlementMethod === `QUOTA` ? `80` : ``, i.accountCount = ``, i.accountQuota = ``, i.rpm = ``, i.tpm = ``
        }
        return i
      }))
    }, yt = (e, t, n) => {
      U(r => r.map(r => r.key === e ? {
        ...r,
        effectiveFrom: t,
        effectiveTo: n,
        error: ``
      } : r))
    }, bt = e => {
      Je(`list`), U(t => [...t, xe(d.supplierId || ``, e)])
    }, xt = e => {
      Je(`list`), U(t => t.some(t => t.id === e.id) ? t : [...t, xe(d.supplierId || ``, e, !0)])
    }, St = e => {
      U(t => t.filter(t => t.key !== e))
    }, Ct = (e, t) => {
      if (!e.supplierId) return b(`请选择供应商`);
      if (!e.effectiveFrom || !e.effectiveTo) return b(`请填写完整的生效日期`);
      if (e.effectiveTo < e.effectiveFrom) return b(`结束日期不能早于开始日期`);
      let n = y();
      if (e.effectiveTo < n) return b(`历史报价不能修改或提交，请选择今天或未来日期`);
      if (e.source?.effectiveFrom && e.source.effectiveFrom < n) {
        if (e.effectiveFrom !== e.source.effectiveFrom) return b(`历史开始日期不可修改，只能调整今天或未来的结束日期`)
      } else if (e.effectiveFrom < n) return b(`生效日期不能早于北京时间今天`);
      if (e.source && e.source.effectiveFrom < n) return ``;
      if (!t) return b(`请选择报价项目`);
      if (!t.enabled) return b(`项目已停用，不能提交报价`);
      if (!t.capacityType) return b(`该项目尚未配置能力口径`);
      if (e.serviceCapacityNote.trim().length > 500) return b(`能力补充说明最多500字`);
      if (t.capacityType === `ACCOUNT_COUNT` && !Ee.test(e.accountCount)) return b(`请填写正整数账号数量`);
      if (t.capacityType === `ACCOUNT_QUOTA`) {
        if (!T.test(e.accountQuota) || /^0+(?:\.0+)?$/.test(e.accountQuota)) return b(`请填写大于0的账号额度`);
        if ((e.accountQuota.split(`.`)[1] || ``).length > 8) return b(`账号额度最多8位小数`)
      }
      if (t.capacityType === `THROUGHPUT` && (!Ee.test(e.rpm) || !Ee.test(e.tpm))) return b(`请同时填写正整数RPM和TPM`);
      for (let t of [e.accountCount, e.rpm, e.tpm].filter(Boolean))
        if (BigInt(t) > 9223372036854775807n) return b(`整数能力超过BIGINT上限`);
      if (t.settlementMethod === `ACCOUNT_BUYOUT`) {
        if (!T.test(e.unitPrice) || Number(e.unitPrice) < 0) return b(`请填写不小于 0 的单位价格`)
      } else {
        if (q.loading) return b(`正在读取报价折扣范围`);
        if (q.error) return b(`报价折扣范围读取失败`);
        if (!T.test(e.multiplier)) return b(`请填写不小于 0 的折扣`);
        if (e.multiplier.split(`.`)[0].replace(/^0+/, ``).length > 8) return b(`折扣整数部分最多 8 位`);
        if ((e.multiplier.split(`.`)[1] || ``).length > 6) return b(`折扣最多 6 位小数`);
        let t = be(se(e.multiplier), q.data);
        if (t) return t
      }
      return ``
    }, wt = async e => {
      if (e.pending || ct.current.has(e.key)) return;
      let t = Y.find(t => t.id === e.projectId),
        n = Ct(e, t);
      if (n) {
        U(t => t.map(t => t.key === e.key ? {
          ...t,
          error: n
        } : t));
        return
      }
      ct.current.add(e.key), U(t => t.map(t => t.key === e.key ? {
        ...t,
        pending: !0,
        error: ``
      } : t));
      let r = !!(e.source && e.source.effectiveFrom < y()),
        i = r ? e.source?.pricingType === `FIXED` : t?.settlementMethod === `ACCOUNT_BUYOUT`,
        a = {
          supplierId: e.supplierId,
          projectId: e.projectId,
          pricingType: i ? `FIXED` : `DISCOUNT`,
          unitPrice: i ? e.unitPrice : null,
          multiplier: i ? null : se(e.multiplier),
          currency: e.currency,
          taxInclusive: e.taxInclusive === `true`,
          serviceCapacityNote: e.serviceCapacityNote.trim(),
          accountCount: r ? e.accountCount || null : t?.capacityType === `ACCOUNT_COUNT` ? e.accountCount : null,
          accountQuota: r ? e.accountQuota || null : t?.capacityType === `ACCOUNT_QUOTA` ? e.accountQuota : null,
          rpm: r ? e.rpm || null : t?.capacityType === `THROUGHPUT` ? e.rpm : null,
          tpm: r ? e.tpm || null : t?.capacityType === `THROUGHPUT` ? e.tpm : null,
          effectiveFrom: e.effectiveFrom,
          effectiveTo: e.effectiveTo
        };
      try {
        e.id ? await ae(`/quotes/${e.id}`, a) : await ue(`/quotes`, a), U(t => t.filter(t => t.key !== e.key)), f(), h(e.id ? b(`该行报价已保存`) : b(`该行报价已提交审核`))
      } catch (t) {
        let n = t.message;
        U(t => t.map(t => t.key === e.key ? {
          ...t,
          pending: !1,
          error: n
        } : t)), h(n, !0)
      } finally {
        ct.current.delete(e.key)
      }
    }, Tt = e => {
      let t = Y.find(t => t.id === e.projectId),
        n = !!(d.supplierId || e.id),
        r = !!(e.source && e.source.effectiveFrom < y()),
        a = r ? e.source?.pricingType === `FIXED` : t?.settlementMethod === `ACCOUNT_BUYOUT`,
        o = e.pending || r,
        ee = J.find(t => t.id === e.id),
        c = dt.find(t => t.id === e.supplierId)?.name || ee?.supplierName || b(`当前供应商`);
      return (0, D.jsxs)(E.Fragment, {
        children: [(0, D.jsxs)(`tr`, {
          className: `quote-edit-row`,
          onClick: e => e.stopPropagation(),
          children: [!v && (0, D.jsx)(`td`, {
            children: n ? (0, D.jsxs)(`div`, {
              className: `quote-locked-value`,
              children: [(0, D.jsx)(`strong`, {
                children: c
              }), (0, D.jsx)(`small`, {
                children: b(`所属供应商不可变更`)
              })]
            }) : (0, D.jsx)(C, {
              ariaLabel: b(`供应商`),
              visual: `supplier`,
              value: e.supplierId,
              disabled: e.pending,
              onChange: t => $(e.key, `supplierId`, t),
              options: [{
                value: ``,
                label: b(`选择供应商`)
              }, ...dt.map(e => ({
                value: e.id,
                label: e.name
              }))]
            })
          }), (0, D.jsxs)(`td`, {
            children: [(0, D.jsx)(C, {
              ariaLabel: b(`报价项目`),
              visual: `project`,
              value: e.projectId,
              disabled: o,
              onChange: t => $(e.key, `projectId`, t),
              options: [{
                value: ``,
                label: b(`选择项目`)
              }, ...Y.map(e => ye(e, Y, !0))]
            }), t && (0, D.jsxs)(`small`, {
              className: `quote-method`,
              children: [s[t.settlementMethod], ` · `, i[t.deliveryMethod]]
            })]
          }), (0, D.jsx)(`td`, {
            children: (0, D.jsxs)(`div`, {
              className: `quote-price-editor`,
              children: [(0, D.jsxs)(`div`, {
                className: `quote-price-input`,
                children: [(0, D.jsx)(`input`, {
                  "aria-label": b(a ? `单位价格` : `报价折扣`),
                  type: `number`,
                  min: `0`,
                  step: `any`,
                  value: a ? e.unitPrice : e.multiplier,
                  disabled: o || !t,
                  placeholder: b(a ? `单位价格` : `例如 27`),
                  onChange: t => $(e.key, a ? `unitPrice` : `multiplier`, t.target.value)
                }), (0, D.jsx)(`span`, {
                  children: a ? `/ ${w(t?.unit)||b(`单位`)}` : x() === `zh-CN` ? `折` : `%`
                })]
              }), !a && q.data && (0, D.jsxs)(`small`, {
                children: [b(`允许范围 `), p(q.data.min), b(` 至 `), p(q.data.max), b(`，可填小数 `)]
              }), Te(t?.suggestedMultiplier) && (0, D.jsx)(`small`, {
                className: `quote-suggested-note`,
                children: Te(t?.suggestedMultiplier)
              }), !a && t && (0, D.jsx)(Oe, {
                value: se(e.multiplier),
                currency: e.currency,
                referenceRates: K.data || [],
                loading: K.loading,
                error: K.error
              })]
            })
          }), (0, D.jsx)(`td`, {
            children: (0, D.jsxs)(`div`, {
              className: `quote-capacity-editor`,
              children: [t?.capacityType === `ACCOUNT_COUNT` && (0, D.jsx)(`input`, {
                "aria-label": b(`账号数量`),
                type: `number`,
                min: `1`,
                step: `1`,
                value: e.accountCount,
                disabled: o,
                placeholder: b(`账号数（个）`),
                onChange: t => $(e.key, `accountCount`, t.target.value)
              }), t?.capacityType === `ACCOUNT_QUOTA` && (0, D.jsx)(`input`, {
                "aria-label": ve(t),
                type: `number`,
                min: `0`,
                step: `any`,
                value: e.accountQuota,
                disabled: o,
                placeholder: ve(t),
                onChange: t => $(e.key, `accountQuota`, t.target.value)
              }), t?.capacityType === `THROUGHPUT` && (0, D.jsxs)(`div`, {
                className: `quote-throughput-inputs`,
                children: [(0, D.jsx)(`input`, {
                  "aria-label": `RPM`,
                  type: `number`,
                  min: `1`,
                  step: `1`,
                  value: e.rpm,
                  disabled: o,
                  placeholder: `RPM`,
                  onChange: t => $(e.key, `rpm`, t.target.value)
                }), (0, D.jsx)(`input`, {
                  "aria-label": `TPM`,
                  type: `number`,
                  min: `1`,
                  step: `1`,
                  value: e.tpm,
                  disabled: o,
                  placeholder: `TPM`,
                  onChange: t => $(e.key, `tpm`, t.target.value)
                })]
              }), !t?.capacityType && (0, D.jsx)(`small`, {
                className: `error-text`,
                children: b(`请先在项目管理配置能力口径`)
              }), (0, D.jsx)(`textarea`, {
                "aria-label": b(`能力补充说明`),
                className: `quote-capacity-input`,
                maxLength: 500,
                value: e.serviceCapacityNote,
                disabled: o,
                placeholder: b(`能力补充说明（选填）`),
                onChange: t => $(e.key, `serviceCapacityNote`, t.target.value)
              })]
            })
          }), (0, D.jsx)(`td`, {
            children: (0, D.jsxs)(`div`, {
              className: `quote-inline-stack`,
              children: [(0, D.jsx)(`input`, {
                "aria-label": b(`计价币种`),
                value: e.currency,
                readOnly: !0
              }), (0, D.jsx)(C, {
                ariaLabel: b(`含税口径`),
                value: e.taxInclusive,
                disabled: o,
                onChange: t => $(e.key, `taxInclusive`, t),
                options: [{
                  value: `true`,
                  label: b(`含税`),
                  tone: `blue`
                }, {
                  value: `false`,
                  label: b(`未税`),
                  tone: `slate`
                }]
              })]
            })
          }), (0, D.jsxs)(`td`, {
            children: [(0, D.jsx)(_e, {
              from: e.effectiveFrom,
              to: e.effectiveTo,
              disabled: e.pending,
              minDate: y(),
              fromLocked: r,
              onChange: (t, n) => yt(e.key, t, n)
            }), r && (0, D.jsx)(`small`, {
              className: `quote-method`,
              children: b(`历史开始日期和价格已锁定；改价请复制新行。`)
            })]
          }), (0, D.jsx)(`td`, {
            children: (0, D.jsx)(le, {
              state: e.id ? `PENDING` : `DRAFT`,
              label: e.id ? b(`待审核`) : b(`未提交`)
            })
          }), (0, D.jsx)(`td`, {
            children: (0, D.jsxs)(`div`, {
              className: `quote-row-actions`,
              children: [(0, D.jsx)(`button`, {
                className: `text-button`,
                disabled: e.pending,
                onClick: () => wt(e),
                children: e.pending ? b(`保存中…`) : b(`保存`)
              }), (0, D.jsx)(`button`, {
                className: `text-button muted`,
                disabled: e.pending,
                onClick: () => St(e.key),
                children: b(`取消 `)
              })]
            })
          })]
        }), e.error && (0, D.jsx)(`tr`, {
          className: `quote-edit-error`,
          children: (0, D.jsxs)(`td`, {
            colSpan: v ? 7 : 8,
            children: [(0, D.jsx)(te, {
              name: `info`,
              size: 14
            }), e.error]
          })
        })]
      }, e.key)
    }, Et = e => {
      let t = u(`quote.write`) && e.state === `PENDING` && e.submittedBy === d.id && e.effectiveTo >= y(),
        n = String(e.multiplier ?? a(String(e.ratePercent))),
        r = we(e),
        i = Se(e);
      return (0, D.jsxs)(`tr`, {
        className: r || i ? `clickable quote-change-pending` : `clickable`,
        onClick: () => void ht(e),
        children: [!v && (0, D.jsx)(`td`, {
          children: (0, D.jsxs)(`div`, {
            className: `stack`,
            children: [r && (0, D.jsx)(`strong`, {
              className: `quote-change-note`,
              children: r
            }), i && (0, D.jsx)(`strong`, {
              className: `quote-upcoming-note`,
              children: i
            }), (0, D.jsx)(`strong`, {
              children: e.supplierName
            }), (0, D.jsx)(`small`, {
              children: e.code
            })]
          })
        }), (0, D.jsx)(`td`, {
          children: (0, D.jsxs)(`div`, {
            className: `stack`,
            children: [v && r && (0, D.jsx)(`strong`, {
              className: `quote-change-note`,
              children: r
            }), v && i && (0, D.jsx)(`strong`, {
              className: `quote-upcoming-note`,
              children: i
            }), (0, D.jsx)(`strong`, {
              children: e.projectName
            }), (0, D.jsx)(`small`, {
              children: v ? `${w(e.unit)} · ${e.code}` : w(e.unit)
            })]
          })
        }), (0, D.jsx)(`td`, {
          children: (0, D.jsxs)(`div`, {
            className: `stack`,
            children: [e.pricingType === `DISCOUNT` ? (0, D.jsxs)(`strong`, {
              className: `rate`,
              children: [p(n), (0, D.jsx)(`small`, {
                children: x() === `zh-CN` ? `折` : `%`
              })]
            }) : (0, D.jsxs)(`strong`, {
              className: `money`,
              children: [e.currency, ` `, e.unitPrice, (0, D.jsxs)(`small`, {
                children: [` / `, w(e.unit)]
              })]
            }), e.pricingType === `DISCOUNT` ? (0, D.jsx)(Oe, {
              value: n,
              currency: e.currency,
              referenceRates: K.data || [],
              loading: K.loading,
              error: K.error
            }) : (0, D.jsx)(`small`, {
              children: b(`固定单价`)
            })]
          })
        }), (0, D.jsx)(`td`, {
          className: `quote-capacity-cell`,
          children: (0, D.jsxs)(`div`, {
            className: `stack`,
            children: [(0, D.jsx)(`strong`, {
              children: Ce(e)
            }), e.serviceCapacityNote?.trim() && (0, D.jsx)(`small`, {
              children: e.serviceCapacityNote
            })]
          })
        }), (0, D.jsx)(`td`, {
          children: (0, D.jsxs)(`div`, {
            className: `stack`,
            children: [(0, D.jsx)(`strong`, {
              children: e.currency
            }), (0, D.jsx)(`small`, {
              children: e.taxInclusive ? b(`含税`) : b(`未税`)
            })]
          })
        }), (0, D.jsx)(`td`, {
          children: (0, D.jsxs)(`div`, {
            className: `stack mono small`,
            children: [(0, D.jsx)(`span`, {
              children: e.effectiveFrom
            }), (0, D.jsxs)(`small`, {
              children: [b(`至 `), e.effectiveTo]
            })]
          })
        }), (0, D.jsx)(`td`, {
          children: (0, D.jsxs)(`div`, {
            className: `stack`,
            children: [(0, D.jsx)(le, {
              state: e.state
            }), r && (0, D.jsx)(le, {
              state: `PENDING`,
              label: b(`调价待审`)
            })]
          })
        }), (0, D.jsx)(`td`, {
          onClick: e => e.stopPropagation(),
          children: (0, D.jsxs)(`div`, {
            className: `quote-row-actions`,
            children: [v && e.supplierId === d.supplierId && e.state === `APPROVED` && u(`resource.read`) && u(`resource.write`) && (0, D.jsx)(`button`, {
              className: `text-button`,
              onClick: () => ee(`deliveries?quoteId=${encodeURIComponent(e.id)}`),
              children: b(`交付 `)
            }), t && (0, D.jsx)(`button`, {
              className: `text-button`,
              onClick: () => xt(e),
              children: b(`编辑 `)
            }), e.state === `APPROVED` && u(`quote.write`) && (!v || e.supplierId === d.supplierId) && e.effectiveTo >= y() && (0, D.jsx)(`button`, {
              className: `text-button`,
              onClick: () => void vt(e),
              children: b(`调价 `)
            }), e.state === `APPROVED` && u(`quote.review`) && !v && (0, D.jsx)(`button`, {
              className: `text-button`,
              onClick: () => void vt(e),
              children: b(`审核调价 `)
            }), e.state === `APPROVED` && u(`quote.review`) && !v && (0, D.jsx)(`button`, {
              className: `text-button danger-text`,
              onClick: () => gt(e),
              children: b(`拒绝 `)
            }), u(`quote.write`) && (0, D.jsx)(`button`, {
              className: `text-button muted`,
              onClick: () => bt(e),
              children: b(`复制新行 `)
            }), (0, D.jsx)(`button`, {
              className: `text-button muted`,
              onClick: () => void ht(e),
              children: b(`查看 `)
            })]
          })
        })]
      }, e.id)
    };
  return (0, D.jsxs)(D.Fragment, {
    children: [(0, D.jsx)(ce, {
      title: d.supplierId ? b(`我的报价`) : b(`报价管理`),
      children: u(`quote.write`) && (v || A === `list`) && (0, D.jsx)(S, {
        variant: `primary`,
        icon: `plus`,
        onClick: () => bt(),
        children: b(`新增报价行 `)
      })
    }), !v && (0, D.jsx)(pe, {
      value: A,
      onChange: Je,
      items: [{
        id: `list`,
        label: b(`报价列表`)
      }, {
        id: `ranking`,
        label: b(`报价排行榜`)
      }]
    }), (v || A === `list`) && (0, D.jsxs)(D.Fragment, {
      children: [(0, D.jsxs)(`section`, {
        className: `panel quote-sheet-panel`,
        children: [(0, D.jsxs)(`div`, {
          className: `quote-list-filters`,
          children: [(0, D.jsxs)(`div`, {
            className: `quote-list-filter ${v?`quote-list-filter-wide-half`:`quote-list-filter-wide`}`,
            children: [(0, D.jsx)(`span`, {
              children: b(`关键词`)
            }), (0, D.jsx)(me, {
              value: fe,
              onChange: e => {
                ke(e), k(1)
              },
              placeholder: b(`报价编号、供应商或项目`)
            })]
          }), !v && (0, D.jsxs)(`div`, {
            className: `quote-list-filter quote-list-filter-wide`,
            children: [(0, D.jsx)(`span`, {
              children: b(`供应商`)
            }), (0, D.jsx)(ge, {
              value: O,
              onChange: e => {
                Pe(e), k(1)
              },
              options: (G.data?.items || []).map(e => ({
                value: e.id,
                label: e.name,
                detail: e.code
              })),
              loading: G.loading,
              error: G.error,
              fallbackToText: !u(`supplier.read`)
            })]
          }), (0, D.jsxs)(`div`, {
            className: `quote-list-filter ${v?`quote-list-filter-wide-half`:`quote-list-filter-wide`}`,
            children: [(0, D.jsx)(`span`, {
              children: b(`报价项目`)
            }), (0, D.jsx)(me, {
              value: Fe,
              onChange: e => {
                Ie(e), k(1)
              },
              placeholder: b(`项目名称或编号`)
            })]
          }), (0, D.jsxs)(`div`, {
            className: `quote-list-filter`,
            children: [(0, D.jsx)(`span`, {
              children: b(`报价方式`)
            }), (0, D.jsx)(C, {
              compact: !0,
              ariaLabel: b(`报价方式`),
              value: Le,
              options: [{
                value: ``,
                label: b(`全部方式`)
              }, {
                value: `DISCOUNT`,
                label: b(`折扣报价`)
              }, {
                value: `FIXED`,
                label: b(`独立单价`)
              }],
              onChange: e => {
                Re(e), k(1)
              }
            })]
          }), (0, D.jsxs)(`div`, {
            className: `quote-list-filter`,
            children: [(0, D.jsx)(`span`, {
              children: b(`币种`)
            }), (0, D.jsx)(C, {
              compact: !0,
              ariaLabel: b(`报价币种`),
              value: ze,
              options: [{
                value: `USD`,
                label: `USD`
              }],
              onChange: e => {
                Be(e), k(1)
              }
            })]
          }), (0, D.jsxs)(`div`, {
            className: `quote-list-filter`,
            children: [(0, D.jsx)(`span`, {
              children: b(`报价状态`)
            }), (0, D.jsx)(C, {
              compact: !0,
              ariaLabel: b(`报价状态`),
              options: De.map(e => ({
                ...e
              })),
              value: Ue,
              onChange: e => {
                We(e), k(1)
              }
            })]
          }), (0, D.jsxs)(`label`, {
            className: `quote-list-filter`,
            children: [(0, D.jsx)(`span`, {
              children: b(`适用日期`)
            }), (0, D.jsx)(`input`, {
              type: `date`,
              value: Ve,
              onChange: e => {
                He(e.target.value), k(1)
              }
            })]
          }), (0, D.jsxs)(`div`, {
            className: `quote-list-filter quote-list-filter-actions`,
            children: [(0, D.jsx)(`span`, {
              children: b(`操作`)
            }), (0, D.jsxs)(`div`, {
              children: [(0, D.jsx)(S, {
                onClick: () => {
                  ke(``), Pe(``), Ie(``), Re(``), Be(`USD`), We(`CURRENT`), He(``), k(1)
                },
                children: b(`重置 `)
              }), (0, D.jsx)(S, {
                icon: `refresh`,
                "aria-label": b(`刷新报价`),
                onClick: f
              }), H.length > 0 && (0, D.jsxs)(`span`, {
                className: `quote-draft-count`,
                children: [H.length, b(` 行编辑中`)]
              })]
            })]
          })]
        }), W.error && (J.length > 0 || H.length > 0) && (0, D.jsx)(g, {
          children: b(`报价列表读取失败：{0}；已有草稿仍可保留，刷新后再试。`, [W.error])
        }), W.error && J.length === 0 && H.length === 0 ? (0, D.jsx)(m, {
          text: W.error,
          error: !0
        }) : W.loading && J.length === 0 && H.length === 0 ? (0, D.jsx)(_, {}) : (0, D.jsxs)(D.Fragment, {
          children: [(0, D.jsxs)(re, {
            ariaLabel: b(`报价列表`),
            children: [(0, D.jsxs)(`table`, {
              className: `quote-sheet${v?` own-quote-sheet`:``}`,
              children: [(0, D.jsx)(`thead`, {
                children: (0, D.jsxs)(`tr`, {
                  children: [!v && (0, D.jsx)(`th`, {
                    children: b(`供应商`)
                  }), (0, D.jsx)(`th`, {
                    children: b(`报价项目`)
                  }), (0, D.jsx)(`th`, {
                    children: b(`折扣 / 独立价格`)
                  }), (0, D.jsx)(`th`, {
                    children: b(`申报能力 / 补充说明`)
                  }), (0, D.jsx)(`th`, {
                    children: b(`币种 / 税`)
                  }), (0, D.jsx)(`th`, {
                    children: b(`适用期间`)
                  }), (0, D.jsx)(`th`, {
                    children: b(`状态`)
                  }), (0, D.jsx)(`th`, {
                    children: b(`操作`)
                  })]
                })
              }), (0, D.jsxs)(`tbody`, {
                children: [H.filter(e => !e.id).map(Tt), J.map(e => {
                  let t = H.find(t => t.id === e.id);
                  return t ? Tt(t) : Et(e)
                }), H.filter(e => e.id && !J.some(t => t.id === e.id)).map(Tt)]
              })]
            }), J.length === 0 && H.length === 0 && (0, D.jsx)(m, {
              text: b(`暂无报价，可点击“新增报价行”开始填写`)
            })]
          }), (0, D.jsx)(ne, {
            data: W.data,
            page: Ge,
            onPage: k,
            size: Ke,
            onSizeChange: e => {
              qe(e), k(1)
            }
          })]
        })]
      }), (0, D.jsxs)(`div`, {
        className: `page-footnote`,
        children: [(0, D.jsx)(te, {
          name: `lock`,
          size: 15
        }), b(`同一供应商、项目同一时间只生效一条报价，跨期间保持同一币种。今天调价今天生效，历史价格不变；未来调价按所选日期生效。待审调整和已排期的后续价格会显示在列表中，页面打开时自动更新。 `)]
      })]
    }), !v && A === `ranking` && (0, D.jsxs)(`section`, {
      className: `panel quote-ranking-panel`,
      children: [(0, D.jsxs)(`div`, {
        className: `quote-ranking-controls`,
        children: [(0, D.jsxs)(`div`, {
          className: `quote-ranking-project-filter`,
          children: [(0, D.jsxs)(`div`, {
            className: `quote-ranking-filter-tools`,
            children: [(0, D.jsx)(me, {
              value: Qe,
              onChange: $e,
              placeholder: b(`检索项目名称或大类`)
            }), (0, D.jsxs)(`div`, {
              className: `quote-ranking-category-filter`,
              role: `group`,
              "aria-label": b(`排行项目大类`),
              children: [(0, D.jsx)(`span`, {
                children: b(`项目大类`)
              }), (0, D.jsx)(`button`, {
                type: `button`,
                className: j === `` ? `active` : ``,
                "aria-pressed": j === ``,
                onClick: () => Ze(``),
                children: b(`全部 `)
              }), ft.map(([e, t]) => (0, D.jsx)(`button`, {
                type: `button`,
                className: j === e ? `active` : ``,
                "aria-pressed": j === e,
                onClick: () => Ze(e),
                children: t
              }, e))]
            })]
          }), (0, D.jsxs)(`div`, {
            className: `quote-ranking-filter-head`,
            children: [(0, D.jsx)(`strong`, {
              children: b(`展示项目`)
            }), (0, D.jsxs)(`span`, {
              children: [b(`已显示 `), mt.length, ` / `, Z.length, Z.length !== X.length && b(`（全部 {0}）`, [X.length])]
            }), (0, D.jsx)(`button`, {
              className: `text-button`,
              type: `button`,
              disabled: Z.every(e => !Ye.includes(e.id)),
              onClick: () => Xe(e => e.filter(e => !Z.some(t => t.id === e))),
              children: b(`全选 `)
            }), (0, D.jsx)(`button`, {
              className: `text-button muted`,
              type: `button`,
              disabled: mt.length === 0,
              onClick: () => Xe(e => Array.from(new Set([...e, ...Z.map(e => e.id)]))),
              children: b(`清空 `)
            })]
          }), (0, D.jsx)(`div`, {
            className: `quote-ranking-project-strip`,
            "aria-label": b(`排行展示项目`),
            children: Z.length === 0 ? (0, D.jsx)(`div`, {
              className: `quote-ranking-project-empty`,
              children: b(`未找到匹配项目`)
            }) : Z.map(e => {
              let t = !Ye.includes(e.id);
              return (0, D.jsxs)(`label`, {
                className: `quote-ranking-project-check${t?` checked`:``}`,
                children: [(0, D.jsx)(`input`, {
                  type: `checkbox`,
                  checked: t,
                  onChange: t => Xe(n => t.target.checked ? n.filter(t => t !== e.id) : [...n, e.id])
                }), (0, D.jsx)(`span`, {
                  children: e.name
                }), (0, D.jsx)(`small`, {
                  children: e.categoryName || e.category || b(`未分类`)
                })]
              }, e.id)
            })
          })]
        }), (0, D.jsxs)(`div`, {
          className: `quote-ranking-view-options`,
          children: [(0, D.jsxs)(`fieldset`, {
            className: `quote-ranking-currencies`,
            children: [(0, D.jsx)(`legend`, {
              children: b(`排行币种`)
            }), (0, D.jsxs)(`label`, {
              className: `checked`,
              children: [(0, D.jsx)(`input`, {
                type: `radio`,
                name: `ranking-currency`,
                value: `USD`,
                checked: !0,
                readOnly: !0
              }), (0, D.jsx)(`span`, {
                children: `USD`
              })]
            })]
          }), (0, D.jsxs)(`label`, {
            className: `quote-ranking-date`,
            children: [(0, D.jsx)(`span`, {
              children: b(`排行日期`)
            }), (0, D.jsx)(`input`, {
              "aria-label": b(`排行日期`),
              type: `date`,
              required: !0,
              value: et,
              onChange: e => tt(e.target.value)
            })]
          })]
        })]
      }), (0, D.jsx)(`p`, {
        className: `muted small quote-ranking-note`,
        children: b(`每个项目独立保留排序方式；点击报价或能力列头切换排序。能力缺失的历史报价始终置末且不计名次。 `)
      }), ut.error ? (0, D.jsx)(m, {
        text: ut.error,
        error: !0
      }) : ut.loading && X.length === 0 ? (0, D.jsx)(_, {}) : X.length === 0 ? (0, D.jsx)(m, {
        text: b(`暂无可用于报价排行的项目`)
      }) : Z.length === 0 ? (0, D.jsx)(m, {
        text: b(`没有符合当前检索和大类条件的项目`)
      }) : mt.length === 0 ? (0, D.jsx)(m, {
        text: b(`请至少勾选一个要展示的项目`)
      }) : et ? (0, D.jsx)(`div`, {
        className: `quote-ranking-groups`,
        children: mt.map(e => (0, D.jsxs)(`section`, {
          className: `quote-ranking-group`,
          children: [(0, D.jsxs)(`div`, {
            className: `quote-ranking-group-head`,
            children: [(0, D.jsxs)(`div`, {
              children: [(0, D.jsx)(`h2`, {
                children: e.name
              }), (0, D.jsxs)(`p`, {
                children: [e.categoryName || e.category || b(`未分类`), ` ·`, ` `, s[e.settlementMethod], ` ·`, ` `, i[e.deliveryMethod]]
              })]
            }), (0, D.jsx)(`span`, {
              children: `USD`
            })]
          }), (0, D.jsx)(E.Suspense, {
            fallback: (0, D.jsx)(_, {}),
            children: (0, D.jsx)(Ne, {
              project: e,
              currency: `USD`,
              onDate: et,
              referenceRates: K.data || [],
              referenceRatesError: K.error,
              referenceRatesLoading: K.loading,
              onQuote: ht
            }, e.id)
          })]
        }, e.id))
      }) : (0, D.jsx)(m, {
        text: b(`请选择排行日期`)
      })]
    }), L && (0, D.jsx)(o, {
      title: u(`quote.write`) ? b(`调价`) : b(`审核调价`),
      subtitle: `${L.projectName} · ${L.code}`,
      onClose: _t,
      wide: !0,
      children: ot ? (0, D.jsx)(_, {}) : st ? (0, D.jsxs)(g, {
        tone: `red`,
        children: [b(`报价读取失败：`), st, (0, D.jsx)(S, {
          onClick: () => void vt(L),
          children: b(`重试`)
        })]
      }) : (0, D.jsxs)(D.Fragment, {
        children: [L.effectiveTo < y() && (0, D.jsx)(g, {
          children: b(`历史报价不能申请修改。`)
        }), L.state === `APPROVED` ? (0, D.jsx)(E.Suspense, {
          fallback: (0, D.jsx)(_, {}),
          children: (0, D.jsx)(je, {
            quote: L,
            canRequest: u(`quote.write`) && (!v || L.supplierId === d.supplierId) && L.effectiveTo >= y(),
            canReview: u(`quote.review`),
            defaultAdjustPrice: !0,
            referenceRates: K.data || [],
            referenceRatesLoading: K.loading,
            referenceRatesError: K.error,
            multiplierBounds: q.data,
            multiplierBoundsError: q.error,
            suggestedMultiplier: Y.find(e => e.id === L.projectId)?.suggestedMultiplier,
            onChanged: () => {
              f(), _t()
            }
          }, L.id)
        }) : (0, D.jsx)(g, {
          children: b(`报价状态已变化，请关闭并刷新列表。`)
        }), L.priceHistory && L.priceHistory.length > 0 && (0, D.jsx)(E.Suspense, {
          fallback: (0, D.jsx)(_, {}),
          children: (0, D.jsx)(Me, {
            quote: L,
            history: L.priceHistory
          })
        })]
      })
    }), M && (0, D.jsxs)(o, {
      drawer: !0,
      title: M.title,
      subtitle: M.code,
      onClose: Q,
      children: [(0, D.jsxs)(`div`, {
        className: `quote-hero`,
        children: [(0, D.jsxs)(`div`, {
          children: [(0, D.jsx)(`span`, {
            children: b(`供应商报价`)
          }), (0, D.jsx)(`h2`, {
            children: M.pricingType === `DISCOUNT` ? (0, D.jsxs)(D.Fragment, {
              children: [p(String(M.multiplier ?? a(String(M.ratePercent)))), (0, D.jsx)(`small`, {
                children: x() === `zh-CN` ? `折` : `%`
              })]
            }) : (0, D.jsxs)(D.Fragment, {
              children: [M.currency, ` `, t(M.unitPrice, M.currency), (0, D.jsxs)(`small`, {
                children: [` / `, w(M.unit)]
              })]
            })
          }), (0, D.jsx)(`p`, {
            children: M.pricingType === `DISCOUNT` ? b(`现行系统原始金额 × 折扣百分比`) : b(`本期结算数量 × 已确认单价`)
          })]
        }), (0, D.jsx)(le, {
          state: M.state
        })]
      }), (0, D.jsx)(oe, {
        items: [...v ? [] : [
            [b(`供应商`), M.supplierName]
          ],
          [b(`报价项目`), M.projectName],
          [b(`结算方式`), s[M.settlementMethod || `LEGACY`]],
          [b(`交付方式`), i[M.deliveryMethod || `LEGACY`]],
          [b(`计价币种`), M.currency],
          [b(`生效日期`), M.effectiveFrom],
          [b(`结束日期`), M.effectiveTo],
          [b(`含税口径`), M.taxInclusive ? b(`含税`) : b(`未税（不自动计税）`)],
          [b(`申报能力`), Ce(M)],
          [b(`能力补充说明`), M.serviceCapacityNote?.trim() || b(`未填写`)]
        ]
      }), M.reviewNote && (0, D.jsx)(g, {
        children: M.reviewNote
      }), !P && !F && !!M.renewalHistory?.length && (0, D.jsxs)(`section`, {
        className: `subsection`,
        children: [(0, D.jsx)(`h3`, {
          children: b(`有效期调整记录`)
        }), (0, D.jsx)(ie, {
          data: M.renewalHistory,
          columns: [{
            label: b(`方式`),
            render: e => e.kind === `AUTO` ? b(`自动续期`) : b(`人工调整`)
          }, {
            label: b(`原有效期`),
            render: e => b(`{0} 至 {1}`, [e.previousFrom, e.previousTo])
          }, {
            label: b(`调整后有效期`),
            render: e => b(`{0} 至 {1}`, [e.effectiveFrom, e.effectiveTo])
          }, {
            label: b(`操作人`),
            render: e => e.actorName
          }, {
            label: b(`时间`),
            render: e => c(e.occurredAt)
          }]
        })]
      }), P && (0, D.jsx)(_, {}), F && (0, D.jsxs)(g, {
        tone: `red`,
        children: [b(`报价详情加载失败：`), F, (0, D.jsx)(S, {
          onClick: () => void ht(M),
          children: b(`重试`)
        })]
      }), M.effectiveTo < y() && (0, D.jsx)(g, {
        children: b(`历史报价不能修改，可复制后提交今天或未来的新报价。`)
      }), !P && !F && M.state === `APPROVED` && M.priceHistory && M.priceHistory.length > 0 && (0, D.jsx)(E.Suspense, {
        fallback: (0, D.jsx)(_, {}),
        children: (0, D.jsx)(Me, {
          quote: M,
          history: M.priceHistory
        })
      }), !P && !F && u(`quote.review`) && M.state === `PENDING` && M.submittedBy !== d.id && M.createdBy !== d.id && (0, D.jsx)(de, {
        approveConfirmation: b(`是否确认审核通过该报价？`),
        onReview: async (e, t) => {
          await ue(`/quotes/${M.id}/review`, {
            approved: e,
            note: t
          }), f(), h(b(`报价审核已处理`)), Q()
        }
      }), (0, D.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [!v && u(`quote.review`) && M.state === `APPROVED` && (0, D.jsx)(S, {
          variant: `danger-quiet`,
          disabled: P || !!F,
          onClick: () => gt(M),
          children: b(`拒绝 `)
        }), u(`quote.write`) && M.state === `PENDING` && M.submittedBy === d.id && M.effectiveTo >= y() && (0, D.jsx)(S, {
          disabled: P || !!F,
          onClick: () => {
            xt(M), Q()
          },
          children: b(`编辑此行 `)
        }), u(`quote.write`) && M.state === `APPROVED` && M.effectiveTo >= y() && (0, D.jsx)(S, {
          disabled: P || !!F,
          onClick: () => {
            vt(M), Q()
          },
          children: b(`调整报价 `)
        }), u(`quote.write`) && (0, D.jsx)(S, {
          icon: `copy`,
          disabled: P || !!F,
          onClick: () => {
            bt(M), Q()
          },
          children: b(`复制为新行 `)
        }), u(`quote.write`) && M.state === `PENDING` && M.submittedBy === d.id && (0, D.jsx)(S, {
          disabled: P || !!F,
          onClick: async () => {
            try {
              await ue(`/quotes/${M.id}/withdraw`, {}), f(), Q(), h(b(`报价已撤回`))
            } catch (e) {
              h(e.message, !0)
            }
          },
          children: b(`撤回 `)
        })]
      })]
    }), it && (0, D.jsx)(E.Suspense, {
      fallback: (0, D.jsx)(_, {}),
      children: (0, D.jsx)(Ae, {
        quote: it,
        onClose: () => at(null),
        onRejected: () => {
          at(null), f(), h(b(`报价已拒绝`))
        }
      })
    })]
  })
}
export {
  O as
  default, Oe as n, be as outsideMultiplierRange, ke as t
};
