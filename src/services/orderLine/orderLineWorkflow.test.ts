import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import { buildManagementDashboardMetrics } from '@/services/management/managementDashboard'
import { buildDesignModelingRows, filterDesignModelingRowsByTab } from '@/services/orderLine/orderLineDesignModeling'
import { buildFactoryTaskRows, currentFactoryId, filterFactoryTaskRowsByTab } from '@/services/orderLine/orderLineFactory'
import { buildFinanceRows, filterFinanceRowsByTab } from '@/services/orderLine/orderLineFinance'
import { buildProductionFollowUpRows, filterProductionFollowUpRowsByTab } from '@/services/orderLine/orderLineProductionFollowUp'
import { getOrderLineRisks, getRoleTaskBadges } from '@/services/orderLine/orderLineRiskSelectors'
import {
  acceptFactoryTask,
  approveFactoryReturn,
  approveProductionReview,
  buildOrderLineStatusPatch,
  completeOrderLine,
  completeFactoryProduction,
  completeDesign,
  completeModeling,
  confirmCustomerServiceInfo,
  confirmFinance,
  dispatchToFactory,
  getOrderLineDesignStatus,
  getOrderLineFactoryStatus,
  getOrderLineFinanceStatus,
  getOrderLineLineStatus,
  getOrderLineLineStatusLabel,
  getOrderLineModelingStatus,
  getOrderLineProductionStatus,
  getOrderLineTaskGroups,
  getOrderLineV2WorkflowStep,
  getOrderLineWorkflowActionState,
  lockFinance,
  markFinanceAbnormal,
  markProductionBlocked,
  recordWaxFileReady,
  resumeProduction,
  returnFactoryFeedback,
  requestDesignRevision,
  requestModelingRevision,
  startDesign,
  startFactoryProduction,
  startModeling,
  submitFactoryReturn
} from '@/services/orderLine/orderLineWorkflow'

describe('orderLineWorkflow', () => {
  it('uses current lineStatus as the workflow source', () => {
    const line = {
      ...orderLinesMock[1],
      lineStatus: 'pending_finance_confirmation'
    }

    expect(getOrderLineLineStatus(line)).toBe('pending_finance_confirmation')
    expect(getOrderLineLineStatusLabel(getOrderLineLineStatus(line))).toBe('待财务确认')
    expect(getOrderLineFinanceStatus(line)).toBe('pending')
  })

  it('derives production and factory workflow status from current fields', () => {
    const producingLine = orderLinesMock.find((line) => line.id === 'oi-ring-001')
    const returnedLine = orderLinesMock.find((line) => line.id === 'oi-pendant-001')

    expect(producingLine).toBeTruthy()
    expect(returnedLine).toBeTruthy()
    expect(getOrderLineProductionStatus(producingLine!)).toBe('in_production')
    expect(getOrderLineFactoryStatus(producingLine!)).toBe('in_production')
    expect(getOrderLineProductionStatus(returnedLine!)).toBe('completed')
    expect(getOrderLineFactoryStatus(returnedLine!)).toBe('returned')
  })

  it('builds OrderLine task groups from lineStatus', () => {
    const groups = getOrderLineTaskGroups(orderLinesMock)

    expect(groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'pending_design', label: '待设计', count: 1 }),
        expect.objectContaining({ value: 'pending_modeling', label: '待建模', count: 1 }),
        expect.objectContaining({ value: 'in_production', label: '生产中', count: 1 }),
        expect.objectContaining({ value: 'pending_finance_confirmation', label: '待财务确认', count: 1 })
      ])
    )
  })

  it('builds status patch with lineStatus only', () => {
    expect(buildOrderLineStatusPatch('ready_to_ship')).toEqual({
      lineStatus: 'ready_to_ship'
    })
  })

  it('routes customer-service confirmation by design and modeling needs', () => {
    const pendingLine = {
      ...orderLinesMock[0],
      designStatus: undefined,
      modelingStatus: undefined
    }

    expect(confirmCustomerServiceInfo({ ...pendingLine, requiresDesign: true, requiresModeling: true })).toMatchObject({
      lineStatus: 'pending_design',
      designStatus: 'pending'
    })

    expect(confirmCustomerServiceInfo({ ...pendingLine, requiresDesign: false, requiresModeling: true })).toMatchObject({
      lineStatus: 'pending_modeling',
      designStatus: 'not_required',
      modelingStatus: 'pending'
    })

    expect(confirmCustomerServiceInfo({ ...pendingLine, requiresDesign: false, requiresModeling: false })).toMatchObject({
      lineStatus: 'pending_merchandiser_review',
      designStatus: 'not_required',
      modelingStatus: 'not_required'
    })
  })

  it('advances design and modeling through the shared workflow actions', () => {
    const designStarted = startDesign({ ...orderLinesMock[0], lineStatus: 'pending_design', assignedDesignerId: undefined })
    expect(designStarted).toMatchObject({
      lineStatus: 'pending_design',
      assignedDesignerId: 'designer-current',
      designStatus: 'in_progress'
    })

    const designCompletedWithModeling = completeDesign({ ...designStarted, requiresModeling: true })
    expect(designCompletedWithModeling).toMatchObject({
      lineStatus: 'pending_modeling',
      designStatus: 'completed',
      modelingStatus: 'pending'
    })

    const designCompletedWithoutModeling = completeDesign({ ...designStarted, requiresModeling: false, modelingStatus: 'not_required' })
    expect(designCompletedWithoutModeling).toMatchObject({
      lineStatus: 'pending_merchandiser_review',
      designStatus: 'completed',
      modelingStatus: 'not_required'
    })

    const modelingStarted = startModeling({ ...orderLinesMock[0], lineStatus: 'pending_modeling', assignedModelerId: undefined })
    expect(modelingStarted).toMatchObject({
      lineStatus: 'pending_modeling',
      assignedModelerId: 'modeler-current',
      modelingStatus: 'in_progress'
    })

    expect(completeModeling(modelingStarted)).toMatchObject({
      lineStatus: 'pending_merchandiser_review',
      modelingStatus: 'completed'
    })
  })

  it('advances production, factory return and finance through shared workflow actions', () => {
    const reviewed = approveProductionReview({ ...orderLinesMock[0], lineStatus: 'pending_merchandiser_review' })
    expect(reviewed).toMatchObject({
      lineStatus: 'pending_factory_production',
      productionStatus: 'pending_dispatch'
    })

    const dispatched = dispatchToFactory(reviewed)
    expect(dispatched).toMatchObject({
      lineStatus: 'pending_factory_production',
      productionStatus: 'dispatched',
      factoryStatus: 'pending_acceptance',
      productionInfo: expect.objectContaining({ feedbackStatus: 'not_started' })
    })

    const accepted = acceptFactoryTask(dispatched)
    expect(accepted).toMatchObject({
      lineStatus: 'pending_factory_production',
      productionStatus: 'dispatched',
      factoryStatus: 'accepted',
      productionInfo: expect.objectContaining({ feedbackStatus: 'not_started' })
    })

    const producing = startFactoryProduction(accepted)
    expect(producing).toMatchObject({
      lineStatus: 'in_production',
      productionStatus: 'in_production',
      factoryStatus: 'in_production',
      productionInfo: expect.objectContaining({ feedbackStatus: 'in_progress' })
    })

    const completed = completeFactoryProduction(producing)
    expect(completed).toMatchObject({
      productionStatus: 'completed',
      factoryStatus: 'in_production',
      productionInfo: expect.objectContaining({ feedbackStatus: 'pending_feedback' })
    })

    const returned = submitFactoryReturn(completed)
    expect(returned).toMatchObject({
      lineStatus: 'factory_returned',
      productionStatus: 'completed',
      factoryStatus: 'returned',
      productionInfo: expect.objectContaining({ feedbackStatus: 'completed' })
    })

    const financePending = approveFactoryReturn(returned)
    expect(financePending).toMatchObject({
      lineStatus: 'pending_finance_confirmation',
      productionStatus: 'completed',
      factoryStatus: 'returned',
      financeStatus: 'pending'
    })

    expect(confirmFinance(financePending)).toMatchObject({
      lineStatus: 'ready_to_ship',
      financeStatus: 'confirmed',
      financeLocked: true
    })
  })

  it('validates the v2 end-to-end role chain from customer service to completion', () => {
    const baseLine = {
      ...orderLinesMock.find((item) => item.id === 'ol-zhang-earring-review-001')!,
      lineStatus: 'pending_customer_confirmation' as const,
      requiresDesign: true,
      requiresModeling: true,
      designStatus: undefined,
      modelingStatus: undefined,
      productionStatus: 'not_started' as const,
      factoryStatus: 'not_assigned' as const,
      financeStatus: 'not_required' as const,
      factoryPlannedDueDate: '2026-12-31',
      factoryId: currentFactoryId
    }
    const siblingLine = {
      ...orderLinesMock.find((item) => item.id === 'oi-pendant-001')!,
      lineStatus: 'in_production' as const,
      productionStatus: 'in_production' as const,
      factoryStatus: 'in_production' as const
    }

    const customerConfirmed = confirmCustomerServiceInfo(baseLine)
    const designStarted = startDesign(customerConfirmed)
    const designCompleted = completeDesign(designStarted)
    const modelingStarted = startModeling(designCompleted)
    const modelingCompleted = completeModeling(modelingStarted)
    const productionReviewed = approveProductionReview(modelingCompleted)
    const dispatched = dispatchToFactory(productionReviewed)
    const accepted = acceptFactoryTask(dispatched)
    const producing = startFactoryProduction(accepted)
    const blocked = markProductionBlocked(producing, '黄金链路测试异常')
    const resumed = resumeProduction(blocked)
    const productionCompleted = completeFactoryProduction(producing)
    const returned = submitFactoryReturn(productionCompleted)
    const financePending = approveFactoryReturn(returned)
    const financeConfirmed = confirmFinance(financePending, {
      financeConfirmedAt: '2026-05-06 14:00',
      financeNote: '端到端财务确认。'
    })
    const completed = completeOrderLine(financeConfirmed, '2026-05-06 18:00')

    const designRows = buildDesignModelingRows([customerConfirmed, designStarted, designCompleted, modelingStarted, modelingCompleted])
    const productionRows = buildProductionFollowUpRows([modelingCompleted, productionReviewed, dispatched, producing, blocked, resumed, returned, financePending], purchasesMock)
    const factoryRows = buildFactoryTaskRows([dispatched, accepted, producing, productionCompleted, returned], currentFactoryId)
    const financeRows = buildFinanceRows([financePending, financeConfirmed], purchasesMock)
    const managementMetrics = buildManagementDashboardMetrics(purchasesMock, [customerConfirmed, producing, financePending, financeConfirmed, completed], new Date('2026-05-06T10:00:00'))
    const updatedLines = [completed, siblingLine]

    expect(filterDesignModelingRowsByTab(designRows, 'pending_design').map((row) => row.line)).toContain(customerConfirmed)
    expect(filterDesignModelingRowsByTab(designRows, 'designing').map((row) => row.line)).toContain(designStarted)
    expect(filterDesignModelingRowsByTab(designRows, 'pending_modeling').map((row) => row.line)).toContain(designCompleted)
    expect(filterDesignModelingRowsByTab(designRows, 'modeling').map((row) => row.line)).toContain(modelingStarted)
    expect(filterDesignModelingRowsByTab(designRows, 'completed').map((row) => row.line)).toContain(modelingCompleted)
    expect(filterProductionFollowUpRowsByTab(productionRows, 'review').map((row) => row.line)).toContain(modelingCompleted)
    expect(filterProductionFollowUpRowsByTab(productionRows, 'dispatch').map((row) => row.line)).toEqual(expect.arrayContaining([productionReviewed, dispatched]))
    expect(filterProductionFollowUpRowsByTab(productionRows, 'producing').map((row) => row.line)).toContain(producing)
    expect(filterProductionFollowUpRowsByTab(productionRows, 'completion_review').map((row) => row.line)).toContain(returned)
    expect(filterProductionFollowUpRowsByTab(productionRows, 'risk').map((row) => row.line)).toContain(blocked)
    expect(filterProductionFollowUpRowsByTab(productionRows, 'risk').map((row) => row.line)).not.toContain(resumed)
    expect(filterFactoryTaskRowsByTab(factoryRows, 'pending_acceptance').map((row) => row.line)).toContain(dispatched)
    expect(filterFactoryTaskRowsByTab(factoryRows, 'in_production').map((row) => row.line)).toEqual(expect.arrayContaining([accepted, producing]))
    expect(filterFactoryTaskRowsByTab(factoryRows, 'pending_return').map((row) => row.line)).toContain(productionCompleted)
    expect(filterFactoryTaskRowsByTab(factoryRows, 'returned').map((row) => row.line)).toContain(returned)
    expect(filterFinanceRowsByTab(financeRows, 'settlement').map((row) => row.line)).toContain(financePending)
    expect(filterFinanceRowsByTab(financeRows, 'confirmed').map((row) => row.line)).toContain(financeConfirmed)
    expect(getOrderLineWorkflowActionState(dispatched)).toMatchObject({ canAcceptFactoryTask: true, canStartFactoryProduction: false })
    expect(getOrderLineWorkflowActionState(producing)).toMatchObject({ canMarkProductionBlocked: true, canCompleteFactoryProduction: true })
    expect(getOrderLineWorkflowActionState(productionCompleted)).toMatchObject({ canSubmitFactoryReturn: true })
    expect(getOrderLineWorkflowActionState(returned)).toMatchObject({ canApproveFactoryReturn: true, canReturnFactoryFeedback: true })
    expect(getOrderLineWorkflowActionState(financeConfirmed)).toMatchObject({ canCompleteOrderLine: true })
    expect(Object.values(getOrderLineWorkflowActionState(completed)).every((value) => value === false)).toBe(true)
    expect(managementMetrics.businessOverview.readyToShipLineCount).toBe(1)
    expect(managementMetrics.businessOverview.completedLineCount).toBe(1)
    expect(managementMetrics.productionRisks.blockedCount).toBe(0)
    expect(getOrderLineRisks(blocked).map((risk) => risk.key)).toContain('production_blocked')
    expect(getOrderLineRisks(resumed).map((risk) => risk.key)).not.toContain('production_blocked')
    expect(updatedLines.find((line) => line.id === siblingLine.id)).toMatchObject({
      lineStatus: 'in_production',
      productionStatus: 'in_production',
      factoryStatus: 'in_production'
    })
    expect(completed).toMatchObject({
      lineStatus: 'completed',
      financeStatus: 'confirmed',
      financeLocked: true,
      finishedAt: '2026-05-06 18:00'
    })
  })

  it('keeps design and modeling revision out of production workflow', () => {
    const designRevision = requestDesignRevision(
      {
        ...orderLinesMock[0],
        lineStatus: 'pending_merchandiser_review',
        productionStatus: 'pending_dispatch',
        factoryStatus: 'pending_acceptance'
      },
      '设计稿需要调整'
    )

    expect(designRevision).toMatchObject({
      lineStatus: 'pending_design',
      designStatus: 'revision_requested',
      productionStatus: 'not_started',
      factoryStatus: 'not_assigned',
      revisionReason: '设计稿需要调整'
    })

    const modelingRevision = requestModelingRevision(
      {
        ...orderLinesMock[0],
        lineStatus: 'pending_merchandiser_review',
        productionStatus: 'pending_dispatch',
        factoryStatus: 'pending_acceptance'
      },
      '建模文件需要调整'
    )

    expect(modelingRevision).toMatchObject({
      lineStatus: 'pending_modeling',
      modelingStatus: 'revision_requested',
      productionStatus: 'not_started',
      factoryStatus: 'not_assigned',
      revisionReason: '建模文件需要调整'
    })
  })

  it('records wax files without advancing the main workflow', () => {
    const line = { ...orderLinesMock[0], lineStatus: 'pending_modeling' as const }
    const nextLine = recordWaxFileReady(line, {
      waxFiles: [{ id: 'wax-file-test', name: 'wax.3dm', url: '#' }],
      waxFactorySentAt: '2026-05-06 10:00'
    })

    expect(nextLine).toMatchObject({
      lineStatus: 'pending_modeling',
      waxFactorySentAt: '2026-05-06 10:00'
    })
    expect(nextLine.waxFiles).toHaveLength(1)
  })

  it('handles finance abnormal and manual lock without touching production state', () => {
    const line = {
      ...orderLinesMock[1],
      lineStatus: 'pending_finance_confirmation',
      productionStatus: 'completed',
      factoryStatus: 'returned'
    }

    expect(markFinanceAbnormal(line, '尾款待核对', '待联系客户')).toMatchObject({
      lineStatus: 'pending_finance_confirmation',
      productionStatus: 'completed',
      factoryStatus: 'returned',
      financeStatus: 'abnormal',
      financeAbnormalReason: '尾款待核对',
      financeNote: '待联系客户',
      financeLocked: false
    })

    expect(lockFinance(line, '主管锁定')).toMatchObject({
      lineStatus: 'pending_finance_confirmation',
      productionStatus: 'completed',
      factoryStatus: 'returned',
      financeLocked: true,
      financeNote: '主管锁定'
    })
  })

  it('centralizes production blocked, resume and completion actions', () => {
    const producingLine = {
      ...orderLinesMock[0],
      lineStatus: 'in_production' as const,
      designStatus: 'completed' as const,
      modelingStatus: 'completed' as const,
      productionStatus: 'in_production' as const,
      factoryStatus: 'in_production' as const,
      financeStatus: 'not_required' as const
    }
    const blocked = markProductionBlocked(producingLine, '电镀异常')
    const resumed = resumeProduction(blocked)
    const readyToShip = {
      ...orderLinesMock[1],
      lineStatus: 'ready_to_ship' as const,
      financeStatus: 'confirmed' as const,
      financeLocked: true
    }

    expect(blocked).toMatchObject({
      lineStatus: 'in_production',
      designStatus: 'completed',
      modelingStatus: 'completed',
      productionStatus: 'blocked',
      factoryStatus: 'abnormal',
      financeStatus: 'not_required',
      productionInfo: expect.objectContaining({
        feedbackStatus: 'issue',
        factoryNote: '电镀异常'
      })
    })
    expect(getOrderLineRisks(blocked).map((risk) => risk.key)).toContain('production_blocked')
    expect(getRoleTaskBadges([blocked], 'merchandiser').map((badge) => badge.label)).toContain('生产风险')
    expect(resumed).toMatchObject({
      lineStatus: 'in_production',
      productionStatus: 'in_production',
      factoryStatus: 'in_production',
      financeStatus: 'not_required',
      productionInfo: expect.objectContaining({ feedbackStatus: 'in_progress' })
    })
    expect(getOrderLineRisks(resumed).map((risk) => risk.key)).not.toContain('production_blocked')
    expect(completeOrderLine({ ...readyToShip, lineStatus: 'pending_finance_confirmation' })).toMatchObject({
      lineStatus: 'pending_finance_confirmation'
    })
    expect(completeOrderLine(readyToShip, '2026-05-06 18:00')).toMatchObject({
      lineStatus: 'completed',
      finishedAt: '2026-05-06 18:00',
      financeStatus: 'confirmed',
      financeLocked: true
    })
  })

  it('exposes workflow action availability for page buttons', () => {
    const review = { ...orderLinesMock[0], lineStatus: 'pending_merchandiser_review' as const, productionStatus: 'not_started' as const, factoryStatus: 'not_assigned' as const }
    const dispatchReady = approveProductionReview(review)
    const dispatched = dispatchToFactory(dispatchReady)
    const accepted = acceptFactoryTask(dispatched)
    const producing = startFactoryProduction(accepted)
    const productionCompleted = completeFactoryProduction(producing)
    const returned = submitFactoryReturn(productionCompleted)
    const readyToShip = confirmFinance(approveFactoryReturn(returned))
    const completed = completeOrderLine(readyToShip)
    const blocked = markProductionBlocked(producing)

    expect(getOrderLineWorkflowActionState(review)).toMatchObject({
      canApproveProductionReview: true,
      canDispatchToFactory: false,
      canCompleteOrderLine: false
    })
    expect(getOrderLineWorkflowActionState(dispatchReady)).toMatchObject({
      canDispatchToFactory: true,
      canAcceptFactoryTask: false
    })
    expect(getOrderLineWorkflowActionState(dispatched)).toMatchObject({
      canAcceptFactoryTask: true,
      canStartFactoryProduction: false
    })
    expect(getOrderLineWorkflowActionState(accepted)).toMatchObject({
      canStartFactoryProduction: true
    })
    expect(getOrderLineWorkflowActionState(producing)).toMatchObject({
      canMarkProductionBlocked: true,
      canCompleteFactoryProduction: true,
      canSubmitFactoryReturn: false
    })
    expect(getOrderLineWorkflowActionState(productionCompleted)).toMatchObject({
      canSubmitFactoryReturn: true,
      canMarkProductionBlocked: false
    })
    expect(getOrderLineWorkflowActionState(returned)).toMatchObject({
      canApproveFactoryReturn: true,
      canReturnFactoryFeedback: true
    })
    expect(getOrderLineWorkflowActionState(readyToShip)).toMatchObject({
      canCompleteOrderLine: true,
      canDispatchToFactory: false
    })
    expect(getOrderLineWorkflowActionState(blocked)).toMatchObject({
      canResumeProduction: true,
      canMarkProductionBlocked: false
    })
    expect(Object.values(getOrderLineWorkflowActionState(completed)).every((value) => value === false)).toBe(true)
  })

  it('applies finance confirmation patch through the shared action', () => {
    expect(
      confirmFinance(
        {
          ...orderLinesMock[1],
          lineStatus: 'pending_finance_confirmation'
        },
        {
          factorySettlementAmount: 560,
          estimatedGrossProfit: 400,
          estimatedGrossProfitRate: 31.3,
          financeConfirmedAt: '2026-05-06 11:00',
          financeNote: '财务已确认。'
        }
      )
    ).toMatchObject({
      lineStatus: 'ready_to_ship',
      financeStatus: 'confirmed',
      financeLocked: true,
      factorySettlementAmount: 560,
      estimatedGrossProfit: 400,
      estimatedGrossProfitRate: 31.3,
      financeConfirmedAt: '2026-05-06 11:00',
      financeNote: '财务已确认。'
    })
  })

  it('does not approve or reject factory return before factory_returned', () => {
    const line = { ...orderLinesMock[0], lineStatus: 'in_production' as const }

    expect(approveFactoryReturn(line)).toBe(line)
    expect(returnFactoryFeedback(line)).toBe(line)
  })

  it('returns factory feedback to production when completion review is rejected', () => {
    const rejected = returnFactoryFeedback({
      ...orderLinesMock[0],
      lineStatus: 'factory_returned',
      productionInfo: {
        ...orderLinesMock[0].productionInfo,
        feedbackStatus: 'completed'
      }
    })

    expect(rejected).toMatchObject({
      lineStatus: 'in_production',
      productionStatus: 'blocked',
      factoryStatus: 'abnormal',
      financeStatus: 'not_required',
      productionInfo: expect.objectContaining({ feedbackStatus: 'issue' })
    })
  })

  it('describes the v2 next workflow step from the current OrderLine state', () => {
    expect(
      getOrderLineV2WorkflowStep({
        ...orderLinesMock[0],
        lineStatus: 'pending_customer_confirmation',
        requiresDesign: true,
        requiresModeling: true
      })
    ).toMatchObject({
      stageLabel: '客服确认',
      ownerRoleLabel: '客服',
      nextActionLabel: '确认资料并分流'
    })

    expect(
      getOrderLineV2WorkflowStep({
        ...orderLinesMock[0],
        lineStatus: 'factory_returned'
      })
    ).toMatchObject({
      stageLabel: '完工待审核',
      ownerRoleLabel: '跟单',
      nextActionLabel: '审核工厂回传'
    })
  })

  it('shows finance locked lines as read-only workflow steps', () => {
    expect(
      getOrderLineV2WorkflowStep({
        ...orderLinesMock[0],
        lineStatus: 'pending_finance_confirmation',
        financeStatus: 'confirmed',
        financeLocked: true
      })
    ).toMatchObject({
      stageLabel: '财务已锁定',
      ownerRoleLabel: '财务',
      nextActionLabel: '只读复核'
    })
  })

  it('ignores removed legacy status fields when current workflow fields exist', () => {
    const line = {
      ...orderLinesMock[1],
      lineStatus: 'pending_finance_confirmation',
      designStatus: 'completed',
      modelingStatus: 'not_required',
      factoryStatus: 'returned',
      designInfo: {
        ...orderLinesMock[1].designInfo,
        designStatus: 'pending'
      },
      productionInfo: {
        ...orderLinesMock[1].productionInfo,
        feedbackStatus: 'completed',
        factoryStatus: 'abnormal'
      }
    }

    expect(getOrderLineLineStatus(line)).toBe('pending_finance_confirmation')
    expect(getOrderLineDesignStatus(line)).toBe('completed')
    expect(getOrderLineModelingStatus(line)).toBe('not_required')
    expect(getOrderLineFactoryStatus(line)).toBe('returned')
  })
})
