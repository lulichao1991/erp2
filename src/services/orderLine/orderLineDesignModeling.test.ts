import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { buildDesignModelingRows, filterDesignModelingRowsByTab } from '@/services/orderLine/orderLineDesignModeling'
import { completeDesign, completeModeling, requestDesignRevision, requestModelingRevision, startDesign, startModeling } from '@/services/orderLine/orderLineWorkflow'

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

  it('keeps v2 design and modeling workflow rows in the expected tabs', () => {
    const baseLine = {
      ...orderLinesMock.find((line) => line.id === 'ol-zhang-necklace-001')!,
      requiresDesign: true,
      requiresModeling: true,
      designStatus: 'pending' as const,
      modelingStatus: 'pending' as const,
      lineStatus: 'pending_design' as const
    }
    const designing = startDesign(baseLine)
    const pendingModeling = completeDesign(designing)
    const modeling = startModeling(pendingModeling)
    const completed = completeModeling(modeling)
    const designRevision = requestDesignRevision(completed, '设计修改')
    const modelingRevision = requestModelingRevision(completed, '建模修改')
    const workflowRows = buildDesignModelingRows([baseLine, designing, pendingModeling, modeling, completed, designRevision, modelingRevision])

    expect(filterDesignModelingRowsByTab(workflowRows, 'pending_design').map((row) => row.line)).toContain(baseLine)
    expect(filterDesignModelingRowsByTab(workflowRows, 'designing').map((row) => row.line)).toContain(designing)
    expect(filterDesignModelingRowsByTab(workflowRows, 'pending_modeling').map((row) => row.line)).toContain(pendingModeling)
    expect(filterDesignModelingRowsByTab(workflowRows, 'modeling').map((row) => row.line)).toContain(modeling)
    expect(filterDesignModelingRowsByTab(workflowRows, 'completed').map((row) => row.line)).toContain(completed)
    expect(filterDesignModelingRowsByTab(workflowRows, 'revision').map((row) => row.line)).toEqual(expect.arrayContaining([designRevision, modelingRevision]))
  })
})
