# Docs Index（前端文档索引）

## 1. 文档定位

本文档用于说明 `docs/frontend` 目录中当前文档的阅读顺序和边界。

当前项目主线已经统一为：

```text
Customer -> Purchase -> OrderLine -> Product
```

当前主入口为：

- `/`
- `/order-lines`
- `/purchases/new`
- `/purchases/:purchaseId`
- `/products`
- `/customers`
- `/customers/:customerId`
- `/tasks`
- `/tasks/:taskId`
- `/production-follow-up`
- `/design-modeling`
- `/factory`
- `/finance`
- `/inventory`
- `/management`
- `/production-plan`
- `/production-plan/:taskId`

legacy `/orders` 模块已经删除，不再作为当前主入口、兼容入口或当前主文档口径。

---

## 2. 当前主文档

第一次接手项目、准备继续清理或准备修改代码时，优先阅读以下文档。若文档之间发生冲突，按本列表顺序理解。

1. `AGENTS.md`

作用：
- 定义项目业务口径与 AI coding 行为规则
- 定义当前主线对象与禁止事项
- 明确 legacy `/orders` 已删除

2. `docs/frontend/handoff.md`

作用：
- 记录当前阶段共识、最新交接信息和历史推进背景
- 若早期段落与当前主线冲突，以开头“当前阶段定位”为准

3. `docs/frontend/mock-data-schema.md`

作用：
- 定义 `Customer / Purchase / OrderLine / ProductSnapshot / InventoryItem` 等当前主对象
- 明确当前 mock 主线为 `purchases.ts + order-lines.ts`

4. `docs/frontend/routes-and-pages.md`

作用：
- 定义当前主路由与页面职责
- 明确 `/order-lines`、`/purchases/*` 和各角色工作台的主入口地位
- 明确 legacy `/orders` 已删除，当前页面只围绕 `Purchase + OrderLine`

5. `docs/frontend/ui-structure.md`

作用：
- 定义销售中心、购买记录新建页、购买记录详情页和产品页的 UI 结构
- 约束页面信息层级和对象边界

6. `README.md`

作用：
- 提供项目概览、运行方式和当前主线说明
- 作为新成员快速进入项目的入口

7. `docs/frontend/frontend-task-board.md`

作用：
- 记录已完成能力、暂停项和后续清理任务
- 如与当前主文档冲突，以 `AGENTS.md`、`handoff.md` 和当前 schema / routes 文档为准

8. `docs/frontend/docs-index.md`

作用：
- 说明当前主文档边界

---

## 3. 任务板与历史执行记录

以下文档仍保留在 `docs/frontend` 根目录，用于记录已完成能力、暂停项和后续边界。

1. `docs/frontend/frontend-task-board.md`

保留原因：
- 记录 Purchase + OrderLine 主线已完成页面与能力
- 记录当前 mock v1 与真实后端 / 真实权限 / 真实文件上传之间的边界

阅读规则：
- 可作为任务追溯和能力清单阅读
- 如与 `AGENTS.md`、`handoff.md`、`mock-data-schema.md` 或 `routes-and-pages.md` 冲突，以这些当前主文档为准

---

## 4. 已删除的历史文档

旧 `/orders`、旧订单单件模型、旧订单中心和早期 Phase 2 口径的归档文档已经从当前工作区删除。

如需追溯旧实现或旧方案，只能通过 git 历史查看；当前新增代码、页面命名和路由入口只以本文档列出的 current 文档为准。

---

## 5. 推荐阅读顺序

### 场景 A：第一次接手项目

1. `AGENTS.md`
2. `docs/frontend/handoff.md`
3. `docs/frontend/mock-data-schema.md`
4. `docs/frontend/routes-and-pages.md`
5. `docs/frontend/ui-structure.md`
6. `README.md`
7. `docs/frontend/docs-index.md`

### 场景 B：准备修改代码

1. `AGENTS.md`
2. `docs/frontend/handoff.md`
3. `docs/frontend/mock-data-schema.md`
4. `docs/frontend/routes-and-pages.md`
5. `docs/frontend/ui-structure.md`
6. 当前任务直接涉及的源码与测试

### 场景 C：只做历史追溯

使用 git 历史查看已删除的旧方案文档；当前工作区不再保留旧 `/orders` 或旧订单单件模型方案正文。

---

## 6. 文档优先级规则

如果不同文档之间出现冲突，优先按以下顺序理解和执行：

1. `AGENTS.md`
2. `docs/frontend/handoff.md`
3. `docs/frontend/mock-data-schema.md`
4. `docs/frontend/routes-and-pages.md`
5. `docs/frontend/ui-structure.md`
6. `README.md`
7. `docs/frontend/docs-index.md`
8. `docs/frontend/frontend-task-board.md`

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

### 7.2 使用旧交易记录命名

错误理解：
- 当前归组对象仍使用旧交易记录命名

正确理解：
- 当前归组对象是 `Purchase`

### 7.3 把 OrderLine 写回旧商品任务中心口径

错误理解：
- `OrderLine` 应回退为旧订单商品结构

正确理解：
- `OrderLine` 是当前系统主操作对象
- 销售可以独立推进状态、设计、委外、生产、物流和售后

---

## 8. 本文档总结

当前文档区只保留 Purchase + OrderLine 主线作为执行依据。

旧 `/orders` 和旧订单单件模型方案正文不再保留在当前文档区。
