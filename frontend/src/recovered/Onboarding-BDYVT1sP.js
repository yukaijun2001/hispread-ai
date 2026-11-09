// origin: assets/Onboarding-BDYVT1sP.js
import {
  J as e,
  X as t,
  Z as n,
  g as r,
  mt as i,
  q as a,
  rt as o,
  s,
  u as c,
  vt as l
} from "./index-Dnr0i-H9.js";
var u = l(n(), 1),
  d = t();

function f({
  approvalRequired: t,
  onDone: n,
  onLogout: l
}) {
  let [f, p] = (0, u.useState)(``), [m, h] = (0, u.useState)(``), [g, _] = (0, u.useState)(``), [v, y] = (0, u.useState)(`COMPANY`), [b, x] = (0, u.useState)(``), [S, C] = (0, u.useState)(``), [w, T] = (0, u.useState)(i(`中国`)), [E, D] = (0, u.useState)(`MONTHLY`), [O, k] = (0, u.useState)(``), [A, j] = (0, u.useState)(!1), [M, N] = (0, u.useState)(``);
  async function P(e) {
    if (e.preventDefault(), !A) {
      j(!0), N(``);
      try {
        await o(`/auth/onboarding`, {
          personalName: f.trim(),
          personalEmail: m.trim(),
          personalPhone: g.trim(),
          supplierType: v,
          companyName: v === `COMPANY` ? b.trim() : ``,
          registrationNo: v === `COMPANY` ? S.trim() : ``,
          country: w.trim(),
          cycle: E,
          customCycleDays: E === `CUSTOM` ? Number(O) : null
        }), await n()
      } catch (e) {
        N(e.message)
      } finally {
        j(!1)
      }
    }
  }
  return (0, d.jsx)(`div`, {
    className: `onboarding-page`,
    children: (0, d.jsxs)(`section`, {
      className: `onboarding-card`,
      children: [(0, d.jsxs)(`div`, {
        className: `onboarding-header`,
        children: [(0, d.jsx)(e, {}), (0, d.jsxs)(`div`, {
          className: `topbar-actions`,
          children: [(0, d.jsx)(a, {}), (0, d.jsx)(`button`, {
            className: `text-button`,
            type: `button`,
            onClick: async () => {
              try {
                await l()
              } catch (e) {
                N(e.message)
              }
            },
            children: i(`退出登录 `)
          })]
        })]
      }), (0, d.jsx)(`h1`, {
        children: i(`完善首次登录资料`)
      }), (0, d.jsxs)(`p`, {
        children: [i(`填写个人联系信息和供应商主体资料。 `), i(t ? `提交后资料进入待审核状态。` : `提交后供应商资料将自动通过审核。`)]
      }), (0, d.jsxs)(`form`, {
        onSubmit: e => void P(e),
        children: [(0, d.jsx)(`h2`, {
          children: i(`个人信息`)
        }), (0, d.jsxs)(`div`, {
          className: `onboarding-grid`,
          children: [(0, d.jsxs)(`label`, {
            className: `field`,
            children: [(0, d.jsx)(`span`, {
              children: i(`姓名`)
            }), (0, d.jsx)(`input`, {
              required: !0,
              maxLength: 100,
              autoComplete: `name`,
              value: f,
              onChange: e => p(e.target.value)
            })]
          }), (0, d.jsxs)(`label`, {
            className: `field`,
            children: [(0, d.jsx)(`span`, {
              children: i(`联系电话（选填）`)
            }), (0, d.jsx)(`input`, {
              maxLength: 60,
              autoComplete: `tel`,
              value: g,
              onChange: e => _(e.target.value)
            })]
          }), (0, d.jsxs)(`label`, {
            className: `field`,
            children: [(0, d.jsx)(`span`, {
              children: i(`电子邮箱（选填）`)
            }), (0, d.jsx)(`input`, {
              type: `email`,
              maxLength: 160,
              autoComplete: `email`,
              value: m,
              onChange: e => h(e.target.value)
            })]
          })]
        }), (0, d.jsx)(`h2`, {
          children: i(`供应商主体信息`)
        }), (0, d.jsxs)(`div`, {
          className: `onboarding-grid`,
          children: [(0, d.jsxs)(`div`, {
            className: `field`,
            children: [(0, d.jsx)(`span`, {
              children: i(`主体类型`)
            }), (0, d.jsx)(c, {
              ariaLabel: i(`主体类型`),
              value: v,
              onChange: e => y(e),
              options: [{
                value: `COMPANY`,
                label: i(`企业`)
              }, {
                value: `INDIVIDUAL`,
                label: i(`个人`)
              }]
            })]
          }), v === `COMPANY` && (0, d.jsxs)(d.Fragment, {
            children: [(0, d.jsxs)(`label`, {
              className: `field`,
              children: [(0, d.jsx)(`span`, {
                children: i(`企业名称`)
              }), (0, d.jsx)(`input`, {
                required: !0,
                maxLength: 160,
                autoComplete: `organization`,
                value: b,
                onChange: e => x(e.target.value)
              })]
            }), (0, d.jsxs)(`label`, {
              className: `field`,
              children: [(0, d.jsx)(`span`, {
                children: i(`统一社会信用代码或注册编号`)
              }), (0, d.jsx)(`input`, {
                required: !0,
                maxLength: 100,
                value: S,
                onChange: e => C(e.target.value)
              })]
            })]
          }), (0, d.jsxs)(`label`, {
            className: `field`,
            children: [(0, d.jsx)(`span`, {
              children: i(`国家或地区`)
            }), (0, d.jsx)(`input`, {
              required: !0,
              maxLength: 80,
              value: w,
              onChange: e => T(e.target.value)
            })]
          }), (0, d.jsxs)(`div`, {
            className: `field`,
            children: [(0, d.jsx)(`span`, {
              children: i(`结算周期`)
            }), (0, d.jsx)(c, {
              ariaLabel: i(`结算周期`),
              value: E,
              onChange: e => {
                D(e), k(``)
              },
              options: [{
                value: `DAILY`,
                label: i(`日结`)
              }, {
                value: `WEEKLY`,
                label: i(`周结`)
              }, {
                value: `MONTHLY`,
                label: i(`月结`)
              }, {
                value: `CUSTOM`,
                label: i(`自定义`)
              }]
            })]
          }), E === `CUSTOM` && (0, d.jsxs)(`label`, {
            className: `field`,
            children: [(0, d.jsx)(`span`, {
              children: i(`每隔多少天结算`)
            }), (0, d.jsx)(`input`, {
              type: `number`,
              required: !0,
              min: 1,
              max: 365,
              value: O,
              onChange: e => k(e.target.value)
            })]
          })]
        }), M && (0, d.jsx)(r, {
          tone: `red`,
          children: M
        }), (0, d.jsx)(s, {
          type: `submit`,
          variant: `primary`,
          disabled: A,
          children: i(A ? `正在保存…` : `保存资料`)
        })]
      })]
    })
  })
}
export {
  f as
  default
};