# 组件清单总表（商品任务中心 + 产品管理）

## 1. 文档目标
本文件用于统一首轮前端组件规划，明确：

- 哪些组件是全局通用组件
- 哪些组件属于商品任务中心 / 交易记录页
- 哪些组件属于产品管理
- 哪些组件用于交易记录 / 商品任务与产品之间的桥接
- 首轮哪些组件必须先做
- 组件命名和复用边界是什么

目标不是把所有组件一次性做完，而是建立一套**稳定、可扩展、不重复造轮子**的组件体系。

---

## 2. 组件规划原则

### 2.1 先做“通用壳组件”，再做“业务组件”
优先顺序固定为：

1. 布局与容器组件
2. 标签与信息展示组件
3. 页面区块组件
4. 业务对象组件
5. 编辑表单组件
6. 弹窗 / 抽屉 / 选择器组件

---

### 2.2 查看态和编辑态分开
不要让一个组件同时承担：

- 查看态
- 编辑态
- 弹窗态
- 表格编辑态

尽量拆分成：
- `XXXCard`
- `XXXForm`
- `XXXModal`
- `XXXDrawer`

---

### 2.3 命名必须清晰
统一采用：

**对象 + 功能 + 组件类型**

例如：
- `OrderSummaryCard`
- `ProductPickerModal`
- `SourceProductDrawer`
- `OrderItemSpecPricingBlock`

说明：
- `Order* / OrderItem*` 当前仍作为实现层兼容命名保留
- 文档中的业务语义统一按“交易记录 / 商品任务”理解

禁止使用模糊命名，例如：
- `InfoBox`
- `MainBlock`
- `DetailArea`
- `MyCard`

---

### 2.4 同类能力必须复用
以下能力不能在不同页面各写一套：

- 状态标签
- 版本标签
- 引用标签
- 卡片壳
- 文件列表
- 图片展示
- 时间轴
- 抽屉壳
- 弹窗壳

---

## 3. 全局通用组件

这部分优先级最高，交易记录与产品模块都会复用。

---

## 3.1 布局组件

### `AppLayout`
整套后台的最外层布局组件。

职责：
- 左侧菜单
- 顶部栏
- 主内容区
- 路由容器

---

### `AppSidebar`
左侧菜单组件。

首轮菜单至少包含：
- 工作台
- 商品任务中心
- 产品管理

---

### `AppTopbar`
顶部导航条组件。

可承载：
- 页面级操作入口
- 用户信息（后补）
- 全局搜索（后补）

---

### `AppBreadcrumb`
面包屑组件。

用于：
- 交易记录详情页
- 产品详情页
- 产品编辑页

---

### `PageContainer`
页面主容器。

职责：
- 控制页面宽度
- 控制上下间距
- 统一滚动体验

---

### `PageHeader`
页面头部组件。

职责：
- 页面标题
- 副标题
- 右侧按钮区

---

## 3.2 信息展示组件

### `SectionCard`
分区卡片组件。

职责：
- 包裹每一个页面区块
- 统一标题、操作区、内容区结构

---

### `SummaryCard`
摘要信息卡组件。

职责：
- 承载顶部概览信息
- 承载交易记录概览、产品摘要等场景

---

### `InfoGrid`
信息栅格组件。

职责：
- 多列排布多个信息字段

---

### `InfoField`
单个字段展示组件。

职责：
- label + value 展示
- 支持空值和说明文字

---

## 3.3 标签组件

### `StatusTag`
状态标签组件。

适用：
- 交易记录状态
- 产品状态
- 商品任务状态
- 售后状态
- 物流状态

---

### `RiskTag`
风险标签组件。

适用：
- 交易记录风险提醒

---

### `ReferenceTag`
引用状态标签组件。

适用：
- 产品是否可引用
- 来源产品标记

---

### `VersionBadge`
版本标签组件。

适用：
- 产品版本
- 文件版本
- 来源产品快照版本

---

### `TimePressureBadge`
时间压力标签组件。

适用：
- 剩余时间
- 已超时
- 临近交期

---

### `CapabilityTag`
能力标签组件。

适用：
- 支持刻字
- 支持改尺寸
- 需重新建模
- 必须测量工具

---

## 3.4 文件与图片组件

### `ImageThumb`
缩略图组件。

适用：
- 列表页主图
- 商品图缩略预览

---

### `ImageGallery`
图片展示组件。

适用：
- 产品详情页主图 / 缩略图
- 来源产品详情抽屉图片区

---

### `FileList`
文件列表组件。

职责：
- 展示文件集合

---

### `FileRow`
单条文件组件。

展示：
- 文件名
- 类型
- 版本
- 上传时间
- 操作区

---

### `FileVersionBadge`
文件版本标签组件。

适用：
- 建模文件版本
- 尺寸图版本
- 工艺图版本

---

## 3.5 通用交互壳组件

### `LargeModal`
大号弹窗组件。

首轮主要用于：
- 产品引用选择器

---

### `SideDrawer`
右侧抽屉组件。

首轮主要用于：
- 来源产品详情抽屉

---

### `ConfirmDialog`
确认弹窗组件。

适用：
- 删除确认
- 停用确认
- 放弃修改确认

---

### `EmptyState`
空状态组件。

适用：
- 空页面
- 空区块
- 空商品卡
- 无规格、无文件、无记录时

---

### `Timeline`
时间轴组件。

适用：
- 操作日志
- 版本记录（后补）

---

## 4. 商品任务中心 / 交易记录组件

---

## 4.1 商品任务中心列表页组件

### `OrderListPage`
商品任务中心列表页页面组件。

---

### `OrderListHeader`
商品任务中心列表页顶部标题与按钮区。

---

### `OrderQuickStats`
商品任务快捷统计卡组。

例如：
- 全部商品任务
- 待我处理
- 即将到期
- 已超时

---

### `OrderFilterBar`
商品任务筛选栏。

首轮用于：
- 搜索交易编号 / 客户姓名 / 商品名称
- 筛选状态 / 负责人

---

### `OrderTable`
商品任务表格容器组件。

---

### `OrderBasicInfoCell`
交易记录基础信息单元格组件。

展示：
- 交易编号
- 平台订单编号
- 客户姓名

---

### `OrderItemSummaryCell`
商品任务摘要单元格组件。

展示：
- 商品数量
- 商品名称摘要

---

### `OrderTimePressureCell`
时间压力单元格组件。

展示：
- 承诺交期
- 剩余时间 / 超时

---

### `OrderRowActions`
商品任务行操作组件。

首轮可包含：
- 查看详情

---

## 4.2 交易记录详情页组件

### `OrderDetailPage`
交易记录详情页页面组件。

---

### `OrderHeaderBar`
交易记录详情页顶部头部区。

---

### `OrderSummaryCard`
交易记录概览卡。

展示：
- 交易编号
- 平台订单编号
- 状态
- 客户姓名
- 承诺交期
- 风险标签

---

### `OrderSummaryMainInfo`
交易记录概览主信息区。

---

### `OrderSummaryTimeInfo`
交易记录概览中的时间信息区。

---

### `OrderSummarySideInfo`
交易记录概览中的右侧摘要信息区。

---

### `OrderInfoCardGroup`
交易级信息卡组容器。

可承载：
- 客户与平台信息卡
- 时间与交付信息卡
- 交易摘要信息卡

---

## 4.3 商品协同区组件

### `OrderItemsSection`
商品协同区整体容器。

---

### `OrderItemCard`
商品任务卡核心组件。

这是交易记录详情页最重要的业务组件。

必须能承载：
- 来源产品条
- 规格与报价区
- 客服需求区
- 设计建模区
- 跟单委外区
- 工厂回传区

---

### `OrderItemHeader`
商品卡头部组件。

展示：
- 商品名称
- 数量
- 状态

注意：
- 商品名称可点击，点击后打开来源产品详情抽屉

---

### `ProductReferenceBanner`
商品卡顶部来源产品条组件。

展示：
- 来源产品名称
- 产品编号
- 来源版本
- 查看来源产品按钮

---

## 4.4 商品卡中的规格与报价组件

这部分是首轮主链路核心。

### `OrderItemSpecPricingBlock`
规格与报价区总容器。

---

### `OrderItemSpecSelector`
规格选择器组件。

职责：
- 显示规格名称
- 渲染标签 / 下拉
- 切换规格

---

### `OrderItemSpecSummaryGrid`
规格参数摘要组件。

例如：

#### 戒指
- 圈号
- 面宽
- 底宽
- 面厚
- 底厚
- 参考重量

#### 吊坠
- 档位
- 长
- 宽
- 厚
- 参考重量

---

### `OrderItemBasePriceCard`
规格基础价展示组件。

展示：
- 当前规格基础价格

---

### `OrderItemPriceBreakdownList`
附加价格列表组件。

展示：
- 材质加价
- 工艺加价
- 特殊需求加价

---

### `OrderItemQuoteSummaryCard`
系统参考报价卡组件。

展示：
- 系统参考报价合计

---

### `OrderItemQuoteWarningAlert`
报价 warning / 冲突提示组件。

至少提示：
- 未选规格
- 当前规格没有基础价格
- 当前附加项没有对应规则

---

## 4.5 首轮占位组件（交易记录页）
这些首轮可以先做结构占位：

### `CustomerSpecBlock`
客服需求区块。

---

### `DesignInfoBlock`
设计建模区块。

---

### `OutsourceInfoBlock`
跟单委外区块。

---

### `FactoryFeedbackBlock`
工厂回传区块。

---

## 4.6 记录型区块组件（首轮可先做占位）

### `LogisticsSection`
物流区块容器。

---

### `AfterSalesSection`
售后区块容器。

---

### `OrderAttachmentSection`
附件区块容器。

---

### `OperationTimelineSection`
日志区块容器。

---

## 5. 产品管理组件

---

## 5.1 产品列表页组件

### `ProductListPage`
产品列表页页面组件。

---

### `ProductListHeader`
产品列表页顶部标题与按钮区。

---

### `ProductQuickStats`
产品快捷统计卡组。

例如：
- 全部产品
- 可引用产品
- 待完善产品

---

### `ProductFilterBar`
产品筛选栏。

用于：
- 搜索产品名称 / 编号
- 筛选状态 / 是否可引用 / 品类

---

### `ProductTable`
产品表格容器组件。

---

### `ProductImageCell`
产品主图单元格。

---

### `ProductIdentityCell`
产品身份信息单元格。

展示：
- 产品名称
- 产品编号
- 品类 / 系列摘要

---

### `ProductPriceCell`
价格摘要单元格。

---

### `ProductStatusCell`
状态单元格。

---

### `ProductReferenceCell`
可引用状态单元格。

---

### `ProductVersionCell`
版本单元格。

---

### `ProductRowActions`
产品行操作组件。

首轮可包含：
- 查看详情
- 编辑

---

## 5.2 产品详情页组件

### `ProductDetailPage`
产品详情页页面组件。

---

### `ProductHeaderBar`
产品详情页顶部头部区。

---

### `ProductSummaryCard`
产品摘要卡。

展示：
- 主图
- 名称
- 编号
- 品类
- 系列
- 状态
- 是否可引用
- 当前版本
- 价格摘要

---

### `ProductGallery`
产品图片展示组件。

---

### `ProductIdentityInfo`
产品身份信息区。

---

### `ProductQuickStats`
产品快捷摘要区。

---

### `ProductAnchorNav`
产品详情页分区导航。

---

### `ProductBasicInfoSection`
基础信息区。

---

### `ProductParamConfigSection`
参数配置区。

---

### `ProductPriceRuleSection`
价格规则区。

---

### `ProductCustomRuleSection`
定制规则区。

---

### `ProductProductionRefSection`
生产参考区。

---

### `ProductAssetsSection`
图片与文件区。

---

## 5.3 产品新建 / 编辑页组件

### `ProductEditPage`
产品编辑页页面组件。

---

### `ProductEditHeader`
产品编辑页头部区。

---

### `ProductSaveBar`
顶部保存区。

---

### `ProductEditSideNav`
左侧分区导航。

---

### `ProductBasicFormSection`
基础信息表单区。

---

### `ProductParamFormSection`
参数配置表单区。

---

### `ProductSpecSection`
规格明细区总容器。

这是首轮必须重点做的组件。

---

### `ProductSpecTable`
规格明细表格组件。

首轮需支持：
- 新增规格行
- 删除规格行
- 复制规格行
- 编辑规格参数
- 编辑参考重量
- 编辑基础价格
- 切换启用 / 停用状态

---

### `ProductPriceRuleFormSection`
价格规则表单区。

首轮支持：
- 固定加价规则列表
- 新增规则
- 删除规则
- 编辑规则

---

## 6. 交易记录 / 商品任务与产品桥接组件

这部分是交易记录 / 商品任务和产品之间的关键桥。

---

## 6.1 产品引用选择器组件

### `ProductPickerModal`
产品引用选择器总容器。

---

### `ProductPickerHeader`
选择器顶部标题区。

---

### `ProductPickerSearchBar`
选择器搜索区。

---

### `ProductPickerSidebarFilters`
左侧筛选区。

---

### `ProductCardGrid`
中间卡片网格容器。

---

### `ProductPickerCard`
产品卡片组件。

展示：
- 主图
- 产品名称
- 产品编号
- 品类
- 价格摘要
- 状态
- 是否可引用

---

### `ProductQuickPreviewPanel`
右侧快速预览区。

展示：
- 产品原始摘要
- 参数摘要
- 价格摘要
- 生产参考摘要

---

### `ProductPickerFooter`
底部确认区。

---

## 6.2 来源产品详情抽屉组件

### `SourceProductDrawer`
来源产品详情抽屉总容器。

---

### `SourceProductDrawerHeader`
抽屉头部组件。

---

### `SourceProductVersionNoticeCard`
来源版本提示卡。

用于说明：
- 这是来源产品
- 当前查看的是哪个版本
- 与商品任务的关系

---

### `SourceProductTabs`
抽屉标签页切换组件。

首轮包含：
- 产品原始详情
- 商品任务参数对比
- 文件资料

---

### `SourceProductDetailTab`
产品原始详情标签页组件。

---

### `OrderVsProductCompareTab`
商品任务参数对比标签页组件。

---

### `SourceProductAssetsTab`
来源产品文件资料标签页组件。

---

## 7. 首轮必须优先完成的组件

如果要给 AI / 前端排优先级，首轮最先做下面这些：

### 第一批：全局基础组件
- AppLayout
- PageHeader
- SectionCard
- SummaryCard
- InfoGrid
- InfoField
- StatusTag
- ReferenceTag
- VersionBadge
- LargeModal
- SideDrawer
- EmptyState

---

### 第二批：产品主页面组件
- ProductListPage
- ProductTable
- ProductDetailPage
- ProductSummaryCard
- ProductBasicInfoSection
- ProductParamConfigSection
- ProductPriceRuleSection

---

### 第三批：产品编辑核心组件
- ProductEditPage
- ProductBasicFormSection
- ProductParamFormSection
- ProductSpecSection
- ProductSpecTable
- ProductPriceRuleFormSection

---

### 第四批：交易记录主页面组件
- OrderListPage
- OrderDetailPage
- OrderSummaryCard
- OrderItemCard
- ProductReferenceBanner

---

### 第五批：桥接组件
- ProductPickerModal
- ProductPickerCard
- ProductQuickPreviewPanel
- SourceProductDrawer
- SourceProductDetailTab
- OrderVsProductCompareTab

---

### 第六批：规格与报价组件
- OrderItemSpecPricingBlock
- OrderItemSpecSelector
- OrderItemSpecSummaryGrid
- OrderItemBasePriceCard
- OrderItemPriceBreakdownList
- OrderItemQuoteSummaryCard
- OrderItemQuoteWarningAlert

---

## 8. 组件复用边界说明

### 8.1 商品任务卡和来源产品详情不要混用
- `OrderItemCard`：展示商品任务实例
- `SourceProductDrawer`：展示来源产品模板

这两个对象不能混成一个组件。

---

### 8.2 规格与报价区只属于商品任务卡
- 产品编辑页里有规格明细表
- 商品任务卡里有规格选择与自动报价区

这两块相关，但不是同一个组件。

---

### 8.3 文件组件可以复用壳，但业务区分要清楚
例如：
- 产品详情页文件区
- 来源产品抽屉文件区
都可以复用 `FileList` / `FileRow`

但不要把业务逻辑写死在通用文件组件里。

---

## 9. 首轮验收标准

### 9.1 组件体系清楚
- 通用组件
- 交易记录 / 商品任务组件
- 产品组件
- 桥接组件

边界明确。

### 9.2 没有重复造轮子
例如：
- 状态标签只有一套
- 抽屉壳只有一套
- 信息卡壳只有一套

### 9.3 核心业务组件都已具备落位
首轮必须能承接：
- 产品列表 / 详情 / 编辑
- 商品任务中心 / 交易记录详情
- 产品引用
- 来源产品核对
- 规格选择
- 自动带价
