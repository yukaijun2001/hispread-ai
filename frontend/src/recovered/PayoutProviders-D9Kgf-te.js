// origin: assets/PayoutProviders-D9Kgf-te.js
import {
  C as e,
  I as t,
  P as n,
  S as r,
  X as i,
  Z as a,
  d as o,
  g as s,
  h as c,
  it as l,
  m as u,
  mt as d,
  o as f,
  ot as p,
  rt as m,
  s as h,
  u as g,
  vt as _,
  x as v
} from "./index-Dnr0i-H9.js";
var y = _(a(), 1),
  b = i(),
  x = [{
    code: `AIRWALLEX`,
    title: d(`Airwallex 空中云汇`),
    description: d(`使用已保存的 beneficiary ID 执行同币种付款，支持 Sandbox 与生产环境分离配置。`)
  }, {
    code: `OKX_USDT`,
    title: `OKX USDT`,
    description: d(`欧意 USDT 链上提币与 UID 内部转账。`)
  }, {
    code: `BINANCE_USDT`,
    title: `Binance USDT`,
    description: d(`币安 USDT 链上提币，执行前实时校验余额、网络和手续费。`)
  }];

function S() {
  let {
    has: n
  } = e(), [r, i] = (0, y.useState)(`AIRWALLEX`);
  return (0, b.jsxs)(b.Fragment, {
    children: [(0, b.jsx)(u, {
      title: d(`资金通道`),
      children: n(`account.read`) && (0, b.jsx)(h, {
        icon: `users`,
        onClick: () => t(`payout-recipients`),
        children: d(`收款人汇总 `)
      })
    }), (0, b.jsx)(v, {
      value: r,
      onChange: e => i(e),
      items: x.map(e => ({
        id: e.code,
        label: e.title
      }))
    }), (0, b.jsx)(`div`, {
      className: `settings-form`,
      children: x.map(e => (0, b.jsx)(`div`, {
        role: `tabpanel`,
        "aria-label": d(`{0} 通道配置`, [e.title]),
        hidden: r !== e.code,
        children: (0, b.jsx)(C, {
          definition: e
        })
      }, e.code))
    })]
  })
}

function C({
  definition: t
}) {
  let i = r(`/payout-providers/${t.code}`),
    {
      has: a,
      notify: u,
      refresh: _
    } = e(),
    v = t.code === `AIRWALLEX`,
    x = t.code === `BINANCE_USDT`,
    [S, C] = (0, y.useState)({}),
    [w, T] = (0, y.useState)(!1),
    [E, D] = (0, y.useState)(!1),
    [O, k] = (0, y.useState)(``);
  if ((0, y.useEffect)(() => {
      i.data && C({
        enabled: i.data.enabled,
        regionCode: i.data.regionCode || (v ? `SANDBOX` : `GLOBAL`),
        apiKey: ``,
        secretKey: ``,
        passphrase: ``,
        clientId: ``,
        loginAs: i.data.loginAs || ``,
        apiVersion: i.data.apiVersion || `2025-06-30`,
        transferMethod: i.data.transferMethod || `LOCAL`,
        transferReason: i.data.transferReason || `professional_business_services`,
        sourceWallet: i.data.sourceWallet || `SPOT`,
        singleLimit: String(i.data.singleLimit || `1000`),
        dailyLimit: String(i.data.dailyLimit || `10000`),
        requestTimeoutMs: String(i.data.requestTimeoutMs || 1e4),
        reconcileIntervalSeconds: String(i.data.reconcileIntervalSeconds || 60),
        executionEnabled: !!i.data.executionAdapter?.enabled,
        executionProtocol: i.data.executionAdapter?.protocol || (v ? `NATIVE_AIRWALLEX` : x ? `NATIVE_BINANCE` : `NATIVE_OKX`),
        executionBaseUrl: i.data.executionAdapter?.baseUrl || ``,
        executionApiKey: ``,
        networkMappingsText: JSON.stringify(i.data.networkMappings || {}, null, 2),
        beneficiaryMappingsText: JSON.stringify(i.data.beneficiaryMappings || {}, null, 2),
        recipientInformationText: ``
      })
    }, [i.data, v]), i.error) return (0, b.jsx)(o, {
    text: d(`{0}：{1}`, [t.title, i.error]),
    error: !0
  });
  if (!i.data) return (0, b.jsx)(c, {});
  let A = (e, t) => C(n => ({
    ...n,
    [e]: t
  }));
  return (0, b.jsxs)(`form`, {
    className: `panel settings-section`,
    onSubmit: async e => {
      e.preventDefault(), T(!0), k(``);
      try {
        let {executionEnabled, executionProtocol, executionBaseUrl, executionApiKey,
          networkMappingsText, beneficiaryMappingsText, recipientInformationText, ...standard} = S;
        let objectValue = (value, name) => {
          let parsed;
          try { parsed = JSON.parse(value || `{}`) } catch { throw Error(`${name} 需要有效 JSON 对象`) }
          if (!parsed || Array.isArray(parsed) || typeof parsed !== `object`) throw Error(`${name} 需要 JSON 对象`);
          return parsed
        };
        await l(`/payout-providers/${t.code}`, {
          ...standard,
          executionAdapter: {
            enabled: !!executionEnabled,
            protocol: executionProtocol,
            ...(executionProtocol === `HISPREAD_PAYOUT_V1` ? {baseUrl: executionBaseUrl, apiKey: executionApiKey} : {baseUrl: ``})
          },
          networkMappings: objectValue(networkMappingsText, `网络映射`),
          beneficiaryMappings: objectValue(beneficiaryMappingsText, `收款人映射`),
          ...(recipientInformationText?.trim() ? {recipientInformation: objectValue(recipientInformationText, `收款合规资料`)} : {}),
          secretKey: v ? null : S.secretKey,
          passphrase: v || x ? null : S.passphrase,
          sourceWallet: x ? S.sourceWallet : null,
          clientId: v ? S.clientId : null,
          loginAs: v ? S.loginAs : null,
          apiVersion: v ? S.apiVersion : null,
          transferMethod: v ? S.transferMethod : null,
          transferReason: v ? S.transferReason : null,
          requestTimeoutMs: Number(S.requestTimeoutMs),
          reconcileIntervalSeconds: Number(S.reconcileIntervalSeconds)
        }), u(d(`{0} 资金通道已保存`, [t.title])), _()
      } catch (e) {
        k(e.message)
      } finally {
        T(!1)
      }
    },
    children: [(0, b.jsxs)(`div`, {
      children: [(0, b.jsx)(`h2`, {
        children: t.title
      }), (0, b.jsx)(`p`, {
        children: t.description
      }), (0, b.jsx)(f, {
        state: i.data.enabled ? `ENABLED` : `DISABLED`,
        label: i.data.enabled ? d(`已启用`) : d(`未启用`)
      })]
    }), (0, b.jsxs)(`div`, {
      className: `form-grid`,
      children: [(0, b.jsxs)(`label`, {
        className: `policy-check`,
        children: [(0, b.jsx)(`input`, {
          type: `checkbox`,
          checked: !!S.enabled,
          onChange: e => A(`enabled`, e.target.checked)
        }), d(`启用 `), t.title, d(` 出款 `)]
      }), (0, b.jsxs)(`div`, {
        className: `field`,
        children: [(0, b.jsx)(`span`, {children: `付款执行方式`}), (0, b.jsx)(g, {
          ariaLabel: `付款执行方式`,
          value: S.executionProtocol || (v ? `NATIVE_AIRWALLEX` : x ? `NATIVE_BINANCE` : `NATIVE_OKX`),
          onChange: value => A(`executionProtocol`, value),
          options: [{value: v ? `NATIVE_AIRWALLEX` : x ? `NATIVE_BINANCE` : `NATIVE_OKX`, label: `官方原生接口`},
            {value: `HISPREAD_PAYOUT_V1`, label: `自有支付中台`}]
        }), (0, b.jsxs)(`label`, {className: `policy-check`, children: [
          (0, b.jsx)(`input`, {type: `checkbox`, checked: !!S.executionEnabled, onChange: event => A(`executionEnabled`, event.target.checked)}),
          `启用此执行方式（仍需独立付款审核）`
        ]})]
      }), S.executionProtocol === `HISPREAD_PAYOUT_V1` && [`executionBaseUrl`, `executionApiKey`].map(field => (0, b.jsxs)(`label`, {
        className: `field`, children: [(0, b.jsx)(`span`, {children: field === `executionBaseUrl` ? `支付中台 HTTPS 地址` : `支付中台密钥（留空保留）`}),
          (0, b.jsx)(`input`, {type: field === `executionApiKey` ? `password` : `url`, value: S[field] || ``, onChange: event => A(field, event.target.value)})]
      }, field)), (0, b.jsxs)(`div`, {
        className: `field`,
        children: [(0, b.jsx)(`span`, {
          children: d(v ? `接口环境` : `账户注册地区`)
        }), (0, b.jsx)(g, {
          ariaLabel: d(`账户注册地区`),
          value: String(S.regionCode || (v ? `SANDBOX` : `GLOBAL`)),
          onChange: e => A(`regionCode`, e),
          options: v ? [{
            value: `SANDBOX`,
            label: d(`Sandbox 测试环境`)
          }, {
            value: `PRODUCTION`,
            label: d(`生产环境`)
          }] : x ? [{
            value: `GLOBAL`,
            label: d(`全球`)
          }] : [{
            value: `GLOBAL`,
            label: d(`全球`)
          }, {
            value: `US`,
            label: d(`美国`)
          }, {
            value: `AU`,
            label: d(`澳大利亚`)
          }, {
            value: `EEA`,
            label: d(`欧洲经济区`)
          }]
        }), (0, b.jsx)(`small`, {
          children: i.data.baseUrl
        })]
      }), [...v ? [
        [`clientId`, `Client ID${i.data.clientIdMasked?d(`（已配置 {0}）`,[i.data.clientIdMasked]):``}`],
        [`apiKey`, `API Key${i.data.apiKeyMasked?d(`（已配置 {0}）`,[i.data.apiKeyMasked]):``}`]
      ] : [
        [`apiKey`, `API Key${i.data.apiKeyMasked?d(`（已配置 {0}）`,[i.data.apiKeyMasked]):``}`],
        [`secretKey`, `Secret Key${i.data.hasSecretKey?d(`（已配置）`):``}`], ...x ? [] : [
          [`passphrase`, `Passphrase${i.data.hasPassphrase?d(`（已配置）`):``}`]
        ]
      ]].map(([e, t]) => (0, b.jsxs)(`label`, {
        className: `field`,
        children: [(0, b.jsx)(`span`, {
          children: t
        }), (0, b.jsx)(`input`, {
          type: `password`,
          autoComplete: `new-password`,
          value: String(S[e] || ``),
          onChange: t => A(e, t.target.value),
          placeholder: i.data?.configured ? d(`留空表示保留原值`) : d(`必填`)
        })]
      }, e)), v && (0, b.jsxs)(b.Fragment, {
        children: [(0, b.jsxs)(`label`, {
          className: `field`,
          children: [(0, b.jsx)(`span`, {
            children: d(`目标账户 ID（x-login-as，可选）`)
          }), (0, b.jsx)(`input`, {
            value: String(S.loginAs || ``),
            onChange: e => A(`loginAs`, e.target.value),
            placeholder: d(`单账户 API Key 可留空`)
          })]
        }), (0, b.jsxs)(`label`, {
          className: `field`,
          children: [(0, b.jsx)(`span`, {
            children: d(`API 版本`)
          }), (0, b.jsx)(`input`, {
            required: !0,
            pattern: `\\d{4}-\\d{2}-\\d{2}`,
            value: String(S.apiVersion || ``),
            onChange: e => A(`apiVersion`, e.target.value)
          })]
        }), (0, b.jsxs)(`div`, {
          className: `field`,
          children: [(0, b.jsx)(`span`, {
            children: d(`转账方式`)
          }), (0, b.jsx)(g, {
            ariaLabel: d(`Airwallex 转账方式`),
            value: String(S.transferMethod || `LOCAL`),
            onChange: e => A(`transferMethod`, e),
            options: [{
              value: `LOCAL`,
              label: d(`本地清算 LOCAL`)
            }, {
              value: `SWIFT`,
              label: d(`国际汇款 SWIFT`)
            }]
          })]
        }), (0, b.jsxs)(`div`, {
          className: `field`,
          children: [(0, b.jsx)(`span`, {
            children: d(`转账用途代码`)
          }), (0, b.jsx)(g, {
            ariaLabel: d(`Airwallex 转账用途`),
            value: String(S.transferReason || `professional_business_services`),
            onChange: e => A(`transferReason`, e),
            options: [{
              value: `professional_business_services`,
              label: d(`专业商业服务`)
            }, {
              value: `technical_services`,
              label: d(`技术服务`)
            }, {
              value: `goods_purchased`,
              label: d(`采购商品`)
            }, {
              value: `business_expenses`,
              label: d(`企业支出`)
            }, {
              value: `other_services`,
              label: d(`其他服务`)
            }]
          })]
        })]
      }), x && (0, b.jsxs)(`div`, {
        className: `field`,
        children: [(0, b.jsx)(`span`, {
          children: d(`出款资金账户`)
        }), (0, b.jsx)(g, {
          ariaLabel: d(`出款资金账户`),
          value: String(S.sourceWallet || `SPOT`),
          onChange: e => A(`sourceWallet`, e),
          options: [{
            value: `SPOT`,
            label: d(`现货账户`)
          }, {
            value: `FUNDING`,
            label: d(`资金账户`)
          }]
        })]
      }), [
        [`singleLimit`, d(v ? `单笔上限（按付款币种）` : `单笔上限（USDT）`), `0.00000001`],
        [`dailyLimit`, d(v ? `每日上限（按付款币种）` : `每日上限（USDT）`), `0.00000001`],
        [`requestTimeoutMs`, d(`请求超时（毫秒）`), `1`],
        [`reconcileIntervalSeconds`, t.code === `OKX_USDT` ? d(`自动查单间隔（秒）`) : d(`查单间隔（秒，自动调度预留）`), `1`]
      ].map(([e, t, n]) => (0, b.jsxs)(`label`, {
        className: `field`,
        children: [(0, b.jsx)(`span`, {
          children: t
        }), (0, b.jsx)(`input`, {
          required: !0,
          type: `number`,
          min: e === `requestTimeoutMs` ? 1e3 : e === `reconcileIntervalSeconds` ? 30 : 1e-8,
          step: n,
          value: String(S[e] || ``),
          onChange: t => A(e, t.target.value)
        })]
      }, e)), [
        [v ? `beneficiaryMappingsText` : `networkMappingsText`, v ? `审核账户与官方收款人映射（JSON）` : `本地网络与官方网络标识映射（JSON）`],
        ...!v && !x ? [[`recipientInformationText`, `账户合规资料（JSON，留空保留）`]] : []
      ].map(([field, label]) => (0, b.jsxs)(`label`, {className: `field full`, children: [
        (0, b.jsx)(`span`, {children: label}),
        (0, b.jsx)(`textarea`, {rows: 6, spellCheck: !1, value: S[field] || ``, onChange: event => A(field, event.target.value),
          placeholder: v ? `{"审核账户ID":{"accountVersion":2,"beneficiaryId":"官方收款人ID"}}` : field === `networkMappingsText` ? (x ? `{"TRC20":"TRX"}` : `{"TRC20":"USDT-TRC20"}`) : `{"审核账户ID":{"accountVersion":2,"rcvrInfo":{"walletType":"private"}}}`})
      ]}, field)), (0, b.jsx)(s, {
        tone: `amber`,
        children: d(v ? `凭据仅保存在服务端且不回显。正式凭据请只授予必需权限；收款人映射必须对应当前已审核账户版本。` : `API Key 仅授予读取和提币所需的最小权限，并绑定生产出口 IP。凭据仅保存在服务端且不回显。`)
      }), v && (0, b.jsx)(s, {
        children: d(`当前基础版仅使用 Airwallex 已保存的 beneficiary ID；动态银行字段待 Sandbox 收款样例确认后补齐。 `)
      }), x && (0, b.jsx)(s, {
        children: d(`如账户需要 Travel Rule 问卷，连接检测会明确提示，未配置前不会发起提币。`)
      }), i.data.configured && (0, b.jsxs)(`div`, {
        className: `subsection`,
        children: [(0, b.jsx)(f, {
          state: i.data.lastHealthState || `UNKNOWN`,
          label: i.data.lastHealthState === `HEALTHY` ? d(`连接正常`) : d(`尚未验证`)
        }), (0, b.jsxs)(`p`, {
          className: `muted`,
          children: [p(i.data.lastHealthMessage || d(`尚未执行只读连接测试`)), i.data.lastHealthAt ? ` · ${n(i.data.lastHealthAt)}` : ``]
        })]
      }), O && (0, b.jsx)(s, {
        tone: `red`,
        children: O
      }), (0, b.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [a(`payout.provider.test`) && i.data.configured && i.data.enabled && (0, b.jsx)(h, {
          type: `button`,
          disabled: E || w,
          onClick: async () => {
            D(!0), k(``);
            try {
              await m(`/payout-providers/${t.code}/test`, {}), u(d(`{0} 只读连接测试通过，未发起提币`, [t.title])), _()
            } catch (e) {
              k(e.message)
            } finally {
              D(!1)
            }
          },
          children: d(E ? `检测中…` : `只读测试连接`)
        }), a(`payout.provider.write`) && (0, b.jsx)(h, {
          type: `submit`,
          variant: `primary`,
          disabled: w || E,
          children: d(w ? `保存中…` : `保存通道配置`)
        })]
      })]
    })]
  })
}
export {
  S as
  default
};
