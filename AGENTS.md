# AGENTS.md

## 项目身份
这是一个面向珠宝 / 定制饰品业务的定制电商协同 ERP 前端项目。

当前阶段以 **OrderLine（商品行）** 为主操作对象，以 **Purchase（购买记录）** 为归组对象，以 **Customer（客户）** 为沉淀对象，以 **Product（产品模板）** 为模板对象。legacy `/orders` runtime 模块已经删除。

本阶段仍以前端 UI、mock 数据和 current workflow 联调为主，暂不接真实后端业务流。

## AI Coding 规则
1. 先确认主语：本次改动到底涉及 `Purchase`、`OrderLine`、`Product` 还是 `Customer`。
2. 简单优先：只写解决当前问题所需的最小代码，不提前设计复杂抽象。
3. 精准修改：不顺手重构任务无关代码、文档、样式或命名。
4. 目标驱动：每轮修改都要能说明验证方式。

推荐格式：

```text
1. [步骤] -> verify: [验证方式]
2. [步骤] -> verify: [验证方式]
```

## 当前业务主线
- `Customer` = 客户主档
- `Purchase` = 购买记录，一次购买公共信息
- `OrderLine` = 商品行，一件商品的执行对象
- `Product` = 产品模板
- `ProductSnapshot` = 来源产品快照
- `LogisticsRecord` = 物流记录，默认关联 `orderLineId`
- `AfterSalesCase` = 售后记录，默认关联 `orderLineId`

对象关系：

```text
Customer
  -> Purchase
    -> OrderLine
      -> ProductSnapshot
      -> LogisticsRecord / AfterSalesCase / QuoteResult
```

## 核心对象边界
### Purchase
购买记录用于保存一次购买的公共信息：平台订单号、客户收件信息、支付时间、整笔购买备注、付款汇总等。

`Purchase` 是归组对象，不是单件商品执行对象。不要把设计、建模、生产、工厂、发货、售后等单件执行字段塞回 `Purchase`。

### OrderLine
商品行是一件商品的执行对象，也是当前系统主操作对象。

同一次购买中的多件商品必须拆成多条 `OrderLine`，并允许分别推进状态、负责人、交期、物流和售后。

### Product / ProductSnapshot
`Product` 是产品模板，不是业务执行对象。

商品行引用产品时保存 `ProductSnapshot`，用于核对模板参数与本次实际需求。不要把 `Product` 直接当作订单执行实例使用。

### LogisticsRecord / AfterSalesCase
物流和售后默认关联 `orderLineId`。购买记录页只做汇总展示和统一入口。

## 当前主路由
- `/order-lines` = 商品行中心
- `/purchases/new` = 新建购买记录
- `/purchases/:purchaseId` = 购买记录详情
- `/products` = 产品管理
- `/customers` = 客户中心
- `/customers/:customerId` = 客户详情
- `/production-follow-up` = 生产跟进 / 跟单视图
- `/design-modeling` = 设计 / 建模工作台
- `/factory` = 工厂协同中心
- `/finance` = 财务中心
- `/management` = 管理看板

页面边界：
- `/order-lines` 一行代表一件商品，不是一笔购买记录。
- `/purchases/new` 创建 `Purchase`，其中每张商品行草稿输出为 `orderLineDrafts`。
- `/purchases/:purchaseId` 是购买归组页，展示公共信息和本次购买下的多条商品行。
- `/products` 展示产品模板，不展示商品行实例。
- `/production-follow-up`、`/design-modeling`、`/factory`、`/finance`、`/management` 都基于 `OrderLine` 或 `Purchase + OrderLine` 聚合，不回写旧订单模型。

## 状态与分流规则
- `OrderLine.lineStatus` 是多角色工作流主状态。
- `OrderLine.status` 只作为短期兼容展示字段，新增筛选、任务分组和角色视图不要扩大它的主流程用途。
- 设计 / 建模 / 生产 / 工厂 / 财务分流字段继续落在 `OrderLine`。
- 客服确认完成后按以下顺序分流：

```text
requiresDesign -> pending_design
requiresModeling -> pending_modeling
otherwise -> pending_merchandiser_review
```

- `Purchase.aggregateStatus` 只做聚合展示，不作为主流程驱动状态。

## 角色视图边界
- 设计 / 建模工作台只展示商品执行需求、设计 / 建模状态和文件记录，不展示客户联系方式或财务金额。
- 工厂协同中心只展示分配给工厂的生产任务、设计 / 建模 / 出蜡资料和生产回传字段，不展示客户隐私、地址、销售价格、定金、尾款、利润或财务备注。
- 财务中心允许查看金额、成本和工厂回传数据，但不得推进设计、建模或生产执行字段。
- 管理看板只做汇总观察，不承接客服、跟单、工厂或财务录入动作。

## 禁止事项
新代码不得：
1. 重新引入 `/orders`、`/orders/new`、`/orders/:orderId`。
2. 重新创建 `src/pages/orders/*`、`src/components/business/order/*`、`src/services/order/*`、`src/mocks/orders.ts`、`src/types/order.ts`。
3. 新增或扩大 `Order / OrderItem / order.items / orders.timeline` 作为 current workflow 主模型。
4. 把物流或售后默认设计成整笔购买唯一归属。
5. 把 `Product` 和 `OrderLine` 混成一个对象。
6. 擅自修改系统参考报价公式。
7. 在没有同步文档的情况下发明核心字段语义。

历史兼容命名只能按历史语境理解：
- `TransactionRecord` = `Purchase` 的历史兼容别名
- `SourceProductSnapshot` = `ProductSnapshot` 的历史兼容命名

## 首轮必须跑通的样例
1. 同一次购买，多件商品，多条商品行。
2. 戒指选择规格后自动带出参数、基础价、固定加价和系统参考报价。
3. 吊坠选择规格后自动带出参数、基础价、固定加价和系统参考报价。
4. 同一次购买中多件商品可以分开发货。
5. 同一次购买中只有一件商品进入售后，其他商品正常完成。

## 文档入口
默认只读这些 current docs：
1. `AGENTS.md`
2. `README.md`
3. `docs/frontend/docs-index.md`
4. `docs/frontend/handoff.md`
5. `docs/frontend/mock-data-schema.md`
6. `docs/frontend/routes-and-pages.md`
7. `docs/frontend/ui-structure.md`

`docs/frontend/archive/` 仅用于历史追溯，不作为新增页面、类型、mock、路由或导航入口的依据。

如果文档冲突，优先级：

```text
AGENTS.md
README.md
docs/frontend/docs-index.md
docs/frontend/handoff.md
docs/frontend/mock-data-schema.md
docs/frontend/routes-and-pages.md
docs/frontend/ui-structure.md
docs/frontend/archive/*
```

## 输出要求
每次完成修改后至少说明：
1. 改了哪些文件。
2. 为什么改。
3. 哪些旧命名暂时保留为兼容层。
4. 哪些地方还没清理。
5. 下一步建议。
