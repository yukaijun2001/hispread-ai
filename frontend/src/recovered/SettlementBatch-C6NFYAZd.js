// origin: assets/SettlementBatch-C6NFYAZd.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/SettlementPreview-CEv04HyA.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/SettlementResourceTable-DOsIIJjV.js"]))) => i.map(i => d[i]);
import {
  $ as e,
  A as t,
  C as n,
  G as r,
  H as i,
  P as a,
  S as o,
  T as s,
  X as c,
  Z as l,
  c as u,
  g as d,
  h as f,
  i as p,
  j as m,
  mt as h,
  ot as g,
  pt as _,
  rt as v,
  s as y,
  u as ee,
  vt as te,
  y as ne
} from "./index-Dnr0i-H9.js";

function re(e) {
  ie({
    id: ``,
    state: `PREVIEW`,
    confirmationDeadline: ``,
    items: [],
    periodStart: e.periodStart,
    periodEnd: e.periodEnd,
    totals: e.totals,
    incompleteDays: e.incompleteDays
  }, e.suppliers)
}

function ie(e, n) {
  if (e.state === `QUEUED` || !e.items?.length && !n?.length) throw Error(h(`请等待结算单核算完成后导出`));
  let r = window.open(``, `_blank`);
  if (!r) throw Error(h(`请允许弹出窗口后重试导出 PDF`));
  let i = h(n ? `供应商结算汇总` : `结算单汇总`),
    a = r.document;
  a.documentElement.lang = _(), a.title = `${i}_${e.periodStart}_${e.periodEnd}${e.id?`_${e.id}`:``}`;
  let o = a.createElement(`style`);
  o.textContent = `
    @page { size: A4 portrait; margin: 16mm 12mm;
      @bottom-center { content: counter(page) " / " counter(pages);
        font: 9px system-ui, sans-serif; color: #65758b; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; color: #243b5a; background: #fff;
      font: 12px/1.6 system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
    main { max-width: 900px; margin: 32px auto; padding: 0 24px; }
    h1 { font-size: 24px; margin: 0; }
    h2 { font-size: 16px; margin: 24px 0 10px; break-after: avoid; }
    p { margin: 6px 0; overflow-wrap: anywhere; }
    .brand { color: #365d99; font-weight: 700; margin-bottom: 12px; }
    .meta { border-bottom: 2px solid #cbd9ed; padding-bottom: 16px; margin-bottom: 18px; }
    .totals { display: flex; flex-wrap: wrap; gap: 12px 28px; padding: 16px;
      background: #f3f7fc; border: 1px solid #dce5f1; margin: 12px 0; }
    .totals strong { font-size: 18px; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .notice { color: #864820; }
    table { border-collapse: collapse; width: 100%; table-layout: fixed; }
    th, td { border-bottom: 1px solid #dce5f1; padding: 9px 7px; text-align: left;
      vertical-align: top; overflow-wrap: anywhere; }
    th { background: #f3f7fc; font-weight: 600; }
    thead { display: table-header-group; }
    tfoot { display: table-row-group; }
    tr { break-inside: avoid; }
    .supplier-table th, .supplier-table td { padding: 6px 7px; }
    .supplier-table tbody tr:last-child { break-after: avoid; }
    .numeric { text-align: right; font-variant-numeric: tabular-nums; }
    .toolbar { position: sticky; top: 0; background: #f3f7fc; padding: 14px 24px;
      border-bottom: 1px solid #dce5f1; display: flex; align-items: center; gap: 16px; }
    button { border: 0; border-radius: 6px; padding: 10px 16px; background: #3564dc;
      color: white; cursor: pointer; font: inherit; }
    @media print { main { max-width: none; margin: 0; padding: 0; }
      .toolbar { display: none; } body { print-color-adjust: exact; } }
  `, a.head.append(o);

  function s(e, t = ``, n = a.body, r = ``) {
    let i = a.createElement(e);
    return i.textContent = t, i.className = r, n.append(i), i
  }
  let c = s(`div`, ``, a.body, `toolbar`),
    l = s(`button`, h(`打印 / 保存 PDF`), c);
  l.onclick = () => r.print(), s(`span`, h(`在打印窗口中选择“另存为 PDF”即可保存。`), c);
  let u = s(`main`);
  s(`div`, `Hispread AI`, u, `brand`);
  let d = s(`header`, ``, u, `meta`);
  s(`h1`, i, d), s(`p`, e.state === `PREVIEW` ? h(`预览 · 尚未生成`) : h(`批量生成结果`), d), s(`p`, h(`结算期间：{0} 至 {1}`, [e.periodStart, e.periodEnd]), d), e.confirmationDeadline && s(`p`, h(`供应商确认截止时间（北京时间）：{0}`, [new Date(e.confirmationDeadline).toLocaleString(_(), {
    timeZone: `Asia/Shanghai`,
    year: `numeric`,
    month: `2-digit`,
    day: `2-digit`,
    hour: `2-digit`,
    minute: `2-digit`,
    hour12: !1
  })]), d), e.id && s(`p`, h(`批次编号：{0}`, [e.id]), d), s(`h2`, h(`金额汇总`), u);
  let f = s(`div`, ``, u, `totals`);
  for (let [n, r] of Object.entries(e.totals)) s(`strong`, `${n} ${t(r,n)}`, f);
  Object.keys(e.totals).length || s(`span`, `—`, f), s(`p`, h(`不同币种分别汇总，需处理项不计入合计。`), u), e.incompleteDays > 0 && s(`p`, h(`该期间有 {0} 天存在采集异常，本汇总仅包含已拉取的日账。`, [e.incompleteDays]), u, `notice`);
  let p = (e.items || []).filter(e => e.state !== `FAILED`),
    m = (e.items || []).filter(e => e.state === `FAILED`);

  function v(e, n) {
    let r = s(`table`, ``, u),
      i = n ? [`24%`, `24%`, `52%`] : [`25%`, `23%`, `12%`, `25%`, `15%`],
      a = s(`colgroup`, ``, r);
    for (let e of i) s(`col`, ``, a).style.width = e;
    let o = s(`tr`, ``, s(`thead`, ``, r));
    (n ? [`供应商`, `项目`, `原因`] : [`供应商`, `项目`, `来源笔数`, `应付金额`, `状态`]).forEach((e, t) => s(`th`, h(e), o, !n && (t === 2 || t === 3) ? `numeric` : ``));
    let c = s(`tbody`, ``, r);
    for (let r of e) {
      let e = s(`tr`, ``, c);
      s(`td`, r.supplierName, e), s(`td`, r.projectName, e), n ? s(`td`, g(r.error), e) : (s(`td`, String(r.sourceCount), e, `numeric`), s(`td`, `${r.currency} ${t(r.total,r.currency)}`, e, `numeric`), s(`td`, r.state === `SUCCEEDED` ? h(`已生成`) : h(`待生成`), e))
    }
  }
  if (n) {
    s(`h2`, h(`供应商明细（{0} 家）`, [n.length]), u);
    let r = s(`table`, ``, u, `supplier-table`),
      i = s(`tr`, ``, s(`thead`, ``, r));
    for (let e of [`供应商`, `可结算笔数`, `可生成金额`, `状态`]) s(`th`, h(e), i);
    let a = s(`tbody`, ``, r);
    for (let e of n) {
      let n = s(`tr`, ``, a);
      s(`td`, e.name, n), s(`td`, String(e.count), n, `numeric`);
      let r = s(`td`, ``, n, `numeric`);
      for (let [n, i] of Object.entries(e.totals)) s(`div`, `${n} ${t(i,n)}`, r);
      Object.keys(e.totals).length || (r.textContent = `—`), s(`td`, e.blocked ? h(`{0} 笔需处理`, [e.blocked]) : h(`可生成`), n)
    }
    let o = s(`tr`, ``, s(`tfoot`, ``, r));
    s(`th`, h(`合计`), o), s(`td`, String(n.reduce((e, t) => e + t.count, 0)), o, `numeric`);
    let c = s(`td`, ``, o, `numeric`);
    for (let [n, r] of Object.entries(e.totals)) s(`strong`, `${n} ${t(r,n)}`, s(`div`, ``, c));
    s(`td`, ``, o)
  }
  p.length && (s(`h2`, h(`结算单明细（{0} 张）`, [p.length]), u), v(p, !1)), m.length && (s(`h2`, h(`需处理项（{0} 张，不计入合计）`, [m.length]), u), v(m, !0)), a.fonts.ready.then(() => {
    r.closed || r.print()
  })
}
var b = te(l(), 1),
  x = c();

function S() {
  let e = new Date(`${m()}T12:00:00`);
  return e.setDate(e.getDate() - 1), `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`
}

function ae() {
  let e = new Date(Date.now() + 432e6);
  return e.setMinutes(0, 0, 0), new Date(e.getTime() - e.getTimezoneOffset() * 6e4).toISOString().slice(0, 16)
}

function C({
  totals: e
}) {
  return (0, x.jsx)(x.Fragment, {
    children: Object.entries(e).map(([e, n]) => (0, x.jsxs)(`span`, {
      className: `batch-money`,
      children: [e, ` `, t(n, e)]
    }, e))
  })
}
var oe = (0, b.lazy)(() => p(() => import(`./SettlementPreview-CEv04HyA.js`), __vite__mapDeps([0, 1, 2, 3])));

function w({
  open: c,
  onClose: l,
  onSettlement: p
}) {
  let {
    refresh: _,
    has: te
  } = n(), [w, se] = (0, b.useState)(() => S().slice(0, 8) + `01`), [T, ce] = (0, b.useState)(S), [E, le] = (0, b.useState)(``), [D, ue] = (0, b.useState)(``), [de, fe] = (0, b.useState)(ae), [O, k] = (0, b.useState)([]), [A, pe] = (0, b.useState)(``), [j, M] = (0, b.useState)(null), [N, P] = (0, b.useState)(null), [me, he] = (0, b.useState)(!1), [F, I] = (0, b.useState)(!1), [L, R] = (0, b.useState)(``), [ge, z] = (0, b.useState)(``), [_e, ve] = (0, b.useState)(0), B = (0, b.useRef)(crypto.randomUUID()), V = (0, b.useRef)(crypto.randomUUID()), H = c || me, U = w && T && w <= T && T < m(), W = o(c && !j && U ? `/settlement-batches/candidates?periodStart=${w}&periodEnd=${T}` : null), G = o(`/settlement-batches?view=${_e}`, 5e3);
  (0, b.useEffect)(() => {
    if (!j || j.state !== `QUEUED` || !H) return;
    let t = !1,
      n, r = async () => {
        try {
          let i = await e(`/settlement-batches/${j.id}`, {
            headers: {
              "X-Hub-Background": `1`
            }
          });
          if (t) return;
          M(i), z(``), i.state === `COMPLETED` ? (_(), ve(e => e + 1)) : n = setTimeout(r, 2e3)
        } catch (e) {
          t || (z(e.message), n = setTimeout(r, 5e3))
        }
      };
    return n = setTimeout(r, 1e3), () => {
      t = !0, clearTimeout(n)
    }
  }, [j?.id, j?.state, H]);
  let ye = (W.data?.items || []).filter(e => (!E || e.projectId === E) && (!D || e.currency === D)),
    K = (0, b.useMemo)(() => {
      let e = new Map;
      for (let t of ye) {
        let n = e.get(t.supplierId) || {
          id: t.supplierId,
          name: t.supplierName,
          count: 0,
          blocked: 0,
          totals: {}
        };
        n.count += t.blockedCount ? 0 : t.sourceCount, n.blocked += t.blockedCount, t.blockedCount || (n.totals[t.currency] = i([n.totals[t.currency] || `0`, t.total])), e.set(n.id, n)
      }
      return [...e.values()]
    }, [W.data, E, D]),
    q = K.filter(e => e.name.toLowerCase().includes(A.trim().toLowerCase())),
    J = O.filter(e => K.some(t => t.id === e)),
    Y = {};
  for (let e of K)
    for (let [t, n] of Object.entries(e.totals)) Y[t] = i([Y[t] || `0`, n]);
  let be = K.filter(e => J.includes(e.id)),
    X = {},
    xe = 0;
  for (let e of be) {
    xe += e.count;
    for (let [t, n] of Object.entries(e.totals)) X[t] = i([X[t] || `0`, n])
  }
  let Se = U && !W.loading && !W.error,
    Z = e => {
      e(), k([]), R(``), B.current = crypto.randomUUID()
    },
    Q = () => {
      F || (P(null), he(!1), l(), M(null), R(``), z(``), B.current = crypto.randomUUID(), V.current = crypto.randomUUID())
    },
    $ = async e => {
      if (!F) {
        I(!0), R(``);
        try {
          await e()
        } catch (e) {
          R(e.message)
        } finally {
          I(!1)
        }
      }
    }, Ce = t => $(async () => {
      M(await e(`/settlement-batches/${t}`)), he(!0)
    }), we = [...new Map((W.data?.items || []).map(e => [e.projectId, {
      value: e.projectId,
      label: e.projectName
    }])).values()];
  return (0, x.jsxs)(x.Fragment, {
    children: [L && !H && (0, x.jsx)(d, {
      tone: `red`,
      children: L
    }), H && (0, x.jsxs)(r, {
      title: j ? j.state === `PREVIEW` ? h(`批量结算单预览`) : h(`批量生成结果`) : h(`批量新建结算单`),
      wide: !0,
      className: `settlement-batch-modal`,
      onClose: Q,
      children: [L && (0, x.jsx)(d, {
        tone: `red`,
        children: L
      }), !j && (0, x.jsx)(x.Fragment, {
        children: !!G.data?.length && (0, x.jsxs)(`details`, {
          className: `card settlement-batch-history`,
          children: [(0, x.jsxs)(`summary`, {
            children: [h(`最近批量结算 `), G.data.some(e => e.state === `QUEUED`) ? h(` · 有任务正在生成`) : ``]
          }), G.data.map(e => (0, x.jsxs)(`div`, {
            className: `settlement-batch-history-row`,
            children: [(0, x.jsxs)(`span`, {
              children: [e.periodStart, h(` 至 `), e.periodEnd, ` · `, e.supplierCount, h(` 家供应商 `)]
            }), (0, x.jsxs)(`span`, {
              children: [e.state === `QUEUED` ? h(`生成中 · 已生成 {0} 张`, [e.successCount]) : h(`已生成 {0} 张`, [e.successCount]), e.failedCount > 0 ? h(` · {0} 张需处理`, [e.failedCount]) : ``]
            }), (0, x.jsx)(y, {
              disabled: F,
              onClick: () => Ce(e.id),
              children: h(`查看结果 `)
            })]
          }, e.id))]
        })
      }), j ? (0, x.jsxs)(x.Fragment, {
        children: [(0, x.jsxs)(`div`, {
          className: `settlement-batch-summary`,
          children: [(0, x.jsx)(`strong`, {
            children: j.state === `PREVIEW` ? h(`已选 {0} 家供应商 · 可生成 {1} 张结算单`, [j.supplierCount, j.readyCount]) : j.state === `QUEUED` ? h(`正在生成 · 已生成 {0} 张`, [j.successCount]) : h(`已生成 {0} 张结算单`, [j.successCount])
          }), (0, x.jsx)(`div`, {
            children: (0, x.jsx)(C, {
              totals: j.totals
            })
          }), (0, x.jsxs)(`span`, {
            children: [j.periodStart, h(` 至 `), j.periodEnd]
          })]
        }), j.state === `PREVIEW` && j.incompleteDays > 0 && (0, x.jsxs)(d, {
          tone: `red`,
          children: [h(`该期间有 `), j.incompleteDays, ` `, h(`天存在采集异常。本次只结算已拉取的日账，不代表该期间已全部结清。 `)]
        }), j.state === `PREVIEW` && (0, x.jsxs)(`p`, {
          children: [h(`供应商确认截止时间：`), a(j.confirmationDeadline), h(`。逾期未提出异议将自动确认。 `)]
        }), j.state === `QUEUED` && (0, x.jsx)(d, {
          children: h(`后台正在处理，关闭页面后仍会继续。可在“最近批量结算”查看结果。`)
        }), ge && (0, x.jsxs)(d, {
          tone: `red`,
          children: [h(`暂时无法更新进度：`), ge, h(`。正在重试，可稍后重新查看。 `)]
        }), j.failedCount > 0 && (0, x.jsxs)(d, {
          tone: `red`,
          children: [j.failedCount, h(` 张结算单需处理，其余单据 `), j.state === `PREVIEW` ? h(`可正常生成`) : h(`正常生成`), h(`。 `)]
        }), j.items?.some(e => e.state === `FAILED`) && (0, x.jsx)(u, {
          data: j.items.filter(e => e.state === `FAILED`),
          columns: [{
            label: h(`供应商`),
            render: e => e.supplierName
          }, {
            label: h(`项目`),
            render: e => e.projectName
          }, {
            label: h(`币种`),
            render: e => e.currency
          }, {
            label: h(`原因`),
            render: e => e.error ? g(e.error) : `—`
          }]
        }), (0, x.jsxs)(`details`, {
          className: `settlement-batch-options`,
          open: j.state === `PREVIEW` || void 0,
          children: [(0, x.jsx)(`summary`, {
            children: j.state === `PREVIEW` ? h(`待生成结算单 · 可逐张预览`) : h(`查看结算单明细`)
          }), (0, x.jsx)(u, {
            data: (j.items || []).filter(e => e.state !== `FAILED`),
            columns: [{
              label: h(`供应商`),
              render: e => e.supplierName
            }, {
              label: h(`项目`),
              render: e => e.projectName
            }, {
              label: h(`来源笔数`),
              render: e => e.sourceCount
            }, {
              label: h(`应付金额`),
              render: e => `${e.currency} ${t(e.total,e.currency)}`
            }, {
              label: h(`状态`),
              render: e => e.state === `SUCCEEDED` ? h(`已生成`) : j.state === `PREVIEW` ? h(`待生成`) : h(`处理中`)
            }, {
              label: ``,
              render: e => j.state === `PREVIEW` ? (0, x.jsx)(y, {
                onClick: () => P(e.id),
                children: h(`预览结算单`)
              }) : e.settlementId && te(`settlement.read`) && (0, x.jsx)(y, {
                onClick: () => {
                  let t = e.settlementId;
                  Q(), p(t)
                },
                children: h(`查看结算单 `)
              })
            }]
          })]
        }), (0, x.jsxs)(`div`, {
          className: `settlement-batch-actions`,
          children: [j.state === `PREVIEW` && (0, x.jsx)(y, {
            disabled: F,
            onClick: () => {
              M(null), B.current = crypto.randomUUID()
            },
            children: h(`返回选择 `)
          }), j.state !== `QUEUED` && (0, x.jsx)(y, {
            disabled: F || !j.items?.length,
            onClick: () => {
              try {
                ie(j)
              } catch (e) {
                R(e.message)
              }
            },
            children: h(`导出汇总 PDF`)
          }), (0, x.jsx)(y, {
            onClick: Q,
            children: h(`关闭`)
          }), j.state === `PREVIEW` && (0, x.jsx)(y, {
            variant: `primary`,
            disabled: F || !j.readyCount,
            onClick: () => $(async () => {
              M(await v(`/settlement-batches/${j.id}/start`, {})), ve(e => e + 1), _()
            }),
            children: h(F ? `正在提交…` : `确认生成`)
          }), j.state === `COMPLETED` && j.failedCount > 0 && (0, x.jsx)(y, {
            variant: `primary`,
            disabled: F,
            onClick: () => $(async () => {
              M(await v(`/settlement-batches/${j.id}/retry-preview`, {
                requestKey: V.current
              })), V.current = crypto.randomUUID()
            }),
            children: h(F ? `正在核算…` : `重新生成未完成项`)
          })]
        })]
      }) : (0, x.jsxs)(x.Fragment, {
        children: [(0, x.jsxs)(`div`, {
          className: `settlement-batch-fields`,
          children: [(0, x.jsxs)(`label`, {
            children: [h(`来源开始日期`), (0, x.jsx)(`input`, {
              "aria-label": h(`来源开始日期`),
              type: `date`,
              value: w,
              max: T,
              onChange: e => Z(() => se(e.target.value))
            })]
          }), (0, x.jsxs)(`label`, {
            children: [h(`来源结束日期`), (0, x.jsx)(`input`, {
              "aria-label": h(`来源结束日期`),
              type: `date`,
              value: T,
              min: w,
              max: S(),
              onChange: e => Z(() => ce(e.target.value))
            })]
          })]
        }), (0, x.jsx)(d, {
          children: h(`日期用于筛选明细，结算周期按所选明细的最早开始日期和最晚结束日期自动识别。`)
        }), (0, x.jsxs)(`details`, {
          className: `settlement-batch-options`,
          children: [(0, x.jsx)(`summary`, {
            children: h(`更多设置 · 默认全部项目、全部币种，五天内确认`)
          }), (0, x.jsxs)(`div`, {
            className: `settlement-batch-fields`,
            children: [(0, x.jsxs)(`label`, {
              children: [h(`项目 `), (0, x.jsx)(ee, {
                ariaLabel: h(`批量结算项目`),
                value: E,
                onChange: e => Z(() => le(e)),
                options: [{
                  value: ``,
                  label: h(`全部项目`)
                }, ...we]
              })]
            }), (0, x.jsxs)(`label`, {
              children: [h(`币种 `), (0, x.jsx)(ee, {
                ariaLabel: h(`批量结算币种`),
                value: D,
                onChange: e => Z(() => ue(e)),
                options: [{
                  value: ``,
                  label: h(`全部币种`)
                }, ...s.map(e => ({
                  value: e,
                  label: e
                }))]
              })]
            }), (0, x.jsxs)(`label`, {
              children: [h(`供应商确认截止时间 `), (0, x.jsx)(`input`, {
                type: `datetime-local`,
                "aria-label": h(`批量供应商确认截止时间`),
                value: de,
                onChange: e => Z(() => fe(e.target.value))
              })]
            })]
          })]
        }), !U && (0, x.jsx)(d, {
          children: h(`请选择有效的结算期间，结束日期最晚为昨天。`)
        }), W.data?.summaryUpdating && (0, x.jsx)(d, {
          tone: `amber`,
          children: h(`日账静态汇总正在更新，请等待生成完成后重新预览`)
        }), !!W.data?.incompleteDays && (0, x.jsxs)(d, {
          tone: `red`,
          children: [h(`该期间有 `), W.data.incompleteDays, ` `, h(`天存在采集异常，金额仅包含已拉取的日账；遗漏账单补齐后可再次结算。 `)]
        }), W.loading && (0, x.jsx)(f, {}), W.error && (0, x.jsxs)(d, {
          tone: `red`,
          children: [h(`加载供应商失败：`), W.error, (0, x.jsx)(y, {
            onClick: _,
            children: h(`重试`)
          })]
        }), U && !W.loading && !W.error && (0, x.jsxs)(x.Fragment, {
          children: [(0, x.jsxs)(`div`, {
            className: `settlement-batch-toolbar`,
            children: [(0, x.jsx)(ne, {
              value: A,
              onChange: pe,
              placeholder: h(`搜索供应商`)
            }), (0, x.jsx)(y, {
              onClick: () => {
                k([...new Set([...O, ...q.map(e => e.id)])]), B.current = crypto.randomUUID()
              },
              children: h(A ? `选择全部搜索结果` : `选择全部供应商`)
            }), (0, x.jsx)(y, {
              onClick: () => {
                k([]), B.current = crypto.randomUUID()
              },
              children: h(`清空 `)
            }), (0, x.jsxs)(`span`, {
              children: [h(`已选 `), J.length, h(` 家`)]
            })]
          }), (0, x.jsxs)(`div`, {
            className: `settlement-batch-list-total`,
            children: [(0, x.jsxs)(`div`, {
              children: [(0, x.jsx)(`strong`, {
                children: h(`可结算总金额`)
              }), (0, x.jsx)(C, {
                totals: Y
              })]
            }), (0, x.jsx)(y, {
              disabled: !K.length,
              onClick: () => {
                try {
                  re({
                    periodStart: w,
                    periodEnd: T,
                    totals: Y,
                    suppliers: K,
                    incompleteDays: W.data?.incompleteDays || 0
                  })
                } catch (e) {
                  R(e.message)
                }
              },
              children: h(`下载汇总 PDF`)
            })]
          }), (0, x.jsx)(u, {
            data: q,
            columns: [{
              label: h(`选择`),
              render: e => (0, x.jsx)(`input`, {
                type: `checkbox`,
                "aria-label": h(`选择{0}`, [e.name]),
                checked: O.includes(e.id),
                onChange: t => {
                  k(t.target.checked ? [...O, e.id] : O.filter(t => t !== e.id)), B.current = crypto.randomUUID()
                }
              })
            }, {
              label: h(`供应商`),
              render: e => e.name
            }, {
              label: h(`可结算笔数`),
              render: e => e.count
            }, {
              label: h(`可生成金额`),
              render: e => (0, x.jsx)(C, {
                totals: e.totals
              })
            }, {
              label: h(`状态`),
              render: e => e.blocked ? h(`{0} 笔需处理`, [e.blocked]) : h(`可生成`)
            }]
          })]
        }), (0, x.jsx)(`p`, {
          className: `muted`,
          children: h(`按已拉取的可结算日账生成。不同项目和币种自动分单；缺报价或来源异常的单据单独提示。 `)
        }), (0, x.jsxs)(`div`, {
          className: `settlement-batch-actions`,
          children: [(0, x.jsxs)(`div`, {
            className: `settlement-batch-selected-total`,
            role: `status`,
            "aria-live": `polite`,
            children: [(0, x.jsx)(`strong`, {
              children: h(`已选金额汇总`)
            }), Se ? (0, x.jsxs)(x.Fragment, {
              children: [(0, x.jsx)(`div`, {
                children: Object.keys(X).length ? (0, x.jsx)(C, {
                  totals: X
                }) : (0, x.jsx)(`span`, {
                  children: `—`
                })
              }), (0, x.jsx)(`small`, {
                children: h(`已选 {0} 家供应商 · {1} 笔可结算`, [J.length, xe])
              })]
            }) : (0, x.jsx)(`span`, {
              children: h(`金额待核算`)
            })]
          }), (0, x.jsx)(y, {
            onClick: Q,
            children: h(`取消`)
          }), (0, x.jsx)(y, {
            variant: `primary`,
            disabled: F || W.loading || !!W.error || !U || !J.length,
            onClick: () => $(async () => {
              let e = await v(`/settlement-batches/preview`, {
                periodStart: w,
                periodEnd: T,
                supplierIds: J,
                projectId: E,
                currency: D,
                confirmationDeadline: new Date(de).toISOString(),
                requestKey: B.current
              });
              M(e)
            }),
            children: h(F ? `正在核算…` : `预览结算单`)
          })]
        })]
      })]
    }), N && j?.state === `PREVIEW` && (() => {
      let t = (j.items || []).filter(e => e.state === `READY`),
        n = t.findIndex(e => e.id === N);
      return (0, x.jsx)(b.Suspense, {
        fallback: (0, x.jsx)(f, {}),
        children: (0, x.jsx)(oe, {
          loadPage: (t, n) => e(`/settlement-batches/${j.id}/items/${N}/preview?page=${t}&size=${n}`),
          onClose: () => P(null),
          navigation: {
            index: n,
            count: t.length,
            onPrevious: () => P(t[n - 1].id),
            onNext: () => P(t[n + 1].id)
          }
        }, N)
      })
    })()]
  })
}
export {
  w as
  default
};