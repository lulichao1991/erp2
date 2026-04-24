export type LogisticsType = 'measurement_tool' | 'goods' | 'after_sales' | 'other'

export type LogisticsDirection = 'outbound' | 'return'

export type LogisticsRecord = {
  id: string
  orderLineId: string
  purchaseId?: string
  transactionId?: string
  logisticsType?: LogisticsType
  direction?: LogisticsDirection
  company?: string
  carrier?: string
  trackingNo?: string
  shippedAt?: string
  signedAt?: string
  deliveredAt?: string
  remark?: string
  note?: string
}

export type AfterSalesCaseType = 'repair' | 'resize' | 'refund' | 'exchange' | 'other'

export type AfterSalesCaseStatus = 'open' | 'in_progress' | 'closed'

export type AfterSalesCase = {
  id: string
  orderLineId: string
  purchaseId?: string
  transactionId?: string
  type?: AfterSalesCaseType
  status?: AfterSalesCaseStatus
  createdAt?: string
  closedAt?: string
  note?: string
}
