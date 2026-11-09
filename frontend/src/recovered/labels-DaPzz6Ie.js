// origin: assets/labels-DaPzz6Ie.js
import {
  mt as e,
  pt as t
} from "./index-Dnr0i-H9.js";
var n = {
    FALLBACK: e(`补充兜底`),
    NORMAL: e(`常规`),
    PAYMENT_TERM: e(`账期优先`),
    PARTNER: e(`重点合作`),
    TEMPORARY: e(`临时调度`)
  },
  r = {
    PREPARING: e(`查询原值中`),
    PREVIEW: e(`待执行`),
    PENDING: e(`等待处理`),
    SUBMITTING: e(`提交中`),
    VERIFYING: e(`核实中`),
    UPDATED: e(`已更新`),
    UNCHANGED: e(`无需修改`),
    FAILED: e(`失败`),
    UNKNOWN: e(`待核实`),
    SKIPPED: e(`已跳过`)
  },
  i = n => n === null ? e(`不限`) : n.toLocaleString(t());

function a(t) {
  return t.startsWith(`U:`) ? e(`个人预留`) : t.startsWith(`G:`) ? e(`交付组共享池`) : e(`供应商共享池`)
}

function o(t, n) {
  if (t) return e(`可上号`);
  let r = {
    PLATFORM_STOPPED: e(`平台已停收`),
    SUPPLIER_DISABLED: e(`供应商未开通`),
    NON_PRO_STOPPED: e(`非PRO暂停接收`),
    PRO_DISABLED: e(`未开通PRO`),
    GROUP_PRO_DISABLED: e(`交付组未开通PRO`),
    NO_QUOTA: e(`今日额度为0`),
    QUOTA_RECLAIMED: e(`个人额度已回收`),
    QUOTA_RESERVED: e(`共享额度已预留`),
    QUOTA_FULL: e(`当前来源额度用尽`),
    NON_PRO_UNAVAILABLE: e(`非PRO来源暂无额度`)
  };
  return n && r[n] || e(`当前账号暂不接收`)
}
export {
  n as a, a as i, o as n, r, i as t
};