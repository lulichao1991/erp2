import type { Customer } from '@/types/customer'
import type { InventoryItem, InventoryItemCondition, InventoryItemSourceType, InventoryItemStatus, InventoryMovement, InventoryMovementType } from '@/types/inventory'
import type { OrderLine } from '@/types/order-line'
import type { Product } from '@/types/product'
import type { Purchase } from '@/types/purchase'

export type InventoryQuickView = 'all' | 'available' | 'design_samples' | 'customer_returns' | 'needs_review' | 'reserved' | 'pending_outbound' | 'pending_stocktake' | 'low_stock' | 'unavailable'

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
  reservedQuantity: number
  designSampleCount: number
  customerReturnCount: number
  needsReviewCount: number
  reservedCount: number
  lowStockCount: number
  unavailableCount: number
}

export type InventoryLocationSummary = {
  location: string
  skuCount: number
  totalQuantity: number
  availableQuantity: number
  reservedQuantity: number
  needsReviewCount: number
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

export type InventoryOrderLineMovementSummary = {
  orderLineId: string
  orderLineDisplay: string
  reserveQuantity: number
  releaseQuantity: number
  outboundQuantity: number
  movementCount: number
  latestOccurredAt: string
}

export type InventoryAvailabilityStatus = 'available' | 'reserved' | 'unavailable'

export type InventoryReviewStatus = 'clear' | 'needs_review' | 'stocktake_recommended'

export type InventoryReviewInput = {
  condition: InventoryItemCondition
  status: InventoryItemStatus
  availableQuantity: number
  operatorName: string
  occurredAt: string
  toLocation?: string
  note?: string
}

export type InventoryStocktakeInput = {
  countedQuantity: number
  countedAvailableQuantity: number
  operatorName: string
  occurredAt: string
  toLocation?: string
  reason?: string
  note?: string
}

const includesKeyword = (value: string | undefined, keyword: string) => value?.toLowerCase().includes(keyword) ?? false

export const isLowStockInventoryRow = (row: InventoryRow) =>
  ['stock_purchase', 'consignment', 'other'].includes(row.item.sourceType) &&
  row.item.status === 'in_stock' &&
  row.item.availableQuantity > 0 &&
  row.item.availableQuantity <= 1

export const getInventoryReservedQuantity = (item: InventoryItem) => Math.max(0, item.quantity - item.availableQuantity)

export const getInventoryAvailabilityStatus = (item: InventoryItem): InventoryAvailabilityStatus => {
  if (item.availableQuantity > 0 && !['outbound', 'scrapped'].includes(item.status)) {
    return 'available'
  }

  if (getInventoryReservedQuantity(item) > 0 && !['outbound', 'scrapped'].includes(item.status)) {
    return 'reserved'
  }

  return 'unavailable'
}

export const getInventoryReviewStatus = (item: InventoryItem): InventoryReviewStatus => {
  if (['repair_needed', 'defective'].includes(item.condition)) {
    return 'needs_review'
  }

  if (item.status === 'reserved') {
    return 'stocktake_recommended'
  }

  return 'clear'
}

export const getInventoryWorkbenchBadges = (row: InventoryRow) => {
  const badges: string[] = []
  const availability = getInventoryAvailabilityStatus(row.item)
  const reviewStatus = getInventoryReviewStatus(row.item)

  if (availability === 'available') {
    badges.push('可领用')
  }

  if (availability === 'reserved') {
    badges.push('已占用')
  }

  if (availability === 'unavailable') {
    badges.push('不可用')
  }

  if (reviewStatus === 'needs_review') {
    badges.push('待质检')
  }

  if (reviewStatus === 'stocktake_recommended') {
    badges.push('建议盘点')
  }

  if (isLowStockInventoryRow(row)) {
    badges.push('低库存')
  }

  if (isPendingOutboundInventoryRow(row)) {
    badges.push('待出库')
  }

  return badges
}

export const isAvailableInventoryRow = (row: InventoryRow) => getInventoryAvailabilityStatus(row.item) === 'available'

export const isPendingOutboundInventoryRow = (row: InventoryRow) => getInventoryReservedQuantity(row.item) > 0 && Boolean(row.item.orderLineId)

export const isPendingStocktakeInventoryRow = (row: InventoryRow) => getInventoryReviewStatus(row.item) !== 'clear'

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
      orderLineCode ? `销售：${orderLineCode}` : null,
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
    if (filters.quickView === 'available' && !isAvailableInventoryRow(row)) {
      return false
    }

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

    if (filters.quickView === 'pending_outbound' && !isPendingOutboundInventoryRow(row)) {
      return false
    }

    if (filters.quickView === 'pending_stocktake' && !isPendingStocktakeInventoryRow(row)) {
      return false
    }

    if (filters.quickView === 'low_stock' && !isLowStockInventoryRow(row)) {
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
  reservedQuantity: rows.reduce((sum, row) => sum + getInventoryReservedQuantity(row.item), 0),
  designSampleCount: rows.filter((row) => row.item.sourceType === 'design_sample').length,
  customerReturnCount: rows.filter((row) => row.item.sourceType === 'customer_return').length,
  needsReviewCount: rows.filter((row) => getInventoryReviewStatus(row.item) === 'needs_review').length,
  reservedCount: rows.filter((row) => row.item.status === 'reserved').length,
  lowStockCount: rows.filter(isLowStockInventoryRow).length,
  unavailableCount: rows.filter((row) => getInventoryAvailabilityStatus(row.item) === 'unavailable').length
})

export const buildInventoryLocationSummaries = (rows: InventoryRow[]): InventoryLocationSummary[] => {
  const summaries = new Map<string, InventoryLocationSummary>()

  rows.forEach((row) => {
    const location = row.item.warehouseLocation || '未分配库位'
    const current = summaries.get(location) ?? {
      location,
      skuCount: 0,
      totalQuantity: 0,
      availableQuantity: 0,
      reservedQuantity: 0,
      needsReviewCount: 0
    }

    summaries.set(location, {
      ...current,
      skuCount: current.skuCount + 1,
      totalQuantity: current.totalQuantity + row.item.quantity,
      availableQuantity: current.availableQuantity + row.item.availableQuantity,
      reservedQuantity: current.reservedQuantity + getInventoryReservedQuantity(row.item),
      needsReviewCount: current.needsReviewCount + (getInventoryReviewStatus(row.item) === 'needs_review' ? 1 : 0)
    })
  })

  return Array.from(summaries.values()).sort((left, right) => left.location.localeCompare(right.location, 'zh-Hans-CN'))
}

export const buildInventoryOrderLineMovementSummary = (movements: InventoryMovement[], orderLines: OrderLine[]): InventoryOrderLineMovementSummary[] => {
  const summaries = new Map<string, InventoryOrderLineMovementSummary>()

  movements.forEach((movement) => {
    if (!movement.relatedOrderLineId) {
      return
    }

    const orderLine = orderLines.find((line) => line.id === movement.relatedOrderLineId)
    const summary = summaries.get(movement.relatedOrderLineId) ?? {
      orderLineId: movement.relatedOrderLineId,
      orderLineDisplay: [orderLine?.lineCode || orderLine?.productionTaskNo || movement.relatedOrderLineId, orderLine?.name].filter(Boolean).join(' / '),
      reserveQuantity: 0,
      releaseQuantity: 0,
      outboundQuantity: 0,
      movementCount: 0,
      latestOccurredAt: movement.occurredAt
    }

    summaries.set(movement.relatedOrderLineId, {
      ...summary,
      reserveQuantity: summary.reserveQuantity + (movement.type === 'reserve' ? movement.quantity : 0),
      releaseQuantity: summary.releaseQuantity + (movement.type === 'release' ? movement.quantity : 0),
      outboundQuantity: summary.outboundQuantity + (movement.type === 'outbound' ? movement.quantity : 0),
      movementCount: summary.movementCount + 1,
      latestOccurredAt: movement.occurredAt > summary.latestOccurredAt ? movement.occurredAt : summary.latestOccurredAt
    })
  })

  return Array.from(summaries.values())
}

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

export const applyInventoryStocktake = (item: InventoryItem, input: InventoryStocktakeInput): InventoryMovementResult => {
  const countedQuantity = Math.floor(input.countedQuantity)
  const countedAvailableQuantity = Math.floor(input.countedAvailableQuantity)

  if (countedQuantity < 0 || countedAvailableQuantity < 0) {
    throw new Error('盘点数量不能为负数')
  }

  if (countedAvailableQuantity > countedQuantity) {
    throw new Error('实盘可用数不能大于实盘总数')
  }

  const nextItem: InventoryItem = {
    ...item,
    quantity: countedQuantity,
    availableQuantity: countedAvailableQuantity,
    warehouseLocation: input.toLocation?.trim() || item.warehouseLocation,
    remark: input.note?.trim() || item.remark
  }
  const quantityDiff = countedQuantity - item.quantity
  const availableDiff = countedAvailableQuantity - item.availableQuantity
  const reason = input.reason?.trim()
  const note = input.note?.trim()
  const stocktakeNote = [`盘点调整：总数 ${item.quantity}→${countedQuantity}，可用 ${item.availableQuantity}→${countedAvailableQuantity}`, reason ? `原因：${reason}` : null, note].filter(Boolean).join('；')

  const movement: InventoryMovement = {
    id: `movement-${item.id}-stocktake-${input.occurredAt.replace(/[^0-9]/g, '')}`,
    inventoryItemId: item.id,
    inventoryCode: item.inventoryCode,
    type: 'adjust',
    quantity: Math.abs(quantityDiff) || Math.abs(availableDiff),
    operatorName: input.operatorName,
    occurredAt: input.occurredAt,
    fromStatus: item.status,
    toStatus: nextItem.status,
    fromLocation: item.warehouseLocation,
    toLocation: nextItem.warehouseLocation,
    relatedOrderLineId: item.orderLineId,
    note: stocktakeNote
  }

  return {
    item: nextItem,
    movement
  }
}
