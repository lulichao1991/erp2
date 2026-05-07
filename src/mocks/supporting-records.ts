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
  },
  {
    id: 'logistics-zhao-ring-001',
    orderLineId: 'oi-ring-118',
    purchaseId: 'o-202603-118',
    logisticsType: 'goods',
    direction: 'outbound',
    company: '顺丰速运',
    trackingNo: 'SF202603280118',
    shippedAt: '2026-03-28 16:40',
    signedAt: '2026-03-29 10:20',
    remark: '赵女士现货戒指已出库发货并签收。'
  },
  {
    id: 'logistics-measurement-lin-ring-001',
    orderLineId: 'ol-lin-custom-ring-design-001',
    purchaseId: 'o-202604-002',
    logisticsType: 'measurement_tool',
    direction: 'outbound',
    company: '顺丰速运',
    trackingNo: 'SF202604260771',
    shippedAt: '2026-04-26 11:00',
    signedAt: '2026-04-27 09:30',
    remark: '寄出戒围测量工具，辅助林小姐确认全定制戒指尺寸。'
  },
  {
    id: 'logistics-after-sales-ring-001',
    orderLineId: 'ol-zhang-finance-abnormal-001',
    purchaseId: 'o-202604-001',
    logisticsType: 'after_sales',
    direction: 'return',
    company: '顺丰速运',
    trackingNo: 'SF202604250888',
    shippedAt: '2026-04-25 10:30',
    remark: '客户售后退回尾戒复核，物流记录仍关联单件销售。'
  },
  {
    id: 'logistics-internal-sample-handover-001',
    orderLineId: 'ol-internal-sample-completed-001',
    purchaseId: 'purchase-internal-rd-001',
    logisticsType: 'other',
    direction: 'outbound',
    company: '内部交接',
    trackingNo: 'INTERNAL-RD-202605-001',
    shippedAt: '2026-05-04 10:00',
    signedAt: '2026-05-04 10:30',
    remark: '内部研发样品交接到样品库。'
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
