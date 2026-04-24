import { customerMock } from '@/mocks/customers'
import { orderLineCompatibilityExtrasMock, orderLineLegacyStatusMock, orderLinesMock } from '@/mocks/order-lines'
import { transactionsMock } from '@/mocks/transactions'
import type { Order, OrderItem, OrderStatus, TransactionAggregateStatus } from '@/types/order'

const aggregateStatusToOrderStatusMap: Record<TransactionAggregateStatus, OrderStatus> = {
  draft: 'draft',
  in_progress: 'pending_design',
  partially_shipped: 'pending_shipping',
  completed: 'completed',
  after_sales: 'after_sales',
  exception: 'pending_design',
  cancelled: 'cancelled'
}

const sourceChannelLabelMap: Record<string, string> = {
  taobao: '淘宝',
  tmall: '天猫',
  xiaohongshu: '小红书',
  wechat: '微信',
  offline: '线下门店',
  other: '其他'
}

const orderTypeLabelMap: Record<string, string> = {
  semi_custom: '半定制',
  full_custom: '全定制',
  spot_goods: '现货',
  internal: '内部单'
}

const mapOrderLineToOrderItem = (line: (typeof orderLinesMock)[number]): OrderItem => {
  const compatibilityExtras = orderLineCompatibilityExtrasMock[line.id]

  return {
    id: line.id,
    lineNo: line.lineNo,
    lineCode: line.lineCode,
    transactionId: line.transactionId,
    customerId: line.customerId,
    name: line.name,
    category: line.category,
    quantity: line.quantity,
    status: orderLineLegacyStatusMock[line.id] || String(line.status),
    currentOwner: line.currentOwner,
    priority: line.priority,
    isReferencedProduct: line.isReferencedProduct,
    productId: line.productId,
    sourceProduct: line.sourceProduct,
    selectedSpecValue: line.selectedSpecValue,
    selectedSpecSnapshot: line.selectedSpecSnapshot,
    selectedMaterial: line.selectedMaterial,
    selectedProcess: line.selectedProcess,
    selectedSpecialOptions: line.selectedSpecialOptions,
    actualRequirements: line.actualRequirements
      ? {
          ...line.actualRequirements,
          ...compatibilityExtras
        }
      : compatibilityExtras,
    designInfo: line.designInfo,
    outsourceInfo: line.outsourceInfo,
    factoryFeedback: line.productionInfo,
    quote: line.quote,
    expectedDate: line.expectedDate,
    promisedDate: line.promisedDate,
    itemSku: line.itemSku || line.lineCode || line.id,
    manualAdjustment: line.manualAdjustment,
    manualAdjustmentReason: line.manualAdjustmentReason,
    finalDisplayQuote: line.finalDisplayQuote
  }
}

export const mockOrders: Order[] = transactionsMock.map((transaction) => ({
  id: transaction.id,
  orderNo: transaction.transactionNo || transaction.purchaseNo,
  transactionNo: transaction.transactionNo || transaction.purchaseNo,
  platformOrderNo: transaction.platformOrderNo,
  orderType: orderTypeLabelMap[String(transaction.orderType || transaction.purchaseType)] || String(transaction.orderType || transaction.purchaseType),
  ownerName: transaction.ownerName,
  hasAdditionalContact: true,
  isPositiveReview: false,
  platformCustomerId: 'tb_linxiaojie_2218',
  sourceChannel: sourceChannelLabelMap[String(transaction.sourceChannel)] || String(transaction.sourceChannel),
  registeredAt: transaction.paymentAt,
  customerId: transaction.customerId,
  customerName: customerMock.name,
  customerPhone: customerMock.phone,
  customerAddress: customerMock.defaultRecipientAddress,
  customerRemark: customerMock.remark,
  status: 'pending_confirm',
  aggregateStatus: transaction.aggregateStatus,
  priority: 'urgent',
  riskTags: transaction.riskTags,
  promisedDate: transaction.promisedDate,
  expectedDate: transaction.expectedDate,
  plannedDate: '2026-04-24',
  paymentDate: transaction.paymentAt,
  paymentAt: transaction.paymentAt,
  recipientName: transaction.recipientName,
  recipientPhone: transaction.recipientPhone,
  recipientAddress: transaction.recipientAddress,
  finance: transaction.finance,
  items: transaction.orderLines.map(mapOrderLineToOrderItem),
  orderLineCount: transaction.orderLineCount,
  orderLines: transaction.orderLines,
  remark: transaction.remark,
  latestActivityAt: transaction.latestActivityAt,
  timeline: transaction.timeline.map((record) => ({
    id: record.id,
    orderId: transaction.id,
    type: record.type,
    title: record.title,
    description: record.description,
    actorName: record.actorName,
    createdAt: record.createdAt,
    relatedTaskId: record.relatedTaskId,
    relatedOrderItemId: record.relatedOrderLineId
  }))
}))

// Compatibility exports for existing imports.
export const mockOrderLines = orderLinesMock
export const mockTransactionRecords = transactionsMock
