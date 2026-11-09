// origin: assets/SystemNotices-BwbR9un8.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/NoticeEditor-CI-sPhtw.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/NoticeDeliveries-D5ljVxwh.js"]))) => i.map(i => d[i]);
import {
  C as e,
  G as t,
  P as n,
  S as r,
  X as i,
  Z as a,
  _ as o,
  _t as s,
  c,
  g as l,
  i as u,
  l as d,
  m as f,
  mt as p,
  o as m,
  rt as h,
  s as g,
  u as _,
  vt as v,
  y
} from "./index-Dnr0i-H9.js";
var b = v(a(), 1),
  x = {
    ALL: p(`全部启用账号`),
    PLATFORM: p(`平台人员`),
    SUPPLIERS: p(`供应商账号（含团队成员）`),
    SUPPLIER_ADMINS: p(`供应商管理员（仅主账号）`),
    DIRECT: p(`指定单个账号`)
  },
  S = e => e === `SUPPLIERS` || e === `SUPPLIER_ADMINS`;

function C(e) {
  return e.audience === `DIRECT` ? p(`指定账号：{0}{1}`, [e.targetDisplayName || e.targetUsername || p(`账号已变更`), e.targetUsername ? p(`（{0}）`, [e.targetUsername]) : ``]) : x[e.audience]
}
var w = s({
    default: () => O
  }),
  T = i(),
  E = (0, b.lazy)(() => u(() => import(`./NoticeEditor-CI-sPhtw.js`), __vite__mapDeps([0, 1, 2]))),
  D = (0, b.lazy)(() => u(() => import(`./NoticeDeliveries-D5ljVxwh.js`), __vite__mapDeps([3, 1, 2])));

function O() {
  let {
    refresh: i,
    notify: a
  } = e(), [s, u] = (0, b.useState)(``), [d, v] = (0, b.useState)(``), [x, S] = (0, b.useState)(1), [w, O] = (0, b.useState)(10), [A, j] = (0, b.useState)(null), [M, N] = (0, b.useState)(null), [P, F] = (0, b.useState)(null), [I, L] = (0, b.useState)(null), [R, z] = (0, b.useState)(null), [B, V] = (0, b.useState)(!1), [H, U] = (0, b.useState)(``), W = r(`/notifications/notices?search=${encodeURIComponent(s)}&status=${d}&page=${x}&size=${w}`);
  async function G() {
    if (R) {
      V(!0), U(``);
      try {
        let e = await h(`/notifications/notices/${R.id}/revoke`, {});
        z(null), N(null), i(), a(p(`通知已撤回，已移除 {0} 条未读消息`, [e.removedUnreadCount]))
      } catch (e) {
        U(e.message)
      } finally {
        V(!1)
      }
    }
  }
  async function K() {
    if (I) {
      V(!0), U(``);
      try {
        let e = await h(`/notifications/notices/${I.id}/publish`, {});
        L(null), N(null), i(), a(p(`已发送至 {0} 个账号`, [e.recipientCount]))
      } catch (e) {
        U(e.message)
      } finally {
        V(!1)
      }
    }
  }
  let q = e => p(e === `DRAFT` ? `草稿` : e === `PUBLISHED` ? `已发布` : `已撤回`);
  return (0, T.jsxs)(T.Fragment, {
    children: [(0, T.jsx)(f, {
      title: p(`通知管理`),
      children: (0, T.jsx)(g, {
        variant: `primary`,
        icon: `plus`,
        onClick: () => j(`new`),
        children: p(`新建通知 `)
      })
    }), (0, T.jsxs)(`section`, {
      className: `panel`,
      children: [(0, T.jsxs)(`div`, {
        className: `panel-toolbar`,
        children: [(0, T.jsx)(y, {
          value: s,
          onChange: e => {
            u(e), S(1)
          },
          placeholder: p(`搜索通知标题或正文`)
        }), (0, T.jsx)(_, {
          ariaLabel: p(`筛选通知状态`),
          value: d,
          onChange: e => {
            v(e), S(1)
          },
          options: [{
            value: ``,
            label: p(`全部状态`)
          }, {
            value: `DRAFT`,
            label: p(`草稿`),
            tone: `draft`
          }, {
            value: `PUBLISHED`,
            label: p(`已发布`),
            tone: `published`
          }, {
            value: `REVOKED`,
            label: p(`已撤回`),
            tone: `revoked`
          }]
        }), (0, T.jsx)(g, {
          icon: `refresh`,
          "aria-label": p(`刷新通知`),
          onClick: i
        })]
      }), (0, T.jsx)(c, {
        data: W.data?.items || [],
        loading: W.loading,
        error: W.error,
        onRow: N,
        columns: [{
          label: p(`通知内容`),
          render: e => (0, T.jsxs)(`div`, {
            className: `stack notice-title`,
            children: [(0, T.jsx)(`strong`, {
              children: e.title
            }), (0, T.jsx)(`small`, {
              children: e.body
            })]
          })
        }, {
          label: p(`接收范围`),
          render: e => (0, T.jsxs)(`div`, {
            className: `stack`,
            children: [(0, T.jsx)(`span`, {
              children: C(e)
            }), !!e.quoteProjects?.length && (0, T.jsx)(`small`, {
              children: e.quoteProjects.map(e => e.name).join(`、`)
            })]
          })
        }, {
          label: p(`阅读情况`),
          render: e => (0, T.jsxs)(`button`, {
            type: `button`,
            className: `text-button mono notice-read-link`,
            disabled: e.status === `DRAFT`,
            "aria-label": p(`查看阅读和接收人员：{0}`, [e.title]),
            onClick: t => {
              t.stopPropagation(), F(e)
            },
            children: [e.readCount, ` / `, e.recipientCount, (0, T.jsx)(`span`, {
              children: p(`查看人员`)
            })]
          })
        }, {
          label: p(`状态`),
          render: e => (0, T.jsx)(m, {
            state: e.status,
            label: q(e.status)
          })
        }, {
          label: p(`创建人`),
          render: e => e.creatorName
        }, {
          label: p(`更新时间`),
          render: e => (0, T.jsx)(`span`, {
            className: `mono subtle`,
            children: n(e.publishedAt || e.updatedAt || e.createdAt)
          })
        }, {
          label: p(`操作`),
          render: e => (0, T.jsxs)(`div`, {
            className: `row-actions`,
            children: [e.status === `DRAFT` && (0, T.jsxs)(T.Fragment, {
              children: [(0, T.jsx)(`button`, {
                className: `text-button`,
                onClick: t => {
                  t.stopPropagation(), j(e)
                },
                children: p(`编辑 `)
              }), (0, T.jsx)(`button`, {
                className: `text-button`,
                onClick: t => {
                  t.stopPropagation(), U(``), L(e)
                },
                children: p(`发布 `)
              })]
            }), e.status === `PUBLISHED` && (0, T.jsx)(`button`, {
              className: `text-button`,
              onClick: t => {
                t.stopPropagation(), U(``), z(e)
              },
              children: p(`撤回 `)
            }), e.status === `REVOKED` && (0, T.jsx)(`span`, {
              className: `muted`,
              children: `—`
            })]
          })
        }]
      }), (0, T.jsx)(o, {
        data: W.data,
        page: x,
        onPage: S,
        size: w,
        onSizeChange: e => {
          O(e), S(1)
        }
      })]
    }), A && (0, T.jsx)(b.Suspense, {
      fallback: null,
      children: (0, T.jsx)(E, {
        editing: A,
        onClose: () => j(null)
      })
    }), P && (0, T.jsx)(b.Suspense, {
      fallback: null,
      children: (0, T.jsx)(D, {
        notice: P,
        onClose: () => {
          F(null), i()
        }
      })
    }), M && (0, T.jsx)(k, {
      notice: M,
      onClose: () => N(null),
      onDeliveries: () => {
        F(M), N(null)
      },
      onEdit: () => {
        j(M), N(null)
      },
      onPublish: () => {
        U(``), L(M)
      },
      onRevoke: () => {
        U(``), z(M)
      }
    }), ` `, I && (0, T.jsxs)(t, {
      title: p(`发布通知`),
      subtitle: I.title,
      onClose: () => {
        B || (L(null), U(``))
      },
      children: [(0, T.jsxs)(l, {
        children: [p(`发布后将立即发送给“`), C(I), !!I.quoteProjects?.length && ` · ${I.quoteProjects.map(e=>e.name).join(`、`)}`, p(`”，草稿内容将不能再修改。`)]
      }), H && (0, T.jsx)(l, {
        tone: `red`,
        children: H
      }), (0, T.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, T.jsx)(g, {
          disabled: B,
          onClick: () => {
            L(null), U(``)
          },
          children: p(`取消 `)
        }), (0, T.jsx)(g, {
          variant: `primary`,
          disabled: B,
          onClick: () => void K(),
          children: p(B ? `发布中…` : `确认发布`)
        })]
      })]
    }), ` `, R && (0, T.jsxs)(t, {
      title: p(`撤回通知`),
      subtitle: R.title,
      onClose: () => {
        B || (z(null), U(``))
      },
      children: [(0, T.jsx)(l, {
        tone: `amber`,
        children: p(`撤回后，尚未阅读的消息会从收件人列表中移除；已读消息和管理记录会保留。 `)
      }), H && (0, T.jsx)(l, {
        tone: `red`,
        children: H
      }), (0, T.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, T.jsx)(g, {
          disabled: B,
          onClick: () => {
            z(null), U(``)
          },
          children: p(`取消 `)
        }), (0, T.jsx)(g, {
          className: `danger-quiet`,
          disabled: B,
          onClick: () => void G(),
          children: p(B ? `撤回中…` : `确认撤回`)
        })]
      })]
    })]
  })
}

function k({
  notice: e,
  onClose: r,
  onDeliveries: i,
  onEdit: a,
  onPublish: o,
  onRevoke: s
}) {
  let c = e.status === `DRAFT` ? p(`草稿`) : e.status === `PUBLISHED` ? p(`已发布`) : p(`已撤回`),
    l = [
      [p(`状态`), (0, T.jsx)(m, {
        state: e.status,
        label: c
      })],
      [p(`接收范围`), C(e)],
      [p(`阅读情况`), (0, T.jsxs)(`button`, {
        type: `button`,
        className: `text-button mono`,
        disabled: e.status === `DRAFT`,
        onClick: i,
        children: [e.readCount, ` / `, e.recipientCount, ` · `, p(`查看人员`)]
      })],
      [p(`创建人`), e.creatorName],
      [p(`创建时间`), n(e.createdAt)],
      [p(`发布时间`), n(e.publishedAt)]
    ];
  return e.quoteProjects?.length && l.push([p(`报价项目`), e.quoteProjects.map(e => e.name).join(`、`)]), e.revokedAt && l.push([p(`撤回人`), e.revokerName || `—`], [p(`撤回时间`), n(e.revokedAt)]), (0, T.jsxs)(t, {
    drawer: !0,
    title: e.title,
    subtitle: n(e.publishedAt || e.updatedAt || e.createdAt),
    onClose: r,
    children: [(0, T.jsx)(d, {
      items: l
    }), (0, T.jsxs)(`section`, {
      className: `subsection`,
      children: [(0, T.jsx)(`h3`, {
        children: p(`通知正文`)
      }), (0, T.jsx)(`p`, {
        className: `message-body`,
        children: e.body
      })]
    }), e.status === `DRAFT` && (0, T.jsxs)(`div`, {
      className: `dialog-footer`,
      children: [(0, T.jsx)(g, {
        onClick: a,
        children: p(`编辑草稿`)
      }), (0, T.jsx)(g, {
        variant: `primary`,
        onClick: o,
        children: p(`发布通知 `)
      })]
    }), e.status === `PUBLISHED` && (0, T.jsx)(`div`, {
      className: `dialog-footer`,
      children: (0, T.jsx)(g, {
        className: `danger-quiet`,
        onClick: s,
        children: p(`撤回通知 `)
      })
    })]
  })
}
export {
  O as
  default, x as n, S as r, w as t
};