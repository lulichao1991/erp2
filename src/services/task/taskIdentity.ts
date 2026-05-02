import type { Purchase } from '@/types/purchase'
import type { Task } from '@/types/task'

type TaskPurchaseIdFields = Pick<Task, 'purchaseId'>
type TaskPurchaseNoFields = Pick<Task, 'purchaseNo'>

const taskPurchaseNoFallback = '未关联购买记录'

export const getTaskPurchaseId = (task?: Partial<TaskPurchaseIdFields>) => task?.purchaseId

export const getTaskPurchaseNo = (task?: Partial<TaskPurchaseNoFields>, fallback = taskPurchaseNoFallback) =>
  task?.purchaseNo || fallback

export const findPurchaseForTask = <T extends Pick<Purchase, 'id'>>(task: Partial<TaskPurchaseIdFields>, purchases: T[]): T | undefined => {
  const purchaseId = getTaskPurchaseId(task)
  return purchases.find((purchase) => purchase.id === purchaseId)
}
