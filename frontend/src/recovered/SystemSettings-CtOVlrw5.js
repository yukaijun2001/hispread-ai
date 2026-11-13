// origin: assets/SystemSettings-CtOVlrw5.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/IntakePolicyPanel-DHvOkPUU.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/labels-DaPzz6Ie.js", "assets/intake-D282aV6G.css"]))) => i.map(i => d[i]);
import {
  C as e,
  P as t,
  S as n,
  X as r,
  Z as i,
  b as a,
  ct as o,
  g as s,
  h as c,
  i as l,
  it as u,
  lt as d,
  mt as f,
  s as p,
  u as m,
  vt as h
} from "./index-Dnr0i-H9.js";
var g = h(i(), 1),
  _ = r();

function v() {
  let {
    has: t,
    refresh: r
  } = e(), i = n(t(`system.settings`) ? `/workbench-monitoring/multipliers` : null, 3e4);
  return t(`system.settings`) ? (0, _.jsxs)(`section`, {
    className: `panel monitoring-multipliers`,
    "aria-labelledby": `monitoring-multipliers-title`,
    children: [(0, _.jsxs)(`div`, {
      className: `panel-section-head`,
      children: [(0, _.jsxs)(`div`, {
        children: [(0, _.jsx)(`h2`, {
          id: `monitoring-multipliers-title`,
          children: f(`RPM / TPM 倍率`)
        }), (0, _.jsx)(`span`, {
          className: `muted small`,
          children: f(`各品类独立配置 0.1 至 100 的区间，最多两位小数；0.1 倍为实际值的 10%，工作台 RPM 向上取整显示。 `)
        })]
      }), (0, _.jsx)(p, {
        icon: `refresh`,
        onClick: r,
        children: f(`刷新倍率 `)
      })]
    }), i.error && (0, _.jsxs)(s, {
      tone: `red`,
      children: [f(`倍率读取失败：`), i.error]
    }), i.loading && !i.data ? (0, _.jsx)(`p`, {
      className: `monitoring-config-message`,
      children: f(`正在读取倍率配置…`)
    }) : i.data?.length ? (0, _.jsx)(a, {
      ariaLabel: f(`RPM 与 TPM 倍率配置`),
      children: (0, _.jsxs)(`table`, {
        className: `monitoring-multiplier-table`,
        children: [(0, _.jsx)(`thead`, {
          children: (0, _.jsxs)(`tr`, {
            children: [(0, _.jsx)(`th`, {
              children: f(`项目品类`)
            }), (0, _.jsx)(`th`, {
              children: f(`倍率下限`)
            }), (0, _.jsx)(`th`, {
              children: f(`倍率上限`)
            }), (0, _.jsx)(`th`, {
              children: f(`当前 RPM 倍率`)
            }), (0, _.jsx)(`th`, {
              children: f(`当前 TPM 倍率`)
            }), (0, _.jsx)(`th`, {
              children: f(`倍率生成时间`)
            }), (0, _.jsx)(`th`, {
              children: f(`操作`)
            })]
          })
        }), (0, _.jsx)(`tbody`, {
          children: i.data.map(e => (0, _.jsx)(y, {
            config: e,
            onSaved: r
          }, e.category))
        })]
      })
    }) : !i.error && (0, _.jsx)(`p`, {
      className: `monitoring-config-message`,
      children: f(`暂无可配置的项目品类`)
    })]
  }) : null
}

function y({
  config: n,
  onSaved: r
}) {
  let {
    notify: i
  } = e(), [a, o] = (0, g.useState)(n.minMultiplier === null ? `` : String(n.minMultiplier)), [c, l] = (0, g.useState)(n.maxMultiplier === null ? `` : String(n.maxMultiplier)), [d, m] = (0, g.useState)(!1), [h, v] = (0, g.useState)(``), y = (0, g.useRef)(!1), b = n.categoryName || n.category;
  (0, g.useEffect)(() => {
    o(n.minMultiplier === null ? `` : String(n.minMultiplier)), l(n.maxMultiplier === null ? `` : String(n.maxMultiplier))
  }, [n.version, n.minMultiplier, n.maxMultiplier]);
  async function x() {
    if (y.current) return;
    let e = Number(a),
      t = Number(c);
    if (!/^\d+(?:\.\d{1,2})?$/.test(a) || !/^\d+(?:\.\d{1,2})?$/.test(c) || e < .1 || t > 100 || e > 100 || t < .1) {
      v(f(`倍率下限和上限须为 0.1 至 100 的数值，最多两位小数`));
      return
    }
    if (e > t) {
      v(f(`倍率下限不能大于上限`));
      return
    }
    y.current = !0, m(!0), v(``);
    try {
      await u(`/workbench-monitoring/multipliers`, {
        category: n.category,
        minMultiplier: e,
        maxMultiplier: t,
        version: n.version
      }), i(f(`{0}倍率已保存`, [b])), r()
    } catch (e) {
      v(e instanceof Error ? e.message : f(`保存失败，请重试`))
    } finally {
      y.current = !1, m(!1)
    }
  }
  return (0, _.jsxs)(_.Fragment, {
    children: [(0, _.jsxs)(`tr`, {
      children: [(0, _.jsx)(`td`, {
        children: (0, _.jsx)(`strong`, {
          children: b
        })
      }), (0, _.jsx)(`td`, {
        children: (0, _.jsx)(`input`, {
          "aria-label": f(`{0}倍率下限`, [b]),
          type: `number`,
          min: `0.1`,
          max: `100`,
          step: `0.01`,
          inputMode: `decimal`,
          value: a,
          disabled: d,
          onChange: e => o(e.target.value)
        })
      }), (0, _.jsx)(`td`, {
        children: (0, _.jsx)(`input`, {
          "aria-label": f(`{0}倍率上限`, [b]),
          type: `number`,
          min: `0.1`,
          max: `100`,
          step: `0.01`,
          inputMode: `decimal`,
          value: c,
          disabled: d,
          onChange: e => l(e.target.value)
        })
      }), (0, _.jsx)(`td`, {
        children: n.currentRpmMultiplier === null ? `—` : f(`{0} 倍`, [n.currentRpmMultiplier])
      }), (0, _.jsx)(`td`, {
        children: n.currentTpmMultiplier === null ? `—` : f(`{0} 倍`, [n.currentTpmMultiplier])
      }), (0, _.jsx)(`td`, {
        children: n.generatedAt ? t(n.generatedAt) : f(`尚未生成`)
      }), (0, _.jsx)(`td`, {
        children: (0, _.jsx)(p, {
          type: `button`,
          "aria-label": f(`保存{0}倍率`, [b]),
          disabled: d,
          onClick: () => void x(),
          children: f(d ? `保存中…` : `保存`)
        })
      })]
    }), h && (0, _.jsx)(`tr`, {
      className: `monitoring-multiplier-error`,
      children: (0, _.jsx)(`td`, {
        colSpan: 7,
        children: (0, _.jsxs)(s, {
          tone: `red`,
          children: [b, f(`：`), h]
        })
      })
    })]
  })
}
var b = (0, g.lazy)(() => l(() => import(`./IntakePolicyPanel-DHvOkPUU.js`), __vite__mapDeps([0, 1, 2, 3, 4])));

function x() {
  let {
    user: t,
    has: r,
    notify: i,
    refresh: a
  } = e(), l = !t.supplierId && t.role !== `SUPPLIER` && r(`system.settings`), h = n(l ? `/system/settings` : null), [y, x] = (0, g.useState)(null), [S, C] = (0, g.useState)(!1), [w, T] = (0, g.useState)(!1), [E, D] = (0, g.useState)(!1), [O, k] = (0, g.useState)(`10`), [A, j] = (0, g.useState)(`120`), [M, N] = (0, g.useState)(!1), [P, F] = (0, g.useState)(!1), [I, L] = (0, g.useState)(``);
  if ((0, g.useEffect)(() => {
      if (!h.data) return;
      let e = h.data.policy;
      C(h.data.allowAllSuppliersPro), T(h.data.allowAllSuppliersCcmax), D(h.data.forceStopCcmaxIntake === !0), k(String(h.data.ccmaxIntakeConcurrencyLimit ?? 10)), j(String(h.data.ccmaxCreationTimeoutSeconds ?? 120)), N(h.data.allowAllSuppliersCcmaxReauthorization), x({
        ...e,
        quoteMultiplierMin: o(e.quoteMultiplierMin || `0`),
        quoteMultiplierMax: o(e.quoteMultiplierMax || `100`)
      })
    }, [h.data]), !l) return (0, _.jsx)(s, {
    tone: `red`,
    children: f(`当前账号无权访问此页面`)
  });
  if (h.error && !h.data) return (0, _.jsxs)(s, {
    tone: `red`,
    children: [h.error, ` `, (0, _.jsx)(p, {
      onClick: h.reload,
      children: f(`重新加载配置`)
    })]
  });
  if (!y || !h.data) return (0, _.jsx)(c, {});

  function R(e, t, n, r) {
    return (0, _.jsxs)(`label`, {
      className: `field`,
      children: [(0, _.jsx)(`span`, {
        children: t
      }), (0, _.jsx)(`input`, {
        type: `number`,
        required: !0,
        step: `1`,
        min: n,
        max: r,
        value: String(y?.[e] ?? ``),
        onChange: t => x(n => n && {
          ...n,
          [e]: t.target.value === `` ? `` : Number(t.target.value)
        })
      })]
    }, e)
  }
  let z = (e, t) => (0, _.jsxs)(`label`, {
    className: `policy-check`,
    children: [(0, _.jsx)(`input`, {
      type: `checkbox`,
      checked: !!y[e],
      onChange: t => x(n => n && {
        ...n,
        [e]: t.target.checked
      })
    }), t]
  }, e);
  return (0, _.jsxs)(_.Fragment, {
    children: [(0, _.jsxs)(`form`, {
      className: `settings-form`,
      onSubmit: async e => {
        if (e.preventDefault(), P || !l) return;
        let t = Number(O);
        if (!Number.isInteger(t) || t < 1 || t > 1e3) {
          L(f(`每供应商同时上号数须为1至1000的整数`));
          return
        }
        let n = Number(A);
        if (!Number.isInteger(n) || n < 1 || n > 300) {
          L(f(`上号单次超时须为1至300的整数秒`));
          return
        }
        F(!0), L(``);
        try {
          let e = await u(`/system/settings`, {
            policy: {
              ...y,
              quoteMultiplierMin: d(y.quoteMultiplierMin),
              quoteMultiplierMax: d(y.quoteMultiplierMax)
            },
            allowAllSuppliersPro: S,
            allowAllSuppliersCcmax: w,
            forceStopCcmaxIntake: E,
            ccmaxIntakeConcurrencyLimit: t,
            ccmaxCreationTimeoutSeconds: n,
            allowAllSuppliersCcmaxReauthorization: M,
            version: h.data.version
          });
          h.mutate(() => e), i(f(`系统参数已保存`)), a()
        } catch (e) {
          L(e.message)
        } finally {
          F(!1)
        }
      },
      children: [(0, _.jsxs)(`section`, {
        className: `panel settings-section`,
        children: [(0, _.jsxs)(`div`, {
          children: [(0, _.jsx)(`h2`, {
            children: f(`CCMAX 上号`)
          }), (0, _.jsx)(`p`, {
            children: f(`统一开通供应商上号资格，仍需通过强制停止与项目权限校验；关闭后按各供应商配置判断。套餐分类和每日额度规则目前仅保存配置。`)
          })]
        }), (0, _.jsxs)(`div`, {
          className: `settings-switch-list`,
          children: [(0, _.jsxs)(`label`, {
            className: `settings-switch`,
            children: [(0, _.jsxs)(`span`, {
              children: [(0, _.jsx)(`strong`, {
                children: f(`强制停止 CCMAX 新增上号`)
              }), (0, _.jsx)(`small`, {
                children: f(`优先于全局允许和供应商配置，仅停止新增上号；已有资源查询、同步和重新授权不受影响。`)
              })]
            }), (0, _.jsx)(`input`, {
              type: `checkbox`,
              checked: E,
              disabled: P,
              onChange: e => D(e.target.checked)
            }), (0, _.jsx)(`span`, {
              className: `settings-switch-track`,
              "aria-hidden": `true`
            })]
          }), (0, _.jsxs)(`label`, {
            className: `settings-switch`,
            children: [(0, _.jsxs)(`span`, {
              children: [(0, _.jsx)(`strong`, {
                children: f(`全部供应商允许 CCMAX 上号`)
              }), (0, _.jsx)(`small`, {
                children: f(`对供应商及其有项目权限的团队成员生效，历史资源仍可查看。`)
              })]
            }), (0, _.jsx)(`input`, {
              type: `checkbox`,
              checked: w,
              disabled: P,
              onChange: e => T(e.target.checked)
            }), (0, _.jsx)(`span`, {
              className: `settings-switch-track`,
              "aria-hidden": `true`
            })]
          }), (0, _.jsxs)(`label`, {
            className: `settings-concurrency`,
            children: [(0, _.jsxs)(`span`, {
              children: [(0, _.jsx)(`strong`, {
                children: f(`每供应商同时上号数`)
              }), (0, _.jsx)(`small`, {
                id: `ccmax-intake-concurrency-help`,
                children: f(`限制同一供应商同时进行的 CCMAX 原生 OAuth 新增上号；待核对的创建继续占用名额，已生成但未提交的授权链接不占用。`)
              })]
            }), (0, _.jsx)(`input`, {
              type: `number`,
              required: !0,
              min: `1`,
              max: `1000`,
              step: `1`,
              "aria-label": f(`每供应商同时上号数`),
              "aria-describedby": `ccmax-intake-concurrency-help`,
              value: O,
              disabled: P,
              onChange: e => k(e.target.value)
            })]
          }), (0, _.jsxs)(`label`, {
            className: `settings-concurrency`,
            children: [(0, _.jsxs)(`span`, {
              children: [(0, _.jsx)(`strong`, {
                children: f(`上号单次超时（秒）`)
              }), (0, _.jsx)(`small`, {
                id: `ccmax-creation-timeout-help`,
                children: f(`CCMAX 原生 OAuth 新增上号从兑换开始共用此时间预算，包含上游登录和回读；超时后保留待核对结果，不自动重复创建。已有账号重新授权不受此项限制。`)
              })]
            }), (0, _.jsx)(`input`, {
              type: `number`,
              required: !0,
              min: `1`,
              max: `300`,
              step: `1`,
              "aria-label": f(`上号单次超时（秒）`),
              "aria-describedby": `ccmax-creation-timeout-help`,
              value: A,
              disabled: P,
              onChange: e => j(e.target.value)
            })]
          })]
        })]
      }), (0, _.jsxs)(`section`, {
        className: `panel settings-section`,
        children: [(0, _.jsxs)(`div`, {
          children: [(0, _.jsx)(`h2`, {
            children: f(`CCMAX 重新授权`)
          }), (0, _.jsx)(`p`, {
            children: f(`独立于新增上号；全局关闭后按各供应商的重新授权开关判断。`)
          })]
        }), (0, _.jsx)(`div`, {
          className: `settings-switch-list`,
          children: (0, _.jsxs)(`label`, {
            className: `settings-switch`,
            children: [(0, _.jsxs)(`span`, {
              children: [(0, _.jsx)(`strong`, {
                children: f(`全部供应商允许 CCMAX 重新授权`)
              }), (0, _.jsx)(`small`, {
                children: f(`同时控制 OAuth、手动凭据和强制刷新授权；关闭后仍可查询已有操作。`)
              })]
            }), (0, _.jsx)(`input`, {
              type: `checkbox`,
              checked: M,
              disabled: P,
              onChange: e => N(e.target.checked)
            }), (0, _.jsx)(`span`, {
              className: `settings-switch-track`,
              "aria-hidden": `true`
            })]
          })
        })]
      }), (0, _.jsxs)(`section`, {
        className: `panel settings-section`,
        children: [(0, _.jsxs)(`div`, {
          children: [(0, _.jsx)(`h2`, {
            children: f(`PRO 推送`)
          }), (0, _.jsx)(`p`, {
            children: f(`开启后所有供应商均允许推送 PRO；关闭后按各供应商自己的配置判断。`)
          })]
        }), (0, _.jsx)(`div`, {
          className: `settings-switch-list`,
          children: (0, _.jsxs)(`label`, {
            className: `settings-switch`,
            children: [(0, _.jsxs)(`span`, {
              children: [(0, _.jsx)(`strong`, {
                children: f(`全部供应商允许推送 PRO`)
              }), (0, _.jsx)(`small`, {
                children: f(`当前仅保存配置，PRO 套餐限制尚未生效。`)
              })]
            }), (0, _.jsx)(`input`, {
              type: `checkbox`,
              checked: S,
              disabled: P,
              onChange: e => C(e.target.checked)
            }), (0, _.jsx)(`span`, {
              className: `settings-switch-track`,
              "aria-hidden": `true`
            })]
          })
        })]
      }), (0, _.jsxs)(`section`, {
        className: `panel settings-section`,
        children: [(0, _.jsxs)(`div`, {
          children: [(0, _.jsx)(`h2`, {
            children: f(`会话有效期`)
          }), (0, _.jsx)(`p`, {
            children: f(`空闲期控制无操作退出，绝对有效期限制单次登录总时长。保存后按新策略校验已有会话。`)
          })]
        }), (0, _.jsxs)(`div`, {
          className: `form-grid`,
          children: [R(`sessionIdleMinutes`, f(`空闲有效期（分钟）`), 1, 1440), R(`sessionAbsoluteMinutes`, f(`绝对有效期（分钟）`), 1, 10080)]
        })]
      }), (0, _.jsxs)(`section`, {
        className: `panel settings-section`,
        children: [(0, _.jsxs)(`div`, {
          children: [(0, _.jsx)(`h2`, {
            children: f(`密码策略`)
          }), (0, _.jsx)(`p`, {
            children: f(`用于创建、重置和修改密码；不会直接改写已有密码。`)
          })]
        }), (0, _.jsxs)(`div`, {
          children: [(0, _.jsxs)(`div`, {
            className: `form-grid`,
            children: [R(`passwordMinLength`, f(`最短长度`), 8, 64), R(`passwordMaxLength`, f(`最长长度`), 8, 72)]
          }), (0, _.jsxs)(`div`, {
            className: `policy-checks`,
            children: [z(`requireUpper`, f(`包含大写字母`)), z(`requireLower`, f(`包含小写字母`)), z(`requireDigit`, f(`包含数字`)), z(`requireSymbol`, f(`包含符号`))]
          }), y.passwordMinLength < 15 && (0, _.jsx)(s, {
            tone: `amber`,
            children: f(`当前最短密码少于 15 位。请结合账号的验证方式评估风险，避免使用可预测短密码。 `)
          })]
        })]
      }), (0, _.jsxs)(`section`, {
        className: `panel settings-section`,
        children: [(0, _.jsxs)(`div`, {
          children: [(0, _.jsx)(`h2`, {
            children: f(`初始化密码`)
          }), (0, _.jsx)(`p`, {
            children: f(`每个账号独立随机生成，不使用所有人通用的固定密码。随机部分至少 12 位。`)
          })]
        }), (0, _.jsxs)(`div`, {
          children: [(0, _.jsxs)(`div`, {
            className: `form-grid`,
            children: [R(`initialPasswordLength`, f(`初始密码总长度`), 12, 72), (0, _.jsxs)(`label`, {
              className: `field`,
              children: [(0, _.jsx)(`span`, {
                children: f(`生成格式`)
              }), (0, _.jsx)(m, {
                ariaLabel: f(`生成格式`),
                value: y.initialPasswordFormat,
                onChange: e => x({
                  ...y,
                  initialPasswordFormat: e
                }),
                options: [{
                  value: `MIXED`,
                  label: f(`字母、数字和符号`),
                  tone: `blue`
                }, {
                  value: `ALNUM`,
                  label: f(`字母和数字`),
                  tone: `slate`
                }]
              })]
            }), (0, _.jsxs)(`label`, {
              className: `field full`,
              children: [(0, _.jsx)(`span`, {
                children: f(`可选前缀`)
              }), (0, _.jsx)(`input`, {
                maxLength: 8,
                value: y.initialPasswordPrefix,
                onChange: e => x({
                  ...y,
                  initialPasswordPrefix: e.target.value
                })
              })]
            })]
          }), z(`forceInitialChange`, f(`新建或重置后，首次登录必须修改密码`))]
        })]
      }), (0, _.jsxs)(`section`, {
        className: `panel settings-section`,
        children: [(0, _.jsxs)(`div`, {
          children: [(0, _.jsx)(`h2`, {
            children: f(`登录保护`)
          }), (0, _.jsx)(`p`, {
            children: f(`达到连续失败次数后临时锁定账号；同时保留接口限流。`)
          })]
        }), (0, _.jsxs)(`div`, {
          className: `form-grid`,
          children: [R(`loginMaxFailures`, f(`连续失败次数`), 3, 20), R(`loginLockMinutes`, f(`锁定时间（分钟）`), 1, 1440)]
        })]
      }), (0, _.jsxs)(`section`, {
        className: `panel settings-section`,
        children: [(0, _.jsxs)(`div`, {
          children: [(0, _.jsx)(`h2`, {
            children: f(`报价折扣`)
          }), (0, _.jsx)(`p`, {
            children: f(`额度报价可填小数。新提交、待审修改和调价按当前区间校验；已经通过的价格不改写。`)
          })]
        }), (0, _.jsxs)(`div`, {
          className: `form-grid`,
          children: [(0, _.jsxs)(`label`, {
            className: `field`,
            children: [(0, _.jsx)(`span`, {
              children: f(`折扣下限`)
            }), (0, _.jsx)(`input`, {
              type: `text`,
              inputMode: `decimal`,
              required: !0,
              value: y.quoteMultiplierMin,
              onChange: e => x({
                ...y,
                quoteMultiplierMin: e.target.value.trim()
              })
            })]
          }), (0, _.jsxs)(`label`, {
            className: `field`,
            children: [(0, _.jsx)(`span`, {
              children: f(`折扣上限`)
            }), (0, _.jsx)(`input`, {
              type: `text`,
              inputMode: `decimal`,
              required: !0,
              value: y.quoteMultiplierMax,
              onChange: e => x({
                ...y,
                quoteMultiplierMax: e.target.value.trim()
              })
            })]
          })]
        })]
      }), (0, _.jsxs)(`section`, {
        className: `panel settings-section`,
        children: [(0, _.jsxs)(`div`, {
          children: [(0, _.jsx)(`h2`, {
            children: f(`审核操作`)
          }), (0, _.jsx)(`p`, {
            children: f(`配置审核方式；新注册供应商的审批开关默认开启。`)
          })]
        }), (0, _.jsxs)(`div`, {
          className: `settings-switch-list`,
          children: [(0, _.jsxs)(`label`, {
            className: `settings-switch`,
            children: [(0, _.jsxs)(`span`, {
              children: [(0, _.jsx)(`strong`, {
                children: f(`开启供应商注册审批`)
              }), (0, _.jsx)(`small`, {
                children: f(`关闭后，新自注册供应商首次建档自动通过，无需先上传资质；已有待审资料、后台创建和后续资料变更仍需人工审核。 `)
              })]
            }), (0, _.jsx)(`input`, {
              type: `checkbox`,
              checked: y.supplierRegistrationApprovalEnabled,
              onChange: e => x({
                ...y,
                supplierRegistrationApprovalEnabled: e.target.checked
              })
            }), (0, _.jsx)(`span`, {
              className: `settings-switch-track`,
              "aria-hidden": `true`
            })]
          }), (0, _.jsxs)(`label`, {
            className: `settings-switch`,
            children: [(0, _.jsxs)(`span`, {
              children: [(0, _.jsx)(`strong`, {
                children: f(`允许同一人提交并审核`)
              }), (0, _.jsx)(`small`, {
                children: f(`适用于供应商资料、收款账户、报价和付款审核；仍需相应审核权限并满足业务条件。 `)
              })]
            }), (0, _.jsx)(`input`, {
              type: `checkbox`,
              checked: y.allowSamePersonReview,
              onChange: e => x({
                ...y,
                allowSamePersonReview: e.target.checked
              })
            }), (0, _.jsx)(`span`, {
              className: `settings-switch-track`,
              "aria-hidden": `true`
            })]
          })]
        })]
      }), h.error && (0, _.jsxs)(s, {
        tone: `red`,
        children: [h.error, ` `, (0, _.jsx)(p, {
          type: `button`,
          onClick: h.reload,
          children: f(`重新加载配置`)
        })]
      }), I && (0, _.jsx)(s, {
        tone: `red`,
        children: I
      }), (0, _.jsxs)(`div`, {
        className: `settings-actions`,
        children: [(0, _.jsx)(p, {
          type: `button`,
          disabled: P,
          onClick: () => {
            L(``), C(h.data.allowAllSuppliersPro), T(h.data.allowAllSuppliersCcmax), D(h.data.forceStopCcmaxIntake === !0), k(String(h.data.ccmaxIntakeConcurrencyLimit ?? 10)), j(String(h.data.ccmaxCreationTimeoutSeconds ?? 120)), N(h.data.allowAllSuppliersCcmaxReauthorization), x({
              ...h.data.policy,
              quoteMultiplierMin: o(h.data.policy.quoteMultiplierMin),
              quoteMultiplierMax: o(h.data.policy.quoteMultiplierMax)
            })
          },
          children: f(`恢复当前值 `)
        }), (0, _.jsx)(p, {
          type: `submit`,
          variant: `primary`,
          icon: `check`,
          disabled: P,
          children: f(P ? `保存中…` : `保存设置`)
        })]
      })]
    }), (0, _.jsx)(`section`, {
      className: `panel cc-intake-system-section`,
      children: (0, _.jsx)(g.Suspense, {
        fallback: (0, _.jsx)(c, {}),
        children: (0, _.jsx)(b, {})
      })
    }), (0, _.jsx)(v, {})]
  })
}
export {
  x as
  default
};
