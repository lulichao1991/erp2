import type { Customer } from '@/types/customer'
import type { InventoryItem, InventoryItemCondition, InventoryItemSourceType, InventoryItemStatus, InventoryMovement, InventoryMovementType } from '@/types/inventory'
import type { OrderLine } from '@/types/order-line'
import type { Product } from '@/types/product'
import type { Purchase } from '@/types/purchase'

export type InventoryQuickView = 'all' | 'design_samples' | 'customer_returns' | 'needs_review' | 'reserved' | 'unavailable'

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

export const inventoryMovementTypeLabelMap: Record<InventoryMovementType, string> = {
  inbound: '入库',
  reserve: '占用',
  release: '释放',
  outbound: '出库',
  scrap: '报废',
  adjust: '调整'
}

export type InventoryFilters = {
  keyword: string
  quickView: InventoryQuickView
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
  reservedCount: number
  unavailableCount: number
}

export type InventoryMovementInput = {
  type: InventoryMovementType
  quantity: number
  operatorName: string
  occurredAt: string
  toLocation?: string
  relatedOrderLineId?: string
  note?: string
}

export type InventoryMovementResult = {
  item: InventoryItem
  movement: InventoryMovement
}

export type InventoryReviewInput = {
  condition: InventoryItemCondition
  status: InventoryItemStatus
  availableQuantity: number
  operatorName: string
  occurredAt: string
  toLocation?: string
  note?: string
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
    if (filters.quickView === 'design_samples' && row.item.sourceType !== 'design_sample') {
      return false
    }

    if (filters.quickView === 'customer_returns' && row.item.sourceType !== 'customer_return') {
      return false
    }

    if (filters.quickView === 'needs_review' && !['repair_needed', 'defective'].includes(row.item.condition)) {
      return false
    }

    if (filters.quickView === 'reserved' && row.item.status !== 'reserved') {
      return false
    }

    if (filters.quickView === 'unavailable' && row.item.availableQuantity > 0 && !['outbound', 'scrapped'].includes(row.item.status)) {
      return false
    }

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
  needsReviewCount: rows.filter((row) => row.item.condition === 'repair_needed' || row.item.condition === 'defective').length,
  reservedCount: rows.filter((row) => row.item.status === 'reserved').length,
  unavailableCount: rows.filter((row) => row.item.availableQuantity <= 0 || row.item.status === 'outbound' || row.item.status === 'scrapped').length
})

export const applyInventoryMovement = (item: InventoryItem, input: InventoryMovementInput): InventoryMovementResult => {
  const quantity = Math.max(0, Math.floor(input.quantity))
  const fromStatus = item.status
  const fromLocation = item.warehouseLocation
  let nextItem: InventoryItem = { ...item }

  if (quantity <= 0) {
    throw new Error('库存流转数量必须大于 0')
  }

  if (input.type === 'reserve') {
    if (quantity > item.availableQuantity) {
      throw new Error('占用数量不能大于可用数量')
    }
    const availableQuantity = item.availableQuantity - quantity
    nextItem = {
      ...item,
      availableQuantity,
      status: availableQuantity === 0 ? 'reserved' : item.status
    }
  }

  if (input.type === 'release') {
    const availableQuantity = Math.min(item.quantity, item.availableQuantity + quantity)
    nextItem = {
      ...item,
      availableQuantity,
      status: availableQuantity > 0 ? 'in_stock' : item.status
    }
  }

  if (input.type === 'outbound') {
    if (quantity > item.quantity) {
      throw new Error('出库数量不能大于库存数量')
    }
    const nextQuantity = item.quantity - quantity
    const availableQuantity = Math.min(item.availableQuantity, nextQuantity)
    nextItem = {
      ...item,
      quantity: nextQuantity,
      availableQuantity,
      status: nextQuantity === 0 ? 'outbound' : availableQuantity > 0 ? 'in_stock' : 'reserved'
    }
  }

  if (input.type === 'scrap') {
    if (quantity > item.quantity) {
      throw new Error('报废数量不能大于库存数量')
    }
    const nextQuantity = item.quantity - quantity
    const availableQuantity = Math.min(item.availableQuantity, nextQuantity)
    nextItem = {
      ...item,
      quantity: nextQuantity,
      availableQuantity,
      condition: nextQuantity === 0 ? item.condition : 'defective',
      status: nextQuantity === 0 ? 'scrapped' : item.status
    }
  }

  if (input.type === 'adjust') {
    nextItem = {
      ...item,
      warehouseLocation: input.toLocation?.trim() || item.warehouseLocation
    }
  }

  if (input.type === 'inbound') {
    nextItem = {
      ...item,
      quantity: item.quantity + quantity,
      availableQuantity: item.availableQuantity + quantity,
      warehouseLocation: input.toLocation?.trim() || item.warehouseLocation,
      status: 'in_stock'
    }
  }

  const movement: InventoryMovement = {
    id: `movement-${item.id}-${input.type}-${input.occurredAt.replace(/[^0-9]/g, '')}`,
    inventoryItemId: item.id,
    inventoryCode: item.inventoryCode,
    type: input.type,
    quantity,
    operatorName: input.operatorName,
    occurredAt: input.occurredAt,
    fromStatus,
    toStatus: nextItem.status,
    fromLocation,
    toLocation: nextItem.warehouseLocation,
    relatedOrderLineId: input.relatedOrderLineId,
    note: input.note
  }

  return {
    item: nextItem,
    movement
  }
}

export const applyInventoryReview = (item: InventoryItem, input: InventoryReviewInput): InventoryMovementResult => {
  const availableQuantity = Math.max(0, Math.floor(input.availableQuantity))

  if (availableQuantity > item.quantity) {
    throw new Error('可用数量不能大于库存数量')
  }

  const nextAvailableQuantity = ['outbound', 'scrapped'].includes(input.status) ? 0 : availableQuantity
  const nextItem: InventoryItem = {
    ...item,
    condition: input.condition,
    status: input.status,
    availableQuantity: nextAvailableQuantity,
    warehouseLocation: input.toLocation?.trim() || item.warehouseLocation,
    remark: input.note?.trim() || item.remark
  }

  const movement: InventoryMovement = {
    id: `movement-${item.id}-review-${input.occurredAt.replace(/[^0-9]/g, '')}`,
    inventoryItemId: item.id,
    inventoryCode: item.inventoryCode,
    type: 'adjust',
    quantity: item.quantity,
    operatorName: input.operatorName,
    occurredAt: input.occurredAt,
    fromStatus: item.status,
    toStatus: nextItem.status,
    fromLocation: item.warehouseLocation,
    toLocation: nextItem.warehouseLocation,
    relatedOrderLineId: item.orderLineId,
    note: input.note?.trim() || '库存质检处置。'
  }

  return {
    item: nextItem,
    movement
  }
}
