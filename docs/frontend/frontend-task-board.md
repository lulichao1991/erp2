# 前端任务板（首轮）

## 1. 文档目标
本文件用于把首轮前端开发任务按阶段拆开，方便：

- 你自己排开发顺序
- AI / Codex 按阶段执行
- 每轮验收时知道“做到哪一步才算完成”

首轮任务只围绕两大模块展开：

1. 订单中心
2. 产品管理

并且必须跑通这条主链路：

**产品维护（含规格明细与固定加价规则）  
→ 订单引用产品  
→ 选择规格  
→ 自动带出规格参数  
→ 自动带出基础价格  
→ 叠加固定加价规则  
→ 生成系统参考报价**

---

## 2. 首轮总原则

### 2.1 先主骨架，再关键交互
优先顺序固定为：

1. 全局框架
2. 产品查看页
3. 产品编辑最小版
4. 订单骨架
5. 产品引用
6. 自动带价

---

### 2.2 先查看态，再编辑态
首轮不是把所有编辑能力都做满，而是优先保证：

- 页面结构清楚
- 核心交互能演示
- 业务主链路能走通

---

### 2.3 自动带价必须是首轮必做
自动带价不是增强项，不能后置。

---

## 3. Sprint 0：框架与通用组件

### 目标
先把整套中后台前端壳子和通用组件搭起来，避免后续页面风格不统一。

### 范围
- 全局布局
- 菜单
- 顶部栏
- 面包屑
- 通用卡片
- 通用标签
- 通用弹窗 / 抽屉

### 必做
- `AppLayout`
- `AppSidebar`
- `AppTopbar`
- `AppBreadcrumb`
- `PageContainer`
- `PageHeader`
- `SectionCard`
- `SummaryCard`
- `InfoGrid`
- `InfoField`
- `StatusTag`
- `ReferenceTag`
- `VersionBadge`
- `TimePressureBadge`
- `LargeModal`
- `SideDrawer`
- `ConfirmDialog`
- `EmptyState`

### 交付结果
- 所有后续页面都能挂在统一后台壳子下
- 卡片、标签、弹窗、抽屉风格统一

### 验收标准
- 页面切换不抖动
- 布局结构统一
- 通用组件可被订单页和产品页直接复用

---

## 4. Sprint 1：产品查看能力

### 目标
先让产品模块能“看”和“查”。

### 页面
- `/products`
- `/products/:productId`

### 必做
#### 产品列表页
- 搜索产品名称 / 编号
- 筛选品类 / 状态 / 是否可引用
- 展示主图、名称、品类、参考价格、状态、版本
- 点击进入详情页

#### 产品详情页
- 展示产品主图
- 展示名称 / 编号 / 品类 / 系列
- 展示状态 / 是否可引用 / 版本
- 展示参数配置摘要
- 展示价格规则摘要
- 展示定制规则摘要
- 展示生产参考摘要
- 展示图片与文件摘要

### 必做组件
- `ProductListPage`
- `ProductListHeader`
- `ProductFilterBar`
- `ProductTable`
- `ProductDetailPage`
- `ProductSummaryCard`
- `ProductGallery`
- `ProductBasicInfoSection`
- `ProductParamConfigSection`
- `ProductPriceRuleSection`
- `ProductCustomRuleSection`
- `ProductProductionRefSection`
- `ProductAssetsSection`

### 交付结果
产品模块已经具备基础查看能力。

### 验收标准
- 用户可以快速找到产品
- 用户可以快速看懂产品是谁、能不能引用、价格规则大概如何

---

## 5. Sprint 2：产品编辑最小可用版

### 目标
让产品模块不只是“看”，还能维护规格明细和固定加价规则，为订单自动带价做前置准备。

### 页面
- `/products/new`
- `/products/:productId/edit`

### 必做分区
#### 基础信息
- 产品照片
- 产品编号 / 款号
- 产品名称
- 品类
- 风格
- 系列
- 状态
- 是否可引用

#### 参数配置
- 支持材质
- 默认材质
- 支持工艺
- 默认工艺
- 特殊需求支持项
- 规格模式
- 规格名称
- 规格展示方式
- 是否必选规格

#### 规格明细
首轮只支持单轴规格，必须支持：
- 新增规格行
- 删除规格行
- 复制规格行
- 编辑规格值
- 编辑尺寸参数
- 编辑参考重量
- 编辑基础价格
- 启用 / 停用规格

#### 固定加价规则
必须支持：
- 材质加价
- 工艺加价
- 特殊需求加价
- 其他加价

### 必做组件
- `ProductEditPage`
- `ProductEditHeader`
- `ProductSaveBar`
- `ProductEditSideNav`
- `ProductBasicFormSection`
- `ProductParamFormSection`
- `ProductSpecSection`
- `ProductSpecTable`
- `ProductPriceRuleFormSection`

### 必做样例
#### 戒指
- 圈号规格
- 面宽 / 底宽 / 面厚 / 底厚 / 参考重量 / 基础价格

#### 吊坠
- 档位规格
- 长 / 宽 / 厚 / 参考重量 / 基础价格

### 交付结果
产品模块可以配置出能被订单自动带价使用的产品模板。

### 验收标准
- 能创建戒指产品并维护多个圈号规格
- 能创建吊坠产品并维护小 / 中 / 大规格
- 能配置固定加价规则

---

## 6. Sprint 3：订单查看与骨架

### 目标
先把订单中心的主页面和商品卡骨架搭起来。

### 页面
- `/orders`
- `/orders/new`
- `/orders/:orderId`

### 必做
#### 订单列表页
- 搜索订单编号 / 客户姓名
- 筛选状态 / 负责人
- 展示风险、状态、交期、负责人、商品摘要
- 点击进入详情页

#### 新建订单页
- 基础信息区
- 客户信息区
- 时间信息区
- 商品明细区
- 商品卡空态

#### 订单详情页
- 顶部订单概览
- 订单级信息卡组
- 商品协同区
- 物流区占位
- 售后区占位
- 附件区占位
- 日志区占位

### 商品卡首轮骨架
每个商品卡至少要有：
- 商品名称
- 数量
- 状态
- 来源产品条占位
- 规格与报价区占位
- 客服需求区占位
- 设计建模区占位
- 跟单委外区占位
- 工厂回传区占位

### 必做组件
- `OrderListPage`
- `OrderListHeader`
- `OrderFilterBar`
- `OrderTable`
- `OrderCreatePage`
- `OrderDetailPage`
- `OrderSummaryCard`
- `OrderInfoCardGroup`
- `OrderItemsSection`
- `OrderItemCard`
- `OrderItemHeader`

### 交付结果
订单中心已具备清晰的页面骨架。

### 验收标准
- 订单详情页不再是大表单
- 商品卡结构清晰
- 商品区与订单级信息区明显分层

---

## 7. Sprint 4：订单 × 产品桥接

### 目标
把订单和产品真正接起来。

### 必做能力
1. 产品引用选择器
2. 商品卡来源产品条
3. 来源产品详情抽屉
4. 订单参数轻量对比

---

### 7.1 产品引用选择器
挂载位置：
- `/orders/new?modal=product-picker`
- `/orders/:orderId?modal=product-picker`

必做：
- 左侧筛选
- 中间卡片视图
- 右侧预览
- 确认引用

必做组件：
- `ProductPickerModal`
- `ProductPickerHeader`
- `ProductPickerSearchBar`
- `ProductPickerSidebarFilters`
- `ProductCardGrid`
- `ProductPickerCard`
- `ProductQuickPreviewPanel`
- `ProductPickerFooter`

---

### 7.2 商品卡来源产品条
引用后必须显示：
- 来源产品名称
- 来源产品编号
- 来源版本信息
- 查看来源产品按钮

必做组件：
- `ProductReferenceBanner`

---

### 7.3 来源产品详情抽屉
挂载位置：
- `/orders/:orderId?drawer=source-product&itemId=xxx`

必做内容：
#### 产品原始详情
- 基础信息
- 参数配置
- 定制规则
- 生产参考

#### 订单参数对比
首轮先对比：
- 材质
- 工艺
- 规格值
- 是否需测量工具
- 是否需重新建模

#### 文件资料
- 图片摘要
- 建模文件摘要
- 其他文件摘要

必做组件：
- `SourceProductDrawer`
- `SourceProductDrawerHeader`
- `SourceProductVersionNoticeCard`
- `SourceProductTabs`
- `SourceProductDetailTab`
- `OrderVsProductCompareTab`
- `SourceProductAssetsTab`

### 交付结果
订单页已经能：
- 引用产品
- 显示来源产品
- 查看来源产品原始详情

### 验收标准
- 点击订单中的商品名称，打开的是来源产品详情
- 用户能看出模板值和订单值的差异

---

## 8. Sprint 5：规格选择与自动报价

### 目标
实现首轮最关键的业务能力：自动带价。

### 必做能力
1. 规格选择器
2. 规格参数自动带出
3. 基础价格自动带出
4. 固定加价规则叠加
5. 系统参考报价展示
6. warning 提示

---

### 8.1 商品卡中的规格选择器
必须支持：
- 标签或下拉展示
- 规格值选择
- 未选规格时提示

### 8.2 自动带出规格参数
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

### 8.3 自动带出基础价格
根据当前选中的规格行，自动显示基础价格。

### 8.4 固定加价叠加
根据当前订单商品已选项匹配规则：

- 材质
- 工艺
- 特殊需求

### 8.5 系统参考报价展示
固定公式：

**系统参考报价 = 规格基础价 + 所有生效固定加价之和**

### 8.6 warning
首轮至少提示：

- 未选规格
- 当前规格没有基础价格
- 当前附加项没有对应规则

### 必做组件
- `OrderItemSpecPricingBlock`
- `OrderItemSpecSelector`
- `OrderItemSpecSummaryGrid`
- `OrderItemBasePriceCard`
- `OrderItemPriceBreakdownList`
- `OrderItemQuoteSummaryCard`
- `OrderItemQuoteWarningAlert`

### 交付结果
订单商品卡中的规格选择与自动报价能力可以演示。

### 验收标准
- 戒指 16号自动带参数和价格
- 吊坠小号自动带参数和价格
- 附加项变化后能自动更新系统参考报价

---

## 9. Sprint 6：联调与演示

### 目标
把前面所有页面和交互串起来，形成首轮可演示闭环。

### 必做
#### 演示数据
至少准备两套完整 mock 样例：
1. 戒指产品 + 订单链路
2. 吊坠产品 + 订单链路

#### 验证路径
- 产品列表 → 产品详情
- 产品详情 → 产品编辑
- 订单列表 → 订单详情
- 商品卡 → 产品引用选择器
- 商品卡 → 来源产品详情抽屉

#### 验证业务链
##### 戒指
- 引用产品
- 选 16号
- 选 18K金
- 选微镶
- 选刻字
- 自动生成系统参考报价

##### 吊坠
- 引用产品
- 选小号
- 选珐琅
- 选加急
- 自动生成系统参考报价

### 必做补齐
- loading 态
- 空状态
- warning 提示
- 页面间跳转串联

### 交付结果
首轮已不只是页面壳，而是可演示业务主链路。

### 验收标准
- 两条业务样例都能演示
- 页面跳转顺畅
- 核心链路无断点

---

## 10. 当前阶段不做的内容

为保证首轮聚焦，这些统一后置：

- 多轴规格
- 人工最终报价
- 高级冲突拦截
- 审批流
- 复杂售后
- 复杂物流
- 高级文件上传管理
- 产品引用记录增强
- 版本历史增强

---

## 11. 推荐执行顺序

建议严格按下面顺序，不要乱序：

1. Sprint 0：框架与通用组件
2. Sprint 1：产品查看能力
3. Sprint 2：产品编辑最小可用版
4. Sprint 3：订单查看与骨架
5. Sprint 4：订单 × 产品桥接
6. Sprint 5：规格选择与自动报价
7. Sprint 6：联调与演示

---

## 12. 每个 Sprint 的交付标准

### 一个 Sprint 结束后，必须明确输出：
1. 本轮完成了哪些页面
2. 本轮新增了哪些组件
3. 当前能演示什么
4. 当前还缺什么
5. 下一轮建议继续做什么

这样便于后续 handoff 和记忆连续推进。