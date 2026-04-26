# 定制电商协同 ERP（前端）

## 项目说明
这是一个面向珠宝 / 定制饰品业务的定制电商协同 ERP 前端项目。

当前项目已经从 legacy `/orders` 收口到 **Purchase + OrderLine** current workflow：

- `Customer`：客户主档
- `Purchase`：购买记录，一次购买的公共信息
- `OrderLine`：商品行，一件商品的执行对象
- `Product`：产品模板
- `ProductSnapshot`：商品行引用产品时保存的来源快照
- `LogisticsRecord` / `AfterSalesCase`：默认关联 `orderLineId`

系统主操作对象是 **OrderLine（商品行）**。`Purchase` 只负责归组一次购买中的公共信息和多条商品行。

## 当前开发阶段
当前阶段是 **OrderLine workflow foundation**：

- 前端 UI、mock 数据和页面联调优先，暂不接真实后端。
- `/purchases/new` 创建 `Purchase`，商品行草稿继续输出为 `orderLineDrafts`。
- `OrderLine.lineStatus` 是多角色工作流主状态；`status` 只作为短期兼容展示字段。
- 设计、建模、生产、工厂回传、财务核算字段继续落在 `OrderLine`。
- 客服确认后按 `requiresDesign`、`requiresModeling` 分流到后续 `lineStatus`。
- 管理看板只做 `Purchase + OrderLine` 聚合观察，不承接具体录入动作。

## 当前主链路
```text
产品维护
-> 商品行引用产品
-> 选择规格
-> 自动带出规格参数
-> 自动带出基础价格
-> 叠加固定加价规则
-> 生成系统参考报价
```

首轮必须覆盖：
- 同一次购买包含多条商品行。
- 戒指、吊坠选择规格后自动带价。
- 同一次购买中多件商品可以分开发货。
- 同一次购买中只有一件商品进入售后。

## 当前主路由
- `/order-lines`：商品行中心
- `/purchases/new`：新建购买记录
- `/purchases/:purchaseId`：购买记录详情
- `/products`：产品管理
- `/customers`：客户中心
- `/customers/:customerId`：客户详情
- `/production-follow-up`：生产跟进 / 跟单视图
- `/design-modeling`：设计 / 建模工作台
- `/factory`：工厂协同中心
- `/finance`：财务中心
- `/management`：管理看板

legacy `/orders`、`/orders/new`、`/orders/:orderId` 已删除，不再作为可访问路由、兼容入口或当前主文档口径。

## 关键规则
1. 产品模板和商品行不能混：`Product` 是模板，`OrderLine` 是执行实例。
2. 购买记录和商品行不能混：`Purchase` 是归组对象，单件执行字段属于 `OrderLine`。
3. 物流和售后默认关联商品行：优先使用 `orderLineId`。
4. 状态流转优先基于商品行：新增筛选、任务分组和角色视图优先使用 `OrderLine.lineStatus`。
5. 旧命名只作兼容口径：`TransactionRecord` = `Purchase`，`SourceProductSnapshot` = `ProductSnapshot`。

## 当前不做
- 真实后端接口联调
- 复杂权限系统
- 复杂报价公式、报价审批流、多版本报价历史
- 完整物流、售后、BI 或小程序端
- 恢复 legacy `/orders` runtime 模块

## 文档阅读顺序
默认只读 current docs：

1. `AGENTS.md`
2. `docs/frontend/docs-index.md`
3. `docs/frontend/handoff.md`
4. `docs/frontend/mock-data-schema.md`
5. `docs/frontend/routes-and-pages.md`
6. `docs/frontend/ui-structure.md`

`docs/frontend/archive/` 只作历史追溯，不用于指导新增代码、页面命名或路由入口。
