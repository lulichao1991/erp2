import type { ProductCategory } from '@/types/product'

export type InventoryItemSourceType = 'design_sample' | 'customer_return' | 'old_gold' | 'stock_purchase' | 'consignment' | 'other'

export type InventoryItemStatus = 'in_stock' | 'reserved' | 'outbound' | 'scrapped'

export type InventoryItemCondition = 'new' | 'sample' | 'returned' | 'repair_needed' | 'defective'

export type InventoryOwnerDepartment = 'design' | 'customer_service' | 'warehouse' | 'factory' | 'other'

export type InventoryMovementType = 'inbound' | 'reserve' | 'release' | 'outbound' | 'scrap' | 'adjust'

export type InventoryFifoLayer = {
  batchId: string
  quantity: number
  unitCostAmount: number
  costAmount: number
  receivedAt: string
}

export type InventoryBatch = {
  id: string
  inventoryItemId: string
  inventoryCode: string
  receivedAt: string
  quantity: number
  remainingQuantity: number
  unitCostAmount: number
  totalCostAmount: number
  sourceMovementId: string
}

export type InventoryItem = {
  id: string
  inventoryCode: string
  name: string
  category?: ProductCategory
  sourceType: InventoryItemSourceType
  sourceLabel?: string
  sourcePaymentRecordId?: string
  productId?: string
  productName?: string
  orderLineId?: string
  purchaseId?: string
  customerId?: string
  material?: string
  size?: string
  craftRequirements?: string
  weight?: number
  valuationAmount?: number
  quantity: number
  availableQuantity: number
  warehouseLocation: string
  ownerDepartment: InventoryOwnerDepartment
  condition: InventoryItemCondition
  status: InventoryItemStatus
  receivedAt: string
  keeperName: string
  remark?: string
}

export type InventoryMovement = {
  id: string
  inventoryItemId: string
  inventoryCode: string
  type: InventoryMovementType
  quantity: number
  operatorName: string
  occurredAt: string
  fromStatus?: InventoryItemStatus
  toStatus?: InventoryItemStatus
  fromLocation?: string
  toLocation?: string
  relatedOrderLineId?: string
  fifoCostAmount?: number
  fifoLayers?: InventoryFifoLayer[]
  note?: string
}
