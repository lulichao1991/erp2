import { afterSalesMock } from '@/mocks'
import { getOrderLineLineStatus } from '@/services/orderLine/orderLineWorkflow'
import { getProductionDelayStatus } from '@/services/orderLine/orderLineRiskSelectors'
import { type OrderLineRow } from '@/services/orderLine/orderLineWorkspace'
import { activeAfterSalesStatuses } from '@/components/business/orderLine/orderLineOptions'
import type { OrderLine } from '@/types/order-line'
import type { AfterSalesCase } from '@/types/supporting-records'

export type { OrderLineCenterFilters, OrderLineRow } from '@/services/orderLine/orderLineWorkspace'
export { OrderLineDetailDrawer } from '@/components/business/orderLine/orderLineDetailDrawer'
export { OrderLineFilterBar } from '@/components/business/orderLine/orderLineFilter'
export { OrderLineTable } from '@/components/business/orderLine/orderLineTable'

const isActiveAfterSalesCase = (record?: AfterSalesCase) => Boolean(record?.status && activeAfterSalesStatuses.has(record.status))

const getTimePressure = (line: OrderLine, promisedDate?: string) => getProductionDelayStatus(line, new Date(), promisedDate, { respectCompleted: false })

export const OrderLineQuickStats = ({ rows, afterSalesCases = afterSalesMock }: { rows: OrderLineRow[]; afterSalesCases?: AfterSalesCase[] }) => {
  const stats = [
    { label: '全部销售', value: rows.length },
    { label: '待客服确认', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'pending_customer_confirmation').length },
    { label: '待设计', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'pending_design').length },
    { label: '待建模', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'pending_modeling').length },
    { label: '待跟单审核', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'pending_merchandiser_review').length },
    { label: '生产中', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'in_production').length },
    { label: '待财务确认', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'pending_finance_confirmation').length },
    { label: '售后中', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'after_sales' || afterSalesCases.some((item) => item.orderLineId === line.id && isActiveAfterSalesCase(item))).length },
    { label: '已超时', value: rows.filter(({ line }) => getTimePressure(line, line.promisedDate).overdue).length }
  ]

  return (
    <div className="stats-grid compact-stats">
      {stats.map((item) => (
        <div key={item.label} className="stat-card compact-stat">
          <div className="stat-card-label">{item.label}</div>
          <div className="stat-card-value">{item.value}</div>
        </div>
      ))}
    </div>
  )
}
