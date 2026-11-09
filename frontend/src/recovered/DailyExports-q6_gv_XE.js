// origin: assets/DailyExports-q6_gv_XE.js
import {
  $ as e,
  C as t,
  G as n,
  P as r,
  X as i,
  Z as a,
  b as ee,
  c as te,
  g as o,
  gt as s,
  ht as c,
  l as ne,
  mt as l,
  ot as u,
  rt as d,
  s as f,
  u as p,
  ut as m,
  vt as h
} from "./index-Dnr0i-H9.js";
import {
  i as g
} from "./systemLabels-DqpNuQ-_.js";

function re(e) {
  return e === `倍率` ? l(`折扣`) : e === `倍率／单价` ? l(`折扣 / 单价`) : c(`export-column`, e)
}

function ie(e, t, n, r) {
  return t === null ? t : e === `倍率` ? m(t) : e === `倍率／单价` ? r[n.indexOf(`计价方式`)] === `倍率` ? m(t) : t.replace(/^(\d+(?:\.\d+)?) 倍$/, (e, t) => m(t)).replace(/\/个$/, `/ ${g(`个`)}`) : e === `折扣 / 单价` ? /折$/.test(t) ? m(String(Number(t.slice(0, -1)) / 100)) : s(t).replace(/\/ 个$/, `/ ${g(`个`)}`) : e === `计价说明` ? s(t) : e === `计价方式` ? t === `倍率` ? l(`折扣`) : s(t) : e === `状态` || e === `金额性质` ? s(t) : e === `异常说明` && t ? u(t) : t
}
var _ = h(a(), 1),
  v = i(),
  y = `/accounting/daily/exports`,
  ae = e => [`QUEUED`, `SNAPSHOTTING`, `GENERATING`].includes(e.state),
  oe = e => l(e === `SUPPLIER` ? `供应商汇总` : e === `SUMMARY` ? `日账汇总` : `日账明细`),
  b = {
    QUEUED: l(`排队中`),
    SNAPSHOTTING: l(`正在取数`),
    GENERATING: l(`正在生成`),
    COMPLETED: l(`已完成`),
    FAILED: l(`失败`),
    CANCELLED: l(`已取消`),
    EXPIRED: l(`已过期`)
  },
  x = e => e < 1024 ? `${e} B` : e < 1048576 ? `${(e/1024).toFixed(1)} KB` : `${(e/1024/1024).toFixed(1)} MB`;

function S({
  filter: i,
  count: a,
  disabled: s,
  supplierName: c,
  projectName: m,
  actionRequest: h,
  hideActions: g = !1,
  onActiveCountChange: S
}) {
  let {
    notify: ce
  } = t(), [w, T] = (0, _.useState)(h?.type === `TASKS`), le = (0, _.useRef)(h?.sequence), [E, D] = (0, _.useState)(() => h && h.type !== `TASKS` ? {
    type: h.type,
    filter: {
      ...h.scope?.filter || i
    },
    supplierName: h.scope?.supplierName ?? c,
    projectName: h.scope?.projectName ?? m
  } : null), [O, ue] = (0, _.useState)(`XLSX`), [k, de] = (0, _.useState)(null), [A, j] = (0, _.useState)(``), [M, N] = (0, _.useState)(!1), [P, F] = (0, _.useState)(``), [I, L] = (0, _.useState)(1), [R, z] = (0, _.useState)(``), [B, V] = (0, _.useState)(``), [H, fe] = (0, _.useState)(null), [U, pe] = (0, _.useState)(!1), [W, G] = (0, _.useState)(null), [K, me] = (0, _.useState)(null), [he, ge] = (0, _.useState)(!1), [q, _e] = (0, _.useState)(``), J = (0, _.useRef)(crypto.randomUUID()), Y = (0, _.useRef)(!0), X = (0, _.useRef)(0);
  (0, _.useEffect)(() => (Y.current = !0, () => {
    Y.current = !1
  }), []);
  let Z = (0, _.useCallback)(async (t = !1) => {
    let n = ++X.current;
    t || pe(!0);
    try {
      let t = new URLSearchParams({
          page: String(I),
          type: R,
          state: B
        }),
        r = await e(`${y}?${t}`);
      if (!Y.current || n !== X.current) return;
      fe(r), F(``), G(e => e ? r.items.find(t => t.id === e.id) || e : null)
    } catch (e) {
      Y.current && n === X.current && F(e.message)
    } finally {
      Y.current && n === X.current && pe(!1)
    }
  }, [I, R, B]);
  (0, _.useEffect)(() => {
    Z()
  }, [Z]), (0, _.useEffect)(() => {
    if (!w && !H?.activeCount) return;
    let e = window.setInterval(() => {
      document.visibilityState === `visible` && Z(!0)
    }, 4e3);
    return () => window.clearInterval(e)
  }, [w, H?.activeCount, Z]), (0, _.useEffect)(() => {
    if (!E) return;
    let e = !0;
    return de(null), j(``), d(`${y}/estimate`, E.filter).then(t => {
      e && de(t)
    }).catch(t => {
      e && j(t.message)
    }), () => {
      e = !1
    }
  }, [E]), (0, _.useEffect)(() => {
    H && S?.(H.activeCount || 0)
  }, [H?.activeCount, S]), (0, _.useEffect)(() => {
    h && h.sequence !== le.current && (le.current = h.sequence, h.type === `TASKS` ? (T(!0), Z()) : Q(h.type, void 0, h.scope))
  }, [h]);

  function Q(e, t, n) {
    ue(t?.format || `XLSX`), F(``), J.current = crypto.randomUUID(), D({
      type: e,
      filter: {
        ...t?.filter || n?.filter || i
      },
      supplierName: t ? t.filterLabels?.supplier || l(`指定供应商`) : n?.supplierName ?? c,
      projectName: t ? t.filterLabels?.project || l(`指定项目`) : n?.projectName ?? m
    })
  }
  async function ve() {
    if (E && !M) {
      N(!0), F(``);
      try {
        await d(y, {
          type: E.type,
          format: O,
          filter: E.filter,
          requestKey: J.current
        }), D(null), T(!0), L(1), z(``), V(``), ce(l(`导出任务已创建，可继续操作页面，完成后在导出任务中下载。`)), await Z()
      } catch (e) {
        F(e.message)
      } finally {
        N(!1)
      }
    }
  }
  async function ye(e) {
    N(!0);
    try {
      await d(`${y}/${e.id}/cancel`, {}), await Z()
    } catch (e) {
      F(e.message)
    } finally {
      N(!1)
    }
  }
  async function be(t) {
    if (G(t), me(null), _e(``), t.state === `COMPLETED`) {
      ge(!0);
      try {
        me(await e(`${y}/${t.id}/preview`))
      } catch (e) {
        _e(e.message)
      } finally {
        ge(!1)
      }
    }
  }
  async function $(t, n = 0, r = !1) {
    try {
      let i = await e(`${y}/${t.id}`);
      if (i.state !== `COMPLETED`) throw Error(l(`文件尚未生成或已经过期，请刷新任务列表。`));
      let a = document.createElement(`a`);
      a.href = `/api${y}/${t.id}/${r?`archive`:`files/${n}`}`, a.download = r ? `daily-export-${t.id}.zip` : i.files[n].name, document.body.appendChild(a), a.click(), a.remove()
    } catch (e) {
      F(e.message), ce(e.message, !0)
    }
  }
  return (0, v.jsxs)(v.Fragment, {
    children: [!g && (0, v.jsxs)(`div`, {
      className: `daily-export-actions`,
      "aria-label": l(`日账导出`),
      children: [(0, v.jsx)(f, {
        icon: `download`,
        disabled: s || a === 0,
        title: l(a === 0 ? `当前筛选没有记录` : `导出当前筛选的全部汇总`),
        onClick: () => Q(`SUMMARY`),
        children: l(`导出汇总 `)
      }), (0, v.jsx)(f, {
        icon: `download`,
        disabled: s || a === 0,
        title: l(a === 0 ? `当前筛选没有记录` : `导出当前筛选的全部明细`),
        onClick: () => Q(`DETAIL`),
        children: l(`导出明细 `)
      }), (0, v.jsxs)(f, {
        onClick: () => {
          T(!0), Z()
        },
        children: [l(`导出任务`), H?.activeCount ? l(`（{0}）`, [H.activeCount]) : ``]
      })]
    }), E && (0, v.jsxs)(n, {
      title: l(`导出{0}`, [E.type === `SUPPLIER` ? l(`供应商汇总`) : E.type === `SUMMARY` ? l(`汇总`) : l(`明细`)]),
      subtitle: l(`确认筛选范围与文件格式，提交后将在后台生成`),
      className: `daily-export-config`,
      onClose: () => {
        M || D(null)
      },
      children: [(0, v.jsxs)(`div`, {
        className: `daily-export-scope`,
        children: [(0, v.jsx)(`strong`, {
          children: k ? l(`{0} 条日账`, [k.count.toLocaleString()]) : l(`正在核对记录数量…`)
        }), (0, v.jsx)(`span`, {
          children: l(`当前筛选范围 · 包含所有分页`)
        })]
      }), (0, v.jsx)(ne, {
        items: [
          [l(`业务日期`), `${E.filter.from} — ${E.filter.to}`],
          [l(`供应商`), E.supplierName],
          [l(`项目`), E.projectName],
          [l(`关键词/模型`), [E.filter.search, E.filter.model].filter(Boolean).join(` / `) || l(`全部`)],
          [l(`来源`), {
            CCMAX: l(`CCMAX 模型消耗`),
            MANUAL: l(`手工款`),
            EXTERNAL: l(`外部金额`),
            RESOURCE: l(`资源金额`)
          } [E.filter.sourceKind] || l(`全部来源`)],
          [l(`入账状态`), {
            PENDING: l(`待计价`),
            CONFIRMED: l(`已入账`),
            CHANGED: l(`来源已修订`)
          } [E.filter.reviewStatus] || l(`全部状态`)]
        ]
      }), (0, v.jsxs)(`label`, {
        className: `daily-export-format`,
        children: [(0, v.jsx)(`span`, {
          children: l(`文件格式`)
        }), (0, v.jsx)(p, {
          ariaLabel: l(`导出格式`),
          value: O,
          onChange: e => {
            ue(e), J.current = crypto.randomUUID()
          },
          options: [{
            value: `XLSX`,
            label: `Excel（.xlsx）`
          }, {
            value: `CSV`,
            label: `CSV（.csv）`
          }]
        })]
      }), (0, v.jsx)(o, {
        tone: `blue`,
        children: l(E.type === `SUPPLIER` ? `按供应商、币种和折扣归组，导出全部分页。待计价折扣仅供参考，不计入入账应付。` : `已入账应付与待计价试算分别列示；当天数据未完结。缺少报价的记录保留原始金额并注明原因。 `)
      }), !!k?.crossPeriodCount && (0, v.jsxs)(o, {
        tone: `amber`,
        children: [l(`另有 `), k.crossPeriodCount, l(` 条跨日来源不属于单日日账，本次不纳入。 `)]
      }), k && k.count > k.partRows && (0, v.jsxs)(`p`, {
        className: `muted`,
        children: [l(`明细文件每 `), k.partRows.toLocaleString(), l(` 行自动拆分，可打包下载。 `)]
      }), (A || P) && (0, v.jsx)(o, {
        tone: `red`,
        children: A || P
      }), (0, v.jsxs)(`div`, {
        className: `dialog-footer daily-export-footer`,
        children: [(0, v.jsx)(`span`, {
          className: `muted`,
          children: l(`后台生成 · 文件保留 7 天`)
        }), (0, v.jsx)(f, {
          disabled: M,
          onClick: () => D(null),
          children: l(`取消 `)
        }), (0, v.jsx)(f, {
          variant: `primary`,
          disabled: M || !k || !!A || k.count === 0 || k.count > k.maxRows,
          onClick: () => void ve(),
          children: l(M ? `正在创建…` : `创建导出任务`)
        })]
      })]
    }), w && (0, v.jsxs)(n, {
      drawer: !0,
      title: l(`导出任务`),
      subtitle: l(`查看本账号创建的日账导出，文件保留7天`),
      className: `daily-export-drawer`,
      onClose: () => {
        T(!1), G(null)
      },
      children: [(0, v.jsxs)(`div`, {
        className: `daily-export-taskbar daily-export-task-toolbar`,
        children: [(0, v.jsxs)(`div`, {
          className: `daily-export-task-selects`,
          children: [(0, v.jsxs)(`label`, {
            children: [(0, v.jsx)(`span`, {
              children: l(`任务类型`)
            }), (0, v.jsx)(p, {
              ariaLabel: l(`导出任务类型`),
              value: R,
              onChange: e => {
                z(e), L(1)
              },
              options: [{
                value: ``,
                label: l(`全部类型`)
              }, {
                value: `SUPPLIER`,
                label: l(`供应商汇总`)
              }, {
                value: `SUMMARY`,
                label: l(`日账汇总`)
              }, {
                value: `DETAIL`,
                label: l(`日账明细`)
              }]
            })]
          }), (0, v.jsxs)(`label`, {
            children: [(0, v.jsx)(`span`, {
              children: l(`任务状态`)
            }), (0, v.jsx)(p, {
              ariaLabel: l(`导出任务状态`),
              value: B,
              onChange: e => {
                V(e), L(1)
              },
              options: [{
                value: ``,
                label: l(`全部任务状态`)
              }, ...Object.entries(b).map(([e, t]) => ({
                value: e,
                label: t
              }))]
            })]
          })]
        }), (0, v.jsx)(`span`, {
          className: `muted`,
          children: H?.activeCount ? l(`{0} 个任务处理中，可关闭页面稍后查看`, [H.activeCount]) : l(`仅显示当前账号的任务`)
        }), (0, v.jsx)(f, {
          icon: `refresh`,
          onClick: () => void Z(),
          disabled: U,
          children: l(`刷新 `)
        })]
      }), P && (0, v.jsx)(o, {
        tone: `red`,
        children: P
      }), (0, v.jsx)(te, {
        data: H?.items || [],
        loading: U,
        ariaLabel: l(`日账导出任务`),
        columns: [{
          label: l(`任务 / 账务日期`),
          render: e => (0, v.jsxs)(`div`, {
            className: `stack`,
            children: [(0, v.jsxs)(`strong`, {
              children: [oe(e.type), ` · `, e.format]
            }), (0, v.jsxs)(`small`, {
              children: [e.filter.from, ` — `, e.filter.to]
            })]
          })
        }, {
          label: l(`日账筛选条件`),
          render: e => (0, v.jsx)(`div`, {
            className: `daily-export-task-scope`,
            children: se(e)
          })
        }, {
          label: l(`创建时间`),
          render: e => r(e.createdAt)
        }, {
          label: l(`任务状态 / 进度`),
          render: e => (0, v.jsxs)(`div`, {
            className: `stack`,
            children: [(0, v.jsx)(`span`, {
              className: `daily-export-state ${e.state.toLowerCase()}`,
              children: b[e.state] || e.state
            }), ae(e) && e.state !== `QUEUED` && (0, v.jsxs)(`small`, {
              children: [e.processedCount.toLocaleString(), ` /`, ` `, (e.state === `SNAPSHOTTING` ? e.sourceCount : e.resultCount).toLocaleString(), ` `, l(`行 `)]
            }), e.error && (0, v.jsx)(`small`, {
              className: `daily-export-error`,
              children: u(e.error)
            })]
          })
        }, {
          label: l(`文件`),
          render: e => e.state === `COMPLETED` ? (0, v.jsxs)(`div`, {
            className: `stack`,
            children: [(0, v.jsxs)(`span`, {
              children: [e.resultCount.toLocaleString(), l(` 行 ·`), ` `, x(e.files.reduce((e, t) => e + t.bytes, 0))]
            }), (0, v.jsxs)(`small`, {
              children: [l(`有效至 `), r(e.expiresAt)]
            })]
          }) : `—`
        }, {
          label: l(`操作`),
          render: e => (0, v.jsxs)(`div`, {
            className: `daily-export-row-actions`,
            children: [(0, v.jsx)(`button`, {
              className: `text-button`,
              onClick: () => void be(e),
              children: e.state === `COMPLETED` ? l(`预览`) : l(`查看`)
            }), e.state === `COMPLETED` && (0, v.jsx)(`button`, {
              className: `text-button`,
              onClick: () => void $(e, 0, e.files.length > 1),
              children: e.files.length > 1 ? l(`打包下载`) : l(`下载`)
            }), ae(e) && (0, v.jsx)(`button`, {
              className: `text-button`,
              disabled: M,
              onClick: () => void ye(e),
              children: l(`取消 `)
            }), [`FAILED`, `CANCELLED`, `EXPIRED`].includes(e.state) && (0, v.jsx)(`button`, {
              className: `text-button`,
              onClick: () => Q(e.type, e),
              children: l(`重新导出 `)
            })]
          })
        }]
      }), (0, v.jsxs)(`div`, {
        className: `daily-export-taskbar`,
        children: [(0, v.jsxs)(`span`, {
          className: `muted`,
          children: [l(`共 `), H?.total || 0, l(` 个任务 · 第 `), I, l(` 页 `)]
        }), (0, v.jsxs)(`div`, {
          className: `daily-export-actions`,
          children: [(0, v.jsx)(f, {
            disabled: I === 1 || U,
            onClick: () => L(I - 1),
            children: l(`上一页 `)
          }), (0, v.jsx)(f, {
            disabled: I * 10 >= (H?.total || 0) || U,
            onClick: () => L(I + 1),
            children: l(`下一页 `)
          })]
        })]
      })]
    }), w && W && (0, v.jsxs)(n, {
      title: W.state === `COMPLETED` ? l(`导出预览`) : l(`任务详情`),
      wide: !0,
      className: `daily-export-preview`,
      onClose: () => G(null),
      children: [(0, v.jsx)(`div`, {
        className: `daily-export-metadata`,
        children: (0, v.jsx)(ne, {
          items: [
            [l(`类型`), `${oe(W.type)} · ${W.format}`],
            [l(`日期范围`), `${W.filter.from} — ${W.filter.to}`],
            [l(`状态`), b[W.state] || W.state],
            [l(`数据时点`), W.snapshotAt ? r(W.snapshotAt) : l(`尚未完成取数`)],
            [l(`来源 / 导出`), l(`{0} 条日账 / {1} 行`, [W.sourceCount.toLocaleString(), W.resultCount.toLocaleString()])]
          ]
        })
      }), (0, v.jsxs)(`dl`, {
        className: `daily-export-filter-summary`,
        children: [(0, v.jsx)(`dt`, {
          children: l(`筛选条件`)
        }), (0, v.jsx)(`dd`, {
          children: se(W)
        })]
      }), W.error && (0, v.jsx)(o, {
        tone: `red`,
        children: u(W.error)
      }), q && (0, v.jsx)(o, {
        tone: `red`,
        children: q
      }), he && (0, v.jsx)(`p`, {
        role: `status`,
        children: l(`正在读取预览…`)
      }), K && (0, v.jsxs)(v.Fragment, {
        children: [(0, v.jsxs)(`div`, {
          className: `daily-export-preview-caption`,
          children: [(0, v.jsxs)(`strong`, {
            children: [l(`数据预览`), ` `, (0, v.jsxs)(`span`, {
              children: [l(`前 `), K.rows.length, l(` 行 / 共 `), K.total.toLocaleString(), l(` 行 `)]
            })]
          }), (0, v.jsx)(`span`, {
            children: l(`当天及缺报价记录不计入可结算金额`)
          })]
        }), (0, v.jsx)(`p`, {
          className: `muted`,
          children: l(`预览已按界面语言和折扣口径显示；下载文件保留原始列名与数值。`)
        }), (0, v.jsx)(ee, {
          ariaLabel: l(`导出文件预览`),
          children: (0, v.jsxs)(`table`, {
            className: `daily-export-preview-table`,
            children: [(0, v.jsx)(`thead`, {
              children: (0, v.jsx)(`tr`, {
                children: K.headers.map(e => (0, v.jsx)(`th`, {
                  className: C(e) ? `number` : ``,
                  children: re(e)
                }, e))
              })
            }), (0, v.jsx)(`tbody`, {
              children: K.rows.map((e, t) => (0, v.jsx)(`tr`, {
                children: e.map((t, n) => (0, v.jsx)(`td`, {
                  className: C(K.headers[n]) ? `number` : ``,
                  children: ie(K.headers[n], t, K.headers, e) ?? `—`
                }, n))
              }, t))
            })]
          })
        })]
      }), W.state === `COMPLETED` && (0, v.jsxs)(`div`, {
        className: `daily-export-file-list`,
        children: [W.files.map((e, t) => (0, v.jsxs)(`div`, {
          children: [(0, v.jsxs)(`span`, {
            children: [e.name, (0, v.jsxs)(`small`, {
              children: [e.rows.toLocaleString(), l(` 行 · `), x(e.bytes)]
            })]
          }), (0, v.jsx)(f, {
            icon: `download`,
            onClick: () => void $(W, t),
            children: l(`下载 `)
          })]
        }, e.name)), W.files.length > 1 && (0, v.jsx)(f, {
          onClick: () => void $(W, 0, !0),
          children: l(`打包下载全部文件`)
        })]
      })]
    })]
  })
}

function se(e) {
  let t = {
      CCMAX: l(`CCMAX 模型消耗`),
      MANUAL: l(`手工款`),
      EXTERNAL: l(`外部金额`),
      RESOURCE: l(`资源金额`)
    },
    n = {
      PENDING: l(`待计价`),
      CONFIRMED: l(`已入账`),
      CHANGED: l(`来源已修订`)
    };
  return [
    [l(`供应商`), e.filterLabels?.supplier || (e.filter.supplier ? l(`指定供应商`) : l(`全部供应商`))],
    [l(`项目`), e.filterLabels?.project || (e.filter.project ? l(`指定项目`) : l(`全部项目`))],
    [l(`来源`), t[e.filter.sourceKind] || l(`全部来源`)],
    [l(`入账状态`), n[e.filter.reviewStatus] || l(`全部状态`)], ...e.filter.search ? [
      [l(`关键词`), e.filter.search]
    ] : [], ...e.filter.model ? [
      [l(`模型`), e.filter.model]
    ] : []
  ].map(([e, t]) => (0, v.jsxs)(`span`, {
    children: [(0, v.jsxs)(`span`, {
      children: [e, l(`：`)]
    }), t]
  }, e))
}

function C(e) {
  return /金额|应付|试算|条数|数量|倍率|单价/.test(e)
}
export {
  S as
  default
};