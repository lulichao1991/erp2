import type { Customer } from '@/types/customer'
import type { InventoryItem, InventoryItemCondition, InventoryItemSourceType, InventoryItemStatus } from '@/types/inventory'
import type { OrderLine } from '@/types/order-line'
import type { Product } from '@/types/product'
import type { Purchase } from '@/types/purchase'

export const inventorySourceTypeLabelMap: Record<InventoryItemSourceType, string> = {
  design_sample: '设计留样',
  customer_return: '客户退货',
  stock_purchase: '常备采购',
  consignment: '寄售库存',
  other: '其他库存'
}

export const inventoryStatusLabelMap: Record<InventoryItemStatus, string> = {
  in_stock: '在库',
  reserved: '已占用',
  outbound: '已出库',
  scrapped: '已报废'
}

export const inventoryConditionLabelMap: Record<InventoryItemCondition, string> = {
  new: '全新',
  sample: '样品',
  returned: '退货',
  repair_needed: '待检修',
  defective: '瑕疵'
}

export type InventoryFilters = {
  keyword: string
  sourceType: InventoryItemSourceType | 'all'
  status: InventoryItemStatus | 'all'
  condition: InventoryItemCondition | 'all'
  location: string
}

export type InventoryRow = {
  item: InventoryItem
  sourceLabel: string
  statusLabel: string
  conditionLabel: string
  productName?: string
  purchaseNo?: string
  orderLineCode?: string
  orderLineName?: string
  customerName?: string
  linkedSummary: string
}

export type InventorySummary = {
  skuCount: number
  totalQuantity: number
  availableQuantity: number
  designSampleCount: number
  customerReturnCount: number
  needsReviewCount: number
}

const includesKeyword = (value: string | undefined, keyword: string) => value?.toLowerCase().includes(keyword) ?? false

export const buildInventoryRows = ({
  inventoryItems,
  products,
  purchases,
  orderLines,
  customers
}: {
  inventoryItems: InventoryItem[]
  products: Product[]
  purchases: Purchase[]
  orderLines: OrderLine[]
  customers: Customer[]
}): InventoryRow[] =>
  inventoryItems.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId)
    const purchase = purchases.find((candidate) => candidate.id === item.purchaseId)
    const orderLine = orderLines.find((candidate) => candidate.id === item.orderLineId)
    const customer = customers.find((candidate) => candidate.id === item.customerId)
    const productName = item.productName || product?.name
    const orderLineCode = orderLine?.lineCode || orderLine?.productionTaskNo
    const orderLineName = orderLine?.name
    const purchaseNo = purchase?.purchaseNo
    const customerName = customer?.name
    const linkedSummary = [
      productName ? `产品：${productName}` : null,
      orderLineCode ? `商品行：${orderLineCode}` : null,
      purchaseNo ? `购买记录：${purchaseNo}` : null,
      customerName ? `客户：${customerName}` : null
    ]
      .filter(Boolean)
      .join(' / ')

    return {
      item,
      sourceLabel: item.sourceLabel || inventorySourceTypeLabelMap[item.sourceType],
      statusLabel: inventoryStatusLabelMap[item.status],
      conditionLabel: inventoryConditionLabelMap[item.condition],
      productName,
      purchaseNo,
      orderLineCode,
      orderLineName,
      customerName,
      linkedSummary: linkedSummary || '无关联对象'
    }
  })

export const filterInventoryRows = (rows: InventoryRow[], filters: InventoryFilters) => {
  const keyword = filters.keyword.trim().toLowerCase()
  const location = filters.location.trim().toLowerCase()

  return rows.filter((row) => {
    if (filters.sourceType !== 'all' && row.item.sourceType !== filters.sourceType) {
      return false
    }

    if (filters.status !== 'all' && row.item.status !== filters.status) {
      return false
    }

    if (filters.condition !== 'all' && row.item.condition !== filters.condition) {
      return false
    }

    if (location && !row.item.warehouseLocation.toLowerCase().includes(location)) {
      return false
    }

    if (!keyword) {
      return true
    }

    return [
      row.item.inventoryCode,
      row.item.name,
      row.item.material,
      row.item.size,
      row.sourceLabel,
      row.productName,
      row.orderLineCode,
      row.orderLineName,
      row.purchaseNo,
      row.customerName,
      row.item.warehouseLocation,
      row.item.keeperName
    ].some((value) => includesKeyword(value, keyword))
  })
}

export const buildInventorySummary = (rows: InventoryRow[]): InventorySummary => ({
  skuCount: rows.length,
  totalQuantity: rows.reduce((sum, row) => sum + row.item.quantity, 0),
  availableQuantity: rows.reduce((sum, row) => sum + row.item.availableQuantity, 0),
  designSampleCount: rows.filter((row) => row.item.sourceType === 'design_sample').length,
  customerReturnCount: rows.filter((row) => row.item.sourceType === 'customer_return').length,
  needsReviewCount: rows.filter((row) => row.item.condition === 'repair_needed' || row.item.condition === 'defective').length
})
