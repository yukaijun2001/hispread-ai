// origin: assets/SupplierAccounts-CMP57Xp2.js
import {
  C as e,
  I as t,
  P as n,
  S as r,
  T as i,
  X as a,
  Y as o,
  Z as s,
  _ as c,
  a as l,
  c as u,
  f as d,
  g as f,
  k as p,
  m,
  mt as h,
  o as g,
  rt as _,
  s as v,
  u as y,
  vt as b,
  y as x
} from "./index-Dnr0i-H9.js";
import {
  i as S,
  r as C
} from "./QueryFilters-CwGBc_NH.js";
var w = b(s(), 1),
  T = a();

function E(e) {
  return e.providerCode === `AIRWALLEX` ? `Airwallex beneficiary ID` : e.accountType !== `OKX_USDT` && e.accountType !== `BINANCE_USDT` ? h(`收款账号`) : e.transferType === `INTERNAL_UID` ? h(`欧意 UID 内部转账`) : h(`链上转账 · {0}`, [e.network || h(`网络未填写`)])
}

function D({
  account: t
}) {
  let {
    has: n,
    notify: r
  } = e(), [i, a] = (0, w.useState)(``), [s, c] = (0, w.useState)(!1), l = n(`account.sensitive`);
  return (0, T.jsxs)(`div`, {
    className: `account-list-number`,
    children: [(0, T.jsxs)(`div`, {
      className: `stack`,
      children: [(0, T.jsx)(`strong`, {
        children: l && i ? i : `•••• ${t.lastFour}`
      }), (0, T.jsx)(`small`, {
        children: t.holder
      })]
    }), l && (0, T.jsx)(`button`, {
      className: `icon-button`,
      disabled: s,
      "aria-label": h(`{0} {1} 完整收款账号`, [h(i ? `隐藏` : `查看`), t.supplierName]),
      "aria-pressed": !!i,
      onClick: async () => {
        if (i) {
          a(``);
          return
        }
        c(!0);
        try {
          let e = await _(`/accounts/${t.id}/reveal`, {});
          a(e.accountNumber)
        } catch (e) {
          r(e.message, !0)
        } finally {
          c(!1)
        }
      },
      children: (0, T.jsx)(o, {
        name: i ? `close` : `eye`,
        size: 17
      })
    })]
  })
}

function O({
  view: a = `accounts`
}) {
  let {
    has: o,
    refresh: s,
    epoch: _
  } = e(), b = a === `recipients`, [O, k] = (0, w.useState)(``), [A, j] = (0, w.useState)(``), [M, N] = (0, w.useState)(``), [P, F] = (0, w.useState)(``), [I, L] = (0, w.useState)(b ? `APPROVED` : ``), [R, z] = (0, w.useState)(1), [B, V] = (0, w.useState)(10), H = o(`supplier.read`), U = S(H), W = new URLSearchParams({
    search: O,
    supplierId: A,
    accountType: M,
    currency: P,
    state: I,
    page: String(R),
    size: String(B)
  }), G = r(`/accounts/platform?${W}`), K = e => t => {
    e(t), z(1)
  };
  return (0, T.jsxs)(T.Fragment, {
    children: [(0, T.jsx)(m, {
      title: h(b ? `收款人汇总` : `供应商收款账户`),
      children: !b && H && (0, T.jsx)(v, {
        onClick: () => t(`suppliers`),
        children: h(`返回供应商列表`)
      })
    }), (0, T.jsxs)(`section`, {
      className: `panel supplier-account-list`,
      children: [b && (0, T.jsx)(`p`, {
        className: `account-summary-note`,
        children: h(`汇总供应商维护的收款账户，默认展示生效中的账户；待审核、已退回和已替换记录可通过状态筛选查看。 `)
      }), (0, T.jsxs)(d, {
        className: `supplier-account-toolbar`,
        actions: (0, T.jsx)(v, {
          icon: `refresh`,
          onClick: s,
          "aria-label": h(`刷新收款账户`),
          disabled: G.loading
        }),
        children: [(0, T.jsx)(x, {
          value: O,
          onChange: K(k),
          placeholder: h(`搜索供应商、户名、机构或尾号`)
        }), H && (0, T.jsx)(C, {
          label: h(`供应商筛选`),
          value: A,
          onChange: K(j),
          options: (U.data?.items || []).map(e => ({
            value: e.id,
            label: e.name,
            detail: e.code
          })),
          loading: U.loading,
          error: U.error
        }), (0, T.jsx)(y, {
          ariaLabel: h(`账户类型筛选`),
          value: M,
          onChange: K(N),
          visual: `account`,
          compact: !0,
          options: [{
            value: ``,
            label: h(`全部账户类型`)
          }, {
            value: `AIRWALLEX`,
            label: h(`空中云汇`)
          }, {
            value: `OKX_USDT`,
            label: h(`OKX 欧意`)
          }, {
            value: `BINANCE_USDT`,
            label: h(`Binance 币安`)
          }, {
            value: `LEGACY_BANK`,
            label: h(`历史银行账户`)
          }]
        }), (0, T.jsx)(y, {
          ariaLabel: h(`收款币种筛选`),
          value: P,
          onChange: K(F),
          visual: `currency`,
          compact: !0,
          options: [{
            value: ``,
            label: h(`全部币种`)
          }, ...i.map(e => ({
            value: e,
            label: e
          }))]
        }), (0, T.jsx)(y, {
          ariaLabel: h(`账户状态筛选`),
          value: I,
          onChange: K(L),
          compact: !0,
          options: [{
            value: ``,
            label: h(`全部状态`)
          }, {
            value: `APPROVED`,
            label: h(`生效中`),
            tone: `approved`
          }, {
            value: `PENDING`,
            label: h(`待审核`),
            tone: `pending`
          }, {
            value: `REJECTED`,
            label: h(`已退回`),
            tone: `rejected`
          }, {
            value: `SUPERSEDED`,
            label: h(`已替换`),
            tone: `withdrawn`
          }]
        })]
      }), U.error && (0, T.jsxs)(f, {
        tone: `red`,
        children: [h(`供应商筛选项加载失败：`), U.error, h(`。可使用关键词搜索，或刷新重试。 `)]
      }), (0, T.jsx)(u, {
        data: G.loading ? [] : G.data?.items || [],
        loading: G.loading,
        error: G.error,
        columns: [{
          label: h(`供应商`),
          render: (e, t) => (0, T.jsxs)(`div`, {
            className: `identity`,
            children: [(0, T.jsx)(l, {
              name: e.supplierName,
              index: t
            }), (0, T.jsxs)(`div`, {
              children: [(0, T.jsx)(`strong`, {
                children: e.supplierName
              }), (0, T.jsx)(`small`, {
                children: e.supplierCode
              })]
            })]
          })
        }, {
          label: h(`账户类型 / 转账方式`),
          render: e => (0, T.jsxs)(`div`, {
            className: `stack`,
            children: [(0, T.jsx)(`strong`, {
              children: p(e)
            }), (0, T.jsx)(`small`, {
              children: E(e)
            }), e.transferType === `ONCHAIN` && e.walletType && (0, T.jsx)(`small`, {
              children: e.walletType === `PRIVATE` ? h(`私人钱包`) : h(`交易所钱包`)
            })]
          })
        }, {
          label: h(`收款人 / 账户`),
          render: e => (0, T.jsx)(D, {
            account: e
          }, `${e.id}:${W}:${_}`)
        }, {
          label: h(`币种`),
          render: e => (0, T.jsx)(`strong`, {
            children: e.currency
          })
        }, {
          label: h(`状态`),
          render: e => (0, T.jsx)(g, {
            state: e.state,
            label: e.state === `APPROVED` ? h(`生效中`) : void 0
          })
        }, {
          label: h(`提交时间`),
          render: e => (0, T.jsx)(`span`, {
            className: `subtle`,
            children: n(e.createdAt)
          })
        }, {
          label: h(`操作`),
          render: e => H ? (0, T.jsx)(`button`, {
            className: `text-button`,
            onClick: () => t(`suppliers?id=${encodeURIComponent(e.supplierId)}`),
            children: h(`查看供应商 `)
          }) : `—`
        }]
      }), !G.loading && !G.error && (0, T.jsx)(c, {
        data: G.data,
        page: R,
        onPage: z,
        size: B,
        onSizeChange: e => {
          V(e), z(1)
        }
      })]
    })]
  })
}
export {
  O as
  default
};