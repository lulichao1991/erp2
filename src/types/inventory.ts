import type { ProductCategory } from '@/types/product'

export type InventoryItemSourceType = 'design_sample' | 'customer_return' | 'stock_purchase' | 'consignment' | 'other'

export type InventoryItemStatus = 'in_stock' | 'reserved' | 'outbound' | 'scrapped'

export type InventoryItemCondition = 'new' | 'sample' | 'returned' | 'repair_needed' | 'defective'

export type InventoryOwnerDepartment = 'design' | 'customer_service' | 'warehouse' | 'factory' | 'other'

export type InventoryMovementType = 'inbound' | 'reserve' | 'release' | 'outbound' | 'scrap' | 'adjust'

export type InventoryItem = {
  id: string
  inventoryCode: string
  name: string
  category?: ProductCategory
  sourceType: InventoryItemSourceType
  sourceLabel?: string
  productId?: string
  productName?: string
  orderLineId?: string
  purchaseId?: string
  customerId?: string
  material?: string
  size?: string
  craftRequirements?: string
  weight?: number
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
  note?: string
}
