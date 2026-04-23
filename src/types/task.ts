import type { OrderPriority } from '@/types/order'

export type TaskType = 'order_process' | 'design_modeling' | 'production_prep' | 'factory_production' | 'after_sales'

export type TaskStatus = 'todo' | 'in_progress' | 'pending_confirm' | 'done' | 'closed' | 'overdue'

export type TaskAssigneeRole = 'customer_service' | 'designer' | 'operations' | 'factory' | 'management'

export type Task = {
  id: string
  type: TaskType
  title: string
  status: TaskStatus
  orderId: string
  orderNo: string
  orderItemId?: string
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
