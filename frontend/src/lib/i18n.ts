// Locale resolution and translation. Chinese source text is the key; English
// comes from the dictionary. The locale is fixed for the page lifetime —
// switching stores the preference and reloads.
export type Locale = 'zh-CN' | 'en-US';
export type LanguagePreference = Locale | 'auto';

const STORAGE_KEY = 'hispread.language';
const CHINA_TIME_ZONES = new Set(['Asia/Shanghai', 'Asia/Urumqi', 'Asia/Chongqing', 'Asia/Chungking', 'Asia/Harbin', 'PRC']);
const entries: Record<string, string> = {};

export const GENERIC_ERROR = 'The operation could not be completed. Please refresh and try again, or contact support with the request reference.';

export function languagePreference(): LanguagePreference {
  try {
    const fromUrl = new URL(window.location.href).searchParams.get('language');
    if (fromUrl === 'zh-CN' || fromUrl === 'en-US') return fromUrl;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'zh-CN' || stored === 'en-US' ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

function resolveLocale(): Locale {
  const preference = languagePreference();
  if (preference !== 'auto') return preference;
  let zone = '';
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* keep empty */ }
  return CHINA_TIME_ZONES.has(zone) ? 'zh-CN' : 'en-US';
}

const locale = resolveLocale();
export const getLocale = (): Locale => locale;

let dictionaryReady: Promise<void> | undefined;

/** English copy stays out of the Chinese startup bundle. */
export function loadDictionary(): Promise<void> {
  if (locale !== 'en-US') return Promise.resolve();
  dictionaryReady ??= import('../i18n/en-US.js').then((module) => {
    Object.assign(entries, module.default as Record<string, string>);
  });
  return dictionaryReady;
}

export function setLanguagePreference(preference: LanguagePreference) {
  const url = new URL(window.location.href);
  url.searchParams.delete('language');
  try {
    if (preference === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    if (preference !== 'auto') url.searchParams.set('language', preference);
  }
  if (url.href === window.location.href) window.location.reload();
  else window.location.assign(url.href);
}

export const lookup = (key: string): string | undefined => (Object.hasOwn(entries, key) ? entries[key] : undefined);

/** Translate `key`, replacing `{n}` with `args[n]`. A first argument of 1 selects the `key|one` form. */
export function t(key: string, args: readonly unknown[] = []): string {
  const first = args[0];
  const english = ((first === 1 || first === 1n || first === '1') ? lookup(`${key}|one`) : undefined) ?? lookup(key);
  return (locale === 'zh-CN' ? key : english ?? key)
    .replace(/\{(\d+)\}/g, (match, index) => (Number(index) < args.length ? String(args[Number(index)]) : match));
}

export const translateOnly = (key: string): string => (locale === 'zh-CN' ? key : lookup(key) ?? key);
export const translateInContext = (context: string, text: string): string =>
  (locale === 'zh-CN' ? text : lookup(`${context}::${text}`) ?? text);

const HAN = /\p{Script=Han}/u;
const fragments = Object.keys(entries)
  .filter((key) => HAN.test(key) && !/\{\d+\}/.test(key) && key.trim().length >= 2)
  .sort((a, b) => b.length - a.length);
let fragmentPattern: RegExp | undefined;

/** Best-effort translation of free text by replacing known fragments; unknown Chinese falls back to a generic message. */
export function translateFreeText(text: string): string {
  if (locale === 'zh-CN' || !HAN.test(text)) return text;
  const exact = lookup(text);
  if (exact !== undefined) return exact;
  fragmentPattern ??= new RegExp(fragments.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const replaced = text.replace(fragmentPattern, (fragment) => entries[fragment]);
  return HAN.test(replaced) ? GENERIC_ERROR : replaced;
}

export function applyDocumentLanguage() {
  document.documentElement.lang = locale;
}

/** Shift the decimal point of a non-negative decimal string by `places`. */
export function shiftDecimal(value: string, places: number): string {
  if (!/^\d+(?:\.\d*)?$/.test(value)) return value;
  const [whole, fraction = ''] = value.split('.');
  const digits = whole + fraction;
  const point = whole.length + places;
  const shifted = point <= 0
    ? `0.${'0'.repeat(-point)}${digits}`
    : point >= digits.length ? digits + '0'.repeat(point - digits.length) : `${digits.slice(0, point)}.${digits.slice(point)}`;
  const [head, tail = ''] = shifted.split('.');
  const trimmed = tail.replace(/0+$/, '');
  return (head.replace(/^0+(?=\d)/, '') || '0') + (trimmed ? `.${trimmed}` : '');
}
export const times100 = (value: string) => shiftDecimal(value, 2);
export const divide100 = (value: string) => shiftDecimal(value, -2);

/** Discount ratio ("0.85") as "85折" (zh) or "85%" (en). */
export function formatDiscount(ratio: string): string {
  return /^\d+(?:\.\d*)?$/.test(ratio) ? `${times100(ratio)}${locale === 'zh-CN' ? '折' : '%'}` : ratio;
}

/** Translate a server message, including the templated messages the backend emits. */
export function translateServerMessage(message: string): string {
  const ccmax = /^CCMAX 返回错误（HTTP (\d{3})）：([\s\S]*)$/.exec(message);
  if (ccmax) {
    if (locale === 'zh-CN') return message;
    const [detail, advice] = ccmax[2].split('；处理建议：', 2);
    const head = t('CCMAX 返回错误（HTTP {0}）：{1}', [ccmax[1], translateUpstreamUnknown(detail)]);
    return advice ? head + t('；处理建议：{0}', [translateServerMessage(advice)]) : head;
  }
  const templates: Array<[RegExp, string]> = [
    [/^当前供应商同时上号数已达上限（(\d+)个），请稍后重试$/, '当前供应商同时上号数已达上限（{0}个），请稍后重试'],
    [/^记录号 ([\s\S]+) 已存在且内容或历史归属不同，请核对，不允许覆盖$/, '记录号 {0} 已存在且内容或历史归属不同，请核对，不允许覆盖'],
    [/^来源单号已存在但内容不同，不允许覆盖：([\s\S]+)$/, '来源单号已存在但内容不同，不允许覆盖：{0}'],
    [/^(.+) 资金通道未配置$/, '{0} 资金通道未配置'],
    [/^(.+) 资金通道未启用$/, '{0} 资金通道未启用'],
    [/^密码长度不符合当前策略（(\d+)—(\d+) 位）$/, '密码长度不符合当前策略（{0}—{1} 位）'],
    [/^(Binance|OKX) 当前手续费为 (\d+(?:\.\d+)?) USDT，与已审批付款不一致，请重新申请$/, '{0} 当前手续费为 {1} USDT，与已审批付款不一致，请重新申请'],
    [/^Airwallex 资金账户 ([A-Z]{3}) 可用余额不足$/, 'Airwallex 资金账户 {0} 可用余额不足'],
    [/^channel\.([a-zA-Z_][a-zA-Z_0-9]*) 必须为字符串或 null$/, 'channel.{0} 必须为字符串或 null'],
    [/^channel\.([a-zA-Z_][a-zA-Z_0-9]*) 必须为数值或 null$/, 'channel.{0} 必须为数值或 null'],
    [/^第 (\d+) 项凭据与既有资源交叠，请核对$/, '第 {0} 项凭据与既有资源交叠，请核对'],
    [/^第 (\d+) 项与既有资源资料冲突$/, '第 {0} 项与既有资源资料冲突'],
  ];
  for (const [pattern, template] of templates) {
    const match = pattern.exec(message);
    if (match) return t(template, match.slice(1));
  }
  const billing = /^计费明细：([\s\S]+)$/.exec(message);
  if (billing) return t('计费明细：{0}', [translateServerMessage(billing[1])]);
  const coded = /^([\s\S]+)（错误码：([^（）]+)）$/.exec(message);
  if (coded) return t('{0}（错误码：{1}）', [translateServerMessage(coded[1]), coded[2]]);
  const missing = /^密码还缺少：(.+)$/.exec(message);
  if (missing) {
    return t('密码还缺少：{0}', [missing[1].split('、').map(translateServerMessage).join(locale === 'zh-CN' ? '、' : ', ')]);
  }
  const csvColumns = /^CSV 第 (\d+) 行应为 (\d+) 列$/.exec(message);
  if (csvColumns) return t('CSV 第 {0} 行应为 {1} 列', [csvColumns[1], csvColumns[2]]);
  const csvFormat = /^CSV 第 (\d+) 行日期或数值格式不正确$/.exec(message);
  if (csvFormat) return t('CSV 第 {0} 行日期或数值格式不正确', [csvFormat[1]]);
  if (message === '建议倍率为最多 8 位小数的非负数，整数部分最多 6 位') return t('建议折扣为最多 6 位小数的非负数，整数部分最多 8 位');
  if (message === '报价倍率下限和上限为最多 8 位小数的非负数，整数部分最多 6 位，上限不小于下限') {
    return t('折扣下限和上限为最多 6 位小数的非负数，整数部分最多 8 位，上限不小于下限');
  }
  const range = /报价倍率必须在 (\d+(?:\.\d+)?) 至 (\d+(?:\.\d+)?) 之间/.exec(message);
  if (range) return t('报价折扣必须在 {0} 至 {1} 之间', [times100(range[1]), times100(range[2])]);
  return translateFreeText(message
    .replace(/倍率改为\s*(\d+(?:\.\d+)?)\s*倍/g, (_match, ratio) => t('折扣改为 {0}', [formatDiscount(ratio)]))
    .replace(/报价倍率|建议倍率/g, (word) => (word === '报价倍率' ? '报价折扣' : '建议折扣')));
}

/** FNV-1a hash used as a stable support reference for untranslated upstream errors. */
export function referenceHash(text: string): string {
  let hash = 2166136261;
  for (const character of text) hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

export function translateUpstreamError(message: string): string {
  const translated = translateServerMessage(message);
  return translated === GENERIC_ERROR ? t('上游错误（参考 {0}）', [referenceHash(message)]) : translated;
}

export function translateUpstreamUnknown(message: string): string {
  const translated = translateServerMessage(message);
  return translated === GENERIC_ERROR ? t('上游返回未翻译的错误，请联系管理员（参考 {0}）', [referenceHash(message)]) : translated;
}

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Replace the browser's native form-validation messages with translated ones. Returns an uninstaller. */
export function installValidationMessages(): () => void {
  const applied = new Map<FormControl, string>();
  const control = (target: EventTarget | null): FormControl | null =>
    (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement ? target : null);
  const onInvalid = (event: Event) => {
    const field = control(event.target);
    if (!field || field.validity.customError) return;
    const v = field.validity;
    const message = v.valueMissing ? t('请填写此字段。')
      : v.typeMismatch ? t('请输入有效的格式。')
        : v.rangeUnderflow ? t('输入值小于允许的最小值。')
          : v.rangeOverflow ? t('输入值大于允许的最大值。')
            : v.tooShort ? t('输入内容过短。')
              : v.tooLong ? t('输入内容过长。') : t('请检查此字段的输入值。');
    field.setCustomValidity(message);
    applied.set(field, message);
  };
  const onEdit = (event: Event) => {
    const field = control(event.target);
    if (!field || !applied.has(field)) return;
    if (field.validationMessage === applied.get(field)) field.setCustomValidity('');
    applied.delete(field);
  };
  const reset = () => {
    for (const [field, message] of applied) if (field.validationMessage === message) field.setCustomValidity('');
    applied.clear();
  };
  document.addEventListener('click', reset, true);
  document.addEventListener('invalid', onInvalid, true);
  document.addEventListener('input', onEdit, true);
  document.addEventListener('change', onEdit, true);
  return () => {
    reset();
    document.removeEventListener('click', reset, true);
    document.removeEventListener('invalid', onInvalid, true);
    document.removeEventListener('input', onEdit, true);
    document.removeEventListener('change', onEdit, true);
  };
}
