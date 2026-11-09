// origin: assets/ApiTokens-uH0R0C-_.js
import {
  C as e,
  G as t,
  P as n,
  S as r,
  X as i,
  Y as a,
  Z as o,
  g as s,
  h as c,
  mt as l,
  o as u,
  rt as d,
  s as f,
  vt as p
} from "./index-Dnr0i-H9.js";
var m = p(o(), 1),
  h = i();

function g({
  userId: i
}) {
  let {
    refresh: o,
    notify: p,
    user: g,
    has: _
  } = e(), v = i ? `/users/${encodeURIComponent(i)}/api-tokens` : `/auth/api-tokens`, y = r(v), [b, x] = (0, m.useState)(null), [S, C] = (0, m.useState)(!1), [w, T] = (0, m.useState)(null), [E, D] = (0, m.useState)(``), [O, k] = (0, m.useState)(`90`), [A, j] = (0, m.useState)(90), [M, N] = (0, m.useState)(``), [P, F] = (0, m.useState)(!1), [I, L] = (0, m.useState)(!1), R = (0, m.useRef)(!1), [z, B] = (0, m.useState)(``), V = O === `custom` ? A : Number(O), H = Number.isInteger(V) && V >= 1 && V <= 365, U = g.role === `ADMIN` && !g.supplierId && _(`system.users`), W = Date.now(), G = e => e.enabled && (!e.expiresAt || Date.parse(e.expiresAt) > W), K = (y.data || []).filter(e => S ? !G(e) : G(e)), q = (y.data || []).filter(e => !G(e)).length;

  function J() {
    R.current || (x(null), N(``), F(!1), B(``), T(null))
  }

  function Y(e, t) {
    B(``), N(``), F(!1), T(t || null), x(e), e === `create` && (D(``), k(`90`))
  }
  async function X(e, t) {
    if (!R.current) {
      R.current = !0, L(!0), B(``);
      try {
        let n = await d(e === `issue` ? v : `${v}/${encodeURIComponent(t)}/${e}`, e === `issue` ? {
          name: E,
          days: V
        } : e === `reset` ? {
          days: V
        } : {});
        (e === `issue` || e === `reset`) && C(!1), n.key ? (N(n.key), F(!1), x(`secret`)) : x(null), e !== `reveal` && (o(), p(l(e === `revoke` ? `密钥已撤销` : e === `reset` ? `密钥已重置` : `密钥已生成`)))
      } catch (e) {
        B(e.message)
      } finally {
        R.current = !1, L(!1)
      }
    }
  }
  async function Z() {
    try {
      await navigator.clipboard.writeText(M), p(l(`已复制`))
    } catch {
      B(l(`复制失败，请显示后手动复制。`))
    }
  }
  let Q = l(b === `create` ? `新建 API 密钥` : b === `reset` ? `重置 API 密钥` : b === `revoke` ? `撤销 API 密钥` : `API 密钥`);
  return (0, h.jsxs)(`div`, {
    className: `access-tokens`,
    children: [(0, h.jsxs)(`div`, {
      className: `access-token-toolbar`,
      children: [(0, h.jsx)(`h3`, {
        children: l(S ? `历史密钥` : `API 密钥`)
      }), (0, h.jsxs)(`div`, {
        className: `access-token-toolbar-actions`,
        children: [(S || q > 0) && (0, h.jsx)(f, {
          className: `token-history-toggle`,
          onClick: () => C(e => !e),
          children: l(S ? `返回有效密钥` : `历史密钥`)
        }), !i && (0, h.jsx)(f, {
          variant: `primary`,
          icon: `plus`,
          disabled: I || y.loading || !!y.error,
          onClick: () => Y(`create`),
          children: l(`新建密钥 `)
        })]
      })]
    }), y.loading ? (0, h.jsx)(c, {}) : y.error ? (0, h.jsx)(s, {
      tone: `red`,
      children: y.error
    }) : K.length ? (0, h.jsx)(`ul`, {
      className: `access-token-list`,
      "aria-label": l(`API 密钥列表`),
      children: K.map(e => {
        let t = !!e.expiresAt && Date.parse(e.expiresAt) <= Date.now();
        return (0, h.jsxs)(`li`, {
          className: `access-token-item`,
          children: [(0, h.jsxs)(`div`, {
            className: `access-token-info`,
            children: [(0, h.jsxs)(`div`, {
              className: `access-token-name`,
              children: [(0, h.jsx)(`strong`, {
                children: e.name
              }), (0, h.jsxs)(`code`, {
                children: [`•••• `, e.tail]
              }), (0, h.jsx)(u, {
                state: e.enabled ? t ? `PENDING` : `APPROVED` : `WITHDRAWN`,
                label: e.enabled ? l(t ? `已到期` : `有效`) : l(`已撤销`)
              })]
            }), (0, h.jsxs)(`div`, {
              className: `access-token-meta`,
              children: [(0, h.jsx)(`span`, {
                children: e.expiresAt ? l(`{0} 到期`, [n(e.expiresAt)]) : l(`未设到期时间`)
              }), (0, h.jsx)(`span`, {
                children: e.lastUsedAt ? l(`最近使用 {0}`, [n(e.lastUsedAt)]) : l(`尚未使用`)
              })]
            })]
          }), e.enabled && (0, h.jsxs)(`div`, {
            className: `access-token-actions`,
            children: [g.role === `ADMIN` && !g.supplierId && _(`system.users`) && e.revealable && !t && (0, h.jsx)(f, {
              className: `token-text-button`,
              disabled: I,
              onClick: () => {
                Y(`secret`, e), X(`reveal`, e.id)
              },
              children: l(`查看 `)
            }), (0, h.jsx)(f, {
              className: `token-text-button`,
              disabled: I,
              onClick: () => Y(`reset`, e),
              children: l(`重置 `)
            }), (0, h.jsx)(f, {
              className: `token-text-button token-revoke`,
              disabled: I,
              onClick: () => Y(`revoke`, e),
              children: l(`撤销 `)
            })]
          })]
        }, e.id)
      })
    }) : (0, h.jsxs)(`div`, {
      className: `access-token-empty`,
      children: [(0, h.jsx)(a, {
        name: `lock`,
        size: 26
      }), (0, h.jsx)(`strong`, {
        children: l(S ? `暂无历史密钥` : `暂无有效密钥`)
      }), !i && !S && (0, h.jsx)(`span`, {
        children: l(`需要通过程序访问平台时，可新建密钥。`)
      })]
    }), (0, h.jsxs)(`details`, {
      className: `access-token-help`,
      children: [(0, h.jsx)(`summary`, {
        children: l(`调用示例`)
      }), (0, h.jsx)(`pre`, {
        children: l(`POST {0}/api/channel/
Authorization: Bearer <API 密钥>
Content-Type: application/json`, [window.location.origin])
      })]
    }), b && (0, h.jsxs)(t, {
      title: Q,
      className: `access-token-dialog`,
      onClose: J,
      children: [z && (0, h.jsx)(s, {
        tone: `red`,
        children: z
      }), b === `secret` ? (0, h.jsxs)(h.Fragment, {
        children: [I ? (0, h.jsx)(c, {}) : M ? (0, h.jsxs)(`div`, {
          className: `access-token-secret`,
          children: [(0, h.jsxs)(`label`, {
            className: `field`,
            children: [(0, h.jsx)(`span`, {
              children: w?.name || l(`API 密钥`)
            }), (0, h.jsxs)(`div`, {
              className: `access-token-input`,
              children: [(0, h.jsx)(`input`, {
                type: P ? `text` : `password`,
                readOnly: !0,
                value: M,
                autoComplete: `off`,
                "aria-label": l(`完整 API 密钥`),
                spellCheck: !1
              }), (0, h.jsx)(`button`, {
                type: `button`,
                className: `icon-button`,
                "aria-label": l(P ? `隐藏密钥` : `显示密钥`),
                onClick: () => F(e => !e),
                children: (0, h.jsx)(a, {
                  name: `eye`,
                  size: 18
                })
              })]
            })]
          }), !U && (0, h.jsx)(`p`, {
            className: `access-token-once`,
            children: l(`仅本次展示，请复制保存。`)
          })]
        }) : null, (0, h.jsxs)(`footer`, {
          className: `dialog-footer`,
          children: [(0, h.jsx)(f, {
            disabled: I,
            onClick: J,
            children: l(`关闭 `)
          }), (0, h.jsx)(f, {
            variant: `primary`,
            icon: `copy`,
            disabled: I || !M,
            onClick: () => void Z(),
            children: l(`复制密钥 `)
          })]
        })]
      }) : (0, h.jsxs)(`form`, {
        className: `access-token-form`,
        onSubmit: e => {
          e.preventDefault(), b === `revoke` ? X(`revoke`, w?.id) : H && (b !== `create` || E.trim()) && X(b === `create` ? `issue` : `reset`, w?.id)
        },
        children: [b === `create` ? (0, h.jsxs)(`label`, {
          className: `field`,
          children: [(0, h.jsx)(`span`, {
            children: l(`密钥名称`)
          }), (0, h.jsx)(`input`, {
            autoFocus: !0,
            required: !0,
            maxLength: 100,
            disabled: I,
            value: E,
            onChange: e => D(e.target.value),
            placeholder: l(`例如：自动交付`)
          })]
        }) : (0, h.jsx)(`p`, {
          className: `access-token-confirm`,
          children: l(b === `reset` ? `重置“{0}”后，旧密钥立即失效。` : `撤销“{0}”后，使用它的程序将无法继续访问。`, [w?.name])
        }), b !== `revoke` && (0, h.jsxs)(`fieldset`, {
          className: `access-token-expiry`,
          disabled: I,
          children: [(0, h.jsx)(`legend`, {
            children: l(`有效期`)
          }), (0, h.jsx)(`div`, {
            className: `access-token-presets`,
            children: [{
              value: `7`,
              label: l(`7 天`)
            }, {
              value: `30`,
              label: l(`30 天`)
            }, {
              value: `90`,
              label: l(`90 天`)
            }, {
              value: `365`,
              label: l(`1 年`)
            }, {
              value: `custom`,
              label: l(`自定义`)
            }].map(e => (0, h.jsx)(`button`, {
              type: `button`,
              "aria-pressed": O === e.value,
              className: O === e.value ? `selected` : ``,
              onClick: () => k(e.value),
              children: e.label
            }, e.value))
          }), O === `custom` && (0, h.jsxs)(`label`, {
            className: `field`,
            children: [(0, h.jsx)(`span`, {
              children: l(`有效天数`)
            }), (0, h.jsx)(`input`, {
              type: `number`,
              min: 1,
              max: 365,
              required: !0,
              value: A,
              onChange: e => j(Number(e.target.value))
            })]
          })]
        }), (0, h.jsxs)(`footer`, {
          className: `dialog-footer`,
          children: [(0, h.jsx)(f, {
            type: `button`,
            disabled: I,
            onClick: J,
            children: l(`取消 `)
          }), (0, h.jsx)(f, {
            type: `submit`,
            variant: b === `revoke` ? `danger` : `primary`,
            disabled: I || b !== `revoke` && (!H || b === `create` && !E.trim()),
            children: l(I ? `处理中…` : b === `create` ? `创建密钥` : b === `reset` ? `确认重置` : `确认撤销`)
          })]
        })]
      })]
    })]
  })
}

function _({
  userId: e,
  username: n,
  onClose: r
}) {
  return (0, h.jsx)(t, {
    title: l(`API 密钥`),
    subtitle: n,
    className: `api-tokens-dialog`,
    wide: !0,
    onClose: r,
    children: (0, h.jsx)(g, {
      userId: e
    })
  })
}
export {
  g as ApiTokens, _ as ApiTokensDialog
};