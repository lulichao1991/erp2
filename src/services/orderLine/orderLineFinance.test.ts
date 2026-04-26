import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import { buildFinanceRows, calculateFinanceSummary, filterFinanceRowsByTab, getFinanceRiskLabels } from '@/services/orderLine/orderLineFinance'

describe('orderLineFinance', () => {
  const rows = buildFinanceRows(orderLinesMock, purchasesMock)

  it('builds finance rows from current purchases and order lines', () => {
    const pendant = rows.find((row) => row.line.id === 'oi-pendant-001')

    expect(pendant?.purchaseNo).toBe('PUR-202604-001')
    expect(pendant?.salesAmount).toBe(1280)
    expect(pendant?.factorySettlementAmount).toBe(540)
  })

  it('filters pending settlement, abnormal and confirmed rows', () => {
    expect(filterFinanceRowsByTab(rows, 'settlement').map((row) => row.line.id)).toContain('oi-pendant-001')
    expect(filterFinanceRowsByTab(rows, 'abnormal').map((row) => row.line.id)).toContain('ol-zhang-brooch-blocked-001')
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
})
