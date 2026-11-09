# 显式本地报价续期申请策略

这套规则是本地新增的管理员配置协议，不是从原站恢复出的生产续期算法。原前端只展示续期历史和定时任务；证据没有确定自动延长期、提前天数和批准规则，因此系统默认不启用。

管理员可在现有任务配置接口显式选择已通过报价。`autoRenewEnabled=true`、`renewalDays`为1–365天、`renewBeforeDays`为0–30天时，`QUOTE_AUTO_RENEWAL`才变为ready。`quoteIds`最多500项，只接受存在的APPROVED报价；此管理员入口同时将所选原报价的`autoRenewEnabled`设为指定值。供应商或运营不能通过普通报价保存注入这个开关。

```sh
curl -X PUT "$BASE/api/system/scheduled-tasks/QUOTE_AUTO_RENEWAL/config" \
  -b cookies.txt -H "X-CSRF-TOKEN: $CSRF" -H 'Content-Type: application/json' \
  --data '{"version":0,"autoRenewEnabled":true,"renewalDays":30,"renewBeforeDays":3,"quoteIds":["APPROVED_QUOTE_ID"],"enabled":false,"requestKey":"local-policy-v1"}'

curl -X POST "$BASE/api/system/scheduled-tasks/QUOTE_AUTO_RENEWAL/run" \
  -b cookies.txt -H "X-CSRF-TOKEN: $CSRF" -H 'Content-Type: application/json' --data '{}'
```

示例version必须换成GET任务返回的当前版本。`enabled=false`配置后可先手动run；确认后再按现有任务启停接口启用调度。更改提前天数或延长天数不会自动批准任何报价。

执行仅处理仍为APPROVED且明确opt-in的原报价；供应商必须已通过并启用，项目必须启用，原结束日在北京时间今天至提前窗口内。未来期间从原结束日期次日开始，延长指定天数。续期价格使用该未来起始日已审核价格历史快照，不复制账号凭据或未审核改价。新报价状态固定PENDING，提交者为SYSTEM_QUOTE_RENEWAL，仍需独立平台审核；原报价有效期与已批准状态保持。

幂等键由原报价ID和新起止日期确定。已有相同续期键，或同供应商、项目存在重叠的PENDING/APPROVED报价时跳过。重复执行不会产生重复申请。执行结果和生成数保存在scheduled-run；原报价续期历史记录AUTO_PENDING及pendingQuoteId，不把“申请生成”描述为续期已批准。

未配置完整显式规则时任务ready=false，手动执行或启用返回503。QUOTE_AUTO_RENEWAL不会调用第三方或触发付款。
