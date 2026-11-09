// origin: assets/RoleEditor-D-Ljkwz-.js
import {
  G as e,
  X as t,
  Y as n,
  Z as r,
  g as i,
  it as a,
  mt as o,
  rt as s,
  s as c,
  vt as l
} from "./index-Dnr0i-H9.js"; /* empty css                          */
var u = l(r(), 1),
  d = {
    "supplier.read": o(`查看供应商列表与详情`),
    "supplier.write": o(`新建供应商 / 修改资料`),
    "supplier.review": o(`审核资料`),
    "supplier.toggle": o(`启用 / 停用供应商`),
    "supplier.users": o(`管理登录账号`),
    "project.read": o(`查看项目列表与详情`),
    "project.write": o(`新建 / 编辑 / 启停项目`),
    "account.read": o(`查看收款账户`),
    "account.write": o(`提交 / 变更收款账户`),
    "account.review": o(`审核收款账户`),
    "account.sensitive": o(`查看完整收款账号`),
    "quote.read": o(`查看报价列表与详情`),
    "quote.write": o(`提交 / 编辑报价`),
    "quote.review": o(`审核报价`),
    "usage.read": o(`查看账务金额记录`),
    "turnover.read": o(`查看每日营业额`),
    "turnover.write": o(`登记每日营业额`),
    "usage.import": o(`录入手工款 / 接收或作废原始金额`),
    "settlement.read": o(`查看账务结算单`),
    "settlement.create": o(`创建 / 撤回结算单`),
    "settlement.confirm": o(`确认 / 提出结算异议`),
    "settlement.export": o(`导出结算单`),
    "payment.read": o(`查看「付款记录」标签页`),
    "payment.create": o(`申请付款`),
    "payment.review": o(`审核付款申请`),
    "payment.record": o(`人工登记 / 关闭付款`),
    "payment.execute": o(`通过资金通道执行付款`),
    "payment.receipt": o(`供应商核对到账`),
    "payout.provider.read": o(`查看资金通道`),
    "payout.provider.write": o(`维护通道配置`),
    "payout.provider.test": o(`测试通道连接`),
    "payout.call.read": o(`查看付款状态`),
    "payout.reconcile": o(`查询通道结果`),
    "exchange_rate.read": o(`查看「汇率版本」标签页`),
    "exchange_rate.write": o(`新增 / 启停汇率版本`),
    "report.read": o(`查看报表`),
    "report.export": o(`导出报表 CSV`),
    "notification.publish": o(`新建 / 编辑 / 发布通知`),
    "system.users": o(`查看与管理账号`),
    "system.roles": o(`查看与管理角色`),
    "system.settings": o(`查看与修改系统参数`),
    "resource.intake.manage": o(`管理 NewAPI 待分配资源`),
    "resource.request.read": o(`查看资源原始请求`),
    "resource.sensitive": o(`查看资源密钥与模型映射`),
    "resource.read": o(`查看本方或授权资源`),
    "resource.write": o(`保存和提交交付`),
    "resource.dispatch": o(`分发资源`),
    "resource.usage": o(`查询资源消耗`),
    "resource.config.read": o(`查看资源接口配置`),
    "resource.config.write": o(`维护资源接口配置`),
    "resource.config.test": o(`检查资源接口连接`),
    "supplier.agent.manage": o(`管理团队成员`),
    "proxy.read": o(`查看代理配置`),
    "proxy.write": o(`维护代理配置`),
    "audit.read": o(`查看审计日志`),
    "file.write": o(`上传供应商资质附件`),
    "supplier.owner.assign": o(`指定负责运营并查看月度绩效`),
    "workbench.read": o(`查看工作台`),
    "workbench.tasks.read": o(`查看待办`),
    "workbench.monitoring.read": o(`查看站点 RPM / TPM`),
    "workbench.monitoring.configure": o(`配置工作台展示`)
  },
  f = [{
    code: `workbench`,
    name: o(`工作台`),
    pageNames: [o(`工作台`)],
    section: `business`,
    icon: `grid`,
    permissions: [`workbench.read`, `workbench.tasks.read`, `workbench.monitoring.read`, `workbench.monitoring.configure`, `turnover.read`, `turnover.write`]
  }, {
    code: `suppliers`,
    name: o(`供应商管理`),
    pageNames: [o(`供应商管理`), o(`运营归属`)],
    section: `business`,
    icon: `users`,
    permissions: [`supplier.read`, `supplier.write`, `supplier.review`, `supplier.toggle`, `supplier.users`, `supplier.owner.assign`, `file.write`]
  }, {
    code: `supplier-accounts`,
    name: o(`供应商收款账户`),
    pageNames: [o(`供应商收款账户`), o(`收款人汇总`)],
    section: `business`,
    icon: `bank`,
    permissions: [`account.read`, `account.write`, `account.review`, `account.sensitive`]
  }, {
    code: `projects`,
    name: o(`项目管理`),
    section: `business`,
    icon: `quote`,
    permissions: [`project.read`, `project.write`]
  }, {
    code: `quotes`,
    name: o(`报价管理`),
    section: `business`,
    icon: `quote`,
    permissions: [`quote.read`, `quote.write`, `quote.review`]
  }, {
    code: `settlements`,
    name: o(`账务管理`),
    section: `business`,
    icon: `wallet`,
    permissions: [`settlement.read`, `settlement.create`, `settlement.confirm`, `settlement.export`, `usage.read`, `usage.import`, `payment.read`, `payment.create`, `payment.review`, `payment.record`, `payment.execute`, `payment.receipt`, `payout.reconcile`, `exchange_rate.read`, `exchange_rate.write`]
  }, {
    code: `resources`,
    name: o(`资源管理`),
    pageNames: [o(`资源管理`), o(`我的交付`), o(`NewAPI 待分配`)],
    section: `business`,
    icon: `grid`,
    permissions: [`resource.read`, `resource.sensitive`, `resource.intake.manage`, `resource.request.read`, `resource.write`, `resource.dispatch`, `resource.usage`]
  }, {
    code: `resource-targets`,
    name: o(`资源接口配置`),
    section: `system`,
    icon: `settings`,
    permissions: [`resource.config.read`, `resource.config.write`, `resource.config.test`]
  }, {
    code: `outbound-proxies`,
    name: o(`代理配置`),
    section: `business`,
    icon: `settings`,
    permissions: [`proxy.read`, `proxy.write`]
  }, {
    code: `supplier-agents`,
    name: o(`团队成员`),
    section: `business`,
    icon: `users`,
    permissions: [`supplier.agent.manage`]
  }, {
    code: `reports`,
    name: o(`报表中心`),
    section: `business`,
    icon: `audit`,
    permissions: [`report.read`, `report.export`]
  }, {
    code: `users`,
    name: o(`账号管理`),
    section: `system`,
    icon: `users`,
    permissions: [`system.users`]
  }, {
    code: `roles`,
    name: o(`角色与权限`),
    section: `system`,
    icon: `shield`,
    permissions: [`system.roles`]
  }, {
    code: `notice-admin`,
    name: o(`通知管理`),
    section: `system`,
    icon: `bell`,
    permissions: [`notification.publish`]
  }, {
    code: `settings`,
    name: o(`系统参数`),
    pageNames: [o(`系统参数`), o(`任务列表`), o(`执行记录`)],
    section: `system`,
    icon: `settings`,
    permissions: [`system.settings`]
  }, {
    code: `payout-providers`,
    name: o(`资金通道`),
    section: `funds`,
    icon: `bank`,
    permissions: [`payout.provider.read`, `payout.provider.write`, `payout.provider.test`]
  }, {
    code: `payout-calls`,
    name: o(`付款状态`),
    section: `funds`,
    icon: `audit`,
    permissions: [`payout.call.read`]
  }, {
    code: `audits`,
    name: o(`审计日志`),
    section: `system`,
    icon: `audit`,
    permissions: [`audit.read`]
  }],
  p = t();

function m({
  role: t,
  permissions: r,
  scopeTypes: scopeTypes = [],
  onClose: l,
  onSaved: m
}) {
  let h = e => e.toUpperCase().replace(/[^A-Z0-9_]+/g, `_`).replace(/_+/g, `_`).slice(0, 60),
    [g, _] = (0, u.useState)(t === `new` ? `` : t.name),
    [v, y] = (0, u.useState)(t === `new` ? `` : t.code),
    [b, x] = (0, u.useState)(t === `new` ? [] : t.permissions),
    [S, C] = (0, u.useState)(!1),
    [w, T] = (0, u.useState)(``),
    [scopeType, setScopeType] = (0, u.useState)(t === `new` ? `OPERATOR` : t.scopeType || `OPERATOR`),
    E = t !== `new` && t.builtIn === !0,
    scopeMutable = t === `new` || !t.scopeType,
    D = new Set(t !== `new` && t.code === `ADMIN` ? [] : scopeMutable ? scopeTypes.find(scope => scope.code === scopeType)?.allowedPermissions || [] : t.allowedPermissions || []),
    O = f.map(e => ({
      code: e.code,
      name: e.name,
      section: e.section,
      icon: e.icon,
      items: e.permissions.filter(e => r.includes(e))
    })).filter(e => e.items.length),
    k = new Set(O.flatMap(e => e.items)),
    A = r.filter(e => !k.has(e));
  A.length && O.push({
    code: `other`,
    name: o(`其他权限`),
    section: `system`,
    icon: `shield`,
    items: A
  });
  let j = [{
      code: `business`,
      name: o(`业务功能`),
      groups: O.filter(e => e.section === `business`)
    }, {
      code: `funds`,
      name: o(`资金管理`),
      groups: O.filter(e => e.section === `funds`)
    }, {
      code: `system`,
      name: o(`系统管理`),
      groups: O.filter(e => e.section === `system`)
    }].filter(e => e.groups.length),
    M = e => D.has(e) && x(t => t.includes(e) ? t.filter(t => t !== e) : [...t, e]),
    N = e => x(t => {
      const allowed = e.filter(permission => D.has(permission));
      return allowed.every(permission => t.includes(permission)) ? t.filter(permission => !allowed.includes(permission)) : [...new Set([...t, ...allowed])];
    });
  return (0, p.jsx)(e, {
    wide: !0,
    className: `role-permission-dialog`,
    title: o(t === `new` ? `新建角色` : E ? `权限配置` : `编辑角色`),
    onClose: () => {
      S || l()
    },
    children: (0, p.jsxs)(`form`, {
      className: `role-permission-form`,
      onSubmit: async e => {
        e.preventDefault(), C(!0), T(``);
        try {
          let e = {
            code: v,
            name: g,
            permissions: b.filter(permission => D.has(permission)),
            scopeType,
            version: t === `new` ? 0 : t.version
          };
          t === `new` ? await s(`/system/roles`, e) : await a(`/system/roles/` + t.code, e), m()
        } catch (e) {
          T(e.message)
        } finally {
          C(!1)
        }
      },
      children: [(0, p.jsxs)(`div`, {
        className: `form-grid`,
        children: [(0, p.jsxs)(`label`, {
          className: `field`,
          children: [(0, p.jsx)(`span`, {
            children: o(`角色名称`)
          }), (0, p.jsx)(`input`, {
            required: !0,
            disabled: E,
            value: g,
            onChange: e => _(e.target.value)
          })]
        }), (0, p.jsxs)(`label`, {
          className: `field`,
          children: [(0, p.jsx)(`span`, {
            children: o(`角色标识`)
          }), (0, p.jsx)(`input`, {
            required: !0,
            disabled: t !== `new`,
            pattern: `[A-Z][A-Z0-9_]{2,59}`,
            maxLength: 60,
            value: v,
            onChange: e => y(h(e.target.value)),
            placeholder: o(`如 BILLING_VIEWER`)
          }), t === `new` && (0, p.jsx)(`small`, {
            children: o(`自动转为大写标识，空格和符号转为下划线`)
          })]
        }), (0, p.jsxs)(`label`, {
          className: `field`,
          children: [(0, p.jsx)(`span`, { children: `职责范围` }), (0, p.jsx)(`select`, {
            required: !0,
            disabled: !scopeMutable || S,
            value: scopeType,
            onChange: event => {
              setScopeType(event.target.value), x([])
            },
            children: (scopeMutable ? scopeTypes : [{ code: scopeType, name: scopeTypes.find(scope => scope.code === scopeType)?.name || scopeType }]).map(scope => (0, p.jsx)(`option`, {
              value: scope.code,
              children: scope.name || scope.code
            }, scope.code))
          }), (0, p.jsx)(`small`, { children: `创建后职责范围固定；自定义角色只能附加给相同主身份。` })]
        })]
      }), (0, p.jsx)(i, {
        children: `职责范围：${scopeType}。仅可勾选服务器允许的职责权限；灰色权限超出该角色上限，不能通过附加角色扩大身份或数据范围。`
      }), (0, p.jsx)(`div`, {
        className: `permission-tree`,
        children: j.map(e => {
          let t = e.groups.flatMap(e => e.items),
            r = t.filter(e => b.includes(e)).length;
          return (0, p.jsxs)(`section`, {
            className: `permission-tree-section`,
            children: [(0, p.jsxs)(`label`, {
              className: `permission-tree-section-title`,
              children: [(0, p.jsx)(`input`, {
                type: `checkbox`,
                disabled: S || !t.some(permission => D.has(permission)),
                checked: r === t.length,
                ref: e => {
                  e && (e.indeterminate = r > 0 && r < t.length)
                },
                onChange: () => N(t)
              }), (0, p.jsx)(`span`, {
                children: e.name
              }), (0, p.jsxs)(`small`, {
                children: [r, `/`, t.length]
              })]
            }), (0, p.jsx)(`div`, {
              className: `permission-tree-pages`,
              children: e.groups.map(e => {
                let t = e.items.filter(e => b.includes(e)).length;
                return (0, p.jsxs)(`div`, {
                  className: `permission-tree-page`,
                  children: [(0, p.jsxs)(`label`, {
                    className: `permission-tree-page-title`,
                    children: [(0, p.jsx)(`input`, {
                      type: `checkbox`,
                      disabled: S || !e.items.some(permission => D.has(permission)),
                      checked: t === e.items.length,
                      ref: n => {
                        n && (n.indeterminate = t > 0 && t < e.items.length)
                      },
                      onChange: () => N(e.items)
                    }), (0, p.jsx)(`span`, {
                      className: `permission-tree-page-icon`,
                      children: (0, p.jsx)(n, {
                        name: e.icon,
                        size: 15
                      })
                    }), (0, p.jsx)(`strong`, {
                      children: e.name
                    }), (0, p.jsxs)(`small`, {
                      children: [t, `/`, e.items.length]
                    })]
                  }), (0, p.jsx)(`div`, {
                    className: `permission-tree-children`,
                    children: e.items.map(e => (0, p.jsxs)(`label`, {
                      className: `permission-tree-item`,
                      children: [(0, p.jsx)(`input`, {
                        type: `checkbox`,
                        disabled: S || !D.has(e),
                        checked: b.includes(e),
                        onChange: () => M(e)
                      }), (0, p.jsxs)(`span`, {
                        children: [d[e] || e, (0, p.jsx)(`small`, {
                          children: e
                        })]
                      })]
                    }, e))
                  })]
                }, e.code)
              })
            })]
          }, e.code)
        })
      }), w && (0, p.jsx)(i, {
        tone: `red`,
        children: w
      }), (0, p.jsxs)(`div`, {
        className: `dialog-footer`,
        children: [(0, p.jsx)(c, {
          type: `button`,
          disabled: S,
          onClick: l,
          children: o(E ? `关闭` : `取消`)
        }), (0, p.jsx)(c, {
          type: `submit`,
          variant: `primary`,
          disabled: S || t !== `new` && t.code === `ADMIN`,
          children: o(S ? `保存中…` : E ? `保存权限` : `保存角色`)
        })]
      })]
    })
  })
}
export {
  m as RoleEditor
};
