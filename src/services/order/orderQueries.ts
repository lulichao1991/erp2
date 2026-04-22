import { mockOrders } from '@/mocks/orders'
import type { Order } from '@/types/order'

const clone = <T,>(value: T): T => structuredClone(value)

export const getOrderList = (): Order[] => clone(mockOrders)

export const getOrderById = (orderId: string): Order | undefined =>
  clone(mockOrders.find((item) => item.id === orderId))

export const createOrderDraft = (): Order => ({
  id: `draft-${Date.now()}`,
  orderNo: `SO-DRAFT-${new Date().getTime().toString().slice(-6)}`,
  platformOrderNo: '',
  orderType: '平台定制',
  ownerName: '待分配',
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  customerRemark: '',
  status: '草稿',
  riskTags: [],
  promisedDate: '',
  expectedDate: '',
  paymentDate: '',
  remark: '',
  items: [
    {
      id: `item-${Date.now()}`,
      name: '新商品',
      quantity: 1,
      status: '待引用',
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
      }
    }
  ]
})
