// origin: assets/Workbench-CVusO4pD.js
import {
  A as e,
  C as t,
  H as n,
  I as r,
  L as i,
  P as a,
  R as o,
  S as s,
  T as c,
  X as l,
  Y as u,
  Z as d,
  b as f,
  d as p,
  g as m,
  h,
  j as g,
  mt as _,
  n as v,
  ot as y,
  p as b,
  pt as x,
  r as S,
  rt as C,
  s as w,
  u as T,
  ut as E,
  vt as D,
  x as O
} from "./index-Dnr0i-H9.js";
import {
  i as k
} from "./systemLabels-DqpNuQ-_.js";

function A(e) {
  return {
    SUPPLIER_REVIEW: _(`资质待审核`),
    ACCOUNT_REVIEW: _(`收款账户待审核`),
    QUOTE_NEW: _(`新报价待审`),
    QUOTE_CHANGE: _(`改价待审`),
    SETTLEMENT_CONFIRM: _(`待确认应收金额`),
    PAYMENT_CREATE: _(`待申请付款`),
    PAYMENT_REVIEW: _(`付款待审核`),
    PAYMENT_EXECUTE: _(`待执行付款`),
    SUPPLIER_REVISION: _(`资料需要补充`),
    QUOTE_REJECTED: _(`报价已退回`),
    PAYMENT_RECEIPT: _(`请核对到账`)
  } [e.kind] ?? y(e.label)
}

function j(e) {
  return [`QUOTE_NEW`, `SUPPLIER_REVIEW`, `ACCOUNT_REVIEW`, `PAYMENT_REVIEW`].includes(e.kind) ? _(`审核`) : e.kind === `QUOTE_CHANGE` ? _(`审核改价`) : e.kind === `SUPPLIER_REVISION` ? _(`去补充`) : [`SETTLEMENT_CONFIRM`, `PAYMENT_RECEIPT`].includes(e.kind) ? _(`核对`) : e.kind === `PAYMENT_CREATE` ? _(`申请付款`) : e.kind === `PAYMENT_EXECUTE` ? _(`去付款`) : _(`查看`)
}

function M(e) {
  return e.replace(/(\d+(?:\.\d+)?)\s*倍/g, (e, t) => E(t)).replace(/(\d{4}-\d{2}-\d{2}) 至 (\d{4}-\d{2}-\d{2})/g, (e, t, n) => _(`{0} 至 {1}`, [t, n])).replace(/，自 (\d{4}-\d{2}-\d{2}) 生效/g, (e, t) => _(`，自 {0} 生效`, [t])).replace(/ \/ ([^·，]+?)(?= ·|，|$)/g, (e, t) => ` / ${k(t)}`)
}

function N(e) {
  return [`QUOTE_NEW`, `QUOTE_CHANGE`, `QUOTE_REJECTED`].includes(e.kind) ? M(e.summary) : e.summary
}

function P(e) {
  return [`报价`, `价格`, `期间`].includes(e.label) ? M(e.value) : e.value
}
var F = D(d(), 1),
  I = l();

function L(e, t = !1) {
  if (typeof e != `string` || e.length > 256 || !/^\d+(?:\.\d+)?$/.test(e)) return `—`;
  let [n, r] = e.split(`.`);
  return (t ? (BigInt(n) + (r && /[1-9]/.test(r) ? 1n : 0n)).toString() : n).replace(/\B(?=(\d{3})+(?!\d))/g, `,`) + (!t && r ? `.${r}` : ``)
}

function R(e) {
  return e.queriedAt || e.lastAttemptAt || e.dataUpdatedAt || ``
}

function z() {
  let e = S(),
    {
      user: n,
      has: i,
      refresh: o
    } = t(),
    c = s(i(`workbench.monitoring.read`) ? `/workbench/monitoring` : null, 1e4);
  if (!i(`workbench.monitoring.read`)) return null;
  let l = c.data || [];
  return (0, I.jsxs)(`section`, {
    className: `panel workbench-monitoring`,
    "aria-labelledby": `workbench-monitoring-title`,
    children: [(0, I.jsxs)(`div`, {
      className: `panel-section-head`,
      children: [(0, I.jsxs)(`div`, {
        children: [(0, I.jsx)(`h2`, {
          id: `workbench-monitoring-title`,
          children: _(`站点 RPM / TPM`)
        }), (0, I.jsx)(`span`, {
          className: `muted small`,
          children: _(`参考数据`)
        })]
      }), !n.supplierId && i(`workbench.monitoring.configure`) && (0, I.jsxs)(`button`, {
        className: `text-button`,
        onClick: () => r(`resource-targets`),
        children: [_(`配置工作台展示 `), (0, I.jsx)(u, {
          name: `arrow`,
          size: 15
        })]
      })]
    }), c.error && (0, I.jsxs)(m, {
      tone: `red`,
      children: [_(`运行情况读取失败：`), c.error, c.data && _(`；正在显示上次读取的数据。`), (0, I.jsx)(w, {
        onClick: o,
        children: _(`重试`)
      })]
    }), c.loading && !c.data ? (0, I.jsx)(`p`, {
      className: `workbench-monitoring-message`,
      children: _(`正在读取运行情况…`)
    }) : l.length ? e ? (0, I.jsx)(`div`, {
      className: `workbench-monitoring-list`,
      children: l.map(e => (0, I.jsxs)(`article`, {
        children: [(0, I.jsx)(`h3`, {
          children: e.categoryName || e.category
        }), (0, I.jsxs)(`dl`, {
          children: [(0, I.jsxs)(`div`, {
            children: [(0, I.jsx)(`dt`, {
              children: _(`参考 RPM`)
            }), (0, I.jsx)(`dd`, {
              children: L(e.rpm, !0)
            })]
          }), (0, I.jsxs)(`div`, {
            children: [(0, I.jsx)(`dt`, {
              children: _(`参考 TPM`)
            }), (0, I.jsx)(`dd`, {
              children: L(e.tpm)
            })]
          })]
        }), (0, I.jsxs)(`p`, {
          children: [_(`最新刷新时间`), _(`：`), (0, I.jsx)(`time`, {
            children: R(e) ? a(R(e)) : `—`
          })]
        })]
      }, e.category))
    }) : (0, I.jsx)(f, {
      ariaLabel: _(`站点运行情况`),
      children: (0, I.jsxs)(`table`, {
        className: `workbench-monitoring-table`,
        children: [(0, I.jsx)(`thead`, {
          children: (0, I.jsxs)(`tr`, {
            children: [(0, I.jsx)(`th`, {
              children: _(`品类`)
            }), (0, I.jsx)(`th`, {
              className: `monitoring-number`,
              children: _(`参考 RPM`)
            }), (0, I.jsx)(`th`, {
              className: `monitoring-number`,
              children: _(`参考 TPM`)
            }), (0, I.jsx)(`th`, {
              children: _(`最新刷新时间`)
            })]
          })
        }), (0, I.jsx)(`tbody`, {
          children: l.map(e => (0, I.jsxs)(`tr`, {
            children: [(0, I.jsx)(`td`, {
              children: (0, I.jsx)(`strong`, {
                children: e.categoryName || e.category
              })
            }), (0, I.jsx)(`td`, {
              className: `monitoring-number`,
              children: (0, I.jsx)(`strong`, {
                children: L(e.rpm, !0)
              })
            }), (0, I.jsx)(`td`, {
              className: `monitoring-number`,
              children: (0, I.jsx)(`strong`, {
                children: L(e.tpm)
              })
            }), (0, I.jsx)(`td`, {
              children: (0, I.jsx)(`time`, {
                children: R(e) ? a(R(e)) : `—`
              })
            })]
          }, e.category))
        })]
      })
    }) : !c.error && (0, I.jsx)(`p`, {
      className: `workbench-monitoring-message`,
      children: _(`暂无已发布的参考数据`)
    })]
  })
}

function B() {
  let {
    has: r,
    refresh: i,
    notify: a
  } = t(), [o, l] = (0, F.useState)(!1), [d, f] = (0, F.useState)(`bar`), [m, v] = (0, F.useState)(`USD`), y = s(r(`turnover.read`) ? `/turnover` : null);
  if (!r(`turnover.read`)) return null;
  let x = g(),
    S = y.data?.items || [],
    T = c.filter(e => S.some(t => t.currency === e)),
    E = T.includes(m) ? m : T[0] || `USD`,
    D = V(S, E),
    O = n(S.filter(e => e.currency === E).map(e => e.amount)),
    k = [{
      name: `businessDate`,
      label: _(`日期`),
      type: `date`,
      max: x
    }, {
      name: `siteName`,
      label: _(`站点`),
      placeholder: _(`站点名称`)
    }, {
      name: `currency`,
      label: _(`币种`),
      type: `select`,
      options: c.map(e => ({
        value: e,
        label: e
      }))
    }, {
      name: `amount`,
      label: _(`营业额`),
      type: `number`,
      min: `0`,
      step: `0.01`
    }, {
      name: `note`,
      label: _(`备注`),
      required: !1,
      full: !0,
      placeholder: _(`可选`)
    }];
  return (0, I.jsxs)(`section`, {
    className: `panel workbench-turnover`,
    "aria-labelledby": `workbench-turnover-title`,
    children: [(0, I.jsxs)(`div`, {
      className: `turnover-chart-head`,
      children: [(0, I.jsxs)(`div`, {
        className: `turnover-total`,
        children: [(0, I.jsx)(`span`, {
          className: `turnover-mark`,
          "aria-hidden": `true`,
          children: (0, I.jsx)(u, {
            name: `wallet`,
            size: 14
          })
        }), (0, I.jsx)(`h2`, {
          id: `workbench-turnover-title`,
          children: _(`每日营业额`)
        }), (0, I.jsxs)(`span`, {
          children: [_(`总计：`), E === `USD` ? `$` : `${E} `, e(O || `0`, E)]
        })]
      }), (0, I.jsxs)(`div`, {
        className: `turnover-chart-tools`,
        children: [T.length > 1 && (0, I.jsx)(`div`, {
          className: `turnover-mode`,
          role: `group`,
          "aria-label": _(`币种`),
          children: T.map(e => (0, I.jsx)(`button`, {
            type: `button`,
            "aria-pressed": e === E,
            onClick: () => v(e),
            children: e
          }, e))
        }), (0, I.jsxs)(`div`, {
          className: `turnover-mode`,
          role: `group`,
          "aria-label": _(`图表类型`),
          children: [(0, I.jsx)(`button`, {
            type: `button`,
            "aria-pressed": d === `bar`,
            onClick: () => f(`bar`),
            children: _(`柱状图 `)
          }), (0, I.jsx)(`button`, {
            type: `button`,
            "aria-pressed": d === `area`,
            onClick: () => f(`area`),
            children: _(`面积图 `)
          })]
        }), r(`turnover.write`) && (0, I.jsx)(w, {
          icon: `plus`,
          variant: `primary`,
          onClick: () => l(!0),
          children: _(`记一笔 `)
        })]
      })]
    }), y.error ? (0, I.jsx)(p, {
      text: y.error,
      error: !0
    }) : y.data ? D.length === 0 ? (0, I.jsx)(p, {
      text: _(`还没有营业额记录。可以先手工记一笔。`)
    }) : (0, I.jsx)(H, {
      mode: d,
      currency: E,
      points: D
    }) : (0, I.jsx)(h, {}), o && (0, I.jsx)(b, {
      title: _(`登记营业额`),
      subtitle: _(`同一天、同一站点和币种只能记一次。`),
      fields: k,
      initial: {
        businessDate: x,
        currency: E,
        amount: ``,
        siteName: ``,
        note: ``
      },
      submitLabel: _(`保存`),
      onClose: () => l(!1),
      onSubmit: async e => {
        await C(`/turnover`, {
          businessDate: e.businessDate,
          siteName: e.siteName,
          currency: e.currency,
          amount: e.amount,
          note: e.note
        }), a(_(`已记下这笔营业额`)), i()
      }
    })]
  })
}

function V(e, t) {
  let n = new Map;
  return e.filter(e => e.currency === t).forEach(e => {
    n.set(e.businessDate, (n.get(e.businessDate) || 0) + Number(e.amount))
  }), [...n.entries()].sort(([e], [t]) => e.localeCompare(t)).map(([e, t]) => ({
    date: e,
    value: t
  }))
}

function H({
  mode: t,
  currency: n,
  points: r
}) {
  let i = U(Math.max(...r.map(e => e.value), 0)),
    a = [0, .25, .5, .75, 1].map(e => i * e),
    o = 650 / r.length,
    s = e => 192 - e / i * 176,
    c = r.map((e, t) => {
      let n = 58 + o * t + o / 2;
      return `${t===0?`M`:`L`} ${n} ${s(e.value)}`
    }).join(` `),
    l = 58 + o * (r.length - 1) + o / 2,
    u = 58 + o / 2;
  return (0, I.jsxs)(`svg`, {
    className: `turnover-chart`,
    viewBox: `0 0 720 220`,
    role: `img`,
    "aria-label": _(`每日营业额{0}`, [_(t === `bar` ? `柱状图` : `面积图`)]),
    children: [a.map(e => (0, I.jsxs)(`g`, {
      children: [(0, I.jsx)(`line`, {
        x1: 58,
        x2: 708,
        y1: s(e),
        y2: s(e)
      }), (0, I.jsx)(`text`, {
        x: 50,
        y: s(e) + 4,
        textAnchor: `end`,
        children: W(e)
      })]
    }, e)), t === `area` ? (0, I.jsxs)(I.Fragment, {
      children: [(0, I.jsx)(`path`, {
        className: `turnover-area`,
        d: `${c} L ${l} ${s(0)} L ${u} ${s(0)} Z`
      }), (0, I.jsx)(`path`, {
        className: `turnover-line`,
        d: c
      })]
    }) : r.map((t, r) => {
      let i = Math.min(28, o * .46),
        a = 58 + o * r + (o - i) / 2,
        c = Math.max(s(0) - s(t.value), t.value > 0 ? 2 : 0);
      return (0, I.jsx)(`rect`, {
        className: `turnover-bar`,
        x: a,
        y: s(t.value),
        width: i,
        height: c,
        rx: `3`,
        children: (0, I.jsxs)(`title`, {
          children: [t.date, ` `, n, ` `, e(t.value, n)]
        })
      }, t.date)
    }), r.map((e, t) => (0, I.jsx)(`text`, {
      x: 58 + o * t + o / 2,
      y: 212,
      textAnchor: `middle`,
      children: t % G(r.length) === 0 ? e.date.slice(5).replace(`-`, `/`) : ``
    }, e.date))]
  })
}

function U(e) {
  if (e <= 0) return 1;
  let t = e * 1.08,
    n = 10 ** Math.floor(Math.log10(t)),
    r = t / n;
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * n
}

function W(e) {
  return Math.round(e).toLocaleString(`en-US`)
}

function G(e) {
  return e <= 10 ? 1 : e <= 16 ? 2 : 3
}

function K({
  onHide: e
}) {
  let {
    user: n,
    has: r
  } = t(), [i, a] = (0, F.useState)(``), o = !!n.supplierId, s = o && n.role === `SUPPLIER_AGENT`, c = v(n), l = o && r(`resource.write`), d = [];
  !s && r(`quote.read`) && d.push({
    id: `quote`,
    title: _(o ? `提交报价` : r(`quote.review`) ? `审核报价` : `查看报价`),
    instructions: o ? [_(`进入「我的报价」，点击「新增报价行」并选择项目。`), _(`按项目填写倍率或单价、服务量级说明和适用期间。`), _(`提交该行报价，等待平台审核；通过且在有效期内后即可交付。`)] : r(`quote.review`) ? [_(`进入「报价管理」，筛选待审核报价并打开详情。`), _(`核对供应商、项目、倍率或单价、服务量级和适用期间。`), _(`有审核权限时通过或退回报价；退回时填写原因，供供应商修改。`)] : [_(`进入「报价管理」，按供应商或项目查询报价。`), _(`打开详情，核对倍率或单价、服务量级和适用期间。`), _(`查看报价状态与价格历史；审核操作由有权限的账号处理。`)],
    note: _(o ? `项目暂不可交付时，先检查报价是否已通过且生效。` : `报价审核通过后，供应商才能在有效期间内交付对应项目。`),
    links: [{
      label: o && r(`quote.write`) ? _(`去报价`) : _(`查看报价`),
      path: `quotes`
    }]
  }), r(`resource.read`) && d.push({
    id: `delivery`,
    title: _(o ? `交付资源` : `查看资源`),
    instructions: l ? [_(s ? `先由供应商主账号或本组管理员分配项目，再进入「我的交付」。` : `报价审核生效后，进入「我的交付」，点击「新增交付」。`), _(`选择项目并填写账号凭据；交付 CCMAX 账号时还需选择代理并完成授权。`), _(`检查信息并提交，在列表中查看交付结果和失败说明。`)] : [_(o ? `进入「我的交付」，按项目或账号查询已交付资源。` : `进入「资源管理」，按供应商、项目或账号查询交付资源。`), _(`点击资源行打开详情，核对交付结果、代理和账号状态。`), _(`需要更新状态或消耗时，使用有权限的同步操作，再查看实际结果。`)],
    note: _(o ? `保存草稿不算交付；CCMAX 正式提交前需有可用代理和有效报价。` : `资源消耗与付款进度分别查看，交付成功不代表已完成结算。`),
    links: [{
      label: o ? r(`resource.write`) ? _(`去交付`) : _(`查看交付`) : _(`查看资源`),
      path: o ? `deliveries` : `resources`
    }]
  }), c.length && d.push({
    id: `billing`,
    title: _(`查看账单`),
    instructions: s ? [_(`进入「收款管理 → 日账」，按日期查询每日消耗。`), n.teamAdminGroup?.id ? _(`小组管理员可查看本组成员的消耗，并按成员筛选。`) : _(`普通团队成员仅可查看本人交付资源产生的消耗。`), _(`点击账单查看明细，核对对应资源和日期。`)] : o ? [...c.some(e => e.id === `daily`) ? [_(`进入「收款管理 → 日账」，按日期、项目或资源核对消耗与应收。`)] : [], ...c.some(e => e.id === `statements`) ? [_(`平台发起结算后，在「金额确认」中核对结算明细并确认金额。`)] : [], ...c.some(e => e.id === `payments`) ? [_(`在「收款记录」查看付款进度，实际收到款项后再确认到账。`)] : []] : [...c.some(e => e.id === `daily`) ? [_(`进入「账务管理 → 日账」，按供应商和日期核对消耗与应付。`)] : [], ...c.some(e => e.id === `statements`) ? [_(`在「结算单」发起结算，等待供应商核对并确认金额。`)] : [], ...c.some(e => e.id === `payments`) ? [_(`金额确认后按权限申请付款，在「付款记录」查看后续进度。`)] : []],
    note: _(s ? `团队日账只展示消耗；应收、结算和收款由供应商主账号处理。` : `金额确认在付款前完成，到账确认在实际收到款项后完成。`),
    links: c.filter(e => e.id !== `inputs` && e.id !== `rates`).map(e => ({
      label: e.label,
      path: `settlements?tab=${e.id}`
    }))
  });
  let f = d.filter(e => e.links.length > 0);
  if (!f.length) return null;
  let p = f.find(e => e.id === i) || f[0];
  return (0, I.jsxs)(`div`, {
    className: `workbench-guide-container`,
    children: [(0, I.jsx)(`button`, {
      className: `text-button workbench-guide-hide`,
      type: `button`,
      "aria-label": _(`隐藏操作指引`),
      onClick: e,
      children: _(`隐藏`)
    }), (0, I.jsxs)(`details`, {
      className: `panel workbench-guide`,
      id: `workbench-operation-guide`,
      open: !0,
      children: [(0, I.jsxs)(`summary`, {
        children: [(0, I.jsx)(`h2`, {
          children: _(`操作指引`)
        }), (0, I.jsx)(`span`, {
          className: `workbench-guide-intro`,
          children: _(`按步骤完成报价、交付与对账`)
        }), (0, I.jsxs)(`span`, {
          className: `workbench-guide-toggle`,
          children: [(0, I.jsx)(`span`, {
            className: `workbench-guide-collapse`,
            children: _(`收起`)
          }), (0, I.jsx)(`span`, {
            className: `workbench-guide-expand`,
            children: _(`展开`)
          }), (0, I.jsx)(u, {
            name: `down`,
            size: 15
          })]
        })]
      }), (0, I.jsx)(`div`, {
        className: `workbench-guide-tabs`,
        children: (0, I.jsx)(O, {
          items: f.map(e => ({
            id: e.id,
            label: e.title
          })),
          value: p.id,
          onChange: a
        })
      }), (0, I.jsxs)(`section`, {
        className: `workbench-guide-content`,
        role: `tabpanel`,
        "aria-label": p.title,
        children: [(0, I.jsx)(`ol`, {
          className: `workbench-guide-instructions`,
          children: p.instructions.map((e, t) => (0, I.jsxs)(`li`, {
            children: [(0, I.jsx)(`span`, {
              className: `workbench-guide-number`,
              "aria-hidden": `true`,
              children: t + 1
            }), (0, I.jsx)(`span`, {
              children: e
            })]
          }, e))
        }), (0, I.jsxs)(`div`, {
          className: `workbench-guide-footer`,
          children: [(0, I.jsx)(`p`, {
            className: `workbench-guide-note`,
            children: p.note
          }), (0, I.jsx)(`div`, {
            className: `workbench-guide-links`,
            children: p.links.map(e => (0, I.jsxs)(`a`, {
              className: `text-button`,
              href: `#/${e.path}`,
              children: [e.label, (0, I.jsx)(u, {
                name: `arrow`,
                size: 14
              })]
            }, e.path))
          })]
        })]
      })]
    })]
  })
}

function q({
  items: e,
  onRead: n
}) {
  let {
    refresh: s,
    notify: c
  } = t(), [l, d] = (0, F.useState)(new Set), [f, p] = (0, F.useState)(!1), m = (0, F.useRef)(!1), h = e.filter(e => !e.readAt), g = h.filter(e => l.has(e.id));
  async function v() {
    if (!m.current && g.length) {
      m.current = !0, p(!0);
      try {
        let e = await Promise.allSettled(g.map(e => C(`/notifications/${e.id}/read`, {}))),
          t = g.filter((t, n) => e[n].status === `fulfilled`),
          r = g.filter((t, n) => e[n].status === `rejected`);
        n(t.map(e => e.id)), d(new Set(r.map(e => e.id))), s(), r.length ? c(_(`已标记 {0} 条，{1} 条未成功，请重试。`, [t.length, r.length]), !0) : c(_(`已将 {0} 条消息标记为已读`, [t.length]))
      } finally {
        m.current = !1, p(!1)
      }
    }
  }
  async function y(e) {
    if (!m.current) {
      m.current = !0, p(!0);
      try {
        await C(`/notifications/${e.id}/read`, {}), n([e.id]), s(), r(e.targetPath || `notifications`)
      } catch (e) {
        c(e.message, !0)
      } finally {
        m.current = !1, p(!1)
      }
    }
  }
  return (0, I.jsxs)(`section`, {
    className: `panel recent-panel`,
    "aria-labelledby": `workbench-recent-title`,
    children: [(0, I.jsxs)(`div`, {
      className: `panel-section-head`,
      children: [(0, I.jsx)(`h2`, {
        id: `workbench-recent-title`,
        children: _(`最近进展`)
      }), (0, I.jsxs)(`div`, {
        className: `workbench-recent-actions`,
        children: [h.length > 0 && (0, I.jsxs)(I.Fragment, {
          children: [(0, I.jsxs)(`label`, {
            className: `workbench-recent-select-all`,
            children: [(0, I.jsx)(`input`, {
              type: `checkbox`,
              checked: g.length === h.length,
              disabled: f,
              onChange: e => d(new Set(e.target.checked ? h.map(e => e.id) : []))
            }), _(`全选本页`)]
          }), (0, I.jsx)(w, {
            icon: `check`,
            disabled: f || !g.length,
            onClick: () => void v(),
            children: f ? _(`正在处理…`) : _(`标记已读（{0}）`, [g.length])
          })]
        }), (0, I.jsxs)(`button`, {
          className: `text-button`,
          type: `button`,
          onClick: () => r(`notifications`),
          children: [_(`全部消息`), (0, I.jsx)(u, {
            name: `chevron`,
            size: 14
          })]
        })]
      })]
    }), h.length ? h.map(e => (0, I.jsxs)(`div`, {
      className: `workbench-recent-item`,
      children: [(0, I.jsx)(`label`, {
        className: `workbench-recent-check`,
        children: (0, I.jsx)(`input`, {
          type: `checkbox`,
          "aria-label": _(`选择消息：{0}`, [o(e)]),
          checked: l.has(e.id),
          disabled: f,
          onChange: t => {
            let n = new Set(l);
            t.target.checked ? n.add(e.id) : n.delete(e.id), d(n)
          }
        })
      }), (0, I.jsxs)(`button`, {
        className: `recent-row unread`,
        type: `button`,
        disabled: f,
        onClick: () => void y(e),
        "aria-label": _(`{0}，查看详情`, [o(e)]),
        children: [(0, I.jsx)(`span`, {
          className: `recent-dot`
        }), (0, I.jsxs)(`span`, {
          className: `recent-content`,
          children: [(0, I.jsx)(`strong`, {
            children: o(e)
          }), (0, I.jsx)(`p`, {
            children: i(e)
          })]
        }), (0, I.jsxs)(`span`, {
          className: `recent-meta`,
          children: [(0, I.jsx)(`time`, {
            children: a(e.createdAt)
          }), (0, I.jsxs)(`span`, {
            children: [_(`查看详情`), (0, I.jsx)(u, {
              name: `chevron`,
              size: 14
            })]
          })]
        })]
      })]
    }, e.id)) : (0, I.jsx)(`p`, {
      className: `workbench-recent-empty`,
      children: _(`暂无未读进展`)
    })]
  })
}

function J() {
  let n = S(),
    {
      user: i,
      has: o,
      refresh: l,
      notify: d
    } = t(),
    f = s(`/workbench`),
    m = s(o(`exchange_rate.read`) ? `/exchange-rates/current` : null),
    [g, v] = (0, F.useState)(``),
    [y, b] = (0, F.useState)(!1),
    E = `hispread.workbench.guide-hidden:${i.id}`,
    [D, O] = (0, F.useState)(() => {
      try {
        return localStorage.getItem(E) === `true`
      } catch {
        return !1
      }
    });

  function k(e) {
    O(e);
    try {
      localStorage.setItem(E, String(e))
    } catch {}
    e || requestAnimationFrame(() => {
      let e = document.getElementById(`workbench-operation-guide`);
      e?.querySelector(`summary`)?.focus({
        preventScroll: !0
      }), e?.scrollIntoView({
        block: `start`,
        behavior: `smooth`
      })
    })
  }
  let A = D ? null : (0, I.jsx)(K, {
      onHide: () => k(!0)
    }),
    j = D ? (0, I.jsx)(`div`, {
      className: `workbench-guide-restore`,
      children: (0, I.jsxs)(`button`, {
        className: `text-button`,
        type: `button`,
        onClick: () => k(!1),
        children: [(0, I.jsx)(u, {
          name: `quote`,
          size: 15
        }), _(`显示操作指引`)]
      })
    }) : null;
  if (f.error) return (0, I.jsxs)(I.Fragment, {
    children: [A, (0, I.jsx)(p, {
      text: f.error,
      error: !0
    }), j]
  });
  if (!f.data) return (0, I.jsxs)(I.Fragment, {
    children: [A, (0, I.jsx)(h, {}), j]
  });
  let M = f.data,
    N = M.money.filter(e => c.some(t => t === e.currency)),
    P = N.find(e => e.currency === g) || N[0],
    L = !!i.supplierId;
  async function R() {
    if (M.announcement && !y) {
      b(!0);
      try {
        await C(`/notifications/${M.announcement.notificationId}/read`, {}), l(), d(_(`已标记为已读`))
      } catch (e) {
        d(e.message, !0)
      } finally {
        b(!1)
      }
    }
  }
  let V = [{
    id: `suppliers`,
    label: _(L ? `维护资料` : `供应商管理`),
    permission: `supplier.read`,
    icon: `users`
  }, ...L ? [] : [{
    id: `projects`,
    label: _(`维护项目`),
    permission: `project.write`,
    icon: `grid`
  }], {
    id: `quotes`,
    label: _(L ? `提交报价` : o(`quote.review`) ? `审核报价` : `查看报价`),
    permission: `quote.read`,
    icon: `quote`
  }, {
    id: `settlements`,
    label: _(L ? `查看收款` : `周期结算`),
    permission: `settlement.read`,
    icon: `wallet`
  }, ...L && o(`resource.read`) ? [{
    id: `deliveries`,
    label: _(`新增交付`),
    permission: `resource.write`,
    icon: `plus`
  }] : []].filter(e => o(e.permission));
  return (0, I.jsxs)(I.Fragment, {
    children: [(0, I.jsx)(`div`, {
      className: `workbench-toolbar`,
      children: (0, I.jsx)(`div`, {
        className: `workbench-date`,
        children: new Date().toLocaleDateString(x(), {
          year: `numeric`,
          month: `long`,
          day: `numeric`,
          weekday: `long`
        })
      })
    }), M.announcement && (0, I.jsxs)(`section`, {
      className: `panel workbench-announcement`,
      "aria-labelledby": `workbench-announcement-title`,
      children: [(0, I.jsxs)(`div`, {
        className: `panel-section-head`,
        children: [(0, I.jsxs)(`h2`, {
          id: `workbench-announcement-title`,
          children: [(0, I.jsx)(u, {
            name: `bell`,
            size: 18
          }), _(`公告 `)]
        }), o(`notification.publish`) && (0, I.jsxs)(`button`, {
          className: `text-button`,
          onClick: () => r(`notice-admin`),
          children: [_(`管理公告 `), (0, I.jsx)(u, {
            name: `arrow`,
            size: 15
          })]
        })]
      }), (0, I.jsxs)(`div`, {
        className: `workbench-announcement-content`,
        children: [(0, I.jsxs)(`div`, {
          className: `workbench-announcement-meta`,
          children: [(0, I.jsx)(`strong`, {
            children: M.announcement.title
          }), (0, I.jsx)(`time`, {
            dateTime: M.announcement.publishedAt,
            children: a(M.announcement.publishedAt)
          })]
        }), (0, I.jsx)(`p`, {
          children: M.announcement.body
        }), (0, I.jsx)(`div`, {
          className: `actions`,
          children: (0, I.jsx)(w, {
            icon: `check`,
            disabled: y,
            onClick: () => void R(),
            children: _(y ? `请稍候…` : `标记已读`)
          })
        })]
      })]
    }), n && (0, I.jsx)(Z, {}), A, (0, I.jsx)(z, {}), !n && (0, I.jsx)(Z, {}), (0, I.jsx)(B, {}), (0, I.jsxs)(`div`, {
      className: `workbench-summary`,
      children: [o(`settlement.read`) && (0, I.jsxs)(`section`, {
        className: `panel balance-panel`,
        children: [(0, I.jsxs)(`div`, {
          className: `panel-section-head`,
          children: [(0, I.jsx)(`h2`, {
            children: _(L ? `收款概览` : `应付概览`)
          }), (0, I.jsx)(T, {
            ariaLabel: _(`概览币种`),
            visual: `currency`,
            value: P?.currency || ``,
            onChange: v,
            disabled: N.length === 0,
            options: N.length ? N.map(e => ({
              value: e.currency,
              label: e.currency
            })) : [{
              value: ``,
              label: _(`暂无款项`)
            }]
          })]
        }), (0, I.jsx)(`span`, {
          className: `muted`,
          children: _(L ? `待确认收款` : `待付金额`)
        }), (0, I.jsxs)(`div`, {
          className: `balance-number`,
          children: [(0, I.jsx)(`small`, {
            children: P?.currency || `—`
          }), P ? e(Math.max(0, Number(P.total) - Number(L ? P.received : P.paid)), P.currency) : `—`]
        }), (0, I.jsxs)(`div`, {
          className: `balance-breakdown`,
          children: [(0, I.jsxs)(`div`, {
            children: [(0, I.jsx)(`span`, {
              children: _(L ? `已确认应收` : `已确认应付`)
            }), (0, I.jsx)(`strong`, {
              children: P ? e(P.total, P.currency) : `—`
            })]
          }), (0, I.jsxs)(`div`, {
            children: [(0, I.jsx)(`span`, {
              children: _(L ? `已确认收款` : `已登记付款`)
            }), (0, I.jsx)(`strong`, {
              children: P ? e(L ? P.received : P.paid, P.currency) : `—`
            })]
          })]
        }), o(`settlement.read`) && (0, I.jsxs)(`button`, {
          className: `text-button`,
          onClick: () => r(`settlements`),
          children: [_(L ? `查看收款管理` : `查看结算管理`), (0, I.jsx)(u, {
            name: `arrow`,
            size: 16
          })]
        })]
      }), (0, I.jsxs)(`section`, {
        className: `panel quick-panel`,
        children: [(0, I.jsx)(`div`, {
          className: `panel-section-head`,
          children: (0, I.jsx)(`h2`, {
            children: _(`常用操作`)
          })
        }), (0, I.jsx)(`div`, {
          className: `quick-grid`,
          children: V.map(e => (0, I.jsxs)(`button`, {
            onClick: () => r(e.id),
            children: [(0, I.jsx)(u, {
              name: e.icon,
              size: 21
            }), (0, I.jsx)(`span`, {
              children: e.label
            })]
          }, e.id))
        })]
      })]
    }), o(`exchange_rate.read`) && (0, I.jsx)(`section`, {
      className: `panel workbench-rates`,
      "aria-labelledby": `workbench-rates-title`,
      children: (0, I.jsxs)(`div`, {
        className: `panel-section-head`,
        children: [(0, I.jsx)(`h2`, {
          id: `workbench-rates-title`,
          children: _(`参考汇率`)
        }), m.loading && !m.data ? (0, I.jsx)(`span`, {
          className: `workbench-rates-message`,
          children: _(`正在读取…`)
        }) : m.error ? (0, I.jsxs)(`span`, {
          className: `workbench-rates-message`,
          children: [_(`读取失败：`), m.error]
        }) : m.data?.length ? (0, I.jsx)(`div`, {
          className: `workbench-rates-grid`,
          children: m.data.map(e => (0, I.jsxs)(`div`, {
            className: `workbench-rate`,
            children: [(0, I.jsxs)(`span`, {
              className: `workbench-rate-pair`,
              children: [e.baseCurrency, ` → `, e.quoteCurrency]
            }), (0, I.jsxs)(`span`, {
              className: `workbench-rate-value`,
              children: [(0, I.jsxs)(`small`, {
                children: [`1 `, e.baseCurrency, ` =`]
              }), (0, I.jsx)(`strong`, {
                children: e.rate
              }), (0, I.jsx)(`small`, {
                children: e.quoteCurrency
              })]
            }), (0, I.jsxs)(`span`, {
              className: `workbench-rate-meta`,
              children: [e.source, ` · `, a(e.effectiveFrom)]
            })]
          }, e.id))
        }) : (0, I.jsx)(`span`, {
          className: `workbench-rates-message`,
          children: _(`暂无当前生效的参考汇率`)
        }), (0, I.jsxs)(`button`, {
          className: `text-button`,
          onClick: () => r(`settlements?tab=rates`),
          children: [_(L ? `查看汇率详情` : `查看汇率版本`), (0, I.jsx)(u, {
            name: `arrow`,
            size: 15
          })]
        })]
      })
    }), (0, I.jsx)(q, {
      items: M.recent,
      onRead: e => f.mutate(t => ({
        ...t,
        recent: t.recent.filter(t => !e.includes(t.id))
      }))
    }), j]
  })
}
var Y = [{
  id: `quote`,
  label: _(`报价`),
  kinds: [`QUOTE_NEW`, `QUOTE_CHANGE`, `QUOTE_REJECTED`]
}, {
  id: `profile`,
  label: _(`资料`),
  kinds: [`SUPPLIER_REVIEW`, `SUPPLIER_REVISION`, `ACCOUNT_REVIEW`]
}, {
  id: `money`,
  label: _(`账务`),
  kinds: [`SETTLEMENT_CONFIRM`, `PAYMENT_CREATE`, `PAYMENT_REVIEW`, `PAYMENT_EXECUTE`, `PAYMENT_RECEIPT`]
}];

function X(e) {
  return e.kind + `-` + e.id
}

function Z() {
  let {
    has: n
  } = t(), i = s(n(`workbench.tasks.read`) ? `/workbench/tasks` : null), [o, c] = (0, F.useState)(`all`), [l, d] = (0, F.useState)(!1), [f, g] = (0, F.useState)(``);
  if (!n(`workbench.tasks.read`)) return null;
  let v = i.data?.items || [],
    b = new Set(Y.flatMap(e => e.kinds)),
    x = v.filter(e => !b.has(e.kind)).length,
    S = [{
      id: `all`,
      label: _(`全部`),
      count: v.length
    }, ...Y.map(e => ({
      id: e.id,
      label: e.label,
      count: v.filter(t => e.kinds.includes(t.kind)).length
    })).filter(e => e.count > 0), ...x > 0 ? [{
      id: `other`,
      label: _(`其他`),
      count: x
    }] : []],
    C = S.some(e => e.id === o) ? o : `all`,
    T = v.filter(e => {
      if (C === `all`) return !0;
      if (C === `other`) return !b.has(e.kind);
      let t = Y.find(e => e.id === C);
      return !t || t.kinds.includes(e.kind)
    }),
    E = l ? T : T.slice(0, 5);
  return (0, I.jsxs)(`section`, {
    className: `panel workbench-tasks`,
    "aria-labelledby": `workbench-tasks-title`,
    children: [(0, I.jsxs)(`div`, {
      className: `panel-section-head`,
      children: [(0, I.jsx)(`h2`, {
        id: `workbench-tasks-title`,
        children: _(`待办事项`)
      }), (0, I.jsxs)(`div`, {
        className: `workbench-task-controls`,
        children: [i.data && (0, I.jsx)(`div`, {
          className: `workbench-task-filters`,
          role: `tablist`,
          "aria-label": _(`待办分类`),
          children: S.map(e => (0, I.jsxs)(`button`, {
            type: `button`,
            role: `tab`,
            "aria-selected": C === e.id,
            className: C === e.id ? `active` : ``,
            onClick: () => {
              c(e.id), d(!1), g(``)
            },
            children: [e.label, (0, I.jsx)(`span`, {
              children: e.count
            })]
          }, e.id))
        }), T.length > 5 && (0, I.jsx)(`button`, {
          className: `text-button`,
          type: `button`,
          "aria-expanded": l,
          "aria-controls": `workbench-task-list`,
          onClick: () => d(e => !e),
          children: _(l ? `收起` : `展开全部`)
        })]
      })]
    }), i.data?.limited && (0, I.jsx)(m, {
      children: _(`当前只显示最近 200 条。处理完这些之后，刷新即可看到更早的待办。`)
    }), (0, I.jsx)(`div`, {
      id: `workbench-task-list`,
      children: i.error && !i.data ? (0, I.jsx)(p, {
        text: i.error,
        error: !0
      }) : i.data ? E.length ? E.map((t, n) => {
        let i = X(t),
          o = f === i;
        return (0, I.jsxs)(`article`, {
          className: `task-item`,
          children: [(0, I.jsxs)(`button`, {
            className: `task-row`,
            type: `button`,
            "aria-expanded": o,
            "aria-controls": `task-detail-${i}`,
            onClick: () => g(o ? `` : i),
            children: [(0, I.jsx)(`span`, {
              className: `task-icon tone-` + n % 3,
              children: (0, I.jsx)(u, {
                name: t.targetPath.startsWith(`quotes`) ? `quote` : t.targetPath.startsWith(`settlements`) ? `wallet` : `users`,
                size: 16
              })
            }), (0, I.jsxs)(`span`, {
              className: `task-main`,
              children: [(0, I.jsx)(`strong`, {
                children: t.title
              }), (0, I.jsx)(`small`, {
                children: A(t)
              }), t.summary && (0, I.jsx)(`small`, {
                className: `task-summary`,
                children: N(t)
              })]
            }), (0, I.jsxs)(`span`, {
              className: `task-side`,
              children: [t.supplierName && (0, I.jsx)(`span`, {
                children: t.supplierName
              }), t.amount != null && t.currency && (0, I.jsxs)(`b`, {
                children: [t.currency, ` `, e(t.amount, t.currency)]
              })]
            }), (0, I.jsx)(`time`, {
              children: a(t.createdAt)
            }), (0, I.jsx)(u, {
              name: `chevron`,
              size: 16
            })]
          }), o && (0, I.jsxs)(`div`, {
            className: `task-detail`,
            id: `task-detail-${i}`,
            children: [t.facts.length > 0 ? (0, I.jsx)(`dl`, {
              className: `todo-facts`,
              children: t.facts.map(e => (0, I.jsxs)(`div`, {
                children: [(0, I.jsx)(`dt`, {
                  children: y(e.label)
                }), (0, I.jsx)(`dd`, {
                  children: P(e)
                })]
              }, e.label))
            }) : t.detail && (0, I.jsx)(`p`, {
              children: N({
                ...t,
                summary: t.detail
              })
            }), (0, I.jsx)(`div`, {
              className: `task-detail-actions`,
              children: (0, I.jsx)(w, {
                variant: `primary`,
                onClick: () => r(t.targetPath),
                children: j(t)
              })
            })]
          })]
        }, i)
      }) : (0, I.jsx)(p, {
        text: _(`暂无待处理事项`)
      }) : (0, I.jsx)(h, {})
    })]
  })
}
export {
  J as
  default
};
