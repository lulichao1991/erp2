# Mock 数据结构（Current Workflow）

## 目标
本文件只记录当前前端 mock 所需的对象边界和字段语义。历史 Phase 1 / Phase 2 规划在 `docs/frontend/archive/`，不作为当前 mock 依据。

当前对象关系：

```text
Customer
  -> Purchase
    -> OrderLine
      -> ProductSnapshot
      -> LogisticsRecord / AfterSalesCase / QuoteResult
```

## 使用原则
- 先 mock 跑通 UI 和状态流转，再接真实接口。
- `OrderLine` 是主操作对象；不要把单件执行字段塞回 `Purchase`。
- `Product` 是模板；商品行引用产品后保存 `ProductSnapshot`。
- 物流、售后默认关联 `orderLineId`。
- `OrderLine.lineStatus` 是工作流主状态；`status` 只作短期兼容展示。

## Customer
客户主档，用于沉淀长期客户信息、历史购买记录、历史商品行和售后摘要。

建议字段：
- `id`
- `name`
- `phone`
- `wechat`
- `email`
- `tags`
- `notes`
- `purchaseIds`
- `orderLineIds`
- `afterSalesCaseIds`
- `createdAt`
- `updatedAt`

## Purchase
购买记录，一次购买行为的公共信息容器。

建议字段：
- `id`
- `purchaseNo`
- `platform`
- `platformOrderNo`
- `customerId`
- `customerSnapshot`
- `receiver`
- `paidAt`
- `paymentSummary`
- `finance`
- `remark`
- `aggregateStatus`
- `orderLineIds`
- `createdAt`
- `updatedAt`

不要放入单件商品执行字段，例如设计状态、建模状态、工厂状态、单件发货状态或单件售后状态。

## OrderLine
商品行，一件商品对应一条独立执行对象。

基础字段：
- `id`
- `lineNo`
- `purchaseId`
- `customerId`
- `productId`
- `productSnapshot`
- `productName`
- `category`
- `sku`
- `styleCode`
- `version`
- `quantity`

需求与报价：
- `selectedSpecId`
- `selectedSpecLabel`
- `actualMaterial`
- `actualSize`
- `actualCraft`
- `engraving`
- `specialRequirements`
- `quote`
- `finalPrice`

工作流：
- `lineStatus`
- `status`（短期兼容展示）
- `requiresDesign`
- `requiresModeling`
- `designStatus`
- `modelingStatus`
- `productionStatus`
- `factoryStatus`
- `financeStatus`

执行信息：
- `ownerId`
- `designerId`
- `modelerId`
- `merchandiserId`
- `factoryId`
- `customerConfirmedAt`
- `plannedDueDate`
- `factoryPlannedDueDate`
- `productionData`
- `files`
- `notes`
- `createdAt`
- `updatedAt`

客服确认分流：

```text
requiresDesign -> pending_design
requiresModeling -> pending_modeling
otherwise -> pending_merchandiser_review
```

## Product
产品模板，用于维护标准资料、规格明细、价格规则、定制规则、生产参考和文件资料。

建议字段：
- `id`
- `name`
- `category`
- `sku`
- `styleCode`
- `version`
- `status`
- `baseMaterial`
- `defaultCraft`
- `specMode`
- `specs`
- `priceRules`
- `customizationRules`
- `productionReference`
- `files`
- `createdAt`
- `updatedAt`

`Product` 不直接进入生产、设计、物流或售后流转。

## ProductSnapshot
商品行引用产品时保存的来源快照。

建议字段：
- `productId`
- `productName`
- `sku`
- `styleCode`
- `version`
- `category`
- `baseMaterial`
- `defaultCraft`
- `specs`
- `priceRules`
- `capturedAt`

## QuoteResult
系统参考报价结果。

首轮公式固定为：

```text
系统参考报价 = 规格基础价 + 所有生效固定加价之和
```

建议字段：
- `basePrice`
- `adjustments`
- `total`
- `warnings`
- `calculatedAt`

首轮至少提示：
- 未选规格
- 当前规格没有基础价格
- 当前附加项没有对应价格规则

## LogisticsRecord
物流记录默认关联商品行。

建议字段：
- `id`
- `purchaseId`
- `orderLineId`
- `carrier`
- `trackingNo`
- `status`
- `shippedAt`
- `deliveredAt`
- `notes`

## AfterSalesCase
售后记录默认关联商品行。

建议字段：
- `id`
- `purchaseId`
- `orderLineId`
- `caseNo`
- `type`
- `status`
- `reason`
- `resolution`
- `createdAt`
- `updatedAt`

## Mock 文件建议
```text
src/
  types/
    customer.ts
    purchase.ts
    order-line.ts
    product.ts
    quote.ts
    supporting-records.ts
    transaction.ts
  mocks/
    customers.ts
    purchases.ts
    order-lines.ts
    products.ts
    supporting-records.ts
    transactions.ts
```

兼容说明：
- `transaction.ts` / `transactions.ts` 只能作为 `Purchase` 的历史兼容别名。
- 不恢复 `src/mocks/orders.ts` 或 `src/types/order.ts`。
- `SourceProductSnapshot` 只能作为 `ProductSnapshot` 的历史兼容命名。

## 必须覆盖的样例
1. 同一次购买，多件商品，多条商品行。
2. 戒指选择规格后自动带出参数、基础价、固定加价和系统参考报价。
3. 吊坠选择规格后自动带出参数、基础价、固定加价和系统参考报价。
4. 同一次购买中多件商品分开发货。
5. 同一次购买中只有一件商品进入售后。

## 验收标准
- 商品行中心显示的是 `OrderLine` 列表。
- 购买记录详情页能展示同一 `Purchase` 下的多条 `OrderLine`。
- 生产、设计 / 建模、工厂、财务视图不读取旧订单模型。
- 物流和售后可以按商品行独立展示。
- 报价样例能稳定产出系统参考报价。
