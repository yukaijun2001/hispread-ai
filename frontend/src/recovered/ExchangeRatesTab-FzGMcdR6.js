// origin: assets/ExchangeRatesTab-FzGMcdR6.js
import {
  C as e,
  P as t,
  S as n,
  T as r,
  X as i,
  Z as a,
  _ as o,
  c as s,
  f as c,
  g as l,
  mt as u,
  o as d,
  p as f,
  rt as p,
  s as m,
  vt as h,
  y as g
} from "./index-Dnr0i-H9.js";
var _ = h(a(), 1),
  v = i();

function y({
  supplierSide: i
}) {
  let {
    has: a,
    refresh: h,
    notify: y
  } = e(), [b, x] = (0, _.useState)(``), [S, C] = (0, _.useState)(1), [w, T] = (0, _.useState)(10), [E, D] = (0, _.useState)(!1), [O, k] = (0, _.useState)(null), A = n(i ? null : `/exchange-rates?search=${encodeURIComponent(b)}&page=${S}&size=${w}`), j = n(i ? `/exchange-rates/current` : null), M = i ? j.data || [] : A.data?.items || [];
  return (0, v.jsxs)(v.Fragment, {
    children: [(0, v.jsxs)(`section`, {
      className: `panel`,
      children: [(0, v.jsx)(c, {
        actions: (0, v.jsxs)(v.Fragment, {
          children: [!i && a(`exchange_rate.write`) && (0, v.jsx)(m, {
            variant: `primary`,
            icon: `plus`,
            onClick: () => D(!0),
            children: u(`新增版本 `)
          }), (0, v.jsx)(m, {
            icon: `refresh`,
            "aria-label": u(`刷新汇率`),
            onClick: h
          })]
        }),
        children: i ? (0, v.jsx)(`span`, {
          children: u(`当前已生效的公开参考汇率`)
        }) : (0, v.jsx)(g, {
          value: b,
          onChange: e => {
            x(e), C(1)
          },
          placeholder: u(`搜索币种对或汇率来源`)
        })
      }), (0, v.jsx)(s, {
        data: M,
        loading: i ? j.loading : A.loading,
        error: i ? j.error : A.error,
        columns: [{
          label: u(`币种对`),
          render: e => (0, v.jsxs)(`strong`, {
            children: [e.baseCurrency, ` / `, e.quoteCurrency]
          })
        }, {
          label: u(`汇率`),
          render: e => (0, v.jsxs)(`div`, {
            className: `stack`,
            children: [(0, v.jsxs)(`strong`, {
              className: `money`,
              children: [`1 `, e.baseCurrency, ` = `, e.rate, ` `, e.quoteCurrency]
            }), (0, v.jsxs)(`small`, {
              children: [u(`版本 V`), e.version]
            })]
          })
        }, {
          label: u(`生效时间`),
          render: e => t(e.effectiveFrom)
        }, {
          label: u(`汇率来源`),
          render: e => e.source
        }, ...i ? [] : [{
          label: u(`状态`),
          render: e => (0, v.jsx)(d, {
            state: e.enabled ? `APPROVED` : `WITHDRAWN`,
            label: e.enabled ? new Date(e.effectiveFrom) <= new Date ? u(`已发布`) : u(`待生效`) : u(`已停用`)
          })
        }, {
          label: u(`操作`),
          render: e => a(`exchange_rate.write`) ? (0, v.jsx)(`button`, {
            className: `text-button`,
            onClick: () => k(e),
            children: e.enabled ? u(`停用`) : u(`重新发布`)
          }) : (0, v.jsx)(`span`, {
            children: `—`
          })
        }]]
      }), !i && (0, v.jsx)(o, {
        data: A.data,
        page: S,
        onPage: C,
        size: w,
        onSizeChange: e => {
          T(e), C(1)
        }
      })]
    }), i && (0, v.jsx)(l, {
      children: u(`这里只展示平台已发布并到达生效时间的最新版本；实际付款采用的汇率以对应付款记录快照为准。 `)
    }), E && (0, v.jsx)(f, {
      title: u(`新增汇率版本`),
      subtitle: u(`同一币种对自动递增版本号，历史版本不可修改。`),
      fields: [{
        name: `baseCurrency`,
        label: u(`基准币种`),
        type: `select`,
        visual: `currency`,
        options: r.map(e => ({
          value: e,
          label: e
        }))
      }, {
        name: `quoteCurrency`,
        label: u(`报价币种`),
        type: `select`,
        visual: `currency`,
        options: r.map(e => ({
          value: e,
          label: e
        }))
      }, {
        name: `rate`,
        label: u(`汇率（1 基准币种兑换）`),
        type: `number`,
        min: `0.000000000001`,
        full: !0
      }, {
        name: `effectiveFrom`,
        label: u(`生效时间`),
        type: `datetime-local`,
        full: !0
      }],
      initial: {
        baseCurrency: `USD`,
        quoteCurrency: `CNY`,
        effectiveFrom: new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16)
      },
      onClose: () => D(!1),
      onSubmit: async e => {
        if (e.baseCurrency === e.quoteCurrency) throw Error(u(`基准币种与报价币种不能相同`));
        await p(`/exchange-rates`, {
          ...e,
          effectiveFrom: new Date(e.effectiveFrom).toISOString()
        }), h(), y(u(`汇率新版本已发布`))
      }
    }), O && (0, v.jsx)(f, {
      title: O.enabled ? u(`停用汇率版本`) : u(`重新发布汇率版本`),
      subtitle: `${O.baseCurrency}/${O.quoteCurrency} · V${O.version}`,
      fields: [{
        name: `note`,
        label: u(`变更原因`),
        type: `textarea`,
        full: !0
      }],
      onClose: () => k(null),
      onSubmit: async e => {
        await p(`/exchange-rates/${O.id}/enabled`, {
          enabled: !O.enabled,
          version: O.version,
          note: e.note
        }), k(null), h(), y(u(`汇率版本状态已更新`))
      }
    })]
  })
}
export {
  y as ExchangeRatesTab
};