// origin: assets/CcmaxBatchDelivery-BSCydCTL.js
import {
  C as e,
  G as t,
  S as n,
  X as r,
  Z as i,
  g as a,
  mt as o,
  ot as s,
  rt as c,
  s as l,
  u,
  vt as d
} from "./index-Dnr0i-H9.js";
import {
  t as f
} from "./useDeliveryProxies-DGHL4QCT.js";
import {
  c as p,
  s as m
} from "./Resources-CXo1DF00.js";
var h = d(i(), 1);

function g(e, t = ``, n = ``) {
  if (new TextEncoder().encode(e).length > 2e5) throw Error(o(`批量资料不能超过 200 KB。`));
  let r;
  try {
    r = JSON.parse(e)
  } catch {
    throw Error(o(`CCMAX 批量资料须为 JSON 数组，请检查格式。`))
  }
  if (!Array.isArray(r) || !r.length || r.length > 100) throw Error(o(`请输入 1 至 100 条 JSON 数组。`));
  return r.map((e, r) => {
    if (!e || typeof e != `object` || Array.isArray(e)) throw Error(o(`第 {0} 条资料须为对象。`, [r + 1]));
    let i = e;
    if (![`REFRESH_TOKEN`, `ACCESS_TOKEN`, `SESSION_KEY`].includes(String(i.credentialMode))) throw Error(o(`批量交付支持 Refresh Token、Access Token、Session Key；OAuth 请逐个授权。`));
    let a = {
      projectId: String(i.projectId || t),
      proxyId: String(i.proxyId || n),
      credentialMode: i.credentialMode,
      accountName: String(i.accountName || ``)
    };
    for (let e of [`refreshToken`, `accessToken`, `sessionKey`, `socks5`, `remark`])
      if (i[e] != null) {
        if (typeof i[e] != `string`) throw Error(o(`第 {0} 条 {1} 须为文本。`, [r + 1, e]));
        a[e] = i[e]
      } if (i.expiresAt != null) {
      if (!Number.isSafeInteger(Number(i.expiresAt)) || Number(i.expiresAt) <= 0) throw Error(o(`第 {0} 条 expiresAt 须为正整数毫秒时间戳。`, [r + 1]));
      a.expiresAt = Number(i.expiresAt)
    }
    return {
      key: crypto.randomUUID(),
      input: a
    }
  })
}
var _ = r(),
  v = (e = ``, t = ``) => ({
    key: crypto.randomUUID(),
    input: {
      projectId: e,
      proxyId: t,
      credentialMode: `REFRESH_TOKEN`,
      accountName: ``
    },
    attempted: !1,
    success: !1,
    error: ``
  });

function y({
  initialSupplierId: r,
  initialProjectId: i,
  onClose: d,
  onSaved: y,
  onOpen: b
}) {
  let {
    user: x,
    notify: S
  } = e(), C = p(), w = x.supplierId || r, [T, E] = (0, h.useState)(() => [v(i)]), [D, O] = (0, h.useState)(!1), [k, A] = (0, h.useState)(``), [j, M] = (0, h.useState)(``), N = n(`/resources/eligible-projects`), P = f(), F = T.some(e => e.attempted);

  function I(e, t) {
    E(n => n.map(n => n.key === e ? {
      ...n,
      input: {
        ...n.input,
        ...t
      }
    } : n))
  }

  function L() {
    try {
      let e = g(j, T[0]?.input.projectId, T[0]?.input.proxyId).map(e => ({
        ...v(),
        key: e.key,
        input: e.input
      }));
      E(e), A(``), M(``)
    } catch (e) {
      A(e.message)
    }
  }
  async function R() {
    if (D) return;
    let e = T.filter(e => !e.success);
    if (!w || e.some(e => !e.input.projectId || !e.input.accountName?.trim() || !e.input.proxyId && !e.input.socks5)) {
      A(o(`请为每条选择供应商、项目、账号标识和代理。`));
      return
    }
    O(!0), A(``);
    let t = e.map(e => ({
      ...e,
      input: {
        ...e.input
      }
    }));
    try {
      await C.requireAllowed(), E(e => e.map(e => t.some(t => t.key === e.key) ? {
        ...e,
        attempted: !0
      } : e));
      let e = await c(`/resources/ccmax/batch`, {
        items: t.map(e => ({
          requestKey: e.key,
          input: e.input
        }))
      });
      E(n => n.map(n => {
        let r = t.findIndex(e => e.key === n.key),
          i = e.results.find(e => e.index === r);
        return i ? {
          ...n,
          success: i.success,
          resource: i.resource,
          error: i.message || ``,
          ...i.success ? {
            input: {
              projectId: n.input.projectId,
              credentialMode: n.input.credentialMode,
              accountName: n.input.accountName
            }
          } : {}
        } : n
      })), sessionStorage.setItem(`hub:ccmax-batch-result`, JSON.stringify(e.results.filter(e => e.resource).map(e => ({
        requestKey: t[e.index]?.key,
        resourceId: e.resource.id
      })))), S(o(`成功 {0} 条，需核对 {1} 条`, [e.successCount, e.failureCount])), y()
    } catch (e) {
      A(o(`{0}。原提交编号已保留，核对时不会换号重建。`, [e.message]))
    } finally {
      O(!1)
    }
  }
  return (0, _.jsxs)(t, {
    title: o(`CCMAX 批量交付`),
    wide: !0,
    onClose: () => !D && d(),
    children: [(0, _.jsx)(`p`, {
      className: `muted`,
      children: o(`每条完成独立交付。OAuth 需在单条新增中逐个完成授权；结果待核对时保留原记录与提交编号。 `)
    }), (0, _.jsx)(m, {
      access: C
    }), (k || N.error || P.error) && (0, _.jsx)(a, {
      tone: `red`,
      children: k || N.error || P.error
    }), !F && (0, _.jsxs)(`details`, {
      children: [(0, _.jsx)(`summary`, {
        children: o(`批量粘贴结构化资料`)
      }), (0, _.jsxs)(`label`, {
        className: `field`,
        children: [(0, _.jsx)(`span`, {
          children: o(`JSON 数组（字段与下方一致）`)
        }), (0, _.jsx)(`textarea`, {
          rows: 4,
          value: j,
          onChange: e => M(e.target.value),
          placeholder: o(`[{"accountName":"账号标识","projectId":"项目ID","credentialMode":"REFRESH_TOKEN","refreshToken":"...","proxyId":"代理ID"}]`)
        })]
      }), (0, _.jsx)(l, {
        disabled: D || !j.trim(),
        onClick: L,
        children: o(`解析为独立条目 `)
      })]
    }), T.map((e, t) => (0, _.jsxs)(`section`, {
      className: `operations-editor`,
      children: [(0, _.jsxs)(`div`, {
        className: `operations-toolbar`,
        children: [(0, _.jsxs)(`h3`, {
          children: [o(`第 `), t + 1, o(` 条`)]
        }), e.success ? (0, _.jsx)(`strong`, {
          children: o(`交付成功`)
        }) : e.resource?.dispatchState === `UNKNOWN` ? (0, _.jsx)(`strong`, {
          children: o(`结果核对中`)
        }) : null, !e.attempted && T.length > 1 && (0, _.jsx)(l, {
          disabled: D,
          onClick: () => E(t => t.filter(t => t.key !== e.key)),
          children: o(`移除 `)
        })]
      }), !e.success && (0, _.jsxs)(`div`, {
        className: `form-grid two-columns`,
        children: [(0, _.jsxs)(`label`, {
          className: `field`,
          children: [(0, _.jsx)(`span`, {
            children: o(`项目`)
          }), (0, _.jsx)(u, {
            value: e.input.projectId,
            ariaLabel: o(`第{0}条项目`, [t + 1]),
            disabled: D || e.attempted,
            onChange: t => I(e.key, {
              projectId: t
            }),
            options: [{
              value: ``,
              label: o(`选择CCMAX项目`)
            }, ...(N.data || []).map(e => ({
              value: e.id,
              label: e.name
            }))]
          })]
        }), (0, _.jsxs)(`label`, {
          className: `field`,
          children: [(0, _.jsx)(`span`, {
            children: o(`账号标识`)
          }), (0, _.jsx)(`input`, {
            value: e.input.accountName || ``,
            disabled: D || e.attempted,
            onChange: t => I(e.key, {
              accountName: t.target.value
            })
          })]
        }), (0, _.jsxs)(`label`, {
          className: `field`,
          children: [(0, _.jsx)(`span`, {
            children: o(`凭据方式`)
          }), (0, _.jsx)(u, {
            value: e.input.credentialMode,
            disabled: D || e.attempted,
            ariaLabel: o(`第{0}条凭据方式`, [t + 1]),
            onChange: t => I(e.key, {
              credentialMode: t,
              refreshToken: ``,
              accessToken: ``,
              sessionKey: ``
            }),
            options: [{
              value: `REFRESH_TOKEN`,
              label: `Refresh Token`
            }, {
              value: `ACCESS_TOKEN`,
              label: `Access Token`
            }, {
              value: `SESSION_KEY`,
              label: `Session Key`
            }]
          })]
        }), (0, _.jsxs)(`label`, {
          className: `field`,
          children: [(0, _.jsx)(`span`, {
            children: o(`凭据`)
          }), (0, _.jsx)(`input`, {
            type: `password`,
            autoComplete: `new-password`,
            disabled: D || e.attempted,
            value: e.input.credentialMode === `REFRESH_TOKEN` ? e.input.refreshToken || `` : e.input.credentialMode === `ACCESS_TOKEN` ? e.input.accessToken || `` : e.input.sessionKey || ``,
            onChange: t => I(e.key, {
              [e.input.credentialMode === `REFRESH_TOKEN` ? `refreshToken` : e.input.credentialMode === `ACCESS_TOKEN` ? `accessToken` : `sessionKey`]: t.target.value
            })
          })]
        }), (0, _.jsxs)(`label`, {
          className: `field`,
          children: [(0, _.jsx)(`span`, {
            children: o(`代理`)
          }), (0, _.jsx)(u, {
            value: e.input.proxyId || ``,
            disabled: D || e.attempted,
            ariaLabel: o(`第{0}条代理`, [t + 1]),
            onChange: t => I(e.key, {
              proxyId: t,
              socks5: ``
            }),
            options: [{
              value: ``,
              label: e.input.socks5 ? o(`使用粘贴资料中的代理URI`) : o(`选择供应商代理`)
            }, ...(P.data || []).filter(e => e.enabled).map(e => ({
              value: e.id,
              label: `${e.name} · ${e.endpoint}`
            }))]
          })]
        })]
      }), e.error && (0, _.jsx)(a, {
        tone: `red`,
        children: s(e.error)
      }), (0, _.jsxs)(`div`, {
        className: `operations-toolbar`,
        children: [(0, _.jsxs)(`small`, {
          children: [o(`提交编号：`), e.key]
        }), e.resource && (0, _.jsx)(l, {
          disabled: D,
          onClick: () => b(e.resource),
          children: o(`查看原交付记录 `)
        })]
      })]
    }, e.key)), (0, _.jsxs)(`footer`, {
      className: `dialog-footer`,
      children: [(0, _.jsx)(l, {
        disabled: D || T.length >= 100 || F,
        onClick: () => E(e => [...e, v(e[0]?.input.projectId, e[0]?.input.proxyId)]),
        children: o(`增加一条 `)
      }), (0, _.jsx)(l, {
        disabled: D,
        onClick: d,
        children: o(`关闭 `)
      }), (0, _.jsx)(l, {
        variant: `primary`,
        disabled: D || !C.allowed || N.loading || P.loading || !!N.error || !!P.error || T.every(e => e.success),
        onClick: () => void R(),
        children: o(D ? `正在逐项交付…` : F ? `使用原编号核对 / 继续` : `提交全部条目`)
      })]
    })]
  })
}
export {
  y as
  default
};