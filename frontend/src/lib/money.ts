// Exact decimal arithmetic on strings. Amounts never pass through floating
// point: values are scaled to BigInt, rounded half-up, and printed back.
import { formatDiscount, divide100, getLocale } from './i18n';

export type Decimal = string | number | null | undefined;

const currencyScale = (currency: string) => (currency === 'JPY' ? 0 : 2);

/** Parse a decimal to a BigInt scaled by 10^scale, rounding half away from zero on the next digit. */
export function toScaled(value: Decimal, scale: number): bigint {
  let text = String(value ?? '0');
  if (typeof value === 'number') text = value.toFixed(Math.min(12, scale + 2));
  const match = /^(-?)(\d+)(?:\.(\d*))?$/.exec(text);
  if (!match) return 0n;
  const fraction = match[3] || '';
  let scaled = BigInt(match[2]) * 10n ** BigInt(scale) + BigInt(fraction.slice(0, scale).padEnd(scale, '0') || '0');
  if (Number(fraction[scale] || '0') >= 5) scaled++;
  return match[1] ? -scaled : scaled;
}

export function fromScaled(value: bigint, scale: number): string {
  const sign = value < 0n ? '-' : '';
  const digits = (value < 0n ? -value : value).toString().padStart(scale + 1, '0');
  return sign + (scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits);
}

/** Thousands-separated amount at currency precision (2 decimals, 0 for JPY). */
export function formatMoney(value: Decimal, currency = 'USD'): string {
  const scale = currencyScale(currency);
  const [whole, fraction] = fromScaled(toScaled(value, scale), scale).split('.');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction === undefined ? '' : `.${fraction}`);
}

export function multiplyMoney(a: Decimal, b: Decimal, currency = 'USD'): string {
  const product = toScaled(a, 12) * toScaled(b, 12);
  const scale = currencyScale(currency);
  const divisor = 10n ** BigInt(24 - scale);
  const rounded = ((product < 0n ? -product : product) + divisor / 2n) / divisor;
  return fromScaled(product < 0n ? -rounded : rounded, scale);
}

/** Exact sum, trailing zeros trimmed. */
export function sumDecimals(values: Decimal[], scale = 9): string {
  const sum = fromScaled(values.reduce<bigint>((total, value) => total + toScaled(value, scale), 0n), scale);
  if (!sum.includes('.')) return sum;
  const trimmed = sum.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return trimmed === '' || trimmed === '-' ? '0' : trimmed;
}

export function subtractMoney(a: Decimal, b: Decimal, currency = 'USD'): string {
  const scale = currencyScale(currency);
  return fromScaled(toScaled(a, scale) - toScaled(b, scale), scale);
}

export function compareDecimal(a: Decimal, b: Decimal): -1 | 0 | 1 {
  const left = toScaled(a, 12);
  const right = toScaled(b, 12);
  return left < right ? -1 : left > right ? 1 : 0;
}

/** Move the decimal point of a (possibly long) decimal string; used for percent ↔ ratio. */
export function movePoint(value: string, places: number): string {
  const [whole, fraction = ''] = value.split('.');
  let digits = whole + fraction;
  let point = whole.length + places;
  if (point <= 0) { digits = '0'.repeat(1 - point) + digits; point = 1; }
  if (point >= digits.length) digits = digits.padEnd(point + 1, '0');
  const head = digits.slice(0, point).replace(/^0+(?=\d)/, '');
  const tail = digits.slice(point).replace(/0+$/, '');
  return tail ? `${head}.${tail}` : head;
}
export const percentToRatio = (value: string) => movePoint(value, -2);

function ratio(value: string): [bigint, bigint] | null {
  if (!/^\d+(?:\.\d+)?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  return [BigInt(whole + fraction), 10n ** BigInt(fraction.length)];
}

export interface ExchangeRate { baseCurrency: string; quoteCurrency: string; rate: string }

/** Convert with a direct, inverse or single-hop rate. Returns a 2-decimal string, or null when no path exists. */
export function convertCurrency(amount: string, from: string, to: string, rates: ExchangeRate[]): string | null {
  const parsed = ratio(amount);
  if (!parsed) return null;
  const edges = rates.flatMap((rate) => {
    const r = ratio(rate.rate);
    return !r || r[0] === 0n ? [] : [
      { from: rate.baseCurrency, to: rate.quoteCurrency, ratio: r },
      { from: rate.quoteCurrency, to: rate.baseCurrency, ratio: [r[1], r[0]] as [bigint, bigint] },
    ];
  });
  let path = from === to ? [1n, 1n] : edges.find((e) => e.from === from && e.to === to)?.ratio;
  if (!path) {
    for (const first of edges.filter((e) => e.from === from)) {
      const second = edges.find((e) => e.from === first.to && e.to === to);
      if (second) { path = [first.ratio[0] * second.ratio[0], first.ratio[1] * second.ratio[1]]; break; }
    }
  }
  if (!path) return null;
  const numerator = parsed[0] * path[0] * 100n;
  const denominator = parsed[1] * path[1];
  const cents = (numerator / denominator + ((numerator % denominator) * 2n >= denominator ? 1n : 0n)).toString().padStart(3, '0');
  return `${cents.slice(0, -2)}.${cents.slice(-2)}`;
}

export interface QuotePrice { unitPrice?: Decimal; multiplier?: Decimal; ratePercent?: Decimal }

/** Quote price: unit price, else discount from multiplier, else discount from rate percent. */
export function formatQuotePrice(quote: QuotePrice): string {
  if (quote.unitPrice != null) return String(quote.unitPrice);
  if (quote.multiplier != null) return formatDiscount(String(quote.multiplier));
  if (quote.ratePercent != null) return formatDiscount(divide100(String(quote.ratePercent)));
  return '—';
}

export interface SettlementAmounts { state: string; paidAmount: Decimal; total: Decimal }

/** A confirmed settlement is shown as PAID, PARTIAL or UNPAID by comparing paid with total. */
export function settlementState(settlement: SettlementAmounts): string {
  if (settlement.state !== 'CONFIRMED') return settlement.state;
  if (compareDecimal(settlement.paidAmount, settlement.total) >= 0) return 'PAID';
  return compareDecimal(settlement.paidAmount, '0') > 0 ? 'PARTIAL' : 'UNPAID';
}

/** MM-DD HH:mm in the UI locale; em dash when empty. */
export function formatDateTime(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleString(getLocale(), { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '—';
}

/** Today in the browser's local time zone, YYYY-MM-DD. */
export function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** A date as YYYY-MM-DD in Beijing time, which is the business day for quotes and billing. */
export function beijingDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
