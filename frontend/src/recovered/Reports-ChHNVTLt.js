// origin: assets/Reports-ChHNVTLt.js
import OperationsReport from '../views/roles/OperationsReport.js';
import {
  $ as e,
  A as t,
  C as n,
  G as r,
  X as i,
  Y as a,
  Z as o,
  c as s,
  d as c,
  g as l,
  h as u,
  m as d,
  mt as f,
  o as p,
  s as m,
  u as h,
  vt as g,
  x as _
} from "./index-Dnr0i-H9.js";
import {
  i as ee,
  r as te
} from "./QueryFilters-CwGBc_NH.js";
var v = g(o(), 1),
  y = i(),
  b = e => String(e).padStart(2, `0`),
  x = e => `${e.getFullYear()}-${b(e.getMonth()+1)}`,
  S = () => {
    let e = new Date;
    return e.setMonth(e.getMonth() - 5), x(e)
  },
  C = () => x(new Date),
  w = e => {
    let [t, n] = e.split(`-`);
    return f(`{0}年 {1}月`, [t, n])
  },
  T = e => {
    let [t, n] = e.split(`-`).map(Number);
    return `${e}-${new Date(t,n,0).getDate()}`
  };

function E({
  value: e,
  onChange: t,
  min: n,
  max: r,
  label: i
}) {
  let [o, s] = (0, v.useState)(!1), [c, l] = (0, v.useState)(Number(e.slice(0, 4))), u = (0, v.useRef)(null);
  (0, v.useEffect)(() => l(Number(e.slice(0, 4))), [e]), (0, v.useEffect)(() => {
    if (!o) return;
    let e = e => {
      u.current?.contains(e.target) || s(!1)
    };
    return document.addEventListener(`pointerdown`, e), () => document.removeEventListener(`pointerdown`, e)
  }, [o]);
  let d = e => {
    let t = `${e}-01`,
      i = `${e}-12`;
    return (!n || i >= n) && (!r || t <= r)
  };
  return (0, y.jsxs)(`div`, {
    className: `report-month-picker`,
    ref: u,
    children: [(0, y.jsxs)(`button`, {
      className: `report-month-trigger`,
      type: `button`,
      "aria-label": f(`{0}：{1}`, [i, w(e)]),
      "aria-haspopup": `dialog`,
      "aria-expanded": o,
      onClick: () => s(e => !e),
      onKeyDown: e => {
        e.key === `Escape` && s(!1)
      },
      children: [(0, y.jsx)(`span`, {
        children: w(e)
      }), (0, y.jsx)(a, {
        name: `down`,
        size: 14
      })]
    }), o && (0, y.jsxs)(`div`, {
      className: `report-month-popover`,
      role: `dialog`,
      "aria-label": i,
      children: [(0, y.jsxs)(`header`, {
        children: [(0, y.jsx)(`button`, {
          type: `button`,
          "aria-label": f(`上一年`),
          disabled: !d(c - 1),
          onClick: () => l(e => e - 1),
          children: (0, y.jsx)(`span`, {
            "aria-hidden": `true`,
            children: `‹`
          })
        }), (0, y.jsxs)(`strong`, {
          children: [c, f(`年`)]
        }), (0, y.jsx)(`button`, {
          type: `button`,
          "aria-label": f(`下一年`),
          disabled: !d(c + 1),
          onClick: () => l(e => e + 1),
          children: (0, y.jsx)(`span`, {
            "aria-hidden": `true`,
            children: `›`
          })
        })]
      }), (0, y.jsx)(`div`, {
        className: `report-month-grid`,
        children: Array.from({
          length: 12
        }, (i, a) => {
          let o = `${c}-${b(a+1)}`;
          return (0, y.jsxs)(`button`, {
            type: `button`,
            disabled: !!n && o < n || !!r && o > r,
            className: o === e ? `selected` : ``,
            "aria-pressed": o === e,
            onClick: () => {
              t(o), s(!1)
            },
            children: [a + 1, f(`月 `)]
          }, o)
        })
      })]
    })]
  })
}

function D() {
  let {
    user: t,
    has: i,
    notify: o
  } = n(), s = !!t.supplierId, [l, p] = (0, v.useState)(s ? `receivables` : `overview`), [g, b] = (0, v.useState)(S), [x, w] = (0, v.useState)(C), [D, O] = (0, v.useState)(``), [j, M] = (0, v.useState)(``), [N, P] = (0, v.useState)(``), [F, I] = (0, v.useState)(null), [L, R] = (0, v.useState)([]), [z, ie] = (0, v.useState)([]), B = ee(!s && i(`supplier.read`), `APPROVED`), ae = B.data?.items || [], [V, H] = (0, v.useState)([]), [oe, U] = (0, v.useState)(!0), [W, G] = (0, v.useState)(``), [K, q] = (0, v.useState)(``), [J, Y] = (0, v.useState)(null), [se, X] = (0, v.useState)(!1), Z = (0, v.useMemo)(() => ({
    from: S(),
    to: C()
  }), []), ce = g !== Z.from || x !== Z.to || !!D || !!j || !!N, Q = (0, v.useMemo)(() => new URLSearchParams({
    from: `${g}-01`,
    to: T(x),
    currency: D,
    supplierId: s ? `` : j,
    projectId: N
  }).toString(), [g, x, D, j, N, s]);
  (0, v.useEffect)(() => {
    i(`project.read`) && e(`/projects?enabled=true&page=1&size=100`).then(e => H(e.items)).catch(() => H([]))
  }, [i, s]), (0, v.useEffect)(() => {
    let t = !0,
      n = l === `overview` ? `/reports/overview?${Q}` : l === `monthly` ? `/reports/monthly-payables?${Q}` : `/reports/supplier-receivables?${Q}`;
    return U(!0), G(``), e(n).then(e => {
      t && (l === `overview` ? I(e) : l === `monthly` ? R(e.items) : ie(e.items))
    }).catch(e => {
      t && G(e.message)
    }).finally(() => {
      t && U(!1)
    }), () => {
      t = !1
    }
  }, [Q, l]);

  function le() {
    let e = l === `monthly` ? `MONTHLY_PAYABLES` : `SUPPLIER_RECEIVABLES`,
      t = document.createElement(`a`);
    t.href = `/api/reports/export?report=${e}&${Q}`, t.download = f(l === `monthly` ? `每月应付.csv` : `供应商应收.csv`), t.click(), o(f(`报表导出已开始`))
  }
  async function $(t, n, r) {
    q(t), Y(null), X(!0);
    let i = new URLSearchParams({
      from: r.from || `${g}-01`,
      to: r.to || T(x),
      currency: r.currency ?? D,
      supplierId: r.supplierId ?? (s ? `` : j),
      projectId: N,
      scope: n
    });
    try {
      let t = await e(`/reports/settlements?${i.toString()}`);
      Y(t.items)
    } catch (e) {
      o(e.message, !0), q(``)
    } finally {
      X(!1)
    }
  }
  let ue = s ? [{
    id: `receivables`,
    label: f(`供应商应收`)
  }] : [{
    id: `overview`,
    label: f(`经营概览`)
  }, {
    id: `monthly`,
    label: f(`每月应付`)
  }, {
    id: `receivables`,
    label: f(`供应商应收`)
  }];
  return (0, y.jsxs)(`div`, {
    className: `report-page`,
    children: [(0, y.jsx)(d, {
      title: f(`报表中心`),
      children: l !== `overview` && i(`report.export`) && (0, y.jsx)(m, {
        icon: `download`,
        onClick: le,
        children: f(`导出 CSV `)
      })
    }), (0, y.jsx)(_, {
      items: ue,
      value: l,
      onChange: e => p(e)
    }), (0, y.jsxs)(`section`, {
      className: `panel report-filters`,
      "aria-label": f(`报表筛选`),
      children: [(0, y.jsxs)(`div`, {
        className: `report-filter-head`,
        children: [(0, y.jsxs)(`div`, {
          children: [(0, y.jsx)(a, {
            name: `filter`,
            size: 16
          }), (0, y.jsx)(`strong`, {
            children: f(`筛选条件`)
          }), (0, y.jsx)(`span`, {
            children: f(`按结算周期归属统计`)
          })]
        }), (0, y.jsxs)(`button`, {
          className: `report-filter-reset`,
          type: `button`,
          disabled: !ce,
          onClick: () => {
            b(Z.from), w(Z.to), O(``), M(``), P(``)
          },
          children: [(0, y.jsx)(a, {
            name: `refresh`,
            size: 14
          }), f(`重置 `)]
        })]
      }), (0, y.jsxs)(`div`, {
        className: `report-filter-grid ${s?`supplier-side`:``}`,
        children: [(0, y.jsxs)(`div`, {
          className: `report-filter-field report-period-field`,
          children: [(0, y.jsx)(`span`, {
            children: f(`统计月份`)
          }), (0, y.jsxs)(`div`, {
            className: `report-period-control`,
            children: [(0, y.jsx)(E, {
              label: f(`开始月份`),
              value: g,
              onChange: b,
              max: x
            }), (0, y.jsx)(`span`, {
              className: `report-period-separator`,
              children: f(`至`)
            }), (0, y.jsx)(E, {
              label: f(`结束月份`),
              value: x,
              onChange: w,
              min: g
            })]
          })]
        }), (0, y.jsxs)(`label`, {
          className: `report-filter-field`,
          children: [(0, y.jsx)(`span`, {
            children: f(`币种`)
          }), (0, y.jsx)(h, {
            visual: `currency`,
            ariaLabel: f(`报表币种`),
            value: D,
            onChange: O,
            options: [{
              value: ``,
              label: f(`全部币种`),
              tone: `all`
            }, {
              value: `USD`,
              label: `USD`
            }, {
              value: `CNY`,
              label: `CNY`
            }, {
              value: `USDT`,
              label: `USDT`
            }]
          })]
        }), !s && (0, y.jsxs)(`label`, {
          className: `report-filter-field`,
          children: [(0, y.jsx)(`span`, {
            children: f(`供应商`)
          }), (0, y.jsx)(te, {
            label: f(`报表供应商`),
            value: j,
            onChange: M,
            options: ae.map(e => ({
              value: e.id,
              label: e.name,
              detail: e.code
            })),
            loading: B.loading,
            error: B.error
          })]
        }), (0, y.jsxs)(`label`, {
          className: `report-filter-field`,
          children: [(0, y.jsx)(`span`, {
            children: f(`项目`)
          }), (0, y.jsx)(h, {
            visual: `project`,
            ariaLabel: f(`报表项目`),
            value: N,
            onChange: P,
            options: [{
              value: ``,
              label: f(`全部项目`),
              tone: `all`
            }, ...V.map(e => ({
              value: e.id,
              label: e.name,
              detail: e.categoryName || e.category
            }))],
            disabled: !V.length
          })]
        })]
      })]
    }), W ? (0, y.jsx)(c, {
      text: W,
      error: !0
    }) : oe ? (0, y.jsx)(u, {}) : l === `overview` && F ? (0, y.jsx)(ne, {
      data: F,
      onSupplier: e => void $(f(`{0} · 应收明细`, [e.supplierName]), `CONFIRMED`, {
        supplierId: e.supplierId,
        currency: e.currency
      })
    }) : l === `monthly` ? (0, y.jsx)(k, {
      rows: L,
      onRow: e => {
        let [t, n] = e.month.split(`-`).map(Number);
        $(f(`{0} · {1} 应付明细`, [e.month, e.currency]), `LIVE`, {
          from: `${e.month}-01`,
          to: `${e.month}-${new Date(t,n,0).getDate()}`,
          currency: e.currency
        })
      }
    }) : (0, y.jsx)(A, {
      rows: z,
      onRow: e => void $(f(`{0} · 应收明细`, [e.supplierName]), `CONFIRMED`, {
        supplierId: e.supplierId,
        currency: e.currency
      })
    }), K && (0, y.jsx)(r, {
      title: K,
      subtitle: f(`最多展示 200 张结算单`),
      onClose: () => q(``),
      className: `report-detail-modal`,
      children: se || J === null ? (0, y.jsx)(u, {}) : (0, y.jsx)(re, {
        rows: J
      })
    })]
  })
}

function O({
  value: e,
  currency: n
}) {
  return (0, y.jsxs)(`span`, {
    className: `money-value`,
    children: [n, ` `, t(e, n)]
  })
}

function ne({
  data: e,
  onSupplier: n
}) {
  return (0, y.jsxs)(`div`, {
    className: `report-overview`,
    children: [!!e.summary.length && (0, y.jsx)(`div`, {
      className: `report-summary-grid`,
      children: e.summary.map(e => (0, y.jsxs)(`article`, {
        className: `report-summary-card`,
        children: [(0, y.jsxs)(`header`, {
          children: [(0, y.jsx)(`strong`, {
            children: e.currency
          }), (0, y.jsxs)(`span`, {
            children: [e.supplierCount, f(` 家供应商`)]
          })]
        }), (0, y.jsxs)(`dl`, {
          children: [(0, y.jsxs)(`div`, {
            children: [(0, y.jsx)(`dt`, {
              children: f(`已确认应付`)
            }), (0, y.jsx)(`dd`, {
              children: t(e.confirmedPayable, e.currency)
            })]
          }), (0, y.jsxs)(`div`, {
            children: [(0, y.jsx)(`dt`, {
              children: f(`已付款`)
            }), (0, y.jsx)(`dd`, {
              children: t(e.paidAmount, e.currency)
            })]
          }), (0, y.jsxs)(`div`, {
            className: `accent`,
            children: [(0, y.jsx)(`dt`, {
              children: f(`待付款`)
            }), (0, y.jsx)(`dd`, {
              children: t(e.outstandingAmount, e.currency)
            })]
          }), (0, y.jsxs)(`div`, {
            children: [(0, y.jsx)(`dt`, {
              children: f(`已确认到账`)
            }), (0, y.jsx)(`dd`, {
              children: t(e.receivedAmount, e.currency)
            })]
          })]
        }), (0, y.jsxs)(`footer`, {
          children: [e.settlementCount, f(` 张结算单 `), e.disputedCount ? f(` · {0} 笔到账争议`, [e.disputedCount]) : ``]
        })]
      }, e.currency))
    }), (0, y.jsxs)(`section`, {
      className: `panel report-section`,
      children: [(0, y.jsxs)(`div`, {
        className: `panel-section-head`,
        children: [(0, y.jsx)(`h2`, {
          children: f(`月度应付趋势`)
        }), (0, y.jsx)(`span`, {
          children: f(`按结算周期结束月份归属`)
        })]
      }), (0, y.jsx)(k, {
        rows: e.monthly,
        compact: !0
      })]
    }), (0, y.jsxs)(`section`, {
      className: `panel report-section`,
      children: [(0, y.jsxs)(`div`, {
        className: `panel-section-head`,
        children: [(0, y.jsx)(`h2`, {
          children: f(`供应商应收排行`)
        }), (0, y.jsx)(`span`, {
          children: f(`按待付款金额排序`)
        })]
      }), (0, y.jsx)(A, {
        rows: e.suppliers.slice(0, 10),
        onRow: n,
        compact: !0
      })]
    })]
  })
}

function k({
  rows: e,
  onRow: t,
  compact: n = !1
}) {
  return (0, y.jsxs)(`section`, {
    className: n ? `` : `panel report-section`,
    children: [!n && (0, y.jsx)(l, {
      children: f(`原始金额和最终应付包含待确认及已确认结算；已确认应付、已付款和待付款只按供应商已确认结算统计。 `)
    }), (0, y.jsx)(s, {
      data: e,
      onRow: t,
      columns: [{
        label: f(`月份`),
        render: e => e.month
      }, {
        label: f(`币种`),
        render: e => e.currency
      }, {
        label: f(`原始金额`),
        render: e => (0, y.jsx)(O, {
          value: e.originalAmount,
          currency: e.currency
        })
      }, {
        label: f(`最终应付`),
        render: e => (0, y.jsx)(O, {
          value: e.finalPayable,
          currency: e.currency
        })
      }, {
        label: f(`已确认应付`),
        render: e => (0, y.jsx)(O, {
          value: e.confirmedPayable,
          currency: e.currency
        })
      }, {
        label: f(`已付款`),
        render: e => (0, y.jsx)(O, {
          value: e.paidAmount,
          currency: e.currency
        })
      }, {
        label: f(`待付款`),
        render: e => (0, y.jsx)(O, {
          value: e.outstandingAmount,
          currency: e.currency
        })
      }, {
        label: f(`结算单`),
        render: e => e.settlementCount
      }, {
        label: f(`供应商`),
        render: e => e.supplierCount
      }]
    })]
  })
}

function A({
  rows: e,
  onRow: t,
  compact: n = !1
}) {
  return (0, y.jsxs)(`section`, {
    className: n ? `` : `panel report-section`,
    children: [!n && (0, y.jsx)(l, {
      children: f(`应收只统计供应商已确认的结算；平台付款成功与供应商确认到账分别统计。`)
    }), (0, y.jsx)(s, {
      data: e,
      onRow: t,
      columns: [{
        label: f(`供应商`),
        render: e => (0, y.jsxs)(y.Fragment, {
          children: [(0, y.jsx)(`strong`, {
            children: e.supplierName
          }), (0, y.jsx)(`small`, {
            className: `table-subline`,
            children: e.supplierCode
          })]
        })
      }, {
        label: f(`币种`),
        render: e => e.currency
      }, {
        label: f(`应收`),
        render: e => (0, y.jsx)(O, {
          value: e.receivableAmount,
          currency: e.currency
        })
      }, {
        label: f(`已付款`),
        render: e => (0, y.jsx)(O, {
          value: e.paidAmount,
          currency: e.currency
        })
      }, {
        label: f(`待付款`),
        render: e => (0, y.jsx)(O, {
          value: e.outstandingAmount,
          currency: e.currency
        })
      }, {
        label: f(`确认到账`),
        render: e => (0, y.jsx)(O, {
          value: e.receivedAmount,
          currency: e.currency
        })
      }, {
        label: f(`待确认到账`),
        render: e => (0, y.jsx)(O, {
          value: e.unconfirmedReceiptAmount,
          currency: e.currency
        })
      }, {
        label: f(`待付单`),
        render: e => e.unpaidCount
      }, {
        label: f(`到账争议`),
        render: e => e.disputedCount || `—`
      }, {
        label: f(`最早待付`),
        render: e => e.earliestUnpaidDate || `—`
      }]
    })]
  })
}

function re({
  rows: e
}) {
  return (0, y.jsx)(s, {
    data: e,
    columns: [{
      label: f(`结算单`),
      render: e => e.code
    }, {
      label: f(`供应商`),
      render: e => e.supplierName
    }, {
      label: f(`项目`),
      render: e => e.projectName
    }, {
      label: f(`期间`),
      render: e => f(`{0} 至 {1}`, [e.periodStart, e.periodEnd])
    }, {
      label: f(`应付`),
      render: e => (0, y.jsx)(O, {
        value: e.total,
        currency: e.currency
      })
    }, {
      label: f(`已付款`),
      render: e => (0, y.jsx)(O, {
        value: e.paidAmount,
        currency: e.currency
      })
    }, {
      label: f(`待付款`),
      render: e => (0, y.jsx)(O, {
        value: e.outstandingAmount,
        currency: e.currency
      })
    }, {
      label: f(`状态`),
      render: e => (0, y.jsx)(p, {
        state: e.state
      })
    }]
  })
}
function RoleAwareReports() {
  const { user, has } = n();
  return !user.supplierId && has(`report.read`) && !has(`usage.read`) && !has(`settlement.read`)
    ? (0, y.jsx)(OperationsReport, {})
    : (0, y.jsx)(D, {});
}
export { RoleAwareReports as default };
