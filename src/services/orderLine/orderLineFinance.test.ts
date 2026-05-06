import { describe, expect, it } from 'vitest'
import { financePaymentRecordsMock } from '@/mocks/finance-payment-records'
import { inventoryItemsMock, inventoryMovementsMock } from '@/mocks/inventory'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import { buildFinanceCostCard, buildFinanceRows, calculateFinancePaymentSummary, calculateFinanceSummary, filterFinanceRowsByTab, getFinanceRiskLabels, isFinanceLineLocked } from '@/services/orderLine/orderLineFinance'
import { confirmFinance, lockFinance, markFinanceAbnormal } from '@/services/orderLine/orderLineWorkflow'

describe('orderLineFinance', () => {
  const rows = buildFinanceRows(orderLinesMock, purchasesMock, financePaymentRecordsMock, inventoryItemsMock, inventoryMovementsMock)

  it('builds finance rows from current purchases and order lines', () => {
    const pendant = rows.find((row) => row.line.id === 'oi-pendant-001')

    expect(pendant?.purchaseNo).toBe('PUR-202604-001')
    expect(pendant?.salesAmount).toBe(1280)
    expect(pendant?.paidAmount).toBe(1280)
    expect(pendant?.pendingAmount).toBe(0)
    expect(pendant?.factorySettlementAmount).toBe(540)
  })

  it('calculates order-line payment summaries from finance records', () => {
    const necklace = orderLinesMock.find((line) => line.id === 'ol-zhang-necklace-001')!
    const summary = calculateFinancePaymentSummary(necklace, financePaymentRecordsMock)

    expect(summary.receivedAmount).toBe(1360)
    expect(summary.refundedAmount).toBe(0)
    expect(summary.paidAmount).toBe(1360)
    expect(summary.pendingAmount).toBe(1000)
    expect(summary.paymentStatusLabel).toBe('补退款待复核')
    expect(summary.pendingPaymentReviewCount).toBe(1)
  })

  it('calculates refund as negative net payment without losing gross received amount', () => {
    const ring = orderLinesMock.find((line) => line.id === 'oi-ring-001')!
    const summary = calculateFinancePaymentSummary(ring, financePaymentRecordsMock)

    expect(summary.receivedAmount).toBe(1220)
    expect(summary.refundedAmount).toBe(120)
    expect(summary.paidAmount).toBe(1100)
    expect(summary.pendingAmount).toBe(980)
    expect(summary.paymentStatusLabel).toBe('退款待补原因')
    expect(summary.paymentRiskLabels).toContain('退款原因未填写')
    expect(summary.pendingPaymentReviewCount).toBe(1)
  })

  it('clears payment review after adjustment records are reviewed', () => {
    const reviewedRecords = financePaymentRecordsMock.map((record) =>
      record.recordType === 'supplement' || record.recordType === 'refund'
        ? {
            ...record,
            reason: record.recordType === 'refund' ? record.reason || '退款原因已补齐。' : record.reason,
            reviewStatus: 'reviewed' as const,
            reviewedAt: '2026-04-25 18:00'
          }
        : record
    )
    const reviewedRows = buildFinanceRows(orderLinesMock, purchasesMock, reviewedRecords, inventoryItemsMock)
    const ringSummary = calculateFinancePaymentSummary(orderLinesMock.find((line) => line.id === 'oi-ring-001')!, reviewedRecords)

    expect(ringSummary.paymentStatusLabel).toBe('有退款')
    expect(ringSummary.paymentRiskLabels).toEqual([])
    expect(ringSummary.pendingPaymentReviewCount).toBe(0)
    expect(filterFinanceRowsByTab(reviewedRows, 'payment_review')).toEqual([])
    expect(filterFinanceRowsByTab(reviewedRows, 'abnormal').map((row) => row.line.id)).not.toContain('oi-ring-001')
  })

  it('builds cost card with old-gold offset and inventory link', () => {
    const necklace = orderLinesMock.find((line) => line.id === 'ol-zhang-necklace-001')!
    const costCard = buildFinanceCostCard(necklace, financePaymentRecordsMock, inventoryItemsMock)

    expect(costCard.oldGoldOffsetAmount).toBe(1000)
    expect(costCard.oldGoldValuationAmount).toBe(1000)
    expect(costCard.oldGoldRecognizedCostAmount).toBe(0)
    expect(costCard.oldGoldInventoryCodes).toEqual(['INV-OG-202604-005'])
    expect(costCard.totalCost).toBe(0)
    expect(costCard.estimatedGrossProfit).toBe(2360)
  })

  it('adds FIFO outbound inventory cost to the linked order-line cost card', () => {
    const pendant = orderLinesMock.find((line) => line.id === 'oi-pendant-001')!
    const costCard = buildFinanceCostCard(pendant, financePaymentRecordsMock, inventoryItemsMock, inventoryMovementsMock)

    expect(costCard.inventoryFifoCostAmount).toBe(120)
    expect(costCard.totalCost).toBe(980)
    expect(costCard.estimatedGrossProfit).toBe(300)
  })

  it('does not add reserve, release, adjust or scrap movements to the sales cost card', () => {
    const ring = orderLinesMock.find((line) => line.id === 'oi-ring-001')!
    const sidecarMovements = [
      {
        id: 'movement-reserve-sidecar',
        inventoryItemId: 'inventory-stock-chain-001',
        inventoryCode: 'INV-ST-202604-003',
        type: 'reserve' as const,
        quantity: 1,
        operatorName: '周库管',
        occurredAt: '2026-05-06 10:00',
        relatedOrderLineId: ring.id,
        fifoCostAmount: 999
      },
      {
        id: 'movement-release-sidecar',
        inventoryItemId: 'inventory-stock-chain-001',
        inventoryCode: 'INV-ST-202604-003',
        type: 'release' as const,
        quantity: 1,
        operatorName: '周库管',
        occurredAt: '2026-05-06 11:00',
        relatedOrderLineId: ring.id,
        fifoCostAmount: 999
      },
      {
        id: 'movement-adjust-sidecar',
        inventoryItemId: 'inventory-stock-chain-001',
        inventoryCode: 'INV-ST-202604-003',
        type: 'adjust' as const,
        quantity: 1,
        operatorName: '周库管',
        occurredAt: '2026-05-06 12:00',
        relatedOrderLineId: ring.id,
        fifoCostAmount: 999
      },
      {
        id: 'movement-scrap-sidecar',
        inventoryItemId: 'inventory-stock-chain-001',
        inventoryCode: 'INV-ST-202604-003',
        type: 'scrap' as const,
        quantity: 1,
        operatorName: '周库管',
        occurredAt: '2026-05-06 13:00',
        relatedOrderLineId: ring.id,
        fifoCostAmount: 999
      }
    ]
    const costCard = buildFinanceCostCard(ring, financePaymentRecordsMock, inventoryItemsMock, sidecarMovements)

    expect(costCard.inventoryFifoCostAmount).toBe(0)
  })

  it('does not treat old-gold payment records as FIFO cost until inventory outbound is linked', () => {
    const necklace = orderLinesMock.find((line) => line.id === 'ol-zhang-necklace-001')!
    const outboundOldGoldMovement = {
      id: 'movement-old-gold-outbound',
      inventoryItemId: 'inventory-old-gold-necklace-001',
      inventoryCode: 'INV-OG-202604-005',
      type: 'outbound' as const,
      quantity: 1,
      operatorName: '周库管',
      occurredAt: '2026-04-26 12:00',
      relatedOrderLineId: necklace.id,
      fifoCostAmount: 1000
    }
    const unlinkedCostCard = buildFinanceCostCard(necklace, financePaymentRecordsMock, inventoryItemsMock, inventoryMovementsMock)
    const linkedCostCard = buildFinanceCostCard(necklace, financePaymentRecordsMock, inventoryItemsMock, [...inventoryMovementsMock, outboundOldGoldMovement])

    expect(unlinkedCostCard.inventoryFifoCostAmount).toBe(0)
    expect(unlinkedCostCard.totalCost).toBe(0)
    expect(linkedCostCard.inventoryFifoCostAmount).toBe(1000)
    expect(linkedCostCard.totalCost).toBe(1000)
  })

  it('filters pending settlement, abnormal and confirmed rows', () => {
    const settlementRowIds = filterFinanceRowsByTab(rows, 'settlement').map((row) => row.line.id)

    expect(settlementRowIds).toContain('oi-pendant-001')
    expect(settlementRowIds).not.toContain('ol-zhang-completion-review-001')
    expect(filterFinanceRowsByTab(rows, 'balance').map((row) => row.line.id)).toContain('oi-ring-001')
    expect(filterFinanceRowsByTab(rows, 'payment_review').map((row) => row.line.id)).toEqual(expect.arrayContaining(['oi-ring-001', 'ol-zhang-necklace-001']))
    expect(filterFinanceRowsByTab(rows, 'abnormal').map((row) => row.line.id)).toEqual(expect.arrayContaining(['ol-zhang-brooch-blocked-001', 'oi-ring-001']))
    expect(
      filterFinanceRowsByTab(
        buildFinanceRows(
          [
            {
              ...orderLinesMock[1],
              financeStatus: 'confirmed',
              financeLocked: true
            }
          ],
          purchasesMock
        ),
        'confirmed'
      ).map((row) => row.line.id)
    ).toContain('oi-pendant-001')
  })

  it('marks confirmed or locked finance rows as read-only', () => {
    const pendingLine = orderLinesMock.find((line) => line.id === 'oi-pendant-001')!
    const confirmedLine = {
      ...pendingLine,
      financeStatus: 'confirmed' as const
    }
    const manuallyLockedLine = {
      ...pendingLine,
      financeLocked: true
    }
    const lockedRows = buildFinanceRows([confirmedLine, manuallyLockedLine], purchasesMock)

    expect(isFinanceLineLocked(pendingLine)).toBe(false)
    expect(isFinanceLineLocked(confirmedLine)).toBe(true)
    expect(isFinanceLineLocked(manuallyLockedLine)).toBe(true)
    expect(lockedRows.every((row) => row.isLocked)).toBe(true)
  })

  it('reports factory return risk labels', () => {
    const line = {
      ...orderLinesMock[1],
      productionData: {
        ...orderLinesMock[1].productionData,
        totalWeight: 2,
        netMetalWeight: 3
      }
    }

    expect(getFinanceRiskLabels(line)).toContain('净金重大于总重')
  })

  it('uses confirmed factory settlement amount in gross profit calculation', () => {
    const summary = calculateFinanceSummary({
      ...orderLinesMock[1],
      factorySettlementAmount: 560
    })

    expect(summary.estimatedGrossProfit).toBe(400)
    expect(summary.estimatedGrossProfitRate).toBe(31.3)
  })

  it('places v2 finance action results in confirmed and abnormal tabs', () => {
    const pendingLine = {
      ...orderLinesMock.find((line) => line.id === 'oi-pendant-001')!,
      lineStatus: 'pending_finance_confirmation' as const,
      financeStatus: 'pending' as const,
      financeLocked: false
    }
    const confirmed = confirmFinance(pendingLine, {
      factorySettlementAmount: 560,
      estimatedGrossProfit: 400,
      estimatedGrossProfitRate: 31.3,
      financeConfirmedAt: '2026-05-06 11:00',
      financeNote: '财务确认完成。'
    })
    const abnormal = markFinanceAbnormal(pendingLine, '尾款待核对')
    const locked = lockFinance(pendingLine, '手动锁定。')
    const financeRows = buildFinanceRows([confirmed, abnormal, locked], purchasesMock)

    expect(filterFinanceRowsByTab(financeRows, 'confirmed').map((row) => row.line)).toEqual(expect.arrayContaining([confirmed, locked]))
    expect(filterFinanceRowsByTab(financeRows, 'abnormal').map((row) => row.line)).toContain(abnormal)
    expect(financeRows.find((row) => row.line === confirmed)?.isLocked).toBe(true)
    expect(financeRows.find((row) => row.line === locked)?.isLocked).toBe(true)
    expect(financeRows.find((row) => row.line === abnormal)?.isLocked).toBe(false)
  })
})
