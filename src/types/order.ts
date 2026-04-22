import type { ProductSpecRow } from '@/types/product'
import type { QuoteResult } from '@/types/quote'

export type SourceProductSnapshot = {
  sourceProductId: string
  sourceProductCode: string
  sourceProductName: string
  sourceProductVersion: string
  sourceSpecValue?: string
}

export type OrderItemActualRequirements = {
  material?: string
  process?: string
  sizeNote?: string
  engraveText?: string
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
}

export type Order = {
  id: string
  orderNo: string
  platformOrderNo?: string
  orderType: string
  ownerName: string
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  customerRemark?: string
  status: string
  riskTags: string[]
  promisedDate?: string
  expectedDate?: string
  paymentDate?: string
  items: OrderItem[]
  remark?: string
}
