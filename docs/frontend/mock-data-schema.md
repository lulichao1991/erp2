~~~md
# 首轮前端 Mock 数据结构草案（订单中心 + 产品管理）

## 1. 文档目标
本文件用于统一首轮前端 mock 数据结构，避免 AI / 前端在开发过程中随意发明字段名、对象关系和计算结果结构。

当前 mock 数据结构必须服务于以下首轮主链路：

**产品维护（含规格明细与固定加价规则）  
→ 订单引用产品  
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

- `Product`
- `ProductSpecRow`
- `ProductPriceRule`
- `Order`
- `OrderItem`
- `SourceProductSnapshot`
- `QuoteResult`

不要把产品模板和订单商品混成一个对象。

---

## 3. Product（产品模板）

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
~~~

------

## 4. ProductSpecRow（产品规格明细）

一个产品可以有多条规格行。

适用示例：

### 戒指

- 10号
- 12号
- 16号

### 吊坠

- 小号
- 中号
- 大号

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

## 5. ProductSizeField（规格参数字段）

为了兼容不同品类，首轮建议规格参数统一用数组表达，而不是每种品类单独换 schema。

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

## 6. ProductPriceRule（固定加价规则）

首轮只支持固定加价规则。

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

### 示例

```ts
[
  { id: 'pr-1', productId: 'p-ring-1', type: 'material', ruleKey: '18K金', delta: 300, enabled: true },
  { id: 'pr-2', productId: 'p-ring-1', type: 'process', ruleKey: '微镶', delta: 200, enabled: true },
  { id: 'pr-3', productId: 'p-ring-1', type: 'special', ruleKey: '刻字', delta: 50, enabled: true }
]
```

------

## 7. ProductCustomRules（产品定制规则）

用于产品详情页和来源产品详情抽屉中展示“模板规则”。

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

## 8. ProductProductionReference（产品生产参考）

用于产品详情页和来源产品抽屉展示。

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

## 9. ProductAssets（产品文件与图片）

首轮只做展示结构，不强调上传能力。

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

## 10. Order（订单）

```ts
type Order = {
  id: string
  orderNo: string
  platformOrderNo?: string

  customerName?: string
  customerPhone?: string

  status: string
  riskTags: string[]

  promisedDate?: string
  expectedDate?: string

  items: OrderItem[]
}
```

------

## 11. OrderItem（订单商品）

订单商品是业务实例，不等于产品模板。

```ts
type OrderItem = {
  id: string
  name: string
  quantity: number
  status: string

  isReferencedProduct: boolean

  sourceProduct?: SourceProductSnapshot

  selectedSpecValue?: string
  selectedSpecSnapshot?: ProductSpecRow

  selectedMaterial?: string
  selectedProcess?: string
  selectedSpecialOptions?: string[]

  actualRequirements?: OrderItemActualRequirements

  quote?: QuoteResult
}
```

------

## 12. OrderItemActualRequirements（订单实际需求）

订单商品可以在模板基础上继续改。

```ts
type OrderItemActualRequirements = {
  material?: string
  process?: string
  sizeNote?: string
  engraveText?: string
  specialNotes?: string[]
  remark?: string
}
```

------

## 13. SourceProductSnapshot（来源产品快照）

用于订单商品与来源产品的关系显示和核对。

```ts
type SourceProductSnapshot = {
  sourceProductId: string
  sourceProductCode: string
  sourceProductName: string
  sourceProductVersion: string

  sourceSpecValue?: string
}
```

### 说明

首轮先保留最关键的来源关系信息。
后续如果需要，可以扩展更多快照内容。

------

## 14. QuoteResult（报价结果）

首轮系统报价结果统一用这个对象表达。

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

## 15. 自动报价计算规则

首轮固定使用下面这条规则：

**系统参考报价 = 规格基础价 + 所有生效固定加价之和**

### 15.1 规格基础价来源

- 当前选中的 `selectedSpecSnapshot.basePrice`

### 15.2 附加价来源

根据当前订单商品已选项匹配产品规则：

- `selectedMaterial`
- `selectedProcess`
- `selectedSpecialOptions`

与 `ProductPriceRule` 匹配。

### 15.3 警告场景

首轮至少支持这几种 warning：

#### 未选规格

- `waiting_spec`

#### 当前规格没有基础价格

- `missing_base_price`

#### 当前附加项没有对应价格规则

- `missing_rule`

------

## 16. 戒指 mock 示例

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

## 17. 吊坠 mock 示例

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

## 18. 订单商品 mock 示例

### 18.1 戒指订单商品

```ts
const ringOrderItem: OrderItem = {
  id: 'oi-001',
  name: '山形素圈戒指',
  quantity: 1,
  status: 'draft',
  isReferencedProduct: true,

  sourceProduct: {
    sourceProductId: 'p-ring-001',
    sourceProductCode: 'PD-RING-001',
    sourceProductName: '山形素圈戒指',
    sourceProductVersion: 'v3'
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
  }
}
```

### 18.2 吊坠订单商品

```ts
const pendantOrderItem: OrderItem = {
  id: 'oi-002',
  name: '山形吊坠',
  quantity: 1,
  status: 'draft',
  isReferencedProduct: true,

  sourceProduct: {
    sourceProductId: 'p-pendant-001',
    sourceProductCode: 'PD-PENDANT-001',
    sourceProductName: '山形吊坠',
    sourceProductVersion: 'v2'
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
  }
}
```

------

## 19. 订单 mock 示例

```ts
const orderMock: Order = {
  id: 'o-001',
  orderNo: 'CO-20260421-00128',
  platformOrderNo: 'TB-8899112233',
  customerName: '张三',
  customerPhone: '13800000000',
  status: '待下厂',
  riskTags: ['交期紧'],
  promisedDate: '2026-04-30',
  expectedDate: '2026-04-28',
  items: [ringOrderItem, pendantOrderItem]
}
```

------

## 20. 推荐 mock 数据文件组织方式

建议前端先按下面方式组织：

```text
src/
  mocks/
    products.ts
    orders.ts
    quotes.ts
    index.ts
```

### products.ts

放：

- `Product`
- `ProductSpecRow`
- `ProductPriceRule`
- 戒指 / 吊坠样例

### orders.ts

放：

- `Order`
- `OrderItem`
- `SourceProductSnapshot`
- 订单样例

### quotes.ts

放：

- 自动报价计算 mock 函数
- `QuoteResult`

------

## 21. 自动报价前端 mock 计算建议

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

## 22. 首轮必须跑通的 mock 场景

### 戒指场景

- 来源产品：山形素圈戒指
- 选规格：16号
- 选材质：18K金
- 选工艺：微镶
- 选特殊需求：刻字

结果：

- 自动带出规格参数
- 自动带出基础价格 1450
- 自动算出系统参考报价 2000

------

### 吊坠场景

- 来源产品：山形吊坠
- 选规格：小号
- 选工艺：珐琅
- 选特殊需求：加急

结果：

- 自动带出规格参数
- 自动带出基础价格 980
- 自动算出系统参考报价 1280

------

## 23. 首轮 warning 示例

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

## 24. 首轮验收标准

### 24.1 字段结构稳定

前端不再边写边发明字段名。

### 24.2 两条样例能直接驱动 UI

- 戒指
- 吊坠

### 24.3 能支撑以下页面

- 产品列表页
- 产品详情页
- 产品编辑页
- 订单详情页
- 产品引用选择器
- 来源产品详情抽屉

### 24.4 能支撑规格与报价主链路

- 引用产品
- 选规格
- 自动带参数
- 自动带价
- 显示 warning

