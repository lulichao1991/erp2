# Frontend Task Board

## 当前阶段

当前阶段是 **OrderLine workflow foundation 收口**。

已经完成 legacy `/orders` 删除，当前主线只围绕：

```text
Customer -> Purchase -> OrderLine -> Product
```

本任务板只记录后续需要做的事，不再保留历史流水账。

## 已完成基线

- `/order-lines` 销售中心：一行一件商品。
- `/purchases/new` 新建购买记录：输出 `purchaseDraft + orderLineDrafts`。
- `/purchases/:purchaseId` 购买记录详情：归组展示一次购买下的多条销售。
- `/products` 款式管理：维护模板、规格、固定加价规则、文件和版本。
- `/customers` 客户中心：按当前 Purchase / OrderLine / AfterSales 聚合。
- `/production-follow-up`：跟单生产推进视图。
- `/design-modeling`：设计 / 建模工作台。
- `/factory`：工厂协同中心。
- `/finance`：财务中心。
- `/inventory`：库存资产台账。
- `/management`：管理看板。
- `/production-plan`：生产计划。
- 文档一致性测试、dead-code 检查和主 smoke test 已接入。

## 当前必须保持

- `OrderLine.lineStatus` 是主工作流状态。
- `OrderLine.status` 已删除。
- 货号使用 `productionTaskNo`。
- 来源款式编码来自 `Product.code`。
- 系统参考报价使用 `quote.systemQuote`。
- 销售成交金额使用 `lineSalesAmount`。
- 物流、售后默认关联 `orderLineId`。
- `/orders` 不可恢复。

## 待办

| 优先级 | 任务 | 验收 |
|---|---|---|
| P0 | 文档改动门禁 | 路由、类型、mock、核心字段变更时同步更新文档并跑 `npm test` |
| P1 | 拆分 `src/components/business/orderLine/index.tsx` | 抽出列表、详情抽屉、表单区块；不改变页面行为 |
| P1 | 收敛生产/设计旧子状态命名 | 明确哪些旧子字段仍需要，删除不再使用的 fallback |
| P1 | 补齐购买记录创建后的销售样例说明 | 同一次购买多销售、多状态、多物流、多售后路径文档可追踪 |
| P2 | 整理真实接口前字段契约 | 输出前端字段契约，不写后端实现 |
| P2 | 评估产品平台店铺信息归属 | 当前 mock 在产品扩展区，后续决定是否进入正式 Product 类型 |

## 暂不做

- 真实后端接口。
- 真实权限鉴权。
- 真实文件上传。
- 报价审批流。
- 复杂 BI。
- 完整工厂门户。
- 小程序端。

## 每次改动检查清单

- 是否仍以 `OrderLine` 为单件执行对象。
- 是否避免恢复 `/orders`、`OrderItem`、`TransactionRecord`。
- 是否同步更新 `mock-data-schema.md`、`routes-and-pages.md` 或 `ui-structure.md`。
- 是否跑过 `npm test`。
- 如涉及构建或依赖，是否跑过 `npm run build` / `npm run analyze:dead`。
