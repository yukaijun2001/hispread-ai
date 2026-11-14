// origin: assets/systemLabels-DqpNuQ-_.js
import {
  ht as e,
  mt as t
} from "./index-Dnr0i-H9.js";
var n = t => t ? e(`unit`, t) : ``;

function r(e) {
  let n = {
    CCMAX优先级扶持: t(`CCMAX优先级扶持`),
    ADMIN: `平台管理员`,
    OPERATOR: `平台运营`,
    FINANCE: `财务人员`,
    SUPPLIER: `供应商`,
    SUPPLIER_AGENT: `团队成员`
  } [e.code];
  return e.builtIn !== !1 && n === e.name ? t(n) : e.name
}

function i(e) {
  let n = {
    "CCMAX 日账同步": t(`CCMAX 日账同步`),
    "CCMAX 状态与费用同步": t(`交付状态同步`),
    报价自动续期: t(`报价自动续期`),
    工作台待办企业微信提醒: t(`工作台待办企业微信提醒`)
  };
  return Object.hasOwn(n, e.name) ? n[e.name] : e.name
}

function a(e) {
  if (e.capacityType === `ACCOUNT_COUNT`) return t(`可提供账号数（个）`);
  if (e.capacityType === `THROUGHPUT`) return t(`项目合计每分钟调用能力`);
  if (e.capacityType !== `ACCOUNT_QUOTA`) return t(`能力口径待配置`);
  let n = e.capacityPeriod === `DAY` ? t(`每日额度`) : e.capacityPeriod === `MONTH` ? t(`每月额度`) : t(`总额度`),
    r = e.capacityScope === `PER_ACCOUNT` ? t(`单账号`) : t(`全部账号合计`);
  return t(`{0} · {1}（{2}）`, [r, n, e.capacityCurrency ?? ``])
}
export {
  n as i, r as n, i as r, a as t
};