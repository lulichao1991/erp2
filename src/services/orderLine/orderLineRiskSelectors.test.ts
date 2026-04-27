import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import {
  getFinanceRiskStatus,
  getOrderLineCompleteness,
  getOrderLineRisks,
  getProductionDelayStatus,
  getRoleTaskBadges
} from '@/services/orderLine/orderLineRiskSelectors'
import type { OrderLine } from '@/types/order-line'

describe('orderLineRiskSelectors', () => {
  const referenceDate = new Date('2026-04-26T09:00:00')

  it('reports customer-service completeness from current OrderLine fields', () => {
    const incompleteLine = {
      ...orderLinesMock[0],
      selectedMaterial: '',
      selectedProcess: '',
      actualRequirements: {
        ...orderLinesMock[0].actualRequirements,
        material: '',
        process: ''
      },
      productionTaskNo: '',
      skuCode: '',
      itemSku: ''
    }

    const completeness = getOrderLineCompleteness(incompleteLine)

    expect(completeness.complete).toBe(false)
    expect(completeness.missingLabels).toEqual(['材质', '工艺要求', '货号'])
  })

  it('detects production overdue and blocked risks', () => {
    const blockedLine = orderLinesMock.find((line) => line.id === 'ol-zhang-brooch-blocked-001')!

    expect(getProductionDelayStatus(blockedLine, referenceDate, blockedLine.factoryPlannedDueDate)).toEqual(
      expect.objectContaining({
        status: 'overdue',
        overdue: true,
        variant: 'overdue'
      })
    )
    expect(getOrderLineRisks(blockedLine, { referenceDate, dueDate: blockedLine.factoryPlannedDueDate }).map((risk) => risk.label)).toEqual(
      expect.arrayContaining(['已超时', '生产阻塞', '工厂异常'])
    )
  })

  it('detects factory return and finance risks', () => {
    const returnedLine: OrderLine = {
      ...orderLinesMock[1],
      lineStatus: 'factory_returned',
      factoryStatus: 'returned',
      financeStatus: 'pending',
      lineSalesAmount: 0,
      factorySettlementAmount: 0,
      productionData: {
        totalWeight: 2,
        netMetalWeight: 3,
        actualMaterial: ''
      }
    }

    expect(getFinanceRiskStatus(returnedLine).labels).toEqual(
      expect.arrayContaining(['材质为空', '净金重大于总重', '工厂结算金额为空', '工费为空', '销售金额为空'])
    )
  })

  it('detects missing factory returned weight', () => {
    const returnedLine = {
      ...orderLinesMock[1],
      lineStatus: 'factory_returned',
      factoryStatus: 'returned',
      productionData: {
        actualMaterial: '足银'
      }
    }

    expect(getFinanceRiskStatus(returnedLine).labels).toContain('工厂未回传重量')
  })

  it('builds role task badges from current OrderLine state', () => {
    const merchandiserBadges = getRoleTaskBadges(orderLinesMock, 'merchandiser')
    const financeBadges = getRoleTaskBadges(orderLinesMock, 'finance')
    const managerBadges = getRoleTaskBadges(orderLinesMock, 'manager')

    expect(merchandiserBadges.find((badge) => badge.label === '待跟单审核')?.count).toBe(1)
    expect(financeBadges.find((badge) => badge.label === '财务待处理')?.count).toBeGreaterThan(0)
    expect(managerBadges.find((badge) => badge.label === '风险销售')?.count).toBeGreaterThan(0)
  })
})
