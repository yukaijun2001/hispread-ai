// origin: assets/ScheduledTaskRuns-DXdXtjvS.js
import {
  B as e,
  C as t,
  I as n,
  P as r,
  S as i,
  X as a,
  Z as o,
  _ as s,
  c,
  g as l,
  h as u,
  j as d,
  m as f,
  mt as p,
  pt as m,
  s as h,
  u as g,
  vt as _
} from "./index-Dnr0i-H9.js";
import {
  t as v
} from "./DateRangePicker-DtOG4QUZ.js";
import {
  r as y
} from "./systemLabels-DqpNuQ-_.js";
var b = _(o(), 1),
  x = a(),
  S = {
    SENT: p(`已发送`),
    NO_TODOS: p(`无待办，未发送`),
    WECOM_TIMEOUT: p(`发送结果未确认`),
    WECOM_NETWORK_ERROR: p(`网络异常，发送结果未确认`),
    WECOM_HTTP_ERROR: p(`企业微信请求失败`),
    WECOM_REJECTED: p(`企业微信拒绝消息`),
    WECOM_INVALID_RESPONSE: p(`企业微信响应无效`),
    WECOM_NOT_CONFIGURED: p(`未配置企业微信机器人`),
    LEASE_LOST: p(`执行租约已失效`)
  },
  C = {
    RUNNING: p(`运行中`),
    SUCCESS: p(`成功`),
    FAILED: p(`失败`),
    TIMED_OUT: p(`执行超时`)
  };

function w(e) {
  if (e.state !== `FAILED`) return null;
  let t = /^PARTIAL_LANE_CONFLICT:L([1-9]\d*):R([1-9]\d*)$/.exec(e.resultCode || ``);
  if (!t || t[0] !== e.resultCode) return null;
  let n = Number(t[1]),
    r = Number(t[2]);
  return !Number.isSafeInteger(n) || !Number.isSafeInteger(r) || n > 2147483647 || r > 2147483647 ? null : p(`已跳过 {0} 组归属冲突 lane / {1} 条资源；其余可采集资源已处理`, [n.toLocaleString(m()), r.toLocaleString(m())])
}

function T() {
  let {
    refresh: a
  } = t(), o = i(`/system/scheduled-tasks`), m = e(`task`), _ = o.data?.find(e => e.key === m) || o.data?.[0] || null, [T, E] = (0, b.useState)(1), [D, O] = (0, b.useState)(10), [k, A] = (0, b.useState)(``), [j, M] = (0, b.useState)(``), [N, P] = (0, b.useState)(d), [F, I] = (0, b.useState)(d), L = !!(N && F && N > F), R = new URLSearchParams({
    page: String(T),
    size: String(D)
  });
  k && R.set(`triggerKind`, k), j && R.set(`state`, j), N && R.set(`from`, N), F && R.set(`to`, F);
  let z = i(_ && !L ? `/system/scheduled-tasks/${encodeURIComponent(_.key)}/runs?${R.toString()}` : null, 1e4);
  return (0, b.useEffect)(() => {
    if (z.loading || !z.data || z.data.page !== T || z.data.size !== D) return;
    let e = Math.max(1, Math.ceil(z.data.total / D));
    T > e && E(e)
  }, [z.data, z.loading, T, D]), (0, x.jsxs)(`div`, {
    className: `scheduled-tasks-page`,
    children: [(0, x.jsxs)(`div`, {
      className: `scheduled-tasks-toolbar`,
      children: [(0, x.jsx)(`p`, {
        children: p(`查看各服务任务的自动与手动执行结果，按开始时间倒序。`)
      }), (0, x.jsx)(f, {
        title: p(`执行记录`),
        children: (0, x.jsx)(h, {
          icon: `refresh`,
          onClick: a,
          children: p(`刷新 `)
        })
      })]
    }), o.error ? (0, x.jsxs)(l, {
      tone: `red`,
      children: [p(`任务加载失败：`), o.error]
    }) : o.loading && !o.data ? (0, x.jsx)(`div`, {
      className: `scheduled-tasks-loading`,
      children: (0, x.jsx)(u, {})
    }) : o.data?.length ? (0, x.jsxs)(`section`, {
      className: `panel scheduled-task-run-panel`,
      "aria-label": p(`执行记录`),
      children: [(0, x.jsxs)(`div`, {
        className: `scheduled-task-run-head`,
        children: [(0, x.jsxs)(`div`, {
          children: [(0, x.jsx)(`h2`, {
            children: p(`记录明细`)
          }), (0, x.jsx)(`p`, {
            children: p(`按执行开始时间筛选，日期使用北京时间`)
          })]
        }), (0, x.jsx)(`span`, {
          children: L ? p(`请调整日期`) : z.loading ? p(`加载中`) : p(`共 {0} 条`, [z.data?.total ?? 0])
        })]
      }), (0, x.jsxs)(`div`, {
        className: `scheduled-task-run-filter`,
        role: `search`,
        "aria-label": p(`筛选执行记录`),
        children: [(0, x.jsxs)(`div`, {
          className: `scheduled-task-run-field task`,
          children: [(0, x.jsx)(`span`, {
            children: p(`服务任务`)
          }), (0, x.jsx)(g, {
            ariaLabel: p(`选择服务任务`),
            value: _?.key || ``,
            onChange: e => n(`scheduled-task-runs?task=${encodeURIComponent(e)}`),
            options: o.data.map(e => ({
              value: e.key,
              label: y(e)
            }))
          })]
        }), (0, x.jsxs)(`div`, {
          className: `scheduled-task-run-field`,
          children: [(0, x.jsx)(`span`, {
            children: p(`触发方式`)
          }), (0, x.jsx)(g, {
            ariaLabel: p(`触发方式`),
            value: k,
            onChange: e => {
              A(e), E(1)
            },
            options: [{
              value: ``,
              label: p(`全部方式`)
            }, {
              value: `SCHEDULE`,
              label: p(`自动`)
            }, {
              value: `MANUAL`,
              label: p(`手动`)
            }]
          })]
        }), (0, x.jsxs)(`div`, {
          className: `scheduled-task-run-field`,
          children: [(0, x.jsx)(`span`, {
            children: p(`执行结果`)
          }), (0, x.jsx)(g, {
            ariaLabel: p(`执行结果`),
            value: j,
            onChange: e => {
              M(e), E(1)
            },
            options: [{
              value: ``,
              label: p(`全部结果`)
            }, {
              value: `RUNNING`,
              label: p(`运行中`)
            }, {
              value: `SUCCESS`,
              label: p(`成功`)
            }, {
              value: `FAILED`,
              label: p(`失败或部分完成`)
            }, {
              value: `TIMED_OUT`,
              label: p(`执行超时`)
            }]
          })]
        }), (0, x.jsxs)(`div`, {
          className: `scheduled-task-run-field date-range`,
          children: [(0, x.jsx)(`span`, {
            children: p(`执行日期`)
          }), (0, x.jsx)(v, {
            label: p(`执行日期`),
            from: N,
            to: F,
            onChange: (e, t) => {
              P(e), I(t), E(1)
            }
          })]
        }), (N || F) && (0, x.jsx)(h, {
          onClick: () => {
            P(``), I(``), E(1)
          },
          children: p(`不限日期`)
        }), (0, x.jsx)(h, {
          className: `scheduled-task-run-reset`,
          onClick: () => {
            A(``), M(``), P(d()), I(d()), E(1)
          },
          children: p(`重置筛选 `)
        })]
      }), L && (0, x.jsx)(l, {
        tone: `red`,
        children: p(`开始日期不能晚于结束日期`)
      }), z.error && (0, x.jsxs)(l, {
        tone: `red`,
        children: [p(`执行记录加载失败：`), z.error]
      }), (0, x.jsx)(c, {
        data: L || z.error ? [] : z.data?.items || [],
        loading: z.loading && !L,
        columns: [{
          label: p(`触发方式`),
          render: e => e.triggerKind === `SCHEDULE` ? p(`自动`) : p(`手动`)
        }, {
          label: p(`开始时间`),
          render: e => r(e.startedAt)
        }, {
          label: p(`结束时间`),
          render: e => r(e.finishedAt || void 0)
        }, {
          label: p(`结果`),
          render: e => {
            let t = /^QUOTE_RENEWAL:R(\d+):C(\d+)$/.exec(e.resultCode || ``);
            if (t) return (0, x.jsxs)(`span`, {
              children: [p(`已续期 `), t[1], p(` 条 `), t[2] === `0` ? `` : p(`；{0} 条存在待审或报价冲突，请核对审批`, [t[2]])]
            });
            let n = w(e);
            return n ? (0, x.jsxs)(`span`, {
              className: `scheduled-task-partial-result`,
              children: [(0, x.jsx)(`strong`, {
                children: p(`部分完成`)
              }), (0, x.jsx)(`span`, {
                children: n
              })]
            }) : (_?.type === `WORKBENCH_WECOM_REMINDER` ? S[e.resultCode || ``] : void 0) || (e.resultCode === `PRIORITY_SUPPORT_CONFIG_CHANGED` ? p(`配置已变化，本轮跳过并等待下一周期`) : void 0) || (e.resultCode === `PRIORITY_SUPPORT_EVALUATED` ? p(`规则检查完成，账号结果见扶持记录`) : void 0) || (e.resultCode === `COLLECTED_FOLLOWUPS_QUEUED` ? p(`采集完成`) : void 0) || C[e.state] || e.state
          }
        }, {
          label: p(`阶段与进度`),
          render: e => {
            if (!e.phase) return `—`;
            let t = {
              PENDING: p(`资源概况待刷新`),
              RUNNING: p(`资源概况刷新中`),
              SUCCESS: p(`资源概况已刷新`),
              FAILED: p(`资源概况刷新失败`),
              SUPERSEDED: p(`资源概况刷新已合并至后续任务`)
            };
            return (0, x.jsxs)(`div`, {
              className: `scheduled-task-partial-result`,
              children: [(0, x.jsx)(`strong`, {
                children: e.phase === `COLLECT` ? p(`采集 {0}：{1}/{2} 批`, [e.phaseDate || ``, e.completedBatches ?? 0, e.totalBatches ?? 0]) : e.phase === `COLLECTED` ? p(`日账采集完成`) : p(`资源概况刷新中`)
              }), (e.postingProcessed ?? 0) > 0 && (0, x.jsxs)(`span`, {
                children: [p(`入账已处理 `), e.postingProcessed, p(` 条，成功 `), e.postingPosted ?? 0, ` `, p(`条，待核对 `), e.postingBlocked ?? 0, p(` 条 `)]
              }), (e.followupPending ?? 0) > 0 && (0, x.jsxs)(`span`, {
                children: [p(`后续处理进行中（`), e.followupPending, p(` 项）`)]
              }), (e.followupDeferred ?? 0) > 0 && (0, x.jsx)(`span`, {
                children: p(`当日账单等待次日入账`)
              }), (e.followupFailed ?? 0) > 0 && (0, x.jsxs)(`span`, {
                children: [p(`后续处理失败 `), e.followupFailed, p(` 项，请核对`)]
              }), e.overviewState && (0, x.jsx)(`span`, {
                children: t[e.overviewState] || e.overviewState
              })]
            })
          }
        }, {
          label: p(`代码`),
          render: e => e.resultCode === `COLLECTION_BUDGET_EXHAUSTED` ? p(`达到本轮采集时限，已保存数据，下轮补采`) : e.resultCode || `—`
        }]
      }), (0, x.jsx)(s, {
        data: L || z.error ? null : z.data,
        page: T,
        onPage: E,
        size: D,
        onSizeChange: e => {
          O(e), E(1)
        }
      })]
    }) : (0, x.jsxs)(`div`, {
      className: `panel scheduled-tasks-empty`,
      children: [(0, x.jsx)(`strong`, {
        children: p(`还没有定时任务`)
      }), (0, x.jsx)(`p`, {
        children: p(`创建任务后才能查看执行记录。`)
      })]
    })]
  })
}
export {
  T as
  default
};