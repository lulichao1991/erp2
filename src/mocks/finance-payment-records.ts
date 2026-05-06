import type { FinancePaymentRecord } from '@/types/finance'

export const financePaymentRecordsMock: FinancePaymentRecord[] = [
  {
    id: 'finance-payment-ring-deposit-001',
    orderLineId: 'oi-ring-001',
    purchaseId: 'o-202604-001',
    amount: 1220,
    method: 'platform',
    recordType: 'deposit',
    occurredAt: '2026-04-21 10:42',
    note: '戒指定金分摊。'
  },
  {
    id: 'finance-payment-ring-refund-001',
    orderLineId: 'oi-ring-001',
    purchaseId: 'o-202604-001',
    amount: 120,
    method: 'refund',
    recordType: 'refund',
    reviewStatus: 'pending',
    occurredAt: '2026-04-24 18:10',
    note: '戒围复核后退还加急差额。'
  },
  {
    id: 'finance-payment-pendant-deposit-001',
    orderLineId: 'oi-pendant-001',
    purchaseId: 'o-202604-001',
    amount: 750,
    method: 'platform',
    recordType: 'deposit',
    occurredAt: '2026-04-21 10:42',
    note: '吊坠定金分摊。'
  },
  {
    id: 'finance-payment-pendant-final-001',
    orderLineId: 'oi-pendant-001',
    purchaseId: 'o-202604-001',
    amount: 530,
    method: 'transfer',
    recordType: 'final_payment',
    occurredAt: '2026-04-25 16:10',
    note: '吊坠尾款已收。'
  },
  {
    id: 'finance-payment-necklace-old-gold-001',
    orderLineId: 'ol-zhang-necklace-001',
    purchaseId: 'o-202604-001',
    amount: 1000,
    method: 'old_gold',
    recordType: 'old_gold',
    inventoryItemId: 'inventory-old-gold-necklace-001',
    inventoryCode: 'INV-OG-202604-005',
    occurredAt: '2026-04-22 15:30',
    note: '客户旧金抵扣，已同步登记库存资产。'
  },
  {
    id: 'finance-payment-necklace-supplement-001',
    orderLineId: 'ol-zhang-necklace-001',
    purchaseId: 'o-202604-001',
    amount: 360,
    method: 'transfer',
    recordType: 'supplement',
    reviewStatus: 'pending',
    occurredAt: '2026-04-24 11:20',
    reason: '客户追加手工錾刻需求。',
    note: '客户追加吊牌手工錾刻补款。'
  },
  {
    id: 'finance-payment-factory-pending-deposit-001',
    orderLineId: 'ol-zhang-factory-pending-001',
    purchaseId: 'o-202604-001',
    amount: 1100,
    method: 'platform',
    recordType: 'deposit',
    occurredAt: '2026-04-25 10:15',
    note: '试产胸针定金分摊。'
  }
]
