# Interface Readiness

## 目的

本文只记录接真实接口前需要冻结和评审的前端契约，不定义后端 API、数据库结构、鉴权方案或迁移脚本。

当前阶段仍以前端 mock 为准。真实接口接入前，后端字段必须先映射到 current model，不能回退到 legacy `/orders`。

## 命名映射

| PRD / 后端候选名词 | 前端 current model | 接口接入要求 |
|---|---|---|
| `order` | `Purchase` | 只承载一次购买公共信息和归组关系 |
| `item` / `work_order` | `OrderLine` + `productionTaskNo` | 一件商品一条销售，货号是主要识别码 |
| `style_template` | `Product` | 只作为款式模板，不作为销售执行对象 |
| `payment` | `FinancePaymentRecord` | 必须按 `orderLineId` 关联到货号 |
| `inventory_batch` | `InventoryBatch` | 只服务库存 FIFO 成本，不推进销售状态 |
| `logistics` / `after_sales` | `LogisticsRecord` / `AfterSalesCase` | 必须优先按 `orderLineId` 关联，不作为整笔购买唯一记录 |

## 接口前字段契约

| 对象 | 必须稳定的识别字段 | 必须稳定的关联字段 | 前端消费页面 |
|---|---|---|---|
| `Customer` | `id` | 无强制父级 | `/customers`、购买记录、销售详情 |
| `Purchase` | `id`、`purchaseNo` | `customerId` | `/purchases/new`、`/purchases/:purchaseId`、工作台 |
| `OrderLine` | `id`、`productionTaskNo` | `purchaseId`、`customerId`、`productId` | `/order-lines`、生产、设计建模、工厂、财务 |
| `Product` | `id`、`code` | 引用记录中的 `orderLineId` | `/products/*`、新建购买记录选款 |
| `FinancePaymentRecord` | `id` | `orderLineId`、可选 `purchaseId / inventoryItemId` | `/finance` |
| `InventoryItem` | `id`、`inventoryCode` | 可选 `productId / purchaseId / orderLineId / customerId / sourcePaymentRecordId` | `/inventory` |
| `InventoryBatch` | `id` | `inventoryItemId`、`sourceMovementId` | `/inventory`、财务成本卡 |
| `LogisticsRecord` | `id` | `orderLineId`、可选 `purchaseId` | 销售详情、购买记录详情 |
| `AfterSalesCase` | `id` | `orderLineId`、可选 `purchaseId / customerId` | 销售详情、客户详情 |

## 真实接口前评审清单

本清单只用于产品、前端、后端评审字段语义，不定义 API URL、数据库表、鉴权方案或迁移脚本。

| 对象 | 接口前必须确认 | 禁止回流 |
|---|---|---|
| `Purchase` | `id / purchaseNo / customerId` 和一次购买公共信息；只做归组与付款摘要 | 不承接单件生产、设计、工厂或财务执行字段 |
| `OrderLine` | `id / purchaseId / customerId / productId / productionTaskNo / lineStatus`；`productionTaskNo` 是货号；`lineStatus` 只承接 workflow 动作结果 | 不恢复 `OrderLine.status`，不合并回整单执行模型 |
| `Product` | `id / code` 和款式模板资料；销售引用时保留 `ProductSnapshot` | 不把 `Product` 当作销售执行对象 |
| `FinancePaymentRecord` | `id / orderLineId / recordType / method / amount / reviewStatus`；收退款默认按货号归属 | 不把收款流水恢复为整笔购买唯一流水 |
| `InventoryBatch` | `id / inventoryItemId / sourceMovementId / remainingQuantity / unitCostAmount`；只服务 FIFO 成本 | 不用库存批次推动销售主流程 |
| `LogisticsRecord` | `id / orderLineId / purchaseId / recordStatus / logisticsType / trackingNo`；`orderLineId` 优先关联 | 不把物流改成整笔购买唯一记录，不自动完成销售 |
| `AfterSalesCase` | `id / orderLineId / purchaseId / customerId / status / reason`；`orderLineId` 优先关联 | 不让售后关闭自动推进 `completed` |

## V2 workflow 动作契约

真实接口可以承接前端 `orderLineWorkflow` 动作函数的结果字段，但页面或接口层不得重新手拼 `lineStatus` 作为业务动作入口。主流程动作入口冻结为：

```text
confirmCustomerServiceInfo
startDesign
completeDesign
startModeling
completeModeling
requestDesignRevision
requestModelingRevision
recordWaxFileReady
approveProductionReview
dispatchToFactory
acceptFactoryTask
startFactoryProduction
completeFactoryProduction
submitFactoryReturn
approveFactoryReturn
returnFactoryFeedback
markProductionBlocked
resumeProduction
confirmFinance
markFinanceAbnormal
lockFinance
completeOrderLine
```

`getOrderLineWorkflowActionState` 是页面业务按钮可用性的 current model selector，只做前端 mock 防误点，不替代后端鉴权。

接口接入时仍以 `OrderLine.lineStatus` 作为主流程状态，以 `productionStatus / factoryStatus / financeStatus` 作为角色子状态，以 `productionInfo.feedbackStatus` 作为工厂回传子状态。真实接口不得恢复 `OrderLine.status`、`productionInfo.factoryStatus`、legacy `/orders`、旧 `OrderItem` 或 `TransactionRecord`。

物流、售后和库存是旁路记录：`LogisticsRecord / AfterSalesCase` 必须 `orderLineId` 优先关联；库存只有 `InventoryMovement.type = outbound` 且 `relatedOrderLineId` 指向当前销售时，FIFO 成本才进入财务成本卡。其他库存动作不得反向推动客服、设计、建模、生产、工厂或财务状态。

`completed` 只能由 `completeOrderLine` 从 `ready_to_ship` 显式进入。物流创建、物流签收、售后关闭、任务完成和库存动作不得自动把销售推进到 `completed`。

## 前端数据读写边界

当前 `useAppData` 只是前端 mock state provider，不是正式 API client。真实接口接入前，先按下列入口替换数据来源，不改变页面主语或 workflow 语义：

| 数据入口 | 当前来源 | 接口替换边界 |
|---|---|---|
| `customers` | `customersMock` | 只替换客户主档读取，不承接销售执行状态 |
| `products` | `getProductList()` / 产品字段选项本地状态 | 只替换款式模板读取和保存，不把 `Product` 当销售执行对象 |
| `purchases` | `purchasesMock` + `updatePurchase` | 只替换购买记录公共信息、归组和 timeline |
| `orderLines` | `orderLinesMock` + `updateOrderLine` | 只替换单件销售读取和 workflow 动作结果保存 |
| `tasks` | `getTaskList()` + `updateTask` | 只替换协作任务读取和状态保存，不推进 `OrderLine.lineStatus` |
| `financePaymentRecords` | `financePaymentRecordsMock` | 只替换货号维度收退款流水 |
| `inventory` | `inventoryItems / inventoryBatches / inventoryMovements` mock | 只替换库存资产、批次和流转记录 |
| `logistics` | `LogisticsRecord` mock / workspace helper | 只替换单件物流记录 |
| `afterSales` | `AfterSalesCase` mock / workspace helper | 只替换单件售后记录 |

现有 mutation 入口按用途分为：

- 读取视图：页面、selector 和 dashboard 只读取 current model，不恢复 legacy `/orders` 聚合。
- 主流程命令：必须调用 `orderLineWorkflow` 动作，并保存动作返回的 `OrderLine`。
- 旁路记录命令：物流、售后、库存、任务只保存各自记录或 timeline。
- demo/debug 命令：手动状态面板可继续使用兼容 helper，但不得进入业务按钮或 future API command contract。

## Workflow Command Contract

future API 可以接收 workflow 动作名、当前 `OrderLine` 标识和动作返回 patch，但页面仍不得直接拼 `lineStatus`。主流程命令只允许表达 `orderLineWorkflow` 已冻结的动作结果，例如客服确认、设计完成、工厂回传、财务确认和完成销售。

`buildOrderLineStatusPatch` 不属于 future command contract，只保留给手动 demo/debug 入口和兼容测试。真实接口接入时不能把它包装成通用状态推进 API。

## Sidecar Record Contract

物流、售后、库存和任务是旁路记录契约：

- `LogisticsRecord` 可以创建、编辑、作废和签收记录，但不得返回或修改 `OrderLine.lineStatus`。
- `AfterSalesCase` 可以创建、编辑和关闭记录，但不得自动进入或退出 `completed`。
- `InventoryMovement` 可以登记 `reserve / release / adjust / scrap / outbound`；只有 `outbound + relatedOrderLineId` 进入财务成本卡，不推进主流程。
- `Task` 可以更新状态并追加购买记录 timeline，但不得更新 `OrderLine` 主流程状态。

购买记录详情只做汇总入口，不成为整笔购买唯一物流或售后入口；物流和售后仍必须 `orderLineId` 优先关联。

## 接口接入前验收

- `/order-lines` 仍一行代表一件商品，不能合并回整单列表。
- `/purchases/:purchaseId` 只做归组展示，不能承接单件商品执行状态。
- `OrderLine.lineStatus` 仍是主工作流状态，不能恢复 `OrderLine.status`。
- 设计 / 建模只使用顶层 `designStatus / modelingStatus`。
- 工厂回传子状态只使用 `productionInfo.feedbackStatus`，不能恢复 `productionInfo.factoryStatus`。
- 财务收款流水必须关联 `orderLineId`；`Purchase.finance` 只做聚合摘要。
- FIFO 成本只来自关联销售的 `InventoryMovement.type = outbound`。
- 物流和售后必须优先关联 `orderLineId`。
- `ready_to_ship -> completed` 必须由 `completeOrderLine` 触发，不能由旁路记录自动触发。
- `useAppData` 替换为真实接口时仍必须保留主流程命令、旁路记录命令和 demo/debug 命令边界。

## 暂不接入

- 不接真实后端接口和数据库迁移。
- 不设计真实权限鉴权。
- 不恢复 legacy `/orders`、旧 `OrderItem` 或 `TransactionRecord`。
- 不把产品平台店铺信息写进正式 `Product` 类型；当前只保留产品扩展区 mock 展示。
- 不把库存动作设计成推动设计、生产、财务或售后状态。

## 验证命令

```bash
npm test
npm run build
npm run analyze:dead
git diff --check
```
