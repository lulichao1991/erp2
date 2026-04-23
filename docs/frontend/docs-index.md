# Docs Index（前端文档索引）

## 1. 文档定位

本文档用于说明当前仓库 `docs/frontend` 目录中各文档的作用、优先级与阅读顺序。

当前项目中存在两批文档：

- 第一批：已按当前业务主语统一过口径的文档
- 第二批：仍保留较强 Phase 2 / 历史整单中心语义的文档

因此，阅读文档时不要再按“首轮仅做产品管理 + 旧整单中心静态骨架”的理解方式推进，而应优先按：

**产品管理 → 商品任务中心 / 交易记录 → 任务中心**

作为当前主链路。

---

## 2. 当前最重要的文档

如果你是第一次接手本项目，或者 AI coding 工具准备开始修改代码，请优先阅读以下文档。

### 第一优先级：项目执行规则
1. `AGENTS.md`

作用：
- 定义当前阶段目标
- 定义编码行为规则
- 定义当前页面范围
- 定义对象模型边界
- 定义当前阶段不要做什么

---

### 第二优先级：当前已统一主语的实现文档
2. `docs/frontend/routes-and-pages.md`

作用：
- 定义当前主路由与页面职责
- 明确 `/orders` 的保留路径与新业务语义
- 用于约束页面跳转与上下文入口

3. `docs/frontend/ui-structure.md`

作用：
- 定义商品任务中心、新建交易记录页、交易记录详情页结构
- 用于约束区块划分与信息层级

4. `docs/frontend/mock-data-schema.md`

作用：
- 定义 `Customer / TransactionRecord / OrderLine / ProductSnapshot` 等主对象
- 用于约束 mock 与字段语义

5. `docs/frontend/handoff.md`

作用：
- 记录当前阶段共识、反馈与推进顺序
- 若与旧文档冲突，优先按当前 handoff 理解

6. `docs/frontend/frontend-task-board.md`

作用：
- 记录当前首轮推荐开发顺序
- 用于约束页面与主链路的收口范围

7. `docs/frontend/frontend-prd.md`

作用：
- 记录前端 PRD 基础范围
- 现已按“交易记录 / 商品任务”语义修正，可作为实现参考

---

## 3. 历史规划文档

以下文档仍有参考价值，但保留较强历史 Phase 2 或旧整单中心语义。  
阅读时应视为**历史规划 / 兼容阅读材料**，不得覆盖前一节已统一主语的文档。

8. `docs/frontend/phase-2-prd.md`

作用：
- 记录 Phase 2 旧版总体规划
- 可用于理解项目演进背景，不作为当前一线实现口径

9. `docs/frontend/order-lifecycle-spec.md`

作用：
- 记录旧版订单状态体系与状态边界
- 当前阅读时需自行映射到“交易记录 / 商品任务”语义

10. `docs/frontend/task-center-prd.md`

作用：
- 记录任务中心目标与任务关系
- 当前阅读时需避免把“订单”继续视为唯一主操作对象

11. `docs/frontend/role-draft.md`

作用：
- 记录历史角色与页面可见性草案
- 可作参考，不作为当前权限实现依据

12. `docs/frontend/phase-2-task-board.md`

作用：
- 记录 Phase 2 历史任务拆解
- 只可用于理解演进顺序，不作为当前直接执行清单

13. `docs/frontend/api-adapter-plan.md`

作用：
- 记录历史 API 适配想法
- 当前阅读时需结合现有兼容层理解，不可直接当成现状接口契约

14. `docs/frontend/state-management-plan.md`

作用：
- 记录历史状态管理想法
- 当前阅读时需把 `Order / OrderItem` 理解为兼容命名

15. 其余历史文档

作用：
- 如 `codex-prompts-phase-2.md`、`odex-prompts-phase-2.md`、`layout-and-navigation.md`、`file-structure.md`
- 仅作背景参考，若口径冲突，一律不高于当前主文档

---

## 4. 推荐阅读顺序

### 场景 A：第一次接手项目
推荐顺序：

1. `AGENTS.md`
2. `README.md`
3. `docs/frontend/routes-and-pages.md`
4. `docs/frontend/ui-structure.md`
5. `docs/frontend/mock-data-schema.md`
6. `docs/frontend/handoff.md`
7. `docs/frontend/frontend-task-board.md`
8. `docs/frontend/frontend-prd.md`
9. 第二批历史规划文档（按需）

---

### 场景 B：要开始写代码
推荐顺序：

1. `AGENTS.md`
2. `docs/frontend/routes-and-pages.md`
3. `docs/frontend/ui-structure.md`
4. `docs/frontend/mock-data-schema.md`
5. `docs/frontend/handoff.md`
6. `docs/frontend/frontend-task-board.md`
7. 对应专题文档，如 `components-plan.md` / `business-rules.md`

---

### 场景 C：只做 UI / 页面结构
推荐顺序：

1. `AGENTS.md`
2. `docs/frontend/routes-and-pages.md`
3. `docs/frontend/ui-structure.md`
4. `docs/frontend/components-plan.md`
5. `docs/frontend/handoff.md`
6. 第二批历史规划文档（按需）

---

### 场景 D：只做 AI coding 执行
推荐顺序：

1. `AGENTS.md`
2. `docs/frontend/routes-and-pages.md`
3. `docs/frontend/mock-data-schema.md`
4. `docs/frontend/handoff.md`
5. `docs/frontend/frontend-task-board.md`
6. 当前对应模块专题文档

---

## 5. 文档优先级规则

如果不同文档之间出现冲突，优先按以下顺序理解和执行：

1. `AGENTS.md`
2. 当前阶段 `handoff.md`
3. `docs/frontend/routes-and-pages.md`
4. `docs/frontend/ui-structure.md`
5. `docs/frontend/mock-data-schema.md`
6. `docs/frontend/frontend-task-board.md`
7. `docs/frontend/frontend-prd.md`
8. `docs/frontend/business-rules.md`
9. `docs/frontend/components-plan.md`
10. 第二批历史规划文档

---

## 6. 当前阶段最容易搞错的地方

### 1. 把项目理解成旧整单中心模式
错误理解：
- 还以为当前仍以整单为唯一主操作对象

正确理解：
- 当前一线文档已统一为“交易记录归组、商品任务执行”
- `/orders` 只是保留路径，不代表业务主语仍是旧整单中心

---

### 2. 把商品任务当成产品
错误理解：
- 商品任务和产品详情共用一个对象

正确理解：
- 产品 = 模板
- 商品任务 = 交易记录里的实例
- 商品任务必须保留来源产品快照语义

---

### 3. 提前扩展过多模块
错误理解：
- 现在就做财务中心、工厂协同、复杂物流、完整权限

正确理解：
- 当前只做：
  - 产品管理
  - 商品任务中心 / 交易记录页
  - 任务中心
  - 其余历史规划只做按需参考

---

### 4. 跳过文档直接重写
错误理解：
- 不读 docs，直接大改页面和结构

正确理解：
- 先读 AGENTS 和当前已统一主语的文档
- 按当前仓库风格做增量修改

---

## 7. 当前最推荐的开发主顺序

当前阶段开发顺序固定建议为：

1. 类型与 mock 数据升级
2. 商品任务中心与交易记录页语义升级
3. 产品详情 / 编辑升级
4. 任务中心按需接入
5. 再回头处理第二批历史规划文档

---

## 8. 本文档总结

本索引文档的作用不是增加新需求，而是确保所有参与者都按同一口径理解当前项目。

当前最重要的认知只有一句话：

**当前一线实现文档的主链路是：产品管理 → 商品任务中心 / 交易记录 → 任务中心。**
