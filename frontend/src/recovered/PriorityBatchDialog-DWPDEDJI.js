// origin: assets/PriorityBatchDialog-DWPDEDJI.js
import {
  C as e,
  G as t,
  P as n,
  S as r,
  X as i,
  Z as a,
  c as o,
  g as s,
  h as c,
  mt as l,
  ot as ee,
  rt as u,
  s as d,
  u as f,
  vt as p
} from "./index-Dnr0i-H9.js";
import {
  r as m
} from "./labels-DaPzz6Ie.js"; /* empty css               */
import {
  n as te
} from "./CcmaxResourceOverview-BpVmtOxH.js";
var h = p(a(), 1),
  g = i(),
  _ = `/cc-intake/admin/priority/jobs`,
  v = [`search`, `state`, `projectId`, `credentialMode`, `createdFrom`, `createdTo`, `supplierSearch`, `creatorSearch`, `accountSearch`, `operationalStatus`, `failureReason`];

function y({
  selectedIds: i,
  filterQuery: a,
  onClose: p
}) {
  let {
    user: y,
    has: b,
    notify: x
  } = e(), S = !y.supplierId && y.role === `ADMIN` && b(`resource.read`) && b(`resource.dispatch`), [C, w] = (0, h.useState)(i.length ? `SELECTED` : `SUPPLIER`), [T, E] = (0, h.useState)(``), [D, O] = (0, h.useState)(``), [k, A] = (0, h.useState)(``), j = [...new Set(k.split(/[\s,，;；]+/).filter(Boolean))], [M, N] = (0, h.useState)([]), [P, ne] = (0, h.useState)(``), [re, ie] = (0, h.useState)(``);
  (0, h.useEffect)(() => {
    let e = window.setTimeout(() => ie(P.trim()), 300);
    return () => window.clearTimeout(e)
  }, [P]);
  let F = r(S && C === `SUPPLIER` ? `/deliveries/filter-options?supplierSearch=${encodeURIComponent(re)}` : null),
    [I, L] = (0, h.useState)(null),
    [R, z] = (0, h.useState)(``),
    [B, V] = (0, h.useState)(!1),
    [H, U] = (0, h.useState)(1),
    [W, G] = (0, h.useState)(!1),
    [K, q] = (0, h.useState)(``),
    J = (0, h.useRef)(!1),
    requestKey = (0, h.useRef)(crypto.randomUUID()),
    Y = I?.state === `RUNNING` || I?.state === `PREPARING` || I?.items.some(e => e.state === `UNKNOWN` || e.state === `VERIFYING`),
    X = r(S && R && !W ? `${_}/${encodeURIComponent(R)}` : null, Y ? 3e3 : 0),
    Z = r(S && B ? _ : null);
  (0, h.useEffect)(() => {
    X.data && L(X.data)
  }, [X.data]);
  async function Q(e) {
    if (!J.current && S) {
      if (q(``), e === `submit` && (!/^\d+$/.test(T) || Number(T) > 1e3)) {
        q(l(`优先级须为0至1000的整数`));
        return
      }
      if (e === `submit` && C === `SUPPLIER` && !M.length) {
        q(l(`请至少选择一个供应商`));
        return
      }
      if (e === `submit` && C === `LANE_IDS` && (!j.length || j.length > 5e3)) {
        q(l(`请输入1至5000个Lane ID`));
        return
      }
      if (e === `submit` && C === `SELECTED` && !i.length) {
        q(l(`请先勾选要调整的账号`));
        return
      }
      J.current = !0, G(!0);
      try {
        let t = new URLSearchParams(a),
          n = Object.fromEntries(v.map(e => [e, t.get(e) || ``])),
          r = await u(e === `submit` ? _ : `${_}/${encodeURIComponent(R)}/${e}`, e === `submit` ? {
            ...C === `SUPPLIER` ? {
              supplierIds: M.map(e => e.id)
            } : C === `LANE_IDS` ? {
              laneIds: j
            } : C === `SELECTED` ? {
              resourceIds: i
            } : {
              filters: n
            },
            requestKey: requestKey.current,
            priority: Number(T),
            operationalStatus: D
          } : {});
        if (L(r), z(r.id), U(1), V(!1), e === `submit`) {
          let e = await u(`${_}/${encodeURIComponent(r.id)}/start`, {});
          L(e)
        }(e === `start` || e === `submit`) && x(l(`优先级调整任务已提交`)), e === `retry` && x(l(`已重新提交失败项，沿用原分配值`))
      } catch (e) {
        q(e.message)
      } finally {
        J.current = !1, G(!1)
      }
    }
  }
  let $ = e => l(({ PREPARING: `整理账号范围中`, PREVIEW: `待执行`, RUNNING: `处理中`, FAILED: `执行失败`, UNKNOWN: `待核对`, PARTIAL_FAILED: `部分失败`, COMPLETED: `已完成` })[e] || e);
  return (0, g.jsx)(t, {
    title: l(`批量调整优先级`),
    wide: !0,
    onClose: p,
    className: `cc-priority-dialog`,
    children: S ? (0, g.jsxs)(g.Fragment, {
      children: [(0, g.jsxs)(`div`, {
        className: `cc-intake-priority-toolbar`,
        children: [(0, g.jsx)(d, {
          type: `button`,
          onClick: () => V(!B),
          children: l(B ? `返回调整` : `查看调整记录`)
        }), I && !B && (0, g.jsx)(d, {
          type: `button`,
          disabled: W,
          onClick: () => {
            L(null), z(``), q(``), requestKey.current = crypto.randomUUID()
          },
          children: l(`新建调整`)
        })]
      }), B ? (0, g.jsx)(g.Fragment, {
        children: Z.loading ? (0, g.jsx)(c, {}) : (0, g.jsx)(o, {
          data: Z.data || [],
          error: Z.error,
          onRetry: Z.reload,
          onRow: e => {
            L(e), z(e.id), V(!1), U(1)
          },
          columns: [{
            label: l(`创建时间`),
            render: e => n(e.createdAt)
          }, {
            label: l(`账号数量`),
            render: e => e.total
          }, {
            label: l(`任务状态`),
            render: e => $(e.state)
          }, {
            label: l(`操作`),
            render: e => (0, g.jsx)(d, {
              type: `button`,
              onClick: t => {
                t.stopPropagation(), L(e), z(e.id), V(!1), U(1)
              },
              children: l(`查看详情`)
            })
          }]
        })
      }) : I ? (0, g.jsxs)(g.Fragment, {
        children: [(0, g.jsxs)(`div`, {
          className: `cc-priority-summary`,
          children: [(0, g.jsxs)(`strong`, {
            children: [l(`共{0}个账号`, [I.total]), ` · `, $(I.state)]
          }), Object.entries(I.counts).map(([e, t]) => t ? (0, g.jsxs)(`span`, {
            children: [m[e] || e, ` `, t]
          }, e) : null)]
        }), I.state === `PREPARING` && (0, g.jsx)(s, {
          tone: `blue`,
          children: l(`正在整理旧任务的本地账号范围，不会查询原优先级。`)
        }), I.state === `PREVIEW` && (0, g.jsx)(s, {
          tone: `amber`,
          children: l(`此任务尚未提交执行，账号范围与调整值已固定，可确认执行。`)
        }), X.error && (0, g.jsxs)(s, {
          tone: `red`,
          children: [X.error, (0, g.jsx)(d, {
            type: `button`,
            onClick: X.reload,
            children: l(`重新加载`)
          })]
        }), (0, g.jsx)(o, {
          data: I.items.slice((H - 1) * 50, H * 50),
          columns: [{
            label: l(`资源名称`),
            render: e => e.resourceName || `—`
          }, {
            label: `Lane ID`,
            render: e => (0, g.jsx)(`span`, {
              className: `cc-priority-lane`,
              children: e.laneId || `—`
            })
          }, {
            label: l(`拟调整值`),
            render: e => e.priority
          }, {
            label: l(`状态`),
            render: e => e.state === `SUCCESS` ? l(`已更新`) : m[e.state] || e.state
          }, {
            label: l(`说明`),
            render: e => e.errorMessage ? (0, g.jsx)(`span`, {
              className: `cc-priority-message`,
              children: ee(e.errorMessage)
            }) : `—`
          }]
        }), I.items.length > 50 && (0, g.jsxs)(`div`, {
          className: `cc-priority-pages`,
          children: [(0, g.jsx)(d, {
            type: `button`,
            disabled: H <= 1,
            onClick: () => U(H - 1),
            children: l(`上一页`)
          }), (0, g.jsx)(`span`, {
            children: l(`第 {0} / 共 {1} 页`, [H, Math.ceil(I.items.length / 50)])
          }), (0, g.jsx)(d, {
            type: `button`,
            disabled: H * 50 >= I.items.length,
            onClick: () => U(H + 1),
            children: l(`下一页`)
          })]
        }), K && (0, g.jsx)(s, {
          tone: `red`,
          children: K
        }), (0, g.jsxs)(`footer`, {
          className: `dialog-footer`,
          children: [(0, g.jsx)(d, {
            type: `button`,
            disabled: W,
            onClick: X.reload,
            children: l(`刷新进度`)
          }), I.state === `PREVIEW` && (0, g.jsx)(d, {
            type: `button`,
            variant: `primary`,
            disabled: W || !I.total || I.counts.SKIPPED === I.total,
            onClick: () => void Q(`start`),
            children: l(W ? `提交中…` : `确认执行调整`)
          }), I.protocol === `NEWAPI` && I.state === `UNKNOWN` && (0, g.jsx)(d, {
            disabled: W, onClick: () => void Q(`reconcile`), children: l(`核对原操作（不重新提交）`)
          }), I.state !== `PREVIEW` && !!I.counts.FAILED && (0, g.jsx)(d, {
            type: `button`,
            variant: `primary`,
            disabled: W || I.state === `RUNNING`,
            onClick: () => void Q(`retry`),
            children: l(W ? `提交中…` : `仅重试失败项`)
          })]
        })]
      }) : (0, g.jsxs)(`form`, {
        onSubmit: e => {
          e.preventDefault(), Q(`submit`)
        },
        children: [(0, g.jsxs)(`div`, {
          className: `cc-intake-fields`,
          children: [(0, g.jsxs)(`label`, {
            className: `field`,
            children: [(0, g.jsx)(`span`, {
              children: l(`调整范围`)
            }), (0, g.jsx)(f, {
              ariaLabel: l(`调整范围`),
              value: C,
              onChange: e => {
                w(e), q(``)
              },
              disabled: W,
              options: [{
                value: `SUPPLIER`,
                label: l(`按供应商`)
              }, {
                value: `LANE_IDS`,
                label: l(`按 Lane ID`)
              }, {
                value: `SELECTED`,
                label: l(`已勾选账号（{0}个）`, [i.length]),
                disabled: !i.length
              }, {
                value: `FILTERED`,
                label: l(`当前筛选下全部CCMAX账号`)
              }]
            })]
          }), (0, g.jsxs)(`label`, {
            className: `field`,
            children: [(0, g.jsx)(`span`, {
              children: l(`资源状态`)
            }), (0, g.jsx)(f, {
              ariaLabel: l(`资源状态`),
              value: D,
              onChange: O,
              disabled: W,
              options: [{
                value: ``,
                label: l(`全部可调整状态`)
              }, ...Object.entries(te).filter(([e]) => ![`ALL`, `GONE`, `DRAINING`, `RATE_LIMITED`].includes(e)).map(([e, t]) => ({
                value: e,
                label: t
              })), {
                value: `GONE`,
                label: l(`已移除（不参与调整）`),
                disabled: !0
              }, {
                value: `DRAINING`,
                label: l(`退出中（不参与调整）`),
                disabled: !0
              }]
            })]
          }), (0, g.jsxs)(`label`, {
            className: `field`,
            children: [(0, g.jsx)(`span`, {
              children: l(`设置优先级`)
            }), (0, g.jsx)(`input`, {
              required: !0,
              type: `number`,
              step: `1`,
              min: `0`,
              max: `1000`,
              value: T,
              placeholder: l(`请输入0至1000的整数`),
              onChange: e => E(e.target.value),
              disabled: W
            })]
          })]
        }), C === `SUPPLIER` && (0, g.jsxs)(`div`, {
          className: `field cc-priority-targets`,
          children: [(0, g.jsx)(`span`, {
            children: l(`选择供应商`)
          }), (0, g.jsx)(f, {
            ariaLabel: l(`选择供应商`),
            visual: `supplier`,
            value: ``,
            disabled: W || M.length >= 100,
            searchPlaceholder: l(`搜索供应商名称或编码`),
            onSearchChange: ne,
            onChange: e => {
              let t = F.data?.suppliers.find(t => t.id === e);
              q(``), t && N(e => e.some(e => e.id === t.id) ? e : [...e, t])
            },
            options: [{
              value: ``,
              label: F.loading ? l(`加载中…`) : l(`搜索并选择供应商（可多选）`),
              disabled: !0
            }, ...(F.data?.suppliers ?? []).map(e => ({
              value: e.id,
              label: e.name,
              detail: e.code,
              disabled: M.some(t => t.id === e.id)
            }))]
          }), F.error && (0, g.jsxs)(s, {
            tone: `red`,
            children: [F.error, (0, g.jsx)(d, {
              type: `button`,
              onClick: F.reload,
              children: l(`重新加载`)
            })]
          }), M.length > 0 && (0, g.jsx)(`div`, {
            className: `cc-priority-suppliers`,
            children: M.map(e => (0, g.jsxs)(d, {
              type: `button`,
              disabled: W,
              "aria-label": l(`移除供应商{0}`, [e.name]),
              onClick: () => N(t => t.filter(t => t.id !== e.id)),
              children: [e.name, ` · `, e.code, ` · `, l(`移除`)]
            }, e.id))
          }), (0, g.jsx)(`small`, {
            children: l(`调整所选供应商的全部已有CCMAX账号，不受列表筛选和分页限制。`)
          })]
        }), C === `LANE_IDS` && (0, g.jsxs)(`label`, {
          className: `field cc-priority-targets`,
          children: [(0, g.jsx)(`span`, {
            children: `Lane ID`
          }), (0, g.jsx)(`textarea`, {
            "aria-label": `Lane ID`,
            required: !0,
            rows: 5,
            value: k,
            placeholder: l(`粘贴 Lane ID，支持换行、逗号或空格分隔`),
            onChange: e => A(e.target.value),
            disabled: W,
            "aria-describedby": `cc-priority-lane-hint`
          }), (0, g.jsx)(`small`, {
            id: `cc-priority-lane-hint`,
            children: l(`已输入{0}个Lane ID，重复项自动合并；最多5000个。`, [j.length])
          })]
        }), C === `FILTERED` && (0, g.jsx)(`p`, {
          className: `muted`,
          children: l(`范围覆盖当前筛选的全部分页，执行前会固定账号清单及具体值。`)
        }), (0, g.jsx)(`p`, {
          className: `muted`,
          children: l(`按本地已保存状态筛选，已移除和退出中的账号自动排除。`)
        }), (0, g.jsx)(`p`, {
          className: `muted`,
          children: l(`直接提交优先级更新，不会预先查询原值。`)
        }), (0, g.jsx)(`p`, {
          className: `muted`,
          children: l(`调整会清除所选账号的临时优先级提升。`)
        }), (0, g.jsx)(`p`, {
          className: `muted`,
          children: l(`仅调整已有账号的使用顺序，不计入当日上号数量。`)
        }), K && (0, g.jsx)(s, {
          tone: `red`,
          children: K
        }), (0, g.jsx)(`footer`, {
          className: `dialog-footer`,
          children: (0, g.jsx)(d, {
            type: `submit`,
            variant: `primary`,
            disabled: W,
            children: l(W ? `提交中…` : `提交调整`)
          })
        })]
      })]
    }) : (0, g.jsx)(s, {
      tone: `red`,
      children: l(`当前账号无权访问此页面`)
    })
  })
}
export {
  y as
  default
};
