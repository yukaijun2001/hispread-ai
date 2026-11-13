// origin: assets/IntakePolicyPanel-DHvOkPUU.js
import {
  C as e,
  S as t,
  X as n,
  Z as r,
  b as i,
  d as a,
  g as o,
  h as s,
  it as c,
  mt as l,
  s as u,
  u as d,
  vt as f
} from "./index-Dnr0i-H9.js";
import {
  a as p,
  t as m
} from "./labels-DaPzz6Ie.js"; /* empty css               */
var h = f(r(), 1),
  g = [`FALLBACK`, `NORMAL`, `PAYMENT_TERM`, `PARTNER`, `TEMPORARY`],
  _ = n();

function v({
  supplierId: n,
  memberId: r,
  title: f
}) {
  let {
    user: v,
    has: y,
    notify: b
  } = e(), x = !v.supplierId && ![`SUPPLIER`, `SUPPLIER_AGENT`].includes(v.role) && y(n ? `supplier.read` : `system.settings`), S = x && y(n ? `supplier.write` : `system.settings`), C = n ? `/cc-intake/admin/suppliers/${encodeURIComponent(n)}${r?`/members/${encodeURIComponent(r)}`:``}` : `/cc-intake/admin/system`, w = t(x ? C : null), [T, E] = (0, h.useState)(null), [D, O] = (0, h.useState)(null), [k, A] = (0, h.useState)({}), [j, M] = (0, h.useState)(!1), [N, P] = (0, h.useState)(``);
  (0, h.useEffect)(() => {
    E(null), O(null), A({}), P(``)
  }, [C]);

  function F(e) {
    const policy = structuredClone(e.policy);
    // Historical system rows predate the tier field; use the server's effective default.
    if (!n && !policy.tier) policy.tier = e.inherited?.tier || `NORMAL`;
    E(e), O(policy), A(Object.fromEntries(Object.entries(e.policy.ranges).map(([e, t]) => [e, {
      min: String(t.min),
      max: String(t.max)
    }]))), P(``)
  }
  if ((0, h.useEffect)(() => {
      w.data && F(w.data)
    }, [w.data]), !x) return (0, _.jsx)(a, {
    error: !0,
    text: l(`当前账号无权访问此页面`)
  });
  if (w.error && !T) return (0, _.jsxs)(o, {
    tone: `red`,
    children: [w.error, ` `, (0, _.jsx)(u, {
      onClick: w.reload,
      children: l(`重新加载配置`)
    })]
  });
  if (!T || !D) return (0, _.jsx)(s, {});
  let I = T.inherited,
    L = (e, t) => (0, _.jsxs)(`div`, {
      className: `field`,
      children: [(0, _.jsx)(`label`, {
        children: t
      }), (0, _.jsx)(d, {
        ariaLabel: t,
        value: D[e].mode,
        disabled: j || !S,
        onChange: t => O({
          ...D,
          [e]: {
            mode: t,
            quantity: t === `LIMITED` ? D[e].quantity ?? 0 : null
          }
        }),
        options: [...n ? [{
          value: `INHERIT`,
          label: l(`跟随系统`)
        }] : [], {
          value: `LIMITED`,
          label: l(`限制数量`)
        }, {
          value: `UNLIMITED`,
          label: l(`不限`)
        }]
      }), D[e].mode === `LIMITED` && (0, _.jsx)(`input`, {
        type: `number`,
        "aria-label": t,
        min: `0`,
        max: `100000000`,
        step: `1`,
        required: !0,
        disabled: j || !S,
        value: D[e].quantity ?? ``,
        onChange: t => O({
          ...D,
          [e]: {
            ...D[e],
            quantity: t.target.value === `` ? null : Number(t.target.value)
          }
        })
      }), D[e].mode === `INHERIT` && I && (0, _.jsx)(`small`, {
        children: l(`当前系统默认：{0}`, [m(I[e].quantity)])
      })]
    }, e);
  return (0, _.jsxs)(`form`, {
    className: `cc-intake-policy`,
    onSubmit: async e => {
      if (e.preventDefault(), j || !S) return;
      P(``);
      let t = {};
      for (let e of g) {
        let n = k[e];
        if (n) {
          if (!/^\d+$/.test(n.min) || !/^\d+$/.test(n.max) || Number(n.min) > Number(n.max) || Number(n.max) > 1e3) {
            P(l(`优先级区间须为0至1000且下限不大于上限`));
            return
          }
          t[e] = {
            min: Number(n.min),
            max: Number(n.max)
          }
        }
      }
      M(!0);
      try {
        F(await c(C, {
          policy: {
            ...D,
            ranges: t
          },
          version: T.version
        })), b(l(`CC上号规则已保存`))
      } catch (e) {
        P(e.message)
      } finally {
        M(!1)
      }
    },
    children: [(0, _.jsx)(o, {
      tone: `amber`,
      children: l(`规则用于后续原生 OAuth 上号。套餐由上游核验，未知套餐保持禁用；处理中及待核实的创建占用预留额度。`)
    }), (0, _.jsxs)(`div`, {
      className: `cc-intake-section-heading`,
      children: [(0, _.jsx)(`h3`, {
        children: f || l(r ? `个人优先级配置` : `CC上号规则`)
      }), (0, _.jsx)(`p`, {
        className: `muted`,
        children: l(r ? `仅平台可见；未覆盖的档位跟随供应商及系统配置。` : `按北京时间统计当日成功新增；数量和优先级分别继承，已成功的数量不会因修改配置清零。`)
      })]
    }), !r && (0, _.jsxs)(_.Fragment, {
      children: [(0, _.jsxs)(`div`, {
        className: `cc-intake-fields`,
        children: [L(`pro`, l(`PRO每日数量`)), L(`nonPro`, l(`非PRO每日数量`)), (0, _.jsxs)(`label`, {
          className: `field`,
          children: [(0, _.jsx)(`span`, {
            children: l(`非PRO品类开放`)
          }), (0, _.jsx)(d, {
            ariaLabel: l(`非PRO品类开放`),
            value: D.nonProOpen === null ? `INHERIT` : D.nonProOpen ? `OPEN` : `CLOSED`,
            disabled: j || !S,
            options: [...n ? [{
              value: `INHERIT`,
              label: l(`跟随系统`)
            }] : [], {
              value: `OPEN`,
              label: l(`开放`)
            }, {
              value: `CLOSED`,
              label: l(`停收`)
            }],
            onChange: e => O({
              ...D,
              nonProOpen: e === `INHERIT` ? null : e === `OPEN`
            })
          })]
        })]
      }), (0, _.jsx)(`p`, {
        className: `muted`,
        children: l(`按北京时间统计成功新增；历史未识别套餐按保守方式占用两类额度，重新授权不计新增。`)
      })]
    }), (0, _.jsxs)(`div`, {
      className: `cc-intake-priority-heading`,
      children: [(0, _.jsx)(`h4`, {
        children: l(`优先级档位`)
      }), (0, _.jsxs)(`label`, {
        className: `field`,
        children: [(0, _.jsx)(`span`, {
          children: l(`当前使用档位`)
        }), (0, _.jsx)(d, {
          ariaLabel: l(`当前使用档位`),
          value: D.tier ?? ``,
          disabled: j || !S,
          onChange: e => O({
            ...D,
            tier: e || null
          }),
          options: [...n ? [{
            value: ``,
            label: I?.tier ? l(`跟随上级（{0}）`, [p[I.tier]]) : l(`跟随上级`)
          }] : [], ...g.map(e => ({
            value: e,
            label: p[e]
          }))]
        })]
      })]
    }), (0, _.jsx)(i, {
      ariaLabel: l(`各档位优先级区间`),
      children: (0, _.jsxs)(`table`, {
        className: `cc-intake-table`,
        children: [(0, _.jsx)(`thead`, {
          children: (0, _.jsxs)(`tr`, {
            children: [(0, _.jsx)(`th`, {
              children: l(`档位`)
            }), (0, _.jsx)(`th`, {
              children: l(`配置方式`)
            }), (0, _.jsx)(`th`, {
              children: l(`优先级下限`)
            }), (0, _.jsx)(`th`, {
              children: l(`优先级上限`)
            }), (0, _.jsx)(`th`, {
              children: l(`生效区间`)
            })]
          })
        }), (0, _.jsx)(`tbody`, {
          children: g.map(e => {
            let t = k[e],
              r = I?.ranges[e],
              i = t || (r ? {
                min: String(r.min),
                max: String(r.max)
              } : void 0);
            return (0, _.jsxs)(`tr`, {
              children: [(0, _.jsx)(`th`, {
                scope: `row`,
                children: p[e]
              }), (0, _.jsx)(`td`, {
                children: n ? (0, _.jsx)(d, {
                  ariaLabel: l(`{0}配置方式`, [p[e]]),
                  value: t ? `CUSTOM` : `INHERIT`,
                  disabled: j || !S,
                  options: [{
                    value: `INHERIT`,
                    label: l(`跟随上级`)
                  }, {
                    value: `CUSTOM`,
                    label: l(`单独设置`)
                  }],
                  onChange: t => A(n => {
                    let r = {
                      ...n
                    };
                    return t === `INHERIT` ? delete r[e] : r[e] = i || {
                      min: `1`,
                      max: `1`
                    }, r
                  })
                }) : l(`系统默认`)
              }), [`min`, `max`].map(n => (0, _.jsx)(`td`, {
                children: t ? (0, _.jsx)(`input`, {
                  type: `number`,
                  required: !0,
                  min: `0`,
                  max: `1000`,
                  step: `1`,
                  value: t[n],
                  disabled: j || !S,
                  "aria-label": l(`{0}：{1}`, [p[e], l(n === `min` ? `优先级下限` : `优先级上限`)]),
                  onChange: r => A({
                    ...k,
                    [e]: {
                      ...t,
                      [n]: r.target.value
                    }
                  })
                }) : `—`
              }, n)), (0, _.jsx)(`td`, {
                children: i ? `${i.min}–${i.max}` : `—`
              })]
            }, e)
          })
        })]
      })
    }), (0, _.jsx)(`p`, {
      className: `muted`,
      children: l(n ? `未单独设置时使用所选档位的上级默认区间；可按档位自定义，上下限相同即固定值。新配置用于后续上号，历史账号通过批量调整执行。` : `上下限相同即固定值。新配置用于后续上号；历史账号通过批量调整执行。`)
    }), (N || w.error) && (0, _.jsxs)(o, {
      tone: `red`,
      children: [N || w.error, ` `, (0, _.jsx)(u, {
        type: `button`,
        disabled: j,
        onClick: w.reload,
        children: l(`重新加载配置`)
      })]
    }), (0, _.jsxs)(`footer`, {
      className: `cc-intake-actions`,
      children: [(0, _.jsx)(u, {
        type: `button`,
        disabled: j,
        onClick: () => F(T),
        children: l(`恢复当前值`)
      }), S && (0, _.jsx)(u, {
        variant: `primary`,
        type: `submit`,
        disabled: j,
        children: l(j ? `保存中…` : `保存CC上号规则`)
      })]
    })]
  })
}

function y({
  supplierId: e
}) {
  let n = t(`/cc-intake/admin/suppliers/${encodeURIComponent(e)}/members`),
    [r, i] = (0, h.useState)(``);
  return (0, h.useEffect)(() => i(``), [e]), (0, _.jsxs)(`section`, {
    className: `cc-intake-member-settings`,
    children: [(0, _.jsx)(`h3`, {
      children: l(`成员独立优先级`)
    }), (0, _.jsx)(`p`, {
      className: `muted`,
      children: l(`选择成员查看或覆盖其档位配置；成员和供应商前端均不可读取这些信息。`)
    }), n.error ? (0, _.jsxs)(o, {
      tone: `red`,
      children: [n.error, (0, _.jsx)(u, {
        onClick: n.reload,
        children: l(`重新加载`)
      })]
    }) : n.loading ? (0, _.jsx)(s, {}) : n.data?.length ? (0, _.jsxs)(`label`, {
      className: `field`,
      children: [(0, _.jsx)(`span`, {
        children: l(`选择成员`)
      }), (0, _.jsx)(d, {
        ariaLabel: l(`选择成员`),
        value: r,
        onChange: i,
        options: [{
          value: ``,
          label: l(`请选择成员`)
        }, ...n.data.map(e => ({
          value: e.id,
          label: e.displayName || e.username,
          detail: e.username
        }))]
      })]
    }) : (0, _.jsx)(`p`, {
      className: `muted`,
      children: l(`暂无团队成员`)
    }), r && (0, _.jsx)(v, {
      supplierId: e,
      memberId: r
    }, r)]
  })
}
export {
  y as MemberPrioritySettings, v as
  default
};
