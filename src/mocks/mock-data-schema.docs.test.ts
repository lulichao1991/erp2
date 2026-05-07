import { describe, expect, it } from 'vitest'
import { customersMock } from '@/mocks/customers'
import { financePaymentRecordsMock } from '@/mocks/finance-payment-records'
import { inventoryBatchesMock, inventoryItemsMock, inventoryMovementsMock } from '@/mocks/inventory'
import { orderLinesMock } from '@/mocks/order-lines'
import { mockProducts } from '@/mocks/products'
import { purchasesMock } from '@/mocks/purchases'
import { afterSalesMock, logisticsMock } from '@/mocks/supporting-records'
import { mockTasks } from '@/mocks/tasks'
import mockDataSchemaDocs from '../../docs/frontend/mock-data-schema.md?raw'

const mockFileModules = import.meta.glob('./*.ts', {
  eager: true,
  import: 'default',
  query: '?raw'
})

const extractRuntimeMockFiles = () =>
  Object.keys(mockFileModules)
    .map((path) => path.replace('./', ''))
    .filter((file) => file !== 'index.ts' && !file.endsWith('.test.ts'))
    .sort()

const extractDocumentedMockFiles = () => {
  const mockFilesBlock = mockDataSchemaDocs.match(/## \d+\. 当前 mock 文件建议[\s\S]*?```text\nsrc\/mocks\/\n([\s\S]*?)\n```/)

  expect(mockFilesBlock?.[1]).toBeTruthy()

  return mockFilesBlock![1]
    .split('\n')
    .map((line) => line.trim().replace(/\s+#.*$/, ''))
    .filter(Boolean)
    .sort()
}

describe('mock data schema documentation', () => {
  it('keeps the documented mock data files aligned with src/mocks', () => {
    expect(extractDocumentedMockFiles()).toEqual(extractRuntimeMockFiles())
  })

  it('keeps current mock relationship labels aligned with linked records', () => {
    expect(customersMock.length).toBeGreaterThanOrEqual(4)
    expect(purchasesMock.length).toBeGreaterThanOrEqual(5)
    expect(orderLinesMock.length).toBeGreaterThanOrEqual(13)

    purchasesMock.forEach((purchase) => {
      const linkedCustomer = customersMock.find((customer) => customer.id === purchase.customerId)
      const purchaseLines = orderLinesMock.filter((line) => line.purchaseId === purchase.id)

      expect(linkedCustomer, `${purchase.id} customer`).toBeTruthy()
      expect(purchase.orderLineCount).toBe(purchaseLines.length)
      expect(purchase.orderLines.map((line) => line.id).sort()).toEqual(purchaseLines.map((line) => line.id).sort())
      purchase.orderLines.forEach((line) => {
        expect(line.purchaseId).toBe(purchase.id)
        expect(line.customerId || purchase.customerId).toBe(purchase.customerId)
      })
    })

    const fullCustomPurchase = purchasesMock.find((purchase) => purchase.purchaseType === 'full_custom')
    const fullCustomLines = orderLinesMock.filter((line) => line.purchaseId === fullCustomPurchase?.id)

    expect(fullCustomPurchase).toBeTruthy()
    expect(fullCustomLines.length).toBeGreaterThanOrEqual(2)
    expect(fullCustomLines.every((line) => !line.productId && !line.sourceProduct)).toBe(true)
    expect(fullCustomLines.map((line) => line.lineStatus)).toEqual(expect.arrayContaining(['pending_design', 'pending_modeling']))

    const spotPurchase = purchasesMock.find((purchase) => purchase.purchaseType === 'spot_goods')
    const spotLine = orderLinesMock.find((line) => line.purchaseId === spotPurchase?.id)

    expect(spotPurchase).toBeTruthy()
    expect(spotLine).toBeTruthy()
    expect(spotLine?.financeStatus).toBe('confirmed')
    expect(inventoryItemsMock.some((item) => item.purchaseId === spotPurchase?.id && item.orderLineId === spotLine?.id)).toBe(true)
    expect(inventoryMovementsMock.some((movement) => movement.relatedOrderLineId === spotLine?.id && movement.type === 'reserve')).toBe(true)
    expect(inventoryMovementsMock.some((movement) => movement.relatedOrderLineId === spotLine?.id && movement.type === 'outbound')).toBe(true)
    expect(financePaymentRecordsMock.some((record) => record.purchaseId === spotPurchase?.id && record.orderLineId === spotLine?.id)).toBe(true)
    expect(logisticsMock.some((record) => record.purchaseId === spotPurchase?.id && record.orderLineId === spotLine?.id)).toBe(true)

    const internalPurchase = purchasesMock.find((purchase) => purchase.purchaseType === 'internal')
    const internalLines = orderLinesMock.filter((line) => line.purchaseId === internalPurchase?.id)

    expect(internalPurchase).toBeTruthy()
    expect(internalLines.map((line) => line.lineStatus)).toContain('completed')
    expect(internalPurchase?.finance?.depositStatus).toBe('not_required')

    const cancelledPurchase = purchasesMock.find((purchase) => purchase.aggregateStatus === 'cancelled')

    expect(cancelledPurchase).toBeTruthy()
    expect(cancelledPurchase?.orderLineCount).toBe(0)
    expect(cancelledPurchase?.orderLines).toEqual([])

    expect(orderLinesMock.some((line) => line.financeStatus === 'abnormal' && Boolean(line.financeAbnormalReason))).toBe(true)
    expect(inventoryItemsMock.some((item) => item.status === 'scrapped')).toBe(true)
    expect(inventoryMovementsMock.some((movement) => movement.type === 'scrap')).toBe(true)
    expect([...new Set(logisticsMock.map((record) => record.logisticsType))]).toEqual(expect.arrayContaining(['measurement_tool', 'goods', 'after_sales', 'other']))

    mockTasks.forEach((task) => {
      const purchase = purchasesMock.find((item) => item.id === task.purchaseId)
      const orderLine = orderLinesMock.find((item) => item.id === task.orderLineId)

      expect(purchase, `${task.id} purchase`).toBeTruthy()
      expect(orderLine, `${task.id} orderLine`).toBeTruthy()
      if (purchase) {
        expect(task.purchaseNo).toBe(purchase.purchaseNo)
      }
      if (orderLine) {
        expect(task.orderLineName).toBe(orderLine.name)
      }
    })

    mockProducts.flatMap((product) => product.referenceRecords).forEach((record) => {
      const purchase = purchasesMock.find((item) => item.id === record.purchaseId)
      const orderLine = orderLinesMock.find((item) => item.id === record.orderLineId)
      const customer = customersMock.find((item) => item.id === orderLine?.customerId)

      expect(purchase, `${record.id} purchase`).toBeTruthy()
      expect(orderLine, `${record.id} orderLine`).toBeTruthy()
      expect(customer, `${record.id} customer`).toBeTruthy()
      if (purchase) {
        expect(record.purchaseNo).toBe(purchase.purchaseNo)
      }
      if (orderLine) {
        expect(record.orderLineGoodsNo).toBe(orderLine.productionTaskNo)
        expect(record.orderLineName).toBe(orderLine.name)
      }
      if (customer) {
        expect(record.customerId).toBe(customer.id)
        expect(record.customerName).toBe(customer.name)
      }
    })

    inventoryItemsMock.forEach((item) => {
      if (item.purchaseId) {
        expect(purchasesMock.some((purchase) => purchase.id === item.purchaseId), `${item.id} purchase`).toBe(true)
      }
      if (item.orderLineId) {
        expect(orderLinesMock.some((line) => line.id === item.orderLineId), `${item.id} orderLine`).toBe(true)
      }
      if (item.customerId) {
        expect(customersMock.some((customer) => customer.id === item.customerId), `${item.id} customer`).toBe(true)
      }
      if (item.sourcePaymentRecordId) {
        expect(financePaymentRecordsMock.some((record) => record.id === item.sourcePaymentRecordId), `${item.id} source payment`).toBe(true)
      }
    })

    inventoryMovementsMock.forEach((movement) => {
      expect(inventoryItemsMock.some((item) => item.id === movement.inventoryItemId), `${movement.id} inventory item`).toBe(true)
      if (movement.relatedOrderLineId) {
        expect(orderLinesMock.some((line) => line.id === movement.relatedOrderLineId), `${movement.id} orderLine`).toBe(true)
      }
      movement.fifoLayers?.forEach((layer) => {
        expect(inventoryBatchesMock.some((batch) => batch.id === layer.batchId), `${movement.id} fifo batch`).toBe(true)
      })
    })

    inventoryBatchesMock.forEach((batch) => {
      expect(inventoryItemsMock.some((item) => item.id === batch.inventoryItemId), `${batch.id} inventory item`).toBe(true)
      expect(inventoryMovementsMock.some((movement) => movement.id === batch.sourceMovementId), `${batch.id} source movement`).toBe(true)
    })

    financePaymentRecordsMock.forEach((record) => {
      expect(orderLinesMock.some((line) => line.id === record.orderLineId), `${record.id} orderLine`).toBe(true)
      if (record.purchaseId) {
        expect(purchasesMock.some((purchase) => purchase.id === record.purchaseId), `${record.id} purchase`).toBe(true)
      }
      if (record.inventoryItemId) {
        expect(inventoryItemsMock.some((item) => item.id === record.inventoryItemId), `${record.id} inventory item`).toBe(true)
      }
    })

    ;[...logisticsMock, ...afterSalesMock].forEach((record) => {
      expect(orderLinesMock.some((line) => line.id === record.orderLineId), `${record.id} orderLine`).toBe(true)
      if (record.purchaseId) {
        expect(purchasesMock.some((purchase) => purchase.id === record.purchaseId), `${record.id} purchase`).toBe(true)
      }
      if ('customerId' in record && record.customerId) {
        expect(customersMock.some((customer) => customer.id === record.customerId), `${record.id} customer`).toBe(true)
      }
    })
  })
})
