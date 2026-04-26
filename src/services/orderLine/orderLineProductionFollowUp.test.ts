import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import { buildProductionFollowUpRows, filterProductionFollowUpRowsByTab } from '@/services/orderLine/orderLineProductionFollowUp'

describe('orderLineProductionFollowUp', () => {
  const rows = buildProductionFollowUpRows(orderLinesMock, purchasesMock)

  it('builds follow-up rows from current order lines and purchases', () => {
    expect(rows.some((row) => row.line.id === 'ol-zhang-earring-review-001' && row.purchaseNo === 'PUR-202604-001')).toBe(true)
    expect(rows.some((row) => row.line.id === 'oi-ring-001' && row.productionStatusLabel === '生产中')).toBe(true)
  })

  it('filters rows by merchandiser review, dispatch, producing and risk tabs', () => {
    expect(filterProductionFollowUpRowsByTab(rows, 'review').map((row) => row.line.id)).toContain('ol-zhang-earring-review-001')
    expect(filterProductionFollowUpRowsByTab(rows, 'dispatch').map((row) => row.line.id)).toContain('ol-zhang-brooch-blocked-001')
    expect(filterProductionFollowUpRowsByTab(rows, 'producing').map((row) => row.line.id)).toContain('oi-ring-001')
    expect(filterProductionFollowUpRowsByTab(rows, 'risk').map((row) => row.line.id)).toContain('ol-zhang-brooch-blocked-001')
  })
})
