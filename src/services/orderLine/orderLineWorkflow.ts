import type {
  OrderLine,
  OrderLineFactoryStatus,
  OrderLineFinanceStatus,
  OrderLineLineStatus,
  OrderLineProductionFeedbackStatus,
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

const feedbackStatusToFactoryStatus: Record<OrderLineProductionFeedbackStatus, OrderLineFactoryStatus> = {
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
  if (line.productionInfo?.feedbackStatus === 'issue') {
    return 'blocked'
  }
  if (line.productionInfo?.feedbackStatus === 'in_progress' || line.productionInfo?.feedbackStatus === 'pending_feedback') {
    return 'in_production'
  }
  if (line.productionInfo?.feedbackStatus === 'completed') {
    return 'completed'
  }

  return 'not_started'
}

export const getOrderLineFactoryStatus = (line: OrderLine): OrderLineFactoryStatus => {
  if (line.factoryStatus && line.factoryStatus in factoryWorkflowStatusLabelMap) {
    return line.factoryStatus as OrderLineFactoryStatus
  }

  const feedbackFactoryStatus = line.productionInfo?.feedbackStatus ? feedbackStatusToFactoryStatus[line.productionInfo.feedbackStatus] : undefined
  return feedbackFactoryStatus || 'not_assigned'
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

const requiresFinanceConfirmationAfterFactoryReturn = (line: OrderLine) =>
  (line.lineSalesAmount ?? 0) > 0 ||
  (line.quote?.systemQuote ?? 0) > 0 ||
  (line.allocatedDepositAmount ?? 0) > 0 ||
  (line.allocatedFinalPaymentAmount ?? 0) > 0 ||
  (line.factorySettlementAmount ?? 0) > 0 ||
  (line.productionData?.baseLaborCost ?? 0) > 0 ||
  (line.productionData?.extraLaborCost ?? 0) > 0 ||
  (line.productionData?.totalLaborCost ?? 0) > 0 ||
  (line.materialCost ?? 0) > 0 ||
  (line.mainStoneCost ?? 0) > 0 ||
  (line.sideStoneCost ?? 0) > 0 ||
  (line.laborCost ?? 0) > 0 ||
  (line.extraLaborCost ?? 0) > 0

export const buildOrderLineStatusPatch = (status: OrderLineLineStatus): Pick<OrderLine, 'lineStatus'> => ({ lineStatus: status })

const formatWorkflowTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

export const confirmCustomerServiceInfo = (line: OrderLine): OrderLine => {
  if (line.requiresDesign) {
    return {
      ...line,
      lineStatus: 'pending_design',
      designStatus: line.designStatus === 'completed' ? 'completed' : 'pending',
      modelingStatus: line.requiresModeling ? line.modelingStatus : line.modelingStatus || 'not_required'
    }
  }

  if (line.requiresModeling) {
    return {
      ...line,
      lineStatus: 'pending_modeling',
      designStatus: line.designStatus || 'not_required',
      modelingStatus: line.modelingStatus === 'completed' ? 'completed' : 'pending'
    }
  }

  return {
    ...line,
    lineStatus: 'pending_merchandiser_review',
    designStatus: line.designStatus || 'not_required',
    modelingStatus: line.modelingStatus || 'not_required'
  }
}

export const startDesign = (line: OrderLine): OrderLine => ({
  ...line,
  lineStatus: 'pending_design',
  assignedDesignerId: line.assignedDesignerId || 'designer-current',
  designStatus: 'in_progress'
})

export const completeDesign = (line: OrderLine): OrderLine => ({
  ...line,
  lineStatus: line.requiresModeling ? 'pending_modeling' : 'pending_merchandiser_review',
  designStatus: 'completed',
  modelingStatus: line.requiresModeling ? 'pending' : line.modelingStatus
})

export const startModeling = (line: OrderLine): OrderLine => ({
  ...line,
  lineStatus: 'pending_modeling',
  assignedModelerId: line.assignedModelerId || 'modeler-current',
  modelingStatus: 'in_progress'
})

export const completeModeling = (line: OrderLine): OrderLine => ({
  ...line,
  lineStatus: 'pending_merchandiser_review',
  modelingStatus: 'completed'
})

export const requestDesignRevision = (line: OrderLine, revisionReason = '需要重新调整设计稿'): OrderLine => ({
  ...line,
  lineStatus: 'pending_design',
  designStatus: 'revision_requested',
  productionStatus: 'not_started',
  factoryStatus: 'not_assigned',
  revisionReason
})

export const requestModelingRevision = (line: OrderLine, revisionReason = '需要重新调整建模文件'): OrderLine => ({
  ...line,
  lineStatus: 'pending_modeling',
  modelingStatus: 'revision_requested',
  productionStatus: 'not_started',
  factoryStatus: 'not_assigned',
  revisionReason
})

export const recordWaxFileReady = (
  line: OrderLine,
  patch: Pick<OrderLine, 'waxFiles' | 'waxFactorySentAt'>
): OrderLine => ({
  ...line,
  ...patch
})

export const approveProductionReview = (line: OrderLine): OrderLine => ({
  ...line,
  lineStatus: 'pending_factory_production',
  productionStatus: 'pending_dispatch'
})

export const dispatchToFactory = (line: OrderLine): OrderLine => ({
  ...line,
  lineStatus: 'pending_factory_production',
  productionStatus: 'dispatched',
  factoryStatus: 'pending_acceptance',
  productionInfo: {
    ...line.productionInfo,
    feedbackStatus: 'not_started'
  }
})

export const acceptFactoryTask = (line: OrderLine): OrderLine => ({
  ...line,
  lineStatus: 'pending_factory_production',
  productionStatus: 'dispatched',
  factoryStatus: 'accepted',
  productionInfo: {
    ...line.productionInfo,
    feedbackStatus: 'not_started'
  }
})

export const startFactoryProduction = (line: OrderLine): OrderLine => ({
  ...line,
  lineStatus: 'in_production',
  productionStatus: 'in_production',
  factoryStatus: 'in_production',
  productionInfo: {
    ...line.productionInfo,
    feedbackStatus: 'in_progress'
  }
})

export const completeFactoryProduction = (line: OrderLine): OrderLine => ({
  ...line,
  productionStatus: 'completed',
  factoryStatus: 'in_production',
  productionInfo: {
    ...line.productionInfo,
    feedbackStatus: 'pending_feedback'
  }
})

export const submitFactoryReturn = (line: OrderLine): OrderLine => ({
  ...line,
  lineStatus: 'factory_returned',
  productionStatus: 'completed',
  factoryStatus: 'returned',
  productionInfo: {
    ...line.productionInfo,
    feedbackStatus: 'completed'
  }
})

export const approveFactoryReturn = (line: OrderLine): OrderLine => {
  if (getOrderLineLineStatus(line) !== 'factory_returned') {
    return line
  }

  const basePatch = {
    productionStatus: 'completed' as const,
    factoryStatus: 'returned' as const,
    productionInfo: {
      ...line.productionInfo,
      feedbackStatus: 'completed' as const
    }
  }

  if (line.financeStatus === 'confirmed' || line.financeLocked) {
    return {
      ...line,
      lineStatus: 'ready_to_ship',
      ...basePatch,
      financeStatus: 'confirmed'
    }
  }

  if (line.financeStatus === 'not_required' && !requiresFinanceConfirmationAfterFactoryReturn(line)) {
    return {
      ...line,
      lineStatus: 'ready_to_ship',
      ...basePatch,
      financeStatus: 'not_required'
    }
  }

  return {
    ...line,
    lineStatus: 'pending_finance_confirmation',
    ...basePatch,
    financeStatus: line.financeStatus === 'abnormal' ? 'abnormal' : 'pending'
  }
}

export const returnFactoryFeedback = (line: OrderLine): OrderLine => {
  if (getOrderLineLineStatus(line) !== 'factory_returned') {
    return line
  }

  return {
    ...line,
    lineStatus: 'in_production',
    productionStatus: 'blocked',
    factoryStatus: 'abnormal',
    financeStatus: 'not_required',
    productionInfo: {
      ...line.productionInfo,
      feedbackStatus: 'issue'
    }
  }
}

export const markProductionBlocked = (line: OrderLine, reason = '生产标记异常，等待跟单处理。'): OrderLine => ({
  ...line,
  productionStatus: 'blocked',
  factoryStatus: 'abnormal',
  productionInfo: {
    ...line.productionInfo,
    feedbackStatus: 'issue',
    factoryNote: reason || line.productionInfo?.factoryNote
  }
})

export const resumeProduction = (line: OrderLine): OrderLine => {
  const canResume = getOrderLineProductionStatus(line) === 'blocked' || getOrderLineFactoryStatus(line) === 'abnormal' || line.productionInfo?.feedbackStatus === 'issue'

  if (!canResume) {
    return line
  }

  return {
    ...line,
    lineStatus: 'in_production',
    productionStatus: 'in_production',
    factoryStatus: 'in_production',
    productionInfo: {
      ...line.productionInfo,
      feedbackStatus: 'in_progress'
    }
  }
}

export const completeOrderLine = (line: OrderLine, finishedAt = formatWorkflowTime()): OrderLine => {
  if (getOrderLineLineStatus(line) !== 'ready_to_ship') {
    return line
  }

  return {
    ...line,
    lineStatus: 'completed',
    finishedAt
  }
}

export const getOrderLineWorkflowActionState = (line: OrderLine) => {
  const lineStatus = getOrderLineLineStatus(line)
  const productionStatus = getOrderLineProductionStatus(line)
  const factoryStatus = getOrderLineFactoryStatus(line)
  const feedbackStatus = line.productionInfo?.feedbackStatus
  const isCompleted = lineStatus === 'completed'
  const canResumeProduction = !isCompleted && (productionStatus === 'blocked' || factoryStatus === 'abnormal' || feedbackStatus === 'issue')

  return {
    canApproveProductionReview: lineStatus === 'pending_merchandiser_review',
    canDispatchToFactory: lineStatus === 'pending_factory_production' && productionStatus === 'pending_dispatch',
    canAcceptFactoryTask: lineStatus === 'pending_factory_production' && factoryStatus === 'pending_acceptance',
    canStartFactoryProduction: lineStatus === 'pending_factory_production' && factoryStatus === 'accepted',
    canCompleteFactoryProduction: lineStatus === 'in_production' && productionStatus === 'in_production' && factoryStatus === 'in_production',
    canSubmitFactoryReturn: productionStatus === 'completed' && factoryStatus !== 'returned' && factoryStatus !== 'abnormal',
    canApproveFactoryReturn: lineStatus === 'factory_returned',
    canReturnFactoryFeedback: lineStatus === 'factory_returned',
    canMarkProductionBlocked: !isCompleted && !canResumeProduction && productionStatus === 'in_production' && (lineStatus === 'in_production' || factoryStatus === 'in_production'),
    canResumeProduction,
    canCompleteOrderLine: lineStatus === 'ready_to_ship'
  }
}

export const confirmFinance = (
  line: OrderLine,
  patch: Pick<OrderLine, 'factorySettlementAmount' | 'estimatedGrossProfit' | 'estimatedGrossProfitRate' | 'financeConfirmedAt' | 'financeNote'> = {}
): OrderLine => ({
  ...line,
  ...patch,
  lineStatus: 'ready_to_ship',
  financeStatus: 'confirmed',
  financeLocked: true
})

export const markFinanceAbnormal = (line: OrderLine, abnormalReason = '财务标记异常，等待复核。', financeNote?: string): OrderLine => ({
  ...line,
  financeStatus: 'abnormal',
  financeAbnormalReason: abnormalReason,
  financeNote: financeNote || line.financeNote,
  financeLocked: false
})

export const resolveFinanceAbnormal = (line: OrderLine, financeNote?: string): OrderLine => ({
  ...line,
  financeStatus: 'pending',
  financeAbnormalReason: undefined,
  financeNote: financeNote || line.financeNote || '财务异常已解除，重新进入待确认。',
  financeLocked: false
})

export const lockFinance = (line: OrderLine, financeNote?: string): OrderLine => ({
  ...line,
  financeLocked: true,
  financeNote: financeNote || line.financeNote || '财务数据已锁定。'
})

type OrderLineV2WorkflowStep = {
  stageLabel: string
  ownerRoleLabel: string
  nextActionLabel: string
  description: string
}

export const getOrderLineV2WorkflowStep = (line: OrderLine): OrderLineV2WorkflowStep => {
  if (line.financeLocked || line.financeStatus === 'confirmed') {
    return {
      stageLabel: '财务已锁定',
      ownerRoleLabel: '财务',
      nextActionLabel: '只读复核',
      description: '该货号财务已确认或锁定，收退款、结算金额、备注和异常处理进入只读。'
    }
  }

  const lineStatus = getOrderLineLineStatus(line)

  switch (lineStatus) {
    case 'draft':
      return {
        stageLabel: '销售草稿',
        ownerRoleLabel: '客服',
        nextActionLabel: '补齐销售资料',
        description: '继续完善款式、规格、材质、价格和客户购买信息，再进入客服确认。'
      }
    case 'pending_customer_confirmation':
      return {
        stageLabel: '客服确认',
        ownerRoleLabel: '客服',
        nextActionLabel: '确认资料并分流',
        description: '客服确认资料完整后，按 requiresDesign / requiresModeling 分流到设计、建模或跟单审核。'
      }
    case 'pending_design':
      return {
        stageLabel: '设计处理',
        ownerRoleLabel: '设计',
        nextActionLabel: '完成设计文件',
        description: line.requiresModeling ? '设计完成后进入建模处理。' : '设计完成后进入跟单生产资料审核。'
      }
    case 'pending_modeling':
      return {
        stageLabel: '建模处理',
        ownerRoleLabel: '建模',
        nextActionLabel: '完成建模 / 出蜡文件',
        description: '建模完成后进入跟单生产资料审核。'
      }
    case 'pending_merchandiser_review':
      return {
        stageLabel: '跟单审核',
        ownerRoleLabel: '跟单',
        nextActionLabel: '审核生产资料',
        description: '跟单确认商品资料、设计建模文件和交期，审核通过后进入工厂下发。'
      }
    case 'pending_factory_production':
      return {
        stageLabel: '待下发生产',
        ownerRoleLabel: '跟单',
        nextActionLabel: '分配并下发工厂',
        description: '跟单确认工厂、交期和下发资料后，销售进入工厂生产段。'
      }
    case 'in_production':
      return {
        stageLabel: '工厂生产',
        ownerRoleLabel: '工厂',
        nextActionLabel: '生产并提交回传',
        description: '工厂处理生产、填写重量 / 工费 / 损耗 / 文件等回传资料。'
      }
    case 'factory_returned':
      return {
        stageLabel: '完工待审核',
        ownerRoleLabel: '跟单',
        nextActionLabel: '审核工厂回传',
        description: '工厂回传不直接进入财务，必须由跟单完工审核通过后进入待财务确认。'
      }
    case 'pending_finance_confirmation':
      return {
        stageLabel: '财务核算',
        ownerRoleLabel: '财务',
        nextActionLabel: '确认收退款 / 成本 / 结算',
        description: '财务按货号处理收退款、库存 FIFO 成本、工厂结算、异常和锁定。'
      }
    case 'ready_to_ship':
      return {
        stageLabel: '待发货',
        ownerRoleLabel: '客服 / 跟单',
        nextActionLabel: '维护单件物流',
        description: '物流记录按 orderLineId 关联，只记录单件发货，不回写整笔购买状态。'
      }
    case 'completed':
      return {
        stageLabel: '销售完成',
        ownerRoleLabel: '业务复核',
        nextActionLabel: '查看归档记录',
        description: '该销售主流程已完成，后续物流、售后和库存追溯仍按 orderLineId 查看。'
      }
    case 'after_sales':
      return {
        stageLabel: '售后处理中',
        ownerRoleLabel: '客服 / 售后',
        nextActionLabel: '维护售后记录',
        description: '售后记录按 orderLineId 关联，不把同购买下其他销售一并推进售后。'
      }
    default:
      return {
        stageLabel: '待确认',
        ownerRoleLabel: '业务负责人',
        nextActionLabel: '核对当前状态',
        description: '当前状态未进入 v2 标准流程，请先核对销售资料和状态来源。'
      }
  }
}

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
