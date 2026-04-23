import type { ProductCategory, ProductSpecRow } from '@/types/product'
import type { QuoteResult } from '@/types/quote'

export type ProductSnapshot = {
  sourceProductId: string
  sourceProductCode: string
  sourceProductName: string
  sourceProductVersion: string
  category?: ProductCategory
  sourceSpecValue?: string
  defaultMaterial?: string
  defaultProcess?: string
  snapshotAt?: string
}

export type OrderLineUploadedFile = {
  id: string
  name: string
  url: string
}

export type OrderLinePriority = 'normal' | 'high' | 'urgent' | 'vip'

export type OrderLineStatus =
  | 'draft'
  | 'pending_confirm'
  | 'pending_measurement'
  | 'pending_design'
  | 'designing'
  | 'pending_outsource'
  | 'in_production'
  | 'pending_factory_feedback'
  | 'pending_shipment'
  | 'shipped'
  | 'after_sales'
  | 'completed'
  | 'cancelled'

export type OrderLineActualRequirements = {
  material?: string
  process?: string
  sizeNote?: string
  engraveText?: string
  specialNotes?: string[]
  remark?: string
}

export type OrderLineDesignStatus =
  | 'not_required'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'rework'

export type OrderLineDesignInfo = {
  designStatus?: OrderLineDesignStatus | string
  assignedDesigner?: string
  requiresRemodeling?: boolean
  designDeadline?: string
  designNote?: string
  modelingFileUrl?: string
  waxFileUrl?: string
  waxFileSentAt?: string
}

export type OrderLineOutsourceStatus =
  | 'not_required'
  | 'pending'
  | 'in_progress'
  | 'delivered'
  | 'rework'

export type OrderLineOutsourceInfo = {
  outsourceStatus?: OrderLineOutsourceStatus | string
  supplierName?: string
  plannedDeliveryDate?: string
  outsourceNote?: string
}

export type OrderLineProductionStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_feedback'
  | 'completed'
  | 'issue'

export type OrderLineProductionInfo = {
  factoryStatus?: OrderLineProductionStatus | string
  returnedWeight?: string
  qualityResult?: string
  factoryNote?: string
}

export type LogisticsRecord = {
  id: string
  orderLineId: string
  transactionId?: string
  carrier?: string
  trackingNo?: string
  shippedAt?: string
  deliveredAt?: string
  note?: string
}

export type AfterSalesCase = {
  id: string
  orderLineId: string
  transactionId?: string
  type?: 'repair' | 'resize' | 'refund' | 'exchange' | 'other'
  status?: 'open' | 'in_progress' | 'closed'
  createdAt?: string
  closedAt?: string
  note?: string
}

export type OrderLine = {
  id: string
  lineNo?: number
  lineCode?: string
  transactionId?: string
  customerId?: string
  name: string
  category?: ProductCategory
  quantity: number
  status: OrderLineStatus | string
  currentOwner?: string
  priority?: OrderLinePriority
  isReferencedProduct: boolean
  productId?: string
  sourceProduct?: ProductSnapshot
  selectedSpecValue?: string
  selectedSpecSnapshot?: ProductSpecRow
  selectedMaterial?: string
  selectedProcess?: string
  selectedSpecialOptions?: string[]
  actualRequirements?: OrderLineActualRequirements
  designInfo?: OrderLineDesignInfo
  outsourceInfo?: OrderLineOutsourceInfo
  productionInfo?: OrderLineProductionInfo
  quote?: QuoteResult
  expectedDate?: string
  promisedDate?: string
  finishedAt?: string

  // Compatibility fields kept for the existing page layer.
  itemSku?: string
  manualAdjustment?: number
  manualAdjustmentReason?: string
  finalDisplayQuote?: number
}
