import type { ProductCategory } from '@/types/product'

export type InventoryItemSourceType = 'design_sample' | 'customer_return' | 'stock_purchase' | 'consignment' | 'other'

export type InventoryItemStatus = 'in_stock' | 'reserved' | 'outbound' | 'scrapped'

export type InventoryItemCondition = 'new' | 'sample' | 'returned' | 'repair_needed' | 'defective'

export type InventoryOwnerDepartment = 'design' | 'customer_service' | 'warehouse' | 'factory' | 'other'

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
