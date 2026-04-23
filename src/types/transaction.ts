import type { OrderLine } from '@/types/order-line'

export type TransactionAggregateStatus =
  | 'draft'
  | 'in_progress'
  | 'partially_shipped'
  | 'completed'
  | 'after_sales'
  | 'exception'
  | 'cancelled'

export type TransactionOrderType =
  | 'semi_custom'
  | 'full_custom'
  | 'spot_goods'
  | 'internal'
  | string

export type TransactionSourceChannel =
  | 'taobao'
  | 'tmall'
  | 'xiaohongshu'
  | 'wechat'
  | 'offline'
  | 'other'
  | string

export type OrderFinanceTransactionType =
  | 'deposit_received'
  | 'balance_received'
  | 'platform_refund'
  | 'offline_refund'
  | 'after_sales_payment'
  | 'after_sales_refund'

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
  transactionId?: string
  orderId?: string
  type: TimelineRecordType
  title: string
  description?: string
  actorName: string
  createdAt: string
  relatedTaskId?: string
  relatedOrderLineId?: string
  relatedOrderItemId?: string
}

export type TransactionRecord = {
  id: string
  transactionNo: string
  platformOrderNo?: string
  sourceChannel: TransactionSourceChannel
  shopName?: string
  customerId?: string
  orderType: TransactionOrderType
  ownerName: string
  recipientName?: string
  recipientPhone?: string
  recipientAddress?: string
  paymentAt?: string
  expectedDate?: string
  promisedDate?: string
  riskTags: string[]
  remark?: string
  aggregateStatus: TransactionAggregateStatus
  orderLineCount: number
  orderLines: OrderLine[]
  finance?: OrderFinanceInfo
  latestActivityAt?: string
  timeline: TimelineRecord[]
}
