// origin: assets/Resources-CXo1DF00.js
import { ChannelUsage, NewApiChannelDialog, NewApiLinkDialog, channelLabel, isNewApi } from '../runtime/newapi-channel.js';
import { NativeCcmaxDialog, NativeCcmaxLinkDialog, isNativeCcmax } from '../runtime/ccmax-native.js';
import IntakeToday from './IntakeToday-Digz-vi6.js';
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/ResourceLifecycleDialog-C3CIVivi.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/IntakeReviewDialog-C9xZ8Ftb.js", "assets/intake-D282aV6G.css", "assets/PriorityBatchDialog-DWPDEDJI.js", "assets/labels-DaPzz6Ie.js", "assets/CcmaxResourceOverview-BpVmtOxH.js", "assets/ResourceForm-CV4-f1sb.js", "assets/useDeliveryProxies-DGHL4QCT.js", "assets/resourceHelpers-DoyalwRL.js", "assets/ResourceDetail-PGeCmPlL.js", "assets/CcmaxBatchDelivery-BSCydCTL.js", "assets/NewDelivery-CYrGthQl.js", "assets/NewDelivery-BY50kDnq.css"]))) => i.map(i => d[i]);
import {
  $ as e,
  A as t,
  B as n,
  C as r,
  D as i,
  G as a,
  I as o,
  K as s,
  P as c,
  Q as l,
  S as u,
  X as d,
  Y as f,
  Z as p,
  _ as m,
  _t as h,
  c as g,
  d as _,
  dt as v,
  g as y,
  h as b,
  i as x,
  it as S,
  l as C,
  m as w,
  mt as T,
  o as E,
  ot as D,
  pt as O,
  r as ee,
  rt as k,
  s as A,
  st as te,
  u as j,
  vt as ne,
  y as re
} from "./index-Dnr0i-H9.js";
import {
  t as M
} from "./CcmaxResourceOverview-BpVmtOxH.js";
import {
  n as ie,
  r as ae,
  t as oe
} from "./QueryFilters-CwGBc_NH.js";
import {
  t as se
} from "./DateRangePicker-DtOG4QUZ.js";
import {
  t as ce
} from "./MoneyDisplay-Bphc56N8.js";
import {
  A as le,
  C as N,
  D as ue,
  M as P,
  N as F,
  S as de,
  T as fe,
  _ as pe,
  a as me,
  b as he,
  f as ge,
  g as I,
  h as _e,
  i as ve,
  j as L,
  k as ye,
  l as be,
  n as xe,
  p as Se,
  r as Ce,
  t as we,
  v as Te,
  w as Ee,
  x as De,
  y as Oe
} from "./resourceHelpers-DoyalwRL.js";
var R = ne(p(), 1),
  ke = s(),
  z = d(),
  Ae = `/resources/submission-capabilities`;

function je(e) {
  return e?.forceStopCcmaxIntake ? T(`平台已暂停 CCMAX 新增上号，请稍后再试或联系平台管理员。已有资源查询、同步和重新授权不受影响。`) : T(`当前供应商未开通 CCMAX 上号，请联系平台管理员。`)
}

function Me(t = !0) {
  let {
    user: n,
    has: i
  } = r(), a = t && !!n.supplierId && i(`resource.write`), o = u(a ? Ae : null);
  return {
    ...o,
    enabled: a,
    allowed: a && o.data?.allowCcmax === !0 && !o.data.forceStopCcmaxIntake && !o.error,
    deniedMessage: je(o.data),
    async requireAllowed() {
      if (!a) throw Error(T(`当前账号无权访问此页面`));
      let t = await e(Ae);
      if (o.mutate(() => t), t.forceStopCcmaxIntake || !t.allowCcmax) throw Error(je(t))
    }
  }
}

function Ne({
  access: e
}) {
  return !e.enabled || e.loading || e.allowed ? null : e.error ? (0, z.jsxs)(y, {
    tone: `red`,
    children: [e.error, ` `, (0, z.jsx)(A, {
      onClick: e.reload,
      children: T(`重新加载配置`)
    })]
  }) : (0, z.jsx)(y, {
    tone: `amber`,
    children: e.deniedMessage
  })
}

function Pe({
  anchor: e,
  subject: t,
  busy: n,
  onCancel: r,
  onConfirm: i
}) {
  let a = (0, R.useRef)(null),
    o = (0, R.useRef)({
      busy: n,
      onCancel: r
    });
  o.current = {
    busy: n,
    onCancel: r
  };
  let s = (0, R.useRef)(!0),
    c = (0, R.useId)(),
    l = (0, R.useId)(),
    [u, d] = (0, R.useState)(null);
  return (0, R.useLayoutEffect)(() => {
    let t = () => {
      if (!e.isConnected) {
        o.current.onCancel();
        return
      }
      let t = e.getBoundingClientRect(),
        n = Math.min(304, window.innerWidth - 24),
        r = Math.min(a.current?.getBoundingClientRect().height || 150, window.innerHeight - 24),
        i = t.bottom + 8;
      d({
        width: n,
        left: Math.max(12, Math.min(t.right - n, window.innerWidth - n - 12)),
        top: Math.max(12, Math.min(i + r <= window.innerHeight - 12 ? i : t.top - r - 8, window.innerHeight - r - 12))
      })
    };
    t();
    let n = new ResizeObserver(t);
    return n.observe(e), a.current && n.observe(a.current), window.addEventListener(`resize`, t), window.addEventListener(`scroll`, t, !0), () => {
      n.disconnect(), window.removeEventListener(`resize`, t), window.removeEventListener(`scroll`, t, !0)
    }
  }, [e]), (0, R.useEffect)(() => {
    s.current = !0;
    let t = t => {
        let n = t.target;
        !o.current.busy && !e.contains(n) && !a.current?.contains(n) && (s.current = !1, o.current.onCancel())
      },
      n = e => {
        e.key === `Escape` && !o.current.busy && (e.preventDefault(), e.stopPropagation(), o.current.onCancel())
      };
    return document.addEventListener(`pointerdown`, t), document.addEventListener(`focusin`, t), document.addEventListener(`keydown`, n), () => {
      document.removeEventListener(`pointerdown`, t), document.removeEventListener(`focusin`, t), document.removeEventListener(`keydown`, n), s.current && e.isConnected && e.focus({
        preventScroll: !0
      })
    }
  }, [e]), (0, R.useEffect)(() => {
    n || a.current?.querySelector(`button`)?.focus({
      preventScroll: !0
    })
  }, [e, n]), (0, ke.createPortal)((0, z.jsxs)(`div`, {
    ref: a,
    className: `resource-remove-confirm`,
    role: `dialog`,
    "aria-modal": `false`,
    "aria-labelledby": c,
    "aria-describedby": l,
    "aria-busy": n,
    style: u || {
      left: 0,
      top: 0,
      width: 304,
      visibility: `hidden`
    },
    children: [(0, z.jsx)(`strong`, {
      id: c,
      children: t
    }), (0, z.jsx)(`p`, {
      id: l,
      children: T(`移除后无法恢复`)
    }), (0, z.jsxs)(`div`, {
      className: `resource-remove-confirm-actions`,
      children: [(0, z.jsx)(A, {
        disabled: n,
        onClick: r,
        children: T(`取消`)
      }), (0, z.jsx)(A, {
        variant: `danger`,
        disabled: n,
        onClick: i,
        children: T(n ? `正在提交…` : `移除`)
      })]
    })]
  }), document.body)
}

function Fe(e) {
  return !e.supplierId && ![`SUPPLIER`, `SUPPLIER_AGENT`].includes(e.role) && e.permissions.includes(`resource.read`) && e.permissions.includes(`resource.dispatch`)
}

function Ie(e, t) {
  let n = t || !!e.supplierId || [`SUPPLIER`, `SUPPLIER_AGENT`].includes(e.role);
  return e.permissions.includes(`resource.read`) && (n ? !!e.supplierId && e.permissions.includes(`resource.write`) : e.permissions.includes(`resource.dispatch`))
}

function Le(e) {
  if (e.readOnly) return false;
  if (isNativeCcmax(e)) return !!e.upstreamAccountId && ![`GONE`, `DRAINING`].includes(e.operationalState || ``);
  if (isNewApi(e)) return !!e.upstreamChannelId && ![`GONE`, `DRAINING`].includes(e.operationalState || ``);
  return e.resourceType === `CCMAX` && e.state === `DELIVERED` && e.dispatchState === `SUCCESS` && !!e.laneId && ![`GONE`, `DRAINING`].includes(e.laneState || ``)
}

function pausedResource(e) {
  return F(e) || e.operationalState === `PAUSED` || e.laneState === `PAUSED`
}
var Re = (0, R.lazy)(() => x(() => import(`./ResourceLifecycleDialog-C3CIVivi.js`), __vite__mapDeps([0, 1, 2])));

function ze(e, t, n, i) {
  let {
    user: a,
    notify: o
  } = r(), s = Ie(a, e), c = e || !!a.supplierId, l = s && (!c || i?.allowCcmaxPause === !0), u = s && (!c || i?.allowCcmaxSafeRemoval === !0), d = s && (!c || l || u), f = !e && Fe(a), [p, m] = (0, R.useState)(null), [h, g] = (0, R.useState)(null), [_, v] = (0, R.useState)(!1), y = (0, R.useRef)(!1), x = (0, R.useRef)(new Map);
  async function S(e, r) {
    if (y.current || !r.length || r.length > 1 && !f || (e === `REMOVE` ? !u : !l)) return !1;
    y.current = !0;
    try {
      let t = r.map(e => ({
          resourceId: e.id,
          version: e.version
        })).sort((e, t) => e.resourceId.localeCompare(t.resourceId)),
        n = JSON.stringify([a.id, e, t]),
        i = x.current.get(n) || crypto.randomUUID();
      x.current.set(n, i), v(!0), await k(`/resource-lifecycle-jobs`, {
        requestKey: i,
        action: e,
        items: t
      }), x.current.delete(n)
    } catch (e) {
      return o(e.message, !0), !1
    } finally {
      y.current = !1, v(!1)
    }
    return o(T(`已提交{0}，后台处理中，可在操作记录查看`, [T(e === `PAUSE` ? `停用` : e === `RESUME` ? `恢复` : `移除`)])), n(), t(), !0
  }

  function C(e, t, n) {
    y.current || !u || !t.length || t.length > 1 && !f || g(r => r?.anchor === e ? null : {
      anchor: e,
      resources: t,
      key: n
    })
  }
  return {
    maySelect: f,
    rowActions: e => s && Le(e) ? (0, z.jsxs)(z.Fragment, {
      children: [l && (0, z.jsx)(`button`, {
        type: `button`,
        className: `resource-action-link`,
        disabled: _,
        onClick: t => {
          t.stopPropagation(), S(pausedResource(e) ? `RESUME` : `PAUSE`, [e])
        },
        children: pausedResource(e) ? T(`恢复`) : T(`停用`)
      }), u && (0, z.jsx)(`button`, {
        type: `button`,
        className: `resource-action-link`,
        disabled: _,
        "aria-haspopup": `dialog`,
        "aria-expanded": h?.key === `row:${e.id}`,
        onClick: t => {
          t.stopPropagation(), C(t.currentTarget, [e], `row:${e.id}`)
        },
        children: T(`移除`)
      })]
    }) : null,
    toolbar: e => {
      if (!s) return null;
      let t = e.filter(Le),
        n = t.filter(pausedResource).length,
        r = n > 0 && n < t.length,
        i = t.length > 0 && n === t.length;
      return (0, z.jsxs)(z.Fragment, {
        children: [f && l && (0, z.jsx)(A, {
          disabled: _ || !t.length || r,
          title: r ? T(`请选择启停状态相同的资源`) : void 0,
          onClick: () => {
            r || S(i ? `RESUME` : `PAUSE`, t)
          },
          children: T(r ? `批量启停` : i ? `批量恢复` : `批量停用`)
        }), f && l && r && (0, z.jsx)(`span`, {
          className: `muted`,
          role: `status`,
          children: T(`请选择启停状态相同的资源`)
        }), f && u && (0, z.jsx)(A, {
          disabled: _ || !t.length,
          "aria-haspopup": `dialog`,
          "aria-expanded": h?.key === `batch`,
          onClick: e => C(e.currentTarget, t, `batch`),
          children: T(`批量移除`)
        }), d && (0, z.jsx)(A, {
          disabled: _,
          onClick: () => {
            g(null), m({
              mode: `records`
            })
          },
          children: T(`启停与移除记录`)
        })]
      })
    },
    dialogs: d && (h || p) ? (0, z.jsxs)(z.Fragment, {
      children: [h && (0, z.jsx)(Pe, {
        anchor: h.anchor,
        subject: h.resources.length === 1 ? h.resources[0].name || h.resources[0].laneId || T(`{0} 个资源`, [1]) : T(`{0} 个资源`, [h.resources.length]),
        busy: _,
        onCancel: () => {
          y.current || g(null)
        },
        onConfirm: async () => {
          await S(`REMOVE`, h.resources) && g(null)
        }
      }), p && (0, z.jsx)(R.Suspense, {
        fallback: (0, z.jsx)(b, {}),
        children: (0, z.jsx)(Re, {
          state: p,
          onClose: () => {
            m(null), t()
          },
          onOpen: e => m({
            mode: `progress`,
            id: e
          }),
          onChanged: t
        })
      })]
    }) : null
  }
}
var Be = {
  1: `OpenAI`,
  3: `Azure OpenAI`,
  14: `Anthropic`,
  24: `Google Gemini`,
  33: `AWS Bedrock`,
  41: `Google Vertex`,
  60: `NewAPI`
};

function Ve(e) {
  if (e == null) return `—`;
  if (typeof e == `string`) {
    try {
      let t = JSON.parse(e);
      if (t && typeof t == `object`) return JSON.stringify(t, null, 2)
    } catch {}
    return e
  }
  return typeof e == `object` ? JSON.stringify(e, null, 2) : String(e)
}

function He({
  item: e
}) {
  let {
    has: t,
    notify: n
  } = r(), [i, a] = (0, R.useState)(null), [o, s] = (0, R.useState)(!1), [c, l] = (0, R.useState)(``), [u, d] = (0, R.useState)(!1), [f, p] = (0, R.useState)(0), m = !e.readOnly && t(`resource.sensitive`), h = !e.readOnly && t(`resource.request.read`), [g, _] = (0, R.useState)(null), [v, b] = (0, R.useState)(``);
  (0, R.useEffect)(() => {
    let t = !0;
    if (_(null), b(``), h) return k(`/resource-intakes/${encodeURIComponent(e.id)}/original-request`, {}).then(e => {
      t && _(e.originalRequest)
    }).catch(e => {
      t && b(e.message)
    }), () => {
      t = !1
    }
  }, [e.id, h, f]), (0, R.useEffect)(() => {
    let t = !0;
    if (a(null), d(!1), l(``), !m) {
      s(!1);
      return
    }
    return s(!0), k(`/resource-intakes/${encodeURIComponent(e.id)}/material`, {}).then(e => {
      t && a(e)
    }).catch(e => {
      t && l(e.message)
    }).finally(() => {
      t && s(!1)
    }), () => {
      t = !1
    }
  }, [e.id, m, f]);
  let x = e.configuration || {},
    S = i?.channel && typeof i.channel == `object` && !Array.isArray(i.channel) ? i.channel : null,
    w = typeof x.models == `string` ? [...new Set(x.models.split(`,`).map(e => e.trim()).filter(Boolean))] : [],
    E = S?.model_mapping;
  if (typeof E == `string`) try {
    E = JSON.parse(E)
  } catch {}
  let D = E && typeof E == `object` && !Array.isArray(E) ? Object.entries(E) : null;
  async function O(e) {
    try {
      await navigator.clipboard.writeText(typeof e == `string` ? e : JSON.stringify(e, null, 2)), n(T(`已复制`))
    } catch {
      n(T(`复制失败，请选择内容手动复制`), !0)
    }
  }
  return (0, z.jsxs)(`div`, {
    className: `intake-configuration`,
    children: [(0, z.jsx)(C, {
      items: [
        [T(`资源名称`), e.name],
        [T(`类型`), Be[e.channelType] || T(`类型 {0}`, [e.channelType])],
        [T(`API 地址`), typeof x.base_url == `string` && x.base_url ? x.base_url : T(`未提供`)]
      ]
    }), (0, z.jsxs)(`section`, {
      className: `intake-simple-section`,
      children: [(0, z.jsxs)(`div`, {
        className: `intake-config-heading`,
        children: [(0, z.jsx)(`h3`, {
          children: T(`支持模型`)
        }), (0, z.jsxs)(`span`, {
          className: `muted small`,
          children: [T(`共 `), w.length, T(` 个`)]
        })]
      }), w.length ? (0, z.jsx)(`ul`, {
        className: `intake-model-list`,
        "aria-label": T(`支持模型`),
        children: w.map((e, t) => (0, z.jsxs)(`li`, {
          children: [(0, z.jsx)(`span`, {
            children: t + 1
          }), (0, z.jsx)(`code`, {
            children: e
          })]
        }, e))
      }) : (0, z.jsx)(`p`, {
        className: `muted`,
        children: T(`未提供模型`)
      })]
    }), D && D.length > 0 && (0, z.jsxs)(`section`, {
      className: `intake-simple-section`,
      children: [(0, z.jsx)(`div`, {
        className: `intake-config-heading`,
        children: (0, z.jsx)(`h3`, {
          children: T(`模型映射`)
        })
      }), (0, z.jsx)(`dl`, {
        className: `intake-mapping-list`,
        children: D.map(([e, t]) => (0, z.jsxs)(`div`, {
          children: [(0, z.jsx)(`dt`, {
            children: e
          }), (0, z.jsx)(`dd`, {
            children: Ve(t)
          })]
        }, e))
      })]
    }), !D && typeof E == `string` && E.trim() !== `` && (0, z.jsxs)(`section`, {
      className: `intake-simple-section`,
      children: [(0, z.jsx)(`h3`, {
        children: T(`模型映射`)
      }), (0, z.jsx)(`pre`, {
        children: E
      })]
    }), (0, z.jsxs)(`section`, {
      className: `intake-simple-section`,
      children: [(0, z.jsxs)(`div`, {
        className: `intake-config-heading`,
        children: [(0, z.jsx)(`h3`, {
          children: T(`API 密钥`)
        }), m && (0, z.jsxs)(`div`, {
          className: `intake-key-actions`,
          children: [S && u && (0, z.jsx)(A, {
            onClick: () => void O(S.key),
            children: T(`复制`)
          }), (0, z.jsx)(A, {
            disabled: o || !S,
            onClick: () => d(e => !e),
            children: T(u ? `隐藏` : `查看`)
          })]
        })]
      }), S && u ? (0, z.jsx)(`pre`, {
        children: Ve(S.key)
      }) : (0, z.jsxs)(`p`, {
        className: `muted`,
        children: [T(`已保存 `), e.memberCount, T(` 个密钥 `), t(`resource.sensitive`) ? `` : T(`，当前账号无查看权限`)]
      })]
    }), h && g && (0, z.jsxs)(`details`, {
      className: `intake-record-details`,
      children: [(0, z.jsx)(`summary`, {
        children: T(`原始请求`)
      }), (0, z.jsx)(`div`, {
        className: `intake-simple-action intake-request-actions`,
        children: (0, z.jsx)(A, {
          onClick: () => void O(g),
          children: T(`复制`)
        })
      }), (0, z.jsx)(`pre`, {
        children: Ve(g)
      })]
    }), v && (0, z.jsxs)(y, {
      tone: `red`,
      children: [v, ` `, (0, z.jsx)(A, {
        onClick: () => p(e => e + 1),
        children: T(`重试`)
      })]
    }), c && (0, z.jsxs)(y, {
      tone: `red`,
      children: [c, ` `, (0, z.jsx)(A, {
        onClick: () => p(e => e + 1),
        children: T(`重试`)
      })]
    })]
  })
}
var Ue = {
    QUEUED: T(`排队中`),
    PREPARING: T(`校验中`),
    SUBMITTING: T(`提交中`),
    RUNNING: T(`更换中`),
    VERIFYING: T(`核对绑定中`),
    COMPLETED: T(`已完成`),
    PARTIAL_FAILED: T(`部分失败`),
    FAILED: T(`失败`),
    NEEDS_REVIEW: T(`待核对`),
    DONE: T(`绑定完成`),
    SKIPPED: T(`已是目标代理`),
    PENDING: T(`待校验`),
    READY: T(`待提交`),
    SUBMITTED: T(`处理中`)
  },
  We = new Set([`COMPLETED`, `PARTIAL_FAILED`, `FAILED`, `NEEDS_REVIEW`]);

function Ge(e) {
  return !e.readOnly && ((isNewApi(e) || isNativeCcmax(e)) && e.operationalState !== `GONE` || e.resourceType === `CCMAX` && e.state === `DELIVERED` && e.dispatchState === `SUCCESS` && !!e.laneId)
}

function B(e) {
  let t = e.trim();
  return t.length > 128 ? `` : !t.includes(`:`) || /^(?:[^\s:@/?#\[\]]+|\[[0-9a-fA-F:.]+(?:%[^\s:@/?#\[\]]+)?\]):\d{1,5}$/.test(t) ? t : ``
}
var Ke = {
  url: ``
};

function V({
  resourceId: e,
  value: t,
  canRecord: n,
  onChange: r
}) {
  let [i, a] = (0, R.useState)(``), [o, s] = (0, R.useState)(``), [c, l] = (0, R.useState)(1);
  (0, R.useEffect)(() => {
    if (i.trim() === o) return;
    let e = window.setTimeout(() => {
      s(i.trim()), l(1)
    }, 250);
    return () => window.clearTimeout(e)
  }, [i, o]);
  let [d, f] = (0, R.useState)(20), p = u(`/resource-proxy-replacements/proxy-options?resourceId=${encodeURIComponent(e)}&search=${encodeURIComponent(o)}&page=${c}&size=${d}`);
  return (0, z.jsxs)(`div`, {
    className: `replacement-picker`,
    children: [(0, z.jsx)(ye, {
      value: t.url,
      selected: t.proxy ? {
        ...t.proxy,
        enabled: !0
      } : null,
      options: (p.data?.items || []).map(e => ({
        ...e,
        enabled: !0
      })),
      loading: p.loading,
      loadingMore: !1,
      error: p.error,
      onRetry: p.reload,
      disabled: !1,
      canRecord: n,
      allowFull: !0,
      supportedProtocols: [`SOCKS5`, `HTTP`],
      description: T(n ? `支持 SOCKS5、HTTP 或 host:port:username:password，重复代理自动复用。` : `当前账号仅可选择已有代理。`),
      onInput: e => {
        r({
          url: e
        }), a(B(e))
      },
      onSelect: e => {
        let t = p.data?.items.find(t => t.id === e.id);
        t?.supported && r({
          proxy: t,
          url: ``
        }), a(``)
      }
    }), (B(t.url) !== `` || !t.url.trim()) && p.data && (p.data.total > d || c > 1) && (0, z.jsx)(m, {
      page: c,
      size: d,
      data: p.data,
      loading: p.loading,
      queryKey: `${e}:${o}`,
      onSizeChange: e => {
        f(e), l(1)
      },
      onPage: l
    })]
  })
}

function qe({
  resources: e,
  onClose: t,
  onCreated: n
}) {
  let {
    has: i
  } = r(), o = i(`proxy.read`) && i(`proxy.write`), [s, c] = (0, R.useState)(!1), [u, d] = (0, R.useState)(Ke), [f, p] = (0, R.useState)({}), [m, h] = (0, R.useState)(!1), g = (0, R.useRef)(!1), _ = (0, R.useRef)(crypto.randomUUID()), [v, b] = (0, R.useState)(``), [x, S] = (0, R.useState)(!1), C = e => !!e?.proxy?.supported || o && !!e?.url.trim(), w = s ? e.every(e => C(f[e.id])) : C(u);
  async function E() {
    if (g.current) return;
    if (!w) {
      b(T(`请为每条资源填写代理地址或选择已有代理`));
      return
    }
    let t = e.map(e => {
      let t = (s ? f[e.id] : u) || Ke;
      return {
        resourceId: e.id,
        resourceVersion: e.version,
        ...t.proxy ? {
          proxyId: t.proxy.id,
          proxyVersion: t.proxy.version
        } : {
          proxyUrl: t.url.trim()
        }
      }
    });
    g.current = !0, h(!0), b(``);
    try {
      n((await k(`/resource-proxy-replacements`, {
        requestKey: _.current,
        items: t
      })).id)
    } catch (e) {
      b(e instanceof Error ? e.message : T(`提交失败`)), S(!(e instanceof l && e.status >= 400 && e.status < 500))
    } finally {
      g.current = !1, h(!1)
    }
  }

  function D() {
    x || (_.current = crypto.randomUUID())
  }
  return (0, z.jsxs)(a, {
    title: e.length === 1 ? T(`更换代理`) : T(`批量替换代理`),
    subtitle: e.length === 1 ? e[0].name : T(`已选择 {0} 条 CCMAX 资源`, [e.length]),
    className: `proxy-replacement-dialog`,
    wide: !0,
    onClose: t,
    children: [(0, z.jsx)(y, {
      children: T(`更换将改变账号出口 IP，可能短暂中断服务。账号凭据保持。提交后可关闭页面，在“更换记录”查看进度。 `)
    }), x && (0, z.jsx)(y, {
      tone: `red`,
      children: T(`如提交响应中断，可保持选择后重试查询同一请求，或先查看更换记录；系统不会重复创建同一操作。 `)
    }), (0, z.jsxs)(`fieldset`, {
      disabled: m || x,
      className: `replacement-form`,
      children: [e.length > 1 && (0, z.jsxs)(`label`, {
        className: `check-row`,
        children: [(0, z.jsx)(`input`, {
          type: `checkbox`,
          checked: s,
          onChange: e => {
            c(e.target.checked), D()
          }
        }), T(`逐条填写或选择不同代理`)]
      }), !s && (0, z.jsx)(V, {
        resourceId: e[0].id,
        value: u,
        canRecord: o,
        onChange: e => {
          d(e), D()
        }
      }), e.length > 1 && (0, z.jsx)(`div`, {
        className: `replacement-selection-list`,
        children: e.map(e => (0, z.jsxs)(`div`, {
          className: `replacement-selection`,
          children: [(0, z.jsx)(`strong`, {
            children: e.name
          }), s ? (0, z.jsx)(V, {
            resourceId: e.id,
            value: f[e.id] || Ke,
            canRecord: o,
            onChange: t => {
              p({
                ...f,
                [e.id]: t
              }), D()
            }
          }) : (0, z.jsx)(`span`, {
            className: `muted`,
            children: u.proxy?.name || (u.url.trim() ? T(`使用已填写的代理地址`) : T(`待填写或选择代理`))
          })]
        }, e.id))
      })]
    }), v && (0, z.jsx)(y, {
      tone: `red`,
      children: v
    }), (0, z.jsxs)(`div`, {
      className: `dialog-footer`,
      children: [(0, z.jsx)(A, {
        onClick: t,
        children: T(`关闭`)
      }), (0, z.jsx)(A, {
        variant: `primary`,
        disabled: m || !w,
        onClick: () => void E(),
        children: T(m ? `提交中…` : x ? `核对同一请求` : `确认更换`)
      })]
    })]
  })
}

function Je({
  onClose: e,
  onOpen: t,
  resourceId: n
}) {
  let {
    user: i
  } = r(), [o, s] = (0, R.useState)(`mine`), [l, d] = (0, R.useState)(1), f = u(`/resource-proxy-replacements?scope=${o}&page=${l}&size=10${n?`&resourceId=${encodeURIComponent(n)}`:``}`, 5e3);
  return (0, z.jsxs)(a, {
    title: T(`更换记录`),
    subtitle: T(`关闭页面不会停止已提交的操作`),
    wide: !0,
    onClose: e,
    children: [i?.role !== `SUPPLIER_AGENT` && (0, z.jsx)(`div`, {
      className: `replacement-record-filter`,
      children: (0, z.jsxs)(`select`, {
        "aria-label": T(`操作记录范围`),
        value: o,
        onChange: e => {
          s(e.target.value), d(1)
        },
        children: [(0, z.jsx)(`option`, {
          value: `mine`,
          children: T(`我的操作`)
        }), (0, z.jsx)(`option`, {
          value: `all`,
          children: i?.supplierId ? T(`本供应商全部操作`) : T(`全部操作`)
        })]
      })
    }), (0, z.jsx)(g, {
      data: f.data?.items || [],
      loading: f.loading && !f.data,
      error: f.error,
      columns: [{
        label: T(`操作时间`),
        render: e => c(e.createdAt)
      }, {
        label: T(`操作人`),
        render: e => e.creatorName
      }, {
        label: T(`类型`),
        render: e => e.mode === `SINGLE` ? T(`单条更换`) : T(`批量替换`)
      }, {
        label: T(`进度`),
        render: e => `${e.finished}/${e.total}`
      }, {
        label: T(`状态`),
        render: e => Ue[e.state] || e.state
      }, {
        label: T(`操作`),
        render: e => (0, z.jsx)(A, {
          onClick: () => t(e.id),
          children: T(`查看进度`)
        })
      }]
    }), !!f.data && (0, z.jsx)(m, {
      page: l,
      size: 10,
      data: f.data,
      onSizeChange: () => {},
      onPage: d
    })]
  })
}

function Ye({
  id: e,
  onClose: t,
  onCompleted: n
}) {
  let [i, o] = (0, R.useState)(3e3), s = u(`/resource-proxy-replacements/${encodeURIComponent(e)}`, i), {
    notify: c,
    refresh: l
  } = r(), [d, f] = (0, R.useState)(!1), p = s.data, m = (0, R.useRef)(!1);
  (0, R.useEffect)(() => {
    p && We.has(p.state) && !m.current && (m.current = !0, o(0), n())
  }, [p, n]);
  async function h() {
    f(!0);
    try {
      await k(`/resource-proxy-replacements/${encodeURIComponent(e)}/reconcile`, {}), m.current = !1, o(3e3), l()
    } catch (e) {
      c(e instanceof Error ? e.message : T(`核对失败`))
    } finally {
      f(!1)
    }
  }
  return (0, z.jsxs)(a, {
    title: T(`代理更换进度`),
    subtitle: T(`进度自动更新；关闭后仍可从更换记录查看`),
    drawer: !0,
    wide: !0,
    onClose: t,
    children: [s.error && (0, z.jsx)(y, {
      tone: `red`,
      children: s.error
    }), !p && !s.error && (0, z.jsx)(`p`, {
      children: T(`加载进度中…`)
    }), p && (0, z.jsxs)(z.Fragment, {
      children: [(0, z.jsxs)(`div`, {
        className: `replacement-progress-heading`,
        children: [(0, z.jsx)(`strong`, {
          children: Ue[p.state] || p.state
        }), (0, z.jsxs)(`span`, {
          children: [p.finished, `/`, p.total, T(` 已结束 `)]
        })]
      }), (0, z.jsx)(`progress`, {
        className: `replacement-progress`,
        max: p.total || 1,
        value: p.finished,
        "aria-label": T(`代理更换进度`)
      }), (0, z.jsxs)(`div`, {
        className: `replacement-counts`,
        children: [(0, z.jsxs)(`span`, {
          children: [T(`绑定完成 `), p.DONE]
        }), (0, z.jsxs)(`span`, {
          children: [T(`已是目标 `), p.SKIPPED]
        }), (0, z.jsxs)(`span`, {
          children: [T(`失败 `), p.FAILED]
        }), (0, z.jsxs)(`span`, {
          children: [T(`待核对 `), p.NEEDS_REVIEW]
        })]
      }), p.error && (0, z.jsx)(y, {
        tone: `red`,
        children: D(p.error)
      }), (0, z.jsx)(y, {
        children: T(`绑定完成表示已核对代理绑定，服务可用性尚未验证。待核对项不会自动重复提交。 `)
      }), p.state === `NEEDS_REVIEW` && (0, z.jsx)(A, {
        disabled: d,
        onClick: () => void h(),
        children: T(d ? `请求中…` : `重新核对`)
      }), (0, z.jsx)(g, {
        data: p.items || [],
        columns: [{
          label: T(`资源`),
          render: e => e.resourceName
        }, {
          label: T(`目标代理`),
          render: e => e.proxyName
        }, {
          label: T(`结果`),
          render: e => Ue[e.state] || e.state
        }, {
          label: T(`说明`),
          render: e => (e.error ? D(e.error) : ``) || (e.bindingApplied ? T(`已核对绑定 · 服务待验证`) : `—`)
        }]
      })]
    })]
  })
}
var Xe = [{
  key: `fiveHour`,
  short: `5h`,
  label: T(`5 小时用量`)
}, {
  key: `sevenDay`,
  short: `7d`,
  label: T(`7 天用量`)
}, {
  key: `sevenDayFable`,
  short: `Fable 7d`,
  label: T(`7 天 Fable 用量`)
}];

function H(e) {
  return typeof e == `object` && e && !Array.isArray(e) ? e : null
}

function U(e) {
  return typeof e == `string` && e.trim() ? e : null
}

function W(e) {
  return typeof e == `number` && Number.isFinite(e) && e >= 0 ? e : null
}

function G(e) {
  let t = U(e);
  if (!t) return null;
  let n = Date.parse(t);
  return Number.isFinite(n) ? n : null
}

function K(e) {
  let t = G(e);
  return t === null ? T(`未提供`) : new Date(t).toLocaleString(O(), {
    timeZone: `Asia/Shanghai`,
    year: `numeric`,
    month: `2-digit`,
    day: `2-digit`,
    hour: `2-digit`,
    minute: `2-digit`,
    hour12: !1
  })
}

function Ze(e, t) {
  let n = e[`${t===`sevenDayFable`?`fable`:t}ObservedAt`];
  return G(n) === null ? e.probedAt : n
}

function Qe(e) {
  let t = H(e.plan);
  return t && (U(t.label) || U(t.tier)) || T(`套餐未提供`)
}

function $e(e) {
  return e === null ? T(`未提供`) : T(`已用 {0}%`, [e.toLocaleString(O(), {
    maximumFractionDigits: 6
  })])
}

function et(e) {
  return [`sevenDayFablePercent`, `sevenDayFableResetsAt`, `fableBlockedUntil`].some(t => e[t] !== null && e[t] !== void 0)
}

function tt({
  resource: e
}) {
  if (isNewApi(e)) return z.jsx(ChannelUsage, { resource: e });
  let t = e.resourceData,
    n = t && H(t.usage);
  return e.resourceType === `CCMAX` ? n ? (0, z.jsxs)(`div`, {
    className: `resource-data-summary`,
    children: [(0, z.jsxs)(`div`, {
      className: `resource-data-summary-header`,
      children: [(0, z.jsx)(`span`, {
        className: `resource-plan-pill`,
        children: Qe(n)
      }), (0, z.jsx)(`span`, {
        className: `resource-data-used-label`,
        children: T(`已用`)
      })]
    }), Xe.slice(0, 2).map(({
      key: e,
      short: t
    }) => {
      let r = W(n[`${e}Percent`]),
        i = K(n[`${e}ResetsAt`]);
      return (0, z.jsxs)(`div`, {
        className: `resource-mini-usage ${r===null?`resource-mini-missing`:r>=90?`high`:r>=75?`medium`:`normal`}`,
        role: `group`,
        "aria-label": `${t} ${$e(r)}`,
        title: T(`{0} {1} · 重置时间：{2}`, [t, $e(r), i]),
        children: [(0, z.jsx)(`span`, {
          className: `resource-mini-period`,
          "aria-hidden": `true`,
          children: t
        }), (0, z.jsx)(`span`, {
          className: `resource-mini-track`,
          "aria-hidden": `true`,
          children: r !== null && (0, z.jsx)(`span`, {
            style: {
              width: `${Math.min(r,100)}%`
            }
          })
        }), (0, z.jsx)(`span`, {
          className: `resource-mini-value`,
          "aria-hidden": `true`,
          children: r === null ? T(`未提供`) : `${r.toLocaleString(O(),{maximumFractionDigits:6})}%`
        }), (0, z.jsx)(`div`, {
          className: `resource-mini-times`,
          children: (0, z.jsxs)(`span`, {
            children: [T(`重置：`), i]
          })
        })]
      }, e)
    })]
  }) : (0, z.jsx)(`span`, {
    className: `resource-data-empty`,
    title: T(`暂无套餐与额度数据`),
    children: T(`暂无数据 `)
  }) : t ? T(`查看扩展信息`) : `—`
}
var nt = {
  usage: T(`额度数据`),
  health: T(`账号健康状态`),
  credentialFailureReason: T(`凭据状态提示`),
  healthQueriedAt: T(`健康状态同步时间`),
  queriedAt: T(`最近同步时间`),
  ageSeconds: T(`上游数据年龄（秒）`),
  source: T(`数据来源`),
  probedAt: T(`上游采集时间`),
  fiveHourPercent: T(`5 小时已用百分比`),
  fiveHourResetsAt: T(`5 小时重置时间`),
  fiveHourObservedAt: T(`5 小时采集时间`),
  sevenDayPercent: T(`7 天已用百分比`),
  sevenDayResetsAt: T(`7 天重置时间`),
  sevenDayObservedAt: T(`7 天采集时间`),
  sevenDayFablePercent: T(`7 天 Fable 已用百分比`),
  sevenDayFableResetsAt: T(`7 天 Fable 重置时间`),
  fableObservedAt: T(`Fable 采集时间`),
  fableBlockedUntil: T(`Fable 限制结束时间`),
  plan: T(`套餐信息`),
  tier: T(`套餐类型`),
  label: T(`套餐名称`),
  organizationType: T(`订阅类型`),
  rateLimitTier: T(`限流等级`),
  billingType: T(`计费类型`),
  extraUsageEnabled: T(`额外用量`),
  subscriptionCreatedAt: T(`订阅创建时间`),
  checkedAt: T(`套餐检查时间`)
};

function q({
  value: e,
  path: t = []
}) {
  let n = H(e);
  return n ? (0, z.jsx)(rt, {
    data: n,
    path: t
  }) : Array.isArray(e) ? e.length ? e.map((e, n) => (0, z.jsx)(`div`, {
    children: (0, z.jsx)(q, {
      value: e,
      path: t
    })
  }, n)) : T(`无数据`) : e === null ? T(`未提供`) : typeof e == `boolean` ? T(e ? `是` : `否`) : typeof e == `string` && t.join(`.`) === `health.credentialFailureReason` ? D(e) : String(e)
}

function rt({
  data: e,
  path: t = []
}) {
  return (0, z.jsx)(`dl`, {
    className: `resource-json-fields`,
    children: Object.entries(e).map(([e, n]) => (0, z.jsxs)(`div`, {
      children: [(0, z.jsx)(`dt`, {
        children: Object.hasOwn(nt, e) ? nt[e] : e
      }), (0, z.jsx)(`dd`, {
        children: G(n) !== null && /(?:At|Until)$/.test(e) ? K(n) : (0, z.jsx)(q, {
          value: n,
          path: [...t, e]
        })
      })]
    }, e))
  })
}

function it({
  resource: e
}) {
  let t = e.resourceData,
    n = t && H(t.usage);
  if (e.resourceType !== `CCMAX`) return t ? (0, z.jsxs)(`section`, {
    className: `subsection resource-section`,
    children: [(0, z.jsx)(`h3`, {
      children: T(`资源扩展信息`)
    }), (0, z.jsx)(rt, {
      data: t
    })]
  }) : null;
  let r = n && H(n.plan),
    i = n && Object.fromEntries(Object.entries(n).filter(([e]) => e !== `ageSeconds` && e !== `source`));
  i && r && (i.plan = Object.fromEntries(Object.entries(r).filter(([e]) => ![`rateLimitTier`, `billingType`, `extraUsageEnabled`].includes(e))));
  let a = t && i ? {
      ...t,
      usage: i
    } : t,
    o = et(n || {}) ? Xe : Xe.slice(0, 2);
  return (0, z.jsxs)(`section`, {
    className: `subsection resource-section`,
    "aria-label": T(`套餐与额度`),
    children: [(0, z.jsx)(`h3`, {
      children: T(`套餐与额度`)
    }), n ? (0, z.jsxs)(z.Fragment, {
      children: [(0, z.jsx)(C, {
        items: [
          [T(`套餐类型`), Qe(n)],
          [T(`订阅创建时间`), K(r?.subscriptionCreatedAt)],
          [T(`套餐检查时间`), K(r?.checkedAt)]
        ]
      }), (0, z.jsx)(`div`, {
        className: `resource-quota-grid`,
        children: o.map(({
          key: e,
          label: t
        }) => {
          let r = W(n[`${e}Percent`]),
            i = Ze(n, e);
          return (0, z.jsxs)(`section`, {
            className: `resource-quota-card`,
            "aria-label": t,
            children: [(0, z.jsx)(`h4`, {
              children: t
            }), (0, z.jsx)(`strong`, {
              children: $e(r)
            }), r !== null && (0, z.jsx)(`meter`, {
              "aria-label": t,
              min: 0,
              max: 100,
              low: 75,
              high: 90,
              optimum: 0,
              value: Math.min(r, 100)
            }), (0, z.jsxs)(`span`, {
              children: [T(`重置时间：`), K(n[`${e}ResetsAt`])]
            }), (0, z.jsxs)(`span`, {
              children: [T(`采集时间：`), K(i)]
            }), G(i) === null && (0, z.jsx)(`span`, {
              className: `resource-data-stale`,
              children: T(`采集时间未知`)
            })]
          }, e)
        })
      }), (0, z.jsx)(C, {
        items: [
          [T(`最近同步时间`), K(t?.queriedAt)], ...U(n.fableBlockedUntil) ? [
            [T(`Fable 限制结束时间`), K(n.fableBlockedUntil)]
          ] : []
        ]
      })]
    }) : (0, z.jsx)(`p`, {
      className: `resource-data-empty`,
      children: T(`暂无套餐与额度数据`)
    }), a && (0, z.jsxs)(`details`, {
      className: `resource-json-more`,
      children: [(0, z.jsx)(`summary`, {
        children: T(`更多数据`)
      }), (0, z.jsx)(rt, {
        data: a
      })]
    })]
  })
}

function at({
  result: e,
  pageSize: t,
  supplierSide: n,
  pendingOnly: r,
  resourceType: a,
  ccmaxVisible: o,
  mayReplace: s,
  projectNames: c,
  replacementSelected: l,
  setReplacementSelected: u,
  renderResourceActions: d,
  onSelect: f
}) {
  return ee() ? (0, z.jsx)(st, {
    result: e,
    pageSize: t,
    supplierSide: n,
    pendingOnly: r,
    resourceType: a,
    ccmaxVisible: o,
    mayReplace: s,
    projectNames: c,
    replacementSelected: l,
    setReplacementSelected: u,
    renderResourceActions: d,
    onSelect: f
  }) : (0, z.jsx)(`div`, {
    className: `resource-list-table`,
    children: (0, z.jsx)(g, {
      data: e.loading ? [] : e.data?.items || [],
      loading: e.loading,
      refreshing: e.refreshing,
      loadingRows: t,
      error: e.error,
      onRetry: e.reload,
      onRow: f,
      columns: (n || r) && a === `NEWAPI_INTAKE` ? [{
        label: T(`资源名称`),
        render: e => (0, z.jsxs)(z.Fragment, {
          children: [(0, z.jsx)(`strong`, {
            children: e.name
          }), I(e) && e.baseUrl && (0, z.jsx)(`span`, {
            className: `intake-endpoint`,
            children: e.baseUrl
          })]
        })
      }, {
        label: T(`资源类型`),
        render: e => I(e) ? e.projectCategoryName || e.projectCategory || T(`未分配`) : e.resourceType || T(`未知类型`)
      }, {
        label: T(`提供商`),
        render: e => I(e) ? Be[e.channelType || 0] || T(`类型 {0}`, [e.channelType]) : `CCMAX`
      }, {
        label: T(`密钥数量`),
        render: e => I(e) ? e.memberCount : `—`
      }, {
        label: T(`模型`),
        render: e => I(e) ? (0, z.jsx)(`span`, {
          className: `intake-model-summary`,
          title: e.modelSummary.join(T(`、`)),
          children: e.modelSummary.length ? e.modelSummary.slice(0, 2).join(T(`、`)) + (e.modelSummary.length > 2 ? T(` 等`) : ``) : `—`
        }) : `—`
      }, {
        label: T(`报价项目`),
        render: e => I(e) ? (0, z.jsxs)(`div`, {
          className: `intake-project-cell`,
          children: [e.projectName && (0, z.jsx)(`span`, {
            children: e.projectName
          }), (0, z.jsx)(E, {
            state: e.assignmentState === `ASSIGNED` ? `APPROVED` : `PENDING`,
            label: e.assignmentState === `ASSIGNED` ? T(`已分配`) : T(`待分配项目`)
          })]
        }) : e.projectName || c.get(e.projectId || ``) || `—`
      }, ...n ? [] : [{
        label: T(`供应商`),
        render: e => e.supplierName || `—`
      }], {
        label: T(`录入人`),
        render: e => e.creatorName || `—`
      }, {
        label: T(`录入时间`),
        render: e => Se(I(e) ? e.receivedAt : e.createdAt)
      }, {
        label: T(`操作`),
        className: `resource-actions-column`,
        render: d
      }] : [...o && s ? [{
        label: (0, z.jsx)(`input`, {
          type: `checkbox`,
          "aria-label": T(`选择本页可操作资源`),
          checked: !!e.data?.items.some(e => !I(e) && Ge(e)) && (e.data?.items || []).filter(e => !I(e) && Ge(e)).every(e => l.has(e.id)),
          onChange: t => {
            let n = new Map(l);
            for (let r of e.data?.items || []) !I(r) && Ge(r) && (t.target.checked && n.size < 100 ? n.set(r.id, r) : t.target.checked || n.delete(r.id));
            u(n)
          }
        }),
        render: e => !I(e) && Ge(e) ? (0, z.jsx)(`input`, {
          type: `checkbox`,
          "aria-label": T(`选择{0}`, [e.name]),
          checked: l.has(e.id),
          disabled: !l.has(e.id) && l.size >= 100,
          onClick: e => e.stopPropagation(),
          onChange: t => {
            let n = new Map(l);
            t.target.checked ? n.set(e.id, e) : n.delete(e.id), u(n)
          }
        }) : null
      }] : [], {
        label: T(`资源信息`),
        className: `resource-identity-column`,
        render: e => (0, z.jsxs)(`div`, {
          className: `resource-identity`,
          children: [(0, z.jsx)(`strong`, {
            children: e.name
          }), (0, z.jsxs)(`div`, {
            className: `resource-identity-meta`,
            children: [(0, z.jsx)(`span`, {
              className: `resource-type-label`,
              children: isNewApi(e) ? `New API 渠道` : I(e) ? e.projectCategoryName || e.projectCategory || T(`未分配`) : e.resourceType || T(`未知类型`)
            }), n && !I(e) && (0, z.jsx)(`span`, {
              children: e.accountName || T(`待填写`)
            }), n && !I(e) && (0, z.jsx)(`span`, {
              children: i[e.credentialMode] || `—`
            })]
          }), I(e) && e.baseUrl && (0, z.jsx)(`span`, {
            className: `intake-endpoint`,
            children: e.baseUrl
          })]
        })
      }, {
        label: T(`项目 / 创建人`),
        className: `resource-project-column`,
        render: e => (0, z.jsxs)(`div`, {
          className: `resource-project-context`,
          children: [(0, z.jsx)(`span`, {
            children: e.projectName || c.get(e.projectId || ``) || `—`
          }), (0, z.jsx)(`small`, {
            children: T(`创建人：{0}`, [e.creatorName || T(`未知创建人`)])
          }), I(e) && (0, z.jsx)(E, {
            state: e.assignmentState === `ASSIGNED` ? `APPROVED` : `PENDING`,
            label: e.assignmentState === `ASSIGNED` ? T(`已分配`) : T(`待分配项目`)
          })]
        })
      }, ...n ? [] : [{
        label: T(`供应商`),
        className: `resource-supplier-column`,
        render: e => (0, z.jsxs)(`div`, {
          className: `stack`,
          children: [(0, z.jsx)(`span`, {
            children: e.supplierName || `—`
          }), !I(e) && e.supplierCode && (0, z.jsx)(`small`, {
            children: e.supplierCode
          })]
        })
      }], {
        label: T(`交付 / 资源状态`),
        className: `resource-status-column`,
        render: e => (0, z.jsxs)(`div`, {
          className: `resource-status-stack`,
          children: [(0, z.jsxs)(`div`, {
            children: [(0, z.jsx)(`small`, {
              children: T(`交付`)
            }), ct(e)]
          }), (0, z.jsxs)(`div`, {
            children: [(0, z.jsx)(`small`, {
              children: T(`资源`)
            }), lt(e)]
          })]
        })
      }, {
        label: T(`额度 / 使用情况`),
        className: `resource-data-column`,
        render: e => I(e) ? (0, z.jsx)(`span`, {
          className: `intake-model-summary`,
          title: e.modelSummary.join(T(`、`)),
          children: e.modelSummary.length ? e.modelSummary.slice(0, 2).join(T(`、`)) + (e.modelSummary.length > 2 ? T(` 等`) : ``) : T(`未提供模型`)
        }) : (0, z.jsx)(tt, {
          resource: e
        })
      }, {
        label: T(`提交时间`),
        render: e => I(e) ? Se(e.receivedAt) : Se(e.submittedAt, _e(e) ? T(`待确认`) : T(`未提交`))
      }, {
        label: T(n ? `金额` : `消费金额`),
        className: `resource-money-column`,
        render: e => ot(e, n)
      }, {
        label: T(`操作`),
        className: `resource-actions-column`,
        render: d
      }]
    })
  })
}

function ot(e, t) {
  if (isNewApi(e)) return `—（配额原值）`;
  if (isNativeCcmax(e)) return e.usage?.amount == null ? `未查询` : z.jsx(ce, { value: e.usage.amount, currency: e.usage.currency || `USD` });
  return I(e) ? `—` : t && e.settlementMethod === `ACCOUNT_BUYOUT` ? e.buyoutAmount == null ? T(`未交付`) : (0, z.jsx)(ce, {
    value: e.buyoutAmount,
    currency: e.buyoutCurrency || ``
  }) : !t && e.state === `DRAFT` ? T(`未交付`) : e.usage?.amount == null ? T(`未查询`) : (0, z.jsx)(ce, {
    value: e.usage.amount,
    currency: e.usage.currency || (t ? `USD` : ``)
  })
}

function st({
  result: e,
  pageSize: t,
  supplierSide: n,
  ccmaxVisible: r,
  mayReplace: i,
  projectNames: a,
  replacementSelected: o,
  setReplacementSelected: s,
  renderResourceActions: c,
  onSelect: l
}) {
  let u = e.data?.items || [],
    d = u.filter(e => !I(e) && Ge(e));
  return (0, z.jsxs)(`div`, {
    className: `resource-mobile-list`,
    "aria-busy": e.loading || e.refreshing,
    children: [e.error && (0, z.jsxs)(y, {
      tone: `red`,
      children: [e.error, (0, z.jsx)(A, {
        onClick: e.reload,
        children: T(`重新加载`)
      })]
    }), e.refreshing && (0, z.jsx)(`p`, {
      role: `status`,
      children: T(`刷新中…`)
    }), r && i && u.length > 0 && !e.loading && (0, z.jsxs)(`label`, {
      className: `resource-mobile-select-all`,
      children: [(0, z.jsx)(`input`, {
        type: `checkbox`,
        checked: d.length > 0 && d.every(e => o.has(e.id)),
        disabled: !d.length,
        onChange: e => {
          let t = new Map(o);
          for (let n of d) e.target.checked && t.size < 100 ? t.set(n.id, n) : e.target.checked || t.delete(n.id);
          s(t)
        }
      }), T(`选择本页可操作资源`)]
    }), e.loading ? (0, z.jsxs)(`div`, {
      role: `status`,
      children: [(0, z.jsx)(`span`, {
        className: `sr-only`,
        children: T(`正在加载`)
      }), Array.from({
        length: Math.min(t, 5)
      }, (e, t) => (0, z.jsxs)(`div`, {
        className: `resource-card resource-card-skeleton`,
        "aria-hidden": `true`,
        children: [(0, z.jsx)(`span`, {}), (0, z.jsx)(`span`, {}), (0, z.jsx)(`span`, {})]
      }, t))]
    }) : u.length ? u.map(e => (0, z.jsxs)(`article`, {
      className: `resource-card`,
      children: [(0, z.jsxs)(`div`, {
        className: `resource-card-heading`,
        children: [r && i && !I(e) && Ge(e) && (0, z.jsx)(`label`, {
          className: `resource-card-select`,
          children: (0, z.jsx)(`input`, {
            type: `checkbox`,
            "aria-label": T(`选择{0}`, [e.name]),
            checked: o.has(e.id),
            disabled: !o.has(e.id) && o.size >= 100,
            onChange: t => {
              let n = new Map(o);
              t.target.checked ? n.set(e.id, e) : n.delete(e.id), s(n)
            }
          })
        }), (0, z.jsxs)(`button`, {
          className: `resource-card-title`,
          type: `button`,
          onClick: () => l(e),
          children: [(0, z.jsx)(`strong`, {
            children: e.name
          }), (0, z.jsx)(f, {
            name: `chevron`,
            size: 18
          })]
        })]
      }), !I(e) && e.accountName && (0, z.jsx)(`p`, {
        className: `resource-card-account`,
        children: e.accountName
      }), (0, z.jsxs)(`dl`, {
        className: `resource-card-context`,
        children: [(0, z.jsxs)(`div`, {
          children: [(0, z.jsx)(`dt`, {
            children: T(`项目`)
          }), (0, z.jsx)(`dd`, {
            children: e.projectName || a.get(e.projectId || ``) || `—`
          })]
        }), !n && (0, z.jsxs)(`div`, {
          children: [(0, z.jsx)(`dt`, {
            children: T(`供应商`)
          }), (0, z.jsx)(`dd`, {
            children: e.supplierName || `—`
          })]
        }), (0, z.jsxs)(`div`, {
          children: [(0, z.jsx)(`dt`, {
            children: T(`创建人`)
          }), (0, z.jsx)(`dd`, {
            children: e.creatorName || T(`未知创建人`)
          })]
        })]
      }), (0, z.jsxs)(`div`, {
        className: `resource-card-status`,
        children: [(0, z.jsxs)(`div`, {
          children: [(0, z.jsx)(`span`, {
            children: T(`交付`)
          }), ct(e)]
        }), (0, z.jsxs)(`div`, {
          children: [(0, z.jsx)(`span`, {
            children: T(`资源`)
          }), lt(e)]
        })]
      }), I(e) ? (0, z.jsxs)(`dl`, {
        className: `resource-card-context`,
        children: [(0, z.jsxs)(`div`, {
          children: [(0, z.jsx)(`dt`, {
            children: T(`资源类型`)
          }), (0, z.jsx)(`dd`, {
            children: e.projectCategoryName || e.projectCategory || T(`未分配`)
          })]
        }), (0, z.jsxs)(`div`, {
          children: [(0, z.jsx)(`dt`, {
            children: T(`密钥数量`)
          }), (0, z.jsx)(`dd`, {
            children: e.memberCount
          })]
        }), (0, z.jsxs)(`div`, {
          children: [(0, z.jsx)(`dt`, {
            children: T(`模型`)
          }), (0, z.jsx)(`dd`, {
            children: e.modelSummary.join(T(`、`)) || T(`未提供模型`)
          })]
        })]
      }) : (0, z.jsxs)(`div`, {
        className: `resource-card-usage`,
        children: [(0, z.jsx)(tt, {
          resource: e
        }), (0, z.jsxs)(`div`, {
          className: `resource-card-amount`,
          children: [(0, z.jsx)(`span`, {
            children: T(n ? `金额` : `消费金额`)
          }), (0, z.jsx)(`strong`, {
            children: ot(e, n)
          })]
        })]
      }), (0, z.jsxs)(`p`, {
        className: `resource-card-time`,
        children: [T(`提交时间`), T(`：`), I(e) ? Se(e.receivedAt) : Se(e.submittedAt, _e(e) ? T(`待确认`) : T(`未提交`))]
      }), (0, z.jsx)(`div`, {
        className: `resource-card-actions`,
        children: c(e)
      })]
    }, e.id)) : e.error ? null : (0, z.jsx)(_, {})]
  })
}

function ct(e) {
  if (isNativeCcmax(e) && e.dispatchState !== `SUCCESS`) return z.jsx(E, { state: `SUCCESS`, label: `已有账号已关联` });
  if (isNewApi(e)) return z.jsx(E, { state: `SUCCESS`, label: `已有渠道已关联` });
  return I(e) ? (0, z.jsx)(E, {
    state: Te(e.deliveryState),
    label: Oe[e.deliveryState] || T(`待推送`)
  }) : (0, z.jsx)(`span`, {
    title: e.dispatchState === `UNKNOWN` && e.creationFinished ? void 0 : D(e.creationFailureHint || e.dispatchFailureReason || ``) || void 0,
    children: (0, z.jsx)(we, {
      state: N(e),
      label: de(e),
      progress: e
    })
  })
}

function lt(e) {
  if (isNativeCcmax(e)) return z.jsx(E, { state: e.operationalState === `ACTIVE` ? `SUCCESS` : `COOLING`, label: ({ ACTIVE: `已启用`, PAUSED: `已停用`, GONE: `已归档`, ERROR: `异常` })[e.operationalState] || `待查询` });
  if (isNewApi(e)) return z.jsx(E, { state: e.operationalState === `ACTIVE` ? `SUCCESS` : `COOLING`, label: channelLabel(e) });
  if (I(e)) return (0, z.jsx)(E, {
    state: Te(e.onboardingState),
    label: he[e.onboardingState] || T(`待上号`)
  });
  let t = Ee(e),
    n = le(e);
  return (0, z.jsxs)(`span`, {
    className: `resource-health-state${n?` has-reason`:``}`,
    children: [(0, z.jsx)(E, {
      state: F(e) && ![`DRAINING`, `GONE`].includes(e.laneState || ``) ? `COOLING` : t.state,
      label: F(e) && ![`DRAINING`, `GONE`].includes(e.laneState || ``) ? T(`已暂停`) : t.label
    }), n && (0, z.jsx)(`span`, {
      className: `resource-health-reason`,
      style: P(e) ? void 0 : {
        color: `#a87823`
      },
      children: n
    })]
  })
}

function ut({
  resource: t,
  onClose: n,
  onChanged: r,
  onReauthorize: i
}) {
  let [o, s] = (0, R.useState)(null), [c, u] = (0, R.useState)(!1), [d, f] = (0, R.useState)(!1), [p, m] = (0, R.useState)(``), h = (0, R.useRef)(!1), g = (0, R.useRef)(crypto.randomUUID()), _ = `/resources/${encodeURIComponent(t.id)}/credential-refresh`;
  (0, R.useEffect)(() => {
    let t = !0;
    return e(_).then(e => {
      t && (s(e), u(e.reauthorizationAllowed === !0))
    }).catch(e => {
      t && m(e.message)
    }), () => {
      t = !1
    }
  }, [_]);
  async function v() {
    if (!h.current) {
      h.current = !0, f(!0), m(``);
      try {
        let t = await e(_);
        s(t), u(t.reauthorizationAllowed === !0), [`complete`, `FAILED`].includes(t.status) && (g.current = crypto.randomUUID())
      } catch (e) {
        m(e.message)
      } finally {
        f(!1), h.current = !1
      }
    }
  }
  async function x(e) {
    if (!h.current) {
      h.current = !0, f(!0), m(``);
      try {
        let n = await k(_, {
          requestId: e ? o.id : g.current,
          version: t.version
        });
        s(n), (n.status === `complete` || n.status === `FAILED`) && (g.current = crypto.randomUUID(), r())
      } catch (e) {
        m(e.message), e instanceof l && e.status === 403 ? u(!1) : s({
          id: g.current,
          status: `UNKNOWN`
        })
      } finally {
        f(!1), h.current = !1
      }
    }
  }
  let S = o?.status;
  return (0, z.jsxs)(a, {
    title: T(`强制刷新授权`),
    wide: !0,
    onClose: () => {
      d || n()
    },
    children: [(0, z.jsx)(C, {
      items: [
        [T(`资源`), t.name],
        [`Lane ID`, t.laneId]
      ]
    }), (0, z.jsx)(`p`, {
      className: `muted`,
      children: T(`使用 CCMAX 已保存的 Refresh Token 立即刷新，无需重新登录。原账号、代理和历史账单保留。 `)
    }), !o && !p && (0, z.jsx)(b, {}), o && !c && (0, z.jsx)(y, {
      tone: `red`,
      children: T(`当前供应商未开通 CCMAX 重新授权，请联系平台管理员。`)
    }), p && (0, z.jsx)(y, {
      tone: `red`,
      children: p
    }), S === `saved` && (0, z.jsx)(y, {
      children: T(`新凭据已保存，等待运行实例同步。请继续同步，不要重新发起刷新。`)
    }), S === `SUBMITTING` && (0, z.jsx)(y, {
      children: T(`正在刷新授权，请稍后查询原操作结果。`)
    }), S === `UNKNOWN` && (0, z.jsx)(y, {
      tone: `red`,
      children: T(`刷新结果待确认。请先查询原操作，不要重复刷新；仍无法确认时可通过 OAuth 重新授权。 `)
    }), S === `FAILED` && (0, z.jsx)(y, {
      tone: `red`,
      children: T(`刷新未恢复账号授权，可能没有可用 RT 或账号仍受限制。请使用重新授权，并检查账号状态。 `)
    }), S === `complete` && (0, z.jsx)(y, {
      tone: `green`,
      children: T(`授权刷新及凭据同步完成。账号是否接单仍取决于暂停、额度和限流状态。 `)
    }), o?.paused && (0, z.jsx)(y, {
      children: T(`账号仍处于暂停状态，刷新授权不会解除暂停。`)
    }), S === `NONE` && (0, z.jsx)(`p`, {
      children: T(`刷新授权不会解除暂停、休眠、限流或额度限制。RT 失效或未保存时，请改用「重新授权」。`)
    }), (0, z.jsxs)(`div`, {
      className: `dialog-footer`,
      children: [(0, z.jsx)(A, {
        disabled: d,
        onClick: n,
        children: T(`关闭 `)
      }), (!o || [`SUBMITTING`, `UNKNOWN`].includes(S || ``)) && (0, z.jsx)(A, {
        disabled: d,
        onClick: () => void v(),
        children: T(`查询操作结果 `)
      }), [`FAILED`, `UNKNOWN`].includes(S || ``) && (0, z.jsx)(A, {
        disabled: d || !c,
        onClick: i,
        children: T(`OAuth 重新授权 `)
      }), S === `saved` && (0, z.jsx)(A, {
        variant: `primary`,
        disabled: d || !c,
        onClick: () => void x(!0),
        children: T(d ? `同步中…` : `继续同步`)
      }), o && [`NONE`, `FAILED`, `complete`].includes(S || ``) && (0, z.jsx)(A, {
        variant: `primary`,
        disabled: d || !c,
        onClick: () => void x(!1),
        children: T(d ? `刷新中…` : `确认刷新授权`)
      })]
    })]
  })
}

function dt({
  value: e,
  onChange: t
}) {
  let n = u(`/projects/category-codes`);
  return (0, z.jsx)(j, {
    ariaLabel: T(`资源类型`),
    value: e,
    onChange: t,
    options: [{
      value: ``,
      label: T(`全部资源类型`)
    }, {
      value: `CCMAX`,
      label: `CCMAX`
    }, {
      value: `NEWAPI_CHANNEL`,
      label: `New API 渠道`
    }, ...(n.data || []).filter(e => e.code !== `CCMAX`).map(e => ({
      value: e.code,
      label: e.name
    }))]
  })
}

function ft({
  resource: e,
  onClose: t,
  onAssign: n
}) {
  let r = u(`/resource-intakes/${encodeURIComponent(e.id)}`),
    i = r.data;
  return (0, z.jsxs)(a, {
    title: T(`接收资源详情`),
    wide: !0,
    className: `intake-resource-detail`,
    onClose: t,
    children: [r.loading && (0, z.jsx)(b, {}), i && (0, z.jsx)(He, {
      item: i
    }), r.error && (0, z.jsx)(y, {
      tone: `red`,
      children: r.error
    }), (0, z.jsxs)(`details`, {
      className: `intake-record-details`,
      children: [(0, z.jsx)(`summary`, {
        children: T(`接收记录`)
      }), (0, z.jsx)(C, {
        items: [
          [T(`资源名称`), e.name],
          [T(`资源类型`), e.projectCategoryName || e.projectCategory || T(`未分配`)],
          [T(`报价项目`), i?.projectName || e.projectName || T(`尚未分配`)],
          [T(`项目分配`), (i?.state || e.assignmentState) === `ASSIGNED` ? T(`已分配`) : T(`待分配项目`)],
          [T(`录入方式`), e.sourceKind === `API` ? `API` : T(`网页`)],
          [T(`录入人`), e.creatorName],
          [T(`录入时间`), c(e.receivedAt)], ...i?.assignedAt ? [
            [T(`分配时间`), c(i.assignedAt)]
          ] : [], ...i?.quoteBasis ? [
            [T(`报价币种`), String(i.quoteBasis.currency || `—`)],
            [T(`价格 / 折扣`), v(i.quoteBasis)]
          ] : []
        ]
      })]
    }), n && !r.loading && !r.error && i?.state === `UNASSIGNED` && (0, z.jsx)(`div`, {
      className: `dialog-footer`,
      children: (0, z.jsx)(A, {
        variant: `primary`,
        onClick: n,
        children: T(`分配项目 `)
      })
    })]
  })
}

function pt({
  resource: e,
  onClose: t,
  onAssigned: n
}) {
  let r = u(`/resource-intakes/${encodeURIComponent(e.id)}/eligible-projects`),
    [i, o] = (0, R.useState)(``),
    [s, c] = (0, R.useState)(``),
    [l, d] = (0, R.useState)(!1),
    f = (0, R.useRef)(!1),
    [p] = (0, R.useState)(() => crypto.randomUUID()),
    m = r.data?.find(e => e.id === i);
  async function h(t) {
    if (t.preventDefault(), !(!m || f.current || r.error)) {
      f.current = !0, d(!0), c(``);
      try {
        await k(`/resource-intakes/${encodeURIComponent(e.id)}/assign-project`, {
          projectId: m.id,
          version: e.version,
          requestKey: p,
          quoteToken: m.quoteToken
        }), n()
      } catch (e) {
        c(e instanceof Error && e.message ? e.message : T(`分配失败，请稍后重试`))
      } finally {
        f.current = !1, d(!1)
      }
    }
  }
  return (0, z.jsx)(a, {
    title: T(`分配项目`),
    className: `intake-assignment-dialog`,
    onClose: () => {
      l || t()
    },
    children: (0, z.jsxs)(`form`, {
      className: `intake-assignment-form`,
      onSubmit: h,
      children: [(0, z.jsxs)(`div`, {
        className: `intake-assignment-resource`,
        children: [(0, z.jsx)(`span`, {
          children: T(`当前资源`)
        }), (0, z.jsx)(`strong`, {
          children: e.name
        }), (0, z.jsxs)(`p`, {
          className: `intake-assignment-resource-meta`,
          children: [`NewAPI · `, T(`{0} 个密钥`, [e.memberCount])]
        }), e.modelSummary.length > 0 && (0, z.jsxs)(`p`, {
          className: `intake-assignment-models`,
          title: e.modelSummary.join(T(`、`)),
          children: [e.modelSummary.slice(0, 3).join(T(`、`)), e.modelSummary.length > 3 ? T(` 等 {0} 个模型`, [e.modelSummary.length]) : ``]
        })]
      }), (s || r.error) && (0, z.jsx)(y, {
        tone: `red`,
        children: s || r.error
      }), r.loading ? (0, z.jsx)(`p`, {
        className: `intake-assignment-message`,
        role: `status`,
        children: T(`正在查询有效报价… `)
      }) : !r.error && !r.data?.length ? (0, z.jsxs)(`div`, {
        className: `intake-assignment-message`,
        children: [(0, z.jsx)(`strong`, {
          children: T(`暂无可分配项目`)
        }), (0, z.jsx)(`p`, {
          children: T(`请联系平台核对项目适用类型与有效报价。`)
        })]
      }) : r.error ? null : (0, z.jsxs)(z.Fragment, {
        children: [(0, z.jsxs)(`div`, {
          className: `field intake-assignment-project`,
          children: [(0, z.jsx)(`span`, {
            children: T(`报价项目`)
          }), (0, z.jsx)(j, {
            required: !0,
            disabled: l,
            value: i,
            onChange: e => {
              o(e), c(``)
            },
            ariaLabel: T(`报价项目`),
            searchPlaceholder: T(`搜索项目名称`),
            options: [{
              value: ``,
              label: T(`请选择报价项目`)
            }, ...(r.data || []).map(e => ({
              value: e.id,
              label: e.name
            }))]
          })]
        }), (0, z.jsxs)(`section`, {
          className: `intake-assignment-quote`,
          "aria-label": T(`报价依据`),
          "aria-live": `polite`,
          children: [(0, z.jsx)(`h3`, {
            children: T(`报价依据`)
          }), m ? (0, z.jsxs)(`dl`, {
            children: [(0, z.jsxs)(`div`, {
              children: [(0, z.jsx)(`dt`, {
                children: m.quoteBasis.unitPrice == null ? T(`折扣`) : T(`单价`)
              }), (0, z.jsx)(`dd`, {
                children: v(m.quoteBasis)
              })]
            }), (0, z.jsxs)(`div`, {
              children: [(0, z.jsx)(`dt`, {
                children: T(`币种`)
              }), (0, z.jsx)(`dd`, {
                children: String(m.quoteBasis.currency || `—`)
              })]
            }), (0, z.jsxs)(`div`, {
              children: [(0, z.jsx)(`dt`, {
                children: T(`有效期`)
              }), (0, z.jsxs)(`dd`, {
                children: [String(m.quoteBasis.effectiveFrom), T(` 至`), ` `, String(m.quoteBasis.effectiveTo)]
              })]
            })]
          }) : (0, z.jsx)(`p`, {
            children: T(`选择项目后查看报价`)
          })]
        })]
      }), (0, z.jsxs)(`div`, {
        className: `dialog-footer intake-assignment-footer`,
        children: [(0, z.jsx)(`span`, {
          className: `intake-assignment-hint`,
          children: T(`仅可分配一次，保存后不可更改`)
        }), (0, z.jsx)(A, {
          type: `button`,
          disabled: l,
          onClick: t,
          children: T(`取消 `)
        }), (0, z.jsx)(A, {
          type: `submit`,
          variant: `primary`,
          disabled: !m || l || r.loading || !!r.error,
          children: T(l ? `正在保存…` : `确认分配`)
        })]
      })]
    })
  })
}
var mt = {
    NONE: T(`尚未开始`),
    INITIALIZING: T(`正在生成授权链接`),
    READY: T(`等待提交新凭据`),
    SUBMITTING: T(`正在提交，等待确认`),
    UNKNOWN: T(`结果待查询`),
    NOT_FOUND: T(`尚未查到操作`),
    FAILED: T(`授权链接生成失败`),
    CANCELLED: T(`已重新发起授权`),
    pending: T(`等待处理`),
    exchanging: T(`凭据交换结果待核对`),
    staged: T(`凭据已暂存，等待保存`),
    saved: T(`凭据已保存，等待同步`),
    installed: T(`主实例已同步，等待其他实例`),
    complete: T(`授权同步完成`),
    superseded: T(`已被后续凭据更新替代`)
  },
  ht = new Set([`SUBMITTING`, `pending`, `staged`, `saved`, `installed`]);

function gt(e, t, n) {
  let r = le(e),
    i = P(e) || !!r && !L(r) || ![`READY`, `COOLING`].includes(e.laneState || ``);
  return !e.readOnly && e.resourceType === `CCMAX` && e.state === `DELIVERED` && e.dispatchState === `SUCCESS` && !!e.laneId && i && n(`resource.read`) && n(t ? `resource.write` : `resource.dispatch`)
}

function _t({
  resource: e,
  supplierSide: t,
  onOpen: n
}) {
  let {
    has: i
  } = r();
  return gt(e, t, i) ? (0, z.jsx)(A, {
    onClick: t => {
      t.stopPropagation(), n(e)
    },
    children: T(`重新授权 `)
  }) : null
}

function vt({
  resource: t,
  onClose: n,
  onChanged: r
}) {
  let [i, o] = (0, R.useState)(null), [s, u] = (0, R.useState)(!1), [d, f] = (0, R.useState)(`OAUTH`), [p, m] = (0, R.useState)(``), [h, g] = (0, R.useState)(``), [_, v] = (0, R.useState)(``), [x, w] = (0, R.useState)(``), [E, O] = (0, R.useState)(``), [ee, te] = (0, R.useState)(!0), [j, ne] = (0, R.useState)(!1), re = (0, R.useRef)(!1), M = (0, R.useRef)(!0), ie = (0, R.useRef)(!1), ae = `/resources/${encodeURIComponent(t.id)}/reauthorizations`;

  function oe(e) {
    M.current && (o(e), e.reauthorizationAllowed !== void 0 && u(e.reauthorizationAllowed), e.mode && f(e.mode), e.status === `complete` && !ie.current && (ie.current = !0, r()), e.credentialSaved && (m(``), g(``), v(``), w(``)), e.queryFailed && O(e.message ? D(e.message) : T(`进度查询失败，请稍后重试。`)))
  }
  async function se() {
    te(!0), O(``);
    try {
      oe(await e(`${ae}/current`))
    } catch (e) {
      M.current && O(e.message), e instanceof l && e.status === 403 && u(!1)
    } finally {
      M.current && te(!1)
    }
  }(0, R.useEffect)(() => (M.current = !0, se(), () => {
    M.current = !1
  }), [ae]);
  async function ce(e) {
    if (!re.current) {
      re.current = !0, ne(!0), O(``);
      try {
        oe(await e())
      } catch (e) {
        M.current && O(e.message), e instanceof l && e.status === 403 && u(!1)
      } finally {
        re.current = !1, M.current && ne(!1)
      }
    }
  }
  let le = () => ce(() => e(`${ae}/${encodeURIComponent(i.id)}`));
  (0, R.useEffect)(() => {
    if (!i?.id || !i.submitted || E || !ht.has(i.status)) return;
    let e = setTimeout(() => {
      le()
    }, 3e3);
    return () => clearTimeout(e)
  });
  let N = i?.status || `NONE`,
    ue = s && (i?.expiredUnsaved || [`NONE`, `INITIALIZING`, `READY`, `FAILED`, `CANCELLED`, `complete`, `superseded`, `NOT_FOUND`, `exchanging`].includes(N)) && !i?.busy,
    P = i?.expiredUnsaved || [`NOT_FOUND`, `exchanging`].includes(N),
    F = s && !!i?.id && [`READY`, `staged`, `NOT_FOUND`, `UNKNOWN`].includes(N) && !i.busy && !i.expiredUnsaved;
  async function de(e = d) {
    await ce(async () => {
      let n = await k(ae, {
        version: t.version,
        mode: e
      });
      return m(``), g(``), v(``), w(``), ie.current = !1, n
    })
  }
  async function fe() {
    if (i?.mode === `REFRESH_TOKEN` && x && (!/^\d+$/.test(x) || Number(x) <= Date.now() || !Number.isSafeInteger(Number(x)))) {
      O(T(`有效期请填写未来的 Unix 毫秒时间戳。`));
      return
    }
    let e = i?.mode === `OAUTH` ? {
      code: p.trim()
    } : {
      refreshToken: h.trim(),
      ..._.trim() ? {
        accessToken: _.trim()
      } : {},
      ...x ? {
        expiresAt: Number(x)
      } : {}
    };
    await ce(() => S(`${ae}/${encodeURIComponent(i.id)}`, e))
  }
  return (0, z.jsxs)(a, {
    title: T(`已有账号重新授权`),
    onClose: () => {
      re.current || n()
    },
    wide: !0,
    children: [(0, z.jsx)(C, {
      items: [
        [T(`资源`), t.name],
        [`Lane ID`, t.laneId]
      ]
    }), (0, z.jsx)(`p`, {
      className: `muted`,
      children: T(`请使用原 Claude 账号授权。原资源、历史账单、供应商归属和代理配置保留。 `)
    }), ee ? (0, z.jsx)(b, {}) : (0, z.jsxs)(z.Fragment, {
      children: [!s && (0, z.jsx)(y, {
        tone: `red`,
        children: T(`当前供应商未开通 CCMAX 重新授权，请联系平台管理员。`)
      }), i && (0, z.jsxs)(y, {
        tone: N === `complete` ? `green` : void 0,
        children: [(0, z.jsx)(`strong`, {
          children: mt[N]
        }), i.paused && (0, z.jsx)(`p`, {
          children: T(`账号当前仍暂停；重新授权不会解除暂停、休眠或风控限制。`)
        }), i.updatedAt && (0, z.jsxs)(`div`, {
          children: [T(`更新于 `), c(i.updatedAt)]
        })]
      }), N === `complete` && (0, z.jsx)(`p`, {
        children: T(`新凭据已持久保存，运行实例已完成同步。可在资源列表同步最新账号状态。`)
      }), [`UNKNOWN`, `NOT_FOUND`, `exchanging`].includes(N) && (0, z.jsx)(y, {
        tone: `red`,
        children: T(`请先查询原操作。交换结果不明时，请重新生成 OAuth 链接登录原账号，勿重复使用一次性授权码或 RT。 `)
      }), i?.expiredUnsaved && (0, z.jsx)(y, {
        tone: `red`,
        children: T(`本次暂存凭据已过期，请查询原操作后重新生成 OAuth 链接登录原账号。 `)
      }), N === `staged` && !i?.expiredUnsaved && (0, z.jsx)(`p`, {
        children: T(`可使用原操作和完全相同的输入继续保存，不会重新交换凭据。`)
      }), E && (0, z.jsx)(y, {
        tone: `red`,
        children: E
      }), ue && (0, z.jsxs)(`div`, {
        className: `form-grid`,
        children: [(0, z.jsxs)(`label`, {
          className: `field full`,
          children: [T(`重新授权方式 `), (0, z.jsxs)(`select`, {
            "aria-label": T(`重新授权方式`),
            value: P ? `OAUTH` : d,
            disabled: j || P,
            onChange: e => f(e.target.value),
            children: [(0, z.jsx)(`option`, {
              value: `OAUTH`,
              children: T(`OAuth 登录原账号（推荐）`)
            }), (0, z.jsx)(`option`, {
              value: `REFRESH_TOKEN`,
              children: T(`更新 Refresh Token`)
            })]
          })]
        }), (0, z.jsx)(`div`, {
          className: `full`,
          children: (0, z.jsx)(A, {
            disabled: j,
            onClick: () => void de(P ? `OAUTH` : d),
            children: T(j ? `处理中…` : P || d === `OAUTH` ? `生成新的授权链接` : `开始更新凭据`)
          })
        })]
      }), i?.authUrl && N === `READY` && (0, z.jsxs)(`div`, {
        className: `resource-target-oauth-result`,
        children: [(0, z.jsxs)(`p`, {
          className: `muted`,
          children: [T(`授权链接有效期至 `), c(i.expiresAt || void 0)]
        }), (0, z.jsxs)(`label`, {
          className: `field`,
          children: [T(`授权链接 `), (0, z.jsx)(`textarea`, {
            readOnly: !0,
            rows: 3,
            value: i.authUrl
          })]
        }), (0, z.jsxs)(`div`, {
          className: `resource-target-oauth-actions`,
          children: [(0, z.jsx)(`a`, {
            href: i.authUrl,
            target: `_blank`,
            rel: `noopener noreferrer`,
            children: T(`打开授权页面 `)
          }), (0, z.jsx)(A, {
            onClick: () => {
              navigator.clipboard.writeText(i.authUrl).catch(() => O(T(`复制失败，请手动复制授权链接。`)))
            },
            children: T(`复制链接 `)
          })]
        })]
      }), N === `READY` && d === `OAUTH` && !i?.authUrl && (0, z.jsx)(`p`, {
        className: `muted`,
        children: T(`授权链接不会在关闭后保留。可填写之前取得的授权码，或生成新链接。 `)
      }), F && (0, z.jsx)(`div`, {
        className: `form-grid`,
        children: i?.mode === `OAUTH` ? (0, z.jsxs)(`label`, {
          className: `field full`,
          children: [T(`授权码 `), (0, z.jsx)(`textarea`, {
            "aria-label": T(`授权码`),
            autoComplete: `off`,
            rows: 3,
            value: p,
            disabled: j,
            onChange: e => m(e.target.value)
          })]
        }) : (0, z.jsxs)(z.Fragment, {
          children: [(0, z.jsxs)(`label`, {
            className: `field full`,
            children: [`Refresh Token`, (0, z.jsx)(`input`, {
              "aria-label": `Refresh Token`,
              type: `password`,
              autoComplete: `new-password`,
              value: h,
              disabled: j,
              onChange: e => g(e.target.value)
            })]
          }), (0, z.jsxs)(`label`, {
            className: `field full`,
            children: [T(`Access Token（可选） `), (0, z.jsx)(`input`, {
              "aria-label": T(`Access Token（可选）`),
              type: `password`,
              autoComplete: `new-password`,
              value: _,
              disabled: j,
              onChange: e => v(e.target.value)
            })]
          }), (0, z.jsxs)(`label`, {
            className: `field full`,
            children: [T(`有效期（可选，Unix 毫秒时间戳） `), (0, z.jsx)(`input`, {
              "aria-label": T(`有效期（可选，Unix 毫秒时间戳）`),
              inputMode: `numeric`,
              value: x,
              disabled: j,
              onChange: e => w(e.target.value)
            })]
          })]
        })
      })]
    }), ee && E && (0, z.jsx)(y, {
      tone: `red`,
      children: E
    }), !ee && (!i || !!E || N === `INITIALIZING`) && (0, z.jsx)(A, {
      disabled: j,
      onClick: () => void se(),
      children: T(`重新读取授权记录 `)
    }), (0, z.jsxs)(`div`, {
      className: `dialog-footer`,
      children: [(0, z.jsx)(A, {
        disabled: j,
        onClick: n,
        children: T(`关闭 `)
      }), i?.submitted && i.id && (0, z.jsx)(A, {
        disabled: j,
        onClick: () => void le(),
        children: T(j ? `查询中…` : `查询授权进度`)
      }), F && (0, z.jsx)(A, {
        variant: `primary`,
        disabled: j || (i?.mode === `OAUTH` ? !p.trim() : !h.trim()),
        onClick: () => void fe(),
        children: j ? T(`正在提交…`) : i?.submitted ? T(`使用原操作继续提交`) : T(`提交重新授权`)
      })]
    })]
  })
}

function yt({
  resource: e,
  supplierSide: t
}) {
  let {
    has: n
  } = r(), [i, o] = (0, R.useState)(!1), [s, l] = (0, R.useState)(!1), u = (0, R.useRef)(!1), [d, f] = (0, R.useState)(null), [p, m] = (0, R.useState)(``);
  if (e.readOnly || e.resourceType !== `CCMAX` || e.state !== `DELIVERED` || e.dispatchState !== `SUCCESS` || !e.laneId || !n(`resource.read`) || !n(t ? `resource.write` : `resource.dispatch`)) return null;
  async function h() {
    if (!u.current) {
      u.current = !0, l(!0), f(null), m(``), o(!0);
      try {
        f(await k(`/resources/${encodeURIComponent(e.id)}/say-hi`, {}))
      } catch (e) {
        m(e instanceof Error ? e.message : T(`测试请求失败`))
      } finally {
        u.current = !1, l(!1)
      }
    }
  }
  return (0, z.jsxs)(`span`, {
    className: `resource-say-hi`,
    onClick: e => e.stopPropagation(),
    children: [(0, z.jsx)(`button`, {
      type: `button`,
      className: `resource-action-link`,
      disabled: s,
      title: T(`测试此账号的连通性，可能消耗上游额度`),
      onClick: e => {
        e.stopPropagation(), h()
      },
      children: s ? T(`测试中…`) : `Say Hi`
    }), i && (0, z.jsx)(a, {
      title: `Say Hi · ${e.name}`,
      onClose: () => o(!1),
      children: (0, z.jsxs)(`div`, {
        onClick: e => e.stopPropagation(),
        "aria-live": `polite`,
        children: [s && (0, z.jsx)(y, {
          children: T(`正在测试此账号，最长约 70 秒，请勿重复点击。`)
        }), p && (0, z.jsx)(y, {
          tone: `red`,
          children: p
        }), d && (0, z.jsxs)(z.Fragment, {
          children: [(0, z.jsx)(y, {
            tone: d.ok ? `green` : `red`,
            children: d.ok ? T(`测试成功`) : T(`测试失败`)
          }), (0, z.jsx)(C, {
            items: [
              [T(`账号`), e.accountName || d.laneId],
              [T(`测试时间`), c(d.checkedAt)],
              [T(`耗时`), d.latencyMs == null ? `—` : `${d.latencyMs} ms`],
              [T(`模型`), d.model],
              [T(`Worker 状态码`), d.status],
              [T(`上游状态码`), d.upstreamStatus]
            ]
          }), d.text && (0, z.jsx)(`pre`, {
            className: `say-hi-output`,
            children: d.text
          }), !d.ok && (0, z.jsxs)(z.Fragment, {
            children: [(0, z.jsx)(`p`, {
              children: d.failure || d.error || T(`未返回具体错误说明`)
            }), d.failure && d.error && (0, z.jsx)(`p`, {
              children: d.error
            }), d.rawError && (0, z.jsx)(`pre`, {
              className: `say-hi-output`,
              children: d.rawError
            })]
          })]
        })]
      })
    })]
  })
}
var bt = (0, R.lazy)(() => x(() => import(`./IntakeReviewDialog-C9xZ8Ftb.js`), __vite__mapDeps([3, 1, 2, 4]))),
  xt = (0, R.lazy)(() => x(() => import(`./PriorityBatchDialog-DWPDEDJI.js`), __vite__mapDeps([5, 1, 2, 6, 7, 4])));

function St({
  supplierSide: s,
  pendingOnly: c,
  onApiDelivery: l
}) {
  const [linkChannel, setLinkChannel] = R.useState(false);
  const [linkNativeAccount, setLinkNativeAccount] = R.useState(false);
  let [d, p] = (0, R.useState)(!1), [h, _] = (0, R.useState)(!1), [v, x] = (0, R.useState)(!1), [S, C] = (0, R.useState)(new Map), [E, D] = (0, R.useState)(null), [ee, ne] = (0, R.useState)(!1), [ce, le] = (0, R.useState)(null), {
    has: N,
    notify: P,
    refresh: F,
    user: de
  } = r(), [_e, L] = (0, R.useState)(1), [ye, Se] = (0, R.useState)(10), [we, Te, Ee] = ue(() => L(1)), [ke, Ae] = (0, R.useState)(``), [Me, Ne] = (0, R.useState)(``), [Pe, Fe] = (0, R.useState)(``), [Ie, Le] = (0, R.useState)(``), [Re, Be] = (0, R.useState)({
    supplier: ``,
    creator: ``
  });
  (0, R.useEffect)(() => {
    let e = window.setTimeout(() => Be({
      supplier: Pe.trim(),
      creator: Ie.trim()
    }), 300);
    return () => window.clearTimeout(e)
  }, [Pe, Ie]);
  let Ve = ke,
    He = Me,
    [Ue, We] = (0, R.useState)(``),
    B = c ? `NEWAPI_INTAKE` : Ue,
    Ke = c ? `UNASSIGNED` : `ASSIGNED`,
    V = !c && (!B || B === `CCMAX` || B === `NEWAPI_CHANNEL`),
    Xe = !s && !de.supplierId && N(`resource.read`) && N(`resource.dispatch`),
    H = N(`proxy.read`) && N(s ? `resource.write` : `resource.dispatch`),
    [U, W] = (0, R.useState)(``),
    [G, K] = (0, R.useState)(``),
    [Ze, Qe] = (0, R.useState)(null),
    [$e, et] = (0, R.useState)(null),
    [tt, nt] = (0, R.useState)(``),
    [q, rt] = (0, R.useState)(``),
    [it, ot] = (0, R.useState)(``),
    [st, ct] = (0, R.useState)(``),
    [lt, mt] = (0, R.useState)(``),
    [ht, _t] = (0, R.useState)(``),
    [St, Et] = (0, R.useState)(``);
  (0, R.useEffect)(() => C(new Map), [Ee, ke, Me, B, tt, q, it, lt, ht, St]);
  let [Dt, J] = (0, R.useState)(null), [Ot, Y] = (0, R.useState)(null), [kt, At] = (0, R.useState)(null), [jt, Mt] = (0, R.useState)(null), Nt = (0, R.useRef)(null);

  function Pt(e, t, n = !1) {
    Nt.current = n ? e : null, n && Y(null), t ? At(e) : Mt(e)
  }

  function Ft() {
    At(null), Mt(null);
    let e = Nt.current;
    Nt.current = null, e && Y(e)
  }
  let [It, Lt] = (0, R.useState)(null), Rt = (0, R.useRef)(!1), [zt, Bt] = (0, R.useState)(new Set), Vt = (0, R.useRef)(new Set), [Ht, Ut] = (0, R.useState)(null), [X, Wt] = (0, R.useState)(null), [Gt, Kt] = (0, R.useState)(!1), [qt, Jt] = (0, R.useState)(!1), Yt = (0, R.useRef)(!1), [Xt, Zt] = (0, R.useState)(``);

  function Qt(e, t) {
    Kt(!1), Zt(``), Wt({
      resource: e,
      action: t
    })
  }
  async function $t() {
    if (X && Gt && !Yt.current) {
      Yt.current = !0, Jt(!0), Zt(``);
      try {
        let e = await k(`/resources/${ge(X.resource.id)}/creation-recovery`, {
          version: X.resource.version,
          dispatchId: X.resource.recoveryDispatchId,
          confirmedNotCreated: !0,
          action: X.action
        });
        Y(null), Wt(null), F(), e.deleted ? P(T(`已标记删除，列表中已隐藏`)) : e.resource && (Nn(null), J(e.resource))
      } catch (e) {
        Zt(e.message)
      } finally {
        Yt.current = !1, Jt(!1)
      }
    }
  }
  let [en, tn] = (0, R.useState)(!1), [nn, rn] = (0, R.useState)(``), an = (0, R.useRef)(!1), [on, sn] = (0, R.useState)(!1), cn = new URLSearchParams({
    search: Ee,
    supplierSearch: s ? `` : Ve,
    creatorSearch: He,
    resourceType: c ? `NEWAPI_INTAKE` : [`CCMAX`, `NEWAPI_CHANNEL`].includes(Ue) ? Ue : ``,
    category: c || [`CCMAX`, `NEWAPI_CHANNEL`].includes(Ue) ? `` : Ue,
    assignment: Ke,
    newApiDeliveryState: U,
    newApiResourceState: G,
    operationalStatus: tt,
    failureReason: q,
    projectId: it,
    credentialMode: s || B === `CCMAX` ? st : ``,
    state: lt,
    createdFrom: ht,
    createdTo: St
  }), ln = new URLSearchParams(cn);
  ln.set(`resourceType`, `CCMAX`);
  for (let e of [`assignment`, `newApiDeliveryState`, `newApiResourceState`]) ln.delete(e);
  let un = new URLSearchParams(cn);
  un.set(`page`, String(_e)), un.set(`size`, String(ye)), un.set(`summaryOnly`, `true`);
  let dn = u(`/deliveries/filter-options?assignment=${Ke}&supplierSearch=${encodeURIComponent(Re.supplier)}&creatorSearch=${encodeURIComponent(Re.creator)}`),
    fn = (dn.data?.suppliers ?? []).map(e => ({
      value: e.id,
      label: e.name,
      detail: e.code
    })),
    pn = (dn.data?.creators ?? []).map(e => ({
      value: e.id,
      label: e.name,
      detail: e.code
    })),
    mn = (0, R.useRef)(new Map),
    hn = (0, R.useRef)(new Map);
  for (let e of fn) mn.current.set(e.value, e.label);
  for (let e of pn) hn.current.set(e.value, e.label);
  let gn = Ee ? 0 : 1e4,
    _n = Ee ? 0 : 3e4,
    Z = u(`/deliveries?${un}`, gn),
    vn = (0, R.useRef)(!1);
  (0, R.useEffect)(() => {
    !Z.loading && !Z.refreshing && (vn.current = !1)
  }, [Z.loading, Z.refreshing, Z.data, Z.error]);
  let yn = u(s && V ? `/resources/summary?${ln}` : null, _n),
    bn = u(on && V ? `/resources/creator-summary?${ln}` : null, _n),
    xn = new URLSearchParams(ln);
  xn.delete(`failureReason`);
  let Q = u(V ? `/resources/failure-reasons?${xn}` : null, _n),
    Sn = Q.loading || Q.error ? [] : Q.data || [],
    Cn = !Z.loading && !Z.error ? Z.data?.total : void 0,
    wn = u(`/projects?size=100`),
    Tn = new Map((wn.data?.items || []).map(e => [e.id, e.name])),
    En = [{
      label: T(`关键词`),
      value: Ee,
      clear: () => Te(``)
    }, {
      label: T(`供应商`),
      value: s || !Ve ? `` : fn.find(e => e.value === Ve)?.label ?? mn.current.get(Ve) ?? T(`已选供应商`),
      clear: () => Ae(``)
    }, {
      label: T(s && B === `NEWAPI_INTAKE` ? `录入人` : `创建人`),
      value: He ? pn.find(e => e.value === He)?.label ?? hn.current.get(He) ?? T(`已选创建人`) : ``,
      clear: () => Ne(``)
    }, {
      label: T(`资源类型`),
      value: c ? `` : wn.data?.items.find(e => e.category === B)?.categoryName || B,
      clear: () => {
        We(``), W(``), K(``), ct(``), mt(``), nt(``), rt(``)
      }
    }, {
      label: T(`项目`),
      value: it ? Tn.get(it) || T(`已选项目`) : ``,
      clear: () => ot(``)
    }, {
      label: T(`凭据方式`),
      value: st ? i[st] : ``,
      clear: () => ct(``)
    }, {
      label: T(`交付状态`),
      value: U ? Oe[U] : ``,
      clear: () => W(``)
    }, {
      label: T(`资源状态`),
      value: G ? he[G] : ``,
      clear: () => K(``)
    }, {
      label: T(`交付状态`),
      value: lt ? be.find(e => e.value === lt)?.label : ``,
      clear: () => mt(``)
    }, {
      label: T(`资源状态`),
      value: tt ? De[tt] : ``,
      clear: () => nt(``)
    }, {
      label: T(`失效原因`),
      value: q ? te(Sn.find(e => e.value === q)?.label || q) : ``,
      clear: () => rt(``)
    }, {
      label: T(`创建日期`),
      value: ht || St ? T(`{0} 至 {1}`, [ht || T(`不限`), St || T(`不限`)]) : ``,
      clear: () => {
        _t(``), Et(``)
      }
    }].filter(e => e.value),
    Dn = s && N(`resource.write`),
    $ = u(Dn && !c ? `/resources/submission-capabilities` : null),
    On = ze(s, F, () => C(new Map), $.loading || $.error ? null : $.data),
    kn = $.data?.forceStopCcmaxIntake === !0 || $.data?.allowCcmax === !1,
    An = N(`quote.read`),
    jn = n(`quoteId`),
    [Mn, Nn] = (0, R.useState)(null),
    [Pn, Fn] = (0, R.useState)(!!(jn && Dn)),
    [In, Ln] = (0, R.useState)(``);
  (0, R.useEffect)(() => {
    if (!jn || !Dn) return;
    if (!An) {
      Ln(T(`没有查看报价的权限，无法带入交付资料`)), Fn(!1);
      return
    }
    let t = !0;
    return Fn(!0), Promise.all([e(`/quotes/${ge(jn)}`).catch(e => {
      throw Error(T(`报价资料加载失败：{0}`, [e.message]))
    }), e(`/resources/eligible-projects`).catch(e => {
      throw Error(T(`可交付项目查询失败：{0}`, [e.message]))
    })]).then(([e, n]) => {
      if (t) {
        if (e.state !== `APPROVED` || e.supplierId !== de.supplierId) {
          Ln(T(`仅可从本方已通过的报价发起交付`));
          return
        }
        if (!n.some(t => t.id === e.projectId)) {
          Ln(T(`该报价目前不满足交付条件，请核对有效期和币种`));
          return
        }
        Nn({
          projectId: e.projectId,
          projectName: e.projectName
        }), J(`new`)
      }
    }).catch(e => {
      t && Ln(e.message)
    }).finally(() => {
      t && Fn(!1)
    }), () => {
      t = !1
    }
  }, [jn, Dn, An, de.supplierId]);
  async function Rn(t) {
    let n = await e(`/resources/${ge(t)}`);
    return Z.mutate(e => ({
      ...e,
      items: e.items.map(e => !I(e) && e.id === t ? {
        ...e,
        ...n
      } : e)
    })), Y(e => e?.id === t ? {
      ...e,
      ...n
    } : e), n
  }

  function zn(e) {
    Rn(e).catch(e => {
      P(T(`授权操作已结束，当前行读取失败：{0}`, [e.message]), !0)
    })
  }
  async function Bn(e) {
    if (!Vt.current.has(e.id)) {
      Vt.current.add(e.id), Bt(new Set(Vt.current));
      try {
        let t = await k(`/resources/${ge(e.id)}/usage`, {});
        try {
          await Rn(e.id)
        } catch (n) {
          if (t.state === `UPDATED`) {
            Z.mutate(n => ({
              ...n,
              items: n.items.map(n => !I(n) && n.id === e.id ? {
                ...n,
                usage: {
                  ...n.usage,
                  ...t
                }
              } : n)
            })), P(T(`金额已同步，最新账号状态读取失败：{0}`, [n.message]), !0);
            return
          }
        }
        if (t.state !== `UPDATED`) {
          P(t.amount == null ? T(`金额同步失败，暂未取得消费金额`) : T(`金额同步失败，仍显示上次成功的金额`), !0);
          return
        }
        P(T(`金额已同步`))
      } catch (e) {
        P(T(`金额同步失败：{0}`, [e.message]), !0)
      } finally {
        Vt.current.delete(e.id), Bt(new Set(Vt.current))
      }
    }
  }
  async function Vn(t) {
    if (!(Rt.current || !Ce(t, s, N) && !me(t, s, N))) {
      Rt.current = !0, Lt(t.id);
      try {
        let n = await e(`/resources/${ge(t.id)}`);
        if (me(n, s, N) && (n = await k(`/resources/${ge(n.id)}/oauth/supplier-retry`, {
            version: n.version
          }), F()), !Ce(n, s, N)) {
          F(), P(T(`记录状态已变化，请刷新后查看`), !0);
          return
        }
        Nn(null), J(n)
      } catch (e) {
        P(T(`加载草稿失败：{0}`, [e.message]), !0)
      } finally {
        Rt.current = !1, Lt(null)
      }
    }
  }
  async function Hn() {
    if (Ht && !an.current && xe(Ht, s, N)) {
      an.current = !0, tn(!0), rn(``);
      try {
        await e(`/resources/${ge(Ht.id)}?version=${Ht.version}`, {
          method: `DELETE`
        }), Ot?.id === Ht.id && Y(null), Ut(null), P(T(`已标记删除，列表中已隐藏`)), F()
      } catch (e) {
        rn(e.message)
      } finally {
        an.current = !1, tn(!1)
      }
    }
  }
  let Un = e => e.resourceType === `CCMAX` && N(`resource.usage`) && e.state === `DELIVERED` && e.dispatchState === `SUCCESS` && !(s && e.settlementMethod === `ACCOUNT_BUYOUT`) && (0, z.jsxs)(`button`, {
      type: `button`,
      className: `resource-action-link`,
      title: T(`查询账号状态和用量`),
      disabled: zt.has(e.id),
      onClick: t => {
        t.stopPropagation(), Bn(e)
      },
      children: [(0, z.jsx)(f, {
        name: `refresh`,
        size: 12
      }), zt.has(e.id) ? T(`同步中…`) : T(`同步`)]
    }),
    Wn = e => isNativeCcmax(e) ? z.jsx(A, { onClick: event => { event.stopPropagation(); Y(e); }, children: `CCMAX 账号详情` }) : isNewApi(e) ? z.jsx(A, { onClick: event => { event.stopPropagation(); Y(e); }, children: `渠道详情` }) : e.readOnly ? I(e) ? null : (0, z.jsx)(`div`, {
      className: `resource-row-actions`,
      children: Un(e)
    }) : I(e) ? (0, z.jsxs)(`div`, {
      className: `resource-row-actions`,
      children: [N(`resource.intake.manage`) && N(`resource.write`) && e.assignmentState === `UNASSIGNED` && (0, z.jsx)(A, {
        onClick: t => {
          t.stopPropagation(), Qe(e)
        },
        children: T(`分配项目 `)
      }), (0, z.jsx)(A, {
        onClick: t => {
          t.stopPropagation(), et(e)
        },
        children: T(`查看 `)
      })]
    }) : (0, z.jsxs)(`div`, {
      className: `resource-row-actions`,
      children: [(0, z.jsx)(yt, {
        resource: e,
        supplierSide: s
      }), Un(e), On.rowActions(e), H && Ge(e) && (0, z.jsx)(`button`, {
        type: `button`,
        className: `resource-action-link`,
        onClick: t => {
          t.stopPropagation(), D([e])
        },
        children: T(`更换代理 `)
      }), gt(e, s, N) && (0, z.jsx)(`button`, {
        type: `button`,
        className: `resource-action-link`,
        onClick: t => {
          t.stopPropagation(), Pt(e, !1)
        },
        children: T(`重新授权 `)
      }), ve(e, s, N) && (0, z.jsxs)(z.Fragment, {
        children: [s && (0, z.jsx)(`button`, {
          type: `button`,
          className: `resource-action-link`,
          onClick: t => {
            t.stopPropagation(), Qt(e, `EDIT`)
          },
          children: T(`编辑 `)
        }), (0, z.jsx)(`button`, {
          type: `button`,
          className: `resource-action-link danger`,
          onClick: t => {
            t.stopPropagation(), Qt(e, `DELETE`)
          },
          children: T(`删除 `)
        })]
      }), me(e, s, N) && (0, z.jsx)(`button`, {
        type: `button`,
        className: `resource-action-link`,
        disabled: It !== null,
        onClick: t => {
          t.stopPropagation(), Vn(e)
        },
        children: It === e.id ? T(`加载中…`) : T(`重新授权`)
      }), gt(e, s, N) && (0, z.jsxs)(`button`, {
        type: `button`,
        className: `resource-action-link`,
        "aria-label": T(`强制刷新授权`),
        title: T(`强制刷新授权：使用已保存的 Refresh Token 刷新凭据`),
        onClick: t => {
          t.stopPropagation(), Pt(e, !0)
        },
        children: [(0, z.jsx)(f, {
          name: `refresh`,
          size: 12
        }), T(` 强制刷新 `)]
      }), Ce(e, s, N) && !me(e, s, N) && (0, z.jsx)(`button`, {
        type: `button`,
        className: `resource-action-link`,
        disabled: It !== null,
        onClick: t => {
          t.stopPropagation(), Vn(e)
        },
        children: It === e.id ? T(`加载中…`) : e.credentialMode === `OAUTH` && e.dispatchFailureReason ? T(`重新授权`) : T(`编辑`)
      }), xe(e, s, N) && (0, z.jsx)(`button`, {
        type: `button`,
        className: `resource-action-link danger`,
        disabled: en,
        onClick: t => {
          t.stopPropagation(), rn(``), Ut(e)
        },
        children: T(`删除 `)
      })]
    });
  return (0, z.jsxs)(z.Fragment, {
    children: [(0, z.jsxs)(w, {
      title: fe(s, c),
      children: [!s && de.role === `ADMIN` && N(`resource.dispatch`) && N(`resource.config.read`) && z.jsx(A, { onClick: () => setLinkNativeAccount(true), children: `关联 CCMAX 原生账号` }), !s && de.role === `ADMIN` && N(`resource.dispatch`) && N(`resource.config.read`) && z.jsx(A, { onClick: () => setLinkChannel(true), children: `关联 New API 渠道` }), !s && (0, z.jsx)(A, {
        icon: `refresh`,
        "aria-label": T(c ? `刷新待分配资源` : `刷新资源列表`),
        "aria-busy": Z.loading || Z.refreshing,
        disabled: Z.loading || Z.refreshing,
        onClick: () => {
          Z.loading || Z.refreshing || vn.current || (vn.current = !0, F())
        },
        children: Z.loading || Z.refreshing ? T(`刷新中`) : T(`刷新`)
      }), V && (0, z.jsx)(A, {
        "aria-expanded": on,
        "aria-controls": `creator-summary`,
        onClick: () => sn(e => !e),
        children: T(on ? `收起创建人汇总` : `按创建人汇总`)
      }), Dn && (0, z.jsx)(A, {
        variant: `primary`,
        icon: `plus`,
        disabled: Pn || B !== `NEWAPI_INTAKE` && (!$.data || B === `CCMAX` && kn),
        onClick: () => {
          Nn(null), B === `NEWAPI_INTAKE` || kn ? l() : J(`new`)
        },
        children: T(kn && !B ? `NewAPI 资源交付` : `新增交付 `)
      })]
    }), Pn && (0, z.jsx)(b, {}), In && (0, z.jsx)(y, {
      tone: `red`,
      children: In
    }), Dn && V && $.error && (0, z.jsxs)(y, {
      tone: `red`,
      children: [$.error, ` `, (0, z.jsx)(A, {
        onClick: $.reload,
        children: T(`重新加载配置`)
      })]
    }), Dn && V && kn && (0, z.jsx)(y, {
      tone: `amber`,
      children: je($.data)
    }), V && (0, z.jsx)(M, {
      filterQuery: ln.toString(),
      refreshIntervalMs: _n,
      operationalStatus: tt,
      onFilter: e => {
        We(`CCMAX`), W(``), K(``), nt(e), L(1)
      }
    }), s && V && (0, z.jsx)(IntakeToday, {}), s && V && (0, z.jsxs)(`section`, {
      className: `panel delivery-summary`,
      "aria-label": T(`项目分类汇总`),
      children: [(0, z.jsx)(`h2`, {
        children: T(`项目分类汇总`)
      }), yn.error && (0, z.jsxs)(y, {
        tone: `red`,
        children: [T(`分类汇总加载失败：`), yn.error]
      }), yn.loading ? (0, z.jsx)(b, {}) : yn.error ? null : yn.data?.length ? (0, z.jsx)(`div`, {
        className: `delivery-summary-grid`,
        children: (yn.data || []).map(e => (0, z.jsxs)(`div`, {
          className: `delivery-summary-card`,
          children: [(0, z.jsx)(`div`, {
            className: `delivery-summary-main`,
            children: (0, z.jsx)(`span`, {
              className: `delivery-summary-category`,
              children: e.categoryName
            })
          }), (0, z.jsx)(`div`, {
            className: `delivery-summary-amounts`,
            children: e.amounts.length ? e.amounts.map(e => (0, z.jsxs)(`div`, {
              className: `delivery-summary-amount`,
              children: [(0, z.jsx)(`span`, {
                children: e.kind === `BUYOUT` ? T(`买断价格`) : T(`消费金额`)
              }), (0, z.jsxs)(`strong`, {
                children: [t(e.amount), ` `, e.currency]
              }), (0, z.jsxs)(`span`, {
                children: [e.resourceCount.toLocaleString(O()), T(` 条资源`)]
              })]
            }, `${e.kind}-${e.currency}`)) : (0, z.jsx)(`span`, {
              children: T(`暂无金额`)
            })
          })]
        }, e.category))
      }) : (0, z.jsx)(`p`, {
        className: `delivery-summary-empty`,
        children: T(`当前筛选下没有交付资源`)
      })]
    }), (0, z.jsxs)(`section`, {
      className: `panel`,
      children: [(0, z.jsxs)(oe, {
        mobileCompact: !0,
        className: `delivery-filters${s?` supplier-side`:``}`,
        onReset: () => {
          Te(``), Ae(``), Ne(``), We(``), W(``), K(``), nt(``), rt(``), ot(``), ct(``), mt(``), _t(``), Et(``), L(1)
        },
        actions: V ? (0, z.jsxs)(z.Fragment, {
          children: [On.toolbar([...S.values()]), Xe && (0, z.jsx)(A, {
            onClick: () => p(!0),
            children: T(`核对上号计数`)
          }), Xe && de.role === `ADMIN` && (0, z.jsx)(A, {
            onClick: () => _(!0),
            children: T(`批量调整优先级`)
          }), H && (0, z.jsxs)(A, {
            disabled: !S.size || [...S.values()].some(row => isNewApi(row) || isNativeCcmax(row)),
            title: [...S.values()].some(isNewApi) ? T(`New API 渠道不支持替换代理`) : void 0,
            onClick: () => D([...S.values()]),
            children: [T(`批量替换代理`), S.size ? T(`（{0}）`, [S.size]) : ``]
          }), (0, z.jsx)(A, {
            onClick: () => ne(!0),
            children: T(`更换记录`)
          })]
        }) : void 0,
        appliedFilters: En,
        onFilterCleared: () => L(1),
        primarySearch: (0, z.jsx)(re, {
          value: we,
          onChange: Te,
          placeholder: T(V ? `搜索资源名称、账号或 Lane ID` : `搜索资源名称`)
        }),
        searches: (0, z.jsxs)(z.Fragment, {
          children: [!s && (0, z.jsx)(ae, {
            label: T(`供应商`),
            allLabel: T(`全部供应商`),
            visual: `supplier`,
            value: ke,
            onChange: e => {
              Ae(e), L(1)
            },
            options: fn,
            onSearchChange: Fe,
            loading: dn.loading,
            error: dn.error,
            searchPlaceholder: T(`搜索供应商名称或编码`)
          }), (0, z.jsx)(ie, {
            label: T(s && B === `NEWAPI_INTAKE` ? `录入人` : `创建人`),
            allLabel: T(s && B === `NEWAPI_INTAKE` ? `全部录入人` : `全部创建人`),
            visual: `user`,
            value: Me,
            onChange: e => {
              Ne(e), L(1)
            },
            options: pn,
            onSearchChange: Le,
            loading: dn.loading,
            error: dn.error,
            searchPlaceholder: T(s && B === `NEWAPI_INTAKE` ? `搜索录入人姓名或账号` : `搜索创建人姓名或账号`)
          })]
        }),
        selectors: (0, z.jsxs)(z.Fragment, {
          children: [!c && (0, z.jsxs)(z.Fragment, {
            children: [(0, z.jsx)(dt, {
              value: B,
              onChange: e => {
                We(e), W(``), K(``), ct(``), L(1), e !== `CCMAX` && (mt(``), nt(``), rt(``))
              }
            }), (0, z.jsx)(j, {
              compact: !0,
              visual: `project`,
              ariaLabel: T(`交付项目`),
              value: it,
              options: [{
                value: ``,
                label: T(`全部项目`)
              }, ...(wn.data?.items || []).map(e => ({
                value: e.id,
                label: e.name
              }))],
              onChange: e => {
                ot(e), L(1)
              }
            })]
          }), V && (0, z.jsxs)(z.Fragment, {
            children: [(s || B === `CCMAX`) && (0, z.jsx)(j, {
              compact: !0,
              ariaLabel: T(`凭据方式`),
              value: st,
              options: [{
                value: ``,
                label: T(`全部凭据方式`)
              }, ...pe],
              onChange: e => {
                ct(e), L(1)
              }
            }), (0, z.jsx)(j, {
              compact: !0,
              ariaLabel: T(`交付状态`),
              value: lt,
              options: be,
              onChange: e => {
                mt(e), L(1)
              }
            }), (0, z.jsx)(j, {
              compact: !0,
              ariaLabel: T(`资源状态`),
              value: tt,
              options: [{
                value: ``,
                label: T(`全部资源状态`)
              }, ...Object.entries(De).map(([e, t]) => ({
                value: e,
                label: t
              }))],
              onChange: e => {
                nt(e), L(1)
              }
            }), (0, z.jsx)(j, {
              compact: !0,
              ariaLabel: T(`失效原因`),
              searchPlaceholder: T(`搜索失效原因`),
              value: q,
              disabled: Q.loading || !!Q.error,
              options: [{
                value: ``,
                label: Q.loading ? T(`失效原因加载中…`) : Q.error ? T(`失效原因加载失败`) : T(`全部失效原因`)
              }, ...Sn.map(e => ({
                value: e.value,
                label: te(e.label),
                detail: e.value === q ? Cn === void 0 ? Z.error ? T(`查询失败`) : T(`查询中…`) : T(`{0} 条资源`, [Cn.toLocaleString(O())]) : T(`{0} 条资源`, [e.count.toLocaleString(O())])
              })), ...q && !Sn.some(e => e.value === q) ? [{
                value: q,
                label: te(q),
                detail: Q.loading || Q.error || Cn === void 0 ? T(`已选择`) : T(`当前条件 {0} 条资源`, [Cn.toLocaleString(O())])
              }] : []],
              onChange: e => {
                rt(e), L(1)
              }
            })]
          }), !s && B === `NEWAPI_INTAKE` && (0, z.jsxs)(z.Fragment, {
            children: [(0, z.jsx)(j, {
              compact: !0,
              ariaLabel: T(`交付状态`),
              value: U,
              options: [{
                value: ``,
                label: T(`全部交付状态`)
              }, ...Object.entries(Oe).map(([e, t]) => ({
                value: e,
                label: t
              }))],
              onChange: e => {
                W(e), L(1)
              }
            }), (0, z.jsx)(j, {
              compact: !0,
              ariaLabel: T(`资源状态`),
              value: G,
              options: [{
                value: ``,
                label: T(`全部资源状态`)
              }, ...Object.entries(he).map(([e, t]) => ({
                value: e,
                label: t
              }))],
              onChange: e => {
                K(e), L(1)
              }
            })]
          }), (0, z.jsx)(se, {
            label: T(`创建日期`),
            from: ht,
            to: St,
            onChange: (e, t) => {
              _t(e), Et(t), L(1)
            }
          })]
        }),
        children: [dn.error && (0, z.jsxs)(`div`, {
          className: `delivery-filter-error`,
          role: `alert`,
          children: [(0, z.jsxs)(`span`, {
            children: [T(`供应商／创建人选项加载失败：`), dn.error]
          }), (0, z.jsx)(A, {
            onClick: F,
            children: T(`重试筛选选项`)
          })]
        }), V && Q.error && (0, z.jsxs)(`div`, {
          className: `delivery-filter-error`,
          role: `alert`,
          children: [(0, z.jsxs)(`span`, {
            children: [T(`失效原因选项加载失败：`), Q.error]
          }), (0, z.jsx)(A, {
            onClick: F,
            children: T(`重试失效原因`)
          })]
        }), V && !lt && !we.trim() && !ke.trim() && !Me.trim() && !ht && !St && (0, z.jsx)(`p`, {
          className: `muted small delivery-draft-window`,
          children: T(`两天前创建的草稿默认不显示。选择「草稿」，或用搜索、创建日期可以查出来。 `)
        })]
      }), wn.error && (0, z.jsxs)(y, {
        tone: `red`,
        children: [T(`项目名称加载失败：`), wn.error]
      }), on && V && (0, z.jsxs)(`section`, {
        id: `creator-summary`,
        className: `creator-summary`,
        "aria-label": T(`创建人归类汇总`),
        children: [(0, z.jsxs)(`div`, {
          className: `creator-summary-heading`,
          children: [(0, z.jsx)(`h2`, {
            children: T(`创建人归类汇总`)
          }), (0, z.jsx)(`span`, {
            children: T(`按当前筛选统计 CCMAX 资源`)
          })]
        }), (0, z.jsx)(g, {
          data: bn.loading ? [] : bn.data || [],
          loading: bn.loading,
          error: bn.error,
          columns: [{
            label: T(`创建人`),
            render: e => (0, z.jsxs)(`div`, {
              className: `creator-summary-person`,
              children: [(0, z.jsx)(`strong`, {
                children: e.creatorName
              }), e.creatorUsername && e.creatorUsername !== e.creatorName && (0, z.jsx)(`span`, {
                children: e.creatorUsername
              })]
            })
          }, {
            label: T(`资源总数`),
            render: e => T(`{0} 条`, [e.resourceCount.toLocaleString(O())])
          }, {
            label: T(`消费金额`),
            render: e => e.amountResourceCount ? (0, z.jsxs)(`div`, {
              className: `creator-summary-amount`,
              children: [(0, z.jsxs)(`strong`, {
                children: [t(e.consumptionAmountUsd), ` USD`]
              }), (0, z.jsxs)(`span`, {
                children: [e.amountResourceCount.toLocaleString(O()), T(` 条资源计入`)]
              })]
            }) : T(`暂无消费金额`)
          }]
        })]
      }), (0, z.jsx)(at, {
        result: Z,
        pageSize: ye,
        supplierSide: s,
        pendingOnly: c,
        resourceType: B,
        ccmaxVisible: V,
        mayReplace: H || Xe || On.maySelect,
        projectNames: Tn,
        replacementSelected: S,
        setReplacementSelected: C,
        renderResourceActions: Wn,
        onSelect: e => I(e) ? et(e) : Y(e)
      }), (0, z.jsx)(m, {
        data: Z.error ? null : Z.data,
        loading: Z.loading,
        queryKey: cn.toString(),
        page: _e,
        onPage: L,
        size: ye,
        onSizeChange: e => {
          Se(e), L(1)
        }
      })]
    }), d && (0, z.jsx)(R.Suspense, {
      fallback: (0, z.jsx)(b, {}),
      children: (0, z.jsx)(bt, {
        onClose: () => p(!1)
      })
    }), h && Xe && de.role === `ADMIN` && (0, z.jsx)(R.Suspense, {
      fallback: (0, z.jsx)(b, {}),
      children: (0, z.jsx)(xt, {
        selectedIds: [...S.keys()],
        filterQuery: ln.toString(),
        onClose: () => _(!1)
      })
    }), Ze && (0, z.jsx)(pt, {
      resource: Ze,
      onClose: () => Qe(null),
      onAssigned: () => {
        Qe(null), P(T(`项目分配成功，资源已移入交付列表和资源列表`)), F()
      }
    }), $e && (0, z.jsx)(ft, {
      resource: $e,
      onClose: () => et(null),
      onAssign: N(`resource.intake.manage`) && N(`resource.write`) && $e.assignmentState === `UNASSIGNED` ? () => {
        Qe($e), et(null)
      } : void 0
    }), On.dialogs, E && (0, z.jsx)(qe, {
      resources: E,
      onClose: () => D(null),
      onCreated: e => {
        D(null), C(new Map), le(e), F()
      }
    }), ee && (0, z.jsx)(Je, {
      onClose: () => ne(!1),
      onOpen: e => {
        ne(!1), le(e)
      }
    }), ce && (0, z.jsx)(Ye, {
      id: ce,
      onClose: () => {
        le(null), F()
      },
      onCompleted: F
    }), v && (0, z.jsx)(Tt, {
      initialSupplierId: de.supplierId,
      onClose: () => x(!1),
      onSaved: F,
      onOpen: e => {
        x(!1), Y(e)
      }
    }), Dt && (0, z.jsx)(Ct, {
      resource: Dt,
      prefill: Mn,
      onClose: () => {
        J(null), Nn(null), jn && o(`deliveries`)
      },
      onSaved: () => F(),
      onApiDelivery: () => {
        J(null), l()
      }
    }), X && (0, z.jsxs)(a, {
      title: X.action === `EDIT` ? T(`核对后编辑`) : T(`核对后删除`),
      onClose: () => {
        Yt.current || Wt(null)
      },
      children: [(0, z.jsx)(`p`, {
        children: X.resource.name
      }), (0, z.jsx)(y, {
        tone: `amber`,
        children: T(`本次交付结果尚未确认。请先在CCMAX核实没有创建成功；已有账号或无法确认时，请勿继续，以免重复交付或遗漏账号。 `)
      }), (0, z.jsxs)(`label`, {
        className: `check-row`,
        children: [(0, z.jsx)(`input`, {
          type: `checkbox`,
          checked: Gt,
          disabled: qt,
          onChange: e => Kt(e.target.checked)
        }), T(`我已核实CCMAX未创建该资源，确认本次交付失败 `)]
      }), Xt && (0, z.jsx)(y, {
        tone: `red`,
        children: Xt
      }), (0, z.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, z.jsx)(A, {
          disabled: qt,
          onClick: () => Wt(null),
          children: T(`取消 `)
        }), (0, z.jsx)(A, {
          variant: X.action === `DELETE` ? `danger` : `primary`,
          disabled: !Gt || qt,
          onClick: () => void $t(),
          children: qt ? T(`处理中…`) : X.action === `EDIT` ? T(`确认并编辑`) : T(`确认并删除`)
        })]
      })]
    }), Ht && (0, z.jsxs)(a, {
      title: T(`删除资源`),
      onClose: () => {
        an.current || Ut(null)
      },
      children: [(0, z.jsxs)(`p`, {
        children: [Ht.name, T(`：标记删除并从列表隐藏，记录保留。`)]
      }), nn && (0, z.jsx)(y, {
        tone: `red`,
        children: nn
      }), (0, z.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, z.jsx)(A, {
          disabled: en,
          onClick: () => Ut(null),
          children: T(`取消 `)
        }), (0, z.jsx)(A, {
          className: `danger-quiet`,
          disabled: en,
          onClick: () => void Hn(),
          children: T(en ? `标记中…` : `确认删除`)
        })]
      })]
    }), linkNativeAccount && z.jsx(NativeCcmaxLinkDialog, { onClose: () => setLinkNativeAccount(false), onLinked: resource => { setLinkNativeAccount(false); P(`CCMAX 账号关联成功`); F(); Y(resource); } }), linkChannel && z.jsx(NewApiLinkDialog, { onClose: () => setLinkChannel(false), onLinked: resource => { setLinkChannel(false); P(`渠道关联成功`); F(); Y(resource); } }), Ot && (isNativeCcmax(Ot) ? z.jsx(NativeCcmaxDialog, { resource: Ot, onClose: () => Y(null), onChanged: () => { F(); } }, Ot.id) : isNewApi(Ot) ? z.jsx(NewApiChannelDialog, { resource: Ot, onClose: () => Y(null), onChanged: () => { F(); } }, Ot.id) : (0, z.jsx)(wt, {
      resource: Ot,
      supplierSide: s,
      onReauthorize: e => Pt(e, !1, !0),
      onRecover: (e, t) => {
        Y(null), Qt(e, t)
      },
      onRefreshCredential: e => Pt(e, !0, !0),
      onClose: () => Y(null),
      onEdit: e => {
        J(e), Y(null)
      },
      onChanged: () => {
        F(), Y(null)
      }
    }, Ot.id)), kt && (0, z.jsx)(ut, {
      resource: kt,
      onClose: Ft,
      onChanged: () => zn(kt.id),
      onReauthorize: () => {
        Mt(kt), At(null)
      }
    }), jt && (0, z.jsx)(vt, {
      resource: jt,
      onClose: Ft,
      onChanged: () => zn(jt.id)
    }, jt.id)]
  })
}
var Ct = (0, R.lazy)(() => x(() => import(`./ResourceForm-CV4-f1sb.js`).then(e => ({
    default: e.ResourceForm
  })), __vite__mapDeps([8, 1, 2, 9, 10, 7]))),
  wt = (0, R.lazy)(() => x(() => import(`./ResourceDetail-PGeCmPlL.js`).then(e => ({
    default: e.ResourceDetail
  })), __vite__mapDeps([11, 1, 2, 10, 7]))),
  Tt = (0, R.lazy)(() => x(() => import(`./CcmaxBatchDelivery-BSCydCTL.js`), __vite__mapDeps([12, 1, 2, 9]))),
  Et = h({
    default: () => J
  }),
  Dt = (0, R.lazy)(() => x(() => import(`./NewDelivery-CYrGthQl.js`), __vite__mapDeps([13, 1, 2, 14])));

function J({
  supplierSide: e,
  pendingOnly: t = !1
}) {
  let [n, i] = (0, R.useState)(!1), [a, o] = (0, R.useState)(null), {
    refresh: s
  } = r();
  return (0, z.jsxs)(z.Fragment, {
    children: [(0, z.jsx)(St, {
      supplierSide: e,
      pendingOnly: t,
      onApiDelivery: () => i(!0)
    }, t ? `pending` : `assigned`), n && (0, z.jsx)(R.Suspense, {
      fallback: (0, z.jsx)(b, {}),
      children: (0, z.jsx)(Dt, {
        onClose: () => i(!1),
        onSaved: () => {
          i(!1), s()
        },
        onCcmax: e ? () => {
          i(!1), o(`new`)
        } : void 0
      })
    }), a && (0, z.jsx)(R.Suspense, {
      fallback: (0, z.jsx)(b, {}),
      children: (0, z.jsx)(Ot, {
        resource: a,
        prefill: null,
        onClose: () => o(null),
        onSaved: s,
        onApiDelivery: () => {
          o(null), i(!0)
        }
      })
    })]
  })
}
var Ot = (0, R.lazy)(() => x(() => import(`./ResourceForm-CV4-f1sb.js`).then(e => ({
  default: e.ResourceForm
})), __vite__mapDeps([8, 1, 2, 9, 10, 7])));
export {
  Ye as a, Me as c, J as
  default, it as i, _t as n, Je as o, gt as r, Ne as s, Et as t
};
