// origin: assets/IntakeProjectTypes-FBnV0kVR.js
import {
  C as e,
  G as t,
  S as n,
  X as r,
  Z as i,
  g as a,
  it as o,
  mt as s,
  s as c,
  vt as l
} from "./index-Dnr0i-H9.js";
var u = l(i(), 1),
  d = r(),
  f = [
    [1, s(`OpenAI 兼容`)],
    [3, `Azure`],
    [14, `Anthropic`],
    [24, `Gemini`],
    [33, `AWS`],
    [41, `Vertex`],
    [60, `NewAPI`]
  ];

function p({
  project: r,
  onClose: i
}) {
  let {
    notify: l,
    refresh: p
  } = e(), m = n(`/projects/${encodeURIComponent(r.id)}/intake-channel-types`), [h, g] = (0, u.useState)([]), [_, v] = (0, u.useState)(!1), y = (0, u.useRef)(!1), [b, x] = (0, u.useState)(``);
  (0, u.useEffect)(() => {
    m.data && g(m.data)
  }, [m.data]);
  async function S(e) {
    if (e.preventDefault(), !(y.current || m.loading || m.error)) {
      y.current = !0, v(!0), x(``);
      try {
        await o(`/projects/${encodeURIComponent(r.id)}/intake-channel-types`, h), p(), l(s(`项目适用资源类型已保存`)), i()
      } catch (e) {
        x(e.message)
      } finally {
        y.current = !1, v(!1)
      }
    }
  }
  return (0, d.jsxs)(t, {
    title: s(`接口交付适用类型`),
    subtitle: r.name,
    onClose: () => {
      _ || i()
    },
    children: [(0, d.jsx)(`p`, {
      children: s(`供应商只能将匹配类型的接口资源分配到此项目。仍需有权交付且存在有效的已审核报价。`)
    }), (b || m.error) && (0, d.jsx)(a, {
      tone: `red`,
      children: b || m.error
    }), m.loading ? (0, d.jsx)(`p`, {
      children: s(`正在加载…`)
    }) : (0, d.jsxs)(`form`, {
      onSubmit: S,
      children: [f.map(([e, t]) => (0, d.jsxs)(`label`, {
        children: [(0, d.jsx)(`input`, {
          type: `checkbox`,
          checked: h.includes(e),
          disabled: _ || !!m.error,
          onChange: t => g(n => t.target.checked ? [...n, e] : n.filter(t => t !== e))
        }), t]
      }, e)), (0, d.jsx)(c, {
        type: `submit`,
        variant: `primary`,
        disabled: _ || !!m.error,
        children: s(_ ? `正在保存…` : `保存适用类型`)
      })]
    })]
  })
}
export {
  p as
  default
};