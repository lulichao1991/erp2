import { useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SourceProductDrawer, type SourceProductCompareValue } from '@/components/business/sourceProduct'
import { EmptyState, InfoField, InfoGrid, RecordTimeline, RiskTag, SectionCard, SideDrawer, StatusTag, TimePressureBadge, VersionBadge } from '@/components/common'
import { afterSalesMock, customersMock, logisticsMock, purchasesMock } from '@/mocks'
import { mockProducts } from '@/mocks/products'
import type { OrderLine, OrderLineLog, OrderLineOutsourceStatus, OrderLinePriority, OrderLineStatus } from '@/types/order-line'
import type { ProductCategory } from '@/types/product'
import type { Purchase } from '@/types/purchase'
import type { AfterSalesCase, AfterSalesCaseStatus, AfterSalesCaseType, LogisticsDirection, LogisticsRecord, LogisticsType } from '@/types/supporting-records'

export type OrderLineCenterFilters = {
  keyword: string
  status: 'all' | OrderLineStatus | string
  owner: string
}

export type OrderLineRow = {
  line: OrderLine
  purchase?: Purchase
}

export type OrderLineStatusUpdateHandler = (lineId: string, nextStatus: OrderLineStatus | string) => void

export type OrderLineDetailsDraft = {
  name: string
  category: ProductCategory | string
  selectedSpecValue: string
  specNote: string
  selectedMaterial: string
  selectedProcess: string
  selectedSpecialOptionsText: string
  sizeNote: string
  engraveText: string
  customerRemark: string
  productionRemark: string
  priority: OrderLinePriority
  requiresDesign: boolean
  currentOwner: string
  promisedDate: string
}

export type OrderLineDetailsUpdateHandler = (lineId: string, draft: OrderLineDetailsDraft) => void

export type OrderLineOutsourceDraft = {
  followUpOwner: string
  supplierName: string
  outsourcedAt: string
  itemSku: string
  plannedDeliveryDate: string
  outsourceNote: string
  outsourceStatus: OrderLineOutsourceStatus | string
}

export type OrderLineOutsourceUpdateHandler = (lineId: string, draft: OrderLineOutsourceDraft) => void

export type OrderLineLogisticsDraft = {
  logisticsType: LogisticsType
  direction: LogisticsDirection
  company: string
  trackingNo: string
  shippedAt: string
  signedAt: string
  remark: string
}

export type OrderLineLogisticsCreateHandler = (record: LogisticsRecord) => void

export type OrderLineAfterSalesDraft = {
  type: AfterSalesCaseType
  reason: string
  status: AfterSalesCaseStatus
  responsibleParty: string
  createdAt: string
  closedAt: string
  remark: string
}

export type OrderLineAfterSalesCreateHandler = (record: AfterSalesCase) => void

const statusLabelMap: Record<string, string> = {
  draft: '草稿',
  pending_confirm: '待确认',
  pending_measurement: '待测量',
  pending_design: '待设计',
  designing: '设计中',
  pending_outsource: '待下厂',
  in_production: '生产中',
  pending_factory_feedback: '待工厂回传',
  pending_shipment: '待发货',
  shipped: '已发货',
  after_sales: '售后中',
  completed: '已完成',
  cancelled: '已取消',
  exception: '异常'
}

export const orderLineStatusOptions: Array<{ value: OrderLineStatus | string; label: string }> = [
  { value: 'pending_confirm', label: '待确认' },
  { value: 'pending_measurement', label: '待测量' },
  { value: 'pending_design', label: '待设计' },
  { value: 'designing', label: '设计中' },
  { value: 'pending_outsource', label: '待下厂' },
  { value: 'in_production', label: '生产中' },
  { value: 'pending_factory_feedback', label: '待工厂回传' },
  { value: 'pending_shipment', label: '待发货' },
  { value: 'shipped', label: '已发货' },
  { value: 'after_sales', label: '售后中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'exception', label: '异常' }
]

const statusFilterOptions = [{ value: 'all', label: '全部状态' }, ...orderLineStatusOptions]

const categoryOptions: Array<{ value: ProductCategory; label: string }> = [
  { value: 'ring', label: '戒指' },
  { value: 'pendant', label: '吊坠' },
  { value: 'necklace', label: '项链' },
  { value: 'earring', label: '耳饰' },
  { value: 'bracelet', label: '手链' },
  { value: 'other', label: '其他' }
]

const priorityOptions: Array<{ value: OrderLinePriority; label: string }> = [
  { value: 'normal', label: '否' },
  { value: 'high', label: '高优先' },
  { value: 'urgent', label: '加急' },
  { value: 'vip', label: 'VIP' }
]

const outsourceStatusOptions: Array<{ value: OrderLineOutsourceStatus | string; label: string }> = [
  { value: 'not_required', label: '不需要下厂' },
  { value: 'pending', label: '待下厂' },
  { value: 'in_progress', label: '生产中' },
  { value: 'delivered', label: '已回货' },
  { value: 'rework', label: '返工中' }
]

const categoryLabelMap = Object.fromEntries(categoryOptions.map((item) => [item.value, item.label])) as Record<string, string>
const outsourceStatusLabelMap = Object.fromEntries(outsourceStatusOptions.map((item) => [item.value, item.label])) as Record<string, string>

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')

const formatDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const getStatusLabel = (status?: string) => (status ? statusLabelMap[status] || status : '待确认')

const logisticsTypeLabelMap: Record<LogisticsType, string> = {
  measurement_tool: '量尺工具',
  goods: '货品',
  after_sales: '售后',
  other: '其他'
}

const logisticsDirectionLabelMap: Record<LogisticsDirection, string> = {
  outbound: '发出',
  return: '退回'
}

const defaultLogisticsDraft: OrderLineLogisticsDraft = {
  logisticsType: 'goods',
  direction: 'outbound',
  company: '',
  trackingNo: '',
  shippedAt: '',
  signedAt: '',
  remark: ''
}

const getLogisticsCompany = (record: LogisticsRecord) => record.company || record.carrier || '未填写承运商'
const getLogisticsRemark = (record: LogisticsRecord) => record.remark || record.note || '—'
const getLogisticsSignedAt = (record: LogisticsRecord) => record.signedAt || record.deliveredAt || ''

const afterSalesStatusLabelMap: Record<string, string> = {
  open: '待处理',
  processing: '处理中',
  in_progress: '处理中',
  waiting_return: '待寄回',
  resolved: '已解决',
  closed: '已关闭'
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

const defaultAfterSalesDraft: OrderLineAfterSalesDraft = {
  type: 'repair',
  reason: '',
  status: 'open',
  responsibleParty: '王客服',
  createdAt: '',
  closedAt: '',
  remark: ''
}

const activeAfterSalesStatuses = new Set(['open', 'processing', 'in_progress', 'waiting_return'])

const isActiveAfterSalesCase = (record?: AfterSalesCase) => Boolean(record?.status && activeAfterSalesStatuses.has(record.status))

const findCurrentAfterSalesCase = (records: AfterSalesCase[], orderLineId: string) =>
  records.find((item) => item.orderLineId === orderLineId && isActiveAfterSalesCase(item)) || records.find((item) => item.orderLineId === orderLineId)

const getAfterSalesReason = (record: AfterSalesCase) => record.reason || record.remark || record.note || '—'
const getAfterSalesRemark = (record: AfterSalesCase) => record.remark || record.note || '—'

const designStatusLabelMap: Record<string, string> = {
  not_required: '不需要设计',
  pending: '待设计',
  in_progress: '设计中',
  completed: '已完成',
  delivered: '已交付',
  rework: '返工中'
}

const factoryStatusLabelMap: Record<string, string> = {
  not_started: '未开始',
  in_progress: '生产中',
  pending_feedback: '待回传',
  completed: '已完成',
  issue: '异常'
}

const getDesignStatusLabel = (status?: string) => (status ? designStatusLabelMap[status] || status : '待确认')
const getFactoryStatusLabel = (status?: string) => (status ? factoryStatusLabelMap[status] || status : '待确认')
const getAfterSalesStatusLabel = (status?: string) => (status ? afterSalesStatusLabelMap[status] || status : '待处理')
const getAfterSalesTypeLabel = (type?: string) => (type ? afterSalesTypeLabelMap[type] || type : '未分类')

const getTimePressure = (promisedDate?: string) => {
  if (!promisedDate) {
    return { label: '待确认交期', variant: 'normal' as const, overdue: false }
  }

  const promised = new Date(`${promisedDate}T23:59:59`)
  const now = new Date()
  const diffDays = Math.ceil((promised.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { label: `已超时 ${Math.abs(diffDays)} 天`, variant: 'overdue' as const, overdue: true }
  }

  if (diffDays <= 3) {
    return { label: `剩余 ${diffDays} 天`, variant: 'dueSoon' as const, overdue: false }
  }

  return { label: `剩余 ${diffDays} 天`, variant: 'normal' as const, overdue: false }
}

const getParameterSummary = (line: OrderLine) =>
  [
    line.selectedSpecValue ? `规格 ${line.selectedSpecValue}` : null,
    line.selectedMaterial ? `材质 ${line.selectedMaterial}` : line.actualRequirements?.material ? `材质 ${line.actualRequirements.material}` : null,
    line.selectedProcess ? `工艺 ${line.selectedProcess}` : line.actualRequirements?.process ? `工艺 ${line.actualRequirements.process}` : null,
    line.actualRequirements?.sizeNote ? `尺寸 ${line.actualRequirements.sizeNote}` : null
  ]
    .filter(Boolean)
    .join(' / ') || '待补充参数'

const getFactorySummary = (line: OrderLine) =>
  line.outsourceInfo?.supplierName && line.outsourceInfo.supplierName !== '待定' ? line.outsourceInfo.supplierName : '待确认工厂'

const getOutsourceStatusLabel = (status?: string) => (status ? outsourceStatusLabelMap[status] || status : '待确认')

const getLineRiskLabels = (line: OrderLine, afterSalesCases: AfterSalesCase[] = afterSalesMock) => {
  const hasOpenAfterSales = afterSalesCases.some((item) => item.orderLineId === line.id && isActiveAfterSalesCase(item))
  const pressure = getTimePressure(line.promisedDate)

  return [
    hasOpenAfterSales ? '售后跟进' : null,
    pressure.overdue ? '已超时' : null,
    line.priority === 'urgent' ? '加急' : null,
    line.priority === 'vip' ? 'VIP' : null
  ].filter((item): item is string => Boolean(item))
}

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && Boolean(target.closest('a, button, input, select, textarea, label'))

const splitTextList = (value: string) =>
  value
    .split(/[,，/、\n]/)
    .map((item) => item.trim())
    .filter(Boolean)

const TextList = ({ values, empty = '—' }: { values?: string[]; empty?: string }) => (values && values.length > 0 ? values.join(' / ') : empty)

const buildOrderLineSourceProductCompareValue = (line: OrderLine): SourceProductCompareValue => ({
  sourceLabel: `${line.lineCode || line.id} ${line.name}`,
  specValue: line.selectedSpecValue || line.sourceProduct?.sourceSpecValue,
  material: line.selectedMaterial || line.actualRequirements?.material,
  process: line.selectedProcess || line.actualRequirements?.process,
  specialOptions: line.selectedSpecialOptions
})

const DetailSection = ({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) => (
  <SectionCard title={title} actions={actions} className="compact-card">
    {children}
  </SectionCard>
)

export const buildOrderLineStatusLog = ({
  line,
  purchase,
  nextStatus,
  operatorName = '系统用户'
}: {
  line: OrderLine
  purchase?: Purchase
  nextStatus: OrderLineStatus | string
  operatorName?: string
}): OrderLineLog => {
  const fromStatus = String(line.status)
  const toStatus = String(nextStatus)

  return {
    id: `log-${line.id}-${Date.now()}`,
    orderLineId: line.id,
    purchaseId: line.purchaseId || line.transactionId || purchase?.id,
    actionType: 'status_changed',
    actionLabel: '状态变更',
    operatorName,
    createdAt: formatDateTime(new Date()),
    fromStatus,
    toStatus,
    note: `将商品行 ${line.lineCode || line.id} 从「${getStatusLabel(fromStatus)}」改为「${getStatusLabel(toStatus)}」`
  }
}

export const buildOrderLineDetailsDraft = (line: OrderLine): OrderLineDetailsDraft => ({
  name: line.name,
  category: line.category || 'other',
  selectedSpecValue: line.selectedSpecValue || '',
  specNote: line.actualRequirements?.specNote || line.selectedSpecSnapshot?.note || '',
  selectedMaterial: line.selectedMaterial || line.actualRequirements?.material || '',
  selectedProcess: line.selectedProcess || line.actualRequirements?.process || '',
  selectedSpecialOptionsText: (line.selectedSpecialOptions || line.actualRequirements?.specialNotes || []).join(' / '),
  sizeNote: line.actualRequirements?.sizeNote || '',
  engraveText: line.actualRequirements?.engraveText || '',
  customerRemark: line.actualRequirements?.remark || '',
  productionRemark: line.productionInfo?.factoryNote || line.outsourceInfo?.outsourceNote || '',
  priority: line.priority || 'normal',
  requiresDesign: Boolean(line.designInfo?.requiresRemodeling),
  currentOwner: line.currentOwner || '',
  promisedDate: line.promisedDate || ''
})

export const applyOrderLineDetailsDraft = (line: OrderLine, draft: OrderLineDetailsDraft): OrderLine => {
  const selectedSpecialOptions = splitTextList(draft.selectedSpecialOptionsText)
  const selectedMaterial = draft.selectedMaterial.trim()
  const selectedProcess = draft.selectedProcess.trim()
  const selectedSpecValue = draft.selectedSpecValue.trim()

  return {
    ...line,
    name: draft.name.trim() || line.name,
    category: draft.category as ProductCategory,
    currentOwner: draft.currentOwner.trim() || undefined,
    promisedDate: draft.promisedDate || undefined,
    priority: draft.priority,
    selectedSpecValue: selectedSpecValue || undefined,
    selectedMaterial: selectedMaterial || undefined,
    selectedProcess: selectedProcess || undefined,
    selectedSpecialOptions: selectedSpecialOptions.length > 0 ? selectedSpecialOptions : undefined,
    actualRequirements: {
      ...line.actualRequirements,
      material: selectedMaterial || undefined,
      process: selectedProcess || undefined,
      specNote: draft.specNote.trim() || undefined,
      sizeNote: draft.sizeNote.trim() || undefined,
      engraveText: draft.engraveText.trim() || undefined,
      specialNotes: selectedSpecialOptions.length > 0 ? selectedSpecialOptions : undefined,
      remark: draft.customerRemark.trim() || undefined
    },
    designInfo: {
      ...line.designInfo,
      requiresRemodeling: draft.requiresDesign,
      designStatus: draft.requiresDesign ? (line.designInfo?.designStatus === 'not_required' ? 'pending' : line.designInfo?.designStatus || 'pending') : 'not_required'
    },
    productionInfo: {
      ...line.productionInfo,
      factoryNote: draft.productionRemark.trim() || undefined
    }
  }
}

export const updateOrderLineDetailsInRows = <T extends OrderLineRow>(rows: T[], lineId: string, draft: OrderLineDetailsDraft): T[] =>
  rows.map((row) => (row.line.id === lineId ? ({ ...row, line: applyOrderLineDetailsDraft(row.line, draft) } as T) : row))

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
  purchaseId: line.purchaseId || line.transactionId || purchase?.id,
  actionType: 'order_line_updated',
  actionLabel: '编辑商品行需求',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: '修改了商品行基础信息 / 实际需求'
})

export const buildOrderLineOutsourceDraft = (line: OrderLine): OrderLineOutsourceDraft => ({
  followUpOwner: line.currentOwner || '',
  supplierName: line.outsourceInfo?.supplierName || '',
  outsourcedAt: line.outsourceInfo?.outsourcedAt || '',
  itemSku: line.itemSku || line.lineCode || '',
  plannedDeliveryDate: line.outsourceInfo?.plannedDeliveryDate || line.expectedDate || '',
  outsourceNote: line.outsourceInfo?.outsourceNote || '',
  outsourceStatus: line.outsourceInfo?.outsourceStatus || 'pending'
})

export const applyOrderLineOutsourceDraft = (line: OrderLine, draft: OrderLineOutsourceDraft): OrderLine => ({
  ...line,
  currentOwner: draft.followUpOwner.trim() || undefined,
  itemSku: draft.itemSku.trim() || undefined,
  outsourceInfo: {
    ...line.outsourceInfo,
    outsourceStatus: draft.outsourceStatus,
    supplierName: draft.supplierName.trim() || undefined,
    outsourcedAt: draft.outsourcedAt || undefined,
    plannedDeliveryDate: draft.plannedDeliveryDate || undefined,
    outsourceNote: draft.outsourceNote.trim() || undefined
  }
})

export const updateOrderLineOutsourceInfoInRows = <T extends OrderLineRow>(rows: T[], lineId: string, draft: OrderLineOutsourceDraft): T[] =>
  rows.map((row) => (row.line.id === lineId ? ({ ...row, line: applyOrderLineOutsourceDraft(row.line, draft) } as T) : row))

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
  purchaseId: line.purchaseId || line.transactionId || purchase?.id,
  actionType: 'outsource_info_updated',
  actionLabel: '编辑跟单 / 下厂信息',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: '修改了商品行跟单 / 下厂信息'
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
  purchaseId: line.purchaseId || line.transactionId || purchase?.id,
  actionType: 'logistics_created',
  actionLabel: '新增物流',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: `为商品行 ${line.lineCode || line.id} 新增${logisticsTypeLabelMap[record.logisticsType || 'goods']}物流 ${record.trackingNo || '无单号'}`
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
  purchaseId: line.purchaseId || line.transactionId || purchase?.id,
  transactionId: line.transactionId || purchase?.id,
  logisticsType: draft.logisticsType,
  direction: draft.direction,
  company: draft.company,
  carrier: draft.company,
  trackingNo: draft.trackingNo,
  shippedAt: draft.shippedAt,
  signedAt: draft.signedAt,
  remark: draft.remark,
  note: draft.remark
})

export const addLogisticsRecord = (records: LogisticsRecord[], record: LogisticsRecord) => [record, ...records]

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
  purchaseId: line.purchaseId || line.transactionId || purchase?.id,
  actionType: 'after_sales_created',
  actionLabel: '新增售后',
  operatorName,
  createdAt: formatDateTime(new Date()),
  note: `为商品行 ${line.lineCode || line.id} 新增${getAfterSalesTypeLabel(record.type)}售后：${getAfterSalesReason(record)}`
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
  purchaseId: line.purchaseId || line.transactionId || purchase?.id,
  transactionId: line.transactionId || purchase?.id,
  customerId: line.customerId || purchase?.customerId,
  type: draft.type,
  reason: draft.reason,
  status: draft.status,
  responsibleParty: draft.responsibleParty,
  createdAt: draft.createdAt,
  closedAt: draft.closedAt,
  remark: draft.remark,
  note: draft.remark
})

export const addAfterSalesCase = (records: AfterSalesCase[], record: AfterSalesCase) => [record, ...records]

const OrderLineStatusUpdatePanel = ({
  line,
  onStatusChange
}: {
  line: OrderLine
  onStatusChange?: OrderLineStatusUpdateHandler
}) => {
  const [nextStatus, setNextStatus] = useState(String(line.status))
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    setNextStatus(String(line.status))
  }, [line.id, line.status])

  useEffect(() => {
    setStatusMessage('')
  }, [line.id])

  const handleUpdate = () => {
    if (!onStatusChange) {
      setStatusMessage('当前入口暂不支持前端状态更新。')
      return
    }

    if (nextStatus === line.status) {
      setStatusMessage('状态未变化。')
      return
    }

    const previousLabel = getStatusLabel(String(line.status))
    const nextLabel = getStatusLabel(nextStatus)
    onStatusChange(line.id, nextStatus)
    setStatusMessage(`已将状态从 ${previousLabel} 更新为 ${nextLabel}`)
  }

  return (
    <DetailSection title="更新状态">
      <div className="field-grid three">
        <InfoField label="当前状态" value={<StatusTag value={getStatusLabel(String(line.status))} />} />
        <label className="field-control">
          <span className="field-label">目标状态</span>
          <select className="select" aria-label="目标状态" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
            {orderLineStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="field-control">
          <span className="field-label">操作</span>
          <button type="button" className="button primary small" onClick={handleUpdate} disabled={!onStatusChange}>
            更新状态
          </button>
        </div>
      </div>
      {statusMessage ? (
        <div role="status" className="success-alert spacer-top">
          {statusMessage}
        </div>
      ) : null}
    </DetailSection>
  )
}

const OrderLineLogSection = ({ logs }: { logs: OrderLineLog[] }) => {
  const sortedLogs = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <DetailSection title="操作日志">
      {sortedLogs.length > 0 ? (
        <RecordTimeline
          items={sortedLogs.map((log) => ({
            id: log.id,
            title: log.actionLabel,
            meta: `${log.createdAt} · ${log.operatorName}`,
            description:
              log.note ||
              (log.fromStatus || log.toStatus
                ? `状态：${log.fromStatus ? getStatusLabel(String(log.fromStatus)) : '—'} → ${log.toStatus ? getStatusLabel(String(log.toStatus)) : '—'}`
                : '—')
          }))}
        />
      ) : (
        <EmptyState title="暂无操作日志" description="当前商品行还没有记录操作。" />
      )}
    </DetailSection>
  )
}

const OrderLineDetailsSection = ({
  line,
  onUpdateLineDetails
}: {
  line: OrderLine
  onUpdateLineDetails?: OrderLineDetailsUpdateHandler
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<OrderLineDetailsDraft>(() => buildOrderLineDetailsDraft(line))
  const [message, setMessage] = useState('')

  useEffect(() => {
    setDraft(buildOrderLineDetailsDraft(line))
    setEditing(false)
    setMessage('')
  }, [line.id])

  const updateDraft = <K extends keyof OrderLineDetailsDraft>(field: K, value: OrderLineDetailsDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleEdit = () => {
    setDraft(buildOrderLineDetailsDraft(line))
    setMessage('')
    setEditing(true)
  }

  const handleCancel = () => {
    setDraft(buildOrderLineDetailsDraft(line))
    setEditing(false)
    setMessage('')
  }

  const handleSave = () => {
    if (!onUpdateLineDetails) {
      return
    }

    onUpdateLineDetails(line.id, draft)
    setEditing(false)
    setMessage('已保存商品行基础信息 / 实际需求')
  }

  return (
    <DetailSection
      title="基础信息 / 实际需求"
      actions={
        !editing ? (
          <button type="button" className="button ghost small" aria-label="编辑基础信息 / 实际需求" onClick={handleEdit} disabled={!onUpdateLineDetails}>
            编辑
          </button>
        ) : null
      }
    >
      {editing ? (
        <div className="stack">
          <div className="field-grid three">
            <label className="field-control">
              <span className="field-label">商品名称</span>
              <input className="input" value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">品类</span>
              <select className="select" value={draft.category} onChange={(event) => updateDraft('category', event.target.value)}>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">规格</span>
              <input className="input" value={draft.selectedSpecValue} onChange={(event) => updateDraft('selectedSpecValue', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">规格备注</span>
              <input className="input" value={draft.specNote} onChange={(event) => updateDraft('specNote', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">材质</span>
              <input className="input" value={draft.selectedMaterial} onChange={(event) => updateDraft('selectedMaterial', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">工艺</span>
              <input className="input" value={draft.selectedProcess} onChange={(event) => updateDraft('selectedProcess', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">特殊需求</span>
              <input className="input" value={draft.selectedSpecialOptionsText} onChange={(event) => updateDraft('selectedSpecialOptionsText', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">尺寸备注</span>
              <input className="input" value={draft.sizeNote} onChange={(event) => updateDraft('sizeNote', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">刻字 / 印记</span>
              <input className="input" value={draft.engraveText} onChange={(event) => updateDraft('engraveText', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">当前负责人</span>
              <input className="input" value={draft.currentOwner} onChange={(event) => updateDraft('currentOwner', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">承诺交期</span>
              <input className="input" value={draft.promisedDate} onChange={(event) => updateDraft('promisedDate', event.target.value)} placeholder="YYYY-MM-DD" />
            </label>
            <label className="field-control">
              <span className="field-label">是否加急</span>
              <select className="select" value={draft.priority} onChange={(event) => updateDraft('priority', event.target.value as OrderLinePriority)}>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">是否需要设计</span>
              <select className="select" value={draft.requiresDesign ? 'true' : 'false'} onChange={(event) => updateDraft('requiresDesign', event.target.value === 'true')}>
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">客服备注</span>
              <textarea className="textarea" value={draft.customerRemark} onChange={(event) => updateDraft('customerRemark', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">生产备注</span>
              <textarea className="textarea" value={draft.productionRemark} onChange={(event) => updateDraft('productionRemark', event.target.value)} />
            </label>
          </div>
          <div className="row">
            <button type="button" className="button primary small" onClick={handleSave}>
              保存需求
            </button>
            <button type="button" className="button secondary small" onClick={handleCancel}>
              取消编辑
            </button>
          </div>
        </div>
      ) : (
        <InfoGrid columns={3}>
          <InfoField label="商品名称" value={line.name} />
          <InfoField label="品类" value={categoryLabelMap[line.category || 'other'] || line.category || '其他'} />
          <InfoField label="规格" value={line.selectedSpecValue || '—'} />
          <InfoField label="规格备注" value={line.actualRequirements?.specNote || line.selectedSpecSnapshot?.note || '—'} />
          <InfoField label="材质" value={line.selectedMaterial || line.actualRequirements?.material || '—'} />
          <InfoField label="工艺" value={line.selectedProcess || line.actualRequirements?.process || '—'} />
          <InfoField label="特殊需求" value={<TextList values={line.selectedSpecialOptions || line.actualRequirements?.specialNotes} />} />
          <InfoField label="尺寸备注" value={line.actualRequirements?.sizeNote || '—'} />
          <InfoField label="刻字 / 印记" value={line.actualRequirements?.engraveText || '—'} />
          <InfoField label="客服备注" value={line.actualRequirements?.remark || '—'} />
          <InfoField label="生产备注" value={line.productionInfo?.factoryNote || line.outsourceInfo?.outsourceNote || '—'} />
          <InfoField label="是否加急" value={line.priority === 'urgent' ? '加急' : line.priority === 'vip' ? 'VIP' : line.priority === 'high' ? '高优先' : '否'} />
          <InfoField label="是否需要设计" value={line.designInfo?.requiresRemodeling ? '是' : '否'} />
          <InfoField label="当前负责人" value={line.currentOwner || '待分配'} />
          <InfoField label="承诺交期" value={line.promisedDate || '—'} />
        </InfoGrid>
      )}
      {message ? (
        <div role="status" className="success-alert spacer-top">
          {message}
        </div>
      ) : null}
    </DetailSection>
  )
}

const OrderLineOutsourceSection = ({
  line,
  onUpdateOutsourceInfo
}: {
  line: OrderLine
  onUpdateOutsourceInfo?: OrderLineOutsourceUpdateHandler
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<OrderLineOutsourceDraft>(() => buildOrderLineOutsourceDraft(line))
  const [message, setMessage] = useState('')

  useEffect(() => {
    setDraft(buildOrderLineOutsourceDraft(line))
    setEditing(false)
    setMessage('')
  }, [line.id])

  const updateDraft = <K extends keyof OrderLineOutsourceDraft>(field: K, value: OrderLineOutsourceDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleEdit = () => {
    setDraft(buildOrderLineOutsourceDraft(line))
    setMessage('')
    setEditing(true)
  }

  const handleCancel = () => {
    setDraft(buildOrderLineOutsourceDraft(line))
    setEditing(false)
    setMessage('')
  }

  const handleSave = () => {
    if (!onUpdateOutsourceInfo) {
      return
    }

    onUpdateOutsourceInfo(line.id, draft)
    setEditing(false)
    setMessage('已保存跟单 / 下厂信息')
  }

  return (
    <DetailSection
      title="跟单 / 下厂"
      actions={
        !editing ? (
          <button type="button" className="button ghost small" aria-label="编辑跟单 / 下厂信息" onClick={handleEdit} disabled={!onUpdateOutsourceInfo}>
            编辑
          </button>
        ) : null
      }
    >
      {editing ? (
        <div className="stack">
          <div className="field-grid three">
            <label className="field-control">
              <span className="field-label">跟单负责人</span>
              <input className="input" value={draft.followUpOwner} onChange={(event) => updateDraft('followUpOwner', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">工厂名称</span>
              <input className="input" value={draft.supplierName} onChange={(event) => updateDraft('supplierName', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">下厂时间</span>
              <input className="input" value={draft.outsourcedAt} onChange={(event) => updateDraft('outsourcedAt', event.target.value)} placeholder="YYYY-MM-DD" />
            </label>
            <label className="field-control">
              <span className="field-label">生产任务编号 / 货号</span>
              <input className="input" value={draft.itemSku} onChange={(event) => updateDraft('itemSku', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">工厂计划交期</span>
              <input className="input" value={draft.plannedDeliveryDate} onChange={(event) => updateDraft('plannedDeliveryDate', event.target.value)} placeholder="YYYY-MM-DD" />
            </label>
            <label className="field-control">
              <span className="field-label">委外状态</span>
              <select className="select" value={draft.outsourceStatus} onChange={(event) => updateDraft('outsourceStatus', event.target.value)}>
                {outsourceStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">跟单备注 / 委外备注</span>
              <textarea className="textarea" value={draft.outsourceNote} onChange={(event) => updateDraft('outsourceNote', event.target.value)} />
            </label>
          </div>
          <div className="row">
            <button type="button" className="button primary small" onClick={handleSave}>
              保存跟单
            </button>
            <button type="button" className="button secondary small" onClick={handleCancel}>
              取消编辑
            </button>
          </div>
        </div>
      ) : (
        <InfoGrid columns={3}>
          <InfoField label="跟单负责人" value={line.currentOwner || '待分配'} />
          <InfoField label="工厂" value={getFactorySummary(line)} />
          <InfoField label="下厂时间" value={line.outsourceInfo?.outsourcedAt || '待补充'} />
          <InfoField label="生产任务编号 / 货号" value={line.itemSku || line.lineCode || '—'} />
          <InfoField label="工厂计划交期" value={line.outsourceInfo?.plannedDeliveryDate || line.expectedDate || '—'} />
          <InfoField label="委外状态" value={getOutsourceStatusLabel(String(line.outsourceInfo?.outsourceStatus || ''))} />
          <InfoField label="跟单备注 / 委外备注" value={line.outsourceInfo?.outsourceNote || '—'} />
        </InfoGrid>
      )}
      {message ? (
        <div role="status" className="success-alert spacer-top">
          {message}
        </div>
      ) : null}
    </DetailSection>
  )
}

const OrderLineLogisticsCreateForm = ({
  line,
  purchase,
  onAddLogistics,
  onCancel
}: {
  line: OrderLine
  purchase?: Purchase
  onAddLogistics: OrderLineLogisticsCreateHandler
  onCancel: () => void
}) => {
  const [draft, setDraft] = useState<OrderLineLogisticsDraft>(defaultLogisticsDraft)

  useEffect(() => {
    setDraft(defaultLogisticsDraft)
  }, [line.id])

  const updateDraft = <K extends keyof OrderLineLogisticsDraft>(field: K, value: OrderLineLogisticsDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleSave = () => {
    onAddLogistics(buildOrderLineLogisticsRecord({ line, purchase, draft }))
    setDraft(defaultLogisticsDraft)
    onCancel()
  }

  return (
    <div className="subtle-panel">
      <div className="field-grid three">
        <label className="field-control">
          <span className="field-label">物流类型</span>
          <select className="select" value={draft.logisticsType} onChange={(event) => updateDraft('logisticsType', event.target.value as LogisticsType)}>
            <option value="measurement_tool">量尺工具</option>
            <option value="goods">货品</option>
            <option value="after_sales">售后</option>
            <option value="other">其他</option>
          </select>
        </label>
        <label className="field-control">
          <span className="field-label">物流方向</span>
          <select className="select" value={draft.direction} onChange={(event) => updateDraft('direction', event.target.value as LogisticsDirection)}>
            <option value="outbound">发出</option>
            <option value="return">退回</option>
          </select>
        </label>
        <label className="field-control">
          <span className="field-label">快递公司</span>
          <input className="input" value={draft.company} onChange={(event) => updateDraft('company', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">运单号</span>
          <input className="input" value={draft.trackingNo} onChange={(event) => updateDraft('trackingNo', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">发货时间</span>
          <input className="input" type="datetime-local" value={draft.shippedAt} onChange={(event) => updateDraft('shippedAt', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">签收时间</span>
          <input className="input" type="datetime-local" value={draft.signedAt} onChange={(event) => updateDraft('signedAt', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">物流备注</span>
          <textarea className="textarea" value={draft.remark} onChange={(event) => updateDraft('remark', event.target.value)} />
        </label>
      </div>
      <div className="row spacer-top">
        <button type="button" className="button primary small" onClick={handleSave}>
          保存物流
        </button>
        <button type="button" className="button secondary small" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  )
}

const OrderLineAfterSalesCreateForm = ({
  line,
  purchase,
  onAddAfterSales,
  onCancel
}: {
  line: OrderLine
  purchase?: Purchase
  onAddAfterSales: OrderLineAfterSalesCreateHandler
  onCancel: () => void
}) => {
  const [draft, setDraft] = useState<OrderLineAfterSalesDraft>(defaultAfterSalesDraft)

  useEffect(() => {
    setDraft(defaultAfterSalesDraft)
  }, [line.id])

  const updateDraft = <K extends keyof OrderLineAfterSalesDraft>(field: K, value: OrderLineAfterSalesDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleSave = () => {
    onAddAfterSales(buildOrderLineAfterSalesCase({ line, purchase, draft }))
    setDraft(defaultAfterSalesDraft)
    onCancel()
  }

  return (
    <div className="subtle-panel">
      <div className="field-grid three">
        <label className="field-control">
          <span className="field-label">售后类型</span>
          <select className="select" value={draft.type} onChange={(event) => updateDraft('type', event.target.value as AfterSalesCaseType)}>
            <option value="resize">改圈/改尺寸</option>
            <option value="repair">维修</option>
            <option value="repolish">返工抛光</option>
            <option value="remake">重做</option>
            <option value="resend">补发</option>
            <option value="other">其他</option>
          </select>
        </label>
        <label className="field-control">
          <span className="field-label">售后状态</span>
          <select className="select" value={draft.status} onChange={(event) => updateDraft('status', event.target.value as AfterSalesCaseStatus)}>
            <option value="open">待处理</option>
            <option value="processing">处理中</option>
            <option value="waiting_return">待寄回</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>
        </label>
        <label className="field-control">
          <span className="field-label">售后负责人</span>
          <input className="input" value={draft.responsibleParty} onChange={(event) => updateDraft('responsibleParty', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">创建时间</span>
          <input className="input" type="datetime-local" value={draft.createdAt} onChange={(event) => updateDraft('createdAt', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">关闭时间</span>
          <input className="input" type="datetime-local" value={draft.closedAt} onChange={(event) => updateDraft('closedAt', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">售后原因</span>
          <input className="input" value={draft.reason} onChange={(event) => updateDraft('reason', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">售后备注</span>
          <textarea className="textarea" value={draft.remark} onChange={(event) => updateDraft('remark', event.target.value)} />
        </label>
      </div>
      <div className="row spacer-top">
        <button type="button" className="button primary small" onClick={handleSave}>
          保存售后
        </button>
        <button type="button" className="button secondary small" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  )
}

export const buildOrderLineRows = (): OrderLineRow[] =>
  purchasesMock.flatMap((purchase) =>
    purchase.orderLines.map((line) => ({
      line,
      purchase
    }))
  )

export const filterOrderLineRows = (rows: OrderLineRow[], filters: OrderLineCenterFilters) =>
  rows.filter(({ line, purchase }) => {
    const customer = customersMock.find((item) => item.id === line.customerId || item.id === purchase?.customerId)
    const keyword = filters.keyword.trim().toLowerCase()
    const matchesKeyword =
      keyword.length === 0 ||
      [
        line.lineCode,
        line.id,
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
    const matchesStatus = filters.status === 'all' || line.status === filters.status
    const matchesOwner = filters.owner.trim().length === 0 || (line.currentOwner || purchase?.ownerName || '').includes(filters.owner.trim())

    return matchesKeyword && matchesStatus && matchesOwner
  })

export const updateOrderLineStatusInRows = <T extends OrderLineRow>(rows: T[], lineId: string, nextStatus: OrderLineStatus | string): T[] =>
  rows.map((row) => (row.line.id === lineId ? ({ ...row, line: { ...row.line, status: nextStatus } } as T) : row))

export const OrderLineQuickStats = ({ rows, afterSalesCases = afterSalesMock }: { rows: OrderLineRow[]; afterSalesCases?: AfterSalesCase[] }) => {
  const stats = [
    { label: '全部商品行', value: rows.length },
    { label: '待确认', value: rows.filter(({ line }) => line.status === 'pending_confirm').length },
    { label: '待设计', value: rows.filter(({ line }) => line.status === 'pending_design' || line.status === 'designing').length },
    { label: '待下厂', value: rows.filter(({ line }) => line.status === 'pending_outsource').length },
    { label: '生产中', value: rows.filter(({ line }) => line.status === 'in_production').length },
    { label: '待发货', value: rows.filter(({ line }) => line.status === 'pending_shipment').length },
    { label: '售后中', value: rows.filter(({ line }) => line.status === 'after_sales' || afterSalesCases.some((item) => item.orderLineId === line.id && isActiveAfterSalesCase(item))).length },
    { label: '已超时', value: rows.filter(({ line }) => getTimePressure(line.promisedDate).overdue).length }
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

export const OrderLineFilterBar = ({
  value,
  onChange
}: {
  value: OrderLineCenterFilters
  onChange: (next: OrderLineCenterFilters) => void
}) => (
  <SectionCard title="搜索与筛选" description="按商品行编号、商品名称、客户、购买记录和负责人快速定位。">
    <div className="field-grid three">
      <div className="field-control">
        <label className="field-label">搜索商品行编号 / 商品名称 / 客户 / 购买记录</label>
        <input
          className="input"
          value={value.keyword}
          onChange={(event) => onChange({ ...value, keyword: event.target.value })}
          placeholder="例如：山形戒指 / 张三 / PUR-202604-001"
        />
      </div>
      <div className="field-control">
        <label className="field-label">状态筛选</label>
        <select className="select" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}>
          {statusFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">负责人筛选</label>
        <input
          className="input"
          value={value.owner}
          onChange={(event) => onChange({ ...value, owner: event.target.value })}
          placeholder="例如：王客服 / 陈设计"
        />
      </div>
    </div>
  </SectionCard>
)

export const OrderLineTable = ({
  rows,
  onOpenDetail,
  logisticsRecords = logisticsMock,
  afterSalesCases = afterSalesMock
}: {
  rows: OrderLineRow[]
  onOpenDetail?: (row: OrderLineRow) => void
  logisticsRecords?: LogisticsRecord[]
  afterSalesCases?: AfterSalesCase[]
}) => (
  <div className="table-shell">
    <table className="table">
      <thead>
        <tr>
          <th>风险</th>
          <th>商品行编号</th>
          <th>商品名称</th>
          <th>客户</th>
          <th>所属购买记录</th>
          <th>参数摘要</th>
          <th>状态</th>
          <th>当前负责人</th>
          <th>承诺交期</th>
          <th>工厂</th>
          <th>物流 / 售后</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ line, purchase }) => {
          const row = { line, purchase }
          const customer = customersMock.find((item) => item.id === line.customerId || item.id === purchase?.customerId)
          const logistics = logisticsRecords.find((item) => item.orderLineId === line.id)
          const afterSales = findCurrentAfterSalesCase(afterSalesCases, line.id)
          const pressure = getTimePressure(line.promisedDate)
          const riskLabels = getLineRiskLabels(line, afterSalesCases)
          const handleRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
            if (!onOpenDetail || isInteractiveTarget(event.target)) {
              return
            }
            onOpenDetail(row)
          }
          const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
            if (!onOpenDetail || isInteractiveTarget(event.target)) {
              return
            }
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onOpenDetail(row)
            }
          }

          return (
            <tr key={line.id} role={onOpenDetail ? 'button' : undefined} tabIndex={onOpenDetail ? 0 : undefined} onClick={handleRowClick} onKeyDown={handleRowKeyDown}>
              <td>
                {riskLabels.length > 0 ? (
                  <div className="row wrap">
                    {riskLabels.map((label) => (
                      <RiskTag key={label} value={label} />
                    ))}
                  </div>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td>
                <div className="stack" style={{ gap: 6 }}>
                  <strong>{line.lineCode || line.id}</strong>
                  <span className="text-caption">{line.sourceProduct?.sourceProductCode || '未引用模板'}</span>
                </div>
              </td>
              <td>
                <div>{line.name}</div>
                <div className="text-caption">{line.sourceProduct?.sourceProductName || '非模板定制'}</div>
              </td>
              <td>
                <div>{customer?.name || '—'}</div>
                <div className="text-caption">{customer?.phone || '—'}</div>
              </td>
              <td>
                {purchase ? (
                  <Link to={`/purchases/${purchase.id}`} className="text-price">
                    {purchase.purchaseNo}
                  </Link>
                ) : (
                  <span className="text-muted">—</span>
                )}
                <div className="text-caption">{purchase?.platformOrderNo || '无平台单号'}</div>
              </td>
              <td>
                <div>{getParameterSummary(line)}</div>
                <div className="text-caption">参考报价 {formatPrice(line.quote?.systemQuote)}</div>
              </td>
              <td>
                <StatusTag value={getStatusLabel(String(line.status))} />
              </td>
              <td>{line.currentOwner || purchase?.ownerName || '待分配'}</td>
              <td>
                <div>{line.promisedDate || purchase?.promisedDate || '—'}</div>
                <div className="spacer-top">
                  <TimePressureBadge label={pressure.label} variant={pressure.variant} />
                </div>
              </td>
              <td>{getFactorySummary(line)}</td>
              <td>
                <div>{logistics ? `物流 ${logistics.trackingNo || '已创建'}` : '未发货'}</div>
                <div className="text-caption">{afterSales ? `售后 ${afterSales.status || 'open'}` : '无售后'}</div>
              </td>
              <td>
                <button type="button" className="button ghost small" onClick={() => onOpenDetail?.(row)}>
                  查看
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

export const OrderLineDetailDrawer = ({
  open,
  row,
  onClose,
  onStatusChange,
  logs = [],
  logisticsRecords = logisticsMock,
  afterSalesCases = afterSalesMock,
  onUpdateLineDetails,
  onUpdateOutsourceInfo,
  onAddLogistics,
  onAddAfterSales
}: {
  open: boolean
  row?: OrderLineRow
  onClose: () => void
  onStatusChange?: OrderLineStatusUpdateHandler
  onUpdateLineDetails?: OrderLineDetailsUpdateHandler
  onUpdateOutsourceInfo?: OrderLineOutsourceUpdateHandler
  logs?: OrderLineLog[]
  logisticsRecords?: LogisticsRecord[]
  afterSalesCases?: AfterSalesCase[]
  onAddLogistics?: OrderLineLogisticsCreateHandler
  onAddAfterSales?: OrderLineAfterSalesCreateHandler
}) => {
  const [sourceProductOpen, setSourceProductOpen] = useState(false)
  const [logisticsFormOpen, setLogisticsFormOpen] = useState(false)
  const [afterSalesFormOpen, setAfterSalesFormOpen] = useState(false)
  const line = row?.line
  const purchase = row?.purchase
  const customer = customersMock.find((item) => item.id === line?.customerId || item.id === purchase?.customerId)
  const lineLogisticsRecords = line ? logisticsRecords.filter((item) => item.orderLineId === line.id) : []
  const lineAfterSalesCases = line ? afterSalesCases.filter((item) => item.orderLineId === line.id) : []
  const riskLabels = line ? getLineRiskLabels(line, afterSalesCases) : []
  const lineLogs = line ? logs.filter((log) => log.orderLineId === line.id) : []
  const sourceProduct = line ? mockProducts.find((product) => product.id === line.sourceProduct?.sourceProductId || product.id === line.productId) : undefined
  const sourceProductCompareValue = line ? buildOrderLineSourceProductCompareValue(line) : undefined
  useEffect(() => {
    setLogisticsFormOpen(false)
    setAfterSalesFormOpen(false)
  }, [line?.id])
  const handleClose = () => {
    setSourceProductOpen(false)
    setLogisticsFormOpen(false)
    setAfterSalesFormOpen(false)
    onClose()
  }

  return (
    <SideDrawer open={open} title="商品行详情" onClose={handleClose}>
      {!line ? (
        <EmptyState title="未选择商品行" description="请选择一条商品行查看详情。" />
      ) : (
        <div className="stack">
          <DetailSection title="顶部摘要">
            <InfoGrid columns={3}>
              <InfoField label="商品行编号" value={line.lineCode || line.id} />
              <InfoField label="商品名称" value={line.name} />
              <InfoField label="当前状态" value={<StatusTag value={getStatusLabel(String(line.status))} />} />
              <InfoField label="当前负责人" value={line.currentOwner || purchase?.ownerName || '待分配'} />
              <InfoField label="客户姓名" value={customer?.name || '—'} />
              <InfoField label="所属购买记录编号" value={purchase?.purchaseNo || '—'} />
              <InfoField label="承诺交期" value={line.promisedDate || purchase?.promisedDate || '—'} />
              <InfoField
                label="风险标签"
                value={
                  riskLabels.length > 0 ? (
                    <div className="row wrap">
                      {riskLabels.map((label) => (
                        <RiskTag key={label} value={label} />
                      ))}
                    </div>
                  ) : (
                    '—'
                  )
                }
              />
            </InfoGrid>
          </DetailSection>

          <OrderLineStatusUpdatePanel line={line} onStatusChange={onStatusChange} />
          <OrderLineLogSection logs={lineLogs} />
          <OrderLineDetailsSection line={line} onUpdateLineDetails={onUpdateLineDetails} />

          <DetailSection title="来源产品">
            <InfoGrid columns={3}>
              <InfoField label="是否引用产品" value={line.isReferencedProduct ? '是' : '否'} />
              <InfoField label="来源产品名称" value={line.sourceProduct?.sourceProductName || '未引用产品'} />
              <InfoField label="来源产品编号" value={line.sourceProduct?.sourceProductCode || '—'} />
              <InfoField label="来源产品版本" value={line.sourceProduct?.sourceProductVersion ? <VersionBadge value={line.sourceProduct.sourceProductVersion} /> : '—'} />
              <InfoField label="所选规格" value={line.selectedSpecValue || line.sourceProduct?.sourceSpecValue || '—'} />
              <InfoField
                label="来源产品入口"
                value={
                  <button type="button" className="button ghost small" onClick={() => setSourceProductOpen(true)} disabled={!sourceProduct}>
                    查看来源产品
                  </button>
                }
              />
            </InfoGrid>
          </DetailSection>

          <DetailSection title="规格与报价">
            <InfoGrid columns={3}>
              <InfoField label="规格" value={line.selectedSpecValue || '—'} />
              <InfoField label="材质" value={line.selectedMaterial || line.actualRequirements?.material || '—'} />
              <InfoField label="工艺" value={line.selectedProcess || line.actualRequirements?.process || '—'} />
              <InfoField label="特殊需求" value={<TextList values={line.selectedSpecialOptions} />} />
              <InfoField label="系统参考报价" value={formatPrice(line.quote?.systemQuote)} />
              <InfoField label="成交价" value={formatPrice(line.finalDisplayQuote)} />
            </InfoGrid>
          </DetailSection>

          <DetailSection title="设计建模摘要">
            <InfoGrid columns={3}>
              <InfoField label="是否需要设计" value={line.designInfo?.requiresRemodeling ? '是' : line.designInfo?.designStatus === 'not_required' ? '否' : '待确认'} />
              <InfoField label="设计状态" value={getDesignStatusLabel(String(line.designInfo?.designStatus || ''))} />
              <InfoField label="设计负责人" value={line.designInfo?.assignedDesigner || '—'} />
              <InfoField label="建模文件" value={line.designInfo?.modelingFileUrl || '暂无文件'} />
              <InfoField label="出蜡文件" value={line.designInfo?.waxFileUrl || '暂无文件'} />
              <InfoField label="设计备注" value={line.designInfo?.designNote || '—'} />
            </InfoGrid>
          </DetailSection>

          <OrderLineOutsourceSection line={line} onUpdateOutsourceInfo={onUpdateOutsourceInfo} />

          <DetailSection title="工厂回传摘要">
            <InfoGrid columns={3}>
              <InfoField label="工厂状态" value={getFactoryStatusLabel(String(line.productionInfo?.factoryStatus || ''))} />
              <InfoField label="实际材质" value={line.actualRequirements?.material || line.selectedMaterial || '—'} />
              <InfoField label="总重" value={line.productionInfo?.returnedWeight || '—'} />
              <InfoField label="净重" value="—" />
              <InfoField label="质检结果" value={line.productionInfo?.qualityResult || '—'} />
              <InfoField label="工厂备注" value={line.productionInfo?.factoryNote || '—'} />
            </InfoGrid>
          </DetailSection>

          <DetailSection title="物流 / 售后摘要">
            <div className="stack">
              <div className="subtle-panel">
                <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                  <strong>物流记录</strong>
                  <button type="button" className="button ghost small" onClick={() => setLogisticsFormOpen((current) => !current)} disabled={!onAddLogistics}>
                    新增物流
                  </button>
                </div>
                {logisticsFormOpen && onAddLogistics ? (
                  <div className="spacer-top">
                    <OrderLineLogisticsCreateForm line={line} purchase={purchase} onAddLogistics={onAddLogistics} onCancel={() => setLogisticsFormOpen(false)} />
                  </div>
                ) : null}
                {lineLogisticsRecords.length > 0 ? (
                  <ul className="list-reset stack spacer-top">
                    {lineLogisticsRecords.map((record) => (
                      <li key={record.id}>
                        <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                          <span>{getLogisticsCompany(record)}</span>
                          <span className="text-price">{record.trackingNo || '无单号'}</span>
                        </div>
                        <div className="text-caption">
                          {logisticsTypeLabelMap[record.logisticsType || 'goods']} · {logisticsDirectionLabelMap[record.direction || 'outbound']} · {record.shippedAt || '未发货'}
                          {getLogisticsSignedAt(record) ? ` · 签收 ${getLogisticsSignedAt(record)}` : ''} · {getLogisticsRemark(record)}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="暂无物流记录" description="当前商品行还没有关联物流记录。" />
                )}
              </div>
              <div className="subtle-panel">
                <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                  <strong>售后记录</strong>
                  <button type="button" className="button ghost small" onClick={() => setAfterSalesFormOpen((current) => !current)} disabled={!onAddAfterSales}>
                    新增售后
                  </button>
                </div>
                {afterSalesFormOpen && onAddAfterSales ? (
                  <div className="spacer-top">
                    <OrderLineAfterSalesCreateForm line={line} purchase={purchase} onAddAfterSales={onAddAfterSales} onCancel={() => setAfterSalesFormOpen(false)} />
                  </div>
                ) : null}
                {lineAfterSalesCases.length > 0 ? (
                  <ul className="list-reset stack spacer-top">
                    {lineAfterSalesCases.map((record) => (
                      <li key={record.id}>
                        <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                          <span>{getAfterSalesTypeLabel(record.type)}</span>
                          <StatusTag value={getAfterSalesStatusLabel(record.status)} />
                        </div>
                        <div className="text-caption">
                          {record.createdAt || '未记录时间'} · {record.responsibleParty || '未分配'}
                          {record.closedAt ? ` · 关闭 ${record.closedAt}` : ''}
                        </div>
                        <div>{getAfterSalesReason(record)}</div>
                        <div className="text-caption">{getAfterSalesRemark(record)}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="暂无售后记录" description="当前商品行还没有关联售后记录。" />
                )}
              </div>
            </div>
          </DetailSection>

          <DetailSection title="购买记录入口">
            <InfoGrid columns={2}>
              <InfoField label="所属购买记录编号" value={purchase?.purchaseNo || '—'} />
              <InfoField
                label="查看购买记录"
                value={
                  purchase ? (
                    <Link to={`/purchases/${purchase.id}`} className="button secondary small">
                      打开购买记录
                    </Link>
                  ) : (
                    '—'
                  )
                }
              />
            </InfoGrid>
          </DetailSection>
          <SourceProductDrawer
            open={sourceProductOpen}
            product={sourceProduct}
            compareValue={sourceProductCompareValue}
            onClose={() => setSourceProductOpen(false)}
          />
        </div>
      )}
    </SideDrawer>
  )
}

export const useOrderLineCenterRows = (filters: OrderLineCenterFilters) => {
  const rows = useMemo(buildOrderLineRows, [])

  return useMemo(() => filterOrderLineRows(rows, filters), [filters, rows])
}

export const useAllOrderLineCenterRows = () => useMemo(buildOrderLineRows, [])
