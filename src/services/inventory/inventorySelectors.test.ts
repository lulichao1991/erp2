import { describe, expect, it } from 'vitest'
import { customersMock, inventoryItemsMock, mockProducts, orderLinesMock, purchasesMock } from '@/mocks'
import { buildInventoryRows, buildInventorySummary, filterInventoryRows } from '@/services/inventory/inventorySelectors'

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

    expect(filterInventoryRows(rows, { keyword: '', sourceType: 'design_sample', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', sourceType: 'all', status: 'reserved', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', sourceType: 'all', status: 'all', condition: 'repair_needed', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', sourceType: 'all', status: 'all', condition: 'all', location: '常备链身' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: 'PUR-202604-001', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
  })
})
