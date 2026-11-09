// origin: assets/SupplierAgents-GOZSRGGY.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/IntakeAllocationDialog-CW0YASmn.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/labels-DaPzz6Ie.js", "assets/intake-D282aV6G.css", "assets/SupplierTeamGroups-Dk9m6lRm.js", "assets/SupplierMemberGroupDialog-7u5cN2us.js"]))) => i.map(i => d[i]);
import {
  C as e,
  G as t,
  S as n,
  X as r,
  Y as i,
  Z as a,
  c as o,
  f as s,
  g as c,
  h as l,
  i as u,
  it as ee,
  l as d,
  m as f,
  mt as p,
  pt as m,
  rt as h,
  s as g,
  u as _,
  vt as v,
  y as te
} from "./index-Dnr0i-H9.js";
var y = v(a(), 1),
  b = r();

function ne({
  groups: e,
  loading: t,
  error: n,
  selectedId: r,
  total: a,
  onSelect: o,
  onCreate: s,
  onRetry: c
}) {
  let u = (e, t, n, a) => (0, b.jsxs)(`button`, {
    type: `button`,
    className: `supplier-department-item${r===e?` active`:``}`,
    "aria-current": r === e ? `true` : void 0,
    onClick: () => o(e),
    children: [(0, b.jsx)(i, {
      name: a,
      size: 17
    }), (0, b.jsx)(`span`, {
      children: t
    }), (0, b.jsx)(`small`, {
      children: n
    })]
  }, e);
  return (0, b.jsxs)(`aside`, {
    className: `panel supplier-department-sidebar`,
    children: [(0, b.jsxs)(`div`, {
      className: `supplier-department-sidebar-heading`,
      children: [(0, b.jsx)(`h2`, {
        children: p(`团队部门`)
      }), (0, b.jsx)(g, {
        icon: `plus`,
        "aria-label": p(`新增部门`),
        onClick: s,
        disabled: t || !!n
      })]
    }), (0, b.jsxs)(`nav`, {
      "aria-label": p(`团队部门`),
      children: [u(``, p(`全部成员`), a, `users`), t ? (0, b.jsx)(l, {}) : n ? (0, b.jsxs)(`div`, {
        className: `supplier-department-error`,
        children: [(0, b.jsx)(`p`, {
          children: p(`部门加载失败`)
        }), (0, b.jsx)(g, {
          onClick: c,
          children: p(`重试`)
        })]
      }) : (0, b.jsxs)(b.Fragment, {
        children: [(0, b.jsx)(`div`, {
          className: `supplier-department-divider`
        }), e.map(e => u(e.id, e.name, e.memberIds.length, `building`))]
      })]
    }), !t && !n && e.length === 0 && (0, b.jsx)(`p`, {
      className: `supplier-department-sidebar-empty`,
      children: p(`创建部门，安排成员与管理员。`)
    })]
  })
}
var x = (0, y.lazy)(() => u(() => import(`./IntakeAllocationDialog-CW0YASmn.js`), __vite__mapDeps([0, 1, 2, 3, 4]))),
  re = (0, y.lazy)(() => u(() => import(`./SupplierTeamGroups-Dk9m6lRm.js`), __vite__mapDeps([5, 1, 2]))),
  S = (0, y.lazy)(() => u(() => import(`./SupplierMemberGroupDialog-7u5cN2us.js`), __vite__mapDeps([6, 1, 2])));

function C(e) {
  return e ? `category:${e}` : `uncategorized`
}

function ie(e) {
  let t = new Map;
  return e.forEach(e => t.set(C(e.category), e.categoryName || e.category || p(`未分类`))), [{
    value: ``,
    label: p(`全部大类`)
  }, ...Array.from(t, ([e, t]) => ({
    value: e,
    label: t
  })).sort((e, t) => e.label.localeCompare(t.label, m()))]
}

function w({
  agent: e,
  category: t,
  projectId: n,
  onShowAll: r
}) {
  let i = e.projects || [],
    a = i.filter(e => (!t || C(e.category) === t) && (!n || e.id === n));
  return i.length ? (0, b.jsxs)(`div`, {
    className: `supplier-agent-project-summary`,
    children: [(0, b.jsx)(`span`, {
      className: `supplier-agent-project-count`,
      children: n ? p(`当前项目 {0} 项 · 共 {1} 项`, [a.length, i.length]) : t ? p(`本类 {0} 项 · 共 {1} 项`, [a.length, i.length]) : p(`共 {0} 项`, [i.length])
    }), (0, b.jsx)(`div`, {
      className: `supplier-agent-project-tags`,
      children: a.slice(0, 3).map(e => (0, b.jsx)(`span`, {
        className: `supplier-agent-project-tag`,
        children: e.name
      }, e.id))
    }), (a.length > 3 || t || n) && (0, b.jsxs)(`button`, {
      className: `text-button`,
      onClick: r,
      children: [p(`查看全部 `), i.length, p(` 项 `)]
    })]
  }) : (0, b.jsx)(`span`, {
    className: `supplier-agent-unassigned`,
    children: p(`未分配`)
  })
}

function T({
  agent: r,
  onClose: i
}) {
  let {
    user: a,
    refresh: o,
    notify: s
  } = e(), u = a.role === `SUPPLIER_AGENT` && a.id === r.id, d = `/supplier-agents/${encodeURIComponent(r.id)}/projects`, f = n(d), [m, h] = (0, y.useState)([]), [v, ne] = (0, y.useState)(``), [x, re] = (0, y.useState)(``), [S, w] = (0, y.useState)(!1), [T, E] = (0, y.useState)(``);
  (0, y.useEffect)(() => {
    f.data && h(f.data.assignedIds)
  }, [f.data]);
  let D = f.data?.availableProjects || [],
    O = v.trim().toLocaleLowerCase(),
    k = D.filter(e => e.name.toLocaleLowerCase().includes(O) && (!x || C(e.category) === x));
  async function A() {
    if (!(u || S || f.loading || f.error || !f.data)) {
      w(!0), E(``);
      try {
        await ee(d, {
          projectIds: m
        }), o(), s(p(`成员项目权限已保存`)), i()
      } catch (e) {
        E(e.message)
      } finally {
        w(!1)
      }
    }
  }
  return (0, b.jsxs)(t, {
    title: p(`项目权限`),
    subtitle: r.displayName ? `${r.displayName} · ${r.username}` : r.username,
    className: `supplier-project-permissions`,
    onClose: () => !S && i(),
    children: [a.role === `SUPPLIER_AGENT` && (0, b.jsx)(c, {
      children: p(u ? `自己的项目权限由供应商分配。` : `仅可分配自己已有且可授权的项目；其他已有项目由供应商管理。`)
    }), f.loading ? (0, b.jsx)(l, {}) : f.error ? (0, b.jsxs)(c, {
      tone: `red`,
      children: [p(`项目权限加载失败：`), f.error]
    }) : (0, b.jsx)(b.Fragment, {
      children: D.length > 0 ? (0, b.jsxs)(b.Fragment, {
        children: [(0, b.jsxs)(`div`, {
          className: `supplier-project-permission-toolbar`,
          children: [(0, b.jsxs)(`div`, {
            className: `supplier-project-permission-summary`,
            children: [(0, b.jsxs)(`strong`, {
              children: [p(`已选 `), m.length, p(` 项`)]
            }), (0, b.jsx)(`span`, {
              children: O || x ? p(`显示 {0} / {1} 个项目`, [k.length, D.length]) : p(`共 {0} 个项目`, [D.length])
            })]
          }), (0, b.jsxs)(`div`, {
            className: `supplier-project-permission-actions`,
            children: [(0, b.jsx)(g, {
              disabled: S || u,
              onClick: () => h(e => D.filter(t => t.assignable !== !1 || e.includes(t.id)).map(e => e.id)),
              children: p(`全选全部可用项目 `)
            }), (0, b.jsx)(g, {
              disabled: S || u,
              onClick: () => h([]),
              children: p(`清空 `)
            })]
          })]
        }), (0, b.jsxs)(`div`, {
          className: `supplier-project-permission-search`,
          children: [(0, b.jsx)(te, {
            value: v,
            onChange: ne,
            placeholder: p(`搜索项目名称`)
          }), (0, b.jsx)(_, {
            ariaLabel: p(`权限项目大类筛选`),
            visual: `project`,
            value: x,
            onChange: re,
            options: ie(D)
          })]
        }), (0, b.jsx)(`div`, {
          className: `supplier-project-permission-list`,
          role: `group`,
          "aria-label": p(`项目授权列表`),
          children: k.length ? k.map(e => {
            let t = m.includes(e.id),
              n = e.assignable === !1;
            return (0, b.jsxs)(`label`, {
              className: `supplier-project-permission-option${t?` is-selected`:``}${n&&!t?` is-unavailable`:``}`,
              children: [(0, b.jsx)(`input`, {
                type: `checkbox`,
                "aria-label": e.name,
                checked: t,
                disabled: S || u || n && !t,
                onChange: t => h(n => t.target.checked ? [...n, e.id] : n.filter(t => t !== e.id))
              }), (0, b.jsxs)(`span`, {
                className: `supplier-project-permission-project`,
                children: [(0, b.jsx)(`span`, {
                  children: e.name
                }), n && (0, b.jsx)(`small`, {
                  children: p(`当前不可新增授权；取消后不能重新勾选。`)
                })]
              }), n && (0, b.jsx)(`span`, {
                className: `supplier-project-permission-history`,
                children: p(`历史授权`)
              })]
            }, e.id)
          }) : (0, b.jsx)(`p`, {
            className: `supplier-project-permission-empty`,
            children: p(`没有匹配的项目，请调整项目名称或大类。 `)
          })
        })]
      }) : (0, b.jsx)(c, {
        children: a.role === `SUPPLIER_AGENT` ? p(`暂无可分配项目，请联系供应商分配项目权限。`) : p(`暂无可分配项目，请先提交项目报价并等待审核通过。`)
      })
    }), T && (0, b.jsx)(c, {
      tone: `red`,
      children: T
    }), (0, b.jsxs)(`footer`, {
      className: `dialog-footer`,
      children: [(0, b.jsx)(`span`, {
        className: `supplier-project-permission-help`,
        children: a.role === `SUPPLIER_AGENT` ? p(`仅修改当前可管理的项目权限。`) : p(`未选择项目时，成员没有项目操作权限。 `)
      }), (0, b.jsx)(g, {
        disabled: S,
        onClick: i,
        children: p(`取消 `)
      }), v && (0, b.jsx)(g, {
        variant: `primary`,
        disabled: u || S || f.loading || !!f.error || !f.data,
        onClick: () => void A(),
        children: p(S ? `保存中…` : `保存`)
      })]
    })]
  })
}

function E({
  username: e,
  initialPassword: t,
  onDone: n
}) {
  return (0, b.jsxs)(b.Fragment, {
    children: [(0, b.jsx)(d, {
      items: [
        [p(`登录账号`), e],
        [p(`初始密码`), t ? (0, b.jsx)(`code`, {
          className: `wrap-code`,
          children: t
        }) : p(`使用创建时填写的密码`)]
      ]
    }), t && (0, b.jsx)(c, {
      tone: `amber`,
      children: p(`初始密码仅在此处显示一次，请先安全保存；关闭后无法再次查看。`)
    }), (0, b.jsx)(`footer`, {
      className: `dialog-footer`,
      children: (0, b.jsx)(g, {
        variant: `primary`,
        onClick: n,
        children: p(t ? `我已保存` : `完成`)
      })
    })]
  })
}

function D() {
  let {
    user: r,
    refresh: i,
    notify: a
  } = e(), [u, d] = (0, y.useState)(!1), v = r.role === `SUPPLIER`, D = r.teamAdminGroup, O = n(`/supplier-agents`), k = n(v ? `/supplier-team-groups` : null), [A, j] = (0, y.useState)(null), [M, ae] = (0, y.useState)(!1), [oe, se] = (0, y.useState)(!1), [ce, le] = (0, y.useState)(!1), [ue, de] = (0, y.useState)(null), [fe, pe] = (0, y.useState)(``), [N, me] = (0, y.useState)(``), P = new Map((k.data || []).flatMap(e => e.memberIds.map(t => [t, e]))), he = n(`/auth/registration-policy`), [ge, _e] = (0, y.useState)(!1), [F, ve] = (0, y.useState)(``), [ye, be] = (0, y.useState)(``), [I, xe] = (0, y.useState)(``), [L, R] = (0, y.useState)(null), [z, Se] = (0, y.useState)(null), [Ce, B] = (0, y.useState)(null), [V, H] = (0, y.useState)(null), [U, W] = (0, y.useState)(!1), [G, K] = (0, y.useState)(``), [we, Te] = (0, y.useState)(``), [q, Ee] = (0, y.useState)(``), [J, De] = (0, y.useState)(``), Y = k.data?.find(e => e.id === N), X = O.data?.find(e => e.id === Y?.adminUserId), Oe = Y ? Y.memberIds.length : (O.data || []).length, ke = (v ? `` : D?.name) || Y?.name || p(`全部成员`);

  function Z(e, t = !1, n = !1, r = !1) {
    ae(t), se(n), le(r), j(e)
  }
  let Ae = (O.data || []).flatMap(e => e.projects || []),
    je = [{
      value: ``,
      label: p(`全部报价项目`)
    }, ...Array.from(new Map(Ae.filter(e => !q || C(e.category) === q).map(e => [e.id, {
      value: e.id,
      label: e.name
    }])).values()).sort((e, t) => e.label.localeCompare(t.label, m()))],
    Me = we.trim().toLocaleLowerCase(),
    Ne = (O.data || []).filter(e => (!Me || `${e.displayName} ${e.username}`.toLocaleLowerCase().includes(Me)) && (!N || P.get(e.id)?.id === N) && (!q || e.projects?.some(e => C(e.category) === q)) && (!J || e.projects?.some(e => e.id === J))),
    Pe = F.trim() ? O.data?.some(e => e.username.toLowerCase() === F.trim().toLowerCase()) : !1,
    Q = he.data,
    Fe = Q ? [Q.requireUpper && p(`大写字母`), Q.requireLower && p(`小写字母`), Q.requireDigit && p(`数字`), Q.requireSymbol && p(`符号`)].filter(Boolean) : [],
    Ie = Q && I ? [(Array.from(I).length < Q.passwordMinLength || Array.from(I).length > Q.passwordMaxLength) && p(`长度须为 {0}—{1} 位`, [Q.passwordMinLength, Q.passwordMaxLength]), Q.requireUpper && !/\p{Lu}/u.test(I) && p(`大写字母`), Q.requireLower && !/\p{Ll}/u.test(I) && p(`小写字母`), Q.requireDigit && !/\p{Nd}/u.test(I) && p(`数字`), Q.requireSymbol && !/[^\p{L}\p{N}\s]/u.test(I) && p(`符号`)].filter(Boolean) : [];
  async function Le() {
    if (Pe) {
      K(p(v ? `本供应商已有这个登录账号，请在列表中重置密码或更换登录账号` : `登录账号已存在，请更换登录账号`));
      return
    }
    W(!0), K(``);
    try {
      let e = await h(`/supplier-agents`, {
        username: F.trim(),
        displayName: ye.trim(),
        password: I,
        groupId: v ? fe || null : D?.id
      });
      R({
        username: F.trim(),
        initialPassword: e.initialPassword,
        groupName: e.groupName
      }), ve(``), be(``), xe(``), i()
    } catch (e) {
      K(e.message)
    } finally {
      W(!1)
    }
  }
  async function Re(e) {
    if (!U) {
      W(!0);
      try {
        await ee(`/supplier-agents/${encodeURIComponent(e.id)}/enabled`, {
          enabled: !e.enabled,
          version: e.version
        }), i(), a(e.enabled ? p(`账号已停用`) : p(`账号已启用`))
      } catch (e) {
        K(e.message)
      } finally {
        W(!1)
      }
    }
  }
  async function ze(e) {
    if (!U) {
      W(!0);
      try {
        let t = await h(`/supplier-agents/${encodeURIComponent(e.id)}/password`, {
          password: ``
        });
        H(t.initialPassword), i()
      } catch (e) {
        K(e.message)
      } finally {
        W(!1)
      }
    }
  }

  function Be() {
    U || (_e(!1), R(null), K(``))
  }

  function $() {
    U || (Se(null), H(null), K(``))
  }
  return (0, b.jsxs)(`div`, {
    className: `supplier-team-page`,
    children: [(0, b.jsxs)(f, {
      title: p(`团队成员`),
      children: [v && (0, b.jsx)(g, {
        onClick: () => d(!0),
        children: p(`额度分配`)
      }), (0, b.jsx)(g, {
        variant: `primary`,
        disabled: v && (k.loading || !!k.error),
        onClick: () => {
          pe(Y?.id || k.data?.find(e => e.name === `交付组1`)?.id || k.data?.[0]?.id || ``), _e(!0), R(null), K(``)
        },
        children: p(`新增成员 `)
      })]
    }), u && (0, b.jsx)(y.Suspense, {
      fallback: (0, b.jsx)(l, {}),
      children: (0, b.jsx)(x, {
        onClose: () => d(!1)
      })
    }), !ge && !z && G && (0, b.jsx)(c, {
      tone: `red`,
      children: G
    }), k.error && (0, b.jsxs)(c, {
      tone: `red`,
      children: [p(`部门加载失败：`), k.error, (0, b.jsx)(g, {
        onClick: i,
        children: p(`重试`)
      })]
    }), (0, b.jsxs)(`div`, {
      className: `supplier-team-workspace${v?``:` supplier-team-workspace-single`}`,
      children: [v && (0, b.jsx)(ne, {
        groups: k.data || [],
        loading: k.loading,
        error: k.error,
        selectedId: N,
        total: (O.data || []).length,
        onSelect: me,
        onCreate: () => Z(`new`),
        onRetry: i
      }), (0, b.jsxs)(`section`, {
        className: `panel supplier-agents-panel`,
        children: [(0, b.jsxs)(`div`, {
          className: `supplier-department-content-heading`,
          children: [(0, b.jsxs)(`div`, {
            children: [(0, b.jsxs)(`h2`, {
              children: [ke, (0, b.jsx)(`span`, {
                children: p(`{0} 人`, [Oe])
              })]
            }), v ? Y ? (0, b.jsxs)(`p`, {
              children: [p(`部门管理员：{0}`, [X ? `${X.displayName} · ${X.username}${X.enabled?``:p(`（已停用）`)}` : Y.adminUserId ? p(`账号不可用`) : p(`待设置管理员`)]), (0, b.jsx)(`span`, {
                className: `supplier-group-pro-status${Y.allowPro===!1?` closed`:``}`,
                children: Y.allowPro === !1 ? p(`PRO停收`) : p(`PRO允许`)
              })]
            }) : (0, b.jsx)(`p`, {
              children: p(`选择左侧小组，可设置管理员或调整成员分组。`)
            }) : (0, b.jsx)(`p`, {
              children: p(`仅可为本组成员分配本人已有的项目权限；账号、密码和部门由供应商主账号管理。`)
            })]
          }), (0, b.jsxs)(`div`, {
            className: `supplier-department-content-actions`,
            children: [Y && (0, b.jsxs)(b.Fragment, {
              children: [(0, b.jsx)(g, {
                variant: `primary`,
                disabled: k.refreshing || O.loading || !!O.error,
                onClick: () => Z(Y, !1, !1, !0),
                children: p(`分配成员`)
              }), (0, b.jsx)(g, {
                icon: `users`,
                disabled: k.refreshing || O.loading || !!O.error,
                onClick: () => Z(Y, !1, !0),
                children: Y.adminUserId ? p(`更换管理员`) : p(`设置管理员`)
              }), (0, b.jsx)(g, {
                disabled: k.refreshing || O.loading || !!O.error,
                onClick: () => Z(Y),
                children: p(`编辑部门`)
              }), (0, b.jsx)(g, {
                disabled: k.refreshing,
                onClick: () => Z(Y, !0),
                children: p(`删除部门`)
              })]
            }), (0, b.jsx)(g, {
              icon: `refresh`,
              "aria-label": p(`刷新团队成员`),
              onClick: i
            })]
          })]
        }), (0, b.jsxs)(s, {
          children: [(0, b.jsx)(te, {
            value: we,
            onChange: Te,
            placeholder: p(`搜索成员姓名或登录账号`)
          }), (0, b.jsxs)(b.Fragment, {
            children: [(0, b.jsx)(_, {
              ariaLabel: p(`成员项目大类筛选`),
              visual: `project`,
              value: q,
              onChange: e => {
                Ee(e), De(``)
              },
              options: ie(Ae)
            }), (0, b.jsx)(_, {
              ariaLabel: p(`成员报价项目筛选`),
              visual: `project`,
              className: `supplier-agent-project-filter`,
              value: J,
              onChange: De,
              options: je,
              searchPlaceholder: p(`搜索报价项目`)
            })]
          })]
        }), (0, b.jsx)(o, {
          data: Ne,
          loading: O.loading,
          error: O.error,
          columns: [{
            label: p(`成员`),
            className: `supplier-agent-account-column`,
            render: e => (0, b.jsxs)(`div`, {
              className: `supplier-member-identity`,
              children: [(0, b.jsx)(`strong`, {
                children: e.displayName
              }), (0, b.jsx)(`small`, {
                children: e.username
              })]
            })
          }, {
            label: p(`所属部门`),
            className: `supplier-agent-department-column`,
            render: e => {
              let t = v ? P.get(e.id) : D ? {
                ...D,
                adminUserId: r.id
              } : void 0;
              return t ? (0, b.jsxs)(`div`, {
                className: `supplier-member-department`,
                children: [(0, b.jsx)(`span`, {
                  children: t.name
                }), t.adminUserId === e.id && (0, b.jsx)(`small`, {
                  children: p(`部门管理员`)
                })]
              }) : k.loading ? `…` : k.error ? `—` : (0, b.jsx)(`span`, {
                className: `muted`,
                children: `—`
              })
            }
          }, {
            label: p(`可操作项目`),
            className: `supplier-agent-projects-column`,
            render: e => (0, b.jsx)(w, {
              agent: e,
              category: q,
              projectId: J,
              onShowAll: () => B(e)
            })
          }, {
            label: p(`状态`),
            className: `supplier-agent-state-column`,
            render: e => (0, b.jsx)(`span`, {
              className: `supplier-member-state${e.enabled?` enabled`:``}`,
              children: e.enabled ? p(`启用`) : p(`停用`)
            })
          }, ...v ? [{
            label: p(`操作`),
            className: `supplier-agent-actions-column`,
            render: e => (0, b.jsxs)(`div`, {
              className: `supplier-agent-row-actions`,
              children: [(0, b.jsx)(g, {
                disabled: U,
                onClick: () => {
                  K(``), H(null), Se(e)
                },
                children: p(`重置密码 `)
              }), (0, b.jsx)(g, {
                disabled: U,
                onClick: () => void Re(e),
                children: e.enabled ? p(`停用`) : p(`启用`)
              }), (0, b.jsx)(g, {
                disabled: U,
                onClick: () => B(e),
                children: p(`权限管理 `)
              }), (0, b.jsx)(g, {
                disabled: U || P.get(e.id)?.adminUserId === e.id,
                title: P.get(e.id)?.adminUserId === e.id ? p(`请先更换原部门管理员`) : void 0,
                onClick: () => de(e),
                children: p(`调整分组`)
              })]
            })
          }] : [{
            label: p(`操作`),
            render: e => e.id === r.id ? `—` : (0, b.jsx)(g, {
              disabled: U,
              onClick: () => B(e),
              children: p(`权限管理 `)
            })
          }]]
        })]
      })]
    }), ge && (0, b.jsx)(t, {
      title: p(L ? `团队成员创建成功` : `新增团队成员`),
      onClose: Be,
      children: L ? (0, b.jsxs)(b.Fragment, {
        children: [(0, b.jsx)(c, {
          children: v ? p(`成员已加入{0}，请在列表中通过“权限管理”分配项目。`, [L.groupName]) : p(`成员已加入{0}，可在列表中分配你已有的项目。`, [D?.name || ``])
        }), (0, b.jsx)(E, {
          username: L.username,
          initialPassword: L.initialPassword,
          onDone: Be
        })]
      }) : (0, b.jsxs)(b.Fragment, {
        children: [(0, b.jsxs)(`div`, {
          className: `form-grid`,
          children: [v && (0, b.jsxs)(`div`, {
            className: `field`,
            children: [(0, b.jsx)(`span`, {
              children: p(`所属部门`)
            }), k.data?.length ? (0, b.jsx)(_, {
              ariaLabel: p(`新成员所属部门`),
              value: fe,
              onChange: pe,
              options: k.data.map(e => ({
                value: e.id,
                label: e.name
              }))
            }) : (0, b.jsx)(`input`, {
              readOnly: !0,
              value: p(`交付组1（自动创建）`)
            })]
          }), !v && (0, b.jsxs)(`label`, {
            className: `field`,
            children: [(0, b.jsx)(`span`, {
              children: p(`所属部门`)
            }), (0, b.jsx)(`input`, {
              value: D?.name || ``,
              readOnly: !0
            })]
          }), (0, b.jsxs)(`label`, {
            className: `field`,
            children: [(0, b.jsx)(`span`, {
              children: p(`登录账号`)
            }), (0, b.jsx)(`input`, {
              autoComplete: `off`,
              value: F,
              onChange: e => ve(e.target.value)
            })]
          }), (0, b.jsxs)(`label`, {
            className: `field`,
            children: [(0, b.jsx)(`span`, {
              children: p(`显示名称`)
            }), (0, b.jsx)(`input`, {
              value: ye,
              onChange: e => be(e.target.value)
            })]
          }), (0, b.jsxs)(`label`, {
            className: `field`,
            children: [(0, b.jsx)(`span`, {
              children: p(`初始密码（留空自动生成）`)
            }), (0, b.jsx)(`input`, {
              type: `password`,
              autoComplete: `new-password`,
              value: I,
              onChange: e => xe(e.target.value)
            }), Q && (0, b.jsxs)(`small`, {
              children: [p(`手动设置需 `), Q.passwordMinLength, `—`, Q.passwordMaxLength, p(` 位 `), Fe.length > 0 ? p(`，包含{0}`, [Fe.join(p(`、`))]) : ``, p(`；留空由系统生成。 `)]
            })]
          })]
        }), Ie.length > 0 && (0, b.jsxs)(c, {
          tone: `amber`,
          children: [p(`当前密码还需满足：`), Ie.join(p(`、`))]
        }), Pe && (0, b.jsx)(c, {
          tone: `amber`,
          children: p(v ? `这个登录账号已存在，可在列表中重置密码。` : `登录账号已存在，请更换登录账号`)
        }), G && (0, b.jsx)(c, {
          tone: `red`,
          children: G
        }), (0, b.jsxs)(`footer`, {
          className: `dialog-footer`,
          children: [(0, b.jsx)(g, {
            onClick: Be,
            disabled: U,
            children: p(`取消 `)
          }), (0, b.jsx)(g, {
            variant: `primary`,
            onClick: () => void Le(),
            disabled: U,
            children: p(U ? `创建中…` : `创建`)
          })]
        })]
      })
    }), z && (0, b.jsx)(t, {
      title: p(V === null ? `重置团队成员密码` : `密码重置成功`),
      onClose: $,
      children: V === null ? (0, b.jsxs)(b.Fragment, {
        children: [(0, b.jsxs)(`p`, {
          children: [p(`将为 `), z.username, p(` 生成新密码，并让该账号现有会话失效。`)]
        }), G && (0, b.jsx)(c, {
          tone: `red`,
          children: G
        }), (0, b.jsxs)(`footer`, {
          className: `dialog-footer`,
          children: [(0, b.jsx)(g, {
            disabled: U,
            onClick: $,
            children: p(`取消 `)
          }), (0, b.jsx)(g, {
            variant: `primary`,
            disabled: U,
            onClick: () => void ze(z),
            children: p(U ? `重置中…` : `确认重置`)
          })]
        })]
      }) : (0, b.jsx)(E, {
        username: z.username,
        initialPassword: V,
        onDone: $
      })
    }), Ce && (0, b.jsx)(T, {
      agent: Ce,
      onClose: () => B(null)
    }), ue && (0, b.jsx)(y.Suspense, {
      fallback: (0, b.jsx)(l, {}),
      children: (0, b.jsx)(S, {
        agent: ue,
        groups: k.data || [],
        onClose: () => de(null),
        onSaved: i
      })
    }), A && (0, b.jsx)(y.Suspense, {
      fallback: (0, b.jsx)(t, {
        title: p(`部门设置`),
        onClose: () => j(null),
        children: (0, b.jsx)(l, {})
      }),
      children: (0, b.jsx)(re, {
        agents: O.data || [],
        groups: k.data || [],
        group: A,
        removing: M,
        adminOnly: oe,
        membersOnly: ce,
        onClose: () => j(null),
        onSaved: () => {
          M && me(``), i()
        }
      }, `${A===`new`?`new`:A.id}:${M}:${oe}:${ce}`)
    })]
  })
}
export {
  D as
  default
};
