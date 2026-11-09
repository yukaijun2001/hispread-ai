// origin: assets/Notifications-BTntRB-A.js
import {
  C as e,
  G as t,
  I as n,
  L as r,
  P as i,
  R as a,
  S as o,
  X as s,
  Z as c,
  _ as l,
  d as u,
  h as d,
  m as f,
  mt as p,
  rt as m,
  s as h,
  vt as g,
  x as _
} from "./index-Dnr0i-H9.js";
var v = g(c(), 1),
  y = s();

function b() {
  let {
    notify: s,
    refresh: c
  } = e(), [g, b] = (0, v.useState)(!1), [x, S] = (0, v.useState)(1), [C, w] = (0, v.useState)(10), [T, E] = (0, v.useState)(null), D = o(`/notifications?unread=${g}&page=${x}&size=${C}`);
  async function O(e) {
    try {
      e.readAt || await m(`/notifications/${e.id}/read`, {}), E(e), c()
    } catch (e) {
      s(e.message, !0)
    }
  }
  return (0, y.jsxs)(y.Fragment, {
    children: [(0, y.jsx)(f, {
      title: p(`消息通知`),
      children: (0, y.jsx)(h, {
        icon: `check`,
        onClick: async () => {
          try {
            await m(`/notifications/read-all`, {}), c(), s(p(`已全部标记为已读`))
          } catch (e) {
            s(e.message, !0)
          }
        },
        children: p(`全部已读 `)
      })
    }), (0, y.jsx)(_, {
      value: g ? `unread` : `all`,
      onChange: e => {
        b(e === `unread`), S(1)
      },
      items: [{
        id: `all`,
        label: p(`全部消息`)
      }, {
        id: `unread`,
        label: p(`未读消息`)
      }]
    }), (0, y.jsxs)(`section`, {
      className: `panel message-list`,
      children: [D.loading && !D.data ? (0, y.jsx)(d, {}) : D.error ? (0, y.jsx)(u, {
        text: D.error,
        error: !0
      }) : D.data?.items.length ? D.data.items.map(e => (0, y.jsxs)(`button`, {
        className: `message-row ${e.readAt?``:`unread`}`,
        onClick: () => void O(e),
        children: [(0, y.jsx)(`span`, {
          className: `message-dot`
        }), (0, y.jsxs)(`span`, {
          children: [(0, y.jsx)(`strong`, {
            children: a(e)
          }), (0, y.jsx)(`p`, {
            children: r(e)
          })]
        }), (0, y.jsx)(`time`, {
          children: i(e.createdAt)
        })]
      }, e.id)) : (0, y.jsx)(u, {
        text: p(g ? `没有未读消息` : `暂无消息`)
      }), (0, y.jsx)(l, {
        data: D.data,
        page: x,
        onPage: S,
        size: C,
        onSizeChange: e => {
          w(e), S(1)
        }
      })]
    }), T && (0, y.jsxs)(t, {
      title: a(T),
      subtitle: i(T.createdAt),
      onClose: () => E(null),
      children: [(0, y.jsx)(`p`, {
        className: `message-body`,
        children: r(T)
      }), T.targetPath && (0, y.jsx)(`div`, {
        className: `dialog-footer`,
        children: (0, y.jsx)(h, {
          variant: `primary`,
          onClick: () => n(T.targetPath),
          children: p(`查看相关记录 `)
        })
      })]
    })]
  })
}
export {
  b as
  default
};