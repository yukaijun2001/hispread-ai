// origin: assets/MySupplierProfile-DPM4wUP0.js
import {
  C as e,
  P as t,
  S as n,
  T as r,
  X as i,
  Y as a,
  Z as o,
  a as s,
  at as c,
  d as l,
  g as u,
  h as d,
  it as f,
  k as p,
  l as m,
  mt as h,
  o as g,
  rt as _,
  s as v,
  u as y,
  vt as b
} from "./index-Dnr0i-H9.js";
import {
  a as x,
  o as S,
  r as C,
  s as w
} from "./Suppliers-BquEthXG.js";
var T = b(o(), 1),
  E = i();

function D({
  supplier: n
}) {
  let {
    has: r,
    refresh: i,
    notify: a
  } = e(), [o, c] = (0, T.useState)(!1), [l, d] = (0, T.useState)({}), [p, _] = (0, T.useState)(!1), [b, S] = (0, T.useState)(``), w = x(n.cycle, n.customCycleDays);

  function D() {
    d({
      name: n.name,
      registrationNo: n.registrationNo,
      country: n.country,
      contact: n.contact,
      phone: n.phone,
      email: n.email,
      cycle: n.cycle,
      customCycleDays: String(n.customCycleDays ?? ``)
    }), S(``), c(!0)
  }

  function O(e, t) {
    d(n => ({
      ...n,
      [e]: t,
      ...e === `cycle` ? {
        customCycleDays: ``
      } : {}
    }))
  }
  async function k(e) {
    if (e.preventDefault(), !p) {
      _(!0), S(``);
      try {
        await f(`/suppliers/${n.id}`, {
          name: l.name,
          registrationNo: l.registrationNo || ``,
          supplierType: n.supplierType,
          country: l.country,
          contact: l.contact,
          phone: l.phone,
          email: l.email?.trim() || ``,
          cycle: l.cycle,
          customCycleDays: l.cycle === `CUSTOM` ? Number(l.customCycleDays) : null,
          version: n.version
        }), a(h(`资料修改已提交审核`)), c(!1), i()
      } catch (e) {
        S(e.message)
      } finally {
        _(!1)
      }
    }
  }
  return (0, E.jsxs)(`section`, {
    className: `panel my-supplier-profile`,
    children: [(0, E.jsxs)(`div`, {
      className: `my-supplier-profile-head`,
      children: [(0, E.jsx)(s, {
        name: n.name,
        size: `large`
      }), (0, E.jsxs)(`div`, {
        className: `my-supplier-profile-identity`,
        children: [(0, E.jsx)(`h2`, {
          children: n.name
        }), (0, E.jsxs)(`p`, {
          children: [n.supplierType === `INDIVIDUAL` ? h(`个人`) : h(`企业`), n.country ? ` · ${n.country}` : ``]
        })]
      }), (0, E.jsxs)(`div`, {
        className: `my-supplier-profile-status`,
        children: [(0, E.jsx)(`span`, {
          children: h(`资料审核`)
        }), (0, E.jsx)(g, {
          state: n.profileReviewState || n.state
        })]
      })]
    }), n.pendingProfile && (0, E.jsx)(u, {
      tone: `amber`,
      children: h(`资料修改已提交审核；审核通过前，下面显示的是当前生效资料。`)
    }), !n.enabled && (0, E.jsx)(u, {
      tone: `amber`,
      children: h(`目前合作已停用，历史资料仍可查看。`)
    }), n.profileReviewState === `REJECTED` && n.reviewNote && (0, E.jsxs)(u, {
      tone: `red`,
      children: [h(`审核意见：`), n.reviewNote]
    }), (0, E.jsxs)(`form`, {
      onSubmit: k,
      children: [(0, E.jsxs)(`div`, {
        className: `my-supplier-profile-section`,
        children: [(0, E.jsx)(`h3`, {
          children: h(`主体信息`)
        }), o ? (0, E.jsxs)(`div`, {
          className: `my-supplier-edit-grid`,
          children: [(0, E.jsxs)(`label`, {
            className: `field`,
            children: [(0, E.jsx)(`span`, {
              children: h(`主体名称`)
            }), (0, E.jsx)(`input`, {
              required: !0,
              value: l.name || ``,
              onChange: e => O(`name`, e.target.value)
            })]
          }), (0, E.jsxs)(`div`, {
            className: `field`,
            children: [(0, E.jsx)(`span`, {
              children: h(`主体类型`)
            }), (0, E.jsx)(`strong`, {
              className: `my-supplier-fixed-value`,
              children: n.supplierType === `INDIVIDUAL` ? h(`个人`) : h(`企业`)
            })]
          }), n.supplierType === `COMPANY` && (0, E.jsxs)(`label`, {
            className: `field`,
            children: [(0, E.jsx)(`span`, {
              children: h(`企业注册编号`)
            }), (0, E.jsx)(`input`, {
              required: !0,
              value: l.registrationNo || ``,
              onChange: e => O(`registrationNo`, e.target.value)
            })]
          }), (0, E.jsxs)(`label`, {
            className: `field`,
            children: [(0, E.jsx)(`span`, {
              children: h(`国家 / 地区`)
            }), (0, E.jsx)(`input`, {
              required: !0,
              value: l.country || ``,
              onChange: e => O(`country`, e.target.value)
            })]
          })]
        }) : (0, E.jsx)(m, {
          items: [
            [h(`主体类型`), n.supplierType === `INDIVIDUAL` ? h(`个人`) : h(`企业`)], ...n.supplierType === `COMPANY` ? [
              [h(`企业注册编号`), n.registrationNo]
            ] : [],
            [h(`国家 / 地区`), n.country]
          ]
        })]
      }), (0, E.jsxs)(`div`, {
        className: `my-supplier-profile-section`,
        children: [(0, E.jsx)(`h3`, {
          children: h(`联系与结算`)
        }), o ? (0, E.jsxs)(`div`, {
          className: `my-supplier-edit-grid`,
          children: [(0, E.jsxs)(`label`, {
            className: `field`,
            children: [(0, E.jsx)(`span`, {
              children: h(`联系人`)
            }), (0, E.jsx)(`input`, {
              required: !0,
              value: l.contact || ``,
              onChange: e => O(`contact`, e.target.value)
            })]
          }), (0, E.jsxs)(`label`, {
            className: `field`,
            children: [(0, E.jsx)(`span`, {
              children: h(`联系电话`)
            }), (0, E.jsx)(`input`, {
              placeholder: h(`选填`),
              value: l.phone || ``,
              onChange: e => O(`phone`, e.target.value)
            })]
          }), (0, E.jsxs)(`label`, {
            className: `field`,
            children: [(0, E.jsx)(`span`, {
              children: h(`电子邮箱`)
            }), (0, E.jsx)(`input`, {
              type: `email`,
              placeholder: h(`选填`),
              value: l.email || ``,
              onChange: e => O(`email`, e.target.value)
            }), (0, E.jsx)(`small`, {
              children: h(`填写时需为有效邮箱格式`)
            })]
          }), (0, E.jsxs)(`div`, {
            className: `field`,
            children: [(0, E.jsx)(`span`, {
              children: h(`结算周期`)
            }), (0, E.jsx)(y, {
              ariaLabel: h(`结算周期`),
              value: l.cycle || ``,
              onChange: e => O(`cycle`, e),
              options: C
            })]
          }), l.cycle === `CUSTOM` && (0, E.jsxs)(`label`, {
            className: `field`,
            children: [(0, E.jsx)(`span`, {
              children: h(`每隔多少天结算`)
            }), (0, E.jsx)(`input`, {
              required: !0,
              type: `number`,
              min: `1`,
              max: `365`,
              step: `1`,
              placeholder: h(`例如 10`),
              value: l.customCycleDays || ``,
              onChange: e => O(`customCycleDays`, e.target.value)
            }), (0, E.jsx)(`small`, {
              children: h(`结算单的实际起止日期仍在创建时确认`)
            })]
          })]
        }) : (0, E.jsx)(m, {
          items: [
            [h(`联系人`), n.contact],
            [h(`联系电话`), n.phone || h(`未填写`)],
            [h(`电子邮箱`), n.email || h(`未填写`)],
            [h(`结算周期`), w]
          ]
        })]
      }), b && (0, E.jsx)(u, {
        tone: `red`,
        children: b
      }), (0, E.jsxs)(`div`, {
        className: `my-supplier-profile-footer`,
        children: [(0, E.jsxs)(`span`, {
          children: [h(`最近更新：`), t(n.updatedAt)]
        }), (0, E.jsx)(`div`, {
          children: o ? (0, E.jsxs)(E.Fragment, {
            children: [(0, E.jsx)(v, {
              type: `button`,
              disabled: p,
              onClick: () => c(!1),
              children: h(`取消 `)
            }), (0, E.jsx)(v, {
              type: `submit`,
              variant: `primary`,
              disabled: p,
              children: h(p ? `提交中…` : `提交资料修改`)
            })]
          }) : r(`supplier.write`) && !n.pendingProfile && (0, E.jsx)(v, {
            type: `button`,
            variant: `primary`,
            onClick: D,
            children: h(`修改资料 `)
          })
        })]
      })]
    })]
  })
}

function O({
  supplier: t
}) {
  let {
    has: i,
    refresh: o,
    notify: s
  } = e(), c = n(i(`account.read`) ? `/accounts?supplierId=${t.id}` : null), [f, m] = (0, T.useState)(null), [b, x] = (0, T.useState)({}), [C, D] = (0, T.useState)(!1), [O, k] = (0, T.useState)(``);

  function A(e) {
    m(e), x({
      holder: t.name,
      bank: e === `new` ? `Airwallex` : e.bank,
      currency: e === `new` ? `USD` : e.currency,
      accountType: e === `new` ? `BANK` : e.accountType || `BANK`,
      transferType: e === `new` ? `ONCHAIN` : e.transferType || `ONCHAIN`,
      network: e === `new` ? `` : e.network || ``,
      walletType: e === `new` ? `PRIVATE` : e.walletType || `PRIVATE`,
      accountNumber: ``
    }), k(``)
  }
  async function j(e) {
    if (e.preventDefault(), !C && f) {
      D(!0), k(``);
      try {
        await _(`/accounts`, {
          supplierId: t.id,
          holder: b.holder.trim(),
          bank: S(b.accountType),
          accountNumber: b.accountNumber.trim(),
          currency: b.currency,
          accountType: b.accountType || `BANK`,
          transferType: w(b.accountType) ? b.transferType : null,
          network: w(b.accountType) && b.transferType === `ONCHAIN` ? b.network.trim() : null,
          walletType: w(b.accountType) && b.transferType === `ONCHAIN` ? b.walletType : null,
          replacesId: f === `new` ? null : f.id
        }), s(h(`收款账户已提交审核`)), m(null), o()
      } catch (e) {
        k(e.message)
      } finally {
        D(!1)
      }
    }
  }
  return (0, E.jsxs)(`section`, {
    className: `panel my-supplier-bank-accounts`,
    children: [(0, E.jsxs)(`div`, {
      className: `my-supplier-documents-head`,
      children: [(0, E.jsxs)(`div`, {
        children: [(0, E.jsx)(`h3`, {
          children: h(`收款账户`)
        }), (0, E.jsx)(`p`, {
          children: h(`账户变更须经审核，审核通过前旧账户仍有效`)
        })]
      }), i(`account.write`) && t.enabled && !f && (0, E.jsx)(v, {
        type: `button`,
        icon: `plus`,
        onClick: () => A(`new`),
        children: h(`新增账户 `)
      })]
    }), i(`account.read`) ? c.error ? (0, E.jsx)(l, {
      text: c.error,
      error: !0
    }) : c.loading && !c.data ? (0, E.jsx)(d, {}) : c.data?.length ? c.data.map(e => {
      let n = c.data?.some(t => t.state === `PENDING` && t.replacesId === e.id);
      return (0, E.jsxs)(`div`, {
        className: `my-supplier-bank-row`,
        children: [(0, E.jsxs)(`div`, {
          className: `my-supplier-bank-row-head`,
          children: [(0, E.jsx)(`span`, {
            className: `bank-icon`,
            children: (0, E.jsx)(a, {
              name: `bank`
            })
          }), (0, E.jsxs)(`div`, {
            children: [(0, E.jsx)(`strong`, {
              children: p(e)
            }), (0, E.jsx)(`small`, {
              children: e.holder
            })]
          }), (0, E.jsx)(g, {
            state: e.state,
            label: e.state === `APPROVED` ? h(`生效中`) : void 0
          })]
        }), (0, E.jsxs)(`div`, {
          className: `my-supplier-bank-row-bottom`,
          children: [(0, E.jsxs)(`span`, {
            children: [e.currency, ` ·`, ` `, e.transferType === `INTERNAL_UID` ? `UID` : e.network || h(`收款账号`), ` `, h(`· 尾号 `), e.lastFour]
          }), e.state === `PENDING` && (0, E.jsx)(`span`, {
            className: `muted`,
            children: h(`审核通过后才可用于收款`)
          }), n && (0, E.jsx)(`span`, {
            className: `muted`,
            children: h(`变更审核中，当前账户仍有效`)
          }), i(`account.write`) && t.enabled && e.state === `APPROVED` && !n && !f && (0, E.jsx)(v, {
            type: `button`,
            onClick: () => A(e),
            children: h(`申请变更 `)
          })]
        }), e.state === `REJECTED` && e.reviewNote && (0, E.jsxs)(u, {
          tone: `red`,
          children: [h(`退回原因：`), e.reviewNote]
        })]
      }, e.id)
    }) : (0, E.jsx)(l, {
      text: h(`尚未添加收款账户`)
    }) : (0, E.jsx)(l, {
      text: h(`当前账号没有收款账户查看权限`),
      error: !0
    }), f && (0, E.jsxs)(`form`, {
      className: `my-supplier-bank-form`,
      onSubmit: j,
      children: [(0, E.jsx)(`h4`, {
        children: h(f === `new` ? `新增收款账户` : `提交账户变更`)
      }), f !== `new` && (0, E.jsxs)(u, {
        tone: `amber`,
        children: [h(`原账户 `), p(f), ` · `, f.currency, h(` · 尾号`), ` `, f.lastFour, h(`仍有效；新账户审核通过后才会替换它。 `)]
      }), (0, E.jsx)(`p`, {
        className: `muted small`,
        children: h(`仅支持与当前供应商主体同名的账户；完整账号、地址或 UID 不会在页面回显。 `)
      }), (0, E.jsxs)(`div`, {
        className: `my-supplier-edit-grid`,
        children: [(0, E.jsxs)(`div`, {
          className: `field`,
          children: [(0, E.jsx)(`span`, {
            children: h(`账户类型`)
          }), (0, E.jsx)(y, {
            ariaLabel: h(`账户类型`),
            value: b.accountType || `BANK`,
            onChange: e => x(t => ({
              ...t,
              accountType: e,
              currency: w(e) ? `USDT` : `USD`,
              bank: S(e),
              transferType: w(e) ? `ONCHAIN` : ``
            })),
            options: [{
              value: `BANK`,
              label: h(`空中云汇`)
            }, {
              value: `OKX_USDT`,
              label: h(`欧意`)
            }, {
              value: `BINANCE_USDT`,
              label: h(`币安`)
            }]
          })]
        }), (0, E.jsxs)(`label`, {
          className: `field`,
          children: [(0, E.jsx)(`span`, {
            children: h(`收款户名`)
          }), (0, E.jsx)(`input`, {
            required: !0,
            maxLength: 160,
            value: b.holder || ``,
            onChange: e => x(t => ({
              ...t,
              holder: e.target.value
            }))
          })]
        }), (0, E.jsxs)(`label`, {
          className: `field`,
          children: [(0, E.jsx)(`span`, {
            children: b.accountType === `OKX_USDT` ? h(`收款地址 / 欧意 UID`) : b.accountType === `BINANCE_USDT` ? h(`币安 USDT 收款地址`) : `Airwallex beneficiary ID`
          }), (0, E.jsx)(`input`, {
            required: !0,
            minLength: 3,
            maxLength: 300,
            autoComplete: `off`,
            value: b.accountNumber || ``,
            onChange: e => x(t => ({
              ...t,
              accountNumber: e.target.value
            }))
          })]
        }), (0, E.jsxs)(`div`, {
          className: `field`,
          children: [(0, E.jsx)(`span`, {
            children: h(`收款币种`)
          }), (0, E.jsx)(y, {
            ariaLabel: h(`收款币种`),
            value: b.currency || ``,
            visual: `currency`,
            onChange: e => x(t => ({
              ...t,
              currency: e
            })),
            options: (w(b.accountType) ? [`USDT`] : r).map(e => ({
              value: e,
              label: e
            }))
          })]
        }), w(b.accountType) && (0, E.jsxs)(E.Fragment, {
          children: [(0, E.jsxs)(`div`, {
            className: `field`,
            children: [(0, E.jsx)(`span`, {
              children: h(`转账方式`)
            }), (0, E.jsx)(y, {
              ariaLabel: h(`转账方式`),
              value: b.transferType || `ONCHAIN`,
              onChange: e => x(t => ({
                ...t,
                transferType: e
              })),
              options: b.accountType === `BINANCE_USDT` ? [{
                value: `ONCHAIN`,
                label: h(`链上转账`)
              }] : [{
                value: `ONCHAIN`,
                label: h(`链上转账`)
              }, {
                value: `INTERNAL_UID`,
                label: h(`欧意 UID 内部转账`)
              }]
            })]
          }), b.transferType !== `INTERNAL_UID` && (0, E.jsxs)(E.Fragment, {
            children: [(0, E.jsxs)(`label`, {
              className: `field`,
              children: [(0, E.jsx)(`span`, {
                children: h(`USDT 网络`)
              }), (0, E.jsx)(`input`, {
                required: !0,
                placeholder: b.accountType === `BINANCE_USDT` ? h(`如 TRX、BSC、ETH`) : h(`如 USDT-TRC20`),
                value: b.network || ``,
                onChange: e => x(t => ({
                  ...t,
                  network: e.target.value
                }))
              })]
            }), (0, E.jsxs)(`div`, {
              className: `field`,
              children: [(0, E.jsx)(`span`, {
                children: h(`钱包类型`)
              }), (0, E.jsx)(y, {
                ariaLabel: h(`钱包类型`),
                value: b.walletType || `PRIVATE`,
                onChange: e => x(t => ({
                  ...t,
                  walletType: e
                })),
                options: [{
                  value: `PRIVATE`,
                  label: h(`私人钱包`)
                }, {
                  value: `EXCHANGE`,
                  label: h(`交易所钱包`)
                }]
              })]
            })]
          })]
        })]
      }), O && (0, E.jsx)(u, {
        tone: `red`,
        children: O
      }), (0, E.jsxs)(`div`, {
        className: `my-supplier-bank-form-actions`,
        children: [(0, E.jsx)(v, {
          type: `button`,
          disabled: C,
          onClick: () => m(null),
          children: h(`取消 `)
        }), (0, E.jsx)(v, {
          type: `submit`,
          variant: `primary`,
          disabled: C,
          children: h(C ? `提交中…` : `提交账户审核`)
        })]
      })]
    })]
  })
}

function k({
  supplierId: r
}) {
  let {
    has: i,
    refresh: o,
    notify: s
  } = e(), u = n(`/documents?supplierId=${r}`), f = (0, T.useRef)(null), [p, m] = (0, T.useState)(!1);
  async function g(e) {
    if (e) {
      m(!0);
      try {
        await c(r, e), s(h(`资质材料已上传`)), o()
      } catch (e) {
        s(e.message, !0)
      } finally {
        m(!1)
      }
    }
  }
  return (0, E.jsxs)(`section`, {
    className: `panel my-supplier-documents`,
    children: [(0, E.jsxs)(`div`, {
      className: `my-supplier-documents-head`,
      children: [(0, E.jsxs)(`div`, {
        children: [(0, E.jsx)(`h3`, {
          children: h(`资质材料`)
        }), (0, E.jsx)(`p`, {
          children: h(`主体证明与补充材料`)
        })]
      }), i(`file.write`) && (0, E.jsxs)(E.Fragment, {
        children: [(0, E.jsx)(v, {
          icon: `upload`,
          disabled: p,
          onClick: () => f.current?.click(),
          children: h(p ? `上传中…` : `上传材料`)
        }), (0, E.jsx)(`input`, {
          type: `file`,
          hidden: !0,
          ref: f,
          accept: `application/pdf,image/png,image/jpeg`,
          onChange: e => {
            g(e.target.files?.[0]), e.target.value = ``
          }
        })]
      })]
    }), u.error ? (0, E.jsx)(l, {
      text: u.error,
      error: !0
    }) : u.loading && !u.data ? (0, E.jsx)(d, {}) : u.data?.length ? u.data.map(e => (0, E.jsxs)(`div`, {
      className: `document-row`,
      children: [(0, E.jsx)(`div`, {
        className: `file-icon`,
        children: (0, E.jsx)(a, {
          name: `quote`
        })
      }), (0, E.jsxs)(`div`, {
        children: [(0, E.jsx)(`strong`, {
          children: e.name
        }), (0, E.jsxs)(`small`, {
          children: [(e.bytes / 1024).toFixed(1), ` KB · `, t(e.createdAt)]
        })]
      }), (0, E.jsx)(`a`, {
        className: `text-button`,
        href: `/api/documents/${e.id}/download`,
        children: h(`下载 `)
      })]
    }, e.id)) : (0, E.jsx)(l, {
      text: h(`尚未上传资质材料`)
    }), (0, E.jsx)(`p`, {
      className: `muted small`,
      children: h(`支持 PDF、PNG、JPG，单个文件不超过 10 MB。`)
    })]
  })
}

function A({
  supplier: e,
  supplierId: t
}) {
  return (0, E.jsxs)(E.Fragment, {
    children: [(0, E.jsx)(D, {
      supplier: e
    }), (0, E.jsx)(O, {
      supplier: e
    }), (0, E.jsx)(k, {
      supplierId: t
    })]
  })
}
export {
  A as MySupplierOverview
};