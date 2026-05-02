# Handoff

## 当前结论

当前项目是 **OrderLine-centered ERP v1 mock 工作台**。

主线对象：

```text
Customer -> Purchase -> OrderLine -> Product
```

- `Customer`：客户沉淀对象。
- `Purchase`：一次购买的公共信息和归组对象。
- `OrderLine`：一件商品的一条销售，是当前主操作对象。
- `Product`：款式模板，不是销售实例。
- `ProductSnapshot`：销售引用款式时保存的来源快照。
- `InventoryItem`：仓库库存资产，不驱动销售状态。
- `LogisticsRecord` / `AfterSalesCase`：默认关联 `orderLineId`。

当前不接真实后端，所有业务流以 mock + 前端状态验证为准。

## 已完成

- legacy `/orders` runtime、旧 orders 类型、service、mock、页面和入口已删除。
- `TransactionRecord` runtime 兼容别名已删除。
- `OrderLine.status` 兼容字段已删除，状态推进统一使用 `lineStatus`。
- `skuCode / itemSku / transactionId / transactionNo / orderType / returnedWeight` 等旧字段已从 current runtime 清理。
- `designInfo.designStatus` 已删除；设计/建模分流统一使用顶层 `designStatus / modelingStatus`。
- `productionInfo.factoryStatus` 已改为 `productionInfo.feedbackStatus`；顶层 `factoryStatus` 只表示工厂工作流状态。
- 销售中心、购买记录新建页、购买记录详情页、客户中心、任务中心、生产跟进、设计建模、工厂、财务、库存、管理看板和生产计划均已接入 current mock 主线。
- 资料完整度、生产逾期、工厂回传异常、财务异常和角色待办徽标统一由 `orderLineRiskSelectors` 计算。
- 路由、mock 文件清单、类型章节已加入文档一致性测试。
- dead-code 检查使用 `knip`。

## 当前主路由

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

`/purchases` 仅重定向到 `/purchases/new`。

## 当前业务规则

- 一次购买可以包含多条销售。
- 同一次购买下的多条销售必须允许分别推进状态、交期、物流和售后。
- `OrderLine.lineStatus` 是主工作流状态。
- `designStatus / modelingStatus / productionStatus / factoryStatus / financeStatus` 是角色分流状态。
- `productionInfo.feedbackStatus` 只表示工厂回传子状态，不替代顶层 `factoryStatus`。
- 客服确认按 `requiresDesign -> pending_design`、`requiresModeling -> pending_modeling`、否则 `pending_merchandiser_review` 分流。
- 销售货号使用 `productionTaskNo`。
- 新建购买记录时选中 `Product` 后，销售草稿使用 `product.code` 作为来源款式编码。
- 系统参考报价使用 `quote.systemQuote`。
- 销售成交金额使用 `lineSalesAmount`。
- 物流和售后优先关联 `orderLineId`。
- 工厂角色不得看到客户联系方式、地址、销售金额、定金、尾款、利润或财务备注。
- 财务可以查看金额、成本和工厂回传数据，但不推进设计、建模或生产动作。

## 当前文档边界

- `AGENTS.md`：最高优先级业务规则和 AI coding 规则。
- `docs/frontend/handoff.md`：当前交接说明，只保留当前结论。
- `docs/frontend/mock-data-schema.md`：当前类型和 mock 文件结构。
- `docs/frontend/routes-and-pages.md`：当前路由和页面职责。
- `docs/frontend/ui-structure.md`：当前 UI 信息层级。
- `docs/frontend/frontend-task-board.md`：当前剩余计划。
- `docs/frontend/docs-index.md`：文档索引。

若文档冲突，按上面顺序理解。

## 验证命令

```bash
npm test
npm run build
npm run analyze:dead
```

`npm test` 中包含：

- 路由与 `routes-and-pages.md` 的最小路由集一致性检查。
- mock 文件与 `mock-data-schema.md` 的文件清单一致性检查。
- 类型文件与 `mock-data-schema.md` 的对象章节一致性检查。

## 下一步计划

| 优先级 | 事项 | 验收 |
|---|---|---|
| P0 | 保持文档与代码同步 | 修改路由、类型、mock、核心字段时同步更新对应文档并跑测试 |
| P1 | 继续拆小 `orderLine/index.tsx` | 表单/详情/列表组件拆出后行为不变，router smoke 通过 |
| P2 | 补充新建购买记录到销售中心的端到端样例 | 同一次购买多件商品、多状态、多物流、多售后路径可演示 |
| P2 | 评估真实接口前的数据契约 | 只输出字段契约，不引入后端实现 |

## 禁止回退

- 不恢复 `/orders`。
- 不新增旧 `Order / OrderItem` 主模型。
- 不恢复 `TransactionRecord` runtime 兼容别名。
- 不把 `Product` 当作销售执行对象。
- 不把单件销售执行字段塞回 `Purchase`。
- 不把库存动作设计成驱动销售工作流。
