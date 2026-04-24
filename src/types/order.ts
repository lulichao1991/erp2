/**
 * Legacy /orders compatibility types.
 *
 * Current system mainline uses Purchase + OrderLine + ProductSnapshot.
 * Keep Order / OrderItem / SourceProductSnapshot here only for the old
 * /orders compatibility module and existing legacy page/service imports.
 */
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
  TimelineRecord as PurchaseTimelineRecord,
  TimelineRecordType,
  TransactionAggregateStatus
} from '@/types/transaction'
import type {
  AfterSalesCase,
  AfterSalesCaseStatus,
  AfterSalesCaseType,
  LogisticsRecord
} from '@/types/supporting-records'

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
  AfterSalesCase,
  AfterSalesCaseStatus,
  AfterSalesCaseType,
  LogisticsRecord
} from '@/types/supporting-records'
export type {
  OrderFinanceInfo,
  OrderFinanceTransaction,
  OrderFinanceTransactionType,
  TimelineRecordType,
  TransactionAggregateStatus,
  TransactionOrderType,
  TransactionRecord,
  TransactionSourceChannel
} from '@/types/transaction'

// Compatibility layer for the old /orders page/service code.

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

/**
 * @deprecated Use ProductSnapshot from '@/types/order-line' in current modules.
 */
export type SourceProductSnapshot = ProductSnapshot

/**
 * @deprecated Use OrderLineUploadedFile from '@/types/order-line' in current modules.
 */
export type OrderItemUploadedFile = OrderLineUploadedFile

/**
 * @deprecated Use OrderLineActualRequirements from '@/types/order-line' in current modules.
 */
export type OrderItemActualRequirements = OrderLineActualRequirements & {
  engraveImageFiles?: OrderItemUploadedFile[]
  engravePltFiles?: OrderItemUploadedFile[]
}

/**
 * @deprecated Use OrderLineDesignInfo from '@/types/order-line' in current modules.
 */
export type OrderItemDesignInfo = OrderLineDesignInfo

/**
 * @deprecated Use OrderLineOutsourceInfo from '@/types/order-line' in current modules.
 */
export type OrderItemOutsourceInfo = OrderLineOutsourceInfo

/**
 * @deprecated Use OrderLineProductionInfo from '@/types/order-line' in current modules.
 */
export type OrderItemFactoryFeedback = OrderLineProductionInfo

/**
 * @deprecated Use OrderLine from '@/types/order-line' in current modules.
 */
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

/**
 * @deprecated Use TimelineRecord from '@/types/purchase' in current modules.
 * This old /orders timeline keeps relatedOrderItemId for legacy page/service code.
 */
export type TimelineRecord = PurchaseTimelineRecord & {
  orderId?: string
  relatedOrderItemId?: string
}

/**
 * @deprecated Use TimelineRecord from '@/types/purchase' in current modules.
 */
export type LegacyTimelineRecord = TimelineRecord

/**
 * @deprecated Use Purchase from '@/types/purchase' in current modules.
 */
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
