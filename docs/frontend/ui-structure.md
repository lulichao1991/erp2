# UI Structure

## 总原则

- 页面第一主语必须清楚：`Purchase`、`OrderLine`、`Product`、`Customer` 不混用。
- 当前系统主操作对象是 `OrderLine`。
- `Purchase` 是归组页，不承接单件商品执行状态。
- `Product` 是款式模板，不是销售实例。
- 库存页面只管理库存资产，不推进销售状态。

## 全局布局

- 左侧导航使用 `routeConfig.ts` 中的主入口。
- 顶部不再保留独立 `AppTopbar`。
- 页面标题说明当前对象和操作范围。
- 详情类信息优先使用抽屉或详情页，避免在列表中堆满执行字段。

## 销售中心 `/order-lines`

一行代表一条 `OrderLine`。

列表核心列：

- 货号：`productionTaskNo`、款式名称、版本号。
- 商品：产品缩略图。
- 客户：客户姓名和客户 ID。
- 状态：`lineStatus`。
- 生产/工厂/财务风险：来自 selector。
- 物流/售后摘要：按 `orderLineId` 查找。

详情抽屉核心区块：

- 状态推进和客服确认。
- 来源款式快照对比。
- 销售参数与实际需求。
- 设计/建模/生产/工厂回传。
- 工厂回传区使用 `productionInfo.feedbackStatus` 展示回传子状态。
- 财务摘要。
- 物流记录。
- 售后记录。
- 操作日志。

## 新建购买记录 `/purchases/new`

页面创建 `Purchase`。

每张销售草稿卡代表一条未来 `OrderLine`。

必须保持：

- 可以添加多条销售草稿。
- 选中 `Product` 后使用 `product.code` 作为来源款式编码。
- 自动生成货号并写入 `productionTaskNo`。
- 销售草稿输出字段名为 `orderLineDrafts`。

## 购买记录详情 `/purchases/:purchaseId`

页面展示一次购买的公共信息和本次购买下的所有销售。

允许：

- 查看购买公共信息。
- 查看多条销售。
- 从销售卡进入销售详情抽屉。
- 按销售维护物流和售后。

不允许：

- 把单件执行字段塞回 `Purchase`。
- 把本页做成旧订单详情页。

## 款式管理 `/products`

`Product` 是模板。

页面区块：

- 款式基础信息。
- 参数配置。
- 规格明细。
- 固定加价规则。
- 定制规则。
- 生产参考。
- 图片与文件。
- 引用记录。
- 设计版本记录。
- 平台店铺商品展示。

版本规则：

- `Product.version` 只在设计结构、设计稿或外观方案变化时升级。
- 补齐参数、价格规则、生产参考或文件资料不触发升版。

## 客户中心 `/customers`

客户页面展示：

- 客户基础资料。
- 当前购买记录数。
- 当前销售数量。
- 当前售后数量。
- 历史购买、历史销售和售后摘要。

统计只从当前 `Purchase / OrderLine / AfterSalesCase` 聚合，不读取已删除的外部历史总数字段。

## 角色工作台

| 页面 | 只处理 |
|---|---|
| `/production-follow-up` | 跟单审核、生产下发、阻塞处理 |
| `/design-modeling` | 设计/建模状态和文件 |
| `/factory` | 工厂接收、生产、回传和异常 |
| `/finance` | 收款、结算、成本和财务异常 |
| `/inventory` | 库存资产和库存流转 |
| `/management` | 汇总观察 |
| `/production-plan` | 工厂任务计划 |

## 当前不做

- 旧 `/orders` UI。
- 复杂 BI。
- 后端权限控制界面。
- 真实上传体验。
- 小程序端页面。
