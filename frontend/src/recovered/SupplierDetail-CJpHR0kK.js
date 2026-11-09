// origin: assets/SupplierDetail-CJpHR0kK.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/OwnerSection-BV_jBT2b.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/SupplierPlatformSettings-DQ79klgY.js"]))) => i.map(i => d[i]);
import {
  B as e,
  C as t,
  G as n,
  P as r,
  S as i,
  T as ee,
  X as a,
  Y as o,
  Z as s,
  a as c,
  at as l,
  d as u,
  g as d,
  h as f,
  i as p,
  it as m,
  k as h,
  l as g,
  mt as _,
  o as v,
  p as y,
  rt as b,
  s as x,
  v as S,
  vt as C,
  x as w
} from "./index-Dnr0i-H9.js";
import {
  CredentialDialog as T
} from "./AccountDialogs-DkF7YQod.js";
import {
  a as E,
  c as te,
  i as D,
  n as ne,
  o as O,
  s as k
} from "./Suppliers-BquEthXG.js";
var A = C(s(), 1),
  j = a(),
  re = (0, A.lazy)(() => p(() => import(`./OwnerSection-BV_jBT2b.js`).then(e => ({
    default: e.OwnerSection
  })), __vite__mapDeps([0, 1, 2]))),
  ie = (0, A.lazy)(() => p(() => import(`./SupplierPlatformSettings-DQ79klgY.js`), __vite__mapDeps([3, 1, 2])));

function M({
  id: a,
  onClose: s,
  onEdit: p
}) {
  let {
    has: C,
    refresh: M,
    notify: N,
    user: P
  } = t(), F = !P.supplierId && ![`SUPPLIER`, `SUPPLIER_AGENT`].includes(P.role) && C(`supplier.read`), [I, ae] = (0, A.useState)(e(`tab`) === `settings` && !F ? `profile` : e(`tab`) || `profile`), [L, R] = (0, A.useState)(null), [oe, z] = (0, A.useState)(!1), [se, B] = (0, A.useState)(!1), [V, H] = (0, A.useState)(!1), [U, W] = (0, A.useState)(!1), [G, K] = (0, A.useState)(null), ce = i(U ? `/suppliers/available-users` : null), q = i(`/suppliers/` + a), J = i(C(`account.read`) ? `/accounts?supplierId=` + a : null), Y = i(`/documents?supplierId=` + a), X = (0, A.useRef)(null), [Z, Q] = (0, A.useState)(!1), [$, le] = (0, A.useState)({});
  async function ue(e) {
    if (e) {
      Q(!0);
      try {
        await l(a, e), N(_(`资质附件已上传`)), M()
      } catch (e) {
        N(e.message, !0)
      } finally {
        Q(!1)
      }
    }
  }
  return (0, j.jsxs)(n, {
    drawer: !0,
    title: q.data?.name || _(`供应商详情`),
    subtitle: q.data?.code,
    onClose: s,
    children: [q.data ? (0, j.jsxs)(j.Fragment, {
      children: [(0, j.jsxs)(`div`, {
        className: `supplier-cover`,
        children: [(0, j.jsx)(c, {
          name: q.data.name,
          size: `large`
        }), (0, j.jsxs)(`div`, {
          children: [(0, j.jsxs)(`strong`, {
            children: [q.data.country, ` · `, E(q.data.cycle, q.data.customCycleDays)]
          }), (0, j.jsxs)(`div`, {
            className: `inline-badges`,
            children: [(0, j.jsx)(v, {
              state: q.data.state
            }), (0, j.jsx)(`span`, {
              className: `muted`,
              children: q.data.enabled ? _(`合作启用中`) : _(`已停用`)
            })]
          })]
        }), C(`supplier.write`) && (0, j.jsx)(x, {
          icon: `quote`,
          onClick: () => p(q.data),
          children: _(`维护资料 `)
        })]
      }), (0, j.jsx)(w, {
        value: I,
        onChange: ae,
        items: [{
          id: `profile`,
          label: _(`基本资料`)
        }, ...F ? [{
          id: `settings`,
          label: _(`平台配置`)
        }] : [], {
          id: `documents`,
          label: _(`资质材料`),
          count: Y.data?.length || 0
        }, ...C(`account.read`) ? [{
          id: `accounts`,
          label: _(`收款账户`),
          count: J.data?.length || 0
        }] : []]
      }), I === `settings` && F && (0, j.jsx)(A.Suspense, {
        fallback: (0, j.jsx)(f, {}),
        children: (0, j.jsx)(ie, {
          supplierId: a
        })
      }), I === `profile` && (0, j.jsxs)(j.Fragment, {
        children: [(0, j.jsx)(g, {
          items: [
            [_(`供应商代码`), (0, j.jsxs)(`span`, {
              className: `supplier-code-value`,
              children: [q.data.code, !P.supplierId && C(`supplier.write`) && (0, j.jsx)(`button`, {
                className: `text-button`,
                onClick: () => z(!0),
                children: _(`修改编码 `)
              })]
            })],
            [_(`主体名称`), q.data.name],
            [_(`供应商类型`), q.data.supplierType === `INDIVIDUAL` ? _(`个人`) : _(`企业`)],
            [_(`企业注册编号`), q.data.supplierType === `COMPANY` ? q.data.registrationNo : _(`不适用`)],
            [_(`联系人`), q.data.contact],
            [_(`联系电话`), q.data.phone || _(`未填写`)],
            [_(`电子邮箱`), q.data.email || _(`未填写`)],
            [_(`结算周期`), E(q.data.cycle, q.data.customCycleDays)],
            [_(`更新时间`), r(q.data.updatedAt)]
          ]
        }), q.data.pendingProfile && (0, j.jsxs)(`section`, {
          className: `subsection`,
          children: [(0, j.jsx)(`h3`, {
            children: _(`本次提交的变更`)
          }), (0, j.jsx)(g, {
            items: Object.entries(JSON.parse(q.data.pendingProfile)).filter(([e, t]) => [`name`, `registrationNo`, `contact`, `phone`, `email`, `country`, `cycle`, `customCycleDays`].includes(e) && (e !== `customCycleDays` || t !== null)).map(([e, t]) => [{
              name: _(`主体名称`),
              registrationNo: _(`注册编号`),
              contact: _(`联系人`),
              phone: _(`电话`),
              email: _(`邮箱`),
              country: _(`国家 / 地区`),
              cycle: _(`结算周期`),
              customCycleDays: _(`每隔多少天结算`)
            } [e], e === `cycle` ? ne[String(t)] || String(t) : e === `email` && !t ? _(`未填写`) : String(t)])
          })]
        }), C(`supplier.owner.assign`) && (0, j.jsx)(A.Suspense, {
          fallback: (0, j.jsx)(f, {}),
          children: (0, j.jsx)(re, {
            supplierId: a,
            version: q.data.version,
            ownerUserId: q.data.ownerUserId,
            ownerName: q.data.ownerName,
            onChanged: M
          })
        }), !P.supplierId && (0, j.jsxs)(`section`, {
          className: `subsection`,
          children: [(0, j.jsxs)(`div`, {
            className: `section-title`,
            children: [(0, j.jsx)(`h3`, {
              children: _(`内部备注`)
            }), C(`supplier.write`) && (0, j.jsx)(`button`, {
              className: `text-button`,
              onClick: () => B(!0),
              children: _(`编辑 `)
            })]
          }), (0, j.jsx)(`p`, {
            className: `muted`,
            children: q.data.internalNote || _(`尚未添加内部备注`)
          })]
        }), !P.supplierId && (0, j.jsxs)(`section`, {
          className: `subsection`,
          children: [(0, j.jsxs)(`div`, {
            className: `section-title`,
            children: [(0, j.jsx)(`h3`, {
              children: _(`关联用户`)
            }), C(`supplier.users`) && (0, j.jsx)(`button`, {
              className: `text-button`,
              onClick: () => W(!0),
              children: _(`添加用户 `)
            })]
          }), q.data.linkedUsers?.map(e => (0, j.jsxs)(`div`, {
            className: `linked-user-row`,
            children: [(0, j.jsxs)(`span`, {
              children: [e.displayName, ` `, (0, j.jsx)(`small`, {
                className: `muted`,
                children: e.username
              })]
            }), (0, j.jsx)(v, {
              state: e.enabled ? `APPROVED` : `WITHDRAWN`,
              label: e.enabled ? _(`启用`) : _(`停用`)
            })]
          }, e.id))]
        }), q.data.reviewNote && (0, j.jsx)(d, {
          children: q.data.reviewNote
        }), C(`supplier.review`) && q.data.profileReviewState === `PENDING` && q.data.submittedBy !== P.id && q.data.profileSubmittedBy !== P.id && (0, j.jsx)(S, {
          onReview: async (e, t) => {
            await b(`/suppliers/${a}/review`, {
              approved: e,
              note: t
            }), N(_(e ? `资料审核已通过` : `已退回补充`)), M()
          }
        }), !P.supplierId && C(`supplier.toggle`) && (0, j.jsx)(`div`, {
          className: `subsection`,
          children: (0, j.jsx)(x, {
            variant: q.data.enabled ? `danger-quiet` : `secondary`,
            onClick: () => H(!0),
            children: q.data.enabled ? _(`停用供应商`) : _(`重新启用`)
          })
        })]
      }), I === `documents` && (0, j.jsxs)(j.Fragment, {
        children: [(0, j.jsxs)(`div`, {
          className: `section-title space-top`,
          children: [(0, j.jsx)(`h3`, {
            children: _(`主体证明与补充材料`)
          }), C(`file.write`) && (0, j.jsx)(x, {
            icon: `upload`,
            onClick: () => X.current?.click(),
            disabled: Z,
            children: _(Z ? `上传中…` : `上传材料`)
          }), (0, j.jsx)(`input`, {
            type: `file`,
            hidden: !0,
            ref: X,
            accept: `application/pdf,image/png,image/jpeg`,
            onChange: e => {
              ue(e.target.files?.[0]), e.target.value = ``
            }
          })]
        }), (0, j.jsx)(`p`, {
          className: `muted small`,
          children: _(`支持 PDF、PNG、JPG，单个文件不超过 10 MB。`)
        }), Y.data?.length ? Y.data.map(e => (0, j.jsxs)(`div`, {
          className: `document-row`,
          children: [(0, j.jsx)(`div`, {
            className: `file-icon`,
            children: (0, j.jsx)(o, {
              name: `quote`
            })
          }), (0, j.jsxs)(`div`, {
            children: [(0, j.jsx)(`strong`, {
              children: e.name
            }), (0, j.jsxs)(`small`, {
              children: [(e.bytes / 1024).toFixed(1), ` KB · `, r(e.createdAt)]
            })]
          }), (0, j.jsx)(`a`, {
            className: `text-button`,
            href: `/api/documents/${e.id}/download`,
            children: _(`下载 `)
          })]
        }, e.id)) : (0, j.jsx)(u, {
          text: _(`尚未上传资质材料`)
        })]
      }), I === `accounts` && (0, j.jsxs)(j.Fragment, {
        children: [(0, j.jsxs)(`div`, {
          className: `section-title space-top`,
          children: [(0, j.jsx)(`h3`, {
            children: _(`收款账户`)
          }), C(`account.write`) && (0, j.jsx)(x, {
            icon: `plus`,
            onClick: () => R(`new`),
            children: _(`新增账户 `)
          })]
        }), J.data?.map(e => (0, j.jsxs)(`section`, {
          className: `account-card`,
          children: [(0, j.jsxs)(`div`, {
            className: `section-title`,
            children: [(0, j.jsxs)(`div`, {
              className: `identity`,
              children: [(0, j.jsx)(`span`, {
                className: `bank-icon`,
                children: (0, j.jsx)(o, {
                  name: `bank`
                })
              }), (0, j.jsxs)(`div`, {
                children: [(0, j.jsx)(`strong`, {
                  children: h(e)
                }), (0, j.jsx)(`small`, {
                  children: e.holder
                })]
              })]
            }), (0, j.jsx)(v, {
              state: e.state,
              label: e.state === `APPROVED` ? _(`生效中`) : void 0
            })]
          }), (0, j.jsxs)(`div`, {
            className: `account-number`,
            children: [(0, j.jsx)(`span`, {
              children: $[e.id] || `•••• •••• •••• ${e.lastFour}`
            }), (0, j.jsx)(`b`, {
              children: e.currency
            }), C(`account.sensitive`) && (0, j.jsx)(`button`, {
              className: `icon-button`,
              "aria-label": _(`查看完整账号`),
              onClick: async () => {
                try {
                  let t = await b(`/accounts/${e.id}/reveal`, {});
                  le({
                    ...$,
                    [e.id]: t.accountNumber
                  })
                } catch (e) {
                  N(e.message, !0)
                }
              },
              children: (0, j.jsx)(o, {
                name: `eye`,
                size: 17
              })
            })]
          }), (0, j.jsx)(g, {
            items: [
              [_(`账户类型`), h(e)],
              [_(`收款户名`), e.holder],
              [_(`收款方式`), e.transferType === `INTERNAL_UID` ? _(`欧意 UID 内部转账`) : e.transferType === `ONCHAIN` ? _(`链上转账`) : e.providerCode === `AIRWALLEX` ? `Airwallex beneficiary ID` : _(`银行账户`)], ...e.network ? [
                [_(`转账网络`), e.network]
              ] : [], ...e.walletType ? [
                [_(`钱包类型`), e.walletType === `PRIVATE` ? _(`私人钱包`) : _(`交易所钱包`)]
              ] : [],
              [_(`申请类型`), e.replacesId ? _(`变更已有账户`) : _(`新增账户`)], ...e.replacesId ? [
                [_(`原账户`), te(J.data || [], e.replacesId)]
              ] : [],
              [_(`申请人`), e.submittedByName || _(`未知申请人`)],
              [_(`申请时间`), e.createdAt ? r(e.createdAt) : `—`], ...e.reviewNote ? [
                [_(`审核意见`), e.reviewNote]
              ] : []
            ]
          }), C(`account.write`) && e.state === `APPROVED` && (0, j.jsx)(`button`, {
            className: `text-button`,
            onClick: () => R(e),
            children: _(`申请变更 `)
          }), C(`account.review`) && e.state === `PENDING` && e.submittedBy !== P.id && e.createdBy !== P.id && e.updatedBy !== P.id && (0, j.jsx)(S, {
            onReview: async (t, n) => {
              await b(`/accounts/${e.id}/review`, {
                approved: t,
                note: n
              }), N(_(`账户审核已处理`)), M()
            }
          })]
        }, e.id)), !J.data?.length && (0, j.jsx)(u, {
          text: _(`暂无收款账户`)
        })]
      })]
    }) : q.error ? (0, j.jsx)(u, {
      text: q.error,
      error: !0
    }) : (0, j.jsx)(f, {}), L && q.data && (0, j.jsx)(y, {
      title: _(L === `new` ? `新增收款账户` : `提交账户变更`),
      subtitle: _(`仅支持与供应商主体同名的账户。`),
      fields: [{
        name: `accountType`,
        label: _(`账户类型`),
        type: `select`,
        full: !0,
        clearOnChange: [`accountNumber`, `transferType`, `network`, `walletType`],
        valuesOnChange: e => k(e) ? {
          currency: `USDT`,
          transferType: `ONCHAIN`,
          walletType: `PRIVATE`,
          network: ``
        } : {
          currency: `USD`,
          transferType: ``,
          walletType: ``,
          network: ``
        },
        options: [{
          value: `BANK`,
          label: _(`空中云汇`)
        }, {
          value: `OKX_USDT`,
          label: _(`欧意`)
        }, {
          value: `BINANCE_USDT`,
          label: _(`币安`)
        }]
      }, {
        name: `holder`,
        label: _(`收款户名`),
        full: !0
      }, {
        name: `accountNumber`,
        label: _(`Airwallex beneficiary ID / 收款地址 / UID`),
        minLength: 3,
        full: !0
      }, {
        name: `currency`,
        label: _(`收款币种`),
        type: `select`,
        visual: `currency`,
        options: e => (k(e.accountType) ? [`USDT`] : ee).map(e => ({
          value: e,
          label: e
        }))
      }, {
        name: `transferType`,
        label: _(`转账方式`),
        type: `select`,
        visible: e => k(e.accountType),
        options: e => e.accountType === `BINANCE_USDT` ? [{
          value: `ONCHAIN`,
          label: _(`链上转账`)
        }] : [{
          value: `ONCHAIN`,
          label: _(`链上转账`)
        }, {
          value: `INTERNAL_UID`,
          label: _(`欧意 UID 内部转账`)
        }]
      }, {
        name: `network`,
        label: _(`USDT 网络`),
        placeholder: _(`OKX 如 USDT-TRC20；Binance 如 TRX、BSC、ETH`),
        visible: e => k(e.accountType) && e.transferType === `ONCHAIN`
      }, {
        name: `walletType`,
        label: _(`钱包类型`),
        type: `select`,
        visible: e => k(e.accountType) && e.transferType === `ONCHAIN`,
        options: [{
          value: `PRIVATE`,
          label: _(`私人钱包`)
        }, {
          value: `EXCHANGE`,
          label: _(`交易所钱包`)
        }]
      }],
      initial: {
        holder: q.data.name,
        accountType: L === `new` ? `BANK` : L.accountType || `BANK`,
        currency: L === `new` ? `USD` : L.currency,
        transferType: L === `new` ? `ONCHAIN` : L.transferType || `ONCHAIN`,
        network: L === `new` ? `` : L.network || ``,
        walletType: L === `new` ? `PRIVATE` : L.walletType || `PRIVATE`
      },
      onClose: () => R(null),
      submitLabel: _(`提交审核`),
      onSubmit: async e => {
        await b(`/accounts`, {
          ...e,
          bank: O(e.accountType),
          currency: k(e.accountType) ? `USDT` : e.currency,
          transferType: k(e.accountType) ? e.transferType : null,
          network: k(e.accountType) && e.transferType === `ONCHAIN` ? e.network : null,
          walletType: k(e.accountType) && e.transferType === `ONCHAIN` ? e.walletType : null,
          supplierId: a,
          replacesId: L === `new` ? null : L.id
        }), N(_(`收款账户已提交审核`)), M()
      }
    }), G && (0, j.jsx)(T, {
      value: G,
      onClose: () => K(null)
    }), U && (0, j.jsx)(y, {
      title: _(`添加供应商用户`),
      fields: D(ce.data || []),
      initial: {
        mode: `NEW`,
        displayName: q.data?.contact || ``
      },
      onClose: () => W(!1),
      onSubmit: async e => {
        let t = await b(`/suppliers/${a}/users`, {
          mode: e.mode,
          userId: e.userId || null,
          username: e.username,
          displayName: e.displayName || q.data?.contact,
          password: e.password || null
        });
        K(t), M(), N(_(`用户已关联`))
      }
    }), se && (0, j.jsx)(y, {
      title: _(`内部备注`),
      fields: [{
        name: `note`,
        label: _(`备注`),
        type: `textarea`,
        full: !0,
        required: !1
      }],
      initial: {
        note: q.data?.internalNote || ``
      },
      onClose: () => B(!1),
      onSubmit: async e => {
        await m(`/suppliers/${a}/note`, {
          note: e.note || ``
        }), M(), N(_(`备注已保存`))
      }
    }), oe && q.data && (0, j.jsx)(y, {
      title: _(`修改供应商编码`),
      subtitle: _(`修改后新资源使用新编码；已创建资源的名称保持原样。`),
      fields: [{
        name: `code`,
        label: _(`供应商编码`),
        full: !0,
        hint: _(`2-30 位字母、数字、下划线或短横线；已使用过的编码不能复用`)
      }],
      initial: {
        code: q.data.code
      },
      onClose: () => z(!1),
      onSubmit: async e => {
        await m(`/suppliers/${a}/code`, {
          code: e.code.trim().toUpperCase(),
          version: q.data.version
        }), M(), N(_(`供应商编码已更新`))
      }
    }), V && (0, j.jsx)(y, {
      title: q.data?.enabled ? _(`停用供应商`) : _(`启用供应商`),
      fields: [{
        name: `note`,
        label: _(`操作原因`),
        type: `textarea`,
        full: !0
      }],
      onClose: () => H(!1),
      onSubmit: async e => {
        await b(`/suppliers/${a}/enabled`, {
          enabled: !q.data?.enabled,
          note: e.note
        }), M(), N(_(`供应商状态已更新`))
      }
    })]
  })
}
export {
  M as SupplierDetail
};
