export type LogisticsType = 'measurement_tool' | 'goods' | 'after_sales' | 'other'

export type LogisticsDirection = 'outbound' | 'return'

export type LogisticsRecordStatus = 'active' | 'voided'

export type LogisticsRecord = {
  id: string
  orderLineId: string
  purchaseId?: string
  recordStatus?: LogisticsRecordStatus
  logisticsType?: LogisticsType
  direction?: LogisticsDirection
  company?: string
  trackingNo?: string
  shippedAt?: string
  signedAt?: string
  voidedAt?: string
  voidReason?: string
  remark?: string
}

export type AfterSalesCaseType = 'resize' | 'repair' | 'repolish' | 'remake' | 'resend' | 'refund' | 'exchange' | 'other'

export type AfterSalesCaseStatus = 'open' | 'processing' | 'waiting_return' | 'resolved' | 'closed' | 'in_progress'

export type AfterSalesCase = {
  id: string
  orderLineId: string
  purchaseId?: string
  customerId?: string
  type?: AfterSalesCaseType
  reason?: string
  status?: AfterSalesCaseStatus
  responsibleParty?: string
  createdAt?: string
  closedAt?: string
  remark?: string
}
