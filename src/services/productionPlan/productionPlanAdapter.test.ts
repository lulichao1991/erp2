import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { mockProducts } from '@/mocks/products'
import { purchasesMock } from '@/mocks/purchases'
import { mockTasks } from '@/mocks/tasks'
import { buildProductionPlanDetail, buildProductionPlanRows, getProductionPlanStage } from '@/services/productionPlan/productionPlanAdapter'

describe('productionPlanAdapter', () => {
  it('builds rows and detail from purchases and order lines first', () => {
    const rows = buildProductionPlanRows({
      tasks: mockTasks,
      purchases: purchasesMock,
      orderLines: orderLinesMock,
      products: mockProducts
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      taskId: 'task-factory-001',
      purchaseId: 'o-202604-001',
      purchaseNo: 'PUR-202604-001',
      orderLineId: 'oi-ring-001',
      orderLineName: '山形素圈戒指',
      goodsNo: 'RING-SH-016',
      sourceProductVersion: 'v3',
      categoryLabel: '戒指',
      quantity: 1
    })

    const detail = buildProductionPlanDetail({
      taskId: 'task-factory-001',
      tasks: mockTasks,
      purchases: purchasesMock,
      orderLines: orderLinesMock,
      products: mockProducts
    })

    expect(detail).toBeTruthy()
    expect(detail).toMatchObject({
      purchaseId: 'o-202604-001',
      purchaseNo: 'PUR-202604-001',
      orderLineId: 'oi-ring-001',
      orderLineName: '山形素圈戒指'
    })
    expect(detail?.timeline.map((record) => record.id)).toContain('tl-purchase-001-ring-production')
  })

  it('uses current order line production info for production stage and detail feedback', () => {
    const currentOrderLines = orderLinesMock.map((line) =>
      line.id === 'oi-ring-001'
        ? {
            ...line,
            productionInfo: {
              ...line.productionInfo,
              factoryStatus: 'completed',
              factoryNote: 'current order line feedback'
            }
          }
        : line
    )

    const rows = buildProductionPlanRows({
      tasks: mockTasks,
      purchases: purchasesMock,
      orderLines: currentOrderLines,
      products: mockProducts
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      stage: 'reported',
      stageLabel: '已回传'
    })

    const detail = buildProductionPlanDetail({
      taskId: 'task-factory-001',
      tasks: mockTasks,
      purchases: purchasesMock,
      orderLines: currentOrderLines,
      products: mockProducts
    })

    expect(detail?.row).toMatchObject({
      stage: 'reported',
      stageLabel: '已回传'
    })
    expect(detail?.orderLine.productionInfo?.factoryStatus).toBe('completed')
    expect(detail?.orderLine.productionInfo?.factoryNote).toBe('current order line feedback')
  })

  it('builds one production plan row from the current factory production task', () => {
    const rows = buildProductionPlanRows({
      tasks: mockTasks,
      purchases: purchasesMock,
      orderLines: orderLinesMock,
      products: mockProducts
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      taskId: 'task-factory-001',
      purchaseId: 'o-202604-001',
      purchaseNo: 'PUR-202604-001',
      orderLineId: 'oi-ring-001',
      orderLineName: '山形素圈戒指',
      goodsNo: 'RING-SH-016',
      sourceProductVersion: 'v3',
      categoryLabel: '戒指',
      quantity: 1,
      stage: 'in_production'
    })
  })

  it('does not build rows when current order-line links are absent', () => {
    const tasksWithoutOrderLineLinks = mockTasks.map(({ orderLineId, orderLineName, ...task }) => task)
    const purchasesWithoutOrderLines = purchasesMock.map((purchase) => ({ ...purchase, orderLines: [] }))
    const rows = buildProductionPlanRows({
      tasks: tasksWithoutOrderLineLinks,
      purchases: purchasesWithoutOrderLines,
      products: mockProducts
    })

    expect(rows).toHaveLength(0)
  })

  it('maps task and factory feedback into the expected display stages', () => {
    const factoryTask = mockTasks.find((item) => item.id === 'task-factory-001')
    const orderLine = orderLinesMock.find((item) => item.id === 'oi-ring-001')

    expect(factoryTask).toBeTruthy()
    expect(orderLine).toBeTruthy()

    const receivedTask = { ...factoryTask!, status: 'in_progress' as const }
    const readyItem = {
      ...orderLine!,
      lineStatus: 'pending_factory_production',
      productionStatus: 'pending_dispatch',
      factoryStatus: 'not_assigned',
      productionInfo: {
        ...orderLine!.productionInfo,
        factoryStatus: 'not_started'
      }
    }
    const producingItem = {
      ...orderLine!,
      lineStatus: 'in_production',
      productionStatus: 'in_production',
      factoryStatus: 'in_production',
      productionInfo: {
        ...orderLine!.productionInfo,
        factoryStatus: 'in_progress'
      }
    }
    const pendingReportTask = { ...receivedTask, status: 'pending_confirm' as const }
    const pendingFeedbackItem = {
      ...orderLine!,
      lineStatus: 'in_production',
      productionStatus: 'in_production',
      factoryStatus: 'in_production',
      productionInfo: {
        ...orderLine!.productionInfo,
        factoryStatus: 'pending_feedback'
      }
    }
    const reportedTask = { ...receivedTask, status: 'done' as const }
    const issueItem = {
      ...orderLine!,
      productionStatus: 'blocked',
      factoryStatus: 'abnormal',
      productionInfo: {
        ...orderLine!.productionInfo,
        factoryStatus: 'issue'
      }
    }
    expect(getProductionPlanStage(factoryTask!, orderLine!)).toBe('in_production')
    expect(getProductionPlanStage(receivedTask, readyItem)).toBe('ready_to_produce')
    expect(getProductionPlanStage(receivedTask, producingItem)).toBe('in_production')
    expect(getProductionPlanStage(pendingReportTask, pendingFeedbackItem)).toBe('pending_report')
    expect(getProductionPlanStage(reportedTask, orderLine!)).toBe('reported')
    expect(getProductionPlanStage(receivedTask, issueItem)).toBe('issue')
  })

  it('builds detail data with production files and timeline records', () => {
    const detail = buildProductionPlanDetail({
      taskId: 'task-factory-001',
      tasks: mockTasks,
      purchases: purchasesMock,
      orderLines: orderLinesMock,
      products: mockProducts
    })

    expect(detail).toBeTruthy()
    expect(detail).toMatchObject({
      purchaseId: 'o-202604-001',
      purchaseNo: 'PUR-202604-001',
      orderLineId: 'oi-ring-001',
      orderLineName: '山形素圈戒指'
    })
    expect(detail?.row).toMatchObject({
      purchaseId: 'o-202604-001',
      purchaseNo: 'PUR-202604-001',
      orderLineId: 'oi-ring-001',
      orderLineName: '山形素圈戒指'
    })
    expect(detail?.fileGroups.map((group) => group.title)).toContain('建模文件')
    expect(detail?.fileGroups.map((group) => group.title)).toContain('工艺图')
    expect(detail?.timeline.length).toBeGreaterThan(0)
  })

  it('returns undefined when linked task, order line, or source product is missing', () => {
    const purchasesWithoutOrderLines = purchasesMock.map((purchase) => ({ ...purchase, orderLines: [] }))

    expect(
      buildProductionPlanDetail({
        taskId: 'missing-task',
        tasks: mockTasks,
        purchases: purchasesMock,
        orderLines: orderLinesMock,
        products: mockProducts
      })
    ).toBeUndefined()

    expect(
      buildProductionPlanDetail({
        taskId: 'task-factory-001',
        tasks: mockTasks,
        purchases: purchasesWithoutOrderLines,
        orderLines: orderLinesMock.filter((item) => item.id !== 'oi-ring-001'),
        products: mockProducts
      })
    ).toBeUndefined()

    expect(
      buildProductionPlanDetail({
        taskId: 'task-factory-001',
        tasks: mockTasks,
        purchases: purchasesMock,
        orderLines: orderLinesMock,
        products: mockProducts.filter((item) => item.id !== orderLinesMock[0]?.sourceProduct?.sourceProductId)
      })
    ).toBeUndefined()
  })
})
