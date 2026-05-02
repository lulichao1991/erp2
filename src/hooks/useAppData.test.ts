import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import { replaceOrderLineInPurchases } from '@/hooks/useAppData'

describe('useAppData helpers', () => {
  it('replaces the same order line inside purchases when the global line changes', () => {
    const currentLine = orderLinesMock.find((line) => line.id === 'oi-ring-001')
    expect(currentLine).toBeTruthy()

    const nextLine = {
      ...currentLine!,
      productionInfo: {
        ...currentLine!.productionInfo,
        factoryNote: 'synced production feedback'
      }
    }

    const nextPurchases = replaceOrderLineInPurchases(purchasesMock, nextLine.id, nextLine)
    const embeddedLine = nextPurchases.flatMap((purchase) => purchase.orderLines).find((line) => line.id === nextLine.id)

    expect(embeddedLine?.productionInfo?.factoryNote).toBe('synced production feedback')
  })
})
