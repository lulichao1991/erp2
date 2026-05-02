# 定制电商协同 ERP（前端）

## 项目说明
这是一个面向珠宝 / 定制饰品业务的定制电商协同 ERP 前端项目。

legacy `/orders` 清理已经收口，当前进入以 `OrderLine` 为核心的业务工作流 v1 打底阶段。项目仍以前端 UI、页面结构、组件复用和 mock 数据联调为主，暂不接真实后端业务流。

---

## 当前业务主线

当前项目主线统一为：

- `Customer` = 客户
- `Purchase` = 购买记录 / 一次购买公共信息
- `OrderLine` = 销售 / 一件商品的执行对象
- `Product` = 款式模板
- `ProductSnapshot` = 来源款式快照
- `InventoryItem` = 仓库商品 / 库存资产
- `LogisticsRecord` / `AfterSalesCase` 默认关联 `orderLineId`

系统真正的主操作对象是 **OrderLine（销售）**。

---

## 当前开发阶段

当前阶段进入 **OrderLine workflow foundation**：

- 补齐自动生成货号、来源款式、款式、版本等执行基础字段；销售预览以货号为主识别码，当前编号体系只保留货号、购买记录编号和平台订单号
- 销售中心列表在货号下展示款式名称和版本号，商品列只放产品缩略图；客户列展示客户姓名和客户 ID，不再维护额外销售编号
- `lineStatus`、设计 / 建模 / 生产 / 工厂 / 财务状态字段作为多角色分流基础
- `OrderLine.status` 兼容字段已删除；新筛选、任务分组和角色视图统一使用 `lineStatus`
- `/purchases/new` 继续输出 `purchaseDraft + orderLineDrafts`
- 每条销售草稿可引用款式，也可覆盖本次购买的实际材质、尺寸、工艺、印记和特殊需求
- 客服确认前展示资料完整度，确认后按设计 / 建模需求分流到后续 `lineStatus`
- `/production-follow-up` 提供跟单生产跟进视图，基于 `OrderLine` 展示待审核、待下发、生产中、待回传和异常 / 逾期销售
- `/design-modeling` 提供设计 / 建模工作台，基于 `OrderLine` 展示待设计、设计中、待建模、建模中、待修改和已完成任务
- `/factory` 提供工厂协同中心，只展示分配给当前 mock 工厂的销售生产资料和回传表单
- `/finance` 提供财务中心，围绕 Purchase 收款汇总和 OrderLine 工厂回传数据做结算确认、异常标记和锁定
- `/inventory` 提供仓库商品管理，作为库管库存资产台账记录设计留样、客户退货、常备采购和其他库存，并支持总数 / 可用数 / 已占用数展示、库位汇总、库管快捷视图、可领用 / 待出库 / 待盘点视图、低库存预警、库存详情来源追溯、关联销售占用 / 出库追溯、质检处置、库存盘点、关联销售的前端 mock 入库、占用、释放、出库、报废、库位调整和流转记录筛选
- `/management` 提供管理看板，汇总 Purchase、OrderLine、生产风险、财务概览、角色负载和工厂表现
- 前端 mock role capability 已覆盖客服、跟单、设计、建模、工厂、财务、管理、管理员的导航可见性和关键动作边界
- 销售资料完整性、生产逾期、工厂回传异常、财务异常和角色待办徽标统一由 `orderLineRiskSelectors` 计算
- `/order-lines` 与 `/purchases/:purchaseId` 继续复用同一套销售详情能力
- 暂不接真实后端

---

## 当前核心链路

首轮主链路是：

**款式维护（含规格明细与价格规则）
-> 销售引用款式
-> 选择规格
-> 自动带出规格参数
-> 自动带出基础价格
-> 叠加固定加价规则
-> 生成系统参考报价**

---

## 常用验证命令

```bash
npm test
npm run build
npm run analyze:dead
```

说明：
- `npm test` 包含当前 router 与 `docs/frontend/routes-and-pages.md` 路由最小集的一致性检查
- `npm test` 包含当前 `src/mocks` 数据文件与 `docs/frontend/mock-data-schema.md` mock 文件清单的一致性检查
- `npm test` 包含当前主领域类型文件与 `docs/frontend/mock-data-schema.md` 对象章节的一致性检查；支撑 / 兼容类型文件必须在测试中显式列为例外
- `analyze:dead` 使用 `knip` 检查未使用文件、导出和依赖
- `knip.json` 已将领域类型导出列为显式保留项
- 新增领域类型例外时，必须同步更新 `knip.json` 和相关文档说明

---

## 当前主页面

### 销售与购买记录

- `/`：工作台
- `/order-lines`：销售中心
- `/purchases/new`：新建购买记录
- `/purchases/:purchaseId`：购买记录详情
- `/tasks`：任务中心
- `/tasks/:taskId`：任务详情
- `/production-follow-up`：生产跟进 / 跟单视图
- `/design-modeling`：设计 / 建模工作台
- `/factory`：工厂协同中心
- `/finance`：财务中心
- `/inventory`：仓库商品管理
- `/management`：管理看板
- `/production-plan`：生产计划
- `/production-plan/:taskId`：生产计划详情

说明：
- 工作台只做待办、购买记录和风险摘要，不替代各业务主页面
- 销售中心一行代表一件商品
- 购买记录用于保存一次购买中的公共信息
- 购买记录详情页是归组页，展示本次购买下的所有销售
- 任务中心只作为协作提醒和跟进入口，不替代 `OrderLine.lineStatus` 主流程
- 生产跟进页按销售筛选生产推进状态，不回退到旧订单单件逻辑
- 生产计划页只从当前 `tasks + purchases + orderLines + products` 生成视图，不读取旧订单模型
- 设计建模页只展示商品执行需求、设计 / 建模状态和文件记录，不展示客户隐私或财务金额
- 工厂协同页只展示分配给当前工厂的生产资料，不展示客户联系方式、销售价格、定金、尾款、利润或财务备注
- 财务中心可以查看金额、成本和工厂回传数据，但不负责推进设计、建模或生产状态
- 仓库商品管理是库存资产台账，不是款式模板页，也不是销售执行页；库存可关联 Product / Purchase / OrderLine 作为来源追溯，库存流转不驱动销售状态
- 管理看板只做汇总观察，不承接客服、跟单、工厂或财务录入动作

### 角色边界

当前角色控制是前端 mock capability，不是后端安全鉴权。

- 客服：维护客户、购买记录和销售客服确认信息
- 跟单：处理生产跟进、工厂计划和下发动作
- 设计 / 建模：处理设计建模工作台和文件记录
- 工厂：只看工厂任务和生产回传，不看客户联系方式、销售价格、利润或财务备注
- 财务：处理收款、工厂结算、成本确认和财务异常
- 管理：查看汇总看板，默认不直接编辑流程字段
- 管理员：当前 demo 中可见并可操作全部前端能力

### 产品模块

- `/products`
- `/products/new`
- `/products/:productId`
- `/products/:productId/edit`

### Legacy `/orders` removal

legacy `/orders` 模块已经删除，不再作为可访问路由或兼容入口保留。

当前购买与商品执行主流程统一使用：

- `/purchases/new`
- `/purchases/:purchaseId`
- `/order-lines`

如需回看旧实现或回滚兼容入口，请使用删除前的 git 历史 / PR 记录。

---

## 关键业务定义

### Customer
客户主档，用于沉淀客户长期信息、历史购买记录、历史销售和售后记录。

### Purchase
购买记录。一次购买行为的公共信息容器，用于保存系统生成的购买记录编号、平台订单号、客户收件信息、支付时间、整笔购买备注、付款汇总等公共信息。

`Purchase` 是归组对象，不是单件商品执行对象。

### OrderLine
销售。系统真正的主操作对象。

一件商品对应一条独立销售，可分别推进规格确认、设计、委外、生产、发货和售后。

### Product
款式库中的标准模板，用于维护产品资料、规格明细、固定加价规则、定制规则、生产参考和文件资料。

`Product.version` 是款式设计版本，只在款式外观结构、设计稿或设计方案变化时升级；补齐参数、价格规则、生产参考或文件资料不触发升版。

不同设计版本保存在同一个 `Product.versionHistory` 中，通过款式编辑页的“设计版本”区块创建，并在款式详情的版本记录中查看；不需要为了 v4、v5 新建款式。

### ProductSnapshot
销售引用款式时保留的来源款式快照，用于核对模板值与本次销售实际选择。

### InventoryItem
仓库商品 / 库存资产，用于记录设计部门留样、客户退货入库、常备采购、寄售和其他库存。

库存记录可以关联 `Product / Purchase / OrderLine / Customer` 做来源追溯，并可由库管做质检处置、盘点或记录关联销售的占用 / 出库；库存台账会明确展示总数、可用数和已占用数，库存工作台徽标由统一 selector 计算。库存变更不替代款式模板，也不驱动销售执行状态。

---

## 当前最重要的规则

### 1. 产品与销售不是同一个对象
- 产品 = 模板
- 销售 = 实例

### 2. 购买记录与销售不是同一个对象
- 购买记录 = 一次购买中的公共信息
- 销售 = 单件商品的独立执行对象

### 3. 物流和售后默认关联销售
- 物流记录优先关联 `orderLineId`
- 售后记录优先关联 `orderLineId`
- 同一次购买中的多件商品可以分别发货、分别售后

### 4. 状态流转优先基于销售
- `OrderLine.lineStatus` 是多角色工作流的主状态字段
- `designStatus`、`modelingStatus`、`productionStatus`、`factoryStatus`、`financeStatus` 用于后续角色视图分流
- `OrderLine.status` 已删除，不再作为兼容展示字段保留
- 客服确认动作按 `requiresDesign / requiresModeling` 分流，不把单件执行状态塞回 `Purchase`

### 5. 旧命名只作为历史口径
- `SourceProductSnapshot` 只能作为 `ProductSnapshot` 的历史兼容命名

---

## 当前阶段不做

当前 mock v1 阶段暂不处理以下能力：

- 真实后端接口联调
- 真实后端鉴权 / 权限安全
- 真实文件上传与文件存储
- 真实财务导出、收退款流水、发票或复杂对账
- 复杂工厂门户、外部账号体系或工厂结算闭环
- 复杂客户 CRM、客户画像或营销自动化
- 多轴规格
- 复杂报价公式
- 报价审批流
- 多版本报价历史
- 复杂物流系统
- 售后复杂流转
- BI 报表
- 小程序端

---

## 文档阅读顺序

当前优先按已经统一主线的文档推进：

1. `AGENTS.md`
2. 当前阶段 `docs/frontend/handoff.md`
3. `docs/frontend/mock-data-schema.md`
4. `docs/frontend/routes-and-pages.md`
5. `docs/frontend/ui-structure.md`
6. `docs/frontend/frontend-task-board.md`

其余历史规划文档仍可参考，但若口径冲突，以上述文档为准。

---

## 当前数据结构主线

系统核心对象关系如下：

```text
Customer
  └─ Purchase
       └─ OrderLine
            ├─ ProductSnapshot
            ├─ LogisticsRecord
            ├─ AfterSalesCase
            └─ QuoteResult
```

说明：
- 一个客户可以有多次购买记录
- 一次购买记录可以包含多条销售
- 每条销售独立推进状态、规格、设计、委外、生产、发货和售后
- 产品始终是模板对象，不直接等于业务执行对象

---

## 备注

如果后续文档和规则有冲突，优先级按以下顺序处理：

1. `AGENTS.md`
2. 当前阶段 `handoff.md`
3. `docs/frontend/mock-data-schema.md`
4. `docs/frontend/routes-and-pages.md`
5. `docs/frontend/ui-structure.md`
6. 其他说明文档
