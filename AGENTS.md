# AGENTS.md

## 项目身份
这是一个面向珠宝 / 定制饰品业务的定制电商协同 ERP 前端项目。

legacy `/orders` 清理已经收口，当前进入以 `OrderLine` 为核心的业务工作流 v1 打底阶段。优先巩固购买记录、销售、任务和生产计划的 current workflow，暂不接真实后端业务流。

---

## Karpathy-Inspired AI Coding Rules

项目统一采用以下四条 AI coding 行为规则，用于减少静默假设、过度设计、顺手乱改和缺少验证目标的问题。

### 1. Think Before Coding
先想清楚，再写代码。

要求：
- 不要默认替用户做未经确认的假设
- 有歧义时，先明确采用哪种理解
- 有多个实现方向时，先说明取舍
- 如果发现信息不足、上下文冲突或规则不清，先指出问题
- 不要带着糊涂继续往下写

在这个项目里，尤其要先确认：
- 当前主语到底是 `Purchase`、`OrderLine`、`Product` 还是 `Customer`
- 这次改动是“语义清理”还是“页面重写”
- 是保留兼容层，还是直接切换命名

### 2. Simplicity First
只写解决当前问题所需的最小代码。

要求：
- 不添加用户没要求的功能
- 不为一次性场景提前设计复杂抽象
- 不为了“未来可能会用”而增加配置层、适配层、泛型层
- 不引入不必要的状态机或中间结构
- 如果 50 行能解决，就不要写成 200 行

### 3. Surgical Changes
只改必须改的地方。

要求：
- 不顺手“优化”任务无关的代码、注释、样式和格式
- 不重构没坏的东西
- 尽量匹配现有代码风格
- 发现无关死代码可以指出，但不要顺手删
- 只清理因为本次改动而新增的无用代码

### 4. Goal-Driven Execution
把任务转成可验证目标，再循环执行直到验证通过。

推荐格式：
1. [步骤] -> verify: [验证方式]
2. [步骤] -> verify: [验证方式]
3. [步骤] -> verify: [验证方式]

---

## 当前业务主线

当前项目主线统一为：

- `Customer` = 客户
- `Purchase` = 购买记录，一次购买公共信息
- `OrderLine` = 销售，一件商品的执行对象
- `Product` = 产品模板
- `ProductSnapshot` = 来源产品快照
- `InventoryItem` = 仓库商品 / 库存资产
- `LogisticsRecord` = 物流记录，默认关联 `orderLineId`
- `AfterSalesCase` = 售后记录，默认关联 `orderLineId`

当前系统主操作对象是 **OrderLine（销售）**。

---

## 核心对象定义

### Customer
客户主档。用于沉淀客户长期信息、历史购买记录、历史销售和售后记录。

### Purchase
购买记录。表示一次购买行为的公共信息，用于保存平台订单号、客户收件信息、支付时间、整笔购买备注、付款汇总等共享信息。

`Purchase` 是归组对象，不是单件商品执行对象。

### OrderLine
销售。一件商品对应一条独立销售，是系统真正的主操作对象。

同一次购买中的多件商品，必须拆成多条独立销售分别推进。

### Product
产品模板。用于维护标准资料、规格明细、价格规则、定制规则、生产参考和文件资料。

禁止把 `Product` 直接当成业务执行对象使用。

### ProductSnapshot
销售引用产品时保留的来源快照。用于核对销售参数与来源产品模板参数。

### InventoryItem
仓库商品 / 库存资产。用于记录设计留样、客户退货、常备采购、寄售或其他来源库存。

`InventoryItem` 可以引用 `Product / Purchase / OrderLine / Customer`，但它不是产品模板，也不是销售执行对象，不驱动销售状态流转。

库管可以登记入库、占用、释放、出库、报废、库位调整、质检处置和盘点。所有库存动作只更新库存资产台账与库存流转记录，不推进设计、生产、财务或售后状态。

### LogisticsRecord / AfterSalesCase
物流和售后默认关联 `orderLineId`，支持同一次购买中的单件商品独立发货、独立售后。

---

## 当前主路由

正式主路由统一为：

- `/order-lines` = 销售中心
- `/purchases/new` = 新建购买记录
- `/purchases/:purchaseId` = 购买记录详情
- `/products` = 产品管理
- `/customers` = 客户中心
- `/customers/:customerId` = 客户详情
- `/production-follow-up` = 生产跟进 / 跟单视图
- `/design-modeling` = 设计 / 建模工作台
- `/factory` = 工厂协同中心
- `/finance` = 财务中心
- `/inventory` = 仓库商品管理
- `/management` = 管理看板

说明：
- `/order-lines` 是当前主入口，一行代表一件商品
- `/purchases/:purchaseId` 是购买记录归组页，用于查看一次购买的公共信息和本次购买下的所有销售
- `/products` 展示产品模板，不展示销售实例
- `/production-follow-up` 基于 `OrderLine` 做跟单审核、下发生产、生产中、待回传和异常 / 逾期筛选
- `/design-modeling` 基于 `OrderLine` 做设计、建模、出蜡文件记录和修改任务跟进
- `/factory` 基于 `OrderLine` 做工厂接收、生产、回传和异常标记，不展示客户隐私和财务金额
- `/finance` 基于 `Purchase.finance` 和 `OrderLine.productionData / financeStatus` 做尾款、工厂结算、成本核算和异常标记
- `/inventory` 基于 `InventoryItem` 做库管库存资产台账，记录设计留样、客户退货和其他库存；支持前端 mock 入库、占用、释放、出库、报废、库位调整、质检处置和盘点，但不推进销售执行状态
- `/management` 基于 `Purchase + OrderLine` 做经营、生产风险、财务、角色负载和工厂表现汇总，不承接具体录入动作

### 前端 mock 角色边界

当前只做前端 mock role capability，不代表后端安全鉴权。

角色：
- `customer_service` = 客服
- `merchandiser` = 跟单
- `designer` = 设计
- `modeler` = 建模
- `factory` = 工厂
- `finance` = 财务
- `manager` = 管理
- `admin` = 管理员

规则：
- 工厂角色不得看到客户联系方式、收货地址、销售价格、定金、尾款、利润或财务备注
- 财务角色可以看金额、成本和工厂回传数据，但不推进设计 / 建模 / 生产动作
- 设计 / 建模角色只处理商品生产需求、文件记录和修改任务
- 跟单角色处理生产计划、工厂分配、下发和阻塞退回
- 管理角色看汇总，不默认编辑流程字段
- 管理员在当前 demo 中可见并可操作全部前端能力

---

## 当前开发阶段

当前阶段只补强 **OrderLine workflow foundation**：

- `Purchase` 继续作为购买记录 / 归组对象
- `OrderLine` 继续作为单件商品执行对象
- 销售字段需要支撑后续跟单、设计 / 建模、生产、工厂回传和财务核算视图
- `OrderLine.lineStatus` 是多角色工作流主状态；`status` 只作为短期兼容展示字段
- 设计 / 建模 / 生产 / 工厂 / 财务分流字段必须继续落在 `OrderLine`
- `/purchases/new` 的销售草稿必须继续输出为 `orderLineDrafts`
- 客服确认只允许基于销售资料完整度和 `requiresDesign / requiresModeling` 分流到后续 `lineStatus`
- 跟单生产跟进只允许基于 `OrderLine.lineStatus / productionStatus / factoryStatus` 推进，不得回写旧订单模型
- 设计 / 建模工作台只允许展示商品执行需求、设计 / 建模状态和文件记录，不展示客户联系方式或财务金额
- 工厂协同中心只允许展示分配给工厂的生产资料、设计 / 建模 / 出蜡资料和生产回传字段，不得展示客户联系方式、地址、销售价格、定金、尾款、利润或财务备注
- 财务中心允许查看金额、成本和工厂回传数据，但不得负责推进设计、建模或生产执行字段
- 销售资料完整性、生产逾期、工厂回传异常、财务异常和角色待办徽标应优先复用 `orderLineRiskSelectors`
- 不得新增 `Order / OrderItem` 类型，不得恢复 legacy `/orders`
- 不得把当前 mock 管理看板扩展成复杂 BI、权限审批或后端报表系统

---

## 旧模块删除边界

legacy `/orders` 模块已经删除，不再作为可访问路由、主导航入口或兼容入口保留。

当前已删除：
- `/orders`
- `/orders/new`
- `/orders/:orderId`
- `src/pages/orders/*`
- `src/components/business/order/*`
- `src/services/order/*`
- `src/mocks/orders.ts`
- `src/types/order.ts`

历史兼容含义：
- `TransactionRecord` 只能作为 `Purchase` 的历史兼容别名
- `SourceProductSnapshot` 只能作为 `ProductSnapshot` 的历史兼容命名

新代码不得重新引入 `/orders`、`Order`、`OrderItem`、`orders.timeline` 或旧 orders store。

---

## 当前页面对象边界

### 销售中心
一行 = 一件商品。

不是一行 = 一笔购买记录。

销售中心预览以 **货号** 作为主要识别码。内部销售编号和购买记录编号只作为搜索、详情追溯和系统内部关联字段，不作为主预览列。

### 新建购买记录页
页面创建的是 `Purchase`。

页面中的每张销售草稿卡，代表一条未来的 `OrderLine`。

新建销售草稿时必须自动生成货号；`productionTaskNo` 在当前前端模型中等同于货号，不再在界面上另起“生产编号”主语。

### 购买记录详情页
顶部展示购买公共信息。

中部展示多个销售。

整页是归组页，不是单件商品执行页的替代物。

### 产品详情页
展示的是 `Product` 产品模板，不是销售实例。

### 来源产品详情抽屉
展示的是被引用时的来源产品模板信息，用于模板与销售参数核对。

---

## 强制数据建模规则

### 1. 产品模板和销售不能混
禁止把 `Product` 直接当成业务执行对象使用。

### 2. 购买记录和销售不能混
禁止把单件商品的执行字段塞回 `Purchase`。

### 3. 物流默认关联销售
物流记录必须优先关联 `orderLineId`。

购买记录页只做汇总展示和统一入口。

### 4. 售后默认关联销售
售后记录必须优先关联 `orderLineId`。

支持同一次购买中的单件商品独立进入售后。

### 5. 状态驱动以销售为准
页面待办、列表筛选、进度推进，应优先基于 `OrderLine.lineStatus`。

`OrderLine.status` 只作为短期兼容展示字段，新增任务分组、角色视图和状态流转不要继续扩大它的主流程用途。

客服确认完成后，应按 `requiresDesign -> pending_design`、`requiresModeling -> pending_modeling`、否则 `pending_merchandiser_review` 的顺序分流。

`Purchase.aggregateStatus` 只做聚合展示，不作为主流程驱动状态。

### 6. 同一次购买中的销售必须允许分开推进
必须支持：
- 不同状态
- 不同交期
- 不同物流
- 不同售后
- 不同负责人

---

## 当前命名约束

### 当前标准命名
优先使用：

- `Customer`
- `Purchase`
- `OrderLine`
- `ProductSnapshot`
- `LogisticsRecord`
- `AfterSalesCase`

### 历史兼容命名
如果历史文档或旧数据字段中仍出现：

- `TransactionRecord`
- `Order`
- `OrderItem`
- `SourceProductSnapshot`

只能按历史语境理解，新代码不得继续扩大旧命名使用范围。

---

## AI Coding 工作规则

### 1. 先确认主线，再编码
开始写页面、组件、mock、类型之前，优先确认：

- 当前阶段目标
- 页面范围
- 数据对象
- 字段语义
- 主链路
- 验收标准

### 2. 先类型，后逻辑
核心对象必须先定义类型，再写页面逻辑和交互逻辑。

当前阶段核心对象至少包括：

- `Customer`
- `Purchase`
- `OrderLine`
- `Product`
- `ProductSnapshot`
- `QuoteResult`
- `LogisticsRecord`
- `AfterSalesCase`

### 3. 一次只推进一个明确步骤
推荐顺序：

1. 类型
2. mock
3. 页面骨架
4. 组件接线
5. 局部交互
6. 自动报价
7. 文档回写
8. 清理与 review

除非明确要求，不要在一次改动里同时大改类型、页面结构、路由、组件命名、业务逻辑和文档口径。

### 4. 主链路优先，边缘能力后置
当前阶段优先保证主链路跑通：

**产品维护
-> 销售引用产品
-> 选择规格
-> 自动带出规格参数
-> 自动带出基础价格
-> 叠加固定加价规则
-> 生成系统参考报价**

### 5. 先 mock 跑通，再谈真实接口
当前阶段以前端 UI 和 mock 联调为主。

不要擅自扩展复杂后端接口、数据库设计或服务拆分。

### 6. 改字段必须同步改文档
如果修改核心对象命名、字段语义、页面主语、mock 结构或路由语义，必须同步检查并更新：

- `README.md`
- `docs/frontend/routes-and-pages.md`
- `docs/frontend/ui-structure.md`
- `docs/frontend/mock-data-schema.md`
- `docs/frontend/handoff.md`

### 7. 保留必要历史字段，不重建旧兼容模块
当前项目已经删除 legacy `/orders` runtime 模块。

如遇历史字段，优先迁移到 current model；无法立即迁移时只做只读说明，不要重新创建旧 `/orders` 页面、store、mock、service 或类型。

### 8. 页面改造先改语义，再改路径
当前主入口已经是 `/order-lines` 与 `/purchases/*`。

旧 `/orders` runtime 模块已删除，不在导航中展示，也不作为 current workflow fallback。

---

## 当前阶段禁止事项

AI 在当前阶段不得擅自做以下事情：

1. 不得重新引入旧 `/orders` 模块
2. 不得重新创建旧 `services/order`、`mocks/orders`、`types/order`
3. 不得把 `Order / OrderItem / order.items` 作为新功能主模型
4. 不得推翻产品管理模块
5. 不得新增复杂后端流转设计冒充前端需求
6. 不得把物流、售后默认设计成整笔购买唯一归属
7. 不得把 `Product` 和 `OrderLine` 混成一个对象
8. 不得擅自修改系统参考报价公式
9. 不得把客户中心扩展成超出当前阶段的大模块
10. 不得在没有同步文档的情况下发明新字段语义

---

## 首轮必须跑通的样例

### 样例 1：同一次购买，多件商品，多条销售
- 购买记录 1 条
- 销售多条
- 销售中心显示多行
- 购买记录详情页显示多条销售

### 样例 2：戒指自动带价
- 选择规格
- 自动带出规格参数
- 自动带出基础价格
- 叠加材质 / 工艺 / 特殊需求固定加价
- 生成系统参考报价

### 样例 3：吊坠自动带价
- 选择规格
- 自动带出规格参数
- 自动带出基础价格
- 叠加工艺 / 特殊需求固定加价
- 生成系统参考报价

### 样例 4：同一次购买中多件商品分开发货
- 一件商品先发
- 另一件商品后发

### 样例 5：同一次购买中只有一件商品进入售后
- 一件商品进入售后
- 其他商品正常完成

---

## 建议文件结构

推荐逐步整理为：

```text
src/
  types/
    customer.ts
    purchase.ts
    order-line.ts
    product.ts
    quote.ts
    supporting-records.ts
    transaction.ts # Purchase 的历史兼容别名

  mocks/
    customers.ts
    purchases.ts
    order-lines.ts
    products.ts
    supporting-records.ts
    transactions.ts # Purchase mock 的历史兼容别名
```

---

## 文档优先级

当文档发生冲突时，优先按以下顺序理解：

1. `AGENTS.md`
2. 当前阶段 `handoff.md`
3. `docs/frontend/mock-data-schema.md`
4. `docs/frontend/routes-and-pages.md`
5. `docs/frontend/ui-structure.md`
6. `docs/frontend/frontend-task-board.md`
7. 其他说明文档

---

## 输出要求

AI 每次完成修改后，应至少说明：

1. 改了哪些文件
2. 为什么改
3. 哪些旧命名暂时保留为兼容层
4. 哪些地方还没清理
5. 下一步建议做什么

不要只给结果，不解释影响面。

---

## 核心一句话

这个项目当前不是“整单为主”的传统订单中心，也不再以旧 `/orders` 为当前主入口。

当前系统应以 **OrderLine（销售）** 为主操作对象，以 **Purchase（购买记录）** 为归组对象，以 **Customer（客户）** 为沉淀对象，以 **Product（产品模板）** 为模板对象。
