import type { OrderPriority, OrderStatus, TimelineRecordType } from '@/types/order'
import type { TaskAssigneeRole, TaskStatus, TaskType } from '@/types/task'

export type OrderBusinessStageKey =
  | 'customer_intake'
  | 'design_modeling'
  | 'production_coordination'
  | 'shipping_delivery'
  | 'after_sales'
  | 'order_completed'

export const orderStatusLabelMap: Record<OrderStatus, string> = {
  draft: '草稿',
  pending_confirm: '待确认',
  pending_design: '待设计/建模',
  pending_production_prep: '待生产准备',
  pending_shipping: '待发货',
  after_sales: '售后中',
  completed: '已完成',
  cancelled: '已取消'
}

export const orderPriorityLabelMap: Record<OrderPriority, string> = {
  normal: '普通',
  high: '高优先级',
  urgent: '紧急'
}

export const taskTypeLabelMap: Record<TaskType, string> = {
  order_process: '订单处理',
  design_modeling: '设计建模',
  production_prep: '生产准备',
  factory_production: '工厂生产',
  after_sales: '售后处理'
}

export const taskStatusLabelMap: Record<TaskStatus, string> = {
  todo: '待处理',
  in_progress: '进行中',
  pending_confirm: '待确认',
  done: '已完成',
  closed: '已关闭',
  overdue: '已逾期'
}

export const taskAssigneeRoleLabelMap: Record<TaskAssigneeRole, string> = {
  customer_service: '客服',
  designer: '设计',
  operations: '跟单/运营',
  factory: '工厂',
  management: '管理'
}

export const timelineRecordLabelMap: Record<TimelineRecordType, string> = {
  order_created: '订单创建',
  product_referenced: '引用产品',
  spec_changed: '规格变更',
  quote_recalculated: '报价重算',
  status_changed: '状态流转',
  task_created: '创建任务',
  task_updated: '任务更新',
  task_completed: '任务完成',
  remark_updated: '备注更新'
}

export const orderStatusDescriptionMap: Record<OrderStatus, string> = {
  draft: '草稿阶段用于整理订单资料、补充客户信息和维护订单商品。',
  pending_confirm: '待确认阶段用于确认规格、报价、交期与客户需求。',
  pending_design: '待设计/建模阶段用于承接出图、改图和建模相关工作。',
  pending_production_prep: '待生产准备阶段用于整理材质、工艺和生产交接资料。',
  pending_shipping: '待发货阶段表示主流程已基本完成，等待最终交付。',
  after_sales: '售后中阶段用于承接返修、补发、改款等售后处理。',
  completed: '已完成阶段表示订单主流程闭环完成。',
  cancelled: '已取消阶段表示订单终止，不再继续主流程。'
}

export const orderStatusTransitionMap: Record<OrderStatus, OrderStatus[]> = {
  draft: ['pending_confirm', 'cancelled'],
  pending_confirm: ['pending_design', 'pending_production_prep', 'cancelled'],
  pending_design: ['pending_production_prep', 'cancelled'],
  pending_production_prep: ['pending_shipping', 'cancelled'],
  pending_shipping: ['completed', 'after_sales', 'cancelled'],
  after_sales: ['completed', 'cancelled'],
  completed: ['after_sales'],
  cancelled: []
}

export const orderStatusSuggestedTaskTypeMap: Partial<Record<OrderStatus, TaskType>> = {
  pending_confirm: 'order_process',
  pending_design: 'design_modeling',
  pending_production_prep: 'production_prep',
  after_sales: 'after_sales'
}

export const orderBusinessStages: Array<{
  key: OrderBusinessStageKey
  title: string
  caption: string
}> = [
  {
    key: 'customer_intake',
    title: '客服接单',
    caption: '录入订单、确认规格与报价'
  },
  {
    key: 'design_modeling',
    title: '设计建模',
    caption: '出图、改图与建模确认'
  },
  {
    key: 'production_coordination',
    title: '跟单下厂',
    caption: '整理材质工艺并准备下厂'
  },
  {
    key: 'shipping_delivery',
    title: '物流交付',
    caption: '准备发货与完成交付'
  },
  {
    key: 'after_sales',
    title: '售后处理',
    caption: '返修、补发与问题跟进'
  },
  {
    key: 'order_completed',
    title: '订单完成',
    caption: '主流程闭环归档'
  }
]

export const orderStatusToBusinessStageMap: Partial<Record<OrderStatus, OrderBusinessStageKey>> = {
  draft: 'customer_intake',
  pending_confirm: 'customer_intake',
  pending_design: 'design_modeling',
  pending_production_prep: 'production_coordination',
  pending_shipping: 'shipping_delivery',
  after_sales: 'after_sales',
  completed: 'order_completed'
}

export const getOrderStatusLabel = (status: OrderStatus) => orderStatusLabelMap[status]

export const getOrderPriorityLabel = (priority: OrderPriority) => orderPriorityLabelMap[priority]

export const getTaskTypeLabel = (type: TaskType) => taskTypeLabelMap[type]

export const getTaskStatusLabel = (status: TaskStatus) => taskStatusLabelMap[status]

export const getTaskAssigneeRoleLabel = (role: TaskAssigneeRole) => taskAssigneeRoleLabelMap[role]

export const getTimelineRecordLabel = (type: TimelineRecordType) => timelineRecordLabelMap[type]

export const getOrderStatusDescription = (status: OrderStatus) => orderStatusDescriptionMap[status]

export const getAllowedNextStatuses = (status: OrderStatus) => orderStatusTransitionMap[status]

export const getSuggestedTaskTypeForOrderStatus = (status: OrderStatus) => orderStatusSuggestedTaskTypeMap[status]

export const isTaskOpenStatus = (status: TaskStatus) => !['done', 'closed'].includes(status)

export const getOrderBusinessStageKey = (status: OrderStatus) => orderStatusToBusinessStageMap[status]
