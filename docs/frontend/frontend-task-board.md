# 前端任务板（Purchase + OrderLine 收口版）

## 1. 文档定位

本文档用于记录当前前端主线的真实完成情况、暂停项和后续清理任务。

当前项目已经从旧订单中心口径收口为：

```text
Customer -> Purchase -> OrderLine -> Product
```

对象定义：

- `Customer` = 客户
- `Purchase` = 购买记录 / 一次购买公共信息
- `OrderLine` = 商品行 / 一件商品的执行对象
- `Product` = 产品模板
- `ProductSnapshot` = 来源产品快照

当前主入口：

- `/order-lines`
- `/purchases/new`
- `/purchases/:purchaseId`
- `/products`
- `/customers`
- `/customers/:customerId`
- `/tasks`
- `/production-follow-up`
- `/design-modeling`
- `/factory`
- `/finance`
- `/inventory`
- `/management`
- `/production-plan`

legacy `/orders` 模块已经删除，不再作为兼容路由或当前任务板主线存在。

---

## 2. 当前阶段原则

当前项目已经完成 legacy `/orders` 删除与 OrderLine-centered mock v1 工作台打底。

当前阶段只做：

1. 当前 `Purchase + OrderLine` 主线稳定性验证
2. 商品行资料完整性、风险、逾期和角色待办规则复用
3. 文档与命名口径收口
4. 后续真实后端 / 真实权限 / 真实文件上传前的边界说明

本阶段不做：

- 真实后端接口接入
- 真实后端鉴权或复杂权限系统
- 真实文件上传、真实财务导出或复杂对账
- 复杂客户 CRM、客户画像或营销自动化
- 旧 `/orders` 的重新引入
- 产品管理模块重做
- 新审批流或复杂流程引擎

---

## 3. 状态说明

- 已完成：当前主线中已有可访问页面、组件或前端态能力
- 暂停：明确不在当前清理收口阶段推进
- 待清理：不新增功能，只做命名、依赖、旧文件和兼容层收口
- 兼容保留：为避免破坏已有页面、测试或演示，暂时保留但不作为主线

---

## 4. 当前主线已完成能力

### 4.1 商品行中心 `/order-lines`

状态：已完成

当前能力：
- 以 `OrderLine` 作为列表主对象
- 一行代表一件商品，而不是一笔购买记录
- 支持查看商品行状态、客户、所属购买记录、来源产品、负责人、交期和生产摘要
- 支持展示商品行编号、生产任务编号、款式、版本、货号 / SKU 和实际需求摘要
- 可打开商品行详情抽屉
- 当前主入口已替代旧 `/orders` 导航入口

验收口径：
- `/order-lines` 是当前商品执行对象的主列表
- 不再把旧订单中心写成当前主模块

### 4.2 `OrderLineDetailDrawer` 商品行详情抽屉

状态：已完成

当前能力：
- 承载单件商品的执行详情
- 展示基础信息、实际需求、规格报价、跟单 / 下厂、工厂回传、物流、售后和操作日志
- 支持在 `/order-lines` 与 `/purchases/:purchaseId` 中复用
- 所有操作优先按 `orderLineId` 定位当前商品行

验收口径：
- 商品行详情抽屉是单件商品执行信息的主要承载处
- 购买记录详情页只做归组，不替代商品行执行详情

### 4.3 `/purchases/new` 新建购买记录草稿流

状态：已完成

当前能力：
- 创建一笔 `Purchase` 草稿
- 在同一笔购买记录下维护多条商品行草稿
- 每条商品行草稿可独立引用产品、选择规格并生成参考报价
- 每条商品行草稿可录入生产任务编号、货号 / SKU、款式、版本、尺寸、印记、设计 / 建模 / 出蜡需求
- 每条商品行草稿展示资料完整度和缺失项
- 客服确认完成后，按 `requiresDesign / requiresModeling` 分流到 `pending_design / pending_modeling / pending_merchandiser_review`
- 页面语义已从旧“新建订单”收口为“新建购买记录”

验收口径：
- 页面创建的是 `Purchase`
- 商品行草稿后续落为 `OrderLine`
- 不回退成旧 `order.items` 主线

### 4.4 `/purchases/:purchaseId` 购买记录详情归组页

状态：已完成

当前能力：
- 展示一次购买的公共信息
- 汇总展示本次购买下的多条商品行
- 复用商品行详情抽屉查看和维护单件商品
- 购买记录只承载归组、摘要和公共信息，不承载单件商品执行字段

验收口径：
- 购买记录详情页清楚表达“购买记录归组，商品行执行”
- 单件商品状态、物流、售后和生产信息优先落在 `OrderLine`

### 4.5 商品行引用产品、选择规格、自动报价

状态：已完成

当前能力：
- 商品行可以引用 `Product` 产品模板
- 引用后保留来源产品快照语义
- 支持选择规格
- 根据规格带出参数和基础价格
- 叠加固定加价规则
- 生成系统参考报价

验收口径：
- `Product` 是模板对象
- `OrderLine` 是执行对象
- 自动报价基于商品行当前选择和来源产品价格规则

### 4.6 来源产品详情抽屉

状态：已完成

当前能力：
- 从商品行或商品行草稿中打开来源产品详情
- 展示来源 `Product` 的模板信息
- 展示来源产品与当前商品行实际选择的轻量对比
- 不把产品模板字段直接写回商品行执行状态

验收口径：
- 来源产品详情展示的是模板，不是商品行详情
- 对比区用于核对，不改变主对象边界

### 4.7 商品行状态推进

状态：已完成

当前能力：
- 在商品行详情抽屉中推进当前商品行状态
- `/order-lines` 与 `/purchases/:purchaseId` 使用同一套商品行状态更新语义
- 状态更新按商品行独立发生
- `lineStatus` 已作为多角色工作流主状态字段接入 `/order-lines` 筛选、快捷视图、购买记录详情和任务分组
- 商品行详情抽屉展示客服资料完整度，并可执行客服确认分流
- 设计 / 建模 / 生产 / 工厂 / 财务状态字段已落在 `OrderLine`，用于后续跟单、设计建模、工厂和财务视图
- `status` 短期保留为兼容展示字段，后续新增逻辑优先使用 `lineStatus`

验收口径：
- 同一购买记录下的多件商品可以处于不同状态
- 状态推进不以整笔购买记录作为唯一驱动对象

### 4.8 `/production-follow-up` 生产跟进

状态：已完成

当前能力：
- 基于 `OrderLine` 展示跟单生产推进列表
- 支持按待跟单审核、待下发生产、生产中、待工厂回传、异常 / 逾期分组查看
- 支持保存工厂与计划交期
- 支持标记资料已齐、下发生产、标记生产中、标记阻塞
- 支持退回客服补资料或退回设计 / 建模修改

验收口径：
- 跟单页面只读取和更新当前 `OrderLine`
- 购买记录只作为归组跳转和编号展示
- 不恢复旧 `/orders` 路由、旧订单 store 或旧订单单件逻辑

### 4.9 `/design-modeling` 设计 / 建模工作台

状态：已完成

当前能力：
- 基于 `OrderLine` 展示待设计、设计中、待建模、建模中、待修改和已完成任务
- 支持领取设计 / 建模任务
- 支持标记设计中、设计完成、建模中、建模完成
- 支持标记需修改，并记录修改原因
- 支持记录出蜡文件名和发送出蜡厂时间

验收口径：
- 页面只展示商品执行需求、设计 / 建模状态和文件记录
- 不展示客户联系方式、销售价格、定金、尾款或利润
- 不恢复旧 `/orders` 路由、旧订单 store 或旧订单单件逻辑
- 任务分组来自 `OrderLine` 工作流状态，不回退到旧订单模型

### 4.10 `/factory` 工厂协同中心

状态：已完成

当前能力：
- 基于 `OrderLine.factoryId` 只展示分配给当前 mock 工厂的生产任务
- 支持待接收、生产中、待回传、已回传、异常视图
- 支持接收任务、标记开始生产、标记生产完成、提交工厂回传、标记异常
- 支持记录总重、净金重、实际材质、主石 / 辅石、工费、成品图文件名和结算单文件名

验收口径：
- 页面不展示客户姓名、联系方式、地址、销售价格、定金、尾款、利润或财务备注
- 回传后商品行进入 `factory_returned`，`financeStatus` 进入 `pending`
- 不恢复旧 `/orders` 路由、旧订单 store 或旧订单单件逻辑

### 4.11 `/finance` 财务中心

状态：已完成

当前能力：
- 基于 `Purchase.finance` 展示应收、定金、尾款和收款确认状态
- 基于 `OrderLine.productionData / financeStatus` 展示工厂回传、结算金额、成本和毛利摘要
- 支持确认定金、确认尾款、确认工厂结算、标记财务异常、填写财务备注和锁定财务数据

验收口径：
- 财务可查看金额、成本和工厂回传数据
- 财务确认后商品行进入 `ready_to_ship`，`financeStatus` 进入 `confirmed`
- 财务不负责推进设计、建模或生产执行字段
- 不恢复旧 `/orders` 路由、旧订单 store 或旧订单单件逻辑

### 4.12 `/management` 管理看板

状态：已完成

当前能力：
- 基于 `Purchase + OrderLine` 汇总业务总览、商品行状态分布、生产风险、财务概览、角色负载和工厂表现
- 统计逻辑集中在 `managementDashboard` selector 中，不堆在页面 JSX
- 提供进入商品行中心和财务中心的入口

验收口径：
- 管理看板只做汇总观察，不承接具体录入动作
- 不恢复旧 `/orders` 路由、旧订单 store 或旧订单单件逻辑

### 4.13 `/inventory` 仓库商品管理

状态：已完成

当前能力：
- 基于 `InventoryItem` 展示设计留样、客户退货、常备采购和其他库存
- 支持全部库存、设计留样、客户退货、待检 / 瑕疵、已占用、不可用快捷视图
- 支持按来源、库存状态、成色、库位和关键词筛选
- 展示关联的 Product / Purchase / OrderLine / Customer 信息，用于来源追溯
- 支持查看单条库存详情和该库存自己的流转记录
- 支持客户退货、待检修和瑕疵库存的前端 mock 质检处置
- 支持前端 mock 入库、占用、释放、出库、报废和库位调整记录，并可把库存流转关联到具体商品行
- 支持按流转类型、关联商品行和关键词筛选库存流转记录
- 库管角色可见仓库商品入口

验收口径：
- 仓库商品管理是库存资产台账，不是 Product 模板页，也不是 OrderLine 执行页
- 库存记录不推进商品行生产、财务或售后状态
- 质检处置只更新库存成色、状态、可用数量、库位和库存流转记录
- 关联商品行的库存流转只用于库管追溯，不改写 `OrderLine.lineStatus`
- 当前不做真实库存审批、盘点、条码系统或后端库存锁定
- 不恢复旧 `/orders` 路由、旧订单 store 或旧订单单件逻辑

### 4.14 角色权限视图边界

状态：已完成

当前能力：
- 新增前端 mock role capability 配置，覆盖客服、跟单、设计、建模、工厂、库管、财务、管理和管理员
- 侧边栏按当前角色显示可见入口
- 工厂、跟单、设计建模、财务页面的关键操作按钮按 role action 做前端禁用
- 保留 mock role switcher，不接真实登录或后端鉴权

验收口径：
- 工厂角色看不到财务中心和管理看板入口
- 库管角色可以看到仓库商品入口，但看不到财务中心或工厂协同入口
- 财务角色可以看到财务中心
- 设计 / 建模角色可以看到设计建模入口
- 跟单角色可以看到生产跟进入口
- 管理角色可以看到管理看板入口
- 不恢复旧 `/orders` 路由、旧订单 store 或旧订单单件逻辑

### 4.15 商品行风险、逾期和资料完整性规则

状态：已完成

当前能力：
- 新增 `orderLineRiskSelectors`，集中计算商品行资料完整性、生产逾期、工厂回传异常、财务异常和角色待办徽标
- `/order-lines`、购买记录详情、生产跟进、财务中心和管理看板复用同一套商品行风险口径
- 保留客服资料完整性字段要求：商品名称、品类、材质、尺寸 / 规格、工艺要求、生产任务编号
- 财务风险统一覆盖工厂未回传重量、净金重大于总重、材质为空、工厂结算金额为空、工费为空和销售金额为空

验收口径：
- 新增风险、逾期、资料完整性判断优先复用 selector，不在页面 JSX 中重复散落
- 规则只基于 current `OrderLine`、`Purchase` 和关联记录，不恢复旧 `/orders` 口径

### 4.16 商品行操作日志

状态：已完成

当前能力：
- 记录商品行状态变化和关键维护动作
- 日志按商品行独立展示
- 不同商品行的日志不会混在一起

验收口径：
- 操作追溯以 `OrderLine` 为主
- 购买记录时间线只承载归组级或公共事件

### 4.17 商品行基础信息 / 实际需求编辑

状态：已完成

当前能力：
- 在商品行详情抽屉中编辑基础信息和实际需求
- 保存后只更新当前商品行
- 购买记录详情页中的对应商品行同步展示更新结果
- 编辑后追加商品行操作日志

验收口径：
- 单件商品的实际执行信息不塞回 `Purchase`
- 变更以当前商品行为边界

### 4.17 跟单 / 下厂信息编辑

状态：已完成

当前能力：
- 在商品行详情抽屉中维护跟单与下厂信息
- 支持维护跟单负责人、下厂相关字段和备注
- 保存后只更新当前商品行
- 编辑后追加商品行操作日志

验收口径：
- 跟单和下厂信息是商品行级执行信息
- 不扩展为独立工厂协同中心

### 4.18 工厂回传信息编辑

状态：已完成

当前能力：
- 在商品行详情抽屉中维护工厂回传信息
- 支持维护材料、重量、石料、工费和工厂发货相关信息
- `/order-lines` 与 `/purchases/:purchaseId` 可同步查看更新后的商品行生产摘要
- 编辑后追加商品行操作日志

验收口径：
- 工厂回传仍属于当前商品行的生产执行信息
- 当前不做完整工厂协同中心

### 4.19 物流新增 / 编辑 / 作废

状态：已完成

当前能力：
- 在商品行详情抽屉中新增物流记录
- 支持编辑已有物流记录
- 支持作废物流记录并保留痕迹
- 商品行中心和购买记录详情页按 `orderLineId` 汇总物流摘要
- 物流维护后追加商品行操作日志

验收口径：
- `LogisticsRecord` 默认关联 `orderLineId`
- 不把物流做成整笔购买唯一记录

### 4.20 售后新增 / 编辑 / 关闭

状态：已完成

当前能力：
- 在商品行详情抽屉中新增售后记录
- 支持编辑售后记录
- 支持关闭售后记录
- 商品行中心和购买记录详情页按 `orderLineId` 汇总售后摘要
- 售后维护后追加商品行操作日志

验收口径：
- `AfterSalesCase` 默认关联 `orderLineId`
- 同一购买记录中只有部分商品进入售后时，可以独立处理

---

## 5. 当前暂停项

### 5.1 财务中心

状态：暂停

暂停说明：
- 当前只保留购买记录层面的付款汇总和商品行报价展示
- 不做完整财务中心、收退款流水中心、发票中心或复杂对账

恢复条件：
- Purchase + OrderLine 类型命名收口完成
- 商品行物流 / 售后 / 生产链路稳定
- 明确财务对象与 `Purchase`、`OrderLine` 的边界

### 5.2 工厂协同中心

状态：暂停

暂停说明：
- 当前只在商品行详情中维护跟单 / 下厂和工厂回传信息
- 不做工厂角色登录、工厂看板、工厂任务派发或复杂协同流

恢复条件：
- 商品行生产字段稳定
- 明确哪些字段属于内部跟单，哪些字段属于外部工厂回传

### 5.3 客户中心完整页面

状态：暂停

暂停说明：
- 当前保留 `Customer` 作为客户主档和关联对象
- 不做完整客户列表、客户详情、客户生命周期、客户画像或 CRM 功能

恢复条件：
- `Purchase` 与 `OrderLine` 主线稳定
- 明确客户中心需要承载的查询、沉淀和售后入口

### 5.4 真实后端

状态：暂停

暂停说明：
- 当前仍以前端 UI 和 mock 联调为主
- 不做真实接口、鉴权、后端错误码、数据库设计或服务拆分

恢复条件：
- mock schema 收口
- 兼容命名和旧模块依赖审计完成
- 当前页面字段与数据边界稳定

### 5.5 legacy `/orders` 删除

状态：已完成

完成说明：
- `/orders`、`/orders/new`、`/orders/:orderId` 已删除
- 旧 pages / components / services / types / mocks 已删除
- `useAppData.orders / updateOrderItem / createTaskFromOrder` 已删除
- 当前新建和执行主流程入口是 `/purchases/new` 与 `/order-lines`
- 如需回看旧实现，使用 git 历史 / 删除前 PR

验收结果：
- 所有当前主入口不再依赖旧 `/orders` 模块
- 测试和演示路径已切到 `/order-lines`、`/purchases/*`、`/customers/*`、`/tasks` 和 `/production-plan`
- current workflow route smoke 保持覆盖

---

## 6. 下一步清理任务

### 6.1 类型命名收口

状态：待清理

目标：
- 将当前主线类型统一到 `Customer / Purchase / OrderLine / Product / ProductSnapshot`
- 将 `TransactionRecord` 收口为 `Purchase` 的兼容别名
- 删除 `OrderItem` runtime 类型，并移除 current runtime 中的旧 `order*` 字段 fallback
- 将 `SourceProductSnapshot` 收口为 `ProductSnapshot`

检查范围：
- `src/types/*`
- `src/mocks/*`
- `src/components/business/*`
- `src/pages/*`
- 测试文件
- 文档示例

验收标准：
- 当前主线代码和文档不再把 `TransactionRecord` 当作当前主模型
- 新代码不继续扩大旧命名使用范围
- 兼容别名有清晰注释或集中出口

### 6.2 旧 `/orders` 依赖迁移审计

状态：已完成

目标：
- 确认当前 runtime 不再依赖旧 `/orders`
- 确认旧模块已删除
- 输出删除完成后的回滚口径

当前记录：
- 迁移准备文档：`docs/frontend/legacy-orders-removal-plan.md`
- 已梳理 legacy route smoke tests 保留 / 迁移 / 删除门槛
- 已梳理 productionPlan fallback 迁移顺序
- productionPlan 页面正常路径已 current-only，不再传 `appData.orders`
- productionPlan legacy write fallback 已迁移，生产反馈只写 `OrderLine.productionInfo`
- productionPlan adapter legacy read fallback 已移除，生产计划视图只从 `tasks + purchases + orderLines + products` 生成
- productionPlan 已移除 `OrderItem` 兼容详情形状，详情页直接使用 current `OrderLine`
- `useAppData` legacy orders APIs 已移除
- task timeline 已迁移到 current `Purchase.timeline`
- current task 更新不再 mirror 到 legacy `orders.timeline`
- legacy `/orders` route smoke 已移除，current workflow smoke 保留

检查范围：
- `src/app/router/*`
- current workflow runtime 代码
- 路由测试和 smoke 测试

验收标准：
- 当前导航不展示旧 `/orders`
- `/orders` 不再作为可访问路由存在
- productionPlan 和 task 当前路径不再依赖 legacy orders 写回或读取 fallback
- current workflow route smoke 已覆盖主入口
- 每个旧依赖都有“已删除 / 历史文档保留”的判断

### 6.3 低风险删除旧页面 / 旧组件

状态：已完成

目标：
- 删除不再被 current workflow 引用的旧页面、旧组件和旧 mock/type/service
- 删除旧 route smoke
- 保留 current workflow smoke

验收标准：
- 每轮删除前有引用搜索结果
- 删除后测试通过
- 不破坏 `/order-lines`、`/purchases/new`、`/purchases/:purchaseId`、`/products`、`/customers`、`/tasks`、`/production-plan`

---

## 7. 当前不再作为任务板主线的内容

以下内容如需出现，只能作为历史或兼容说明：

- 旧“订单中心”
- 旧“商品任务中心”
- 旧 `/orders`
- 旧 `/orders/new`
- 旧 `/orders/:orderId`
- `TransactionRecord` 作为当前主模型
- `OrderItem` 作为当前主对象
- `order.items` 作为当前主数据结构

当前任务板不得再按旧订单中心继续拆 Sprint，不得把旧 `/orders` 写成当前主入口。

---

## 8. 当前验收清单

清理收口阶段的每轮修改，都应至少确认：

1. 是否仍以 `Purchase + OrderLine` 为主线
2. 是否避免把旧 `/orders` 写成当前主模块
3. 是否没有新增财务中心、工厂协同中心、客户中心完整页面或真实后端功能
4. 是否没有修改产品管理模块的现有能力
5. 是否只在必要范围内改文档、类型、mock、路由或兼容层
6. 是否保留了必要旧模块，避免一次性破坏测试和演示

---

## 9. 本文档总结

当前前端任务板已经从“首轮订单中心建设计划”调整为“Purchase + OrderLine 收口任务板”。

后续工作重点不是继续扩展 ERP 新模块，而是：

```text
主线命名收口
-> 旧依赖审计
-> 低风险删除
-> 保持当前主入口稳定
```
