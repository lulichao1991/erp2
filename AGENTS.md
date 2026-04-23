# AGENTS.md

## Project
这是一个「定制电商协同 ERP」前端项目，当前处于 **Phase 2（业务流转版）**。

项目当前仍以**前端 UI、页面结构、组件复用、mock 数据联调**为主，**不接真实后端业务流**。

当前 Phase 2 的核心目标不是重写系统，而是在 Phase 1 基础上，把系统从：

- 前端展示版

升级为：

- 业务流转版

当前主链路为：

**产品中心 → 订单中心 → 任务中心**

---

## Current phase goals

Phase 2 只优先完成以下 3 个方向：

1. 订单中心升级为业务流转中心
2. 新增任务中心
3. 产品管理升级为产品标准档案

---

## Phase 2 must-have business chain

当前必须优先跑通的核心业务链路：

**产品维护（含规格明细、价格规则、业务说明）  
→ 订单引用产品  
→ 选择规格  
→ 自动带出规格参数  
→ 自动带出基础价格  
→ 叠加固定加价规则  
→ 生成系统参考报价  
→ 形成订单商品快照  
→ 发起任务  
→ 推动订单状态流转**

---

## Working mode
- 前端优先，先做 UI、页面结构、组件复用、mock 数据联调。
- 没有明确要求前，不要接真实后端接口。
- 没有明确要求前，不要重构整个工程。
- 没有明确要求前，不要引入新的大型依赖或新的 UI 框架。
- 优先复用已有组件、已有路由、已有样式体系。
- 优先小步迭代，每轮只完成一个明确子任务。
- 优先增量升级现有页面，不要推翻 Phase 1 已有结构。
- 先让页面“能看、能跳、能演示主链路”，再补复杂细节。
- 先做结构与联动，再做视觉优化。

---

## Coding behavior rules

### 1. Think before coding
- 不要默默假设需求。
- 如果一个需求有多种解释，先明确列出，再实现。
- 如果信息不足以安全实现，先指出不清楚的地方。
- 如果存在明显更简单的方案，要主动说明。
- 如果当前任务存在业务冲突、字段语义不一致、页面对象混淆，先停下来说明，不要硬写。

### 2. Simplicity first
- 只做当前需求最小可用实现。
- 不做没有被要求的抽象、配置化、泛化、扩展点。
- 不为单次使用场景提前设计复杂框架。
- 不增加“以后可能会用到”的功能。
- 如果一个需求可以 50 行解决，就不要写成 200 行。

### 3. Surgical changes
- 只改与当前任务直接相关的代码。
- 不顺手重构旁边没坏的模块。
- 不擅自统一格式、改命名、重排结构。
- 如果你的改动导致某些 import / 变量 / 组件变成未使用，可以清理你自己造成的部分。
- 不要删除原本就存在但与你当前任务无关的旧代码，除非明确要求。

### 4. Goal-driven execution
- 每轮任务开始前，先明确：
  1. 本轮目标
  2. 涉及页面
  3. 涉及组件
  4. 验收标准
- 先定义“什么算完成”，再写代码。
- 每轮完成后必须输出：
  1. 修改了哪些文件
  2. 新增了哪些组件
  3. 当前能演示什么
  4. 还缺什么
  5. 下一轮最建议继续做什么

### 5. Example reference
如果需要理解以上原则的具体正反例，请参考：
- `CLAUDE.md`
- `EXAMPLES.md`

这两个文件用于补充说明编码行为，不替代本文件中的项目规则。

---

## Current priority

### P0：Phase 2 文档与数据结构对齐
- 对齐 `phase-2-prd.md`
- 对齐 `order-lifecycle-spec.md`
- 对齐 `task-center-prd.md`
- 对齐 `role-draft.md`
- 对齐 `phase-2-task-board.md`
- 对齐 `codex-prompts-phase-2.md`
- 升级 TypeScript 类型与 mock 数据结构

### P1：订单中心升级
- 订单列表增强
- 新建订单页支持多个订单商品
- 订单详情页升级为业务流转页
- 订单状态流转
- 订单时间线
- 报价调整展示层

### P2：任务中心
- 新增 `/tasks`
- 新增 `/tasks/:taskId`
- 订单详情页发起任务
- 任务与订单、时间线联动

### P3：产品管理升级
- 产品详情页升级为标准档案页
- 产品新建 / 编辑页补充业务字段
- 图片 / 文件占位
- 生产说明 / 售后说明 / 内部备注

### P4：首页增强
- 轻量工作台摘要
- 快捷入口
- 订单 / 任务统计占位

### P5：角色模式前端模拟
- mock 用户角色
- 页面显隐
- 局部字段 / 按钮禁用

---

## Must-have business rules

### 1. 产品与订单商品不是同一个对象
- 产品 = 产品库里的标准模板
- 订单商品 = 订单里的业务实例
- 订单商品引用产品后，必须保留来源信息与快照语义

### 2. 点击订单中的商品名称
默认打开的是：
- 来源产品详情
不是：
- 订单商品详情

### 3. 来源产品详情的作用
用于核对：
- 订单商品参数
- 来源产品原始模板参数
是否一致、已调整、或冲突

### 4. 自动报价公式
当前 Phase 2 仍固定为：

**系统参考报价 = 规格基础价 + 所有生效固定加价之和**

当前阶段不要实现：
- 多轴规格
- 复杂公式
- 阶梯价
- 动态脚本规则

### 5. 当前规格模式
当前只支持：
- 无规格
- 单轴规格

当前不做：
- 多轴规格

### 6. 戒指场景必须支持
产品可维护不同圈号的：
- 面宽
- 底宽
- 面厚
- 底厚
- 参考重量
- 基础价格

订单引用后，选择圈号，必须自动带出参数和基础价格。

### 7. 吊坠场景必须支持
产品可维护不同档位（小号/中号/大号）的：
- 长
- 宽
- 厚
- 参考重量
- 基础价格

订单引用后，选择档位，必须自动带出参数和基础价格。

### 8. 自动报价必须持续可演示
至少必须能持续跑通两条 mock 链路：
- 戒指：16号 + 材质/工艺/特殊需求加价
- 吊坠：小号 + 工艺/特殊需求加价

### 9. 订单状态必须按生命周期流转
当前订单状态统一按以下口径实现：
- `draft`
- `pending_confirm`
- `pending_design`
- `pending_production_prep`
- `pending_shipping`
- `after_sales`
- `completed`
- `cancelled`

不要擅自新增或改名。

### 10. 任务必须有业务来源
当前任务中心只服务订单流转。
任务必须：
- 关联订单
- 必要时关联订单商品

不要做无来源的自由任务池。

### 11. 订单时间线必须可追溯
订单详情页必须能展示关键记录，例如：
- 创建订单
- 引用产品
- 修改规格
- 重新计算报价
- 状态切换
- 创建任务
- 完成任务
- 更新备注

---

## Page scope

### Dashboard
- `/`

### Orders
- `/orders`
- `/orders/new`
- `/orders/:orderId`

### Products
- `/products`
- `/products/new`
- `/products/:productId`
- `/products/:productId/edit`

### Tasks
- `/tasks`
- `/tasks/:taskId`

不要擅自扩展到财务中心、工厂协同中心、物流中心等新的一级模块页面。

---

## Modal and drawer scope

### 订单上下文
- 产品引用选择器
- 来源产品详情抽屉
- 新建任务弹层 / 抽屉
- 商品信息编辑抽屉
- 物流记录弹窗（占位）
- 售后记录弹窗（占位）

### 产品上下文
- 新增价格规则弹窗
- 新增文件版本弹窗
- 文件上传抽屉（占位）
- 引用记录抽屉
- 版本记录抽屉

### 任务上下文
- 任务状态更新弹层（可选轻量）
- 任务责任人选择弹层（可选轻量）

---

## UI structure rules

### 订单详情页
必须采用：
- 顶部订单概览
- 状态流转区
- 订单级信息区
- 订单商品协同区
- 任务摘要区
- 时间线区

不要把订单详情页做成一个超长大表单。

### 商品卡
商品卡必须是订单详情页里的核心复用组件。
商品卡至少要能承载：
- 来源产品条
- 规格与报价区
- 客服需求区
- 设计建模区（可逐步补）
- 跟单执行区（可逐步补）
- 关联任务摘要

### 产品详情页
必须采用：
- 顶部摘要区
- 分区导航
- 基础信息
- 参数配置
- 价格规则
- 业务说明
- 生产参考
- 图片与文件
- 引用记录
- 版本记录

### 产品编辑页
必须采用：
- 顶部保存区
- 左侧分区导航
- 右侧分区表单

不要做成无导航的超长表单。

### 任务详情页
必须采用：
- 顶部任务摘要
- 来源订单信息区
- 来源订单商品信息区（如有）
- 任务说明区
- 状态操作区
- 记录区

---

## Component rules

### 命名规则
组件命名统一采用：
对象 + 功能 + 组件类型

例如：
- OrderSummaryCard
- ProductPickerModal
- SourceProductDrawer
- OrderItemSpecPricingBlock
- OrderTimelinePanel
- TaskSummaryList
- TaskStatusBadge

禁止使用模糊命名：
- InfoBox
- MainBlock
- DetailArea
- MyCard

### 组件复用规则
以下能力必须优先抽成可复用组件：
- 状态标签
- 版本标签
- 引用标签
- 卡片壳
- 文件列表
- 图片展示
- 时间轴
- 弹窗壳
- 抽屉壳
- 任务摘要列表
- 时间线记录项

### 页面开发规则
先做：
- 查看态
后做：
- 编辑态

先做：
- 骨架
后做：
- 复杂交互

先做：
- 结构清楚
后做：
- 视觉优化

---

## Data and mock rules

当前阶段必须使用稳定的 mock 数据结构，不要边做边随意发明字段名。

至少要统一以下前端对象：
- `Product`
- `ProductSpecRow`
- `ProductPriceRule`
- `Order`
- `OrderItem`
- `SourceProductSnapshot`
- `QuoteResult`
- `Task`
- `TimelineRecord`

### 关键字段语义不要改
- `sourceProductId`
- `sourceProductVersion`
- `selectedSpecValue`
- `basePrice`
- `priceAdjustments`
- `systemQuote`

Phase 2 建议新增并统一这些字段：
- `status`
- `ownerName`
- `priority`
- `dueDate`
- `activeTaskCount`
- `latestActivityAt`
- `manualAdjustment`
- `manualAdjustmentReason`
- `finalDisplayQuote`
- `orderId`
- `orderItemId`

如果确实需要改字段名，必须同步更新相关 mock、组件 props、页面使用点和文档。

---

## Source product vs order item
这是当前项目最容易做错的地方，必须严格遵守：

- 来源产品 = 产品库里的原始模板
- 订单商品 = 当前订单里的实例
- 来源产品详情抽屉 = 看模板原始值 + 做参数对比
- 商品卡里的实际需求 = 当前订单真实执行值

不要把两者混在同一个详情视图里。

---

## Pricing rules

### 当前阶段允许
- 规格基础价
- 固定加价规则
- 系统参考报价展示
- 人工调整金额展示
- 调整后报价展示
- 调整原因展示

### 当前阶段暂不做
- 人工最终报价覆盖系统价的复杂审批逻辑
- 报价审批流
- 多版本报价历史
- 复杂联动公式
- 多轴规格定价

---

## Task rules

### 当前任务类型只允许
- `order_process`
- `design_modeling`
- `production_prep`
- `after_sales`

### 当前任务状态只允许
- `todo`
- `in_progress`
- `pending_confirm`
- `done`
- `closed`

逾期优先作为派生标签展示，不优先单独设计复杂状态机。

---

## File rules
当前文件相关先做“查看与展示”为主，不优先做复杂上传管理。

产品侧文件至少要有这些概念：
- 主图
- 细节图
- 建模文件
- 工艺图
- 尺寸图
- 文件版本

订单侧文件先保留区块与展示占位，上传增强后续再补。  
任务侧附件先保留字段和展示占位，不做完整上传系统。

---

## Styling rules
整体风格必须：
- 专业
- 清晰
- 稳定
- 卡片化
- 中后台风格

不要做：
- 过重动画
- 花哨渐变
- 强营销风视觉
- 复杂玻璃态

优先保证：
- 信息层级清楚
- 状态明显
- 价格与时间压力可快速扫读
- 任务与订单摘要易于扫描

---

## Do not
- 不要擅自改主业务链路
- 不要把当前目标退回成“只做静态 UI”
- 不要跳过规格明细和自动带价
- 不要把来源产品详情做成订单商品详情
- 不要把订单详情页重新做成传统大表单
- 不要在没有要求时引入后端接口层重构
- 不要随意创建重复组件
- 不要修改已有 mock 字段语义而不说明
- 不要提前做财务中心
- 不要提前做工厂协同中心
- 不要提前做复杂物流系统
- 不要提前做完整权限框架
- 不要提前做审批流

---

## Recommended docs to read first
开始工作前，优先阅读这些项目文档（如果存在）：

### Phase 2 核心文档
- `README.md`
- `docs/frontend/phase-2-prd.md`
- `docs/frontend/order-lifecycle-spec.md`
- `docs/frontend/task-center-prd.md`
- `docs/frontend/role-draft.md`
- `docs/frontend/phase-2-task-board.md`
- `docs/frontend/codex-prompts-phase-2.md`

### 现有基础文档
- `docs/frontend/frontend-prd.md`
- `docs/frontend/routes-and-pages.md`
- `docs/frontend/ui-structure.md`
- `docs/frontend/components-plan.md`
- `docs/frontend/mock-data-schema.md`
- `docs/frontend/business-rules.md`
- `docs/frontend/frontend-task-board.md`
- `docs/frontend/handoff.md`

如果文档冲突，优先级建议按以下顺序处理：

1. `AGENTS.md`
2. 当前阶段 `handoff.md`
3. `phase-2-prd.md`
4. `order-lifecycle-spec.md`
5. `task-center-prd.md`
6. `phase-2-task-board.md`
7. `business-rules.md`
8. 其他说明文档