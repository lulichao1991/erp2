import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import { attachOrderLinesToPurchase, replaceOrderLineInPurchases } from '@/hooks/useAppData'

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

  it('attaches newly created order lines to a purchase snapshot for mock persistence', () => {
    const purchase = {
      ...purchasesMock[0],
      id: 'purchase-pur-202604-new',
      purchaseNo: 'PUR-202604-NEW',
      orderLineCount: 0,
      orderLines: []
    }
    const orderLines = orderLinesMock.slice(0, 2).map((line, index) => ({
      ...line,
      id: `order-line-new-${index + 1}`,
      purchaseId: purchase.id
    }))

    const nextPurchase = attachOrderLinesToPurchase(purchase, orderLines)

    expect(nextPurchase.orderLineCount).toBe(2)
    expect(nextPurchase.orderLines.map((line) => line.purchaseId)).toEqual([purchase.id, purchase.id])
    expect(nextPurchase.latestActivityAt).toBeTruthy()
  })
})
