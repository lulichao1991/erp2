import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { mockOrders } from '@/mocks/orders'
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
      orderLineCode: 'OL-202604-001-01',
      orderLineName: '山形戒指',
      orderId: 'o-202604-001',
      orderNo: 'PUR-202604-001',
      orderItemId: 'oi-ring-001',
      goodsNo: 'RING-SH-016',
      styleName: '山形戒指',
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
      orderLineCode: 'OL-202604-001-01',
      orderLineName: '山形戒指'
    })
    expect(detail?.timeline.map((record) => record.id)).toContain('tl-purchase-001-ring-production')
  })

  it('prefers current order line production info over stale legacy order item feedback', () => {
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
    const staleLegacyOrders = mockOrders.map((order) =>
      order.id === 'o-202604-001'
        ? {
            ...order,
            items: order.items.map((item) =>
              item.id === 'oi-ring-001'
                ? {
                    ...item,
                    factoryFeedback: {
                      ...item.factoryFeedback,
                      factoryStatus: 'in_progress',
                      factoryNote: 'stale legacy order item feedback'
                    }
                  }
                : item
            )
          }
        : order
    )

    const rows = buildProductionPlanRows({
      tasks: mockTasks,
      purchases: purchasesMock,
      orderLines: currentOrderLines,
      orders: staleLegacyOrders,
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
      orders: staleLegacyOrders,
      products: mockProducts
    })

    expect(detail?.row).toMatchObject({
      stage: 'reported',
      stageLabel: '已回传'
    })
    expect(detail?.orderItem.factoryFeedback?.factoryStatus).toBe('completed')
    expect(detail?.orderItem.factoryFeedback?.factoryNote).toBe('current order line feedback')
  })

  it('builds one production plan row from the factory production task', () => {
    const rows = buildProductionPlanRows({
      tasks: mockTasks,
      orders: mockOrders,
      products: mockProducts
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      taskId: 'task-factory-001',
      purchaseId: 'o-202604-001',
      purchaseNo: 'SO-202604-001',
      orderLineId: 'oi-ring-001',
      orderLineCode: 'OL-202604-001-01',
      orderLineName: '山形戒指',
      orderId: 'o-202604-001',
      orderNo: 'SO-202604-001',
      orderItemId: 'oi-ring-001',
      goodsNo: 'RING-SH-016',
      styleName: '山形戒指',
      sourceProductVersion: 'v3',
      categoryLabel: '戒指',
      quantity: 1,
      stage: 'in_production'
    })
  })

  it('falls back to old orders and order items when purchase and order line inputs are absent', () => {
    const legacyTasks = mockTasks.map(({ purchaseId, purchaseNo, orderLineId, orderLineCode, orderLineName, transactionId, transactionNo, ...task }) => task)
    const rows = buildProductionPlanRows({
      tasks: legacyTasks,
      orders: mockOrders,
      products: mockProducts
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      purchaseId: 'o-202604-001',
      purchaseNo: 'SO-202604-001',
      orderLineId: 'oi-ring-001',
      orderLineCode: 'OL-202604-001-01',
      orderLineName: '山形戒指',
      orderId: 'o-202604-001',
      orderNo: 'SO-202604-001',
      orderItemId: 'oi-ring-001'
    })
  })

  it('maps task and factory feedback into the expected display stages', () => {
    const factoryTask = mockTasks.find((item) => item.id === 'task-factory-001')
    const orderItem = mockOrders[0]?.items.find((item) => item.id === 'oi-ring-001')

    expect(factoryTask).toBeTruthy()
    expect(orderItem).toBeTruthy()

    const receivedTask = { ...factoryTask!, status: 'in_progress' as const }
    const readyItem = {
      ...orderItem!,
      factoryFeedback: {
        ...orderItem!.factoryFeedback,
        factoryStatus: 'not_started'
      }
    }
    const producingItem = {
      ...orderItem!,
      factoryFeedback: {
        ...orderItem!.factoryFeedback,
        factoryStatus: 'in_progress'
      }
    }
    const legacyProducingItem = {
      ...orderItem!,
      factoryFeedback: {
        ...orderItem!.factoryFeedback,
        factoryStatus: '生产中'
      }
    }
    const pendingReportTask = { ...receivedTask, status: 'pending_confirm' as const }
    const pendingFeedbackItem = {
      ...orderItem!,
      factoryFeedback: {
        ...orderItem!.factoryFeedback,
        factoryStatus: 'pending_feedback'
      }
    }
    const reportedTask = { ...receivedTask, status: 'done' as const }
    const issueItem = {
      ...orderItem!,
      factoryFeedback: {
        ...orderItem!.factoryFeedback,
        factoryStatus: 'issue'
      }
    }
    const legacyIssueItem = {
      ...orderItem!,
      factoryFeedback: {
        ...orderItem!.factoryFeedback,
        factoryStatus: '有异常'
      }
    }

    expect(getProductionPlanStage(factoryTask!, orderItem!)).toBe('in_production')
    expect(getProductionPlanStage(receivedTask, readyItem)).toBe('ready_to_produce')
    expect(getProductionPlanStage(receivedTask, producingItem)).toBe('in_production')
    expect(getProductionPlanStage(receivedTask, legacyProducingItem)).toBe('in_production')
    expect(getProductionPlanStage(pendingReportTask, pendingFeedbackItem)).toBe('pending_report')
    expect(getProductionPlanStage(reportedTask, orderItem!)).toBe('reported')
    expect(getProductionPlanStage(receivedTask, issueItem)).toBe('issue')
    expect(getProductionPlanStage(receivedTask, legacyIssueItem)).toBe('issue')
  })

  it('builds detail data with production files and timeline records', () => {
    const detail = buildProductionPlanDetail({
      taskId: 'task-factory-001',
      tasks: mockTasks,
      orders: mockOrders,
      products: mockProducts
    })

    expect(detail).toBeTruthy()
    expect(detail).toMatchObject({
      purchaseId: 'o-202604-001',
      purchaseNo: 'SO-202604-001',
      orderLineId: 'oi-ring-001',
      orderLineCode: 'OL-202604-001-01',
      orderLineName: '山形戒指'
    })
    expect(detail?.row).toMatchObject({
      purchaseId: 'o-202604-001',
      purchaseNo: 'SO-202604-001',
      orderLineId: 'oi-ring-001',
      orderLineCode: 'OL-202604-001-01',
      orderLineName: '山形戒指'
    })
    expect(detail?.fileGroups.map((group) => group.title)).toContain('建模文件')
    expect(detail?.fileGroups.map((group) => group.title)).toContain('刻字 PLT 文件')
    expect(detail?.timeline.length).toBeGreaterThan(0)
  })

  it('returns undefined when linked order, order item, or source product is missing', () => {
    expect(
      buildProductionPlanDetail({
        taskId: 'task-factory-001',
        tasks: mockTasks,
        orders: mockOrders.slice(1),
        products: mockProducts
      })
    ).toBeUndefined()

    expect(
      buildProductionPlanDetail({
        taskId: 'task-factory-001',
        tasks: mockTasks,
        orders: [
          {
            ...mockOrders[0],
            items: mockOrders[0].items.filter((item) => item.id !== 'oi-ring-001')
          }
        ],
        products: mockProducts
      })
    ).toBeUndefined()

    expect(
      buildProductionPlanDetail({
        taskId: 'task-factory-001',
        tasks: mockTasks,
        orders: mockOrders,
        products: mockProducts.filter((item) => item.id !== mockOrders[0].items[0]?.sourceProduct?.sourceProductId)
      })
    ).toBeUndefined()
  })
})
