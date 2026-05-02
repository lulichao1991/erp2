import { customerMock } from '@/mocks/customers'
import { orderLinesMock } from '@/mocks/order-lines'
import type { Purchase } from '@/types/purchase'

export const purchaseMock: Purchase = {
  id: 'o-202604-001',
  purchaseNo: 'PUR-202604-001',
  platformOrderNo: 'TB-9938201',
  sourceChannel: 'taobao',
  shopName: '珠宝定制旗舰店',
  customerId: customerMock.id,
  purchaseType: 'semi_custom',
  ownerName: '王客服',
  recipientName: customerMock.defaultRecipientName,
  recipientPhone: customerMock.defaultRecipientPhone,
  recipientAddress: customerMock.defaultRecipientAddress,
  paymentAt: '2026-04-21 10:45',
  expectedDate: '2026-04-30',
  promisedDate: '2026-05-02',
  riskTags: ['同次购买多件商品', '单件售后独立跟进'],
  remark: '张三一次购买多件商品：戒指生产中、吊坠待财务确认、项链待设计、手链待建模，另有耳钉待跟单审核、胸针生产阻塞。',
  aggregateStatus: 'in_progress',
  orderLineCount: orderLinesMock.length,
  orderLines: orderLinesMock,
  finance: {
    dealPrice: 8500,
    depositAmount: 5000,
    balanceAmount: 3500,
    depositStatus: 'confirmed',
    finalPaymentStatus: 'pending',
    invoiced: false,
    remark: '购买记录只汇总财务，商品推进以销售为准。',
    financeNote: '尾款待财务复核后确认。',
    transactions: [
      {
        id: 'finance-purchase-001-deposit',
        type: 'deposit_received',
        amount: 5000,
        occurredAt: '2026-04-21 10:45',
        note: '张三首笔定金'
      },
      {
        id: 'finance-purchase-001-balance',
        type: 'balance_received',
        amount: 3500,
        occurredAt: '2026-04-24 14:00',
        note: '补齐尾款'
      },
      {
        id: 'finance-purchase-001-after-sales-payment',
        type: 'after_sales_payment',
        amount: 500,
        occurredAt: '2026-04-24 16:30',
        note: '戒指戒围复核预留售后补款'
      }
    ]
  },
  latestActivityAt: '2026-04-24 16:30',
  timeline: [
    {
      id: 'tl-purchase-001-created',
      purchaseId: 'o-202604-001',
      type: 'purchase_created',
      title: '创建购买记录',
      description: '同一次购买下创建山形素圈戒指、如意吊坠、定制项链、手链蜡版等多条销售。',
      actorName: '王客服',
      createdAt: '2026-04-21 10:45'
    },
    {
      id: 'tl-purchase-001-ring-production',
      purchaseId: 'o-202604-001',
      type: 'status_changed',
      title: '山形戒指进入生产',
      description: '戒指销售独立推进到生产中。',
      actorName: '李生产',
      createdAt: '2026-04-23 09:30',
      relatedOrderLineId: 'oi-ring-001'
    },
    {
      id: 'tl-purchase-001-necklace-design',
      purchaseId: 'o-202604-001',
      type: 'status_changed',
      title: '定制项链进入设计',
      description: '项链销售仍在设计中，不影响吊坠发货。',
      actorName: '陈设计',
      createdAt: '2026-04-24 16:30',
      relatedOrderLineId: 'ol-zhang-necklace-001'
    }
  ]
}

export const purchasesMock: Purchase[] = [purchaseMock]
