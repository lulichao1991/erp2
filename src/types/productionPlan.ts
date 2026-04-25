import type { Product } from '@/types/product'
import type { OrderLine } from '@/types/order-line'
import type { PurchaseTimelineRecord } from '@/types/purchase'
import type { Task } from '@/types/task'

export type ProductionPlanStage =
  | 'pending_receive'
  | 'ready_to_produce'
  | 'in_production'
  | 'pending_report'
  | 'reported'
  | 'issue'

export type ProductionPlanFile = {
  id: string
  name: string
  url: string
  version?: string
}

export type ProductionPlanFileGroup = {
  title: string
  files: ProductionPlanFile[]
}

export type ProductionPlanRow = {
  taskId: string
  purchaseId: string
  purchaseNo: string
  orderLineId: string
  orderLineCode: string
  orderLineName: string
  goodsNo: string
  styleName: string
  sourceProductId: string
  sourceProductCode: string
  sourceProductVersion: string
  category: Product['category']
  categoryLabel: string
  specValue?: string
  material?: string
  process?: string
  engraveText?: string
  quantity: number
  isUrgent: boolean
  assignedAt: string
  plannedDueDate?: string
  assigneeName: string
  taskStatus: Task['status']
  stage: ProductionPlanStage
  stageLabel: string
}

export type ProductionPlanDetail = {
  purchaseId: string
  purchaseNo: string
  orderLineId: string
  orderLineCode: string
  orderLineName: string
  row: ProductionPlanRow
  task: Task
  orderLine: OrderLine
  sourceProduct: Product
  timeline: PurchaseTimelineRecord[]
  fileGroups: ProductionPlanFileGroup[]
  referenceImages: string[]
}
