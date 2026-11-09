// origin: assets/resourceHelpers-DoyalwRL.js
import {
  D as e,
  X as t,
  Y as n,
  Z as r,
  g as i,
  mt as a,
  o,
  ot as s,
  pt as c,
  vt as l
} from "./index-Dnr0i-H9.js";
import {
  n as u
} from "./CcmaxResourceOverview-BpVmtOxH.js";
var d = l(r(), 1),
  f = t();

function p(e) {
  let t = e.resourceType === `CCMAX` ? e.resourceData?.health : null;
  if (!t || typeof t != `object` || Array.isArray(t)) return null;
  let n = t.credentialFailureReason;
  return typeof n == `string` && n.trim() ? n.trim() : null
}

function m(e) {
  return e?.toLowerCase().replaceAll(` `, ``).replaceAll(`（`, `(`).replaceAll(`）`, `)`) === `accesstoken已过期(等待自动续期)`
}

function h(e) {
  let t = p(e)?.toLowerCase().replaceAll(` `, ``).replaceAll(`（`, `(`).replaceAll(`）`, `)`) || ``;
  return e.laneState !== `GONE` && [`账号受限(account_on_hold)`, `认证被拒绝(具体原因未确认)`, `需要身份验证(kyc)`].some(e => t.includes(e))
}

function g(e) {
  let t = e.resourceType === `CCMAX` ? e.resourceData?.health : null;
  return !!t && typeof t == `object` && !Array.isArray(t) && t.paused === !0
}

function _({
  value: e,
  selected: t,
  options: r,
  loading: i,
  loadingMore: o,
  error: s,
  onRetry: c,
  disabled: l,
  canRecord: u,
  ownProxyId: p,
  allowFull: m = !1,
  supportedProtocols: h,
  description: g,
  onInput: _,
  onSelect: v
}) {
  let y = (0, d.useId)(),
    b = (0, d.useId)(),
    x = (0, d.useRef)(null),
    [S, C] = (0, d.useState)(!1),
    [w, T] = (0, d.useState)(-1),
    [E, D] = (0, d.useState)(``),
    [O, k] = (0, d.useState)(50),
    A = t ? `` : E.trim().toLowerCase(),
    j = r.filter(e => `${e.name} ${e.protocol} ${e.endpoint}`.toLowerCase().includes(A)),
    M = j.slice(0, O),
    N = e => h != null && !h.includes(e.protocol) || !e.enabled || !m && e.maxResources > 0 && e.usedResources + e.reservedResources >= e.maxResources && e.id !== p;
  (0, d.useEffect)(() => {
    S && w >= 0 && document.getElementById(`${y}-${w}`)?.scrollIntoView({
      block: `nearest`
    })
  }, [S, w, y]);

  function P(e) {
    N(e) || (v(e), C(!1), T(-1), x.current?.focus())
  }

  function F(e) {
    if (C(!0), j.length === 0) return;
    let t = w < 0 ? e > 0 ? -1 : 0 : w;
    for (let n = 0; n < j.length; n++)
      if (t = (t + e + j.length) % j.length, !N(j[t])) {
        k(e => Math.max(e, t + 1)), T(t);
        return
      }
  }
  return (0, f.jsxs)(`div`, {
    className: `field resource-proxy-field`,
    onBlur: e => {
      e.currentTarget.contains(e.relatedTarget) || C(!1)
    },
    children: [(0, f.jsx)(`label`, {
      htmlFor: b,
      children: a(`代理`)
    }), (0, f.jsxs)(`div`, {
      className: `resource-proxy-input`,
      children: [(0, f.jsx)(`input`, {
        ref: x,
        id: b,
        role: `combobox`,
        type: `text`,
        "aria-autocomplete": `list`,
        "aria-haspopup": `listbox`,
        "aria-expanded": S && !l,
        "aria-controls": y,
        "aria-activedescendant": S && w >= 0 && w < j.length ? `${y}-${w}` : void 0,
        autoComplete: `off`,
        spellCheck: !1,
        disabled: l,
        placeholder: a(u ? `选择已有代理或粘贴代理地址` : `搜索并选择已有代理`),
        value: t ? `${t.name} · ${t.protocol} · ${t.endpoint}` : e,
        onFocus: e => {
          C(!0), D(``), T(-1), k(50), t && e.currentTarget.select()
        },
        onClick: () => {
          C(!0), D(``)
        },
        onChange: e => {
          _(e.target.value), D(e.target.value), k(50), C(!0), T(-1)
        },
        onKeyDown: e => {
          if (!e.nativeEvent.isComposing) {
            if (e.key === `ArrowDown` || e.key === `ArrowUp`) e.preventDefault(), F(e.key === `ArrowDown` ? 1 : -1);
            else if (e.key === `Enter` && S && w >= 0) {
              e.preventDefault();
              let t = j[w];
              t && P(t)
            } else e.key === `Escape` && S && (e.preventDefault(), e.stopPropagation(), C(!1), T(-1))
          }
        }
      }), (0, f.jsx)(`span`, {
        className: `resource-proxy-chevron`,
        "aria-hidden": `true`,
        children: (0, f.jsx)(n, {
          name: `down`,
          size: 16
        })
      }), S && !l && (0, f.jsxs)(`div`, {
        className: `resource-proxy-options`,
        id: y,
        role: `listbox`,
        "aria-label": a(`已有代理`),
        children: [M.map((e, n) => (0, f.jsxs)(`button`, {
          type: `button`,
          role: `option`,
          id: `${y}-${n}`,
          tabIndex: -1,
          "aria-selected": t?.id === e.id,
          disabled: N(e),
          className: w === n ? `active` : ``,
          onMouseDown: e => e.preventDefault(),
          onMouseEnter: () => T(n),
          onClick: () => P(e),
          children: [(0, f.jsx)(`strong`, {
            children: e.name
          }), (0, f.jsxs)(`span`, {
            children: [e.protocol, ` · `, e.endpoint, ` ·`, ` `, h && !h.includes(e.protocol) ? a(`（暂不支持换绑）`) : e.enabled ? `${e.usedResources+e.reservedResources}/${e.maxResources||a(`不限`)}` : a(`已停用`)]
          })]
        }, e.id)), j.length > M.length && (0, f.jsxs)(`button`, {
          type: `button`,
          onMouseDown: e => e.preventDefault(),
          onClick: () => k(e => e + 50),
          children: [a(`显示更多代理（已显示 `), M.length, ` / `, j.length, a(`） `)]
        }), o && (0, f.jsx)(`p`, {
          role: `status`,
          children: a(`正在继续加载代理，已加载的可直接选择…`)
        }), s && (0, f.jsxs)(`div`, {
          role: `alert`,
          children: [(0, f.jsxs)(`p`, {
            children: [a(`部分代理尚未加载：`), s]
          }), (0, f.jsx)(`button`, {
            type: `button`,
            onMouseDown: e => e.preventDefault(),
            onClick: c,
            children: a(`重试加载代理 `)
          })]
        }), j.length === 0 && (0, f.jsx)(`p`, {
          role: `status`,
          children: i ? a(`正在加载代理…`) : s ? a(`代理列表加载失败：{0}`, [s]) : A && u ? A.includes(`:`) ? a(`使用时自动保存，重复代理会复用`) : a(`暂无匹配，可直接粘贴代理地址`) : a(`暂无匹配代理`)
        })]
      })]
    }), (0, f.jsx)(`small`, {
      children: g || a(u ? `支持 SOCKS5、HTTP、HTTPS，重复代理自动复用。` : `当前账号仅可选择已有代理。`)
    })]
  })
}

function v({
  resource: e
}) {
  let t = p(e);
  return t ? (0, f.jsx)(`div`, {
    className: `resource-health-notice`,
    children: (0, f.jsxs)(i, {
      tone: h(e) ? `red` : `amber`,
      children: [(0, f.jsx)(`strong`, {
        children: h(e) ? a(`账号失效原因`) : m(t) ? a(`凭据续期提示`) : a(`凭据状态提示`)
      }), (0, f.jsx)(`div`, {
        children: s(t)
      })]
    })
  }) : null
}
var y = {
    DRAFT: a(`草稿`),
    DELIVERED: a(`交付成功`),
    SUBMITTING: a(`交付中`),
    SUBMIT_FAILED: a(`提交失败`)
  },
  b = {
    ...u,
    RATE_LIMITED: a(`限流冷却`)
  },
  x = [{
    value: ``,
    label: a(`全部交付状态`)
  }, {
    value: `DRAFT`,
    label: a(`草稿`)
  }, {
    value: `DELIVERY_FAILED`,
    label: a(`失败或待核对`)
  }, {
    value: `DELIVERED`,
    label: a(`已提交`)
  }, {
    value: `SUBMITTING`,
    label: a(`交付中`)
  }, {
    value: `SUBMIT_FAILED`,
    label: a(`提交失败`)
  }],
  S = {
    NOT_IMPORTED: a(`待推送`),
    PENDING: a(`推送中`),
    IMPORTED: a(`已推送`),
    FAILED: a(`推送失败`),
    UNKNOWN: a(`待核对`)
  },
  C = {
    NOT_STARTED: a(`待上号`),
    QUEUED: a(`排队中`),
    RUNNING: a(`上号中`),
    SUCCEEDED: a(`已上号`),
    FAILED: a(`上号失败`),
    UNKNOWN: a(`待核对`)
  };

function w(e) {
  return e === `IMPORTED` || e === `SUCCEEDED` ? `APPROVED` : e === `FAILED` ? `REJECTED` : e === `UNKNOWN` ? `UNKNOWN` : `PENDING`
}

function T(e) {
  let [t, n] = (0, d.useState)(``), [r, i] = (0, d.useState)(``), a = (0, d.useRef)(null);
  return (0, d.useEffect)(() => () => {
    a.current !== null && clearTimeout(a.current)
  }, []), [t, t => {
    n(t), a.current !== null && clearTimeout(a.current);
    let r = () => {
      i(t.trim()), e(), a.current = null
    };
    t.trim() ? a.current = setTimeout(r, 300) : r()
  }, r]
}
var E = {
  PROVISIONING: {
    label: a(`配置中`),
    handling: a(`等待目标就绪；保留本地交付记录`)
  },
  PAUSED: {
    label: a(`已暂停`),
    handling: a(`停止接收新请求；保留本地交付记录`)
  },
  READY: {
    label: a(`就绪`),
    handling: a(`目标已就绪；保留本地交付记录`)
  },
  COOLING: {
    label: a(`冷却中`),
    handling: a(`目标冷却中；保留本地交付记录`)
  },
  DRAINING: {
    label: a(`退出中`),
    handling: a(`目标退出中；保留本地交付记录`)
  },
  DEAD: {
    label: a(`已停止`),
    handling: a(`目标已停止；保留本地交付记录，允许核对费用`)
  },
  GONE: {
    label: a(`已移除`),
    handling: a(`目标已移除；自动同步停止，历史金额可手动核查`)
  }
};

function D(e) {
  return e.dispatchState === `UNKNOWN` || e.dispatchState === `PENDING`
}

function O(e) {
  return [`REFRESH_TOKEN`, `ACCESS_TOKEN`, `SESSION_KEY`].includes(e.credentialMode)
}

function k(e) {
  return e.dispatchState === `FAILED` ? a(`交付失败`) : e.dispatchState === `UNKNOWN` && e.creationFinished ? a(`待处理`) : e.dispatchState === `UNKNOWN` ? a(`待核对`) : e.dispatchState === `PENDING` ? e.creationRetrying ? a(`正在自动重试`) : a(`交付中`) : e.state === `DELIVERED` && e.dispatchState !== `SUCCESS` ? a(`待创建目标`) : y[e.state] || e.state
}

function A(e) {
  return e.dispatchState === `FAILED` ? `FAILURE` : e.dispatchState === `UNKNOWN` ? `UNKNOWN` : e.dispatchState === `PENDING` || e.state === `DELIVERED` && e.dispatchState !== `SUCCESS` ? `PENDING` : e.state
}
var j = a(`交付失败`),
  M = a(`交付结果尚未确认，请等待后刷新交付结果，勿重复提交。`);

function N(e, t = {}) {
  if (e === `UNKNOWN` && t.creationFinished) {
    let e = t.creationAttempts === 2 ? a(`已自动重试1次，交付暂未完成，自动处理已结束，请协助处理。`) : a(`交付暂未完成，请协助处理。`);
    return t.creationFailureHint ? a(`{0} {1} 请先联系平台核对创建结果，勿重复提交。`, [e, s(t.creationFailureHint)]) : e
  }
  return e === `PENDING` && t.creationRetrying ? a(`正在自动重试，请等待处理结果，勿重复提交。`) : e === `PENDING` ? a(`交付中，请等待后刷新交付结果，勿重复提交。`) : M
}

function P(e) {
  if (e.creationFailureHint?.trim()) return s(e.creationFailureHint.trim());
  if (e.creationFailureReason?.trim()) return s(e.creationFailureReason.trim());
  let t = e.creationHttpStatus;
  return t != null && Number.isInteger(t) && t >= 400 && t <= 599 ? a(t >= 500 ? `CCMAX 服务异常（HTTP {0}）` : `CCMAX 返回 HTTP {0}`, [t]) : null
}

function F(e) {
  let t = {};
  return e.creationAttempts !== void 0 && (t.creationAttempts = e.creationAttempts), e.creationRetrying !== void 0 && (t.creationRetrying = e.creationRetrying), e.creationFinished !== void 0 && (t.creationFinished = e.creationFinished), e.creationHttpStatus !== void 0 && (t.creationHttpStatus = e.creationHttpStatus), e.creationFailureReason !== void 0 && (t.creationFailureReason = e.creationFailureReason), e.creationFailureHint !== void 0 && (t.creationFailureHint = e.creationFailureHint), t
}

function I({
  state: e,
  label: t,
  progress: n
}) {
  return (0, f.jsxs)(`span`, {
    className: `stack`,
    style: {
      alignItems: `flex-start`
    },
    children: [(0, f.jsx)(o, {
      state: e,
      label: t
    }), e === `UNKNOWN` && n.creationFinished && (0, f.jsx)(`span`, {
      className: `small muted`,
      children: a(`交付暂未完成，请协助处理`)
    })]
  })
}

function L(e, t, n) {
  return !!e.deleteAvailable && (e.state === `DRAFT` || !!e.oauthRetryAvailable) && e.dispatchState === `FAILED` && !(`laneId` in e && e.laneId) && (n(`resource.write`) || !t && n(`resource.dispatch`))
}

function R(e, t, n) {
  return t && n(`resource.write`) && e.state === `DRAFT` && !e.submittedAt && !e.oauthRetryAvailable && !D(e) && e.dispatchState !== `SUCCESS` && !(`laneId` in e && e.laneId)
}

function z(e, t, n) {
  return !!e.manualRecoveryAvailable && !!e.recoveryDispatchId && n(t ? `resource.write` : `resource.dispatch`)
}

function B(e, t, n) {
  return t && n(`resource.write`) && !!e.oauthRetryAvailable
}

function V(e, t, n) {
  return L(e, t, n) || R(e, t, n) && !e.dispatchState
}

function H(e) {
  return e.state === `SUCCESS` ? a(`交付成功`) : e.state === `PENDING` ? e.creationRetrying ? a(`正在自动重试`) : a(`交付中`) : e.state === `FAILED` ? j : e.state === `UNKNOWN` && e.creationFinished ? a(`待处理`) : a(`待核对`)
}

function U(e) {
  let t = e.laneState;
  return t === `GONE` ? {
    state: `WITHDRAWN`,
    label: a(`已移除`)
  } : t === `DRAINING` ? {
    state: `PENDING`,
    label: a(`退出中`)
  } : h(e) ? {
    state: `FAILURE`,
    label: a(`账号失效`)
  } : t ? {
    state: {
      PROVISIONING: `PENDING`,
      READY: `SUCCESS`,
      COOLING: `PENDING`,
      DRAINING: `PENDING`,
      DEAD: `FAILURE`,
      GONE: `WITHDRAWN`
    } [t] || `UNKNOWN`,
    label: E[t]?.label || a(`未知状态（{0}）`, [t])
  } : {
    state: e.dispatchState === `PENDING` ? `PENDING` : `UNKNOWN`,
    label: e.dispatchState === `PENDING` ? a(`创建中`) : e.dispatchState === `UNKNOWN` ? a(`待核对`) : e.state === `DRAFT` ? a(`未交付`) : e.dispatchState === `SUCCESS` ? a(`待查询`) : a(`未关联`)
  }
}
var W = Object.entries(e).map(([e, t]) => ({
    value: e,
    label: t
  })),
  G = encodeURIComponent,
  K = (e, t = `—`) => e ? new Date(e).toLocaleString(c(), {
    timeZone: `Asia/Shanghai`,
    year: `numeric`,
    month: `2-digit`,
    day: `2-digit`,
    hour: `2-digit`,
    minute: `2-digit`,
    hour12: !1
  }) : t;

function q(e) {
  return e.resourceType === `NEWAPI_INTAKE`
}

function J(e, t) {
  return a(t ? `NewAPI 待分配资源` : e ? `我的交付` : `资源管理`)
}
export {
  p as A, A as C, T as D, N as E, h as M, g as N, v as O, k as S, J as T, W as _, B as a, C as b, j as c, H as d, G as f, q as g, D as h, z as i, m as j, _ as k, x as l, O as m, V as n, P as o, K as p, R as r, F as s, I as t, M as u, w as v, U as w, b as x, S as y
};