// origin: assets/SupplierDailyCreations-C04GFRSJ.js
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
  vt as d,
  x as f,
  y as p
} from "./index-Dnr0i-H9.js";
import {
  r as m
} from "./QueryFilters-CwGBc_NH.js";
import {
  d as h,
  t as g
} from "./ccmaxAnalysis-BjOYJv3E.js";
import {
  n as _,
  t as v
} from "./DateRangePicker-DtOG4QUZ.js";
var y = d(r(), 1),
  b = n();

function x() {
  let {
    from: e,
    to: t
  } = _()[1];
  return {
    from: e,
    to: t,
    supplierId: ``
  }
}

function S({
  catalog: n
}) {
  let {
    has: r
  } = e(), [d, S] = (0, y.useState)(x), [C, w] = (0, y.useState)(x), [T, E] = (0, y.useState)(``), [D, O] = (0, y.useState)(1), [k, A] = (0, y.useState)(20), [j, M] = (0, y.useState)(`heatmap`), N = t(`/reports/ccmax-resources/suppliers?${new URLSearchParams(C)}`), P = (0, y.useMemo)(() => h(N.data, n.data?.items, C.supplierId), [N.data, n.data, C.supplierId]), F = P.suppliers.filter(e => `${e.name} ${e.code}`.toLocaleLowerCase().includes(T.trim().toLocaleLowerCase())), I = Math.min(D, Math.max(1, Math.ceil(F.length / k))), L = F.slice((I - 1) * k, I * k), R = F.reduce((e, t) => e + t.total, 0), z = N.data?.from.slice(0, 4) !== N.data?.to.slice(0, 4), B = F.reduce((e, t) => Math.max(e, ...Object.values(t.days)), 1), V = {
    id: `__total__`,
    name: l(`筛选合计`),
    code: ``,
    total: R,
    days: Object.fromEntries(P.dates.map(e => [e, F.reduce((t, n) => t + (n.days[e] || 0), 0)]))
  };

  function H(e) {
    S(e), w(e), E(``), O(1), JSON.stringify(e) === JSON.stringify(C) && N.reload()
  }
  return (0, b.jsxs)(`div`, {
    className: `ccmax-analysis ccmax-supplier-daily`,
    children: [(0, b.jsxs)(`form`, {
      className: `panel ccmax-analysis-filters`,
      onSubmit: e => {
        e.preventDefault(), H({
          ...d
        })
      },
      children: [(0, b.jsxs)(`label`, {
        className: `field`,
        children: [(0, b.jsx)(`span`, {
          children: l(`创建日期`)
        }), (0, b.jsx)(v, {
          label: l(`创建日期`),
          from: d.from,
          to: d.to,
          onChange: (e, t) => S({
            ...d,
            from: e,
            to: t
          })
        })]
      }), r(`supplier.read`) && (0, b.jsxs)(`label`, {
        className: `field`,
        children: [(0, b.jsx)(`span`, {
          children: l(`供应商`)
        }), (0, b.jsx)(m, {
          label: l(`分析供应商`),
          value: d.supplierId,
          onChange: e => S({
            ...d,
            supplierId: e
          }),
          options: (n.data?.items || []).map(e => ({
            value: e.id,
            label: e.name,
            detail: e.code
          })),
          loading: n.loading,
          error: n.error
        })]
      }), (0, b.jsxs)(`div`, {
        className: `ccmax-analysis-actions`,
        children: [(0, b.jsx)(u, {
          type: `submit`,
          variant: `primary`,
          disabled: N.loading || N.refreshing || !d.from || !d.to,
          children: l(`查询`)
        }), (0, b.jsx)(u, {
          type: `button`,
          onClick: () => H(x()),
          children: l(`重置筛选`)
        }), (0, b.jsx)(u, {
          type: `button`,
          icon: `refresh`,
          disabled: N.loading || N.refreshing,
          onClick: N.reload,
          children: l(`刷新`)
        })]
      }), JSON.stringify(d) !== JSON.stringify(C) && (0, b.jsx)(`span`, {
        className: `ccmax-analysis-unapplied`,
        role: `status`,
        children: l(`筛选条件尚未应用`)
      })]
    }), (0, b.jsxs)(`div`, {
      className: `ccmax-analysis-tools`,
      children: [(0, b.jsx)(`div`, {
        className: `ccmax-analysis-shortcuts`,
        role: `group`,
        "aria-label": l(`创建日期快捷筛选`),
        children: _().map(e => (0, b.jsx)(`button`, {
          type: `button`,
          "aria-pressed": C.from === e.from && C.to === e.to,
          disabled: N.loading || N.refreshing,
          onClick: () => H({
            ...d,
            from: e.from,
            to: e.to
          }),
          children: l(e.label)
        }, e.label))
      }), (0, b.jsxs)(`details`, {
        className: `ccmax-analysis-method`,
        children: [(0, b.jsx)(`summary`, {
          children: l(`统计口径`)
        }), (0, b.jsx)(`p`, {
          children: l(`成功日期优先使用可信的上游创建时间，缺失时使用首次确认成功时间，统一按北京时间归日。失败、重试、重新授权和已有账号重复上号不重复计数；移除或删除不扣减历史数量。`)
        }), (0, b.jsx)(`p`, {
          children: l(`零表示该日没有已记录的成功新增；早期未记录的上号历史不补造。`)
        })]
      })]
    }), N.error ? (0, b.jsxs)(s, {
      tone: `error`,
      children: [N.error, (0, b.jsx)(u, {
        onClick: N.reload,
        children: l(`重新加载`)
      })]
    }) : N.loading ? (0, b.jsx)(c, {}) : N.data ? (0, b.jsxs)(b.Fragment, {
      children: [(0, b.jsxs)(`div`, {
        className: `ccmax-analysis-range`,
        children: [(0, b.jsxs)(`span`, {
          children: [N.data.from, ` — `, N.data.to]
        }), (0, b.jsx)(`span`, {
          children: C.supplierId ? n.data?.items.find(e => e.id === C.supplierId)?.name || C.supplierId : l(`全部供应商`)
        }), N.refreshing && (0, b.jsx)(`span`, {
          role: `status`,
          children: l(`刷新中…`)
        })]
      }), (0, b.jsxs)(`dl`, {
        className: `ccmax-analysis-summary`,
        children: [(0, b.jsxs)(`div`, {
          children: [(0, b.jsx)(`dt`, {
            children: l(`创建成功`)
          }), (0, b.jsx)(`dd`, {
            children: g(N.data.total)
          })]
        }), (0, b.jsxs)(`div`, {
          children: [(0, b.jsx)(`dt`, {
            children: l(`有上号记录的供应商`)
          }), (0, b.jsx)(`dd`, {
            children: g(P.suppliers.filter(e => e.total > 0).length)
          })]
        }), (0, b.jsxs)(`div`, {
          children: [(0, b.jsx)(`dt`, {
            children: l(`统计天数`)
          }), (0, b.jsx)(`dd`, {
            children: g(P.dates.length)
          })]
        }), (0, b.jsxs)(`div`, {
          children: [(0, b.jsx)(`dt`, {
            children: l(`日均上号`)
          }), (0, b.jsx)(`dd`, {
            children: g(Number((N.data.total / Math.max(1, P.dates.length)).toFixed(1)))
          })]
        })]
      }), P.suppliers.length ? (0, b.jsxs)(`section`, {
        className: `panel ccmax-analysis-details ccmax-supplier-matrix`,
        children: [(0, b.jsxs)(`header`, {
          className: `ccmax-analysis-section-head`,
          children: [(0, b.jsxs)(`div`, {
            children: [(0, b.jsx)(`h2`, {
              children: l(`供应商每日上号`)
            }), (0, b.jsx)(`p`, {
              children: l(`每格为当天成功新增数量，合计覆盖全部筛选结果。`)
            })]
          }), (0, b.jsxs)(`div`, {
            className: `ccmax-detail-view-controls`,
            children: [(0, b.jsx)(f, {
              value: j,
              onChange: M,
              items: [{
                id: `heatmap`,
                label: l(`热力图`)
              }, {
                id: `table`,
                label: l(`表格`)
              }]
            }), (0, b.jsx)(p, {
              value: T,
              onChange: e => {
                E(e), O(1)
              },
              placeholder: l(`搜索供应商名称或编码`)
            })]
          })]
        }), (0, b.jsx)(a, {
          data: F.length ? [...L, V] : [],
          columns: [{
            label: l(`供应商`),
            render: e => (0, b.jsxs)(`span`, {
              className: `ccmax-supplier-name`,
              children: [(0, b.jsx)(`strong`, {
                children: e.name
              }), e.code && (0, b.jsx)(`small`, {
                children: e.code
              })]
            })
          }, {
            label: l(`期间合计`),
            render: e => (0, b.jsx)(`strong`, {
              children: g(e.total)
            })
          }, ...P.dates.map(e => ({
            label: z ? e.slice(2) : e.slice(5),
            render: t => (0, b.jsx)(`span`, {
              className: (t.days[e] ? `ccmax-supplier-day-count` : `ccmax-count-zero`) + (j === `heatmap` ? ` ccmax-heatmap-cell` : ``),
              style: j === `heatmap` && t.days[e] ? {
                backgroundColor: `rgba(82, 121, 212, ${.04+.18*Math.min(1,t.days[e]/B)})`
              } : void 0,
              title: `${e}: ${g(t.days[e]||0)}`,
              children: g(t.days[e] || 0)
            })
          }))]
        }), (0, b.jsx)(i, {
          data: {
            items: L,
            total: F.length,
            page: I,
            size: k
          },
          page: I,
          size: k,
          onPage: O,
          onSizeChange: e => {
            A(e), O(1)
          }
        })]
      }) : (0, b.jsx)(o, {
        text: l(`所选范围暂无已记录的创建成功资源`)
      })]
    }) : null]
  })
}
export {
  S as
  default
};