// origin: assets/NewDelivery-CYrGthQl.js
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
  vt as d,
  x as ee
} from "./index-Dnr0i-H9.js";
import {
  c as te,
  s as ne
} from "./Resources-CXo1DF00.js";
var f = d(i(), 1),
  p = r(),
  m = 1048576;

function h(e) {
  let t;
  try {
    t = JSON.parse(e.replace(/^﻿/, ``))
  } catch {
    throw Error(o(`JSON 语法无效，请选择有效的服务账号 JSON 文件。`))
  }
  if (!t || typeof t != `object` || Array.isArray(t)) throw Error(o(`服务账号 JSON 须为对象。`));
  let n = t;
  if (n.type !== `service_account`) throw Error(o(`请选择 Google 服务账号 JSON（type 为 service_account）。`));
  for (let e of [`project_id`, `client_email`, `private_key`])
    if (typeof n[e] != `string` || !n[e].trim()) throw Error(o(`服务账号 JSON 缺少必要字段 {0}。`, [e]));
  if (JSON.stringify(n).length > 64e3) throw Error(o(`服务账号 JSON 内容过长，整理后的内容不能超过 64,000 字符。`));
  return n
}
async function re(e) {
  if (e.size > m) throw Error(o(`JSON 文件不能超过 1 MiB。`));
  return h(await e.text())
}

function ie({
  value: e,
  disabled: t,
  scope: n,
  onChange: r,
  onUpload: i
}) {
  let [a, s] = (0, f.useState)(``), c = null;
  try {
    c = e.trim() ? h(e) : null
  } catch {}
  return (0, p.jsxs)(`div`, {
    className: `field field-wide`,
    children: [(0, p.jsx)(`span`, {
      children: o(`服务账号 JSON`)
    }), (0, p.jsxs)(`div`, {
      className: `smart-row-actions`,
      children: [(0, p.jsxs)(`label`, {
        className: `file-button smart-file-trigger`,
        children: [o(`上传 JSON 文件 `), (0, p.jsx)(`input`, {
          type: `file`,
          accept: `.json,application/json`,
          "aria-label": o(`{0}上传 JSON 文件`, [n]),
          disabled: t,
          onChange: e => {
            let t = e.target.files?.[0];
            e.target.value = ``, t && i(t).then(e => {
              e && s(t.name)
            })
          }
        })]
      }), a && (0, p.jsxs)(`span`, {
        className: `smart-selected-file`,
        children: [o(`已读取：`), a]
      })]
    }), (0, p.jsx)(`textarea`, {
      rows: 4,
      "aria-label": o(`{0}服务账号 JSON`, [n]),
      autoComplete: `off`,
      spellCheck: !1,
      disabled: t,
      placeholder: o(`上传服务账号 JSON 文件，或在这里粘贴完整 JSON`),
      value: e,
      onChange: e => {
        s(``), r(e.target.value)
      }
    }), (0, p.jsx)(`small`, {
      className: `muted`,
      children: o(`文件在本地读取并填入当前资料，确认交付时一并提交。支持 JSON 文件，最大 1 MiB。 `)
    }), c && (0, p.jsxs)(`small`, {
      className: `muted`,
      children: [o(`项目：`), String(c.project_id), o(` · 服务账号：`), String(c.client_email)]
    })]
  })
}
var g = [{
  value: `1`,
  label: `OpenAI`
}, {
  value: `3`,
  label: `Azure OpenAI`
}, {
  value: `14`,
  label: `Anthropic`
}, {
  value: `24`,
  label: `Google Gemini`
}, {
  value: `33`,
  label: `AWS Bedrock`
}, {
  value: `41`,
  label: `Google Vertex`
}, {
  value: `60`,
  label: `NewAPI`
}];

function _({
  onClose: r,
  onSaved: i,
  onCcmax: d
}) {
  let {
    user: m,
    notify: _
  } = e(), v = !m.supplierId, y = te(!!d), [b, x] = (0, f.useState)(m.supplierId), [S, ae] = (0, f.useState)(``), C = n(v ? `/suppliers?page=1&size=100&search=${encodeURIComponent(S)}` : null), [w, oe] = (0, f.useState)(`smart`), [T, E] = (0, f.useState)(`smart`), [D, O] = (0, f.useState)(``), [k, se] = (0, f.useState)(`auto`), [A, j] = (0, f.useState)([]), [ce, M] = (0, f.useState)(!1), [N, le] = (0, f.useState)(`1`), [P, ue] = (0, f.useState)(``), [F, de] = (0, f.useState)(`batch`), [fe, pe] = (0, f.useState)(`random`), [I, L] = (0, f.useState)(``), [R, me] = (0, f.useState)(``), [z, B] = (0, f.useState)(``), [V, he] = (0, f.useState)(`api_key`), [H, U] = (0, f.useState)(``), [W, G] = (0, f.useState)(``), [K, q] = (0, f.useState)(``), [J, Y] = (0, f.useState)(!1), X = (0, f.useRef)(!1), Z = (0, f.useRef)(0), [ge] = (0, f.useState)(() => crypto.randomUUID()), [Q, _e] = (0, f.useState)(null), $ = () => {
    Z.current++, _e(null), q(``)
  };

  function ve() {
    if (T === `grouped`) {
      if (!A.length) throw Error(o(`请先识别交付资料。`));
      return {
        requests: A.map(e => ({
          ...e,
          channel: {
            ...e.channel,
            models: z.trim()
          }
        }))
      }
    }
    if (T === `smart`) throw Error(o(`请先识别资料，再核对并提交。`));
    if (T === `json`) {
      let e;
      try {
        e = JSON.parse(W)
      } catch {
        throw Error(o(`NewAPI 资料不是有效的 JSON，请核对后重试。`))
      }
      if (!e || typeof e != `object` || Array.isArray(e)) throw Error(o(`请粘贴包含 mode 和 channel 的 NewAPI 资料对象。`));
      return e
    }
    let e = N === `41` && V === `service_account`,
      t = e ? JSON.stringify(h(H)) : I.trim();
    if (!t) throw Error(o(`请填写交付凭据。`));
    if (N === `3` && !R.trim()) throw Error(o(`Azure 交付需要填写 Endpoint 地址。`));
    return {
      mode: e ? `single` : F,
      multi_key_mode: fe,
      channel: {
        type: Number(N),
        name: P.trim() || o(`供应商交付`),
        key: t,
        base_url: R.trim(),
        models: z.trim(),
        ...N === `41` ? {
          settings: JSON.stringify({
            vertex_key_type: V
          })
        } : {}
      }
    }
  }
  async function ye(e) {
    if (X.current) return;
    $();
    let t = Z.current;
    X.current = !0, Y(!0);
    try {
      if (!/\.(txt|json)$/i.test(e.name) || e.size > 2e5) throw Error(o(`请上传 200 KB 以内的 TXT 或 JSON 文件。`));
      let n = new Uint8Array(await e.arrayBuffer());
      if (!n.length || n.includes(0)) throw Error(o(`请选择有内容的文本文件。`));
      let r;
      try {
        r = new TextDecoder(`utf-8`, {
          fatal: !0
        }).decode(n)
      } catch {
        throw Error(o(`文件编码不是 UTF-8，请另存为 UTF-8 后重试。`))
      }
      t === Z.current && (w === `smart` ? (O(r), j([]), E(`smart`)) : L(r))
    } catch (e) {
      q(e.message)
    } finally {
      X.current = !1, Y(!1)
    }
  }
  async function be() {
    if (X.current) return;
    $(), X.current = !0, Y(!0);
    let e = Z.current;
    try {
      let t = await c(`/resource-intakes/recognize`, {
        text: D,
        channelType: k === `auto` ? null : Number(k)
      });
      if (e !== Z.current) return;
      if (!t.recognized || !t.request) throw Error(t.message ? s(t.message) : o(`请确认资源类型后重试。`));
      let n = t.request;
      `requests` in n ? (j(n.requests), E(`grouped`)) : (j([n]), t.raw || n.channel.type === 41 ? (G(JSON.stringify(n, null, 2)), E(`json`)) : (B(n.channel.models || ``), E(`grouped`))), _(o(`已识别资料，请核对后提交交付`))
    } catch (t) {
      e === Z.current && q(t.message)
    } finally {
      X.current = !1, Y(!1)
    }
  }
  async function xe() {
    if (X.current) return;
    if (q(``), v && !b) {
      q(o(`请先选择交付供应商。`));
      return
    }
    X.current = !0, Y(!0);
    let e = Z.current;
    try {
      let t = ve(),
        n = await c(`/resource-intakes/preview`, t);
      e === Z.current && _e({
        request: t,
        result: n,
        revision: e
      })
    } catch (t) {
      e === Z.current && q(t.message)
    } finally {
      X.current = !1, Y(!1)
    }
  }
  async function Se() {
    if (Q && Q.revision === Z.current && !X.current) {
      X.current = !0, Y(!0), q(``);
      try {
        let e = await c(`/resource-intakes`, {
          request: Q.request,
          requestKey: ge,
          supplierId: b,
          name: P
        });
        L(``), U(``), G(``), O(``), j([]), _(o(`交付成功，共 {0} 条资源，待分配报价项目`, [e.resourceIds.length])), i()
      } catch (e) {
        q(e.message)
      } finally {
        X.current = !1, Y(!1)
      }
    }
  }
  return (0, p.jsxs)(t, {
    title: o(`新增交付`),
    wide: !0,
    className: `intake-delivery-dialog`,
    onClose: () => {
      J || r()
    },
    children: [K && (0, p.jsx)(a, {
      tone: `red`,
      children: K
    }), (0, p.jsx)(ne, {
      access: y
    }), ce && (0, p.jsxs)(`section`, {
      className: `card stack`,
      children: [(0, p.jsx)(a, {
        tone: `amber`,
        children: o(`切换到 CCMAX 会清除当前未提交资料。`)
      }), (0, p.jsxs)(`div`, {
        className: `actions`,
        children: [(0, p.jsx)(l, {
          onClick: () => M(!1),
          children: o(`继续填写`)
        }), (0, p.jsx)(l, {
          disabled: !y.allowed,
          onClick: d,
          children: o(`确认切换`)
        })]
      })]
    }), (0, p.jsxs)(`fieldset`, {
      className: `form-grid`,
      disabled: J,
      children: [d && (0, p.jsxs)(`label`, {
        className: `field`,
        children: [(0, p.jsx)(`span`, {
          children: o(`交付方式`)
        }), (0, p.jsx)(u, {
          value: `api`,
          ariaLabel: o(`交付方式`),
          options: [{
            value: `api`,
            label: o(`NewAPI 资源交付`)
          }, {
            value: `ccmax`,
            label: o(`CCMAX 交付`),
            disabled: !y.allowed
          }],
          onChange: e => {
            e === `ccmax` && y.allowed && (I || H || W || D ? M(!0) : d())
          }
        })]
      }), v && (0, p.jsxs)(`label`, {
        className: `field`,
        children: [(0, p.jsx)(`span`, {
          children: o(`交付供应商`)
        }), (0, p.jsx)(u, {
          value: b,
          ariaLabel: o(`交付供应商`),
          searchPlaceholder: o(`搜索供应商`),
          disabled: C.loading || !!C.error,
          options: [{
            value: ``,
            label: o(`请选择供应商`)
          }, ...(C.data?.items || []).map(e => ({
            value: e.id,
            label: e.name
          }))],
          onChange: e => {
            $(), x(e)
          }
        }), ((C.data?.total || 0) > 100 || S) && (0, p.jsx)(`input`, {
          type: `search`,
          "aria-label": o(`搜索更多供应商`),
          placeholder: o(`输入名称查询更多供应商`),
          value: S,
          onChange: e => {
            $(), x(``), ae(e.target.value)
          }
        }), C.error && (0, p.jsx)(`small`, {
          role: `alert`,
          children: C.error
        })]
      }), (0, p.jsxs)(`label`, {
        className: `field`,
        children: [(0, p.jsx)(`span`, {
          children: o(`名称（选填）`)
        }), (0, p.jsx)(`input`, {
          value: P,
          maxLength: 100,
          placeholder: o(`便于后续识别这份交付`),
          onChange: e => {
            $(), ue(e.target.value)
          }
        })]
      })]
    }), (0, p.jsx)(ee, {
      value: w,
      items: [{
        id: `smart`,
        label: o(`智能录入`)
      }, {
        id: `fields`,
        label: o(`手动填写`)
      }],
      onChange: e => {
        J || ($(), oe(e), E(e), j([]))
      }
    }), (0, p.jsxs)(`fieldset`, {
      className: `form-grid`,
      disabled: J,
      children: [w === `smart` && (0, p.jsxs)(p.Fragment, {
        children: [(0, p.jsxs)(`label`, {
          className: `field`,
          children: [(0, p.jsx)(`span`, {
            children: o(`提供商`)
          }), (0, p.jsx)(u, {
            value: k,
            ariaLabel: o(`智能录入资源类型`),
            options: [{
              value: `auto`,
              label: o(`自动识别`)
            }, ...g],
            onChange: e => {
              $(), se(e), E(`smart`), j([])
            }
          })]
        }), (0, p.jsxs)(`label`, {
          className: `field intake-delivery-wide`,
          children: [(0, p.jsx)(`span`, {
            children: o(`粘贴交付资料`)
          }), (0, p.jsx)(`textarea`, {
            rows: A.length ? 3 : 6,
            autoComplete: `off`,
            spellCheck: !1,
            value: D,
            placeholder: o(`支持每行一个 Key、Key----Endpoint、地址与 Key 分行、Vertex 服务账号 JSON 或完整 NewAPI 请求。无法唯一识别时请选择资源类型。`),
            onChange: e => {
              $(), O(e.target.value), E(`smart`), j([])
            }
          })]
        }), (0, p.jsx)(`div`, {
          className: `intake-delivery-wide`,
          children: (0, p.jsx)(l, {
            disabled: J || !D.trim(),
            onClick: () => void be(),
            children: J ? o(`正在识别…`) : A.length ? o(`重新识别`) : o(`识别资料`)
          })
        })]
      }), w === `smart` && A.length > 0 && (0, p.jsxs)(p.Fragment, {
        children: [(0, p.jsxs)(`section`, {
          className: `intake-delivery-wide intake-recognized`,
          "aria-label": o(`已识别资源`),
          children: [(0, p.jsx)(`h3`, {
            children: o(`已识别资源`)
          }), (0, p.jsx)(`div`, {
            className: `table-scroll`,
            children: (0, p.jsxs)(`table`, {
              children: [(0, p.jsx)(`thead`, {
                children: (0, p.jsxs)(`tr`, {
                  children: [(0, p.jsx)(`th`, {
                    children: o(`类型`)
                  }), (0, p.jsx)(`th`, {
                    children: o(`API 地址`)
                  }), (0, p.jsx)(`th`, {
                    children: o(`密钥数量`)
                  })]
                })
              }), (0, p.jsx)(`tbody`, {
                children: A.map((e, t) => (0, p.jsxs)(`tr`, {
                  children: [(0, p.jsx)(`td`, {
                    children: g.find(t => t.value === String(e.channel.type))?.label || `—`
                  }), (0, p.jsx)(`td`, {
                    className: `intake-batch-endpoint`,
                    children: e.channel.base_url?.split(/[?#]/)[0] || o(`默认地址`)
                  }), (0, p.jsx)(`td`, {
                    children: e.mode === `batch` ? e.channel.key.split(`
`).filter(Boolean).length : 1
                  })]
                }, t))
              })]
            })
          })]
        }), T === `grouped` && (0, p.jsxs)(`label`, {
          className: `field intake-delivery-wide`,
          children: [(0, p.jsx)(`span`, {
            children: o(`模型（应用于本次全部资源，选填）`)
          }), (0, p.jsx)(`input`, {
            value: z,
            placeholder: o(`多个模型用逗号分隔`),
            onChange: e => {
              $(), B(e.target.value)
            }
          })]
        })]
      }), w === `fields` && (0, p.jsxs)(p.Fragment, {
        children: [(0, p.jsxs)(`label`, {
          className: `field`,
          children: [(0, p.jsx)(`span`, {
            children: o(`提供商`)
          }), (0, p.jsx)(u, {
            value: N,
            ariaLabel: o(`提供商`),
            options: g,
            onChange: e => {
              $(), le(e)
            }
          })]
        }), (0, p.jsxs)(`label`, {
          className: `field`,
          children: [(0, p.jsx)(`span`, {
            children: o(`添加模式`)
          }), (0, p.jsx)(u, {
            value: F,
            ariaLabel: o(`添加模式`),
            disabled: N === `41` && V === `service_account`,
            options: [{
              value: `single`,
              label: o(`单密钥`)
            }, {
              value: `batch`,
              label: o(`批量创建`)
            }, {
              value: `multi_to_single`,
              label: o(`多密钥`)
            }],
            onChange: e => {
              $(), de(e)
            }
          })]
        }), N === `41` && (0, p.jsxs)(`label`, {
          className: `field`,
          children: [(0, p.jsx)(`span`, {
            children: o(`凭据方式`)
          }), (0, p.jsx)(u, {
            value: V,
            ariaLabel: o(`Vertex 凭据方式`),
            options: [{
              value: `api_key`,
              label: `API Key`
            }, {
              value: `service_account`,
              label: o(`服务账号 JSON`)
            }],
            onChange: e => {
              $(), he(e)
            }
          })]
        }), F === `multi_to_single` && (0, p.jsxs)(`label`, {
          className: `field`,
          children: [(0, p.jsx)(`span`, {
            children: o(`密钥聚合模式`)
          }), (0, p.jsx)(u, {
            value: fe,
            ariaLabel: o(`密钥聚合模式`),
            options: [{
              value: `random`,
              label: o(`随机`)
            }, {
              value: `polling`,
              label: o(`轮询`)
            }],
            onChange: e => {
              $(), pe(e)
            }
          })]
        }), (0, p.jsxs)(`label`, {
          className: `field`,
          children: [(0, p.jsxs)(`span`, {
            children: [o(`API 地址`), N === `3` ? `` : o(`（选填）`)]
          }), (0, p.jsx)(`input`, {
            type: `url`,
            value: R,
            placeholder: N === `3` ? o(`https://资源名.openai.azure.com`) : `https://api.example.com`,
            onChange: e => {
              $(), me(e.target.value)
            }
          })]
        }), (0, p.jsxs)(`label`, {
          className: `field`,
          children: [(0, p.jsx)(`span`, {
            children: o(`模型（选填）`)
          }), (0, p.jsx)(`input`, {
            value: z,
            placeholder: o(`多个模型用逗号分隔`),
            onChange: e => {
              $(), B(e.target.value)
            }
          })]
        }), N === `41` && V === `service_account` ? (0, p.jsx)(ie, {
          scope: o(`交付`),
          value: H,
          disabled: J,
          onChange: e => {
            $(), U(e)
          },
          onUpload: async e => {
            $();
            try {
              return U(JSON.stringify(await re(e), null, 2)), !0
            } catch (e) {
              return q(e.message), !1
            }
          }
        }) : (0, p.jsxs)(`label`, {
          className: `field intake-delivery-wide`,
          children: [(0, p.jsx)(`span`, {
            children: o(`API 密钥`)
          }), (0, p.jsx)(`textarea`, {
            rows: 6,
            value: I,
            autoComplete: `off`,
            spellCheck: !1,
            placeholder: o(N === `33` ? `API Key，或 AccessKey|SecretKey|区域；多组凭据每行一组` : `粘贴 API Key；批量交付时每行一个`),
            onChange: e => {
              $(), L(e.target.value)
            }
          })]
        })]
      })]
    }), (0, p.jsxs)(`div`, {
      className: `intake-delivery-file-row`,
      children: [(0, p.jsxs)(`label`, {
        className: `btn secondary`,
        children: [o(`读取资料文件 `), (0, p.jsx)(`input`, {
          type: `file`,
          accept: `.txt,.json`,
          hidden: !0,
          disabled: J,
          onChange: e => {
            let t = e.target.files?.[0];
            e.target.value = ``, t && ye(t)
          }
        })]
      }), (0, p.jsx)(`small`, {
        children: o(`TXT / JSON · 最大 200 KB`)
      })]
    }), Q && (0, p.jsxs)(`section`, {
      className: `intake-delivery-review`,
      "aria-label": o(`交付资料核对结果`),
      children: [(0, p.jsxs)(`strong`, {
        children: [o(`已核对 `), Q.result.resourceCount, o(` 条资源，共 `), Q.result.keyCount, o(` 个 Key `)]
      }), (0, p.jsx)(`span`, {
        children: o(`报价项目：交付后分配`)
      })]
    }), (0, p.jsxs)(`footer`, {
      className: `dialog-footer`,
      children: [(0, p.jsx)(`span`, {
        className: `muted`,
        children: o(`提交后关联报价项目`)
      }), (0, p.jsx)(l, {
        disabled: J,
        onClick: r,
        children: o(`取消 `)
      }), (0, p.jsx)(l, {
        disabled: J || T === `smart`,
        onClick: () => void xe(),
        children: o(J ? `正在处理…` : Q ? `重新核对` : `核对资料`)
      }), (0, p.jsx)(l, {
        variant: `primary`,
        disabled: J || !Q,
        onClick: () => void Se(),
        children: o(J ? `正在处理…` : `提交交付`)
      })]
    })]
  })
}
export {
  _ as
  default
};