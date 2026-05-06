import { describe, expect, it } from 'vitest'
import { customersMock, inventoryBatchesMock, inventoryItemsMock, mockProducts, orderLinesMock, purchasesMock } from '@/mocks'
import { applyInventoryMovement, applyInventoryReview, applyInventoryStocktake, buildInventoryLocationSummaries, buildInventoryOrderLineMovementSummary, buildInventoryRows, buildInventorySummary, filterInventoryRows, getInventoryAvailabilityStatus, getInventoryReservedQuantity, getInventoryReviewStatus, getInventoryWorkbenchBadges } from '@/services/inventory/inventorySelectors'

const buildRows = () =>
  buildInventoryRows({
    inventoryItems: inventoryItemsMock,
    products: mockProducts,
    purchases: purchasesMock,
    orderLines: orderLinesMock,
    customers: customersMock
  })

describe('inventorySelectors', () => {
  it('builds inventory rows with current workflow links', () => {
    const rows = buildRows()
    const returnRow = rows.find((row) => row.item.sourceType === 'customer_return')

    expect(returnRow?.sourceLabel).toBe('客户退货入库')
    expect(returnRow?.purchaseNo).toBe('PUR-202604-001')
    expect(returnRow?.orderLineGoodsNo).toBe('RING-SH-016')
    expect(returnRow?.customerName).toBe('张三')
    expect(returnRow?.linkedSummary).toContain('销售：RING-SH-016')

    const oldGoldRow = rows.find((row) => row.item.sourceType === 'old_gold')
    expect(oldGoldRow?.sourceLabel).toBe('旧金抵扣入库')
    expect(oldGoldRow?.orderLineGoodsNo).toBe('NECK-CUSTOM-042')
    expect(oldGoldRow?.item.sourcePaymentRecordId).toBe('finance-payment-necklace-old-gold-001')
    expect(oldGoldRow?.item.valuationAmount).toBe(1000)
  })

  it('summarizes design samples, returns and review-needed inventory', () => {
    const summary = buildInventorySummary(buildRows())

    expect(summary.skuCount).toBe(inventoryItemsMock.length)
    expect(summary.totalQuantity).toBe(8)
    expect(summary.availableQuantity).toBe(7)
    expect(summary.reservedQuantity).toBe(1)
    expect(summary.designSampleCount).toBe(1)
    expect(summary.customerReturnCount).toBe(1)
    expect(summary.oldGoldCount).toBe(1)
    expect(summary.needsReviewCount).toBe(1)
    expect(summary.lowStockCount).toBe(1)
  })

  it('summarizes inventory quantities by warehouse location', () => {
    const locationSummaries = buildInventoryLocationSummaries(buildRows())
    const returnLocation = locationSummaries.find((summary) => summary.location === 'B-退货待检-03')
    const stockLocation = locationSummaries.find((summary) => summary.location === 'C-常备链身-02')
    expect(returnLocation).toMatchObject({
      skuCount: 1,
      totalQuantity: 1,
      availableQuantity: 0,
      reservedQuantity: 1,
      needsReviewCount: 1
    })
    expect(stockLocation).toMatchObject({
      skuCount: 1,
      totalQuantity: 4,
      availableQuantity: 4,
      reservedQuantity: 0,
      needsReviewCount: 0
    })
  })

  it('filters inventory by source, status, condition, location and keyword', () => {
    const rows = buildRows()

    expect(filterInventoryRows(rows, { keyword: '', quickView: 'all', sourceType: 'design_sample', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'all', sourceType: 'old_gold', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'all', sourceType: 'all', status: 'reserved', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'all', sourceType: 'all', status: 'all', condition: 'repair_needed', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'all', sourceType: 'all', status: 'all', condition: 'all', location: '常备链身' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: 'PUR-202604-001', quickView: 'all', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(2)
    expect(filterInventoryRows(rows, { keyword: 'finance-payment-necklace-old-gold-001', quickView: 'all', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
  })

  it('filters inventory by warehouse quick views', () => {
    const rows = buildRows()

    expect(filterInventoryRows(rows, { keyword: '', quickView: 'design_samples', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'available', sourceType: 'all', status: 'all', condition: 'all', location: '' }).map((row) => row.item.inventoryCode)).toEqual(['INV-DS-202604-001', 'INV-ST-202604-003', 'INV-OG-202604-005', 'INV-OT-202604-004'])
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'customer_returns', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'old_gold', sourceType: 'all', status: 'all', condition: 'all', location: '' }).map((row) => row.item.inventoryCode)).toEqual(['INV-OG-202604-005'])
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'needs_review', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'reserved', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'pending_outbound', sourceType: 'all', status: 'all', condition: 'all', location: '' }).map((row) => row.item.inventoryCode)).toEqual(['INV-RT-202604-002'])
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'pending_stocktake', sourceType: 'all', status: 'all', condition: 'all', location: '' }).map((row) => row.item.inventoryCode)).toEqual(['INV-RT-202604-002'])
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'low_stock', sourceType: 'all', status: 'all', condition: 'all', location: '' }).map((row) => row.item.inventoryCode)).toEqual(['INV-OT-202604-004'])
    expect(filterInventoryRows(rows, { keyword: '', quickView: 'unavailable', sourceType: 'all', status: 'all', condition: 'all', location: '' })).toHaveLength(1)
  })

  it('calculates reserved quantity from total and available quantity', () => {
    const reservedItem = inventoryItemsMock.find((item) => item.status === 'reserved')
    expect(reservedItem).toBeDefined()

    expect(getInventoryReservedQuantity(reservedItem!)).toBe(1)
    expect(getInventoryReservedQuantity({ ...reservedItem!, availableQuantity: 2, quantity: 1 })).toBe(0)
  })

  it('classifies inventory availability, review status and workbench badges', () => {
    const rows = buildRows()
    const returnRow = rows.find((row) => row.item.id === 'inventory-return-ring-001')
    const stockRow = rows.find((row) => row.item.id === 'inventory-stock-chain-001')
    const stoneRow = rows.find((row) => row.item.id === 'inventory-other-stone-001')
    expect(returnRow).toBeDefined()
    expect(stockRow).toBeDefined()
    expect(stoneRow).toBeDefined()

    expect(getInventoryAvailabilityStatus(returnRow!.item)).toBe('reserved')
    expect(getInventoryReviewStatus(returnRow!.item)).toBe('needs_review')
    expect(getInventoryWorkbenchBadges(returnRow!)).toEqual(expect.arrayContaining(['已占用', '待质检', '待出库']))

    expect(getInventoryAvailabilityStatus(stockRow!.item)).toBe('available')
    expect(getInventoryReviewStatus(stockRow!.item)).toBe('clear')
    expect(getInventoryWorkbenchBadges(stockRow!)).toContain('可领用')

    expect(getInventoryWorkbenchBadges(stoneRow!)).toEqual(expect.arrayContaining(['可领用', '低库存']))
  })

  it('applies inventory movements without changing linked order lines', () => {
    const stockItem = inventoryItemsMock.find((item) => item.id === 'inventory-stock-chain-001')
    expect(stockItem).toBeDefined()

    const reserveResult = applyInventoryMovement(stockItem!, {
      type: 'reserve',
      quantity: 2,
      operatorName: '周库管',
      occurredAt: '2026-04-26 10:00',
      relatedOrderLineId: 'oi-ring-001',
      note: '为销售预占链身'
    })

    expect(reserveResult.item.quantity).toBe(4)
    expect(reserveResult.item.availableQuantity).toBe(2)
    expect(reserveResult.item.status).toBe('in_stock')
    expect(reserveResult.movement.type).toBe('reserve')
    expect(reserveResult.movement.fromStatus).toBe('in_stock')
    expect(reserveResult.movement.toStatus).toBe('in_stock')
    expect(reserveResult.movement.relatedOrderLineId).toBe('oi-ring-001')
    expect(reserveResult.movement.fifoCostAmount).toBeUndefined()
    expect(reserveResult.batches).toHaveLength(0)

    const outboundResult = applyInventoryMovement(
      reserveResult.item,
      {
        type: 'outbound',
        quantity: 3,
        operatorName: '周库管',
        occurredAt: '2026-04-26 11:00',
        note: '领用出库'
      },
      inventoryBatchesMock
    )

    expect(outboundResult.item.quantity).toBe(1)
    expect(outboundResult.item.availableQuantity).toBe(1)
    expect(outboundResult.item.status).toBe('in_stock')
    expect(outboundResult.movement.type).toBe('outbound')
    expect(outboundResult.movement.fifoCostAmount).toBe(360)
    expect(outboundResult.movement.fifoLayers).toEqual([
      {
        batchId: 'inventory-batch-stock-chain-001',
        quantity: 3,
        unitCostAmount: 120,
        costAmount: 360,
        receivedAt: '2026-04-20 09:30'
      }
    ])
    expect(outboundResult.batches.find((batch) => batch.id === 'inventory-batch-stock-chain-001')?.remainingQuantity).toBe(1)
  })

  it('consumes FIFO batches by received time and can span multiple batches', () => {
    const stockItem = {
      ...inventoryItemsMock.find((item) => item.id === 'inventory-stock-chain-001')!,
      quantity: 4,
      availableQuantity: 4
    }
    const batches = [
      {
        id: 'batch-late',
        inventoryItemId: stockItem.id,
        inventoryCode: stockItem.inventoryCode,
        receivedAt: '2026-04-21 10:00',
        quantity: 3,
        remainingQuantity: 3,
        unitCostAmount: 150,
        totalCostAmount: 450,
        sourceMovementId: 'movement-late'
      },
      {
        id: 'batch-early',
        inventoryItemId: stockItem.id,
        inventoryCode: stockItem.inventoryCode,
        receivedAt: '2026-04-20 10:00',
        quantity: 1,
        remainingQuantity: 1,
        unitCostAmount: 100,
        totalCostAmount: 100,
        sourceMovementId: 'movement-early'
      }
    ]

    const result = applyInventoryMovement(
      stockItem,
      {
        type: 'outbound',
        quantity: 2,
        operatorName: '周库管',
        occurredAt: '2026-04-26 11:00',
        relatedOrderLineId: 'oi-pendant-001',
        note: '领用出库'
      },
      batches
    )

    expect(result.movement.fifoCostAmount).toBe(250)
    expect(result.movement.fifoLayers).toEqual([
      { batchId: 'batch-early', quantity: 1, unitCostAmount: 100, costAmount: 100, receivedAt: '2026-04-20 10:00' },
      { batchId: 'batch-late', quantity: 1, unitCostAmount: 150, costAmount: 150, receivedAt: '2026-04-21 10:00' }
    ])
    expect(result.batches.find((batch) => batch.id === 'batch-early')?.remainingQuantity).toBe(0)
    expect(result.batches.find((batch) => batch.id === 'batch-late')?.remainingQuantity).toBe(2)
  })

  it('summarizes inventory movements linked to order lines', () => {
    const movements = [
      {
        id: 'movement-reserve',
        inventoryItemId: 'inventory-stock-chain-001',
        inventoryCode: 'INV-ST-202604-003',
        type: 'reserve' as const,
        quantity: 2,
        operatorName: '周库管',
        occurredAt: '2026-04-26 10:00',
        relatedOrderLineId: 'oi-ring-001'
      },
      {
        id: 'movement-outbound',
        inventoryItemId: 'inventory-stock-chain-001',
        inventoryCode: 'INV-ST-202604-003',
        type: 'outbound' as const,
        quantity: 1,
        operatorName: '周库管',
        occurredAt: '2026-04-26 11:00',
        relatedOrderLineId: 'oi-ring-001',
        fifoCostAmount: 120
      },
      {
        id: 'movement-release',
        inventoryItemId: 'inventory-stock-chain-001',
        inventoryCode: 'INV-ST-202604-003',
        type: 'release' as const,
        quantity: 1,
        operatorName: '周库管',
        occurredAt: '2026-04-26 12:00',
        relatedOrderLineId: 'oi-ring-001',
        fifoCostAmount: 999
      },
      {
        id: 'movement-adjust',
        inventoryItemId: 'inventory-stock-chain-001',
        inventoryCode: 'INV-ST-202604-003',
        type: 'adjust' as const,
        quantity: 1,
        operatorName: '周库管',
        occurredAt: '2026-04-26 13:00',
        relatedOrderLineId: 'oi-ring-001',
        fifoCostAmount: 999
      },
      {
        id: 'movement-scrap',
        inventoryItemId: 'inventory-stock-chain-001',
        inventoryCode: 'INV-ST-202604-003',
        type: 'scrap' as const,
        quantity: 1,
        operatorName: '周库管',
        occurredAt: '2026-04-26 14:00',
        relatedOrderLineId: 'oi-ring-001',
        fifoCostAmount: 999
      }
    ]

    const [summary] = buildInventoryOrderLineMovementSummary(movements, orderLinesMock)

    expect(summary.orderLineDisplay).toBe('RING-SH-016 / 山形素圈戒指')
    expect(summary.reserveQuantity).toBe(2)
    expect(summary.releaseQuantity).toBe(1)
    expect(summary.outboundQuantity).toBe(1)
    expect(summary.fifoCostAmount).toBe(120)
    expect(summary.movementCount).toBe(5)
    expect(summary.latestOccurredAt).toBe('2026-04-26 14:00')
  })

  it('rejects invalid movement quantities', () => {
    const stockItem = inventoryItemsMock.find((item) => item.id === 'inventory-design-sample-ring-001')
    expect(stockItem).toBeDefined()

    expect(() =>
      applyInventoryMovement(stockItem!, {
        type: 'reserve',
        quantity: 2,
        operatorName: '周库管',
        occurredAt: '2026-04-26 10:00'
      })
    ).toThrow('占用数量不能大于可用数量')

    expect(() =>
      applyInventoryMovement(stockItem!, {
        type: 'outbound',
        quantity: 0,
        operatorName: '周库管',
        occurredAt: '2026-04-26 10:00'
      })
    ).toThrow('库存流转数量必须大于 0')

    expect(() =>
      applyInventoryMovement(
        { ...stockItem!, quantity: 2, availableQuantity: 2 },
        {
          type: 'outbound',
          quantity: 2,
          operatorName: '周库管',
          occurredAt: '2026-04-26 10:00'
        },
        [
          {
            id: 'batch-short',
            inventoryItemId: stockItem!.id,
            inventoryCode: stockItem!.inventoryCode,
            receivedAt: '2026-04-20 10:00',
            quantity: 1,
            remainingQuantity: 1,
            unitCostAmount: 100,
            totalCostAmount: 100,
            sourceMovementId: 'movement-short'
          }
        ]
      )
    ).toThrow('FIFO 批次数量不足，不能出库')
  })

  it('applies warehouse quality review without changing linked order lines', () => {
    const returnItem = inventoryItemsMock.find((item) => item.id === 'inventory-return-ring-001')
    expect(returnItem).toBeDefined()

    const result = applyInventoryReview(returnItem!, {
      condition: 'returned',
      status: 'in_stock',
      availableQuantity: 1,
      operatorName: '周库管',
      occurredAt: '2026-04-26 12:00',
      toLocation: 'B-退货可用-01',
      note: '质检通过，可作为库存资产再次使用。'
    })

    expect(result.item.condition).toBe('returned')
    expect(result.item.status).toBe('in_stock')
    expect(result.item.availableQuantity).toBe(1)
    expect(result.item.warehouseLocation).toBe('B-退货可用-01')
    expect(result.item.orderLineId).toBe(returnItem?.orderLineId)
    expect(result.movement.type).toBe('adjust')
    expect(result.movement.relatedOrderLineId).toBe(returnItem?.orderLineId)
    expect(result.movement.note).toBe('质检通过，可作为库存资产再次使用。')
  })

  it('rejects quality review available quantity above stock quantity', () => {
    const returnItem = inventoryItemsMock.find((item) => item.id === 'inventory-return-ring-001')
    expect(returnItem).toBeDefined()

    expect(() =>
      applyInventoryReview(returnItem!, {
        condition: 'returned',
        status: 'in_stock',
        availableQuantity: 2,
        operatorName: '周库管',
        occurredAt: '2026-04-26 12:00'
      })
    ).toThrow('可用数量不能大于库存数量')
  })

  it('applies stocktaking as an inventory adjustment movement', () => {
    const stockItem = inventoryItemsMock.find((item) => item.id === 'inventory-stock-chain-001')
    expect(stockItem).toBeDefined()

    const result = applyInventoryStocktake(stockItem!, {
      countedQuantity: 4,
      countedAvailableQuantity: 3,
      operatorName: '周库管',
      occurredAt: '2026-04-26 15:00',
      toLocation: 'C-常备库存-02',
      reason: '盘亏 1 件',
      note: '月度盘点'
    })

    expect(result.item.quantity).toBe(4)
    expect(result.item.availableQuantity).toBe(3)
    expect(result.item.warehouseLocation).toBe('C-常备库存-02')
    expect(result.item.orderLineId).toBe(stockItem?.orderLineId)
    expect(result.movement.type).toBe('adjust')
    expect(result.movement.quantity).toBe(1)
    expect(result.movement.note).toContain('盘点调整：总数 4→4，可用 4→3')
    expect(result.movement.note).toContain('原因：盘亏 1 件')
    expect(result.movement.note).toContain('月度盘点')
  })

  it('rejects invalid stocktaking quantities', () => {
    const stockItem = inventoryItemsMock.find((item) => item.id === 'inventory-stock-chain-001')
    expect(stockItem).toBeDefined()

    expect(() =>
      applyInventoryStocktake(stockItem!, {
        countedQuantity: 1,
        countedAvailableQuantity: 2,
        operatorName: '周库管',
        occurredAt: '2026-04-26 15:00'
      })
    ).toThrow('实盘可用数不能大于实盘总数')

    expect(() =>
      applyInventoryStocktake(stockItem!, {
        countedQuantity: -1,
        countedAvailableQuantity: 0,
        operatorName: '周库管',
        occurredAt: '2026-04-26 15:00'
      })
    ).toThrow('盘点数量不能为负数')
  })
})
