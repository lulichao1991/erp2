# 路由与页面职责

## 目标
本文件只记录当前可访问路由、页面主语和页面边界。legacy `/orders` 已删除，历史路由说明在 `docs/frontend/archive/`。

## 路由原则
- `/order-lines` 是当前主入口，一行代表一件商品。
- `/purchases/*` 负责一次购买的公共信息和商品行归组。
- `/products` 负责产品模板，不展示商品行实例。
- 生产、设计 / 建模、工厂、财务、管理视图都基于 `OrderLine` 或 `Purchase + OrderLine` 聚合。
- 高频上下文信息优先用抽屉 / 弹窗承接，不新增旧 `/orders` fallback。

## 一级导航
```text
/order-lines
/purchases/new
/products
/customers
/production-follow-up
/design-modeling
/factory
/finance
/management
```

## 当前主页面
### `/order-lines`
商品行中心。

职责：
- 展示 `OrderLine` 列表。
- 支持按 `lineStatus`、负责人、交期、生产 / 工厂状态筛选。
- 打开商品行详情抽屉。
- 入口可跳转到所属 `Purchase`。

不做：
- 不把一行当作整笔购买。
- 不读取旧 `Order / OrderItem`。

### `/purchases/new`
新建购买记录。

职责：
- 创建 `purchaseDraft`。
- 管理多张商品行草稿卡，并输出 `orderLineDrafts`。
- 商品行草稿可引用产品、选择规格并计算系统参考报价。

不做：
- 不回退为旧 `/orders/new`。
- 不把商品行字段合并成购买记录字段。

### `/purchases/:purchaseId`
购买记录详情。

职责：
- 展示购买公共信息、客户快照、收款汇总、购买备注。
- 展示本次购买下的多条 `OrderLine`。
- 汇总展示物流、售后和时间线入口。

不做：
- 不替代单件商品行执行页。
- 不用 `Purchase.aggregateStatus` 驱动单件流程。

### `/products`
产品管理。

职责：
- 展示产品模板列表。
- 维护产品标准资料、规格、价格规则、定制规则、生产参考和文件。
- 供商品行引用并生成 `ProductSnapshot`。

不做：
- 不把 `Product` 当成业务执行对象。

### `/customers`
客户中心。

职责：
- 展示客户主档。
- 汇总客户历史购买记录、历史商品行、售后摘要。

### `/customers/:customerId`
客户详情。

职责：
- 展示客户长期信息。
- 展示该客户的 `Purchase`、`OrderLine`、售后记录聚合。

### `/production-follow-up`
生产跟进 / 跟单视图。

职责：
- 基于 `OrderLine.lineStatus / productionStatus / factoryStatus` 展示待审核、待下发、生产中、待回传、异常 / 逾期。
- 推进跟单节点。

不做：
- 不回写旧订单模型。

### `/design-modeling`
设计 / 建模工作台。

职责：
- 基于 `OrderLine` 展示待设计、设计中、待建模、建模中、待修改、已完成。
- 记录设计 / 建模状态、文件和修改任务。

不展示：
- 客户联系方式
- 财务金额

### `/factory`
工厂协同中心。

职责：
- 展示分配给当前 mock 工厂的商品行生产任务。
- 展示设计 / 建模 / 出蜡资料。
- 记录工厂接收、生产、回传、异常标记。

不展示：
- 客户联系方式、地址
- 销售价格、定金、尾款、利润、财务备注

### `/finance`
财务中心。

职责：
- 基于 `Purchase.finance` 查看收款。
- 基于 `OrderLine.productionData / financeStatus` 查看工厂结算、成本核算和异常标记。

不做：
- 不推进设计、建模或生产执行字段。

### `/management`
管理看板。

职责：
- 汇总经营、生产风险、财务、角色负载和工厂表现。
- 只做观察和 drill-down 入口。

不做：
- 不承接客服、跟单、工厂或财务录入动作。

## 抽屉 / 弹窗
### 商品行详情抽屉
触发：商品行列表、购买记录详情、角色工作台。

展示：
- 商品行基础信息
- 来源产品快照
- 实际需求与报价
- 设计 / 建模 / 生产 / 工厂 / 财务状态摘要
- 物流 / 售后入口

### 来源产品详情抽屉
触发：商品行里的产品名称或来源产品条。

展示：
- 来源产品模板信息
- 商品行实际选择
- 模板参数与实际参数对比

### 物流与售后
默认以 `orderLineId` 为主键展示和新建。

## 路由最小集
当前必须存在：

```text
/order-lines
/purchases/new
/purchases/:purchaseId
/products
/products/new
/products/:productId
/products/:productId/edit
/customers
/customers/:customerId
/production-follow-up
/design-modeling
/factory
/finance
/management
```

已删除：

```text
/orders
/orders/new
/orders/:orderId
```

## 验收标准
- 主导航不展示 `/orders`。
- `/order-lines` 是商品行中心主入口。
- 购买记录详情页可展示同一次购买下的多条商品行。
- 产品页只展示模板对象。
- 角色视图不展示超出职责边界的信息。
