import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import { buildManagementDashboardMetrics } from '@/services/management/managementDashboard'
import { getOrderLineLineStatus } from '@/services/orderLine/orderLineWorkflow'
import type { OrderLineLineStatus } from '@/types/order-line'

describe('managementDashboard', () => {
  const metrics = buildManagementDashboardMetrics(purchasesMock, orderLinesMock, new Date('2026-04-26T09:00:00'))
  const countStatus = (status: OrderLineLineStatus) => orderLinesMock.filter((line) => getOrderLineLineStatus(line) === status).length
  const activePurchaseStatuses = new Set(['draft', 'in_progress', 'partially_shipped', 'after_sales', 'exception'])
  const activeLineStatuses = new Set<OrderLineLineStatus>([
    'draft',
    'pending_customer_confirmation',
    'pending_design',
    'pending_modeling',
    'pending_merchandiser_review',
    'pending_factory_production',
    'in_production',
    'factory_returned',
    'pending_finance_confirmation',
    'ready_to_ship',
    'after_sales'
  ])

  it('summarizes purchase and order-line business overview', () => {
    expect(metrics.businessOverview.monthPurchaseCount).toBe(purchasesMock.filter((purchase) => (purchase.paymentAt || purchase.latestActivityAt)?.startsWith('2026-04')).length)
    expect(metrics.businessOverview.activePurchaseCount).toBe(purchasesMock.filter((purchase) => activePurchaseStatuses.has(purchase.aggregateStatus)).length)
    expect(metrics.businessOverview.activeOrderLineCount).toBe(orderLinesMock.filter((line) => activeLineStatuses.has(getOrderLineLineStatus(line))).length)
    expect(metrics.businessOverview.readyToShipLineCount).toBe(countStatus('ready_to_ship'))
  })

  it('counts order-line workflow status distribution', () => {
    expect(metrics.statusDistribution.find((item) => item.status === 'pending_design')?.count).toBe(countStatus('pending_design'))
    expect(metrics.statusDistribution.find((item) => item.status === 'pending_modeling')?.count).toBe(countStatus('pending_modeling'))
    expect(metrics.statusDistribution.find((item) => item.status === 'pending_finance_confirmation')?.count).toBe(countStatus('pending_finance_confirmation'))
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
