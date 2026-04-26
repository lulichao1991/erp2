import type { ProductCategory, ProductSpecRow } from '@/types/product'
import type { QuoteResult } from '@/types/quote'
export type { AfterSalesCase, AfterSalesCaseStatus, AfterSalesCaseType, LogisticsRecord } from '@/types/supporting-records'

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
  | 'exception'

export type OrderLineLineStatus =
  | 'draft'
  | 'pending_customer_confirmation'
  | 'pending_design'
  | 'pending_modeling'
  | 'pending_merchandiser_review'
  | 'pending_factory_production'
  | 'in_production'
  | 'factory_returned'
  | 'pending_finance_confirmation'
  | 'ready_to_ship'
  | 'completed'
  | 'after_sales'

export type OrderLineWorkflowDesignStatus =
  | 'not_required'
  | 'pending'
  | 'in_progress'
  | 'revision_requested'
  | 'completed'

export type OrderLineWorkflowModelingStatus = OrderLineWorkflowDesignStatus

export type OrderLineWorkflowProductionStatus =
  | 'not_started'
  | 'pending_dispatch'
  | 'dispatched'
  | 'in_production'
  | 'completed'
  | 'delayed'
  | 'blocked'

export type OrderLineFactoryStatus =
  | 'not_assigned'
  | 'pending_acceptance'
  | 'accepted'
  | 'in_production'
  | 'returned'
  | 'abnormal'

export type OrderLineFinanceStatus =
  | 'not_required'
  | 'pending'
  | 'confirmed'
  | 'abnormal'

export type OrderLineActionType = 'created' | 'status_changed' | 'note'

export type OrderLineLog = {
  id: string
  orderLineId: string
  purchaseId?: string
  actionType: OrderLineActionType | string
  actionLabel: string
  operatorName: string
  createdAt: string
  fromStatus?: OrderLineStatus | string
  toStatus?: OrderLineStatus | string
  note?: string
}

export type OrderLineActualRequirements = {
  material?: string
  process?: string
  specNote?: string
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
  outsourcedAt?: string
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
  actualMaterial?: string
  totalWeight?: string
  returnedWeight?: string
  netWeight?: string
  mainStoneInfo?: string
  sideStoneInfo?: string
  laborCostDetail?: string
  factoryShippedAt?: string
  qualityResult?: string
  factoryNote?: string
}

export type OrderLineProductionData = {
  shippedAt?: string
  completedAt?: string
  totalWeight?: number
  netMetalWeight?: number
  actualMaterial?: string
  materialLossNote?: string
  mainStoneType?: string
  mainStoneQuantity?: number
  mainStoneUnit?: string
  mainStoneUnitPrice?: number
  mainStoneAmount?: number
  sideStoneType?: string
  sideStoneCount?: number
  sideStoneTotalCarat?: number
  sideStoneUnitPrice?: number
  sideStoneAmount?: number
  baseLaborCost?: number
  extraLaborCost?: number
  extraLaborCostNote?: string
  totalLaborCost?: number
  factoryNote?: string
  finishedImageUrls?: string[]
  settlementFileUrls?: string[]
}

export type OrderLine = {
  id: string
  lineNo?: number
  lineCode?: string
  productionTaskNo?: string
  purchaseId?: string
  transactionId?: string
  customerId?: string
  name: string
  category?: ProductCategory
  styleName?: string
  versionNo?: string
  skuCode?: string
  quantity: number
  lineStatus?: OrderLineLineStatus | string
  designStatus?: OrderLineWorkflowDesignStatus | string
  modelingStatus?: OrderLineWorkflowModelingStatus | string
  productionStatus?: OrderLineWorkflowProductionStatus | string
  factoryStatus?: OrderLineFactoryStatus | string
  financeStatus?: OrderLineFinanceStatus | string
  assignedDesignerId?: string
  assignedModelerId?: string
  merchandiserId?: string
  factoryId?: string
  productionSentAt?: string
  factoryPlannedDueDate?: string
  productionCompletedAt?: string
  designFiles?: OrderLineUploadedFile[]
  modelingFiles?: OrderLineUploadedFile[]
  waxFiles?: OrderLineUploadedFile[]
  designNote?: string
  modelingNote?: string
  revisionReason?: string
  waxFactorySentAt?: string
  designCompletedAt?: string
  modelingCompletedAt?: string
  status: OrderLineStatus | string
  currentOwner?: string
  priority?: OrderLinePriority
  isUrgent?: boolean
  requiresDesign?: boolean
  requiresModeling?: boolean
  requiresWax?: boolean
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
  productionData?: OrderLineProductionData
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
