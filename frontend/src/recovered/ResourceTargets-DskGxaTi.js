// origin: assets/ResourceTargets-DskGxaTi.js
import {
  $ as e,
  C as t,
  G as n,
  P as r,
  Q as i,
  S as a,
  X as o,
  Z as s,
  c,
  d as l,
  g as u,
  h as d,
  it as f,
  l as p,
  m,
  mt as h,
  ot as g,
  p as _,
  pt as v,
  rt as y,
  s as b,
  vt as x
} from "./index-Dnr0i-H9.js";
var S = x(s(), 1),
  C = o(),
  w = [{
    value: `true`,
    label: h(`是`)
  }, {
    value: `false`,
    label: h(`否`)
  }],
  T = {
    READY: h(`数据正常`),
    STALE: h(`数据较旧`),
    ERROR: h(`更新失败`),
    PENDING: h(`等待采集`)
  };

function k({
  targetId: n,
  onSaved
}) {
  let {
    has: r
  } = t(), a = r(`resource.config.write`), [o, s] = (0, S.useState)(null), [c, l] = (0, S.useState)(``), [m, g] = (0, S.useState)(``), [_, v] = (0, S.useState)(!0), [y, x] = (0, S.useState)(!1), [w, T] = (0, S.useState)(``), [E, D] = (0, S.useState)(!1), [O, k] = (0, S.useState)(!1), [A, j] = (0, S.useState)(!1), [M, N] = (0, S.useState)(!1), P = (0, S.useRef)(!0), F = (0, S.useRef)(!1), I = (0, S.useRef)(null), L = (0, S.useCallback)(async (t = !1) => {
    if (F.current) return;
    I.current?.abort();
    let r = new AbortController;
    I.current = r, v(!0), T(``), N(!1);
    try {
      let i = await e(`/resource-targets/${encodeURIComponent(n)}/sync-settings`, {
        signal: r.signal
      });
      if (!P.current || r.signal.aborted) return;
      s(i), t || (l(String(i.perTargetConcurrency)), g(String(i.globalConcurrency))), D(!1), j(!1), k(t)
    } catch (e) {
      if (!P.current || r.signal.aborted) return;
      T(h(`并发配置读取失败：{0}`, [e.message])), j(e instanceof i && e.status === 403)
    } finally {
      P.current && !r.signal.aborted && v(!1)
    }
  }, [n]);
  (0, S.useEffect)(() => (P.current = !0, L(), () => {
    P.current = !1, I.current?.abort()
  }), [L]);

  function R() {
    o && (l(String(o.perTargetConcurrency)), g(String(o.globalConcurrency)), k(!1), T(``), N(!1))
  }
  async function z(e) {
    if (e.preventDefault(), !o || !a || _ || F.current || E || A) return;
    T(``), N(!1);
    let t = Number(c),
      r = Number(m);
    if (!/^\d+$/.test(c) || !Number.isInteger(t) || t < 1 || t > 32) {
      T(h(`该目标并发批次需为 1–32 的整数`));
      return
    }
    if (!/^\d+$/.test(m) || !Number.isInteger(r) || r < 1 || r > 64) {
      T(h(`全局并发批次需为 1–64 的整数`));
      return
    }
    F.current = !0, x(!0);
    try {
      let e = await f(`/resource-targets/${encodeURIComponent(n)}/sync-settings`, {
        perTargetConcurrency: t,
        globalConcurrency: r,
        targetVersion: o.targetVersion,
        globalVersion: o.globalVersion
      });
      if (!P.current) return;
      s(e), l(String(e.perTargetConcurrency)), g(String(e.globalConcurrency)), k(!1), N(!0), onSaved?.(e)
    } catch (e) {
      if (!P.current) return;
      e instanceof i && e.status === 409 ? (D(!0), T(h(`并发配置已被其他人修改。输入已保留，请先重新读取最新配置，再核对并保存。`))) : (j(e instanceof i && e.status === 403), T(h(`并发配置保存失败：{0}`, [e.message])))
    } finally {
      F.current = !1, P.current && x(!1)
    }
  }
  let B = Number(c),
    V = Number(m),
    H = /^\d+$/.test(c) && /^\d+$/.test(m) && B >= 1 && B <= 32 && V >= 1 && V <= 64;
  return (0, C.jsxs)(`section`, {
    className: `target-sync-settings`,
    "aria-label": h(`CCMAX 同步并发`),
    children: [(0, C.jsx)(`h3`, {
      children: h(`CCMAX 同步并发`)
    }), (0, C.jsx)(`p`, {
      className: `muted`,
      children: h(`保存后对后续请求生效，正在执行的请求继续完成。`)
    }), _ && !o && (0, C.jsx)(d, {}), w && (0, C.jsx)(`div`, {
      role: `alert`,
      children: (0, C.jsx)(u, {
        tone: `red`,
        children: w
      })
    }), o && (a ? (0, C.jsxs)(`form`, {
      onSubmit: e => void z(e),
      noValidate: !0,
      children: [(0, C.jsxs)(`div`, {
        className: `form-grid`,
        children: [(0, C.jsxs)(`label`, {
          className: `field`,
          children: [(0, C.jsx)(`span`, {
            children: h(`该目标并发批次`)
          }), (0, C.jsx)(`input`, {
            type: `number`,
            min: 1,
            max: 32,
            step: 1,
            value: c,
            disabled: _ || y || A,
            onChange: e => {
              l(e.target.value), N(!1)
            }
          }), (0, C.jsx)(`small`, {
            children: h(`仅当前目标；默认 2，范围 1–32。`)
          })]
        }), (0, C.jsxs)(`label`, {
          className: `field`,
          children: [(0, C.jsx)(`span`, {
            children: h(`全局并发批次`)
          }), (0, C.jsx)(`input`, {
            type: `number`,
            min: 1,
            max: 64,
            step: 1,
            value: m,
            disabled: _ || y || A,
            onChange: e => {
              g(e.target.value), N(!1)
            }
          }), (0, C.jsx)(`small`, {
            children: h(`所有目标共享；默认 4，范围 1–64。在任一目标修改后全局生效。`)
          })]
        })]
      }), H && (0, C.jsxs)(`p`, {
        className: `muted`,
        children: [h(`按当前输入，该目标最多同时执行 `), Math.min(B, V), ` `, h(`批，还会受其他目标占用影响。 `)]
      }), O && (0, C.jsxs)(u, {
        children: [h(`已读取最新配置：该目标 `), o.perTargetConcurrency, h(` 批、全局`), ` `, o.globalConcurrency, h(` 批。你的输入已保留，请核对后保存。 `)]
      }), M && (0, C.jsx)(`p`, {
        role: `status`,
        children: h(`并发配置已保存。`)
      }), (0, C.jsxs)(`div`, {
        className: `target-sync-actions`,
        children: [O && (0, C.jsx)(b, {
          type: `button`,
          disabled: _ || y,
          onClick: R,
          children: h(`采用最新配置 `)
        }), (E || A || w && _ === !1) && (0, C.jsx)(b, {
          type: `button`,
          disabled: _ || y,
          onClick: () => void L(!0),
          children: h(`重新读取配置（保留输入） `)
        }), (0, C.jsx)(b, {
          type: `submit`,
          variant: `primary`,
          disabled: _ || y || E || A,
          children: h(y ? `正在保存并发…` : O ? `确认并保存并发` : `保存并发配置`)
        })]
      })]
    }) : (0, C.jsx)(p, {
      items: [
        [h(`该目标并发批次`), h(`{0} 批`, [o.perTargetConcurrency])],
        [h(`全局并发批次（所有目标共享）`), h(`{0} 批`, [o.globalConcurrency])],
        [h(`该目标实际并发上限`), h(`{0} 批`, [o.effectiveConcurrency])]
      ]
    })), !o && !_ && (0, C.jsx)(b, {
      onClick: () => void L(),
      children: h(`重试读取并发配置`)
    }), _ && o && (0, C.jsx)(`p`, {
      role: `status`,
      children: h(`正在重新读取并发配置…`)
    })]
  })
}

function A() {
  let {
    has: e,
    refresh: i,
    notify: o
  } = t(), s = e(`resource.config.read`), d = s || e(`workbench.monitoring.configure`), f = a(s ? `/resource-targets` : null), [_, v] = (0, S.useState)(null), [x, w] = (0, S.useState)(null), [T, E] = (0, S.useState)(null), [O, A] = (0, S.useState)(``), [M, N] = (0, S.useState)(null), [P, F] = (0, S.useState)(!1), [I, L] = (0, S.useState)(``);
  if (!d) return (0, C.jsx)(l, {
    text: h(`当前账号无权访问此页面`),
    error: !0
  });
  async function R() {
    if (x && !P) {
      F(!0), L(``);
      try {
        let e = await y(`/resource-targets/${encodeURIComponent(x.id)}/test`, {});
        o(e.message ? g(e.message) : h(`连接检查：{0}`, [e.state])), i()
      } catch (e) {
        L(e.message)
      } finally {
        F(!1)
      }
    }
  }
  async function z() {
    if (x && !P) {
      F(!0), L(``), E(null), A(``), N(null);
      try {
        E(await y(`/resource-targets/${encodeURIComponent(x.id)}/oauth/link`, {}))
      } catch (e) {
        L(e.message)
      } finally {
        F(!1)
      }
    }
  }
  async function B() {
    if (T) try {
      await navigator.clipboard.writeText(T.authUrl), o(h(`授权链接已复制`))
    } catch {
      L(h(`复制失败，请选中授权链接后手动复制`))
    }
  }
  async function V() {
    if (x && T && O.trim() && !P && !M) {
      F(!0), L(``);
      try {
        let e = await y(`/resource-targets/${encodeURIComponent(x.id)}/oauth/complete`, {
          sessionId: T.sessionId,
          code: O.trim()
        });
        N(e), A(``), e.state === `SUCCESS` && o(h(`授权已回填，目标侧资源已创建`))
      } catch (e) {
        L(e.message)
      } finally {
        F(!1)
      }
    }
  }
  return (0, C.jsxs)(C.Fragment, {
    children: [s && (0, C.jsxs)(C.Fragment, {
      children: [(0, C.jsx)(m, {
        title: h(`资源接口配置`),
        children: e(`resource.config.write`) && (0, C.jsx)(b, {
          variant: `primary`,
          icon: `plus`,
          onClick: () => v(`new`),
          children: h(`新增目标 `)
        })
      }), (0, C.jsx)(`section`, {
        className: `panel`,
        children: (0, C.jsx)(c, {
          data: f.data || [],
          loading: f.loading,
          error: f.error,
          onRow: e => {
            w(e), E(null), A(``), N(null)
          },
          columns: [{
            label: h(`目标名称`),
            render: e => (0, C.jsx)(`strong`, {
              children: e.name
            })
          }, ...e(`resource.config.write`) ? [{
            label: h(`服务地址`),
            render: e => e.baseUrl || `—`
          }] : [], {
            label: h(`状态`),
            render: e => e.enabled ? h(`已启用`) : h(`已停用`)
          }, {
            label: h(`操作`),
            render: e => (0, C.jsx)(b, {
              onClick: t => {
                t.stopPropagation(), w(e), E(null), A(``), N(null)
              },
              children: h(`查看 `)
            })
          }]
        })
      })]
    }), x && (0, C.jsxs)(n, {
      title: x.name,
      onClose: () => {
        w(null), L(``), E(null), A(``), N(null)
      },
      children: [(0, C.jsx)(p, {
        items: [...e(`resource.config.write`) ? [
            [h(`服务地址`), x.baseUrl],
            [h(`HTTP 地址`), x.allowHttp ? h(`已明确允许`) : h(`未单独允许`)],
            [h(`管理密钥`), x.apiKeyConfigured ? h(`已配置`) : h(`未配置`)],
            [h(`上游协议`), x.protocol === `NEWAPI` ? `New API` : x.protocol === `CCMAX_NATIVE` ? `CCMAX 原生管理接口` : h(`CCMAX 兼容适配器`) ]
          ] : [],
          [h(`状态`), x.enabled ? h(`已启用`) : h(`已停用`)]
        ]
      }), (0, C.jsx)(k, {
        targetId: x.id,
        onSaved: settings => {
          w(target => target ? { ...target, version: settings.targetVersion } : target);
          f.reload()
        }
      }, x.id), e(`resource.dispatch`) && x.enabled && x.protocol !== `NEWAPI` && (0, C.jsxs)(`section`, {
        className: `resource-target-oauth`,
        children: [(0, C.jsx)(`h3`, {
          children: h(`OAuth 授权链接`)
        }), (0, C.jsx)(`p`, {
          className: `muted`,
          children: h(`先生成登录链接，完成登录后把回调地址或 code#state 粘贴到下方；无需填写 SOCKS5。 `)
        }), (0, C.jsx)(b, {
          disabled: P,
          onClick: () => void z(),
          children: h(P ? `正在生成…` : `生成授权链接`)
        }), T && (0, C.jsxs)(`div`, {
          className: `resource-target-oauth-result`,
          children: [(0, C.jsxs)(`p`, {
            className: `muted`,
            children: [h(`有效期至 `), r(T.expiresAt)]
          }), (0, C.jsxs)(`label`, {
            className: `field`,
            children: [(0, C.jsx)(`span`, {
              children: h(`授权链接`)
            }), (0, C.jsx)(`textarea`, {
              "aria-label": h(`OAuth 授权链接`),
              readOnly: !0,
              rows: 4,
              value: T.authUrl
            })]
          }), (0, C.jsxs)(`div`, {
            className: `resource-target-oauth-actions`,
            children: [(0, C.jsx)(b, {
              onClick: () => void B(),
              children: h(`复制`)
            }), (0, C.jsx)(`a`, {
              href: T.authUrl,
              target: `_blank`,
              rel: `noopener noreferrer`,
              children: h(`打开浏览器 `)
            })]
          }), !M && (0, C.jsxs)(C.Fragment, {
            children: [(0, C.jsxs)(`label`, {
              className: `field`,
              children: [(0, C.jsx)(`span`, {
                children: h(`回调地址或 code#state`)
              }), (0, C.jsx)(`textarea`, {
                "aria-label": h(`OAuth 回调地址或授权码`),
                rows: 3,
                placeholder: h(`粘贴完整回调 URL 或 code#state`),
                autoComplete: `off`,
                value: O,
                onChange: e => A(e.target.value)
              })]
            }), (0, C.jsx)(b, {
              variant: `primary`,
              disabled: P || !O.trim(),
              onClick: () => void V(),
              children: h(P ? `正在提交…` : `回填并创建目标资源`)
            })]
          }), M?.state === `SUCCESS` && (0, C.jsxs)(u, {
            children: [h(`目标侧资源已创建：`), M.laneId, h(`（`), M.laneState, h(`） `)]
          }), M?.state === `UNKNOWN` && (0, C.jsx)(u, {
            tone: `red`,
            children: h(`结果未确认，请到目标侧核对资源，勿重复回填。`)
          })]
        })]
      }), I && (0, C.jsxs)(u, {
        tone: `red`,
        children: [h(`操作失败：`), I]
      }), (0, C.jsxs)(`footer`, {
        className: `dialog-footer`,
        children: [e(`resource.config.test`) && (0, C.jsx)(b, {
          disabled: P,
          onClick: () => void R(),
          children: h(P ? `正在检查…` : `检查连接`)
        }), e(`resource.config.write`) && (0, C.jsx)(b, {
          onClick: () => {
            v(x), w(null)
          },
          children: h(`编辑 `)
        }), (0, C.jsx)(b, {
          onClick: () => w(null),
          children: h(`关闭`)
        })]
      })]
    }), _ && (0, C.jsx)(j, {
      target: _,
      onClose: () => v(null),
      onSaved: () => {
        i(), o(h(`目标配置已保存`))
      }
    })]
  })
}

function j({
  target: e,
  onClose: t,
  onSaved: r
}) {
  let i = e === `new`,
    [a, o] = (0, S.useState)(i ? `` : e.name),
    [s, c] = (0, S.useState)(i ? `` : e.baseUrl || ``),
    [l, d] = (0, S.useState)(``),
    [p, m] = (0, S.useState)(!i && !!e.allowHttp),
    [g, _] = (0, S.useState)(!i && e.enabled),
    [v, x] = (0, S.useState)(!1),
    [w, T] = (0, S.useState)(``),
    [protocol, setProtocol] = (0, S.useState)(i ? `CUSTOM` : e.protocol || `CUSTOM`),
    [newApiUserId, setNewApiUserId] = (0, S.useState)(i ? `` : String(e.newApiUserId ?? ``)),
    [adminUsername, setAdminUsername] = (0, S.useState)(i ? `` : e.adminUsername || ``),
    [adminPassword, setAdminPassword] = (0, S.useState)(``),
    [defaultTarget, setDefaultTarget] = (0, S.useState)(!i && !!e.defaultTarget),
    [pathPrefix, setPathPrefix] = (0, S.useState)(i ? `/api` : e.upstreamPathPrefix ?? `/api`),
    [timeoutMs, setTimeoutMs] = (0, S.useState)(i ? `15000` : String(e.timeoutMs || 15000));
  async function E(n) {
    if (n.preventDefault(), !v) {
      if (T(``), !a.trim() || !s.trim()) {
        T(h(`请填写目标名称和服务地址`));
        return
      }
      if (protocol !== `CCMAX_NATIVE` && i && !l.trim()) {
        T(h(`请填写管理密钥`));
        return
      }
      if (protocol === `CCMAX_NATIVE` && (!adminUsername.trim() || !adminPassword && !e.adminPasswordConfigured)) {
        T(`请填写CCMAX管理员账号和密码`);
        return
      }
      x(!0);
      try {
        let n = {
          name: a.trim(),
          baseUrl: s.trim(),
          allowHttp: p && s.trim().toLowerCase().startsWith(`http://`),
          enabled: g,
          protocol,
          newApiUserId: protocol === `NEWAPI` ? newApiUserId.trim() : ``,
          ...protocol === `CCMAX_NATIVE` ? { adminUsername: adminUsername.trim(), ...adminPassword ? { adminPassword } : {} } : {},
          defaultTarget,
          upstreamPathPrefix: pathPrefix.trim(),
          timeoutMs: Number(timeoutMs),
          ...l.trim() ? {
            apiKey: l.trim()
          } : {},
          ...i ? {} : {
            version: e.version
          }
        };
        i ? await y(`/resource-targets`, n) : await f(`/resource-targets/${encodeURIComponent(e.id)}`, n), r(), t()
      } catch (e) {
        T(e.message)
      } finally {
        x(!1)
      }
    }
  }
  return (0, C.jsx)(n, {
    title: h(i ? `新增资源目标` : `编辑资源目标`),
    onClose: () => {
      v || t()
    },
    children: (0, C.jsxs)(`form`, {
      className: `target-config-form`,
      onSubmit: e => void E(e),
      children: [(0, C.jsxs)(`div`, {
        className: `form-grid`,
        children: [(0, C.jsxs)(`label`, {
          className: `field full`,
          children: [(0, C.jsx)(`span`, {
            children: h(`目标名称`)
          }), (0, C.jsx)(`input`, {
            required: !0,
            maxLength: 128,
            placeholder: h(`例如：CCMAX 正式环境`),
            value: a,
            onChange: e => o(e.target.value)
          })]
        }), (0, C.jsxs)(`label`, {
          className: `field full`,
          children: [(0, C.jsx)(`span`, {
            children: h(`服务地址`)
          }), (0, C.jsx)(`input`, {
            required: !0,
            type: `url`,
            placeholder: `https://ccmax.example.com`,
            value: s,
            onChange: e => {
              c(e.target.value), m(!1)
            }
          })]
        }), (0, C.jsxs)(`label`, {
          className: `field full`,
          children: [(0, C.jsx)(`span`, { children: h(`上游协议`) }), (0, C.jsxs)(`select`, {
            value: protocol, onChange: e => { setProtocol(e.target.value); if (e.target.value === `CCMAX_NATIVE` && Number(timeoutMs) < 60000) setTimeoutMs(`60000`); },
            children: [(0, C.jsx)(`option`, { value: `CUSTOM`, children: h(`CCMAX 兼容适配器`) }),
              (0, C.jsx)(`option`, { value: `NEWAPI`, children: h(`New API 官方渠道接口`) }),
              (0, C.jsx)(`option`, { value: `CCMAX_NATIVE`, children: `CCMAX 原生管理接口` })]
          }), (0, C.jsx)(`small`, { children: h(protocol === `NEWAPI` ? `支持已关联渠道的状态、用量、测试和启停；CCMAX OAuth 与凭据交付需兼容适配器。` : protocol === `CCMAX_NATIVE` ? `使用管理员账号登录 Claude Gateway，支持原生 OAuth、凭据导入、账号关联、用量和状态同步。` : `服务端需实现资源交付、OAuth、用量和维护接口。`) })]
        }), protocol === `NEWAPI` && (0, C.jsxs)(`label`, {
          className: `field full`, children: [(0, C.jsx)(`span`, { children: h(`New API 管理员用户 ID`) }),
            (0, C.jsx)(`input`, { required: !0, inputMode: `numeric`, pattern: `[1-9][0-9]{0,18}`, value: newApiUserId, onChange: e => setNewApiUserId(e.target.value) })]
        }), protocol === `CCMAX_NATIVE` && (0, C.jsxs)(C.Fragment, {
          children: [(0, C.jsxs)(`label`, { className: `field full`, children: [(0, C.jsx)(`span`, { children: `CCMAX 管理员账号` }), (0, C.jsx)(`input`, { required: true, value: adminUsername, autoComplete: `off`, onChange: event => setAdminUsername(event.target.value) })] }),
          (0, C.jsxs)(`label`, { className: `field full`, children: [(0, C.jsx)(`span`, { children: `CCMAX 管理员密码` }), (0, C.jsx)(`input`, { type: `password`, value: adminPassword, autoComplete: `new-password`, placeholder: i || !e.adminPasswordConfigured ? `输入管理员密码` : `留空表示不更换`, onChange: event => setAdminPassword(event.target.value) }), (0, C.jsx)(`small`, { children: `仅服务端保存，不回显。模型调用 Key 不能代替管理员登录。` })] })]
        }), protocol === `CUSTOM` && (0, C.jsxs)(`label`, {
          className: `field`, children: [(0, C.jsx)(`span`, { children: h(`接口路径前缀`) }),
            (0, C.jsx)(`input`, { value: pathPrefix, placeholder: `/api`, onChange: e => setPathPrefix(e.target.value) })]
        }), (0, C.jsxs)(`label`, {
          className: `field`, children: [(0, C.jsx)(`span`, { children: h(`请求超时（毫秒）`) }),
            (0, C.jsx)(`input`, { required: !0, type: `number`, min: 1000, max: 120000, value: timeoutMs, onChange: e => setTimeoutMs(e.target.value) })]
        }), (0, C.jsxs)(`label`, {
          className: `field full`, children: [(0, C.jsx)(`span`, { children: h(`默认目标`) }),
            (0, C.jsx)(`input`, { type: `checkbox`, checked: defaultTarget, onChange: e => setDefaultTarget(e.target.checked) }),
            (0, C.jsx)(`small`, { children: h(`多个启用目标时，应只选择一个默认目标。`) })]
        }), s.trim().toLowerCase().startsWith(`http://`) && (0, C.jsxs)(`label`, {
          className: `settings-switch full target-config-switch`,
          children: [(0, C.jsxs)(`span`, {
            children: [(0, C.jsx)(`strong`, {
              children: h(`允许此 HTTP 地址`)
            }), (0, C.jsx)(`small`, {
              children: h(`仅批准当前填写的目标地址。HTTP 会以明文传输管理密钥。`)
            })]
          }), (0, C.jsx)(`input`, {
            type: `checkbox`,
            checked: p,
            onChange: e => m(e.target.checked)
          }), (0, C.jsx)(`span`, {
            className: `settings-switch-track`,
            "aria-hidden": `true`
          })]
        }), protocol !== `CCMAX_NATIVE` && (0, C.jsxs)(`label`, {
          className: `field full`,
          children: [(0, C.jsx)(`span`, {
            children: h(`管理密钥`)
          }), (0, C.jsx)(`input`, {
            type: `password`,
            autoComplete: `new-password`,
            value: l,
            onChange: e => d(e.target.value),
            placeholder: h(i ? `输入管理密钥` : `留空表示不更换`)
          }), (0, C.jsx)(`small`, {
            children: h(`仅保存在服务端，保存后不回显。`)
          })]
        }), (0, C.jsxs)(`label`, {
          className: `settings-switch full target-config-switch`,
          children: [(0, C.jsxs)(`span`, {
            children: [(0, C.jsx)(`strong`, {
              children: h(`启用目标`)
            }), (0, C.jsx)(`small`, {
              children: h(`启用后，可执行该协议支持的资源操作。`)
            })]
          }), (0, C.jsx)(`input`, {
            type: `checkbox`,
            checked: g,
            onChange: e => _(e.target.checked)
          }), (0, C.jsx)(`span`, {
            className: `settings-switch-track`,
            "aria-hidden": `true`
          })]
        })]
      }), w && (0, C.jsx)(u, {
        tone: `red`,
        children: w
      }), (0, C.jsxs)(`footer`, {
        className: `dialog-footer`,
        children: [(0, C.jsx)(b, {
          type: `button`,
          onClick: t,
          disabled: v,
          children: h(`取消 `)
        }), (0, C.jsx)(b, {
          type: `submit`,
          variant: `primary`,
          disabled: v,
          children: h(v ? `正在保存…` : `保存配置`)
        })]
      })]
    })
  })
}
export {
  A as
  default
};
