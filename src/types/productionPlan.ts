import type { Order, OrderItem, TimelineRecord } from '@/types/order'
import type { Product } from '@/types/product'
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
  orderId: string
  orderNo: string
  orderItemId: string
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
  row: ProductionPlanRow
  task: Task
  order: Order
  orderItem: OrderItem
  sourceProduct: Product
  timeline: TimelineRecord[]
  fileGroups: ProductionPlanFileGroup[]
  referenceImages: string[]
}
