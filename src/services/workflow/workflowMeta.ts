import type { TaskAssigneeRole, TaskPriority, TaskStatus, TaskType } from '@/types/task'

export const taskPriorityLabelMap: Record<TaskPriority, string> = {
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

export const getTaskPriorityLabel = (priority: TaskPriority) => taskPriorityLabelMap[priority]

export const getTaskTypeLabel = (type: TaskType) => taskTypeLabelMap[type]

export const getTaskStatusLabel = (status: TaskStatus) => taskStatusLabelMap[status]

export const getTaskAssigneeRoleLabel = (role: TaskAssigneeRole) => taskAssigneeRoleLabelMap[role]

export const isTaskOpenStatus = (status: TaskStatus) => !['done', 'closed'].includes(status)
