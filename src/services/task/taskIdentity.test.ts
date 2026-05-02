import { describe, expect, it } from 'vitest'
import { findPurchaseForTask, getTaskPurchaseId, getTaskPurchaseNo } from './taskIdentity'

describe('taskIdentity', () => {
  it('resolves the current purchase id', () => {
    expect(getTaskPurchaseId({ purchaseId: 'purchase-1' })).toBe('purchase-1')
    expect(getTaskPurchaseId({})).toBeUndefined()
  })

  it('resolves the current purchase number', () => {
    expect(getTaskPurchaseNo({ purchaseNo: 'PUR-1' })).toBe('PUR-1')
    expect(getTaskPurchaseNo({})).toBe('未关联购买记录')
    expect(getTaskPurchaseNo({}, '待关联')).toBe('待关联')
  })

  it('finds the linked purchase with purchaseId', () => {
    const purchases = [{ id: 'purchase-1' }, { id: 'purchase-2' }]

    expect(findPurchaseForTask({ purchaseId: 'purchase-2' }, purchases)).toEqual({ id: 'purchase-2' })
    expect(findPurchaseForTask({ purchaseId: 'purchase-3' }, purchases)).toBeUndefined()
  })
})
