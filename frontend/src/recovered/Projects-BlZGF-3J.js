// origin: assets/Projects-BlZGF-3J.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/IntakeProjectTypes-FBnV0kVR.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css"]))) => i.map(i => d[i]);
import {
  $ as e,
  C as t,
  E as n,
  G as r,
  O as i,
  P as ee,
  S as a,
  X as o,
  Z as s,
  _ as c,
  c as l,
  ct as u,
  f as te,
  g as d,
  h as f,
  i as p,
  it as m,
  lt as ne,
  m as re,
  mt as h,
  o as g,
  p as _,
  rt as v,
  s as y,
  u as b,
  ut as ie,
  vt as x,
  w as ae,
  y as oe
} from "./index-Dnr0i-H9.js";
import {
  i as se,
  t as ce
} from "./systemLabels-DqpNuQ-_.js";
var S = x(s(), 1),
  C = o(),
  le = (0, S.lazy)(() => p(() => import(`./IntakeProjectTypes-FBnV0kVR.js`), __vite__mapDeps([0, 1, 2])));

function w() {
  let {
    has: o,
    notify: s,
    refresh: p
  } = t(), [x, w] = (0, S.useState)(``), [T, E] = (0, S.useState)(1), [D, O] = (0, S.useState)(10), [k, ue] = (0, S.useState)(``), [A, de] = (0, S.useState)(``), [j, fe] = (0, S.useState)(``), [M, pe] = (0, S.useState)(``), [N, P] = (0, S.useState)(null), [F, I] = (0, S.useState)(null), [L, R] = (0, S.useState)(null), [z, B] = (0, S.useState)(!1), [V, H] = (0, S.useState)(null), [U, W] = (0, S.useState)(null), [G, K] = (0, S.useState)(!1), [q, J] = (0, S.useState)(``), me = a(`/projects/categories`), Y = a(`/projects/category-codes`), X = new Map((Y.data || []).map(e => [e.code, e])), Z = a(`/projects?search=${encodeURIComponent(x)}&category=${encodeURIComponent(k)}&settlementMethod=${A}&deliveryMethod=${j}&enabled=${M}&page=${T}&size=${D}`), Q = e => t => {
    e(t), E(1)
  }, $ = () => {
    W(null), J(``), B(!0)
  }, he = async () => {
    if (U && !G) {
      K(!0), J(``);
      try {
        await e(`/projects/category-codes/${encodeURIComponent(U.code)}?version=${U.version}`, {
          method: `DELETE`
        }), p(), s(h(`项目大类已删除`)), $()
      } catch (e) {
        J(e instanceof Error ? e.message : h(`删除失败，请重试`))
      } finally {
        K(!1)
      }
    }
  }, ge = [{
    name: `category`,
    label: h(`项目大类`),
    type: `select`,
    full: !0,
    hint: h(`大类选项在“维护大类码值”中新增和启停`),
    options: (Y.data || []).map(e => ({
      value: e.code,
      label: e.name,
      detail: e.code,
      disabled: !e.enabled && (N === `new` || N?.category !== e.code)
    }))
  }, {
    name: `name`,
    label: h(`项目名称`),
    full: !0
  }, {
    name: `settlementMethod`,
    label: h(`结算方式`),
    type: `select`,
    options: [{
      value: `QUOTA`,
      label: h(`额度结算`),
      tone: `blue`
    }, {
      value: `ACCOUNT_BUYOUT`,
      label: h(`账号买断`),
      tone: `teal`
    }]
  }, {
    name: `deliveryMethod`,
    label: h(`交付方式`),
    type: `select`,
    options: [{
      value: `ACCOUNT`,
      label: h(`交付账号`),
      tone: `blue`
    }, {
      value: `KEY`,
      label: h(`交付密钥`),
      tone: `teal`
    }, {
      value: `RELAY`,
      label: h(`中转站`),
      tone: `violet`
    }]
  }, {
    name: `capacityType`,
    label: h(`能力类型`),
    type: `select`,
    full: !0,
    clearOnChange: [`capacityScope`, `capacityPeriod`, `capacityCurrency`],
    hint: h(`首版每个项目只使用一种能力口径`),
    options: [{
      value: `ACCOUNT_COUNT`,
      label: h(`账号数量`),
      tone: `blue`
    }, {
      value: `ACCOUNT_QUOTA`,
      label: h(`账号额度`),
      tone: `teal`
    }, {
      value: `THROUGHPUT`,
      label: h(`调用能力（RPM + TPM）`),
      tone: `violet`
    }]
  }, {
    name: `capacityScope`,
    label: h(`额度范围`),
    type: `select`,
    visible: e => e.capacityType === `ACCOUNT_QUOTA`,
    options: [{
      value: `PER_ACCOUNT`,
      label: h(`单账号`),
      tone: `blue`
    }, {
      value: `TOTAL`,
      label: h(`全部账号合计`),
      tone: `teal`
    }]
  }, {
    name: `capacityPeriod`,
    label: h(`额度周期`),
    type: `select`,
    visible: e => e.capacityType === `ACCOUNT_QUOTA`,
    options: [{
      value: `TOTAL`,
      label: h(`总额度`),
      tone: `blue`
    }, {
      value: `DAY`,
      label: h(`每日`),
      tone: `teal`
    }, {
      value: `MONTH`,
      label: h(`每月`),
      tone: `violet`
    }]
  }, {
    name: `capacityCurrency`,
    label: h(`额度面值币种`),
    type: `select`,
    visual: `currency`,
    visible: e => e.capacityType === `ACCOUNT_QUOTA`,
    options: [`USD`, `CNY`, `USDT`].map(e => ({
      value: e,
      label: e
    }))
  }, {
    name: `enabled`,
    label: h(`状态`),
    type: `select`,
    options: [{
      value: `true`,
      label: h(`启用`),
      tone: `approved`
    }, {
      value: `false`,
      label: h(`停用`),
      tone: `withdrawn`
    }]
  }, {
    name: `suggestedMultiplier`,
    label: h(`建议折扣`),
    required: !1,
    placeholder: h(`例如 27`),
    hint: h(`输入 27 表示 27折（原金额的 27%）。仅作建议，不限制实际报价。`)
  }, {
    name: `description`,
    label: h(`项目说明`),
    type: `textarea`,
    full: !0,
    required: !1
  }];
  return (0, C.jsxs)(C.Fragment, {
    children: [(0, C.jsx)(re, {
      title: h(`项目管理`),
      children: o(`project.write`) && (0, C.jsxs)(C.Fragment, {
        children: [(0, C.jsx)(y, {
          onClick: () => B(!0),
          children: h(`维护大类码值`)
        }), (0, C.jsx)(y, {
          icon: `plus`,
          variant: `primary`,
          onClick: () => {
            R(null), P(`new`)
          },
          children: h(`新建项目 `)
        })]
      })
    }), (0, C.jsxs)(`section`, {
      className: `panel`,
      children: [(0, C.jsxs)(te, {
        className: `projects-toolbar`,
        actions: (0, C.jsx)(y, {
          icon: `refresh`,
          "aria-label": h(`刷新项目`),
          onClick: p
        }),
        children: [(0, C.jsx)(oe, {
          value: x,
          onChange: Q(w),
          placeholder: h(`搜索项目大类、名称或编号`)
        }), (0, C.jsx)(b, {
          value: k,
          onChange: Q(ue),
          ariaLabel: h(`项目大类筛选`),
          visual: `project`,
          compact: !0,
          options: [{
            value: ``,
            label: h(`全部大类`)
          }, ...(me.data || []).map(e => ({
            value: e,
            label: X.get(e)?.name || e
          }))]
        }), (0, C.jsx)(b, {
          value: A,
          onChange: Q(de),
          ariaLabel: h(`结算方式筛选`),
          compact: !0,
          options: [{
            value: ``,
            label: h(`全部结算方式`)
          }, {
            value: `QUOTA`,
            label: i.QUOTA
          }, {
            value: `ACCOUNT_BUYOUT`,
            label: i.ACCOUNT_BUYOUT
          }]
        }), (0, C.jsx)(b, {
          value: j,
          onChange: Q(fe),
          ariaLabel: h(`交付方式筛选`),
          compact: !0,
          options: [{
            value: ``,
            label: h(`全部交付方式`)
          }, {
            value: `ACCOUNT`,
            label: n.ACCOUNT
          }, {
            value: `KEY`,
            label: n.KEY
          }, {
            value: `RELAY`,
            label: n.RELAY
          }]
        }), (0, C.jsx)(b, {
          value: M,
          onChange: Q(pe),
          ariaLabel: h(`项目状态筛选`),
          compact: !0,
          options: [{
            value: ``,
            label: h(`全部状态`)
          }, {
            value: `true`,
            label: h(`启用`),
            tone: `approved`
          }, {
            value: `false`,
            label: h(`停用`),
            tone: `withdrawn`
          }]
        })]
      }), (0, C.jsx)(l, {
        data: Z.data?.items || [],
        loading: Z.loading,
        error: Z.error,
        columns: [{
          label: h(`项目大类`),
          render: e => e.categoryName || e.category || h(`未分类`)
        }, {
          label: h(`项目`),
          render: e => (0, C.jsxs)(`div`, {
            className: `stack`,
            children: [(0, C.jsx)(`strong`, {
              children: e.name
            }), (0, C.jsx)(`small`, {
              children: e.code
            })]
          })
        }, {
          label: h(`结算方式`),
          render: e => i[e.settlementMethod || `LEGACY`]
        }, {
          label: h(`交付方式`),
          render: e => n[e.deliveryMethod || `LEGACY`]
        }, {
          label: h(`报价单位`),
          render: e => se(e.unit)
        }, {
          label: h(`建议折扣`),
          render: e => e.suggestedMultiplier == null || e.suggestedMultiplier === `` ? `` : ie(e.suggestedMultiplier)
        }, {
          label: h(`能力口径`),
          render: e => (0, C.jsxs)(`div`, {
            className: `stack`,
            children: [(0, C.jsx)(`strong`, {
              children: e.capacityType ? ae[e.capacityType] : h(`待配置`)
            }), (0, C.jsx)(`small`, {
              children: ce(e)
            })]
          })
        }, {
          label: h(`状态`),
          render: e => (0, C.jsx)(g, {
            state: e.enabled ? `APPROVED` : `WITHDRAWN`,
            label: e.enabled ? h(`启用`) : h(`停用`)
          })
        }, {
          label: h(`最近更新`),
          render: e => ee(e.updatedAt)
        }, {
          label: h(`操作`),
          render: e => o(`project.write`) ? (0, C.jsxs)(`div`, {
            className: `row-actions`,
            children: [(0, C.jsx)(`button`, {
              className: `text-button`,
              onClick: () => I(e),
              children: h(`接口交付类型 `)
            }), (0, C.jsx)(`button`, {
              className: `text-button`,
              onClick: () => {
                R(e), P(`new`)
              },
              children: h(`复制 `)
            }), (0, C.jsx)(`button`, {
              className: `text-button`,
              onClick: () => {
                R(null), P(e)
              },
              children: h(`编辑 `)
            })]
          }) : (0, C.jsx)(`span`, {
            className: `muted`,
            children: h(`只读`)
          })
        }]
      }), (0, C.jsx)(c, {
        data: Z.data,
        page: T,
        onPage: E,
        size: D,
        onSizeChange: e => {
          O(e), E(1)
        }
      })]
    }), z && !V && (0, C.jsx)(r, {
      title: h(`项目大类码值`),
      className: `project-category-dialog`,
      onClose: () => B(!1),
      children: (0, C.jsxs)(`div`, {
        className: `project-category-codes`,
        children: [(0, C.jsxs)(`div`, {
          className: `panel-toolbar`,
          children: [(0, C.jsx)(`span`, {
            className: `muted`,
            children: h(`码值创建后固定；停用不改变已有项目。`)
          }), (0, C.jsx)(y, {
            icon: `plus`,
            variant: `primary`,
            onClick: () => {
              B(!1), H(`new`)
            },
            children: h(`新增大类 `)
          })]
        }), (0, C.jsx)(l, {
          data: Y.data || [],
          loading: Y.loading,
          error: Y.error,
          columns: [{
            label: h(`大类名称`),
            render: e => (0, C.jsx)(`strong`, {
              children: e.name
            })
          }, {
            label: h(`码值`),
            render: e => (0, C.jsx)(`span`, {
              className: `subtle`,
              children: e.code
            })
          }, {
            label: h(`关联项目`),
            render: e => e.projectCount
          }, {
            label: h(`状态`),
            render: e => (0, C.jsx)(g, {
              state: e.enabled ? `APPROVED` : `WITHDRAWN`,
              label: e.enabled ? h(`启用`) : h(`停用`)
            })
          }, {
            label: h(`操作`),
            render: e => (0, C.jsxs)(`div`, {
              className: `row-actions`,
              children: [(0, C.jsx)(`button`, {
                className: `text-button`,
                onClick: () => {
                  B(!1), H(e)
                },
                children: h(`编辑 `)
              }), e.projectCount > 0 ? (0, C.jsx)(`span`, {
                title: h(`该大类已有项目关联，不能删除`),
                children: (0, C.jsx)(`button`, {
                  className: `text-button`,
                  disabled: !0,
                  children: h(`删除 `)
                })
              }) : (0, C.jsx)(`button`, {
                className: `text-button danger-text`,
                onClick: () => {
                  B(!1), J(``), W(e)
                },
                children: h(`删除 `)
              })]
            })
          }]
        })]
      })
    }), U && (0, C.jsxs)(r, {
      title: h(`删除项目大类`),
      onClose: () => {
        G || $()
      },
      children: [(0, C.jsxs)(d, {
        tone: `amber`,
        children: [h(`确定删除“`), U.name, h(`”（`), U.code, h(`）吗？删除后不能再用于新项目。 `)]
      }), q && (0, C.jsx)(d, {
        tone: `red`,
        children: q
      }), (0, C.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, C.jsx)(y, {
          disabled: G,
          onClick: $,
          children: h(`取消 `)
        }), (0, C.jsx)(y, {
          className: `danger-quiet`,
          disabled: G,
          onClick: () => void he(),
          children: h(G ? `删除中…` : `确认删除`)
        })]
      })]
    }), V && (0, C.jsx)(_, {
      title: h(V === `new` ? `新增项目大类` : `编辑项目大类`),
      subtitle: V === `new` ? h(`新增后即可用于项目创建。`) : h(`码值 {0} · 已关联 {1} 个项目`, [V.code, V.projectCount]),
      fields: [...V === `new` ? [{
        name: `code`,
        label: h(`大类码值`),
        hint: h(`2-40位字母、数字、下划线或短横线；创建后不可修改`),
        full: !0
      }] : [], {
        name: `name`,
        label: h(`大类名称`),
        full: !0
      }, ...V === `new` ? [] : [{
        name: `enabled`,
        label: h(`状态`),
        type: `select`,
        options: [{
          value: `true`,
          label: h(`启用`),
          tone: `approved`
        }, {
          value: `false`,
          label: h(`停用`),
          tone: `withdrawn`
        }]
      }]],
      initial: V === `new` ? {} : {
        name: V.name,
        enabled: String(V.enabled)
      },
      onClose: () => {
        H(null), B(!0)
      },
      onSubmit: async e => {
        V === `new` ? await v(`/projects/category-codes`, {
          code: e.code.trim(),
          name: e.name.trim()
        }) : await m(`/projects/category-codes/${encodeURIComponent(V.code)}`, {
          name: e.name.trim(),
          enabled: e.enabled === `true`,
          version: V.version
        }), p(), s(h(`项目大类已保存`))
      }
    }), F && (0, C.jsx)(S.Suspense, {
      fallback: (0, C.jsx)(f, {}),
      children: (0, C.jsx)(le, {
        project: F,
        onClose: () => I(null)
      })
    }), N && (0, C.jsx)(_, {
      title: h(N === `new` ? L ? `复制项目` : `新建项目` : `编辑项目`),
      subtitle: N === `new` ? h(`项目编号将在保存后由系统自动生成。`) : void 0,
      fields: ge,
      initial: N === `new` ? L ? {
        category: L.category,
        name: L.name,
        description: L.description,
        enabled: String(L.enabled),
        settlementMethod: L.settlementMethod === `LEGACY` ? `QUOTA` : L.settlementMethod,
        deliveryMethod: L.deliveryMethod === `LEGACY` ? `KEY` : L.deliveryMethod,
        capacityType: L.capacityType || `ACCOUNT_QUOTA`,
        capacityScope: L.capacityScope || `TOTAL`,
        capacityPeriod: L.capacityPeriod || `TOTAL`,
        capacityCurrency: L.capacityCurrency || `USD`,
        suggestedMultiplier: u(L.suggestedMultiplier || ``)
      } : {
        enabled: `true`,
        settlementMethod: `QUOTA`,
        deliveryMethod: `KEY`,
        capacityType: `ACCOUNT_QUOTA`,
        capacityScope: `TOTAL`,
        capacityPeriod: `TOTAL`,
        capacityCurrency: `USD`
      } : {
        name: N.name,
        category: N.category,
        enabled: String(N.enabled),
        description: N.description,
        settlementMethod: N.settlementMethod === `LEGACY` ? `` : N.settlementMethod,
        deliveryMethod: N.deliveryMethod === `LEGACY` ? `` : N.deliveryMethod,
        capacityType: N.capacityType || ``,
        capacityScope: N.capacityScope || ``,
        capacityPeriod: N.capacityPeriod || ``,
        capacityCurrency: N.capacityCurrency || ``,
        suggestedMultiplier: u(N.suggestedMultiplier || ``)
      },
      onClose: () => {
        P(null), R(null)
      },
      onSubmit: async e => {
        let t = {
          category: e.category.trim(),
          name: e.name,
          settlementMethod: e.settlementMethod,
          deliveryMethod: e.deliveryMethod,
          capacityType: e.capacityType,
          capacityScope: e.capacityType === `ACCOUNT_QUOTA` ? e.capacityScope : null,
          capacityPeriod: e.capacityType === `ACCOUNT_QUOTA` ? e.capacityPeriod : null,
          capacityCurrency: e.capacityType === `ACCOUNT_QUOTA` ? e.capacityCurrency : null,
          description: e.description || ``,
          suggestedMultiplier: ne((e.suggestedMultiplier || ``).trim()),
          enabled: e.enabled === `true`,
          version: N === `new` ? 0 : N.version
        };
        N === `new` ? await v(`/projects`, t) : await m(`/projects/` + N.id, t), p(), s(h(`项目已保存`))
      }
    })]
  })
}
export {
  w as
  default
};