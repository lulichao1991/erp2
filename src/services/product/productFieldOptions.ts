import type { ProductCategory } from '@/types/product'

const PRODUCT_FIELD_OPTIONS_STORAGE_KEY = 'erp2.product-field-options'

type BusinessDictionaryFieldKey =
  | 'styleTags'
  | 'sceneTags'
  | 'supportedMaterials'
  | 'supportedProcesses'
  | 'supportedSpecialOptions'

export type ProductSizeParameterDefinition = {
  label: string
  unit: string
  categories: ProductCategory[]
}

export type ProductFieldOptions = {
  styleTags: string[]
  sceneTags: string[]
  supportedMaterials: string[]
  supportedProcesses: string[]
  supportedSpecialOptions: string[]
  sizeParameterDefinitions: ProductSizeParameterDefinition[]
}

export type ProductFieldOptionKey = BusinessDictionaryFieldKey

const allCategories: ProductCategory[] = ['ring', 'pendant', 'necklace', 'earring', 'bracelet', 'other']

const defaultProductFieldOptions: ProductFieldOptions = {
  styleTags: ['简约', '时尚', '国风', '街头风', '轻奢', '极简'],
  sceneTags: ['日常佩戴', '礼赠', '订婚', '婚礼', '节日纪念', '门店陈列'],
  supportedMaterials: ['足金', '18K金', '足银', 'PT950', '钛钢'],
  supportedProcesses: ['亮面', '微镶', '镜面', '珐琅', '拉丝', '喷砂'],
  supportedSpecialOptions: ['刻字', '加急', '附赠礼盒', '定制包装', '证书补打'],
  sizeParameterDefinitions: [
    { label: '面宽', unit: 'mm', categories: ['ring'] },
    { label: '底宽', unit: 'mm', categories: ['ring'] },
    { label: '面厚', unit: 'mm', categories: ['ring'] },
    { label: '底厚', unit: 'mm', categories: ['ring'] },
    { label: '长', unit: 'mm', categories: ['pendant', 'necklace', 'earring', 'bracelet', 'other'] },
    { label: '宽', unit: 'mm', categories: ['pendant', 'necklace', 'earring', 'bracelet', 'other'] },
    { label: '厚', unit: 'mm', categories: ['pendant', 'necklace', 'earring', 'bracelet', 'other'] },
    { label: '链长', unit: 'cm', categories: ['necklace', 'bracelet'] },
    { label: '爪高', unit: 'mm', categories: ['ring', 'earring', 'pendant'] }
  ]
}

const normalizeValues = (values: string[]) =>
  Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))

const normalizeCategories = (categories?: ProductCategory[]) => {
  const next = Array.from(new Set((categories ?? allCategories).filter((item): item is ProductCategory => allCategories.includes(item))))
  return next.length > 0 ? next : [...allCategories]
}

const normalizeSizeParameterDefinitions = (definitions?: ProductSizeParameterDefinition[]) =>
  Array.from(
    new Map(
      (definitions ?? [])
        .map((item) => ({
          label: item.label.trim(),
          unit: item.unit.trim(),
          categories: normalizeCategories(item.categories)
        }))
        .filter((item) => item.label)
        .map((item) => [item.label, item] as const)
    ).values()
  )

const sanitizeProductFieldOptions = (value?: Partial<ProductFieldOptions>): ProductFieldOptions => ({
  styleTags: normalizeValues(value?.styleTags ?? defaultProductFieldOptions.styleTags),
  sceneTags: normalizeValues(value?.sceneTags ?? defaultProductFieldOptions.sceneTags),
  supportedMaterials: normalizeValues(value?.supportedMaterials ?? defaultProductFieldOptions.supportedMaterials),
  supportedProcesses: normalizeValues(value?.supportedProcesses ?? defaultProductFieldOptions.supportedProcesses),
  supportedSpecialOptions: normalizeValues(value?.supportedSpecialOptions ?? defaultProductFieldOptions.supportedSpecialOptions),
  sizeParameterDefinitions: normalizeSizeParameterDefinitions(value?.sizeParameterDefinitions).length
    ? normalizeSizeParameterDefinitions(value?.sizeParameterDefinitions)
    : defaultProductFieldOptions.sizeParameterDefinitions
})

export const getProductFieldOptions = (): ProductFieldOptions => {
  if (typeof window === 'undefined') {
    return sanitizeProductFieldOptions()
  }

  const stored = window.localStorage.getItem(PRODUCT_FIELD_OPTIONS_STORAGE_KEY)

  if (!stored) {
    return sanitizeProductFieldOptions()
  }

  try {
    return sanitizeProductFieldOptions(JSON.parse(stored) as Partial<ProductFieldOptions>)
  } catch {
    return sanitizeProductFieldOptions()
  }
}

export const saveProductFieldOptions = (value: ProductFieldOptions): ProductFieldOptions => {
  const next = sanitizeProductFieldOptions(value)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PRODUCT_FIELD_OPTIONS_STORAGE_KEY, JSON.stringify(next))
  }

  return next
}

export const addProductFieldOption = (
  current: ProductFieldOptions,
  field: ProductFieldOptionKey,
  rawValue: string
): ProductFieldOptions => {
  const nextValue = rawValue.trim()

  if (!nextValue) {
    return current
  }

  return sanitizeProductFieldOptions({
    ...current,
    [field]: [...current[field], nextValue]
  })
}

export const removeProductFieldOption = (
  current: ProductFieldOptions,
  field: ProductFieldOptionKey,
  rawValue: string
): ProductFieldOptions =>
  sanitizeProductFieldOptions({
    ...current,
    [field]: current[field].filter((item) => item !== rawValue.trim())
  })

export const saveSizeParameterDefinitions = (
  current: ProductFieldOptions,
  definitions: ProductSizeParameterDefinition[]
): ProductFieldOptions =>
  sanitizeProductFieldOptions({
    ...current,
    sizeParameterDefinitions: definitions
  })
