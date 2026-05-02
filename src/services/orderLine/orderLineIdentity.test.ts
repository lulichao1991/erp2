import { describe, expect, it } from 'vitest'
import {
  findPurchaseForOrderLine,
  getOrderLineGoodsNo,
  getOrderLinePurchaseId,
  isOrderLineInPurchase,
  orderLineGoodsNoFallback
} from '@/services/orderLine/orderLineIdentity'

describe('orderLineIdentity', () => {
  it('uses productionTaskNo as the current goods number', () => {
    expect(getOrderLineGoodsNo({ productionTaskNo: 'SKU-CURRENT' })).toBe('SKU-CURRENT')
    expect(getOrderLineGoodsNo({})).toBe(orderLineGoodsNoFallback)
  })

  it('resolves ownership from purchaseId or purchase context', () => {
    expect(getOrderLinePurchaseId({ purchaseId: 'purchase-current' })).toBe('purchase-current')
    expect(getOrderLinePurchaseId({}, { id: 'purchase-from-context' })).toBe('purchase-from-context')
  })

  it('matches and finds purchases through current purchaseId', () => {
    const purchases = [{ id: 'purchase-current' }, { id: 'purchase-other' }]

    expect(isOrderLineInPurchase({ purchaseId: 'purchase-current' }, 'purchase-current')).toBe(true)
    expect(findPurchaseForOrderLine({ purchaseId: 'purchase-current' }, purchases)?.id).toBe('purchase-current')
  })
})
