// origin: assets/NoticeDeliveries-D5ljVxwh.js
import {
  G as e,
  P as t,
  S as n,
  X as r,
  Z as i,
  _ as a,
  c as o,
  g as s,
  mt as c,
  o as l,
  s as u,
  vt as d,
  x as f,
  y as p
} from "./index-Dnr0i-H9.js";
import "./SystemNotices-BwbR9un8.js";
var m = d(i(), 1),
  h = r();

function g({
  notice: r,
  onClose: i
}) {
  let [d, g] = (0, m.useState)(``), [_, v] = (0, m.useState)(``), [y, b] = (0, m.useState)(1), [x, S] = (0, m.useState)(20), C = n(`/notifications/notices/${r.id}/deliveries?search=${encodeURIComponent(d)}&state=${_}&page=${y}&size=${x}`), w = C.data?.summary;
  return (0, h.jsxs)(e, {
    wide: !0,
    className: `notice-deliveries`,
    title: c(`阅读与接收人员`),
    subtitle: r.title,
    onClose: i,
    children: [w && (0, h.jsxs)(`div`, {
      className: `notice-delivery-summary`,
      "aria-live": `polite`,
      children: [(0, h.jsx)(`strong`, {
        children: c(`已推送 {0} 人`, [w.recipientCount])
      }), w.withdrawnCount > 0 && (0, h.jsx)(`span`, {
        children: c(`已撤回 {0} 人`, [w.withdrawnCount])
      })]
    }), w && !w.historyComplete && (0, h.jsx)(s, {
      tone: `amber`,
      children: c(`历史接收明细仅保留 {0} 人，其余投递记录已移除，无法还原人员及阅读状态。`, [w.knownRecipientCount])
    }), (0, h.jsx)(f, {
      value: _ || `all`,
      onChange: e => {
        v(e === `all` ? `` : e), b(1)
      },
      items: [{
        id: `all`,
        label: `${c(`全部人员`)}${w?` · ${w.knownRecipientCount}`:``}`
      }, {
        id: `READ`,
        label: w ? c(`已读 {0} 人`, [w.readCount]) : c(`已读`)
      }, {
        id: `UNREAD`,
        label: w ? c(`未读 {0} 人`, [w.unreadCount]) : c(`未读`)
      }]
    }), (0, h.jsxs)(`div`, {
      className: `panel-toolbar`,
      children: [(0, h.jsx)(p, {
        value: d,
        onChange: e => {
          g(e), b(1)
        },
        placeholder: c(`搜索姓名、账号或供应商`)
      }), (0, h.jsx)(u, {
        icon: `refresh`,
        "aria-label": c(`刷新人员明细`),
        onClick: C.reload
      })]
    }), (0, h.jsx)(o, {
      data: C.data?.items || [],
      loading: C.loading,
      error: C.error,
      columns: [{
        label: c(`接收人员`),
        render: e => (0, h.jsxs)(`div`, {
          className: `stack`,
          children: [(0, h.jsx)(`strong`, {
            children: e.displayName
          }), (0, h.jsx)(`small`, {
            children: e.username
          })]
        })
      }, {
        label: c(`供应商`),
        render: e => e.supplierName || c(`平台人员`)
      }, {
        label: c(`推送情况`),
        render: e => (0, h.jsx)(l, {
          state: e.withdrawnAt ? `REVOKED` : `PUBLISHED`,
          label: e.withdrawnAt ? c(`已撤回`) : c(`已投递`)
        })
      }, {
        label: c(`阅读状态`),
        render: e => (0, h.jsx)(l, {
          state: e.readAt ? `APPROVED` : `PENDING`,
          label: e.readAt ? c(`已读`) : c(`未读`)
        })
      }, {
        label: c(`推送时间`),
        render: e => (0, h.jsx)(`span`, {
          className: `mono`,
          children: t(e.sentAt)
        })
      }, {
        label: c(`阅读时间`),
        render: e => (0, h.jsx)(`span`, {
          className: `mono`,
          children: t(e.readAt)
        })
      }]
    }), (0, h.jsx)(a, {
      data: C.data,
      page: y,
      onPage: b,
      size: x,
      onSizeChange: e => {
        S(e), b(1)
      }
    }), (0, h.jsx)(`p`, {
      className: `muted notice-delivery-hint`,
      children: c(`已读表示该账号已点击“标记已读”、打开消息或执行“全部已读”。查看人员明细不会改变阅读状态。`)
    })]
  })
}
export {
  g as
  default
};