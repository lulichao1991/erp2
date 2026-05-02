import { calculateFinanceSummary, getLineSalesAmount } from '@/services/orderLine/orderLineFinance'
import { getFinanceRiskStatus, getOrderLineCompleteness, getProductionDelayStatus } from '@/services/orderLine/orderLineRiskSelectors'
import {
  getOrderLineDesignStatus,
  getOrderLineFactoryStatus,
  getOrderLineFinanceStatus,
  getOrderLineLineStatus,
  getOrderLineModelingStatus,
  getOrderLineProductionStatus,
  orderLineLineStatusLabelMap
} from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine, OrderLineLineStatus } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'

type ManagementDashboardMetrics = {
  businessOverview: {
    todayPurchaseCount: number
    monthPurchaseCount: number
    activePurchaseCount: number
    activeOrderLineCount: number
    readyToShipLineCount: number
    completedLineCount: number
    afterSalesLineCount: number
  }
  statusDistribution: Array<{
    status: OrderLineLineStatus
    label: string
    count: number
  }>
  productionRisks: {
    overdueCount: number
    dueSoonCount: number
    blockedCount: number
    pendingFactoryReturnCount: number
    designIncompleteCount: number
    modelingIncompleteCount: number
    incompleteInfoCount: number
  }
  financeOverview: {
    monthlySalesAmount: number
    confirmedDepositAmount: number
    pendingBalanceAmount: number
    pendingFactorySettlementCount: number
    financeAbnormalCount: number
    estimatedGrossProfit: number
    estimatedGrossProfitRate: number
  }
  roleWorkload: Array<{
    role: string
    count: number
  }>
  factoryPerformance: Array<{
    factoryId: string
    taskCount: number
    inProductionCount: number
    completedCount: number
    overdueCount: number
    abnormalCount: number
    averageCycleDays?: number
  }>
}

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

const parseDate = (value?: string) => {
  if (!value) {
    return undefined
  }

  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'))
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const isSameDay = (left?: string, right = new Date()) => {
  const parsed = parseDate(left)
  if (!parsed) {
    return false
  }

  return parsed.getFullYear() === right.getFullYear() && parsed.getMonth() === right.getMonth() && parsed.getDate() === right.getDate()
}

const isSameMonth = (left?: string, right = new Date()) => {
  const parsed = parseDate(left)
  if (!parsed) {
    return false
  }

  return parsed.getFullYear() === right.getFullYear() && parsed.getMonth() === right.getMonth()
}

const getCycleDays = (line: OrderLine) => {
  const startedAt = parseDate(line.productionSentAt)
  const completedAt = parseDate(line.productionCompletedAt || line.productionData?.completedAt)
  if (!startedAt || !completedAt) {
    return undefined
  }

  return Math.max(1, Math.round((completedAt.getTime() - startedAt.getTime()) / 86_400_000))
}

export const buildManagementDashboardMetrics = (
  purchases: Purchase[],
  orderLines: OrderLine[],
  referenceDate = new Date()
): ManagementDashboardMetrics => {
  const statusDistribution = (Object.keys(orderLineLineStatusLabelMap) as OrderLineLineStatus[]).map((status) => ({
    status,
    label: orderLineLineStatusLabelMap[status],
    count: orderLines.filter((line) => getOrderLineLineStatus(line) === status).length
  }))

  const financeSummaries = orderLines.map((line) => calculateFinanceSummary(line))
  const totalSalesAmount = orderLines.reduce((sum, line) => sum + getLineSalesAmount(line), 0)
  const totalGrossProfit = financeSummaries.reduce((sum, item) => sum + item.estimatedGrossProfit, 0)
  const factoryGroups = new Map<string, OrderLine[]>()

  orderLines.forEach((line) => {
    const factoryId = line.factoryId || '未分配工厂'
    factoryGroups.set(factoryId, [...(factoryGroups.get(factoryId) || []), line])
  })

  return {
    businessOverview: {
      todayPurchaseCount: purchases.filter((purchase) => isSameDay(purchase.paymentAt || purchase.latestActivityAt, referenceDate)).length,
      monthPurchaseCount: purchases.filter((purchase) => isSameMonth(purchase.paymentAt || purchase.latestActivityAt, referenceDate)).length,
      activePurchaseCount: purchases.filter((purchase) => activePurchaseStatuses.has(purchase.aggregateStatus)).length,
      activeOrderLineCount: orderLines.filter((line) => activeLineStatuses.has(getOrderLineLineStatus(line))).length,
      readyToShipLineCount: orderLines.filter((line) => getOrderLineLineStatus(line) === 'ready_to_ship').length,
      completedLineCount: orderLines.filter((line) => getOrderLineLineStatus(line) === 'completed').length,
      afterSalesLineCount: orderLines.filter((line) => getOrderLineLineStatus(line) === 'after_sales').length
    },
    statusDistribution,
    productionRisks: {
      overdueCount: orderLines.filter((line) => getProductionDelayStatus(line, referenceDate, line.factoryPlannedDueDate).overdue).length,
      dueSoonCount: orderLines.filter((line) => getProductionDelayStatus(line, referenceDate, line.factoryPlannedDueDate).dueSoon).length,
      blockedCount: orderLines.filter((line) => getOrderLineProductionStatus(line) === 'blocked').length,
      pendingFactoryReturnCount: orderLines.filter((line) => getOrderLineProductionStatus(line) === 'in_production' && !['returned', 'abnormal'].includes(getOrderLineFactoryStatus(line))).length,
      designIncompleteCount: orderLines.filter((line) => line.requiresDesign && getOrderLineDesignStatus(line) !== 'completed').length,
      modelingIncompleteCount: orderLines.filter((line) => line.requiresModeling && getOrderLineModelingStatus(line) !== 'completed').length,
      incompleteInfoCount: orderLines.filter((line) => !getOrderLineCompleteness(line).complete).length
    },
    financeOverview: {
      monthlySalesAmount: totalSalesAmount,
      confirmedDepositAmount: purchases.reduce((sum, purchase) => sum + (purchase.finance?.depositStatus === 'confirmed' ? purchase.finance.depositAmount || 0 : 0), 0),
      pendingBalanceAmount: purchases.reduce((sum, purchase) => sum + (purchase.finance?.finalPaymentStatus === 'confirmed' ? 0 : purchase.finance?.balanceAmount || 0), 0),
      pendingFactorySettlementCount: orderLines.filter((line) => getOrderLineFinanceStatus(line) === 'pending').length,
      financeAbnormalCount: orderLines.filter((line) => getFinanceRiskStatus(line).labels.length > 0 || getOrderLineFinanceStatus(line) === 'abnormal').length,
      estimatedGrossProfit: totalGrossProfit,
      estimatedGrossProfitRate: totalSalesAmount > 0 ? Number(((totalGrossProfit / totalSalesAmount) * 100).toFixed(1)) : 0
    },
    roleWorkload: [
      { role: '客服待确认', count: orderLines.filter((line) => getOrderLineLineStatus(line) === 'pending_customer_confirmation').length },
      { role: '跟单待审核', count: orderLines.filter((line) => getOrderLineLineStatus(line) === 'pending_merchandiser_review').length },
      { role: '设计待处理', count: orderLines.filter((line) => line.requiresDesign && ['pending', 'in_progress', 'revision_requested'].includes(getOrderLineDesignStatus(line))).length },
      { role: '建模待处理', count: orderLines.filter((line) => line.requiresModeling && ['pending', 'in_progress', 'revision_requested'].includes(getOrderLineModelingStatus(line))).length },
      { role: '工厂生产中', count: orderLines.filter((line) => getOrderLineFactoryStatus(line) === 'in_production' || getOrderLineProductionStatus(line) === 'in_production').length },
      { role: '财务待确认', count: orderLines.filter((line) => getOrderLineFinanceStatus(line) === 'pending').length }
    ],
    factoryPerformance: Array.from(factoryGroups.entries()).map(([factoryId, lines]) => {
      const cycleDays = lines.map(getCycleDays).filter((value): value is number => typeof value === 'number')
      return {
        factoryId,
        taskCount: lines.length,
        inProductionCount: lines.filter((line) => getOrderLineFactoryStatus(line) === 'in_production' || getOrderLineProductionStatus(line) === 'in_production').length,
        completedCount: lines.filter((line) => getOrderLineProductionStatus(line) === 'completed').length,
        overdueCount: lines.filter((line) => getProductionDelayStatus(line, referenceDate, line.factoryPlannedDueDate).overdue).length,
        abnormalCount: lines.filter((line) => getOrderLineFactoryStatus(line) === 'abnormal' || getOrderLineProductionStatus(line) === 'blocked').length,
        averageCycleDays: cycleDays.length > 0 ? Number((cycleDays.reduce((sum, value) => sum + value, 0) / cycleDays.length).toFixed(1)) : undefined
      }
    })
  }
}
