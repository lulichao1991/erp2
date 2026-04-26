import {
  buildOrderLineCompletenessInput,
  getOrderLineCompleteness as getCustomerServiceCompleteness
} from '@/services/orderLine/orderLineCustomerService'
import {
  getOrderLineDesignStatus,
  getOrderLineFactoryStatus,
  getOrderLineFinanceStatus,
  getOrderLineLineStatus,
  getOrderLineModelingStatus,
  getOrderLineProductionStatus
} from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine } from '@/types/order-line'
import type { AfterSalesCase } from '@/types/supporting-records'
import type { TaskAssigneeRole } from '@/types/task'

export type OrderLineRiskSeverity = 'info' | 'warning' | 'critical'

export type OrderLineRisk = {
  key: string
  label: string
  severity: OrderLineRiskSeverity
}

export type ProductionDelayStatus = {
  status: 'no_due_date' | 'normal' | 'due_soon' | 'overdue' | 'completed'
  label: string
  variant: 'normal' | 'dueSoon' | 'overdue'
  overdue: boolean
  dueSoon: boolean
}

export type FinanceRiskStatus = {
  status: 'normal' | 'warning' | 'abnormal'
  labels: string[]
  risks: OrderLineRisk[]
}

export type OrderLineRiskOptions = {
  afterSalesCases?: AfterSalesCase[]
  referenceDate?: Date
  dueDate?: string
}

const activeAfterSalesStatuses = new Set(['open', 'processing', 'in_progress', 'waiting_return'])

const isPositiveNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0

const parseDate = (value?: string, endOfDay = false) => {
  if (!value) {
    return undefined
  }

  const normalized = value.includes('T') ? value : `${value.split(' ')[0]}${endOfDay ? 'T23:59:59' : 'T00:00:00'}`
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const buildRisk = (key: string, label: string, severity: OrderLineRiskSeverity): OrderLineRisk => ({
  key,
  label,
  severity
})

const dedupeRisks = (risks: OrderLineRisk[]) => {
  const seen = new Set<string>()
  return risks.filter((risk) => {
    if (seen.has(risk.key)) {
      return false
    }
    seen.add(risk.key)
    return true
  })
}

export const getOrderLineCompleteness = (line: OrderLine) => getCustomerServiceCompleteness(buildOrderLineCompletenessInput(line))

export const getProductionDelayStatus = (
  line: OrderLine,
  referenceDate = new Date(),
  dueDate = line.factoryPlannedDueDate || line.promisedDate,
  options: { respectCompleted?: boolean } = {}
): ProductionDelayStatus => {
  const productionStatus = getOrderLineProductionStatus(line)
  if (productionStatus === 'completed' && options.respectCompleted !== false) {
    return { status: 'completed', label: '已完成', variant: 'normal', overdue: false, dueSoon: false }
  }

  const parsedDueDate = parseDate(dueDate, true)
  if (!parsedDueDate) {
    return { status: 'no_due_date', label: '待确认交期', variant: 'normal', overdue: false, dueSoon: false }
  }

  const diffDays = Math.ceil((parsedDueDate.getTime() - referenceDate.getTime()) / 86_400_000)
  if (diffDays < 0) {
    return { status: 'overdue', label: `已超时 ${Math.abs(diffDays)} 天`, variant: 'overdue', overdue: true, dueSoon: false }
  }

  if (diffDays <= 3) {
    return { status: 'due_soon', label: `剩余 ${diffDays} 天`, variant: 'dueSoon', overdue: false, dueSoon: true }
  }

  return { status: 'normal', label: `剩余 ${diffDays} 天`, variant: 'normal', overdue: false, dueSoon: false }
}

export const getLineSalesAmountForRisk = (line: OrderLine) => line.lineSalesAmount ?? line.finalDisplayQuote ?? line.quote?.systemQuote ?? 0

export const getFactorySettlementAmountForRisk = (line: OrderLine) =>
  line.factorySettlementAmount ?? line.productionData?.totalLaborCost ?? ((line.productionData?.baseLaborCost ?? 0) + (line.productionData?.extraLaborCost ?? 0) || 0)

export const getFinanceRiskStatus = (line: OrderLine): FinanceRiskStatus => {
  const risks: OrderLineRisk[] = []
  const financeStatus = getOrderLineFinanceStatus(line)
  const factoryStatus = getOrderLineFactoryStatus(line)
  const lineStatus = getOrderLineLineStatus(line)
  const hasFactoryReturn = factoryStatus === 'returned' || lineStatus === 'factory_returned' || lineStatus === 'pending_finance_confirmation'
  const settlementAmount = getFactorySettlementAmountForRisk(line)
  const salesAmount = getLineSalesAmountForRisk(line)

  if (financeStatus === 'abnormal') {
    risks.push(buildRisk('finance_abnormal', '财务异常', 'critical'))
  }
  if (factoryStatus === 'abnormal') {
    risks.push(buildRisk('factory_abnormal', '工厂异常', 'critical'))
  }
  if (hasFactoryReturn && !isPositiveNumber(line.productionData?.totalWeight)) {
    risks.push(buildRisk('missing_total_weight', '工厂未回传重量', 'warning'))
  }
  if (hasFactoryReturn && !line.productionData?.actualMaterial) {
    risks.push(buildRisk('missing_actual_material', '材质为空', 'warning'))
  }
  if (isPositiveNumber(line.productionData?.totalWeight) && isPositiveNumber(line.productionData?.netMetalWeight) && line.productionData!.netMetalWeight! > line.productionData!.totalWeight!) {
    risks.push(buildRisk('net_weight_over_total', '净金重大于总重', 'critical'))
  }
  if (hasFactoryReturn && settlementAmount <= 0) {
    risks.push(buildRisk('missing_factory_settlement', '工厂结算金额为空', 'warning'))
  }
  if (hasFactoryReturn && !isPositiveNumber(line.productionData?.totalLaborCost) && settlementAmount <= 0) {
    risks.push(buildRisk('missing_labor_cost', '工费为空', 'warning'))
  }
  if (salesAmount <= 0) {
    risks.push(buildRisk('missing_sales_amount', '销售金额为空', 'warning'))
  }

  const uniqueRisks = dedupeRisks(risks)
  return {
    status: uniqueRisks.some((risk) => risk.severity === 'critical') ? 'abnormal' : uniqueRisks.length > 0 ? 'warning' : 'normal',
    labels: uniqueRisks.map((risk) => risk.label),
    risks: uniqueRisks
  }
}

export const getOrderLineRisks = (line: OrderLine, options: OrderLineRiskOptions = {}) => {
  const risks: OrderLineRisk[] = []
  const completeness = getOrderLineCompleteness(line)
  const delayStatus = getProductionDelayStatus(line, options.referenceDate, options.dueDate)
  const productionStatus = getOrderLineProductionStatus(line)
  const activeAfterSales = options.afterSalesCases?.some((item) => item.orderLineId === line.id && item.status && activeAfterSalesStatuses.has(item.status))

  if (!completeness.complete) {
    risks.push(buildRisk('incomplete_info', '资料缺失', 'warning'))
  }
  if (activeAfterSales || getOrderLineLineStatus(line) === 'after_sales') {
    risks.push(buildRisk('after_sales', '售后跟进', 'warning'))
  }
  if (delayStatus.overdue) {
    risks.push(buildRisk('overdue', '已超时', 'critical'))
  }
  if (productionStatus === 'blocked') {
    risks.push(buildRisk('production_blocked', '生产阻塞', 'critical'))
  }
  if (productionStatus === 'delayed') {
    risks.push(buildRisk('production_delayed', '生产逾期', 'critical'))
  }
  if (line.isUrgent || line.priority === 'urgent') {
    risks.push(buildRisk('urgent', '加急', 'warning'))
  }
  if (line.priority === 'vip') {
    risks.push(buildRisk('vip', 'VIP', 'info'))
  }

  getFinanceRiskStatus(line).risks.forEach((risk) => risks.push(risk))
  return dedupeRisks(risks)
}

export const getRoleTaskBadges = (lines: OrderLine[], role: TaskAssigneeRole) => {
  const count = (predicate: (line: OrderLine) => boolean) => lines.filter(predicate).length

  switch (role) {
    case 'customer_service':
      return [{ label: '待客服确认', count: count((line) => getOrderLineLineStatus(line) === 'pending_customer_confirmation') }]
    case 'merchandiser':
      return [
        { label: '待跟单审核', count: count((line) => getOrderLineLineStatus(line) === 'pending_merchandiser_review') },
        { label: '生产风险', count: count((line) => getOrderLineRisks(line).some((risk) => ['production_blocked', 'production_delayed', 'overdue'].includes(risk.key))) }
      ]
    case 'designer':
      return [{ label: '设计待处理', count: count((line) => Boolean(line.requiresDesign) && ['pending', 'in_progress', 'revision_requested'].includes(getOrderLineDesignStatus(line))) }]
    case 'modeler':
      return [{ label: '建模待处理', count: count((line) => Boolean(line.requiresModeling) && ['pending', 'in_progress', 'revision_requested'].includes(getOrderLineModelingStatus(line))) }]
    case 'factory':
      return [{ label: '工厂待处理', count: count((line) => ['pending_acceptance', 'accepted', 'in_production', 'abnormal'].includes(getOrderLineFactoryStatus(line))) }]
    case 'finance':
      return [{ label: '财务待处理', count: count((line) => ['pending', 'abnormal'].includes(getOrderLineFinanceStatus(line)) || getFinanceRiskStatus(line).labels.length > 0) }]
    case 'manager':
    case 'admin':
      return [{ label: '风险商品行', count: count((line) => getOrderLineRisks(line).length > 0) }]
    default:
      return []
  }
}
