import type { OrderLine } from '@/types/order-line'

export type PurchaseAggregateStatus =
  | 'draft'
  | 'in_progress'
  | 'partially_shipped'
  | 'completed'
  | 'after_sales'
  | 'exception'
  | 'cancelled'

export type PurchaseType =
  | 'semi_custom'
  | 'full_custom'
  | 'spot_goods'
  | 'internal'
  | string

export type PurchaseSourceChannel =
  | 'taobao'
  | 'tmall'
  | 'xiaohongshu'
  | 'wechat'
  | 'offline'
  | 'other'
  | string

export type PurchaseFinanceTransactionType =
  | 'deposit_received'
  | 'balance_received'
  | 'platform_refund'
  | 'offline_refund'
  | 'after_sales_payment'
  | 'after_sales_refund'

export type PurchaseFinanceTransaction = {
  id: string
  type: PurchaseFinanceTransactionType
  amount: number
  occurredAt: string
  note?: string
}

export type PurchaseFinanceInfo = {
  dealPrice?: number
  depositAmount?: number
  balanceAmount?: number
  invoiced?: boolean
  remark?: string
  transactions: PurchaseFinanceTransaction[]
}

export type PurchaseTimelineRecordType =
  | 'order_created'
  | 'purchase_created'
  | 'product_referenced'
  | 'spec_changed'
  | 'quote_recalculated'
  | 'status_changed'
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'remark_updated'

export type PurchaseTimelineRecord = {
  id: string
  purchaseId?: string
  transactionId?: string
  orderId?: string
  type: PurchaseTimelineRecordType
  title: string
  description?: string
  actorName: string
  createdAt: string
  relatedTaskId?: string
  relatedOrderLineId?: string
}

export type Purchase = {
  id: string
  purchaseNo: string
  transactionNo?: string
  platformOrderNo?: string
  sourceChannel: PurchaseSourceChannel
  shopName?: string
  customerId?: string
  purchaseType: PurchaseType
  orderType?: PurchaseType
  ownerName: string
  recipientName?: string
  recipientPhone?: string
  recipientAddress?: string
  paymentAt?: string
  expectedDate?: string
  promisedDate?: string
  riskTags: string[]
  remark?: string
  aggregateStatus: PurchaseAggregateStatus
  orderLineCount: number
  orderLines: OrderLine[]
  finance?: PurchaseFinanceInfo
  latestActivityAt?: string
  timeline: PurchaseTimelineRecord[]
}

export type OrderFinanceTransactionType = PurchaseFinanceTransactionType
export type OrderFinanceTransaction = PurchaseFinanceTransaction
export type OrderFinanceInfo = PurchaseFinanceInfo
export type TimelineRecordType = PurchaseTimelineRecordType
export type TimelineRecord = PurchaseTimelineRecord
