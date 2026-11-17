// Notification titles and bodies arrive as Chinese templates from the server;
// these helpers translate the known shapes.
import { formatDiscount, getLocale, t, translateServerMessage } from './i18n';

export interface NotificationItem {
  id: string;
  eventType: string;
  title: string;
  body: string;
  targetPath?: string | null;
  createdAt?: string;
  readAt?: string | null;
}

function translateChange(text: string): string {
  return text
    .replace(/倍率改为 (\d+(?:\.\d+)?) 倍/g, (_m, ratio) => t('折扣改为 {0}', [formatDiscount(ratio)]))
    .replace(/单价改为 ([^；，]+)/g, (_m, price) => t('单价改为 {0}', [price]))
    .replace(/期间改为 (\d{4}-\d{2}-\d{2}) 至 (\d{4}-\d{2}-\d{2})/g, (_m, from, to) => t('期间改为 {0} 至 {1}', [from, to]))
    .replace(/，(\d{4}-\d{2}-\d{2}) 起/g, (_m, date) => t('，{0} 起', [date]))
    .replace(/；/g, getLocale() === 'zh-CN' ? '；' : '; ');
}

export function notificationTitle(item: NotificationItem): string {
  return item.eventType === 'SYSTEM_NOTICE' ? item.title : item.title.split(' · ').map(translateServerMessage).join(' · ');
}

function notificationBody(item: NotificationItem): string {
  const body = item.body;
  if (item.eventType === 'SYSTEM_NOTICE') return body;
  if (item.eventType.startsWith('QUOTE_')) {
    const change = /^报价 ([\s\S]+)：(倍率改为[\s\S]+|单价改为[\s\S]+|期间改为[\s\S]+)。([^。]+)。$/.exec(body);
    if (change) return t('报价 {0}：{1}。{2}。', [change[1], translateChange(change[2]), translateServerMessage(change[3])]);
    const state = /^报价 ([\s\S]+) · ([^。]+)。$/.exec(body);
    if (state) return t('报价 {0} · {1}。', [state[1], translateServerMessage(state[2])]);
  }
  if (item.eventType.startsWith('SETTLEMENT_')) {
    const deadline = /^结算单 ([\s\S]+)。请于 ([\s\S]+) 前确认；逾期未提出异议将自动确认。$/.exec(body);
    if (deadline) return t('结算单 {0}。请于 {1} 前确认；逾期未提出异议将自动确认。', [deadline[1], deadline[2]]);
    const auto = /^结算单 ([\s\S]+) 已因超过确认截止时间且未收到异议而自动确认。$/.exec(body);
    if (auto) return t('结算单 {0} 已因超过确认截止时间且未收到异议而自动确认。', [auto[1]]);
    const amount = /^结算单 ([\s\S]+) 的最新应收金额为 ([\s\S]+)，请核对最新版本。$/.exec(body);
    if (amount) return t('结算单 {0} 的最新应收金额为 {1}，请核对最新版本。', [amount[1], amount[2]]);
  }
  const generic = /^([\s\S]+) · ([^。]+)。$/.exec(body);
  if (generic) {
    let subject = generic[1];
    const record = /^(供应商资料|业务记录|结算单|付款记录|收款账户记录) ([\s\S]+)$/.exec(subject);
    if (record) subject = `${translateServerMessage(record[1])} ${record[2]}`;
    subject = subject.replace(/（尾号 ([^）]+)）$/g, (_m, tail) => t('（尾号 {0}）', [tail]));
    return t('{0} · {1}。', [subject, translateServerMessage(generic[2])]);
  }
  return translateServerMessage(body);
}

export function notificationSummary(item: NotificationItem): string {
  if (item.body !== '请进入对应记录查看详情。') return notificationBody(item);
  const id = new URLSearchParams((item.targetPath ?? '').split('?')[1] || '').get('id');
  return id ? t('关联记录 {0} · 点击查看完整业务信息。', [id.slice(0, 8).toUpperCase()]) : t('点击查看完整业务信息。');
}
