// origin: assets/ResourceDetail-PGeCmPlL.js
import {
  $ as e,
  C as t,
  D as n,
  G as ee,
  P as r,
  S as i,
  X as a,
  Y as te,
  Z as o,
  c as ne,
  g as s,
  h as c,
  l,
  mt as u,
  ot as d,
  rt as f,
  s as p,
  u as re,
  vt as m
} from "./index-Dnr0i-H9.js";
import {
  E as h,
  O as ie,
  S as ae,
  c as g,
  d as oe,
  f as _,
  h as v,
  i as se,
  m as ce,
  n as le,
  o as y,
  p as b,
  t as ue,
  u as de
} from "./resourceHelpers-DoyalwRL.js";
import {
  a as fe,
  c as pe,
  i as me,
  n as he,
  o as ge,
  r as _e,
  s as ve
} from "./Resources-CXo1DF00.js";
var x = m(o(), 1),
  S = a();

function C({
  resource: a,
  supplierSide: o,
  onClose: m,
  onEdit: C,
  onReauthorize: ye,
  onRefreshCredential: be,
  onRecover: w,
  onChanged: T
}) {
  let [xe, E] = (0, x.useState)(!1), [D, O] = (0, x.useState)(null), {
    has: Se,
    notify: k,
    refresh: A
  } = t(), j = e => !a.readOnly && Se(e), Ce = i(`/projects?size=100`).data?.items.find(e => e.id === a.projectId)?.name, we = (0, x.useRef)(crypto.randomUUID()), M = i(`/resources/${_(a.id)}`), N = (0, x.useRef)(a);
  (0, x.useEffect)(() => {
    N.current !== a && !M.loading && !M.error && (N.current = a, M.mutate(() => a))
  }, [a, M.loading, M.error, M.mutate]);
  let P = i(a.resourceType === `CCMAX` && !o && j(`resource.dispatch`) ? `/resources/${_(a.id)}/dispatches` : null),
    F = i(a.resourceType === `CCMAX` && !o && j(`resource.dispatch`) ? `/resource-targets` : null),
    I = i(o && j(`resource.write`) ? `/resources/eligible-projects` : null),
    L = pe(o),
    [R, Te] = (0, x.useState)(``),
    [z, B] = (0, x.useState)(!1),
    V = (0, x.useRef)(!1),
    [H, U] = (0, x.useState)(null),
    [Ee, W] = (0, x.useState)(!1),
    [De, G] = (0, x.useState)(``),
    [K, q] = (0, x.useState)(null),
    [J, Oe] = (0, x.useState)(``),
    Y = H || M.data || a,
    X = Y.resourceType === `CCMAX`,
    ke = o && X && j(`resource.write`) && Y.state === `DELIVERED` && !Y.dispatchState && ce(Y),
    Ae = !!I.data?.some(e => e.id === Y.projectId),
    Z = Ee || v(Y),
    Q = (P.data || []).find(e => [`SUCCESS`, `PENDING`, `UNKNOWN`].includes(e.state)),
    je = [
      [u(`交付状态`), ae(Y)], ...Y.dispatchState !== `SUCCESS` && y(Y) ? [
        [u(`处理参考`), y(Y)]
      ] : []
    ],
    Me = De || (Y.dispatchState === `UNKNOWN` && Y.creationFinished || Y.dispatchState === `PENDING` && Y.creationRetrying ? h(Y.dispatchState, Y) : ``);
  async function Ne() {
    if (Y.laneId) try {
      await navigator.clipboard.writeText(Y.laneId), k(u(`已复制`))
    } catch {
      G(u(`复制失败，请选择内容手动复制`))
    }
  }
  async function $(t) {
    if (!(V.current || Z)) {
      V.current = !0, B(!0), G(``);
      try {
        t === `delete` && await e(`/resources/${_(Y.id)}?version=${Y.version}`, {
          method: `DELETE`
        });
        let n;
        if (t === `dispatch` && (n = await f(`/resources/${_(Y.id)}/dispatch`, {
            targetId: R,
            requestKey: we.current,
            version: Y.version
          })), t === `authorize`) {
          let e = await f(`/resources/${_(Y.id)}/oauth/authorize`, {
            targetId: R,
            version: Y.version
          });
          q(e);
          return
        }
        if (t === `complete` && K && (n = await f(`/resources/${_(Y.id)}/oauth/complete`, {
            sessionId: K.sessionId,
            code: J.trim(),
            requestKey: we.current,
            version: Y.version
          })), t === `delete`) {
          k(u(`已标记删除，列表中已隐藏`)), T();
          return
        }
        if (A(), n?.state === `FAILED`) {
          W(!1), G(d(n.message || g));
          return
        }
        if (n?.state === `UNKNOWN` || n?.state === `PENDING`) {
          W(!0), G(h(n.state, n));
          return
        }
        k(n?.message ? d(n.message) : u(`分发请求已完成，请核对目标状态`)), T()
      } catch (e) {
        t === `dispatch` || t === `complete` ? (W(!0), G(u(`交付结果尚未确认：{0}。请刷新交付结果核对，勿重复提交。`, [e.message]))) : G(e.message)
      } finally {
        V.current = !1, B(!1)
      }
    }
  }
  async function Pe() {
    if (!V.current) {
      V.current = !0, B(!0), G(``);
      try {
        let e = await f(`/resources/${_(Y.id)}/oauth/supplier-retry`, {
          version: Y.version
        });
        A(), C(e)
      } catch (e) {
        G(e.message)
      } finally {
        V.current = !1, B(!1)
      }
    }
  }

  function Fe(e) {
    U(e), W(!1), A(), e.dispatchState === `SUCCESS` ? (k(d(e.message || u(`CCMAX 目标已创建，资源交付成功`))), T()) : e.dispatchState === `FAILED` ? G(d(e.message || g)) : (G(h(e.dispatchState, e)), v(e) || W(!0))
  }
  async function Ie(t = !1) {
    if (!V.current && (t || !Z && ke)) {
      V.current = !0, B(!0), G(``);
      try {
        t || await L.requireAllowed(), Fe(t ? await e(`/resources/${_(Y.id)}`) : await f(`/resources/${_(Y.id)}/submit`, {
          version: Y.version
        }))
      } catch (t) {
        let n = t.message;
        W(!0);
        try {
          let t = await e(`/resources/${_(Y.id)}`);
          U(t), A(), t.dispatchState ? Fe(t) : (W(!1), G(u(`补交未完成：{0}`, [n])))
        } catch {
          G(de)
        }
      } finally {
        V.current = !1, B(!1)
      }
    }
  }
  return !H && !M.data ? (0, S.jsxs)(ee, {
    title: a.name,
    onClose: m,
    wide: !0,
    drawer: !0,
    children: [M.loading ? (0, S.jsx)(c, {}) : (0, S.jsxs)(s, {
      tone: `red`,
      children: [u(`详情加载失败：`), M.error || u(`未取得资源详情`)]
    }), (0, S.jsxs)(`footer`, {
      className: `dialog-footer`,
      children: [M.error && (0, S.jsx)(p, {
        onClick: A,
        children: u(`重试加载详情`)
      }), (0, S.jsx)(p, {
        onClick: m,
        children: u(`关闭`)
      })]
    })]
  }) : (0, S.jsxs)(ee, {
    title: Y.name,
    onClose: () => {
      V.current || m()
    },
    wide: !0,
    drawer: !0,
    children: [M.loading && (0, S.jsx)(c, {}), M.error && (0, S.jsxs)(s, {
      tone: `red`,
      children: [u(`详情加载失败：`), M.error]
    }), Y.resourceType === `CCMAX` && !Y.readOnly && (0, S.jsx)(`div`, {
      className: `replacement-record-filter`,
      children: (0, S.jsx)(p, {
        onClick: () => E(!0),
        children: u(`代理更换记录`)
      })
    }), xe && (0, S.jsx)(ge, {
      resourceId: Y.id,
      onClose: () => E(!1),
      onOpen: e => {
        E(!1), O(e)
      }
    }), D && (0, S.jsx)(fe, {
      id: D,
      onClose: () => O(null),
      onCompleted: A
    }), (0, S.jsx)(l, {
      items: je
    }), (Y.creationFailureHint || Y.dispatchFailureReason) && (0, S.jsxs)(s, {
      tone: `red`,
      children: [(0, S.jsx)(`strong`, {
        children: u(`交付失败原因`)
      }), (0, S.jsx)(`div`, {
        children: d(Y.creationFailureHint || Y.dispatchFailureReason || ``)
      })]
    }), (0, S.jsx)(l, {
      items: [
        [u(`资源名称`), Y.name],
        [u(`资源类型`), Y.resourceType || u(`未知类型`)],
        [u(`项目`), Y.projectName || Ce],
        [u(`供应商`), o ? void 0 : `${Y.supplierName||`—`}${Y.supplierCode?u(`（{0}）`,[Y.supplierCode]):``}`],
        [u(`创建人`), Y.creatorName || u(`未知创建人`)],
        [u(`创建时间`), b(Y.createdAt)],
        [u(`提交时间`), b(Y.submittedAt, v(Y) ? u(`待确认`) : u(`未提交`))],
        [u(`交付报价`), Y.quoteBasis ? u(`{0} 至 {1} · {2}`, [Y.quoteBasis.effectiveFrom, Y.quoteBasis.effectiveTo, Y.quoteBasis.currency]) : u(`未交付或历史记录无快照`)],
        [u(`备注`), Y.remark]
      ]
    }), X && (0, S.jsxs)(`section`, {
      className: `subsection resource-section`,
      children: [(0, S.jsx)(`h3`, {
        children: u(`CCMAX 账户信息`)
      }), (0, S.jsx)(l, {
        items: [
          [u(`账号名称`), Y.accountName || u(`待核实`)],
          [`Lane ID`, Y.laneId ? (0, S.jsxs)(`span`, {
            className: `resource-lane-id`,
            children: [(0, S.jsx)(`code`, {
              className: `wrap-code`,
              children: Y.laneId
            }), (0, S.jsx)(`button`, {
              type: `button`,
              className: `resource-action-link`,
              "aria-label": u(`复制 Lane ID`),
              title: u(`复制 Lane ID`),
              onClick: () => void Ne(),
              children: (0, S.jsx)(te, {
                name: `copy`,
                size: 12
              })
            })]
          }) : u(`未绑定`)],
          [u(`凭据方式`), n[Y.credentialMode]],
          [u(`代理`), Y.proxyConfigured || Y.socks5Configured ? (0, S.jsxs)(`div`, {
            className: `proxy-identity`,
            children: [(0, S.jsxs)(`strong`, {
              children: [Y.proxyName || u(`已配置`), Y.proxyType ? u(`（{0}）`, [Y.proxyType]) : ``]
            }), Y.proxyEndpoint && (0, S.jsx)(`code`, {
              className: `wrap-code`,
              children: Y.proxyEndpoint
            })]
          }) : u(`未配置`)],
          [u(`凭据`), Y.credentialMode === `OAUTH` ? u(`分发时授权`) : Y.credentialConfigured ? u(`已配置`) : u(`未配置`)]
        ]
      }), (0, S.jsx)(ie, {
        resource: Y
      }), _e(Y, o, j) && (0, S.jsx)(p, {
        onClick: () => be(Y),
        children: u(`强制刷新授权`)
      }), (0, S.jsx)(he, {
        resource: Y,
        supplierSide: o,
        onOpen: ye
      })]
    }), (0, S.jsx)(me, {
      resource: Y
    }), o && Y.settlementMethod === `ACCOUNT_BUYOUT` && Y.state === `DELIVERED` && (0, S.jsxs)(`section`, {
      className: `subsection resource-section`,
      children: [(0, S.jsx)(`h3`, {
        children: u(`买断金额`)
      }), (0, S.jsx)(l, {
        items: [
          [u(`每个账号价格`), Y.buyoutAmount == null ? u(`报价快照缺失`) : `${Y.buyoutAmount} ${Y.buyoutCurrency||``}`]
        ]
      })]
    }), o && Y.state === `DRAFT` && !Y.oauthRetryAvailable && !Z && Y.dispatchState !== `SUCCESS` && j(`resource.write`) && (0, S.jsx)(`div`, {
      className: `resource-actions`,
      children: (0, S.jsx)(p, {
        disabled: z || M.loading || !!M.error,
        onClick: () => C(Y),
        children: Y.credentialMode === `OAUTH` && Y.dispatchState === `FAILED` ? u(`重新授权`) : u(`编辑草稿`)
      })
    }), o && Y.oauthRetryAvailable && j(`resource.write`) && (0, S.jsx)(`div`, {
      className: `resource-actions`,
      children: (0, S.jsx)(p, {
        variant: `primary`,
        disabled: z || M.loading || !!M.error,
        onClick: () => void Pe(),
        children: u(z ? `正在恢复草稿…` : `重新授权`)
      })
    }), se(Y, o, j) && (0, S.jsxs)(`div`, {
      className: `resource-actions`,
      children: [o && (0, S.jsx)(p, {
        disabled: z || M.loading || !!M.error,
        onClick: () => w(Y, `EDIT`),
        children: u(`编辑 `)
      }), (0, S.jsx)(p, {
        variant: `danger`,
        disabled: z || M.loading || !!M.error,
        onClick: () => w(Y, `DELETE`),
        children: u(`删除 `)
      })]
    }), le(Y, o, j) && (0, S.jsx)(`div`, {
      className: `resource-actions`,
      children: (0, S.jsx)(p, {
        variant: `danger`,
        disabled: z || M.loading || !!M.error,
        onClick: () => void $(`delete`),
        children: u(`删除 `)
      })
    }), ke && (0, S.jsxs)(`section`, {
      className: `subsection resource-section`,
      children: [(0, S.jsx)(`h3`, {
        children: u(`补交 CCMAX 目标`)
      }), (0, S.jsx)(ve, {
        access: L
      }), (0, S.jsx)(s, {
        children: u(`此记录已保存在本地，但尚未创建 CCMAX 目标。补交成功后才算交付成功。`)
      }), I.error && (0, S.jsxs)(s, {
        tone: `red`,
        children: [u(`交付资格查询失败：`), I.error]
      }), !I.loading && !I.error && !Ae && (0, S.jsx)(s, {
        tone: `red`,
        children: u(`当前项目不满足交付资格，请先核对项目授权和当日生效报价。`)
      }), (0, S.jsx)(p, {
        variant: `primary`,
        disabled: z || Z || M.loading || !!M.error || !L.allowed || I.loading || !!I.error || !Ae,
        onClick: () => void Ie(),
        children: u(z ? `正在补交…` : `补交目标`)
      })]
    }), X && Z && j(o ? `resource.write` : `resource.dispatch`) && (0, S.jsx)(`div`, {
      className: `resource-actions`,
      children: (0, S.jsx)(p, {
        disabled: z,
        onClick: () => void Ie(!0),
        children: u(z ? `正在查询…` : `刷新交付结果`)
      })
    }), Me && (0, S.jsx)(s, {
      tone: Z ? `amber` : `red`,
      children: Me
    }), X && !o && Y.state === `DELIVERED` && j(`resource.dispatch`) && Q?.state !== `SUCCESS` && (0, S.jsxs)(`section`, {
      className: `subsection resource-section`,
      children: [(0, S.jsx)(`h3`, {
        children: u(`交付记录`)
      }), F.error && (0, S.jsxs)(s, {
        tone: `red`,
        children: [u(`目标加载失败：`), F.error]
      }), !Q && !Z && (0, S.jsxs)(`label`, {
        className: `field`,
        children: [(0, S.jsx)(`span`, {
          children: u(`目标服务`)
        }), (0, S.jsx)(re, {
          ariaLabel: u(`目标服务`),
          value: R,
          onChange: e => {
            Te(e), q(null)
          },
          options: [{
            value: ``,
            label: u(`请选择`)
          }, ...(F.data || []).filter(e => e.enabled).map(e => ({
            value: e.id,
            label: e.name
          }))]
        })]
      }), !Q && !Z && (Y.credentialMode === `OAUTH` ? (0, S.jsxs)(S.Fragment, {
        children: [(0, S.jsx)(p, {
          disabled: z || !R,
          onClick: () => void $(`authorize`),
          children: u(`生成授权入口 `)
        }), K && (0, S.jsxs)(`div`, {
          className: `resource-oauth`,
          children: [(0, S.jsxs)(s, {
            children: [u(`授权入口有效期至 `), r(K.expiresAt), u(`。请有权人员完成登录并回填授权码。 `)]
          }), (0, S.jsx)(`a`, {
            href: K.authUrl,
            target: `_blank`,
            rel: `noopener noreferrer`,
            children: u(`打开授权页面 `)
          }), (0, S.jsxs)(`label`, {
            className: `field`,
            children: [(0, S.jsx)(`span`, {
              children: u(`授权码`)
            }), (0, S.jsx)(`input`, {
              type: `password`,
              autoComplete: `off`,
              value: J,
              onChange: e => Oe(e.target.value)
            })]
          }), (0, S.jsx)(p, {
            variant: `primary`,
            disabled: z || !J.trim(),
            onClick: () => void $(`complete`),
            children: u(`完成授权并分发 `)
          })]
        })]
      }) : (0, S.jsx)(p, {
        variant: `primary`,
        disabled: z || !R,
        onClick: () => void $(`dispatch`),
        children: u(z ? `正在分发…` : `分发到目标`)
      })), P.error && (0, S.jsxs)(s, {
        tone: `red`,
        children: [u(`分发记录加载失败：`), P.error]
      }), (0, S.jsx)(ne, {
        data: P.data?.slice(0, 1) || [],
        loading: P.loading,
        columns: [{
          label: u(`目标`),
          render: e => e.targetName
        }, {
          label: u(`结果`),
          render: e => (0, S.jsx)(ue, {
            state: e.state === `FAILED` ? `FAILURE` : e.state,
            label: oe(e),
            progress: e
          })
        }, {
          label: u(`时间`),
          render: e => r(e.createdAt)
        }]
      })]
    }), X && Y.state === `DELIVERED` && !(o && Y.settlementMethod === `ACCOUNT_BUYOUT`) && (0, S.jsxs)(`section`, {
      className: `subsection resource-section`,
      children: [(0, S.jsx)(`h3`, {
        children: u(`消费金额（CC目标）`)
      }), (0, S.jsx)(l, {
        items: [
          [u(`Token 消费总额`), Y.usage?.amount == null ? u(`未查询`) : `${Y.usage.amount} ${Y.usage.currency||`USD`}`]
        ]
      })]
    }), (0, S.jsx)(`footer`, {
      className: `dialog-footer`,
      children: (0, S.jsx)(p, {
        disabled: z,
        onClick: m,
        children: u(`关闭 `)
      })
    })]
  })
}
export {
  C as ResourceDetail
};