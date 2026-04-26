import { mockProducts } from '@/mocks/products'
import type { OrderLine, OrderLineUploadedFile } from '@/types/order-line'
import { buildQuoteResult } from '@/utils/quote/buildQuoteResult'

const purchaseId = 'o-202604-001'
const ringProduct = mockProducts[0]
const pendantProduct = mockProducts[1]

const ringSpec = ringProduct.specs.find((item) => item.specValue === '16号')
const pendantSpec = pendantProduct.specs.find((item) => item.specValue === '小号')

const ringEngraveImageFiles: OrderLineUploadedFile[] = [
  {
    id: 'engrave-image-ring-001',
    name: '戒指内圈刻字示意图.jpg',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="%23f4efe7"/><text x="24" y="96" font-size="28" fill="%2330465d">ZS Inner Ring</text></svg>'
  }
]

const ringEngravePltFiles: OrderLineUploadedFile[] = [
  {
    id: 'engrave-plt-ring-001',
    name: '戒指内圈刻字排版.plt',
    url: 'data:text/plain;charset=utf-8,IN%3BSP1%3BPA0%2C0%3BPD120%2C0%2C120%2C80%2C0%2C80%3BPU%3BZS%3B'
  }
]

export const ringOrderLine: OrderLine = {
  id: 'oi-ring-001',
  lineNo: 1,
  lineCode: 'OL-202604-001-01',
  productionTaskNo: 'RING-SH-016',
  purchaseId,
  transactionId: purchaseId,
  customerId: 'customer-zhang-001',
  name: '山形戒指',
  category: 'ring',
  styleName: '山形素圈戒指',
  versionNo: 'v3',
  skuCode: 'RING-SH-016',
  quantity: 1,
  lineStatus: 'in_production',
  designStatus: 'completed',
  modelingStatus: 'not_required',
  productionStatus: 'in_production',
  factoryStatus: 'in_production',
  financeStatus: 'not_required',
  assignedDesignerId: 'designer-chen',
  merchandiserId: 'merchandiser-li',
  factoryId: 'factory-suzhou-gold-001',
  productionSentAt: '2026-04-23 09:30',
  factoryPlannedDueDate: '2026-04-26',
  status: 'in_production',
  currentOwner: '李生产',
  priority: 'urgent',
  isUrgent: true,
  requiresDesign: true,
  requiresModeling: false,
  requiresWax: false,
  isReferencedProduct: true,
  productId: ringProduct.id,
  sourceProduct: {
    sourceProductId: ringProduct.id,
    sourceProductCode: ringProduct.code,
    sourceProductName: ringProduct.name,
    sourceProductVersion: ringProduct.version,
    category: ringProduct.category,
    sourceSpecValue: '16号',
    defaultMaterial: '18K金',
    defaultProcess: '微镶',
    snapshotAt: '2026-04-21 10:46'
  },
  selectedSpecValue: '16号',
  selectedSpecSnapshot: ringSpec,
  selectedMaterial: '18K金',
  selectedProcess: '微镶',
  selectedSpecialOptions: ['刻字'],
  actualRequirements: {
    material: '18K金',
    process: '微镶',
    engraveText: 'ZS',
    sizeNote: '戒围 16 号，内圈略加厚',
    specialNotes: ['刻字靠内圈中部'],
    remark: '优先保证面宽一致性'
  },
  designInfo: {
    designStatus: 'completed',
    assignedDesigner: '陈设计',
    requiresRemodeling: false,
    designDeadline: '2026-04-23',
    designNote: '设计已确认，进入生产。'
  },
  outsourceInfo: {
    outsourceStatus: 'in_progress',
    supplierName: '苏州金工厂',
    plannedDeliveryDate: '2026-04-26',
    outsourceNote: '已下厂生产。'
  },
  productionInfo: {
    factoryStatus: 'in_progress',
    returnedWeight: '',
    qualityResult: '',
    factoryNote: '工厂生产中，等待首轮回传。'
  },
  quote: buildQuoteResult({
    selectedSpec: ringSpec,
    selectedMaterial: '18K金',
    selectedProcess: '微镶',
    selectedSpecialOptions: ['刻字'],
    rules: ringProduct.priceRules,
    specRequired: true
  }),
  expectedDate: '2026-04-26',
  promisedDate: '2026-04-28',
  itemSku: 'RING-SH-016',
  manualAdjustment: 80,
  manualAdjustmentReason: '客户要求加厚内圈，预留人工调整空间',
  finalDisplayQuote: 2080
}

export const pendantOrderLine: OrderLine = {
  id: 'oi-pendant-001',
  lineNo: 2,
  lineCode: 'OL-202604-001-02',
  productionTaskNo: 'PDT-SH-S',
  purchaseId,
  transactionId: purchaseId,
  customerId: 'customer-zhang-001',
  name: '山形吊坠',
  category: 'pendant',
  styleName: '如意吊坠',
  versionNo: 'v2',
  skuCode: 'PDT-SH-S',
  quantity: 1,
  lineStatus: 'pending_finance_confirmation',
  designStatus: 'completed',
  modelingStatus: 'not_required',
  productionStatus: 'completed',
  factoryStatus: 'returned',
  financeStatus: 'pending',
  assignedDesignerId: 'designer-wang',
  merchandiserId: 'merchandiser-wang',
  factoryId: 'factory-hangzhou-enamel-001',
  productionSentAt: '2026-04-23 16:30',
  factoryPlannedDueDate: '2026-04-25',
  productionCompletedAt: '2026-04-25 15:20',
  status: 'pending_shipment',
  currentOwner: '王客服',
  priority: 'high',
  isUrgent: false,
  requiresDesign: true,
  requiresModeling: false,
  requiresWax: false,
  isReferencedProduct: true,
  productId: pendantProduct.id,
  sourceProduct: {
    sourceProductId: pendantProduct.id,
    sourceProductCode: pendantProduct.code,
    sourceProductName: pendantProduct.name,
    sourceProductVersion: pendantProduct.version,
    category: pendantProduct.category,
    sourceSpecValue: '小号',
    defaultMaterial: '足银',
    defaultProcess: '珐琅',
    snapshotAt: '2026-04-21 10:48'
  },
  selectedSpecValue: '小号',
  selectedSpecSnapshot: pendantSpec,
  selectedMaterial: '足银',
  selectedProcess: '珐琅',
  selectedSpecialOptions: ['附赠礼盒'],
  actualRequirements: {
    material: '足银',
    process: '珐琅',
    specialNotes: ['配浅青色礼盒'],
    remark: '已完成质检，等待客户确认收件信息后发货。'
  },
  designInfo: {
    designStatus: 'completed',
    assignedDesigner: '王设计',
    requiresRemodeling: false,
    designDeadline: '2026-04-24',
    designNote: '吊坠轮廓与戒指保持同系列。'
  },
  outsourceInfo: {
    outsourceStatus: 'delivered',
    supplierName: '杭州珐琅工作室',
    plannedDeliveryDate: '2026-04-25',
    outsourceNote: '已回传成品照。'
  },
  productionInfo: {
    factoryStatus: 'completed',
    returnedWeight: '2.3g',
    qualityResult: '通过',
    factoryNote: '质检通过，待发货。'
  },
  quote: buildQuoteResult({
    selectedSpec: pendantSpec,
    selectedMaterial: '足银',
    selectedProcess: '珐琅',
    selectedSpecialOptions: ['附赠礼盒'],
    rules: pendantProduct.priceRules,
    specRequired: true
  }),
  expectedDate: '2026-04-26',
  promisedDate: '2026-04-28',
  itemSku: 'PDT-SH-S',
  finalDisplayQuote: 1280
}

export const necklaceOrderLine: OrderLine = {
  id: 'ol-zhang-necklace-001',
  lineNo: 3,
  lineCode: 'OL-202604-001-03',
  productionTaskNo: 'NECK-CUSTOM-042',
  purchaseId,
  transactionId: purchaseId,
  customerId: 'customer-zhang-001',
  name: '定制项链',
  category: 'necklace',
  styleName: '山形定制吊牌项链',
  versionNo: 'v1',
  skuCode: 'NECK-CUSTOM-042',
  quantity: 1,
  lineStatus: 'pending_design',
  designStatus: 'in_progress',
  modelingStatus: 'pending',
  productionStatus: 'not_started',
  factoryStatus: 'not_assigned',
  financeStatus: 'not_required',
  assignedDesignerId: 'designer-chen',
  assignedModelerId: 'modeler-lin',
  merchandiserId: 'merchandiser-wang',
  status: 'designing',
  currentOwner: '陈设计',
  priority: 'normal',
  isUrgent: false,
  requiresDesign: true,
  requiresModeling: true,
  requiresWax: true,
  isReferencedProduct: false,
  selectedSpecValue: '锁骨链 42cm',
  selectedMaterial: '18K金',
  selectedProcess: '手工錾刻',
  selectedSpecialOptions: ['定制吊牌'],
  actualRequirements: {
    material: '18K金',
    process: '手工錾刻',
    sizeNote: '链长 42cm，吊牌 8mm',
    engraveText: 'ZS',
    specialNotes: ['吊牌需要手绘草图确认'],
    remark: '客户希望项链与山形系列风格一致。'
  },
  designInfo: {
    designStatus: 'in_progress',
    assignedDesigner: '陈设计',
    requiresRemodeling: true,
    designDeadline: '2026-04-25',
    designNote: '正在出第一版吊牌草图。'
  },
  outsourceInfo: {
    outsourceStatus: 'pending',
    supplierName: '待定',
    plannedDeliveryDate: '2026-04-30',
    outsourceNote: '设计确认后再下厂。'
  },
  productionInfo: {
    factoryStatus: 'not_started',
    factoryNote: '未进入生产。'
  },
  quote: {
    basePrice: 1680,
    priceAdjustments: [
      { type: 'material', ruleKey: '18K金', delta: 300 },
      { type: 'process', ruleKey: '手工錾刻', delta: 260 },
      { type: 'special', ruleKey: '定制吊牌', delta: 120 }
    ],
    systemQuote: 2360,
    status: 'ready',
    warnings: []
  },
  expectedDate: '2026-04-30',
  promisedDate: '2026-05-02',
  itemSku: 'NECK-CUSTOM-042',
  finalDisplayQuote: 2360
}

export const waxOrderLine: OrderLine = {
  id: 'ol-zhang-wax-001',
  lineNo: 4,
  lineCode: 'OL-202604-001-04',
  productionTaskNo: 'WAX-BR-001',
  purchaseId,
  transactionId: purchaseId,
  customerId: 'customer-zhang-001',
  name: '手链蜡版确认',
  category: 'bracelet',
  styleName: '山形开口手链',
  versionNo: 'v1',
  skuCode: 'WAX-BR-001',
  quantity: 1,
  lineStatus: 'pending_modeling',
  designStatus: 'completed',
  modelingStatus: 'pending',
  productionStatus: 'not_started',
  factoryStatus: 'not_assigned',
  financeStatus: 'not_required',
  assignedDesignerId: 'designer-chen',
  assignedModelerId: 'modeler-lin',
  merchandiserId: 'merchandiser-wang',
  status: 'pending_design',
  currentOwner: '林建模',
  priority: 'normal',
  isUrgent: false,
  requiresDesign: false,
  requiresModeling: true,
  requiresWax: true,
  isReferencedProduct: false,
  selectedSpecValue: '开口手链 58mm',
  selectedMaterial: '18K金',
  selectedProcess: '手工抛光',
  selectedSpecialOptions: ['出蜡确认'],
  actualRequirements: {
    material: '18K金',
    process: '手工抛光',
    sizeNote: '内径 58mm，开口 18mm',
    specialNotes: ['需先出蜡给客户确认佩戴弧度'],
    remark: '设计稿已确认，等待建模出蜡。'
  },
  designInfo: {
    designStatus: 'completed',
    assignedDesigner: '陈设计',
    requiresRemodeling: true,
    designDeadline: '2026-04-24',
    designNote: '设计稿已确认，建模待开始。'
  },
  outsourceInfo: {
    outsourceStatus: 'pending',
    supplierName: '待定',
    plannedDeliveryDate: '2026-05-01',
    outsourceNote: '建模完成后再下发生产。'
  },
  productionInfo: {
    factoryStatus: 'not_started',
    factoryNote: '未进入生产。'
  },
  quote: {
    basePrice: 1980,
    priceAdjustments: [
      { type: 'material', ruleKey: '18K金', delta: 360 },
      { type: 'process', ruleKey: '手工抛光', delta: 180 },
      { type: 'special', ruleKey: '出蜡确认', delta: 160 }
    ],
    systemQuote: 2680,
    status: 'ready',
    warnings: []
  },
  expectedDate: '2026-05-01',
  promisedDate: '2026-05-03',
  itemSku: 'WAX-BR-001',
  finalDisplayQuote: 2680
}

export const orderLinesMock: OrderLine[] = [ringOrderLine, pendantOrderLine, necklaceOrderLine, waxOrderLine]

export const orderLineLegacyStatusMock: Record<string, string> = {
  'oi-ring-001': '生产中',
  'oi-pendant-001': '待财务确认',
  'ol-zhang-necklace-001': '待设计',
  'ol-zhang-wax-001': '待建模'
}

export const orderLineCompatibilityExtrasMock: Record<
  string,
  {
    engraveImageFiles?: OrderLineUploadedFile[]
    engravePltFiles?: OrderLineUploadedFile[]
  }
> = {
  'oi-ring-001': {
    engraveImageFiles: ringEngraveImageFiles,
    engravePltFiles: ringEngravePltFiles
  }
}

// Compatibility export for existing imports.
export const mockOrderLines = orderLinesMock
