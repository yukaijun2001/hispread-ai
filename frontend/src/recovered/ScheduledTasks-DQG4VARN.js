// origin: assets/ScheduledTasks-DQG4VARN.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/PrioritySupportDialog-DfV-rWYR.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css", "assets/labels-DaPzz6Ie.js", "assets/PrioritySupportDialog-Cwt1ZxpS.css", "assets/intake-D282aV6G.css"]))) => i.map(i => d[i]);
import {
  $ as e,
  C as t,
  I as n,
  P as r,
  S as i,
  X as a,
  Z as o,
  c as s,
  g as c,
  h as l,
  i as u,
  it as d,
  j as today,
  m as f,
  mt as p,
  ot as m,
  p as h,
  s as g,
  vt as _
} from "./index-Dnr0i-H9.js";
import {
  r as v
} from "./systemLabels-DqpNuQ-_.js";
var y = _(o(), 1),
  b = a(),
  x = (0, y.lazy)(() => u(() => import(`./PrioritySupportDialog-DfV-rWYR.js`), __vite__mapDeps([0, 1, 2, 3, 4, 5])));

function S(e) {
  return e === `CCMAX_PRIORITY_ROTATION` ? p(`CCMAX优先级扶持`) : e === `QUOTE_AUTO_RENEWAL` ? p(`报价自动续期`) : e === `WORKBENCH_WECOM_REMINDER` ? p(`工作台待办企业微信提醒`) : e.replace(/_DAILY_SYNC$/, ``)
}

function C(e) {
  return e.running ? e.enabled ? p(`运行中`) : p(`已停用，本轮收尾中`) : e.enabled && !e.ready ? p(`已暂停`) : e.ready ? e.enabled ? p(`已启用`) : p(`已停用`) : p(`暂不可启用`)
}

function isResourceSync(task) {
  return [`CCMAX_DAILY_SYNC`, `CCMAX_STATUS_SYNC`].includes(task.type)
}

function taskDescription(task) {
  if (task.type === `CCMAX_PRIORITY_ROTATION`) return p(`无消费扶持或按比例轮换，规则与周期可配置`);
  if (task.type === `QUOTE_AUTO_RENEWAL`) return p(`按规则生成待审核续期报价，不直接延长或批准`);
  if (task.type === `WORKBENCH_WECOM_REMINDER`) return p(`仅发送待办分类数量`);
  if ([`SETTLEMENT_AUTO_CONFIRM`, `SETTLEMENT_DEADLINE_CONFIRM`].includes(task.type)) return p(`按截止规则确认无异议且来源未变化的结算单`);
  return p(`{0} · 待核对观测同步`, [S(task.type)])
}

function w() {
  let {
    notify: a,
    refresh: o,
    has: u
  } = t(), [_, w] = (0, y.useState)(null), T = u(`resource.read`) && u(`resource.dispatch`), E = i(`/system/scheduled-tasks`), [D, O] = (0, y.useState)(null), [k, A] = (0, y.useState)(null), [j, M] = (0, y.useState)(null), [N, P] = (0, y.useState)(!1), [F, I] = (0, y.useState)(``), [targetOptions, setTargetOptions] = (0, y.useState)([]), [renewalQuotes, setRenewalQuotes] = (0, y.useState)([]), [selectedQuotes, setSelectedQuotes] = (0, y.useState)([]), L = E.data?.filter(e => !e.ready) || [];
  async function R(e) {
    if (!(N || !e.enabled && !e.ready)) {
      P(!0), I(``);
      try {
        await d(`/system/scheduled-tasks/${encodeURIComponent(e.key)}`, {
          enabled: !e.enabled,
          version: e.version
        }), a(e.enabled ? e.running ? p(`任务已停用，当前执行完成后不再调度`) : p(`任务已停用`) : p(`任务已启用`)), o()
      } catch (e) {
        I(e.message), o()
      } finally {
        P(!1)
      }
    }
  }
  async function z(t) {
    if (!N) {
      if (I(``), t.type === `CCMAX_PRIORITY_ROTATION`) {
        w(t.key);
        return
      }
      if (![ `WORKBENCH_WECOM_REMINDER`, `QUOTE_AUTO_RENEWAL` ].includes(t.type) && !isResourceSync(t)) {
        M(null), A(t);
        return
      }
      P(!0);
      try {
        if (t.type === `WORKBENCH_WECOM_REMINDER`) {
          M(await e(`/system/scheduled-tasks/WORKBENCH_WECOM_REMINDER/reminder-settings`));
        } else if (t.type === `QUOTE_AUTO_RENEWAL`) {
          let quotes = [], page = 1, total = 0;
          do {
            const response = await e(`/quotes?state=APPROVED&page=${page}&size=100`);
            if (!Array.isArray(response.items) || !response.items.length && quotes.length < response.total) throw Error(p(`报价列表未完整加载，请重试`));
            quotes.push(...response.items);
            total = response.total;
            page++;
          } while (quotes.length < total);
          setRenewalQuotes(quotes.filter(quote => quote.effectiveTo >= today()));
          setSelectedQuotes(Array.isArray(t.quoteIds) ? t.quoteIds : []);
          M(null);
        } else {
          const targets = await e(`/resource-targets`);
          setTargetOptions(targets.filter(target => [`CUSTOM`, `CCMAX_NATIVE`].includes(target.protocol || `CUSTOM`)));
          M(null);
        }
        A(t)
      } catch (e) {
        I(e.message)
      } finally {
        P(!1)
      }
    }
  }
  async function B(e) {
    if (k) {
      if (k.type === `WORKBENCH_WECOM_REMINDER`) {
        if (!j) throw Error(p(`请重新打开机器人配置`));
        await d(`/system/scheduled-tasks/WORKBENCH_WECOM_REMINDER/reminder-settings`, {
          webhookUrl: e.webhookUrl.trim(),
          workbenchUrl: e.workbenchUrl.trim(),
          clearWebhook: e.clearWebhook === `true`,
          version: j.version
        }), a(p(`机器人配置已保存，下一轮执行使用新配置`)), o();
        return
      }
      const config = {
        name: e.name.trim(),
        version: k.version
      };
      if (isResourceSync(k)) config.targetId = e.targetId === `ALL_COMPATIBLE` ? null : e.targetId;
      if (k.type === `QUOTE_AUTO_RENEWAL`) {
        if (e.autoRenewEnabled === `true` && !selectedQuotes.length) throw Error(p(`请至少选择一条已通过报价`));
        if (selectedQuotes.length > 500) throw Error(p(`最多选择 500 条报价`));
        Object.assign(config, {
          autoRenewEnabled: e.autoRenewEnabled === `true`,
          renewalDays: Number(e.renewalDays),
          renewBeforeDays: Number(e.renewBeforeDays),
          quoteIds: selectedQuotes
        });
      }
      await d(`/system/scheduled-tasks/${encodeURIComponent(k.key)}/config`, config), a(p(`任务配置已保存，下一轮执行使用新配置`)), o()
    }
  }
  return (0, b.jsxs)(`div`, {
    className: `scheduled-tasks-page`,
    children: [(0, b.jsxs)(`div`, {
      className: `scheduled-tasks-toolbar`,
      children: [(0, b.jsx)(`p`, {
        children: p(`管理定时任务，创建后可独立配置和启停。`)
      }), (0, b.jsxs)(f, {
        title: p(`定时任务`),
        children: [T && (0, b.jsx)(g, {
          variant: `primary`,
          onClick: () => w(``),
          children: p(`创建任务`)
        }), (0, b.jsx)(g, {
          icon: `refresh`,
          onClick: o,
          disabled: N,
          children: p(`刷新 `)
        })]
      })]
    }), F && (0, b.jsx)(c, {
      tone: `red`,
      children: F
    }), E.error ? (0, b.jsxs)(c, {
      tone: `red`,
      children: [p(`任务加载失败：`), E.error]
    }) : E.loading && !E.data ? (0, b.jsx)(`div`, {
      className: `scheduled-tasks-loading`,
      children: (0, b.jsx)(l, {})
    }) : E.data?.length ? (0, b.jsxs)(b.Fragment, {
      children: [L.length > 0 && (0, b.jsxs)(`div`, {
        className: `scheduled-task-alert`,
        role: `status`,
        children: [(0, b.jsxs)(`strong`, {
          children: [L.length, p(` 项任务暂不可启用`)]
        }), L.map(e => (0, b.jsxs)(`p`, {
          children: [v(e), p(`： `), e.unavailableReason ? m(e.unavailableReason) : p(`任务执行器尚未接入`)]
        }, e.key))]
      }), (0, b.jsxs)(`section`, {
        className: `panel scheduled-task-table`,
        "aria-label": p(`服务任务`),
        children: [(0, b.jsxs)(`div`, {
          className: `scheduled-task-table-head`,
          children: [(0, b.jsxs)(`div`, {
            children: [(0, b.jsx)(`h2`, {
              children: p(`服务任务`)
            }), (0, b.jsx)(`p`, {
              children: p(`每个任务独立配置运行周期和执行范围`)
            })]
          }), (0, b.jsxs)(`span`, {
            children: [p(`共 `), E.data.length, p(` 项`)]
          })]
        }), (0, b.jsx)(s, {
          data: E.data.map(e => ({
            ...e,
            id: e.key
          })),
          columns: [{
            label: p(`任务`),
            render: e => (0, b.jsxs)(`div`, {
              className: `scheduled-task-name`,
              children: [(0, b.jsx)(`strong`, {
                children: v(e)
              }), (0, b.jsx)(`span`, {
                children: taskDescription(e)
              })]
            })
          }, {
            label: p(`状态`),
            render: e => (0, b.jsxs)(`span`, {
              className: `scheduled-task-state ${e.ready?e.enabled?`enabled`:`disabled`:`blocked`}`,
              children: [(0, b.jsx)(`i`, {
                "aria-hidden": `true`
              }), C(e)]
            })
          }, {
            label: p(`运行周期`),
            render: e => p(`每 {0} 分钟`, [e.intervalMinutes])
          }, {
            label: p(`执行范围`),
            render: e => e.type === `CCMAX_PRIORITY_ROTATION` ? p(`指定供应商或档位范围的就绪账号`) : e.type === `WORKBENCH_WECOM_REMINDER` ? p(`平台全部待办`) : e.type === `QUOTE_AUTO_RENEWAL` ? p(`已选 {0} 条报价`, [e.quoteIds?.length || 0]) : isResourceSync(e) ? e.targetId ? p(`指定目标：{0}`, [e.targetId]) : p(`全部已启用的兼容资源目标`) : p(`平台到期且无异议的待确认结算单`)
          }, {
            label: p(`下次执行`),
            render: e => e.nextRunAt ? r(e.nextRunAt) : p(`未安排`)
          }, {
            label: p(`操作`),
            render: e => (0, b.jsxs)(`div`, {
              className: `scheduled-task-actions`,
              children: [e.type !== `CCMAX_PRIORITY_ROTATION` && (0, b.jsx)(g, {
                disabled: N,
                onClick: () => O(e),
                children: p(`编辑周期 `)
              }), (0, b.jsx)(g, {
                disabled: N || e.type === `CCMAX_PRIORITY_ROTATION` && !T,
                title: p(`可在启用或运行时修改，下一轮执行生效`),
                onClick: () => void z(e),
                children: e.type === `WORKBENCH_WECOM_REMINDER` ? p(`机器人配置`) : p(`任务配置`)
              }), (0, b.jsx)(g, {
                onClick: () => n(`scheduled-task-runs?task=${encodeURIComponent(e.key)}`),
                children: p(`执行记录 `)
              }), (0, b.jsx)(g, {
                disabled: N || !e.enabled && !e.ready || e.type === `CCMAX_PRIORITY_ROTATION` && !T,
                onClick: () => void R(e),
                title: !e.enabled && !e.ready ? e.unavailableReason ? m(e.unavailableReason) : p(`任务执行器尚未接入`) : void 0,
                children: e.enabled ? p(`停用`) : p(`启用`)
              })]
            })
          }]
        })]
      })]
    }) : (0, b.jsxs)(`div`, {
      className: `panel scheduled-tasks-empty`,
      children: [(0, b.jsx)(`strong`, {
        children: p(`还没有定时任务`)
      }), (0, b.jsx)(`p`, {
        children: p(`请检查日账任务迁移是否已应用。`)
      })]
    }), D && (0, b.jsx)(h, {
      title: p(`编辑运行周期`),
      subtitle: v(D),
      fields: [{
        name: `intervalMinutes`,
        label: p(`运行周期（分钟）`),
        type: `number`,
        min: `1`,
        max: `1440`,
        step: `1`,
        required: !0,
        full: !0,
        hint: p(`支持 1–1440 分钟。已启用时，下次执行按新周期安排；当前执行继续完成。`)
      }],
      initial: {
        intervalMinutes: String(D.intervalMinutes)
      },
      onSubmit: async e => {
        await d(`/system/scheduled-tasks/${encodeURIComponent(D.key)}/schedule`, {
          intervalMinutes: Number(e.intervalMinutes),
          version: D.version
        }), a(p(`运行周期已保存`)), o()
      },
      onClose: () => O(null)
    }), _ !== null && (0, b.jsx)(y.Suspense, {
      fallback: (0, b.jsx)(l, {}),
      children: (0, b.jsx)(x, {
        taskKey: _ || void 0,
        onClose: () => w(null),
        onSaved: o
      }, _ || `create`)
    }), k?.type === `WORKBENCH_WECOM_REMINDER` && j && (0, b.jsx)(h, {
      title: p(`编辑企微提醒`),
      subtitle: p(`配置保存后下一轮执行生效，当前执行继续使用原配置。运行周期通过「编辑周期」设置。`),
      fields: [{
        name: `clearWebhook`,
        label: p(`机器人设置`),
        type: `select`,
        options: [{
          value: `false`,
          label: p(`保留或更新机器人`)
        }, {
          value: `true`,
          label: p(`清除已保存机器人`)
        }],
        full: !0
      }, {
        name: `webhookUrl`,
        label: p(`机器人 Webhook 地址`),
        type: `password`,
        required: !j.configured,
        visible: e => e.clearWebhook !== `true`,
        full: !0,
        placeholder: j.configured ? p(`已配置，留空保留原地址`) : p(`粘贴企业微信群机器人的 Webhook 地址`),
        hint: j.configured ? p(`地址已加密保存，不会回显；留空保留，填写新地址则替换。`) : p(`地址加密保存，保存不会发送测试消息。`)
      }, {
        name: `workbenchUrl`,
        label: p(`工作台地址`),
        type: `url`,
        required: !1,
        full: !0,
        hint: p(`可选，须为 HTTPS 地址；没有 HTTPS 地址时请留空。`)
      }],
      initial: {
        clearWebhook: `false`,
        webhookUrl: ``,
        workbenchUrl: j.workbenchUrl || (window.location.protocol === `https:` ? `${window.location.origin}/#/workbench` : ``)
      },
      extra: e => e.clearWebhook === `true` ? (0, b.jsx)(c, {
        tone: `red`,
        children: p(`清除后无法启用提醒，需重新填写机器人地址。`)
      }) : void 0,
      onSubmit: B,
      onClose: () => {
        A(null), M(null)
      }
    }), k && k.type !== `WORKBENCH_WECOM_REMINDER` && (0, b.jsx)(h, {
      title: k.type === `QUOTE_AUTO_RENEWAL` ? p(`配置报价自动续期`) : p(`编辑定时任务`),
      subtitle: p(`{0} · 保存后下一轮执行生效，当前执行继续完成。`, [S(k.type)]),
      fields: [{
        name: `name`,
        label: p(`任务名称`),
        max: `128`,
        minLength: 1
      }, ...(isResourceSync(k) ? [{
        name: `targetId`, label: p(`执行目标`), type: `select`, full: true,
        options: [
          {value:`ALL_COMPATIBLE`,label:p(`全部已启用的兼容资源目标`)},
          ...(k.targetId && !targetOptions.some(target => target.id === k.targetId) ? [{value:k.targetId,label:p(`当前目标：{0}`, [k.targetId])}] : []),
          ...targetOptions.map(target => ({value:target.id,label:`${target.name || target.id}${target.enabled ? `` : p(`（已停用）`)}`}))
        ],
        hint: p(`指定后仅处理该目标；选择全部会扩大执行范围，停用的目标不会执行。`)
      }] : []), ...(k.type === `QUOTE_AUTO_RENEWAL` ? [{
        name: `autoRenewEnabled`, label: p(`续期规则`), type: `select`, full: true,
        options: [{value:`false`,label:p(`停用续期规则`)},{value:`true`,label:p(`生成待审核续期申请`)}]
      }, {
        name: `renewalDays`, label: p(`续期天数`), type: `number`, min: `1`, max: `365`, step: `1`,
        hint: p(`1–365 天，不自动批准新报价。`)
      }, {
        name: `renewBeforeDays`, label: p(`提前天数`), type: `number`, min: `0`, max: `30`, step: `1`,
        hint: p(`0–30 天，到期窗口内才生成申请。`)
      }] : [])],
      initial: {
        name: k.name,
        targetId: k.targetId || `ALL_COMPATIBLE`,
        autoRenewEnabled: String(!!k.autoRenewEnabled),
        renewalDays: String(k.renewalDays ?? 30),
        renewBeforeDays: String(k.renewBeforeDays ?? 2)
      },
      extra: k.type === `QUOTE_AUTO_RENEWAL` ? () => (0, b.jsxs)(`fieldset`, {
        className: `form-section`,
        children: [(0, b.jsx)(`legend`, {children:p(`选择已通过报价（最多 500 条）`)}),
          !renewalQuotes.length && !selectedQuotes.length && (0, b.jsx)(`p`, {children:p(`没有可续期的已通过报价`)}),
          ...[...renewalQuotes, ...selectedQuotes.filter(id => !renewalQuotes.some(quote => quote.id === id)).map(id => ({id,code:id,unavailable:true}))].map(quote => (0, b.jsxs)(`label`, {
            className: `policy-check`,
            children:[(0, b.jsx)(`input`, {
              type:`checkbox`, name:`renewalQuote`, value:quote.id,
              checked:selectedQuotes.includes(quote.id),
              onChange:event => setSelectedQuotes(selected => event.target.checked ? [...selected,quote.id] : selected.filter(id => id !== quote.id))
            }), (0,b.jsx)(`span`, {children:`${quote.code || quote.id} · ${quote.supplierName || ``} · ${quote.projectName || ``} ${quote.unavailable ? p(`（已失效，请取消选择）`) : ``}`})]
          },quote.id)),
          (0, b.jsx)(`p`, {children:p(`已选 {0} 条；保存规则不立即执行，启用任务后按周期生成待审报价。`,[selectedQuotes.length])})]
      }) : undefined,
      onSubmit: B,
      onClose: () => A(null)
    })]
  })
}
export {
  w as
  default
};
