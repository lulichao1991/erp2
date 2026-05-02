import {
  factoryWorkflowStatusLabelMap,
  getOrderLineFactoryStatus,
  getOrderLineLineStatus,
  getOrderLineProductionStatus,
  productionWorkflowStatusLabelMap
} from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine } from '@/types/order-line'

export const currentFactoryId = 'factory-suzhou-gold-001'

export type FactoryTaskTab = 'pending_acceptance' | 'in_production' | 'pending_return' | 'returned' | 'abnormal'

export type FactoryTaskRow = {
  line: OrderLine
  productionStatusLabel: string
  factoryStatusLabel: string
}

export const factoryTaskTabs: Array<{ value: FactoryTaskTab; label: string }> = [
  { value: 'pending_acceptance', label: '待接收' },
  { value: 'in_production', label: '生产中' },
  { value: 'pending_return', label: '待回传' },
  { value: 'returned', label: '已回传' },
  { value: 'abnormal', label: '异常' }
]

const isFactoryVisibleLine = (line: OrderLine, factoryId = currentFactoryId) => line.factoryId === factoryId

export const buildFactoryTaskRows = (orderLines: OrderLine[], factoryId = currentFactoryId): FactoryTaskRow[] =>
  orderLines.filter((line) => isFactoryVisibleLine(line, factoryId)).map((line) => {
    const productionStatus = getOrderLineProductionStatus(line)
    const factoryStatus = getOrderLineFactoryStatus(line)

    return {
      line,
      productionStatusLabel: productionWorkflowStatusLabelMap[productionStatus],
      factoryStatusLabel: factoryWorkflowStatusLabelMap[factoryStatus]
    }
  })

export const filterFactoryTaskRowsByTab = (rows: FactoryTaskRow[], tab: FactoryTaskTab) =>
  rows.filter(({ line }) => {
    const factoryStatus = getOrderLineFactoryStatus(line)
    const productionStatus = getOrderLineProductionStatus(line)
    const lineStatus = getOrderLineLineStatus(line)

    switch (tab) {
      case 'pending_acceptance':
        return factoryStatus === 'pending_acceptance'
      case 'in_production':
        return factoryStatus === 'accepted' || factoryStatus === 'in_production' || productionStatus === 'in_production'
      case 'pending_return':
        return productionStatus === 'completed' && factoryStatus !== 'returned' && factoryStatus !== 'abnormal'
      case 'returned':
        return factoryStatus === 'returned' || lineStatus === 'factory_returned' || lineStatus === 'pending_finance_confirmation'
      case 'abnormal':
        return factoryStatus === 'abnormal' || productionStatus === 'blocked' || productionStatus === 'delayed'
      default:
        return false
    }
  })
