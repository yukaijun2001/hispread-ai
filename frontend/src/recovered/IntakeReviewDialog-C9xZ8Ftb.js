// origin: assets/IntakeReviewDialog-C9xZ8Ftb.js
import {
  C as e,
  G as t,
  P as n,
  S as r,
  X as i,
  Z as a,
  _ as o,
  c as s,
  g as c,
  mt as l,
  rt as u,
  s as d,
  u as f,
  vt as p
} from "./index-Dnr0i-H9.js"; /* empty css               */
var m = p(a(), 1),
  h = i();

function g({
  onClose: i
}) {
  let {
    user: a,
    has: p,
    notify: g,
    refresh: _
  } = e(), v = !a.supplierId && ![`SUPPLIER`, `SUPPLIER_AGENT`].includes(a.role) && p(`resource.read`) && p(`resource.dispatch`), [y, b] = (0, m.useState)(``), [x, S] = (0, m.useState)(``);
  (0, m.useEffect)(() => {
    let e = window.setTimeout(() => S(y.trim()), 300);
    return () => window.clearTimeout(e)
  }, [y]);
  let [C, w] = (0, m.useState)(``), [T, E] = (0, m.useState)(1), [D, O] = (0, m.useState)(20), [k, A] = (0, m.useState)(null), [j, M] = (0, m.useState)(``), [N, P] = (0, m.useState)(``), [F, I] = (0, m.useState)(!1), [L, R] = (0, m.useState)(``), z = r(v ? `/deliveries/filter-options?assignment=ASSIGNED&supplierSearch=${encodeURIComponent(x)}` : null), B = new URLSearchParams({
    page: String(T),
    size: String(D)
  });
  C && B.set(`supplierId`, C);
  let V = r(v ? `/cc-intake/admin/reviews?${B}` : null);
  return (0, h.jsx)(t, {
    title: l(`核对上号计数`),
    wide: !0,
    onClose: i,
    className: `cc-intake-review-dialog`,
    children: v ? (0, h.jsxs)(h.Fragment, {
      children: [(0, h.jsx)(`p`, {
        className: `muted`,
        children: l(`仅列出已成功创建、但新增或重复归属仍有歧义的账号。核对只修正计数，不重新上号。`)
      }), (0, h.jsxs)(`div`, {
        className: `cc-intake-priority-toolbar`,
        children: [(0, h.jsxs)(`label`, {
          className: `field`,
          children: [(0, h.jsx)(`span`, {
            children: l(`供应商`)
          }), (0, h.jsx)(f, {
            ariaLabel: l(`核对计数供应商`),
            searchPlaceholder: l(`搜索供应商名称或编码`),
            onSearchChange: b,
            value: C,
            disabled: F,
            onChange: e => {
              w(e), E(1), A(null), R(``)
            },
            options: [{
              value: ``,
              label: l(`全部供应商`)
            }, ...(z.data?.suppliers || []).map(e => ({
              value: e.id,
              label: e.name,
              detail: e.code
            }))]
          })]
        }), (0, h.jsx)(d, {
          type: `button`,
          disabled: F || V.loading,
          onClick: V.reload,
          children: l(`刷新`)
        })]
      }), z.error && (0, h.jsxs)(c, {
        tone: `red`,
        children: [z.error, (0, h.jsx)(d, {
          type: `button`,
          onClick: z.reload,
          children: l(`重新加载`)
        })]
      }), (0, h.jsx)(s, {
        data: V.data?.items || [],
        loading: V.loading,
        error: V.error,
        onRetry: V.reload,
        columns: [{
          label: l(`资源名称`),
          render: e => e.resourceName
        }, {
          label: l(`供应商`),
          render: e => e.supplierName
        }, {
          label: l(`提交账号`),
          render: e => e.actorName
        }, {
          label: l(`确认成功时间`),
          render: e => n(e.confirmedAt)
        }, {
          label: l(`操作`),
          render: e => (0, h.jsx)(d, {
            type: `button`,
            disabled: F,
            onClick: () => {
              A(e), M(``), P(``), R(``)
            },
            children: l(`核对此账号`)
          })
        }]
      }), (0, h.jsx)(o, {
        page: T,
        size: D,
        data: V.data,
        loading: V.loading,
        onPage: e => {
          E(e), A(null)
        },
        onSizeChange: e => {
          O(e), E(1), A(null)
        }
      }), k && (0, h.jsxs)(`form`, {
        className: `cc-intake-review-form`,
        onSubmit: async e => {
          if (e.preventDefault(), !F && j && N.trim()) {
            I(!0), R(``);
            try {
              await u(`/cc-intake/admin/reviews/${encodeURIComponent(k.dispatchId)}/resolve`, {
                newlyCreated: j === `NEW`,
                reason: N.trim()
              }), A(null), P(``), M(``), g(l(`上号计数已核对`)), _()
            } catch (e) {
              R(e.message)
            } finally {
              I(!1)
            }
          }
        },
        children: [(0, h.jsx)(`h3`, {
          children: l(`核对：{0}`, [k.resourceName])
        }), (0, h.jsxs)(`label`, {
          className: `field`,
          children: [(0, h.jsx)(`span`, {
            children: l(`核对结果`)
          }), (0, h.jsx)(f, {
            ariaLabel: l(`核对结果`),
            value: j,
            disabled: F,
            onChange: M,
            options: [{
              value: ``,
              label: l(`请选择核对结果`)
            }, {
              value: `NEW`,
              label: l(`确认本次新增`)
            }, {
              value: `EXISTING`,
              label: l(`确认为已有账号`)
            }]
          })]
        }), (0, h.jsxs)(`label`, {
          className: `field`,
          children: [(0, h.jsx)(`span`, {
            children: l(`核对依据`)
          }), (0, h.jsx)(`textarea`, {
            required: !0,
            maxLength: 500,
            rows: 3,
            value: N,
            disabled: F,
            onChange: e => P(e.target.value)
          }), (0, h.jsxs)(`small`, {
            children: [N.length, `/500`]
          })]
        }), L && (0, h.jsx)(c, {
          tone: `red`,
          children: L
        }), (0, h.jsxs)(`footer`, {
          className: `dialog-footer`,
          children: [(0, h.jsx)(d, {
            type: `button`,
            disabled: F,
            onClick: () => A(null),
            children: l(`取消`)
          }), (0, h.jsx)(d, {
            type: `submit`,
            variant: `primary`,
            disabled: F || !j || !N.trim(),
            children: l(F ? `保存中…` : `保存核对结果`)
          })]
        })]
      })]
    }) : (0, h.jsx)(c, {
      tone: `red`,
      children: l(`当前账号无权访问此页面`)
    })
  })
}
export {
  g as
  default
};