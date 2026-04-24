import type { AfterSalesCase, LogisticsRecord } from '@/types/supporting-records'

export const logisticsMock: LogisticsRecord[] = [
  {
    id: 'logistics-pendant-001',
    orderLineId: 'oi-pendant-001',
    purchaseId: 'o-202604-001',
    transactionId: 'o-202604-001',
    logisticsType: 'goods',
    direction: 'outbound',
    company: '顺丰速运',
    carrier: '顺丰速运',
    trackingNo: 'SF202604280001',
    shippedAt: '2026-04-28 09:10',
    remark: '山形吊坠已创建物流单号，等待揽件。',
    note: '山形吊坠已创建物流单号，等待揽件。'
  }
]

export const afterSalesMock: AfterSalesCase[] = [
  {
    id: 'after-sales-ring-001',
    orderLineId: 'oi-ring-001',
    purchaseId: 'o-202604-001',
    transactionId: 'o-202604-001',
    type: 'resize',
    status: 'open',
    createdAt: '2026-04-24 11:20',
    note: '张三提前反馈戒围可能偏紧，先在戒指商品行上记录售后预警。'
  }
]

// Compatibility exports for existing imports.
export const mockLogisticsRecords = logisticsMock
export const mockAfterSalesCases = afterSalesMock
