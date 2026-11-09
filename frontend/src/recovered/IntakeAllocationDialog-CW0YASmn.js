// origin: assets/IntakeAllocationDialog-CW0YASmn.js
import {
  C as e,
  G as t,
  S as n,
  X as r,
  Z as i,
  b as a,
  g as o,
  h as s,
  it as c,
  mt as l,
  s as u,
  u as d,
  vt as f,
  y as p
} from "./index-Dnr0i-H9.js";
import {
  t as m
} from "./labels-DaPzz6Ie.js"; /* empty css               */
var h = f(i(), 1),
  g = r(),
  _ = e => e === null ? `` : String(e / 100),
  v = e => e.trim() === `` ? null : Math.round(Number(e) * 100);

function y({
  onClose: r
}) {
  let {
    user: i,
    has: f,
    notify: y,
    refresh: b
  } = e(), x = i.role === `SUPPLIER` && f(`supplier.agent.manage`), S = n(x ? `/cc-intake/allocations` : null), [C, w] = (0, h.useState)(null), [T, E] = (0, h.useState)([]), [D, O] = (0, h.useState)(``), [k, A] = (0, h.useState)(``), [j, M] = (0, h.useState)(!1), [N, P] = (0, h.useState)(1), [F, I] = (0, h.useState)(!1), [L, R] = (0, h.useState)(``);

  function z(e) {
    w(e), R(``);
    let t = new Map(e.allocations.map(e => [`${e.kind}:${e.subjectId}`, e])),
      n = [];
    for (let r of e.groups) {
      let e = t.get(`GROUP:${r.id}`);
      n.push({
        key: `G:${r.id}`,
        kind: `GROUP`,
        subjectId: r.id,
        parentGroupId: null,
        allowPro: r.allowPro !== !1,
        pro: _(e?.proBasisPoints ?? null),
        nonPro: _(e?.nonProBasisPoints ?? null)
      })
    }
    for (let r of e.members) {
      let e = t.get(`USER:${r.id}`);
      n.push({
        key: `U:${r.id}`,
        kind: `USER`,
        subjectId: r.id,
        parentGroupId: e?.parentGroupId ?? null,
        pro: _(e?.proBasisPoints ?? null),
        nonPro: _(e?.nonProBasisPoints ?? null)
      })
    }
    E(n)
  }(0, h.useEffect)(() => {
    S.data && z(S.data)
  }, [S.data]);
  let B = (e, t) => E(n => n.map(n => n.key === e ? {
      ...n,
      ...t
    } : n)),
    V = T.filter(e => {
      if (e.kind !== `USER`) return !1;
      let t = C?.members.find(t => t.id === e.subjectId),
        n = D.trim().toLocaleLowerCase();
      return (!n || [t?.username, t?.displayName].some(e => e?.toLocaleLowerCase().includes(n))) && (!k || C?.memberships.some(t => t.userId === e.subjectId && t.groupId === k)) && (!j || e.pro !== `` || e.nonPro !== ``)
    });
  (0, h.useEffect)(() => P(e => Math.max(1, Math.min(e, Math.ceil(V.length / 20)))), [V.length]);
  let H = (e, t) => {
      if (!C || e[t].trim() === ``) return null;
      let n = t === `pro` ? C.proLimit : C.nonProLimit;
      if (e.parentGroupId) {
        let r = T.find(t => t.key === `G:${e.parentGroupId}`);
        n = r ? H(r, t) : null
      }
      return n === null ? null : Math.floor(n * Number(e[t]) / 100)
    },
    U = (e, t) => C?.usage.find(n => n.source === e && n.category === (t === `pro` ? `PRO` : `NON_PRO`))?.used,
    W = (e, t) => {
      if (!C) return null;
      let n = e === `S` ? null : T.find(t => t.key === e),
        r = e === `S` ? t === `pro` ? C.proLimit : C.nonProLimit : n ? H(n, t) : null;
      if (r === null) return null;
      let i = U(e, t) ?? 0,
        a = T.filter(n => n[t].trim() !== `` && (e === `S` ? n.parentGroupId === null : n.parentGroupId === e.substring(2))).reduce((e, n) => e + Math.max(0, (H(n, t) ?? 0) - (U(n.key, t) ?? 0)), 0);
      return Math.max(0, r - i - a)
    };

  function G(e, t, n) {
    let r = e.kind === `USER` ? C?.memberships.find(t => t.userId === e.subjectId)?.groupId : null,
      i = C?.groups.find(e => e.id === r),
      a = C?.allocations.find(t => t.kind === `USER` && t.subjectId === e.subjectId)?.parentGroupId,
      o = a && a !== r ? {
        id: a,
        name: C?.groups.find(e => e.id === a)?.name || l(`原交付组`)
      } : null;
    return (0, g.jsxs)(`tr`, {
      children: [(0, g.jsxs)(`th`, {
        scope: `row`,
        children: [(0, g.jsx)(`strong`, {
          children: t
        }), n && n !== t && (0, g.jsx)(`small`, {
          children: n
        }), e.kind === `GROUP` && (0, g.jsx)(`small`, {
          children: l(`供应商总额度`)
        })]
      }), (0, g.jsx)(`td`, {
        children: e.kind === `GROUP` ? (0, g.jsxs)(`label`, {
          className: `cc-intake-pro-toggle`,
          children: [(0, g.jsx)(`input`, {
            type: `checkbox`,
            role: `switch`,
            "aria-label": l(`允许{0}上 PRO`, [t]),
            checked: e.allowPro !== !1,
            disabled: F,
            onChange: t => B(e.key, {
              allowPro: t.target.checked
            })
          }), (0, g.jsx)(`span`, {
            className: `cc-intake-pro-track`,
            "aria-hidden": `true`
          }), (0, g.jsx)(`span`, {
            children: e.allowPro === !1 ? l(`已关闭`) : l(`允许`)
          })]
        }) : (0, g.jsx)(d, {
          ariaLabel: l(`{0}额度来源`, [t]),
          value: e.parentGroupId ?? ``,
          disabled: F,
          onChange: t => B(e.key, {
            parentGroupId: t || null
          }),
          options: [{
            value: ``,
            label: l(`供应商直接划拨`)
          }, ...i ? [{
            value: i.id,
            label: l(`来自{0}`, [i.name])
          }] : [], ...o ? [{
            value: o.id,
            label: l(`原额度来源：{0}`, [o.name])
          }] : []]
        })
      }), [`pro`, `nonPro`].map(n => (0, g.jsxs)(`td`, {
        children: [(0, g.jsxs)(`div`, {
          className: `cc-intake-ratio`,
          children: [(0, g.jsx)(`input`, {
            type: `number`,
            min: `0`,
            max: `100`,
            step: `0.01`,
            placeholder: l(`共享`),
            value: e[n],
            disabled: F,
            "aria-label": l(`{0}：{1}分配比例`, [t, n === `pro` ? `PRO` : l(`非PRO`)]),
            onChange: t => B(e.key, {
              [n]: t.target.value
            })
          }), (0, g.jsx)(`span`, {
            children: `%`
          })]
        }), (0, g.jsxs)(`small`, {
          className: `cc-intake-ratio-meta`,
          children: [e[n].trim() !== `` && (0, g.jsxs)(g.Fragment, {
            children: [H(e, n) === null ? l(`请先明确上级数量`) : l(`每日{0}个`, [m(H(e, n))]), (0, g.jsx)(`span`, {
              "aria-hidden": `true`,
              children: ` · `
            })]
          }), l(`今日已用：{0}`, [U(e.key, n) === void 0 ? `—` : m(U(e.key, n))])]
        })]
      }, n)), (0, g.jsx)(`td`, {
        children: (0, g.jsx)(u, {
          type: `button`,
          "aria-label": l(`{0}：回收未用额度`, [t]),
          disabled: F || e.pro === `` && e.nonPro === ``,
          onClick: () => {
            if (e.kind === `GROUP` && T.some(t => t.parentGroupId === e.subjectId && (t.pro !== `` || t.nonPro !== ``))) {
              R(l(`回收交付组额度前，请先回收或调整组内个人划拨。`));
              return
            }
            B(e.key, {
              pro: ``,
              nonPro: ``
            })
          },
          children: l(`回收额度`)
        })
      })]
    }, e.key)
  }
  return (0, g.jsx)(t, {
    title: l(`CC每日上号额度分配`),
    onClose: r,
    wide: !0,
    className: `cc-intake-allocation-dialog`,
    children: x ? S.error && !C ? (0, g.jsxs)(o, {
      tone: `red`,
      children: [S.error, (0, g.jsx)(u, {
        onClick: S.reload,
        children: l(`重新加载`)
      })]
    }) : C ? (0, g.jsxs)(`form`, {
      onSubmit: async e => {
        if (e.preventDefault(), F) return;
        R(``);
        let t = [];
        for (let e of T)
          if (e.pro !== `` || e.nonPro !== ``) {
            for (let t of [`pro`, `nonPro`])
              if (e[t] !== `` && (!/^\d+(?:\.\d{1,2})?$/.test(e[t]) || Number(e[t]) > 100)) {
                R(l(`分配比例须在0%至100%之间，最多两位小数`));
                return
              } t.push({
              kind: e.kind,
              subjectId: e.subjectId,
              parentGroupId: e.parentGroupId,
              proBasisPoints: v(e.pro),
              nonProBasisPoints: v(e.nonPro)
            })
          } let n = new Map;
        for (let e of t)
          for (let t of [`proBasisPoints`, `nonProBasisPoints`])
            if (e[t] !== null) {
              let r = `${e.parentGroupId??`S`}:${t}`,
                i = (n.get(r) ?? 0) + e[t];
              if (n.set(r, i), i > 1e4) {
                R(l(`同级划拨比例不能超过100%`));
                return
              }
            } I(!0);
        try {
          z(await c(`/cc-intake/allocations`, {
            allocations: t,
            groupPro: T.filter(e => e.kind === `GROUP`).filter(e => {
              let t = C.groups.find(t => t.id === e.subjectId);
              return e.allowPro !== (t?.allowPro !== !1)
            }).map(e => ({
              id: e.subjectId,
              allowPro: e.allowPro !== !1,
              version: C.groups.find(t => t.id === e.subjectId).version
            })),
            version: C.version
          })), y(l(`上号额度分配已保存`)), b()
        } catch (e) {
          R(e.message)
        } finally {
          I(!1)
        }
      },
      children: [(0, g.jsx)(`div`, {
        className: `cc-intake-allocation-summary`,
        children: [`pro`, `nonPro`].map(e => (0, g.jsxs)(`div`, {
          children: [(0, g.jsx)(`strong`, {
            children: e === `pro` ? `PRO` : l(`非PRO`)
          }), (0, g.jsxs)(`span`, {
            children: [l(`每日额度`), ` `, (0, g.jsx)(`b`, {
              children: m(e === `pro` ? C.proLimit : C.nonProLimit)
            })]
          }), (0, g.jsxs)(`span`, {
            children: [l(`共享剩余`), ` `, (0, g.jsx)(`b`, {
              children: m(W(`S`, e))
            })]
          })]
        }, e))
      }), (0, g.jsxs)(`p`, {
        className: `cc-intake-allocation-hint`,
        children: [l(`留空共享，0%不分配。`), (C.proLimit === null || C.nonProLimit === null) && (0, g.jsx)(`span`, {
          children: l(`比例划拨需先由平台设置每日数量。`)
        })]
      }), (0, g.jsxs)(`div`, {
        className: `cc-intake-allocation-heading`,
        children: [(0, g.jsx)(`h3`, {
          children: l(`交付组划拨`)
        }), (0, g.jsx)(`span`, {
          children: l(`关闭 PRO 不影响非PRO，保留原额度配置。`)
        })]
      }), (0, g.jsx)(a, {
        ariaLabel: l(`交付组上号额度分配`),
        children: (0, g.jsxs)(`table`, {
          className: `cc-intake-table`,
          children: [(0, g.jsx)(`thead`, {
            children: (0, g.jsxs)(`tr`, {
              children: [(0, g.jsx)(`th`, {
                children: l(`交付组`)
              }), (0, g.jsx)(`th`, {
                children: l(`允许 PRO`)
              }), (0, g.jsx)(`th`, {
                children: `PRO`
              }), (0, g.jsx)(`th`, {
                children: l(`非PRO`)
              }), (0, g.jsx)(`th`, {
                children: l(`操作`)
              })]
            })
          }), (0, g.jsxs)(`tbody`, {
            children: [!C.groups.length && (0, g.jsx)(`tr`, {
              children: (0, g.jsx)(`td`, {
                colSpan: 5,
                children: l(`暂无交付组`)
              })
            }), T.filter(e => e.kind === `GROUP`).map(e => G(e, C.groups.find(t => t.id === e.subjectId)?.name || `—`))]
          })]
        })
      }), (0, g.jsxs)(`div`, {
        className: `cc-intake-allocation-heading`,
        children: [(0, g.jsx)(`h3`, {
          children: l(`个人划拨`)
        }), (0, g.jsx)(`span`, {
          children: l(`{0}位成员`, [C.members.length])
        })]
      }), (0, g.jsxs)(`div`, {
        className: `cc-intake-member-filters`,
        children: [(0, g.jsx)(p, {
          value: D,
          onChange: e => {
            O(e), P(1)
          },
          placeholder: l(`搜索成员姓名或账号`)
        }), (0, g.jsx)(d, {
          ariaLabel: l(`按交付组筛选成员`),
          value: k,
          onChange: e => {
            A(e), P(1)
          },
          options: [{
            value: ``,
            label: l(`全部交付组`)
          }, ...C.groups.map(e => ({
            value: e.id,
            label: e.name
          }))]
        }), (0, g.jsxs)(`label`, {
          className: `policy-check`,
          children: [(0, g.jsx)(`input`, {
            type: `checkbox`,
            checked: j,
            onChange: e => {
              M(e.target.checked), P(1)
            }
          }), l(`仅看已划拨成员`)]
        })]
      }), (D || k || j) && (0, g.jsx)(`p`, {
        className: `cc-intake-filter-count`,
        children: l(`显示{0}／{1}位成员`, [V.length, C.members.length])
      }), (0, g.jsx)(a, {
        ariaLabel: l(`个人上号额度分配`),
        children: (0, g.jsxs)(`table`, {
          className: `cc-intake-table`,
          children: [(0, g.jsx)(`thead`, {
            children: (0, g.jsxs)(`tr`, {
              children: [(0, g.jsx)(`th`, {
                children: l(`成员`)
              }), (0, g.jsx)(`th`, {
                children: l(`额度来源`)
              }), (0, g.jsx)(`th`, {
                children: `PRO`
              }), (0, g.jsx)(`th`, {
                children: l(`非PRO`)
              }), (0, g.jsx)(`th`, {
                children: l(`操作`)
              })]
            })
          }), (0, g.jsxs)(`tbody`, {
            children: [!V.length && (0, g.jsx)(`tr`, {
              children: (0, g.jsx)(`td`, {
                colSpan: 5,
                children: l(`暂无匹配成员`)
              })
            }), V.slice((N - 1) * 20, N * 20).map(e => {
              let t = C.members.find(t => t.id === e.subjectId);
              return G(e, t?.displayName || t?.username || `—`, t?.username)
            })]
          })]
        })
      }), V.length > 20 && (0, g.jsxs)(`div`, {
        className: `cc-priority-pages`,
        children: [(0, g.jsx)(u, {
          type: `button`,
          disabled: N <= 1,
          onClick: () => P(N - 1),
          children: l(`上一页`)
        }), (0, g.jsx)(`span`, {
          children: l(`第 {0} / 共 {1} 页`, [N, Math.ceil(V.length / 20)])
        }), (0, g.jsx)(u, {
          type: `button`,
          disabled: N * 20 >= V.length,
          onClick: () => P(N + 1),
          children: l(`下一页`)
        })]
      }), T.some(e => e.kind === `GROUP` && (e.pro !== `` || e.nonPro !== ``)) && (0, g.jsx)(`div`, {
        className: `cc-intake-group-balances`,
        children: T.filter(e => e.kind === `GROUP` && (e.pro !== `` || e.nonPro !== ``)).map(e => (0, g.jsxs)(`p`, {
          children: [(0, g.jsx)(`strong`, {
            children: C.groups.find(t => t.id === e.subjectId)?.name
          }), ` `, l(`组内共享剩余`), `：PRO `, m(W(e.key, `pro`)), ` ·`, ` `, l(`非PRO`), ` `, m(W(e.key, `nonPro`))]
        }, e.key))
      }), (0, g.jsx)(`p`, {
        className: `cc-intake-allocation-hint`,
        children: l(`回收仅释放未用额度，当日已用保留。`)
      }), L && (0, g.jsx)(o, {
        tone: `red`,
        children: L
      }), (0, g.jsxs)(`footer`, {
        className: `dialog-footer`,
        children: [(0, g.jsx)(u, {
          type: `button`,
          disabled: F,
          onClick: () => z(C),
          children: l(`恢复当前值`)
        }), (0, g.jsx)(u, {
          type: `submit`,
          variant: `primary`,
          disabled: F,
          children: l(F ? `保存中…` : `保存额度分配`)
        })]
      })]
    }) : (0, g.jsx)(s, {}) : (0, g.jsx)(o, {
      tone: `red`,
      children: l(`仅供应商主账号可分配额度`)
    })
  })
}
export {
  y as
  default
};