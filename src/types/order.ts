import type { ProductSpecRow } from '@/types/product'
import type { QuoteResult } from '@/types/quote'
import type {
  OrderLine,
  OrderLineActualRequirements,
  OrderLineDesignInfo,
  OrderLineOutsourceInfo,
  OrderLinePriority,
  OrderLineProductionInfo,
  OrderLineUploadedFile,
  ProductSnapshot
} from '@/types/order-line'
import type {
  OrderFinanceInfo,
  OrderFinanceTransaction,
  OrderFinanceTransactionType,
  TimelineRecord,
  TimelineRecordType,
  TransactionAggregateStatus
} from '@/types/transaction'

export type {
  OrderLine,
  OrderLineActualRequirements,
  OrderLineDesignInfo,
  OrderLineOutsourceInfo,
  OrderLinePriority,
  OrderLineProductionInfo,
  OrderLineStatus,
  OrderLineUploadedFile,
  ProductSnapshot
} from '@/types/order-line'
export type {
  OrderFinanceInfo,
  OrderFinanceTransaction,
  OrderFinanceTransactionType,
  TimelineRecord,
  TimelineRecordType,
  TransactionAggregateStatus,
  TransactionOrderType,
  TransactionRecord,
  TransactionSourceChannel
} from '@/types/transaction'

// Compatibility layer for the existing page/service code.

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

export type SourceProductSnapshot = ProductSnapshot

export type OrderItemUploadedFile = OrderLineUploadedFile

export type OrderItemActualRequirements = OrderLineActualRequirements & {
  engraveImageFiles?: OrderItemUploadedFile[]
  engravePltFiles?: OrderItemUploadedFile[]
}

export type OrderItemDesignInfo = OrderLineDesignInfo

export type OrderItemOutsourceInfo = OrderLineOutsourceInfo

export type OrderItemFactoryFeedback = OrderLineProductionInfo

export type OrderItem = Omit<OrderLine, 'actualRequirements' | 'designInfo' | 'outsourceInfo' | 'productionInfo' | 'quote'> & {
  itemSku: string
  actualRequirements?: OrderItemActualRequirements
  designInfo?: OrderItemDesignInfo
  outsourceInfo?: OrderItemOutsourceInfo
  factoryFeedback?: OrderItemFactoryFeedback
  quote?: QuoteResult
  priority?: OrderPriority | OrderLinePriority
  selectedSpecSnapshot?: ProductSpecRow
}

export type LegacyTimelineRecord = TimelineRecord

export type Order = {
  id: string
  orderNo: string
  transactionNo?: string
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
  aggregateStatus?: TransactionAggregateStatus
  priority: OrderPriority
  riskTags: string[]
  promisedDate?: string
  expectedDate?: string
  plannedDate?: string
  paymentDate?: string
  paymentAt?: string
  customerId?: string
  recipientName?: string
  recipientPhone?: string
  recipientAddress?: string
  finance?: OrderFinanceInfo
  items: OrderItem[]
  orderLineCount?: number
  orderLines?: OrderLine[]
  remark?: string
  latestActivityAt?: string
  timeline: LegacyTimelineRecord[]
}
