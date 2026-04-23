import type { ProductSpecRow } from '@/types/product'
import type { QuoteResult } from '@/types/quote'

export type OrderStatus =
  | 'draft'
  | 'pending_confirm'
  | 'pending_design'
  | 'pending_production_prep'
  | 'pending_shipping'
  | 'after_sales'
  | 'completed'
  | 'cancelled'

export type OrderPriority = 'normal' | 'high' | 'urgent'

export type OrderFinanceTransactionType =
  | 'deposit_received'
  | 'balance_received'
  | 'platform_refund'
  | 'offline_refund'
  | 'after_sales_payment'
  | 'after_sales_refund'

export type SourceProductSnapshot = {
  sourceProductId: string
  sourceProductCode: string
  sourceProductName: string
  sourceProductVersion: string
  sourceSpecValue?: string
}

export type OrderItemUploadedFile = {
  id: string
  name: string
  url: string
}

export type OrderFinanceTransaction = {
  id: string
  type: OrderFinanceTransactionType
  amount: number
  occurredAt: string
  note?: string
}

export type OrderFinanceInfo = {
  dealPrice?: number
  depositAmount?: number
  balanceAmount?: number
  invoiced?: boolean
  remark?: string
  transactions: OrderFinanceTransaction[]
}

export type OrderItemActualRequirements = {
  material?: string
  process?: string
  sizeNote?: string
  engraveText?: string
  engraveImageFiles?: OrderItemUploadedFile[]
  engravePltFiles?: OrderItemUploadedFile[]
  specialNotes?: string[]
  remark?: string
}

export type OrderItemDesignInfo = {
  designStatus?: string
  assignedDesigner?: string
  requiresRemodeling?: boolean
  designDeadline?: string
  designNote?: string
}

export type OrderItemOutsourceInfo = {
  outsourceStatus?: string
  supplierName?: string
  plannedDeliveryDate?: string
  outsourceNote?: string
}

export type OrderItemFactoryFeedback = {
  factoryStatus?: string
  returnedWeight?: string
  qualityResult?: string
  factoryNote?: string
}

export type OrderItem = {
  id: string
  name: string
  itemSku: string
  quantity: number
  status: string
  isReferencedProduct: boolean
  sourceProduct?: SourceProductSnapshot
  selectedSpecValue?: string
  selectedSpecSnapshot?: ProductSpecRow
  selectedMaterial?: string
  selectedProcess?: string
  selectedSpecialOptions?: string[]
  actualRequirements?: OrderItemActualRequirements
  designInfo?: OrderItemDesignInfo
  outsourceInfo?: OrderItemOutsourceInfo
  factoryFeedback?: OrderItemFactoryFeedback
  quote?: QuoteResult
  manualAdjustment?: number
  manualAdjustmentReason?: string
  finalDisplayQuote?: number
}

export type TimelineRecordType =
  | 'order_created'
  | 'product_referenced'
  | 'spec_changed'
  | 'quote_recalculated'
  | 'status_changed'
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'remark_updated'

export type TimelineRecord = {
  id: string
  orderId: string
  type: TimelineRecordType
  title: string
  description?: string
  actorName: string
  createdAt: string
  relatedTaskId?: string
  relatedOrderItemId?: string
}

export type Order = {
  id: string
  orderNo: string
  platformOrderNo?: string
  orderType: string
  ownerName: string
  hasAdditionalContact?: boolean
  isPositiveReview?: boolean
  platformCustomerId?: string
  sourceChannel?: string
  registeredAt?: string
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  customerRemark?: string
  status: OrderStatus
  priority: OrderPriority
  riskTags: string[]
  promisedDate?: string
  expectedDate?: string
  plannedDate?: string
  paymentDate?: string
  finance?: OrderFinanceInfo
  items: OrderItem[]
  remark?: string
  latestActivityAt?: string
  timeline: TimelineRecord[]
}
