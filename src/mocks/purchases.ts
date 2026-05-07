import { customerMock, internalCustomerMock, linCustomerMock, zhaoCustomerMock } from '@/mocks/customers'
import { orderLinesMock } from '@/mocks/order-lines'
import type { Purchase } from '@/types/purchase'

const getPurchaseOrderLines = (purchaseId: string) => orderLinesMock.filter((line) => line.purchaseId === purchaseId)

const zhangOrderLines = getPurchaseOrderLines('o-202604-001')
const linOrderLines = getPurchaseOrderLines('o-202604-002')
const zhaoOrderLines = getPurchaseOrderLines('o-202603-118')
const internalOrderLines = getPurchaseOrderLines('purchase-internal-rd-001')

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
  remark: '张三一次购买多件商品：戒指生产中、吊坠待财务确认、项链待设计、手链待建模，另有耳钉待跟单审核、胸针生产阻塞、手镯完工待审核。',
  aggregateStatus: 'in_progress',
  orderLineCount: zhangOrderLines.length,
  orderLines: zhangOrderLines,
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

export const linFullCustomPurchaseMock: Purchase = {
  id: 'o-202604-002',
  purchaseNo: 'PUR-202604-002',
  platformOrderNo: 'XHS-20260426-77',
  sourceChannel: 'xiaohongshu',
  shopName: '小红书定制号',
  customerId: linCustomerMock.id,
  purchaseType: 'full_custom',
  ownerName: '张晨',
  recipientName: linCustomerMock.defaultRecipientName,
  recipientPhone: linCustomerMock.defaultRecipientPhone,
  recipientAddress: linCustomerMock.defaultRecipientAddress,
  paymentAt: '2026-04-26 09:10',
  expectedDate: '2026-05-09',
  promisedDate: '2026-05-11',
  riskTags: ['全定制', '无来源款式', '设计建模分流'],
  remark: '林小姐全定制购买记录，两条销售均不引用款式模板：戒指待设计，吊坠待建模。',
  aggregateStatus: 'in_progress',
  orderLineCount: linOrderLines.length,
  orderLines: linOrderLines,
  finance: {
    dealPrice: 5080,
    depositAmount: 3000,
    balanceAmount: 2080,
    depositStatus: 'confirmed',
    finalPaymentStatus: 'pending',
    invoiced: false,
    remark: '全定制购买记录只做付款汇总，销售分别推进设计与建模。',
    financeNote: '尾款待设计建模确认后再收取。',
    transactions: [
      {
        id: 'finance-purchase-lin-001-deposit',
        type: 'deposit_received',
        amount: 3000,
        occurredAt: '2026-04-26 09:10',
        note: '林小姐全定制定金'
      }
    ]
  },
  latestActivityAt: '2026-04-26 18:30',
  timeline: [
    {
      id: 'tl-purchase-lin-created',
      purchaseId: 'o-202604-002',
      type: 'purchase_created',
      title: '创建全定制购买记录',
      description: '同一次购买下创建纪念戒和星月吊坠两条全定制销售。',
      actorName: '张晨',
      createdAt: '2026-04-26 09:10'
    },
    {
      id: 'tl-purchase-lin-pendant-design-completed',
      purchaseId: 'o-202604-002',
      type: 'status_changed',
      title: '星月吊坠进入建模',
      description: '吊坠设计确认完成，转交建模出蜡。',
      actorName: '王设计',
      createdAt: '2026-04-26 18:30',
      relatedOrderLineId: 'ol-lin-custom-pendant-modeling-001'
    }
  ]
}

export const zhaoSpotPurchaseMock: Purchase = {
  id: 'o-202603-118',
  purchaseNo: 'PUR-202603-118',
  platformOrderNo: 'OFF-20260328-18',
  sourceChannel: 'offline',
  shopName: '线下门店',
  customerId: zhaoCustomerMock.id,
  purchaseType: 'spot_goods',
  ownerName: '王客服',
  recipientName: zhaoCustomerMock.defaultRecipientName,
  recipientPhone: zhaoCustomerMock.defaultRecipientPhone,
  recipientAddress: zhaoCustomerMock.defaultRecipientAddress,
  paymentAt: '2026-03-28 14:20',
  expectedDate: '2026-03-29',
  promisedDate: '2026-03-30',
  riskTags: ['现货', '库存出库', '财务已确认'],
  remark: '赵女士购买现货山形纪念戒，库存占用并出库，财务已全款确认。',
  aggregateStatus: 'partially_shipped',
  orderLineCount: zhaoOrderLines.length,
  orderLines: zhaoOrderLines,
  finance: {
    dealPrice: 1680,
    depositAmount: 1680,
    balanceAmount: 0,
    depositStatus: 'confirmed',
    finalPaymentStatus: 'not_required',
    invoiced: false,
    remark: '现货全款已确认，商品行财务流水为权威来源。',
    financeNote: '等待物流签收。',
    transactions: [
      {
        id: 'finance-purchase-zhao-001-full',
        type: 'deposit_received',
        amount: 1680,
        occurredAt: '2026-03-28 14:20',
        note: '赵女士现货戒指全款'
      }
    ]
  },
  latestActivityAt: '2026-03-28 16:20',
  timeline: [
    {
      id: 'tl-purchase-zhao-created',
      purchaseId: 'o-202603-118',
      type: 'purchase_created',
      title: '创建现货购买记录',
      description: '现货山形纪念戒关联库存资产并进入出库发货。',
      actorName: '王客服',
      createdAt: '2026-03-28 14:20'
    },
    {
      id: 'tl-purchase-zhao-inventory-outbound',
      purchaseId: 'o-202603-118',
      type: 'status_changed',
      title: '库存现货出库',
      description: '库存商品 INV-SP-202603-118 已关联销售出库。',
      actorName: '周库管',
      createdAt: '2026-03-28 16:20',
      relatedOrderLineId: 'oi-ring-118'
    }
  ]
}

export const internalRdPurchaseMock: Purchase = {
  id: 'purchase-internal-rd-001',
  purchaseNo: 'PUR-INTERNAL-202605-001',
  sourceChannel: 'other',
  shopName: '内部研发',
  customerId: internalCustomerMock.id,
  purchaseType: 'internal',
  ownerName: '研发负责人',
  paymentAt: '2026-05-01 09:00',
  expectedDate: '2026-05-04',
  promisedDate: '2026-05-04',
  riskTags: ['内部订单', '新品研发', '无客户收款'],
  remark: '内部新品研发购买记录，用于验证 internal Purchase 和 completed OrderLine 不混入客户销售收款。',
  aggregateStatus: 'completed',
  orderLineCount: internalOrderLines.length,
  orderLines: internalOrderLines,
  finance: {
    dealPrice: 0,
    depositAmount: 0,
    balanceAmount: 0,
    depositStatus: 'not_required',
    finalPaymentStatus: 'not_required',
    invoiced: false,
    remark: '内部研发样品不产生客户收款；成本后续可由管理报表单独统计。',
    financeNote: '当前前端 mock 中财务不需要确认。',
    transactions: []
  },
  latestActivityAt: '2026-05-04 10:00',
  timeline: [
    {
      id: 'tl-purchase-internal-rd-created',
      purchaseId: 'purchase-internal-rd-001',
      type: 'purchase_created',
      title: '创建内部研发记录',
      description: '内部新品打样，不关联外部客户收款。',
      actorName: '研发负责人',
      createdAt: '2026-05-01 09:00',
      relatedOrderLineId: 'ol-internal-sample-completed-001'
    },
    {
      id: 'tl-purchase-internal-rd-completed',
      purchaseId: 'purchase-internal-rd-001',
      type: 'status_changed',
      title: '内部样品完成',
      description: '研发样品已完成并入研发样品库。',
      actorName: '研发负责人',
      createdAt: '2026-05-04 10:00',
      relatedOrderLineId: 'ol-internal-sample-completed-001'
    }
  ]
}

export const cancelledPurchaseMock: Purchase = {
  id: 'purchase-cancelled-202604-001',
  purchaseNo: 'PUR-CANCELLED-202604-001',
  platformOrderNo: 'TB-CANCEL-202604-01',
  sourceChannel: 'taobao',
  shopName: '珠宝定制旗舰店',
  customerId: zhaoCustomerMock.id,
  purchaseType: 'semi_custom',
  ownerName: '王客服',
  recipientName: zhaoCustomerMock.defaultRecipientName,
  recipientPhone: zhaoCustomerMock.defaultRecipientPhone,
  recipientAddress: zhaoCustomerMock.defaultRecipientAddress,
  paymentAt: '2026-04-18 12:00',
  riskTags: ['已取消', '未生成销售'],
  remark: '客户下单后取消，本记录用于覆盖 cancelled Purchase seed；未生成 OrderLine，不进入生产、仓库或财务主流程。',
  aggregateStatus: 'cancelled',
  orderLineCount: 0,
  orderLines: [],
  finance: {
    dealPrice: 0,
    depositAmount: 0,
    balanceAmount: 0,
    depositStatus: 'not_required',
    finalPaymentStatus: 'not_required',
    invoiced: false,
    remark: '取消购买记录，无收款流水。',
    transactions: []
  },
  latestActivityAt: '2026-04-18 12:20',
  timeline: [
    {
      id: 'tl-purchase-cancelled-created',
      purchaseId: 'purchase-cancelled-202604-001',
      type: 'purchase_created',
      title: '创建购买记录',
      description: '客户咨询后临时下单。',
      actorName: '王客服',
      createdAt: '2026-04-18 12:00'
    },
    {
      id: 'tl-purchase-cancelled-closed',
      purchaseId: 'purchase-cancelled-202604-001',
      type: 'status_changed',
      title: '取消购买记录',
      description: '客户确认取消，未生成销售和生产任务。',
      actorName: '王客服',
      createdAt: '2026-04-18 12:20'
    }
  ]
}

export const purchasesMock: Purchase[] = [purchaseMock, linFullCustomPurchaseMock, zhaoSpotPurchaseMock, internalRdPurchaseMock, cancelledPurchaseMock]
