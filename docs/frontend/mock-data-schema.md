# Mock 数据结构草案（Purchase + OrderLine）

## 1. 文档目标
本文件用于统一当前前端 mock 数据结构，避免 AI / 前端在开发过程中随意发明字段名、对象关系和计算结果结构。

当前 mock 数据结构服务于以下主链路：

**款式维护（含规格明细与固定加价规则）
-> 销售引用款式
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
- `Task`
- `QuoteResult`

不要把款式模板、购买公共信息和单件商品执行对象混成一个对象。

库存资产也要和款式模板、销售执行对象分开：`InventoryItem` 是库管台账记录，可以关联 Product / Purchase / OrderLine，但不替代它们。

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
  purchaseNo: string // 系统生成的购买记录编号，前端不手动编辑
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

## 5. OrderLine（销售）

销售是系统真正的业务执行对象，不等于款式模板，也不等于购买记录。

一件商品对应一条独立销售。同一次购买中的多个销售可以分别推进规格确认、设计、委外、生产、发货和售后。

```ts
type OrderLinePriority = 'normal' | 'high' | 'urgent' | 'vip'

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
- `purchaseId` 是销售归属购买记录的主要字段
- `transactionId` 已从 current runtime 类型和 mock 中删除；历史资料只可在 archive 文档或 git 历史中查看
- `productionTaskNo` 是当前销售货号，在 `/purchases/new` 自动生成并作为主识别码
- 来源款式编号保存在 `sourceProduct.sourceProductCode` 或销售草稿的 `sourceProductCode` 中，不再保留独立旧 SKU 字段
- `lineSalesAmount` 是销售成交金额
- `quote.systemQuote` 是系统参考报价
- `OrderLine` 货号展示和销售归属购买记录读取集中在 `src/services/orderLine/orderLineIdentity.ts`，页面和 selector 不应继续散落旧字段兜底逻辑
- `Task` 关联购买记录读取集中在 `src/services/task/taskIdentity.ts`，页面和 adapter 不应继续散落购买记录归属读取逻辑
- `lineStatus` 是多角色工作流主状态，页面筛选、状态推进和任务分组优先基于它
- `OrderLine.status` 兼容字段已删除，状态筛选、状态推进和任务分组统一使用 `lineStatus`
- 物流、售后、设计、建模、生产、工厂和财务信息都应优先落在 `OrderLine`
- 客服资料完整度至少检查 `productName/name`、`category`、材质、尺寸 / 规格、工艺要求和 `productionTaskNo`
- 客服确认完成后按设计 / 建模需求分流到后续 `lineStatus`
- 生产跟进视图基于 `lineStatus / productionStatus / factoryStatus / factoryPlannedDueDate` 分组，不依赖旧订单模型
- 设计 / 建模工作台基于 `designStatus / modelingStatus / designFiles / modelingFiles / waxFiles` 分组和记录，不展示客户隐私或财务金额
- 工厂协同中心基于 `factoryId / productionStatus / factoryStatus / productionData` 展示和回传，不读取购买记录客户与金额字段
- 财务中心基于 `Purchase.finance` 与 `OrderLine.financeStatus / productionData / factorySettlementAmount` 做尾款、工厂结算和成本确认
- 资料完整性、生产逾期、工厂回传异常、财务异常和角色待办徽标统一通过 `orderLineRiskSelectors` 读取 `OrderLine` 与关联记录计算，页面不要重复散落规则

---

## 6. Product（款式模板）

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
- `Product` 是款式模板
- 销售引用款式时保留来源快照
- 销售的实际需求可以在模板基础上调整
- `Product.version` 表示款式设计版本，只在款式外观结构、设计稿或设计方案变更时升级；补齐参数、价格规则、生产参考、图片或文件资料不生成新版本
- 不同设计版本保存在同一个 `Product.versionHistory` 中，通过款式编辑页“设计版本”区块创建，不需要新建款式

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

type InventoryMovementType =
  | 'inbound'
  | 'reserve'
  | 'release'
  | 'outbound'
  | 'scrap'
  | 'adjust'

type InventoryMovement = {
  id: string
  inventoryItemId: string
  inventoryCode: string
  type: InventoryMovementType
  quantity: number
  operatorName: string
  occurredAt: string
  fromStatus?: InventoryItemStatus
  toStatus?: InventoryItemStatus
  fromLocation?: string
  toLocation?: string
  relatedOrderLineId?: string
  note?: string
}
```

说明：
- `InventoryItem` 是库管库存资产台账，不是款式模板，也不是销售执行对象
- 设计部门生产出来但不售卖的款式可以作为 `design_sample` 入库
- 客户退货可以作为 `customer_return` 入库，并关联原 `purchaseId / orderLineId / customerId`
- 常备采购、寄售或其他库存可以不关联销售，但仍保持独立库存编号
- 库存记录不推进 `OrderLine.lineStatus`、生产状态、财务状态或售后状态
- 库存流转记录只描述库存资产变化：入库、占用、释放、出库、报废和调整
- 库存盘点通过 `adjust` 流转记录表达账面与实盘差异，只更新库存总数、可用数和库位
- 库存工作台的可领用、已占用、待出库、待盘点、低库存和不可用徽标由 `inventorySelectors` 统一计算

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

## 10. ProductSnapshot（来源款式快照）

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
- 用于销售与来源款式模板的关系显示和核对
- 首轮保留最关键的来源关系信息
- 不把 `Product` 本体直接复制为销售执行对象

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
  trackingNo?: string
  shippedAt?: string
  signedAt?: string
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

## 14. Task（协作任务）

```ts
type TaskType =
  | 'order_process'
  | 'design_modeling'
  | 'production_prep'
  | 'factory_production'
  | 'after_sales'

type TaskStatus = 'todo' | 'in_progress' | 'pending_confirm' | 'done' | 'closed' | 'overdue'

type TaskAssigneeRole =
  | 'customer_service'
  | 'merchandiser'
  | 'designer'
  | 'modeler'
  | 'factory'
  | 'warehouse'
  | 'finance'
  | 'manager'
  | 'admin'

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
  priority: 'normal' | 'high' | 'urgent'
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

说明：
- `Task` 是协作提醒和跟进入口，不是 `OrderLine` 工作流状态本体
- 任务可关联购买记录和单条销售，但任务完成不自动推进 `Purchase.aggregateStatus` 或 `OrderLine.lineStatus`
- `transactionId / transactionNo` 已从 current runtime 类型和 mock 中删除
- 任务关联购买记录读取集中在 `src/services/task/taskIdentity.ts`

---

## 15. 当前 mock 文件建议

```text
src/mocks/
  customers.ts
  inventory.ts
  order-line-logs.ts
  purchases.ts
  order-lines.ts
  products.ts
  supporting-records.ts
  tasks.ts
```

说明：
- `purchases.ts` 是当前购买记录 mock 主线
- `order-lines.ts` 是当前销售 mock 主线
- `tasks.ts` 是协作任务 mock 主线，只作为任务中心和生产计划等入口的数据来源
- `inventory.ts` 是仓库商品 / 库存资产台账 mock 主线
- `order-line-logs.ts` 是销售操作日志 mock
- legacy `orders.ts` 已删除，不再作为 mock 入口

---

## 16. 历史兼容命名

当前不再保留旧交易记录 runtime 兼容别名。

允许保留的兼容关系：
- `SourceProductSnapshot` = `ProductSnapshot` 的历史兼容命名

已清理的报价兼容字段：
- `manualAdjustment`
- `manualAdjustmentReason`
- `finalDisplayQuote`

静态分析说明：
- `knip.json` 已显式保留 `src/types/**` 领域类型导出
- 新增兼容字段时，必须同步说明它对应的 current model 字段

---

## 17. 必须覆盖的 mock 场景

### 场景 1：同一次购买，多件商品，多条销售
- 购买记录 1 条
- 销售多条
- 销售中心显示多行
- 购买记录详情页显示本次购买下的所有销售

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

## 18. 验收标准

- mock 能表达 `Customer -> Purchase -> OrderLine`
- `Purchase` 不承载单件商品执行字段
- `OrderLine` 能承载来源款式、规格、报价、设计、委外、生产、物流、售后关联
- `LogisticsRecord` 和 `AfterSalesCase` 默认关联 `orderLineId`
- `Task` 只作为协作入口，不替代 `OrderLine.lineStatus`
- legacy `orders.ts` 不再作为 runtime mock 保留
