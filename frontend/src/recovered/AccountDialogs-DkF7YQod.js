// origin: assets/AccountDialogs-DkF7YQod.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/ApiTokens-uH0R0C-_.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/ApiTokens-ooazcS4m.css"]))) => i.map(i => d[i]);
import {
  $ as e,
  G as t,
  X as n,
  Z as r,
  g as i,
  h as a,
  i as o,
  it as s,
  l as c,
  mt as l,
  nt as u,
  rt as d,
  s as f,
  vt as p,
  x as m
} from "./index-Dnr0i-H9.js";
var h = p(r(), 1),
  g = n();

function _({
  onClose: n,
  onSaved: r,
  initialTab: o = `profile`
}) {
  let [u, d] = (0, h.useState)(o), [p, _] = (0, h.useState)(null), [v, y] = (0, h.useState)(``), [x, S] = (0, h.useState)(``), [C, w] = (0, h.useState)(``), [T, E] = (0, h.useState)(!0), [D, O] = (0, h.useState)(!1), [k, A] = (0, h.useState)(``);
  (0, h.useEffect)(() => {
    let t = !0;
    return e(`/auth/profile`).then(e => {
      t && (_(e), y(e.displayName), S(e.personalEmail), w(e.personalPhone))
    }).catch(e => {
      t && A(e.message)
    }).finally(() => {
      t && E(!1)
    }), () => {
      t = !1
    }
  }, []);
  async function j(e) {
    if (e.preventDefault(), p && !D) {
      O(!0), A(``);
      try {
        r(await s(`/auth/profile`, {
          displayName: v.trim(),
          personalEmail: x.trim(),
          personalPhone: C.trim(),
          version: p.version
        }))
      } catch (e) {
        A(e.message)
      } finally {
        O(!1)
      }
    }
  }
  return (0, g.jsxs)(t, {
    title: l(`个人资料`),
    wide: !0,
    className: `personal-profile-dialog`,
    onClose: () => !D && n(),
    children: [(0, g.jsx)(m, {
      value: u,
      onChange: d,
      items: [{
        id: `profile`,
        label: l(`基本资料`)
      }, {
        id: `tokens`,
        label: l(`API 密钥`)
      }]
    }), u === `tokens` ? (0, g.jsx)(h.Suspense, {
      fallback: (0, g.jsx)(a, {}),
      children: (0, g.jsx)(b, {})
    }) : T ? (0, g.jsx)(a, {}) : p ? (0, g.jsxs)(`form`, {
      onSubmit: e => void j(e),
      children: [(0, g.jsx)(c, {
        items: [
          [l(`登录账号`), p.username]
        ]
      }), (0, g.jsxs)(`label`, {
        className: `field`,
        children: [(0, g.jsx)(`span`, {
          children: l(`姓名 / 显示名称`)
        }), (0, g.jsx)(`input`, {
          required: !0,
          maxLength: 100,
          value: v,
          onChange: e => y(e.target.value)
        })]
      }), (0, g.jsxs)(`label`, {
        className: `field`,
        children: [(0, g.jsx)(`span`, {
          children: l(`个人邮箱`)
        }), (0, g.jsx)(`input`, {
          type: `email`,
          maxLength: 160,
          value: x,
          onChange: e => S(e.target.value)
        })]
      }), (0, g.jsxs)(`label`, {
        className: `field`,
        children: [(0, g.jsx)(`span`, {
          children: l(`个人电话`)
        }), (0, g.jsx)(`input`, {
          type: `tel`,
          maxLength: 60,
          value: C,
          onChange: e => w(e.target.value)
        })]
      }), k && (0, g.jsx)(i, {
        tone: `red`,
        children: k
      }), (0, g.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, g.jsx)(f, {
          type: `button`,
          onClick: n,
          disabled: D,
          children: l(`取消 `)
        }), (0, g.jsx)(f, {
          variant: `primary`,
          type: `submit`,
          disabled: D,
          children: l(D ? `保存中…` : `保存`)
        })]
      })]
    }) : (0, g.jsxs)(i, {
      tone: `red`,
      children: [l(`个人信息加载失败：`), k]
    })]
  })
}

function v({
  value: e,
  onClose: n
}) {
  return (0, g.jsxs)(t, {
    title: l(`账号信息`),
    onClose: n,
    children: [(0, g.jsx)(c, {
      items: [
        [l(`登录账号`), e.username || l(`所选账号`)],
        [l(`初始密码`), e.initialPassword ? (0, g.jsx)(`code`, {
          className: `credential-secret`,
          children: e.initialPassword
        }) : l(`继续使用原账号密码`)]
      ]
    }), e.initialPassword && (0, g.jsx)(i, {
      tone: `amber`,
      children: l(`初始密码仅在本次操作后展示。请通过安全渠道交给本人；关闭后无法再次查询明文。 `)
    }), (0, g.jsx)(`div`, {
      className: `dialog-footer`,
      children: (0, g.jsx)(f, {
        variant: `primary`,
        onClick: n,
        children: l(`我已保存 `)
      })
    })]
  })
}

function y({
  forced: n = !1,
  onClose: r,
  onChanged: a
}) {
  let [o, s] = (0, h.useState)(null), [c, p] = (0, h.useState)(``), [m, _] = (0, h.useState)(``), [v, y] = (0, h.useState)(``), [b, x] = (0, h.useState)(!1), [S, C] = (0, h.useState)(``);
  return (0, h.useEffect)(() => {
    e(`/auth/password-policy`).then(s).catch(e => C(e.message))
  }, []), (0, g.jsx)(t, {
    title: l(n ? `设置新密码` : `修改密码`),
    onClose: () => {
      !n && !b && r()
    },
    children: (0, g.jsxs)(`form`, {
      onSubmit: async e => {
        if (e.preventDefault(), m !== v) {
          C(l(`两次输入的新密码不一致`));
          return
        }
        x(!0), C(``);
        try {
          await d(`/auth/password`, {
            currentPassword: c,
            newPassword: m
          }), a()
        } catch (e) {
          C(e.message)
        } finally {
          x(!1)
        }
      },
      children: [n && (0, g.jsx)(i, {
        children: l(`此账号需要先修改初始密码。修改成功后请重新登录。`)
      }), (0, g.jsxs)(`label`, {
        className: `field`,
        children: [(0, g.jsx)(`span`, {
          children: l(`当前密码`)
        }), (0, g.jsx)(`input`, {
          required: !0,
          type: `password`,
          autoComplete: `current-password`,
          value: c,
          onChange: e => p(e.target.value)
        })]
      }), (0, g.jsxs)(`label`, {
        className: `field`,
        children: [(0, g.jsx)(`span`, {
          children: l(`新密码`)
        }), (0, g.jsx)(`input`, {
          required: !0,
          type: `password`,
          autoComplete: `new-password`,
          minLength: o?.passwordMinLength,
          maxLength: o?.passwordMaxLength,
          value: m,
          onChange: e => _(e.target.value)
        }), o && (0, g.jsxs)(`small`, {
          children: [o.passwordMinLength, `—`, o.passwordMaxLength, l(` 位 `), o.requireUpper ? l(` · 大写字母`) : ``, o.requireLower ? l(` · 小写字母`) : ``, o.requireDigit ? l(` · 数字`) : ``, o.requireSymbol ? l(` · 符号`) : ``]
        })]
      }), (0, g.jsxs)(`label`, {
        className: `field`,
        children: [(0, g.jsx)(`span`, {
          children: l(`确认新密码`)
        }), (0, g.jsx)(`input`, {
          required: !0,
          type: `password`,
          autoComplete: `new-password`,
          value: v,
          onChange: e => y(e.target.value)
        })]
      }), S && (0, g.jsx)(i, {
        tone: `red`,
        children: S
      }), (0, g.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [n ? (0, g.jsx)(f, {
          type: `button`,
          disabled: b,
          onClick: async () => {
            try {
              await u(), a()
            } catch (e) {
              C(e.message)
            }
          },
          children: l(`退出登录 `)
        }) : (0, g.jsx)(f, {
          type: `button`,
          disabled: b,
          onClick: r,
          children: l(`取消 `)
        }), (0, g.jsx)(f, {
          type: `submit`,
          variant: `primary`,
          disabled: b || !o,
          children: l(b ? `保存中…` : `保存并重新登录`)
        })]
      })]
    })
  })
}
var b = (0, h.lazy)(() => o(() => import(`./ApiTokens-uH0R0C-_.js`).then(e => ({
  default: e.ApiTokens
})), __vite__mapDeps([0, 1, 2, 3])));
export {
  v as CredentialDialog, y as PasswordDialog, _ as PersonalProfileDialog
};