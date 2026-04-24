~~~md
# 前端目录与文件结构草案

## 1. 文档目标
本文件用于统一首轮前端目录结构，明确：

- 页面放哪里
- 通用组件放哪里
- 业务组件放哪里
- mock 数据放哪里
- 路由相关代码放哪里
- 弹窗 / 抽屉 / 页面区块如何组织

目标是避免以下问题：

- 组件散落到处都是
- 页面和业务组件混在一起
- mock 数据和正式逻辑耦合
- 订单模块与产品模块目录风格不一致

---

## 2. 目录设计原则

### 2.1 先按“页面 / 通用 / 业务 / mock”四层分开
不要把所有组件都塞进一个 `components/` 目录里。

建议至少分成：

- 页面层
- 通用组件层
- 业务组件层
- mock 数据层

---

### 2.2 先保证可维护，不追求过度抽象
首轮不要过早做很复杂的目录拆分。  
但也不能全部平铺。

---

### 2.3 订单与产品模块保持对称
订单中心和产品管理是首轮两个核心模块，所以目录风格尽量对称，便于后续扩展。

---

## 3. 推荐目录结构

```text
src/
  app/
    layout/
      AppLayout.tsx
      AppSidebar.tsx
      AppTopbar.tsx
      AppBreadcrumb.tsx

    router/
      index.tsx
      routeConfig.ts

  pages/
    orders/
      OrderListPage.tsx
      OrderCreatePage.tsx
      OrderDetailPage.tsx

    products/
      ProductListPage.tsx
      ProductCreatePage.tsx
      ProductDetailPage.tsx
      ProductEditPage.tsx

  components/
    common/
      PageContainer.tsx
      PageHeader.tsx
      SectionCard.tsx
      SummaryCard.tsx
      InfoGrid.tsx
      InfoField.tsx
      StatusTag.tsx
      ReferenceTag.tsx
      VersionBadge.tsx
      TimePressureBadge.tsx
      EmptyState.tsx
      LargeModal.tsx
      SideDrawer.tsx
      ConfirmDialog.tsx
      Timeline.tsx

    business/
      order/
        OrderListHeader.tsx
        OrderQuickStats.tsx
        OrderFilterBar.tsx
        OrderTable.tsx
        OrderBasicInfoCell.tsx
        OrderItemSummaryCell.tsx
        OrderTimePressureCell.tsx
        OrderRowActions.tsx

        OrderHeaderBar.tsx
        OrderSummaryCard.tsx
        OrderSummaryMainInfo.tsx
        OrderSummaryTimeInfo.tsx
        OrderSummarySideInfo.tsx
        OrderInfoCardGroup.tsx

        OrderItemsSection.tsx
        OrderItemCard.tsx
        OrderItemHeader.tsx
        ProductReferenceBanner.tsx

        OrderItemSpecPricingBlock.tsx
        OrderItemSpecSelector.tsx
        OrderItemSpecSummaryGrid.tsx
        OrderItemBasePriceCard.tsx
        OrderItemPriceBreakdownList.tsx
        OrderItemQuoteSummaryCard.tsx
        OrderItemQuoteWarningAlert.tsx

        CustomerSpecBlock.tsx
        DesignInfoBlock.tsx
        OutsourceInfoBlock.tsx
        FactoryFeedbackBlock.tsx

        LogisticsSection.tsx
        AfterSalesSection.tsx
        OrderAttachmentSection.tsx
        OperationTimelineSection.tsx

      product/
        ProductListHeader.tsx
        ProductQuickStats.tsx
        ProductFilterBar.tsx
        ProductTable.tsx
        ProductImageCell.tsx
        ProductIdentityCell.tsx
        ProductPriceCell.tsx
        ProductStatusCell.tsx
        ProductReferenceCell.tsx
        ProductVersionCell.tsx
        ProductRowActions.tsx

        ProductHeaderBar.tsx
        ProductSummaryCard.tsx
        ProductGallery.tsx
        ProductIdentityInfo.tsx
        ProductAnchorNav.tsx
        ProductBasicInfoSection.tsx
        ProductParamConfigSection.tsx
        ProductPriceRuleSection.tsx
        ProductCustomRuleSection.tsx
        ProductProductionRefSection.tsx
        ProductAssetsSection.tsx

        ProductEditHeader.tsx
        ProductSaveBar.tsx
        ProductEditSideNav.tsx
        ProductBasicFormSection.tsx
        ProductParamFormSection.tsx
        ProductSpecSection.tsx
        ProductSpecTable.tsx
        ProductPriceRuleFormSection.tsx

      bridge/
        ProductPickerModal.tsx
        ProductPickerHeader.tsx
        ProductPickerSearchBar.tsx
        ProductPickerSidebarFilters.tsx
        ProductCardGrid.tsx
        ProductPickerCard.tsx
        ProductQuickPreviewPanel.tsx
        ProductPickerFooter.tsx

        SourceProductDrawer.tsx
        SourceProductDrawerHeader.tsx
        SourceProductVersionNoticeCard.tsx
        SourceProductTabs.tsx
        SourceProductDetailTab.tsx
        OrderVsProductCompareTab.tsx
        SourceProductAssetsTab.tsx
        SourceProductDrawerFooter.tsx

  hooks/
    useOrderQuote.ts
    useProductPicker.ts
    useDrawerState.ts
    useModalState.ts

  mocks/
    products.ts
    orders.ts
    quotes.ts
    index.ts

  types/
    product.ts
    order.ts
    quote.ts
    common.ts

  utils/
    quote/
      buildQuoteResult.ts
      matchPriceRules.ts
    format/
      formatPrice.ts
      formatDate.ts
    guards/
      isSpecRequired.ts

  styles/
    tokens.ts
    globals.css
~~~

------

## 4. 各目录职责说明

## 4.1 `app/layout/`

放全局后台壳相关组件。

包括：

- 侧边栏
- 顶部栏
- 面包屑
- 整体 layout

这些组件不应该混进业务组件目录。

------

## 4.2 `app/router/`

放路由配置。

建议至少包含：

- 主路由入口
- route config
- query 参数映射逻辑（如 modal / drawer）

------

## 4.3 `pages/`

只放页面级组件。

页面级组件负责：

- 组织区块
- 页面级布局
- 调用业务组件
- 读取路由参数

页面本身不要塞太多细碎渲染逻辑。

------

## 4.4 `components/common/`

放通用基础组件。

这些组件不应该写死“订单”或“产品”的业务语义。

例如：

- 卡片
- 标签
- 信息字段
- 抽屉
- 弹窗
- 空状态

------

## 4.5 `components/business/order/`

放订单中心专属业务组件。

包括：

- 订单列表相关组件
- 订单详情相关组件
- 商品卡相关组件
- 规格与报价区
- 物流 / 售后 / 附件 / 日志区块

------

## 4.6 `components/business/product/`

放产品管理专属业务组件。

包括：

- 产品列表相关组件
- 产品详情相关组件
- 产品编辑页相关组件
- 规格明细编辑区
- 加价规则编辑区

------

## 4.7 `components/business/bridge/`

放订单与产品之间的桥接组件。

首轮主要包括：

- 产品引用选择器
- 来源产品详情抽屉

这是很关键的一层，不建议混进 `order/` 或 `product/` 目录里。

------

## 4.8 `hooks/`

放前端交互相关 hooks。

首轮建议至少预留：

- `useOrderQuote`：处理订单商品自动报价计算
- `useProductPicker`：处理产品引用选择器状态
- `useDrawerState`：统一抽屉开关逻辑
- `useModalState`：统一弹窗开关逻辑

------

## 4.9 `mocks/`

放首轮所有 mock 数据。

建议拆成：

- `products.ts`
- `orders.ts`
- `quotes.ts`

不要把 mock 数据散落在页面文件里。

------

## 4.10 `types/`

放首轮稳定的数据类型定义。

建议至少拆成：

- `product.ts`
- `order.ts`
- `quote.ts`
- `common.ts`

不要让页面组件自己临时写匿名对象类型。

------

## 4.11 `utils/`

放纯函数和工具逻辑。

首轮最关键的是报价相关工具：

- `buildQuoteResult.ts`
- `matchPriceRules.ts`

报价逻辑不要写死在 React 组件内部。

------

## 4.12 `styles/`

放设计 token 与全局样式。

建议至少有：

- `tokens.ts`
- `globals.css`

------

## 5. 页面文件命名规则

建议统一使用：

- `OrderListPage.tsx`
- `OrderCreatePage.tsx`
- `OrderDetailPage.tsx`
- `ProductListPage.tsx`
- `ProductCreatePage.tsx`
- `ProductDetailPage.tsx`
- `ProductEditPage.tsx`

不要混用：

- `index.tsx`
- `main.tsx`
- `detail.tsx`
  这种不清晰命名作为主页面文件名。

如果你们框架强制用 `index.tsx` 做页面入口，也建议组件名仍保持清晰，例如：

```ts
export default function OrderDetailPage() {}
```

------

## 6. 组件文件命名规则

统一采用：

**对象 + 功能 + 组件类型**

例如：

- `OrderSummaryCard.tsx`
- `ProductPickerModal.tsx`
- `SourceProductDrawer.tsx`
- `OrderItemSpecPricingBlock.tsx`

不要使用模糊文件名，例如：

- `Card1.tsx`
- `MainBox.tsx`
- `InfoPanel.tsx`

------

## 7. mock 与 types 的关系

### 原则

- `types/` 定义结构
- `mocks/` 提供样例数据
- 页面和组件只消费类型与 mock，不随意发明字段

------

### 首轮必须统一的类型文件建议

#### `types/product.ts`

定义：

- `Product`
- `ProductSpecRow`
- `ProductPriceRule`
- `ProductCustomRules`
- `ProductProductionReference`

#### `types/order.ts`

定义：

- `Order`
- `OrderItem`
- `SourceProductSnapshot`
- `OrderItemActualRequirements`

#### `types/quote.ts`

定义：

- `QuoteResult`
- `PriceAdjustment`
- `QuoteWarning`

------

## 8. 报价逻辑放置规则

首轮自动报价是关键能力，所以必须单独放位置，不要散在页面里。

### 推荐目录

```text
utils/
  quote/
    buildQuoteResult.ts
    matchPriceRules.ts
```

### 规则

- 页面不直接写报价公式
- 商品卡不直接在 JSX 里做复杂计算
- 报价函数尽量做纯函数，方便 mock 演示和后续迁移

------

## 9. 弹窗 / 抽屉放置规则

## 9.1 产品引用选择器

建议放在：

```text
components/business/bridge/ProductPickerModal.tsx
```

## 9.2 来源产品详情抽屉

建议放在：

```text
components/business/bridge/SourceProductDrawer.tsx
```

### 原则

这两个是桥接层能力，不要塞到：

- `components/business/order/`
  也不要塞到：
- `components/business/product/`

否则后面职责会混乱。

------

## 10. 首轮目录搭建优先级

### 第一步先建空目录

- app/
- pages/
- components/common/
- components/business/order/
- components/business/product/
- components/business/bridge/
- hooks/
- mocks/
- types/
- utils/
- styles/

### 第二步先落：

- layout
- common
- products 页面
- orders 页面

### 第三步再补：

- bridge
- quote utils
- mocks
- types

------

## 11. 当前建议不要做的目录复杂化

首轮不要过早拆出这些：

- `services/`
- `stores/`（如果还没有明确全局状态方案）
- `features/`（如果当前项目还没形成稳定 feature 风格）
- `api/`（首轮不接真实后端）
- `schemas/`（首轮可先放在 types 或 utils 旁边）

首轮重点是让结构清楚，不是过度工程化。

------

## 12. 验收标准

### 12.1 页面、组件、mock、类型分层清晰

不是所有东西都堆在 `components/` 里。

### 12.2 订单模块和产品模块结构对称

便于后续扩展。

### 12.3 报价逻辑有固定位置

不会散落在多个组件中。

### 12.4 桥接组件独立

产品引用选择器和来源产品详情抽屉有明确归属。

### 12.5 Codex 可读性强

Codex 进入项目后，能一眼理解：

- 页面在哪
- 组件在哪
- 数据类型在哪
- mock 数据在哪
- 报价逻辑在哪

