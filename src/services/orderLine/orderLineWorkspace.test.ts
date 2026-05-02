import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import { applyOrderLineDesignModelingDraft, buildOrderLineRowsFromData } from '@/services/orderLine/orderLineWorkspace'

describe('orderLineWorkspace', () => {
  it('builds rows from current order lines instead of embedded purchase copies', () => {
    const currentLines = orderLinesMock.map((line) =>
      line.id === 'oi-ring-001'
        ? {
            ...line,
            productionInfo: {
              ...line.productionInfo,
              factoryNote: 'current app data note'
            }
          }
        : line
    )

    const rows = buildOrderLineRowsFromData(currentLines, purchasesMock)
    const ringRow = rows.find((row) => row.line.id === 'oi-ring-001')

    expect(ringRow?.line.productionInfo?.factoryNote).toBe('current app data note')
    expect(ringRow?.purchase?.purchaseNo).toBe('PUR-202604-001')
  })

  it('keeps customization fields untouched when saving design-modeling draft', () => {
    const line = orderLinesMock.find((item) => item.id === 'oi-ring-001')
    expect(line).toBeTruthy()

    const nextLine = applyOrderLineDesignModelingDraft(line!, {
      designStatus: 'revision_requested',
      modelingStatus: 'completed',
      assignedDesignerId: 'designer-new',
      assignedModelerId: 'modeler-new',
      assignedDesignerName: '新设计',
      modelingFiles: [{ id: 'model-file-1', name: 'ring-model.stl', url: 'mock-upload:ring-model.stl' }],
      waxFiles: [{ id: 'wax-file-1', name: 'ring-wax.stl', url: 'mock-upload:ring-wax.stl' }],
      designNote: '仅更新设计建模信息'
    })

    expect(nextLine.selectedSpecValue).toBe(line!.selectedSpecValue)
    expect(nextLine.selectedMaterial).toBe(line!.selectedMaterial)
    expect(nextLine.selectedProcess).toBe(line!.selectedProcess)
    expect(nextLine.actualRequirements?.remark).toBe(line!.actualRequirements?.remark)
    expect(nextLine.designStatus).toBe('revision_requested')
    expect(nextLine.modelingFiles?.[0]?.name).toBe('ring-model.stl')
  })
})
