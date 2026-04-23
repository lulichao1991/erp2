import { mockOrders } from '@/mocks/orders'
import type { Order, OrderItem } from '@/types/order'

const clone = <T,>(value: T): T => structuredClone(value)

export const getOrderList = (): Order[] => clone(mockOrders)

export const getOrderById = (orderId: string): Order | undefined =>
  clone(mockOrders.find((item) => item.id === orderId))

export const createDraftOrderItem = (index: number): OrderItem => {
  const timestamp = Date.now()

  return {
    id: `item-${timestamp}-${index}`,
    name: `新商品 ${index}`,
    itemSku: `SKU-DRAFT-${String(index).padStart(3, '0')}`,
    quantity: 1,
    status: '待确认',
    isReferencedProduct: false,
    selectedSpecialOptions: [],
    actualRequirements: {},
    designInfo: {
      designStatus: '待设计',
      assignedDesigner: '',
      requiresRemodeling: false,
      designDeadline: '',
      designNote: ''
    },
    outsourceInfo: {
      outsourceStatus: '未委外',
      supplierName: '',
      plannedDeliveryDate: '',
      outsourceNote: ''
    },
    factoryFeedback: {
      factoryStatus: '待回传',
      returnedWeight: '',
      qualityResult: '',
      factoryNote: ''
    },
    quote: {
      basePrice: undefined,
      priceAdjustments: [],
      systemQuote: undefined,
      status: 'idle',
      warnings: []
    },
    finalDisplayQuote: undefined
  }
}

export const createOrderDraft = (): Order => {
  const timestamp = Date.now()
  const orderId = `draft-${timestamp}`
  const currentTime = new Date().toISOString().slice(0, 16).replace('T', ' ')

  return {
    id: orderId,
    orderNo: `SO-DRAFT-${timestamp.toString().slice(-6)}`,
    platformOrderNo: '',
    orderType: '销售订单',
    ownerName: '待分配',
    hasAdditionalContact: false,
    isPositiveReview: false,
    platformCustomerId: '',
    sourceChannel: '',
    registeredAt: currentTime,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerRemark: '',
    status: 'draft',
    priority: 'normal',
    riskTags: [],
    promisedDate: '',
    expectedDate: '',
    plannedDate: '',
    paymentDate: '',
    finance: {
      dealPrice: undefined,
      depositAmount: undefined,
      balanceAmount: undefined,
      invoiced: false,
      remark: '',
      transactions: []
    },
    remark: '',
    latestActivityAt: currentTime,
    items: [createDraftOrderItem(1)],
    timeline: [
      {
        id: `timeline-${timestamp}`,
        orderId,
        type: 'order_created',
        title: '创建草稿订单',
        description: '新建订单后默认进入草稿状态，等待补充客户信息和商品。',
        actorName: '当前用户',
        createdAt: currentTime
      }
    ]
  }
}
