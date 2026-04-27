import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import {
  buildOrderLineCompletenessInput,
  getCustomerServiceNextLineStatus,
  getOrderLineCompleteness
} from '@/services/orderLine/orderLineCustomerService'

describe('orderLineCustomerService', () => {
  it('reports missing customer-service fields', () => {
    const result = getOrderLineCompleteness({
      productName: '定制戒指',
      category: 'ring',
      material: '',
      size: '16号',
      craftRequirements: '',
      productionTaskNo: ''
    })

    expect(result.complete).toBe(false)
    expect(result.missingLabels).toEqual(['材质', '工艺要求', '货号'])
    expect(result.summary).toBe('缺失：材质、工艺要求、货号')
  })

  it('builds completeness input from current OrderLine fields', () => {
    const line = orderLinesMock.find((item) => item.id === 'oi-ring-001')

    expect(line).toBeTruthy()
    expect(getOrderLineCompleteness(buildOrderLineCompletenessInput(line!))).toEqual(
      expect.objectContaining({
        complete: true,
        completed: 8,
        total: 8,
        summary: '资料完整'
      })
    )
  })

  it('requires engraving reference image and PLT files when engraving is needed', () => {
    const result = getOrderLineCompleteness({
      productName: '定制戒指',
      category: 'ring',
      material: '18K金',
      size: '16号',
      craftRequirements: '微镶',
      productionTaskNo: 'RING-SH-016',
      needsEngraving: true,
      engraveImageFiles: [],
      engravePltFiles: []
    })

    expect(result.complete).toBe(false)
    expect(result.completed).toBe(6)
    expect(result.total).toBe(8)
    expect(result.missingLabels).toEqual(['刻字参考图', '刻字 PLT 文件'])
  })

  it('routes confirmed customer-service lines by design and modeling needs', () => {
    expect(getCustomerServiceNextLineStatus({ requiresDesign: true, requiresModeling: false })).toBe('pending_design')
    expect(getCustomerServiceNextLineStatus({ requiresDesign: false, requiresModeling: true })).toBe('pending_modeling')
    expect(getCustomerServiceNextLineStatus({ requiresDesign: false, requiresModeling: false })).toBe('pending_merchandiser_review')
  })
})
