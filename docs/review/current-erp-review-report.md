# Current ERP Review Report

生成日期：2026-05-06  
Review 范围：`src/app/router/`、`src/pages/`、`src/components/`、`src/features/`、`src/types/`、`src/services/`、`src/mocks/`、`src/lib/`、`docs/`、`README.md`、`AGENTS.md`、`package.json`

## 1. 总体结论

当前项目主方向正确，runtime 已稳定围绕 `Purchase + OrderLine`：`Purchase` 做购买记录和归组，`OrderLine` 做单件销售、生产任务和主 workflow。legacy `/orders` 没有重新进入路由、导航、类型、mock 或 service。

项目可以继续进入下一阶段，但不建议直接接真实后端。下一阶段应先做一次“数据契约 + mock 闭环”PR：修正工厂回传到财务的状态口径、把库存状态纳入共享 mock state、补齐端到端完成样例和接口前必填字段矩阵。

验证结果：

- `npm test`：通过，24 个测试文件，187 个测试。
- `npm run build`：通过；Vite 提示主 bundle `551.21 kB`，后续可按页面做 code splitting。
- `npm run analyze:dead`：通过，无输出。

## 2. Blocking 问题

### B1. 工厂回传把财务状态强制写成 `not_required`

文件：`src/pages/factory/FactoryTaskCenterPage.tsx:182-185`、`src/services/orderLine/orderLineWorkflow.ts:327-346`

工厂提交回传时页面直接写入 `financeStatus: 'not_required'`。随后跟单在 `approveFactoryReturn()` 中看到 `not_required` 会把销售推进到 `ready_to_ship`，跳过 `pending_finance_confirmation`。

影响：工厂页面越权决定财务是否需要确认，会阻断“工厂回传 -> 跟单审核 -> 财务确认 -> 发货”的闭环，下一阶段做真实工厂协同和财务确认前必须修。

修复建议：工厂提交只写 `productionData`、`productionInfo.feedbackStatus`、`factoryStatus` 等回传字段；是否进入财务由跟单审核或财务规则决定。至少应避免在工厂页面写 `financeStatus`。

### B2. 仓库页和财务页使用不同库存状态源

文件：`src/pages/inventory/InventoryListPage.tsx:192-194`、`src/pages/finance/FinanceCenterPage.tsx:104`、`src/pages/finance/FinanceCenterPage.tsx:274-282`

仓库页把 `inventoryItems/movements/batches` 放在页面本地 state 中，财务页仍读取静态 `inventoryItemsMock/inventoryMovementsMock`。库管在前端登记入库、出库或 FIFO 领用后，财务成本卡不会反映这些操作。

影响：当前 mock 难以验证“仓库出库 -> FIFO 成本 -> 财务核算”的真实闭环，也不适合作为下一阶段 seed data 和 API contract 的依据。

修复建议：将库存三类数据纳入 `useAppData` 或独立共享 mock store，让仓库操作和财务成本卡读取同一状态；同时补一条仓库流转后财务成本变化的测试。

## 3. High Priority 问题

### H1. 真实数据库前缺少必填字段契约矩阵

文件：`src/types/order-line.ts:119-238`、`src/types/purchase.ts:82-104`、`docs/frontend/interface-readiness.md`

`OrderLine` 能承载完整生命周期，但大量业务字段是 optional。前端 mock 阶段可接受，映射 PostgreSQL / Prisma 前需要明确哪些字段在 create、客服确认、跟单下发、工厂回传、财务确认时必须存在。

建议：在 `docs/frontend/interface-readiness.md` 补“阶段动作 -> 必填字段 -> 后端候选字段名 -> 默认值策略”矩阵，不直接写 API adapter。

### H2. `ProductVariant / FactoryFeedback / FinanceRecord / User` 仍是隐式模型

涉及文件：`src/types/product.ts:20-42`、`src/types/order-line.ts:83-117`、`src/types/finance.ts:7-21`、`src/types/task.ts:7-16`

当前替代关系基本合理：`ProductSpecRow + ProductPriceRule` 承载 ProductVariant 能力，`OrderLine.productionData/productionInfo` 承载 FactoryFeedback，`FinancePaymentRecord + OrderLine.finance*` 承载财务流水和确认结果。但这些不是独立实体，后续真实数据库设计时需要先决定是否拆表。

建议：下一阶段先写字段契约评审，不急于新增类型；如果要拆表，优先从 `User` 和 `FactoryFeedback` 开始，因为它们会影响权限、审计和工厂协同。

### H3. mock 缺少若干端到端和边界场景

涉及文件：`src/mocks/order-lines.ts`、`src/mocks/purchases.ts`、`src/mocks/inventory.ts`、`src/mocks/supporting-records.ts`

当前 mock 有 3 个 Purchase、11 条 OrderLine，已覆盖多商品、多状态、全定制、现货、工厂待接收、生产阻塞、完工待审核、库存出库、旧金抵扣和单件售后。但仍缺：

- `lineStatus: 'completed'` 的完整闭环销售。
- `purchaseType: 'internal'` 的内部订单 / 新品研发样例。
- `InventoryItem.status: 'scrapped'` 的报废样例。
- `LogisticsRecord.logisticsType` 为 `measurement_tool / after_sales / other` 的物流样例。
- `financeStatus: 'abnormal'` 的财务异常样例。
- `Purchase.aggregateStatus: 'cancelled'` 的取消样例。

建议：先补最小 seed 场景，不要扩展成复杂 BI 或后端报表。

### H4. 角色能力是导航和动作层 mock，尚不是页面级信息隔离

文件：`src/app/layout/AppSidebar.tsx:60-63`、`src/services/access/roleCapabilities.ts:156-163`

`canViewRoute` 当前只用于侧边栏过滤，直接访问 URL 不会被路由层阻止；`canViewField` 只在测试中使用，页面没有统一字段级渲染守卫。工厂页本身没有展示客户联系方式或价格，当前 mock 演示可接受，但真实协同前不能把它当安全边界。

建议：真实后端前继续保留“前端 mock role capability”定位；工厂、财务、仓库页面若要给外部角色使用，需要新增页面级字段过滤测试。

## 4. Medium Priority 问题

### M1. 超长文件会降低后续 AI Coding 稳定性

当前最大文件：

- `src/components/business/product/index.tsx`：1470 行。
- `src/components/business/purchase/index.tsx`：1293 行。
- `src/mocks/order-lines.ts`：867 行。
- `src/services/orderLine/orderLineWorkspace.ts`：824 行。
- `src/pages/inventory/InventoryListPage.tsx`：819 行。
- `src/services/inventory/inventorySelectors.ts`：682 行。
- `src/pages/finance/FinanceCenterPage.tsx`：603 行。

建议按业务子区块拆，不做全项目重构。优先拆 `purchase/index.tsx` 的草稿类型/持久化 helper/表单区块，以及 `product/index.tsx` 的展示区和编辑区。

### M2. 组件测试覆盖仍偏弱

测试主要集中在 services、router smoke、少量 page current-only 测试。`src/components/business/` 下没有独立组件测试；对大型表单和详情抽屉的回归依赖 router smoke。

建议：先补 `PurchaseCreate` 多商品引用款式与报价、`OrderLineDetailDrawer` 物流/售后单件隔离、`InventoryListPage` 流转影响成本这三个高价值测试。

### M3. `/purchases` 不是 Purchase 列表，而是重定向

文件：`src/app/router/index.tsx:31`

这符合当前 `AGENTS.md` 主路由定义：`/purchases` 只重定向到 `/purchases/new`。如果后续 ERP 需要“购买记录列表”，应新增独立需求并同步路由文档；本轮不建议为满足通用 ERP 想象而改变。

### M4. `src/features/` 和 `src/lib/` 不存在

项目实际采用 `pages / components / services / types / mocks` 分层。当前不需要为了目录名补空结构。若未来模块继续增多，可在单个业务域先试点 feature slice。

## 5. Low Priority / 可暂缓问题

- `npm run build` 有单 chunk 体积警告，当前 demo 可接受；真实部署前再按路由 lazy load。
- 侧边栏图标使用文本符号，不是 lucide 图标；内部 demo 可暂缓，设计系统统一时再处理。
- 仓库页第一屏信息非常多，但它是高频台账页；先解决共享状态和字段契约，再优化信息密度。
- 管理看板保持摘要即可，不建议扩展成 BI。

## 6. Legacy /orders 残留检查

结论：runtime 清理干净，无阻塞残留。

证据：

- 路由中无 `/orders`：`src/app/router/index.tsx:28-50`。
- 导航中无 `/orders`：`src/app/router/routeConfig.ts:3-16`。
- current workflow guard 明确禁止 `/orders`、`OrderItem`、`TransactionRecord`、`designInfo.designStatus`、`productionInfo.factoryStatus`：`src/services/workflow/currentWorkflowGuards.test.ts:11-17`。
- 搜索命中的 `/orders` 基本都在 AGENTS、README、docs 和测试断言中，属于历史说明或禁止项。

保留的旧语义：`PurchaseTimelineRecordType` 中仍有 `'order_created'`，它是时间线字符串，不是旧订单类型或旧 route。

## 7. Purchase + OrderLine 架构检查

结论：架构方向正确。

当前关系：

```text
Customer
  -> Purchase（购买记录 / 归组）
      -> OrderLine（销售 / 单件执行对象）
          -> ProductSnapshot / QuoteResult
          -> Task / ProductionPlan
          -> LogisticsRecord / AfterSalesCase
          -> InventoryItem / InventoryMovement
          -> FinancePaymentRecord / productionData
```

已落地：

- `Purchase.orderLines` 只做归组展示，`OrderLine.lineStatus` 是主状态。
- 新建购买记录输出 `orderLineDrafts`，并为每条销售自动生成 `productionTaskNo`：`src/components/business/purchase/index.tsx:354-363`。
- 客服确认分流使用 `requiresDesign / requiresModeling`：`src/components/business/purchase/index.tsx:1026-1041`。
- 生产计划从 `Task + Purchase + OrderLine + Product` 生成：`src/services/productionPlan/productionPlanAdapter.ts:266-294`。
- 物流和售后类型要求 `orderLineId`：`src/types/supporting-records.ts:7-39`。

主要断点：工厂页面当前会写 `financeStatus: 'not_required'`，破坏工厂到财务的职责边界。

## 8. 数据模型检查

总体评价：类型集中、语义清晰，可以作为真实数据库设计起点，但还不能直接映射成数据库 schema。

模型评价：

- `Purchase`：字段覆盖购买编号、平台号、渠道、客户、收货、付款摘要、风险标签、聚合状态和时间线，职责正确。
- `OrderLine`：覆盖商品信息、产品引用、货号、规格、设计/建模/生产/工厂/财务状态、回传数据、报价和成本字段，能支撑主生命周期。
- `Product`：通过 `ProductSpecRow`、`ProductPriceRule`、assets、referenceRecords 支撑款式模板和报价规则；尚无显式 `ProductVariant` 类型。
- `ProductionPlan`：是基于 `OrderLine + Task` 的 view model，不是独立 mock 实体，符合当前前端阶段。
- `InventoryItem`：可追溯 `productId / purchaseId / orderLineId / customerId`，并通过 movement/batch 支撑 FIFO。
- `FinancePaymentRecord`：以 `orderLineId` 为权威收退款流水，方向正确。
- `User / Permission`：尚未建模；目前只有 `TaskAssigneeRole` 和 `roleCapabilities`。

字段命名问题：

- `PurchaseType` 和 `PurchaseSourceChannel` 仍带 `| string`：`src/types/purchase.ts:12-26`。这对接真实 API 时会削弱枚举校验。
- `OrderLineLog.actionType/fromStatus/toStatus` 允许 `| string`：`src/types/order-line.ts:74-82`。日志可容忍扩展，但接口前需约定扩展策略。

未来数据库风险：

- `Purchase.orderLines: OrderLine[]` 在真实后端应改为关系查询，不应作为 Purchase 表内嵌 JSON。
- `Product.specs`、`priceRules`、assets 当前适合前端 mock，数据库中大概率需要子表或 JSONB 策略评审。
- 财务确认结果分散在 `OrderLine.finance*` 和 `FinancePaymentRecord`，接真实数据库前要明确“确认记录”是否独立建表。

## 9. Mock 数据检查

总体评价：mock 已超过普通页面假数据，能模拟多条销售独立推进和跨表关联；但还缺完整闭环和少数边界样例。

已覆盖：

- 一个 Purchase 下多条 OrderLine：`src/mocks/purchases.ts:11-96`，张三购买记录关联 8 条销售。
- 同一 Purchase 下多状态：生产中、待财务、待设计、待建模、待跟单审核、阻塞、待工厂接收、完工待审核。
- 需要设计、建模、出蜡：`src/mocks/order-lines.ts:239-387`、`src/mocks/order-lines.ts:630-772`。
- 工厂待接收、生产中、已回传：`src/mocks/order-lines.ts:30-237`、`src/mocks/order-lines.ts:486-628`。
- 库存入库、占用、出库、FIFO batch：`src/mocks/inventory.ts:151-360`。
- 商品行收退款、旧金抵扣、退款原因缺失风险：`src/mocks/finance-payment-records.ts:3-113`。
- 单件售后：`src/mocks/supporting-records.ts:29-41`。

缺口：

- 无 `completed` 销售，无完整“签收后完成”样例。
- 无内部订单 / 新品研发购买记录。
- 无财务异常样例。
- 无报废库存样例。
- 物流类型只覆盖 `goods`，未覆盖测量工具、售后物流、其他物流。

是否适合作为 seed data：可以作为初版 seed 基础，但必须先补上述场景，并把本地页面 state 合并为统一 seed 状态源。

## 10. 页面与路由检查

结论：页面结构基本合理，主路由与 AGENTS 对齐。

当前路由：

- `/` 工作台。
- `/order-lines` 销售中心。
- `/order-lines/:orderLineId` 销售详情。
- `/purchases` 重定向到 `/purchases/new`。
- `/purchases/new` 新建购买记录。
- `/purchases/:purchaseId` 购买记录详情。
- `/customers`、`/customers/:customerId`。
- `/tasks`、`/tasks/:taskId`。
- `/production-follow-up`、`/design-modeling`、`/factory`、`/finance`、`/inventory`、`/management`、`/production-plan`、`/production-plan/:taskId`。
- `/products`、`/products/new`、`/products/:productId`、`/products/:productId/edit`。

缺失页面：

- 按当前 AGENTS，不缺 Purchase 列表；`/purchases` 重定向是设计选择。
- 若进入真实运营，可新增 Purchase 列表，但应定位为归组查询页，不替代销售中心。

职责混乱页面：

- `FactoryTaskCenterPage` 职责接近正确，但不应写财务状态。
- `FinanceCenterPage` 职责正确，但库存成本输入源不应是静态 mock。

建议暂缓：

- 不新增复杂管理 BI。
- 不恢复 `/orders`。
- 不把任务中心改成主状态推进页面。

## 11. 仓库模块专项检查

结论：仓库模块业务定位正确，可继续扩展；最大问题是状态源未共享。

已具备：

- `InventoryItem` 支持关联 `OrderLine / Purchase / Product / Customer`：`src/types/inventory.ts:33-60`。
- `InventoryMovement` 支持入库、占用、释放、出库、报废、调整：`src/types/inventory.ts:9`。
- 支持 FIFO batch：`src/types/inventory.ts:12-31`。
- 页面支持入库、库存流转、质检处置、盘点、流转记录筛选：`src/pages/inventory/InventoryListPage.tsx:289-439`、`src/pages/inventory/InventoryListPage.tsx:566-815`。
- 仓库操作不推进销售状态，符合边界。

缺失字段 / 场景：

- `InventoryItem` 自身没有物流类别和物流单号；物流目前在 `LogisticsRecord`。如果仓库要处理发货台账，需要建立与 `LogisticsRecord` 的页面关联。
- mock 没有 `scrapped` 库存。
- 没有测量工具物流和售后物流样例。
- 与财务成本卡的联动没有共享状态。

页面体验：

- 信息密度高但符合库管台账；建议先把快捷视图、筛选、表格和操作表单拆成子组件，再谈视觉优化。

## 12. UI / UX 检查

总体评价：当前 UI 更像内部工作台而不是营销页，方向正确。多数核心页面第一屏能看到计数、状态和操作入口，适合内部员工扫描。

页面判断：

- 工作台：面向全员/管理，适合做待办和风险摘要；不应替代业务主页面。
- 新建 Purchase：面向客服，能在同页创建购买记录和多条销售草稿；核心价值是多商品拆行和产品引用报价，当前已具备。
- OrderLine 列表：面向客服、跟单、库管、管理，信息密度合理；应继续强化货号、状态、客户 ID 和异常。
- Product 列表/详情：面向产品维护，功能丰富但组件过长；后续增强 ProductVariant 前先拆文件。
- Task 中心：面向协作提醒，定位正确；不应承接主流程推进。
- ProductionPlan：面向生产计划/跟单，基于 OrderLine 生成视图，方向正确。
- Warehouse：面向库管，第一屏信息多但可用；应优先解决共享状态。
- Factory：面向工厂，未展示客户隐私和销售价格；回传表单符合工厂场景。
- Finance：面向财务，金额、成本、工厂回传、旧金和异常集中展示；应接入真实库存状态源。

优先优化页面：

1. `InventoryListPage`：拆分后改善第一屏和操作表单层级。
2. `PurchaseCreate`：拆分草稿构建和 UI，降低后续产品引用选择器改造风险。
3. `FinanceCenterPage`：让成本卡和异常处理更可测试。

## 13. 工程质量检查

总体评价：工程质量中上，类型严格，测试门禁充分，主要风险是文件膨胀和跨模块共享状态不完整。

正向结论：

- TypeScript `strict: true`：`tsconfig.app.json`。
- `rg "\bany\b|console\.|debugger"` 未发现生产代码 `any`、`console`、`debugger` 残留。
- 当前 workflow guard、mock schema、router smoke、service 单测覆盖较强。
- knip 无 dead code 输出。

高优先工程问题：

- 工厂页、财务页、仓库页都有页面内业务 mutation，下一阶段需要把关键动作沉到 service 并加测试。
- `orderLineWorkspace.ts` 同时承载详情工作区、物流、售后和状态处理，后续可拆为 sidecar record helpers 与 workspace state helpers。
- 大型业务组件不利于 AI 增量修改，建议按 PR 逐个拆。

建议补测试位置：

- `src/pages/factory/FactoryTaskCenterPage.tsx`：工厂提交回传不得写财务状态。
- `src/pages/finance/FinanceCenterPage.tsx` 或 service：库存出库后成本卡变化。
- `src/components/business/purchase/index.tsx`：多销售草稿引用产品、规格报价和金额分摊。

## 14. 文档一致性检查

总体一致。

一致点：

- README、AGENTS、handoff、interface-readiness 都强调 `OrderLine` 为主操作对象，不恢复 `/orders`。
- `docs/frontend/routes-and-pages.md` 与当前路由基本一致。
- `docs/frontend/mock-data-schema.md` 已通过测试与 mock/type 文件结构对齐。
- `docs/frontend/interface-readiness.md` 已明确真实接口前必须映射 current model。

需要补的文档：

- 工厂回传到财务确认的职责边界，需要在 `interface-readiness.md` 写清：工厂不写 `financeStatus`。
- 库存状态源和财务成本卡关系需要补 contract：FIFO 成本来自共享 `InventoryMovement`。
- 如果后续新增 Purchase 列表，需要同步 `routes-and-pages.md`、`ui-structure.md`、`handoff.md`。

## 15. 建议的后续 PR 顺序

## 建议 PR1：数据模型与 mock 对齐

目标：
- 修正工厂回传不应写 `financeStatus`。
- 把库存 items/movements/batches 提升到共享 mock state。
- 补 completed、internal、scrapped、财务异常、测量工具/售后物流 mock。

涉及文件：
- `src/pages/factory/FactoryTaskCenterPage.tsx`
- `src/hooks/useAppData.tsx`
- `src/mocks/*`
- `docs/frontend/interface-readiness.md`

不要做：
- 不接真实后端。
- 不恢复 `/orders`。
- 不重写仓库模块。

验收标准：
- 工厂回传后跟单审核能进入财务确认。
- 仓库出库会影响财务成本卡。
- `npm test` 和 `npm run build` 通过。

## 建议 PR2：Product / ProductVariant 产品管理增强

目标：
- 明确 `ProductSpecRow` 是否就是当前阶段 ProductVariant。
- 补材质、尺寸、工艺、价格规则的接口前字段契约。

涉及文件：
- `src/types/product.ts`
- `src/components/business/product/index.tsx`
- `docs/frontend/mock-data-schema.md`

不要做：
- 不推翻现有 Product 模块。

验收标准：
- 戒指和吊坠报价样例继续通过。
- 文档说明 ProductVariant 映射策略。

## 建议 PR3：产品引用选择器接入 Purchase 新建流程

目标：
- 在现有 select 基础上增强搜索、筛选和来源快照确认。
- 保持输出 `orderLineDrafts`。

涉及文件：
- `src/components/business/purchase/index.tsx`
- `src/components/business/sourceProduct/index.tsx`

不要做：
- 不新增复杂审批。

验收标准：
- 选择款式后自动带出规格、材质、工艺和系统参考报价。

## 建议 PR4：OrderLine 详情页完善

目标：
- 让 `/order-lines/:orderLineId` 不只是 drawer 包装，补强单件销售详情的信息结构。
- 保留销售中心 drawer 的快速操作。

涉及文件：
- `src/pages/orderLines/OrderLineDetailPage.tsx`
- `src/components/business/orderLine/*`

不要做：
- 不恢复旧订单时间线。

验收标准：
- 单件销售能查看状态、物流、售后、设计建模、生产、工厂回传和财务摘要。

## 建议 PR5：Factory 工厂协同中心

目标：
- 修正回传字段边界。
- 增加工厂回传必填校验和异常回退测试。

涉及文件：
- `src/pages/factory/FactoryTaskCenterPage.tsx`
- `src/services/orderLine/orderLineFactory.ts`
- `src/services/orderLine/orderLineWorkflow.ts`

不要做：
- 不展示客户联系方式、地址、销售价格、定金、尾款、利润或财务备注。

验收标准：
- 工厂只能处理接收、生产、回传和异常。

## 建议 PR6：Finance 财务确认基础

目标：
- 统一收退款、旧金、FIFO、工厂结算和异常解除。
- 从共享库存 state 读取成本。

涉及文件：
- `src/pages/finance/FinanceCenterPage.tsx`
- `src/services/orderLine/orderLineFinance.ts`
- `src/types/finance.ts`

不要做：
- 不推进设计、建模或生产字段。

验收标准：
- 财务确认后进入 `ready_to_ship`，锁定后只读。

## 建议 PR7：API service 抽象，为未来真实后端做准备

目标：
- 在字段契约冻结后增加薄 service boundary。
- 保持 mock adapter 与 future API adapter 同契约。

涉及文件：
- `src/services/*`
- `docs/frontend/interface-readiness.md`

不要做：
- 不直接连接数据库。
- 不把 API 字段倒逼回 legacy order 模型。

验收标准：
- current mock 仍可运行；接口契约文档明确后端字段映射。

## 16. 下一阶段开发建议

1. 本次 Review 是否建议继续开发下一阶段：建议继续，但先做 PR1。
2. 下一阶段最应该先做哪一个 PR：PR1“数据模型与 mock 对齐”，尤其是工厂回传财务状态和库存共享 state。
3. 哪些问题必须先修再继续：B1 工厂写财务状态、B2 仓库和财务库存状态源不一致。
4. 哪些问题可以边开发边修：大组件拆分、组件测试补齐、bundle code splitting、Purchase 列表是否新增。
5. 当前项目是否已经适合开始设计真实数据库：适合开始字段评审和 ERD 草案；不适合直接冻结 schema。
6. 当前项目是否已经适合接入真实后端：暂不适合。需要先完成接口字段契约、必填字段矩阵、mock seed 补齐和关键跨模块状态修复。
