# V2 Plan

## 阶段目标

V2 不是验收清单，也不是页面重写。V2 的主目标是把 v1 已打底的 `OrderLine` 主线推进成 **单件销售执行闭环**：

```text
客服建销售
-> 设计 / 建模处理
-> 跟单审核并下发
-> 工厂生产回传
-> 跟单完工审核
-> 财务核算锁定
-> 销售完成
```

当前仍以前端 mock + 页面状态验证为主。真实接口进入前，只做字段契约评审，不直接写 API 适配层。

## V2 建设包

| 里程碑 | 建设内容 | 完成标准 |
|---|---|---|
| V2.1 销售详情主操作面 | 在销售详情中稳定展示当前阶段、下一步动作、负责角色、商品资料、设计建模、生产、工厂回传、财务、物流、售后和风险 | 打开任意 `OrderLine`，能判断当前在哪一步、谁处理、下一步做什么 |
| V2.2 状态流转规则中心化 | 主流程状态动作收敛到 workflow service，页面逐步只调用动作，不直接拼 `lineStatus` | 动作函数入口已建立，客服确认、设计完成、建模完成、跟单审核、工厂回传、完工审核、财务确认优先通过统一入口 |
| V2.3 跟单生产闭环 | 固化 `pending_merchandiser_review -> pending_factory_production -> in_production -> factory_returned -> pending_finance_confirmation` | 动作入口和页面调用已建立；工厂回传后必须经过跟单完工审核才能进财务 |
| V2.4 设计 / 建模闭环 | 固化设计、建模接收、文件记录、完成后分流到跟单审核 | 动作入口和页面调用已建立；设计 / 建模完成不会停在孤立备注里 |
| V2.5 财务确认 / 锁定闭环 | 按货号处理收退款、成本、工厂结算、异常和锁定只读 | 动作入口和页面调用已建立；`financeStatus = confirmed` 或 `financeLocked = true` 后财务编辑只读 |
| V2.6 单件物流 / 售后补强 | 继续保证物流和售后默认关联 `orderLineId` | 规则和测试门禁已建立；同一次购买下多件商品可独立发货、独立售后，且不推进主流程状态 |
| V2.7 接口前字段契约冻结 | 按 current model 冻结前端字段语义和后端候选名词映射 | 规则和测试门禁已建立；后端字段不能把 current workflow 冲回 legacy `/orders` |
| V2.8 端到端角色链路验收 | 从客服确认到财务锁定、待发货、完成的动作链路可测试 | 端到端验收已建立；每一步对应角色页面队列归属可检查 |
| V2.9 异常 / 阻塞动作中心化 | 生产阻塞、恢复生产和完成销售收敛到 workflow 动作 | 异常动作入口和页面调用已建立；页面不直接拼生产 / 工厂状态 |
| V2.10 任务与旁路记录门禁 | 任务、物流、售后、库存继续作为旁路记录 | 收口门禁已建立；旁路 helper 不修改 `OrderLine.lineStatus` |
| V2.11 完成销售入口 | 在销售详情抽屉补齐 `ready_to_ship -> completed` 业务按钮 | 页面闭环入口已建立；完成单件销售不影响兄弟销售 |
| V2.12 页面动作可用性收口 | 统一由 workflow selector 控制页面按钮可用性 | 动作可用性已建立；页面避免从任意状态跳转 |
| V2.13 UI 级端到端验收 | 用 router smoke 覆盖完成销售、阻塞恢复和工厂按钮门禁 | UI 验收已建立；service 闭环可在页面操作层跑通 |
| V2.14 接口契约最终补齐 | 补齐真实接口前的完整 workflow 动作清单和完成销售规则 | 交付契约已建立；真实接口不得绕过 `orderLineWorkflow` 或恢复 legacy 字段 |
| V2.15 验收矩阵 | 按业务链路列出对应测试和门禁 | 验收矩阵已建立；V2 可按链路、旁路和接口契约逐项检查 |
| V2.16 门禁测试加固 | 扩展文档和 workflow guard 测试 | 交付收口门禁已建立；主流程、旁路记录和 legacy 禁止项可自动检查 |
| V2.17 真实接口前评审清单 | 按 current model 列出接后端前必须确认的对象、字段和禁止回流项 | 接口评审清单已建立；不定义 API、数据库或鉴权方案 |
| V2.18 业务演示脚本 | 补齐主链路和旁路记录的 golden scenarios | 业务演示脚本已建立；产品、前端、后端可按现有路由复核 |
| V2.19 黄金链路测试收口 | 用可读测试覆盖客服到完成销售及旁路不推进主流程 | 黄金链路测试已建立；队列归属、动作可用性和兄弟销售隔离可检查 |
| V2.20 文档与交付门禁 | 扩展文档测试和 workflow guard | 交付门禁已建立；接口评审材料、演示脚本和 legacy 禁止项可自动检查 |
| V2.21 数据读写边界盘点 | 梳理 `useAppData`、mock 和页面 handler 的当前数据入口 | 技术边界已建立；能区分读取视图、主流程命令、旁路记录命令和 demo/debug 命令 |
| V2.22 Workflow Command Contract | 冻结 future API 前的主流程命令契约 | 命令契约已建立；页面不得手拼 `lineStatus`，`buildOrderLineStatusPatch` 不进入 future command contract |
| V2.23 Sidecar Record Contract | 冻结物流、售后、库存和任务的旁路记录契约 | 旁路契约已建立；旁路记录不返回或修改 `OrderLine.lineStatus` |
| V2.24 接口替换前门禁 | 扩展文档测试和 workflow guard 覆盖接口替换边界 | 接口替换门禁已建立；真实 API 接入可另开计划 |

## 第一轮执行计划

1. V2.1 销售详情主操作面 -> verify: 销售详情展示当前步骤、下一步动作和负责角色。
2. V2.2 状态流转规则中心化起点 -> verify: 这些信息由 `orderLineWorkflow` 统一计算，页面不各自判断。
3. 文档同步 -> verify: `docs-index.md`、`handoff.md`、`frontend-task-board.md` 都指向本计划。
4. 测试门禁 -> verify: workflow service 测试和文档测试通过。

## V2.2 - V2.5 当前规则

- `confirmCustomerServiceInfo / startDesign / completeDesign / startModeling / completeModeling / requestDesignRevision / requestModelingRevision / recordWaxFileReady / approveProductionReview / dispatchToFactory / acceptFactoryTask / startFactoryProduction / completeFactoryProduction / submitFactoryReturn / approveFactoryReturn / returnFactoryFeedback / confirmFinance / markFinanceAbnormal / lockFinance` 是主流程动作入口。
- 新增业务按钮应调用动作函数，不直接拼 `lineStatus`。
- 跟单下发后使用 `factoryStatus = pending_acceptance` 和 `productionStatus = dispatched` 表示待工厂接收；工厂接收后再进入生产中。
- `buildOrderLineStatusPatch` 只作为低层兼容 helper 和手动状态面板使用，不作为新业务动作入口。
- 物流、售后和库存动作仍只记录关联数据，不推进主流程状态。

## V2.6 - V2.7 收口规则

- 主流程动作只由 `orderLineWorkflow` 明确动作函数表达；页面业务按钮不得直接调用 `buildOrderLineStatusPatch`。
- `buildOrderLineStatusPatch` 仅保留给手动状态面板、兼容测试或明确标注的 demo/debug 入口。
- 物流和售后按 `orderLineId` 查询、创建、编辑和关闭，只改变 `LogisticsRecord / AfterSalesCase` 列表，不返回或修改 `OrderLine`。
- 库存动作只更新库存资产、批次和流转记录；只有 `outbound + relatedOrderLineId` 的 FIFO 成本进入财务成本卡。
- 真实接口前契约冻结为 `order -> Purchase`、`item/work_order -> OrderLine`、`style_template -> Product`、`payment -> FinancePaymentRecord`、`inventory_batch -> InventoryBatch`、`logistics/after_sales -> orderLineId-first supporting records`。
- 接口可以承接 workflow 动作结果字段，但不能恢复 `OrderLine.status`、`productionInfo.factoryStatus`、legacy `/orders`、旧 `OrderItem` 或 `TransactionRecord`。

## V2.8 - V2.10 当前规则

- `markProductionBlocked / resumeProduction / completeOrderLine` 是异常阻塞、恢复生产和完成销售的主流程动作入口。
- `completeOrderLine` 只允许从 `ready_to_ship` 进入 `completed`；物流创建、签收、售后关闭和任务完成不得自动完成销售。
- 任务中心只做协作提醒；任务状态变化只更新任务和购买记录 timeline，不推进 `OrderLine.lineStatus`。
- 生产跟进页和工厂页的异常 / 恢复动作必须调用 workflow 动作，不在页面内直接拼 `productionStatus / factoryStatus / productionInfo.feedbackStatus`。
- 端到端测试应覆盖客服、设计、建模、跟单、工厂、财务和完成归档的队列归属。

## V2.11 - V2.13 当前规则

- “完成销售”入口只在销售详情抽屉显示，并且只对 `lineStatus = ready_to_ship` 的销售可用。
- 完成销售调用 `completeOrderLine`，追加状态日志，不使用 `buildOrderLineStatusPatch`，且只更新当前 `OrderLine`。
- `getOrderLineWorkflowActionState` 是页面业务按钮可用性的统一 selector；它只读取 current model 字段，不做真实权限鉴权。
- 生产跟进页和工厂页的下发、接收、生产、回传、阻塞、恢复、完工审核按钮必须叠加 selector 和现有角色能力判断。
- UI smoke 覆盖完成销售、生产阻塞 / 恢复、工厂异常 / 恢复和未生产完成不可回传。

## V2.14 - V2.16 交付收口规则

- `interface-readiness.md` 必须列出完整 workflow 动作清单、`getOrderLineWorkflowActionState` 和 `ready_to_ship -> completed` 规则。
- 页面或真实接口层不得重新手拼 `lineStatus` 作为业务动作入口；只能承接 `orderLineWorkflow` 动作结果字段。
- `completed` 只能由 `completeOrderLine` 从 `ready_to_ship` 显式进入，物流签收、售后关闭、任务完成和库存动作不得自动完成销售。
- V2 验收必须同时覆盖主链路、页面入口、旁路记录、接口契约和 legacy 禁止项。

## V2.17 - V2.20 交付演示规则

- `interface-readiness.md` 的真实接口前评审清单只冻结 current model 字段语义，不新增 API adapter、数据库表或鉴权方案。
- golden scenarios 必须能用现有路由演示，不新增页面，不把购买记录详情变成单件执行页。
- 黄金链路测试必须覆盖客服确认到 `completed`，并检查设计 / 建模、跟单、工厂、财务、管理看板的队列归属。
- 旁路演示和测试必须继续证明物流、售后、任务、库存不推进 `OrderLine.lineStatus`。

## V2.21 - V2.24 接口替换边界规则

- `useAppData` 当前是 mock state provider，不是正式 API client；真实 API 接入前只冻结替换边界，不实现请求层。
- 数据入口按 `customers / products / purchases / orderLines / tasks / financePaymentRecords / inventory / logistics / afterSales` 盘点。
- mutation 入口分为读取视图、主流程命令、旁路记录命令和 demo/debug 命令。
- Workflow Command Contract 只接收 `orderLineWorkflow` 动作结果；页面和 future API 都不得把 `buildOrderLineStatusPatch` 包装成通用状态推进命令。
- Sidecar Record Contract 允许物流、售后、库存、任务修改各自记录，但不返回或修改 `OrderLine.lineStatus`。
- 真实 API URL、鉴权、错误码、分页、缓存、重试策略另开独立计划。

## V2 验收矩阵

| 验收项 | 关键规则 | 测试 / 门禁 |
|---|---|---|
| 客服确认 | 按 `requiresDesign -> pending_design`、`requiresModeling -> pending_modeling`、否则跟单审核分流 | `orderLineWorkflow.test.ts` |
| 设计建模 | 设计完成按建模需求分流，建模完成进入跟单审核，修改不推进生产 | `orderLineWorkflow.test.ts`、`orderLineDesignModeling.test.ts` |
| 跟单工厂 | 审核、下发、接收、生产、回传、完工审核按动作顺序推进 | `orderLineWorkflow.test.ts`、`orderLineProductionFollowUp.test.ts`、`orderLineFactory.test.ts`、`router.smoke.test.tsx` |
| 财务锁定 | 财务确认进入 `ready_to_ship` 并锁定只读 | `orderLineWorkflow.test.ts`、`orderLineFinance.test.ts` |
| 完成销售 | `completeOrderLine` 只从 `ready_to_ship` 进入 `completed`，且只更新当前销售 | `orderLineWorkflow.test.ts`、`router.smoke.test.tsx` |
| 旁路记录 | 任务、物流、售后、库存不推进 `OrderLine.lineStatus` | `orderLineWorkspace.test.ts`、`inventorySelectors.test.ts`、`currentWorkflowGuards.test.ts` |
| 接口契约 | `orderLineId` 优先关联，接口只承接 workflow 动作结果字段 | `v2PlanDocs.test.ts`、`mock-data-schema.docs.test.ts` |
| legacy 禁止项 | 不恢复 `/orders`、`OrderItem`、`TransactionRecord`、`OrderLine.status`、`productionInfo.factoryStatus` | `currentWorkflowGuards.test.ts` |

## 业务演示脚本 Golden Scenarios

| 场景 | 演示路径 | 验收重点 |
|---|---|---|
| 主链路完成销售 | `/order-lines` 销售详情 -> `/design-modeling` -> `/production-follow-up` -> `/factory` -> `/production-follow-up` -> `/finance` -> 销售详情完成销售 | 客服确认、设计、建模、跟单审核、工厂接收生产、工厂回传、跟单完工审核、财务锁定、完成销售都由 workflow 动作推进 |
| 同购买多销售分开发货 | `/purchases/:purchaseId` 查看兄弟销售 -> 销售详情新增单件物流 | 物流按 `orderLineId` 关联，只影响当前销售，不推进兄弟销售状态 |
| 单件售后隔离 | 销售详情新增 / 关闭售后 -> 客户详情或购买记录详情复核 | 售后按 `orderLineId` 关联，关闭售后不自动触发 `completed` |
| 库存出库入成本 | `/inventory` 登记关联销售的 `outbound` -> `/finance` 查看成本卡 | 只有 `outbound + relatedOrderLineId` 进入成本，库存动作不推进主流程 |

## 当前不做

- 不接真实后端接口。
- 不设计真实鉴权、审批流或复杂工厂门户。
- 不新增复杂 BI。
- 不扩展客户中心为 CRM。
- 不改变系统参考报价公式。
- 不恢复 `/orders`、旧 `OrderItem`、`TransactionRecord` 或 `OrderLine.status`。
