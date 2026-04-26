# Frontend Docs Index

## 目标
本索引用来压缩 AI 上下文：默认只读 current docs；历史文档只在追溯旧阶段时打开。

当前真相：

```text
Customer -> Purchase -> OrderLine -> Product
```

legacy `/orders` 已删除，不是当前入口、兼容入口或主文档口径。

## Current Docs
1. `AGENTS.md`
   - AI coding 规则、业务主线、禁止事项和文档优先级。
2. `README.md`
   - 项目概览、当前阶段、主路由和最重要业务规则。
3. `docs/frontend/handoff.md`
   - 当前交接摘要、页面分工、验证样例和兼容口径。
4. `docs/frontend/mock-data-schema.md`
   - 当前 mock 对象、字段边界、文件建议和必须覆盖样例。
5. `docs/frontend/routes-and-pages.md`
   - 当前路由、页面职责、弹窗 / 抽屉边界。
6. `docs/frontend/ui-structure.md`
   - 当前页面信息结构和 UI 边界。
7. `docs/frontend/docs-index.md`
   - 文档入口与 archive 边界。

## Archive Docs
`docs/frontend/archive/` 中的文件只作历史参考，不代表当前主线。

已归档的主要历史内容：
- 旧 handoff 与任务板：`handoff-history.md`、`frontend-task-board-history.md`
- legacy `/orders` 删除记录：`legacy-orders-removal-completion.md`
- Phase 1 / Phase 2 规划和 AI prompt：`phase-2-prd.md`、`phase-2-task-board.md`、`codex-prompts-v1.md`、`odex-prompts-phase-2.md`
- 旧订单中心、任务中心、架构草案：`frontend-prd.md`、`order-lifecycle-spec.md`、`task-center-prd.md`、`state-management-plan.md`、`components-plan.md` 等

Archive 阅读规则：
- 不从 archive 推导新类型、新路由、新页面命名。
- archive 与 current docs 冲突时，以 current docs 为准。
- 需要理解历史原因时，先读 `docs/frontend/archive/README.md`。

## 推荐阅读顺序
第一次接手：

```text
AGENTS.md
README.md
docs/frontend/docs-index.md
docs/frontend/handoff.md
```

准备改代码：

```text
AGENTS.md
docs/frontend/handoff.md
docs/frontend/mock-data-schema.md
docs/frontend/routes-and-pages.md
docs/frontend/ui-structure.md
```

只做历史追溯：

```text
docs/frontend/docs-index.md
docs/frontend/archive/README.md
docs/frontend/archive/*
```

## 文档优先级
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

## 最容易误读的点
- `/orders` 已删除；当前主入口是 `/order-lines` 与 `/purchases/*`。
- `TransactionRecord` 只能作为 `Purchase` 的历史兼容别名。
- `OrderLine` 是单件商品执行对象，不回退为旧 `OrderItem`。
- `Product` 是模板，不是商品行实例。
- 管理看板只做聚合观察，不承接具体录入动作。
