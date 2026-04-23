import type { Order, OrderFinanceTransactionType } from '@/types/order'

const incomeTransactionTypes: OrderFinanceTransactionType[] = ['deposit_received', 'balance_received', 'after_sales_payment']
const refundTransactionTypes: OrderFinanceTransactionType[] = ['platform_refund', 'offline_refund', 'after_sales_refund']

export const getOrderFinanceTransactionLabel = (type: OrderFinanceTransactionType) => {
  switch (type) {
    case 'deposit_received':
      return '定金收款'
    case 'balance_received':
      return '尾款收款'
    case 'platform_refund':
      return '平台退款'
    case 'offline_refund':
      return '线下退款'
    case 'after_sales_payment':
      return '售后补款'
    case 'after_sales_refund':
      return '售后退款'
    default:
      return type
  }
}

export const getOrderReferencePrice = (order: Order) =>
  order.items.reduce((sum, item) => sum + (typeof item.quote?.systemQuote === 'number' ? item.quote.systemQuote : 0), 0)

export const calculateOrderFinanceSummary = (order: Order) => {
  const transactions = order.finance?.transactions ?? []
  const totalReceived = transactions.filter((item) => incomeTransactionTypes.includes(item.type)).reduce((sum, item) => sum + item.amount, 0)
  const totalRefunded = transactions.filter((item) => refundTransactionTypes.includes(item.type)).reduce((sum, item) => sum + item.amount, 0)

  return {
    referencePrice: getOrderReferencePrice(order),
    dealPrice: order.finance?.dealPrice,
    depositAmount: order.finance?.depositAmount,
    balanceAmount: order.finance?.balanceAmount,
    totalReceived,
    totalRefunded,
    netReceived: totalReceived - totalRefunded
  }
}
