// Delivery operations are existing durable receipts, not configurable gateway jobs.
import { C as context, S as useData, X as runtime, Z as react, c as Table, g as Notice,
  I as navigate, P as dateTime, it as put, rt as post, s as Button,
  _ as Pagination, vt as compat, mt as text, p as Form } from "./index-Dnr0i-H9.js";
const React = compat(react(), 1), ui = runtime();
const taskTypes = { SUBMIT:'上号提交', DISPATCH:'账号交付', OAUTH_COMPLETE:'OAuth 上号',
  'CREDENTIAL-REFRESH':'刷新授权', REAUTHORIZATIONS:'重新授权', LIFECYCLE:'账号维护', PROXY_REPLACEMENT:'更换代理' };
const states = {SUCCESS:'成功',COMPLETED:'已完成',UPDATED:'已更新',FAILED:'失败',UNKNOWN:'结果待核对',
  PENDING:'处理中',SUBMITTING:'提交中',RUNNING:'处理中',PARTIAL_FAILED:'部分失败',CANCELLED:'已取消'};
export default function DeliveryTasks() {
  const { refresh, notify, has, user } = context();
  const [page,setPage] = React.useState(1), [size,setSize] = React.useState(20), [pending,setPending] = React.useState(''),
    [error,setError] = React.useState(''), [reviewOnly,setReviewOnly] = React.useState(false),
    [config,setConfig] = React.useState(null);
  const receipts = useData(`/delivery-tasks?page=${page}&size=${size}${reviewOnly?'&needsReview=true':''}`);
  const automatic = useData(user.role==='ADMIN' && has('system.settings') ? '/system/scheduled-tasks' : null);
  async function reconcile(row) {
    if (pending) return;
    setPending(row.id);setError('');
    try { await post(`/delivery-tasks/${encodeURIComponent(row.id)}/reconcile`, {}); refresh();notify(text('原操作结果已更新')); }
    catch(e) {setError(e.message)} finally {setPending('')}
  }
  return ui.jsxs('div',{className:'delivery-tasks-page',style:{display:'grid',gap:16},children:[
    ui.jsxs('div',{className:'scheduled-tasks-toolbar',children:[
      ui.jsx('p',{children:text('查看上号、授权和交付处理结果；结果待核对时查询原操作。')}),
      ui.jsx(Button,{icon:'refresh',onClick:refresh,children:text('刷新')})]}),
    error && ui.jsx(Notice,{tone:'red',children:error}),
    ui.jsxs('section',{className:'panel',children:[
      ui.jsxs('div',{className:'panel-section-head',children:[ui.jsx('h2',{id:'delivery-task-table-title',children:text('上号与交付任务')}),
        ui.jsx(Button,{onClick:()=>{setReviewOnly(v=>!v);setPage(1)},children:text(reviewOnly?'查看全部':'只看处理中与待核对')})]}),
      ui.jsx('div',{role:'region',tabIndex:0,'aria-labelledby':'delivery-task-table-title',style:{overflowX:'auto'},children:
        ui.jsx(Table,{data:receipts.data?.items||[],loading:receipts.loading,error:receipts.error,columns:[
          {label:text('任务'),render:row=>text(taskTypes[row.type]||row.type)},
          {label:text('资源 / 项目'),render:row=>ui.jsxs('div',{className:'stack',children:[row.resourceName||text('批量交付'),ui.jsx('small',{children:row.projectName||text('{0} 个资源',[row.itemCount])})]})},
          {label:text('结果'),render:row=>text(states[row.state]||row.state)},
          {label:text('提交时间'),render:row=>dateTime(row.createdAt)},
          {label:text('操作'),render:row=>ui.jsxs('div',{className:'actions',children:[
            row.resourceId && ui.jsx(Button,{onClick:()=>navigate(`${user.supplierId?'deliveries':'resources'}?id=${encodeURIComponent(row.resourceId)}`),children:text('查看资源')}),
            row.needsReview && (has('resource.dispatch')||has('resource.write')) && ui.jsx(Button,{disabled:!!pending,onClick:()=>reconcile(row),children:text(pending===row.id?'查询中…':'查询原结果')})]})}]})}),
      ui.jsx(Pagination,{data:receipts.data,page,onPage:setPage,size,onSizeChange:value=>{setSize(value);setPage(1)}})]}),
    automatic.error && ui.jsx(Notice,{tone:'red',children:automatic.error}),
    automatic.data?.map(task=>ui.jsxs('section',{className:'panel',children:[
      ui.jsxs('div',{className:'panel-section-head',children:[ui.jsx('h2',{children:text('交付状态同步')}),
        ui.jsx(Button,{onClick:()=>setConfig(task),children:text('设置')})]}),
      ui.jsx('p',{style:{padding:'0 24px 20px'},children:text(task.enabled?'已启用，每 {0} 分钟只读更新账号状态':'默认关闭；需要时可按 10 分钟至 1 天的周期更新已交付账号状态。',[task.intervalMinutes])})]},task.key)),
    has('system.settings') && ui.jsx(Button,{onClick:()=>navigate('scheduled-task-runs'),children:text('查看历史同步记录')}),
    config && ui.jsx(Form,{title:text('交付状态同步设置'),subtitle:text('仅更新账号健康和交付状态。费用、日账和权重不随此任务同步。'),
      fields:[{name:'enabled',label:text('自动同步'),type:'select',options:[{value:'false',label:text('关闭')},{value:'true',label:text('启用')}]},
        {name:'intervalMinutes',label:text('同步间隔（分钟）'),type:'number',min:'10',max:'1440',step:'1'}],
      initial:{enabled:String(!!config.enabled),intervalMinutes:String(Math.max(10,config.intervalMinutes||30))},
      onClose:()=>setConfig(null),onSubmit:async values=>{await put(`/system/scheduled-tasks/${encodeURIComponent(config.key)}/config`,
        {version:config.version,enabled:values.enabled==='true',intervalMinutes:Number(values.intervalMinutes)});refresh();notify(text('状态同步设置已保存'))}})
  ]});
}
