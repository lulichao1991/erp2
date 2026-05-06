export type FinancePaymentMethod = 'cash' | 'transfer' | 'platform' | 'old_gold' | 'refund'

export type FinancePaymentRecordType = 'deposit' | 'final_payment' | 'supplement' | 'refund' | 'old_gold'

export type FinancePaymentReviewStatus = 'pending' | 'reviewed'

export type FinancePaymentRecord = {
  id: string
  orderLineId: string
  purchaseId?: string
  amount: number
  method: FinancePaymentMethod
  recordType?: FinancePaymentRecordType
  reviewStatus?: FinancePaymentReviewStatus
  reviewedAt?: string
  inventoryItemId?: string
  inventoryCode?: string
  occurredAt: string
  reason?: string
  note?: string
}
