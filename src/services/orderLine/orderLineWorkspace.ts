import { afterSalesMock, customersMock } from '@/mocks'
import {
  getOrderLineDesignStatus,
  getOrderLineLineStatus,
  getOrderLineLineStatusLabel,
  getOrderLineModelingStatus,
  orderLineLineStatusLabelMap
} from '@/services/orderLine/orderLineWorkflow'
import { findPurchaseForOrderLine, getOrderLineGoodsNo, getOrderLinePurchaseId, isOrderLineInPurchase } from '@/services/orderLine/orderLineIdentity'
import { getProductionDelayStatus } from '@/services/orderLine/orderLineRiskSelectors'
import type { Customer } from '@/types/customer'
import type {
  OrderLine,
  OrderLineLineStatus,
  OrderLineLog,
  OrderLineOutsourceStatus,
  OrderLinePriority,
  OrderLineProductionStatus,
  OrderLineWorkflowDesignStatus,
  OrderLineWorkflowModelingStatus,
  OrderLineUploadedFile
} from '@/types/order-line'
import type { ProductCategory } from '@/types/product'
import type { Purchase } from '@/types/purchase'
import type { AfterSalesCase, AfterSalesCaseStatus, AfterSalesCaseType, LogisticsDirection, LogisticsRecord, LogisticsType } from '@/types/supporting-records'

export type OrderLineCenterFilters = {
  keyword: string
  status: 'all' | OrderLineLineStatus | string
  owner: string
  category: 'all' | ProductCategory | string
  urgent: 'all' | 'yes' | 'no'
  afterSales: 'all' | 'yes' | 'no'
  overdue: 'all' | 'yes' | 'no'
  factory: string
  purchase: string
  customer: string
  quickView: 'all' | OrderLineLineStatus | string
}

export type OrderLineRow = {
  line: OrderLine
  purchase?: Purchase
}

export type OrderLineDetailsDraft = {
  productionTaskNo: string
  name: string
  versionNo: string
  category: ProductCategory | string
  selectedSpecValue: string
  selectedMaterial: string
  selectedProcess: string
  selectedSpecialOptionsText: string
  engraveText: string
  engraveImageFiles: OrderLineUploadedFile[]
  engravePltFiles: OrderLineUploadedFile[]
  customerRemark: string
  priority: OrderLinePriority
  requiresDesign: boolean
  requiresModeling: boolean
  requiresWax: boolean
  designStatus: OrderLineWorkflowDesignStatus
  modelingStatus: OrderLineWorkflowModelingStatus
  assignedDesignerId: string
  assignedModelerId: string
  assignedDesignerName: string
  modelingFiles: OrderLineUploadedFile[]
  waxFiles: OrderLineUploadedFile[]
  designNote: string
  currentOwner: string
  promisedDate: string
}

export type OrderLineDesignModelingDraft = Pick<
  OrderLineDetailsDraft,
  'designStatus' | 'modelingStatus' | 'assignedDesignerId' | 'assignedModelerId' | 'assignedDesignerName' | 'modelingFiles' | 'waxFiles' | 'designNote'
>

export type OrderLineOutsourceDraft = {
  followUpOwner: string
  supplierName: string
  outsourcedAt: string
  productionTaskNo: string
  plannedDeliveryDate: string
  outsourceNote: string
  outsourceStatus: OrderLineOutsourceStatus | string
}

export type OrderLineProductionDraft = {
  factoryStatus: OrderLineProductionStatus | string
  actualMaterial: string
  totalWeight: string
  netWeight: string
  mainStoneInfo: string
  sideStoneInfo: string
  laborCostDetail: string
  factoryShippedAt: string
  qualityResult: string
  factoryNote: string
}

export type OrderLineLogisticsDraft = {
  logisticsType: LogisticsType
  direction: LogisticsDirection
  company: string
  trackingNo: string
  shippedAt: string
  signedAt: string
  remark: string
}

export type OrderLineAfterSalesDraft = {
  type: AfterSalesCaseType
  reason: string
  status: AfterSalesCaseStatus
  responsibleParty: string
  createdAt: string
  closedAt: string
  remark: string
}

export type OrderLineStatusUpdateHandler = (lineId: string, nextStatus: OrderLineLineStatus | string) => void
export type OrderLineDetailsUpdateHandler = (lineId: string, draft: OrderLineDetailsDraft) => void
export type OrderLineDesignModelingUpdateHandler = (lineId: string, draft: OrderLineDesignModelingDraft) => void
export type OrderLineOutsourceUpdateHandler = (lineId: string, draft: OrderLineOutsourceDraft) => void
export type OrderLineProductionUpdateHandler = (lineId: string, draft: OrderLineProductionDraft) => void
export type OrderLineLogisticsCreateHandler = (record: LogisticsRecord) => void
export type OrderLineLogisticsUpdateHandler = (recordId: string, draft: OrderLineLogisticsDraft) => void
export type OrderLineLogisticsVoidHandler = (recordId: string, voidReason: string) => void
export type OrderLineAfterSalesCreateHandler = (record: AfterSalesCase) => void
export type OrderLineAfterSalesUpdateHandler = (recordId: string, draft: OrderLineAfterSalesDraft) => void
export type OrderLineAfterSalesCloseHandler = (recordId: string) => void

const activeAfterSalesStatuses = new Set(['open', 'processing', 'in_progress', 'waiting_return'])

const formatDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const getStatusLabel = getOrderLineLineStatusLabel

const logisticsTypeLabelMap: Record<LogisticsType, string> = {
  measurement_tool: '量尺工具',
  goods: '货品',
  after_sales: '售后',
  other: '其他'
}

const afterSalesTypeLabelMap: Record<string, string> = {
  repair: '维修',
  resize: '改圈/改尺寸',
  repolish: '返工抛光',
  remake: '重做',
  resend: '补发',
  refund: '退款',
  exchange: '换货',
  other: '其他'
}

const isActiveAfterSalesCase = (record?: AfterSalesCase) => Boolean(record?.status && activeAfterSalesStatuses.has(record.status))

const getAfterSalesReason = (record: AfterSalesCase) => record.reason || record.remark || '—'
const getAfterSalesTypeLabel = (type?: string) => (type ? afterSalesTypeLabelMap[type] || type : '未分类')
const getLineOwner = (line: OrderLine, purchase?: Purchase) => line.currentOwner || purchase?.ownerName || ''
const getTimePressure = (line: OrderLine, promisedDate?: string) => getProductionDelayStatus(line, new Date(), promisedDate, { respectCompleted: false })

const getOrderLineDisplayName = (line: OrderLine) => line.name || '未命名款式'

const splitTextList = (value: string) =>
  value
    .split(/[,，/、\n]/)
    .map((item) => item.trim())
    .filter(Boolean)

const getProductionTotalWeight = (line: OrderLine) => line.productionInfo?.totalWeight || ''

const getLineHasActiveAfterSales = (line: OrderLine, afterSalesCases: AfterSalesCase[] = afterSalesMock) =>
  getOrderLineLineStatus(line) === 'after_sales' || afterSalesCases.some((item) => item.orderLineId === line.id && isActiveAfterSalesCase(item))

export const buildOrderLineRowsFromData = (orderLines: OrderLine[], purchases: Purchase[], purchaseId?: string): OrderLineRow[] =>
  orderLines
    .filter((line) => isOrderLineInPurchase(line, purchaseId))
    .map((line) => ({
      line,
      purchase: findPurchaseForOrderLine(line, purchases)
    }))

export const filterOrderLineRows = (
  rows: OrderLineRow[],
  filters: OrderLineCenterFilters,
  afterSalesCases: AfterSalesCase[] = afterSalesMock,
  customers: Customer[] = customersMock
) =>
  rows.filter(({ line, purchase }) => {
    const customer = customers.find((item) => item.id === line.customerId || item.id === purchase?.customerId)
    const keyword = filters.keyword.trim().toLowerCase()
    const owner = getLineOwner(line, purchase)
    const factoryKeyword = filters.factory.trim().toLowerCase()
    const purchaseKeyword = filters.purchase.trim().toLowerCase()
    const customerKeyword = filters.customer.trim().toLowerCase()
    const factoryText = [line.outsourceInfo?.supplierName, line.productionInfo?.factoryNote].filter(Boolean).join(' ').toLowerCase()
    const purchaseText = [purchase?.purchaseNo, purchase?.platformOrderNo, purchase?.id].filter(Boolean).join(' ').toLowerCase()
    const customerText = [customer?.name, customer?.phone, customer?.wechat, customer?.id].filter(Boolean).join(' ').toLowerCase()
    const hasActiveAfterSales = getLineHasActiveAfterSales(line, afterSalesCases)
    const overdue = getTimePressure(line, line.promisedDate).overdue
    const lineStatus = getOrderLineLineStatus(line)
    const matchesKeyword =
      keyword.length === 0 ||
      [
        getOrderLineGoodsNo(line),
        line.name,
        line.sourceProduct?.sourceProductName,
        customer?.name,
        customer?.phone,
        purchase?.purchaseNo,
        purchase?.platformOrderNo
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    const matchesStatus = filters.status === 'all' || lineStatus === filters.status
    const matchesOwner = filters.owner.trim().length === 0 || owner.includes(filters.owner.trim())
    const matchesCategory = filters.category === 'all' || line.category === filters.category
    const lineIsUrgent = Boolean(line.isUrgent || line.priority === 'urgent' || line.priority === 'vip')
    const matchesUrgent = filters.urgent === 'all' || (filters.urgent === 'yes' ? lineIsUrgent : !lineIsUrgent)
    const matchesAfterSales = filters.afterSales === 'all' || (filters.afterSales === 'yes' ? hasActiveAfterSales : !hasActiveAfterSales)
    const matchesOverdue = filters.overdue === 'all' || (filters.overdue === 'yes' ? overdue : !overdue)
    const matchesFactory = factoryKeyword.length === 0 || factoryText.includes(factoryKeyword)
    const matchesPurchase = purchaseKeyword.length === 0 || purchaseText.includes(purchaseKeyword)
    const matchesCustomer = customerKeyword.length === 0 || customerText.includes(customerKeyword)
    const matchesQuickView =
      filters.quickView === 'all' ||
      (filters.quickView === 'after_sales' && hasActiveAfterSales) ||
      (filters.quickView in orderLineLineStatusLabelMap && lineStatus === filters.quickView)

    return (
      matchesKeyword &&
      matchesStatus &&
      matchesOwner &&
      matchesCategory &&
      matchesUrgent &&
      matchesAfterSales &&
      matchesOverdue &&
      matchesFactory &&
      matchesPurchase &&
      matchesCustomer &&
      matchesQuickView
    )
  })

export const buildOrderLineStatusLog = ({
  line,
  purchase,
  nextStatus,
  operatorName = '系统用户'
}: {
  line: OrderLine
  purchase?: Purchase
  nextStatus: OrderLineLineStatus | string
  operatorName?: string
}): OrderLineLog => {
  const fromStatus = getOrderLineLineStatus(line)
  const toStatus = String(nextStatus)

  return {
    id: `log-${line.id}-${Date.now()}`,
    orderLineId: line.id,
    purchaseId: getOrderLinePurchaseId(line, purchase),
    actionType: 'status_changed',
    actionLabel: '状态变更',
    operatorName,
    createdAt: formatDateTime(new Date()),
    fromStatus,
    toStatus,
    note: `将销售 ${getOrderLineGoodsNo(line)} 从「${getStatusLabel(fromStatus)}」改为「${getStatusLabel(toStatus)}」`
  }
}

export const buildOrderLineDetailsDraft = (line: OrderLine): OrderLineDetailsDraft => ({
  productionTaskNo: getOrderLineGoodsNo(line, ''),
  name: getOrderLineDisplayName(line),
  versionNo: line.versionNo || '',
  category: line.category || 'other',
  selectedSpecValue: line.selectedSpecValue || '',
  selectedMaterial: line.selectedMaterial || line.actualRequirements?.material || '',
  selectedProcess: line.selectedProcess || line.actualRequirements?.process || '',
  selectedSpecialOptionsText: (line.selectedSpecialOptions || line.actualRequirements?.specialNotes || []).join(' / '),
  engraveText: line.actualRequirements?.engraveText || '',
  engraveImageFiles: line.actualRequirements?.engraveImageFiles ?? [],
  engravePltFiles: line.actualRequirements?.engravePltFiles ?? [],
  customerRemark: line.actualRequirements?.remark || '',
  priority: line.priority || 'normal',
  requiresDesign: Boolean(line.requiresDesign ?? line.designInfo?.requiresRemodeling),
  requiresModeling: Boolean(line.requiresModeling ?? line.designInfo?.requiresRemodeling),
  requiresWax: Boolean(line.requiresWax ?? line.designInfo?.waxFileUrl),
  designStatus: getOrderLineDesignStatus(line),
  modelingStatus: getOrderLineModelingStatus(line),
  assignedDesignerId: line.assignedDesignerId || '',
  assignedModelerId: line.assignedModelerId || '',
  assignedDesignerName: line.designInfo?.assignedDesigner || '',
  modelingFiles: line.modelingFiles ?? [],
  waxFiles: line.waxFiles ?? [],
  designNote: line.designInfo?.designNote || '',
  currentOwner: line.currentOwner || '',
  promisedDate: line.promisedDate || ''
})

export const applyOrderLineDetailsDraft = (line: OrderLine, draft: OrderLineDetailsDraft): OrderLine => {
  const selectedSpecialOptions = splitTextList(draft.selectedSpecialOptionsText)
  const selectedMaterial = draft.selectedMaterial.trim()
  const selectedProcess = draft.selectedProcess.trim()
  const selectedSpecValue = draft.selectedSpecValue.trim()
  const displayName = draft.name.trim() || getOrderLineDisplayName(line)

  const nextLineStatus = draft.requiresDesign
    ? getOrderLineLineStatus(line)
    : getOrderLineLineStatus(line) === 'pending_design'
      ? 'pending_merchandiser_review'
      : getOrderLineLineStatus(line)

  return {
    ...line,
    lineStatus: nextLineStatus,
    productionTaskNo: draft.productionTaskNo.trim() || undefined,
    name: displayName,
    versionNo: draft.versionNo.trim() || undefined,
    category: draft.category as ProductCategory,
    currentOwner: draft.currentOwner.trim() || undefined,
    promisedDate: draft.promisedDate || undefined,
    priority: draft.priority,
    isUrgent: draft.priority === 'urgent' || draft.priority === 'vip',
    requiresDesign: draft.requiresDesign,
    requiresModeling: draft.requiresModeling,
    requiresWax: draft.requiresWax,
    designStatus: draft.designStatus,
    modelingStatus: draft.modelingStatus,
    assignedDesignerId: draft.assignedDesignerId.trim() || undefined,
    assignedModelerId: draft.assignedModelerId.trim() || undefined,
    modelingFiles: draft.modelingFiles.length > 0 ? draft.modelingFiles : undefined,
    waxFiles: draft.waxFiles.length > 0 ? draft.waxFiles : undefined,
    selectedSpecValue: selectedSpecValue || undefined,
    selectedMaterial: selectedMaterial || undefined,
    selectedProcess: selectedProcess || undefined,
    selectedSpecialOptions: selectedSpecialOptions.length > 0 ? selectedSpecialOptions : undefined,
    actualRequirements: {
      ...line.actualRequirements,
      material: selectedMaterial || undefined,
      process: selectedProcess || undefined,
      engraveText: draft.engraveText.trim() || undefined,
      engraveImageFiles: draft.engraveImageFiles.length > 0 ? draft.engraveImageFiles : undefined,
      engravePltFiles: draft.engravePltFiles.length > 0 ? draft.engravePltFiles : undefined,
      specialNotes: selectedSpecialOptions.length > 0 ? selectedSpecialOptions : undefined,
      remark: draft.customerRemark.trim() || undefined
    },
    designInfo: {
      ...line.designInfo,
      requiresRemodeling: draft.requiresModeling,
      designStatus: draft.requiresDesign ? draft.designStatus : 'not_required',
      assignedDesigner: draft.assignedDesignerName.trim() || undefined,
      modelingFileUrl: draft.modelingFiles[0]?.url || line.designInfo?.modelingFileUrl || undefined,
      waxFileUrl: draft.waxFiles[0]?.url || line.designInfo?.waxFileUrl || undefined,
      designNote: draft.designNote.trim() || undefined
    }
  }
}

export const buildOrderLineDetailsLog = ({
  line,
  purchase,
  operatorName = '系统用户'
}: {
  line: OrderLine
  purchase?: Purchase
  operatorName?: string
}): OrderLineLog => ({
  id: `log-${line.id}-details-${Date.now()}`,
  orderLineId: line.id,
  purchaseId: getOrderLinePurchaseId(line, purchase),
  actionType: 'order_line_updated',
  actionLabel: '编辑销售需求',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: '修改了销售定制参数'
})

export const buildOrderLineDesignModelingDraft = (line: OrderLine): OrderLineDesignModelingDraft => ({
  designStatus: getOrderLineDesignStatus(line),
  modelingStatus: getOrderLineModelingStatus(line),
  assignedDesignerId: line.assignedDesignerId || '',
  assignedModelerId: line.assignedModelerId || '',
  assignedDesignerName: line.designInfo?.assignedDesigner || '',
  modelingFiles: line.modelingFiles ?? [],
  waxFiles: line.waxFiles ?? [],
  designNote: line.designInfo?.designNote || ''
})

export const applyOrderLineDesignModelingDraft = (line: OrderLine, draft: OrderLineDesignModelingDraft): OrderLine => ({
  ...line,
  designStatus: draft.designStatus,
  modelingStatus: draft.modelingStatus,
  assignedDesignerId: draft.assignedDesignerId.trim() || undefined,
  assignedModelerId: draft.assignedModelerId.trim() || undefined,
  modelingFiles: draft.modelingFiles.length > 0 ? draft.modelingFiles : undefined,
  waxFiles: draft.waxFiles.length > 0 ? draft.waxFiles : undefined,
  designInfo: {
    ...line.designInfo,
    designStatus: draft.designStatus,
    assignedDesigner: draft.assignedDesignerName.trim() || undefined,
    modelingFileUrl: draft.modelingFiles[0]?.url || line.designInfo?.modelingFileUrl || undefined,
    waxFileUrl: draft.waxFiles[0]?.url || line.designInfo?.waxFileUrl || undefined,
    designNote: draft.designNote.trim() || undefined
  }
})

export const buildOrderLineDesignModelingLog = ({
  line,
  purchase,
  operatorName = '系统用户'
}: {
  line: OrderLine
  purchase?: Purchase
  operatorName?: string
}): OrderLineLog => ({
  id: `log-${line.id}-design-modeling-${Date.now()}`,
  orderLineId: line.id,
  purchaseId: getOrderLinePurchaseId(line, purchase),
  actionType: 'design_modeling_updated',
  actionLabel: '编辑设计建模',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: '修改了销售设计建模信息'
})

export const buildOrderLineOutsourceDraft = (line: OrderLine): OrderLineOutsourceDraft => ({
  followUpOwner: line.currentOwner || '',
  supplierName: line.outsourceInfo?.supplierName || '',
  outsourcedAt: line.outsourceInfo?.outsourcedAt || '',
  productionTaskNo: getOrderLineGoodsNo(line, ''),
  plannedDeliveryDate: line.outsourceInfo?.plannedDeliveryDate || line.expectedDate || '',
  outsourceNote: line.outsourceInfo?.outsourceNote || '',
  outsourceStatus: line.outsourceInfo?.outsourceStatus || 'pending'
})

export const applyOrderLineOutsourceDraft = (line: OrderLine, draft: OrderLineOutsourceDraft): OrderLine => ({
  ...line,
  currentOwner: draft.followUpOwner.trim() || undefined,
  productionTaskNo: draft.productionTaskNo.trim() || undefined,
  merchandiserId: draft.followUpOwner.trim() || line.merchandiserId,
  factoryId: draft.supplierName.trim() || line.factoryId,
  factoryPlannedDueDate: draft.plannedDeliveryDate || line.factoryPlannedDueDate,
  productionSentAt: draft.outsourcedAt || line.productionSentAt,
  productionStatus: draft.outsourceStatus === 'in_progress' ? 'in_production' : draft.outsourceStatus === 'pending' ? 'pending_dispatch' : line.productionStatus,
  outsourceInfo: {
    ...line.outsourceInfo,
    outsourceStatus: draft.outsourceStatus,
    supplierName: draft.supplierName.trim() || undefined,
    outsourcedAt: draft.outsourcedAt || undefined,
    plannedDeliveryDate: draft.plannedDeliveryDate || undefined,
    outsourceNote: draft.outsourceNote.trim() || undefined
  }
})

export const buildOrderLineOutsourceLog = ({
  line,
  purchase,
  operatorName = '系统用户'
}: {
  line: OrderLine
  purchase?: Purchase
  operatorName?: string
}): OrderLineLog => ({
  id: `log-${line.id}-outsource-${Date.now()}`,
  orderLineId: line.id,
  purchaseId: getOrderLinePurchaseId(line, purchase),
  actionType: 'outsource_info_updated',
  actionLabel: '编辑跟单 / 下厂信息',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: '修改了销售跟单 / 下厂信息'
})

export const buildOrderLineProductionDraft = (line: OrderLine): OrderLineProductionDraft => ({
  factoryStatus: line.productionInfo?.factoryStatus || 'not_started',
  actualMaterial: line.productionInfo?.actualMaterial || line.actualRequirements?.material || line.selectedMaterial || '',
  totalWeight: getProductionTotalWeight(line),
  netWeight: line.productionInfo?.netWeight || '',
  mainStoneInfo: line.productionInfo?.mainStoneInfo || '',
  sideStoneInfo: line.productionInfo?.sideStoneInfo || '',
  laborCostDetail: line.productionInfo?.laborCostDetail || '',
  factoryShippedAt: line.productionInfo?.factoryShippedAt || '',
  qualityResult: line.productionInfo?.qualityResult || '',
  factoryNote: line.productionInfo?.factoryNote || ''
})

export const applyOrderLineProductionDraft = (line: OrderLine, draft: OrderLineProductionDraft): OrderLine => {
  const totalWeight = draft.totalWeight.trim()
  const nextFactoryStatus = draft.factoryStatus === 'completed' ? 'returned' : draft.factoryStatus === 'issue' ? 'abnormal' : draft.factoryStatus === 'in_progress' || draft.factoryStatus === 'pending_feedback' ? 'in_production' : line.factoryStatus
  const nextLineStatus = draft.factoryStatus === 'completed' ? 'pending_finance_confirmation' : draft.factoryStatus === 'issue' ? getOrderLineLineStatus(line) : getOrderLineLineStatus(line)
  const nextProductionStatus = draft.factoryStatus === 'completed' ? 'completed' : draft.factoryStatus === 'issue' ? 'blocked' : draft.factoryStatus === 'in_progress' || draft.factoryStatus === 'pending_feedback' ? 'in_production' : line.productionStatus

  return {
    ...line,
    lineStatus: nextLineStatus,
    factoryStatus: nextFactoryStatus,
    productionStatus: nextProductionStatus,
    financeStatus: draft.factoryStatus === 'completed' ? 'pending' : line.financeStatus,
    productionCompletedAt: draft.factoryStatus === 'completed' ? draft.factoryShippedAt || line.productionCompletedAt : line.productionCompletedAt,
    productionInfo: {
      ...line.productionInfo,
      factoryStatus: draft.factoryStatus,
      actualMaterial: draft.actualMaterial.trim() || undefined,
      totalWeight: totalWeight || undefined,
      netWeight: draft.netWeight.trim() || undefined,
      mainStoneInfo: draft.mainStoneInfo.trim() || undefined,
      sideStoneInfo: draft.sideStoneInfo.trim() || undefined,
      laborCostDetail: draft.laborCostDetail.trim() || undefined,
      factoryShippedAt: draft.factoryShippedAt || undefined,
      qualityResult: draft.qualityResult.trim() || undefined,
      factoryNote: draft.factoryNote.trim() || undefined
    }
  }
}

export const buildOrderLineProductionLog = ({
  line,
  purchase,
  operatorName = '系统用户'
}: {
  line: OrderLine
  purchase?: Purchase
  operatorName?: string
}): OrderLineLog => ({
  id: `log-${line.id}-production-${Date.now()}`,
  orderLineId: line.id,
  purchaseId: getOrderLinePurchaseId(line, purchase),
  actionType: 'production_info_updated',
  actionLabel: '编辑工厂回传信息',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: '修改了销售工厂回传信息'
})

export const buildOrderLineLogisticsLog = ({
  line,
  purchase,
  record,
  operatorName = '系统用户'
}: {
  line: OrderLine
  purchase?: Purchase
  record: LogisticsRecord
  operatorName?: string
}): OrderLineLog => ({
  id: `log-${line.id}-logistics-${Date.now()}`,
  orderLineId: line.id,
  purchaseId: getOrderLinePurchaseId(line, purchase),
  actionType: 'logistics_created',
  actionLabel: '新增物流',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: `为销售 ${getOrderLineGoodsNo(line)} 新增${logisticsTypeLabelMap[record.logisticsType || 'goods']}物流 ${record.trackingNo || '无单号'}`
})

export const buildOrderLineLogisticsDraft = (record?: LogisticsRecord): OrderLineLogisticsDraft => ({
  logisticsType: record?.logisticsType || 'goods',
  direction: record?.direction || 'outbound',
  company: record?.company || '',
  trackingNo: record?.trackingNo || '',
  shippedAt: record?.shippedAt || '',
  signedAt: record?.signedAt || '',
  remark: record?.remark || ''
})

export const buildOrderLineLogisticsRecord = ({
  line,
  purchase,
  draft
}: {
  line: OrderLine
  purchase?: Purchase
  draft: OrderLineLogisticsDraft
}): LogisticsRecord => ({
  id: `logistics-${line.id}-${Date.now()}`,
  orderLineId: line.id,
  purchaseId: getOrderLinePurchaseId(line, purchase),
  recordStatus: 'active',
  logisticsType: draft.logisticsType,
  direction: draft.direction,
  company: draft.company,
  trackingNo: draft.trackingNo,
  shippedAt: draft.shippedAt,
  signedAt: draft.signedAt,
  remark: draft.remark
})

export const addLogisticsRecord = (records: LogisticsRecord[], record: LogisticsRecord) => [record, ...records]

const applyOrderLineLogisticsDraft = (record: LogisticsRecord, draft: OrderLineLogisticsDraft): LogisticsRecord => ({
  ...record,
  logisticsType: draft.logisticsType,
  direction: draft.direction,
  company: draft.company.trim() || undefined,
  trackingNo: draft.trackingNo.trim() || undefined,
  shippedAt: draft.shippedAt || undefined,
  signedAt: draft.signedAt || undefined,
  remark: draft.remark.trim() || undefined
})

export const updateLogisticsRecordInList = (records: LogisticsRecord[], recordId: string, draft: OrderLineLogisticsDraft) =>
  records.map((record) => (record.id === recordId ? applyOrderLineLogisticsDraft(record, draft) : record))

export const voidLogisticsRecordInList = (records: LogisticsRecord[], recordId: string, voidReason: string, voidedAt = formatDateTime(new Date())) =>
  records.map((record) =>
    record.id === recordId
      ? {
          ...record,
          recordStatus: 'voided' as const,
          voidedAt,
          voidReason: voidReason.trim() || '未填写作废原因'
        }
      : record
  )

export const buildOrderLineLogisticsEditLog = ({
  line,
  purchase,
  record,
  operatorName = '系统用户'
}: {
  line: OrderLine
  purchase?: Purchase
  record: LogisticsRecord
  operatorName?: string
}): OrderLineLog => ({
  id: `log-${line.id}-logistics-edit-${Date.now()}`,
  orderLineId: line.id,
  purchaseId: getOrderLinePurchaseId(line, purchase),
  actionType: 'logistics_updated',
  actionLabel: '编辑物流',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: `编辑了销售 ${getOrderLineGoodsNo(line)} 的物流记录 ${record.trackingNo || record.id}`
})

export const buildOrderLineLogisticsVoidLog = ({
  line,
  purchase,
  record,
  voidReason,
  operatorName = '系统用户'
}: {
  line: OrderLine
  purchase?: Purchase
  record: LogisticsRecord
  voidReason: string
  operatorName?: string
}): OrderLineLog => ({
  id: `log-${line.id}-logistics-void-${Date.now()}`,
  orderLineId: line.id,
  purchaseId: getOrderLinePurchaseId(line, purchase),
  actionType: 'logistics_voided',
  actionLabel: '作废物流',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: `作废了销售 ${getOrderLineGoodsNo(line)} 的物流记录 ${record.trackingNo || record.id}：${voidReason.trim() || '未填写作废原因'}`
})

export const buildOrderLineAfterSalesLog = ({
  line,
  purchase,
  record,
  operatorName = '系统用户'
}: {
  line: OrderLine
  purchase?: Purchase
  record: AfterSalesCase
  operatorName?: string
}): OrderLineLog => ({
  id: `log-${line.id}-after-sales-${Date.now()}`,
  orderLineId: line.id,
  purchaseId: getOrderLinePurchaseId(line, purchase),
  actionType: 'after_sales_created',
  actionLabel: '新增售后',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: `为销售 ${getOrderLineGoodsNo(line)} 新增${getAfterSalesTypeLabel(record.type)}售后：${getAfterSalesReason(record)}`
})

export const buildOrderLineAfterSalesCase = ({
  line,
  purchase,
  draft
}: {
  line: OrderLine
  purchase?: Purchase
  draft: OrderLineAfterSalesDraft
}): AfterSalesCase => ({
  id: `after-sales-${line.id}-${Date.now()}`,
  orderLineId: line.id,
  purchaseId: getOrderLinePurchaseId(line, purchase),
  customerId: line.customerId || purchase?.customerId,
  type: draft.type,
  reason: draft.reason,
  status: draft.status,
  responsibleParty: draft.responsibleParty,
  createdAt: draft.createdAt,
  closedAt: draft.closedAt,
  remark: draft.remark
})

export const addAfterSalesCase = (records: AfterSalesCase[], record: AfterSalesCase) => [record, ...records]

export const buildOrderLineAfterSalesDraft = (record?: AfterSalesCase): OrderLineAfterSalesDraft => ({
  type: record?.type || 'repair',
  reason: record?.reason || '',
  status: record?.status || 'open',
  responsibleParty: record?.responsibleParty || '王客服',
  createdAt: record?.createdAt || '',
  closedAt: record?.closedAt || '',
  remark: record?.remark || ''
})

const applyOrderLineAfterSalesDraft = (record: AfterSalesCase, draft: OrderLineAfterSalesDraft): AfterSalesCase => ({
  ...record,
  type: draft.type,
  reason: draft.reason.trim() || undefined,
  status: draft.status,
  responsibleParty: draft.responsibleParty.trim() || undefined,
  createdAt: draft.createdAt || undefined,
  closedAt: draft.closedAt || undefined,
  remark: draft.remark.trim() || undefined
})

export const updateAfterSalesCaseInList = (records: AfterSalesCase[], recordId: string, draft: OrderLineAfterSalesDraft) =>
  records.map((record) => (record.id === recordId ? applyOrderLineAfterSalesDraft(record, draft) : record))

export const closeAfterSalesCaseInList = (records: AfterSalesCase[], recordId: string, closedAt = formatDateTime(new Date())) =>
  records.map((record) => (record.id === recordId ? { ...record, status: 'closed' as const, closedAt } : record))

export const buildOrderLineAfterSalesEditLog = ({
  line,
  purchase,
  record,
  operatorName = '系统用户'
}: {
  line: OrderLine
  purchase?: Purchase
  record: AfterSalesCase
  operatorName?: string
}): OrderLineLog => ({
  id: `log-${line.id}-after-sales-edit-${Date.now()}`,
  orderLineId: line.id,
  purchaseId: getOrderLinePurchaseId(line, purchase),
  actionType: 'after_sales_updated',
  actionLabel: '编辑售后',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: `编辑了销售 ${getOrderLineGoodsNo(line)} 的售后记录：${getAfterSalesReason(record)}`
})

export const buildOrderLineAfterSalesCloseLog = ({
  line,
  purchase,
  record,
  operatorName = '系统用户'
}: {
  line: OrderLine
  purchase?: Purchase
  record: AfterSalesCase
  operatorName?: string
}): OrderLineLog => ({
  id: `log-${line.id}-after-sales-close-${Date.now()}`,
  orderLineId: line.id,
  purchaseId: getOrderLinePurchaseId(line, purchase),
  actionType: 'after_sales_closed',
  actionLabel: '关闭售后',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: `关闭了销售 ${getOrderLineGoodsNo(line)} 的售后记录：${getAfterSalesReason(record)}`
})
