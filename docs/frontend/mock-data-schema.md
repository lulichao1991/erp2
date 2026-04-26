# Mock 数据结构草案（Purchase + OrderLine）

## 1. 文档目标
本文件用于统一当前前端 mock 数据结构，避免 AI / 前端在开发过程中随意发明字段名、对象关系和计算结果结构。

当前 mock 数据结构服务于以下主链路：

**产品维护（含规格明细与固定加价规则）  
-> 商品行引用产品  
-> 选择规格  
-> 自动带出规格参数  
-> 自动带出基础价格  
-> 叠加固定加价规则  
-> 生成系统参考报价**

---

## 2. 使用原则

### 2.1 当前只服务前端联调
mock 数据只用于：
- 页面展示
- 页面跳转
- 组件联调
- 自动报价前端逻辑演示

不要求完全等同后端数据库设计。

### 2.2 字段语义必须稳定
以下字段的语义禁止随意改动：

- `purchaseNo`
- `platformOrderNo`
- `lineCode`
- `purchaseId`
- `orderLineId`
- `sourceProductId`
- `sourceProductVersion`
- `selectedSpecValue`
- `selectedSpecSnapshot`
- `basePrice`
- `priceAdjustments`
- `systemQuote`

如果一定要改，必须同步更新相关页面、组件、mock 数据和文档。

### 2.3 对象关系必须明确
当前至少要分清这些对象：

- `Customer`
- `Purchase`
- `OrderLine`
- `Product`
- `InventoryItem`
- `ProductSpecRow`
- `ProductPriceRule`
- `ProductSnapshot`
- `LogisticsRecord`
- `AfterSalesCase`
- `QuoteResult`

不要把产品模板、购买公共信息和单件商品执行对象混成一个对象。

库存资产也要和产品模板、商品行执行对象分开：`InventoryItem` 是库管台账记录，可以关联 Product / Purchase / OrderLine，但不替代它们。

---

## 3. Customer（客户主档）

```ts
type CustomerTag =
  | 'new'
  | 'returning'
  | 'vip'
  | 'high_value'
  | 'after_sales_sensitive'
  | 'blacklist_watch'
  | 'other'

type CustomerChannel =
  | 'taobao'
  | 'tmall'
  | 'xiaohongshu'
  | 'wechat'
  | 'offline'
  | 'other'

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
  totalTransactionCount: number
  totalOrderLineCount: number
  totalAfterSalesCount: number
}
```

说明：
- 客户是长期沉淀对象
- 当前客户中心是基于 `customers + purchases + orderLines + afterSalesCases` 的轻量只读聚合，不做复杂 CRM、画像或营销自动化

---

## 4. Purchase（购买记录）

```ts
type PurchaseAggregateStatus =
  | 'draft'
  | 'in_progress'
  | 'partially_shipped'
  | 'completed'
  | 'after_sales'
  | 'exception'
  | 'cancelled'

type PurchaseType =
  | 'semi_custom'
  | 'full_custom'
  | 'spot_goods'
  | 'internal'

type PurchaseSourceChannel =
  | 'taobao'
  | 'tmall'
  | 'xiaohongshu'
  | 'wechat'
  | 'offline'
  | 'other'

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

  /**
   * 仅用于购买记录聚合展示，不作为主流程驱动状态。
   */
  aggregateStatus: PurchaseAggregateStatus

  /**
   * 冗余字段，便于列表页直接显示。
   */
  orderLineCount: number

  /**
   * 当前 mock 可直接内嵌，后续真实接口可按需拆分。
   */
  orderLines: OrderLine[]
  finance?: PurchaseFinanceInfo
  latestActivityAt?: string
  timeline: PurchaseTimelineRecord[]
}
```

说明：
- `Purchase` 保存一次购买中的公共信息
- `Purchase` 不是系统真正的主操作对象
- 多件商品同次购买时，应拆为多条 `OrderLine`
- 单件商品执行字段不得塞回 `Purchase`

---

## 5. OrderLine（商品行）

商品行是系统真正的业务执行对象，不等于产品模板，也不等于购买记录。

一件商品对应一条独立商品行。同一次购买中的多个商品行可以分别推进规格确认、设计、委外、生产、发货和售后。

```ts
type OrderLinePriority = 'normal' | 'high' | 'urgent' | 'vip'

type OrderLineStatus =
  | 'draft'
  | 'pending_confirm'
  | 'pending_measurement'
  | 'pending_design'
  | 'designing'
  | 'pending_outsource'
  | 'in_production'
  | 'pending_factory_feedback'
  | 'pending_shipment'
  | 'shipped'
  | 'after_sales'
  | 'completed'
  | 'cancelled'
  | 'exception'

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

type OrderLineWorkflowDesignStatus =
  | 'not_required'
  | 'pending'
  | 'in_progress'
  | 'revision_requested'
  | 'completed'

type OrderLineWorkflowModelingStatus = OrderLineWorkflowDesignStatus

type OrderLineWorkflowProductionStatus =
  | 'not_started'
  | 'pending_dispatch'
  | 'dispatched'
  | 'in_production'
  | 'completed'
  | 'delayed'
  | 'blocked'

type OrderLineFactoryStatus =
  | 'not_assigned'
  | 'pending_acceptance'
  | 'accepted'
  | 'in_production'
  | 'returned'
  | 'abnormal'

type OrderLineFinanceStatus =
  | 'not_required'
  | 'pending'
  | 'confirmed'
  | 'abnormal'

type OrderLine = {
  id: string
  lineNo?: number
  lineCode?: string
  productionTaskNo?: string
  purchaseId?: string
  customerId?: string
  name: string
  category?: ProductCategory
  styleName?: string
  versionNo?: string
  skuCode?: string
  quantity: number
  lineStatus?: OrderLineLineStatus | string
  designStatus?: OrderLineWorkflowDesignStatus | string
  modelingStatus?: OrderLineWorkflowModelingStatus | string
  productionStatus?: OrderLineWorkflowProductionStatus | string
  factoryStatus?: OrderLineFactoryStatus | string
  financeStatus?: OrderLineFinanceStatus | string
  productionData?: OrderLineProductionData
  assignedDesignerId?: string
  assignedModelerId?: string
  merchandiserId?: string
  factoryId?: string
  productionSentAt?: string
  factoryPlannedDueDate?: string
  productionCompletedAt?: string
  designFiles?: OrderLineUploadedFile[]
  modelingFiles?: OrderLineUploadedFile[]
  waxFiles?: OrderLineUploadedFile[]
  designNote?: string
  modelingNote?: string
  revisionReason?: string
  waxFactorySentAt?: string
  designCompletedAt?: string
  modelingCompletedAt?: string
  status: OrderLineStatus | string
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
  lineSalesAmount?: number
  allocatedDepositAmount?: number
  allocatedFinalPaymentAmount?: number
  materialCost?: number
  mainStoneCost?: number
  sideStoneCost?: number
  laborCost?: number
  extraLaborCost?: number
  logisticsCost?: number
  afterSalesCost?: number
  factorySettlementAmount?: number
  estimatedGrossProfit?: number
  estimatedGrossProfitRate?: number
  financeConfirmedAt?: string
  financeAbnormalReason?: string
  financeNote?: string
  financeLocked?: boolean
  quote?: QuoteResult

  expectedDate?: string
  promisedDate?: string
  finishedAt?: string
}

type OrderLineProductionData = {
  shippedAt?: string
  completedAt?: string
  totalWeight?: number
  netMetalWeight?: number
  actualMaterial?: string
  materialLossNote?: string
  mainStoneType?: string
  mainStoneQuantity?: number
  sideStoneType?: string
  sideStoneCount?: number
  baseLaborCost?: number
  extraLaborCost?: number
  totalLaborCost?: number
  factoryNote?: string
  finishedImageUrls?: string[]
  settlementFileUrls?: string[]
}
```

说明：
- `purchaseId` 是商品行归属购买记录的主要字段
- 如果历史代码里仍有 `transactionId`，只能作为兼容字段理解
- `lineStatus` 是多角色工作流主状态，页面筛选、状态推进和任务分组优先基于它
- `status` 短期保留为兼容展示字段，新增逻辑不要继续扩大它的主流程用途
- 物流、售后、设计、建模、生产、工厂和财务信息都应优先落在 `OrderLine`
- 客服资料完整度至少检查 `productName/name`、`category`、材质、尺寸 / 规格、工艺要求和 `productionTaskNo`
- 客服确认完成后按设计 / 建模需求分流到后续 `lineStatus`
- 生产跟进视图基于 `lineStatus / productionStatus / factoryStatus / factoryPlannedDueDate` 分组，不依赖旧订单模型
- 设计 / 建模工作台基于 `designStatus / modelingStatus / designFiles / modelingFiles / waxFiles` 分组和记录，不展示客户隐私或财务金额
- 工厂协同中心基于 `factoryId / productionStatus / factoryStatus / productionData` 展示和回传，不读取购买记录客户与金额字段
- 财务中心基于 `Purchase.finance` 与 `OrderLine.financeStatus / productionData / factorySettlementAmount` 做尾款、工厂结算和成本确认
- 资料完整性、生产逾期、工厂回传异常、财务异常和角色待办徽标统一通过 `orderLineRiskSelectors` 读取 `OrderLine` 与关联记录计算，页面不要重复散落规则

---

## 6. Product（产品模板）

```ts
type ProductStatus = 'draft' | 'enabled' | 'disabled'

type ProductCategory =
  | 'ring'
  | 'pendant'
  | 'necklace'
  | 'earring'
  | 'bracelet'
  | 'other'

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
}
```

说明：
- `Product` 是产品模板
- 商品行引用产品时保留来源快照
- 商品行的实际需求可以在模板基础上调整

---

## 7. InventoryItem（仓库商品 / 库存资产）

```ts
type InventoryItemSourceType =
  | 'design_sample'
  | 'customer_return'
  | 'stock_purchase'
  | 'consignment'
  | 'other'

type InventoryItemStatus = 'in_stock' | 'reserved' | 'outbound' | 'scrapped'

type InventoryItemCondition =
  | 'new'
  | 'sample'
  | 'returned'
  | 'repair_needed'
  | 'defective'

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
  ownerDepartment: 'design' | 'customer_service' | 'warehouse' | 'factory' | 'other'
  condition: InventoryItemCondition
  status: InventoryItemStatus
  receivedAt: string
  keeperName: string
  remark?: string
}
```

说明：
- `InventoryItem` 是库管库存资产台账，不是产品模板，也不是商品行执行对象
- 设计部门生产出来但不售卖的款式可以作为 `design_sample` 入库
- 客户退货可以作为 `customer_return` 入库，并关联原 `purchaseId / orderLineId / customerId`
- 常备采购、寄售或其他库存可以不关联商品行，但仍保持独立库存编号
- 库存记录不推进 `OrderLine.lineStatus`、生产状态、财务状态或售后状态

---

## 8. ProductSpecRow（产品规格明细）

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

---

## 9. ProductPriceRule（固定加价规则）

```ts
type ProductPriceRuleType = 'material' | 'process' | 'special' | 'other'

type ProductPriceRule = {
  id: string
  productId: string
  type: ProductPriceRuleType
  ruleKey: string
  delta: number
  enabled: boolean
  note?: string
}
```

---

## 10. ProductSnapshot（来源产品快照）

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

说明：
- 用于商品行与来源产品模板的关系显示和核对
- 首轮保留最关键的来源关系信息
- 不把 `Product` 本体直接复制为商品行执行对象

---

## 11. QuoteResult（系统参考报价）

```ts
type QuoteResult = {
  basePrice?: number
  priceAdjustments: Array<{
    type: 'material' | 'process' | 'special' | 'other'
    ruleKey: string
    delta: number
  }>
  systemQuote?: number
  status: 'idle' | 'waiting_spec' | 'ready' | 'warning'
  warnings: QuoteWarning[]
}
```

首轮固定计算公式：

```text
系统参考报价 = 规格基础价 + 所有生效固定加价之和
```

---

## 12. LogisticsRecord（物流记录）

```ts
type LogisticsRecord = {
  id: string
  orderLineId: string
  purchaseId?: string
  recordStatus?: 'active' | 'voided'
  logisticsType?: 'measurement_tool' | 'goods' | 'after_sales' | 'other'
  direction?: 'outbound' | 'return'
  company?: string
  carrier?: string
  trackingNo?: string
  shippedAt?: string
  signedAt?: string
  deliveredAt?: string
  voidedAt?: string
  voidReason?: string
  remark?: string
}
```

说明：
- `orderLineId` 必填
- `purchaseId` 只用于归组查询
- 不默认把物流挂在整笔购买上

---

## 13. AfterSalesCase（售后记录）

```ts
type AfterSalesCase = {
  id: string
  orderLineId: string
  purchaseId?: string
  customerId?: string
  type?: 'resize' | 'repair' | 'repolish' | 'remake' | 'resend' | 'refund' | 'exchange' | 'other'
  reason?: string
  status?: 'open' | 'processing' | 'waiting_return' | 'resolved' | 'closed' | 'in_progress'
  responsibleParty?: string
  createdAt?: string
  closedAt?: string
  remark?: string
}
```

说明：
- `orderLineId` 必填
- 支持同一次购买中的单件商品独立进入售后

---

## 13. 当前 mock 文件建议

```text
src/mocks/
  customers.ts
  purchases.ts
  order-lines.ts
  products.ts
  supporting-records.ts
  transactions.ts # Purchase mock 的历史兼容别名
```

说明：
- `purchases.ts` 是当前购买记录 mock 主线
- `order-lines.ts` 是当前商品行 mock 主线
- `transactions.ts` 只能作为 `Purchase` 的历史兼容导出
- legacy `orders.ts` 已删除，不再作为 mock 入口

---

## 14. 历史兼容命名

当前不再把 `TransactionRecord` 作为主模型。

允许保留的兼容关系：
- `TransactionRecord` = `Purchase` 的历史兼容别名
- `SourceProductSnapshot` = `ProductSnapshot` 的历史兼容命名

---

## 15. 必须覆盖的 mock 场景

### 场景 1：同一次购买，多件商品，多条商品行
- 购买记录 1 条
- 商品行多条
- 商品行中心显示多行
- 购买记录详情页显示本次购买下的所有商品行

### 场景 2：戒指自动带价
- 选择规格
- 自动带出规格参数
- 自动带出基础价格
- 叠加材质 / 工艺 / 特殊需求固定加价
- 生成系统参考报价

### 场景 3：吊坠自动带价
- 选择规格
- 自动带出规格参数
- 自动带出基础价格
- 叠加工艺 / 特殊需求固定加价
- 生成系统参考报价

### 场景 4：同一次购买中多件商品分开发货
- 一件商品先发
- 另一件商品后发

### 场景 5：同一次购买中只有一件商品进入售后
- 一件商品进入售后
- 其他商品正常完成

---

## 16. 验收标准

- mock 能表达 `Customer -> Purchase -> OrderLine`
- `Purchase` 不承载单件商品执行字段
- `OrderLine` 能承载来源产品、规格、报价、设计、委外、生产、物流、售后关联
- `LogisticsRecord` 和 `AfterSalesCase` 默认关联 `orderLineId`
- `TransactionRecord` 只作为兼容别名出现
- legacy `orders.ts` 不再作为 runtime mock 保留
