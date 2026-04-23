export type ProductStatus = 'draft' | 'enabled' | 'disabled'

export type ProductCategory =
  | 'ring'
  | 'pendant'
  | 'necklace'
  | 'earring'
  | 'bracelet'
  | 'other'

export type ProductSizeField = {
  key: string
  label: string
  value: string
  unit?: string
}

export type ProductSpecRowStatus = 'enabled' | 'disabled'

export type ProductSpecRow = {
  id: string
  productId: string
  specValue: string
  sortOrder: number
  status: ProductSpecRowStatus
  basePrice?: number
  referenceWeight?: number
  note?: string
  sizeFields: ProductSizeField[]
}

export type ProductPriceRuleType = 'material' | 'process' | 'special' | 'other'

export type ProductPriceRule = {
  id: string
  productId: string
  type: ProductPriceRuleType
  ruleKey: string
  delta: number
  enabled: boolean
  note?: string
}

export type ProductCustomRules = {
  canResize?: boolean
  canChangeMaterial?: boolean
  canEngrave?: boolean
  canChangeProcess?: boolean
  canRevise?: boolean
  requiresRemodeling?: boolean
  requiresMeasureTool?: boolean
}

export type ProductProductionReference = {
  standardMaterial?: string
  defaultLeadTimeDays?: number
  suggestedLeadTimeDays?: number
  referenceLaborCost?: number
  productionNotes?: string[]
}

export type ProductAssetFile = {
  id: string
  name: string
  type: 'model' | 'craft' | 'size' | 'other'
  version?: string
  url: string
}

export type ProductAssets = {
  detailImages: string[]
  modelFiles: ProductAssetFile[]
  craftFiles: ProductAssetFile[]
  sizeFiles: ProductAssetFile[]
  otherFiles: ProductAssetFile[]
}

export type ProductReferenceRecordStatus = 'referenced' | 'adjusted' | 'closed'

export type ProductReferenceRecord = {
  id: string
  transactionId?: string
  transactionNo?: string
  orderLineId?: string
  orderLineName?: string
  orderId: string
  orderNo: string
  customerId?: string
  customerName: string
  orderItemName: string
  sourceVersion: string
  selectedSpecValue?: string
  referencedAt: string
  status: ProductReferenceRecordStatus
  note?: string
}

export type ProductVersionRecordStatus = 'published' | 'draft'

export type ProductVersionRecord = {
  id: string
  version: string
  updatedAt: string
  operatorName: string
  summary: string
  changes: string[]
  relatedFiles: string[]
  status: ProductVersionRecordStatus
}

export type Product = {
  id: string
  code: string
  name: string
  shortName?: string
  category: ProductCategory
  series?: string
  styleTags: string[]
  sceneTags: string[]
  status: ProductStatus
  isReferable: boolean
  version: string
  updatedAt: string
  coverImage?: string
  galleryImages: string[]
  supportedMaterials: string[]
  defaultMaterial?: string
  supportedProcesses: string[]
  defaultProcess?: string
  supportedSpecialOptions: string[]
  specMode: 'none' | 'single_axis'
  specName?: string
  specDisplayType?: 'tags' | 'select'
  isSpecRequired?: boolean
  specs: ProductSpecRow[]
  priceRules: ProductPriceRule[]
  customRules: ProductCustomRules
  productionReference: ProductProductionReference
  assets: ProductAssets
  referenceRecords: ProductReferenceRecord[]
  versionHistory: ProductVersionRecord[]
}
