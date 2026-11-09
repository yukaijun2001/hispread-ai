// origin: assets/SupplierBills-BVKniq6z.js
import {
  A as e,
  C as t,
  G as n,
  S as r,
  X as i,
  Z as ee,
  _ as a,
  c as o,
  g as s,
  ht as c,
  j as l,
  mt as u,
  ot as d,
  s as f,
  u as p,
  vt as m,
  y as te
} from "./index-Dnr0i-H9.js";
import {
  t as ne
} from "./DateRangePicker-DtOG4QUZ.js";
import {
  t as h
} from "./useSummaryRefresh-B-5uMwFV.js";
import {
  t as g
} from "./MoneyDisplay-Bphc56N8.js";
var _ = m(ee(), 1),
  v = i();

function y({
  departmentView: n = !1
}) {
  let {
    refresh: i,
    user: ee
  } = t(), m = ee.role === `SUPPLIER_AGENT`, [g, y] = (0, _.useState)(l), [x, S] = (0, _.useState)(l), [C, w] = (0, _.useState)(``), [T, E] = (0, _.useState)(``), [D, O] = (0, _.useState)(``), [k, A] = (0, _.useState)(``), [j, M] = (0, _.useState)(``), [N, P] = (0, _.useState)(``), [F, I] = (0, _.useState)(``), [L, ie] = (0, _.useState)(!0), [R, z] = (0, _.useState)(`days`), [ae, B] = (0, _.useState)(1), [oe, se] = (0, _.useState)(10), [ce, V] = (0, _.useState)(1), [le, ue] = (0, _.useState)(10), [de, H] = (0, _.useState)(1), [fe, pe] = (0, _.useState)(10), [U, W] = (0, _.useState)(null);
  (0, _.useEffect)(() => {
    if (T.trim() === C) return;
    let e = window.setTimeout(() => {
      w(T.trim()), H(1), V(1), B(1)
    }, 300);
    return () => window.clearTimeout(e)
  }, [T, C]);
  let G = F || g,
    K = F || x,
    me = G === l() && K === l(),
    he = K === l() && !C && !D && !k && !j && !N ? 6e4 : 0,
    q = new URLSearchParams({
      from: G,
      to: K,
      search: C,
      resourceType: D,
      project: k,
      creator: j,
      department: N
    }).toString(),
    J = r(`/supplier-bills/filters?${new URLSearchParams({from:G,to:K,department:N})}`),
    Y = m && !J.data?.groupAdmin,
    X = !n || !!N || !!J.data?.groupAdmin,
    ge = m && !!J.data?.groupAdmin,
    _e = e => t => {
      e(t), H(1), V(1), B(1)
    },
    Z = r(n && (!X || R !== `days`) ? null : `/supplier-bills/days?${q}&page=${ce}&size=${le}`, he),
    Q = r(Y || R !== `creators` || n && !N && !J.data?.groupAdmin ? null : `/supplier-bills/creators?${q}&groupByDate=${ge}&page=${de}&size=${fe}`, he),
    $ = r(n && (!X || R !== `days`) ? `/supplier-bills/departments?${q}&groupByDate=${L}&page=${ae}&size=${oe}` : null, he);
  h(Z.data, Z.reload), h(Q.data, Q.reload), h($.data, $.reload), h(J.data, J.reload);
  let ve = (e, t = ``) => {
      P(e), I(t), z(`creators`), M(``), W(null), H(1), V(1), B(1)
    },
    ye = n && (!X || R !== `days`) ? $ : Z,
    be = !ye.loading && !ye.error ? ye.data?.totals ?? [] : [];
  return (0, v.jsxs)(`section`, {
    className: `panel supplier-bills`,
    children: [(Z.data?.summaryUpdating || Q.data?.summaryUpdating || $.data?.summaryUpdating) && (0, v.jsx)(s, {
      children: u(`汇总更新中，将自动刷新`)
    }), (0, v.jsxs)(`div`, {
      className: `daily-query`,
      children: [(0, v.jsxs)(`div`, {
        className: `daily-query-field`,
        children: [(0, v.jsx)(`span`, {
          children: u(`账务日期`)
        }), (0, v.jsx)(ne, {
          from: G,
          to: K,
          label: u(`账务日期`),
          onChange: (e, t) => {
            y(e), S(t), I(``), H(1), V(1), B(1)
          }
        })]
      }), !Y && (0, v.jsxs)(v.Fragment, {
        children: [n && !m && (0, v.jsxs)(`div`, {
          className: `daily-query-field`,
          children: [(0, v.jsx)(`span`, {
            children: u(`部门`)
          }), (0, v.jsx)(p, {
            ariaLabel: u(`账单部门`),
            value: N,
            onChange: ve,
            searchPlaceholder: u(`搜索部门`),
            options: [{
              value: ``,
              label: u(`全部部门`)
            }, ...J.data?.departments ?? [], {
              value: `__UNASSIGNED__`,
              label: u(`主账号／历史未归属`)
            }]
          })]
        }), (0, v.jsxs)(`div`, {
          className: `daily-query-field`,
          children: [(0, v.jsx)(`span`, {
            children: u(`资源类型`)
          }), (0, v.jsx)(p, {
            ariaLabel: u(`账单资源类型`),
            value: D,
            onChange: _e(O),
            options: [{
              value: ``,
              label: u(`全部资源类型`)
            }, ...(J.data?.resourceTypes ?? []).map(e => ({
              ...e,
              label: d(e.label)
            }))]
          })]
        }), (0, v.jsxs)(`div`, {
          className: `daily-query-field`,
          children: [(0, v.jsx)(`span`, {
            children: u(`项目`)
          }), (0, v.jsx)(p, {
            ariaLabel: u(`账单项目`),
            visual: `project`,
            value: k,
            onChange: _e(A),
            searchPlaceholder: u(`搜索项目`),
            options: [{
              value: ``,
              label: u(`全部项目`)
            }, ...J.data?.projects ?? []]
          })]
        }), (0, v.jsxs)(`div`, {
          className: `daily-query-field`,
          children: [(0, v.jsx)(`span`, {
            children: c(`label`, `创建账号`)
          }), (0, v.jsx)(p, {
            ariaLabel: u(`账单创建账号`),
            value: j,
            onChange: _e(M),
            searchPlaceholder: u(`搜索创建账号`),
            options: [{
              value: ``,
              label: u(`全部创建账号`)
            }, ...J.data?.creators ?? []]
          })]
        }), (0, v.jsxs)(`div`, {
          className: `daily-query-field`,
          children: [(0, v.jsx)(`span`, {
            children: u(`关键词`)
          }), (0, v.jsx)(te, {
            value: T,
            placeholder: u(`搜索创建账号、资源或项目`),
            onChange: e => {
              E(e)
            }
          })]
        })]
      }), (0, v.jsxs)(`div`, {
        className: `daily-query-actions`,
        children: [(0, v.jsx)(f, {
          onClick: () => {
            y(l()), S(l()), E(``), w(``), O(``), A(``), M(``), P(``), I(``), B(1), H(1), V(1)
          },
          children: u(`重置 `)
        }), (0, v.jsx)(f, {
          icon: `refresh`,
          "aria-label": u(`刷新供应商账单`),
          onClick: i
        })]
      })]
    }), J.loading && (0, v.jsx)(`p`, {
      className: `muted small`,
      children: u(`正在加载筛选选项…`)
    }), J.error && (0, v.jsxs)(s, {
      tone: `red`,
      children: [u(`筛选选项加载失败：`), J.error, ` `, (0, v.jsx)(`button`, {
        className: `text-button`,
        onClick: i,
        children: u(`重试 `)
      })]
    }), be.length > 0 && (0, v.jsx)(`div`, {
      className: `daily-bill-stats${m?` supplier-bill-consumption-summary`:``}`,
      children: (m ? [
        [u(`消耗合计`), `consumptionTotal`]
      ] : [
        [u(`消耗合计`), `consumptionTotal`],
        [u(`已入账应收`), `payableTotal`],
        [u(`待计价消耗`), `pendingConsumption`]
      ]).map(([t, n]) => (0, v.jsxs)(`div`, {
        className: `daily-bill-card`,
        children: [(0, v.jsxs)(`span`, {
          className: `supplier-bill-stat-label`,
          children: [t, n === `pendingConsumption` && (0, v.jsxs)(`span`, {
            className: `supplier-bill-help`,
            children: [(0, v.jsx)(`button`, {
              type: `button`,
              "aria-label": u(`待计价消耗说明`),
              "aria-describedby": `supplier-bill-pending-hint`,
              children: `?`
            }), (0, v.jsx)(`span`, {
              role: `tooltip`,
              id: `supplier-bill-pending-hint`,
              children: u(`当日消耗，次日入账。 `)
            })]
          })]
        }), be.map(t => (0, v.jsx)(`strong`, {
          className: `daily-bill-figure`,
          title: `${t.currency} ${t[n]??``}`,
          children: n === `payableTotal` && me ? u(`次日入账`) : (0, v.jsxs)(v.Fragment, {
            children: [(0, v.jsx)(`small`, {
              children: t.currency
            }), t[n] == null ? `—` : e(t[n], t.currency)]
          })
        }, t.currency))]
      }, n))
    }), n && !X && (0, v.jsxs)(v.Fragment, {
      children: [(0, v.jsxs)(`div`, {
        className: `bill-viewbar`,
        children: [(0, v.jsxs)(`div`, {
          className: `bill-viewbar-title`,
          children: [(0, v.jsx)(`h2`, {
            children: u(`部门汇总`)
          }), (0, v.jsx)(`small`, {
            className: `muted`,
            children: u(`按成员当前部门归集，币种分别统计`)
          })]
        }), (0, v.jsxs)(`div`, {
          className: `daily-view-switch`,
          role: `group`,
          "aria-label": u(`部门汇总方式`),
          children: [(0, v.jsx)(`button`, {
            type: `button`,
            className: L ? `active` : ``,
            "aria-pressed": L,
            onClick: () => {
              ie(!0), B(1)
            },
            children: u(`按日显示`)
          }), (0, v.jsx)(`button`, {
            type: `button`,
            className: L ? `` : `active`,
            "aria-pressed": !L,
            onClick: () => {
              ie(!1), B(1)
            },
            children: u(`期间汇总`)
          })]
        })]
      }), (0, v.jsx)(o, {
        loading: $.loading,
        error: $.error,
        data: $.data?.items ?? [],
        columns: [{
          label: u(L ? `日期` : `账务期间`),
          className: `bill-date-column`,
          render: e => L ? (0, v.jsx)(`strong`, {
            className: `mono`,
            children: e.businessDate
          }) : (0, v.jsxs)(`div`, {
            className: `stack mono`,
            children: [(0, v.jsx)(`span`, {
              children: g
            }), (0, v.jsx)(`small`, {
              children: u(`至 {0}`, [x])
            })]
          })
        }, {
          label: u(`部门`),
          className: `bill-department-column`,
          render: e => (0, v.jsxs)(`div`, {
            className: `stack`,
            children: [(0, v.jsx)(`strong`, {
              children: e.departmentId ? e.departmentName : u(`主账号／历史未归属`)
            }), (0, v.jsx)(`small`, {
              children: u(`{0} 位账单成员`, [e.memberCount])
            })]
          })
        }, {
          label: u(`资源 / 账单`),
          render: e => (0, v.jsxs)(`div`, {
            className: `stack`,
            children: [(0, v.jsx)(`span`, {
              children: d(e.resourceTypeName)
            }), (0, v.jsx)(`small`, {
              children: u(`{0} 个资源 · {1} 条账单`, [e.resourceCount, e.entryCount])
            })]
          })
        }, {
          label: u(`消耗合计`),
          className: `align-right`,
          render: e => (0, v.jsx)(b, {
            currency: e.currency,
            value: e.consumptionTotal
          })
        }, ...m ? [] : [{
          label: u(`已入账应收`),
          className: `align-right`,
          render: e => (0, v.jsx)(`strong`, {
            children: me || e.businessDate === l() ? u(`次日入账`) : (0, v.jsx)(b, {
              currency: e.currency,
              value: e.payableTotal
            })
          })
        }, {
          label: u(`待计价消耗`),
          className: `align-right`,
          render: e => (0, v.jsx)(b, {
            currency: e.currency,
            value: e.pendingConsumption
          })
        }], {
          label: u(`操作`),
          render: e => (0, v.jsx)(`button`, {
            className: `text-button`,
            onClick: () => ve(e.departmentId || `__UNASSIGNED__`, L && e.businessDate || ``),
            children: u(`查看成员`)
          })
        }]
      }), (0, v.jsx)(a, {
        data: $.data,
        page: ae,
        onPage: B,
        size: oe,
        onSizeChange: e => {
          se(e), B(1)
        }
      })]
    }), X && (0, v.jsxs)(v.Fragment, {
      children: [(0, v.jsxs)(`div`, {
        className: `bill-viewbar`,
        children: [(0, v.jsxs)(`div`, {
          className: `bill-viewbar-title`,
          children: [n && !m && N && (0, v.jsx)(`button`, {
            className: `text-button`,
            onClick: () => ve(``),
            children: u(`返回部门汇总`)
          }), (0, v.jsx)(`h2`, {
            children: n ? J.data?.groupName || J.data?.departments?.find(e => e.value === N)?.label || u(`主账号／历史未归属`) : u(`日账明细`)
          })]
        }), !Y && (0, v.jsxs)(`div`, {
          className: `daily-view-switch`,
          role: `group`,
          "aria-label": u(`账单汇总方式`),
          children: [(0, v.jsx)(`button`, {
            type: `button`,
            className: R === `creators` ? `active` : ``,
            "aria-pressed": R === `creators`,
            onClick: () => z(`creators`),
            children: u(`成员账单`)
          }), (0, v.jsx)(`button`, {
            type: `button`,
            className: R === `days` ? `active` : ``,
            "aria-pressed": R === `days`,
            onClick: () => z(`days`),
            children: u(`每日汇总`)
          })]
        })]
      }), (R === `days` || Y) && (0, v.jsxs)(v.Fragment, {
        children: [(0, v.jsx)(o, {
          loading: Z.loading,
          error: Z.error,
          data: Z.data?.items ?? [],
          columns: [{
            label: u(`日期`),
            render: e => (0, v.jsx)(`strong`, {
              className: `mono`,
              children: e.businessDate
            })
          }, ...m ? [] : [{
            label: u(`资源类型`),
            render: e => e.resourceTypeName
          }, {
            label: u(`资源 / 账单`),
            render: e => u(`{0} 个资源 · {1} 条账单`, [e.resourceCount, e.entryCount])
          }], {
            label: u(`消耗`),
            className: `align-right`,
            render: e => (0, v.jsx)(b, {
              currency: e.currency,
              value: e.consumptionTotal
            })
          }, ...m ? [] : [{
            label: u(`已入账应收`),
            className: `align-right`,
            render: e => (0, v.jsx)(`strong`, {
              children: e.businessDate === l() ? u(`次日入账`) : (0, v.jsx)(b, {
                currency: e.currency,
                value: e.payableTotal
              })
            })
          }, {
            label: u(`待计价消耗`),
            className: `align-right`,
            render: e => (0, v.jsx)(b, {
              currency: e.currency,
              value: e.pendingConsumption
            })
          }]]
        }), (0, v.jsx)(a, {
          data: Z.data,
          page: ce,
          onPage: V,
          size: le,
          onSizeChange: e => {
            ue(e), V(1)
          }
        })]
      }), !Y && R === `creators` && (0, v.jsxs)(v.Fragment, {
        children: [(0, v.jsx)(o, {
          loading: Q.loading,
          error: Q.error,
          data: Q.data?.items ?? [],
          columns: [...ge ? [{
            label: u(`日期`),
            render: e => (0, v.jsx)(`strong`, {
              className: `mono`,
              children: e.businessDate
            })
          }] : [], {
            label: c(`label`, `创建账号`),
            render: e => (0, v.jsxs)(`div`, {
              className: `stack`,
              children: [(0, v.jsx)(`strong`, {
                children: e.creatorName
              }), (0, v.jsx)(`small`, {
                children: e.creatorUsername || u(`历史归属待核对`)
              })]
            })
          }, {
            label: u(`资源类型`),
            render: e => e.resourceTypeName
          }, {
            label: u(`资源 / 账单`),
            render: e => u(`{0} 个资源 · {1} 条账单`, [e.resourceCount, e.entryCount])
          }, {
            label: u(`消耗合计`),
            className: `align-right`,
            render: e => (0, v.jsx)(b, {
              currency: e.currency,
              value: e.consumptionTotal
            })
          }, ...m ? [] : [{
            label: u(`已入账应收`),
            className: `align-right`,
            render: e => (0, v.jsx)(`strong`, {
              children: me ? u(`次日入账`) : (0, v.jsx)(b, {
                currency: e.currency,
                value: e.payableTotal
              })
            })
          }, {
            label: u(`待计价消耗`),
            className: `align-right`,
            render: e => (0, v.jsx)(b, {
              currency: e.currency,
              value: e.pendingConsumption
            })
          }], {
            label: u(`操作`),
            render: e => (0, v.jsx)(`button`, {
              className: `text-button`,
              onClick: () => W(e),
              children: u(`查看明细 `)
            })
          }]
        }), (0, v.jsx)(a, {
          data: Q.data,
          page: de,
          onPage: H,
          size: fe,
          onSizeChange: e => {
            pe(e), H(1)
          }
        })]
      })]
    }), (0, v.jsxs)(`details`, {
      className: `bill-notes`,
      children: [(0, v.jsx)(`summary`, {
        children: u(`账单口径与说明`)
      }), n && (0, v.jsx)(`p`, {
        children: u(m ? `部门账单按成员当前所属部门汇总；调整部门后，历史日账随当前归属展示。` : `部门账单按成员当前所属部门汇总；调整部门后，历史日账随当前归属展示。已入账应收沿用原账单金额。`)
      }), !m && (0, v.jsx)(`p`, {
        children: u(`今日账单持续更新，次日可结算；待计价消耗尚未计入应收。历史资源未能关联创建账号的，单独列示。 `)
      }), (0, v.jsx)(`p`, {
        children: u(`金额按币种精度展示，悬停可查看完整数值；币种分别统计。`)
      })]
    }), U && (0, v.jsx)(re, {
      creator: U,
      memberView: m,
      options: J.data,
      filter: q,
      onClose: () => W(null)
    }, `${U.id}:${q}`)]
  })
}

function b({
  currency: e,
  value: t
}) {
  return (0, v.jsx)(g, {
    currency: e,
    value: t
  })
}

function re({
  creator: e,
  memberView: t,
  filter: i,
  options: ee,
  onClose: s
}) {
  let [c, d] = (0, _.useState)(1), [m, h] = (0, _.useState)(10), g = new URLSearchParams(i);
  e.businessDate && (g.set(`from`, e.businessDate), g.set(`to`, e.businessDate));
  let [y, re] = (0, _.useState)(g.get(`from`) ?? l()), [x, S] = (0, _.useState)(g.get(`to`) ?? l()), [C, w] = (0, _.useState)(g.get(`project`) ?? ``), [T, E] = (0, _.useState)(g.get(`search`) ?? ``), [D, O] = (0, _.useState)(T), [k, A] = (0, _.useState)(``), [j, M] = (0, _.useState)(``);
  (0, _.useEffect)(() => {
    if (D.trim() === T && j.trim() === k) return;
    let e = window.setTimeout(() => {
      E(D.trim()), A(j.trim()), d(1)
    }, 300);
    return () => window.clearTimeout(e)
  }, [D, j, T, k]);
  let [N, P] = (0, _.useState)(``), F = e => t => {
    e(t), d(1)
  }, I = new URLSearchParams(i);
  Object.entries({
    from: y,
    to: x,
    project: C,
    search: T,
    model: k,
    reviewStatus: N,
    resourceType: e.resourceType,
    creatorId: e.creatorId,
    currency: e.currency,
    page: String(c),
    size: String(m)
  }).forEach(([e, t]) => I.set(e, t));
  let L = r(`/supplier-bills/entries?${I}`),
    ie = () => {
      re(g.get(`from`) ?? l()), S(g.get(`to`) ?? l()), w(g.get(`project`) ?? ``), O(g.get(`search`) ?? ``), E(g.get(`search`) ?? ``), M(``), A(``), P(``), d(1)
    };
  return (0, v.jsxs)(n, {
    title: u(`{0} · 账单明细 · {1}`, [e.creatorName, e.currency]),
    onClose: s,
    wide: !0,
    children: [(0, v.jsxs)(`div`, {
      className: `daily-query supplier-bill-entry-filters`,
      children: [(0, v.jsxs)(`div`, {
        className: `daily-query-field`,
        children: [(0, v.jsx)(`span`, {
          children: u(`账务日期`)
        }), (0, v.jsx)(ne, {
          label: u(`明细账务日期`),
          from: y,
          to: x,
          onChange: (e, t) => {
            re(e), S(t), d(1)
          }
        })]
      }), (0, v.jsxs)(`div`, {
        className: `daily-query-field`,
        children: [(0, v.jsx)(`span`, {
          children: u(`项目`)
        }), (0, v.jsx)(p, {
          ariaLabel: u(`明细项目`),
          visual: `project`,
          value: C,
          onChange: F(w),
          options: [{
            value: ``,
            label: u(`全部项目`)
          }, ...ee?.projects ?? []]
        })]
      }), (0, v.jsxs)(`div`, {
        className: `daily-query-field`,
        children: [(0, v.jsx)(`span`, {
          children: u(`资源关键词`)
        }), (0, v.jsx)(te, {
          value: D,
          onChange: O,
          placeholder: u(`搜索资源名称`)
        })]
      }), (0, v.jsxs)(`div`, {
        className: `daily-query-field`,
        children: [(0, v.jsx)(`span`, {
          children: u(`模型`)
        }), (0, v.jsx)(te, {
          value: j,
          onChange: M,
          placeholder: u(`搜索模型`)
        })]
      }), !t && (0, v.jsxs)(`div`, {
        className: `daily-query-field`,
        children: [(0, v.jsx)(`span`, {
          children: u(`入账状态`)
        }), (0, v.jsx)(p, {
          ariaLabel: u(`明细入账状态`),
          value: N,
          onChange: F(P),
          options: [{
            value: ``,
            label: u(`全部入账状态`)
          }, {
            value: `PENDING`,
            label: u(`待计价`)
          }, {
            value: `CONFIRMED`,
            label: u(`已入账`)
          }]
        })]
      }), (0, v.jsx)(`div`, {
        className: `daily-query-actions`,
        children: (0, v.jsx)(f, {
          onClick: ie,
          children: u(`重置`)
        })
      })]
    }), (0, v.jsx)(o, {
      loading: L.loading,
      error: L.error,
      data: L.data?.items ?? [],
      columns: [{
        label: u(`日期`),
        render: e => e.businessDate
      }, {
        label: u(`资源类型`),
        render: e => e.resourceTypeName
      }, {
        label: u(`资源 / 项目`),
        render: e => (0, v.jsxs)(`div`, {
          className: `stack`,
          children: [(0, v.jsx)(`strong`, {
            children: e.resourceName || {
              MANUAL: u(`手工款`),
              EXTERNAL: u(`外部金额`),
              RESOURCE: u(`历史资源`),
              CCMAX: u(`历史资源`)
            } [e.sourceKind]
          }), (0, v.jsx)(`small`, {
            children: e.projectName
          })]
        })
      }, {
        label: u(`模型`),
        render: e => e.modelKey || `—`
      }, {
        label: u(`消耗`),
        className: `align-right`,
        render: e => (0, v.jsx)(b, {
          currency: e.currency,
          value: e.consumption
        })
      }, ...t ? [] : [{
        label: u(`应收`),
        className: `align-right`,
        render: e => e.businessDate === l() && e.pending ? u(`次日入账`) : e.payable == null ? u(`待计价`) : (0, v.jsx)(b, {
          currency: e.currency,
          value: e.payable
        })
      }], ...t ? [] : [{
        label: u(`入账状态`),
        render: e => e.pending ? e.businessDate === l() ? u(`次日入账`) : u(`待计价`) : u(`已入账`)
      }]]
    }), (0, v.jsx)(a, {
      data: L.data,
      page: c,
      onPage: d,
      size: m,
      onSizeChange: e => {
        h(e), d(1)
      }
    })]
  })
}
export {
  y as
  default
};