# Handoff（当前真相）

## 当前状态
项目已从 legacy `/orders` 收口到 `Purchase + OrderLine` current workflow。旧 `/orders` runtime 模块、页面、service、mock、type 和入口已删除。

当前阶段只巩固前端 mock 工作流：

```text
Customer -> Purchase -> OrderLine -> ProductSnapshot
```

`OrderLine` 是主操作对象，`Purchase` 是归组对象，`Product` 是模板对象。

## 本轮继续开发时先确认
1. 当前任务主语是 `Purchase`、`OrderLine`、`Product` 还是 `Customer`。
2. 是否会改变核心字段语义、mock 结构、路由语义或页面主语。
3. 是否需要同步 `AGENTS.md`、`README.md`、`mock-data-schema.md`、`routes-and-pages.md`、`ui-structure.md`。

## 已确定边界
- `/order-lines` 一行代表一件商品。
- `/purchases/new` 创建购买记录，商品行草稿输出为 `orderLineDrafts`。
- `/purchases/:purchaseId` 展示一次购买的公共信息和多条商品行。
- `/products` 展示产品模板，不展示商品行实例。
- 物流、售后默认关联 `orderLineId`。
- `OrderLine.lineStatus` 是主流程状态，`status` 只作短期兼容展示。
- 客服确认完成后按 `requiresDesign`、`requiresModeling` 分流。

## 当前页面分工
- 客服 / 商品行中心：资料完整度、商品行确认、来源产品核对。
- 生产跟进：基于 `lineStatus / productionStatus / factoryStatus` 推进跟单节点。
- 设计 / 建模：展示执行需求、设计 / 建模状态和文件记录，不展示客户隐私或财务金额。
- 工厂协同：展示分配给工厂的生产任务和回传字段，不展示客户隐私、地址、销售金额或利润。
- 财务中心：查看金额、成本和工厂回传数据，不推进设计、建模或生产字段。
- 管理看板：做经营、生产风险、财务、角色负载和工厂表现汇总，不承接录入动作。

## 保留兼容口径
- `TransactionRecord` 只能作为 `Purchase` 的历史兼容别名。
- `SourceProductSnapshot` 只能作为 `ProductSnapshot` 的历史兼容命名。
- 不恢复 `Order / OrderItem / order.items / orders.timeline` 作为 current workflow 主模型。

## 当前验证样例
1. 同一次购买，多件商品，多条商品行。
2. 戒指选择规格后自动带出参数、基础价、固定加价和系统参考报价。
3. 吊坠选择规格后自动带出参数、基础价、固定加价和系统参考报价。
4. 同一次购买中多件商品分开发货。
5. 同一次购买中只有一件商品进入售后。

## 历史文档
旧阶段说明和长任务板已归档：

- `docs/frontend/archive/handoff-history.md`
- `docs/frontend/archive/frontend-task-board-history.md`
- `docs/frontend/archive/legacy-orders-removal-completion.md`

归档文档只用于追溯项目演进，不作为新功能、新类型、新路由或新页面命名依据。
