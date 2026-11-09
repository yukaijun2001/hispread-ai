// origin: assets/ApiDocs-BOQ6E5CN.js
const __vite__mapDeps = (i, m = __vite__mapDeps, d = (m.f || (m.f = ["assets/AccountDialogs-DkF7YQod.js", "assets/index-Dnr0i-H9.js", "assets/index-Co8Tabyn.css"]))) => i.map(i => d[i]);
import {
  C as e,
  X as t,
  Z as n,
  b as r,
  g as i,
  h as a,
  i as o,
  mt as s,
  pt as c,
  s as l,
  vt as u,
  x as d
} from "./index-Dnr0i-H9.js";
var f = u(n(), 1),
  p = {
    openapi: `3.1.0`,
    info: {
      title: `Hispread CCMAX API`,
      version: `1.1.0`,
      description: `9类、21个Bearer接口。新增更换代理、强制刷新和重新授权；沿用账号权限、供应商／本人及项目范围。维护开关为全局或供应商允许，独立于新增上号停收。代理更换保留同源互斥、版本／容量及稳定请求幂等；UNKNOWN先查原操作，禁止盲目重复写入。`
    },
    servers: [{
      url: window.location.origin
    }],
    paths: JSON.parse(`{"/api/open/v1/ccmax/projects":{"get":{"operationId":"ccmaxListEligibleProjects","summary":"List eligible projects","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"业务响应；上号须检查state，导入须检查skipped","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/Project"}}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}}}},"/api/open/v1/ccmax/proxies":{"get":{"operationId":"ccmaxListVisibleProxies","summary":"List visible proxies","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"业务响应；上号须检查state，导入须检查skipped","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyPage"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"search","in":"query","required":false,"schema":{"type":"string","maxLength":128}},{"name":"page","in":"query","required":false,"schema":{"type":"integer","minimum":1,"default":1}},{"name":"size","in":"query","required":false,"schema":{"type":"integer","minimum":1,"maximum":100,"default":20}}]}},"/api/open/v1/ccmax/proxies/import":{"post":{"operationId":"ccmaxImportProxies","summary":"Import proxies","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"业务响应；上号须检查state，导入须检查skipped","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyImportResult"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyImport"}}}}}},"/api/open/v1/ccmax/submissions/credentials":{"post":{"operationId":"ccmaxSubmitCredentials","summary":"Submit credentials","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"业务响应；上号须检查state，导入须检查skipped","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Submission"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/CredentialSubmit"}}}}}},"/api/open/v1/ccmax/submissions/oauth/authorize":{"post":{"operationId":"ccmaxStartOauth","summary":"Start OAuth","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"业务响应；上号须检查state，导入须检查skipped","content":{"application/json":{"schema":{"$ref":"#/components/schemas/OAuthAuthorization"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/Account"}}}}}},"/api/open/v1/ccmax/submissions/oauth/complete":{"post":{"operationId":"ccmaxCompleteOauth","summary":"Complete OAuth","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"业务响应；上号须检查state，导入须检查skipped","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Submission"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/OAuthSubmit"}}}}}},"/api/open/v1/ccmax/submissions/{id}":{"get":{"operationId":"ccmaxQuerySubmission","summary":"Query submission","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"业务响应；上号须检查state，导入须检查skipped","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Submission"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string"}}]}},"/api/open/v1/ccmax/submissions/{id}/cancel":{"post":{"operationId":"ccmaxCancelPendingSubmission","summary":"Cancel pending submission","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"业务响应；上号须检查state，导入须检查skipped","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Submission"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string"}}]}},"/api/open/v1/ccmax/resources":{"get":{"operationId":"ccmaxListResources","summary":"List resources","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"业务响应；上号须检查state，导入须检查skipped","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ResourcePage"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"search","in":"query","required":false,"schema":{"type":"string"}},{"name":"state","in":"query","required":false,"schema":{"type":"string"}},{"name":"projectCode","in":"query","required":false,"schema":{"type":"string"}},{"name":"operationalStatus","in":"query","required":false,"schema":{"type":"string"}},{"name":"page","in":"query","required":false,"schema":{"type":"integer","minimum":1,"default":1}},{"name":"size","in":"query","required":false,"schema":{"type":"integer","minimum":1,"maximum":100,"default":20}}]}},"/api/open/v1/ccmax/resources/{id}":{"get":{"operationId":"ccmaxGetResource","summary":"Get resource","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"业务响应；上号须检查state，导入须检查skipped","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Resource"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string"}}]}},"/api/open/v1/ccmax/daily-summary":{"get":{"operationId":"ccmaxGetTodayQuoteSummary","summary":"Get today quote summary","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"业务响应；上号须检查state，导入须检查skipped","content":{"application/json":{"schema":{"$ref":"#/components/schemas/DailySummary"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"quoteId","in":"query","required":true,"schema":{"type":"string","minLength":1,"maxLength":100}}]}},"/api/open/v1/ccmax/intake":{"get":{"operationId":"ccmaxGetTodayIntake","summary":"查询今日上号额度","description":"需要resource.read，不接受查询参数。计数独立于资源筛选。不返回优先级及档位区间；客户端不能通过参数或请求体提交priority、tier、canPro和额度来源。","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"当前账号今日成功数量及实际额度","content":{"application/json":{"schema":{"$ref":"#/components/schemas/IntakeToday"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}}}},"/api/open/v1/ccmax/proxy-replacements":{"post":{"operationId":"ccmaxReplaceProxies","summary":"更换代理","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"已取得业务回执，须检查state／status及逐项结果。","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyReplacementJob"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyReplacementCreate"}}}}}},"/api/open/v1/ccmax/proxy-replacements/{id}":{"get":{"operationId":"ccmaxGetProxyReplacement","summary":"查询代理更换任务","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"已取得业务回执，须检查state／status及逐项结果。","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyReplacementJob"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string","description":"本地任务／操作ID。"}}]}},"/api/open/v1/ccmax/proxy-replacements/{id}/reconcile":{"post":{"operationId":"ccmaxReconcileProxyReplacement","summary":"重新核对代理绑定","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"已取得业务回执，须检查state／status及逐项结果。","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyReplacementJob"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string","description":"本地任务／操作ID。"}}]}},"/api/open/v1/ccmax/resources/{resourceId}/credential-refresh":{"get":{"operationId":"ccmaxCurrentCredentialRefresh","summary":"查询强制刷新结果","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"已取得业务回执，须检查state／status及逐项结果。","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MaintenanceOperation"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"resourceId","in":"path","required":true,"schema":{"type":"string","description":"本地资源ID。"}}]},"post":{"operationId":"ccmaxRefreshCredential","summary":"强制刷新授权","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"已取得业务回执，须检查state／status及逐项结果。","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MaintenanceOperation"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"resourceId","in":"path","required":true,"schema":{"type":"string","description":"本地资源ID。"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/CredentialRefreshRequest"}}}}}},"/api/open/v1/ccmax/resources/{resourceId}/reauthorizations/current":{"get":{"operationId":"ccmaxCurrentReauthorization","summary":"查询当前重新授权操作","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"已取得业务回执，须检查state／status及逐项结果。","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MaintenanceOperation"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"resourceId","in":"path","required":true,"schema":{"type":"string","description":"本地资源ID。"}}]}},"/api/open/v1/ccmax/resources/{resourceId}/reauthorizations":{"post":{"operationId":"ccmaxStartReauthorization","summary":"发起重新授权","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"已取得业务回执，须检查state／status及逐项结果。","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MaintenanceOperation"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"resourceId","in":"path","required":true,"schema":{"type":"string","description":"本地资源ID。"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ReauthorizationStart"}}}}}},"/api/open/v1/ccmax/resources/{resourceId}/reauthorizations/{id}":{"put":{"operationId":"ccmaxSubmitReauthorization","summary":"提交重新授权凭据","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"已取得业务回执，须检查state／status及逐项结果。","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MaintenanceOperation"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"resourceId","in":"path","required":true,"schema":{"type":"string","description":"本地资源ID。"}},{"name":"id","in":"path","required":true,"schema":{"type":"string","description":"本地任务／操作ID。"}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ReauthorizationSubmit"}}}}},"get":{"operationId":"ccmaxGetReauthorization","summary":"查询重新授权进度","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"已取得业务回执，须检查state／status及逐项结果。","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MaintenanceOperation"}}}},"400":{"description":"输入不合法","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"密钥无效或缺失","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"无权调用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"对象不可见","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"状态或幂等冲突","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"上游失败","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"暂不可用","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"resourceId","in":"path","required":true,"schema":{"type":"string","description":"本地资源ID。"}},{"name":"id","in":"path","required":true,"schema":{"type":"string","description":"本地任务／操作ID。"}}]}}}`),
    components: JSON.parse(`{"securitySchemes":{"AccountApiKey":{"type":"http","scheme":"bearer","bearerFormat":"hp_…"}},"schemas":{"Account":{"type":"object","description":"PRO策略由服务端两级配置决定，不接受客户端canPro覆盖。","properties":{"projectCode":{"type":"string","minLength":1,"maxLength":100},"credentialMode":{"type":"string","enum":["REFRESH_TOKEN","ACCESS_TOKEN","SESSION_KEY","OAUTH"]},"accountName":{"type":"string","minLength":1,"maxLength":128},"proxyId":{"type":"string","minLength":1,"maxLength":4096,"description":"已有代理 id，或直接填写 SOCKS5 / HTTP / HTTPS 代理地址；也支持 host:port、host:port:username:password（默认 SOCKS5）。地址自动保存或复用本人代理，无需单独导入或预检，另需 proxy.read 和 proxy.write 权限。","example":"http://username:password@proxy.example.com:8080"},"refreshToken":{"type":"string","writeOnly":true},"accessToken":{"type":"string","writeOnly":true},"sessionKey":{"type":"string","writeOnly":true},"expiresAt":{"type":"integer","format":"int64","minimum":1,"description":"与现有页面一致的毫秒时间戳，仅ACCESS_TOKEN可用"},"setupToken":{"type":"boolean","enum":[false],"description":"仅兼容false，true暂不支持"},"remark":{"type":"string","maxLength":2000}},"required":["projectCode","credentialMode","accountName","proxyId"]},"CredentialSubmit":{"type":"object","properties":{"requestKey":{"type":"string","format":"uuid"},"input":{"$ref":"#/components/schemas/Account"}},"required":["requestKey","input"]},"OAuthSubmit":{"type":"object","properties":{"sessionId":{"type":"string"},"code":{"type":"string","writeOnly":true},"input":{"$ref":"#/components/schemas/Account"}},"required":["sessionId","code","input"]},"Project":{"type":"object","properties":{"projectId":{"type":"string"},"projectCode":{"type":"string"},"projectName":{"type":"string"},"settlementMethod":{"type":"string"},"quoteId":{"type":"string"},"quoteCode":{"type":"string"},"currency":{"type":"string"}}},"ProxyImport":{"type":"object","properties":{"lines":{"type":"string","description":"最多500行；沿用现有代理格式"},"defaultProtocol":{"type":"string","enum":["SOCKS5","HTTP","HTTPS"]},"maxResources":{"type":"integer","minimum":0}},"required":["lines","maxResources"]},"ProxyImportResult":{"type":"object","properties":{"imported":{"type":"integer"},"skipped":{"type":"array","items":{"type":"object","properties":{"line":{"type":"integer"},"reason":{"type":"string"}}}}}},"Proxy":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"protocol":{"type":"string"},"endpoint":{"type":"string"},"enabled":{"type":"boolean"},"maxResources":{"type":"integer"},"usedResources":{"type":"integer"},"reservedResources":{"type":"integer"},"version":{"type":"integer","description":"代理当前版本，使用已有代理更换时传proxyVersion。","minimum":0}}},"Resource":{"type":"object","properties":{"id":{"anyOf":[{"type":"string"},{"type":"null"}]},"name":{"anyOf":[{"type":"string"},{"type":"null"}]},"accountName":{"anyOf":[{"type":"string"},{"type":"null"}]},"projectId":{"anyOf":[{"type":"string"},{"type":"null"}]},"projectName":{"anyOf":[{"type":"string"},{"type":"null"}]},"credentialMode":{"anyOf":[{"type":"string"},{"type":"null"}]},"state":{"anyOf":[{"type":"string"},{"type":"null"}]},"dispatchState":{"anyOf":[{"type":"string"},{"type":"null"}]},"laneId":{"anyOf":[{"type":"string"},{"type":"null"}]},"laneState":{"anyOf":[{"type":"string"},{"type":"null"}]},"operationalStatus":{"anyOf":[{"type":"string"},{"type":"null"}]},"createdAt":{"anyOf":[{"type":"string"},{"type":"null"}]},"updatedAt":{"anyOf":[{"type":"string"},{"type":"null"}]},"submittedAt":{"anyOf":[{"type":"string"},{"type":"null"}]},"creationFailureHint":{"anyOf":[{"type":"string"},{"type":"null"}]},"dispatchFailureReason":{"anyOf":[{"type":"string"},{"type":"null"}]},"resourceType":{"type":"string","const":"CCMAX"},"resourceData":{"anyOf":[{"type":"object","additionalProperties":true},{"type":"null"}]},"creationAttempts":{"type":"integer"},"creationRetrying":{"type":"boolean"},"creationFinished":{"type":"boolean"},"creationHttpStatus":{"anyOf":[{"type":"integer"},{"type":"null"}]},"version":{"type":"integer","description":"资源当前版本；维护操作前查询此值。","minimum":0}}},"Submission":{"type":"object","properties":{"failureCode":{"anyOf":[{"type":"string"},{"type":"null"}],"description":"明确套餐拒绝时为PRO_PLAN_NOT_ALLOWED或PLAN_CHECK_FAILED；其他失败保留原业务代码。"},"state":{"anyOf":[{"type":"string"},{"type":"null"}]},"resourceId":{"anyOf":[{"type":"string"},{"type":"null"}]},"laneId":{"anyOf":[{"type":"string"},{"type":"null"}]},"laneState":{"anyOf":[{"type":"string"},{"type":"null"}]},"expiresAt":{"anyOf":[{"type":"string"},{"type":"null"}]},"message":{"anyOf":[{"type":"string"},{"type":"null"}]},"creationFailureHint":{"anyOf":[{"type":"string"},{"type":"null"}]},"creationAttempts":{"type":"integer"},"creationRetrying":{"type":"boolean"},"creationFinished":{"type":"boolean"},"creationHttpStatus":{"anyOf":[{"type":"integer"},{"type":"null"}]}}},"OAuthAuthorization":{"type":"object","properties":{"sessionId":{"type":"string"},"authUrl":{"type":"string","format":"uri"},"expiresAt":{"type":"string","format":"date-time"}},"required":["sessionId","authUrl","expiresAt"]},"DailySummary":{"type":"object","properties":{"businessDate":{"type":"string","format":"date"},"timezone":{"type":"string","const":"Asia/Shanghai"},"quoteId":{"type":"string"},"currency":{"type":"string"},"hasData":{"type":"boolean"},"resourceCount":{"type":"integer"},"entryCount":{"type":"integer"},"pendingCount":{"type":"integer"},"consumptionTotal":{"anyOf":[{"type":"string","pattern":"^-?\\\\d+(\\\\.\\\\d+)?$"},{"type":"null"}]},"pendingConsumption":{"anyOf":[{"type":"string","pattern":"^-?\\\\d+(\\\\.\\\\d+)?$"},{"type":"null"}]},"payableTotal":{"anyOf":[{"type":"string","pattern":"^-?\\\\d+(\\\\.\\\\d+)?$"},{"type":"null"}],"description":"仅供应商主账号返回已入账应收金额；部门管理员和普通成员不返回此字段。"},"lastQueriedAt":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}]}}},"Error":{"type":"object","properties":{"message":{"type":"string"},"status":{"type":"integer"},"traceId":{"type":"string"},"creationNotStarted":{"type":"boolean"},"code":{"type":"string"}},"required":["message","status","traceId"]},"ProxyPage":{"type":"object","properties":{"items":{"type":"array","items":{"$ref":"#/components/schemas/Proxy"}},"total":{"type":"integer","format":"int64"},"page":{"type":"integer"},"size":{"type":"integer"}},"required":["items","total","page","size"]},"ResourcePage":{"type":"object","properties":{"items":{"type":"array","items":{"$ref":"#/components/schemas/Resource"}},"total":{"type":"integer","format":"int64"},"page":{"type":"integer"},"size":{"type":"integer"}},"required":["items","total","page","size"]},"IntakeAllowance":{"type":"object","additionalProperties":false,"required":["limit","used","remaining","source","groupId","reclaimed"],"properties":{"limit":{"anyOf":[{"type":"integer","minimum":0},{"type":"null"}]},"used":{"type":"integer","minimum":0},"remaining":{"anyOf":[{"type":"integer","minimum":0},{"type":"null"}]},"source":{"type":"string"},"groupId":{"anyOf":[{"type":"string"},{"type":"null"}]},"reclaimed":{"type":"boolean"}},"description":"limit/remaining为null表示不限。已回收且当日已用的个人预留当天不转入共享池，次日恢复共享。"},"IntakeToday":{"type":"object","additionalProperties":false,"required":["date","total","pro","nonPro","unknown","processing","proAllowance","nonProAllowance","canPro","accepting"],"properties":{"date":{"type":"string","format":"date"},"total":{"type":"integer","minimum":0},"pro":{"type":"integer","minimum":0},"nonPro":{"type":"integer","minimum":0},"unknown":{"type":"integer","minimum":0},"processing":{"type":"integer","minimum":0},"proAllowance":{"$ref":"#/components/schemas/IntakeAllowance"},"nonProAllowance":{"$ref":"#/components/schemas/IntakeAllowance"},"canPro":{"type":"boolean"},"accepting":{"type":"boolean"}}},"ProxyReplacementItem":{"type":"object","required":["resourceId","resourceVersion"],"additionalProperties":false,"properties":{"resourceId":{"type":"string","description":"本地资源ID，不是上游Lane ID。"},"resourceVersion":{"type":"integer","description":"资源详情返回的version。","minimum":0},"proxyId":{"type":"string","description":"已有代理ID；和proxyVersion一起填写，与proxyUrl互斥。"},"proxyVersion":{"type":"integer","description":"代理列表返回的version。","minimum":0},"proxyUrl":{"type":"string","description":"直接填写SOCKS5／HTTP地址或host:port[:username:password]；额外需proxy.write。","maxLength":4096}},"oneOf":[{"required":["proxyId","proxyVersion"]},{"required":["proxyUrl"]}]},"ProxyReplacementCreate":{"type":"object","required":["requestKey","items"],"additionalProperties":false,"properties":{"requestKey":{"type":"string","description":"同一次更换重试保持不变；16–80位字母、数字、下划线或短横线。","pattern":"^[A-Za-z0-9_-]{16,80}$"},"items":{"type":"array","minItems":1,"maxItems":100,"items":{"$ref":"#/components/schemas/ProxyReplacementItem"},"description":"1–100条，同一供应商和CCMAX目标。"}}},"ProxyReplacementResultItem":{"type":"object","properties":{"resourceId":{"type":"string","description":"本地资源ID。"},"resourceName":{"type":"string"},"proxyName":{"type":"string"},"state":{"type":"string","description":"逐项结果；DONE表示绑定已核实，NEEDS_REVIEW表示待核对。"},"error":{"type":["string","null"]},"bindingApplied":{"type":"boolean"},"readiness":{"type":"string","description":"当前为unverified；绑定成功不保证账号就绪。"}}},"ProxyReplacementJob":{"type":"object","properties":{"id":{"type":"string","description":"本地更换任务ID。"},"mode":{"type":"string","enum":["SINGLE","BATCH"]},"state":{"type":"string","description":"QUEUED／PREPARING／SUBMITTING／RUNNING／VERIFYING／COMPLETED／PARTIAL_FAILED／FAILED／NEEDS_REVIEW；HTTP200不代表已更换成功。"},"total":{"type":"integer"},"finished":{"type":"integer"},"error":{"type":["string","null"]},"items":{"type":"array","items":{"$ref":"#/components/schemas/ProxyReplacementResultItem"}}}},"CredentialRefreshRequest":{"type":"object","required":["requestId","version"],"additionalProperties":false,"properties":{"requestId":{"type":"string","description":"调用方生成的小写规范UUID，同一次操作保持不变。","format":"uuid"},"version":{"type":"integer","description":"资源详情返回的version。","minimum":0}}},"ReauthorizationStart":{"type":"object","required":["version","mode"],"additionalProperties":false,"properties":{"version":{"type":"integer","description":"资源详情返回的version。","minimum":0},"mode":{"type":"string","description":"OAUTH生成授权链接；REFRESH_TOKEN手动提交新凭据。","enum":["OAUTH","REFRESH_TOKEN"]}}},"ReauthorizationSubmit":{"type":"object","additionalProperties":false,"properties":{"code":{"type":"string","description":"OAUTH模式仅填写本次新授权码；不得同时传Token。","maxLength":16384},"refreshToken":{"type":"string","description":"REFRESH_TOKEN模式必填；与code互斥。","maxLength":16384},"accessToken":{"type":"string","description":"REFRESH_TOKEN模式可选。","maxLength":16384},"expiresAt":{"type":"integer","description":"REFRESH_TOKEN模式可选，未来的毫秒时间戳。"}}},"MaintenanceOperation":{"type":"object","properties":{"id":{"type":"string","description":"本地操作ID；重新授权时用于提交和查询同一操作。"},"resourceId":{"type":"string"},"mode":{"type":"string"},"status":{"type":"string","description":"NONE无记录；READY待提交；saved已保存待安装；complete完成；UNKNOWN未知。保留其他上游阶段，HTTP200不等于完成。"},"credentialSaved":{"type":"boolean"},"laneState":{"type":["string","null"]},"paused":{"type":"boolean"},"busy":{"type":"boolean"},"reauthorizationAllowed":{"type":"boolean","description":"current查询返回的当前授权维护开关。"},"authUrl":{"type":"string","description":"仅发起OAuth时返回，供账号持有人打开。"},"expiresAt":{"type":["string","null"],"format":"date-time"},"updatedAt":{"type":["string","null"],"format":"date-time"},"queryFailed":{"type":"boolean"}}}}}`)
  },
  m = {
    openapi: `3.1.0`,
    info: {
      title: `Hispread CCMAX API`,
      version: `1.1.0`,
      description: `9 groups, 21 Bearer operations. Proxy replacement, forced credential refresh and reauthorization preserve account permissions, supplier/creator/project scope and maintenance policy. Maintenance is independent of new-account intake. Version/capacity checks, lane exclusion and request identity remain enforced; query the original operation before retrying uncertain writes.`
    },
    servers: [{
      url: window.location.origin
    }],
    paths: JSON.parse(`{"/api/open/v1/ccmax/projects":{"get":{"operationId":"ccmaxListEligibleProjects","summary":"List eligible projects","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business response. Check state for account submissions and skipped for proxy imports.","content":{"application/json":{"schema":{"type":"array","items":{"$ref":"#/components/schemas/Project"}}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}}}},"/api/open/v1/ccmax/proxies":{"get":{"operationId":"ccmaxListVisibleProxies","summary":"List visible proxies","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business response. Check state for account submissions and skipped for proxy imports.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyPage"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"search","in":"query","required":false,"schema":{"type":"string","maxLength":128}},{"name":"page","in":"query","required":false,"schema":{"type":"integer","minimum":1,"default":1}},{"name":"size","in":"query","required":false,"schema":{"type":"integer","minimum":1,"maximum":100,"default":20}}]}},"/api/open/v1/ccmax/proxies/import":{"post":{"operationId":"ccmaxImportProxies","summary":"Import proxies","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business response. Check state for account submissions and skipped for proxy imports.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyImportResult"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyImport"}}}}}},"/api/open/v1/ccmax/submissions/credentials":{"post":{"operationId":"ccmaxSubmitCredentials","summary":"Submit credentials","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business response. Check state for account submissions and skipped for proxy imports.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Submission"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/CredentialSubmit"}}}}}},"/api/open/v1/ccmax/submissions/oauth/authorize":{"post":{"operationId":"ccmaxStartOauth","summary":"Start OAuth","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business response. Check state for account submissions and skipped for proxy imports.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/OAuthAuthorization"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/Account"}}}}}},"/api/open/v1/ccmax/submissions/oauth/complete":{"post":{"operationId":"ccmaxCompleteOauth","summary":"Complete OAuth","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business response. Check state for account submissions and skipped for proxy imports.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Submission"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/OAuthSubmit"}}}}}},"/api/open/v1/ccmax/submissions/{id}":{"get":{"operationId":"ccmaxQuerySubmission","summary":"Query submission","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business response. Check state for account submissions and skipped for proxy imports.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Submission"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string"}}]}},"/api/open/v1/ccmax/submissions/{id}/cancel":{"post":{"operationId":"ccmaxCancelPendingSubmission","summary":"Cancel pending submission","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business response. Check state for account submissions and skipped for proxy imports.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Submission"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string"}}]}},"/api/open/v1/ccmax/resources":{"get":{"operationId":"ccmaxListResources","summary":"List resources","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business response. Check state for account submissions and skipped for proxy imports.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ResourcePage"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"search","in":"query","required":false,"schema":{"type":"string"}},{"name":"state","in":"query","required":false,"schema":{"type":"string"}},{"name":"projectCode","in":"query","required":false,"schema":{"type":"string"}},{"name":"operationalStatus","in":"query","required":false,"schema":{"type":"string"}},{"name":"page","in":"query","required":false,"schema":{"type":"integer","minimum":1,"default":1}},{"name":"size","in":"query","required":false,"schema":{"type":"integer","minimum":1,"maximum":100,"default":20}}]}},"/api/open/v1/ccmax/resources/{id}":{"get":{"operationId":"ccmaxGetResource","summary":"Get resource","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business response. Check state for account submissions and skipped for proxy imports.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Resource"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string"}}]}},"/api/open/v1/ccmax/daily-summary":{"get":{"operationId":"ccmaxGetTodayQuoteSummary","summary":"Get today quote summary","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business response. Check state for account submissions and skipped for proxy imports.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/DailySummary"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"quoteId","in":"query","required":true,"schema":{"type":"string","minLength":1,"maxLength":100}}]}},"/api/open/v1/ccmax/intake":{"get":{"operationId":"ccmaxGetTodayIntake","summary":"Get today account creation allowance","description":"Requires resource.read. No query parameters. Counts are independent of resource filters. Priority values, tiers and ranges are never exposed. Clients cannot submit priority, tier, canPro or quota source controls in query parameters or request bodies.","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Current caller daily creation counts and allowance","content":{"application/json":{"schema":{"$ref":"#/components/schemas/IntakeToday"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}}}},"/api/open/v1/ccmax/proxy-replacements":{"post":{"operationId":"ccmaxReplaceProxies","summary":"Replace resource proxies","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business receipt; check state/status and item outcomes.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyReplacementJob"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyReplacementCreate"}}}}}},"/api/open/v1/ccmax/proxy-replacements/{id}":{"get":{"operationId":"ccmaxGetProxyReplacement","summary":"Get proxy replacement job","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business receipt; check state/status and item outcomes.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyReplacementJob"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string","description":"Local job/operation ID."}}]}},"/api/open/v1/ccmax/proxy-replacements/{id}/reconcile":{"post":{"operationId":"ccmaxReconcileProxyReplacement","summary":"Reconcile proxy binding","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business receipt; check state/status and item outcomes.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/ProxyReplacementJob"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"id","in":"path","required":true,"schema":{"type":"string","description":"Local job/operation ID."}}]}},"/api/open/v1/ccmax/resources/{resourceId}/credential-refresh":{"get":{"operationId":"ccmaxCurrentCredentialRefresh","summary":"Get current credential refresh","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business receipt; check state/status and item outcomes.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MaintenanceOperation"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"resourceId","in":"path","required":true,"schema":{"type":"string","description":"Local resource ID."}}]},"post":{"operationId":"ccmaxRefreshCredential","summary":"Force credential refresh","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business receipt; check state/status and item outcomes.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MaintenanceOperation"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"resourceId","in":"path","required":true,"schema":{"type":"string","description":"Local resource ID."}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/CredentialRefreshRequest"}}}}}},"/api/open/v1/ccmax/resources/{resourceId}/reauthorizations/current":{"get":{"operationId":"ccmaxCurrentReauthorization","summary":"Get current reauthorization","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business receipt; check state/status and item outcomes.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MaintenanceOperation"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"resourceId","in":"path","required":true,"schema":{"type":"string","description":"Local resource ID."}}]}},"/api/open/v1/ccmax/resources/{resourceId}/reauthorizations":{"post":{"operationId":"ccmaxStartReauthorization","summary":"Start reauthorization","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business receipt; check state/status and item outcomes.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MaintenanceOperation"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"resourceId","in":"path","required":true,"schema":{"type":"string","description":"Local resource ID."}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ReauthorizationStart"}}}}}},"/api/open/v1/ccmax/resources/{resourceId}/reauthorizations/{id}":{"put":{"operationId":"ccmaxSubmitReauthorization","summary":"Submit reauthorization credentials","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business receipt; check state/status and item outcomes.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MaintenanceOperation"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"resourceId","in":"path","required":true,"schema":{"type":"string","description":"Local resource ID."}},{"name":"id","in":"path","required":true,"schema":{"type":"string","description":"Local job/operation ID."}}],"requestBody":{"required":true,"content":{"application/json":{"schema":{"$ref":"#/components/schemas/ReauthorizationSubmit"}}}}},"get":{"operationId":"ccmaxGetReauthorization","summary":"Get reauthorization progress","security":[{"AccountApiKey":[]}],"responses":{"200":{"description":"Business receipt; check state/status and item outcomes.","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MaintenanceOperation"}}}},"400":{"description":"Invalid input","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"401":{"description":"Missing or invalid API key","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"403":{"description":"Insufficient permission","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"404":{"description":"Object not found or not accessible","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"409":{"description":"State or idempotency conflict","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"502":{"description":"Upstream request failed","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}},"503":{"description":"Temporarily unavailable","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Error"}}}}},"parameters":[{"name":"resourceId","in":"path","required":true,"schema":{"type":"string","description":"Local resource ID."}},{"name":"id","in":"path","required":true,"schema":{"type":"string","description":"Local job/operation ID."}}]}}}`),
    components: JSON.parse(`{"securitySchemes":{"AccountApiKey":{"type":"http","scheme":"bearer","bearerFormat":"hp_…"}},"schemas":{"Account":{"type":"object","description":"PRO policy is derived from server settings. Clients cannot override canPro.","properties":{"projectCode":{"type":"string","minLength":1,"maxLength":100},"credentialMode":{"type":"string","enum":["REFRESH_TOKEN","ACCESS_TOKEN","SESSION_KEY","OAUTH"]},"accountName":{"type":"string","minLength":1,"maxLength":128},"proxyId":{"type":"string","minLength":1,"maxLength":4096,"description":"An existing proxy id or a SOCKS5 / HTTP / HTTPS proxy address. Also accepts host:port or host:port:username:password (SOCKS5 by default). An address saves or reuses a proxy owned by the caller, without a separate import or preflight, and additionally requires proxy.read and proxy.write.","example":"http://username:password@proxy.example.com:8080"},"refreshToken":{"type":"string","writeOnly":true},"accessToken":{"type":"string","writeOnly":true},"sessionKey":{"type":"string","writeOnly":true},"expiresAt":{"type":"integer","format":"int64","minimum":1,"description":"Expiration timestamp in milliseconds, consistent with the web application. Only supported for ACCESS_TOKEN."},"setupToken":{"type":"boolean","enum":[false],"description":"Only false is supported; true is not currently supported."},"remark":{"type":"string","maxLength":2000}},"required":["projectCode","credentialMode","accountName","proxyId"]},"CredentialSubmit":{"type":"object","properties":{"requestKey":{"type":"string","format":"uuid"},"input":{"$ref":"#/components/schemas/Account"}},"required":["requestKey","input"]},"OAuthSubmit":{"type":"object","properties":{"sessionId":{"type":"string"},"code":{"type":"string","writeOnly":true},"input":{"$ref":"#/components/schemas/Account"}},"required":["sessionId","code","input"]},"Project":{"type":"object","properties":{"projectId":{"type":"string"},"projectCode":{"type":"string"},"projectName":{"type":"string"},"settlementMethod":{"type":"string"},"quoteId":{"type":"string"},"quoteCode":{"type":"string"},"currency":{"type":"string"}}},"ProxyImport":{"type":"object","properties":{"lines":{"type":"string","description":"Up to 500 lines, using the existing proxy formats."},"defaultProtocol":{"type":"string","enum":["SOCKS5","HTTP","HTTPS"]},"maxResources":{"type":"integer","minimum":0}},"required":["lines","maxResources"]},"ProxyImportResult":{"type":"object","properties":{"imported":{"type":"integer"},"skipped":{"type":"array","items":{"type":"object","properties":{"line":{"type":"integer"},"reason":{"type":"string"}}}}}},"Proxy":{"type":"object","properties":{"id":{"type":"string"},"name":{"type":"string"},"protocol":{"type":"string"},"endpoint":{"type":"string"},"enabled":{"type":"boolean"},"maxResources":{"type":"integer"},"usedResources":{"type":"integer"},"reservedResources":{"type":"integer"},"version":{"type":"integer","description":"Current proxy version; send as proxyVersion when selecting an existing proxy.","minimum":0}}},"Resource":{"type":"object","properties":{"id":{"anyOf":[{"type":"string"},{"type":"null"}]},"name":{"anyOf":[{"type":"string"},{"type":"null"}]},"accountName":{"anyOf":[{"type":"string"},{"type":"null"}]},"projectId":{"anyOf":[{"type":"string"},{"type":"null"}]},"projectName":{"anyOf":[{"type":"string"},{"type":"null"}]},"credentialMode":{"anyOf":[{"type":"string"},{"type":"null"}]},"state":{"anyOf":[{"type":"string"},{"type":"null"}]},"dispatchState":{"anyOf":[{"type":"string"},{"type":"null"}]},"laneId":{"anyOf":[{"type":"string"},{"type":"null"}]},"laneState":{"anyOf":[{"type":"string"},{"type":"null"}]},"operationalStatus":{"anyOf":[{"type":"string"},{"type":"null"}]},"createdAt":{"anyOf":[{"type":"string"},{"type":"null"}]},"updatedAt":{"anyOf":[{"type":"string"},{"type":"null"}]},"submittedAt":{"anyOf":[{"type":"string"},{"type":"null"}]},"creationFailureHint":{"anyOf":[{"type":"string"},{"type":"null"}]},"dispatchFailureReason":{"anyOf":[{"type":"string"},{"type":"null"}]},"resourceType":{"type":"string","const":"CCMAX"},"resourceData":{"anyOf":[{"type":"object","additionalProperties":true},{"type":"null"}]},"creationAttempts":{"type":"integer"},"creationRetrying":{"type":"boolean"},"creationFinished":{"type":"boolean"},"creationHttpStatus":{"anyOf":[{"type":"integer"},{"type":"null"}]},"version":{"type":"integer","description":"Current resource version; retrieve it before a maintenance operation.","minimum":0}}},"Submission":{"type":"object","properties":{"failureCode":{"anyOf":[{"type":"string"},{"type":"null"}],"description":"Definite plan failures use PRO_PLAN_NOT_ALLOWED or PLAN_CHECK_FAILED; other failures retain their original business codes."},"state":{"anyOf":[{"type":"string"},{"type":"null"}]},"resourceId":{"anyOf":[{"type":"string"},{"type":"null"}]},"laneId":{"anyOf":[{"type":"string"},{"type":"null"}]},"laneState":{"anyOf":[{"type":"string"},{"type":"null"}]},"expiresAt":{"anyOf":[{"type":"string"},{"type":"null"}]},"message":{"anyOf":[{"type":"string"},{"type":"null"}]},"creationFailureHint":{"anyOf":[{"type":"string"},{"type":"null"}]},"creationAttempts":{"type":"integer"},"creationRetrying":{"type":"boolean"},"creationFinished":{"type":"boolean"},"creationHttpStatus":{"anyOf":[{"type":"integer"},{"type":"null"}]}}},"OAuthAuthorization":{"type":"object","properties":{"sessionId":{"type":"string"},"authUrl":{"type":"string","format":"uri"},"expiresAt":{"type":"string","format":"date-time"}},"required":["sessionId","authUrl","expiresAt"]},"DailySummary":{"type":"object","properties":{"businessDate":{"type":"string","format":"date"},"timezone":{"type":"string","const":"Asia/Shanghai"},"quoteId":{"type":"string"},"currency":{"type":"string"},"hasData":{"type":"boolean"},"resourceCount":{"type":"integer"},"entryCount":{"type":"integer"},"pendingCount":{"type":"integer"},"consumptionTotal":{"anyOf":[{"type":"string","pattern":"^-?\\\\d+(\\\\.\\\\d+)?$"},{"type":"null"}]},"pendingConsumption":{"anyOf":[{"type":"string","pattern":"^-?\\\\d+(\\\\.\\\\d+)?$"},{"type":"null"}]},"payableTotal":{"anyOf":[{"type":"string","pattern":"^-?\\\\d+(\\\\.\\\\d+)?$"},{"type":"null"}],"description":"Booked receivables are returned only to supplier primary accounts. Department administrators and ordinary members do not receive this field."},"lastQueriedAt":{"anyOf":[{"type":"string","format":"date-time"},{"type":"null"}]}}},"Error":{"type":"object","properties":{"message":{"type":"string"},"status":{"type":"integer"},"traceId":{"type":"string"},"creationNotStarted":{"type":"boolean"},"code":{"type":"string"}},"required":["message","status","traceId"]},"ProxyPage":{"type":"object","properties":{"items":{"type":"array","items":{"$ref":"#/components/schemas/Proxy"}},"total":{"type":"integer","format":"int64"},"page":{"type":"integer"},"size":{"type":"integer"}},"required":["items","total","page","size"]},"ResourcePage":{"type":"object","properties":{"items":{"type":"array","items":{"$ref":"#/components/schemas/Resource"}},"total":{"type":"integer","format":"int64"},"page":{"type":"integer"},"size":{"type":"integer"}},"required":["items","total","page","size"]},"IntakeAllowance":{"type":"object","additionalProperties":false,"required":["limit","used","remaining","source","groupId","reclaimed"],"properties":{"limit":{"anyOf":[{"type":"integer","minimum":0},{"type":"null"}]},"used":{"type":"integer","minimum":0},"remaining":{"anyOf":[{"type":"integer","minimum":0},{"type":"null"}]},"source":{"type":"string"},"groupId":{"anyOf":[{"type":"string"},{"type":"null"}]},"reclaimed":{"type":"boolean"}},"description":"Null limit/remaining means unlimited. Reclaimed personal allocations have no remaining allowance today; sharing resumes the next Beijing day."},"IntakeToday":{"type":"object","additionalProperties":false,"required":["date","total","pro","nonPro","unknown","processing","proAllowance","nonProAllowance","canPro","accepting"],"properties":{"date":{"type":"string","format":"date"},"total":{"type":"integer","minimum":0},"pro":{"type":"integer","minimum":0},"nonPro":{"type":"integer","minimum":0},"unknown":{"type":"integer","minimum":0},"processing":{"type":"integer","minimum":0},"proAllowance":{"$ref":"#/components/schemas/IntakeAllowance"},"nonProAllowance":{"$ref":"#/components/schemas/IntakeAllowance"},"canPro":{"type":"boolean"},"accepting":{"type":"boolean"}}},"ProxyReplacementItem":{"type":"object","required":["resourceId","resourceVersion"],"additionalProperties":false,"properties":{"resourceId":{"type":"string","description":"Local resource ID, not an upstream Lane ID."},"resourceVersion":{"type":"integer","description":"The version returned by the resource detail endpoint.","minimum":0},"proxyId":{"type":"string","description":"Existing proxy ID; supply proxyVersion and omit proxyUrl."},"proxyVersion":{"type":"integer","description":"The version returned by the proxy list endpoint.","minimum":0},"proxyUrl":{"type":"string","description":"SOCKS5/HTTP URI or host:port[:username:password]; additionally requires proxy.write.","maxLength":4096}},"oneOf":[{"required":["proxyId","proxyVersion"]},{"required":["proxyUrl"]}]},"ProxyReplacementCreate":{"type":"object","required":["requestKey","items"],"additionalProperties":false,"properties":{"requestKey":{"type":"string","description":"Keep unchanged when retrying the same replacement; 16–80 letters, digits, underscores or hyphens.","pattern":"^[A-Za-z0-9_-]{16,80}$"},"items":{"type":"array","minItems":1,"maxItems":100,"items":{"$ref":"#/components/schemas/ProxyReplacementItem"},"description":"1–100 items from the same supplier and CCMAX target."}}},"ProxyReplacementResultItem":{"type":"object","properties":{"resourceId":{"type":"string","description":"Local resource ID."},"resourceName":{"type":"string"},"proxyName":{"type":"string"},"state":{"type":"string","description":"Per-item outcome; DONE confirms binding, NEEDS_REVIEW requires reconciliation."},"error":{"type":["string","null"]},"bindingApplied":{"type":"boolean"},"readiness":{"type":"string","description":"Currently unverified; successful binding does not guarantee account readiness."}}},"ProxyReplacementJob":{"type":"object","properties":{"id":{"type":"string","description":"Local replacement job ID."},"mode":{"type":"string","enum":["SINGLE","BATCH"]},"state":{"type":"string","description":"QUEUED/PREPARING/SUBMITTING/RUNNING/VERIFYING/COMPLETED/PARTIAL_FAILED/FAILED/NEEDS_REVIEW; HTTP 200 is not confirmation of replacement."},"total":{"type":"integer"},"finished":{"type":"integer"},"error":{"type":["string","null"]},"items":{"type":"array","items":{"$ref":"#/components/schemas/ProxyReplacementResultItem"}}}},"CredentialRefreshRequest":{"type":"object","required":["requestId","version"],"additionalProperties":false,"properties":{"requestId":{"type":"string","description":"Caller-generated canonical lowercase UUID; keep it unchanged for the same operation.","format":"uuid"},"version":{"type":"integer","description":"The version returned by the resource detail endpoint.","minimum":0}}},"ReauthorizationStart":{"type":"object","required":["version","mode"],"additionalProperties":false,"properties":{"version":{"type":"integer","description":"The version returned by the resource detail endpoint.","minimum":0},"mode":{"type":"string","description":"OAUTH creates an authorization link; REFRESH_TOKEN accepts new manual credentials.","enum":["OAUTH","REFRESH_TOKEN"]}}},"ReauthorizationSubmit":{"type":"object","additionalProperties":false,"properties":{"code":{"type":"string","description":"For OAUTH only: the new authorization code; do not send tokens.","maxLength":16384},"refreshToken":{"type":"string","description":"Required for REFRESH_TOKEN; mutually exclusive with code.","maxLength":16384},"accessToken":{"type":"string","description":"Optional in REFRESH_TOKEN mode.","maxLength":16384},"expiresAt":{"type":"integer","description":"Optional future expiry in milliseconds for REFRESH_TOKEN mode."}}},"MaintenanceOperation":{"type":"object","properties":{"id":{"type":"string","description":"Local operation ID; use it to submit and query the same reauthorization."},"resourceId":{"type":"string"},"mode":{"type":"string"},"status":{"type":"string","description":"NONE means no record; READY awaits input; saved awaits installation; complete means complete; UNKNOWN is uncertain. Other upstream stages are preserved; HTTP 200 does not mean complete."},"credentialSaved":{"type":"boolean"},"laneState":{"type":["string","null"]},"paused":{"type":"boolean"},"busy":{"type":"boolean"},"reauthorizationAllowed":{"type":"boolean","description":"Current maintenance policy, returned by current-operation queries."},"authUrl":{"type":"string","description":"Returned when starting OAuth; the account holder opens this URL."},"expiresAt":{"type":["string","null"],"format":"date-time"},"updatedAt":{"type":["string","null"],"format":"date-time"},"queryFailed":{"type":"boolean"}}}}}`)
  },
  h = c() === `en-US` ? m : p,
  g = h,
  _ = g.servers[0].url,
  v = `/api/open/v1/ccmax`,
  y = Object.entries(g.paths).flatMap(([e, t]) => Object.entries(t).map(([t, n]) => ({
    id: `${t}:${e}`,
    method: t.toUpperCase(),
    path: e,
    operation: n
  })));

function b(e) {
  return e.$ref ? g.components.schemas[e.$ref.split(`/`).at(-1)] : e
}

function x(e) {
  let t = b(e);
  return t.anyOf ? t.anyOf.map(x).join(` | `) : Array.isArray(t.type) ? t.type.join(` | `) : t.type === `array` ? `${x(t.items||{})}[]` : t.format === `uuid` ? `UUID` : t.type || `object`
}

function S(e, t = ``, n = 0) {
  let r = b(e);
  return r.type === `array` ? S(r.items || {}, `[].`, n) : Object.entries(r.properties || {}).flatMap(([e, i]) => {
    let a = {
      name: t + e,
      type: x(i),
      required: r.required?.includes(e) ?? !1,
      description: i.description || ``
    };
    return n < 2 && i.type === `array` && i.items?.$ref ? [a, ...S(i.items, `${t}${e}[].`, n + 1)] : n < 2 && i.$ref ? [a, ...S(i, `${t}${e}.`, n + 1)] : [a]
  })
}

function C(e) {
  return [...(e.operation.parameters || []).map(e => ({
    name: e.name,
    type: `${e.in} · ${x(e.schema)}`,
    required: e.required,
    description: e.schema.description || ``
  })), ...e.operation.requestBody ? S(e.operation.requestBody.content[`application/json`].schema) : []]
}
var w = h,
  T = [{
    id: `projects`,
    label: `项目编码`
  }, {
    id: `proxies`,
    label: `代理导入与查询`
  }, {
    id: `submissions`,
    label: `CCMAX 上号`
  }, {
    id: `resources`,
    label: `资源查询`
  }, {
    id: `proxy-replacements`,
    label: `更换代理`
  }, {
    id: `credential-refresh`,
    label: `强制刷新授权`
  }, {
    id: `reauthorizations`,
    label: `重新授权`
  }, {
    id: `daily-summary`,
    label: `当日日账汇总`
  }, {
    id: `intake`,
    label: `今日上号额度`
  }],
  E = {
    "GET /projects": `查询可上号项目`,
    "GET /proxies": `查询代理列表`,
    "POST /proxies/import": `导入代理`,
    "POST /submissions/credentials": `凭据上号`,
    "POST /submissions/oauth/authorize": `发起 OAuth 授权`,
    "POST /submissions/oauth/complete": `提交授权码`,
    "GET /submissions/{id}": `查询上号结果`,
    "POST /submissions/{id}/cancel": `取消待提交授权`,
    "GET /resources": `查询资源列表`,
    "GET /resources/{id}": `查询资源详情`,
    "GET /daily-summary": `查询当日日账汇总`,
    "GET /intake": `查询今日上号额度`,
    "POST /proxy-replacements": `更换代理`,
    "GET /proxy-replacements/{id}": `查询代理更换任务`,
    "POST /proxy-replacements/{id}/reconcile": `重新核对代理绑定`,
    "GET /resources/{resourceId}/credential-refresh": `查询强制刷新结果`,
    "POST /resources/{resourceId}/credential-refresh": `强制刷新授权`,
    "GET /resources/{resourceId}/reauthorizations/current": `查询当前重新授权操作`,
    "POST /resources/{resourceId}/reauthorizations": `发起重新授权`,
    "PUT /resources/{resourceId}/reauthorizations/{id}": `提交重新授权凭据`,
    "GET /resources/{resourceId}/reauthorizations/{id}": `查询重新授权进度`
  },
  D = {
    projects: `返回当前账号有权上号的 CCMAX 项目编码、名称和对应有效报价标识。团队成员的项目授权实时校验。`,
    proxies: `代理按当前账号范围查询和导入。proxyId 也可直接填写代理地址，自动保存或复用本人代理，无需单独导入或预检。`,
    submissions: `单账号上号复用现有业务流程。凭据提交使用调用方生成的 UUID；OAuth 使用返回的 sessionId。相同请求标识和输入不会重复创建账号。`,
    resources: `查询当前账号可见的资源及最近同步的状态和额度。仅返回本地已有数据，不触发上游同步，不返回原始凭据、代理认证或管理密钥。`,
    "proxy-replacements": `更换前查询资源 version 和代理 version。支持1–100条同供应商、同目标资源；可直接填写 proxyUrl，额外需要 proxy.write。重试保持 requestKey 和内容不变，返回任务后查询逐项结果。reconcile 仅重新核对绑定，不重复提交更换。`,
    "credential-refresh": `沿用授权维护开关。requestId 为同一次操作固定的 UUID；UNKNOWN 时查询原操作，不换键重复刷新。saved 表示待安装，允许沿用原 requestId 再试；complete 才表示本次刷新完成，不保证账号就绪。`,
    reauthorizations: `先 POST 发起 OAUTH 或 REFRESH_TOKEN，再用返回的操作 id 通过 PUT 提交授权码或新凭据。OAuth 链接由账号持有人完成。发起响应丢失时先查 current；提交结果未知时查询原操作，不能盲目重新发起或更换一次性凭据。`,
    intake: `返回API密钥绑定账号的北京时间当日成功总数、PRO／非PRO／未识别数量、处理中数量和实际额度来源的余额。数量不随资源筛选变化；不返回优先级信息。`,
    "daily-summary": `仅接受 quoteId，查询北京时间今天的汇总。主账号限定本供应商，团队成员限定本人资源及当前授权项目。不提供明细或日期范围。`
  },
  O = {
    projectCode: `项目查询返回的稳定编码。`,
    quoteId: `项目查询返回的报价标识，精确关联本次查询。`,
    proxyId: `必填，可填已有代理 id 或 SOCKS5 / HTTP / HTTPS 地址；也支持 host:port、host:port:username:password（默认 SOCKS5）。直填地址还需 proxy.read + proxy.write 权限。`,
    requestKey: `调用方生成的 UUID；同一次提交重试时保持不变。`,
    sessionId: `发起 OAuth 返回的本地会话标识。`,
    id: `资源查询传资源 id；提交结果查询传 requestKey 或 sessionId。`,
    credentialMode: `REFRESH_TOKEN / ACCESS_TOKEN / SESSION_KEY / OAUTH。`,
    accountName: `上号账号名称，最多128个字符。`,
    expiresAt: `ACCESS_TOKEN 的可选过期时间，使用正整数毫秒时间戳。`,
    setupToken: `仅兼容 false，true 暂不支持。`,
    refreshToken: `REFRESH_TOKEN 模式必填；仅通过请求体提交。`,
    accessToken: `ACCESS_TOKEN 模式必填。`,
    sessionKey: `SESSION_KEY 模式必填。`,
    code: `账号持有人完成授权后取得的授权码。`,
    lines: `代理文本，支持 SOCKS5 / HTTP / HTTPS；单次最多500行。`,
    defaultProtocol: `SOCKS5 / HTTP / HTTPS，用于未写协议的输入。`,
    maxResources: `非负整数；0表示不限。`,
    page: `页码从1开始，默认1。`,
    size: `每页条数默认20，最大100。`,
    state: `按交付状态筛选，例如 DRAFT、DELIVERED。`,
    operationalStatus: `按已有运行状态分类筛选，例如 READY、GONE、INVALID。`,
    search: `关键词查询，沿用现有账号和 Lane ID 搜索。`,
    input: `账号对象；OAuth 完成时与发起授权时保持一致。`,
    businessDate: `服务端按 Asia/Shanghai 取今天。`,
    consumptionTotal: `已入账原始金额加尚未入账的当天消耗，十进制字符串。`,
    pendingConsumption: `尚未入账的当天消耗，不据此预估应付金额。`,
    payableTotal: `仅供应商主账号返回已入账应收金额；部门管理员和普通成员不返回此字段。`,
    hasData: `无数据为 false，金额为 null；真实零消耗保留零字符串。`,
    lastQueriedAt: `范围内最近观测时间，不代表全部资源已同步。`,
    imported: `成功导入数量；同时检查 skipped 中的跳过项。`,
    skipped: `重复或格式错误行及对应原因。`,
    resourceData: `已有额度和健康状态；没有数据时为 null。`,
    resourceCount: `本次汇总涉及的资源数量。`,
    entryCount: `本次汇总涉及的账单条目数量，仅返回数量。`,
    pendingCount: `尚未入账的条目数量。`
  },
  k = {
    id: `代理或资源的本地标识，供后续调用使用。`,
    name: `对象的可读名称。`,
    state: `业务状态；上号回执仅 SUCCESS 表示确认成功。`,
    expiresAt: `OAuth 会话到期时间，ISO 8601 格式。`,
    projectId: `项目的内部标识。`,
    projectName: `项目名称。`,
    settlementMethod: `QUOTA 为额度结算，ACCOUNT_BUYOUT 为账号买断。`,
    quoteCode: `关联报价的业务编号。`,
    currency: `金额所属币种，不合并不同币种。`,
    timezone: `业务日期使用 Asia/Shanghai。`,
    items: `当前页结果数组，具体字段见响应示例。`,
    total: `列表总条数；上号额度接口中为当日PRO、非PRO与未识别成功数量之和。`,
    page: `当前页码。`,
    size: `当前每页条数。`,
    sessionId: `本地授权会话标识，用于完成授权和查询结果。`,
    authUrl: `由账号持有人打开并完成授权的链接。`,
    resourceId: `成功关联的本地资源标识。`,
    resourceType: `本组接口返回 CCMAX。`,
    laneId: `上游账号的 Lane ID。`,
    laneState: `最近同步的上游账号状态。`,
    dispatchState: `本地交付处理结果。`,
    createdAt: `资源创建时间。`,
    updatedAt: `资源最近更新时间。`,
    submittedAt: `资源提交交付时间，未提供时为空。`,
    creationAttempts: `本次创建执行轮次，不等于最终 HTTP 创建请求次数。`,
    creationRetrying: `是否仍处于原流程的受控恢复中。`,
    creationFinished: `本次处理是否结束，不代表已成功交付。`,
    creationHttpStatus: `已保存的上游 HTTP 状态码，可能为空。`,
    creationFailureHint: `当前创建尝试的安全错误说明。`,
    dispatchFailureReason: `已保存的交付失败说明。`,
    date: `成功日期，按北京时间划分。`,
    pro: `当日成功识别为PRO的新增数量。`,
    nonPro: `当日成功识别为非PRO的新增数量。`,
    unknown: `已成功但套餐未识别的数量，后续补入原成功日期。`,
    processing: `处理中及结果待核实的请求数量。`,
    proAllowance: `当前账号实际PRO额度来源的上限、已用、下级未用预留与本账号可用数；null上限表示不限。`,
    nonProAllowance: `当前账号实际非PRO额度来源的上限、已用、下级未用预留与本账号可用数；null上限表示不限。`,
    reservedRemaining: `该来源预留给直属成员或交付组的未用额度，受上级总限约束；不计入remaining。`,
    proBlockReason: `PRO不能接收的具体原因；null表示可接收。`,
    nonProBlockReason: `非PRO不能接收的具体原因；null表示可接收。`,
    canPro: `服务端计算的PRO接收状态，仅可读取，不能作为上号请求参数提交。`,
    accepting: `当前额度来源是否接收新上号。`
  };

function A(e) {
  switch (N(e)) {
    case `projects`:
    case `submissions`:
      return `resource.write`;
    case `proxies`:
      return e.method === `POST` ? `proxy.read + proxy.write` : `proxy.read`;
    case `resources`:
    case `intake`:
      return `resource.read`;
    case `proxy-replacements`:
      return j(e) === `/proxy-replacements` ? `resource.read + resource.write + proxy.read（直接填写额外需 proxy.write）` : `resource.read`;
    case `credential-refresh`:
    case `reauthorizations`:
      return `resource.read + resource.write`;
    default:
      return `主账号需 settlement.read；团队成员沿用本人日账资格。`
  }
}

function j(e) {
  return e.path.slice(v.length)
}

function M(e) {
  return E[`${e.method} ${j(e)}`] || e.operation.summary
}

function N(e) {
  let t = j(e);
  return t.includes(`/reauthorizations`) ? `reauthorizations` : t.endsWith(`/credential-refresh`) ? `credential-refresh` : t.split(`/`)[1]
}
var P = {
    projectCode: `PRJ-000001`,
    credentialMode: `REFRESH_TOKEN`,
    accountName: `account@example.com`,
    proxyId: `http://username:password@proxy.example.com:8080`,
    refreshToken: `<refreshToken>`
  },
  F = {
    projectCode: P.projectCode,
    credentialMode: `OAUTH`,
    accountName: P.accountName,
    proxyId: P.proxyId
  };

function I(e) {
  if (e.method !== `GET`) {
    if (N(e) === `credential-refresh`) return {
      requestId: `00000000-0000-4000-8000-000000000001`,
      version: 0
    };
    if (N(e) === `reauthorizations`) return e.method === `POST` ? {
      version: 0,
      mode: `OAUTH`
    } : {
      code: `<authorizationCode>`
    };
    switch (j(e)) {
      case `/proxy-replacements`:
        return {
          requestKey: `00000000-0000-4000-8000-000000000001`, items: [{
            resourceId: `<resourceId>`,
            resourceVersion: 0,
            proxyUrl: `http://username:password@proxy.example.com:8080`
          }]
        };
      case `/proxies/import`:
        return {
          lines: `socks5://username:password@proxy.example.com:1080`, defaultProtocol: `SOCKS5`, maxResources: 10
        };
      case `/submissions/credentials`:
        return {
          requestKey: `00000000-0000-4000-8000-000000000001`, input: P
        };
      case `/submissions/oauth/authorize`:
        return F;
      case `/submissions/oauth/complete`:
        return {
          sessionId: `<sessionId>`, code: `<authorizationCode>`, input: F
        };
      default:
        return
    }
  }
}

function L(e) {
  let t = N(e) === `daily-summary` ? `?quoteId=<quoteId>` : ``,
    n = I(e);
  return [`curl --fail-with-body -X ${e.method} "${_}${e.path.replace(/\{([^}]+)\}/g,` < $1 > `)}${t}"`, `  -H "Authorization: Bearer $CCMAX_API_KEY"`, ...n ? [`  -H "Content-Type: application/json"`, `  --data '${JSON.stringify(n,null,2)}'`] : []].join(` \\
`)
}
var R = {
  id: `<resourceId>`,
  version: 0,
  name: `CCMAX account`,
  accountName: `account@example.com`,
  projectId: `<projectId>`,
  state: `DELIVERED`,
  dispatchState: `SUCCESS`,
  laneId: `<laneId>`,
  laneState: `READY`,
  resourceData: null,
  resourceType: `CCMAX`
};

function z(e, t = !0) {
  let n = j(e);
  return N(e) === `proxy-replacements` ? {
    id: `<jobId>`,
    mode: `SINGLE`,
    state: `QUEUED`,
    total: 1,
    finished: 0,
    items: [{
      resourceId: `<resourceId>`,
      state: `PENDING`,
      bindingApplied: !1,
      readiness: `unverified`
    }]
  } : N(e) === `credential-refresh` ? e.method === `GET` ? {
    status: `NONE`,
    reauthorizationAllowed: !0
  } : {
    id: `<requestId>`,
    status: `complete`,
    laneState: `READY`,
    paused: !1,
    busy: !1
  } : N(e) === `reauthorizations` ? n.endsWith(`/current`) ? {
    status: `NONE`,
    reauthorizationAllowed: !0
  } : {
    id: `<operationId>`,
    resourceId: `<resourceId>`,
    mode: `OAUTH`,
    status: e.method === `POST` ? `READY` : `complete`,
    credentialSaved: e.method !== `POST`,
    busy: !1,
    paused: !1,
    ...e.method === `POST` ? {
      authUrl: `https://example.invalid/authorize`,
      expiresAt: `2026-11-09T10:30:00+08:00`
    } : {}
  } : n === `/projects` ? [{
    projectId: `<projectId>`,
    projectCode: `PRJ-000001`,
    projectName: `CCMAX`,
    settlementMethod: `QUOTA`,
    quoteId: `<quoteId>`,
    quoteCode: `QT-000001`,
    currency: `USD`
  }] : n === `/proxies/import` ? {
    imported: 1,
    skipped: []
  } : n === `/proxies` ? {
    items: [{
      id: `<proxyId>`,
      version: 0,
      name: `Proxy`,
      protocol: `SOCKS5`,
      endpoint: `pro****:1080`,
      enabled: !0,
      maxResources: 10,
      usedResources: 0,
      reservedResources: 0
    }],
    total: 1,
    page: 1,
    size: 20
  } : n.endsWith(`/authorize`) ? {
    sessionId: `<sessionId>`,
    authUrl: `https://example.invalid/authorize`,
    expiresAt: `2026-11-03T10:30:00+08:00`
  } : n.endsWith(`/cancel`) ? {
    state: `CANCELLED`
  } : N(e) === `submissions` ? {
    state: `SUCCESS`,
    resourceId: `<resourceId>`,
    laneId: `<laneId>`,
    laneState: `READY`
  } : n === `/resources` ? {
    items: [R],
    total: 1,
    page: 1,
    size: 20
  } : n === `/resources/{id}` ? R : n === `/intake` ? {
    date: `2026-11-04`,
    total: 35,
    pro: 2,
    nonPro: 30,
    unknown: 3,
    processing: 1,
    proAllowance: {
      limit: 10,
      used: 2,
      remaining: 8,
      source: `U:<userId>`,
      groupId: `<groupId>`,
      reclaimed: !1,
      reservedRemaining: 0
    },
    nonProAllowance: {
      limit: 100,
      used: 30,
      remaining: 70,
      source: `U:<userId>`,
      groupId: `<groupId>`,
      reclaimed: !1,
      reservedRemaining: 0
    },
    canPro: !0,
    accepting: !0,
    proBlockReason: null,
    nonProBlockReason: null
  } : {
    businessDate: `2026-11-03`,
    timezone: `Asia/Shanghai`,
    quoteId: `<quoteId>`,
    currency: `USD`,
    hasData: !0,
    resourceCount: 2,
    entryCount: 3,
    pendingCount: 1,
    consumptionTotal: `2.123456789`,
    pendingConsumption: `0.123456789`,
    ...t ? {
      payableTotal: `1.6`
    } : {},
    lastQueriedAt: `2026-11-03T10:00:00+08:00`
  }
}
var B = t();

function V({
  label: t,
  code: n
}) {
  let {
    notify: r
  } = e();
  async function i() {
    try {
      await navigator.clipboard.writeText(n), r(s(`已复制`))
    } catch {
      r(s(`复制失败，请手动选择复制`), !0)
    }
  }
  return (0, B.jsxs)(`div`, {
    className: `api-doc-code`,
    children: [(0, B.jsxs)(`div`, {
      className: `api-doc-code-toolbar`,
      children: [(0, B.jsx)(`span`, {
        children: t
      }), (0, B.jsx)(l, {
        icon: `copy`,
        variant: `ghost`,
        onClick: () => void i(),
        children: s(`复制`)
      })]
    }), (0, B.jsx)(`pre`, {
      tabIndex: 0,
      "aria-label": t,
      children: (0, B.jsx)(`code`, {
        children: n
      })
    })]
  })
}

function H({
  fields: e,
  request: t = !1
}) {
  return e.length ? (0, B.jsx)(r, {
    ariaLabel: s(`接口字段`),
    children: (0, B.jsxs)(`table`, {
      className: `api-doc-fields`,
      children: [(0, B.jsx)(`thead`, {
        children: (0, B.jsxs)(`tr`, {
          children: [(0, B.jsx)(`th`, {
            children: s(`字段`)
          }), (0, B.jsx)(`th`, {
            children: s(`类型`)
          }), t && (0, B.jsx)(`th`, {
            children: s(`必填`)
          }), (0, B.jsx)(`th`, {
            children: s(`说明`)
          })]
        })
      }), (0, B.jsx)(`tbody`, {
        children: e.map(e => (0, B.jsxs)(`tr`, {
          children: [(0, B.jsx)(`td`, {
            children: (0, B.jsx)(`code`, {
              children: e.name
            })
          }), (0, B.jsx)(`td`, {
            children: (0, B.jsx)(`code`, {
              children: e.type
            })
          }), t && (0, B.jsx)(`td`, {
            children: s(e.required ? `是` : `否`)
          }), (0, B.jsx)(`td`, {
            children: s(e.description || !t && k[e.name.split(`.`).at(-1)] || O[e.name.split(`.`).at(-1)] || ``) || `—`
          })]
        }, e.name))
      })]
    })
  }) : (0, B.jsx)(`p`, {
    className: `api-doc-muted`,
    children: s(`无需额外参数。`)
  })
}
var U = (0, f.lazy)(() => o(() => import(`./AccountDialogs-DkF7YQod.js`).then(e => ({
  default: e.PersonalProfileDialog
})), __vite__mapDeps([0, 1, 2])));

function W() {
  let {
    user: t,
    refresh: n,
    notify: r
  } = e(), [o, u] = (0, f.useState)(`start`), [p, m] = (0, f.useState)(y[0].id), [h, b] = (0, f.useState)(!1), x = y.find(e => e.id === p) || y[0], E = N(x) === `daily-summary`, O = N(x) === `intake`, k = t.role === `SUPPLIER_AGENT`;

  function P() {
    let e = new Blob([JSON.stringify(w, null, 2)], {
        type: `application/json`
      }),
      t = URL.createObjectURL(e),
      n = document.createElement(`a`);
    n.href = t, n.download = c() === `en-US` ? `ccmax-openapi.en.json` : `ccmax-openapi.json`, n.click(), window.setTimeout(() => URL.revokeObjectURL(t), 1e3)
  }
  return (0, B.jsxs)(`div`, {
    className: `api-docs`,
    children: [(0, B.jsxs)(`div`, {
      className: `api-doc-toolbar`,
      children: [(0, B.jsxs)(`div`, {
        className: `api-doc-caption`,
        children: [(0, B.jsx)(`strong`, {
          children: `CCMAX`
        }), (0, B.jsxs)(`span`, {
          children: [`v`, g.info.version]
        }), (0, B.jsx)(`span`, {
          children: s(`{0} 个接口`, [y.length])
        })]
      }), (0, B.jsxs)(`div`, {
        className: `heading-actions`,
        children: [(0, B.jsx)(l, {
          icon: `download`,
          onClick: P,
          children: s(`下载 OpenAPI`)
        }), (0, B.jsx)(l, {
          variant: `primary`,
          icon: `lock`,
          onClick: () => b(!0),
          children: s(`管理 API 密钥`)
        })]
      })]
    }), (0, B.jsx)(d, {
      value: o,
      onChange: u,
      items: [{
        id: `start`,
        label: s(`快速开始`)
      }, {
        id: `endpoints`,
        label: s(`接口说明`)
      }, {
        id: `rules`,
        label: s(`权限与重试`)
      }]
    }), o === `start` ? (0, B.jsxs)(`div`, {
      className: `api-doc-start`,
      children: [!t.supplierId && (0, B.jsx)(i, {
        children: s(`平台账号可查看对接说明；这些 CCMAX 业务接口由供应商主账号或团队成员的 API 密钥调用。`)
      }), (0, B.jsxs)(`section`, {
        className: `api-doc-panel`,
        children: [(0, B.jsx)(`h2`, {
          children: s(`接入地址与认证`)
        }), (0, B.jsx)(V, {
          label: s(`接口前缀`),
          code: `${_}${v}`
        }), (0, B.jsx)(V, {
          label: s(`请求头`),
          code: `Authorization: Bearer <API_KEY>
Content-Type: application/json`
        }), (0, B.jsx)(`p`, {
          className: `api-doc-muted`,
          children: s(`在「个人资料 → API 密钥」创建密钥，或点击右上方「管理 API 密钥」。密钥沿用所属账号的权限和数据范围。`)
        })]
      }), (0, B.jsxs)(`section`, {
        className: `api-doc-panel`,
        children: [(0, B.jsx)(`h2`, {
          children: s(`接入步骤`)
        }), (0, B.jsxs)(`ol`, {
          className: `api-doc-steps`,
          children: [(0, B.jsxs)(`li`, {
            children: [(0, B.jsx)(`strong`, {
              children: s(`查询项目与报价标识`)
            }), (0, B.jsx)(`p`, {
              children: s(`查询有权上号的项目，保存 projectCode 和 quoteId。`)
            })]
          }), (0, B.jsxs)(`li`, {
            children: [(0, B.jsx)(`strong`, {
              children: s(`填写或选择代理`)
            }), (0, B.jsx)(`p`, {
              children: s(`proxyId 可直接填写代理地址，也可填写代理列表中的 id；代理须启用且仍有容量。`)
            })]
          }), (0, B.jsxs)(`li`, {
            children: [(0, B.jsx)(`strong`, {
              children: s(`提交单账号上号`)
            }), (0, B.jsx)(`p`, {
              children: s(`选择凭据或 OAuth 流程。保存 requestKey 或 sessionId，通过原标识查询结果；state=SUCCESS 才确认成功。`)
            })]
          }), (0, B.jsxs)(`li`, {
            children: [(0, B.jsx)(`strong`, {
              children: s(`查询资源和当日汇总`)
            }), (0, B.jsx)(`p`, {
              children: s(`按资源 id 查询状态和额度；用 quoteId 查询北京时间当天的日账汇总。`)
            })]
          })]
        }), (0, B.jsx)(l, {
          onClick: () => u(`endpoints`),
          children: s(`查看接口说明`)
        })]
      }), (0, B.jsx)(i, {
        children: s(`当日日账仅提供汇总，不提供明细。金额取最近同步的数据，当天仍会变化；未同步的数据不按零处理。`)
      })]
    }) : o === `endpoints` ? (0, B.jsxs)(`div`, {
      className: `api-doc-layout`,
      children: [(0, B.jsx)(`nav`, {
        className: `api-doc-index`,
        "aria-label": s(`接口目录`),
        children: T.map(e => (0, B.jsxs)(`section`, {
          children: [(0, B.jsx)(`h2`, {
            children: s(e.label)
          }), y.filter(t => N(t) === e.id).map(e => (0, B.jsxs)(`button`, {
            "aria-current": e.id === p ? `true` : void 0,
            className: e.id === p ? `active` : ``,
            onClick: () => {
              m(e.id), window.scrollTo({
                top: 0
              })
            },
            children: [(0, B.jsx)(`span`, {
              className: `api-doc-method ${e.method.toLowerCase()}`,
              children: e.method
            }), (0, B.jsx)(`span`, {
              children: s(M(e))
            })]
          }, e.id))]
        }, e.id))
      }), (0, B.jsxs)(`article`, {
        className: `api-doc-panel api-doc-endpoint`,
        children: [(0, B.jsx)(`h2`, {
          children: s(M(x))
        }), (0, B.jsxs)(`div`, {
          className: `api-doc-path`,
          children: [(0, B.jsx)(`span`, {
            className: `api-doc-method ${x.method.toLowerCase()}`,
            children: x.method
          }), (0, B.jsxs)(`code`, {
            children: [v, j(x)]
          })]
        }), (0, B.jsx)(`p`, {
          children: s(D[N(x)])
        }), (0, B.jsx)(`p`, {
          className: `api-doc-muted`,
          children: s(`所需权限：{0}`, [s(A(x))])
        }), E && (0, B.jsx)(i, {
          children: s(`只接受 quoteId。日期由服务端固定为北京时间今天，额外日期参数、明细开关或其他账号筛选将被拒绝。`)
        }), O && (0, B.jsx)(i, {
          tone: `blue`,
          children: s(`PRO满额只关闭PRO接收；非PRO满额停止新增。优先级、档位、区间、canPro及额度来源由服务端计算，上号请求携带这些参数会被拒绝。`)
        }), (0, B.jsx)(`h3`, {
          children: s(`请求参数`)
        }), (0, B.jsx)(H, {
          fields: C(x),
          request: !0
        }), (0, B.jsx)(`h3`, {
          children: s(`调用示例`)
        }), (0, B.jsx)(`p`, {
          className: `api-doc-muted`,
          children: s(`请替换示例中的占位值。示例密钥、凭据和账号均为占位内容，页面不会发起上号请求。`)
        }), (0, B.jsx)(V, {
          label: `cURL`,
          code: L(x)
        }), (0, B.jsx)(`h3`, {
          children: s(`返回字段`)
        }), (0, B.jsx)(H, {
          fields: S(x.operation.responses[200].content[`application/json`].schema).filter(e => !k || e.name !== `payableTotal`)
        }), (0, B.jsx)(`h3`, {
          children: s(`响应示例`)
        }), (0, B.jsx)(V, {
          label: `JSON`,
          code: JSON.stringify(z(x, !k), null, 2)
        }), N(x) === `submissions` && (0, B.jsx)(i, {
          tone: `orange`,
          children: s(`HTTP 200 表示已取得业务回执。UNKNOWN 或 PENDING 时继续查询原请求，不能换键自动重复上号。`)
        })]
      }, p)]
    }) : (0, B.jsxs)(`div`, {
      className: `api-doc-start`,
      children: [(0, B.jsxs)(`section`, {
        className: `api-doc-panel`,
        children: [(0, B.jsx)(`h2`, {
          children: s(`账号与密钥权限`)
        }), (0, B.jsxs)(`ul`, {
          className: `api-doc-rules`,
          children: [(0, B.jsx)(`li`, {
            children: s(`API 密钥只能使用所属账号已有的权限；主账号、团队成员的供应商归属和本人范围由服务端校验。`)
          }), (0, B.jsx)(`li`, {
            children: s(`密钥撤销、到期或账号停用后无法调用；角色权限和项目授权变更会在后续请求生效。`)
          }), (0, B.jsx)(`li`, {
            children: s(`旧密钥不会自动获得新增代理和账单权限，需要在个人资料中重置或重新签发。`)
          }), (0, B.jsx)(`li`, {
            children: s(`密钥放在 Authorization 请求头中，不放入 URL 或共享日志。登录 Cookie 不能替代 API 密钥。`)
          })]
        })]
      }), (0, B.jsxs)(`section`, {
        className: `api-doc-panel`,
        children: [(0, B.jsx)(`h2`, {
          children: s(`错误与重试`)
        }), (0, B.jsx)(V, {
          label: s(`错误结构`),
          code: `{
  "message": "...",
  "status": 409,
  "traceId": "..."
}`
        }), (0, B.jsx)(`dl`, {
          className: `api-doc-errors`,
          children: [
            [`400`, `输入不合法，或使用了不支持的查询参数。`],
            [`401`, `密钥缺失、无效、过期或账号状态不允许。`],
            [`403`, `账号权限不足，或接口方法尚未开放。`],
            [`404`, `对象不存在或不在当前账号可见范围。`],
            [`409`, `幂等内容、版本或业务状态冲突。`],
            [`502 / 503`, `上游服务或本次查询暂时不可用。`]
          ].map(([e, t]) => (0, B.jsxs)(`div`, {
            children: [(0, B.jsx)(`dt`, {
              children: (0, B.jsx)(`code`, {
                children: e
              })
            }), (0, B.jsx)(`dd`, {
              children: s(t)
            })]
          }, e))
        }), (0, B.jsx)(i, {
          tone: `orange`,
          children: s(`读取可以重试。上号写入超时后先查询原 requestKey 或 sessionId；404 也可能表示原请求尚未落库，不能据此换键重交。`)
        })]
      })]
    }), h && (0, B.jsx)(f.Suspense, {
      fallback: (0, B.jsx)(a, {}),
      children: (0, B.jsx)(U, {
        initialTab: `tokens`,
        onClose: () => b(!1),
        onSaved: () => {
          n(), b(!1), r(s(`个人信息已更新`))
        }
      })
    })]
  })
}
export {
  W as
  default
};
