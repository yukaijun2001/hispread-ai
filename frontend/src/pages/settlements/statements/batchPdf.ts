// Printable A4 summary of a batch (or of the candidate suppliers before a
// preview exists). The document is built in a new window with DOM APIs only,
// then the print dialog opens once fonts are ready; the user saves it as PDF.
import { getLocale, t, translateServerMessage } from '../../../lib/i18n';
import { formatMoney } from '../../../lib/money';
import type { BatchItem, SupplierTotal, Totals } from './batch';

export interface PdfBatch {
  id: string;
  state: string;
  periodStart: string;
  periodEnd: string;
  confirmationDeadline: string;
  totals: Totals;
  incompleteDays: number;
  items?: BatchItem[];
}

const STYLE = `
  @page { size: A4 portrait; margin: 16mm 12mm;
    @bottom-center { content: counter(page) " / " counter(pages);
      font: 9px system-ui, sans-serif; color: #65758b; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; color: #243b5a; background: #fff;
    font: 12px/1.6 system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
  main { max-width: 900px; margin: 32px auto; padding: 0 24px; }
  h1 { font-size: 24px; margin: 0; }
  h2 { font-size: 16px; margin: 24px 0 10px; break-after: avoid; }
  p { margin: 6px 0; overflow-wrap: anywhere; }
  .brand { color: #365d99; font-weight: 700; margin-bottom: 12px; }
  .meta { border-bottom: 2px solid #cbd9ed; padding-bottom: 16px; margin-bottom: 18px; }
  .totals { display: flex; flex-wrap: wrap; gap: 12px 28px; padding: 16px;
    background: #f3f7fc; border: 1px solid #dce5f1; margin: 12px 0; }
  .totals strong { font-size: 18px; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .notice { color: #864820; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  th, td { border-bottom: 1px solid #dce5f1; padding: 9px 7px; text-align: left;
    vertical-align: top; overflow-wrap: anywhere; }
  th { background: #f3f7fc; font-weight: 600; }
  thead { display: table-header-group; }
  tfoot { display: table-row-group; }
  tr { break-inside: avoid; }
  .supplier-table th, .supplier-table td { padding: 6px 7px; }
  .supplier-table tbody tr:last-child { break-after: avoid; }
  .numeric { text-align: right; font-variant-numeric: tabular-nums; }
  .toolbar { position: sticky; top: 0; background: #f3f7fc; padding: 14px 24px;
    border-bottom: 1px solid #dce5f1; display: flex; align-items: center; gap: 16px; }
  button { border: 0; border-radius: 6px; padding: 10px 16px; background: #3564dc;
    color: white; cursor: pointer; font: inherit; }
  @media print { main { max-width: none; margin: 0; padding: 0; }
    .toolbar { display: none; } body { print-color-adjust: exact; } }
`;

const money = (currency: string, amount: string) => `${currency} ${formatMoney(amount, currency)}`;

/**
 * Open the printable summary. With `suppliers` it is the pre-preview supplier
 * summary; otherwise the batch's settlements. Throws a user-facing message
 * when there is nothing to export yet or the pop-up is blocked.
 */
export function exportBatchPdf(batch: PdfBatch, suppliers?: SupplierTotal[]): void {
  if (batch.state === 'QUEUED' || (!batch.items?.length && !suppliers?.length)) throw new Error(t('请等待结算单核算完成后导出'));
  const popup = window.open('', '_blank');
  if (!popup) throw new Error(t('请允许弹出窗口后重试导出 PDF'));
  const title = t(suppliers ? '供应商结算汇总' : '结算单汇总');
  const doc = popup.document;
  doc.documentElement.lang = getLocale();
  doc.title = `${title}_${batch.periodStart}_${batch.periodEnd}${batch.id ? `_${batch.id}` : ''}`;
  const style = doc.createElement('style');
  style.textContent = STYLE;
  doc.head.append(style);

  const add = <K extends keyof HTMLElementTagNameMap>(tag: K, text = '', parent: HTMLElement = doc.body, className = '') => {
    const element = doc.createElement(tag);
    element.textContent = text;
    element.className = className;
    parent.append(element);
    return element;
  };

  const toolbar = add('div', '', doc.body, 'toolbar');
  add('button', t('打印 / 保存 PDF'), toolbar).onclick = () => popup.print();
  add('span', t('在打印窗口中选择“另存为 PDF”即可保存。'), toolbar);

  const main = add('main');
  add('div', 'Hispread AI', main, 'brand');
  const header = add('header', '', main, 'meta');
  add('h1', title, header);
  add('p', batch.state === 'PREVIEW' ? t('预览 · 尚未生成') : t('批量生成结果'), header);
  add('p', t('结算期间：{0} 至 {1}', [batch.periodStart, batch.periodEnd]), header);
  if (batch.confirmationDeadline) {
    const deadline = new Date(batch.confirmationDeadline).toLocaleString(getLocale(), {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    });
    add('p', t('供应商确认截止时间（北京时间）：{0}', [deadline]), header);
  }
  if (batch.id) add('p', t('批次编号：{0}', [batch.id]), header);

  add('h2', t('金额汇总'), main);
  const totals = add('div', '', main, 'totals');
  for (const [currency, amount] of Object.entries(batch.totals)) add('strong', money(currency, amount), totals);
  if (!Object.keys(batch.totals).length) add('span', '—', totals);
  add('p', t('不同币种分别汇总，需处理项不计入合计。'), main);
  if (batch.incompleteDays > 0) add('p', t('该期间有 {0} 天存在采集异常，本汇总仅包含已拉取的日账。', [batch.incompleteDays]), main, 'notice');

  const items = batch.items || [];
  const settled = items.filter((item) => item.state !== 'FAILED');
  const failed = items.filter((item) => item.state === 'FAILED');

  const itemTable = (rows: BatchItem[], failures: boolean) => {
    const table = add('table', '', main);
    const colgroup = add('colgroup', '', table);
    for (const width of failures ? ['24%', '24%', '52%'] : ['25%', '23%', '12%', '25%', '15%']) add('col', '', colgroup).style.width = width;
    const head = add('tr', '', add('thead', '', table));
    (failures ? ['供应商', '项目', '原因'] : ['供应商', '项目', '来源笔数', '应付金额', '状态'])
      .forEach((label, index) => add('th', t(label), head, !failures && (index === 2 || index === 3) ? 'numeric' : ''));
    const body = add('tbody', '', table);
    for (const item of rows) {
      const row = add('tr', '', body);
      add('td', item.supplierName, row);
      add('td', item.projectName, row);
      if (failures) {
        add('td', item.error ? translateServerMessage(item.error) : '—', row);
      } else {
        add('td', String(item.sourceCount), row, 'numeric');
        add('td', money(item.currency, item.total), row, 'numeric');
        add('td', item.state === 'SUCCEEDED' ? t('已生成') : t('待生成'), row);
      }
    }
  };

  if (suppliers) {
    add('h2', t('供应商明细（{0} 家）', [suppliers.length]), main);
    const table = add('table', '', main, 'supplier-table');
    const head = add('tr', '', add('thead', '', table));
    for (const label of ['供应商', '可结算笔数', '可生成金额', '状态']) add('th', t(label), head);
    const body = add('tbody', '', table);
    for (const supplier of suppliers) {
      const row = add('tr', '', body);
      add('td', supplier.name, row);
      add('td', String(supplier.count), row, 'numeric');
      const cell = add('td', '', row, 'numeric');
      for (const [currency, amount] of Object.entries(supplier.totals)) add('div', money(currency, amount), cell);
      if (!Object.keys(supplier.totals).length) cell.textContent = '—';
      add('td', supplier.blocked ? t('{0} 笔需处理', [supplier.blocked]) : t('可生成'), row);
    }
    const foot = add('tr', '', add('tfoot', '', table));
    add('th', t('合计'), foot);
    add('td', String(suppliers.reduce((sum, supplier) => sum + supplier.count, 0)), foot, 'numeric');
    const cell = add('td', '', foot, 'numeric');
    for (const [currency, amount] of Object.entries(batch.totals)) add('strong', money(currency, amount), add('div', '', cell));
    add('td', '', foot);
  }
  if (settled.length) {
    add('h2', t('结算单明细（{0} 张）', [settled.length]), main);
    itemTable(settled, false);
  }
  if (failed.length) {
    add('h2', t('需处理项（{0} 张，不计入合计）', [failed.length]), main);
    itemTable(failed, true);
  }
  doc.fonts.ready.then(() => { if (!popup.closed) popup.print(); });
}
