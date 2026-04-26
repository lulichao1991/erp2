import {
  getOrderLineFactoryStatus,
  getOrderLineLineStatus,
  getOrderLineProductionStatus,
  orderLineLineStatusLabelMap,
  productionWorkflowStatusLabelMap,
  factoryWorkflowStatusLabelMap
} from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine, OrderLineWorkflowProductionStatus } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'

export type ProductionFollowUpTab = 'review' | 'dispatch' | 'producing' | 'factory_return' | 'risk'

export type ProductionFollowUpRow = {
  line: OrderLine
  purchase?: Purchase
  purchaseNo: string
  lineStatusLabel: string
  productionStatusLabel: string
  factoryStatusLabel: string
  isOverdue: boolean
  isRisk: boolean
}

export const productionFollowUpTabs: Array<{ value: ProductionFollowUpTab; label: string }> = [
  { value: 'review', label: '待跟单审核' },
  { value: 'dispatch', label: '待下发生产' },
  { value: 'producing', label: '生产中' },
  { value: 'factory_return', label: '待工厂回传' },
  { value: 'risk', label: '异常 / 逾期' }
]

const isPastDate = (date?: string) => {
  if (!date) {
    return false
  }

  const parsed = new Date(`${date}T23:59:59`)
  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  return parsed.getTime() < Date.now()
}

export const isProductionFollowUpOverdue = (line: OrderLine) => {
  const productionStatus = getOrderLineProductionStatus(line)
  return isPastDate(line.factoryPlannedDueDate) && productionStatus !== 'completed'
}

export const isProductionFollowUpRisk = (line: OrderLine) => {
  const productionStatus = getOrderLineProductionStatus(line)
  return productionStatus === 'blocked' || productionStatus === 'delayed' || isProductionFollowUpOverdue(line)
}

export const buildProductionFollowUpRows = (orderLines: OrderLine[], purchases: Purchase[]): ProductionFollowUpRow[] =>
  orderLines
    .filter((line) => {
      const lineStatus = getOrderLineLineStatus(line)
      const productionStatus = getOrderLineProductionStatus(line)
      const factoryStatus = getOrderLineFactoryStatus(line)

      return (
        lineStatus === 'pending_merchandiser_review' ||
        lineStatus === 'pending_factory_production' ||
        lineStatus === 'in_production' ||
        productionStatus === 'pending_dispatch' ||
        productionStatus === 'dispatched' ||
        productionStatus === 'in_production' ||
        factoryStatus === 'accepted' ||
        factoryStatus === 'in_production' ||
        isProductionFollowUpRisk(line)
      )
    })
    .map((line) => {
      const purchase = purchases.find((item) => item.id === line.purchaseId)
      const lineStatus = getOrderLineLineStatus(line)
      const productionStatus = getOrderLineProductionStatus(line)
      const factoryStatus = getOrderLineFactoryStatus(line)
      const isOverdue = isProductionFollowUpOverdue(line)

      return {
        line,
        purchase,
        purchaseNo: purchase?.purchaseNo || line.purchaseId || '未关联购买记录',
        lineStatusLabel: orderLineLineStatusLabelMap[lineStatus],
        productionStatusLabel: productionWorkflowStatusLabelMap[productionStatus],
        factoryStatusLabel: factoryWorkflowStatusLabelMap[factoryStatus],
        isOverdue,
        isRisk: productionStatus === 'blocked' || productionStatus === 'delayed' || isOverdue
      }
    })

export const filterProductionFollowUpRowsByTab = (rows: ProductionFollowUpRow[], tab: ProductionFollowUpTab) =>
  rows.filter((row) => {
    const lineStatus = getOrderLineLineStatus(row.line)
    const productionStatus = getOrderLineProductionStatus(row.line)
    const factoryStatus = getOrderLineFactoryStatus(row.line)

    switch (tab) {
      case 'review':
        return lineStatus === 'pending_merchandiser_review'
      case 'dispatch':
        return lineStatus === 'pending_factory_production' || productionStatus === 'pending_dispatch'
      case 'producing':
        return lineStatus === 'in_production' || productionStatus === 'in_production'
      case 'factory_return':
        return productionStatus === 'in_production' && factoryStatus !== 'returned' && factoryStatus !== 'abnormal'
      case 'risk':
        return row.isRisk
      default:
        return false
    }
  })

export const getNextProductionStatusLabel = (status: OrderLineWorkflowProductionStatus | string) =>
  status in productionWorkflowStatusLabelMap ? productionWorkflowStatusLabelMap[status as OrderLineWorkflowProductionStatus] : status
