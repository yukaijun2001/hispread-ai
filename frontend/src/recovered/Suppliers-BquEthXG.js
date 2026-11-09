// origin: assets/Suppliers-BquEthXG.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/MySupplierProfile-DPM4wUP0.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/SupplierDetail-CJpHR0kK.js", "assets/AccountDialogs-DkF7YQod.js"]))) => i.map(i => d[i]);
import {
  B as e,
  C as t,
  I as n,
  P as r,
  S as i,
  X as a,
  Y as o,
  Z as s,
  _ as c,
  _t as l,
  a as u,
  c as d,
  d as f,
  f as p,
  h as m,
  i as h,
  it as g,
  k as _,
  m as v,
  mt as y,
  o as b,
  p as x,
  rt as S,
  s as C,
  u as w,
  vt as T,
  y as E
} from "./index-Dnr0i-H9.js";
import {
  CredentialDialog as D
} from "./AccountDialogs-DkF7YQod.js";
var O = T(s(), 1),
  k = [{
    value: `DAILY`,
    label: y(`日结`),
    tone: `blue`
  }, {
    value: `WEEKLY`,
    label: y(`周结`),
    tone: `blue`
  }, {
    value: `MONTHLY`,
    label: y(`月结`),
    tone: `teal`
  }, {
    value: `CUSTOM`,
    label: y(`自定义期间`),
    tone: `violet`
  }],
  A = {
    DAILY: y(`日结`),
    WEEKLY: y(`周结`),
    MONTHLY: y(`月结`),
    CUSTOM: y(`自定义期间`)
  };

function j(e, t) {
  return e === `CUSTOM` && t ? y(`每 {0} 天结算`, [t]) : A[e] || e
}

function M(e) {
  return e === `OKX_USDT` || e === `BINANCE_USDT`
}

function N(e) {
  return e === `OKX_USDT` ? `OKX` : e === `BINANCE_USDT` ? `Binance` : `Airwallex`
}

function P(e, t) {
  let n = e.find(e => e.id === t);
  return n ? y(`{0} · 末四位 {1}`, [_(n), n.lastFour]) : y(`历史账户`)
}
var F = [{
  name: `name`,
  label: y(`供应商主体名称`),
  full: !0
}, {
  name: `registrationNo`,
  label: y(`企业注册编号`),
  visible: e => e.supplierType === `COMPANY`
}, {
  name: `country`,
  label: y(`国家 / 地区`)
}, {
  name: `contact`,
  label: y(`联系人`)
}, {
  name: `phone`,
  label: y(`联系电话`),
  required: !1,
  hint: y(`选填`)
}, {
  name: `email`,
  label: y(`电子邮箱`),
  type: `email`,
  required: !1,
  hint: y(`选填；填写时需为有效邮箱格式`)
}, {
  name: `cycle`,
  label: y(`结算周期`),
  type: `select`,
  clearOnChange: [`customCycleDays`],
  options: k
}, {
  name: `customCycleDays`,
  label: y(`每隔多少天结算`),
  type: `number`,
  min: `1`,
  max: `365`,
  step: `1`,
  placeholder: y(`例如 10`),
  hint: y(`填写 1-365 天；结算单的实际起止日期仍在创建时确认`),
  visible: e => e.cycle === `CUSTOM`
}];

function I(e) {
  return [{
    name: `mode`,
    label: y(`登录账号`),
    type: `select`,
    full: !0,
    options: [{
      value: `NEW`,
      label: y(`创建新用户`),
      tone: `blue`
    }, {
      value: `EXISTING`,
      label: y(`选择已有用户`),
      tone: `teal`
    }]
  }, {
    name: `userId`,
    label: y(`已有供应商用户`),
    type: `select`,
    full: !0,
    visible: e => e.mode === `EXISTING`,
    visual: `user`,
    options: e.map(e => ({
      value: e.id,
      label: `${e.displayName} · ${e.username}`
    })),
    hint: y(`仅显示已启用且未绑定供应商的用户`)
  }, {
    name: `username`,
    label: y(`新登录账号`),
    visible: e => e.mode === `NEW`,
    hint: y(`字母、数字及 . _ @ -，至少 3 位`)
  }, {
    name: `displayName`,
    label: y(`账号显示名称`),
    required: !1,
    visible: e => e.mode === `NEW`,
    placeholder: y(`默认使用联系人姓名`)
  }, {
    name: `password`,
    label: y(`初始密码`),
    type: `password`,
    full: !0,
    required: !1,
    visible: e => e.mode === `NEW`,
    placeholder: y(`留空则按系统参数安全随机生成`)
  }]
}
var L = l({
    default: () => V
  }),
  R = a(),
  z = (0, O.lazy)(() => h(() => import(`./MySupplierProfile-DPM4wUP0.js`).then(e => ({
    default: e.MySupplierOverview
  })), __vite__mapDeps([0, 1, 2]))),
  B = (0, O.lazy)(() => h(() => import(`./SupplierDetail-CJpHR0kK.js`).then(e => ({
    default: e.SupplierDetail
  })), __vite__mapDeps([3, 1, 2, 4])));

function V() {
  let {
    user: a,
    has: s,
    refresh: l,
    notify: h
  } = t(), _ = !!a.supplierId, [T, k] = (0, O.useState)(``), [A, M] = (0, O.useState)(``), [N, P] = (0, O.useState)(``), [L, V] = (0, O.useState)(1), [H, U] = (0, O.useState)(10), [W, G] = (0, O.useState)(_ ? null : e(`id`) || null), [K, q] = (0, O.useState)(null), [J, Y] = (0, O.useState)(null), X = i(K === `new` && s(`supplier.users`) ? `/suppliers/available-users` : null), Z = i(!_ && s(`supplier.owner.assign`) ? `/suppliers/owner-candidates?includeHistory=true` : null), Q = i(_ ? null : `/suppliers?search=${encodeURIComponent(T)}&state=${A}&owner=${s(`supplier.owner.assign`)?encodeURIComponent(N):``}&page=${L}&size=${H}`), $ = i(_ ? `/suppliers/${a.supplierId}` : null), ee = e => {
    G(null), q(e)
  }, te = K && K !== `new` ? Object.fromEntries(Object.entries(K).map(([e, t]) => [e, String(t ?? ``)])) : {
    code: ``,
    supplierType: `COMPANY`,
    country: y(`中国`),
    cycle: `MONTHLY`,
    mode: `NEW`
  };
  return (0, R.jsxs)(R.Fragment, {
    children: [(0, R.jsxs)(v, {
      title: y(_ ? `我的资料` : `供应商`),
      children: [!_ && s(`account.read`) && (0, R.jsx)(C, {
        icon: `bank`,
        onClick: () => n(`supplier-accounts`),
        children: y(`收款账户 `)
      }), !_ && s(`supplier.write`) && s(`supplier.users`) && (0, R.jsx)(C, {
        variant: `primary`,
        icon: `plus`,
        onClick: () => q(`new`),
        children: y(`新建供应商 `)
      })]
    }), _ ? $.error ? (0, R.jsx)(`section`, {
      className: `panel`,
      children: (0, R.jsx)(f, {
        text: $.error,
        error: !0
      })
    }) : $.data ? (0, R.jsx)(`div`, {
      className: `my-supplier-page`,
      children: (0, R.jsx)(O.Suspense, {
        fallback: (0, R.jsx)(m, {}),
        children: (0, R.jsx)(z, {
          supplier: $.data,
          supplierId: a.supplierId
        })
      })
    }) : $.loading ? (0, R.jsx)(`section`, {
      className: `panel`,
      children: (0, R.jsx)(m, {})
    }) : (0, R.jsx)(`section`, {
      className: `panel`,
      children: (0, R.jsx)(f, {
        text: y(`暂时无法获取你的资料，请刷新重试`),
        error: !0
      })
    }) : (0, R.jsxs)(`section`, {
      className: `panel`,
      children: [(0, R.jsxs)(p, {
        actions: (0, R.jsx)(C, {
          icon: `refresh`,
          onClick: l,
          "aria-label": y(`刷新供应商`)
        }),
        children: [(0, R.jsx)(E, {
          value: T,
          onChange: e => {
            k(e), V(1)
          },
          placeholder: y(`搜索供应商代码、名称、联系人`)
        }), (0, R.jsx)(w, {
          ariaLabel: y(`资料审核状态`),
          value: A,
          onChange: e => {
            M(e), V(1)
          },
          options: [{
            value: ``,
            label: y(`全部审核状态`)
          }, {
            value: `PENDING`,
            label: y(`待审核`),
            tone: `pending`
          }, {
            value: `APPROVED`,
            label: y(`已通过`),
            tone: `approved`
          }, {
            value: `REJECTED`,
            label: y(`已退回`),
            tone: `rejected`
          }]
        }), s(`supplier.owner.assign`) && (0, R.jsx)(w, {
          ariaLabel: y(`负责运营筛选`),
          value: N,
          onChange: e => {
            P(e), V(1)
          },
          options: [{
            value: ``,
            label: y(`全部归属`)
          }, {
            value: `UNASSIGNED`,
            label: y(`待分配`)
          }, ...(Z.data || []).map(e => ({
            value: e.id,
            label: y(`{0}（{1}）`, [e.displayName, e.username])
          }))]
        })]
      }), (0, R.jsx)(d, {
        data: Q.data?.items || [],
        loading: Q.loading,
        error: Q.error,
        onRow: e => G(e.id),
        columns: [{
          label: y(`供应商`),
          render: (e, t) => (0, R.jsxs)(`div`, {
            className: `identity`,
            children: [(0, R.jsx)(u, {
              name: e.name,
              index: t
            }), (0, R.jsxs)(`div`, {
              children: [(0, R.jsx)(`strong`, {
                children: e.name
              }), (0, R.jsx)(`small`, {
                children: e.code
              })]
            })]
          })
        }, {
          label: y(`类型`),
          render: e => (0, R.jsx)(`span`, {
            className: `platform-tag`,
            children: e.supplierType === `INDIVIDUAL` ? y(`个人`) : y(`企业`)
          })
        }, {
          label: y(`联系人`),
          render: e => (0, R.jsxs)(`div`, {
            className: `stack`,
            children: [(0, R.jsx)(`span`, {
              children: e.contact
            }), (0, R.jsx)(`small`, {
              children: e.email || y(`未填写邮箱`)
            })]
          })
        }, {
          label: y(`资料审核`),
          render: e => (0, R.jsx)(b, {
            state: e.profileReviewState || e.state
          })
        }, {
          label: y(`合作状态`),
          render: e => (0, R.jsxs)(`span`, {
            className: `enabled-state ${e.enabled?``:`off`}`,
            children: [(0, R.jsx)(`i`, {}), e.enabled ? y(`启用中`) : y(`已停用`)]
          })
        }, ...s(`supplier.owner.assign`) ? [{
          label: y(`负责运营`),
          render: e => e.ownerName || y(`待分配`)
        }] : [], {
          label: y(`结算周期`),
          render: e => j(e.cycle, e.customCycleDays)
        }, {
          label: y(`最近更新`),
          render: e => (0, R.jsx)(`span`, {
            className: `subtle`,
            children: r(e.updatedAt)
          })
        }, {
          label: y(`操作`),
          render: e => (0, R.jsxs)(`button`, {
            className: `text-button`,
            onClick: t => {
              t.stopPropagation(), G(e.id)
            },
            children: [y(`查看 `), (0, R.jsx)(o, {
              name: `chevron`,
              size: 14
            })]
          })
        }]
      }), (0, R.jsx)(c, {
        data: Q.data,
        page: L,
        onPage: V,
        size: H,
        onSizeChange: e => {
          U(e), V(1)
        }
      })]
    }), !_ && W && (0, R.jsx)(O.Suspense, {
      fallback: (0, R.jsx)(m, {}),
      children: (0, R.jsx)(B, {
        id: W,
        onClose: () => G(null),
        onEdit: ee
      })
    }), J && (0, R.jsx)(D, {
      value: J,
      onClose: () => Y(null)
    }), K && (0, R.jsx)(x, {
      title: y(K === `new` ? `新建供应商` : `变更供应商资料`),
      fields: [...K === `new` ? [{
        name: `code`,
        label: y(`供应商代码`),
        full: !0,
        placeholder: y(`例如 SUP-2026-0008`),
        hint: y(`2-30 位字母、数字、下划线或短横线；创建后仅运营可修改`)
      }, {
        name: `supplierType`,
        label: y(`供应商类型`),
        type: `select`,
        full: !0,
        options: [{
          value: `COMPANY`,
          label: y(`企业`),
          tone: `blue`
        }, {
          value: `INDIVIDUAL`,
          label: y(`个人`),
          tone: `teal`
        }]
      }] : [], ...F, ...K === `new` ? I(X.data || []) : []],
      initial: te,
      onClose: () => q(null),
      submitLabel: y(`提交审核`),
      onSubmit: async e => {
        let t = {
          name: e.name,
          registrationNo: e.registrationNo || ``,
          supplierType: e.supplierType,
          country: e.country,
          contact: e.contact,
          phone: e.phone,
          email: e.email?.trim() || ``,
          cycle: e.cycle,
          customCycleDays: e.cycle === `CUSTOM` ? Number(e.customCycleDays) : null,
          version: Number(e.version || 0)
        };
        if (K === `new`) {
          let n = await S(`/suppliers`, {
            code: e.code.trim().toUpperCase(),
            profile: t,
            account: {
              mode: e.mode,
              userId: e.userId || null,
              username: e.username,
              displayName: e.displayName || e.contact,
              password: e.password || null
            }
          });
          Y(n.account)
        } else await g(`/suppliers/` + K.id, t);
        h(y(`资料已提交审核`)), l()
      }
    })]
  })
}
export {
  j as a, P as c, V as
  default, I as i, A as n, N as o, k as r, M as s, L as t
};