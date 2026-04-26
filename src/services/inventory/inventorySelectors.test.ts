import { describe, expect, it } from 'vitest'
import { customersMock, inventoryItemsMock, mockProducts, orderLinesMock, purchasesMock } from '@/mocks'
import { applyInventoryMovement, buildInventoryRows, buildInventorySummary, filterInventoryRows } from '@/services/inventory/inventorySelectors'

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
      note: '为商品行预占链身'
    })

    expect(reserveResult.item.quantity).toBe(5)
    expect(reserveResult.item.availableQuantity).toBe(3)
    expect(reserveResult.item.status).toBe('in_stock')
    expect(reserveResult.movement.type).toBe('reserve')
    expect(reserveResult.movement.fromStatus).toBe('in_stock')
    expect(reserveResult.movement.toStatus).toBe('in_stock')

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
})
