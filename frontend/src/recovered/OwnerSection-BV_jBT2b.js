// origin: assets/OwnerSection-BV_jBT2b.js
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
  it as l,
  mt as u,
  s as d,
  u as f,
  vt as p,
  y as m
} from "./index-Dnr0i-H9.js";
var h = p(a(), 1),
  g = i();

function _({
  supplierId: i,
  version: a,
  ownerUserId: p,
  ownerName: _,
  onChanged: v,
  onClose: y,
  embedded: b = !1
}) {
  let {
    has: x,
    notify: S
  } = e(), [C, w] = (0, h.useState)(``), [T, E] = (0, h.useState)(1), [D, O] = (0, h.useState)(10), [k, A] = (0, h.useState)(!1), j = r(x(`supplier.owner.assign`) && (!b || k) ? `/suppliers/${i}/owner-terms?search=${encodeURIComponent(C)}&page=${T}&size=${D}` : null), M = r(x(`supplier.owner.assign`) ? `/suppliers/owner-candidates` : null), [N, P] = (0, h.useState)(!1), [F, I] = (0, h.useState)(``), [L, R] = (0, h.useState)(``), [z, B] = (0, h.useState)(!1), [V, H] = (0, h.useState)(``);
  if (!x(`supplier.owner.assign`)) return null;
  let U = () => {
      b ? y?.() : P(!1), H(``)
    },
    W = (0, g.jsxs)(`div`, {
      className: `owner-assign-form`,
      children: [(0, g.jsxs)(`p`, {
        className: `owner-assign-current`,
        children: [u(`当前负责运营：`), (0, g.jsx)(`strong`, {
          children: _ || u(`待分配`)
        })]
      }), M.error && (0, g.jsxs)(c, {
        tone: `red`,
        children: [u(`平台运营加载失败：`), M.error]
      }), M.loading && !M.data && (0, g.jsx)(`p`, {
        className: `muted`,
        children: u(`正在读取平台运营…`)
      }), !M.loading && !M.error && M.data?.length === 0 && (0, g.jsx)(c, {
        children: u(`暂无可指定的平台运营账号，请先启用平台运营账号。`)
      }), (0, g.jsxs)(`div`, {
        className: `field`,
        children: [(0, g.jsxs)(`span`, {
          children: [u(`平台运营 `), (0, g.jsx)(`em`, {
            children: `*`
          })]
        }), (0, g.jsx)(f, {
          ariaLabel: u(`平台运营`),
          visual: `user`,
          required: !0,
          value: F,
          onChange: e => {
            I(e), H(``)
          },
          disabled: M.loading || !!M.error || !M.data?.length,
          options: [{
            value: ``,
            label: u(`请选择`)
          }, ...(M.data || []).map(e => ({
            value: e.id,
            label: u(`{0}（{1}）`, [e.displayName, e.username])
          }))]
        })]
      }), (0, g.jsxs)(`label`, {
        className: `field`,
        children: [(0, g.jsxs)(`span`, {
          children: [u(`指定原因 `), (0, g.jsx)(`em`, {
            children: `*`
          })]
        }), (0, g.jsx)(`textarea`, {
          value: L,
          maxLength: 500,
          placeholder: u(`说明本次指定或改挂的原因`),
          onChange: e => {
            R(e.target.value), H(``)
          }
        }), (0, g.jsx)(`small`, {
          children: u(`必填，保存后会记入归属记录。`)
        })]
      }), V && (0, g.jsx)(c, {
        tone: `red`,
        children: V
      }), (0, g.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, g.jsx)(d, {
          onClick: U,
          disabled: z,
          children: u(`取消 `)
        }), (0, g.jsx)(d, {
          variant: `primary`,
          disabled: z || M.loading || !!M.error || !M.data?.length,
          onClick: G,
          children: u(z ? `保存中…` : _ ? `确认改挂` : `确认指定`)
        })]
      })]
    });
  async function G() {
    if (!F) {
      H(u(`请选择平台运营`));
      return
    }
    if (F === p) {
      H(u(`请选择另一位平台运营`));
      return
    }
    if (!L.trim()) {
      H(u(`请填写本次指定或改挂的原因`));
      return
    }
    B(!0);
    try {
      await l(`/suppliers/${i}/owner`, {
        ownerUserId: F,
        version: a,
        note: L
      }), S(u(`负责运营已更新`)), U(), R(``), v()
    } catch (e) {
      H(e.message)
    } finally {
      B(!1)
    }
  }
  let K = (0, g.jsxs)(g.Fragment, {
    children: [(0, g.jsx)(m, {
      value: C,
      onChange: e => {
        w(e), E(1)
      },
      placeholder: u(`搜索负责人或备注`)
    }), (0, g.jsx)(s, {
      data: j.data?.items || [],
      loading: j.loading,
      error: j.error,
      columns: [{
        label: u(`负责人`),
        render: e => e.ownerName
      }, {
        label: u(`区间`),
        render: e => u(`{0} 至 {1}`, [n(e.startsAt), e.endsAt ? n(e.endsAt) : u(`现在`)])
      }, {
        label: u(`备注`),
        render: e => e.note
      }]
    }), (0, g.jsx)(o, {
      data: j.data,
      page: T,
      onPage: E,
      size: D,
      onSizeChange: O
    })]
  });
  return b ? (0, g.jsxs)(`div`, {
    className: `owner-assignment`,
    children: [W, (0, g.jsxs)(`details`, {
      onToggle: e => A(e.currentTarget.open),
      children: [(0, g.jsx)(`summary`, {
        children: u(`查看归属记录`)
      }), k && (0, g.jsx)(`div`, {
        className: `owner-assignment-history`,
        children: K
      })]
    })]
  }) : (0, g.jsxs)(`section`, {
    className: `subsection`,
    children: [(0, g.jsxs)(`div`, {
      className: `section-title`,
      children: [(0, g.jsx)(`h3`, {
        children: u(`负责运营`)
      }), (0, g.jsx)(`button`, {
        className: `text-button`,
        onClick: () => P(!0),
        children: u(_ ? `改挂` : `指定`)
      })]
    }), (0, g.jsx)(`p`, {
      className: `muted`,
      children: _ || u(`待分配`)
    }), K, N && (0, g.jsx)(t, {
      title: u(_ ? `改挂负责运营` : `指定负责运营`),
      onClose: U,
      children: W
    })]
  })
}
export {
  _ as OwnerSection
};