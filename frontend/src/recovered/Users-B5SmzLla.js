// origin: assets/Users-B5SmzLla.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/RoleEditor-D-Ljkwz-.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/system-user-roles-CUQaL0u7.css", "assets/ApiTokens-uH0R0C-_.js", "assets/ApiTokens-ooazcS4m.css"]))) => i.map(i => d[i]);
import {
  C as e,
  S as t,
  X as n,
  Z as r,
  _ as i,
  a,
  c as o,
  f as s,
  g as c,
  h as l,
  i as u,
  it as d,
  m as f,
  mt as p,
  o as ee,
  p as m,
  rt as h,
  s as g,
  u as _,
  vt as v,
  y
} from "./index-Dnr0i-H9.js";
import {
  CredentialDialog as te
} from "./AccountDialogs-DkF7YQod.js";
import {
  i as ne,
  r as re
} from "./QueryFilters-CwGBc_NH.js";
import {
  n as b
} from "./systemLabels-DqpNuQ-_.js"; /* empty css                          */
var x = v(r(), 1),
  S = n();

function C() {
  let [n, r] = (0, x.useState)([]), [l, u] = (0, x.useState)(!1), v = e => {
    r(e === `new` ? [] : (e.additionalRoles ?? []).map(e => e.code)), W(e)
  }, [C, oe] = (0, x.useState)(null), [T, E] = (0, x.useState)(null), {
    user: D,
    has: O,
    notify: k,
    refresh: A
  } = e(), [j, se] = (0, x.useState)(``), [M, N] = (0, x.useState)(``), [P, F] = (0, x.useState)(``), [I, L] = (0, x.useState)(``), [R, z] = (0, x.useState)(``), [B, V] = (0, x.useState)(1), [H, ce] = (0, x.useState)(10), [U, W] = (0, x.useState)(null), [G, K] = (0, x.useState)(null), [q, J] = (0, x.useState)(null), [Y, X] = (0, x.useState)(null), le = new URLSearchParams({
    search: j,
    supplierSearch: M,
    roleCode: P,
    enabled: I,
    online: R,
    page: String(B),
    size: String(H)
  }), Z = t(`/system/users?${le.toString()}`, 3e4), Q = t(`/system/roles`), $ = ne(O(`supplier.read`)), ue = Z.data?.items || [];
  return (0, S.jsxs)(S.Fragment, {
    children: [(0, S.jsx)(f, {
      title: p(`账号管理`),
      children: (0, S.jsx)(g, {
        icon: `plus`,
        variant: `primary`,
        onClick: () => v(`new`),
        children: p(`创建账号 `)
      })
    }), (0, S.jsxs)(`section`, {
      className: `panel`,
      children: [(0, S.jsxs)(s, {
        className: `audit-toolbar`,
        actions: (0, S.jsx)(g, {
          icon: `refresh`,
          "aria-label": p(`刷新账号`),
          onClick: A
        }),
        children: [(0, S.jsx)(y, {
          value: j,
          onChange: e => {
            se(e), V(1)
          },
          placeholder: p(`搜索姓名或登录账号`)
        }), (0, S.jsx)(re, {
          value: M,
          onChange: e => {
            N(e), V(1)
          },
          options: ($.data?.items || []).map(e => ({
            value: e.id,
            label: e.name,
            detail: e.code
          })),
          loading: $.loading,
          error: $.error,
          fallbackToText: !O(`supplier.read`)
        }), (0, S.jsx)(_, {
          compact: !0,
          ariaLabel: p(`筛选账号角色`),
          value: P,
          onChange: e => {
            F(e), V(1)
          },
          options: [{
            value: ``,
            label: p(`全部角色`)
          }, ...(Q.data?.roles || []).map(e => ({
            value: e.code,
            label: b(e)
          }))]
        }), (0, S.jsx)(_, {
          compact: !0,
          ariaLabel: p(`筛选账号状态`),
          value: I,
          onChange: e => {
            L(e), V(1)
          },
          options: [{
            value: ``,
            label: p(`全部状态`)
          }, {
            value: `true`,
            label: p(`启用`),
            tone: `approved`
          }, {
            value: `false`,
            label: p(`停用`),
            tone: `withdrawn`
          }]
        }), (0, S.jsx)(_, {
          compact: !0,
          ariaLabel: p(`筛选是否在线`),
          value: R,
          onChange: e => {
            z(e), V(1)
          },
          options: [{
            value: ``,
            label: p(`是否在线`)
          }, {
            value: `true`,
            label: p(`在线`),
            tone: `approved`
          }, {
            value: `false`,
            label: p(`离线`),
            tone: `withdrawn`
          }]
        }), (j || M || P || I || R) && (0, S.jsx)(`button`, {
          className: `text-button muted`,
          type: `button`,
          onClick: () => {
            se(``), N(``), F(``), L(``), z(``), V(1)
          },
          children: p(`清除筛选 `)
        })]
      }), (0, S.jsx)(o, {
        data: ue,
        loading: Z.loading,
        error: Z.error,
        columns: [{
          label: p(`用户`),
          render: (e, t) => (0, S.jsxs)(`div`, {
            className: `identity`,
            children: [(0, S.jsx)(a, {
              name: e.displayName,
              index: t
            }), (0, S.jsxs)(`div`, {
              children: [(0, S.jsx)(`strong`, {
                children: e.displayName
              }), (0, S.jsx)(`small`, {
                children: e.username
              })]
            })]
          })
        }, {
          label: p(`角色`),
          render: e => (0, S.jsxs)(`div`, {
            className: `account-role-tags`,
            children: [(0, S.jsx)(`span`, {
              className: `platform-tag`,
              children: b({
                code: e.roleCode,
                name: e.roleName || e.roleCode
              })
            }), (e.additionalRoles ?? []).map(e => (0, S.jsx)(`span`, {
              className: `platform-tag`,
              children: b(e)
            }, e.code))]
          })
        }, {
          label: p(`所属范围`),
          render: e => e.roleCode === `SUPPLIER` || e.roleCode === `SUPPLIER_AGENT` ? e.supplierName || p(`待关联供应商`) : p(`平台`)
        }, {
          label: p(`状态`),
          render: e => (0, S.jsx)(ee, {
            state: e.enabled ? `APPROVED` : `WITHDRAWN`,
            label: e.enabled ? p(`启用`) : p(`停用`)
          })
        }, {
          label: p(`是否在线`),
          render: e => (0, S.jsx)(ee, {
            state: e.online ? `APPROVED` : `WITHDRAWN`,
            label: e.online ? p(`在线`) : p(`离线`)
          })
        }, {
          label: p(`操作`),
          render: e => (0, S.jsxs)(`div`, {
            className: `row-actions`,
            children: [(0, S.jsx)(`button`, {
              className: `text-button`,
              disabled: e.id === D.id,
              onClick: () => v(e),
              children: p(`编辑 `)
            }), (0, S.jsx)(`button`, {
              className: `text-button`,
              disabled: e.id === D.id,
              onClick: () => oe(e),
              children: e.enabled ? p(`停用`) : p(`启用`)
            }), (0, S.jsx)(`button`, {
              className: `text-button`,
              disabled: e.id === D.id,
              onClick: () => K(e),
              children: p(`重置密码 `)
            }), D.role === `ADMIN` && !D.supplierId && (0, S.jsx)(`button`, {
              className: `text-button`,
              onClick: () => E(e),
              children: p(`API 密钥 `)
            }), (0, S.jsx)(`button`, {
              className: `text-button`,
              disabled: e.id === D.id,
              onClick: () => J(e),
              children: p(`强制登出 `)
            })]
          })
        }]
      }), (0, S.jsx)(i, {
        data: Z.data,
        page: B,
        onPage: V,
        size: H,
        onSizeChange: e => {
          ce(e), V(1)
        }
      })]
    }), C && (0, S.jsx)(m, {
      title: p(`{0}账号 · {1}`, [C.enabled ? p(`停用`) : p(`启用`), C.displayName]),
      fields: [],
      submitLabel: C.enabled ? p(`确认停用`) : p(`确认启用`),
      extra: () => (0, S.jsx)(c, {
        tone: C.enabled ? `amber` : `blue`,
        children: C.enabled ? p(`停用后，{0} 将立即退出登录且无法再次登录，历史资源和账单保留。`, [C.username]) : p(`启用后，{0} 可重新登录，原角色和所属供应商保持不变。`, [C.username])
      }),
      onClose: () => oe(null),
      onSubmit: async () => {
        await d(`/system/users/${C.id}/enabled`, {
          enabled: !C.enabled,
          version: C.version
        }), A(), k(C.enabled ? p(`账号已停用`) : p(`账号已启用`))
      }
    }), Y && (0, S.jsx)(te, {
      value: Y,
      onClose: () => X(null)
    }), T && (0, S.jsx)(ae, {
      userId: T.id,
      username: T.username,
      onClose: () => E(null)
    }), U === `new` && (0, S.jsx)(m, {
      title: p(`创建账号`),
      fields: [{
        name: `displayName`,
        label: p(`显示名称`)
      }, {
        name: `username`,
        label: p(`登录账号`)
      }, {
        name: `password`,
        label: p(`初始密码`),
        type: `password`,
        required: !1,
        full: !0,
        placeholder: p(`留空则按系统参数随机生成`)
      }, {
        name: `roleCode`,
        label: p(`基础角色`),
        type: `select`,
        visual: `role`,
        options: (Q.data?.roles || []).filter(e => [`ADMIN`, `OPERATOR`, `FINANCE`, `SUPPLIER`, `SUPPLIER_AGENT`].includes(e.code) && e.builtIn).map(e => ({
          value: e.code,
          label: b(e)
        }))
      }, {
        name: `supplierId`,
        label: p(`所属供应商`),
        required: !1,
        type: `select`,
        visual: `supplier`,
        options: ($.data?.items || []).map(e => ({
          value: e.id,
          label: e.name
        })),
        visible: e => [`SUPPLIER`, `SUPPLIER_AGENT`].includes(e.roleCode),
        hint: p(`可先创建用户，在新建供应商时关联；关联前不能登录`)
      }],
      extra: e => (0, S.jsx)(w, {
        roles: Q.data?.roles ?? [],
        primary: e.roleCode,
        selected: n,
        onChange: r,
        onCreate: O(`system.roles`) ? () => u(!0) : void 0,
        loading: Q.loading,
        error: Q.error
      }),
      initial: {
        roleCode: `SUPPLIER`
      },
      onClose: () => W(null),
      onSubmit: async e => {
        let t = await h(`/system/users`, {
          ...e,
          password: e.password || null,
          supplierId: [`SUPPLIER`, `SUPPLIER_AGENT`].includes(e.roleCode) && e.supplierId || null,
          additionalRoleCodes: n.filter(code => {
            const primary = Q.data.roles.find(role => role.code === e.roleCode);
            const extra = Q.data.roles.find(role => role.code === code);
            return extra && !extra.builtIn && extra.scopeType === e.roleCode && extra.permissions.every(permission => primary?.allowedPermissions?.includes(permission));
          })
        });
        X({
          ...t,
          username: e.username
        }), A(), k(p(`账号已创建`))
      }
    }), U && U !== `new` && (0, S.jsx)(m, {
      title: p(`编辑账号 · {0}`, [U.displayName]),
      fields: [{
        name: `roleCode`,
        label: p(`基础角色`),
        type: `select`,
        visual: `role`,
        full: !0,
        options: (Q.data?.roles || []).filter(e => e.builtIn && [`ADMIN`, `OPERATOR`, `FINANCE`, `SUPPLIER`, `SUPPLIER_AGENT`].includes(e.code) && (U.roleCode === `SUPPLIER` || U.roleCode === `SUPPLIER_AGENT` ? e.code === U.roleCode : e.code !== `SUPPLIER` && e.code !== `SUPPLIER_AGENT`)).map(e => ({
          value: e.code,
          label: b(e)
        }))
      }, {
        name: `enabled`,
        label: p(`状态`),
        type: `select`,
        options: [{
          value: `true`,
          label: p(`启用`),
          tone: `approved`
        }, {
          value: `false`,
          label: p(`停用`),
          tone: `withdrawn`
        }]
      }],
      extra: e => (0, S.jsx)(w, {
        roles: Q.data?.roles ?? [],
        primary: e.roleCode,
        selected: n,
        onChange: r,
        onCreate: O(`system.roles`) ? () => u(!0) : void 0,
        loading: Q.loading,
        error: Q.error
      }),
      initial: {
        roleCode: U.roleCode,
        enabled: String(U.enabled)
      },
      onClose: () => W(null),
      onSubmit: async e => {
        await d(`/system/users/` + U.id, {
          roleCode: e.roleCode,
          enabled: e.enabled === `true`,
          version: U.version,
          additionalRoleCodes: n.filter(code => {
            const primary = Q.data.roles.find(role => role.code === e.roleCode);
            const extra = Q.data.roles.find(role => role.code === code);
            return extra && !extra.builtIn && extra.scopeType === e.roleCode && extra.permissions.every(permission => primary?.allowedPermissions?.includes(permission));
          })
        }), A(), k(p(`账号设置已保存`))
      }
    }), l && Q.data && (0, S.jsx)(ie, {
      role: `new`,
      permissions: Q.data.permissions,
      scopeTypes: Q.data.scopeTypes || [],
      onClose: () => u(!1),
      onSaved: () => {
        u(!1), A(), k(p(`自定义角色已创建，可勾选分配`))
      }
    }), G && (0, S.jsx)(m, {
      title: p(`重置密码 · {0}`, [G.displayName]),
      fields: [{
        name: `password`,
        label: p(`新初始密码`),
        type: `password`,
        full: !0,
        required: !1,
        placeholder: p(`留空则按系统参数随机生成`)
      }],
      extra: () => (0, S.jsx)(c, {
        tone: `amber`,
        children: p(`重置后旧会话失效，首次登录要求遵循当前系统参数。`)
      }),
      onClose: () => K(null),
      onSubmit: async e => {
        let t = await h(`/system/users/${G.id}/password`, {
          password: e.password || null
        });
        X({
          ...t,
          username: G.username
        }), A(), k(p(`密码已重置`))
      }
    }), q && (0, S.jsx)(m, {
      title: p(`强制登出 · {0}`, [q.displayName]),
      fields: [],
      submitLabel: p(`强制登出`),
      extra: () => (0, S.jsxs)(c, {
        tone: `amber`,
        children: [p(`将立即结束 `), q.username, p(` 的全部登录会话。对方需要重新登录。 `)]
      }),
      onClose: () => J(null),
      onSubmit: async () => {
        await h(`/system/users/${q.id}/logout`, {}), A(), k(p(`已强制登出`))
      }
    })]
  })
}

function w({
  roles: e,
  primary: t,
  selected: n,
  onChange: r,
  onCreate: i,
  loading: a,
  error: o
}) {
  let [s, u] = (0, x.useState)(``), primary = e.find(role => role.code === t), allowed = new Set(primary?.allowedPermissions || []), d = e.filter(role => !role.builtIn && role.code !== t && primary?.scopeType && role.scopeType === primary.scopeType && role.permissions.every(permission => allowed.has(permission))), f = d.filter(e => `${b(e)} ${e.code}`.toLowerCase().includes(s.toLowerCase()));
  return (0, S.jsxs)(`section`, {
    className: `account-role-picker`,
    "aria-label": p(`附加自定义角色`),
    children: [(0, S.jsxs)(`div`, {
      className: `account-role-picker-heading`,
      children: [(0, S.jsx)(`strong`, {
        children: p(`自定义角色 · 可多选`)
      }), i && (0, S.jsx)(g, {
        onClick: i,
        disabled: a || !!o,
        children: p(`新建角色 `)
      })]
    }), (0, S.jsx)(`p`, {
      className: `muted small`,
      children: p(`仅显示与主身份同范围且不超出职责上限的自定义角色；附加角色不能改变平台身份或供应商归属。`)
    }), a ? (0, S.jsx)(l, {}) : o ? (0, S.jsxs)(c, {
      tone: `red`,
      children: [p(`角色加载失败：`), o]
    }) : d.length === 0 ? (0, S.jsx)(`p`, {
      className: `muted`,
      children: p(`暂无自定义角色，可先新建角色并配置权限。`)
    }) : (0, S.jsxs)(S.Fragment, {
      children: [(0, S.jsx)(y, {
        value: s,
        onChange: u,
        placeholder: p(`搜索自定义角色名称或标识`)
      }), (0, S.jsx)(`div`, {
        className: `account-role-options`,
        children: f.map(e => (0, S.jsxs)(`label`, {
          className: `account-role-option${n.includes(e.code)?` selected`:``}`,
          children: [(0, S.jsx)(`input`, {
            type: `checkbox`,
            checked: n.includes(e.code),
            onChange: t => r(t.target.checked ? [...n, e.code] : n.filter(t => t !== e.code))
          }), (0, S.jsxs)(`span`, {
            children: [(0, S.jsx)(`strong`, {
              children: b(e)
            }), (0, S.jsxs)(`small`, {
              children: [e.code, ` · `, e.permissions.length, p(` 项权限 `)]
            })]
          })]
        }, e.code))
      }), f.length === 0 && (0, S.jsx)(`p`, {
        className: `muted`,
        children: p(`没有匹配的自定义角色`)
      }), (0, S.jsxs)(`small`, {
        className: `muted`,
        children: [p(`已选 `), n.filter(e => d.some(t => t.code === e)).length, ` `, p(`个自定义角色 `)]
      })]
    })]
  })
}
var ie = (0, x.lazy)(() => u(() => import(`./RoleEditor-D-Ljkwz-.js`).then(e => ({
    default: e.RoleEditor
  })), __vite__mapDeps([0, 1, 2, 3]))),
  ae = (0, x.lazy)(() => u(() => import(`./ApiTokens-uH0R0C-_.js`).then(e => ({
    default: e.ApiTokensDialog
  })), __vite__mapDeps([4, 1, 2, 5])));
export {
  C as Users
};
