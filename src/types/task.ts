import type { OrderPriority } from '@/types/order'

export type TaskType = 'order_process' | 'design_modeling' | 'production_prep' | 'factory_production' | 'after_sales'

export type TaskStatus = 'todo' | 'in_progress' | 'pending_confirm' | 'done' | 'closed' | 'overdue'

export type TaskAssigneeRole = 'customer_service' | 'designer' | 'operations' | 'factory' | 'management'

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
  /** @deprecated 兼容旧 /orders 模块和旧 useAppData API，请优先使用 purchaseId。 */
  orderId: string
  /** @deprecated 兼容旧 /orders 模块，请优先使用 purchaseNo。 */
  orderNo: string
  /** @deprecated 兼容旧 /orders 模块，请优先使用 orderLineId。 */
  orderItemId?: string
  /** @deprecated 兼容旧 /orders 模块，请优先使用 orderLineName。 */
  orderItemName?: string
  assigneeRole: TaskAssigneeRole
  assigneeName: string
  priority: OrderPriority
  dueAt?: string
  description?: string
  remark?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  completedAt?: string
}
