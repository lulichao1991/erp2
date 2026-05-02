import type { OrderLine, OrderLineLineStatus } from '@/types/order-line'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'

type OrderLineCompletenessInput = {
  productName?: string
  category?: string
  material?: string
  size?: string
  craftRequirements?: string
  productionTaskNo?: string
  needsEngraving?: boolean
  engraveImageFiles?: unknown[]
  engravePltFiles?: unknown[]
  requiresDesign?: boolean
  requiresModeling?: boolean
}

type RequiredField = {
  key: keyof OrderLineCompletenessInput
  label: string
}

const requiredFields: RequiredField[] = [
  { key: 'productName', label: '款式名称' },
  { key: 'category', label: '品类' },
  { key: 'material', label: '材质' },
  { key: 'size', label: '尺寸 / 规格' },
  { key: 'craftRequirements', label: '工艺要求' },
  { key: 'productionTaskNo', label: '货号' }
]

const engravingRequiredFields: RequiredField[] = [
  { key: 'engraveImageFiles', label: '刻字参考图' },
  { key: 'engravePltFiles', label: '刻字 PLT 文件' }
]

const hasValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.length > 0
  }

  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

export const hasEngravingRequirement = (input: Pick<
  OrderLineCompletenessInput,
  'needsEngraving' | 'engraveImageFiles' | 'engravePltFiles'
> & {
  engraveText?: string
  selectedSpecialOptions?: string[]
}) =>
  Boolean(input.needsEngraving) ||
  Boolean(input.engraveText?.trim()) ||
  Boolean(input.selectedSpecialOptions?.includes('刻字')) ||
  hasValue(input.engraveImageFiles) ||
  hasValue(input.engravePltFiles)

export const getOrderLineCompleteness = (input: OrderLineCompletenessInput) => {
  const activeRequiredFields = input.needsEngraving ? [...requiredFields, ...engravingRequiredFields] : requiredFields
  const missingFields = activeRequiredFields.filter((field) => !hasValue(input[field.key]))
  const total = activeRequiredFields.length
  const completed = total - missingFields.length

  return {
    complete: missingFields.length === 0,
    completed,
    total,
    fieldStatuses: activeRequiredFields.map((field) => ({
      key: field.key,
      label: field.label,
      complete: hasValue(input[field.key])
    })),
    missingFields: missingFields.map((field) => field.key),
    missingLabels: missingFields.map((field) => field.label),
    summary: missingFields.length === 0 ? '资料完整' : `缺失：${missingFields.map((field) => field.label).join('、')}`
  }
}

export const buildOrderLineCompletenessInput = (line: OrderLine): OrderLineCompletenessInput => {
  const engraveImageFiles = line.actualRequirements?.engraveImageFiles ?? []
  const engravePltFiles = line.actualRequirements?.engravePltFiles ?? []

  return {
    productName: line.name,
    category: line.category,
    material: line.selectedMaterial || line.actualRequirements?.material,
    size: line.selectedSpecValue,
    craftRequirements: line.selectedProcess || line.actualRequirements?.process,
    productionTaskNo: getOrderLineGoodsNo(line, ''),
    needsEngraving: hasEngravingRequirement({
      engraveText: line.actualRequirements?.engraveText,
      selectedSpecialOptions: line.selectedSpecialOptions,
      engraveImageFiles,
      engravePltFiles
    }),
    engraveImageFiles,
    engravePltFiles,
    requiresDesign: Boolean(line.requiresDesign),
    requiresModeling: Boolean(line.requiresModeling)
  }
}

export const getCustomerServiceNextLineStatus = (input: Pick<OrderLineCompletenessInput, 'requiresDesign' | 'requiresModeling'>): OrderLineLineStatus =>
  input.requiresDesign ? 'pending_design' : input.requiresModeling ? 'pending_modeling' : 'pending_merchandiser_review'
