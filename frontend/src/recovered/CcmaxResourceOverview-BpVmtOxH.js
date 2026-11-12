// origin: assets/CcmaxResourceOverview-BpVmtOxH.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/IntakeToday-Digz-vi6.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/labels-DaPzz6Ie.js", "assets/intake-D282aV6G.css"]))) => i.map(i => d[i]);
import {
  C as e,
  S as t,
  X as n,
  Y as r,
  Z as i,
  g as a,
  h as o,
  i as s,
  mt as c,
  pt as l,
  s as u,
  vt as d
} from "./index-Dnr0i-H9.js";
var f = d(i(), 1),
  p = n(),
  m = (0, f.lazy)(() => s(() => import(`./IntakeToday-Digz-vi6.js`), __vite__mapDeps([0, 1, 2, 3, 4]))),
  h = {
    ALL: c(`已成功交付`),
    PAUSED: c(`已暂停`),
    READY: c(`就绪`),
    ACTIVE: c(`已启用`),
    PROVISIONING: c(`配置中`),
    COOLING: c(`冷却中`),
    DRAINING: c(`退出中`),
    DEAD: c(`已停止`),
    GONE: c(`已移除`),
    UNKNOWN: c(`状态未知`),
    MISSING_USAGE: c(`额度数据缺失`),
    RATE_LIMITED: c(`冷却中`),
    FIVE_HOUR_EXHAUSTED: c(`5h 已满`),
    SEVEN_DAY_EXHAUSTED: c(`7d 已满`),
    INVALID: c(`账号失效`)
  },
  g = (e, t = 0) => e.toLocaleString(l(), {
    maximumFractionDigits: t
  });

function _(e) {
  let [t, n = ``] = e.split(`.`);
  return `$${t.replace(/\B(?=(\d{3})+(?!\d))/g,`, `)}.${n.padEnd(2,`0`)}`
}

function v(e) {
  if (!e || !Number.isFinite(Date.parse(e))) return c(`重置时间未提供`);
  let t = Math.ceil((Date.parse(e) - Date.now()) / 6e4);
  return t <= 0 ? c(`等待重置更新`) : t < 60 ? c(`最近 {0} 分钟后重置`, [t]) : t < 1440 ? c(`最近 {0} 小时后重置`, [g(t / 60, 1)]) : c(`最近 {0} 天后重置`, [g(t / 1440, 1)])
}

function y({
  label: e,
  quota: t,
  selected: n,
  onFilter: r
}) {
  let i = t.averageUsedPercent,
    a = i === null ? 0 : Math.min(100, Math.max(0, i));
  return (0, p.jsxs)(`div`, {
    className: `ccmax-quota-window`,
    children: [(0, p.jsxs)(`div`, {
      className: `ccmax-quota-top`,
      children: [(0, p.jsx)(`span`, {
        className: `ccmax-quota-label`,
        children: e
      }), (0, p.jsx)(`div`, {
        className: `ccmax-quota-track${i===null?` missing`:``}`,
        role: `progressbar`,
        "aria-label": c(`{0}平均已用`, [e]),
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": i === null ? void 0 : a,
        "aria-valuetext": i === null ? c(`暂无用量数据`) : c(`平均已用 {0}%`, [g(i, 1)]),
        children: i !== null && (0, p.jsx)(`span`, {
          style: {
            width: `${a}%`
          }
        })
      }), (0, p.jsxs)(`span`, {
        className: `ccmax-quota-percent`,
        children: [c(`均 `), (0, p.jsx)(`strong`, {
          children: i === null ? `—` : `${g(i,1)}%`
        })]
      })]
    }), (0, p.jsxs)(`div`, {
      className: `ccmax-quota-meta`,
      children: [(0, p.jsxs)(`span`, {
        children: [g(t.reportedCount), c(` 个窗口 `), (0, p.jsx)(`span`, {
          className: `ccmax-quota-separator`,
          children: `·`
        }), (0, p.jsxs)(`button`, {
          type: `button`,
          onClick: r,
          "aria-pressed": n,
          children: [c(`已满 `), g(t.exhaustedCount)]
        })]
      }), (0, p.jsx)(`span`, {
        title: t.nextResetAt ? new Date(t.nextResetAt).toLocaleString(l(), {
          timeZone: `Asia/Shanghai`
        }) : void 0,
        children: v(t.nextResetAt)
      })]
    }), (0, p.jsxs)(`div`, {
      className: `ccmax-quota-detail`,
      children: [(0, p.jsxs)(`span`, {
        title: c(`将每个窗口剩余百分比相加；不同套餐的实际容量不同，仅作参考`),
        children: [c(`余量折合约`), ` `, t.remainingEquivalent === null ? `—` : g(t.remainingEquivalent, 1), c(` 个窗口 `)]
      }), (0, p.jsxs)(`span`, {
        children: [g(t.missingCount), c(` 条未提供数据`)]
      })]
    })]
  })
}
var b = [
  [{
    key: `ready`,
    status: `READY`,
    label: c(`就绪 / 总数`)
  }, {
    key: `active`,
    status: `ACTIVE`,
    label: c(`已启用`)
  }, {
    key: `provisioning`,
    status: `PROVISIONING`,
    label: c(`配置中`)
  }],
  [{
    key: `invalid`,
    status: `INVALID`,
    label: c(`账号失效`),
    tone: `danger`
  }, {
    key: `dead`,
    status: `DEAD`,
    label: c(`已停止`)
  }],
  [{
    key: `cooling`,
    status: `COOLING`,
    label: c(`冷却中`),
    tone: `warm`
  }, {
    key: `gone`,
    status: `GONE`,
    label: c(`已移除`)
  }],
  [{
    key: `missingUsage`,
    status: `MISSING_USAGE`,
    label: c(`额度数据缺失`)
  }, {
    key: `draining`,
    status: `DRAINING`,
    label: c(`退出中`)
  }]
];

function x({
  filterQuery: n,
  operationalStatus: i,
  onFilter: s,
  refreshIntervalMs: l = 1e4
}) {
  let {
    refresh: d
  } = e(), [h, v] = (0, f.useState)(!1), x = (0, f.useId)(), S = new URLSearchParams(n);
  S.set(`resourceType`, `CCMAX`), S.delete(`operationalStatus`), S.delete(`page`), S.delete(`size`);
  let C = t(h ? `/resources/overview?${S}` : null, l),
    w = C.data;
  return (0, p.jsxs)(`section`, {
    className: `panel ccmax-overview${h?` expanded`:``}`,
    "aria-label": c(`CCMAX 资源概况`),
    children: [(0, p.jsx)(`h2`, {
      className: `ccmax-overview-heading`,
      children: (0, p.jsxs)(`button`, {
        type: `button`,
        className: `ccmax-overview-toggle`,
        "aria-expanded": h,
        "aria-controls": x,
        onClick: () => v(e => !e),
        children: [(0, p.jsxs)(`span`, {
          className: `ccmax-overview-title`,
          children: [(0, p.jsx)(r, {
            name: `chevron`,
            size: 14
          }), c(`CCMAX 资源概况 `), (0, p.jsx)(`span`, {
            className: `ccmax-overview-info`,
            title: c(`按当前筛选统计已成功交付的资源，状态和额度按最近同步快照展示；状态分类互斥，等待自动续期不算账号失效；额度指标单独统计。`),
            children: (0, p.jsx)(r, {
              name: `info`,
              size: 13
            })
          })]
        }), (0, p.jsx)(`span`, {
          className: `ccmax-overview-toggle-label`,
          children: c(h ? `收起` : `展开`)
        })]
      })
    }), h && (0, p.jsxs)(`div`, {
      id: x,
      className: `ccmax-overview-content`,
      children: [(0, p.jsx)(f.Suspense, {
        fallback: (0, p.jsx)(o, {}),
        children: (0, p.jsx)(m, {})
      }), C.loading ? (0, p.jsx)(o, {}) : C.error ? (0, p.jsxs)(`div`, {
        className: `ccmax-overview-error`,
        children: [(0, p.jsxs)(a, {
          tone: `red`,
          children: [c(`资源概况加载失败：`), C.error]
        }), (0, p.jsx)(u, {
          onClick: d,
          children: c(`重新加载`)
        })]
      }) : w ? (0, p.jsxs)(p.Fragment, {
        children: [w.counts.total === 0 && (0, p.jsx)(`p`, {
          className: `ccmax-overview-empty`,
          children: c(`当前筛选下没有已成功交付的 CCMAX 资源`)
        }), w.dailyConsumption && (0, p.jsxs)(`div`, {
          className: `ccmax-overview-daily`,
          "aria-label": c(`每日消耗`),
          children: [(0, p.jsxs)(`span`, {
            children: [c(`每日消耗`), ` `, (0, p.jsxs)(`small`, {
              children: [c(`今日 · `), w.dailyConsumption.businessDate, c(`（北京时间）`)]
            })]
          }), (0, p.jsxs)(`strong`, {
            children: [w.dailyConsumption.amount === null ? c(`暂无当日数据`) : _(w.dailyConsumption.amount), w.dailyConsumption.amount !== null && (0, p.jsx)(`small`, {
              children: ` USD`
            })]
          }), (0, p.jsxs)(`span`, {
            className: `ccmax-overview-daily-meta`,
            children: [c(`已采集 `), g(w.dailyConsumption.reportedResourceCount), c(` 个资源 · 当日持续更新 `)]
          })]
        }), (0, p.jsxs)(`div`, {
          className: `ccmax-overview-layout`,
          children: [(0, p.jsx)(`div`, {
            className: `ccmax-overview-counts`,
            "aria-label": c(`资源状态数量`),
            children: b.map((e, t) => (0, p.jsx)(`div`, {
              className: `ccmax-overview-column`,
              children: e.map(e => (0, p.jsxs)(`div`, {
                className: `ccmax-overview-metric ${e.tone||``}`,
                children: [(0, p.jsx)(`span`, {
                  children: e.label
                }), (0, p.jsxs)(`div`, {
                  className: `ccmax-overview-value`,
                  children: [(0, p.jsx)(`button`, {
                    type: `button`,
                    "aria-label": c(`{0} {1} 条，筛选资源`, [e.label, w.counts[e.key]]),
                    "aria-pressed": i === e.status,
                    onClick: () => s(e.status),
                    children: g(w.counts[e.key] ?? 0)
                  }), e.key === `ready` && (0, p.jsxs)(`button`, {
                    type: `button`,
                    className: `ccmax-overview-total`,
                    "aria-label": c(`全部已成功交付资源 {0} 条，筛选资源`, [w.counts.total]),
                    "aria-pressed": i === `ALL`,
                    onClick: () => s(`ALL`),
                    children: [`/ `, g(w.counts.total)]
                  })]
                })]
              }, e.key))
            }, t))
          }), (0, p.jsxs)(`div`, {
            className: `ccmax-overview-quotas`,
            "aria-label": c(`资源额度概况`),
            children: [(0, p.jsx)(y, {
              label: c(`5 小时`),
              quota: w.fiveHour,
              selected: i === `FIVE_HOUR_EXHAUSTED`,
              onFilter: () => s(`FIVE_HOUR_EXHAUSTED`)
            }), (0, p.jsx)(y, {
              label: c(`7 天`),
              quota: w.sevenDay,
              selected: i === `SEVEN_DAY_EXHAUSTED`,
              onFilter: () => s(`SEVEN_DAY_EXHAUSTED`)
            })]
          })]
        }), (0, p.jsxs)(`div`, {
          className: `ccmax-overview-footnote`,
          children: [(0, p.jsx)(`span`, {
            children: c(`按当前筛选统计已成功交付资源；5h/7d额度统计不含已移除资源；余量折合按窗口百分比估算。 `)
          }), (w.counts.paused ?? 0) > 0 && (0, p.jsxs)(`button`, {
            type: `button`,
            onClick: () => s(`PAUSED`),
            children: [c(`已暂停`), ` `, g(w.counts.paused ?? 0)]
          }), w.counts.unknownState > 0 && (0, p.jsxs)(`button`, {
            type: `button`,
            onClick: () => s(`UNKNOWN`),
            children: [c(`状态未知 `), g(w.counts.unknownState), c(` 条 `)]
          })]
        })]
      }) : null]
    })]
  })
}
export {
  h as n, x as t
};
