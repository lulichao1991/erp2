~~~md
# 首轮前端 Mock 数据结构草案（商品任务中心 + 产品管理）

## 1. 文档目标
本文件用于统一首轮前端 mock 数据结构，避免 AI / 前端在开发过程中随意发明字段名、对象关系和计算结果结构。

当前 mock 数据结构必须服务于以下首轮主链路：

**产品维护（含规格明细与固定加价规则）  
→ 商品任务引用产品  
→ 选择规格  
→ 自动带出规格参数  
→ 自动带出基础价格  
→ 叠加固定加价规则  
→ 生成系统参考报价**

---

## 2. 使用原则

### 2.1 当前只服务前端联调
首轮 mock 数据只用于：
- 页面展示
- 页面跳转
- 组件联调
- 自动报价前端逻辑演示

不要求完全等同后端数据库设计。

---

### 2.2 字段语义必须稳定
以下字段的语义首轮禁止随意改动：

- `transactionNo`
- `lineCode`
- `sourceProductId`
- `sourceProductVersion`
- `selectedSpecValue`
- `selectedSpecSnapshot`
- `basePrice`
- `priceAdjustments`
- `systemQuote`

如果一定要改，必须同步更新：
- 相关页面
- 相关组件
- 相关 mock 数据
- 相关文档

---

### 2.3 对象关系必须明确
首轮至少要分清这些对象：

- `Customer`
- `TransactionRecord`
- `OrderLine`
- `Product`
- `ProductSpecRow`
- `ProductPriceRule`
- `ProductSnapshot`
- `LogisticsRecord`
- `AfterSalesCase`
- `QuoteResult`

不要把产品模板、交易公共信息和单件商品任务混成一个对象。

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
~~~

说明：

- 客户是长期沉淀对象
- 首轮前端可以先只做轻量 mock，不要求立刻有完整客户中心页面

------

## 4. TransactionRecord（交易记录）

```ts
type TransactionOrderType =
  | 'semi_custom'
  | 'full_custom'
  | 'spot_goods'
  | 'internal'

type TransactionSourceChannel =
  | 'taobao'
  | 'tmall'
  | 'xiaohongshu'
  | 'wechat'
  | 'offline'
  | 'other'

type TransactionAggregateStatus =
  | 'draft'
  | 'in_progress'
  | 'partially_shipped'
  | 'completed'
  | 'after_sales'
  | 'exception'
  | 'cancelled'

type TransactionRecord = {
  id: string

  transactionNo: string
  platformOrderNo?: string

  sourceChannel: TransactionSourceChannel
  shopName?: string

  customerId?: string

  orderType: TransactionOrderType
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
   * 仅用于整单聚合展示，不作为主流程驱动状态
   */
  aggregateStatus: TransactionAggregateStatus

  /**
   * 冗余字段，便于列表页直接显示
   */
  orderLineCount: number
}
```

说明：

- 交易记录保存一次购买中的公共信息
- 交易记录不是系统真正的主操作对象
- 多件商品同单购买时，应拆为多条 `OrderLine`

------

## 5. Product（产品模板）

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

------

## 6. ProductSpecRow（产品规格明细）

```ts
type ProductSpecRowStatus = 'enabled' | 'disabled'

type ProductSpecRow = {
  id: string
  productId: string

  specValue: string
  sortOrder: number
  status: ProductSpecRowStatus

  basePrice: number
  referenceWeight?: number
  note?: string

  sizeFields: ProductSizeField[]
}
```

------

## 7. ProductSizeField（规格参数字段）

```ts
type ProductSizeField = {
  key: string
  label: string
  value: string
  unit?: string
}
```

### 戒指示例

```ts
[
  { key: 'faceWidth', label: '面宽', value: '3.8', unit: 'mm' },
  { key: 'bottomWidth', label: '底宽', value: '2.4', unit: 'mm' },
  { key: 'faceThickness', label: '面厚', value: '1.9', unit: 'mm' },
  { key: 'bottomThickness', label: '底厚', value: '1.5', unit: 'mm' }
]
```

### 吊坠示例

```ts
[
  { key: 'length', label: '长', value: '16', unit: 'mm' },
  { key: 'width', label: '宽', value: '8', unit: 'mm' },
  { key: 'thickness', label: '厚', value: '2.2', unit: 'mm' }
]
```

------

## 8. ProductPriceRule（固定加价规则）

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

------

## 9. ProductCustomRules（产品定制规则）

```ts
type ProductCustomRules = {
  canResize?: boolean
  canChangeMaterial?: boolean
  canEngrave?: boolean
  canChangeProcess?: boolean
  canRevise?: boolean
  requiresRemodeling?: boolean
  requiresMeasureTool?: boolean
}
```

------

## 10. ProductProductionReference（产品生产参考）

```ts
type ProductProductionReference = {
  standardMaterial?: string
  defaultLeadTimeDays?: number
  suggestedLeadTimeDays?: number
  referenceLaborCost?: number
  productionNotes?: string[]
}
```

------

## 11. ProductAssets（产品文件与图片）

```ts
type ProductAssetFile = {
  id: string
  name: string
  type: 'model' | 'craft' | 'size' | 'other'
  version?: string
  url: string
}

type ProductAssets = {
  detailImages: string[]
  modelFiles: ProductAssetFile[]
  craftFiles: ProductAssetFile[]
  sizeFiles: ProductAssetFile[]
  otherFiles: ProductAssetFile[]
}
```

------

## 12. ProductSnapshot（来源产品快照）

```ts
type ProductSnapshot = {
  sourceProductId: string
  sourceProductCode: string
  sourceProductName: string
  sourceProductVersion: string

  category?: string
  sourceSpecValue?: string

  defaultMaterial?: string
  defaultProcess?: string

  snapshotAt: string
}
```

说明：

- 用于商品任务与来源产品模板的关系显示和核对
- 首轮先保留最关键的来源关系信息
- 后续如果需要，可扩展更多快照内容

------

## 13. OrderLine（商品任务）

商品任务是系统真正的业务执行对象，不等于产品模板，也不等于交易记录。

一件商品对应一条独立商品任务。
同一次交易中的多个商品任务可以分别推进规格确认、设计、委外、生产、发货和售后。

```ts
type OrderLinePriority = 'normal' | 'urgent' | 'vip'

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

type OrderLine = {
  id: string
  lineNo: number
  lineCode: string

  transactionId: string
  customerId?: string

  name: string
  category?: 'ring' | 'pendant' | 'necklace' | 'earring' | 'bracelet' | 'other'
  quantity: number

  status: OrderLineStatus
  currentOwner?: string
  priority?: OrderLinePriority

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

  quote?: QuoteResult

  expectedDate?: string
  promisedDate?: string
  finishedAt?: string
}
```

------

## 14. OrderLineActualRequirements（商品任务实际需求）

```ts
type OrderLineActualRequirements = {
  material?: string
  process?: string
  sizeNote?: string
  engraveText?: string
  specialNotes?: string[]
  remark?: string
}
```

说明：

- 商品任务可以在来源模板基础上继续改
- 这一层记录的是“这次实际做什么”，不是模板默认值

------

## 15. OrderLineDesignInfo（设计建模信息）

```ts
type OrderLineDesignStatus =
  | 'not_required'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'rework'

type OrderLineDesignInfo = {
  designStatus?: OrderLineDesignStatus
  assignedDesigner?: string
  requiresRemodeling?: boolean
  designDeadline?: string
  designNote?: string

  modelingFileUrl?: string
  waxFileUrl?: string
  waxFileSentAt?: string
}
```

------

## 16. OrderLineOutsourceInfo（委外 / 跟单信息）

```ts
type OrderLineOutsourceStatus =
  | 'not_started'
  | 'ordered'
  | 'in_progress'
  | 'delivered'
  | 'delayed'
  | 'cancelled'

type OrderLineOutsourceInfo = {
  outsourceStatus?: OrderLineOutsourceStatus
  supplierName?: string
  plannedDeliveryDate?: string
  outsourceNote?: string

  placedAt?: string
  factoryName?: string
  factorySku?: string
}
```

------

## 17. OrderLineProductionInfo（工厂回传 / 生产信息）

```ts
type OrderLineProductionStatus =
  | 'pending'
  | 'in_production'
  | 'quality_check'
  | 'completed'
  | 'shipped'
  | 'exception'

type StoneDetail = {
  stoneType?: string
  quantity?: number
  totalWeight?: string
  unitPrice?: number
  totalAmount?: number
  unit?: string
}

type LaborDetail = {
  name: string
  amount: number
  note?: string
}

type OrderLineProductionInfo = {
  factoryStatus?: OrderLineProductionStatus

  actualMaterial?: string
  grossWeight?: string
  netWeight?: string

  mainStone?: StoneDetail
  sideStone?: StoneDetail

  laborDetails?: LaborDetail[]

  shippedAt?: string
  qualityResult?: string
  factoryNote?: string
}
```

------

## 18. LogisticsRecord（物流记录）

```ts
type LogisticsType =
  | 'measurement_tool'
  | 'goods'
  | 'after_sales'
  | 'other'

type LogisticsDirection = 'outbound' | 'return'

type LogisticsRecord = {
  id: string

  transactionId: string
  orderLineId: string

  logisticsType: LogisticsType
  direction: LogisticsDirection

  company?: string
  trackingNo?: string

  shippedAt?: string
  signedAt?: string
  remark?: string
}
```

说明：

- 物流记录默认关联商品任务
- 交易记录页只做汇总展示与统一入口
- 支持同一交易中的多个商品任务分开发货

------

## 19. AfterSalesCase（售后记录）

```ts
type AfterSalesType =
  | 'resize'
  | 'repair'
  | 'repolish'
  | 'remake'
  | 'resend'
  | 'other'

type AfterSalesStatus =
  | 'open'
  | 'processing'
  | 'waiting_return'
  | 'resolved'
  | 'closed'

type AfterSalesCase = {
  id: string

  transactionId: string
  orderLineId: string
  customerId?: string

  type: AfterSalesType
  reason: string
  status: AfterSalesStatus

  responsibleParty?: string
  createdAt: string
  closedAt?: string
  remark?: string
}
```

说明：

- 售后记录默认关联商品任务
- 支持同一交易中的单件商品独立进入售后

------

## 20. QuoteResult（报价结果）

```ts
type QuoteWarningCode =
  | 'waiting_spec'
  | 'missing_base_price'
  | 'missing_rule'

type QuoteWarning = {
  code: QuoteWarningCode
  message: string
}

type PriceAdjustment = {
  type: 'material' | 'process' | 'special' | 'other'
  ruleKey: string
  delta: number
}

type QuoteResult = {
  basePrice?: number
  priceAdjustments: PriceAdjustment[]
  systemQuote?: number

  status: 'idle' | 'waiting_spec' | 'calculating' | 'ready' | 'warning' | 'conflict'
  warnings: QuoteWarning[]
}
```

------

## 21. 自动报价计算规则

首轮固定使用下面这条规则：

**系统参考报价 = 规格基础价 + 所有生效固定加价之和**

### 21.1 规格基础价来源

- 当前选中的 `selectedSpecSnapshot.basePrice`

### 21.2 附加价来源

根据当前商品任务已选项匹配产品规则：

- `selectedMaterial`
- `selectedProcess`
- `selectedSpecialOptions`

与 `ProductPriceRule` 匹配。

### 21.3 警告场景

首轮至少支持这几种 warning：

#### 未选规格

- `waiting_spec`

#### 当前规格没有基础价格

- `missing_base_price`

#### 当前附加项没有对应价格规则

- `missing_rule`

------

## 22. 戒指 mock 示例

```ts
const ringProduct: Product = {
  id: 'p-ring-001',
  code: 'PD-RING-001',
  name: '山形素圈戒指',
  shortName: '山形戒指',
  category: 'ring',
  series: '山形系列',
  styleTags: ['极简', '山形'],
  sceneTags: ['日常佩戴'],

  status: 'enabled',
  isReferable: true,
  version: 'v3',

  coverImage: '/mock/products/ring-cover.jpg',
  galleryImages: ['/mock/products/ring-cover.jpg', '/mock/products/ring-detail-1.jpg'],

  supportedMaterials: ['足金', '18K金'],
  defaultMaterial: '足金',

  supportedProcesses: ['亮面', '微镶'],
  defaultProcess: '亮面',

  supportedSpecialOptions: ['刻字', '加急'],

  specMode: 'single_axis',
  specName: '圈号',
  specDisplayType: 'tags',
  isSpecRequired: true,

  specs: [
    {
      id: 'spec-ring-10',
      productId: 'p-ring-001',
      specValue: '10号',
      sortOrder: 1,
      status: 'enabled',
      basePrice: 1280,
      referenceWeight: 4.8,
      sizeFields: [
        { key: 'faceWidth', label: '面宽', value: '3.2', unit: 'mm' },
        { key: 'bottomWidth', label: '底宽', value: '2.1', unit: 'mm' },
        { key: 'faceThickness', label: '面厚', value: '1.6', unit: 'mm' },
        { key: 'bottomThickness', label: '底厚', value: '1.3', unit: 'mm' }
      ]
    },
    {
      id: 'spec-ring-16',
      productId: 'p-ring-001',
      specValue: '16号',
      sortOrder: 2,
      status: 'enabled',
      basePrice: 1450,
      referenceWeight: 5.6,
      sizeFields: [
        { key: 'faceWidth', label: '面宽', value: '3.8', unit: 'mm' },
        { key: 'bottomWidth', label: '底宽', value: '2.4', unit: 'mm' },
        { key: 'faceThickness', label: '面厚', value: '1.9', unit: 'mm' },
        { key: 'bottomThickness', label: '底厚', value: '1.5', unit: 'mm' }
      ]
    }
  ],

  priceRules: [
    { id: 'rule-ring-material-18k', productId: 'p-ring-001', type: 'material', ruleKey: '18K金', delta: 300, enabled: true },
    { id: 'rule-ring-process-micro', productId: 'p-ring-001', type: 'process', ruleKey: '微镶', delta: 200, enabled: true },
    { id: 'rule-ring-special-engrave', productId: 'p-ring-001', type: 'special', ruleKey: '刻字', delta: 50, enabled: true }
  ],

  customRules: {
    canResize: true,
    canChangeMaterial: true,
    canEngrave: true,
    canChangeProcess: true,
    canRevise: false,
    requiresRemodeling: false,
    requiresMeasureTool: false
  },

  productionReference: {
    standardMaterial: '足金',
    defaultLeadTimeDays: 7,
    suggestedLeadTimeDays: 10,
    referenceLaborCost: 200,
    productionNotes: ['标准素圈工艺']
  },

  assets: {
    detailImages: ['/mock/products/ring-detail-1.jpg'],
    modelFiles: [],
    craftFiles: [],
    sizeFiles: [],
    otherFiles: []
  }
}
```

------

## 23. 吊坠 mock 示例

```ts
const pendantProduct: Product = {
  id: 'p-pendant-001',
  code: 'PD-PENDANT-001',
  name: '山形吊坠',
  shortName: '山形吊坠',
  category: 'pendant',
  series: '山形系列',
  styleTags: ['极简', '山形'],
  sceneTags: ['日常佩戴'],

  status: 'enabled',
  isReferable: true,
  version: 'v2',

  coverImage: '/mock/products/pendant-cover.jpg',
  galleryImages: ['/mock/products/pendant-cover.jpg'],

  supportedMaterials: ['足金'],
  defaultMaterial: '足金',

  supportedProcesses: ['亮面', '珐琅'],
  defaultProcess: '亮面',

  supportedSpecialOptions: ['加急'],

  specMode: 'single_axis',
  specName: '档位',
  specDisplayType: 'tags',
  isSpecRequired: true,

  specs: [
    {
      id: 'spec-pendant-s',
      productId: 'p-pendant-001',
      specValue: '小号',
      sortOrder: 1,
      status: 'enabled',
      basePrice: 980,
      referenceWeight: 2.8,
      sizeFields: [
        { key: 'length', label: '长', value: '16', unit: 'mm' },
        { key: 'width', label: '宽', value: '8', unit: 'mm' },
        { key: 'thickness', label: '厚', value: '2.2', unit: 'mm' }
      ]
    },
    {
      id: 'spec-pendant-m',
      productId: 'p-pendant-001',
      specValue: '中号',
      sortOrder: 2,
      status: 'enabled',
      basePrice: 1180,
      referenceWeight: 3.6,
      sizeFields: [
        { key: 'length', label: '长', value: '20', unit: 'mm' },
        { key: 'width', label: '宽', value: '10', unit: 'mm' },
        { key: 'thickness', label: '厚', value: '2.5', unit: 'mm' }
      ]
    }
  ],

  priceRules: [
    { id: 'rule-pendant-process-enamel', productId: 'p-pendant-001', type: 'process', ruleKey: '珐琅', delta: 200, enabled: true },
    { id: 'rule-pendant-special-urgent', productId: 'p-pendant-001', type: 'special', ruleKey: '加急', delta: 100, enabled: true }
  ],

  customRules: {
    canResize: false,
    canChangeMaterial: false,
    canEngrave: false,
    canChangeProcess: true,
    canRevise: false,
    requiresRemodeling: false,
    requiresMeasureTool: false
  },

  productionReference: {
    standardMaterial: '足金',
    defaultLeadTimeDays: 5,
    suggestedLeadTimeDays: 7,
    referenceLaborCost: 120,
    productionNotes: ['吊坠常规工艺']
  },

  assets: {
    detailImages: [],
    modelFiles: [],
    craftFiles: [],
    sizeFiles: [],
    otherFiles: []
  }
}
```

------

## 24. 客户 mock 示例

```ts
const customerMock: Customer = {
  id: 'c-001',
  name: '张三',
  phone: '13800000000',
  wechat: 'zhangsan001',
  defaultRecipientName: '张三',
  defaultRecipientPhone: '13800000000',
  defaultRecipientAddress: '上海市浦东新区...',
  sourceChannels: ['taobao'],
  tags: ['returning'],
  remark: '老客，沟通顺畅',
  firstTransactionAt: '2026-03-01',
  lastTransactionAt: '2026-04-21',
  totalTransactionCount: 2,
  totalOrderLineCount: 3,
  totalAfterSalesCount: 0
}
```

------

## 25. 交易记录 mock 示例

```ts
const transactionMock: TransactionRecord = {
  id: 't-001',
  transactionNo: 'TRX-20260421-00128',
  platformOrderNo: 'TB-8899112233',
  sourceChannel: 'taobao',
  shopName: '淘宝旗舰店',
  customerId: 'c-001',
  orderType: 'semi_custom',
  ownerName: '客服A',
  recipientName: '张三',
  recipientPhone: '13800000000',
  recipientAddress: '上海市浦东新区...',
  paymentAt: '2026-04-21',
  expectedDate: '2026-04-28',
  promisedDate: '2026-04-30',
  riskTags: ['交期紧'],
  remark: '客户希望尽快',
  aggregateStatus: 'in_progress',
  orderLineCount: 2
}
```

------

## 26. 商品任务 mock 示例

### 26.1 戒指商品任务

```ts
const ringOrderLine: OrderLine = {
  id: 'ol-001',
  lineNo: 1,
  lineCode: 'TRX-20260421-00128-01',
  transactionId: 't-001',
  customerId: 'c-001',
  name: '山形素圈戒指',
  category: 'ring',
  quantity: 1,
  status: 'in_production',
  currentOwner: '跟单A',
  priority: 'normal',
  isReferencedProduct: true,
  productId: 'p-ring-001',

  sourceProduct: {
    sourceProductId: 'p-ring-001',
    sourceProductCode: 'PD-RING-001',
    sourceProductName: '山形素圈戒指',
    sourceProductVersion: 'v3',
    category: 'ring',
    sourceSpecValue: '16号',
    defaultMaterial: '足金',
    defaultProcess: '亮面',
    snapshotAt: '2026-04-21T10:30:00+08:00'
  },

  selectedSpecValue: '16号',
  selectedSpecSnapshot: ringProduct.specs[1],

  selectedMaterial: '18K金',
  selectedProcess: '微镶',
  selectedSpecialOptions: ['刻字'],

  actualRequirements: {
    material: '18K金',
    process: '微镶',
    engraveText: 'A',
    specialNotes: ['刻字'],
    remark: '客户要求精细一些'
  },

  designInfo: {
    designStatus: 'completed',
    assignedDesigner: '设计A',
    requiresRemodeling: false,
    designDeadline: '2026-04-22'
  },

  outsourceInfo: {
    outsourceStatus: 'in_progress',
    supplierName: '工厂A',
    plannedDeliveryDate: '2026-04-27',
    factoryName: '工厂A',
    factorySku: 'SKU-RING-001',
    placedAt: '2026-04-22'
  },

  productionInfo: {
    factoryStatus: 'in_production',
    actualMaterial: '18K金',
    factoryNote: '正在生产中'
  },

  quote: {
    basePrice: 1450,
    priceAdjustments: [
      { type: 'material', ruleKey: '18K金', delta: 300 },
      { type: 'process', ruleKey: '微镶', delta: 200 },
      { type: 'special', ruleKey: '刻字', delta: 50 }
    ],
    systemQuote: 2000,
    status: 'ready',
    warnings: []
  },

  expectedDate: '2026-04-28',
  promisedDate: '2026-04-30'
}
```

### 26.2 吊坠商品任务

```ts
const pendantOrderLine: OrderLine = {
  id: 'ol-002',
  lineNo: 2,
  lineCode: 'TRX-20260421-00128-02',
  transactionId: 't-001',
  customerId: 'c-001',
  name: '山形吊坠',
  category: 'pendant',
  quantity: 1,
  status: 'pending_outsource',
  currentOwner: '跟单A',
  priority: 'urgent',
  isReferencedProduct: true,
  productId: 'p-pendant-001',

  sourceProduct: {
    sourceProductId: 'p-pendant-001',
    sourceProductCode: 'PD-PENDANT-001',
    sourceProductName: '山形吊坠',
    sourceProductVersion: 'v2',
    category: 'pendant',
    sourceSpecValue: '小号',
    defaultMaterial: '足金',
    defaultProcess: '亮面',
    snapshotAt: '2026-04-21T10:35:00+08:00'
  },

  selectedSpecValue: '小号',
  selectedSpecSnapshot: pendantProduct.specs[0],

  selectedMaterial: '足金',
  selectedProcess: '珐琅',
  selectedSpecialOptions: ['加急'],

  actualRequirements: {
    material: '足金',
    process: '珐琅',
    specialNotes: ['加急'],
    remark: '尽量提早'
  },

  quote: {
    basePrice: 980,
    priceAdjustments: [
      { type: 'process', ruleKey: '珐琅', delta: 200 },
      { type: 'special', ruleKey: '加急', delta: 100 }
    ],
    systemQuote: 1280,
    status: 'ready',
    warnings: []
  },

  expectedDate: '2026-04-28',
  promisedDate: '2026-04-30'
}
```

------

## 27. 物流 mock 示例

```ts
const logisticsMock: LogisticsRecord = {
  id: 'lg-001',
  transactionId: 't-001',
  orderLineId: 'ol-001',
  logisticsType: 'goods',
  direction: 'outbound',
  company: '顺丰',
  trackingNo: 'SF1234567890',
  shippedAt: '2026-04-29',
  remark: '戒指先发'
}
```

------

## 28. 售后 mock 示例

```ts
const afterSalesMock: AfterSalesCase = {
  id: 'as-001',
  transactionId: 't-001',
  orderLineId: 'ol-001',
  customerId: 'c-001',
  type: 'resize',
  reason: '圈号偏小',
  status: 'processing',
  responsibleParty: '售后A',
  createdAt: '2026-05-03',
  remark: '仅戒指出现售后'
}
```

------

## 29. 推荐 mock 数据文件组织方式

建议前端先按下面方式组织：

```text
src/
  mocks/
    customers.ts
    transactions.ts
    order-lines.ts
    products.ts
    supporting-records.ts
    quotes.ts
    index.ts
```

### customers.ts

放：

- `Customer`
- 客户样例

### transactions.ts

放：

- `TransactionRecord`
- 交易记录样例

### order-lines.ts

放：

- `OrderLine`
- `ProductSnapshot`
- 商品任务样例

### products.ts

放：

- `Product`
- `ProductSpecRow`
- `ProductPriceRule`
- 戒指 / 吊坠样例

### supporting-records.ts

放：

- `LogisticsRecord`
- `AfterSalesCase`

### quotes.ts

放：

- 自动报价计算 mock 函数
- `QuoteResult`

------

## 30. 自动报价前端 mock 计算建议

首轮前端可以直接先写一个本地函数：

```ts
function buildQuoteResult(params: {
  selectedSpec?: ProductSpecRow
  selectedMaterial?: string
  selectedProcess?: string
  selectedSpecialOptions?: string[]
  rules: ProductPriceRule[]
}): QuoteResult
```

### 计算逻辑

1. 如果没有选规格，返回：

- `status = waiting_spec`

1. 如果规格没有基础价格，返回：

- `status = warning`
- warning = `missing_base_price`

1. 从规则里筛出当前生效的：

- 材质规则
- 工艺规则
- 特殊需求规则

1. 汇总成：

- `priceAdjustments`
- `systemQuote`

------

## 31. 首轮必须跑通的 mock 场景

### 场景 A：同一交易，两件商品，两条商品任务

- 交易记录：1 条
- 商品任务：2 条
  - 戒指 1 条
  - 吊坠 1 条

结果：

- 商品任务中心显示 2 行
- 交易记录详情页显示 2 张商品任务卡

### 场景 B：戒指自动带价

- 来源产品：山形素圈戒指
- 选规格：16号
- 选材质：18K金
- 选工艺：微镶
- 选特殊需求：刻字

结果：

- 自动带出规格参数
- 自动带出基础价格 1450
- 自动算出系统参考报价 2000

### 场景 C：吊坠自动带价

- 来源产品：山形吊坠
- 选规格：小号
- 选工艺：珐琅
- 选特殊需求：加急

结果：

- 自动带出规格参数
- 自动带出基础价格 980
- 自动算出系统参考报价 1280

### 场景 D：同一交易中单件商品分开发货

- 戒指先发
- 吊坠后发

结果：

- 物流记录按商品任务维度独立存在
- 交易记录页只做汇总显示

### 场景 E：同一交易中仅一件商品进入售后

- 戒指出现改圈售后
- 吊坠正常完结

结果：

- 售后记录按商品任务维度独立存在
- 不影响另一件商品的完成状态

------

## 32. 首轮 warning 示例

### 未选规格

```ts
{
  basePrice: undefined,
  priceAdjustments: [],
  systemQuote: undefined,
  status: 'waiting_spec',
  warnings: [
    { code: 'waiting_spec', message: '请先选择规格' }
  ]
}
```

### 缺基础价格

```ts
{
  basePrice: undefined,
  priceAdjustments: [],
  systemQuote: undefined,
  status: 'warning',
  warnings: [
    { code: 'missing_base_price', message: '当前规格未配置基础价格' }
  ]
}
```

### 缺规则

```ts
{
  basePrice: 980,
  priceAdjustments: [],
  systemQuote: 980,
  status: 'warning',
  warnings: [
    { code: 'missing_rule', message: '部分附加项未配置价格规则，已按 0 元处理' }
  ]
}
```

------

## 33. 首轮验收标准

### 33.1 字段结构稳定

前端不再边写边发明字段名。

### 33.2 对象层级明确

前端能明确区分：

- 客户
- 交易记录
- 商品任务
- 产品模板

### 33.3 两条样例能直接驱动 UI

- 戒指
- 吊坠

### 33.4 能支撑以下页面

- 商品任务中心
- 新建交易记录页
- 交易记录详情页
- 产品详情页
- 产品编辑页
- 产品引用选择器
- 来源产品详情抽屉

### 33.5 能支撑规格与报价主链路

- 引用产品
- 选规格
- 自动带参数
- 自动带价
- 显示 warning

### 33.6 能支撑“同单多件分开推进”

- 同一交易中的两件商品显示为两条商品任务
- 支持不同状态
- 支持不同物流
- 支持不同售后

```
---

## 这版解决了什么

这版最核心地解决了 4 个问题：

第一，把旧的 `Order / OrderItem` 口径，正式改成了  
**Customer / TransactionRecord / OrderLine**。

第二，把你真实业务里的“同一次购买两件商品，在系统里是两行”落实成了 mock 结构，而不是继续用 `orderMock.items` 的旧思路。你当前旧文档最后还是把两件商品挂在一条 `Order.items` 里。:contentReference[oaicite:2]{index=2}

第三，把物流和售后正式挂到了 `orderLineId` 上，而不是停留在整单占位语义。

第四，让 AI coding 以后再看 mock 文档时，不会继续把“商品任务”误写成“订单里的普通明细”。

到这里，四份关键文档其实已经能统一口径了：

- `README.md`
- `routes-and-pages.md`
- `ui-structure.md`
- `mock-data-schema.md`

下一步最有价值的，是我把这四份文档再整理成一份 **《给 AI coding 的执行版重构清单 v1》**，直接可贴进 Codex/Claude。
```
