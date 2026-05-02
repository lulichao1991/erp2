# Routes And Pages

## 当前路由原则

- `/order-lines` 是销售主入口，一行代表一件商品。
- `/purchases/new` 创建的是购买记录，并包含多条销售草稿。
- `/purchases/:purchaseId` 是购买记录归组页，不替代销售执行页。
- `/products` 管理款式模板，不展示销售实例。
- `/orders` 已删除，不再作为路由、导航入口或兼容入口。

## 当前主线必须保持可访问：

```text
/
/order-lines
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
| `/purchases/new` | 新建购买记录 | Purchase + OrderLineDraft | 录入一次购买公共信息并生成多条销售草稿 |
| `/purchases/:purchaseId` | 购买记录详情 | Purchase | 展示购买公共信息和本次购买下的多条销售 |
| `/customers` | 客户中心 | Customer | 客户列表和当前购买/销售/售后聚合 |
| `/customers/:customerId` | 客户详情 | Customer | 查看客户资料、购买记录、销售和售后历史 |
| `/tasks` | 任务中心 | Task | 协作任务列表，不替代销售主流程 |
| `/tasks/:taskId` | 任务详情 | Task | 查看任务上下文和关联购买/销售 |
| `/production-follow-up` | 生产跟进 | OrderLine | 跟单审核、下发生产、生产中、待回传和异常筛选 |
| `/design-modeling` | 设计建模 | OrderLine | 设计/建模任务、文件记录和修改任务 |
| `/factory` | 工厂协同 | OrderLine | 工厂接收、生产回传和异常标记 |
| `/finance` | 财务中心 | Purchase + OrderLine | 收款、工厂结算、成本核算和财务异常 |
| `/inventory` | 仓库商品 | InventoryItem | 库存资产台账和库存流转 |
| `/management` | 管理看板 | Purchase + OrderLine | 汇总经营、生产风险、财务和角色负载 |
| `/production-plan` | 生产计划 | Task + OrderLine + Product | 工厂任务计划列表 |
| `/production-plan/:taskId` | 生产计划详情 | Task + OrderLine + Product | 生产资料、文件和回传信息 |
| `/products` | 款式管理 | Product | 款式模板列表 |
| `/products/new` | 新建款式 | Product | 创建款式模板 |
| `/products/:productId` | 款式详情 | Product | 查看模板资料、规格、价格、引用和版本 |
| `/products/:productId/edit` | 编辑款式 | Product | 编辑模板资料和设计版本 |

## 状态和字段规则

- 页面待办、筛选和推进统一使用 `OrderLine.lineStatus`。
- `OrderLine.status` 已删除。
- 货号显示统一使用 `productionTaskNo`。
- 来源款式编码统一来自 `Product.code` / `ProductSnapshot.sourceProductCode`。
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
