# 定制电商协同 ERP（前端）

## 项目说明
这是一个面向珠宝 / 定制饰品业务的定制电商协同 ERP 前端项目。

当前阶段暂停新功能开发，进入项目清理收口阶段。项目仍以前端 UI、页面结构、组件复用和 mock 数据联调为主，暂不接真实后端业务流。

---

## 当前业务主线

当前项目主线统一为：

- `Customer` = 客户
- `Purchase` = 购买记录 / 一次购买公共信息
- `OrderLine` = 商品行 / 一件商品的执行对象
- `Product` = 产品模板
- `ProductSnapshot` = 来源产品快照
- `LogisticsRecord` / `AfterSalesCase` 默认关联 `orderLineId`

系统真正的主操作对象是 **OrderLine（商品行）**。

---

## 当前核心链路

首轮主链路是：

**产品维护（含规格明细与价格规则）  
-> 商品行引用产品  
-> 选择规格  
-> 自动带出规格参数  
-> 自动带出基础价格  
-> 叠加固定加价规则  
-> 生成系统参考报价**

---

## 当前主页面

### 商品行与购买记录

- `/order-lines`：商品行中心
- `/purchases/new`：新建购买记录
- `/purchases/:purchaseId`：购买记录详情

说明：
- 商品行中心一行代表一件商品
- 购买记录用于保存一次购买中的公共信息
- 购买记录详情页是归组页，展示本次购买下的所有商品行

### 产品模块

- `/products`
- `/products/new`
- `/products/:productId`
- `/products/:productId/edit`

### 旧模块兼容

旧 `/orders` 路由仍可保留访问，但只作为旧模块兼容路由，不再作为当前主入口：

- `/orders`
- `/orders/new`
- `/orders/:orderId`

旧模块后续应迁移、隐藏或删除；当前阶段不删除旧页面、旧 services、旧 mocks、旧 types。

---

## 关键业务定义

### Customer
客户主档，用于沉淀客户长期信息、历史购买记录、历史商品行和售后记录。

### Purchase
购买记录。一次购买行为的公共信息容器，用于保存平台订单号、客户收件信息、支付时间、整笔购买备注、付款汇总等公共信息。

`Purchase` 是归组对象，不是单件商品执行对象。

### OrderLine
商品行。系统真正的主操作对象。

一件商品对应一条独立商品行，可分别推进规格确认、设计、委外、生产、发货和售后。

### Product
产品库中的标准模板，用于维护产品资料、规格明细、固定加价规则、定制规则、生产参考和文件资料。

### ProductSnapshot
商品行引用产品时保留的来源产品快照，用于核对模板值与本次商品行实际选择。

---

## 当前最重要的规则

### 1. 产品与商品行不是同一个对象
- 产品 = 模板
- 商品行 = 实例

### 2. 购买记录与商品行不是同一个对象
- 购买记录 = 一次购买中的公共信息
- 商品行 = 单件商品的独立执行对象

### 3. 物流和售后默认关联商品行
- 物流记录优先关联 `orderLineId`
- 售后记录优先关联 `orderLineId`
- 同一次购买中的多件商品可以分别发货、分别售后

### 4. 旧命名只作为兼容层
- `TransactionRecord` 只能作为 `Purchase` 的历史兼容别名
- `OrderItem` 只能作为 `OrderLine` 的历史兼容命名
- `SourceProductSnapshot` 只能作为 `ProductSnapshot` 的历史兼容命名

---

## 当前阶段不做

当前清理收口阶段暂不处理以下能力：

- 真实后端接口联调
- 复杂财务中心
- 完整工厂协同系统
- 完整客户中心
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
2. `docs/frontend/mock-data-schema.md`
3. `docs/frontend/routes-and-pages.md`
4. `docs/frontend/ui-structure.md`
5. `docs/frontend/handoff.md`
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
- 一次购买记录可以包含多条商品行
- 每条商品行独立推进状态、规格、设计、委外、生产、发货和售后
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
