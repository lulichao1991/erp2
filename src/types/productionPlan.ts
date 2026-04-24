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
  purchaseId: string
  purchaseNo: string
  orderLineId: string
  orderLineCode: string
  orderLineName: string
  /**
   * @deprecated Compatibility alias for purchaseId while productionPlan still reads old Order data.
   */
  orderId: string
  /**
   * @deprecated Compatibility alias for purchaseNo while productionPlan still reads old Order data.
   */
  orderNo: string
  /**
   * @deprecated Compatibility alias for orderLineId while productionPlan still reads old OrderItem data.
   */
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
  purchaseId: string
  purchaseNo: string
  orderLineId: string
  orderLineCode: string
  orderLineName: string
  row: ProductionPlanRow
  task: Task
  /**
   * @deprecated Compatibility source while productionPlan still reads old Order data.
   */
  order: Order
  /**
   * @deprecated Compatibility source while productionPlan still reads old OrderItem data.
   */
  orderItem: OrderItem
  sourceProduct: Product
  timeline: TimelineRecord[]
  fileGroups: ProductionPlanFileGroup[]
  referenceImages: string[]
}
