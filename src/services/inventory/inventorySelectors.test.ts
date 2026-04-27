import { describe, expect, it } from 'vitest'
import { customersMock, inventoryItemsMock, mockProducts, orderLinesMock, purchasesMock } from '@/mocks'
import { applyInventoryMovement, applyInventoryReview, buildInventoryRows, buildInventorySummary, filterInventoryRows } from '@/services/inventory/inventorySelectors'

const buildRows = () =>
  buildInventoryRows({
    inventoryItems: inventoryItemsMock,
    products: mockProducts,
    purchases: purchasesMock,
    orderLines: orderLinesMock,
    customers: customersMock
  })

describe('inventorySelectors', () => {
  it('builds inventory rows with current workflow links', () => {
    const rows = buildRows()
    const returnRow = rows.find((row) => row.item.sourceType === 'customer_return')

    expect(returnRow?.sourceLabel).toBe('客户退货入库')
    expect(returnRow?.purchaseNo).toBe('PUR-202604-001')
    expect(returnRow?.orderLineCode).toBe('OL-202604-001-01')
    expect(returnRow?.customerName).toBe('张三')
    expect(returnRow?.linkedSummary).toContain('商品行：OL-202604-001-01')
  })

  it('summarizes design samples, returns and review-needed inventory', () => {
    const summary = buildInventorySummary(buildRows())

    expect(summary.skuCount).toBe(inventoryItemsMock.length)
    expect(summary.totalQuantity).toBe(8)
    expect(summary.availableQuantity).toBe(7)
    expect(summary.designSampleCount).toBe(1)
    expect(summary.customerReturnCount).toBe(1)
    expect(summary.needsReviewCount).toBe(1)
  })

  it('filters inventory by source, status, condition, location and keyword', () => {
    const rows = buildRows()

    expect(filterInventoryRows(rows, { keyword: '', quickView: 'all', sourceType: 'design_sample', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'all', sourceType: 'all', status: 'reserved', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'all', sourceType: 'all', status: 'all', condition: 'repair_needed', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'all', sourceType: 'all', status: 'all', condition: 'all', location: '常备链身' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: 'PUR-202604-001', quickView: 'all', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
  })

  it('filters inventory by warehouse quick views', () => {
    const rows = buildRows()

    expect(filterInventoryRows(rows, { keyword: '', quickView: 'design_samples', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'customer_returns', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'needs_review', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'reserved', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'unavailable', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
  })

  it('applies inventory movements without changing linked order lines', () => {
    const stockItem = inventoryItemsMock.find((item) => item.id === 'inventory-stock-chain-001')
    expect(stockItem).toBeDefined()

    const reserveResult = applyInventoryMovement(stockItem!, {
      type: 'reserve',
      quantity: 2,
      operatorName: '周库管',
      occurredAt: '2026-04-26 10:00',
      relatedOrderLineId: 'oi-ring-001',
      note: '为商品行预占链身'
    })

    expect(reserveResult.item.quantity).toBe(5)
    expect(reserveResult.item.availableQuantity).toBe(3)
    expect(reserveResult.item.status).toBe('in_stock')
    expect(reserveResult.movement.type).toBe('reserve')
    expect(reserveResult.movement.fromStatus).toBe('in_stock')
    expect(reserveResult.movement.toStatus).toBe('in_stock')
    expect(reserveResult.movement.relatedOrderLineId).toBe('oi-ring-001')

    const outboundResult = applyInventoryMovement(reserveResult.item, {
      type: 'outbound',
      quantity: 3,
      operatorName: '周库管',
      occurredAt: '2026-04-26 11:00',
      note: '领用出库'
    })

    expect(outboundResult.item.quantity).toBe(2)
    expect(outboundResult.item.availableQuantity).toBe(2)
    expect(outboundResult.item.status).toBe('in_stock')
    expect(outboundResult.movement.type).toBe('outbound')
  })

  it('rejects invalid movement quantities', () => {
    const stockItem = inventoryItemsMock.find((item) => item.id === 'inventory-design-sample-ring-001')
    expect(stockItem).toBeDefined()

    expect(() =>
      applyInventoryMovement(stockItem!, {
        type: 'reserve',
        quantity: 2,
        operatorName: '周库管',
        occurredAt: '2026-04-26 10:00'
      })
    ).toThrow('占用数量不能大于可用数量')

    expect(() =>
      applyInventoryMovement(stockItem!, {
        type: 'outbound',
        quantity: 0,
        operatorName: '周库管',
        occurredAt: '2026-04-26 10:00'
      })
    ).toThrow('库存流转数量必须大于 0')
  })

  it('applies warehouse quality review without changing linked order lines', () => {
    const returnItem = inventoryItemsMock.find((item) => item.id === 'inventory-return-ring-001')
    expect(returnItem).toBeDefined()

    const result = applyInventoryReview(returnItem!, {
      condition: 'returned',
      status: 'in_stock',
      availableQuantity: 1,
      operatorName: '周库管',
      occurredAt: '2026-04-26 12:00',
      toLocation: 'B-退货可用-01',
      note: '质检通过，可作为库存资产再次使用。'
    })

    expect(result.item.condition).toBe('returned')
    expect(result.item.status).toBe('in_stock')
    expect(result.item.availableQuantity).toBe(1)
    expect(result.item.warehouseLocation).toBe('B-退货可用-01')
    expect(result.item.orderLineId).toBe(returnItem?.orderLineId)
    expect(result.movement.type).toBe('adjust')
    expect(result.movement.relatedOrderLineId).toBe(returnItem?.orderLineId)
    expect(result.movement.note).toBe('质检通过，可作为库存资产再次使用。')
  })

  it('rejects quality review available quantity above stock quantity', () => {
    const returnItem = inventoryItemsMock.find((item) => item.id === 'inventory-return-ring-001')
    expect(returnItem).toBeDefined()

    expect(() =>
      applyInventoryReview(returnItem!, {
        condition: 'returned',
        status: 'in_stock',
        availableQuantity: 2,
        operatorName: '周库管',
        occurredAt: '2026-04-26 12:00'
      })
    ).toThrow('可用数量不能大于库存数量')
  })
})
