# Handoff

## 当前结论

当前项目是 **OrderLine-centered ERP v2 mock 工作台**。

主线对象：

```text
Customer -> Purchase -> OrderLine -> Product
```

- `Customer`：客户沉淀对象。
- `Purchase`：一次购买的公共信息和归组对象。
- `OrderLine`：一件商品的一条销售，是当前主操作对象。
- `Product`：款式模板，不是销售实例。
- `ProductSnapshot`：销售引用款式时保存的来源快照。
- `FinancePaymentRecord`：货号维度收款流水，默认关联 `orderLineId`。
- `InventoryItem`：仓库库存资产，不驱动销售状态。
- `LogisticsRecord` / `AfterSalesCase`：默认关联 `orderLineId`。

v1 foundation 已完成；V2 已可验收，V2.1-V2.24 已收口为可验收、可演示、可评审、可替换接口边界的跨页面 mock 工作流、真实接口前字段契约和防回流门禁。当前不接真实后端，所有业务流以 mock + 前端状态验证为准。

## 已完成

- legacy `/orders` runtime、旧 orders 类型、service、mock、页面和入口已删除。
- `TransactionRecord` runtime 兼容别名已删除。
- `OrderLine.status` 兼容字段已删除，状态推进统一使用 `lineStatus`。
- `skuCode / itemSku / transactionId / transactionNo / orderType / returnedWeight` 等旧字段已从 current runtime 清理。
- `designInfo.designStatus` 已删除；设计/建模分流统一使用顶层 `designStatus / modelingStatus`。
- `productionInfo.factoryStatus` 已改为 `productionInfo.feedbackStatus`；顶层 `factoryStatus` 只表示工厂工作流状态。
- 销售中心、购买记录新建页、购买记录详情页、客户中心、任务中心、生产跟进、设计建模、工厂、财务、库存、管理看板和生产计划均已接入 current mock 主线。
- 生产跟进已加入工厂回传后的完工二次审核：`factory_returned` 仍由跟单复核，审核通过后才进入 `pending_finance_confirmation`。
- 财务中心已调整为以 `OrderLine` 货号为行的财务台账，`FinancePaymentRecord` 记录商品行收款、补款和退款流水，并展示商品行成本卡；退款缺原因会进入财务风险，财务异常视图支持一次性补齐原因并复核解除；关联销售的 FIFO 库存出库成本进入商品行成本卡；财务确认或锁定后该货号的收退款、结算金额、备注和异常处理只读；`Purchase.finance` 只保留聚合摘要。
- V2.8/V2.9/V2.10 已补端到端角色链路验收、生产阻塞 / 恢复 / 完成动作和任务旁路门禁。
- V2.11/V2.12/V2.13 已补销售详情完成入口、页面动作可用性 selector 和 UI 级端到端验收。
- V2.14/V2.15/V2.16 已补接口契约最终动作清单、V2 验收矩阵和交付收口门禁。
- V2.17/V2.18/V2.19/V2.20 已补真实接口前评审清单、业务演示脚本、黄金链路测试和交付门禁。
- V2.21/V2.22/V2.23/V2.24 已补数据读写边界、Workflow Command Contract、Sidecar Record Contract 和接口替换前门禁。
- 旧金抵扣不再只停留在备注：`FinancePaymentRecord.method = old_gold` 可以关联 `InventoryItem` 旧金入库资产，库存只做资产追溯，不推进销售状态；旧金抵扣流水本身不自动计成本，只有旧金库存真正 `outbound` 并关联销售时才按 FIFO 进入 `totalCost`。
- 资料完整度、生产逾期、工厂回传异常、财务异常和角色待办徽标统一由 `orderLineRiskSelectors` 计算。
- 路由、mock 文件清单、类型章节已加入文档一致性测试。
- current workflow guard 测试已加入，用于防止 runtime 重新引入 legacy `/orders`、`OrderItem`、`TransactionRecord`、`OrderLine.status`、`designInfo.designStatus` 或 `productionInfo.factoryStatus`。
- dead-code 检查使用 `knip`。
- 新 PRD 名词已收敛到当前模型：`order -> Purchase`、`item/work_order -> OrderLine.productionTaskNo + OrderLine`、`style_template -> Product`、`payment -> FinancePaymentRecord`。
- `OrderLineQuickStats` 已从 `orderLine/index.tsx` 抽出，`index.tsx` 只保留类型和组件导出。
- 产品平台店铺信息暂不进入正式 `Product` 类型，仅保留为产品扩展区 mock 展示。

## 当前主路由

```text
/
/order-lines
/purchases
/purchases/new
/purchases/:purchaseId
/customers
/customers/:customerId
/tasks
/tasks/:taskId
/production-follow-up
/design-modeling
/factory
/finance
/inventory
/management
/production-plan
/production-plan/:taskId
/products
/products/new
/products/:productId
/products/:productId/edit
```

`/purchases` 仅重定向到 `/purchases/new`。

## 当前业务规则

- 一次购买可以包含多条销售。
- 同一次购买下的多条销售必须允许分别推进状态、交期、物流和售后。
- `OrderLine.lineStatus` 是主工作流状态。
- `designStatus / modelingStatus / productionStatus / factoryStatus / financeStatus` 是角色分流状态。
- `productionInfo.feedbackStatus` 只表示工厂回传子状态，不替代顶层 `factoryStatus`。
- 工厂回传完成后先停在 `lineStatus = factory_returned`，财务结算与成本核算只承接跟单审核后的 `pending_finance_confirmation`。
- 客服确认按 `requiresDesign -> pending_design`、`requiresModeling -> pending_modeling`、否则 `pending_merchandiser_review` 分流。
- 销售货号使用 `productionTaskNo`。
- 新建购买记录时选中 `Product` 后，销售草稿使用 `product.code` 作为来源款式编码。
- 系统参考报价使用 `quote.systemQuote`。
- 销售成交金额使用 `lineSalesAmount`。
- 商品行收款流水使用 `FinancePaymentRecord.orderLineId`；`method` 表示收款方式，`recordType` 表示定金、尾款、补款、退款或旧金等业务用途；补款 / 退款流水用 `reviewStatus` 标记待复核或已复核，退款流水用 `reason` 记录退款原因；旧金抵扣使用 `method = old_gold`，并可关联 `InventoryItem.sourcePaymentRecordId` 做入库追溯；库存出库成本来自 `InventoryMovement.fifoCostAmount`，只统计关联该销售的 `outbound` 流水。
- `financeStatus = confirmed` 或 `financeLocked = true` 表示货号财务已锁定，财务页不再允许继续改收退款、复核、工厂结算、备注或异常处理。
- 生产阻塞、恢复生产和完成销售统一由 `markProductionBlocked / resumeProduction / completeOrderLine` 推进；`completed` 只能从 `ready_to_ship` 显式进入，不能由物流签收、售后关闭、任务完成或库存动作自动触发。
- 页面业务按钮可用性统一由 `getOrderLineWorkflowActionState` 判断，再叠加前端 mock role capability。
- 任务状态变化只更新任务和购买记录 timeline，不推进 `OrderLine.lineStatus`。
- 物流和售后优先关联 `orderLineId`。
- 工厂角色不得看到客户联系方式、地址、销售金额、定金、尾款、利润或财务备注。
- 财务可以查看金额、成本和工厂回传数据，但不推进设计、建模或生产动作。
- 产品平台店铺信息不参与报价、销售执行、库存成本或财务核算。

## 首轮样例落点

| 样例 | 当前落点 |
|---|---|
| 同一次购买，多件商品，多条销售 | `Purchase.orderLines` 归组展示，`/order-lines` 按 `OrderLine` 多行展示 |
| 戒指自动带价 | `Product.specs + priceRules -> QuoteResult.systemQuote`，销售引用 `ProductSnapshot` |
| 吊坠自动带价 | 同上，吊坠规格和固定加价规则来自 `Product` |
| 同一次购买中多件商品分开发货 | `LogisticsRecord.orderLineId` 支持单件商品独立发货 |
| 同一次购买中只有一件商品进入售后 | `AfterSalesCase.orderLineId` 支持单件商品独立售后 |

## 当前文档边界

- `AGENTS.md`：最高优先级业务规则和 AI coding 规则。
- `docs/frontend/handoff.md`：当前交接说明，只保留当前结论。
- `docs/frontend/mock-data-schema.md`：当前类型和 mock 文件结构。
- `docs/frontend/routes-and-pages.md`：当前路由和页面职责。
- `docs/frontend/ui-structure.md`：当前 UI 信息层级。
- `docs/frontend/interface-readiness.md`：真实接口接入前字段契约和验收边界。
- `docs/frontend/v2-plan.md`：v2 阶段建设包、执行顺序和当前第一轮计划。
- `docs/frontend/frontend-task-board.md`：当前剩余计划。
- `docs/frontend/docs-index.md`：文档索引。

若文档冲突，按上面顺序理解。

## 验证命令

```bash
npm test
npm run build
npm run analyze:dead
```

`npm test` 中包含：

- 路由与 `routes-and-pages.md` 的最小路由集一致性检查。
- mock 文件与 `mock-data-schema.md` 的文件清单一致性检查。
- 类型文件与 `mock-data-schema.md` 的对象章节一致性检查。
- current workflow guard，防止 legacy runtime 概念和旧状态字段回流。

## 下一步计划

| 优先级 | 事项 | 验收 |
|---|---|---|
| P0 | 保持文档与代码同步 | 修改路由、类型、mock、核心字段时同步更新对应文档并跑测试 |
| P1 | V2 交付演示 | 按 `v2-plan.md` 的业务演示脚本跑主链路和旁路记录 golden scenarios |
| P2 | 真实 API 接入另开计划 | 接口替换边界已准备；按 `interface-readiness.md` 确认数据入口、Workflow Command Contract、Sidecar Record Contract、角色边界和禁止回流项 |

## 禁止回退

- 不恢复 `/orders`。
- 不新增旧 `Order / OrderItem` 主模型。
- 不恢复 `TransactionRecord` runtime 兼容别名。
- 不把 `Product` 当作销售执行对象。
- 不把单件销售执行字段塞回 `Purchase`。
- 不把库存动作设计成驱动销售工作流。
