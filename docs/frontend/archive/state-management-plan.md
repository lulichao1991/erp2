~~~md
# 前端状态管理方案草案（首轮）

## 1. 文档目标
本文件用于统一首轮前端状态管理思路，明确：

- 哪些状态是页面级
- 哪些状态是组件级
- 哪些状态是业务对象级
- 哪些状态必须可跨组件共享
- 产品引用、来源产品抽屉、规格选择、自动报价这些链路的状态怎么组织

目标是避免首轮开发出现这些问题：

- 状态散在各个组件里，后面难维护
- 商品卡、来源产品抽屉、产品引用选择器彼此不同步
- 报价逻辑写在 UI 里，难以联调
- mock 数据和页面状态混在一起

---

## 2. 首轮状态管理原则

### 2.1 首轮以“轻量本地状态 + 模块级共享状态”为主
首轮不接真实后端，所以状态管理重点是：

- 页面展示状态
- mock 数据读写
- 弹窗 / 抽屉开关
- 订单商品规格与报价联动

不必一开始就做很重的全局状态系统。

---

### 2.2 先分清三类状态
首轮建议把状态分成三层：

#### A. UI 状态
例如：
- 弹窗是否打开
- 抽屉是否打开
- 当前选中哪个产品卡
- 当前展开了哪个商品卡

#### B. 页面业务状态
例如：
- 当前订单数据
- 当前产品数据
- 当前订单商品选择了哪个规格
- 当前系统参考报价结果

#### C. mock 数据源状态
例如：
- 产品列表 mock
- 订单列表 mock
- 产品详情 mock
- 报价规则 mock

---

### 2.3 报价状态必须与 UI 状态分离
这是最重要的一条。

不要把：
- 规格值
- 基础价格
- 加价项
- 系统参考报价
- warning

直接散写在按钮点击逻辑里。

必须把报价结果抽成独立对象。

---

## 3. 首轮推荐状态管理方式

如果项目当前没有固定状态管理库，首轮建议：

### 3.1 页面内部
优先使用：
- `useState`
- `useMemo`
- `useReducer`

### 3.2 模块内共享
可以先使用：
- React Context（轻量）
或
- 项目已有的轻量 store（如果仓库已存在）

### 3.3 首轮不强制
- Redux
- 复杂 domain store
- 事件总线

除非当前项目已经有固定方案，否则首轮不要过度工程化。

---

## 4. 首轮必须统一管理的状态模块

当前首轮真正必须稳定的状态模块有 4 个：

1. 产品引用选择器状态
2. 来源产品详情抽屉状态
3. 订单商品规格选择状态
4. 订单商品自动报价状态

---

# 5. 产品引用选择器状态

## 5.1 状态目标
当用户在订单页里点击“引用产品”时，需要有一套稳定状态来管理：

- 弹窗开关
- 当前是给哪个商品卡引用
- 左侧筛选条件
- 搜索词
- 当前选中的产品
- 右侧预览产品

---

## 5.2 建议状态结构

```ts id="1ysj2x"
type ProductPickerState = {
  open: boolean

  orderId?: string
  orderItemId?: string
  tempItemKey?: string

  keyword: string

  filters: {
    category?: string[]
    series?: string[]
    materials?: string[]
    processes?: string[]
    status?: string[]
    isReferable?: boolean
  }

  selectedProductId?: string
}
~~~

------

## 5.3 行为说明

### 打开弹窗时

需要明确当前上下文：

- 是新建订单页还是订单详情页
- 是哪个商品卡触发的
- 当前商品卡是否已有来源产品

------

### 关闭弹窗时

分两种情况：

#### 取消

- 清理选择器 UI 状态
- 不修改订单商品

#### 确认引用

- 把来源产品信息写入当前商品卡
- 关闭弹窗
- 商品卡进入“已引用产品”状态

------

# 6. 来源产品详情抽屉状态

## 6.1 状态目标

这个抽屉属于订单页上下文能力，必须知道：

- 当前打开的是哪个订单商品
- 对应来源产品是谁
- 当前显示哪个标签页
- 当前显示的是引用时版本还是当前版本（首轮先预留）

------

## 6.2 建议状态结构

```ts
type SourceProductDrawerState = {
  open: boolean

  orderId?: string
  orderItemId?: string

  sourceProductId?: string
  sourceProductVersion?: string

  activeTab: 'detail' | 'compare' | 'assets'
  viewVersionMode: 'referenced' | 'current'
}
```

------

## 6.3 行为说明

### 打开抽屉时

从当前订单商品读取：

- 来源产品 ID
- 来源产品名称
- 来源产品版本

### 默认标签页

建议默认打开：

- `detail`

### 如果用户是为了核对

后续可以从特定按钮默认跳到：

- `compare`

首轮先不强制。

------

# 7. 订单商品规格选择状态

这是首轮最关键的状态之一。

## 7.1 状态目标

对于每个订单商品，需要明确：

- 是否引用了产品
- 当前选中了哪个规格
- 当前规格快照是什么
- 当前规格是否有效
- 当前规格参数摘要是什么

------

## 7.2 建议写在 OrderItem 里

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

## 7.3 为什么规格状态要挂在 OrderItem 上

因为规格不是全局页面状态，而是**每个订单商品自己的业务状态**。

同一张订单里：

- 商品 A 可以选 16号
- 商品 B 可以选 小号
- 商品 C 可以没有规格

所以规格状态必须是商品级。

------

## 7.4 规格切换的行为

当用户切换规格时：

1. 更新 `selectedSpecValue`
2. 更新 `selectedSpecSnapshot`
3. 触发报价重算
4. 刷新商品卡的规格参数摘要
5. 刷新基础价格展示

------

# 8. 订单商品自动报价状态

这是另一个关键状态模块。

## 8.1 状态目标

对于每个订单商品，需要单独保存：

- 当前基础价格
- 当前生效的加价项
- 当前系统参考报价
- 当前报价状态
- 当前 warning

------

## 8.2 建议对象结构

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

  status:
    | 'idle'
    | 'waiting_spec'
    | 'calculating'
    | 'ready'
    | 'warning'
    | 'conflict'

  warnings: QuoteWarning[]
}
```

------

## 8.3 状态语义说明

### `idle`

还没有进入可报价状态。

适用：

- 没有引用产品
- 产品不参与当前链路

------

### `waiting_spec`

产品要求规格必选，但当前未选规格。

------

### `calculating`

正在重新计算报价。

首轮前端即使用同步计算，也建议保留这个状态语义，方便后续接真实接口。

------

### `ready`

系统参考报价已生成。

------

### `warning`

报价可生成，但存在提醒项，例如：

- 某个附加项没有找到规则

------

### `conflict`

首轮可先预留，不必做复杂强拦截。
后续用于表示：

- 参数和模板规则有明显冲突

------

# 9. 自动报价计算流程建议

## 9.1 输入

自动报价函数至少需要这些输入：

```ts
type BuildQuoteInput = {
  selectedSpec?: ProductSpecRow
  selectedMaterial?: string
  selectedProcess?: string
  selectedSpecialOptions?: string[]
  rules: ProductPriceRule[]
}
```

------

## 9.2 输出

输出统一为：

- `QuoteResult`

------

## 9.3 计算步骤

建议固定为：

### 第一步

检查是否已选规格
如果没选，返回：

- `status = waiting_spec`

### 第二步

检查规格是否有基础价格
如果没有，返回：

- `status = warning`
- `missing_base_price`

### 第三步

匹配当前已选项对应的固定加价规则：

- 材质
- 工艺
- 特殊需求

### 第四步

生成 `priceAdjustments`

### 第五步

计算：

- `systemQuote = basePrice + sum(adjustments)`

### 第六步

如果有某个已选项找不到规则：

- 加 warning
- 但仍允许输出报价结果

------

# 10. 商品卡局部 UI 状态

除了业务状态，每个商品卡还会有局部 UI 状态。

## 建议结构

```ts
type OrderItemUiState = {
  expanded: boolean
  editingSection?: 'customer' | 'design' | 'outsource' | 'factory'
}
```

------

## 说明

这些状态只影响当前商品卡的展示，不需要放全局。

例如：

- 某个商品卡是否展开
- 当前正在编辑商品卡哪个区块

------

# 11. 页面级 UI 状态

## 11.1 订单详情页

建议至少管理：

```ts
type OrderDetailUiState = {
  activeLogisticsFilter?: string
  activeAfterSalesFilter?: string
}
```

------

## 11.2 产品详情页

建议至少管理：

```ts
type ProductDetailUiState = {
  activeAnchor?: string
}
```

------

## 11.3 产品编辑页

建议至少管理：

```ts
type ProductEditUiState = {
  activeSection?: string
  hasUnsavedChanges: boolean
}
```

------

# 12. 推荐 hooks 划分

首轮建议至少抽出这些 hooks：

## 12.1 `useProductPicker`

职责：

- 管理产品引用选择器的开关与筛选状态

------

## 12.2 `useSourceProductDrawer`

职责：

- 管理来源产品详情抽屉开关
- 管理当前激活标签页

------

## 12.3 `useOrderQuote`

职责：

- 根据订单商品当前规格与已选项生成 `QuoteResult`

这个 hook 最关键，建议报价逻辑尽量集中在这里，而不是散在多个组件里。

------

## 12.4 `useModalState`

职责：

- 统一 modal 开关逻辑

------

## 12.5 `useDrawerState`

职责：

- 统一 drawer 开关逻辑

------

# 13. 路由状态与本地状态的关系

首轮已经确定订单页里的关键上下文能力会挂在 query 上。

例如：

- `?modal=product-picker`
- `?drawer=source-product`

所以前端要明确：

## 路由层管理什么

- 当前打开的是哪个 modal / drawer
- 当前对应哪个 itemId

## 本地状态管理什么

- 选择器内部筛选条件
- 当前选中产品
- 抽屉内部当前标签页
- 报价计算结果

------

# 14. 推荐的状态归属表

| 状态项                     | 建议归属          |
| -------------------------- | ----------------- |
| 当前订单数据               | 页面业务状态      |
| 当前订单商品列表           | 页面业务状态      |
| 某商品选中的规格           | `OrderItem`       |
| 某商品当前报价结果         | `OrderItem.quote` |
| 产品引用选择器开关         | 页面 / 路由状态   |
| 产品引用选择器筛选条件     | 选择器局部状态    |
| 来源产品抽屉开关           | 页面 / 路由状态   |
| 来源产品抽屉标签页         | 抽屉局部状态      |
| 商品卡展开 / 收起          | 商品卡局部状态    |
| 产品编辑页当前锚点         | 页面局部状态      |
| 产品编辑页是否有未保存修改 | 页面局部状态      |

------

# 15. 首轮建议不要做的状态复杂化

首轮不建议过早做这些：

- 全局订单 store
- 全局产品 store
- 报价缓存池
- 跨页面复杂同步
- 离线草稿缓存
- undo / redo 系统

首轮重点是把主链路做稳，而不是把状态层做成平台。

------

# 16. 首轮验收标准

### 16.1 状态边界清楚

- UI 状态
- 页面状态
- 业务状态
  不要混乱。

### 16.2 自动报价状态稳定

规格切换、附加项变化后，报价能更新且结构一致。

### 16.3 产品引用链路状态稳定

打开选择器、确认引用、查看来源产品，不会出现状态串台。

### 16.4 mock 数据能驱动状态流转

戒指与吊坠两个样例能顺利跑通状态变化。

