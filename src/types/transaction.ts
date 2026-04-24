/**
 * Purchase compatibility aliases.
 *
 * Current system mainline uses Purchase from '@/types/purchase'.
 * TransactionRecord is retained only as a historical alias for legacy imports.
 */
export type {
  OrderFinanceInfo,
  OrderFinanceTransaction,
  OrderFinanceTransactionType,
  PurchaseAggregateStatus as TransactionAggregateStatus,
  PurchaseSourceChannel as TransactionSourceChannel,
  PurchaseType as TransactionOrderType,
  Purchase as TransactionRecord,
  TimelineRecord,
  TimelineRecordType
} from '@/types/purchase'
