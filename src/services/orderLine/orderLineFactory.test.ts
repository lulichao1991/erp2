import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { buildFactoryTaskRows, currentFactoryId, filterFactoryTaskRowsByTab } from '@/services/orderLine/orderLineFactory'

describe('orderLineFactory', () => {
  const rows = buildFactoryTaskRows(orderLinesMock, currentFactoryId)

  it('builds factory rows only for the current mock factory', () => {
    expect(rows.map((row) => row.line.id)).toContain('oi-ring-001')
    expect(rows.map((row) => row.line.id)).toContain('ol-zhang-brooch-blocked-001')
    expect(rows.map((row) => row.line.id)).toContain('ol-zhang-factory-pending-001')
    expect(rows.map((row) => row.line.id)).not.toContain('oi-pendant-001')
  })

  it('filters factory rows by production handoff states', () => {
    expect(filterFactoryTaskRowsByTab(rows, 'pending_acceptance').map((row) => row.line.id)).toContain('ol-zhang-factory-pending-001')
    expect(filterFactoryTaskRowsByTab(rows, 'in_production').map((row) => row.line.id)).toContain('oi-ring-001')
    expect(filterFactoryTaskRowsByTab(rows, 'abnormal').map((row) => row.line.id)).toContain('ol-zhang-brooch-blocked-001')
  })
})
