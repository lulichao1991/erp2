# Docs Index

## 文档目的

`docs/frontend` 只保留当前项目可执行口径，不再保存旧 `/orders` 方案正文或历史流水账。

当前主线：

```text
Customer -> Purchase -> OrderLine -> Product
```

## 阅读顺序

1. `AGENTS.md`
2. `docs/frontend/handoff.md`
3. `docs/frontend/mock-data-schema.md`
4. `docs/frontend/routes-and-pages.md`
5. `docs/frontend/ui-structure.md`
6. `docs/frontend/frontend-task-board.md`
7. `README.md`

若文档冲突，按上面顺序理解。

## 当前文档

| 文档 | 用途 |
|---|---|
| `handoff.md` | 当前交接结论、边界和下一步 |
| `mock-data-schema.md` | 当前类型、mock 文件和字段规则 |
| `routes-and-pages.md` | 当前路由和页面职责 |
| `ui-structure.md` | 当前页面信息层级 |
| `frontend-task-board.md` | 剩余计划和改动检查清单 |

## 已删除内容

以下内容不再保留在当前文档区：

- legacy `/orders` 方案正文。
- 旧订单单件模型方案。
- 早期 Phase 2 长篇计划。
- 旧归档目录 `docs/frontend/archive/*`。
- `docs/frontend/legacy-orders-removal-plan.md`。

如需追溯历史，只看 git 历史。

## 文档维护规则

- 路由变更：同步 `routes-and-pages.md`。
- 类型或 mock 文件变更：同步 `mock-data-schema.md`。
- 页面信息层级变更：同步 `ui-structure.md`。
- 阶段目标或剩余计划变更：同步 `handoff.md` 和 `frontend-task-board.md`。
- 每次文档瘦身后跑 `npm test`。
