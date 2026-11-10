// origin: assets/DailyAccounting-z_8v-GqX.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/DailyExports-q6_gv_XE.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/systemLabels-DqpNuQ-_.js"]))) => i.map(i => d[i]);
import {
  $ as e,
  $ as confirmRequest,
  A as t,
  C as n,
  S as r,
  X as i,
  Z as a,
  _ as o,
  b as s,
  c as ee,
  g as c,
  h as l,
  i as u,
  mt as d,
  ot as te,
  pt as f,
  s as p,
  u as m,
  ut as h,
  vt as g,
  y as _
} from "./index-Dnr0i-H9.js";
import {
  i as ne,
  r as re
} from "./QueryFilters-CwGBc_NH.js";
import {
  r as v,
  t as ie
} from "./DateRangePicker-DtOG4QUZ.js";
import {
  t as ae
} from "./useSummaryRefresh-B-5uMwFV.js";
import {
  t as y
} from "./MoneyDisplay-Bphc56N8.js";
var b = g(a(), 1),
  x = i(),
  S = (0, b.lazy)(() => u(() => import(`./DailyExports-q6_gv_XE.js`), __vite__mapDeps([0, 1, 2, 3])));

function oe(t) {
  let [n, r] = (0, b.useState)(null), [i, a] = (0, b.useState)(0), o = n !== null;
  (0, b.useEffect)(() => {
    if (o) return;
    let t = !0,
      n = 0,
      r, i = new AbortController;
    async function s(o = !1) {
      if (t) {
        if (o || document.visibilityState === `visible`) try {
          let r = await e(`/accounting/daily/exports?page=1&type=&state=`, {
            signal: i.signal
          });
          if (!t) return;
          n = r.activeCount, a(r.activeCount)
        } catch {}
        t && n > 0 && (r = window.setTimeout(s, 4e3))
      }
    }
    return s(!0), () => {
      t = !1, i.abort(), window.clearTimeout(r)
    }
  }, [o]);
  let s = e => r(n => ({
    type: e,
    sequence: (n?.sequence || 0) + 1,
    scope: {
      filter: {
        ...t.filter
      },
      supplierName: t.supplierName,
      projectName: t.projectName
    }
  }));
  return (0, x.jsxs)(x.Fragment, {
    children: [(0, x.jsxs)(`div`, {
      className: `daily-export-actions`,
      "aria-label": d(`日账导出`),
      children: [(0, x.jsx)(p, {
        icon: `download`,
        disabled: t.disabled || t.count === 0,
        title: d(`导出当前筛选的全部供应商汇总，包含折扣`),
        onClick: () => s(`SUPPLIER`),
        children: d(`供应商汇总导出`)
      }), (0, x.jsx)(p, {
        icon: `download`,
        disabled: t.disabled || t.count === 0,
        title: t.count === 0 ? d(`当前筛选没有记录`) : d(`导出当前筛选的全部汇总`),
        onClick: () => s(`SUMMARY`),
        children: d(`导出汇总 `)
      }), (0, x.jsx)(p, {
        icon: `download`,
        disabled: t.disabled || t.count === 0,
        title: t.count === 0 ? d(`当前筛选没有记录`) : d(`导出当前筛选的全部明细`),
        onClick: () => s(`DETAIL`),
        children: d(`导出明细 `)
      }), (0, x.jsxs)(p, {
        onClick: () => s(`TASKS`),
        children: [d(`导出任务`), i ? d(`（{0}）`, [i]) : ``]
      })]
    }), n && (0, x.jsx)(b.Suspense, {
      fallback: (0, x.jsx)(l, {}),
      children: (0, x.jsx)(S, {
        ...t,
        actionRequest: n,
        hideActions: !0,
        onActiveCountChange: a
      })
    })]
  })
}
var C = {
  RESOURCE: d(`资源金额`),
  MANUAL: d(`手工款`),
  EXTERNAL: d(`外部金额`),
  CCMAX_OBSERVATION: d(`CCMAX 待核对采集`),
  CCMAX: d(`CCMAX 模型消耗`)
};

function se(e) {
  return new Date(e).toLocaleString(f(), {
    timeZone: `Asia/Shanghai`,
    month: `2-digit`,
    day: `2-digit`,
    hour: `2-digit`,
    minute: `2-digit`,
    hour12: !1
  })
}

function w({
  onOpenPeriods: e
}) {
  let {
    refresh: i,
    has: a
  } = n(), [l, u] = (0, b.useState)(() => ({
    ...v(),
    search: ``,
    supplier: ``,
    project: ``,
    model: ``,
    sourceKind: ``,
    reviewStatus: ``
  })), [f, g] = (0, b.useState)(l), {
    from: S,
    to: w,
    search: T,
    supplier: E,
    project: D,
    model: O,
    sourceKind: k,
    reviewStatus: A
  } = l, [j, M] = (0, b.useState)(`supplier`), [N, P] = (0, b.useState)(`consumptionTotal`), [F, I] = (0, b.useState)(`DESC`), [L, R] = (0, b.useState)(1), [z, B] = (0, b.useState)(10), V = (e = f) => {
    let t = {
      ...e,
      search: e.search.trim(),
      model: e.model.trim()
    };
    g(t), R(1), u(t), JSON.stringify(t) === JSON.stringify(l) && i()
  }, H = new URLSearchParams({
    from: S,
    to: w,
    search: T,
    supplier: E,
    project: D,
    model: O,
    sourceKind: k,
    reviewStatus: A
  }).toString(), ce = new URLSearchParams({
    from: S,
    to: w,
    search: T,
    supplier: E,
    project: D,
    model: O,
    sourceKind: k,
    reviewStatus: A,
    page: String(L),
    size: String(z),
    includeSummary: `false`
  }), U = r(j === `detail` ? `/accounting/daily?${ce}` : null), W = r(`/accounting/daily/summary?${H}`), le = j === `supplier` && N ? `&${new URLSearchParams({sortBy:N,sortDirection:F})}` : ``, G = r(j === `detail` ? null : `/accounting/daily/groups?${H}&page=${L}&size=${z}&groupBy=${j===`supplier`?`SUPPLIER`:`DAY`}${le}`);
  ae(W.data, W.reload), ae(G.data, G.reload);
  let K = !W.loading && !W.error && !!W.data,
    q = ne(a(`supplier.read`)),
    J = r(a(`project.read`) ? `/projects?page=1&size=100` : null),
    Y = K ? W.data.totals : [],
    X = K ? W.data.projects : [],
    Z = j === `supplier` || Y.some(e => e.pendingCount > 0) || (G.data?.items.some(e => e.pendingCount > 0) ?? !1),
    Q = j === `supplier` || Y.some(e => e.confirmedCount > 0) || (G.data?.items.some(e => e.confirmedCount > 0) ?? !1);

  function $(e, t) {
    if (j !== `supplier`) return (0, x.jsx)(`th`, {
      children: t
    });
    let n = N === e,
      r = n ? F : null,
      i = d(n ? r === `DESC` ? `按金额从低到高排序` : `取消金额排序` : `按金额从高到低排序`);
    return (0, x.jsx)(`th`, {
      "aria-sort": r === `ASC` ? `ascending` : r === `DESC` ? `descending` : `none`,
      children: (0, x.jsxs)(`button`, {
        type: `button`,
        className: `quote-sort-button${n?` active`:``}`,
        "aria-label": d(`{0}：{1}`, [t, i]),
        title: i,
        onClick: () => {
          n ? r === `DESC` ? I(`ASC`) : (P(``), I(`DESC`)) : (P(e), I(`DESC`)), R(1)
        },
        children: [t, (0, x.jsx)(`span`, {
          "aria-hidden": `true`,
          children: r === `ASC` ? ` ↑` : r === `DESC` ? ` ↓` : ` ↕`
        })]
      })
    })
  }
  return (0, x.jsx)(x.Fragment, {
    children: (0, x.jsxs)(`section`, {
      className: `panel`,
      children: [(0, x.jsxs)(`form`, {
        className: `daily-query daily-query-form`,
        onSubmit: e => {
          e.preventDefault(), V()
        },
        children: [(0, x.jsxs)(`div`, {
          className: `daily-query-field`,
          children: [(0, x.jsx)(`span`, {
            children: d(`关键词`)
          }), (0, x.jsx)(_, {
            value: f.search,
            onChange: e => g(t => ({
              ...t,
              search: e
            })),
            placeholder: d(`来源编号或关键词`)
          })]
        }), (0, x.jsxs)(`div`, {
          className: `daily-query-field`,
          children: [(0, x.jsx)(`span`, {
            children: d(`供应商`)
          }), (0, x.jsx)(re, {
            label: d(`供应商`),
            value: f.supplier,
            onChange: e => g(t => ({
              ...t,
              supplier: e
            })),
            options: (q.data?.items || []).map(e => ({
              value: e.id,
              label: e.name,
              detail: e.code
            })),
            loading: q.loading,
            error: q.error
          })]
        }), (0, x.jsxs)(`div`, {
          className: `daily-query-field`,
          children: [(0, x.jsx)(`span`, {
            children: d(`项目`)
          }), (0, x.jsx)(m, {
            ariaLabel: d(`项目`),
            visual: `project`,
            value: f.project,
            searchPlaceholder: d(`搜索项目名称或编码`),
            onChange: e => g(t => ({
              ...t,
              project: e
            })),
            options: [{
              value: ``,
              label: d(`全部项目`)
            }, ...(J.data?.items ?? []).map(e => ({
              value: e.id,
              label: e.name,
              detail: e.code
            }))]
          })]
        }), (0, x.jsxs)(`div`, {
          className: `daily-query-field`,
          children: [(0, x.jsx)(`span`, {
            children: d(`模型`)
          }), (0, x.jsx)(_, {
            value: f.model,
            onChange: e => g(t => ({
              ...t,
              model: e
            })),
            placeholder: d(`全部模型`)
          })]
        }), (0, x.jsxs)(`div`, {
          className: `daily-query-field`,
          children: [(0, x.jsx)(`span`, {
            children: d(`来源`)
          }), (0, x.jsx)(m, {
            ariaLabel: d(`来源类型`),
            value: f.sourceKind,
            onChange: e => g(t => ({
              ...t,
              sourceKind: e
            })),
            options: [{
              value: ``,
              label: d(`全部来源`)
            }, ...Object.entries(C).map(([e, t]) => ({
              value: e,
              label: t
            }))]
          })]
        }), (0, x.jsxs)(`div`, {
          className: `daily-query-field`,
          children: [(0, x.jsx)(`span`, {
            children: d(`账务日期`)
          }), (0, x.jsx)(ie, {
            from: f.from,
            to: f.to,
            label: d(`账务日期`),
            onChange: (e, t) => {
              g(n => ({
                ...n,
                from: e,
                to: t
              }))
            }
          })]
        }), (0, x.jsxs)(`div`, {
          className: `daily-query-actions`,
          children: [(0, x.jsx)(p, {
            type: `submit`,
            variant: `primary`,
            icon: `search`,
            children: d(`查询`)
          }), (0, x.jsx)(p, {
            type: `button`,
            onClick: () => {
              V({
                ...f,
                ...v(),
                search: ``,
                supplier: ``,
                project: ``,
                model: ``,
                sourceKind: ``,
                reviewStatus: ``
              })
            },
            children: d(`重置 `)
          }), (0, x.jsx)(p, {
            type: `button`,
            icon: `refresh`,
            "aria-label": d(`刷新日账`),
            onClick: i
          })]
        })]
      }), JSON.stringify(f) !== JSON.stringify(l) && (0, x.jsx)(`p`, {
        className: `muted small daily-query-status`,
        role: `status`,
        children: d(`筛选条件已修改，点击查询后更新结果。`)
      }), (K ? W.data.crossPeriodCount : 0) > 0 && (0, x.jsxs)(c, {
        tone: `orange`,
        children: [d(`当前日期范围有 `), W.data?.crossPeriodCount, ` `, d(`笔跨天金额未计入日账。直接录入的真实结算金额可按完整期间结算；其他未结算记录需按真实每日金额重新录入，已结算记录需人工核对。`), ` `, (0, x.jsx)(`button`, {
          className: `text-button`,
          onClick: e,
          children: d(`查看金额记录 `)
        })]
      }), (W.data?.summaryUpdating || G.data?.summaryUpdating) && (0, x.jsx)(c, {
        children: d(`汇总更新中，将自动刷新`)
      }), W.loading && (0, x.jsx)(`p`, {
        className: `muted small`,
        children: d(`正在加载日账统计…`)
      }), W.error && (0, x.jsxs)(c, {
        tone: `red`,
        children: [d(`日账统计加载失败：`), W.error, ` `, (0, x.jsx)(`button`, {
          className: `text-button`,
          onClick: i,
          children: d(`重试统计 `)
        })]
      }), Y.length > 0 && (0, x.jsxs)(x.Fragment, {
        children: [(0, x.jsx)(`div`, {
          className: `daily-bill-stats daily-bill-stats-four`,
          children: [
            [d(`消耗合计`), `consumptionTotal`, d(`已拉取的真实消耗合计`)],
            [d(`已入账金额`), `confirmedOriginal`, d(`已自动计价入账的原始金额`)],
            [d(`待计价消耗`), `pendingConsumption`, d(`今日或缺报价等原因尚未计价入账`)],
            [d(`未结算金额`), `unsettledPayable`, d(`已入账且尚未生成结算单的应付金额`)]
          ].map(([e, t, n]) => (0, x.jsxs)(`div`, {
            className: `daily-bill-card`,
            children: [(0, x.jsx)(`span`, {
              children: e
            }), Y.map(e => (0, x.jsx)(`strong`, {
              className: `daily-bill-figure`,
              children: (0, x.jsx)(y, {
                currency: e.currency,
                value: e[t]
              })
            }, e.currency)), (0, x.jsx)(`small`, {
              children: n
            })]
          }, e))
        }), X.some(e => e.count > 0) && (0, x.jsxs)(`div`, {
          className: `daily-project-strip`,
          children: [(0, x.jsx)(`span`, {
            children: d(`项目统计`)
          }), X.filter(e => e.count > 0).map((e, t) => (0, x.jsxs)(`span`, {
            className: `daily-project-chip ${[`blue`,`violet`,`green`,`amber`][t%4]}`,
            children: [(0, x.jsx)(`b`, {
              children: e.projectName
            }), (0, x.jsxs)(`em`, {
              children: [e.count, d(` 条`)]
            }), (0, x.jsx)(`strong`, {
              children: (0, x.jsx)(y, {
                currency: e.currency,
                value: e.amount
              })
            })]
          }, `${e.projectId}:${e.currency}`))]
        })]
      }), (0, x.jsxs)(`div`, {
        className: `daily-viewbar`,
        children: [(0, x.jsxs)(`div`, {
          className: `daily-view-switch`,
          role: `group`,
          "aria-label": d(`日账视图`),
          children: [(0, x.jsx)(`button`, {
            type: `button`,
            "aria-pressed": j === `summary`,
            className: j === `summary` ? `active` : ``,
            onClick: () => {
              M(`summary`), R(1)
            },
            children: d(`按日汇总 `)
          }), (0, x.jsx)(`button`, {
            type: `button`,
            "aria-pressed": j === `supplier`,
            className: j === `supplier` ? `active` : ``,
            onClick: () => {
              M(`supplier`), R(1)
            },
            children: d(`按供应商汇总`)
          }), (0, x.jsx)(`button`, {
            type: `button`,
            "aria-pressed": j === `detail`,
            className: j === `detail` ? `active` : ``,
            onClick: () => {
              M(`detail`), R(1)
            },
            children: d(`明细 `)
          })]
        }), (0, x.jsxs)(`div`, {
          className: `daily-viewbar-actions`,
          children: [K && (0, x.jsxs)(`span`, {
            children: [W.data.total, d(` 条记录 · `), j === `supplier` ? G.loading || G.error ? `—` : G.data?.total ?? `—` : W.data.groupCount, d(` 组 `)]
          }), a(`settlement.export`) && a(`usage.read`) && (0, x.jsx)(oe, {
            filter: {
              from: S,
              to: w,
              search: T,
              supplier: E,
              project: D,
              model: O,
              sourceKind: k,
              reviewStatus: A
            },
            count: K ? W.data.total : 0,
            disabled: !K,
            supplierName: q.data?.items.find(e => e.id === E)?.name || E || d(`全部供应商`),
            projectName: J.data?.items.find(e => e.id === D)?.name || D || d(`全部项目`)
          })]
        })]
      }), (0, x.jsx)(`p`, {
        className: `daily-accounting-hint`,
        children: d(`拉取金额即为真实账单，无需核验。当天账单次日可结算（北京时间）。`)
      }), j === `detail` ? (0, x.jsxs)(x.Fragment, {
        children: [(0, x.jsx)(ee, {
          loading: U.loading,
          error: U.error,
          data: U.data?.items || [],
          columns: [{
            label: d(`账务日期`),
            render: e => (0, x.jsx)(`strong`, {
              className: `mono`,
              children: e.businessDate
            })
          }, {
            label: d(`供应商`),
            render: e => (0, x.jsx)(`strong`, {
              children: e.supplierName
            })
          }, {
            label: d(`服务 / 项目`),
            render: e => (0, x.jsxs)(`div`, {
              className: `stack`,
              children: [(0, x.jsx)(`strong`, {
                children: e.projectName
              }), (0, x.jsx)(`small`, {
                children: e.projectCategory || d(`未分类`)
              })]
            })
          }, {
            label: d(`来源`),
            render: e => (0, x.jsxs)(`div`, {
              className: `stack`,
              children: [(0, x.jsx)(`span`, {
                children: C[e.sourceKind]
              }), e.modelKey && (0, x.jsxs)(`small`, {
                children: [d(`模型：`), e.modelKey]
              }), e.resourceUsageId && (0, x.jsx)(`small`, {
                children: d(`历史期间总费用来源`)
              }), (0, x.jsx)(`small`, {
                className: `mono`,
                children: e.sourceRef
              })]
            })
          }, {
            label: d(`消耗 / 原始金额`),
            className: `align-right`,
            render: e => (0, x.jsxs)(`div`, {
              className: `stack`,
              children: [(0, x.jsx)(`span`, {
                className: `money`,
                children: (0, x.jsx)(y, {
                  currency: e.currency,
                  value: e.exactConsumption ?? e.originalAmount
                })
              }), e.quantity && (0, x.jsxs)(`small`, {
                children: [d(`计价数量 `), e.quantity]
              })]
            })
          }, {
            label: d(`结算折扣 / 单价`),
            render: e => e.pricingType === `DIRECT` ? d(`直接录入真实结算金额`) : e.pricingType === `DISCOUNT` ? (0, x.jsxs)(`div`, {
              className: `stack`,
              children: [(0, x.jsx)(`strong`, {
                children: e.settlementMultiplier == null ? `—` : h(e.settlementMultiplier)
              }), (0, x.jsx)(`small`, {
                children: e.pricingProvisional ? d(`当前有效报价`) : d(`入账时报价`)
              })]
            }) : e.pricingType === `FIXED` ? (0, x.jsxs)(`div`, {
              className: `stack`,
              children: [(0, x.jsx)(`strong`, {
                children: d(`按单价`)
              }), (0, x.jsxs)(`small`, {
                children: [e.currency, ` `, e.settlementUnitPrice ?? `—`, d(` / 个 `), (e.pricingProvisional, ``)]
              })]
            }) : e.pricingProvisional ? te(e.pricingIssue || d(`暂无唯一有效报价`)) : `—`
          }, {
            label: d(`应付`),
            className: `align-right`,
            render: e => (0, x.jsx)(`strong`, {
              className: `money`,
              children: e.finalAmount == null ? d(`待计价`) : `${e.currency} ${t(e.finalAmount,e.currency)}`
            })
          }, {
            label: d(`状态`),
            render: e => (0, x.jsxs)(`div`, {
              className: `stack`,
              children: [(0, x.jsx)(`strong`, {
                children: {
                  UNSETTLED: d(`待结算`),
                  SETTLING: d(`结算中`),
                  AWAITING_PAYMENT: d(`待付款`),
                  PARTIALLY_PAID: d(`部分付款`),
                  PAID: d(`已付款`),
                  NO_PAYMENT_DUE: d(`无需付款`),
                  NEEDS_REVIEW: d(`待计价`),
                  PENDING_REVIEW: d(`待自动计价`),
                  CURRENT_DAY_PROVISIONAL: d(`今日账单 · 次日可结算`)
                } [e.displayState]
              }), e.currentDayProvisional && e.observationQueriedAt && (0, x.jsxs)(`small`, {
                children: [d(`最近查询 `), se(e.observationQueriedAt), d(`（北京时间）· 次日可结算 `)]
              }), e.sourceChanged && (0, x.jsxs)(`small`, {
                children: [d(`上游金额已修订，`), e.state === `AVAILABLE` ? d(`暂停结算`) : d(`需核对差额`)]
              }), e.settlementCode && (0, x.jsx)(`small`, {
                className: `mono`,
                children: e.settlementCode
              }), e.displayState === `PARTIALLY_PAID` && (0, x.jsxs)(`small`, {
                children: [d(`整单已付 `), e.settlementPaidAmount, ` / `, e.settlementTotal]
              })]
            })
          }, ...a(`usage.import`) ? [{
            label: d(`操作`),
            render: row => row.sourceKind === `CCMAX_OBSERVATION` && row.state === `PENDING` ? (0, x.jsx)(p, {
              onClick: async () => {
                try {
                  await confirmRequest(`/settlement-inputs/${encodeURIComponent(row.sourceId || row.id)}/confirm`, {
                    method: `POST`, headers: {"Content-Type": `application/json`},
                    body: JSON.stringify({version: row.version})
                  });
                  i()
                } catch (error) {window.alert(error.message)}
              },
              children: d(`确认采集金额`)
            }) : `—`
          }] : []]
        }), (0, x.jsx)(o, {
          data: U.data,
          page: L,
          onPage: R,
          size: z,
          onSizeChange: e => {
            B(e), R(1)
          }
        })]
      }) : G.loading ? (0, x.jsx)(`div`, {
        className: `daily-summary-empty`,
        children: d(`正在汇总…`)
      }) : G.error ? (0, x.jsx)(c, {
        tone: `red`,
        children: G.error
      }) : G.data && (0, x.jsxs)(`div`, {
        className: `daily-summary`,
        children: [(0, x.jsx)(`div`, {
          className: `daily-summary-heading`,
          children: (0, x.jsxs)(`div`, {
            children: [(0, x.jsx)(`strong`, {
              children: d(j === `supplier` ? `供应商 × 币种 × 折扣汇总` : `日期 × 供应商 × 项目汇总`)
            }), (0, x.jsxs)(`small`, {
              children: [d(`按当前条件汇总全部 `), K ? W.data.total : `—`, ` `, d(`条记录；待计价消耗不计入应付。 `)]
            })]
          })
        }), G.data.items.length > 0 ? (0, x.jsx)(s, {
          ariaLabel: d(`日账分组汇总`),
          children: (0, x.jsxs)(`table`, {
            className: `daily-summary-table`,
            children: [(0, x.jsx)(`thead`, {
              children: (0, x.jsxs)(`tr`, {
                children: [j !== `supplier` && (0, x.jsx)(`th`, {
                  children: d(`业务日期`)
                }), (0, x.jsx)(`th`, {
                  children: d(j === `supplier` ? `供应商` : `供应商 / 项目`)
                }), j === `supplier` && (0, x.jsx)(`th`, {
                  children: d(`折扣 / 单价`)
                }), j === `supplier` && $(`consumptionTotal`, d(`消耗合计`)), Z && $(`pendingConsumption`, d(`待计价消耗`)), Q && $(`confirmedOriginal`, d(`入账原始金额`)), Q && $(`payableTotal`, d(`入账应付`))]
              })
            }), (0, x.jsx)(`tbody`, {
              children: G.data.items.map(e => (0, x.jsxs)(`tr`, {
                children: [j !== `supplier` && (0, x.jsx)(`td`, {
                  children: e.businessDate || `—`
                }), (0, x.jsxs)(`td`, {
                  children: [(0, x.jsx)(`strong`, {
                    children: e.supplierName
                  }), (0, x.jsxs)(`small`, {
                    children: [j !== `supplier` && `${e.projectName} · `, e.currency]
                  })]
                }), j === `supplier` && (0, x.jsxs)(`td`, {
                  children: [(0, x.jsx)(`strong`, {
                    children: e.pricingType === `DISCOUNT` && e.settlementMultiplier != null ? h(e.settlementMultiplier) : e.pricingType === `FIXED` && e.settlementUnitPrice != null ? `${e.currency} ${e.settlementUnitPrice}${d(` / 个 `)}` : e.pricingType === `DIRECT` ? d(`直接录入`) : `—`
                  }), (0, x.jsx)(`small`, {
                    children: e.pricingType === `UNAVAILABLE` ? d(`报价未提供或不唯一`) : e.pendingCount > 0 ? d(`待计价部分仅供参考`) : d(`入账时计价依据`)
                  })]
                }), j === `supplier` && (0, x.jsxs)(`td`, {
                  children: [(0, x.jsx)(`strong`, {
                    children: (0, x.jsx)(y, {
                      currency: e.currency,
                      value: e.consumptionTotal
                    })
                  }), (0, x.jsxs)(`small`, {
                    children: [e.pendingCount + e.confirmedCount, d(` 条记录`)]
                  })]
                }), Z && (0, x.jsx)(`td`, {
                  children: e.pendingCount > 0 ? (0, x.jsxs)(x.Fragment, {
                    children: [(0, x.jsx)(`strong`, {
                      children: (0, x.jsx)(y, {
                        currency: e.currency,
                        value: e.pendingConsumption
                      })
                    }), (0, x.jsxs)(`small`, {
                      children: [e.pendingCount, d(` 条待计价`)]
                    })]
                  }) : `—`
                }), Q && (0, x.jsx)(`td`, {
                  children: e.confirmedCount > 0 ? (0, x.jsxs)(x.Fragment, {
                    children: [(0, x.jsx)(`strong`, {
                      children: (0, x.jsx)(y, {
                        currency: e.currency,
                        value: e.confirmedOriginal
                      })
                    }), (0, x.jsxs)(`small`, {
                      children: [e.confirmedCount, d(` 条已入账`)]
                    })]
                  }) : `—`
                }), Q && (0, x.jsx)(`td`, {
                  children: e.confirmedCount > 0 ? (0, x.jsxs)(`strong`, {
                    children: [e.currency, ` `, t(e.payableTotal, e.currency)]
                  }) : `—`
                })]
              }, `${e.businessDate}:${e.supplierId}:${e.projectId}:${e.currency}:${e.pricingType}:${e.settlementMultiplier}:${e.settlementUnitPrice}`))
            }), (0, x.jsx)(`tfoot`, {
              children: Y.map(e => (0, x.jsxs)(`tr`, {
                children: [j !== `supplier` && (0, x.jsx)(`td`, {
                  children: `—`
                }), (0, x.jsxs)(`td`, {
                  children: [(0, x.jsx)(`strong`, {
                    children: d(`合计`)
                  }), (0, x.jsxs)(`small`, {
                    children: [e.currency, j !== `supplier` && (0, x.jsxs)(x.Fragment, {
                      children: [` `, `· `, e.groupCount, d(` 组 `)]
                    })]
                  })]
                }), j === `supplier` && (0, x.jsx)(`td`, {
                  children: `—`
                }), j === `supplier` && (0, x.jsxs)(`td`, {
                  children: [(0, x.jsx)(`strong`, {
                    children: (0, x.jsx)(y, {
                      currency: e.currency,
                      value: e.consumptionTotal
                    })
                  }), (0, x.jsxs)(`small`, {
                    children: [e.pendingCount + e.confirmedCount, d(` 条记录`)]
                  })]
                }), Z && (0, x.jsx)(`td`, {
                  children: e.pendingCount > 0 ? (0, x.jsxs)(x.Fragment, {
                    children: [(0, x.jsx)(`strong`, {
                      children: (0, x.jsx)(y, {
                        currency: e.currency,
                        value: e.pendingConsumption
                      })
                    }), (0, x.jsxs)(`small`, {
                      children: [e.pendingCount, d(` 条待计价`)]
                    })]
                  }) : `—`
                }), Q && (0, x.jsx)(`td`, {
                  children: e.confirmedCount > 0 ? (0, x.jsxs)(x.Fragment, {
                    children: [(0, x.jsx)(`strong`, {
                      children: (0, x.jsx)(y, {
                        currency: e.currency,
                        value: e.confirmedOriginal
                      })
                    }), (0, x.jsxs)(`small`, {
                      children: [e.confirmedCount, d(` 条已入账`)]
                    })]
                  }) : `—`
                }), Q && (0, x.jsx)(`td`, {
                  children: e.confirmedCount > 0 ? (0, x.jsxs)(`strong`, {
                    children: [e.currency, ` `, t(e.payableTotal, e.currency)]
                  }) : `—`
                })]
              }, e.currency))
            })]
          })
        }) : (0, x.jsx)(`div`, {
          className: `daily-summary-empty`,
          children: d(`当前条件没有日账记录`)
        }), (0, x.jsx)(o, {
          data: G.data,
          page: L,
          onPage: R,
          size: z,
          onSizeChange: e => {
            B(e), R(1)
          }
        })]
      })]
    })
  })
}
export {
  w as
  default
};
