export type TaskType = 'order_process' | 'design_modeling' | 'production_prep' | 'factory_production' | 'after_sales'

export type TaskStatus = 'todo' | 'in_progress' | 'pending_confirm' | 'done' | 'closed' | 'overdue'

export type TaskPriority = 'normal' | 'high' | 'urgent'

export type TaskAssigneeRole =
  | 'customer_service'
  | 'merchandiser'
  | 'designer'
  | 'modeler'
  | 'factory'
  | 'finance'
  | 'manager'
  | 'admin'

export type Task = {
  id: string
  type: TaskType
  title: string
  status: TaskStatus
  purchaseId?: string
  purchaseNo?: string
  orderLineId?: string
  orderLineCode?: string
  orderLineName?: string
  /** @deprecated 兼容旧交易记录命名，请优先使用 purchaseId。 */
  transactionId?: string
  /** @deprecated 兼容旧交易记录命名，请优先使用 purchaseNo。 */
  transactionNo?: string
  assigneeRole: TaskAssigneeRole
  assigneeName: string
  priority: TaskPriority
  dueAt?: string
  description?: string
  remark?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  completedAt?: string
}
