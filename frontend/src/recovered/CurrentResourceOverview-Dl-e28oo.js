// origin: assets/CurrentResourceOverview-Dl-e28oo.js
import {
  C as e,
  S as t,
  X as n,
  Z as r,
  _ as i,
  c as a,
  d as o,
  g as s,
  h as c,
  mt as l,
  s as u,
  u as d,
  vt as f,
  y as p
} from "./index-Dnr0i-H9.js";
import {
  r as m
} from "./QueryFilters-CwGBc_NH.js";
import {
  a as h,
  c as g,
  f as _,
  i as v,
  r as y,
  t as b,
  u as x
} from "./ccmaxAnalysis-BjOYJv3E.js";
import {
  t as S
} from "./CcmaxDistribution-DQLKF7Js.js";
var C = f(r(), 1),
  w = n();

function T({
  catalog: n
}) {
  let {
    has: r
  } = e(), [f, T] = (0, C.useState)(``), [E, D] = (0, C.useState)(``), [O, k] = (0, C.useState)(1), [A, j] = (0, C.useState)(20), [M, N] = (0, C.useState)(`total`), [P, F] = (0, C.useState)(!1), [I, L] = (0, C.useState)(``), [R, z] = (0, C.useState)(``), B = t(`/reports/ccmax-resources/current?${new URLSearchParams({supplierId:E})}`), V = (0, C.useMemo)(() => x(B.data), [B.data]), H = B.data?.total || 0, U = y(H, V.states), W = (0, C.useMemo)(() => V.plans.filter(e => (!I || e.states[I] > 0) && _(e.type).toLocaleLowerCase().includes(R.trim().toLocaleLowerCase())), [V.plans, I, R]);
  (0, C.useEffect)(() => {
    k(e => Math.min(e, Math.max(1, Math.ceil(W.length / A))))
  }, [W.length, A]);
  let G = (0, C.useMemo)(() => h(W, M), [W, M]).slice((O - 1) * A, O * A),
    K = v.filter(e => P || V.states[e] > 0),
    q = {
      id: `total`,
      type: ``,
      total: W.reduce((e, t) => e + t.total, 0),
      states: Object.fromEntries(v.map(e => [e, W.reduce((t, n) => t + (n.states[e] || 0), 0)]))
    };

  function J() {
    L(``), z(``), k(1)
  }
  let Y = (e, t) => t ? `${(100*e/t).toFixed(1)}%` : `0.0%`;
  return (0, w.jsxs)(`div`, {
    className: `ccmax-analysis ccmax-current-inventory`,
    children: [(0, w.jsxs)(`form`, {
      className: `panel ccmax-analysis-filters`,
      onSubmit: e => {
        e.preventDefault(), !(B.loading || B.refreshing) && (D(f), J(), E === f && B.reload())
      },
      children: [r(`supplier.read`) && (0, w.jsxs)(`label`, {
        className: `field`,
        children: [(0, w.jsx)(`span`, {
          children: l(`供应商`)
        }), (0, w.jsx)(m, {
          label: l(`当前资源供应商`),
          value: f,
          onChange: T,
          options: (n.data?.items || []).map(e => ({
            value: e.id,
            label: e.name,
            detail: e.code
          })),
          loading: n.loading,
          error: n.error
        })]
      }), (0, w.jsxs)(`div`, {
        className: `ccmax-analysis-actions`,
        children: [(0, w.jsx)(u, {
          type: `submit`,
          variant: `primary`,
          disabled: B.loading || B.refreshing,
          children: l(`查询`)
        }), (0, w.jsx)(u, {
          type: `button`,
          onClick: () => {
            T(``), D(``), J(), E || B.reload()
          },
          children: l(`重置筛选`)
        }), (0, w.jsx)(u, {
          type: `button`,
          icon: `refresh`,
          onClick: B.reload,
          disabled: B.loading || B.refreshing,
          children: l(`刷新统计`)
        })]
      }), f !== E && (0, w.jsx)(`span`, {
        className: `ccmax-analysis-unapplied`,
        role: `status`,
        children: l(`筛选条件尚未应用`)
      })]
    }), (0, w.jsxs)(`details`, {
      className: `ccmax-analysis-method`,
      children: [(0, w.jsx)(`summary`, {
        children: l(`统计口径`)
      }), (0, w.jsx)(`p`, {
        children: l(`统计当前已成功交付且未逻辑删除的全部CCMAX资源，包含早期资源，不受创建日期限制。品类按最近采集的账号套餐，状态按最近同步结果；已移除单独列示。`)
      })]
    }), B.error ? (0, w.jsxs)(s, {
      tone: `error`,
      children: [B.error, (0, w.jsx)(u, {
        onClick: B.reload,
        children: l(`重新加载`)
      })]
    }) : B.loading ? (0, w.jsx)(c, {}) : B.data ? (0, w.jsxs)(w.Fragment, {
      children: [(0, w.jsxs)(`div`, {
        className: `ccmax-analysis-range`,
        children: [(0, w.jsx)(`span`, {
          children: l(`全部创建日期`)
        }), (0, w.jsx)(`span`, {
          children: E ? n.data?.items.find(e => e.id === E)?.name || E : l(`全部供应商`)
        }), (0, w.jsx)(`span`, {
          children: l(`按最近同步状态统计，在库不含已移除`)
        }), B.refreshing && (0, w.jsx)(`span`, {
          role: `status`,
          children: l(`刷新中…`)
        })]
      }), B.data.unprojectedCount > 0 && (0, w.jsx)(s, {
        children: l(`套餐信息正在后台分批补全，{0} 个资源暂列为套餐未提供。`, [b(B.data.unprojectedCount)])
      }), (0, w.jsxs)(`dl`, {
        className: `ccmax-analysis-summary`,
        children: [(0, w.jsxs)(`div`, {
          className: `ccmax-summary-ready`,
          children: [(0, w.jsx)(`dt`, {
            children: l(`当前就绪`)
          }), (0, w.jsxs)(`dd`, {
            children: [b(V.states.READY || 0), ` `, (0, w.jsx)(`small`, {
              children: l(`在库就绪率 {0}`, [Y(V.states.READY || 0, U)])
            })]
          })]
        }), (0, w.jsxs)(`div`, {
          children: [(0, w.jsx)(`dt`, {
            children: l(`在库资源`)
          }), (0, w.jsx)(`dd`, {
            children: b(U)
          }), (0, w.jsx)(`small`, {
            children: l(`已移除 {0}，单独列示`, [b(V.states.GONE || 0)])
          })]
        }), (0, w.jsxs)(`div`, {
          children: [(0, w.jsx)(`dt`, {
            children: l(`冷却中`)
          }), (0, w.jsx)(`dd`, {
            children: b(V.states.COOLING || 0)
          })]
        }), (0, w.jsxs)(`div`, {
          children: [(0, w.jsx)(`dt`, {
            children: l(`失效或不可用`)
          }), (0, w.jsx)(`dd`, {
            children: b((V.states.INVALID || 0) + (V.states.DEAD || 0))
          })]
        })]
      }), H === 0 ? (0, w.jsx)(o, {
        text: l(`当前没有符合条件的已交付资源`)
      }) : (0, w.jsxs)(w.Fragment, {
        children: [(0, w.jsxs)(`div`, {
          className: `ccmax-analysis-breakdowns ccmax-current-distributions`,
          children: [(0, w.jsx)(S, {
            title: l(`当前状态分布`),
            values: V.states,
            dimension: `states`,
            context: l(`全部记录 · 点击筛选套餐`),
            selected: I,
            onSelect: e => {
              L(e), k(1)
            }
          }), (0, w.jsx)(S, {
            title: l(`套餐类型分布`),
            values: Object.fromEntries(V.plans.map(e => [e.type, e.total])),
            dimension: `types`
          })]
        }), (0, w.jsxs)(`section`, {
          className: `panel ccmax-analysis-details ccmax-current-matrix`,
          children: [(0, w.jsxs)(`header`, {
            className: `ccmax-analysis-section-head`,
            children: [(0, w.jsxs)(`div`, {
              children: [(0, w.jsx)(`h2`, {
                children: l(`套餐品类与当前状态`)
              }), (0, w.jsx)(`p`, {
                children: I ? l(`包含{0}的套餐`, [g(I)]) : l(`合计覆盖全部筛选结果`)
              })]
            }), (0, w.jsxs)(`div`, {
              className: `ccmax-matrix-controls`,
              children: [(0, w.jsxs)(`label`, {
                className: `check-line`,
                children: [(0, w.jsx)(`input`, {
                  type: `checkbox`,
                  checked: P,
                  onChange: e => F(e.target.checked)
                }), l(`显示全部状态`)]
              }), (0, w.jsx)(d, {
                ariaLabel: l(`套餐排序`),
                value: M,
                onChange: e => {
                  N(e), k(1)
                },
                options: [{
                  value: `total`,
                  label: l(`资源总数从高到低`)
                }, {
                  value: `ready`,
                  label: l(`就绪数量从高到低`)
                }, {
                  value: `rate`,
                  label: l(`就绪比例从高到低`)
                }]
              })]
            })]
          }), (0, w.jsxs)(`div`, {
            className: `ccmax-matrix-search`,
            children: [(0, w.jsx)(p, {
              value: R,
              onChange: e => {
                z(e), k(1)
              },
              placeholder: l(`搜索套餐名称`)
            }), (I || R) && (0, w.jsx)(u, {
              onClick: J,
              children: l(`清除筛选`)
            })]
          }), (0, w.jsx)(a, {
            data: W.length ? [...G, q] : [],
            columns: [{
              label: l(`账号套餐`),
              render: e => (0, w.jsx)(`strong`, {
                className: `ccmax-current-plan`,
                children: e.id === `total` ? l(`筛选合计`) : _(e.type)
              })
            }, {
              label: l(`资源总数`),
              render: e => b(e.total)
            }, ...K.map(e => ({
              label: g(e),
              render: t => (0, w.jsx)(`span`, {
                className: `${I===e?`ccmax-count-selected `:``}` + (t.states[e] ? `ccmax-current-count ccmax-count-${e.toLowerCase()}` : `ccmax-current-count ccmax-count-zero`),
                children: b(t.states[e] || 0)
              })
            })), {
              label: l(`在库就绪率`),
              render: e => (0, w.jsxs)(`span`, {
                className: `ccmax-ready-rate`,
                children: [(0, w.jsx)(`strong`, {
                  children: Y(e.states.READY || 0, y(e.total, e.states))
                }), (0, w.jsx)(`span`, {
                  "aria-hidden": `true`,
                  children: (0, w.jsx)(`i`, {
                    style: {
                      width: Y(e.states.READY || 0, y(e.total, e.states))
                    }
                  })
                })]
              })
            }]
          }), (0, w.jsx)(i, {
            data: {
              items: G,
              total: W.length,
              page: O,
              size: A
            },
            page: O,
            size: A,
            onPage: k,
            onSizeChange: e => {
              j(e), k(1)
            }
          })]
        })]
      })]
    }) : null]
  })
}
export {
  T as
  default
};