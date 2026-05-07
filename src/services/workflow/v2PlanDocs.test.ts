import { describe, expect, it } from 'vitest'
import docsIndex from '../../../docs/frontend/docs-index.md?raw'
import handoffDocs from '../../../docs/frontend/handoff.md?raw'
import interfaceReadinessDocs from '../../../docs/frontend/interface-readiness.md?raw'
import taskBoardDocs from '../../../docs/frontend/frontend-task-board.md?raw'
import v2PlanDocs from '../../../docs/frontend/v2-plan.md?raw'

describe('v2 plan documentation', () => {
  it('keeps v2 plan listed as a current workflow document', () => {
    expect(docsIndex).toContain('docs/frontend/v2-plan.md')
    expect(handoffDocs).toContain('docs/frontend/v2-plan.md')
  })

  it('keeps the v2 build milestones explicit', () => {
    const requiredMilestones = [
      'V2.1 销售详情主操作面',
      'V2.2 状态流转规则中心化',
      'V2.3 跟单生产闭环',
      'V2.4 设计 / 建模闭环',
      'V2.5 财务确认 / 锁定闭环',
      'V2.6 单件物流 / 售后补强',
      'V2.7 接口前字段契约冻结',
      'V2.8 端到端角色链路验收',
      'V2.9 异常 / 阻塞动作中心化',
      'V2.10 任务与旁路记录门禁',
      'V2.11 完成销售入口',
      'V2.12 页面动作可用性收口',
      'V2.13 UI 级端到端验收',
      'V2.14 接口契约最终补齐',
      'V2.15 验收矩阵',
      'V2.16 门禁测试加固',
      'V2.17 真实接口前评审清单',
      'V2.18 业务演示脚本',
      'V2.19 黄金链路测试收口',
      'V2.20 文档与交付门禁',
      'V2.21 数据读写边界盘点',
      'V2.22 Workflow Command Contract',
      'V2.23 Sidecar Record Contract',
      'V2.24 接口替换前门禁'
    ]

    requiredMilestones.forEach((milestone) => {
      expect(v2PlanDocs).toContain(milestone)
    })

    expect(v2PlanDocs).toContain('单件销售执行闭环')
    expect(v2PlanDocs).toContain('V2.1 销售详情主操作面 -> verify')
    expect(v2PlanDocs).toContain('markProductionBlocked / resumeProduction / completeOrderLine')
    expect(v2PlanDocs).toContain('getOrderLineWorkflowActionState')
    expect(v2PlanDocs).toContain('“完成销售”入口只在销售详情抽屉显示')
    expect(v2PlanDocs).toContain('任务中心只做协作提醒')
    expect(v2PlanDocs).toContain('V2 验收矩阵')
    expect(v2PlanDocs).toContain('completed` 只能由 `completeOrderLine`')
    expect(v2PlanDocs).toContain('业务演示脚本 Golden Scenarios')
    expect(v2PlanDocs).toContain('同购买多销售分开发货')
    expect(v2PlanDocs).toContain('库存出库入成本')
    expect(v2PlanDocs).toContain('V2.21 - V2.24 接口替换边界规则')
    expect(v2PlanDocs).toContain('useAppData` 当前是 mock state provider')
    expect(v2PlanDocs).toContain('Workflow Command Contract')
    expect(v2PlanDocs).toContain('Sidecar Record Contract')
    expect(v2PlanDocs).toContain('不恢复 `/orders`')
  })

  it('keeps the interface readiness contract aligned with the v2 workflow closure', () => {
    const requiredActions = [
      'confirmCustomerServiceInfo',
      'startDesign',
      'completeDesign',
      'startModeling',
      'completeModeling',
      'requestDesignRevision',
      'requestModelingRevision',
      'recordWaxFileReady',
      'approveProductionReview',
      'dispatchToFactory',
      'acceptFactoryTask',
      'startFactoryProduction',
      'completeFactoryProduction',
      'submitFactoryReturn',
      'approveFactoryReturn',
      'returnFactoryFeedback',
      'markProductionBlocked',
      'resumeProduction',
      'confirmFinance',
      'markFinanceAbnormal',
      'lockFinance',
      'completeOrderLine'
    ]

    requiredActions.forEach((actionName) => {
      expect(interfaceReadinessDocs).toContain(actionName)
    })

    expect(interfaceReadinessDocs).toContain('getOrderLineWorkflowActionState')
    expect(interfaceReadinessDocs).toContain('orderLineId')
    expect(interfaceReadinessDocs).toContain('productionInfo.feedbackStatus')
    expect(interfaceReadinessDocs).toContain('productionInfo.factoryStatus')
    expect(interfaceReadinessDocs).toContain('页面或接口层不得重新手拼 `lineStatus`')
    expect(interfaceReadinessDocs).toContain('`completed` 只能由 `completeOrderLine`')
    expect(interfaceReadinessDocs).toContain('真实接口前评审清单')
    expect(interfaceReadinessDocs).toContain('不定义 API URL、数据库表、鉴权方案或迁移脚本')
    expect(interfaceReadinessDocs).toContain('`productionTaskNo` 是货号')
    expect(interfaceReadinessDocs).toContain('不把物流改成整笔购买唯一记录')
    expect(interfaceReadinessDocs).toContain('前端数据读写边界')
    expect(interfaceReadinessDocs).toContain('`useAppData` 只是前端 mock state provider')
    expect(interfaceReadinessDocs).toContain('读取视图')
    expect(interfaceReadinessDocs).toContain('主流程命令')
    expect(interfaceReadinessDocs).toContain('旁路记录命令')
    expect(interfaceReadinessDocs).toContain('demo/debug 命令')
    expect(interfaceReadinessDocs).toContain('Workflow Command Contract')
    expect(interfaceReadinessDocs).toContain('buildOrderLineStatusPatch` 不属于 future command contract')
    expect(interfaceReadinessDocs).toContain('Sidecar Record Contract')
    expect(interfaceReadinessDocs).toContain('购买记录详情只做汇总入口')
    expect(interfaceReadinessDocs).toContain('legacy `/orders`')
  })

  it('keeps handoff and task board in delivery-readiness mode', () => {
    expect(handoffDocs).toContain('V2.14/V2.15/V2.16')
    expect(handoffDocs).toContain('V2.17/V2.18/V2.19/V2.20')
    expect(handoffDocs).toContain('V2.21/V2.22/V2.23/V2.24')
    expect(handoffDocs).toContain('V2 已可验收')
    expect(handoffDocs).toContain('接口替换边界已准备')
    expect(taskBoardDocs).toContain('OrderLine workflow v2 delivery readiness')
    expect(taskBoardDocs).toContain('V2.14/V2.15/V2.16')
    expect(taskBoardDocs).toContain('V2.17/V2.18/V2.19/V2.20')
    expect(taskBoardDocs).toContain('V2.21/V2.22/V2.23/V2.24')
    expect(taskBoardDocs).toContain('物流签收、售后关闭、任务完成和库存动作不得自动触发 `completed`')
    expect(taskBoardDocs).toContain('业务演示脚本')
    expect(taskBoardDocs).toContain('真实 API 接入前必须复核')
  })
})
