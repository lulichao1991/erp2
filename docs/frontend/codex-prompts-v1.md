~~~md
# 给 AI / Codex 的首轮开发 Prompt 清单 v1

## 1. 使用说明
这份文档用于把首轮前端开发任务，拆成可以**一轮一轮喂给 Codex** 的 Prompt。

建议规则：

1. **一轮只喂一个 Prompt**
2. 不要把全部 Prompt 一次性发给 Codex
3. 必须按顺序执行，不建议跳轮
4. 每轮结束后，要求 Codex 输出：
   - 修改了哪些文件
   - 新增了哪些组件
   - 当前能演示什么
   - 还缺什么
   - 下一轮最建议继续做什么

---

## 2. 执行顺序

首轮建议按这个顺序喂给 Codex：

1. 全局框架与通用组件
2. 产品列表页与产品详情页
3. 产品新建 / 编辑页最小版（含规格明细与固定加价规则）
4. 订单列表页与订单详情页骨架
5. 产品引用选择器与来源产品详情抽屉
6. 订单商品卡中的规格选择 + 自动带价
7. 联调、演示数据与收尾

---

## 3. Prompt 1：搭建后台整体布局框架与通用组件第一批

```text
你现在是这个 ERP 前端项目的首轮开发工程师。

目标：
先搭建统一的后台布局框架和通用基础组件，为后续订单中心和产品管理页面打底。

开发范围：
1. 全局后台布局框架
2. 侧边栏
3. 顶部栏
4. 面包屑
5. 页面容器
6. 通用基础组件第一批

请基于当前项目已有前端技术栈与目录结构实现，不要随意推翻现有工程结构。

本轮必须完成的组件：
- AppLayout
- AppSidebar
- AppTopbar
- AppBreadcrumb
- PageContainer
- PageHeader
- SectionCard
- SummaryCard
- InfoGrid
- InfoField
- StatusTag
- ReferenceTag
- VersionBadge
- TimePressureBadge
- EmptyState
- LargeModal
- SideDrawer
- ConfirmDialog

页面与导航要求：
- 侧边栏先放：工作台、订单中心、产品管理
- 预留路由入口：
  - /orders
  - /orders/new
  - /orders/:orderId
  - /products
  - /products/new
  - /products/:productId
  - /products/:productId/edit

实现要求：
- 先做桌面端中后台布局
- 风格保持专业、清晰、卡片化
- 不做复杂响应式适配
- 不接真实后端，可先用静态数据或 mock
- 组件命名必须清晰稳定，不要使用含糊命名

交付要求：
1. 直接完成代码修改
2. 给出新增/修改的文件清单
3. 简要说明组件职责
4. 说明后续页面如何复用这批组件

验收标准：
- 所有后续页面都能挂载在统一后台壳子下
- 标签、卡片、抽屉、弹窗风格统一
- 页面切换不抖动，结构清晰

暂不处理：
- 复杂业务逻辑
- 数据请求层
- 高级权限逻辑
~~~

------

## 4. Prompt 2：实现产品列表页与产品详情页首版

```text
在上一轮全局布局和通用组件的基础上，继续实现“产品管理”模块的首版查看能力。

目标：
完成产品列表页和产品详情页首版，让用户可以查找产品、查看产品原始资料、参数规则、价格规则摘要和文件摘要。

页面范围：
- /products
- /products/:productId

本轮必须完成的页面与组件：

一、产品列表页
- ProductListPage
- ProductListHeader
- ProductQuickStats
- ProductFilterBar
- ProductTable
- ProductImageCell
- ProductIdentityCell
- ProductPriceCell
- ProductStatusCell
- ProductReferenceCell
- ProductVersionCell
- ProductRowActions

列表页必须展示的字段：
- 主图
- 产品编号
- 产品名称
- 品类
- 系列
- 默认材质
- 参考价格
- 状态
- 是否可引用
- 当前版本
- 最近更新时间

列表页必须支持：
- 搜索产品名称 / 编号
- 筛选品类 / 状态 / 是否可引用
- 点击进入详情页
- 右上角新建产品按钮

二、产品详情页
- ProductDetailPage
- ProductHeaderBar
- ProductSummaryCard
- ProductGallery
- ProductIdentityInfo
- ProductQuickStats
- ProductAnchorNav
- ProductBasicInfoSection
- ProductParamConfigSection
- ProductPriceRuleSection
- ProductCustomRuleSection
- ProductProductionRefSection
- ProductAssetsSection

详情页必须展示：
- 产品主图与缩略图
- 产品名称、编号、品类、系列
- 状态、是否可引用、当前版本
- 参数配置摘要
- 价格规则摘要
- 定制规则摘要
- 生产参考摘要
- 图片与文件摘要

实现要求：
- 先做只读展示，不做复杂编辑
- 使用 mock 数据即可
- 保持页面结构可扩展，后续还要接产品编辑页和引用记录
- 列表页优先用表格视图，不做卡片视图
- 详情页用“顶部摘要 + 分区内容”结构

交付要求：
1. 完成页面代码
2. 给出 mock 数据结构示例
3. 说明页面组件树
4. 标出后续预留区域（例如引用记录、版本记录）

验收标准：
- 能从产品列表页进入产品详情页
- 用户可以快速判断产品是谁、能不能引用、参考价大概如何
- 页面结构清晰，不是堆字段
```

------

## 5. Prompt 3：实现产品新建 / 编辑页最小可用版（必须包含规格明细与价格规则）

```text
继续在当前项目中实现产品新建 / 编辑页的最小可用版。

注意：
这一轮不能只做基础资料，必须把“规格明细 + 基础价格 + 固定加价规则”一起做进去，因为订单首轮必须支持自动带价。

页面范围：
- /products/new
- /products/:productId/edit

目标：
支持创建和编辑可被订单引用的产品模板，并配置：
1. 基础信息
2. 参数配置
3. 规格明细
4. 固定加价规则

必须完成的组件：
- ProductEditPage
- ProductEditHeader
- ProductSaveBar
- ProductEditSideNav
- ProductBasicFormSection
- ProductParamFormSection
- ProductSpecSection
- ProductPriceRuleFormSection

一、基础信息区必须支持：
- 产品照片
- 产品编号/款号
- 产品名称
- 品类
- 风格
- 系列
- 状态
- 是否可引用

二、参数配置区必须支持：
- 支持材质
- 默认材质
- 支持工艺
- 默认工艺
- 特殊需求支持项
- 规格模式（先支持 none / single_axis）
- 规格名称（例如 圈号 / 档位）
- 规格展示方式（标签 / 下拉）
- 是否必选规格

三、规格明细区必须支持：
- 仅实现单轴规格
- 新增规格行
- 编辑规格值
- 编辑规格参数
- 编辑参考重量
- 编辑基础价格
- 启用 / 停用规格

请兼容两类样例：
1. 戒指
- 圈号
- 面宽
- 底宽
- 面厚
- 底厚
- 参考重量
- 基础价格

2. 吊坠
- 档位
- 长
- 宽
- 厚
- 参考重量
- 基础价格

四、价格规则区必须支持：
- 固定加价规则
- 规则类型：材质 / 工艺 / 特殊需求 / 其他
- 规则项
- 加价值
- 备注

实现要求：
- 编辑页采用“左侧分区导航 + 右侧表单区”
- 规格明细必须采用表格编辑器，不要做成长表单
- 先使用本地状态和 mock 数据
- 不接真实后端
- 暂不做多轴规格
- 暂不做复杂公式

交付要求：
1. 完成页面和核心组件
2. 给出 product 表单的前端状态结构建议
3. 给出戒指与吊坠两组 mock 示例
4. 说明如何为后续订单自动带价提供数据

验收标准：
- 能创建一个戒指产品，并配置多个圈号规格与基础价格
- 能创建一个吊坠产品，并配置小 / 中 / 大规格与基础价格
- 能配置材质 / 工艺 / 特殊需求固定加价规则
```

------

## 6. Prompt 4：实现订单列表页与订单详情页骨架首版

```text
继续实现订单中心首版页面，但这一轮重点先搭“工作台骨架”，为后续产品引用和自动带价预留位置。

页面范围：
- /orders
- /orders/new
- /orders/:orderId

目标：
完成订单列表页、新建订单页最小结构、订单详情页骨架和商品卡骨架。

必须完成的组件：

一、订单列表页
- OrderListPage
- OrderListHeader
- OrderQuickStats
- OrderFilterBar
- OrderTable
- OrderBasicInfoCell
- OrderItemSummaryCell
- OrderTimePressureCell
- OrderRowActions

列表页必须展示：
- 风险标签
- 订单编号
- 平台订单编号
- 订单类型
- 客户姓名
- 商品摘要
- 当前状态
- 承诺交期
- 剩余时间 / 超时
- 当前负责人

二、新建订单页
- OrderCreatePage
- OrderCreateBasicSection
- OrderCreateCustomerSection
- OrderCreateTimeSection
- OrderCreateItemsSection

新建订单页至少支持：
- 订单基础信息
- 客户基础信息
- 时间信息
- 商品卡列表
- 商品卡空状态
- 商品卡中的“引用产品”入口
- 商品卡中的“手动填写”入口

三、订单详情页
- OrderDetailPage
- OrderHeaderBar
- OrderSummaryCard
- OrderSummaryMainInfo
- OrderSummaryTimeInfo
- OrderSummarySideInfo
- OrderInfoCardGroup
- OrderItemsSection
- OrderItemCard
- OrderItemHeader
- ProductReferenceBanner

订单详情页必须先搭出以下结构：
- 顶部订单概览
- 订单级信息卡组
- 商品协同区
- 物流区占位
- 售后区占位
- 附件区占位
- 日志区占位

商品卡首版必须展示：
- 商品名称
- 数量
- 商品状态
- 来源产品条（如有）
- 规格与报价区占位
- 客服需求区占位
- 设计建模区占位
- 跟单区占位
- 工厂区占位

实现要求：
- 订单详情页不是大表单，而是工作台骨架
- 商品卡是核心复用组件，结构要清晰
- 商品名称后续要支持点击查看来源产品
- 先用 mock 数据

交付要求：
1. 完成列表页、创建页、详情页骨架
2. 给出 order 和 order item 的 mock 数据结构
3. 说明商品卡后续如何承接规格与报价能力

验收标准：
- 能从订单列表进入详情
- 新建订单页里能出现商品卡空状态
- 订单详情页能明显区分订单级与商品级信息
```

------

## 7. Prompt 5：实现产品引用选择器与来源产品详情抽屉

```text
继续在订单中心中打通“订单引用产品”和“查看来源产品原始详情”这两条桥接能力。

页面挂载位置：
- /orders/new?modal=product-picker
- /orders/:orderId?modal=product-picker
- /orders/:orderId?drawer=source-product&itemId=...

目标：
1. 在订单商品卡中打开产品引用选择器
2. 引用产品后，在商品卡中显示来源产品条
3. 点击商品名称或查看来源产品按钮，打开来源产品详情抽屉
4. 在抽屉中查看来源产品原始详情与订单参数对比

必须完成的组件：

一、产品引用选择器
- ProductPickerModal
- ProductPickerHeader
- ProductPickerSearchBar
- ProductPickerSidebarFilters
- ProductPickerResultHeader
- ProductCardGrid
- ProductPickerCard
- ProductQuickPreviewPanel
- ProductPickerFooter

选择器要求：
- 使用卡片视图
- 左侧可筛选
- 中间看图选品
- 右侧快速预览
- 确认引用后返回订单页

二、商品卡引用后状态
- ProductReferenceBanner
- ProductReferenceMeta
- ProductTemplateSummary

商品卡必须显示：
- 来源产品名称
- 来源产品编号
- 来源版本信息占位
- 查看来源产品入口

三、来源产品详情抽屉
- SourceProductDrawer
- SourceProductDrawerHeader
- SourceProductVersionNoticeCard
- SourceProductTabs
- SourceProductDetailTab
- OrderVsProductCompareTab
- SourceProductAssetsTab
- SourceProductDrawerFooter

抽屉标签页要求：

1. 产品原始详情
展示：
- 主图
- 名称 / 编号 / 品类 / 状态
- 参数配置摘要
- 定制规则摘要
- 生产参考摘要

2. 订单参数对比
首轮至少对比：
- 材质
- 工艺
- 规格值
- 是否需测量工具
- 是否需重新建模

3. 文件资料
展示：
- 来源产品图片摘要
- 建模文件摘要
- 其他文件摘要

实现要求：
- 点击订单里的商品名称，打开的是来源产品详情，不是订单商品详情
- 订单参数对比先做轻量版
- 先用 mock 数据，不接真实后端
- 要为后续“查看引用时版本 / 当前版本”预留结构

交付要求：
1. 完成弹窗和抽屉
2. 给出订单页中触发打开的实现方式
3. 给出产品引用后的订单商品快照元信息建议

验收标准：
- 客服可以在订单页里看图选产品
- 引用后商品卡能显示来源产品
- 点击商品名称能查看来源产品原始详情和订单对比
```

------

## 8. Prompt 6：实现订单商品卡中的规格选择 + 自动带价首版

```text
继续实现订单商品卡中的“规格选择 + 自动带参数 + 自动带价”首版功能。

注意：
这是首轮必做主链路，不是增强项。

目标：
当订单商品引用了产品模板后，如果该产品启用了单轴规格，则：
1. 商品卡显示规格选择器
2. 选择规格后自动带出规格参数
3. 自动带出该规格基础价格
4. 根据当前已选材质 / 工艺 / 特殊需求叠加固定加价
5. 生成系统参考报价

必须完成的组件：
- OrderItemSpecPricingBlock
- OrderItemSpecSelector
- OrderItemSpecSummaryGrid
- OrderItemBasePriceCard
- OrderItemPriceBreakdownList
- OrderItemQuoteSummaryCard
- OrderItemQuoteWarningAlert

必须实现的前端状态：
- no_product_reference
- product_referenced_wait_spec
- spec_selected_base_ready
- quote_calculating
- quote_ready

实现要求：

一、规格选择
- 只支持单轴规格
- 规格展示方式来自产品配置（标签 / 下拉）
- 仅显示启用状态的规格
- 如果产品规格必选，未选规格前不生成价格

二、选择规格后自动带出
对于戒指类示例，选择 16号 后自动显示：
- 圈号
- 面宽
- 底宽
- 面厚
- 底厚
- 参考重量
- 基础价格

对于吊坠类示例，选择 小号 后自动显示：
- 档位
- 长
- 宽
- 厚
- 参考重量
- 基础价格

三、附加规则叠加
根据当前订单商品里的已选项匹配价格规则：
- 材质
- 工艺
- 特殊需求

首轮只做固定加价：
系统参考报价 = 规格基础价 + 所有生效固定加价之和

四、价格区展示
必须展示：
- 当前规格
- 规格参数摘要
- 规格基础价
- 生效的附加价列表
- 系统参考报价合计

五、警告状态
首轮至少支持以下警告：
- 产品要求规格必选，但尚未选择规格
- 当前规格没有基础价格
- 当前附加项没有对应价格规则（按 0 处理，但给提示）

实现边界：
- 不做人工最终报价
- 不做多轴规格
- 不做复杂公式
- 不做复杂审批流

交付要求：
1. 完成商品卡中的规格与报价区
2. 给出 mock 数据结构：product、spec rows、price rules、order item
3. 给出报价计算函数的前端实现思路
4. 用两个样例演示效果：
   - 戒指 16号 + 18K金 + 微镶 + 刻字
   - 吊坠 小号 + 珐琅 + 加急

验收标准：
- 戒指和吊坠两个样例都能跑通
- 选规格后能自动带参数
- 选附加项后能自动生成系统参考报价
```

------

## 9. Prompt 7：首轮联调、演示数据与页面串联收尾

```text
在前面各轮页面和组件基础上，完成首轮联调和演示数据串联，保证首轮核心链路可以实际演示。

目标：
让产品模块和订单模块在前端形成可演示闭环。

必须完成的事项：

一、准备演示数据
至少准备两套完整产品模板：

1. 戒指产品
包含：
- 基础信息
- 单轴规格（至少 10号 / 12号 / 16号）
- 规格参数
- 基础价格
- 材质 / 工艺 / 特殊需求固定加价规则

2. 吊坠产品
包含：
- 基础信息
- 单轴规格（至少 小号 / 中号 / 大号）
- 规格参数
- 基础价格
- 工艺 / 特殊需求固定加价规则

二、订单演示数据
至少准备两张订单或两条订单商品样例：
1. 引用戒指并自动报价
2. 引用吊坠并自动报价

三、验证页面串联
必须验证以下路径：
- 产品列表 → 产品详情
- 产品详情 → 返回列表
- 订单列表 → 订单详情
- 订单详情商品卡 → 产品引用选择器
- 订单详情商品卡商品名称 → 来源产品详情抽屉

四、验证核心业务链
场景 1：
- 订单引用戒指
- 选 16号
- 选 18K金
- 选微镶
- 选刻字
- 系统自动显示参考报价

场景 2：
- 订单引用吊坠
- 选小号
- 选珐琅
- 选加急
- 系统自动显示参考报价

五、补齐必要的 UI 缺口
- loading 占位
- 空状态
- 缺规格提示
- 缺价格提示
- 缺规则提示

交付要求：
1. 给出首轮可演示的页面路径说明
2. 给出演示数据位置
3. 给出已完成能力清单
4. 给出下一轮建议继续做的内容清单

验收标准：
- 不是静态壳子，而是能完整演示产品引用和自动带价
- 戒指、吊坠两个例子都能走通
- 页面之间跳转顺畅
```

------

## 10. 推荐使用方式

建议你实际喂 Codex 时，严格按这个顺序：

1. Prompt 1
2. Prompt 2
3. Prompt 3
4. Prompt 4
5. Prompt 5
6. Prompt 6
7. Prompt 7

不要跳过：

- Prompt 3（产品规格明细与价格规则）
- Prompt 6（订单商品卡中的规格选择与自动带价）

因为这两轮就是首轮自动带价链路的前后两端。

------

## 11. 最小压缩执行方案

如果你不想拆成 7 轮，也可以压成 3 轮：

### 第 1 轮

- Prompt 1
- Prompt 2

### 第 2 轮

- Prompt 3
- Prompt 4

### 第 3 轮

- Prompt 5
- Prompt 6
- Prompt 7

但更推荐你一轮一轮做，这样更稳。

