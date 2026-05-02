import type { OrderLine } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'

type OrderLineGoodsNoFields = Pick<OrderLine, 'productionTaskNo'>
type OrderLinePurchaseFields = Pick<OrderLine, 'purchaseId'>

export const orderLineGoodsNoFallback = '待生成'

export const getOrderLineGoodsNo = (line?: Partial<OrderLineGoodsNoFields>, fallback = orderLineGoodsNoFallback) =>
  line?.productionTaskNo || fallback

export const getOrderLinePurchaseId = (line?: Partial<OrderLinePurchaseFields>, purchase?: Pick<Purchase, 'id'>) =>
  line?.purchaseId || purchase?.id

export const isOrderLineInPurchase = (line: Partial<OrderLinePurchaseFields>, purchaseId?: string) =>
  !purchaseId || getOrderLinePurchaseId(line) === purchaseId

export const findPurchaseForOrderLine = <T extends Pick<Purchase, 'id'>>(line: Partial<OrderLinePurchaseFields>, purchases: T[]): T | undefined => {
  const purchaseId = getOrderLinePurchaseId(line)
  return purchases.find((purchase) => purchase.id === purchaseId)
}
