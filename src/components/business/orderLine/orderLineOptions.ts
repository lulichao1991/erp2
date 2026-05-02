import { factoryWorkflowStatusLabelMap, orderLineLineStatusOptions, designWorkflowStatusLabelMap, modelingWorkflowStatusLabelMap } from '@/services/orderLine/orderLineWorkflow'
import type { OrderLineAfterSalesDraft, OrderLineCenterFilters, OrderLineLogisticsDraft } from '@/services/orderLine/orderLineWorkspace'
import type { OrderLineOutsourceStatus, OrderLinePriority, OrderLineProductionFeedbackStatus, OrderLineWorkflowDesignStatus, OrderLineWorkflowModelingStatus } from '@/types/order-line'
import type { ProductCategory } from '@/types/product'
import type { LogisticsDirection, LogisticsType } from '@/types/supporting-records'

export const orderLineStatusOptions = orderLineLineStatusOptions

export const statusFilterOptions = [{ value: 'all', label: '全部状态' }, ...orderLineLineStatusOptions]

export const quickViewOptions: Array<{ value: OrderLineCenterFilters['quickView']; label: string }> = [
  { value: 'all', label: '全部销售' },
  ...orderLineLineStatusOptions
]

export const categoryOptions: Array<{ value: ProductCategory; label: string }> = [
  { value: 'ring', label: '戒指' },
  { value: 'pendant', label: '吊坠' },
  { value: 'necklace', label: '项链' },
  { value: 'earring', label: '耳饰' },
  { value: 'bracelet', label: '手链' },
  { value: 'other', label: '其他' }
]

export const priorityOptions: Array<{ value: OrderLinePriority; label: string }> = [
  { value: 'normal', label: '否' },
  { value: 'high', label: '高优先' },
  { value: 'urgent', label: '加急' },
  { value: 'vip', label: 'VIP' }
]

export const designStatusOptions = Object.entries(designWorkflowStatusLabelMap).map(([value, label]) => ({
  value: value as OrderLineWorkflowDesignStatus,
  label
}))

export const modelingStatusOptions = Object.entries(modelingWorkflowStatusLabelMap).map(([value, label]) => ({
  value: value as OrderLineWorkflowModelingStatus,
  label
}))

export const outsourceStatusOptions: Array<{ value: OrderLineOutsourceStatus | string; label: string }> = [
  { value: 'not_required', label: '不需要下厂' },
  { value: 'pending', label: '待下厂' },
  { value: 'in_progress', label: '生产中' },
  { value: 'delivered', label: '已回货' },
  { value: 'rework', label: '返工中' }
]

export const productionStatusOptions: Array<{ value: OrderLineProductionFeedbackStatus | string; label: string }> = [
  { value: 'not_started', label: '未开始' },
  { value: 'in_progress', label: '生产中' },
  { value: 'pending_feedback', label: '待回传' },
  { value: 'completed', label: '已完成' },
  { value: 'issue', label: '异常' }
]

export const categoryLabelMap = Object.fromEntries(categoryOptions.map((item) => [item.value, item.label])) as Record<string, string>
const outsourceStatusLabelMap = Object.fromEntries(outsourceStatusOptions.map((item) => [item.value, item.label])) as Record<string, string>
const feedbackStatusLabelMap = Object.fromEntries(productionStatusOptions.map((item) => [item.value, item.label])) as Record<string, string>

export const logisticsTypeLabelMap: Record<LogisticsType, string> = {
  measurement_tool: '量尺工具',
  goods: '货品',
  after_sales: '售后',
  other: '其他'
}

export const logisticsDirectionLabelMap: Record<LogisticsDirection, string> = {
  outbound: '发出',
  return: '退回'
}

export const defaultLogisticsDraft: OrderLineLogisticsDraft = {
  logisticsType: 'goods',
  direction: 'outbound',
  company: '',
  trackingNo: '',
  shippedAt: '',
  signedAt: '',
  remark: ''
}

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

export const defaultAfterSalesDraft: OrderLineAfterSalesDraft = {
  type: 'repair',
  reason: '',
  status: 'open',
  responsibleParty: '王客服',
  createdAt: '',
  closedAt: '',
  remark: ''
}

export const activeAfterSalesStatuses = new Set(['open', 'processing', 'in_progress', 'waiting_return'])

export const getFeedbackStatusLabel = (status?: string) => (status ? feedbackStatusLabelMap[status] || factoryWorkflowStatusLabelMap[status as keyof typeof factoryWorkflowStatusLabelMap] || status : '待确认')
export const getAfterSalesStatusLabel = (status?: string) => (status ? afterSalesStatusLabelMap[status] || status : '待处理')
export const getAfterSalesTypeLabel = (type?: string) => (type ? afterSalesTypeLabelMap[type] || type : '未分类')
export const getOutsourceStatusLabel = (status?: string) => (status ? outsourceStatusLabelMap[status] || status : '待确认')
