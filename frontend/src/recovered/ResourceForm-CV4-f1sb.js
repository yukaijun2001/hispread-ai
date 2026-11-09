// origin: assets/ResourceForm-CV4-f1sb.js
import {
  $ as e,
  C as t,
  G as n,
  P as r,
  Q as i,
  S as ee,
  X as a,
  Z as o,
  g as s,
  h as te,
  it as ne,
  mt as c,
  ot as l,
  rt as u,
  s as d,
  u as re,
  vt as f
} from "./index-Dnr0i-H9.js";
import {
  t as ie
} from "./useDeliveryProxies-DGHL4QCT.js";
import {
  E as ae,
  _ as oe,
  c as p,
  f as m,
  h,
  k as se,
  s as g,
  u as ce
} from "./resourceHelpers-DoyalwRL.js";
import {
  c as le,
  s as ue
} from "./Resources-CXo1DF00.js";
var _ = f(o(), 1),
  v = a();

function de(e) {
  try {
    let t = JSON.parse(sessionStorage.getItem(e) || `null`);
    return typeof t != `object` || !t || !(`id` in t) || !(`kind` in t) ? null : typeof t.id == `string` && /^[a-f0-9-]{36}$/i.test(t.id) && (t.kind === `OAUTH` || t.kind === `CREDENTIAL`) ? {
      id: t.id,
      kind: t.kind
    } : null
  } catch {
    return null
  }
}

function y({
  resource: a,
  prefill: o,
  onClose: f,
  onSaved: y,
  onApiDelivery: fe
}) {
  let b = a === `new`,
    {
      notify: x,
      user: pe,
      has: me
    } = t(),
    S = le(),
    he = `supplier:pending-submission:${pe.id}`,
    ge = ee(`/projects?page=1&size=100`),
    C = ee(`/resources/eligible-projects`),
    w = ie(),
    [T, E] = (0, _.useState)(b ? null : a),
    [_e, ve] = (0, _.useState)(b ? `` : a.accountName || ``),
    [D, ye] = (0, _.useState)(b ? o?.projectId || `` : a.projectId),
    O = (ge.data?.items || []).find(e => e.id === D) || (C.data || []).find(e => e.id === D),
    k = !!O && O.name.trim().toUpperCase().startsWith(`CCMAX`),
    be = !!C.data?.some(e => e.id === D),
    [A, xe] = (0, _.useState)(b ? `REFRESH_TOKEN` : a.credentialMode),
    [j, M] = (0, _.useState)(null),
    [N, P] = (0, _.useState)(``),
    [F, Se] = (0, _.useState)(``),
    [I, Ce] = (0, _.useState)(``),
    [L, we] = (0, _.useState)(``),
    [R, Te] = (0, _.useState)(b ? `` : String(a.expiresAt ?? ``)),
    [z, Ee] = (0, _.useState)(b || a.proxySelectionRequired ? `` : a.proxyId || ``),
    De = me(`proxy.write`) && me(`proxy.read`),
    [B, Oe] = (0, _.useState)(``),
    V = z && !B.trim() ? `POOL` : `INPUT`,
    [ke, Ae] = (0, _.useState)([]),
    H = ee(z ? `/outbound-proxies/${encodeURIComponent(z)}` : null),
    je = V === `POOL` && !!z && H.loading,
    [Me, Ne] = (0, _.useState)(b ? `` : a.remark || ``),
    [U, W] = (0, _.useState)(!1),
    G = (0, _.useRef)(!1),
    [K, Pe] = (0, _.useState)(() => b ? de(he) : null),
    [Fe, q] = (0, _.useState)(K !== null),
    [Ie, J] = (0, _.useState)(null),
    [Le, Y] = (0, _.useState)(b ? {} : g(a)),
    Re = (0, _.useRef)(crypto.randomUUID()),
    [ze, X] = (0, _.useState)(b ? K ? c(`有一次交付结果尚未确认，请先刷新交付结果。`) : `` : l(a.creationFailureHint || a.dispatchFailureReason || ``)),
    Z = Fe || T != null && (h(T) || T.dispatchState === `SUCCESS`),
    Be = [...H.data ? [H.data] : [], ...ke, ...w.data].filter((e, t, n) => n.findIndex(t => t.id === e.id) === t),
    Ve = Be.find(e => e.id === z) || null;

  function He() {
    b && j && !K && u(`/resources/oauth/supplier-session/${m(j.sessionId)}/cancel`, {}).catch(() => void 0), M(null), P(``)
  }
  let Ue = Ie || T?.dispatchState,
    We = {
      ...T,
      ...Le
    },
    Ge = Ue === `PENDING`,
    Ke = Ge && We.creationRetrying === !0,
    qe = Ue === `UNKNOWN` && We.creationFinished === !0,
    Je = qe && !!T?.id;

  function Ye(e) {
    return E(e), J(e.dispatchState || null), Y(g(e)), b && e.creationFinished && e.id && Q(null), q(!1), y(), e.dispatchState === `SUCCESS` ? (x(l(e.message || c(`资源交付成功`))), f(), !0) : e.dispatchState === `FAILED` ? (X(l(e.creationFailureHint || e.message || e.dispatchFailureReason || p)), !1) : (X(ae(e.dispatchState, e)), h(e) || q(!0), !1)
  }

  function Q(e) {
    Pe(e);
    try {
      e ? sessionStorage.setItem(he, JSON.stringify(e)) : sessionStorage.removeItem(he)
    } catch {}
  }

  function Xe() {
    G.current || (b && j && !K && u(`/resources/oauth/supplier-session/${m(j.sessionId)}/cancel`, {}).catch(() => void 0), f())
  }

  function Ze(e) {
    E(null), J(null), Y({}), Q(null), q(!1), M(null), P(``), Re.current = crypto.randomUUID(), X(e)
  }
  async function $(t) {
    if (J(t.state), Y(g(t)), y(), t.state === `SUCCESS`) {
      Q(null), q(!1), x(l(t.message || c(`资源交付成功`))), f();
      return
    }
    if (t.state === `FAILED` && t.recordDiscarded) {
      Ze(l(t.creationFailureHint || t.message || p));
      return
    }
    if (t.state === `FAILED` && t.resourceId) {
      Q(null), q(!1), x(c(`{0} 记录已保留，可在列表编辑或删除。`, [l(t.creationFailureHint || t.message || p)]), !0), f();
      return
    }
    if (t.state === `CANCELLED` || t.state === `EXPIRED`) {
      Ze(t.state === `EXPIRED` ? c(`授权会话已过期，请重新生成授权链接。`) : K?.kind === `CREDENTIAL` ? c(`本次提交已取消，可重新提交。`) : c(`本次授权已取消，请重新生成授权链接。`));
      return
    }
    q(!0), X(t.state === `FAILED` ? l(t.creationFailureHint || t.message || p) : ae(t.state, t)), t.creationFinished && t.resourceId && Q(null), t.resourceId && E(await e(`/resources/${m(t.resourceId)}`))
  }
  async function Qe(t) {
    if (!(t instanceof i) || t.details?.creationNotStarted !== !0) return !1;
    if (Q(null), q(!1), E(null), J(null), Y({}), Re.current = crypto.randomUUID(), X(t.message), t.details.resourceId) try {
      let n = await e(`/resources/${m(t.details.resourceId)}`);
      E(n), J(n.dispatchState || null), Y(g(n)), q(h(n)), h(n) && X(ae(n.dispatchState, n))
    } catch {}
    return !0
  }
  async function $e() {
    if (!(G.current || !T && !K)) {
      G.current = !0, W(!0);
      try {
        if (b && K) {
          let t = `/resources/oauth/supplier-session/${m(K.id)}`,
            n;
          try {
            n = await e(t)
          } catch (e) {
            if (!(e instanceof i) || e.status !== 404) throw e;
            n = await u(`${t}/cancel`, {})
          }
          n.state === `READY` && (n = await u(`${t}/cancel`, {})), await $(n);
          return
        }
        Ye(await e(`/resources/${m(T.id)}`))
      } catch (e) {
        q(!0), X(c(`交付结果查询失败：{0}。请勿重复提交。`, [e.message]))
      } finally {
        G.current = !1, W(!1)
      }
    }
  }
  async function et(t, n = !1) {
    if (G.current || Z) return;
    if (X(``), b || t || n) {
      G.current = !0, W(!0);
      try {
        await S.requireAllowed()
      } catch (e) {
        X(e.message);
        return
      } finally {
        G.current = !1, W(!1)
      }
    }
    if (n && (M(null), P(``)), !k) {
      X(c(`当前仅支持 CCMAX 项目交付`));
      return
    }
    if (!D) {
      X(c(`请选择项目`));
      return
    }
    if (C.loading || C.error || !be && (b || t || T?.projectId !== D)) {
      X(C.error || c(`该项目今日没有唯一有效的已通过报价，暂不可交付`));
      return
    }
    if (t && !_e.trim()) {
      X(c(`请填写CCMAX账号名称`));
      return
    }
    if (V === `POOL` && z && (H.loading || H.error || !H.data?.enabled)) {
      X(c(`请选择可用代理`));
      return
    }
    if (V === `INPUT` && B.trim() && !De) {
      X(c(`当前账号只能选择已有代理，请从下拉列表选择`));
      return
    }
    if (t && (V === `INPUT` ? !B.trim() : !z)) {
      X(c(`请录入代理地址或从代理池选择代理`));
      return
    }
    let r = {
      accountName: _e.trim(),
      projectId: D,
      credentialMode: A,
      remark: Me.trim(),
      ...T ? {
        version: T.version
      } : {},
      ...T && D !== T.projectId ? {
        refreshToken: ``,
        accessToken: ``,
        sessionKey: ``
      } : {},
      proxyId: z,
      ...T && !z ? {
        socks5: ``
      } : {},
      ...A === `REFRESH_TOKEN` && F.trim() ? {
        refreshToken: F.trim()
      } : {},
      ...A === `ACCESS_TOKEN` && I.trim() ? {
        accessToken: I.trim()
      } : {},
      ...A === `ACCESS_TOKEN` && F.trim() ? {
        refreshToken: F.trim()
      } : {},
      ...A === `ACCESS_TOKEN` && R ? {
        expiresAt: Number(R)
      } : {},
      ...A === `SESSION_KEY` && L.trim() ? {
        sessionKey: L.trim()
      } : {}
    };
    if (R && (!/^\d+$/.test(R) || Number(R) <= 0 || !Number.isSafeInteger(Number(R)))) {
      X(c(`过期时间需为正整数毫秒时间戳`));
      return
    }
    if (t && A === `OAUTH` && (!j || !N.trim())) {
      X(c(`请先生成授权链接并回填授权码`));
      return
    }
    if (t) {
      if (A === `REFRESH_TOKEN` && !F.trim() && (!T || T.projectId !== D || T.credentialMode !== A || !T.credentialConfigured)) {
        X(c(`请填写Refresh Token`));
        return
      }
      if (A === `ACCESS_TOKEN` && !I.trim() && (!T || T.projectId !== D || T.credentialMode !== A || !T.credentialConfigured)) {
        X(c(`请填写Access Token`));
        return
      }
      if (A === `SESSION_KEY` && !L.trim() && (!T || T.projectId !== D || T.credentialMode !== A || !T.credentialConfigured)) {
        X(c(`请填写Session Key`));
        return
      }
    }
    if (V === `INPUT` && B.trim()) {
      G.current = !0, W(!0);
      try {
        let e = await u(`/outbound-proxies/resolve`, {
          url: B.trim()
        });
        if (!e.enabled) throw Error(c(`该代理已停用，请启用后重试或录入其他代理`));
        if (t && e.maxResources > 0 && e.usedResources + e.reservedResources >= e.maxResources && e.id !== T?.proxyId) throw Error(c(`该代理的可用名额已满，请录入其他代理`));
        r.proxyId = e.id, delete r.socks5, Ee(e.id), Ae(t => [e, ...t.filter(t => t.id !== e.id)])
      } catch (e) {
        X(e.message);
        return
      } finally {
        G.current = !1, W(!1)
      }
    }
    if (t && A === `OAUTH`) {
      if (!b && !T || !j || !N.trim()) {
        X(c(`请先生成授权链接并回填授权码`));
        return
      }
      G.current = !0, W(!0);
      try {
        if (b) {
          Q({
            id: j.sessionId,
            kind: `OAUTH`
          }), await $(await u(`/resources/oauth/supplier-submit`, {
            sessionId: j.sessionId,
            code: N.trim(),
            input: r
          }));
          return
        }
        let e = T,
          t = await u(`/resources/${m(e.id)}/oauth/supplier-submit`, {
            sessionId: j.sessionId,
            code: N.trim(),
            version: e.version,
            remark: Me
          });
        if (P(``), y(), t.state === `FAILED`) {
          M(null), E({
            ...e,
            ...g(t),
            dispatchState: `FAILED`,
            dispatchFailureReason: t.creationFailureHint || t.message || null
          }), X(l(t.creationFailureHint || t.message || p));
          return
        }
        if (t.state !== `SUCCESS`) {
          E({
            ...e,
            ...g(t),
            dispatchState: t.state
          }), J(t.state), Y(g(t)), q(!0), X(ae(t.state, t));
          return
        }
        x(l(t.message || c(`CCMAX资源已创建（{0}）`, [t.laneId]))), f()
      } catch (e) {
        if (b && await Qe(e)) return;
        q(!0), X(c(`交付结果尚未确认：{0}。请刷新交付结果，勿重复提交。`, [e.message]))
      } finally {
        M(null), P(``), G.current = !1, W(!1)
      }
      return
    }
    G.current = !0, W(!0);
    let i = null;
    try {
      if (b && n) {
        let e = await u(`/resources/oauth/supplier-authorize`, r);
        M(e), P(``);
        return
      }
      if (b && t) {
        let e = Re.current;
        Q({
          id: e,
          kind: `CREDENTIAL`
        }), await $(await u(`/resources/supplier-submit`, {
          requestKey: e,
          input: r
        }));
        return
      }
      if (b && !t && !n && j) {
        let e = await u(`/resources/oauth/supplier-session/${m(j.sessionId)}/cancel`, {});
        if (e.state !== `CANCELLED` && e.state !== `EXPIRED`) {
          Q({
            id: j.sessionId,
            kind: `OAUTH`
          }), await $(e);
          return
        }
        M(null), P(``)
      }
      let e = T ? await ne(`/resources/${m(T.id)}`, r) : await u(`/resources/drafts`, r);
      if (E(e), y(), n) {
        let t = await u(`/resources/${m(e.id)}/oauth/supplier-authorize`, {
          version: e.version
        });
        M(t), P(``);
        return
      }
      if (t) {
        i = e.id, Ye(await u(`/resources/${m(e.id)}/submit`, {
          version: e.version
        }));
        return
      }
      x(c(`草稿已保存`)), f()
    } catch (n) {
      let r = n.message;
      if (b && t && await Qe(n)) return;
      if (b && t) q(!0), X(c(`交付结果尚未确认：{0}。请刷新交付结果，勿重复提交。`, [r]));
      else if (i) {
        q(!0);
        try {
          let t = await e(`/resources/${m(i)}`);
          E(t), y(), t.dispatchState ? Ye(t) : (q(!1), X(c(`提交未完成：{0}`, [r])))
        } catch {
          X(ce)
        }
      } else X(r)
    } finally {
      G.current = !1, W(!1)
    }
  }
  async function tt() {
    if (j) try {
      await navigator.clipboard.writeText(j.authUrl), x(c(`授权链接已复制`))
    } catch {
      X(c(`复制失败，请手动选中授权链接复制`))
    }
  }
  return (0, v.jsx)(n, {
    title: c(Z ? Ge ? Ke ? `正在自动重试` : `交付中` : qe ? `交付待处理` : `核对交付结果` : b ? `新增交付` : `编辑草稿`),
    onClose: Xe,
    wide: !0,
    children: (0, v.jsxs)(`form`, {
      className: `resource-form`,
      onSubmit: e => e.preventDefault(),
      children: [(0, v.jsxs)(`fieldset`, {
        className: `form-grid`,
        disabled: U || Z,
        style: {
          border: 0,
          padding: 0,
          margin: 0,
          minWidth: 0
        },
        children: [b && fe && (0, v.jsxs)(`label`, {
          className: `field`,
          children: [(0, v.jsx)(`span`, {
            children: c(`交付方式`)
          }), (0, v.jsx)(re, {
            value: `ccmax`,
            ariaLabel: c(`交付方式`),
            disabled: U || !!T || !!j || !!F || !!I || !!L,
            options: [{
              value: `ccmax`,
              label: c(`CCMAX 交付`)
            }, {
              value: `api`,
              label: c(`NewAPI 资源交付`)
            }],
            onChange: e => {
              e === `api` && fe()
            }
          })]
        }), (0, v.jsxs)(`label`, {
          className: `field`,
          children: [(0, v.jsx)(`span`, {
            children: c(`资源名称`)
          }), (0, v.jsx)(`input`, {
            readOnly: !0,
            value: T?.name || c(`正式提交或保存草稿后由系统生成`)
          })]
        }), (0, v.jsxs)(`label`, {
          className: `field`,
          children: [(0, v.jsx)(`span`, {
            children: c(`所属项目`)
          }), (0, v.jsx)(re, {
            ariaLabel: c(`所属项目`),
            disabled: U || Z,
            value: D,
            onChange: e => {
              ye(e), xe(`REFRESH_TOKEN`), Se(``), Ce(``), we(``), Te(``), Ee(``), M(null), P(``), X(``)
            },
            options: [{
              value: ``,
              label: c(`请选择`)
            }, ...b && o && !(ge.data?.items || []).some(e => e.id === o.projectId) ? [{
              value: o.projectId,
              label: o.projectName
            }] : [], ...!b && !be && O ? [{
              value: O.id,
              label: c(`{0}（暂不可交付）`, [O.name])
            }] : [], ...(C.data || []).map(e => ({
              value: e.id,
              label: e.name
            }))]
          })]
        }), C.loading && (0, v.jsx)(te, {}), C.error && (0, v.jsxs)(s, {
          tone: `red`,
          children: [c(`可交付项目加载失败：`), C.error]
        }), !C.loading && !C.error && C.data?.length === 0 && (0, v.jsx)(s, {
          tone: `red`,
          children: c(`暂无可交付项目，请先提交报价并等待审核生效。`)
        }), D && O && !k && (0, v.jsx)(s, {
          tone: `red`,
          children: c(`该项目暂未配置交付方式，目前只开放 CCMAX 项目交付。`)
        }), k && (0, v.jsxs)(v.Fragment, {
          children: [(0, v.jsxs)(`label`, {
            className: `field`,
            children: [(0, v.jsx)(`span`, {
              children: c(`CCMAX账号名称（交付账号）`)
            }), (0, v.jsx)(`input`, {
              maxLength: 128,
              value: _e,
              onChange: e => {
                ve(e.target.value), M(null), P(``)
              },
              placeholder: c(`填写实际交付的账号名称`)
            }), (0, v.jsx)(`small`, {
              children: c(`正式交付前必填；资源名称由系统按规则生成。`)
            })]
          }), (0, v.jsxs)(`label`, {
            className: `field`,
            children: [(0, v.jsx)(`span`, {
              children: c(`CCMAX 凭据方式`)
            }), (0, v.jsx)(re, {
              ariaLabel: c(`凭据方式`),
              disabled: U || Z,
              value: A,
              onChange: e => {
                xe(e), Se(``), Ce(``), we(``), Te(``), M(null), P(``)
              },
              options: oe
            })]
          }), (0, v.jsx)(se, {
            value: B,
            selected: V === `POOL` ? Ve : null,
            options: Be,
            loading: w.loading,
            loadingMore: w.loadingMore,
            error: w.error,
            onRetry: w.retry,
            disabled: U || Z,
            canRecord: De,
            ownProxyId: T?.proxyId,
            onInput: e => {
              Oe(e), Ee(``), He()
            },
            onSelect: e => {
              Ee(e.id), Oe(``), e.id !== z && He()
            }
          }), (A === `REFRESH_TOKEN` || A === `ACCESS_TOKEN`) && (0, v.jsxs)(`label`, {
            className: `field`,
            children: [(0, v.jsxs)(`span`, {
              children: [`Refresh Token `, A === `ACCESS_TOKEN` ? c(`（可选）`) : ``]
            }), (0, v.jsx)(`input`, {
              type: `password`,
              autoComplete: `new-password`,
              value: F,
              onChange: e => Se(e.target.value),
              placeholder: b ? `` : c(`留空表示不更换`)
            })]
          }), A === `ACCESS_TOKEN` && (0, v.jsxs)(v.Fragment, {
            children: [(0, v.jsxs)(`label`, {
              className: `field`,
              children: [(0, v.jsx)(`span`, {
                children: `Access Token`
              }), (0, v.jsx)(`input`, {
                type: `password`,
                autoComplete: `new-password`,
                value: I,
                onChange: e => Ce(e.target.value),
                placeholder: b ? `` : c(`留空表示不更换`)
              })]
            }), (0, v.jsxs)(`label`, {
              className: `field`,
              children: [(0, v.jsx)(`span`, {
                children: c(`过期时间（毫秒时间戳，可选）`)
              }), (0, v.jsx)(`input`, {
                inputMode: `numeric`,
                value: R,
                onChange: e => Te(e.target.value)
              })]
            })]
          }), A === `SESSION_KEY` && (0, v.jsx)(v.Fragment, {
            children: (0, v.jsxs)(`label`, {
              className: `field`,
              children: [(0, v.jsx)(`span`, {
                children: `Session Key`
              }), (0, v.jsx)(`input`, {
                type: `password`,
                autoComplete: `new-password`,
                value: L,
                onChange: e => we(e.target.value),
                placeholder: b ? `` : c(`留空表示不更换`)
              })]
            })
          }), A === `OAUTH` && (0, v.jsxs)(`section`, {
            className: `resource-delivery-oauth full`,
            children: [!(V === `INPUT` ? B.trim() : z) && (0, v.jsx)(`p`, {
              className: `muted`,
              children: c(`可先生成授权链接；补充代理后请重新生成链接再正式提交。`)
            }), (0, v.jsx)(d, {
              disabled: U || je || !S.allowed,
              onClick: () => void et(!1, !0),
              children: c(U ? `正在生成…` : j ? `重新生成授权链接` : `生成授权链接`)
            }), j && (0, v.jsxs)(`div`, {
              className: `resource-target-oauth-result`,
              children: [(0, v.jsxs)(`p`, {
                className: `muted`,
                children: [c(`授权链接有效期至 `), r(j.expiresAt)]
              }), (0, v.jsxs)(`label`, {
                className: `field`,
                children: [(0, v.jsx)(`span`, {
                  children: c(`授权链接`)
                }), (0, v.jsx)(`textarea`, {
                  readOnly: !0,
                  rows: 3,
                  value: j.authUrl
                })]
              }), (0, v.jsxs)(`div`, {
                className: `resource-target-oauth-actions`,
                children: [(0, v.jsx)(d, {
                  onClick: () => void tt(),
                  children: c(`复制`)
                }), (0, v.jsx)(`a`, {
                  href: j.authUrl,
                  target: `_blank`,
                  rel: `noopener noreferrer`,
                  children: c(`打开浏览器 `)
                })]
              }), (0, v.jsxs)(`label`, {
                className: `field`,
                children: [(0, v.jsx)(`span`, {
                  children: c(`回调地址或 code#state`)
                }), (0, v.jsx)(`textarea`, {
                  rows: 3,
                  placeholder: c(`粘贴完整回调 URL 或 code#state`),
                  autoComplete: `off`,
                  value: N,
                  onChange: e => P(e.target.value)
                })]
              })]
            })]
          })]
        }), (0, v.jsxs)(`label`, {
          className: `field full`,
          children: [(0, v.jsx)(`span`, {
            children: c(`备注`)
          }), (0, v.jsx)(`textarea`, {
            value: Me,
            onChange: e => Ne(e.target.value)
          })]
        })]
      }), (0, v.jsx)(ue, {
        access: S
      }), ge.error && (0, v.jsxs)(s, {
        tone: `red`,
        children: [c(`项目加载失败：`), ge.error]
      }), ze && !(!S.allowed && ze === S.deniedMessage) && (0, v.jsx)(s, {
        tone: Z ? `amber` : `red`,
        children: ze
      }), (0, v.jsxs)(`footer`, {
        className: `dialog-footer`,
        children: [Z && (0, v.jsx)(d, {
          disabled: U,
          onClick: () => void $e(),
          children: c(U ? `正在查询…` : `刷新交付结果`)
        }), (0, v.jsx)(d, {
          onClick: Xe,
          disabled: U,
          children: c(Je ? `关闭` : `取消`)
        }), !Je && (0, v.jsxs)(v.Fragment, {
          children: [(0, v.jsx)(d, {
            onClick: () => void et(!1),
            disabled: U || je || Z || !k || !D || b && (!be || !S.allowed),
            children: c(`保存草稿 `)
          }), (0, v.jsx)(d, {
            variant: `primary`,
            onClick: () => void et(!0),
            disabled: U || je || Z || !k || !D || !be || !S.allowed || A === `OAUTH` && (!j || !N.trim()),
            children: c(U ? `正在处理…` : `正式提交`)
          })]
        })]
      })]
    })
  })
}
export {
  y as ResourceForm
};