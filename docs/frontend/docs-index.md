# Docs Index（前端文档索引）

## 1. 文档定位

本文档用于说明 `docs/frontend` 目录中当前文档与历史归档文档的边界。

当前项目主线已经统一为：

```text
Customer -> Purchase -> OrderLine -> Product
```

当前主入口为：

- `/order-lines`
- `/purchases/new`
- `/purchases/:purchaseId`
- `/products`
- `/customers`
- `/customers/:customerId`
- `/tasks`
- `/production-follow-up`
- `/design-modeling`
- `/factory`
- `/finance`
- `/inventory`
- `/management`
- `/production-plan`

legacy `/orders` 模块已经删除，不再作为当前主入口、兼容入口或当前主文档口径。

---

## 2. 当前主文档

第一次接手项目、准备继续清理或准备修改代码时，优先阅读以下文档。

1. `AGENTS.md`

作用：
- 定义项目业务口径与 AI coding 行为规则
- 定义当前主线对象与禁止事项
- 明确 legacy `/orders` 已删除

2. `README.md`

作用：
- 提供项目概览、运行方式和当前主线说明
- 作为新成员快速进入项目的入口

3. `docs/frontend/routes-and-pages.md`

作用：
- 定义当前主路由与页面职责
- 明确 `/order-lines`、`/purchases/*` 和各角色工作台的主入口地位
- 明确 legacy `/orders` 已删除，当前页面只围绕 `Purchase + OrderLine`

4. `docs/frontend/ui-structure.md`

作用：
- 定义销售中心、购买记录新建页、购买记录详情页和产品页的 UI 结构
- 约束页面信息层级和对象边界

5. `docs/frontend/mock-data-schema.md`

作用：
- 定义 `Customer / Purchase / OrderLine / ProductSnapshot / InventoryItem` 等当前主对象
- 明确 `TransactionRecord` 只能作为 `Purchase` 的兼容别名
- 明确当前 mock 主线为 `purchases.ts + order-lines.ts`

6. `docs/frontend/handoff.md`

作用：
- 记录阶段推进历史与最新交接信息
- 若早期段落与当前主线冲突，以最新阶段说明和上述主文档为准

7. `docs/frontend/docs-index.md`

作用：
- 说明当前主文档、过渡文档与历史归档文档的边界

8. `docs/frontend/legacy-orders-removal-plan.md`

作用：
- 记录 legacy `/orders` 删除完成状态
- 梳理 current workflow route smoke 与删除后的回滚口径
- 明确不要重新引入旧 `/orders`

---

## 3. 任务板与历史执行记录

以下文档仍保留在 `docs/frontend` 根目录，用于记录已完成能力、暂停项和后续边界。

1. `docs/frontend/frontend-task-board.md`

保留原因：
- 记录 Purchase + OrderLine 主线已完成页面与能力
- 记录 legacy `/orders` 删除后的禁止事项和回滚口径
- 记录当前 mock v1 与真实后端 / 真实权限 / 真实文件上传之间的边界

阅读规则：
- 可作为任务追溯和能力清单阅读
- 如与 `AGENTS.md`、`README.md` 或 `routes-and-pages.md` 冲突，以这些当前主文档为准

---

## 4. 历史归档文档

以下文档已移入 `docs/frontend/archive/`。

这些文档只作历史参考，不代表当前主线，不应继续作为新功能、新页面或新类型命名的依据。

### 4.1 旧 AI 执行 Prompt

- `docs/frontend/archive/codex-prompts-v1.md`
- `docs/frontend/archive/odex-prompts-phase-2.md`

归档原因：
- 包含旧订单中心、旧 `/orders` 主入口或旧 Phase 2 执行口径
- 部分内容带有历史 markdown 包裹和对话残留

### 4.2 旧 Phase 2 / 旧订单中心规划

- `docs/frontend/archive/phase-2-prd.md`
- `docs/frontend/archive/phase-2-task-board.md`
- `docs/frontend/archive/order-lifecycle-spec.md`
- `docs/frontend/archive/task-center-prd.md`

归档原因：
- 以旧订单中心、订单生命周期或 Phase 2 任务为主线
- 未按当前 `Purchase + OrderLine` 主线重写

### 4.3 旧前端规划草案

- `docs/frontend/archive/api-adapter-plan.md`
- `docs/frontend/archive/state-management-plan.md`
- `docs/frontend/archive/role-draft.md`
- `docs/frontend/archive/layout-and-navigation.md`
- `docs/frontend/archive/file-structure.md`
- `docs/frontend/archive/frontend-prd.md`
- `docs/frontend/archive/components-plan.md`
- `docs/frontend/archive/business-rules.md`
- `docs/frontend/archive/design-tokens.md`

归档原因：
- 属于早期规划阶段文档
- 存在旧“订单中心 / 商品任务中心 / TransactionRecord”口径
- 未作为本轮 Purchase + OrderLine 主线定稿文档维护

---

## 5. 推荐阅读顺序

### 场景 A：第一次接手项目

1. `AGENTS.md`
2. `README.md`
3. `docs/frontend/routes-and-pages.md`
4. `docs/frontend/ui-structure.md`
5. `docs/frontend/mock-data-schema.md`
6. `docs/frontend/handoff.md`
7. `docs/frontend/docs-index.md`

### 场景 B：准备修改代码

1. `AGENTS.md`
2. `docs/frontend/routes-and-pages.md`
3. `docs/frontend/ui-structure.md`
4. `docs/frontend/mock-data-schema.md`
5. `docs/frontend/handoff.md`
6. 当前任务直接涉及的源码与测试

### 场景 C：只做历史追溯

1. `docs/frontend/docs-index.md`
2. `docs/frontend/archive/README.md`
3. `docs/frontend/archive/` 中对应历史文档

---

## 6. 文档优先级规则

如果不同文档之间出现冲突，优先按以下顺序理解和执行：

1. `AGENTS.md`
2. `README.md`
3. `docs/frontend/routes-and-pages.md`
4. `docs/frontend/ui-structure.md`
5. `docs/frontend/mock-data-schema.md`
6. `docs/frontend/handoff.md`
7. `docs/frontend/docs-index.md`
8. `docs/frontend/frontend-task-board.md`
9. `docs/frontend/archive/*`

---

## 7. 当前最容易搞错的地方

### 7.1 把旧 `/orders` 当成当前入口

错误理解：
- `/orders` 仍是当前订单中心、商品任务中心主入口或兼容入口

正确理解：
- 当前主入口是 `/order-lines`
- 新建购买记录是 `/purchases/new`
- 购买记录详情是 `/purchases/:purchaseId`
- legacy `/orders` runtime 模块已删除

### 7.2 把 TransactionRecord 当成当前主模型

错误理解：
- 当前归组对象仍叫 `TransactionRecord`

正确理解：
- 当前归组对象是 `Purchase`
- `TransactionRecord` 只能作为兼容别名或历史文档语境出现

### 7.3 把 OrderLine 写回旧商品任务中心口径

错误理解：
- `OrderLine` 应回退为旧订单商品结构

正确理解：
- `OrderLine` 是当前系统主操作对象
- 销售可以独立推进状态、设计、委外、生产、物流和售后

---

## 8. 本文档总结

当前文档区只保留 Purchase + OrderLine 主线作为执行依据。

`docs/frontend/archive/` 中的文档用于理解项目演进历史，不用于指导当前新增代码、页面命名或路由入口。
