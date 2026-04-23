# Docs Index（前端文档索引）

## 1. 文档定位

本文档用于说明当前仓库 `docs/frontend` 目录中各文档的作用、优先级与阅读顺序。

当前项目已进入 **Phase 2（业务流转版）**。  
因此，阅读文档时不要再按“首轮仅做产品管理 + 订单中心静态骨架”的理解方式推进，而应以：

**产品中心 → 订单中心 → 任务中心**

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

### 第二优先级：Phase 2 核心需求文档
2. `docs/frontend/phase-2-prd.md`

作用：
- 定义 Phase 2 的总目标
- 定义当前范围边界
- 定义三大模块升级方向
- 定义数据结构草案
- 定义当前阶段完成标准

3. `docs/frontend/order-lifecycle-spec.md`

作用：
- 定义订单状态体系
- 定义状态切换规则
- 定义状态下字段编辑边界
- 定义订单与任务的关系
- 定义订单时间线记录规则

4. `docs/frontend/task-center-prd.md`

作用：
- 定义任务中心目标
- 定义任务分类、任务状态
- 定义任务页面与字段
- 定义任务来源规则
- 定义任务与订单、订单商品的关系

5. `docs/frontend/role-draft.md`

作用：
- 定义 Phase 2 的角色草案
- 定义页面可见性草案
- 定义字段编辑边界草案
- 为后续权限系统预留口径

6. `docs/frontend/phase-2-task-board.md`

作用：
- 把 Phase 2 需求拆成开发任务清单
- 定义推荐开发顺序
- 定义验收与收尾检查点

7. `docs/frontend/codex-prompts-phase-2.md`

作用：
- 给 AI coding 工具提供分阶段执行 prompt
- 避免 AI 一次性乱改整个工程
- 强化“先类型、再订单、再任务”的节奏

---

## 3. 当前基础文档

以下文档是 Phase 1 和当前前端基础的重要补充，仍然有价值，但优先级低于 Phase 2 核心文档。

8. `docs/frontend/frontend-prd.md`

作用：
- 记录更早期的前端 PRD 基础范围
- 适合了解项目最初页面结构和业务定义

9. `docs/frontend/routes-and-pages.md`

作用：
- 记录页面路由与页面职责
- 用于核对当前路由是否超范围扩展

10. `docs/frontend/ui-structure.md`

作用：
- 记录主要页面的信息结构
- 用于保持页面布局和区块划分一致

11. `docs/frontend/components-plan.md`

作用：
- 记录组件规划
- 用于判断哪些能力应该抽组件复用

12. `docs/frontend/mock-data-schema.md`

作用：
- 记录 mock 数据结构
- 用于保持字段语义一致

13. `docs/frontend/business-rules.md`

作用：
- 记录业务规则基础口径
- 用于核对产品、订单、报价等对象的业务定义

14. `docs/frontend/frontend-task-board.md`

作用：
- 记录更早阶段的前端任务拆解
- 当前可作为参考，但不应覆盖 Phase 2 任务板

15. `docs/frontend/handoff.md`

作用：
- 记录当前阶段工作交接信息
- 若 handoff 与旧文档冲突，应按当前阶段 handoff 为准

---

## 4. 推荐阅读顺序

### 场景 A：第一次接手项目
推荐顺序：

1. `AGENTS.md`
2. `README.md`
3. `docs/frontend/phase-2-prd.md`
4. `docs/frontend/order-lifecycle-spec.md`
5. `docs/frontend/task-center-prd.md`
6. `docs/frontend/role-draft.md`
7. `docs/frontend/phase-2-task-board.md`
8. `docs/frontend/codex-prompts-phase-2.md`
9. `docs/frontend/routes-and-pages.md`
10. `docs/frontend/mock-data-schema.md`
11. `docs/frontend/handoff.md`

---

### 场景 B：要开始写代码
推荐顺序：

1. `AGENTS.md`
2. 当前要实现对应的 Phase 2 文档
3. `docs/frontend/mock-data-schema.md`
4. `docs/frontend/routes-and-pages.md`
5. `docs/frontend/components-plan.md`
6. `docs/frontend/handoff.md`

---

### 场景 C：只做 UI / 页面结构
推荐顺序：

1. `AGENTS.md`
2. `docs/frontend/phase-2-prd.md`
3. `docs/frontend/ui-structure.md`
4. `docs/frontend/routes-and-pages.md`
5. `docs/frontend/components-plan.md`
6. `docs/frontend/role-draft.md`

---

### 场景 D：只做 AI coding 执行
推荐顺序：

1. `AGENTS.md`
2. `docs/frontend/codex-prompts-phase-2.md`
3. 当前对应模块的 PRD 文档
4. `docs/frontend/phase-2-task-board.md`
5. `docs/frontend/handoff.md`

---

## 5. 文档优先级规则

如果不同文档之间出现冲突，优先按以下顺序理解和执行：

1. `AGENTS.md`
2. 当前阶段 `handoff.md`
3. `docs/frontend/phase-2-prd.md`
4. `docs/frontend/order-lifecycle-spec.md`
5. `docs/frontend/task-center-prd.md`
6. `docs/frontend/role-draft.md`
7. `docs/frontend/phase-2-task-board.md`
8. `docs/frontend/codex-prompts-phase-2.md`
9. `docs/frontend/business-rules.md`
10. 其他历史文档

---

## 6. 当前阶段最容易搞错的地方

### 1. 把项目理解成 Phase 1
错误理解：
- 还以为当前只做产品管理和订单静态页面

正确理解：
- 当前已经进入 Phase 2
- 要开始做订单流转、任务中心、产品档案升级

---

### 2. 把订单商品当成产品
错误理解：
- 订单商品和产品详情共用一个对象

正确理解：
- 产品 = 模板
- 订单商品 = 订单里的实例
- 订单商品必须保留来源产品快照语义

---

### 3. 提前扩展过多模块
错误理解：
- 现在就做财务中心、工厂协同、复杂物流、完整权限

正确理解：
- 当前只做：
  - 产品中心升级
  - 订单中心升级
  - 任务中心
  - 首页轻量增强
  - 角色前端模拟

---

### 4. 跳过文档直接重写
错误理解：
- 不读 docs，直接大改页面和结构

正确理解：
- 先读 AGENTS 和 Phase 2 文档
- 按当前仓库风格做增量修改

---

## 7. 当前最推荐的开发主顺序

当前阶段开发顺序固定建议为：

1. 类型与 mock 数据升级
2. 订单详情页结构升级
3. 订单状态流转与时间线
4. 任务中心路由与页面
5. 从订单创建任务并联动
6. 产品详情 / 编辑升级
7. 首页摘要增强
8. 角色模式显隐
9. 联调与收尾

---

## 8. 本文档总结

本索引文档的作用不是增加新需求，而是确保所有参与者都按同一口径理解当前项目。

当前最重要的认知只有一句话：

**项目已经进入 Phase 2，当前主链路是：产品中心 → 订单中心 → 任务中心。**