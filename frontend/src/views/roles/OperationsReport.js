import {
  C as useApplication,
  S as useRemote,
  X as jsx,
  c as DataTable,
  g as Notice,
  h as Loading,
  s as Button,
} from '../../recovered/index-Dnr0i-H9.js';

const view = jsx();

/** Assigned-supplier activity counts. No accounting or credential data is read. */
export default function OperationsReport() {
  const { refresh } = useApplication();
  const result = useRemote('/reports/operations');
  const data = result.data;
  return view.jsxs('div', {
    className: 'report-overview operations-report',
    children: [
      view.jsxs('section', {
        className: 'panel',
        children: [
          view.jsxs('div', {
            className: 'panel-section-head',
            children: [view.jsx('h2', { children: '运营报表' }), view.jsx(Button, { icon: 'refresh', onClick: refresh, children: '刷新' })],
          }),
          view.jsx('p', { className: 'muted', style: { padding: '0 22px 20px' }, children: '仅统计归属给你的供应商、报价和资源数量；不包含账务金额、消耗金额或资源凭据。' }),
        ],
      }),
      result.error && view.jsx(Notice, { tone: 'red', children: result.error }),
      result.loading && !data && view.jsx(Loading, {}),
      data && view.jsx('div', {
        className: 'report-summary-grid',
        children: [
          ['归属供应商', data.supplierCount],
          ['报价总数', data.quoteCount],
          ['待审核报价', data.pendingQuoteCount],
          ['已通过报价', data.approvedQuoteCount],
          ['资源总数', data.resourceCount],
        ].map(([label, count]) => view.jsxs('article', {
          className: 'report-summary-card',
          children: [view.jsx('header', { children: view.jsx('strong', { children: label }) }), view.jsx('strong', { className: 'money', style: { fontSize: 28 }, children: String(count ?? 0) })],
        }, label)),
      }),
      data && view.jsxs('section', {
        className: 'panel report-section',
        children: [view.jsx('div', { className: 'panel-section-head', children: view.jsx('h2', { children: '按项目统计' }) }), view.jsx(DataTable, {
          data: data.projects || [],
          columns: [{ label: '项目', render: row => row.projectName }, { label: '报价数量', render: row => row.quoteCount }, { label: '资源数量', render: row => row.resourceCount }],
        })],
      }),
      data && view.jsxs('section', {
        className: 'panel report-section',
        children: [view.jsx('div', { className: 'panel-section-head', children: view.jsx('h2', { children: '按归属供应商统计' }) }), view.jsx(DataTable, {
          data: data.suppliers || [],
          columns: [{ label: '供应商', render: row => row.supplierName }, { label: '报价数量', render: row => row.quoteCount }, { label: '资源数量', render: row => row.resourceCount }],
        })],
      }),
    ],
  });
}
