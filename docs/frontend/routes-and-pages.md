# Routes And Pages

## 当前路由原则

- `/order-lines` 是销售主入口，一行代表一件商品。
- `/order-lines/:orderLineId` 是单件销售详情入口，不恢复 legacy `/orders`。
- `/purchases/new` 创建的是购买记录，并包含多条销售草稿。
- `/purchases/:purchaseId` 是购买记录归组页，不替代销售执行页。
- `/products` 管理款式模板，不展示销售实例。
- `/orders` 已删除，不再作为路由、导航入口或兼容入口。

## 当前主线必须保持可访问：

```text
/
/order-lines
/order-lines/:orderLineId
/purchases
/purchases/new
/purchases/:purchaseId
/customers
/customers/:customerId
/tasks
/tasks/:taskId
/production-follow-up
/design-modeling
/factory
/finance
/inventory
/management
/production-plan
/production-plan/:taskId
/products
/products/new
/products/:productId
/products/:productId/edit
```

`/purchases` 当前重定向到 `/purchases/new`。

## 页面职责

| 路由 | 页面 | 主对象 | 职责 |
|---|---|---|---|
| `/` | 工作台 | Purchase + OrderLine | 待办、风险和近期购买记录摘要 |
| `/order-lines` | 销售中心 | OrderLine | 销售列表、筛选、详情抽屉、状态推进、物流和售后维护 |
| `/order-lines/:orderLineId` | 销售详情 | OrderLine | 单件销售详情、状态推进、物流、售后、设计建模、跟单和工厂回传 |
| `/purchases/new` | 新建购买记录 | Purchase + OrderLineDraft | 录入一次购买公共信息并生成多条销售草稿 |
| `/purchases/:purchaseId` | 购买记录详情 | Purchase | 展示购买公共信息和本次购买下的多条销售 |
| `/customers` | 客户中心 | Customer | 客户列表和当前购买/销售/售后聚合 |
| `/customers/:customerId` | 客户详情 | Customer | 查看客户资料、购买记录、销售和售后历史 |
| `/tasks` | 任务中心 | Task | 协作任务列表，不替代销售主流程 |
| `/tasks/:taskId` | 任务详情 | Task | 查看任务上下文和关联购买/销售 |
| `/production-follow-up` | 生产跟进 | OrderLine | 跟单审核、下发生产、生产中、待回传、完工审核和异常筛选 |
| `/design-modeling` | 设计建模 | OrderLine | 设计/建模任务、文件记录和修改任务 |
| `/factory` | 工厂协同 | OrderLine | 工厂接收、生产回传和异常标记 |
| `/finance` | 财务中心 | OrderLine + FinancePaymentRecord | 按货号展示应收、收款、退款、净收、待收、补款 / 退款复核、商品行成本卡、旧金抵扣入库关联、FIFO 库存领用成本、工厂结算、成本核算、财务异常、确认前校验和锁定后只读边界；Purchase 只做聚合归组 |
| `/inventory` | 仓库商品 | InventoryItem + InventoryBatch | 库存资产台账、旧金抵扣入库追溯、FIFO 批次和库存流转 |
| `/management` | 管理看板 | Purchase + OrderLine | 汇总经营、生产风险、财务和角色负载 |
| `/production-plan` | 生产计划 | Task + OrderLine + optional Product | 工厂任务计划列表；全定制销售可不依赖来源款式模板 |
| `/production-plan/:taskId` | 生产计划详情 | Task + OrderLine + optional Product | 生产资料、文件和回传信息；有来源模板时展示 Product 资料，没有来源模板时展示销售自身资料 |
| `/products` | 款式管理 | Product | 款式模板列表 |
| `/products/new` | 新建款式 | Product | 创建款式模板 |
| `/products/:productId` | 款式详情 | Product | 查看模板资料、规格、价格、引用和版本 |
| `/products/:productId/edit` | 编辑款式 | Product | 编辑模板资料和设计版本 |

新 PRD 名词在当前路由中按 current model 使用：`order` 对应购买记录 `Purchase`，`item / work_order` 对应销售货号和 `OrderLine`，`style_template` 对应 `Product`，`payment` 对应 `FinancePaymentRecord`。

## 状态和字段规则

- 页面待办、筛选和推进统一使用 `OrderLine.lineStatus`。
- `OrderLine.status` 已删除。
- 角色分流使用顶层 `designStatus / modelingStatus / productionStatus / factoryStatus / financeStatus`。
- 工厂回传子状态使用 `productionInfo.feedbackStatus`。
- 工厂回传完成后先进入 `lineStatus = factory_returned`，由生产跟进页做完工审核；审核通过后才进入 `pending_finance_confirmation`。
- 货号显示统一使用 `productionTaskNo`。
- 财务收款流水按 `FinancePaymentRecord.orderLineId` 查询。
- `FinancePaymentRecord.method` 表示收款方式，`recordType` 表示定金、尾款、补款、退款或旧金等业务用途。
- 补款 / 退款流水使用 `FinancePaymentRecord.reviewStatus` 标记待复核或已复核。
- 退款流水使用 `FinancePaymentRecord.reason` 记录原因；退款缺原因会进入财务异常风险，财务异常视图可一次性补齐原因并复核解除。
- 旧金抵扣流水可通过 `FinancePaymentRecord.inventoryItemId` 关联旧金库存资产；库存只做追溯，不推进销售状态；旧金抵扣流水本身不自动计入商品行成本，只有旧金库存 `outbound` 并关联 `OrderLine` 时才按 FIFO 进入成本合计。
- 库存 FIFO 成本只统计 `InventoryMovement.type = outbound` 且 `relatedOrderLineId` 指向当前销售的 `fifoCostAmount`；`reserve / release / adjust` 不确认成本，`scrap` 只扣库存批次，不进入销售成本。
- `financeStatus = confirmed` 或 `financeLocked = true` 表示该货号财务已锁定；财务页只展示数据，不再允许新增收退款、补齐 / 复核退款原因、修改工厂结算金额、修改财务备注、标记异常或再次确认结算。
- 来源款式编码统一来自 `Product.code` / `ProductSnapshot.sourceProductCode`；全定制销售可以没有来源款式编码。
- 物流和售后展示按 `orderLineId` 查询。
- 购买记录页只做归组展示和统一入口。

## 角色边界

- 工厂页不得展示客户联系方式、地址、销售金额、定金、尾款、利润或财务备注。
- 财务页可以看金额、成本和工厂回传数据，但不推进设计、建模或生产动作。
- 设计建模页只处理商品执行需求、文件记录和修改任务。
- 管理看板只做汇总，不承接具体录入。

## 删除边界

以下路由不得恢复：

```text
/orders
/orders/new
/orders/:orderId
```

如需追溯旧实现，使用 git 历史。
