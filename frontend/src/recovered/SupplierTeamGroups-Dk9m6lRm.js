// origin: assets/SupplierTeamGroups-Dk9m6lRm.js
import {
  C as e,
  G as t,
  X as n,
  Z as r,
  g as i,
  it as a,
  mt as o,
  rt as s,
  s as c,
  u as l,
  vt as u,
  y as d
} from "./index-Dnr0i-H9.js";
var f = u(r(), 1),
  p = n();

function m({
  agents: n,
  groups: r,
  group: u,
  removing: m = !1,
  adminOnly: h = !1,
  membersOnly: g = !1,
  onClose: _,
  onSaved: v
}) {
  let {
    notify: y
  } = e(), [b, x] = (0, f.useState)(u === `new` ? `` : u.name), [S, C] = (0, f.useState)(u === `new` ? `` : u.adminUserId || ``), [w, T] = (0, f.useState)(u === `new` ? [] : u.memberIds), [E, D] = (0, f.useState)(``), [O, k] = (0, f.useState)(g ? `OUTSIDE` : ``), [A, j] = (0, f.useState)(r.find(e => u !== `new` && e.id !== u.id && e.name === `交付组1`)?.id || r.find(e => u !== `new` && e.id !== u.id)?.id || ``), [M, N] = (0, f.useState)(!1), [P, F] = (0, f.useState)(``), I = u === `new` ? `` : u.id, L = new Map(r.flatMap(e => e.memberIds.map(t => [t, e]))), R = n.filter(e => (!h || u !== `new` && u.memberIds.includes(e.id)) && (!L.has(e.id) || L.get(e.id)?.id === I || L.get(e.id)?.adminUserId !== e.id)), z = n.filter(e => {
    let t = L.get(e.id)?.id === I;
    return (!O || (O === `INSIDE` ? t : !t)) && `${e.displayName} ${e.username}`.toLocaleLowerCase().includes(E.trim().toLocaleLowerCase())
  }), B = new Set([...w, ...S ? [S] : []]).size, V = h || u === `new` || !!u.adminUserId, H = R.some(e => e.id === S && e.enabled);
  async function U() {
    if (!M) {
      N(!0), F(``);
      try {
        if (m && u !== `new`) await s(`/supplier-team-groups/${encodeURIComponent(u.id)}/remove`, {
          version: u.version,
          targetGroupId: A || null,
          targetVersion: r.find(e => e.id === A)?.version
        }), y(o(`部门已删除`));
        else {
          let e = [...new Set([...w, ...S ? [S] : []])],
            t = {
              name: b.trim(),
              adminUserId: S || null,
              memberIds: e,
              version: u === `new` ? null : u.version,
              sourceVersions: Object.fromEntries(r.filter(t => t.id !== I && t.memberIds.some(t => e.includes(t))).map(e => [e.id, e.version]))
            };
          u === `new` ? await s(`/supplier-team-groups`, t) : await a(`/supplier-team-groups/${encodeURIComponent(u.id)}`, t), y(o(h ? `管理员已保存` : g ? `成员分配已保存` : `部门已保存`))
        }
        v(), _()
      } catch (e) {
        F(e.message)
      } finally {
        N(!1)
      }
    }
  }
  return (0, p.jsxs)(t, {
    title: m ? o(`删除部门`) : g ? o(`分配成员`) : h ? u !== `new` && u.adminUserId ? o(`更换管理员`) : o(`设置管理员`) : o(u === `new` ? `新增部门` : `编辑部门`),
    className: m || h ? `` : `supplier-department-editor`,
    onClose: () => !M && _(),
    children: [m ? (0, p.jsxs)(p.Fragment, {
      children: [(0, p.jsx)(`p`, {
        children: o(`删除部门“{0}”后，成员将转入目标部门，原管理员权限随即收回。`, [b])
      }), u !== `new` && u.memberIds.length > 0 && (0, p.jsxs)(`div`, {
        className: `field`,
        children: [(0, p.jsx)(`span`, {
          children: o(`成员转入部门`)
        }), (0, p.jsx)(l, {
          ariaLabel: o(`成员转入部门`),
          value: A,
          onChange: j,
          disabled: M,
          options: [{
            value: ``,
            label: o(`请选择目标部门`)
          }, ...r.filter(e => e.id !== I).map(e => ({
            value: e.id,
            label: e.name
          }))]
        }), !r.some(e => e.id !== I) && (0, p.jsx)(i, {
          children: o(`至少保留一个部门，请先新增部门并转移成员`)
        })]
      })]
    }) : (0, p.jsxs)(`div`, {
      className: `supplier-department-form`,
      children: [(h || g) && (0, p.jsx)(`p`, {
        children: o(`当前小组：{0}`, [b])
      }), !g && (0, p.jsxs)(`div`, {
        className: `form-grid`,
        children: [!h && (0, p.jsxs)(`label`, {
          className: `field`,
          children: [(0, p.jsx)(`span`, {
            children: o(`部门名称`)
          }), (0, p.jsx)(`input`, {
            maxLength: 100,
            disabled: M,
            value: b,
            placeholder: o(`如：交付组2`),
            onChange: e => x(e.target.value)
          })]
        }), (0, p.jsxs)(`div`, {
          className: h ? `field full` : `field`,
          children: [(0, p.jsx)(`span`, {
            children: o(`部门管理员`)
          }), (0, p.jsx)(l, {
            ariaLabel: o(`部门管理员`),
            value: S,
            disabled: M,
            onChange: e => {
              C(e), e && T(t => [...new Set([...t, e])])
            },
            options: [{
              value: ``,
              label: o(`请选择管理员`)
            }, ...R.filter(e => e.enabled).map(e => ({
              value: e.id,
              label: `${e.displayName} · ${e.username}`
            }))]
          })]
        })]
      }), (0, p.jsx)(`p`, {
        className: `supplier-department-help`,
        children: h ? o(`请选择本组已启用成员作为管理员，可查看日账、创建组员并分配已有项目。`) : (0, p.jsxs)(p.Fragment, {
          children: [o(`每名成员必须归属一个部门。管理员可管理本组成员及已有项目权限。`), ` `, o(`勾选其他部门成员后，保存时会将其调入本部门。原部门管理员需先更换管理员。`), u !== `new` && !u.adminUserId && (0, p.jsxs)(p.Fragment, {
            children: [` `, o(`历史成员已初始化分组，请指定部门管理员。`)]
          })]
        })
      }), h && !R.some(e => e.enabled) && (0, p.jsx)(i, {
        children: o(`请先在编辑部门中加入已启用成员，再设置管理员。`)
      }), !h && (0, p.jsxs)(p.Fragment, {
        children: [(0, p.jsxs)(`div`, {
          className: `supplier-department-member-heading`,
          children: [(0, p.jsxs)(`strong`, {
            children: [o(`部门成员`), ` `, (0, p.jsx)(`span`, {
              children: o(`已选 {0} 人`, [B])
            })]
          }), (0, p.jsx)(l, {
            ariaLabel: o(`成员分组筛选`),
            value: O,
            onChange: k,
            options: [{
              value: ``,
              label: o(`全部成员`)
            }, {
              value: `INSIDE`,
              label: o(`已在本组`)
            }, {
              value: `OUTSIDE`,
              label: o(`未在本组`)
            }]
          }), (0, p.jsx)(d, {
            value: E,
            onChange: D,
            placeholder: o(`搜索成员姓名或登录账号`)
          })]
        }), (0, p.jsx)(`div`, {
          className: `supplier-department-member-list`,
          role: `group`,
          "aria-label": o(`部门成员`),
          children: z.length ? z.map(e => {
            let t = L.get(e.id),
              n = !!t && t.id !== I,
              r = n && t.adminUserId === e.id,
              i = e.id === S,
              a = t?.id === I;
            return (0, p.jsxs)(`label`, {
              className: `supplier-department-member${r?` is-unavailable`:``}`,
              children: [(0, p.jsx)(`input`, {
                type: `checkbox`,
                "aria-label": `${e.displayName} · ${e.username}`,
                disabled: M || r || i || a,
                checked: w.includes(e.id) || i,
                onChange: t => T(n => t.target.checked ? [...n, e.id] : n.filter(t => t !== e.id))
              }), (0, p.jsxs)(`span`, {
                className: `supplier-department-member-identity`,
                children: [(0, p.jsx)(`strong`, {
                  children: e.displayName
                }), (0, p.jsx)(`small`, {
                  children: e.username
                })]
              }), (0, p.jsx)(`span`, {
                className: `supplier-department-member-role`,
                children: r ? o(`请先更换原部门管理员`) : i ? o(`部门管理员`) : a ? o(`已在本组`) : n ? o(`来自部门：{0}`, [t.name]) : e.enabled ? `` : o(`已停用`)
              })]
            }, e.id)
          }) : (0, p.jsx)(`p`, {
            className: `supplier-department-member-empty`,
            children: o(`没有匹配的成员`)
          })
        })]
      })]
    }), P && (0, p.jsx)(i, {
      tone: `red`,
      children: P
    }), (0, p.jsxs)(`footer`, {
      className: `dialog-footer`,
      children: [(0, p.jsx)(c, {
        disabled: M,
        onClick: _,
        children: o(`取消`)
      }), (0, p.jsx)(c, {
        variant: m ? `danger` : `primary`,
        disabled: M || m && u !== `new` && u.memberIds.length > 0 && !A || !m && (!b.trim() || V && !H),
        onClick: () => void U(),
        children: o(M ? `保存中…` : m ? `确认删除` : `保存`)
      })]
    })]
  })
}
export {
  m as
  default
};