import { mockProducts } from '@/mocks/products'
import type { OrderLine, OrderLineUploadedFile } from '@/types/order-line'
import { buildQuoteResult } from '@/utils/quote/buildQuoteResult'

const purchaseId = 'o-202604-001'
const linPurchaseId = 'o-202604-002'
const zhaoPurchaseId = 'o-202603-118'
const internalPurchaseId = 'purchase-internal-rd-001'
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

const ringOrderLine: OrderLine = {
  id: 'oi-ring-001',
  lineNo: 1,
  productionTaskNo: 'RING-SH-016',
  purchaseId,
  customerId: 'customer-zhang-001',
  name: '山形素圈戒指',
  category: 'ring',
  versionNo: 'v3',
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
  currentOwner: '李生产',
  priority: 'urgent',
  isUrgent: true,
  requiresDesign: true,
  requiresModeling: false,
  requiresWax: false,
  designFiles: [
    {
      id: 'design-file-ring-001',
      name: '山形戒指确认稿.pdf',
      url: 'data:text/plain;charset=utf-8,ring-design'
    }
  ],
  designNote: '戒指设计稿已确认。',
  designCompletedAt: '2026-04-23 09:00',
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
    engraveImageFiles: ringEngraveImageFiles,
    engravePltFiles: ringEngravePltFiles,
    specialNotes: ['刻字靠内圈中部'],
    remark: '戒围 16 号，内圈略加厚 / 优先保证面宽一致性'
  },
  designInfo: {
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
    feedbackStatus: 'in_progress',
    qualityResult: '',
    factoryNote: '工厂生产中，等待首轮回传。'
  },
  productionData: {
    actualMaterial: '18K金',
    factoryNote: '已开工，等待重量与出货单回传。'
  },
  lineSalesAmount: 2080,
  allocatedDepositAmount: 1220,
  allocatedFinalPaymentAmount: 860,
  materialCost: 760,
  laborCost: 0,
  factorySettlementAmount: 0,
  financeNote: '生产中，等待工厂回传后核算。',
  quote: buildQuoteResult({
    selectedSpec: ringSpec,
    selectedMaterial: '18K金',
    selectedProcess: '微镶',
    selectedSpecialOptions: ['刻字'],
    rules: ringProduct.priceRules,
    specRequired: true
  }),
  expectedDate: '2026-04-26',
  promisedDate: '2026-04-28'
}

const pendantOrderLine: OrderLine = {
  id: 'oi-pendant-001',
  lineNo: 2,
  productionTaskNo: 'PDT-SH-S',
  purchaseId,
  customerId: 'customer-zhang-001',
  name: '如意吊坠',
  category: 'pendant',
  versionNo: 'v2',
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
    feedbackStatus: 'completed',
    totalWeight: '2.3g',
    qualityResult: '通过',
    factoryNote: '质检通过，待发货。'
  },
  productionData: {
    shippedAt: '2026-04-25 15:20',
    completedAt: '2026-04-25 14:40',
    totalWeight: 2.3,
    netMetalWeight: 2.1,
    actualMaterial: '足银',
    baseLaborCost: 180,
    extraLaborCost: 40,
    extraLaborCostNote: '珐琅补色',
    totalLaborCost: 220,
    factoryNote: '质检通过，随货附出货单。',
    finishedImageUrls: ['pendant-finished-photo.jpg'],
    settlementFileUrls: ['pendant-settlement.pdf']
  },
  lineSalesAmount: 1280,
  allocatedDepositAmount: 750,
  allocatedFinalPaymentAmount: 530,
  materialCost: 320,
  laborCost: 180,
  extraLaborCost: 40,
  factorySettlementAmount: 540,
  estimatedGrossProfit: 740,
  estimatedGrossProfitRate: 57.8,
  financeNote: '待确认工厂结算。',
  quote: buildQuoteResult({
    selectedSpec: pendantSpec,
    selectedMaterial: '足银',
    selectedProcess: '珐琅',
    selectedSpecialOptions: ['附赠礼盒'],
    rules: pendantProduct.priceRules,
    specRequired: true
  }),
  expectedDate: '2026-04-26',
  promisedDate: '2026-04-28'
}

const necklaceOrderLine: OrderLine = {
  id: 'ol-zhang-necklace-001',
  lineNo: 3,
  productionTaskNo: 'NECK-CUSTOM-042',
  purchaseId,
  customerId: 'customer-zhang-001',
  name: '山形定制吊牌项链',
  category: 'necklace',
  versionNo: 'v1',
  quantity: 1,
  lineStatus: 'pending_design',
  designStatus: 'revision_requested',
  modelingStatus: 'pending',
  productionStatus: 'not_started',
  factoryStatus: 'not_assigned',
  financeStatus: 'not_required',
  assignedDesignerId: 'designer-chen',
  assignedModelerId: 'modeler-lin',
  merchandiserId: 'merchandiser-wang',
  designNote: '第一版吊牌草图需要调整山形弧线。',
  modelingNote: '设计确认后进入建模。',
  revisionReason: '客户要求吊牌山形弧线更柔和。',
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
    engraveText: 'ZS',
    specialNotes: ['吊牌需要手绘草图确认'],
    remark: '链长 42cm，吊牌 8mm / 客户希望项链与山形系列风格一致。'
  },
  designInfo: {
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
    feedbackStatus: 'not_started',
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
  lineSalesAmount: 2360,
  expectedDate: '2026-04-30',
  promisedDate: '2026-05-02'
}

const waxOrderLine: OrderLine = {
  id: 'ol-zhang-wax-001',
  lineNo: 4,
  productionTaskNo: 'WAX-BR-001',
  purchaseId,
  customerId: 'customer-zhang-001',
  name: '山形开口手链',
  category: 'bracelet',
  versionNo: 'v1',
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
  designFiles: [
    {
      id: 'design-file-wax-001',
      name: '手链设计确认稿.pdf',
      url: 'data:text/plain;charset=utf-8,wax-design'
    }
  ],
  designNote: '设计稿已确认。',
  modelingNote: '等待建模领取任务。',
  designCompletedAt: '2026-04-24 17:00',
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
    specialNotes: ['需先出蜡给客户确认佩戴弧度'],
    remark: '内径 58mm，开口 18mm / 设计稿已确认，等待建模出蜡。'
  },
  designInfo: {
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
    feedbackStatus: 'not_started',
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
  lineSalesAmount: 2680,
  expectedDate: '2026-05-01',
  promisedDate: '2026-05-03'
}

const earringReviewOrderLine: OrderLine = {
  id: 'ol-zhang-earring-review-001',
  lineNo: 5,
  productionTaskNo: 'EAR-CUSTOM-005',
  purchaseId,
  customerId: 'customer-zhang-001',
  name: '复古小花耳钉',
  category: 'other',
  versionNo: 'v1',
  quantity: 1,
  lineStatus: 'pending_merchandiser_review',
  designStatus: 'not_required',
  modelingStatus: 'not_required',
  productionStatus: 'not_started',
  factoryStatus: 'not_assigned',
  financeStatus: 'not_required',
  merchandiserId: 'merchandiser-li',
  currentOwner: '李生产',
  priority: 'normal',
  isUrgent: false,
  requiresDesign: false,
  requiresModeling: false,
  requiresWax: false,
  isReferencedProduct: false,
  selectedSpecValue: '耳钉 6mm',
  selectedMaterial: '18K金',
  selectedProcess: '手工抛光',
  actualRequirements: {
    material: '18K金',
    process: '手工抛光',
    remark: '单只花面约 6mm / 资料已齐，等待跟单复核后下发。'
  },
  outsourceInfo: {
    outsourceStatus: 'pending',
    supplierName: '待定',
    plannedDeliveryDate: '2026-04-29',
    outsourceNote: '待跟单复核。'
  },
  productionInfo: {
    feedbackStatus: 'not_started',
    factoryNote: '待跟单审核。'
  },
  lineSalesAmount: 980,
  expectedDate: '2026-04-29',
  promisedDate: '2026-05-01'
}

const broochBlockedOrderLine: OrderLine = {
  id: 'ol-zhang-brooch-blocked-001',
  lineNo: 6,
  productionTaskNo: 'BROOCH-CUSTOM-006',
  purchaseId,
  customerId: 'customer-zhang-001',
  name: '山形胸针',
  category: 'other',
  versionNo: 'v1',
  quantity: 1,
  lineStatus: 'pending_factory_production',
  designStatus: 'completed',
  modelingStatus: 'not_required',
  productionStatus: 'blocked',
  factoryStatus: 'abnormal',
  financeStatus: 'not_required',
  merchandiserId: 'merchandiser-wang',
  factoryId: 'factory-suzhou-gold-001',
  factoryPlannedDueDate: '2026-04-20',
  currentOwner: '王跟单',
  priority: 'urgent',
  isUrgent: true,
  requiresDesign: false,
  requiresModeling: false,
  requiresWax: false,
  isReferencedProduct: false,
  selectedSpecValue: '胸针 18mm',
  selectedMaterial: '足银',
  selectedProcess: '补石镶嵌',
  actualRequirements: {
    material: '足银',
    process: '补石镶嵌',
    specialNotes: ['工厂反馈缺少补石规格'],
    remark: '胸针主体 18mm / 资料已下发但工厂反馈补石规格不完整。'
  },
  outsourceInfo: {
    outsourceStatus: 'rework',
    supplierName: '苏州金工厂',
    plannedDeliveryDate: '2026-04-20',
    outsourceNote: '工厂反馈缺少补石规格，等待跟单处理。'
  },
  productionInfo: {
    feedbackStatus: 'issue',
    factoryNote: '补石规格缺失，生产阻塞。'
  },
  lineSalesAmount: 1580,
  expectedDate: '2026-04-25',
  promisedDate: '2026-04-28'
}

const factoryPendingOrderLine: OrderLine = {
  id: 'ol-zhang-factory-pending-001',
  lineNo: 7,
  productionTaskNo: 'PIN-SH-007',
  purchaseId,
  customerId: 'customer-zhang-001',
  name: '山形胸针试产版',
  category: 'other',
  versionNo: 'v1',
  quantity: 1,
  lineStatus: 'pending_factory_production',
  designStatus: 'completed',
  modelingStatus: 'not_required',
  productionStatus: 'dispatched',
  factoryStatus: 'pending_acceptance',
  financeStatus: 'not_required',
  assignedDesignerId: 'designer-wang',
  merchandiserId: 'merchandiser-li',
  factoryId: 'factory-suzhou-gold-001',
  productionSentAt: '2026-04-25 10:00',
  factoryPlannedDueDate: '2026-05-02',
  currentOwner: '苏州金工厂',
  priority: 'high',
  isUrgent: false,
  requiresDesign: false,
  requiresModeling: false,
  requiresWax: false,
  isReferencedProduct: false,
  selectedSpecValue: '胸针 20mm',
  selectedMaterial: '18K金',
  selectedProcess: '手工抛光',
  actualRequirements: {
    material: '18K金',
    process: '手工抛光',
    engraveText: 'ZS',
    specialNotes: ['边缘保留山形纹理'],
    remark: '胸针主体 20mm / 跟单已下发，等待工厂接收。'
  },
  designFiles: [
    {
      id: 'design-file-pin-001',
      name: '胸针试产确认稿.pdf',
      url: 'data:text/plain;charset=utf-8,pin-design'
    }
  ],
  productionInfo: {
    feedbackStatus: 'not_started',
    factoryNote: '已下发，等待工厂接收。'
  },
  productionData: {
    actualMaterial: '18K金',
    factoryNote: '待接收。'
  },
  lineSalesAmount: 1880,
  allocatedDepositAmount: 1100,
  allocatedFinalPaymentAmount: 780,
  financeNote: '待工厂回传后核算。',
  expectedDate: '2026-05-02',
  promisedDate: '2026-05-04'
}

const completionReviewOrderLine: OrderLine = {
  id: 'ol-zhang-completion-review-001',
  lineNo: 8,
  productionTaskNo: 'BRACELET-RETURN-008',
  purchaseId,
  customerId: 'customer-zhang-001',
  name: '山形开口手镯',
  category: 'bracelet',
  versionNo: 'v1',
  quantity: 1,
  lineStatus: 'factory_returned',
  designStatus: 'completed',
  modelingStatus: 'not_required',
  productionStatus: 'completed',
  factoryStatus: 'returned',
  financeStatus: 'not_required',
  merchandiserId: 'merchandiser-li',
  factoryId: 'factory-suzhou-gold-001',
  productionSentAt: '2026-04-24 10:00',
  factoryPlannedDueDate: '2026-04-28',
  productionCompletedAt: '2026-04-27 16:00',
  currentOwner: '李生产',
  priority: 'normal',
  isUrgent: false,
  requiresDesign: false,
  requiresModeling: false,
  requiresWax: false,
  isReferencedProduct: false,
  selectedSpecValue: '开口手镯 58mm',
  selectedSpecSnapshot: {
    id: 'spec-custom-bracelet-58',
    productId: 'custom-bracelet',
    specValue: '开口手镯 58mm',
    sortOrder: 1,
    status: 'enabled',
    basePrice: 1600,
    referenceWeight: 5.6,
    sizeFields: [
      { key: 'inner_diameter', label: '内径', value: '58', unit: 'mm' },
      { key: 'opening', label: '开口', value: '18', unit: 'mm' }
    ]
  },
  selectedMaterial: '18K金',
  selectedProcess: '手工抛光',
  actualRequirements: {
    material: '18K金',
    process: '手工抛光',
    specialNotes: ['回传后需跟单复核成品照片和结算附件'],
    remark: '开口手镯 58mm / 工厂已回传，等待跟单完工审核。'
  },
  productionInfo: {
    feedbackStatus: 'completed',
    actualMaterial: '18K金',
    totalWeight: '5.8g',
    netWeight: '5.6g',
    laborCostDetail: '260',
    factoryShippedAt: '2026-04-27 16:00',
    qualityResult: '待跟单二次审核',
    factoryNote: '工厂已回传手镯完工资料。'
  },
  productionData: {
    shippedAt: '2026-04-27 16:00',
    completedAt: '2026-04-27 15:40',
    totalWeight: 5.8,
    netMetalWeight: 5.6,
    actualMaterial: '18K金',
    baseLaborCost: 260,
    totalLaborCost: 260,
    factoryNote: '完工回传，等待跟单审核。',
    finishedImageUrls: ['bracelet-front.jpg', 'bracelet-mark.jpg'],
    settlementFileUrls: ['bracelet-settlement.pdf']
  },
  lineSalesAmount: 1980,
  allocatedDepositAmount: 1000,
  allocatedFinalPaymentAmount: 980,
  materialCost: 720,
  laborCost: 260,
  factorySettlementAmount: 260,
  financeNote: '待跟单完工审核通过后进入财务确认。',
  expectedDate: '2026-04-28',
  promisedDate: '2026-05-01'
}

const linCustomRingDesignOrderLine: OrderLine = {
  id: 'ol-lin-custom-ring-design-001',
  lineNo: 1,
  productionTaskNo: 'LIN-RING-CUSTOM-001',
  purchaseId: linPurchaseId,
  customerId: 'customer-lin-001',
  name: '林小姐纪念戒',
  category: 'ring',
  versionNo: 'custom-v1',
  quantity: 1,
  lineStatus: 'pending_design',
  designStatus: 'pending',
  modelingStatus: 'pending',
  productionStatus: 'not_started',
  factoryStatus: 'not_assigned',
  financeStatus: 'not_required',
  assignedDesignerId: 'designer-chen',
  currentOwner: '陈设计',
  priority: 'high',
  isUrgent: false,
  requiresDesign: true,
  requiresModeling: true,
  requiresWax: true,
  isReferencedProduct: false,
  selectedSpecValue: '定制戒指 12号',
  selectedMaterial: '18K金',
  selectedProcess: '手工錾刻',
  selectedSpecialOptions: ['纪念文字', '出蜡确认'],
  actualRequirements: {
    material: '18K金',
    process: '手工錾刻',
    engraveText: 'L&Y',
    specialNotes: ['戒臂需融入山线元素', '先出设计草图再建模'],
    remark: '全定制戒指，无来源款式模板，需设计确认后进入建模。'
  },
  designInfo: {
    assignedDesigner: '陈设计',
    requiresRemodeling: true,
    designDeadline: '2026-04-28',
    designNote: '等待首版设计稿。'
  },
  outsourceInfo: {
    outsourceStatus: 'not_required',
    supplierName: '待定',
    plannedDeliveryDate: '2026-05-08',
    outsourceNote: '设计和建模完成后再评估工厂。'
  },
  productionInfo: {
    feedbackStatus: 'not_started',
    factoryNote: '未进入生产。'
  },
  lineSalesAmount: 3200,
  allocatedDepositAmount: 1800,
  allocatedFinalPaymentAmount: 1400,
  quote: {
    basePrice: 2600,
    priceAdjustments: [
      { type: 'process', ruleKey: '手工錾刻', delta: 420 },
      { type: 'special', ruleKey: '出蜡确认', delta: 180 }
    ],
    systemQuote: 3200,
    status: 'ready',
    warnings: []
  },
  expectedDate: '2026-05-08',
  promisedDate: '2026-05-10'
}

const linCustomPendantModelingOrderLine: OrderLine = {
  id: 'ol-lin-custom-pendant-modeling-001',
  lineNo: 2,
  productionTaskNo: 'LIN-PDT-CUSTOM-002',
  purchaseId: linPurchaseId,
  customerId: 'customer-lin-001',
  name: '星月纪念吊坠',
  category: 'pendant',
  versionNo: 'custom-v1',
  quantity: 1,
  lineStatus: 'pending_modeling',
  designStatus: 'completed',
  modelingStatus: 'pending',
  productionStatus: 'not_started',
  factoryStatus: 'not_assigned',
  financeStatus: 'not_required',
  assignedDesignerId: 'designer-wang',
  assignedModelerId: 'modeler-lin',
  currentOwner: '林建模',
  priority: 'normal',
  isUrgent: false,
  requiresDesign: false,
  requiresModeling: true,
  requiresWax: true,
  isReferencedProduct: false,
  selectedSpecValue: '吊坠 18mm',
  selectedMaterial: '足银',
  selectedProcess: '珐琅',
  selectedSpecialOptions: ['出蜡确认'],
  actualRequirements: {
    material: '足银',
    process: '珐琅',
    specialNotes: ['月牙边缘保留手工纹理', '蜡版需拍照给客户确认'],
    remark: '设计稿已确认，等待建模出蜡。'
  },
  designInfo: {
    assignedDesigner: '王设计',
    requiresRemodeling: true,
    designDeadline: '2026-04-26',
    designNote: '设计已确认，转建模。'
  },
  designFiles: [
    {
      id: 'design-file-lin-pendant-001',
      name: '星月吊坠设计确认稿.pdf',
      url: 'data:text/plain;charset=utf-8,lin-pendant-design'
    }
  ],
  designCompletedAt: '2026-04-26 18:30',
  outsourceInfo: {
    outsourceStatus: 'pending',
    supplierName: '待定',
    plannedDeliveryDate: '2026-05-09',
    outsourceNote: '待蜡版确认后下发。'
  },
  productionInfo: {
    feedbackStatus: 'not_started',
    factoryNote: '未进入生产。'
  },
  lineSalesAmount: 1880,
  allocatedDepositAmount: 1200,
  allocatedFinalPaymentAmount: 680,
  quote: {
    basePrice: 1560,
    priceAdjustments: [
      { type: 'process', ruleKey: '珐琅', delta: 180 },
      { type: 'special', ruleKey: '出蜡确认', delta: 140 }
    ],
    systemQuote: 1880,
    status: 'ready',
    warnings: []
  },
  expectedDate: '2026-05-09',
  promisedDate: '2026-05-11'
}

const zhaoSpotRingOrderLine: OrderLine = {
  id: 'oi-ring-118',
  lineNo: 1,
  productionTaskNo: 'RING-ZH-118',
  purchaseId: zhaoPurchaseId,
  customerId: 'customer-zhao-001',
  name: '山形纪念戒',
  category: 'ring',
  versionNo: 'v2',
  quantity: 1,
  lineStatus: 'ready_to_ship',
  designStatus: 'not_required',
  modelingStatus: 'not_required',
  productionStatus: 'completed',
  factoryStatus: 'returned',
  financeStatus: 'confirmed',
  financeConfirmedAt: '2026-03-28 15:30',
  financeLocked: true,
  currentOwner: '周库管',
  priority: 'normal',
  isUrgent: false,
  requiresDesign: false,
  requiresModeling: false,
  requiresWax: false,
  isReferencedProduct: true,
  productId: ringProduct.id,
  sourceProduct: {
    sourceProductId: ringProduct.id,
    sourceProductCode: ringProduct.code,
    sourceProductName: ringProduct.name,
    sourceProductVersion: 'v2',
    category: ringProduct.category,
    sourceSpecValue: '10号',
    defaultMaterial: '18K金',
    defaultProcess: '镜面抛光',
    snapshotAt: '2026-03-28 14:20'
  },
  selectedSpecValue: '10号',
  selectedMaterial: '18K金',
  selectedProcess: '镜面抛光',
  selectedSpecialOptions: ['现货改圈'],
  actualRequirements: {
    material: '18K金',
    process: '镜面抛光',
    specialNotes: ['库存现货占用后出库', '发货前复核圈号'],
    remark: '现货戒指，库存占用并出库后等待发货。'
  },
  productionInfo: {
    feedbackStatus: 'completed',
    actualMaterial: '18K金',
    totalWeight: '3.6g',
    netWeight: '3.5g',
    laborCostDetail: '120',
    factoryShippedAt: '2026-03-28 15:00',
    qualityResult: '现货复检通过',
    factoryNote: '库存现货复检完成。'
  },
  productionData: {
    shippedAt: '2026-03-28 15:00',
    completedAt: '2026-03-28 15:00',
    totalWeight: 3.6,
    netMetalWeight: 3.5,
    actualMaterial: '18K金',
    baseLaborCost: 120,
    totalLaborCost: 120,
    factoryNote: '现货复检通过。',
    finishedImageUrls: ['zhao-ring-front.jpg'],
    settlementFileUrls: ['zhao-ring-stock-outbound.pdf']
  },
  lineSalesAmount: 1680,
  allocatedDepositAmount: 1680,
  allocatedFinalPaymentAmount: 0,
  materialCost: 980,
  laborCost: 120,
  logisticsCost: 18,
  factorySettlementAmount: 120,
  financeNote: '现货全款已确认，等待仓库发货。',
  expectedDate: '2026-03-29',
  promisedDate: '2026-03-30'
}

const financeAbnormalOrderLine: OrderLine = {
  id: 'ol-zhang-finance-abnormal-001',
  lineNo: 9,
  productionTaskNo: 'FIN-ABN-009',
  purchaseId,
  customerId: 'customer-zhang-001',
  name: '山形尾戒财务异常',
  category: 'ring',
  versionNo: 'v1',
  quantity: 1,
  lineStatus: 'pending_finance_confirmation',
  designStatus: 'completed',
  modelingStatus: 'not_required',
  productionStatus: 'completed',
  factoryStatus: 'returned',
  financeStatus: 'abnormal',
  merchandiserId: 'merchandiser-li',
  factoryId: 'factory-suzhou-gold-001',
  productionSentAt: '2026-04-24 13:20',
  factoryPlannedDueDate: '2026-04-27',
  productionCompletedAt: '2026-04-27 18:10',
  currentOwner: '财务',
  priority: 'high',
  isUrgent: false,
  requiresDesign: false,
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
    sourceSpecValue: '12号',
    defaultMaterial: '18K金',
    defaultProcess: '手工抛光',
    snapshotAt: '2026-04-24 13:00'
  },
  selectedSpecValue: '12号',
  selectedMaterial: '18K金',
  selectedProcess: '手工抛光',
  actualRequirements: {
    material: '18K金',
    process: '手工抛光',
    remark: '用于覆盖财务异常：客户补款流水待复核，工厂结算金额需二次确认。'
  },
  productionInfo: {
    feedbackStatus: 'completed',
    actualMaterial: '18K金',
    totalWeight: '2.8g',
    netWeight: '2.7g',
    laborCostDetail: '180',
    factoryShippedAt: '2026-04-27 18:10',
    qualityResult: '通过',
    factoryNote: '工厂回传结算金额与跟单预估不一致。'
  },
  productionData: {
    shippedAt: '2026-04-27 18:10',
    completedAt: '2026-04-27 17:40',
    totalWeight: 2.8,
    netMetalWeight: 2.7,
    actualMaterial: '18K金',
    baseLaborCost: 180,
    extraLaborCost: 90,
    extraLaborCostNote: '临时修边加收',
    totalLaborCost: 270,
    factoryNote: '工厂加收修边费用，待财务确认。',
    settlementFileUrls: ['finance-abnormal-settlement.pdf']
  },
  lineSalesAmount: 1380,
  allocatedDepositAmount: 600,
  allocatedFinalPaymentAmount: 780,
  materialCost: 520,
  laborCost: 180,
  extraLaborCost: 90,
  factorySettlementAmount: 270,
  financeAbnormalReason: '工厂结算加收 90 元，客户补款流水待复核。',
  financeNote: '财务异常 seed：待核对工厂结算和补款。',
  expectedDate: '2026-04-28',
  promisedDate: '2026-05-01'
}

const internalSampleCompletedOrderLine: OrderLine = {
  id: 'ol-internal-sample-completed-001',
  lineNo: 1,
  productionTaskNo: 'RD-SAMPLE-001',
  purchaseId: internalPurchaseId,
  customerId: 'customer-internal-rd-001',
  name: '内部研发山形耳骨夹',
  category: 'other',
  versionNo: 'rd-v1',
  quantity: 1,
  lineStatus: 'completed',
  designStatus: 'completed',
  modelingStatus: 'completed',
  productionStatus: 'completed',
  factoryStatus: 'returned',
  financeStatus: 'not_required',
  assignedDesignerId: 'designer-chen',
  assignedModelerId: 'modeler-lin',
  merchandiserId: 'merchandiser-wang',
  factoryId: 'factory-suzhou-gold-001',
  productionSentAt: '2026-05-01 10:30',
  factoryPlannedDueDate: '2026-05-04',
  productionCompletedAt: '2026-05-03 16:00',
  currentOwner: '研发样品库',
  priority: 'normal',
  isUrgent: false,
  requiresDesign: true,
  requiresModeling: true,
  requiresWax: true,
  isReferencedProduct: false,
  selectedSpecValue: '内部样品 1.8cm',
  selectedMaterial: '银版',
  selectedProcess: '手工抛光',
  selectedSpecialOptions: ['研发样品'],
  actualRequirements: {
    material: '银版',
    process: '手工抛光',
    specialNotes: ['内部研发，不产生客户收款', '完成后转入样品库'],
    remark: '内部新品打样完成，用于覆盖 internal purchase + completed OrderLine seed。'
  },
  designInfo: {
    assignedDesigner: '陈设计',
    requiresRemodeling: true,
    designDeadline: '2026-05-01',
    designNote: '研发样品设计已归档。'
  },
  productionInfo: {
    feedbackStatus: 'completed',
    actualMaterial: '银版',
    totalWeight: '1.9g',
    netWeight: '1.8g',
    factoryShippedAt: '2026-05-03 16:00',
    qualityResult: '内部评审通过',
    factoryNote: '样品已完成并交研发样品库。'
  },
  productionData: {
    shippedAt: '2026-05-03 16:00',
    completedAt: '2026-05-03 15:30',
    totalWeight: 1.9,
    netMetalWeight: 1.8,
    actualMaterial: '银版',
    factoryNote: '内部研发样品，不进入客户财务确认。',
    finishedImageUrls: ['rd-sample-earcuff.jpg']
  },
  lineSalesAmount: 0,
  allocatedDepositAmount: 0,
  allocatedFinalPaymentAmount: 0,
  financeNote: '内部研发样品，无客户收款。',
  expectedDate: '2026-05-04',
  promisedDate: '2026-05-04',
  finishedAt: '2026-05-04 10:00'
}

export const orderLinesMock: OrderLine[] = [
  ringOrderLine,
  pendantOrderLine,
  necklaceOrderLine,
  waxOrderLine,
  earringReviewOrderLine,
  broochBlockedOrderLine,
  factoryPendingOrderLine,
  completionReviewOrderLine,
  financeAbnormalOrderLine,
  linCustomRingDesignOrderLine,
  linCustomPendantModelingOrderLine,
  zhaoSpotRingOrderLine,
  internalSampleCompletedOrderLine
]
