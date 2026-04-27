import type { OrderLine, OrderLineLineStatus } from '@/types/order-line'

export type OrderLineCompletenessInput = {
  productName?: string
  category?: string
  material?: string
  size?: string
  craftRequirements?: string
  productionTaskNo?: string
  requiresDesign?: boolean
  requiresModeling?: boolean
}

type RequiredField = {
  key: keyof OrderLineCompletenessInput
  label: string
}

const requiredFields: RequiredField[] = [
  { key: 'productName', label: '商品名称' },
  { key: 'category', label: '品类' },
  { key: 'material', label: '材质' },
  { key: 'size', label: '尺寸 / 规格' },
  { key: 'craftRequirements', label: '工艺要求' },
  { key: 'productionTaskNo', label: '货号' }
]

const hasValue = (value: unknown) => typeof value === 'string' ? value.trim().length > 0 : Boolean(value)

export const getOrderLineCompleteness = (input: OrderLineCompletenessInput) => {
  const missingFields = requiredFields.filter((field) => !hasValue(input[field.key]))
  const total = requiredFields.length
  const completed = total - missingFields.length

  return {
    complete: missingFields.length === 0,
    completed,
    total,
    missingFields: missingFields.map((field) => field.key),
    missingLabels: missingFields.map((field) => field.label),
    summary: missingFields.length === 0 ? '资料完整' : `缺失：${missingFields.map((field) => field.label).join('、')}`
  }
}

export const buildOrderLineCompletenessInput = (line: OrderLine): OrderLineCompletenessInput => ({
  productName: line.name,
  category: line.category,
  material: line.selectedMaterial || line.actualRequirements?.material,
  size: line.selectedSpecValue || line.actualRequirements?.sizeNote || line.actualRequirements?.specNote,
  craftRequirements: line.selectedProcess || line.actualRequirements?.process,
  productionTaskNo: line.productionTaskNo || line.skuCode || line.itemSku,
  requiresDesign: Boolean(line.requiresDesign),
  requiresModeling: Boolean(line.requiresModeling)
})

export const getCustomerServiceNextLineStatus = (input: Pick<OrderLineCompletenessInput, 'requiresDesign' | 'requiresModeling'>): OrderLineLineStatus =>
  input.requiresDesign ? 'pending_design' : input.requiresModeling ? 'pending_modeling' : 'pending_merchandiser_review'
