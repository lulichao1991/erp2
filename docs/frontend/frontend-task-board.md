# Frontend Task Board

## 当前阶段

当前阶段是 **OrderLine workflow v2 delivery readiness**。

已经完成 legacy `/orders` 删除和 v1 foundation 收口，当前主线只围绕：

```text
Customer -> Purchase -> OrderLine -> Product
```

本任务板只记录后续需要做的事，不再保留历史流水账。

v2 目标：

- 固化跨页面 current workflow，不改变 `OrderLine` 主操作对象。
- 保持真实接口前字段契约、角色边界和验收样例可检查。
- 按 `v2-plan.md` 的 V2 验收矩阵复核主流程、旁路记录、接口契约和 legacy 禁止项。

## 已完成基线

- `/order-lines` 销售中心：一行一件商品。
- `/purchases/new` 新建购买记录：输出 `purchaseDraft + orderLineDrafts`。
- `/purchases/:purchaseId` 购买记录详情：归组展示一次购买下的多条销售。
- `/products` 款式管理：维护模板、规格、固定加价规则、文件和版本。
- `/customers` 客户中心：按当前 Purchase / OrderLine / AfterSales 聚合。
- `/production-follow-up`：跟单生产推进视图，包含工厂回传后的完工二次审核。
- `/design-modeling`：设计 / 建模工作台。
- `/factory`：工厂协同中心。
- `/finance`：按货号展示商品行收款、补款、退款流水、退款原因补录、补退款复核、退款原因异常一次性解除、商品行成本卡、旧金抵扣入库关联、FIFO 库存领用成本、工厂结算、成本和财务异常。
- `/inventory`：库存资产台账，包含旧金抵扣入库追溯、FIFO 批次和流转成本追溯。
- `/management`：管理看板。
- `/production-plan`：生产计划。
- 新 PRD 命名映射已归入 current model：`order -> Purchase`、`item/work_order -> OrderLine.productionTaskNo + OrderLine`、`style_template -> Product`、`payment -> FinancePaymentRecord`。
- `OrderLineQuickStats` 已从 `src/components/business/orderLine/index.tsx` 抽出，`index.tsx` 仅作为导出入口。
- 首轮 5 个样例已在交接文档中落到 current workflow。
- 真实接口前字段契约已记录在 `mock-data-schema.md`，当前不写后端实现。
- 真实接口前评审边界已记录在 `interface-readiness.md`，只定义前端契约和验收，不写 API。
- 产品平台店铺信息暂不进入正式 `Product` 类型，只保留产品扩展区 mock 展示。
- current workflow guard 已接入，防止 legacy `/orders`、旧模型名和旧状态字段回流到 runtime。
- V2.8/V2.9/V2.10 收口已接入：端到端角色链路、生产阻塞 / 恢复 / 完成动作和任务旁路门禁都有测试约束。
- V2.11/V2.12/V2.13 收口已接入：销售详情完成入口、页面动作可用性 selector 和 UI 级端到端验收都有测试约束。
- V2.14/V2.15/V2.16 收口已接入：接口契约最终动作清单、V2 验收矩阵和交付门禁都有测试约束。
- V2.17/V2.18/V2.19/V2.20 收口已接入：真实接口前评审清单、业务演示脚本、黄金链路测试和交付门禁都有测试约束。
- V2.21/V2.22/V2.23/V2.24 收口已接入：数据读写边界、Workflow Command Contract、Sidecar Record Contract 和接口替换前门禁都有测试约束。
- 文档一致性测试、dead-code 检查和主 smoke test 已接入。

## 当前必须保持

- `OrderLine.lineStatus` 是主工作流状态。
- `OrderLine.status` 已删除。
- 工厂回传完成后先停在 `factory_returned`，跟单审核通过后才进入 `pending_finance_confirmation`。
- 货号使用 `productionTaskNo`。
- 来源款式编码来自 `Product.code`。
- 系统参考报价使用 `quote.systemQuote`。
- 销售成交金额使用 `lineSalesAmount`。
- 旧金抵扣是 `FinancePaymentRecord.method = old_gold`，可关联旧金 `InventoryItem` 做入库追溯；抵扣流水本身不自动计入商品行成本，只有库存 `outbound` 并关联销售时才按 FIFO 进入成本合计。
- 库存 FIFO 成本只由关联销售的 `outbound` 出库确认；`reserve / release / adjust` 不确认成本，`scrap` 只扣批次不进入销售成本。
- 财务确认或 `financeLocked = true` 后，该货号的收退款、补齐 / 复核退款原因、工厂结算金额、财务备注和异常处理在财务页只读。
- 生产阻塞、恢复生产和完成销售必须通过 `markProductionBlocked / resumeProduction / completeOrderLine`。
- “完成销售”只允许从 `ready_to_ship` 在销售详情中显式触发；页面按钮可用性由 `getOrderLineWorkflowActionState` 收口。
- 物流签收、售后关闭、任务完成和库存动作不得自动触发 `completed`。
- 任务状态变化只做协作提醒和购买记录 timeline，不推进 `OrderLine.lineStatus`。
- 物流、售后默认关联 `orderLineId`。
- `/orders` 不可恢复。

## 已归档待办

| 优先级 | 任务 | 验收 |
|---|---|---|
| P0 | 文档改动门禁 | 已接入文档一致性测试；后续作为检查清单保持 |
| P0 | current workflow 防回归门禁 | 已接入测试，禁止旧 `/orders` runtime 和旧状态字段回流 |
| P0 | 新 PRD 命名映射 | 已归入 `mock-data-schema.md` 和 `handoff.md` |
| P1 | 拆分 `src/components/business/orderLine/index.tsx` | 已抽出 `OrderLineQuickStats`，入口仅导出 |
| P1 | 收敛生产/设计旧子状态命名 | 已明确只保留 current fallback，并用测试防止旧子字段回流 |
| P1 | 补齐购买记录创建后的销售样例说明 | 已记录 5 个首轮样例落点 |
| P2 | 整理真实接口前字段契约 | 已输出前端字段契约，不写后端实现 |
| P2 | 真实接口前评审 | 已补 `interface-readiness.md`，实现另开计划 |
| P2 | 评估产品平台店铺信息归属 | 已决定暂不正式入模，保留 mock 展示 |

## 后续只保留检查清单

- 新功能必须继续以 `OrderLine` 为单件执行对象。
- 路由、类型、mock、核心字段变更时同步更新文档。
- 接真实接口前另开接口计划，不在 mock 阶段直接写 API。
- v2 阶段建设目标变化时同步 `v2-plan.md`。
- 真实接口评审前必须复核 `interface-readiness.md` 的完整 workflow 动作清单和 V2 验收矩阵。
- 交付演示前必须按 `v2-plan.md` 的业务演示脚本跑主链路和三条旁路 golden scenarios。
- 真实 API 接入前必须复核 `interface-readiness.md` 的数据入口、主流程命令、旁路记录命令和 demo/debug 命令边界。

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
