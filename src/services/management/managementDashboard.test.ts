import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import { buildManagementDashboardMetrics } from '@/services/management/managementDashboard'

describe('managementDashboard', () => {
  const metrics = buildManagementDashboardMetrics(purchasesMock, orderLinesMock, new Date('2026-04-26T09:00:00'))

  it('summarizes purchase and order-line business overview', () => {
    expect(metrics.businessOverview.monthPurchaseCount).toBe(1)
    expect(metrics.businessOverview.activePurchaseCount).toBe(1)
    expect(metrics.businessOverview.activeOrderLineCount).toBe(orderLinesMock.length)
    expect(metrics.businessOverview.readyToShipLineCount).toBe(0)
  })

  it('counts order-line workflow status distribution', () => {
    expect(metrics.statusDistribution.find((item) => item.status === 'pending_design')?.count).toBe(1)
    expect(metrics.statusDistribution.find((item) => item.status === 'pending_modeling')?.count).toBe(1)
    expect(metrics.statusDistribution.find((item) => item.status === 'pending_finance_confirmation')?.count).toBe(1)
  })

  it('summarizes production and finance risks', () => {
    expect(metrics.productionRisks.blockedCount).toBeGreaterThan(0)
    expect(metrics.productionRisks.designIncompleteCount).toBeGreaterThan(0)
    expect(metrics.productionRisks.modelingIncompleteCount).toBeGreaterThan(0)
    expect(metrics.financeOverview.pendingFactorySettlementCount).toBeGreaterThan(0)
    expect(metrics.financeOverview.financeAbnormalCount).toBeGreaterThan(0)
  })

  it('builds role workload and factory performance rows', () => {
    expect(metrics.roleWorkload.find((item) => item.role === '跟单待审核')?.count).toBe(1)
    expect(metrics.roleWorkload.find((item) => item.role === '财务待确认')?.count).toBeGreaterThan(0)
    expect(metrics.factoryPerformance.some((item) => item.factoryId === 'factory-suzhou-gold-001')).toBe(true)
  })
})
