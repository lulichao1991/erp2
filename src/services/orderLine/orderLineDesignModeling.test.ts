import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { buildDesignModelingRows, filterDesignModelingRowsByTab } from '@/services/orderLine/orderLineDesignModeling'

describe('orderLineDesignModeling', () => {
  const rows = buildDesignModelingRows(orderLinesMock)

  it('builds rows only from design, modeling, wax or revision order lines', () => {
    expect(rows.map((row) => row.line.id)).toContain('ol-zhang-necklace-001')
    expect(rows.map((row) => row.line.id)).toContain('ol-zhang-wax-001')
    expect(rows.map((row) => row.line.id)).not.toContain('ol-zhang-earring-review-001')
  })

  it('filters rows by design, modeling, revision and completed tabs', () => {
    expect(filterDesignModelingRowsByTab(rows, 'pending_design').map((row) => row.line.id)).toContain('ol-zhang-necklace-001')
    expect(filterDesignModelingRowsByTab(rows, 'pending_modeling').map((row) => row.line.id)).toContain('ol-zhang-wax-001')
    expect(filterDesignModelingRowsByTab(rows, 'revision').map((row) => row.line.id)).toContain('ol-zhang-necklace-001')
    expect(filterDesignModelingRowsByTab(rows, 'completed').map((row) => row.line.id)).toContain('oi-ring-001')
  })
})
