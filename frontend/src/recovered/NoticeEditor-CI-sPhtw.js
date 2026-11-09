// origin: assets/NoticeEditor-CI-sPhtw.js
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
  it as l,
  mt as u,
  p as d,
  rt as f,
  s as p,
  vt as m,
  y as h
} from "./index-Dnr0i-H9.js";
import {
  n as g,
  r as _
} from "./SystemNotices-BwbR9un8.js";
var v = m(r(), 1),
  y = n();

function b({
  audience: e,
  targetUserId: n,
  filtered: r,
  onFiltered: l,
  projects: d,
  onProjects: f
}) {
  let [m, g] = (0, v.useState)(``), [b, x] = (0, v.useState)(1), [S, C] = (0, v.useState)(20), [w, T] = (0, v.useState)(1), [E, D] = (0, v.useState)(10), [O, k] = (0, v.useState)(!1), A = _(e), j = t(A && r ? `/notifications/quote-projects?search=${encodeURIComponent(m)}&page=${b}&size=${S}` : null), M = (e !== `DIRECT` || !!n) && (!A || !r || d.length > 0), N = new URLSearchParams({
    audience: e,
    page: String(w),
    size: String(E)
  });
  e === `DIRECT` && N.set(`targetUserId`, n), A && r && d.forEach(e => N.append(`quoteProjectIds`, e.id));
  let P = t(M ? `/notifications/recipient-preview?${N}` : null);
  return (0, y.jsxs)(`section`, {
    className: `notice-audience-picker`,
    children: [A && (0, y.jsxs)(y.Fragment, {
      children: [(0, y.jsxs)(`label`, {
        className: `notice-project-toggle`,
        children: [(0, y.jsx)(`input`, {
          type: `checkbox`,
          checked: r,
          onChange: e => {
            l(e.target.checked), T(1)
          }
        }), (0, y.jsx)(`span`, {
          children: u(`按报价项目筛选接收供应商`)
        })]
      }), r && (0, y.jsxs)(`fieldset`, {
        className: `notice-project-picker`,
        children: [(0, y.jsx)(`legend`, {
          children: u(`报价项目（可多选）`)
        }), (0, y.jsx)(`p`, {
          className: `muted`,
          children: u(`任一所选项目做过报价即可接收，包含已驳回或已撤回的报价；同一账号只推送一次。`)
        }), (0, y.jsxs)(`div`, {
          className: `notice-project-chips`,
          children: [d.map(e => (0, y.jsxs)(p, {
            type: `button`,
            "aria-label": u(`移除项目 {0}`, [e.name]),
            onClick: () => {
              f(d.filter(t => t.id !== e.id)), T(1)
            },
            children: [e.name, ` ×`]
          }, e.id)), d.length > 1 && (0, y.jsx)(`button`, {
            type: `button`,
            className: `text-button`,
            onClick: () => {
              f([]), T(1)
            },
            children: u(`清空选择`)
          })]
        }), (0, y.jsx)(h, {
          value: m,
          onChange: e => {
            g(e), x(1)
          },
          placeholder: u(`搜索报价项目`)
        }), j.loading ? (0, y.jsx)(c, {}) : j.error ? (0, y.jsxs)(s, {
          tone: `red`,
          children: [j.error, (0, y.jsx)(p, {
            type: `button`,
            onClick: j.reload,
            children: u(`重试`)
          })]
        }) : j.data?.items.length ? (0, y.jsx)(`div`, {
          className: `notice-project-options`,
          children: j.data.items.map(e => (0, y.jsxs)(`label`, {
            children: [(0, y.jsx)(`input`, {
              type: `checkbox`,
              checked: d.some(t => t.id === e.id),
              disabled: d.length >= 100 && !d.some(t => t.id === e.id),
              onChange: t => {
                f(t.target.checked ? [...d, e] : d.filter(t => t.id !== e.id)), T(1)
              }
            }), (0, y.jsxs)(`span`, {
              children: [e.name, !e.enabled && (0, y.jsxs)(`small`, {
                children: [` · `, u(`已停用`)]
              })]
            })]
          }, e.id))
        }) : (0, y.jsx)(o, {
          text: u(`暂无有报价记录的项目`)
        }), j.data && j.data.total > S && (0, y.jsx)(i, {
          data: j.data,
          page: b,
          onPage: x,
          size: S,
          onSizeChange: e => {
            C(e), x(1)
          }
        }), !d.length && (0, y.jsx)(`p`, {
          className: `muted`,
          children: u(`请至少选择一个报价项目。`)
        })]
      })]
    }), M && (0, y.jsx)(`section`, {
      className: `notice-recipient-preview`,
      children: P.loading ? (0, y.jsx)(`p`, {
        className: `muted`,
        children: u(`正在计算接收人员…`)
      }) : P.error ? (0, y.jsxs)(s, {
        tone: `red`,
        children: [P.error, (0, y.jsx)(p, {
          type: `button`,
          onClick: P.reload,
          children: u(`重试`)
        })]
      }) : P.data && (0, y.jsxs)(y.Fragment, {
        children: [(0, y.jsxs)(`div`, {
          className: `notice-delivery-summary`,
          children: [(0, y.jsx)(`strong`, {
            children: u(`预计推送 {0} 人`, [P.data.total])
          }), (0, y.jsx)(`button`, {
            type: `button`,
            className: `text-button`,
            onClick: () => k(!O),
            children: u(O ? `收起人员` : `查看接收人员`)
          })]
        }), O && (0, y.jsxs)(y.Fragment, {
          children: [(0, y.jsx)(a, {
            data: P.data.items,
            columns: [{
              label: u(`接收人员`),
              render: e => (0, y.jsxs)(`div`, {
                className: `stack`,
                children: [(0, y.jsx)(`strong`, {
                  children: e.displayName
                }), (0, y.jsx)(`small`, {
                  children: e.username
                })]
              })
            }, {
              label: u(`供应商`),
              render: e => e.supplierName || u(`平台人员`)
            }]
          }), (0, y.jsx)(i, {
            data: P.data,
            page: w,
            onPage: T,
            size: E,
            onSizeChange: e => {
              D(e), T(1)
            }
          })]
        }), (0, y.jsx)(`p`, {
          className: `muted`,
          children: u(`实际接收人员以发布时的账号状态和报价记录为准。`)
        })]
      })
    })]
  })
}

function x({
  editing: n,
  onClose: r
}) {
  let {
    refresh: i,
    notify: a
  } = e(), [o, s] = (0, v.useState)(n === `new` ? [] : n.quoteProjects || []), [c, p] = (0, v.useState)(o.length > 0), m = t(`/notifications/notice-recipients`);
  async function h(e, t) {
    let r = _(e.audience) && c;
    if (r && !o.length) throw Error(u(`请至少选择一个报价项目。`));
    let s = {
      title: e.title,
      body: e.body,
      audience: e.audience,
      targetUserId: e.audience === `DIRECT` ? e.targetUserId : null,
      quoteProjectIds: r ? o.map(e => e.id) : []
    };
    if (n !== `new`) await l(`/notifications/notices/${n.id}`, {
      ...s,
      version: n.version
    }), a(u(`通知草稿已更新`));
    else if (t) await f(`/notifications/notices`, s), a(u(`通知草稿已保存`));
    else {
      let e = await f(`/notifications/publish`, s);
      a(u(`已发送至 {0} 个账号`, [e.recipientCount]))
    }
    i()
  }
  return (0, y.jsx)(d, {
    className: `notice-editor`,
    title: u(n === `new` ? `新建系统通知` : `编辑通知草稿`),
    subtitle: u(n === `new` ? `可以立即发布，也可以先保存为草稿。` : `草稿保存后不会发送给任何账号。`),
    fields: [{
      name: `title`,
      label: u(`通知标题`),
      full: !0
    }, {
      name: `body`,
      label: u(`通知正文`),
      type: `textarea`,
      full: !0
    }, {
      name: `audience`,
      label: u(`接收范围`),
      type: `select`,
      full: !0,
      clearOnChange: [`targetUserId`],
      options: Object.entries(g).map(([e, t]) => ({
        value: e,
        label: t
      }))
    }, {
      name: `targetUserId`,
      label: u(`接收账号`),
      type: `select`,
      full: !0,
      visible: e => e.audience === `DIRECT`,
      visual: `user`,
      options: (m.data || []).map(e => ({
        value: e.id,
        label: `${e.displayName}（${e.username}）${e.supplierName?` · ${e.supplierName}`:``}`
      })),
      hint: m.loading ? u(`正在加载账号…`) : m.error || (m.data?.length ? void 0 : u(`暂无可接收通知的账号`))
    }],
    initial: n === `new` ? {
      audience: `SUPPLIER_ADMINS`
    } : {
      title: n.title,
      body: n.body,
      audience: n.audience,
      targetUserId: n.targetUserId || ``
    },
    extra: e => (0, y.jsx)(b, {
      audience: e.audience,
      targetUserId: e.targetUserId || ``,
      filtered: c,
      onFiltered: p,
      projects: o,
      onProjects: s
    }, `${e.audience}:${e.targetUserId||``}`),
    submitLabel: u(n === `new` ? `立即发布` : `保存草稿`),
    secondarySubmit: n === `new` ? {
      label: u(`保存草稿`),
      onSubmit: e => h(e, !0)
    } : void 0,
    onClose: r,
    onSubmit: e => h(e, n !== `new`)
  })
}
export {
  x as
  default
};