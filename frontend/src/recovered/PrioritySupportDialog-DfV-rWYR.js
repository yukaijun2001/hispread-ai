// origin: assets/PrioritySupportDialog-DfV-rWYR.js
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
  it as l,
  mt as u,
  rt as d,
  s as f,
  u as p,
  vt as m
} from "./index-Dnr0i-H9.js";
import {
  a as ee
} from "./labels-DaPzz6Ie.js"; /* empty css               */
var h = m(a(), 1),
  g = i(),
  _ = `/system/scheduled-tasks`;

function v({
  onClose: i,
  onSaved: a,
  taskKey: m
}) {
  let {
    notify: v
  } = e(), y = m ? `${_}/${encodeURIComponent(m)}/rotation-settings` : ``, b = r(m ? y : null), x = (0, h.useRef)(!m), te = b.data?.rounds || [], [S, C] = (0, h.useState)(``), [w, T] = (0, h.useState)(`SELECTED`), [E, D] = (0, h.useState)([]), O = (0, h.useRef)(!1), k = (0, h.useRef)({
    version: 0,
    taskVersion: 0
  }), [A, j] = (0, h.useState)(``), [M, N] = (0, h.useState)(`10`), [P, F] = (0, h.useState)(``), [I, L] = (0, h.useState)(`20`), [R, z] = (0, h.useState)(`1`), [B, V] = (0, h.useState)([]), [H, U] = (0, h.useState)(``), [W, G] = (0, h.useState)(``), [K, ne] = (0, h.useState)(!1), [q, J] = (0, h.useState)(!1), [Y, X] = (0, h.useState)(``);
  (0, h.useEffect)(() => {
    b.data && !x.current && (x.current = !0, k.current = {
      version: b.data.version,
      taskVersion: b.data.taskVersion
    }, j(b.data.settings.mode), C(b.data.name), T(b.data.settings.scope), D(b.data.settings.tiers), L(String(b.data.settings.maxAccounts)), N(String(b.data.settings.basisPoints / 100)), F(b.data.settings.priority === null ? `` : String(b.data.settings.priority)), z(String(b.data.intervalMinutes)), V(b.data.suppliers))
  }, [b.data]), (0, h.useEffect)(() => {
    let e = window.setTimeout(() => G(H.trim()), 300);
    return () => window.clearTimeout(e)
  }, [H]);
  let Z = r(!K && w === `SELECTED` ? `/deliveries/filter-options?supplierSearch=${encodeURIComponent(W)}` : null),
    Q = Z.data?.suppliers || [],
    $ = Z.loading || H.trim() !== W;
  async function re(e) {
    if (e.preventDefault(), !(O.current || m && !b.data)) {
      if (X(``), ![`SUPPLIER_IDLE`, `ROTATION`].includes(A)) {
        X(u(`请选择任务类型`));
        return
      }
      if (w === `SELECTED` && !B.length) {
        X(u(`请至少选择一个供应商`));
        return
      }
      if (w === `TIERS` && !E.length) {
        X(u(`请至少选择一个供应商优先级档位`));
        return
      }
      if (!/^\d+(?:\.\d{1,2})?$/.test(M) || Number(M) <= 0 || Number(M) > 100) {
        X(u(`扶持比例须在0.01%至100%之间，最多两位小数`));
        return
      }
      if (!/^\d+$/.test(P) || Number(P) > 1e3) {
        X(u(`优先级须为0至1000的整数`));
        return
      }
      if (!/^\d+$/.test(I) || Number(I) < 1 || Number(I) > 5e4) {
        X(u(`每家最多扶持账号数须为1至50000的整数`));
        return
      }
      if (!/^\d+$/.test(R) || Number(R) < 1 || Number(R) > 1440) {
        X(u(`运行周期须为 1 至 1440 分钟`));
        return
      }
      O.current = !0, J(!0);
      try {
        let e = {
          name: S.trim(),
          settings: {
            mode: A,
            scope: w,
            tiers: w === `TIERS` ? E : [],
            supplierIds: w === `SELECTED` ? B.map(e => e.id) : [],
            basisPoints: Math.round(Number(M) * 100),
            maxAccounts: Number(I),
            priority: Number(P)
          },
          version: k.current.version,
          intervalMinutes: Number(R),
          taskVersion: k.current.taskVersion
        };
        m ? await l(y, e) : await d(_ + `/priority-support`, e), v(u(`扶持配置已保存，下一轮执行生效`)), a(), i()
      } catch (e) {
        X(e.message)
      } finally {
        O.current = !1, J(!1)
      }
    }
  }
  async function ie() {
    if (!O.current) {
      O.current = !0, J(!0), X(``);
      try {
        await d(y + `/retry-restore`, {}), v(u(`已重新提交失败的恢复项`)), b.reload()
      } catch (e) {
        X(e.message)
      } finally {
        O.current = !1, J(!1)
      }
    }
  }
  let ae = {
    BOOSTING: u(`正在扶持`),
    ACTIVE: u(`扶持中`),
    RESTORING: u(`正在恢复`),
    RESTORE_FAILED: u(`恢复失败，已暂停该供应商扶持`),
    CLOSED: u(`已结束`),
    REPLACED: u(`已进入下一轮`)
  };
  return (0, g.jsxs)(t, {
    title: u(m ? `编辑任务` : `创建任务`),
    wide: !0,
    className: `priority-support-dialog`,
    onClose: i,
    children: [(0, g.jsxs)(`div`, {
      className: `priority-support-toolbar`,
      children: [m && (0, g.jsx)(f, {
        disabled: q,
        onClick: () => {
          ne(!K), X(``)
        },
        children: u(K ? `返回配置` : `扶持记录`)
      }), K && (0, g.jsx)(f, {
        disabled: q,
        onClick: b.reload,
        children: u(`刷新`)
      })]
    }), Y && (0, g.jsx)(s, {
      tone: `red`,
      children: Y
    }), b.error && (0, g.jsxs)(s, {
      tone: `red`,
      children: [b.error, (0, g.jsx)(f, {
        onClick: b.reload,
        children: u(`重新加载`)
      })]
    }), !x.current && b.loading ? (0, g.jsx)(c, {}) : m && !b.data ? null : K ? (0, g.jsxs)(g.Fragment, {
      children: [!!b.data?.restoreFailedCount && (0, g.jsxs)(s, {
        tone: `red`,
        children: [u(`恢复失败时不会继续叠加扶持。处理异常后可重试。`), (0, g.jsx)(f, {
          disabled: q,
          onClick: () => void ie(),
          children: u(`重试恢复`)
        })]
      }), (0, g.jsx)(o, {
        data: te,
        columns: [{
          label: u(`供应商`),
          render: e => e.supplierName
        }, {
          label: u(`开始时间`),
          render: e => n(e.createdAt)
        }, {
          label: u(`状态`),
          render: e => ae[e.state] || e.state
        }, {
          label: u(`扶持账号`),
          render: e => e.boost ? `${e.boost.succeeded} / ${e.boost.total}` : `—`
        }, {
          label: u(`恢复账号`),
          render: e => e.restore ? `${e.restore.succeeded} / ${e.restore.total}` : `—`
        }, {
          label: u(`失败`),
          render: e => (e.boost?.failed ?? 0) + (e.restore?.failed ?? 0)
        }]
      }), (0, g.jsx)(`p`, {
        className: `priority-support-note`,
        children: u(`显示最近10轮，账号数量为成功数 / 总数。每轮恢复扶持前的优先级，期间的人工修改也会覆盖。`)
      })]
    }) : (0, g.jsxs)(`form`, {
      onSubmit: e => void re(e),
      children: [(0, g.jsxs)(`div`, {
        className: `priority-support-fields`,
        children: [(0, g.jsxs)(`label`, {
          className: `field priority-support-wide`,
          children: [(0, g.jsx)(`span`, {
            children: u(`任务类型`)
          }), (0, g.jsx)(p, {
            ariaLabel: u(`任务类型`),
            value: A,
            disabled: q,
            onChange: j,
            options: [{
              value: ``,
              label: u(`请选择任务类型`),
              disabled: !0
            }, {
              value: `SUPPLIER_IDLE`,
              label: u(`供应商无消费扶持`)
            }, {
              value: `ROTATION`,
              label: u(`按比例轮换扶持`)
            }]
          }), (0, g.jsx)(`small`, {
            children: A === `` ? `` : u(A === `SUPPLIER_IDLE` ? `按配置的执行周期比较供应商前后两次成功采集的账单总额；无变化才扶持。有变化时仅恢复上一轮，等待下个周期。` : `每轮先恢复上一批，再按比例选择下一批可用账号；优先选择尚未扶持的账号。`)
          })]
        }), (0, g.jsxs)(`label`, {
          className: `field priority-support-wide`,
          children: [(0, g.jsx)(`span`, {
            children: u(`任务名称`)
          }), (0, g.jsx)(`input`, {
            required: !0,
            maxLength: 128,
            value: S,
            disabled: q,
            onChange: e => C(e.target.value)
          })]
        }), (0, g.jsxs)(`label`, {
          className: `field priority-support-wide`,
          children: [(0, g.jsx)(`span`, {
            children: u(`供应商范围`)
          }), (0, g.jsx)(p, {
            ariaLabel: u(`供应商范围`),
            value: w,
            disabled: q,
            onChange: T,
            options: [{
              value: `SELECTED`,
              label: u(`指定供应商`)
            }, {
              value: `TIERS`,
              label: u(`按供应商优先级档位`)
            }]
          })]
        }), w === `TIERS` && (0, g.jsxs)(`fieldset`, {
          className: `priority-support-tiers priority-support-wide`,
          children: [(0, g.jsx)(`legend`, {
            children: u(`供应商优先级档位`)
          }), Object.entries(ee).map(([e, t]) => (0, g.jsxs)(`label`, {
            children: [(0, g.jsx)(`input`, {
              type: `checkbox`,
              value: e,
              checked: E.includes(e),
              disabled: q,
              onChange: t => D(n => t.target.checked ? [...n, e] : n.filter(t => t !== e))
            }), t]
          }, e)), (0, g.jsx)(`small`, {
            children: u(`执行时按供应商当前生效档位筛选，包含继承系统档位的供应商。`)
          })]
        }), (0, g.jsxs)(`label`, {
          className: `field`,
          children: [(0, g.jsx)(`span`, {
            children: u(`执行周期（分钟）`)
          }), (0, g.jsx)(`input`, {
            type: `number`,
            required: !0,
            min: `1`,
            max: `1440`,
            step: `1`,
            value: R,
            disabled: q,
            onChange: e => z(e.target.value)
          })]
        }), (0, g.jsxs)(`label`, {
          className: `field`,
          children: [(0, g.jsx)(`span`, {
            children: u(`扶持账号比例（%）`)
          }), (0, g.jsx)(`input`, {
            type: `number`,
            required: !0,
            min: `0.01`,
            max: `100`,
            step: `0.01`,
            value: M,
            disabled: q,
            onChange: e => N(e.target.value)
          })]
        }), (0, g.jsxs)(`label`, {
          className: `field`,
          children: [(0, g.jsx)(`span`, {
            children: u(`每家最多扶持账号数`)
          }), (0, g.jsx)(`input`, {
            type: `number`,
            required: !0,
            min: `1`,
            max: `50000`,
            step: `1`,
            value: I,
            disabled: q,
            onChange: e => L(e.target.value)
          })]
        }), (0, g.jsxs)(`label`, {
          className: `field`,
          children: [(0, g.jsx)(`span`, {
            children: u(`目标优先级`)
          }), (0, g.jsx)(`input`, {
            type: `number`,
            required: !0,
            min: `0`,
            max: `1000`,
            step: `1`,
            value: P,
            disabled: q,
            placeholder: u(`请输入0至1000的整数`),
            onChange: e => F(e.target.value)
          })]
        }), w === `SELECTED` && (0, g.jsxs)(`div`, {
          className: `field priority-support-wide`,
          children: [(0, g.jsx)(`span`, {
            children: u(`选择供应商`)
          }), (0, g.jsx)(p, {
            ariaLabel: u(`选择供应商`),
            visual: `supplier`,
            value: ``,
            disabled: q,
            selectedValues: B.map(e => e.id),
            onSelectAll: () => V(e => [...e, ...Q.filter(t => !e.some(e => e.id === t.id)).slice(0, Math.max(0, 100 - e.length))]),
            selectAllDisabled: $ || !!Z.error || B.length >= 100 || !Q.some(e => !B.some(t => t.id === e.id)),
            onClearSelection: () => V([]),
            searchPlaceholder: u(`搜索供应商名称或编码`),
            onSearchChange: U,
            onChange: e => {
              let t = Q.find(t => t.id === e);
              V(n => n.some(t => t.id === e) ? n.filter(t => t.id !== e) : t && n.length < 100 ? [...n, t] : n)
            },
            options: [{
              value: ``,
              label: Z.loading ? u(`加载中…`) : u(`搜索并选择供应商（可多选）`),
              disabled: !0
            }, ...Q.map(e => ({
              value: e.id,
              label: e.name,
              detail: e.code,
              disabled: !B.some(t => t.id === e.id) && ($ || !!Z.error || B.length >= 100)
            }))]
          }), (0, g.jsx)(`small`, {
            className: `priority-support-supplier-hint`,
            children: u(`可连续勾选或全选当前搜索结果，最多选择100个供应商。`)
          }), Z.error && (0, g.jsxs)(s, {
            tone: `red`,
            children: [Z.error, (0, g.jsx)(f, {
              type: `button`,
              onClick: Z.reload,
              children: u(`重新加载`)
            })]
          }), (0, g.jsx)(`div`, {
            className: `cc-priority-suppliers`,
            children: B.map(e => (0, g.jsxs)(f, {
              type: `button`,
              disabled: q,
              "aria-label": u(`移除供应商{0}`, [e.name]),
              onClick: () => V(t => t.filter(t => t.id !== e.id)),
              children: [e.name, ` · `, e.code, ` · `, u(`移除`)]
            }, e.id))
          })]
        })]
      }), (0, g.jsx)(`p`, {
        className: `priority-support-note`,
        children: u(`仅选择就绪账号。每家数量＝就绪数×比例向上取整，且不超过数量上限。每轮先恢复上一轮的原优先级，停用也会恢复。`)
      }), A === `SUPPLIER_IDLE` && (0, g.jsx)(`p`, {
        className: `priority-support-note`,
        children: u(`无消费判断窗口跟随执行周期。账单未更新、采集失败或跨日时等待新的有效采集结果。`)
      }), (0, g.jsxs)(`div`, {
        className: `form-actions`,
        children: [(0, g.jsx)(f, {
          type: `button`,
          disabled: q,
          onClick: i,
          children: u(`取消`)
        }), (0, g.jsx)(f, {
          variant: `primary`,
          type: `submit`,
          disabled: q || b.loading,
          children: u(q ? `保存中…` : `保存配置`)
        })]
      })]
    })]
  })
}
export {
  v as
  default
};