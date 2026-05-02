import type { AfterSalesCase, LogisticsRecord } from '@/types/supporting-records'

export const logisticsMock: LogisticsRecord[] = [
  {
    id: 'logistics-pendant-001',
    orderLineId: 'oi-pendant-001',
    purchaseId: 'o-202604-001',
    logisticsType: 'goods',
    direction: 'outbound',
    company: '顺丰速运',
    trackingNo: 'SF202604280001',
    shippedAt: '2026-04-28 09:10',
    remark: '山形吊坠已创建物流单号，等待揽件。'
  }
]

export const afterSalesMock: AfterSalesCase[] = [
  {
    id: 'after-sales-ring-001',
    orderLineId: 'oi-ring-001',
    purchaseId: 'o-202604-001',
    customerId: 'customer-zhang-001',
    type: 'resize',
    status: 'open',
    reason: '客户反馈戒围可能偏紧',
    responsibleParty: '王客服',
    createdAt: '2026-04-24 11:20',
    remark: '张三提前反馈戒围可能偏紧，先在戒指销售上记录售后预警。'
  }
]
