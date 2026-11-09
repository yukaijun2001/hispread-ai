// origin: assets/OutboundProxies-BILxGplZ.js
import {
  $ as e,
  C as t,
  G as n,
  P as r,
  Q as i,
  S as a,
  W as o,
  X as s,
  Y as ee,
  Z as c,
  _ as te,
  c as l,
  g as u,
  h as ne,
  it as re,
  m as ie,
  mt as d,
  ot as f,
  rt as p,
  s as m,
  u as h,
  vt as g,
  y as ae
} from "./index-Dnr0i-H9.js";
import {
  i as oe,
  r as se
} from "./QueryFilters-CwGBc_NH.js";

function ce(e, t) {
  let n = d(`已导入 {0} 条；跳过 {1} 条。`, [e, t.length]),
    r = t.map(({
      line: e,
      reason: t
    }) => d(`第 {0} 行：{1}`, [e, f(t).replace(/[.。]$/u, ``)]));
  return r.length ? `${n} ${r.join(d(`； `))}` : n
}
var _ = g(c(), 1);
async function le(e, t, n) {
  let r = new Map,
    i = null;
  for (let a = 1; i === null || a <= Math.ceil(i / 100); a++) {
    if (t()) return null;
    let o = await e(a, 100);
    if (t()) return null;
    if (!Number.isSafeInteger(o.total) || o.total < 0 || !Array.isArray(o.items)) throw Error(d(`代理列表返回不完整，请刷新后重试`));
    if (i !== null && o.total !== i) throw Error(d(`代理列表已变化，请刷新后重新检测`));
    i = o.total;
    for (let e of o.items) r.set(e.id, e);
    n(r.size)
  }
  if (r.size !== i) throw Error(d(`代理列表返回不完整，请刷新后重试`));
  return [...r.values()]
}
async function ue(e, t, n, r, a) {
  let o = 0;
  async function s() {
    for (; !t() && o < e.length;) {
      let t = e[o++];
      try {
        let e = await r(t);
        if (e.lastTestState !== `OK` && e.lastTestState !== `FAILED`) throw Error(d(`检测结果返回不完整`));
        a({
          id: t.id,
          name: t.name,
          state: e.lastTestState,
          message: f(e.lastTestMessage || ``)
        }, e)
      } catch (e) {
        e instanceof i && (e.status === 401 || e.status === 403) && n(), a({
          id: t.id,
          name: t.name,
          state: `REQUEST_FAILED`,
          message: e instanceof Error ? e.message : d(`检测请求失败`)
        })
      }
    }
  }
  await Promise.all(Array.from({
    length: Math.min(3, e.length)
  }, s))
}
var v = s();

function y({
  platform: i = !1
}) {
  let {
    refresh: s,
    notify: c,
    has: g
  } = t(), y = oe(i && g(`supplier.read`)), [b, de] = (0, _.useState)(``), [x, S] = (0, _.useState)(``), [C, w] = (0, _.useState)(`enabled`), [T, fe] = (0, _.useState)(`all`), [pe, E] = (0, _.useState)(1), [me, he] = (0, _.useState)(50), D = a(`/outbound-proxies/page?page=${pe}&size=${me}&search=${encodeURIComponent(b)}&state=${C}&protocol=${T}${i?`&supplierSearch=${encodeURIComponent(x)}`:``}`), [O, k] = (0, _.useState)(null), [A, j] = (0, _.useState)(``), [M, ge] = (0, _.useState)(``), [N, P] = (0, _.useState)(``), [_e, ve] = (0, _.useState)(!0), [F, I] = (0, _.useState)(``), [L, R] = (0, _.useState)(!1), [z, B] = (0, _.useState)(!1), [V, H] = (0, _.useState)(``), [ye, be] = (0, _.useState)(`SOCKS5`), [xe, Se] = (0, _.useState)(``), [U, W] = (0, _.useState)(null), [G, Ce] = (0, _.useState)(null), [K, q] = (0, _.useState)(null), [we, Te] = (0, _.useState)({}), J = (0, _.useRef)(null), Y = (0, _.useRef)(!0);
  (0, _.useEffect)(() => (Y.current = !0, () => {
    Y.current = !1, J.current && (J.current.stop = !0)
  }), []), (0, _.useEffect)(() => Te({}), [D.data]);
  let X = a(U ? `/outbound-proxies/${encodeURIComponent(U.id)}/resources` : null),
    Z = !!b.trim() || i && !!x.trim() || C !== `enabled` || T !== `all`,
    Ee = (D.data?.items || []).map(e => ({
      ...e,
      ...we[e.id]
    })),
    Q = !!K && [`collecting`, `running`, `stopping`].includes(K.phase);

  function De() {
    de(``), S(``), w(`enabled`), fe(`all`), E(1)
  }
  async function Oe(e) {
    if (J.current || !e.testable) return;
    let t = {
      stop: !1
    };
    J.current = t, Ce(e.id), I(``);
    try {
      let t = await p(`/outbound-proxies/${encodeURIComponent(e.id)}/test`, {});
      if (!Y.current) return;
      ke(t), c(t.lastTestState === `OK` ? d(`代理检测通过`) : d(`代理检测失败：{0}`, [t.lastTestMessage || d(`未能连通目标地址`)]))
    } catch (e) {
      Y.current && I(e.message)
    } finally {
      J.current === t && (J.current = null), Y.current && Ce(null)
    }
  }

  function ke(e) {
    let {
      lastTestState: t,
      lastTestMessage: n,
      lastTestLatencyMs: r,
      lastTestedAt: i
    } = e;
    Te(a => ({
      ...a,
      [e.id]: {
        lastTestState: t,
        lastTestMessage: n,
        lastTestLatencyMs: r,
        lastTestedAt: i
      }
    }))
  }

  function Ae() {
    J.current && (J.current.stop = !0, q(e => e && {
      ...e,
      phase: `stopping`
    }))
  }
  async function je() {
    if (J.current || L || !g(`proxy.write`)) return;
    let t = {
      stop: !1
    };
    J.current = t, I(``), q({
      phase: `collecting`,
      collected: 0,
      total: 0,
      completed: 0,
      ok: 0,
      failed: 0,
      requestFailed: 0,
      skipped: 0,
      results: []
    });
    let n = `search=${encodeURIComponent(b)}&state=${C}&protocol=${T}${i?`&supplierSearch=${encodeURIComponent(x)}`:``}`,
      r = () => t.stop || !Y.current;
    try {
      let i = await le((t, r) => e(`/outbound-proxies/page?page=${t}&size=${r}&${n}`), r, e => {
        Y.current && q(t => t && {
          ...t,
          collected: e
        })
      });
      if (!i) {
        Y.current && q(e => e && {
          ...e,
          phase: `stopped`
        });
        return
      }
      let a = i.filter(e => e.testable);
      q(e => e && {
        ...e,
        phase: `running`,
        total: a.length,
        skipped: i.length - a.length
      }), await ue(a, r, () => {
        t.stop = !0
      }, e => p(`/outbound-proxies/${encodeURIComponent(e.id)}/test`, {}), (e, n) => {
        Y.current && (n && ke(n), q(n => n && {
          ...n,
          completed: n.completed + 1,
          ok: n.ok + +(e.state === `OK`),
          failed: n.failed + +(e.state === `FAILED`),
          requestFailed: n.requestFailed + +(e.state === `REQUEST_FAILED`),
          results: [...n.results, e],
          phase: t.stop ? `stopping` : n.phase
        }))
      }), Y.current && q(e => e && {
        ...e,
        phase: t.stop ? `stopped` : `complete`
      })
    } catch (e) {
      Y.current && (I(d(`代理列表收集失败，未开始检测：{0}`, [e instanceof Error ? e.message : d(`请求失败`)])), q(e => e && {
        ...e,
        phase: `error`
      }))
    } finally {
      J.current === t && (J.current = null)
    }
  }

  function $(e) {
    k(e), j(e === `new` ? `` : e.name), ge(``), P(e === `new` ? `` : String(e.maxResources)), ve(e === `new` || e.enabled), I(``)
  }
  async function Me() {
    if (!A.trim() || N === `` && O !== `new` || N !== `` && (!Number.isSafeInteger(Number(N)) || Number(N) < 0)) {
      I(d(`请填写代理名称和有效的绑定上限`));
      return
    }
    if (O === `new` && !o(M.trim())) {
      I(d(`请填写有效的代理 URL`));
      return
    }
    if (M.trim() && !o(M.trim())) {
      I(d(`代理地址格式不正确`));
      return
    }
    R(!0), I(``);
    try {
      let e = {
        name: A.trim(),
        url: M.trim(),
        maxResources: N === `` ? null : Number(N),
        enabled: _e
      };
      O === `new` ? await p(`/outbound-proxies`, e) : O && await re(`/outbound-proxies/${encodeURIComponent(O.id)}`, {
        ...e,
        version: O.version
      }), c(d(`代理配置已保存`)), k(null), s()
    } catch (e) {
      I(e.message)
    } finally {
      R(!1)
    }
  }
  async function Ne() {
    R(!0), I(``);
    try {
      let e = await p(`/outbound-proxies/import`, {
        lines: V,
        defaultProtocol: ye,
        maxResources: N === `` ? null : Number(N)
      });
      Se(ce(e.imported, e.skipped)), B(!1), H(``), s()
    } catch (e) {
      I(e.message)
    } finally {
      R(!1)
    }
  }
  return (0, v.jsxs)(v.Fragment, {
    children: [(0, v.jsxs)(ie, {
      title: d(i ? `代理管理` : `代理配置`),
      children: [g(`proxy.write`) && (0, v.jsx)(m, {
        disabled: Q || !!G || L,
        onClick: () => void je(),
        children: d(`批量检测 `)
      }), !i && (0, v.jsxs)(v.Fragment, {
        children: [(0, v.jsx)(m, {
          disabled: Q,
          onClick: () => {
            B(!0), P(``), I(``)
          },
          children: d(`批量导入 `)
        }), (0, v.jsx)(m, {
          variant: `primary`,
          disabled: Q,
          onClick: () => $(`new`),
          children: d(`新增代理 `)
        })]
      })]
    }), (0, v.jsxs)(`div`, {
      className: `proxy-page`,
      children: [xe && (0, v.jsx)(u, {
        tone: `blue`,
        children: xe
      }), F && !O && !z && (0, v.jsx)(u, {
        tone: `red`,
        children: F
      }), K && (0, v.jsxs)(`section`, {
        className: `panel proxy-batch`,
        "aria-label": d(`批量检测进度`),
        children: [(0, v.jsxs)(`div`, {
          className: `proxy-batch-heading`,
          children: [(0, v.jsxs)(`div`, {
            role: `status`,
            "aria-live": `polite`,
            children: [(0, v.jsx)(`strong`, {
              children: K.phase === `collecting` ? d(`正在收集当前筛选的全部代理`) : K.phase === `stopping` ? d(`正在停止检测，等待在途请求完成`) : K.phase === `running` ? d(`批量检测中`) : K.phase === `stopped` ? d(`批量检测已停止`) : K.phase === `error` ? d(`批量检测未开始`) : d(`批量检测完成`)
            }), (0, v.jsx)(`p`, {
              children: K.phase === `collecting` ? d(`已读取 {0} 条`, [K.collected]) : d(`已完成 {0} / {1} · 正常 {2} · 失败 {3} · 请求失败 {4} · 无检测权限 {5}`, [K.completed, K.total, K.ok, K.failed, K.requestFailed, K.skipped])
            })]
          }), Q ? (0, v.jsx)(m, {
            disabled: K.phase === `stopping`,
            onClick: Ae,
            children: d(`停止检测 `)
          }) : (0, v.jsx)(m, {
            onClick: () => q(null),
            children: d(`收起`)
          })]
        }), K.phase !== `collecting` && K.total > 0 && (0, v.jsx)(`progress`, {
          "aria-label": d(`检测完成进度`),
          max: K.total,
          value: K.completed
        }), (0, v.jsx)(`p`, {
          className: `proxy-batch-hint`,
          children: d(`按启动时的筛选条件检测全部分页；停止后，已发出的请求继续完成。 `)
        }), K.results.length > 0 && (0, v.jsx)(`div`, {
          className: `proxy-batch-results`,
          role: `list`,
          "aria-label": d(`逐条检测结果`),
          children: K.results.map(e => (0, v.jsxs)(`div`, {
            role: `listitem`,
            children: [(0, v.jsx)(`strong`, {
              children: e.name
            }), (0, v.jsx)(`span`, {
              className: `proxy-status ${e.state===`OK`?`ok`:`failed`}`,
              children: e.state === `OK` ? d(`正常`) : e.state === `FAILED` ? d(`失败`) : d(`请求失败`)
            }), e.message && (0, v.jsx)(`span`, {
              children: e.message
            })]
          }, e.id))
        })]
      }), (0, v.jsxs)(`div`, {
        className: `proxy-overview`,
        children: [(0, v.jsxs)(`div`, {
          children: [(0, v.jsx)(`strong`, {
            children: d(i ? `全部供应商代理` : `代理池`)
          }), (0, v.jsx)(`span`, {
            children: d(i ? `查看各供应商的代理归属，并可检测连通性。检测失败不会自动停用。` : `每条代理独立设置绑定上限。`)
          })]
        }), !D.loading && !D.error && D.data && (0, v.jsxs)(`span`, {
          className: `proxy-total`,
          children: [D.data.total, d(` 条代理`)]
        })]
      }), (0, v.jsxs)(`div`, {
        className: `proxy-filterbar`,
        role: `search`,
        "aria-label": d(`筛选代理`),
        children: [(0, v.jsxs)(`div`, {
          className: `proxy-filter-search`,
          children: [(0, v.jsx)(`span`, {
            children: d(`搜索`)
          }), (0, v.jsx)(ae, {
            value: b,
            onChange: e => {
              de(e), E(1)
            },
            placeholder: d(`代理名称或可见出口`)
          })]
        }), i && (0, v.jsxs)(`div`, {
          className: `proxy-filter-search`,
          children: [(0, v.jsx)(`span`, {
            children: d(`供应商`)
          }), (0, v.jsx)(se, {
            value: x,
            onChange: e => {
              S(e), E(1)
            },
            options: (y.data?.items || []).map(e => ({
              value: e.id,
              label: e.name,
              detail: e.code
            })),
            loading: y.loading,
            error: y.error,
            fallbackToText: !g(`supplier.read`)
          })]
        }), (0, v.jsxs)(`div`, {
          className: `proxy-filter-select`,
          children: [(0, v.jsx)(`span`, {
            children: d(`状态`)
          }), (0, v.jsx)(h, {
            value: C,
            onChange: e => {
              w(e), E(1)
            },
            ariaLabel: d(`代理状态`),
            options: [{
              value: `all`,
              label: d(`全部状态`)
            }, {
              value: `enabled`,
              label: d(`启用`)
            }, {
              value: `disabled`,
              label: d(`停用`)
            }]
          })]
        }), (0, v.jsxs)(`div`, {
          className: `proxy-filter-select`,
          children: [(0, v.jsx)(`span`, {
            children: d(`协议`)
          }), (0, v.jsx)(h, {
            value: T,
            onChange: e => {
              fe(e), E(1)
            },
            ariaLabel: d(`代理协议`),
            options: [{
              value: `all`,
              label: d(`全部协议`)
            }, {
              value: `SOCKS5`,
              label: `SOCKS5`
            }, {
              value: `HTTP`,
              label: `HTTP`
            }, {
              value: `HTTPS`,
              label: `HTTPS`
            }]
          })]
        }), Z && (0, v.jsx)(m, {
          className: `proxy-reset`,
          onClick: De,
          children: d(`重置筛选 `)
        })]
      }), (0, v.jsxs)(`section`, {
        className: `panel proxy-list`,
        "aria-label": d(`代理列表`),
        children: [D.error ? (0, v.jsx)(`div`, {
          className: `proxy-list-message`,
          children: (0, v.jsx)(u, {
            tone: `red`,
            children: D.error
          })
        }) : D.loading ? (0, v.jsx)(ne, {}) : Ee.length ? (0, v.jsxs)(v.Fragment, {
          children: [(0, v.jsx)(l, {
            data: Ee,
            onRow: W,
            columns: [{
              label: d(`代理 / 地址`),
              render: e => (0, v.jsxs)(`div`, {
                className: `proxy-identity`,
                children: [(0, v.jsx)(`strong`, {
                  children: e.name
                }), (0, v.jsx)(`span`, {
                  children: e.endpoint
                })]
              })
            }, ...i ? [{
              label: d(`所属供应商`),
              render: e => `${e.supplierName||`—`}${e.supplierCode?d(`（{0}）`,[e.supplierCode]):``}`
            }, {
              label: d(`创建人`),
              render: e => e.creatorName || d(`未知创建人`)
            }] : [], {
              label: d(`协议`),
              render: e => (0, v.jsx)(`span`, {
                className: `proxy-protocol`,
                children: e.protocol
              })
            }, {
              label: d(`状态`),
              render: e => (0, v.jsxs)(`span`, {
                className: `proxy-status ${e.enabled?`enabled`:`disabled`}`,
                children: [(0, v.jsx)(`i`, {
                  "aria-hidden": `true`
                }), e.enabled ? d(`启用`) : d(`停用`)]
              })
            }, {
              label: d(`检测`),
              render: e => (0, v.jsxs)(`div`, {
                className: `proxy-test`,
                children: [(0, v.jsxs)(`span`, {
                  className: `proxy-status ${e.lastTestState===`OK`?`ok`:e.lastTestState===`FAILED`?`failed`:`untested`}`,
                  children: [(0, v.jsx)(`i`, {
                    "aria-hidden": `true`
                  }), e.lastTestState === `OK` ? d(`正常`) : e.lastTestState === `FAILED` ? d(`失败`) : d(`未检测`)]
                }), e.lastTestState && (0, v.jsxs)(`small`, {
                  children: [e.lastTestLatencyMs == null ? `` : `${e.lastTestLatencyMs} ms`, e.lastTestedAt ? `${e.lastTestLatencyMs==null?``:` · `}${r(e.lastTestedAt)}` : ``]
                }), e.lastTestMessage && (0, v.jsx)(`small`, {
                  children: f(e.lastTestMessage)
                })]
              })
            }, {
              label: d(`占用 / 上限`),
              render: e => (0, v.jsxs)(`div`, {
                className: `proxy-usage`,
                children: [(0, v.jsxs)(`strong`, {
                  children: [e.usedResources + e.reservedResources, ` /`, ` `, e.maxResources === 0 ? d(`不限`) : e.maxResources]
                }), e.reservedResources > 0 && (0, v.jsxs)(`span`, {
                  children: [d(`含 `), e.reservedResources, d(` 个预占`)]
                })]
              })
            }, {
              label: d(`操作`),
              render: e => (0, v.jsxs)(`div`, {
                className: `proxy-row-actions`,
                children: [e.testable && (0, v.jsx)(`button`, {
                  className: `text-button`,
                  disabled: !!G || Q,
                  onClick: t => {
                    t.stopPropagation(), Oe(e)
                  },
                  children: G === e.id ? d(`检测中…`) : d(`检测`)
                }), (0, v.jsx)(`button`, {
                  className: `text-button`,
                  onClick: t => {
                    t.stopPropagation(), W(e)
                  },
                  children: d(`绑定资源 `)
                }), e.editable && (0, v.jsx)(`button`, {
                  className: `text-button`,
                  disabled: Q,
                  onClick: t => {
                    t.stopPropagation(), $(e)
                  },
                  children: d(`配置 `)
                })]
              })
            }]
          }), (0, v.jsx)(te, {
            data: D.data,
            page: pe,
            onPage: E,
            size: me,
            onSizeChange: e => {
              he(e), E(1)
            }
          })]
        }) : (0, v.jsxs)(`div`, {
          className: `proxy-empty`,
          children: [(0, v.jsx)(`div`, {
            className: `proxy-empty-icon`,
            "aria-hidden": `true`,
            children: (0, v.jsx)(ee, {
              name: Z ? `search` : `settings`,
              size: 25
            })
          }), (0, v.jsx)(`strong`, {
            children: d(Z ? `没有找到匹配的代理` : `暂无启用代理`)
          }), (0, v.jsx)(`p`, {
            children: d(Z ? `试试其他名称、供应商、状态或协议，或清除当前筛选条件。` : i ? `供应商添加并启用代理后，会显示在这里；也可切换状态筛选查看全部代理。` : `添加或启用代理后，可在交付时选择；也可切换状态筛选查看全部代理。`)
          }), Z ? (0, v.jsx)(m, {
            onClick: De,
            children: d(`清除筛选`)
          }) : i ? null : (0, v.jsxs)(`div`, {
            className: `proxy-empty-actions`,
            children: [(0, v.jsx)(m, {
              variant: `primary`,
              icon: `plus`,
              disabled: Q,
              onClick: () => $(`new`),
              children: d(`新增代理 `)
            }), (0, v.jsx)(m, {
              disabled: Q,
              onClick: () => {
                B(!0), I(``)
              },
              children: d(`批量导入 `)
            })]
          })]
        }), (0, v.jsx)(`div`, {
          className: `proxy-list-caption`,
          children: d(`点击代理可查看绑定资源；地址按当前账号权限展示。检测只说明当次能否经该代理连出，不会自动停用。 `)
        })]
      })]
    }), O && (0, v.jsxs)(n, {
      title: d(O === `new` ? `新增代理` : `配置代理`),
      onClose: () => k(null),
      children: [(0, v.jsxs)(`div`, {
        className: `form-grid`,
        children: [(0, v.jsxs)(`label`, {
          className: `field`,
          children: [(0, v.jsx)(`span`, {
            children: d(`名称`)
          }), (0, v.jsx)(`input`, {
            maxLength: 128,
            value: A,
            onChange: e => j(e.target.value)
          })]
        }), (0, v.jsxs)(`label`, {
          className: `field`,
          children: [(0, v.jsx)(`span`, {
            children: d(`代理 URL`)
          }), (0, v.jsx)(`input`, {
            type: `password`,
            autoComplete: `new-password`,
            value: M,
            onChange: e => ge(e.target.value),
            placeholder: O === `new` ? `socks5://user:pass@host:1080` : d(`留空表示保持原地址`)
          }), (0, v.jsx)(`small`, {
            children: d(`支持 SOCKS5、HTTP、HTTPS，用于 CCMAX 交付。认证信息加密保存，不回显。 已有资源绑定时不可修改地址。 `)
          })]
        }), (0, v.jsxs)(`label`, {
          className: `field`,
          children: [(0, v.jsx)(`span`, {
            children: d(`最多绑定资源数`)
          }), (0, v.jsx)(`input`, {
            type: `number`,
            min: `0`,
            value: N,
            placeholder: O === `new` ? d(`使用平台默认值`) : void 0,
            onChange: e => P(e.target.value)
          }), (0, v.jsxs)(`small`, {
            children: [O === `new` && d(`留空使用平台默认值。`), d(`0 表示不限；每条已交付资源占一个名额。`)]
          })]
        }), (0, v.jsxs)(`label`, {
          className: `field`,
          children: [(0, v.jsx)(`span`, {
            children: d(`状态`)
          }), (0, v.jsxs)(`select`, {
            value: _e ? `true` : `false`,
            onChange: e => ve(e.target.value === `true`),
            children: [(0, v.jsx)(`option`, {
              value: `true`,
              children: d(`启用`)
            }), (0, v.jsx)(`option`, {
              value: `false`,
              children: d(`停用`)
            })]
          })]
        })]
      }), F && (0, v.jsx)(u, {
        tone: `red`,
        children: F
      }), (0, v.jsxs)(`footer`, {
        className: `dialog-footer`,
        children: [(0, v.jsx)(m, {
          onClick: () => k(null),
          disabled: L,
          children: d(`取消 `)
        }), (0, v.jsx)(m, {
          variant: `primary`,
          onClick: () => void Me(),
          disabled: L,
          children: d(L ? `保存中…` : `保存`)
        })]
      })]
    }), z && (0, v.jsxs)(n, {
      title: d(`批量导入代理`),
      onClose: () => B(!1),
      wide: !0,
      children: [(0, v.jsxs)(`div`, {
        className: `form-grid`,
        children: [(0, v.jsxs)(`label`, {
          className: `field full`,
          children: [(0, v.jsx)(`span`, {
            children: d(`代理列表（每行一条，最多 500 条）`)
          }), (0, v.jsx)(`textarea`, {
            rows: 9,
            value: V,
            onChange: e => H(e.target.value),
            placeholder: `socks5://user:pass@host:1080
host:1080
host:1080:user:pass`
          })]
        }), (0, v.jsxs)(`label`, {
          className: `field`,
          children: [(0, v.jsx)(`span`, {
            children: d(`简写默认协议`)
          }), (0, v.jsxs)(`select`, {
            value: ye,
            onChange: e => be(e.target.value),
            children: [(0, v.jsx)(`option`, {
              children: `SOCKS5`
            }), (0, v.jsx)(`option`, {
              children: `HTTP`
            }), (0, v.jsx)(`option`, {
              children: `HTTPS`
            })]
          })]
        }), (0, v.jsxs)(`label`, {
          className: `field`,
          children: [(0, v.jsx)(`span`, {
            children: d(`每条代理绑定上限`)
          }), (0, v.jsx)(`input`, {
            type: `number`,
            min: `0`,
            value: N,
            placeholder: d(`使用平台默认值`),
            onChange: e => P(e.target.value)
          }), (0, v.jsx)(`small`, {
            children: d(`留空使用平台默认值。`)
          })]
        })]
      }), F && (0, v.jsx)(u, {
        tone: `red`,
        children: F
      }), (0, v.jsxs)(`footer`, {
        className: `dialog-footer`,
        children: [(0, v.jsx)(m, {
          onClick: () => B(!1),
          disabled: L,
          children: d(`取消 `)
        }), (0, v.jsx)(m, {
          variant: `primary`,
          onClick: () => void Ne(),
          disabled: L || !V.trim(),
          children: d(L ? `导入中…` : `导入有效项`)
        })]
      })]
    }), U && (0, v.jsxs)(n, {
      title: d(`{0} · 绑定资源`, [U.name]),
      onClose: () => W(null),
      children: [(0, v.jsxs)(`p`, {
        children: [d(`本代理已交付 `), U.usedResources, d(` 条资源；当前账号仅可查看自己有权限的明细。`)]
      }), X.error ? (0, v.jsx)(u, {
        tone: `red`,
        children: X.error
      }) : (0, v.jsx)(l, {
        data: X.loading ? [] : X.data ?? [],
        loading: X.loading,
        columns: [{
          label: d(`资源名称`),
          render: e => e.name
        }, {
          label: d(`CCMAX账号名称`),
          render: e => e.accountName || d(`待填写`)
        }, {
          label: d(`项目`),
          render: e => e.projectName
        }, {
          label: d(`提交账号`),
          render: e => e.creatorName
        }, {
          label: d(`状态`),
          render: e => e.state === `DELIVERED` ? d(`已交付`) : d(`草稿`)
        }]
      })]
    })]
  })
}
export {
  y as
  default
};