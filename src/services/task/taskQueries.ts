import { mockTasks } from '@/mocks/tasks'
import type { Task, TaskAssigneeRole, TaskType } from '@/types/task'

const clone = <T,>(value: T): T => structuredClone(value)

export const getTaskList = (): Task[] => clone(mockTasks)

export const getTaskById = (taskId: string): Task | undefined => clone(mockTasks.find((item) => item.id === taskId))

const taskTypeTitleMap: Record<TaskType, string> = {
  order_process: '订单处理任务',
  design_modeling: '设计建模任务',
  production_prep: '生产准备任务',
  factory_production: '工厂生产任务',
  after_sales: '售后任务'
}

const taskTypeRoleMap: Record<TaskType, TaskAssigneeRole> = {
  order_process: 'customer_service',
  design_modeling: 'designer',
  production_prep: 'operations',
  factory_production: 'factory',
  after_sales: 'customer_service'
}

export const createTaskDraft = ({
  orderId,
  orderNo,
  type,
  orderItemId,
  orderItemName
}: {
  orderId: string
  orderNo: string
  type: TaskType
  orderItemId?: string
  orderItemName?: string
}): Task => {
  const timestamp = Date.now()
  const currentTime = new Date().toISOString().slice(0, 16).replace('T', ' ')

  return {
    id: `task-${timestamp}`,
    type,
    title: orderItemName ? `${taskTypeTitleMap[type]} · ${orderItemName}` : taskTypeTitleMap[type],
    status: 'todo',
    orderId,
    orderNo,
    orderItemId,
    orderItemName,
    assigneeRole: taskTypeRoleMap[type],
    assigneeName: '',
    priority: 'normal',
    dueAt: '',
    description: '',
    remark: '',
    createdAt: currentTime,
    createdBy: '当前用户',
    updatedAt: currentTime,
    updatedBy: '当前用户'
  }
}
