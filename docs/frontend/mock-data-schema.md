# Mock Data Schema

## 1. 目标

本文只记录当前 runtime 仍在使用的 mock 类型和字段主线。

## 当前 PRD 命名映射

新 PRD 中的业务名词按当前前端主线理解：

| 新 PRD 名词 | 当前前端模型 | 说明 |
|---|---|---|
| `order` | `Purchase` | 一次购买公共信息和归组对象，不驱动单件执行状态 |
| `item` / `work_order` | `OrderLine.productionTaskNo` + `OrderLine` | 货号是主要识别码，`OrderLine` 是一件商品的执行对象 |
| `style_template` | `Product` | 款式模板，只提供规格、规则、生产参考和文件资料 |
| `payment` | `FinancePaymentRecord` | 货号维度收款、补款、退款和旧金抵扣流水 |
| `inventory_batch` | `InventoryBatch` | 库存 FIFO 批次，只服务库存台账和财务成本卡 |
| `logistics` / `after_sales` | `LogisticsRecord` / `AfterSalesCase` | `orderLineId` 优先关联的单件物流 / 售后记录 |

已删除的旧兼容字段不再写入类型示例：

- `TransactionRecord`
- `Order / OrderItem`
- `OrderLine.status`
- `transactionId / transactionNo`
- `skuCode / itemSku`
- `orderType`
- `carrier / deliveredAt / note`
- `manualAdjustment / manualAdjustmentReason / finalDisplayQuote`
- `returnedWeight`
- `designInfo.designStatus`
- `productionInfo.factoryStatus`

## 2. Customer

```ts
type Customer = {
  id: string
  name?: string
  phone?: string
  wechat?: string
  defaultRecipientName?: string
  defaultRecipientPhone?: string
  defaultRecipientAddress?: string
  sourceChannels: CustomerChannel[]
  tags: CustomerTag[]
  remark?: string
  firstTransactionAt?: string
  lastTransactionAt?: string
}
```

客户数量统计从当前 `Purchase / OrderLine / AfterSalesCase` 聚合，不再保留外部历史总数字段。

## 3. Purchase

```ts
type Purchase = {
  id: string
  purchaseNo: string
  platformOrderNo?: string
  sourceChannel: PurchaseSourceChannel
  shopName?: string
  customerId?: string
  purchaseType: PurchaseType
  ownerName: string
  recipientName?: string
  recipientPhone?: string
  recipientAddress?: string
  paymentAt?: string
  expectedDate?: string
  promisedDate?: string
  riskTags: string[]
  remark?: string
  aggregateStatus: PurchaseAggregateStatus
  orderLineCount: number
  orderLines: OrderLine[]
  finance?: PurchaseFinanceInfo
  latestActivityAt?: string
  timeline: PurchaseTimelineRecord[]
}
```

`Purchase` 是归组对象，不是单件商品执行对象。

## 4. FinancePaymentRecord

```ts
type FinancePaymentRecord = {
  id: string
  orderLineId: string
  purchaseId?: string
  amount: number
  method: 'cash' | 'transfer' | 'platform' | 'old_gold' | 'refund'
  recordType?: 'deposit' | 'final_payment' | 'supplement' | 'refund' | 'old_gold'
  reviewStatus?: 'pending' | 'reviewed'
  reviewedAt?: string
  inventoryItemId?: string
  inventoryCode?: string
  occurredAt: string
  reason?: string
  note?: string
}
```

财务收款流水默认关联 `orderLineId`。`method` 表示现金、转账、平台、旧金或退款等收款方式，`recordType` 表示定金、尾款、补款、退款或旧金等业务用途。补款 / 退款流水使用 `reviewStatus` 做前端复核状态；退款流水必须优先填写 `reason`，退款缺原因会被财务台账标记为风险，财务异常视图可一次性补齐原因并复核解除。`method = old_gold` 时可以通过 `inventoryItemId / inventoryCode` 关联旧金抵扣入库资产。`Purchase.finance` 只做整笔购买的聚合摘要，不作为单件商品收款主流程。

## 5. ProductSnapshot

```ts
type ProductSnapshot = {
  sourceProductId: string
  sourceProductCode: string
  sourceProductName: string
  sourceProductVersion: string
  category?: ProductCategory
  sourceSpecValue?: string
  defaultMaterial?: string
  defaultProcess?: string
  snapshotAt?: string
}
```

销售引用款式时保存快照，用于核对模板值和本次销售参数。

## 6. OrderLine

```ts
type OrderLineLineStatus =
  | 'draft'
  | 'pending_customer_confirmation'
  | 'pending_design'
  | 'pending_modeling'
  | 'pending_merchandiser_review'
  | 'pending_factory_production'
  | 'in_production'
  | 'factory_returned'
  | 'pending_finance_confirmation'
  | 'ready_to_ship'
  | 'completed'
  | 'after_sales'

type OrderLine = {
  id: string
  lineNo?: number
  productionTaskNo?: string
  purchaseId?: string
  customerId?: string
  name: string
  category?: ProductCategory
  versionNo?: string
  quantity: number
  lineStatus?: OrderLineLineStatus
  designStatus?: OrderLineWorkflowDesignStatus
  modelingStatus?: OrderLineWorkflowModelingStatus
  productionStatus?: OrderLineWorkflowProductionStatus
  factoryStatus?: OrderLineFactoryStatus
  financeStatus?: OrderLineFinanceStatus
  currentOwner?: string
  priority?: OrderLinePriority
  isUrgent?: boolean
  requiresDesign?: boolean
  requiresModeling?: boolean
  requiresWax?: boolean
  isReferencedProduct: boolean
  productId?: string
  sourceProduct?: ProductSnapshot
  selectedSpecValue?: string
  selectedSpecSnapshot?: ProductSpecRow
  selectedMaterial?: string
  selectedProcess?: string
  selectedSpecialOptions?: string[]
  actualRequirements?: OrderLineActualRequirements
  designInfo?: OrderLineDesignInfo
  outsourceInfo?: OrderLineOutsourceInfo
  productionInfo?: OrderLineProductionInfo
  productionData?: OrderLineProductionData
  lineSalesAmount?: number
  allocatedDepositAmount?: number
  allocatedFinalPaymentAmount?: number
  materialCost?: number
  factorySettlementAmount?: number
  estimatedGrossProfit?: number
  financeNote?: string
  financeLocked?: boolean
  quote?: QuoteResult
  expectedDate?: string
  promisedDate?: string
  finishedAt?: string
}
```

规则：

- `OrderLine` 是当前主操作对象。
- 货号使用 `productionTaskNo`。
- 主工作流状态使用 `lineStatus`。
- `OrderLine.status` 已删除。
- 设计/建模/生产/工厂/财务角色分流状态使用顶层 `designStatus / modelingStatus / productionStatus / factoryStatus / financeStatus`。
- 这些核心 workflow 状态字段不接受任意 `string`；真实接口返回未知状态时必须先在接口边界映射、拒绝或显式扩展 union，不能流入 `OrderLine` current model。
- 工厂回传子状态使用 `productionInfo.feedbackStatus`，不得写回 `productionInfo.factoryStatus`。
- `productionInfo` 只放展示型回传文本与回传子状态；结构化重量、成本、附件和结算数据放入 `productionData`。
- `factory_returned` 表示工厂已回传但仍待跟单完工审核；审核通过后才进入 `pending_finance_confirmation`。
- `financeStatus = confirmed` 或 `financeLocked = true` 表示该销售财务已锁定；财务页只读展示收退款、成本卡、工厂结算、备注和异常状态。
- `FinancePaymentRecord` 是商品行收付款流水权威来源；`Purchase.finance` 只保留整笔购买聚合展示，不驱动商品行财务计算。
- 销售成交金额使用 `lineSalesAmount`。
- 系统参考报价使用 `quote.systemQuote`。

## 7. Product

```ts
type Product = {
  id: string
  code: string
  name: string
  shortName?: string
  category: ProductCategory
  series?: string
  styleTags: string[]
  sceneTags: string[]
  status: ProductStatus
  isReferable: boolean
  version: string
  updatedAt: string
  coverImage?: string
  galleryImages: string[]
  supportedMaterials: string[]
  defaultMaterial?: string
  supportedProcesses: string[]
  defaultProcess?: string
  supportedSpecialOptions: string[]
  specMode: 'none' | 'single_axis'
  specName?: string
  specDisplayType?: 'tags' | 'select'
  isSpecRequired?: boolean
  specs: ProductSpecRow[]
  priceRules: ProductPriceRule[]
  customRules: ProductCustomRules
  productionReference: ProductProductionReference
  assets: ProductAssets
  referenceRecords: ProductReferenceRecord[]
  versionHistory: ProductVersionRecord[]
}
```

`Product` 是款式模板，不是销售实例。平台店铺商品当前只在产品扩展区用 mock 展示，不进入正式 `Product` 类型；它不参与报价、销售执行、库存成本或财务核算。

当前不单独新增复杂 `ProductVariant` 类型；`ProductSpecRow` 承载当前 variant 能力，包括规格值、基础价格、参考重量和尺寸参数。产品管理增强应优先扩展 `ProductSpecRow` 的展示和编辑一致性，而不是先拆一个并行 variant 模型。

## 8. ProductSpecRow

```ts
type ProductSpecRow = {
  id: string
  productId: string
  specValue: string
  sortOrder: number
  status: 'enabled' | 'disabled'
  basePrice?: number
  referenceWeight?: number
  note?: string
  sizeFields: ProductSizeField[]
}
```

规格行用于自动带出参数和基础价格。

## 9. ProductPriceRule

```ts
type ProductPriceRule = {
  id: string
  productId: string
  type: 'material' | 'process' | 'special' | 'other'
  ruleKey: string
  delta: number
  enabled: boolean
  note?: string
}
```

固定加价规则用于计算 `QuoteResult.systemQuote`。

## 10. QuoteResult

```ts
type QuoteResult = {
  basePrice?: number
  priceAdjustments: PriceAdjustment[]
  systemQuote?: number
  status: 'idle' | 'waiting_spec' | 'calculating' | 'ready' | 'warning' | 'conflict'
  warnings: QuoteWarning[]
}
```

当前不做报价审批流和多版本报价历史。

## 11. InventoryItem

```ts
type InventoryItem = {
  id: string
  inventoryCode: string
  name: string
  category?: ProductCategory
  sourceType: InventoryItemSourceType
  sourceLabel?: string
  sourcePaymentRecordId?: string
  productId?: string
  productName?: string
  orderLineId?: string
  purchaseId?: string
  customerId?: string
  material?: string
  size?: string
  craftRequirements?: string
  weight?: number
  valuationAmount?: number
  quantity: number
  availableQuantity: number
  warehouseLocation: string
  ownerDepartment: InventoryOwnerDepartment
  condition: InventoryItemCondition
  status: InventoryItemStatus
  receivedAt: string
  keeperName: string
  remark?: string
}
```

库存资产可以关联销售用于追溯，但不驱动销售状态。旧金抵扣入库使用 `sourceType = old_gold`，可通过 `sourcePaymentRecordId` 追溯到商品行收款流水，并用 `valuationAmount` 保存财务抵扣估值。当前前端使用 FIFO 批次核算库存领用成本：只有关联销售的 `outbound` 出库会进入对应 `OrderLine` 成本卡；`reserve / release / adjust` 不确认成本，`scrap` 只扣库存批次，不进入销售成本。

## 12. InventoryBatch

```ts
type InventoryBatch = {
  id: string
  inventoryItemId: string
  inventoryCode: string
  receivedAt: string
  quantity: number
  remainingQuantity: number
  unitCostAmount: number
  totalCostAmount: number
  sourceMovementId: string
}

type InventoryMovement = {
  id: string
  inventoryItemId: string
  inventoryCode: string
  type: 'inbound' | 'reserve' | 'release' | 'outbound' | 'scrap' | 'adjust'
  quantity: number
  operatorName: string
  occurredAt: string
  relatedOrderLineId?: string
  fifoCostAmount?: number
  fifoLayers?: Array<{
    batchId: string
    quantity: number
    unitCostAmount: number
    costAmount: number
    receivedAt: string
  }>
}
```

每次入库形成一个 FIFO 批次。`outbound / scrap` 按 `receivedAt` 升序扣减 `remainingQuantity`；只有 `outbound` 且有关联 `relatedOrderLineId` 时，`fifoCostAmount` 进入该销售的商品行成本。

## 13. LogisticsRecord

```ts
type LogisticsRecord = {
  id: string
  orderLineId: string
  purchaseId?: string
  recordStatus?: 'active' | 'voided'
  logisticsType?: 'measurement_tool' | 'goods' | 'after_sales' | 'other'
  direction?: 'outbound' | 'return'
  company?: string
  trackingNo?: string
  shippedAt?: string
  signedAt?: string
  voidedAt?: string
  voidReason?: string
  remark?: string
}
```

物流记录必须优先关联 `orderLineId`。

## 14. AfterSalesCase

```ts
type AfterSalesCase = {
  id: string
  orderLineId: string
  purchaseId?: string
  customerId?: string
  type?: AfterSalesCaseType
  reason?: string
  status?: AfterSalesCaseStatus
  responsibleParty?: string
  createdAt?: string
  closedAt?: string
  remark?: string
}
```

售后记录必须优先关联 `orderLineId`。

## 15. Task

```ts
type Task = {
  id: string
  type: TaskType
  title: string
  status: TaskStatus
  purchaseId?: string
  purchaseNo?: string
  orderLineId?: string
  orderLineName?: string
  assigneeRole: TaskAssigneeRole
  assigneeName: string
  priority: TaskPriority
  dueAt?: string
  description?: string
  remark?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  completedAt?: string
}
```

任务是协作提醒，不替代 `OrderLine.lineStatus` 主流程。

## 16. 当前 mock 关系

```text
customers -> purchases -> order-lines
finance-payment-records -> orderLineId + optional inventoryItemId
inventory batches -> inventoryItemId + sourceMovementId
products -> order-lines.sourceProduct
supporting-records -> orderLineId
tasks -> purchaseId + orderLineId
inventory -> optional productId / purchaseId / orderLineId / customerId / sourcePaymentRecordId
```

当前 mock 至少覆盖 4 个客户、5 笔购买记录和多条销售：

- 张三 `PUR-202604-001`：同一次购买下多条销售分别处于生产中、待财务确认、待设计、待建模、待跟单审核、工厂异常、待工厂接收和完工待审核。
- 林小姐 `PUR-202604-002`：全定制购买记录，销售不引用 `Product`，分别覆盖待设计和待建模。
- 赵女士 `PUR-202603-118`：现货 / 库存相关购买记录，覆盖 `Product.referenceRecords`、库存占用、库存出库、财务确认和物流发货。
- 内部研发 `PUR-INTERNAL-202605-001`：内部购买记录，覆盖 `purchaseType = internal`、无客户收款和 `lineStatus = completed`。
- 取消购买记录 `PUR-CANCELLED-202604-001`：覆盖 `aggregateStatus = cancelled` 且未生成销售的边界场景。

PR2 seed 还覆盖：

- `financeStatus = abnormal` 的销售和待复核补款流水。
- `InventoryItem.status = scrapped` 和 `InventoryMovement.type = scrap` 的库存报废。
- `LogisticsRecord.logisticsType = measurement_tool / goods / after_sales / other` 四类物流。
- `AfterSalesCase` 继续按 `orderLineId` 优先关联单件销售。

隐式模型映射：

- `ProductVariant` 当前由 `ProductSpecRow` 承载。
- `FactoryFeedback` 当前由 `OrderLine.productionInfo / productionData` 承载。
- `FinanceRecord` 当前由 `FinancePaymentRecord + OrderLine.financeStatus / financeNote / financeLocked / financeAbnormalReason` 承载。

所有 mock 跨文件引用必须能追到 current model 对象；`purchaseId / purchaseNo / customerId / orderLineId / productionTaskNo / productId / inventoryItemId` 不允许只为页面展示伪造。

## 前端字段契约

| 对象 | 主键 | 主要关联键 | 页面归属 |
|---|---|---|---|
| `Purchase` | `id` / `purchaseNo` | `customerId`，内含 `orderLines` 归组展示 | `/purchases/new`、`/purchases/:purchaseId`、工作台 |
| `OrderLine` | `id` / `productionTaskNo` | `purchaseId`、`customerId`、`productId`、`sourceProduct` | `/order-lines`、生产、设计建模、工厂、财务 |
| `Product` | `id` / `code` | `referenceRecords.orderLineId` | `/products/*` |
| `FinancePaymentRecord` | `id` | `orderLineId`、`purchaseId`、可选 `inventoryItemId` | `/finance` |
| `InventoryItem` | `id` / `inventoryCode` | 可选 `productId / purchaseId / orderLineId / customerId / sourcePaymentRecordId` | `/inventory` |
| `InventoryBatch` | `id` | `inventoryItemId`、`sourceMovementId` | `/inventory`、`/finance` 成本卡 |
| `LogisticsRecord` | `id` | `orderLineId`，可选 `purchaseId` | 销售详情和购买记录详情 |
| `AfterSalesCase` | `id` | `orderLineId`，可选 `purchaseId / customerId` | 销售详情、客户详情和售后摘要 |

当前字段契约只服务前端 mock 联调，不定义真实 API、数据库迁移或后端鉴权。

真实接口可以承接 V2 workflow 动作结果字段，但不得恢复 `OrderLine.status`、`productionInfo.factoryStatus`、legacy `/orders`、旧 `OrderItem` 或 `TransactionRecord`。`buildOrderLineStatusPatch` 只允许手动状态面板、兼容测试或明确标注的 demo/debug 入口使用，新业务动作必须调用 `orderLineWorkflow` 动作函数。

## 17. 当前 mock 文件建议

```text
src/mocks/
  customers.ts
  finance-payment-records.ts
  inventory.ts
  order-line-logs.ts
  order-lines.ts
  products.ts
  purchases.ts
  supporting-records.ts
  tasks.ts
```

## 18. 文档同步规则

修改以下内容时必须同步更新本文档：

- `src/types/*` 中的主领域类型。
- `src/mocks/*` 文件增删。
- `OrderLine / Purchase / Product / Customer` 核心字段语义。
- 路由或页面主对象发生变化。

验证：

```bash
npm test
```
