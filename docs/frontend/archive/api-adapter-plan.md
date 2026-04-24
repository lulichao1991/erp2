~~~md
# 前端 API 适配层规划草案（首轮预留版）

## 1. 文档目标
本文件用于提前约束前端未来的接口适配边界。

虽然首轮前端开发**不接真实后端接口**，但仍然需要先把下面几件事约束清楚：

- mock 数据结构尽量不要和未来接口结构完全脱节
- 页面组件不要直接绑死在 mock 文件上
- 自动报价逻辑、产品引用逻辑、来源产品详情逻辑，后续要能平滑切到 API
- 先把“数据入口”和“页面消费层”隔开

这份文档不是让首轮马上实现完整 API 层，  
而是为了避免前端首轮做完后，第二轮一接后端就要整体重写。

---

## 2. 当前阶段定位

当前阶段：

- 不接真实后端
- 不做真实请求
- 不处理鉴权 token
- 不做错误码体系对接

当前阶段只要求：

- 提前规划前端的数据访问边界
- 保证页面与 mock 之间有一层薄适配
- 为未来 API 接入预留结构

---

## 3. 设计原则

### 3.1 页面不要直接读 mock 文件
不要在页面里直接这样写：

```ts
import { ringProduct } from '@/mocks/products'
~~~

然后在页面里到处用。

这样后面接 API 会非常痛苦。

应该做成：

- 页面调用查询函数 / hook
- 查询函数当前先读 mock
- 未来再切到 API

------

### 3.2 先有“数据访问层”，再有“页面层”

建议把数据访问分成三层：

1. 页面层
2. 业务查询 / 适配层
3. mock / API 源头层

也就是：

**Page → Query / Adapter → Mock / API**

------

### 3.3 页面消费的是“前端稳定结构”

页面最好始终消费稳定的前端对象，例如：

- `Product`
- `Order`
- `OrderItem`
- `QuoteResult`

不要让页面直接消费未来可能很散乱的接口原始结构。

------

### 3.4 报价逻辑要能本地算，也要能未来切换成后端算

首轮自动报价先在前端本地完成。
但结构上要允许未来切成：

- 前端本地计算
  或
- 调接口返回报价结果

------

## 4. 推荐目录结构

建议在 `src/` 下增加一个轻量的适配层目录。

```text
src/
  services/
    product/
      productQueries.ts
      productAdapters.ts
    order/
      orderQueries.ts
      orderAdapters.ts
    quote/
      quoteService.ts
```

如果当前项目不想用 `services/` 这个名字，也可以用：

- `data/`
- `queries/`
- `repositories/`

但建议统一，不要混用。

------

## 5. 首轮建议的最小适配层结构

## 5.1 productQueries.ts

职责：

- 给页面提供产品相关读取能力

建议先提供这些方法：

```ts
getProductList()
getProductById(productId)
getReferableProducts()
```

首轮实现方式：

- 内部直接读取 `mocks/products.ts`

未来实现方式：

- 改成请求真实 API

------

## 5.2 orderQueries.ts

职责：

- 给页面提供订单相关读取能力

建议先提供这些方法：

```ts
getOrderList()
getOrderById(orderId)
createDraftOrder()
```

首轮实现方式：

- 内部读取 `mocks/orders.ts`

未来实现方式：

- 改成请求真实 API

------

## 5.3 quoteService.ts

职责：

- 统一处理报价相关逻辑

建议先提供这些方法：

```ts
buildQuoteResult(input)
matchPriceRules(input)
```

首轮实现方式：

- 本地纯函数计算

未来实现方式：

- 可保留本地计算
- 或改为请求报价接口

------

## 5.4 productAdapters.ts

职责：

- 把未来后端返回的产品结构转换成前端稳定的 `Product`

首轮可以先留空，或者只写说明。

未来可能需要做：

- 字段名映射
- 枚举值映射
- 图片字段规整
- 文件字段规整
- 规格行转前端结构

------

## 5.5 orderAdapters.ts

职责：

- 把未来后端返回的订单结构转换成前端稳定的 `Order` / `OrderItem`

首轮也可以先留空或写壳。

未来可能需要做：

- 商品列表映射
- 来源产品快照映射
- 报价结果映射
- 时间字段格式化前处理

------

## 6. 页面与适配层的关系

## 6.1 产品列表页

页面不直接读 mock，而是通过：

```ts
useProductsQuery()
```

或者至少：

```ts
getProductList()
```

------

## 6.2 产品详情页

页面通过：

```ts
getProductById(productId)
```

------

## 6.3 订单详情页

页面通过：

```ts
getOrderById(orderId)
```

------

## 6.4 产品引用选择器

选择器通过：

```ts
getReferableProducts()
```

------

## 6.5 来源产品详情抽屉

抽屉通过：

```ts
getProductById(sourceProductId)
```

未来如果要支持“引用时版本 / 当前版本”，可以扩展为：

```ts
getProductSnapshot(productId, version)
getProductCurrent(productId)
```

------

## 7. 首轮推荐的 hook 形态

如果你们前端想更贴近未来真实数据流，建议在查询层上再包一层 hook。

例如：

### 产品相关

- `useProductList`
- `useProductDetail`
- `useReferableProducts`

### 订单相关

- `useOrderList`
- `useOrderDetail`

### 报价相关

- `useOrderQuote`

这样页面层更干净，也方便未来切换到真实请求库。

------

## 8. 报价能力的 API 预留方案

这是你这个项目里最关键的预留之一。

## 8.1 首轮实现方式

首轮自动报价直接前端本地计算：

- 规格基础价
- 固定加价规则
- 汇总成 `QuoteResult`

------

## 8.2 后续可切换模式

未来报价可以有两种模式：

### 模式 A：前端本地计算

适合：

- 规则简单
- 页面即时联动
- mock 联调阶段

### 模式 B：后端接口计算

适合：

- 复杂规则
- 成本价保密
- 财务审批
- 多轴规格
- 更复杂的报价体系

------

## 8.3 所以前端要怎么预留

建议商品卡里的报价区，不直接依赖“页面自己算”，而是统一调用：

```ts
quoteService.buildQuoteResult(...)
```

这样未来只需要替换 `quoteService` 的内部实现，而不是重写整页。

------

## 9. 推荐的接口语义预留（不是首轮必须实现）

虽然首轮不接 API，但字段和动作语义建议提前想清楚。

------

## 9.1 产品侧未来接口语义

### 查询

- 获取产品列表
- 获取产品详情
- 获取可引用产品列表

### 写入

- 创建产品
- 更新产品
- 更新产品规格明细
- 更新产品价格规则

------

## 9.2 订单侧未来接口语义

### 查询

- 获取订单列表
- 获取订单详情

### 写入

- 创建订单
- 更新订单商品
- 引用产品到订单商品
- 更新订单商品规格选择
- 重新计算订单商品报价

------

## 9.3 报价侧未来接口语义

未来如果后端接管报价，建议接口语义至少要能表达：

- 当前引用产品
- 当前规格
- 当前材质
- 当前工艺
- 当前特殊需求
- 返回报价结果和 warning

------

## 10. 首轮推荐的“伪 API”函数清单

即使首轮不接后端，也建议先把函数壳子建好。

### 产品

```ts
getProductList()
getProductById(productId)
getReferableProducts()
saveProductDraft(payload)
updateProduct(payload)
```

### 订单

```ts
getOrderList()
getOrderById(orderId)
createOrderDraft(payload)
updateOrderItem(payload)
```

### 报价

```ts
buildQuoteResult(input)
recalculateOrderItemQuote(orderItem)
```

这样第二轮接真实接口时，页面不用大改。

------

## 11. 首轮适配层边界

首轮适配层只做这三件事：

1. 给页面提供统一的数据读取入口
2. 给页面提供统一的报价入口
3. 隔离 mock 与页面的直接耦合

首轮**不做**：

- 网络层封装
- 请求错误重试
- token 管理
- 接口缓存
- 乐观更新
- 复杂并发控制

------

## 12. 页面状态与数据层边界

### 页面层负责

- 当前页面布局
- 当前 modal / drawer 开关
- 当前 active tab
- 当前 hover / 选中项

### 适配层负责

- 给页面提供结构稳定的数据
- 统一报价入口
- 统一查询入口

### mock 层负责

- 提供样例数据
- 模拟首轮业务链路

这三层不要混。

------

## 13. 首轮最小落地建议

如果你想先做一个非常轻的适配层，建议至少先落这几个文件：

```text
src/services/product/productQueries.ts
src/services/order/orderQueries.ts
src/services/quote/quoteService.ts
```

这三个文件就够首轮前端使用了。

------

## 14. 示例职责划分

### `productQueries.ts`

当前内部直接返回 mock 数据：

- `getProductList`
- `getProductById`
- `getReferableProducts`

### `orderQueries.ts`

当前内部直接返回 mock 数据：

- `getOrderList`
- `getOrderById`

### `quoteService.ts`

当前内部直接本地计算：

- `matchPriceRules`
- `buildQuoteResult`

------

## 15. 首轮验收标准

### 15.1 页面不直接绑死在 mock 文件上

页面通过查询层 / 服务层拿数据。

### 15.2 报价逻辑有固定入口

不是每个页面自己写一套计算逻辑。

### 15.3 第二轮接后端时可替换

未来如果接真实 API，只需要替换 query / service 层，而不是重写页面。

### 15.4 数据结构与页面结构能稳定衔接

- 产品页
- 订单页
- 产品引用选择器
- 来源产品详情抽屉
- 自动报价区

都能共享同一套前端对象结构。

