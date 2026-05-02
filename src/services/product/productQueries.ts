import { mockProducts } from '@/mocks/products'
import type { Product } from '@/types/product'

const clone = <T,>(value: T): T => structuredClone(value)

export const getProductList = (): Product[] => clone(mockProducts)

export const getReferableProducts = (): Product[] => clone(mockProducts.filter((item) => item.isReferable))

export const createEmptyProduct = (): Product => ({
  id: `product-${Date.now()}`,
  code: '',
  name: '',
  shortName: '',
  category: 'ring',
  series: '',
  styleTags: [],
  sceneTags: [],
  status: 'draft',
  isReferable: true,
  version: 'v1',
  updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  coverImage: '',
  galleryImages: [],
  supportedMaterials: [],
  defaultMaterial: '',
  supportedProcesses: [],
  defaultProcess: '',
  supportedSpecialOptions: [],
  specMode: 'single_axis',
  specName: '圈号',
  specDisplayType: 'tags',
  isSpecRequired: true,
  specs: [],
  priceRules: [],
  customRules: {
    canResize: false,
    canChangeMaterial: false,
    canEngrave: false,
    canChangeProcess: false,
    canRevise: false,
    requiresRemodeling: false,
    requiresMeasureTool: false
  },
  productionReference: {
    standardMaterial: '',
    defaultLeadTimeDays: 7,
    suggestedLeadTimeDays: 10,
    referenceLaborCost: 0,
    productionNotes: []
  },
  assets: {
    detailImages: [],
    modelFiles: [],
    craftFiles: [],
    sizeFiles: [],
    otherFiles: []
  },
  referenceRecords: [],
  versionHistory: []
})
