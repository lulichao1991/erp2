# Mock Data Schema

## 1. 目标

本文只记录当前 runtime 仍在使用的 mock 类型和字段主线。

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

## 4. ProductSnapshot

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

## 5. OrderLine

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
  lineStatus?: OrderLineLineStatus | string
  designStatus?: OrderLineWorkflowDesignStatus | string
  modelingStatus?: OrderLineWorkflowModelingStatus | string
  productionStatus?: OrderLineWorkflowProductionStatus | string
  factoryStatus?: OrderLineFactoryStatus | string
  financeStatus?: OrderLineFinanceStatus | string
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
- 销售成交金额使用 `lineSalesAmount`。
- 系统参考报价使用 `quote.systemQuote`。

## 6. Product

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

`Product` 是款式模板，不是销售实例。

## 7. ProductSpecRow

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

## 8. ProductPriceRule

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

## 9. QuoteResult

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

## 10. InventoryItem

```ts
type InventoryItem = {
  id: string
  inventoryCode: string
  name: string
  category?: ProductCategory
  sourceType: InventoryItemSourceType
  sourceLabel?: string
  productId?: string
  productName?: string
  orderLineId?: string
  purchaseId?: string
  customerId?: string
  material?: string
  size?: string
  craftRequirements?: string
  weight?: number
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

库存资产可以关联销售用于追溯，但不驱动销售状态。

## 11. LogisticsRecord

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

## 12. AfterSalesCase

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

## 13. Task

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

## 14. 当前 mock 关系

```text
customers -> purchases -> order-lines
products -> order-lines.sourceProduct
supporting-records -> orderLineId
tasks -> purchaseId + orderLineId
inventory -> optional productId / purchaseId / orderLineId / customerId
```

## 15. 当前 mock 文件建议

```text
src/mocks/
  customers.ts
  inventory.ts
  order-line-logs.ts
  order-lines.ts
  products.ts
  purchases.ts
  supporting-records.ts
  tasks.ts
```

## 16. 文档同步规则

修改以下内容时必须同步更新本文档：

- `src/types/*` 中的主领域类型。
- `src/mocks/*` 文件增删。
- `OrderLine / Purchase / Product / Customer` 核心字段语义。
- 路由或页面主对象发生变化。

验证：

```bash
npm test
```
