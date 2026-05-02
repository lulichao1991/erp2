import type {
  OrderLine,
  OrderLineFactoryStatus,
  OrderLineFinanceStatus,
  OrderLineLineStatus,
  OrderLineWorkflowDesignStatus,
  OrderLineWorkflowModelingStatus,
  OrderLineWorkflowProductionStatus
} from '@/types/order-line'

export const orderLineLineStatusLabelMap: Record<OrderLineLineStatus, string> = {
  draft: '草稿',
  pending_customer_confirmation: '待客服确认',
  pending_design: '待设计',
  pending_modeling: '待建模',
  pending_merchandiser_review: '待跟单审核',
  pending_factory_production: '待下发生产',
  in_production: '生产中',
  factory_returned: '工厂已回传',
  pending_finance_confirmation: '待财务确认',
  ready_to_ship: '待发货',
  completed: '已完成',
  after_sales: '售后中'
}

export const orderLineLineStatusOptions: Array<{ value: OrderLineLineStatus; label: string }> = [
  { value: 'pending_customer_confirmation', label: '待客服确认' },
  { value: 'pending_design', label: '待设计' },
  { value: 'pending_modeling', label: '待建模' },
  { value: 'pending_merchandiser_review', label: '待跟单审核' },
  { value: 'pending_factory_production', label: '待下发生产' },
  { value: 'in_production', label: '生产中' },
  { value: 'factory_returned', label: '工厂已回传' },
  { value: 'pending_finance_confirmation', label: '待财务确认' },
  { value: 'ready_to_ship', label: '待发货' },
  { value: 'completed', label: '已完成' },
  { value: 'after_sales', label: '售后中' }
]

export const designWorkflowStatusLabelMap: Record<OrderLineWorkflowDesignStatus, string> = {
  not_required: '不需要设计',
  pending: '待设计',
  in_progress: '设计中',
  revision_requested: '需修改',
  completed: '已完成'
}

export const modelingWorkflowStatusLabelMap: Record<OrderLineWorkflowModelingStatus, string> = {
  not_required: '不需要建模',
  pending: '待建模',
  in_progress: '建模中',
  revision_requested: '需修改',
  completed: '已完成'
}

export const productionWorkflowStatusLabelMap: Record<OrderLineWorkflowProductionStatus, string> = {
  not_started: '未开始',
  pending_dispatch: '待下发',
  dispatched: '已下发',
  in_production: '生产中',
  completed: '已完成',
  delayed: '已逾期',
  blocked: '阻塞'
}

export const factoryWorkflowStatusLabelMap: Record<OrderLineFactoryStatus, string> = {
  not_assigned: '未分配工厂',
  pending_acceptance: '待工厂接收',
  accepted: '工厂已接收',
  in_production: '工厂生产中',
  returned: '工厂已回传',
  abnormal: '工厂异常'
}

export const financeWorkflowStatusLabelMap: Record<OrderLineFinanceStatus, string> = {
  not_required: '无需财务确认',
  pending: '待财务确认',
  confirmed: '财务已确认',
  abnormal: '财务异常'
}

const legacyDesignStatusMap: Record<string, OrderLineWorkflowDesignStatus> = {
  not_required: 'not_required',
  pending: 'pending',
  in_progress: 'in_progress',
  completed: 'completed',
  delivered: 'completed',
  rework: 'revision_requested'
}

const legacyFactoryStatusToFactoryStatus: Record<string, OrderLineFactoryStatus> = {
  not_started: 'not_assigned',
  in_progress: 'in_production',
  pending_feedback: 'in_production',
  completed: 'returned',
  issue: 'abnormal'
}

export const getOrderLineLineStatus = (line: OrderLine): OrderLineLineStatus => {
  if (line.lineStatus && line.lineStatus in orderLineLineStatusLabelMap) {
    return line.lineStatus as OrderLineLineStatus
  }

  return 'draft'
}

export const getOrderLineLineStatusLabel = (status?: string) =>
  status && status in orderLineLineStatusLabelMap ? orderLineLineStatusLabelMap[status as OrderLineLineStatus] : status || '待确认'

export const getOrderLineDesignStatus = (line: OrderLine): OrderLineWorkflowDesignStatus => {
  if (line.designStatus && line.designStatus in designWorkflowStatusLabelMap) {
    return line.designStatus as OrderLineWorkflowDesignStatus
  }

  const legacyStatus = line.designInfo?.designStatus ? legacyDesignStatusMap[String(line.designInfo.designStatus)] : undefined
  if (legacyStatus) {
    return legacyStatus
  }

  if (line.requiresDesign === false) {
    return 'not_required'
  }

  return getOrderLineLineStatus(line) === 'pending_design' ? 'pending' : 'not_required'
}

export const getOrderLineModelingStatus = (line: OrderLine): OrderLineWorkflowModelingStatus => {
  if (line.modelingStatus && line.modelingStatus in modelingWorkflowStatusLabelMap) {
    return line.modelingStatus as OrderLineWorkflowModelingStatus
  }

  if (!line.requiresModeling) {
    return 'not_required'
  }

  return getOrderLineLineStatus(line) === 'pending_modeling' ? 'pending' : 'in_progress'
}

export const getOrderLineProductionStatus = (line: OrderLine): OrderLineWorkflowProductionStatus => {
  if (line.productionStatus && line.productionStatus in productionWorkflowStatusLabelMap) {
    return line.productionStatus as OrderLineWorkflowProductionStatus
  }

  const lineStatus = getOrderLineLineStatus(line)
  if (lineStatus === 'pending_factory_production') {
    return 'pending_dispatch'
  }
  if (lineStatus === 'in_production') {
    return 'in_production'
  }
  if (lineStatus === 'factory_returned' || lineStatus === 'pending_finance_confirmation' || lineStatus === 'ready_to_ship' || lineStatus === 'completed') {
    return 'completed'
  }
  if (line.productionInfo?.factoryStatus === 'issue') {
    return 'blocked'
  }
  if (line.productionInfo?.factoryStatus === 'in_progress' || line.productionInfo?.factoryStatus === 'pending_feedback') {
    return 'in_production'
  }
  if (line.productionInfo?.factoryStatus === 'completed') {
    return 'completed'
  }

  return 'not_started'
}

export const getOrderLineFactoryStatus = (line: OrderLine): OrderLineFactoryStatus => {
  if (line.factoryStatus && line.factoryStatus in factoryWorkflowStatusLabelMap) {
    return line.factoryStatus as OrderLineFactoryStatus
  }

  const legacyStatus = line.productionInfo?.factoryStatus ? legacyFactoryStatusToFactoryStatus[String(line.productionInfo.factoryStatus)] : undefined
  return legacyStatus || 'not_assigned'
}

export const getOrderLineFinanceStatus = (line: OrderLine): OrderLineFinanceStatus => {
  if (line.financeStatus && line.financeStatus in financeWorkflowStatusLabelMap) {
    return line.financeStatus as OrderLineFinanceStatus
  }

  const lineStatus = getOrderLineLineStatus(line)
  if (lineStatus === 'pending_finance_confirmation') {
    return 'pending'
  }
  if (lineStatus === 'ready_to_ship' || lineStatus === 'completed') {
    return 'confirmed'
  }
  return 'not_required'
}

export const buildOrderLineStatusPatch = (status: OrderLineLineStatus | string): Pick<OrderLine, 'lineStatus'> => ({ lineStatus: status })

export const getOrderLineTaskGroups = (lines: OrderLine[]) => {
  const groups: Array<{ value: OrderLineLineStatus; label: string; count: number }> = [
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
  ].map((status) => ({
    value: status as OrderLineLineStatus,
    label: orderLineLineStatusLabelMap[status as OrderLineLineStatus],
    count: lines.filter((line) => getOrderLineLineStatus(line) === status).length
  }))

  return groups.filter((group) => group.count > 0)
}
