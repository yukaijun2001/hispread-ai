// origin: assets/DailyCreationAnalysis-MGRzns81.js
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
  o as u,
  s as d,
  u as f,
  vt as p,
  x as m
} from "./index-Dnr0i-H9.js";
import {
  r as h
} from "./QueryFilters-CwGBc_NH.js";
import {
  c as g,
  f as _,
  i as v,
  l as y,
  n as b,
  o as x,
  s as S,
  t as C
} from "./ccmaxAnalysis-BjOYJv3E.js";
import {
  t as w
} from "./CcmaxDistribution-DQLKF7Js.js";
import {
  n as T,
  t as E
} from "./DateRangePicker-DtOG4QUZ.js";
var D = n(),
  O = p(r(), 1);

function k({
  days: e,
  dimension: t,
  selectedDate: n,
  onSelect: r
}) {
  let i = (0, O.useRef)(null),
    [a, o] = (0, O.useState)(900);
  (0, O.useEffect)(() => {
    if (!i.current) return;
    let e = new ResizeObserver(([e]) => {
      e.contentRect.width > 0 && o(e.contentRect.width)
    });
    return e.observe(i.current), () => e.disconnect()
  }, []);
  let s = Object.create(null);
  e.forEach(e => Object.entries(e[t]).forEach(([e, t]) => {
    s[e] = (s[e] || 0) + t
  }));
  let c = b(s, t),
    u = t === `types` ? _ : g,
    d = Math.max(1, ...e.map(e => e.total)),
    f = 10 ** Math.floor(Math.log10(d / 4)),
    p = ([1, 2, 5, 10].find(e => e * f >= d / 4) || 10) * f,
    m = Math.max(1, p),
    h = Math.ceil(d * 1.1 / m) * m,
    v = Math.max(320, a, e.length * 16 + 80),
    y = Math.max(48, C(h).length * 8 + 16),
    S = v - y - 16,
    w = S / Math.max(1, e.length),
    T = Math.min(48, w * .6),
    E = Array.from({
      length: h / m + 1
    }, (e, t) => t * m),
    k = Math.max(1, Math.ceil(e.length / Math.max(2, Math.floor(S / 80))));
  return (0, D.jsxs)(D.Fragment, {
    children: [(0, D.jsx)(`div`, {
      className: `ccmax-analysis-chart`,
      ref: i,
      children: (0, D.jsxs)(`svg`, {
        viewBox: `0 0 ${v} 260`,
        style: {
          width: v,
          height: 260
        },
        role: `group`,
        "aria-label": l(`每日创建趋势，选择日期可查看明细`),
        children: [E.map(e => {
          let t = 20 + 198 * (1 - e / h);
          return (0, D.jsxs)(`g`, {
            className: `ccmax-chart-axis`,
            children: [(0, D.jsx)(`line`, {
              x1: y,
              y1: t,
              x2: v - 16,
              y2: t
            }), (0, D.jsx)(`text`, {
              x: y - 9,
              y: t + 4,
              textAnchor: `end`,
              children: C(e)
            })]
          }, e)
        }), e.map((i, a) => {
          let o = 0,
            s = c.map(e => {
              let n = e.keys.reduce((e, n) => e + (i[t][n] || 0), 0),
                r = {
                  ...e,
                  count: n,
                  y: 20 + 198 * (1 - (o + n) / h)
                };
              return o += n, r
            });
          return (0, D.jsxs)(`g`, {
            role: `button`,
            tabIndex: 0,
            "aria-label": l(`{0}，创建 {1} 个资源`, [i.date, C(i.total)]),
            "aria-pressed": n === i.date,
            className: n === i.date ? `ccmax-chart-day selected` : `ccmax-chart-day`,
            onClick: () => r(n === i.date ? `` : i.date),
            onKeyDown: e => {
              (e.key === `Enter` || e.key === ` `) && (e.preventDefault(), r(n === i.date ? `` : i.date)), e.key === `Escape` && r(``)
            },
            children: [(0, D.jsx)(`title`, {
              children: `${i.date} · ${C(i.total)}\n${x(i[t]).map(([e,t])=>`${u(e)}: ${C(t)}`).join(`
`)}`
            }), (0, D.jsx)(`rect`, {
              className: `ccmax-chart-hit`,
              x: y + (a + .5) * w - Math.min(w, 72) / 2,
              y: 12,
              width: Math.min(w, 72),
              height: 214,
              rx: 6
            }), s.map(e => e.count > 0 && (0, D.jsx)(`rect`, {
              className: `ccmax-series-${e.color}`,
              x: y + (a + .5) * w - T / 2,
              y: e.y,
              width: T,
              height: 198 * e.count / h
            }, e.id)), e.length <= 14 && i.total > 0 && (0, D.jsx)(`text`, {
              className: `ccmax-chart-total`,
              x: y + (a + .5) * w,
              y: 20 + 198 * (1 - i.total / h) - 9,
              textAnchor: `middle`,
              children: C(i.total)
            }), a % k === 0 && (0, D.jsx)(`text`, {
              className: `ccmax-chart-date`,
              x: y + (a + .5) * w,
              y: 245,
              textAnchor: `middle`,
              children: i.date.slice(5)
            })]
          }, i.date)
        })]
      })
    }), (0, D.jsx)(`div`, {
      className: `ccmax-chart-legend`,
      children: c.map(e => (0, D.jsxs)(`span`, {
        children: [(0, D.jsx)(`i`, {
          className: `ccmax-series-${e.color}`
        }), e.label, (0, D.jsx)(`strong`, {
          children: C(e.keys.reduce((e, t) => e + (s[t] || 0), 0))
        })]
      }, e.id))
    })]
  })
}

function A({
  rows: e,
  peak: t
}) {
  let [n, r] = (0, O.useState)(`ratio`), [i, a] = (0, O.useState)(``);
  return e.length ? (0, D.jsxs)(`div`, {
    className: `ccmax-detail-chart`,
    children: [(0, D.jsxs)(`div`, {
      className: `ccmax-detail-chart-tools`,
      children: [(0, D.jsx)(`p`, {
        children: l(`数量比较新增规模，比例比较当前状态构成；点击条形查看精确数量。`)
      }), (0, D.jsx)(m, {
        value: n,
        onChange: r,
        items: [{
          id: `ratio`,
          label: l(`按比例`)
        }, {
          id: `count`,
          label: l(`按数量`)
        }]
      })]
    }), (0, D.jsxs)(`div`, {
      className: `ccmax-detail-chart-scale`,
      "aria-hidden": `true`,
      children: [(0, D.jsxs)(`span`, {
        children: [l(`创建日期`), ` / `, l(`套餐类型`)]
      }), (0, D.jsxs)(`span`, {
        children: [`0 `, (0, D.jsx)(`span`, {
          children: n === `ratio` ? `100%` : C(t)
        })]
      }), (0, D.jsx)(`span`, {
        children: l(`创建数量`)
      })]
    }), (0, D.jsx)(`ul`, {
      children: e.map(e => {
        let r = [...v, `DELETED`].filter(t => e.states[t] > 0),
          o = r.map(t => `${g(t)} ${C(e.states[t])}`).join(` · `);
        return (0, D.jsxs)(`li`, {
          children: [(0, D.jsxs)(`button`, {
            type: `button`,
            className: `ccmax-detail-chart-row`,
            "aria-expanded": i === e.id,
            "aria-label": `${e.date} · ${_(e.type)} · ${C(e.total)} · ${o}`,
            onClick: () => a(i === e.id ? `` : e.id),
            children: [(0, D.jsxs)(`span`, {
              className: `ccmax-detail-chart-label`,
              children: [(0, D.jsx)(`time`, {
                dateTime: e.date,
                children: e.date
              }), (0, D.jsx)(`strong`, {
                children: _(e.type)
              })]
            }), (0, D.jsx)(`span`, {
              className: `ccmax-detail-chart-track`,
              title: o,
              children: r.map(r => (0, D.jsx)(`span`, {
                className: `ccmax-series-${S(r)}`,
                style: {
                  width: `${100*e.states[r]/(n===`ratio`?e.total:t)}%`
                }
              }, r))
            }), (0, D.jsx)(`strong`, {
              className: `ccmax-detail-chart-count`,
              children: C(e.total)
            })]
          }), i === e.id && (0, D.jsx)(`div`, {
            className: `ccmax-analysis-state-counts ccmax-detail-chart-expanded`,
            children: r.map(t => (0, D.jsxs)(`span`, {
              "data-state": t,
              children: [(0, D.jsx)(u, {
                state: t,
                label: g(t)
              }), (0, D.jsx)(`strong`, {
                children: C(e.states[t])
              })]
            }, t))
          })]
        }, e.id)
      })
    }), (0, D.jsx)(`div`, {
      className: `ccmax-chart-legend`,
      children: [...v, `DELETED`].filter(t => e.some(e => e.states[t] > 0)).map(e => (0, D.jsxs)(`span`, {
        children: [(0, D.jsx)(`i`, {
          className: `ccmax-series-${S(e)}`
        }), g(e)]
      }, e))
    })]
  }) : (0, D.jsx)(o, {
    text: l(`所选日期没有已记录的创建成功资源`)
  })
}

function j() {
  let {
    from: e,
    to: t
  } = T()[2];
  return {
    from: e,
    to: t,
    supplierId: ``
  }
}

function M({
  catalog: n
}) {
  let {
    has: r
  } = e(), [p, v] = (0, O.useState)(j), [b, S] = (0, O.useState)(j), [M, N] = (0, O.useState)(`types`), [P, F] = (0, O.useState)(`chart`), [I, L] = (0, O.useState)(``), [R, z] = (0, O.useState)(1), [B, V] = (0, O.useState)(20), H = (0, O.useRef)(null), U = new URLSearchParams(b).toString(), W = t(`/reports/ccmax-resources?${U}`), G = (0, O.useMemo)(() => y(W.data), [W.data]), K = G.details.filter(e => !I || e.date === I);
  (0, O.useEffect)(() => {
    z(e => Math.min(e, Math.max(1, Math.ceil(K.length / B))))
  }, [K.length, B]);
  let q = K.slice((R - 1) * B, R * B),
    J = W.data?.total || 0,
    Y = G.days.find(e => e.date === I),
    X = JSON.stringify(p) !== JSON.stringify(b),
    Z = G.days.filter(e => e.total > 0).length,
    Q = e => J ? `${(100*e/J).toFixed(1)}%` : `0.0%`;

  function $() {
    z(1), L(``)
  }
  return (0, D.jsxs)(`div`, {
    className: `ccmax-analysis ccmax-daily-analysis`,
    children: [(0, D.jsxs)(`form`, {
      className: `panel ccmax-analysis-filters`,
      onSubmit: e => {
        e.preventDefault(), !(W.loading || W.refreshing) && (S({
          ...p
        }), $(), JSON.stringify(p) === JSON.stringify(b) && W.reload())
      },
      children: [(0, D.jsxs)(`label`, {
        className: `field`,
        children: [(0, D.jsx)(`span`, {
          children: l(`创建日期`)
        }), (0, D.jsx)(E, {
          label: l(`创建日期`),
          from: p.from,
          to: p.to,
          onChange: (e, t) => v({
            ...p,
            from: e,
            to: t
          })
        })]
      }), r(`supplier.read`) && (0, D.jsxs)(`label`, {
        className: `field`,
        children: [(0, D.jsx)(`span`, {
          children: l(`供应商`)
        }), (0, D.jsx)(h, {
          label: l(`分析供应商`),
          value: p.supplierId,
          onChange: e => v({
            ...p,
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
      }), (0, D.jsxs)(`div`, {
        className: `ccmax-analysis-actions`,
        children: [(0, D.jsx)(d, {
          type: `submit`,
          variant: `primary`,
          disabled: W.loading || W.refreshing || !p.from || !p.to,
          children: l(`查询`)
        }), (0, D.jsx)(d, {
          type: `button`,
          onClick: () => {
            let e = j();
            v(e), S(e), $(), JSON.stringify(e) === JSON.stringify(b) && W.reload()
          },
          children: l(`重置筛选`)
        }), (0, D.jsx)(d, {
          type: `button`,
          icon: `refresh`,
          disabled: W.loading || W.refreshing,
          onClick: W.reload,
          children: l(`刷新`)
        })]
      }), X && (0, D.jsx)(`span`, {
        className: `ccmax-analysis-unapplied`,
        role: `status`,
        children: l(`筛选条件尚未应用`)
      })]
    }), (0, D.jsxs)(`div`, {
      className: `ccmax-analysis-tools`,
      children: [(0, D.jsx)(`div`, {
        className: `ccmax-analysis-shortcuts`,
        role: `group`,
        "aria-label": l(`创建日期快捷筛选`),
        children: T().map(e => (0, D.jsx)(`button`, {
          type: `button`,
          "aria-pressed": b.from === e.from && b.to === e.to,
          disabled: W.loading || W.refreshing,
          onClick: () => {
            let t = {
              ...p,
              from: e.from,
              to: e.to
            };
            v(t), S(t), $(), JSON.stringify(t) === JSON.stringify(b) && W.reload()
          },
          children: l(e.label)
        }, e.label))
      }), (0, D.jsxs)(`details`, {
        className: `ccmax-analysis-method`,
        children: [(0, D.jsx)(`summary`, {
          children: l(`统计口径`)
        }), (0, D.jsx)(`p`, {
          children: l(`按北京时间的成功记账日期统计：优先使用可信的上游创建时间，缺失时使用首次确认成功时间。重复上号与失败尝试不计入；移除或删除不扣减历史创建数量。`)
        }), (0, D.jsx)(`p`, {
          children: l(`套餐采用创建成功记录（未知套餐可后续补识别），状态采用最近同步结果，不是历史当日快照。早期未记录历史不补造；无记录不代表实际零新增。`)
        })]
      })]
    }), W.error ? (0, D.jsxs)(s, {
      tone: `error`,
      children: [W.error, (0, D.jsx)(d, {
        onClick: W.reload,
        children: l(`重新加载`)
      })]
    }) : W.loading ? (0, D.jsx)(c, {}) : W.data ? (0, D.jsxs)(D.Fragment, {
      children: [(0, D.jsxs)(`div`, {
        className: `ccmax-analysis-range`,
        children: [(0, D.jsxs)(`span`, {
          children: [W.data.from, ` — `, W.data.to]
        }), (0, D.jsx)(`span`, {
          children: b.supplierId ? n.data?.items.find(e => e.id === b.supplierId)?.name || b.supplierId : l(`全部供应商`)
        }), W.refreshing && (0, D.jsx)(`span`, {
          role: `status`,
          children: l(`刷新中…`)
        })]
      }), (0, D.jsxs)(`dl`, {
        className: `ccmax-analysis-summary`,
        children: [(0, D.jsxs)(`div`, {
          children: [(0, D.jsx)(`dt`, {
            children: l(`创建成功`)
          }), (0, D.jsx)(`dd`, {
            children: C(J)
          })]
        }), (0, D.jsxs)(`div`, {
          children: [(0, D.jsx)(`dt`, {
            children: l(`有创建记录的天数`)
          }), (0, D.jsxs)(`dd`, {
            children: [C(Z), ` `, (0, D.jsxs)(`small`, {
              children: [`/ `, G.days.length]
            })]
          })]
        }), (0, D.jsxs)(`div`, {
          className: `ccmax-summary-ready`,
          children: [(0, D.jsx)(`dt`, {
            children: l(`该批次当前就绪`)
          }), (0, D.jsxs)(`dd`, {
            children: [C(G.states.READY || 0), ` `, (0, D.jsx)(`small`, {
              children: Q(G.states.READY || 0)
            })]
          })]
        }), (0, D.jsxs)(`div`, {
          children: [(0, D.jsx)(`dt`, {
            children: l(`套餐类型`)
          }), (0, D.jsx)(`dd`, {
            children: C(Object.keys(G.types).length)
          })]
        })]
      }), J ? (0, D.jsxs)(D.Fragment, {
        children: [(0, D.jsxs)(`div`, {
          className: `ccmax-daily-visuals`,
          children: [(0, D.jsxs)(`section`, {
            className: `panel ccmax-analysis-trend`,
            children: [(0, D.jsxs)(`header`, {
              className: `ccmax-analysis-section-head`,
              children: [(0, D.jsxs)(`div`, {
                children: [(0, D.jsx)(`h2`, {
                  children: l(`每日创建趋势`)
                }), (0, D.jsx)(`p`, {
                  children: l(`点击柱形可查看当天明细，再次点击取消。无创建记录的日期按零显示。`)
                })]
              }), (0, D.jsx)(m, {
                value: M,
                onChange: e => N(e),
                items: [{
                  id: `types`,
                  label: l(`按套餐类型`)
                }, {
                  id: `states`,
                  label: l(`按当前状态`)
                }]
              })]
            }), (0, D.jsx)(k, {
              days: G.days,
              dimension: M,
              selectedDate: I,
              onSelect: e => {
                L(e), z(1)
              }
            }), Y && (0, D.jsxs)(`div`, {
              className: `ccmax-chart-selection`,
              role: `status`,
              children: [(0, D.jsxs)(`span`, {
                children: [(0, D.jsx)(`strong`, {
                  children: Y.date
                }), l(`创建数量`), ` `, (0, D.jsx)(`b`, {
                  children: C(Y.total)
                })]
              }), (0, D.jsxs)(`div`, {
                children: [(0, D.jsx)(d, {
                  onClick: () => H.current?.scrollIntoView({
                    block: `start`
                  }),
                  children: l(`查看当日明细`)
                }), (0, D.jsx)(d, {
                  onClick: $,
                  children: l(`查看全部日期`)
                })]
              })]
            })]
          }), (0, D.jsxs)(`div`, {
            className: `ccmax-analysis-breakdowns`,
            children: [(0, D.jsx)(w, {
              title: l(`套餐类型分布`),
              values: Y?.types || G.types,
              dimension: `types`,
              context: I || l(`全部日期`)
            }), (0, D.jsx)(w, {
              title: l(`当前状态分布`),
              values: Y?.states || G.states,
              dimension: `states`,
              context: I || l(`全部日期`)
            })]
          })]
        }), (0, D.jsxs)(`section`, {
          className: `panel ccmax-analysis-details`,
          ref: H,
          children: [(0, D.jsxs)(`header`, {
            className: `ccmax-analysis-section-head`,
            children: [(0, D.jsxs)(`div`, {
              children: [(0, D.jsx)(`h2`, {
                children: I ? l(`{0} 创建明细`, [I]) : l(`每日类型与状态明细`)
              }), (0, D.jsx)(`p`, {
                children: l(`显示创建批次的最近同步状态，不是历史当日状态快照。`)
              })]
            }), (0, D.jsxs)(`div`, {
              className: `ccmax-detail-view-controls`,
              children: [(0, D.jsx)(m, {
                value: P,
                onChange: F,
                items: [{
                  id: `chart`,
                  label: l(`图形`)
                }, {
                  id: `table`,
                  label: l(`表格`)
                }]
              }), (0, D.jsx)(f, {
                ariaLabel: l(`明细日期`),
                searchPlaceholder: l(`搜索日期`),
                value: I,
                onChange: e => {
                  L(e), z(1)
                },
                options: [{
                  value: ``,
                  label: l(`全部日期`)
                }, ...[...G.days].reverse().map(e => ({
                  value: e.date,
                  label: e.date,
                  detail: C(e.total)
                }))]
              })]
            })]
          }), P === `chart` ? (0, D.jsx)(A, {
            rows: q,
            peak: Math.max(1, ...K.map(e => e.total))
          }) : (0, D.jsx)(a, {
            data: q,
            columns: [{
              label: l(`创建日期`),
              render: e => e.date
            }, {
              label: l(`套餐类型`),
              render: e => _(e.type)
            }, {
              label: l(`创建数量`),
              render: e => (0, D.jsx)(`strong`, {
                className: `ccmax-analysis-number`,
                children: C(e.total)
              })
            }, {
              label: l(`当前状态`),
              render: e => (0, D.jsx)(`div`, {
                className: `ccmax-analysis-state-counts`,
                children: x(e.states).map(([e, t]) => (0, D.jsxs)(`span`, {
                  "data-state": e,
                  children: [(0, D.jsx)(u, {
                    state: e,
                    label: g(e)
                  }), ` `, (0, D.jsx)(`strong`, {
                    children: C(t)
                  })]
                }, e))
              })
            }]
          }), (0, D.jsx)(i, {
            data: {
              items: q,
              total: K.length,
              page: R,
              size: B
            },
            page: R,
            size: B,
            onPage: z,
            onSizeChange: e => {
              V(e), z(1)
            }
          })]
        })]
      }) : (0, D.jsx)(o, {
        text: l(`所选范围暂无已记录的创建成功资源`)
      })]
    }) : null]
  })
}
export {
  M as
  default
};