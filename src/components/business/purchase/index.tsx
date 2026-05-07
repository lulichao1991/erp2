import { useMemo, useState } from 'react'
import { SourceProductDrawer, type SourceProductCompareValue } from '@/components/business/sourceProduct'
import { CopyableText, InfoField, InfoGrid, SectionCard, StatusTag } from '@/components/common'
import { mockProducts } from '@/mocks/products'
import { getOrderLineLineStatusLabel } from '@/services/orderLine/orderLineWorkflow'
import { getCustomerServiceNextLineStatus, getOrderLineCompleteness, hasEngravingRequirement } from '@/services/orderLine/orderLineCustomerService'
import { generateGoodsNumber } from '@/services/orderLine/goodsNumber'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { getReferableProducts } from '@/services/product/productQueries'
import type { Customer } from '@/types/customer'
import type { OrderLine, OrderLineLineStatus, OrderLineUploadedFile } from '@/types/order-line'
import type { Product, ProductCategory, ProductSpecRow } from '@/types/product'
import type { Purchase } from '@/types/purchase'
import type { QuoteResult } from '@/types/quote'
import { buildQuoteResult } from '@/utils/quote/buildQuoteResult'

export { PurchaseNotesTimelineSection, PurchaseOrderLineTable } from './purchaseDetailSections'

type PurchaseDraftFormValue = {
  purchaseNo: string
  channel: string
  platformOrderNo: string
  paymentAt: string
  ownerName: string
  remark: string
  customerId: string
  customerName: string
  customerPhone: string
  customerWechat: string
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  customerRemark: string
  receivableAmount: string
  receivedAmount: string
  paymentMethod: string
}

type OrderLineDraft = {
  id: string
  productionTaskNo: string
  sourceProductId?: string
  sourceProductCode?: string
  sourceProductName?: string
  sourceProductVersion?: string
  selectedSpecId?: string
  selectedSpecialOptions: string[]
  productName: string
  category: string
  versionNo: string
  spec: string
  material: string
  process: string
  engraveText: string
  engraveImageFiles: OrderLineUploadedFile[]
  engravePltFiles: OrderLineUploadedFile[]
  specialRequirement: string
  needsDesign: boolean
  needsModeling: boolean
  needsWax: boolean
  urgent: boolean
  lineStatus: OrderLineLineStatus
  ownerName: string
  promisedDate: string
}

type PurchaseDraftPayload = {
  commonInfo: Pick<PurchaseDraftFormValue, 'purchaseNo' | 'channel' | 'platformOrderNo' | 'paymentAt' | 'ownerName' | 'remark'>
  customerShippingInfo: Pick<
    PurchaseDraftFormValue,
    'customerId' | 'customerName' | 'customerPhone' | 'customerWechat' | 'recipientName' | 'recipientPhone' | 'recipientAddress' | 'customerRemark'
  >
  paymentInfo: {
    receivableAmount: number
    receivedAmount: number
    pendingAmount: number
    paymentMethod: string
    paymentStatus: string
    canShip: boolean
  }
}

type OrderLineDraftPayload = OrderLineDraft & {
  specParameterSummary?: string
  quoteResult?: QuoteResult
}

export type PurchaseDraftSavePayload = {
  purchaseDraft: PurchaseDraftPayload
  orderLineDrafts: OrderLineDraftPayload[]
}

export type PurchaseDraftPersistencePayload = {
  purchase: Purchase
  orderLines: OrderLine[]
  customer?: Customer
}

type ProductReferencePatch = Pick<
  OrderLineDraft,
  | 'sourceProductId'
  | 'sourceProductCode'
  | 'sourceProductName'
  | 'sourceProductVersion'
  | 'selectedSpecId'
  | 'selectedSpecialOptions'
  | 'productName'
  | 'category'
  | 'versionNo'
  | 'spec'
  | 'material'
  | 'process'
  | 'needsDesign'
  | 'needsModeling'
  | 'needsWax'
>

const generatePurchaseNumber = (date = new Date(), sequence = 2) => {
  const pad = (value: number, length = 2) => String(value).padStart(length, '0')

  return `PUR-${date.getFullYear()}${pad(date.getMonth() + 1)}-${pad(sequence, 3)}`
}

const createPurchaseDraft = (): PurchaseDraftFormValue => ({
  purchaseNo: generatePurchaseNumber(),
  channel: 'taobao',
  platformOrderNo: '',
  paymentAt: '',
  ownerName: '客服A',
  remark: '',
  customerId: '',
  customerName: '',
  customerPhone: '',
  customerWechat: '',
  recipientName: '',
  recipientPhone: '',
  recipientAddress: '',
  customerRemark: '',
  receivableAmount: '',
  receivedAmount: '',
  paymentMethod: '淘宝平台'
})

let draftLineSeed = 1

const createOrderLineDraftSequence = () => draftLineSeed++

const createOrderLineDraftId = (sequence: number) => `order-line-draft-${sequence}`

const createOrderLineDraft = (): OrderLineDraft => {
  const sequence = createOrderLineDraftSequence()

  return {
    id: createOrderLineDraftId(sequence),
    productionTaskNo: generateGoodsNumber(sequence),
    selectedSpecialOptions: [],
    productName: '',
    category: '',
    versionNo: '',
    spec: '',
    material: '',
    process: '',
    engraveText: '',
    engraveImageFiles: [],
    engravePltFiles: [],
    specialRequirement: '',
    needsDesign: true,
    needsModeling: false,
    needsWax: false,
    urgent: false,
    lineStatus: 'draft',
    ownerName: '客服A',
    promisedDate: ''
  }
}

const duplicateOrderLineDraft = (line: OrderLineDraft): OrderLineDraft => {
  const sequence = createOrderLineDraftSequence()

  return {
    ...line,
    id: createOrderLineDraftId(sequence),
    productionTaskNo: generateGoodsNumber(sequence),
    lineStatus: 'draft'
  }
}

const parseMoneyInput = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const categoryLabelMap: Record<ProductCategory, string> = {
  ring: '戒指',
  pendant: '吊坠',
  necklace: '项链',
  earring: '耳饰',
  bracelet: '手链',
  other: '其他'
}

const getProductCategoryLabel = (category: ProductCategory) => categoryLabelMap[category] || category

const getDraftProduct = (line: OrderLineDraft) => mockProducts.find((product) => product.id === line.sourceProductId)

const getSelectedSpec = (line: OrderLineDraft, product?: Product) => product?.specs.find((spec) => spec.id === line.selectedSpecId)

const getSpecParameterSummary = (spec?: ProductSpecRow) =>
  spec?.sizeFields.map((field) => `${field.label} ${field.value}${field.unit || ''}`).join(' / ') || ''

const buildProductReferencePatch = (productId: string): ProductReferencePatch => {
  const product = mockProducts.find((item) => item.id === productId)

  if (!product) {
    return {
      sourceProductId: undefined,
      sourceProductCode: undefined,
      sourceProductName: undefined,
      sourceProductVersion: undefined,
      selectedSpecId: undefined,
      selectedSpecialOptions: [],
      productName: '',
      category: '',
      versionNo: '',
      spec: '',
      material: '',
      process: '',
      needsDesign: true,
      needsModeling: false,
      needsWax: false
    }
  }

  return {
    sourceProductId: product.id,
    sourceProductCode: product.code,
    sourceProductName: product.name,
    sourceProductVersion: product.version,
    selectedSpecId: undefined,
    selectedSpecialOptions: [],
    productName: product.name,
    category: getProductCategoryLabel(product.category),
    versionNo: product.version,
    spec: '',
    material: product.defaultMaterial || product.supportedMaterials[0] || '',
    process: product.defaultProcess || product.supportedProcesses[0] || '',
    needsDesign: true,
    needsModeling: Boolean(product.customRules.requiresRemodeling),
    needsWax: Boolean(product.assets.modelFiles.length > 0)
  }
}

const buildSpecPatch = (line: OrderLineDraft, specId: string): Partial<OrderLineDraft> => {
  const product = getDraftProduct(line)
  const spec = product?.specs.find((item) => item.id === specId)

  return {
    selectedSpecId: spec?.id,
    spec: spec?.specValue || ''
  }
}

const buildSpecialOptionPatch = (line: OrderLineDraft, option: string, checked: boolean): Pick<OrderLineDraft, 'selectedSpecialOptions'> => ({
  selectedSpecialOptions: checked
    ? [...line.selectedSpecialOptions.filter((item) => item !== option), option]
    : line.selectedSpecialOptions.filter((item) => item !== option)
})

const buildDraftCompletenessInput = (line: OrderLineDraft) => ({
  productName: line.productName,
  category: line.category,
  material: line.material,
  size: line.spec,
  craftRequirements: line.process,
  productionTaskNo: line.productionTaskNo,
  needsEngraving: hasEngravingRequirement({
    engraveText: line.engraveText,
    selectedSpecialOptions: line.selectedSpecialOptions,
    engraveImageFiles: line.engraveImageFiles,
    engravePltFiles: line.engravePltFiles
  }),
  engraveImageFiles: line.engraveImageFiles,
  engravePltFiles: line.engravePltFiles
})

const buildDraftUploadedFiles = (files: FileList | null, prefix: string): OrderLineUploadedFile[] =>
  Array.from(files ?? []).map((file, index) => ({
    id: `${prefix}-${Date.now()}-${index}`,
    name: file.name,
    url: `mock-upload:${encodeURIComponent(file.name)}`
  }))

const buildOrderLineDraftQuote = (line: OrderLineDraft) => {
  const product = getDraftProduct(line)

  if (!product) {
    return undefined
  }

  return buildQuoteResult({
    selectedSpec: getSelectedSpec(line, product),
    selectedMaterial: line.material,
    selectedProcess: line.process,
    selectedSpecialOptions: line.selectedSpecialOptions,
    rules: product.priceRules,
    specRequired: Boolean(product.isSpecRequired)
  })
}

const getOrderLineDraftGoodsNo = (line: Pick<OrderLineDraft, 'productionTaskNo'>, fallback = '待生成货号') =>
  getOrderLineGoodsNo({ productionTaskNo: line.productionTaskNo.trim() }, fallback)

const buildDraftSourceProductCompareValue = (line: OrderLineDraft): SourceProductCompareValue => ({
  sourceLabel: `${getOrderLineDraftGoodsNo(line)} ${line.productName || line.sourceProductName || '未命名销售'}`,
  specValue: line.spec,
  material: line.material,
  process: line.process,
  specialOptions: line.selectedSpecialOptions
})

const buildDraftPayload = (
  draft: PurchaseDraftFormValue,
  paymentSummary: ReturnType<typeof getPurchaseDraftPaymentSummary>,
  orderLines: OrderLineDraft[]
): PurchaseDraftSavePayload => ({
  purchaseDraft: {
    commonInfo: {
      channel: draft.channel,
      purchaseNo: draft.purchaseNo,
      platformOrderNo: draft.platformOrderNo,
      paymentAt: draft.paymentAt,
      ownerName: draft.ownerName,
      remark: draft.remark
    },
    customerShippingInfo: {
      customerId: draft.customerId,
      customerName: draft.customerName,
      customerPhone: draft.customerPhone,
      customerWechat: draft.customerWechat,
      recipientName: draft.recipientName,
      recipientPhone: draft.recipientPhone,
      recipientAddress: draft.recipientAddress,
      customerRemark: draft.customerRemark
    },
    paymentInfo: {
      receivableAmount: paymentSummary.receivableAmount,
      receivedAmount: paymentSummary.receivedAmount,
      pendingAmount: paymentSummary.pendingAmount,
      paymentMethod: draft.paymentMethod,
      paymentStatus: paymentSummary.paymentStatus,
      canShip: paymentSummary.canShip
    }
  },
  orderLineDrafts: orderLines.map((line, index) => {
    const goodsNo = getOrderLineDraftGoodsNo(line, generateGoodsNumber(index + 1))

    return {
      ...line,
      productionTaskNo: goodsNo,
      specParameterSummary: getSpecParameterSummary(getSelectedSpec(line, getDraftProduct(line))),
      quoteResult: buildOrderLineDraftQuote(line)
    }
  })
})

const normalizeIdSegment = (value: string, fallback: string) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || fallback
}

const toProductCategory = (value: string): ProductCategory => {
  const directValue = value as ProductCategory

  if (Object.prototype.hasOwnProperty.call(categoryLabelMap, directValue)) {
    return directValue
  }

  return (Object.entries(categoryLabelMap).find(([, label]) => label === value)?.[0] as ProductCategory | undefined) || 'other'
}

const createEvenAmountAllocation = (totalAmount: number, count: number) => {
  if (count <= 0) {
    return []
  }

  const totalCents = Math.round(totalAmount * 100)
  const baseCents = Math.floor(totalCents / count)
  const amounts = Array.from({ length: count }, () => baseCents)
  amounts[count - 1] = (amounts[count - 1] ?? 0) + totalCents - baseCents * count

  return amounts.map((amount) => amount / 100)
}

const createLineSalesAmountAllocation = (orderLineDrafts: OrderLineDraftPayload[], receivableAmount: number) => {
  const quoteAmounts = orderLineDrafts.map((line) => line.quoteResult?.systemQuote)
  const quotedTotal = quoteAmounts.reduce<number>((sum, value) => sum + (typeof value === 'number' ? value : 0), 0)
  const missingIndexes = quoteAmounts.flatMap((value, index) => (typeof value === 'number' ? [] : [index]))

  if (receivableAmount <= 0) {
    return quoteAmounts.map((value) => value ?? 0)
  }

  if (missingIndexes.length === 0) {
    return createEvenAmountAllocation(receivableAmount, orderLineDrafts.length)
  }

  const nextAmounts = quoteAmounts.map((value) => value ?? 0)
  const remainingAmount = Math.max(receivableAmount - quotedTotal, 0)
  const missingAllocations = createEvenAmountAllocation(remainingAmount, missingIndexes.length)

  missingIndexes.forEach((lineIndex, allocationIndex) => {
    nextAmounts[lineIndex] = missingAllocations[allocationIndex] ?? 0
  })

  return nextAmounts
}

const getDraftCustomerId = (draft: PurchaseDraftPayload['customerShippingInfo'], purchaseNo: string) =>
  draft.customerId.trim() ||
  (draft.customerName.trim() || draft.customerPhone.trim()
    ? `customer-${normalizeIdSegment(draft.customerName || draft.customerPhone || purchaseNo, 'draft')}`
    : undefined)

const shouldCreateDraftCustomer = (draft: PurchaseDraftPayload['customerShippingInfo'], customerId?: string, existingCustomer?: Customer) =>
  Boolean(customerId && !existingCustomer && (draft.customerName || draft.customerPhone || draft.customerWechat || draft.recipientAddress))

const buildDraftCustomer = (
  draft: PurchaseDraftPayload['customerShippingInfo'],
  purchaseDraft: PurchaseDraftPayload,
  existingCustomer?: Customer
): Customer | undefined => {
  const customerId = getDraftCustomerId(draft, purchaseDraft.commonInfo.purchaseNo)

  if (!shouldCreateDraftCustomer(draft, customerId, existingCustomer)) {
    return undefined
  }

  return {
    id: customerId!,
    name: draft.customerName || undefined,
    phone: draft.customerPhone || undefined,
    wechat: draft.customerWechat || undefined,
    defaultRecipientName: draft.recipientName || draft.customerName || undefined,
    defaultRecipientPhone: draft.recipientPhone || draft.customerPhone || undefined,
    defaultRecipientAddress: draft.recipientAddress || undefined,
    sourceChannels: [purchaseDraft.commonInfo.channel as Customer['sourceChannels'][number]],
    tags: ['new'],
    remark: draft.customerRemark || undefined,
    firstTransactionAt: purchaseDraft.commonInfo.paymentAt || undefined,
    lastTransactionAt: purchaseDraft.commonInfo.paymentAt || undefined
  }
}

const buildDraftOrderLineSourceProduct = (line: OrderLineDraftPayload, snapshotAt: string) => {
  const product = getDraftProduct(line)

  if (!product) {
    return undefined
  }

  return {
    sourceProductId: product.id,
    sourceProductCode: product.code,
    sourceProductName: product.name,
    sourceProductVersion: product.version,
    category: product.category,
    sourceSpecValue: line.spec || getSelectedSpec(line, product)?.specValue,
    defaultMaterial: product.defaultMaterial,
    defaultProcess: product.defaultProcess,
    snapshotAt
  }
}

const getDraftDesignStatus = (line: OrderLineDraftPayload): OrderLine['designStatus'] => {
  if (!line.needsDesign) {
    return 'not_required'
  }

  return line.lineStatus === 'pending_modeling' || line.lineStatus === 'pending_merchandiser_review' ? 'completed' : 'pending'
}

const getDraftModelingStatus = (line: OrderLineDraftPayload): OrderLine['modelingStatus'] => {
  if (!line.needsModeling) {
    return 'not_required'
  }

  return line.lineStatus === 'pending_modeling' ? 'pending' : 'not_required'
}

export const buildPurchaseDraftPersistencePayload = (
  payload: PurchaseDraftSavePayload,
  options: { existingCustomer?: Customer; currentTime?: string } = {}
): PurchaseDraftPersistencePayload => {
  const currentTime = options.currentTime || new Date().toISOString().slice(0, 16).replace('T', ' ')
  const purchaseNo = payload.purchaseDraft.commonInfo.purchaseNo
  const purchaseId = `purchase-${normalizeIdSegment(purchaseNo, 'draft')}`
  const customerId = getDraftCustomerId(payload.purchaseDraft.customerShippingInfo, purchaseNo)
  const lineSalesAmounts = createLineSalesAmountAllocation(payload.orderLineDrafts, payload.purchaseDraft.paymentInfo.receivableAmount)
  const paidAllocations = createEvenAmountAllocation(payload.purchaseDraft.paymentInfo.receivedAmount, payload.orderLineDrafts.length)

  const orderLines: OrderLine[] = payload.orderLineDrafts.map((line, index) => {
    const goodsNo = getOrderLineDraftGoodsNo(line, generateGoodsNumber(index + 1))
    const product = getDraftProduct(line)
    const selectedSpec = getSelectedSpec(line, product)
    const sourceProduct = buildDraftOrderLineSourceProduct(line, currentTime)
    const specialNotes = [line.specialRequirement, ...line.selectedSpecialOptions].filter(Boolean)
    const lineSalesAmount = lineSalesAmounts[index] ?? 0
    const allocatedPaidAmount = paidAllocations[index] ?? 0

    return {
      id: `order-line-${normalizeIdSegment(goodsNo, String(index + 1))}`,
      lineNo: index + 1,
      productionTaskNo: goodsNo,
      purchaseId,
      customerId,
      name: line.productName || line.sourceProductName || `未命名销售 ${index + 1}`,
      category: toProductCategory(line.category),
      versionNo: line.versionNo || sourceProduct?.sourceProductVersion,
      quantity: 1,
      lineStatus: line.lineStatus,
      designStatus: getDraftDesignStatus(line),
      modelingStatus: getDraftModelingStatus(line),
      productionStatus: 'not_started',
      factoryStatus: 'not_assigned',
      financeStatus: 'not_required',
      currentOwner: line.ownerName || payload.purchaseDraft.commonInfo.ownerName,
      priority: line.urgent ? 'urgent' : 'normal',
      isUrgent: line.urgent,
      requiresDesign: line.needsDesign,
      requiresModeling: line.needsModeling,
      requiresWax: line.needsWax,
      isReferencedProduct: Boolean(product),
      productId: product?.id,
      sourceProduct,
      selectedSpecValue: line.spec || selectedSpec?.specValue,
      selectedSpecSnapshot: selectedSpec,
      selectedMaterial: line.material || sourceProduct?.defaultMaterial,
      selectedProcess: line.process || sourceProduct?.defaultProcess,
      selectedSpecialOptions: line.selectedSpecialOptions,
      actualRequirements: {
        material: line.material || undefined,
        process: line.process || undefined,
        engraveText: line.engraveText || undefined,
        engraveImageFiles: line.engraveImageFiles,
        engravePltFiles: line.engravePltFiles,
        specialNotes,
        remark: line.specialRequirement || line.specParameterSummary
      },
      designInfo: {
        requiresRemodeling: line.needsModeling,
        designDeadline: line.needsDesign ? line.promisedDate || undefined : undefined,
        designNote: line.needsDesign ? '新建购买记录生成，待设计确认。' : undefined
      },
      productionInfo: {
        feedbackStatus: 'not_started',
        factoryNote: '新建购买记录生成，尚未下发工厂。'
      },
      productionData: {},
      lineSalesAmount,
      allocatedDepositAmount: allocatedPaidAmount,
      allocatedFinalPaymentAmount: 0,
      quote: line.quoteResult,
      expectedDate: line.promisedDate || undefined,
      promisedDate: line.promisedDate || undefined
    }
  })

  const purchaseType = orderLines.every((line) => !line.productId) ? 'full_custom' : 'semi_custom'
  const hasActiveLine = orderLines.some((line) => line.lineStatus && line.lineStatus !== 'draft')
  const customer = buildDraftCustomer(payload.purchaseDraft.customerShippingInfo, payload.purchaseDraft, options.existingCustomer)
  const paymentTransaction =
    payload.purchaseDraft.paymentInfo.receivedAmount > 0
      ? [
          {
            id: `finance-${purchaseId}-deposit`,
            type: 'deposit_received' as const,
            amount: payload.purchaseDraft.paymentInfo.receivedAmount,
            occurredAt: payload.purchaseDraft.commonInfo.paymentAt || currentTime,
            note: '新建购买记录收款'
          }
        ]
      : []

  return {
    customer,
    orderLines,
    purchase: {
      id: purchaseId,
      purchaseNo,
      platformOrderNo: payload.purchaseDraft.commonInfo.platformOrderNo || undefined,
      sourceChannel: payload.purchaseDraft.commonInfo.channel,
      customerId,
      purchaseType,
      ownerName: payload.purchaseDraft.commonInfo.ownerName,
      recipientName: payload.purchaseDraft.customerShippingInfo.recipientName || payload.purchaseDraft.customerShippingInfo.customerName || undefined,
      recipientPhone: payload.purchaseDraft.customerShippingInfo.recipientPhone || payload.purchaseDraft.customerShippingInfo.customerPhone || undefined,
      recipientAddress: payload.purchaseDraft.customerShippingInfo.recipientAddress || undefined,
      paymentAt: payload.purchaseDraft.commonInfo.paymentAt || undefined,
      riskTags: orderLines.length > 1 ? ['同次购买多件商品'] : [],
      remark: payload.purchaseDraft.commonInfo.remark || payload.purchaseDraft.customerShippingInfo.customerRemark || undefined,
      aggregateStatus: hasActiveLine ? 'in_progress' : 'draft',
      orderLineCount: orderLines.length,
      orderLines,
      finance: {
        dealPrice: payload.purchaseDraft.paymentInfo.receivableAmount,
        depositAmount: payload.purchaseDraft.paymentInfo.receivedAmount,
        balanceAmount: payload.purchaseDraft.paymentInfo.pendingAmount,
        depositStatus: payload.purchaseDraft.paymentInfo.receivedAmount > 0 ? 'confirmed' : 'pending',
        finalPaymentStatus: payload.purchaseDraft.paymentInfo.pendingAmount > 0 ? 'pending' : 'not_required',
        invoiced: false,
        remark: '由新建购买记录前端 mock 写入。',
        transactions: paymentTransaction
      },
      latestActivityAt: currentTime,
      timeline: [
        {
          id: `timeline-${purchaseId}-created`,
          purchaseId,
          type: 'purchase_created',
          title: '创建购买记录',
          description: `前端 mock 写入 ${orderLines.length} 条销售。`,
          actorName: payload.purchaseDraft.commonInfo.ownerName || '当前用户',
          createdAt: currentTime
        }
      ]
    }
  }
}

const validatePurchaseDraft = (paymentSummary: ReturnType<typeof getPurchaseDraftPaymentSummary>) => {
  if (paymentSummary.receivedAmount > paymentSummary.receivableAmount) {
    return '已收金额不能大于应收总额。'
  }

  return ''
}

const purchaseAggregateStatusLabelMap: Record<string, string> = {
  draft: '草稿',
  in_progress: '进行中',
  partially_shipped: '部分发货',
  completed: '已完成',
  after_sales: '售后中',
  exception: '异常',
  cancelled: '已取消'
}

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')

const getEnabledProductSpecs = (product: Product) => product.specs.filter((spec) => spec.status === 'enabled')

const getProductFileCount = (product: Product) =>
  product.assets.modelFiles.length + product.assets.craftFiles.length + product.assets.sizeFiles.length + product.assets.otherFiles.length

const formatProductSpecCount = (product: Product) => `${getEnabledProductSpecs(product).length}/${product.specs.length} 启用`

const formatProductBasePriceRange = (product: Product) => {
  const prices = getEnabledProductSpecs(product)
    .map((spec) => spec.basePrice)
    .filter((value): value is number => typeof value === 'number')

  if (prices.length === 0) {
    return '—'
  }

  const min = Math.min(...prices)
  const max = Math.max(...prices)

  return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`
}

const getPurchaseAggregateStatusLabel = (status?: string) => (status ? purchaseAggregateStatusLabelMap[status] || status : '待确认')

const getPurchaseDraftPaymentSummary = (draft: PurchaseDraftFormValue) => {
  const receivableAmount = parseMoneyInput(draft.receivableAmount)
  const receivedAmount = parseMoneyInput(draft.receivedAmount)
  const pendingAmount = Math.max(receivableAmount - receivedAmount, 0)
  const paymentStatus = pendingAmount === 0 && receivableAmount > 0 ? '已付清' : receivedAmount > 0 ? '部分收款' : '待收款'

  return {
    receivableAmount,
    receivedAmount,
    pendingAmount,
    paymentStatus,
    canShip: receivableAmount > 0 && pendingAmount === 0
  }
}

const getPaymentSummary = (purchase: Purchase) => {
  const transactions = purchase.finance?.transactions ?? []
  const receivedAmount = transactions
    .filter((item) => item.type === 'deposit_received' || item.type === 'balance_received' || item.type === 'after_sales_payment')
    .reduce((sum, item) => sum + item.amount, 0)
  const receivableAmount = purchase.finance?.dealPrice ?? purchase.orderLines.reduce((sum, line) => sum + (line.lineSalesAmount ?? line.quote?.systemQuote ?? 0), 0)
  const pendingAmount = Math.max(receivableAmount - receivedAmount, 0)

  return {
    receivableAmount,
    receivedAmount,
    pendingAmount,
    paymentStatus: pendingAmount === 0 ? '已付清' : receivedAmount > 0 ? '部分收款' : '待收款',
    paymentMethod: purchase.sourceChannel === 'taobao' ? '淘宝平台' : purchase.sourceChannel || '待确认',
    canShip: pendingAmount === 0
  }
}

const renderCopyable = (value: string | number | undefined, label: string) => <CopyableText value={value} label={label} />

export const PurchaseSummarySection = ({ purchase, customer }: { purchase: Purchase; customer?: Customer }) => {
  const paymentSummary = getPaymentSummary(purchase)

  return (
    <SectionCard title="购买记录摘要">
      <InfoGrid columns={3}>
        <InfoField label="购买记录编号" value={renderCopyable(purchase.purchaseNo, '购买记录编号')} />
        <InfoField label="客户" value={renderCopyable(customer?.name, '客户')} />
        <InfoField label="渠道" value={purchase.sourceChannel} />
        <InfoField label="平台订单号" value={renderCopyable(purchase.platformOrderNo, '平台订单号')} />
        <InfoField label="销售数量" value={`${purchase.orderLines.length} 条`} />
        <InfoField label="聚合状态" value={<StatusTag value={getPurchaseAggregateStatusLabel(purchase.aggregateStatus)} />} />
        <InfoField label="付款摘要" value={`${formatPrice(paymentSummary.receivedAmount)} / ${formatPrice(paymentSummary.receivableAmount)}`} />
        <InfoField label="付款状态" value={<StatusTag value={paymentSummary.paymentStatus} />} />
        <InfoField label="客服负责人" value={purchase.ownerName || '待分配'} />
        <InfoField label="当前整体提示" value="本页只做购买记录归组；每条销售独立推进执行。" />
      </InfoGrid>
    </SectionCard>
  )
}

export const PurchaseCustomerSection = ({ purchase, customer }: { purchase: Purchase; customer?: Customer }) => (
  <SectionCard title="客户与收货信息">
    <InfoGrid columns={3}>
      <InfoField label="客户姓名" value={renderCopyable(customer?.name, '客户姓名')} />
      <InfoField label="手机" value={renderCopyable(customer?.phone, '手机')} />
      <InfoField label="微信" value={renderCopyable(customer?.wechat, '微信')} />
      <InfoField label="收件人" value={renderCopyable(purchase.recipientName || customer?.defaultRecipientName, '收件人')} />
      <InfoField label="收件手机号" value={renderCopyable(purchase.recipientPhone || customer?.defaultRecipientPhone, '收件手机号')} />
      <InfoField label="收件地址" value={renderCopyable(purchase.recipientAddress || customer?.defaultRecipientAddress, '收件地址')} />
      <InfoField label="客户备注" value={renderCopyable(customer?.remark, '客户备注')} />
    </InfoGrid>
  </SectionCard>
)

export const PurchasePaymentSection = ({ purchase }: { purchase: Purchase }) => {
  const summary = getPaymentSummary(purchase)

  return (
    <SectionCard title="付款总览">
      <InfoGrid columns={3}>
        <InfoField label="应收总额" value={formatPrice(summary.receivableAmount)} />
        <InfoField label="已收金额" value={formatPrice(summary.receivedAmount)} />
        <InfoField label="待收金额" value={formatPrice(summary.pendingAmount)} />
        <InfoField label="付款状态" value={<StatusTag value={summary.paymentStatus} />} />
        <InfoField label="付款方式" value={summary.paymentMethod} />
        <InfoField label="是否允许发货" value={summary.canShip ? '是' : '否'} />
        <InfoField label="财务备注" value={purchase.finance?.remark || '—'} />
      </InfoGrid>
    </SectionCard>
  )
}

export const usePurchaseDraftForm = () => {
  const [purchaseDraft, setPurchaseDraft] = useState<PurchaseDraftFormValue>(() => createPurchaseDraft())
  const [orderLineDrafts, setOrderLineDrafts] = useState<OrderLineDraft[]>(() => [createOrderLineDraft()])
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const paymentSummary = useMemo(() => getPurchaseDraftPaymentSummary(purchaseDraft), [purchaseDraft])

  const updatePurchaseDraft = <K extends keyof PurchaseDraftFormValue>(field: K, value: PurchaseDraftFormValue[K]) => {
    setPurchaseDraft((current) => ({ ...current, [field]: value }))
    setSuccessMessage('')
    setErrorMessage('')
  }

  const addOrderLine = () => {
    setOrderLineDrafts((current) => [...current, createOrderLineDraft()])
    setSuccessMessage('')
    setErrorMessage('')
  }

  const removeOrderLine = (lineId: string) => {
    if (orderLineDrafts.length <= 1) {
      setErrorMessage('至少需要保留 1 条销售。')
      setSuccessMessage('')
      return
    }

    setOrderLineDrafts((current) => current.filter((line) => line.id !== lineId))
    setSuccessMessage('')
    setErrorMessage('')
  }

  const duplicateOrderLine = (lineId: string) => {
    setOrderLineDrafts((current) => current.flatMap((line) => (line.id === lineId ? [line, duplicateOrderLineDraft(line)] : [line])))
    setSuccessMessage('')
    setErrorMessage('')
  }

  const updateOrderLine = (lineId: string, patch: Partial<OrderLineDraft>) => {
    setOrderLineDrafts((current) => current.map((line) => (line.id === lineId ? { ...line, ...patch } : line)))
    setSuccessMessage('')
    setErrorMessage('')
  }

  const applyProductToOrderLine = (lineId: string, productId: string) => {
    setOrderLineDrafts((current) => current.map((line) => (line.id === lineId ? { ...line, ...buildProductReferencePatch(productId) } : line)))
    setSuccessMessage('')
    setErrorMessage('')
  }

  const selectOrderLineSpec = (lineId: string, specId: string) => {
    setOrderLineDrafts((current) => current.map((line) => (line.id === lineId ? { ...line, ...buildSpecPatch(line, specId) } : line)))
    setSuccessMessage('')
    setErrorMessage('')
  }

  const toggleOrderLineSpecialOption = (lineId: string, option: string, checked: boolean) => {
    setOrderLineDrafts((current) =>
      current.map((line) => (line.id === lineId ? { ...line, ...buildSpecialOptionPatch(line, option, checked) } : line))
    )
    setSuccessMessage('')
    setErrorMessage('')
  }

  const saveDraft = (onSuccess?: (payload: PurchaseDraftSavePayload) => void) => {
    if (orderLineDrafts.length === 0) {
      setErrorMessage('至少需要保留 1 条销售。')
      setSuccessMessage('')
      return
    }

    const validationError = validatePurchaseDraft(paymentSummary)
    if (validationError) {
      setErrorMessage(validationError)
      setSuccessMessage('')
      return
    }

    const payload = buildDraftPayload(purchaseDraft, paymentSummary, orderLineDrafts)
    onSuccess?.(payload)
    setSuccessMessage(`已生成购买记录草稿：1 笔购买记录 + ${orderLineDrafts.length} 条销售`)
    setErrorMessage('')
  }

  return {
    purchaseDraft,
    orderLineDrafts,
    paymentSummary,
    successMessage,
    errorMessage,
    updatePurchaseDraft,
    addOrderLine,
    removeOrderLine,
    duplicateOrderLine,
    updateOrderLine,
    applyProductToOrderLine,
    selectOrderLineSpec,
    toggleOrderLineSpecialOption,
    saveDraft
  }
}

type PurchaseDraftSectionProps = {
  draft: PurchaseDraftFormValue
  onChange: <K extends keyof PurchaseDraftFormValue>(field: K, value: PurchaseDraftFormValue[K]) => void
}

export const PurchaseDraftCommonSection = ({ draft, onChange }: PurchaseDraftSectionProps) => (
  <SectionCard title="购买公共信息">
    <div className="field-grid three">
      <label className="field-control">
        <span className="field-label">购买记录编号（系统生成）</span>
        <input aria-label="购买记录编号" className="input" value={draft.purchaseNo} readOnly />
      </label>
      <label className="field-control">
        <span className="field-label">渠道</span>
        <select className="select" value={draft.channel} onChange={(event) => onChange('channel', event.target.value)}>
          <option value="taobao">淘宝</option>
          <option value="wechat">微信</option>
          <option value="xiaohongshu">小红书</option>
          <option value="offline">线下</option>
        </select>
      </label>
      <label className="field-control">
        <span className="field-label">平台订单号</span>
        <input className="input" value={draft.platformOrderNo} onChange={(event) => onChange('platformOrderNo', event.target.value)} />
      </label>
      <label className="field-control">
        <span className="field-label">付款时间</span>
        <input className="input" type="datetime-local" value={draft.paymentAt} onChange={(event) => onChange('paymentAt', event.target.value)} />
      </label>
      <label className="field-control">
        <span className="field-label">客服负责人</span>
        <input className="input" value={draft.ownerName} onChange={(event) => onChange('ownerName', event.target.value)} />
      </label>
      <label className="field-control">
        <span className="field-label">整体备注</span>
        <textarea className="textarea" value={draft.remark} onChange={(event) => onChange('remark', event.target.value)} />
      </label>
    </div>
  </SectionCard>
)

export const PurchaseDraftCustomerSection = ({ draft, onChange }: PurchaseDraftSectionProps) => (
  <SectionCard title="客户与收货信息">
    <div className="field-grid three">
      <label className="field-control">
        <span className="field-label">客户ID</span>
        <input aria-label="客户ID" className="input" value={draft.customerId} onChange={(event) => onChange('customerId', event.target.value)} placeholder="例如：customer-zhang-001" />
      </label>
      <label className="field-control">
        <span className="field-label">客户姓名</span>
        <input aria-label="客户姓名" className="input" value={draft.customerName} onChange={(event) => onChange('customerName', event.target.value)} />
      </label>
      <label className="field-control">
        <span className="field-label">手机</span>
        <input className="input" value={draft.customerPhone} onChange={(event) => onChange('customerPhone', event.target.value)} />
      </label>
      <label className="field-control">
        <span className="field-label">微信</span>
        <input className="input" value={draft.customerWechat} onChange={(event) => onChange('customerWechat', event.target.value)} />
      </label>
      <label className="field-control">
        <span className="field-label">收件人</span>
        <input className="input" value={draft.recipientName} onChange={(event) => onChange('recipientName', event.target.value)} />
      </label>
      <label className="field-control">
        <span className="field-label">收件手机号</span>
        <input className="input" value={draft.recipientPhone} onChange={(event) => onChange('recipientPhone', event.target.value)} />
      </label>
      <label className="field-control">
        <span className="field-label">收件地址</span>
        <input className="input" value={draft.recipientAddress} onChange={(event) => onChange('recipientAddress', event.target.value)} />
      </label>
      <label className="field-control">
        <span className="field-label">客户备注</span>
        <textarea className="textarea" value={draft.customerRemark} onChange={(event) => onChange('customerRemark', event.target.value)} />
      </label>
    </div>
  </SectionCard>
)

export const PurchaseDraftPaymentSection = ({
  draft,
  paymentSummary,
  onChange
}: PurchaseDraftSectionProps & { paymentSummary: ReturnType<typeof getPurchaseDraftPaymentSummary> }) => (
  <SectionCard title="付款信息">
    <div className="field-grid three">
      <label className="field-control">
        <span className="field-label">应收总额</span>
        <input className="input" type="number" min="0" value={draft.receivableAmount} onChange={(event) => onChange('receivableAmount', event.target.value)} />
      </label>
      <label className="field-control">
        <span className="field-label">已收金额</span>
        <input className="input" type="number" min="0" value={draft.receivedAmount} onChange={(event) => onChange('receivedAmount', event.target.value)} />
      </label>
      <InfoField label="待收金额" value={formatPrice(paymentSummary.pendingAmount)} />
      <label className="field-control">
        <span className="field-label">付款方式</span>
        <select className="select" value={draft.paymentMethod} onChange={(event) => onChange('paymentMethod', event.target.value)}>
          <option value="淘宝平台">淘宝平台</option>
          <option value="微信支付">微信支付</option>
          <option value="支付宝">支付宝</option>
          <option value="线下转账">线下转账</option>
        </select>
      </label>
      <InfoField label="付款状态" value={<StatusTag value={paymentSummary.paymentStatus} />} />
      <InfoField label="是否允许发货" value={paymentSummary.canShip ? '是' : '否'} />
    </div>
  </SectionCard>
)

const OrderLineDraftQuotePanel = ({ product, selectedSpec, quote }: { product?: Product; selectedSpec?: ProductSpecRow; quote?: QuoteResult }) => {
  if (!product) {
    return <div className="text-caption">未引用款式时保留手动填写，暂不生成系统参考报价。</div>
  }

  if (!quote || quote.status === 'waiting_spec') {
    return (
      <div className="warning-alert">
        <strong>系统参考报价</strong>
        <div className="text-caption">请先选择规格</div>
      </div>
    )
  }

  return (
    <div className={quote.status === 'warning' ? 'warning-alert' : 'placeholder-block'}>
      <div className="row wrap" style={{ justifyContent: 'space-between' }}>
        <strong>系统参考报价</strong>
        <StatusTag value={quote.status === 'warning' ? '报价提示' : '已生成'} />
      </div>
      <InfoGrid columns={3}>
        <InfoField label="规格基础价" value={formatPrice(quote.basePrice)} />
        <InfoField label="固定加价" value={formatPrice(quote.priceAdjustments.reduce((sum, item) => sum + item.delta, 0))} />
        <InfoField label="系统参考报价" value={formatPrice(quote.systemQuote)} />
      </InfoGrid>
      <div className="text-caption">{selectedSpec ? `规格参数：${getSpecParameterSummary(selectedSpec) || '暂无规格参数'}` : '请先选择规格'}</div>
      {quote.priceAdjustments.length > 0 ? (
        <div className="text-caption">加价命中：{quote.priceAdjustments.map((item) => `${item.ruleKey} +${item.delta}`).join(' / ')}</div>
      ) : null}
      {quote.warnings.length > 0 ? <div className="text-caption">{quote.warnings.map((warning) => warning.message).join(' ')}</div> : null}
    </div>
  )
}

const ProductReferenceSelector = ({
  selectedProductId,
  onApplyProduct
}: {
  selectedProductId?: string
  onApplyProduct: (productId: string) => void
}) => {
  const referableProducts = getReferableProducts()
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<ProductCategory | 'all'>('all')
  const [previewProductId, setPreviewProductId] = useState(selectedProductId || referableProducts[0]?.id || '')
  const selectedProduct = referableProducts.find((product) => product.id === selectedProductId)
  const previewProduct = referableProducts.find((product) => product.id === previewProductId)
  const categoryOptions = Array.from(new Set(referableProducts.map((product) => product.category)))

  const filteredProducts = referableProducts.filter((product) => {
    const keywordText = keyword.trim().toLowerCase()
    const matchesKeyword =
      keywordText.length === 0 ||
      [product.name, product.code, product.series, getProductCategoryLabel(product.category)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keywordText)
    const matchesCategory = category === 'all' || product.category === category

    return matchesKeyword && matchesCategory
  })

  const handleApplyProduct = (productId: string) => {
    onApplyProduct(productId)
    setPreviewProductId(productId || referableProducts[0]?.id || '')
  }

  return (
    <div className="field-control product-reference-selector" style={{ gridColumn: '1 / -1' }}>
      <span className="field-label">引用款式</span>
      <div className="field-grid two">
        <input
          aria-label="引用款式"
          className="input"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索款式名称 / 编号 / 系列"
        />
        <select
          aria-label="款式品类筛选"
          className="select"
          value={category}
          onChange={(event) => setCategory(event.target.value as ProductCategory | 'all')}
        >
          <option value="all">全部品类</option>
          {categoryOptions.map((item) => (
            <option key={item} value={item}>
              {getProductCategoryLabel(item)}
            </option>
          ))}
        </select>
      </div>
      <div className="subtle-panel spacer-top">
        <div className="row wrap" style={{ justifyContent: 'space-between' }}>
          <div className="stack" style={{ gap: 4 }}>
            <strong>{selectedProduct ? `已引用：${selectedProduct.name}` : '不引用款式，手动填写'}</strong>
            <span className="text-caption">
              {selectedProduct
                ? `${selectedProduct.code} · ${selectedProduct.version} · ${getProductCategoryLabel(selectedProduct.category)}`
                : '手动销售不会生成系统参考报价。'}
            </span>
          </div>
          {selectedProduct ? (
            <button type="button" className="button ghost small" onClick={() => handleApplyProduct('')}>
              改为手动填写
            </button>
          ) : null}
        </div>
      </div>
      <div className="stack spacer-top" style={{ gap: 8 }}>
        {filteredProducts.map((product) => {
          const selected = product.id === selectedProductId

          return (
            <div key={product.id} className="subtle-panel">
              <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                <div className="stack" style={{ gap: 4 }}>
                  <div className="row wrap">
                    <strong>{product.name}</strong>
                    <StatusTag value={selected ? '已选择' : '可引用'} />
                  </div>
                  <span className="text-caption">
                    {product.code} · {product.version} · {getProductCategoryLabel(product.category)} · {product.defaultMaterial || '未设材质'} / {product.defaultProcess || '未设工艺'}
                  </span>
                  <span className="text-caption">
                    规格 {formatProductSpecCount(product)} · 基础价 {formatProductBasePriceRange(product)} · 文件 {getProductFileCount(product)} 份
                  </span>
                </div>
                <div className="row wrap">
                  <button type="button" className="button ghost small" aria-label={`预览${product.name}`} onClick={() => setPreviewProductId(product.id)}>
                    预览
                  </button>
                  <button type="button" className="button secondary small" aria-label={`选择${product.name}`} onClick={() => handleApplyProduct(product.id)}>
                    选择
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filteredProducts.length === 0 ? <div className="placeholder-block">没有匹配的可引用款式。</div> : null}
      </div>
      {previewProduct ? (
        <div className="placeholder-block spacer-top" aria-label="来源款式预览">
          <div className="row wrap" style={{ justifyContent: 'space-between' }}>
            <strong>来源款式预览</strong>
            <button type="button" className="button primary small" onClick={() => handleApplyProduct(previewProduct.id)}>
              使用这个款式
            </button>
          </div>
          <InfoGrid columns={3}>
            <InfoField label="款式" value={`${previewProduct.name} / ${previewProduct.code}`} />
            <InfoField label="版本" value={previewProduct.version} />
            <InfoField label="品类" value={getProductCategoryLabel(previewProduct.category)} />
            <InfoField label="材质 / 工艺" value={`${previewProduct.defaultMaterial || '—'} / ${previewProduct.defaultProcess || '—'}`} />
            <InfoField label="规格" value={formatProductSpecCount(previewProduct)} />
            <InfoField label="基础价区间" value={formatProductBasePriceRange(previewProduct)} />
          </InfoGrid>
        </div>
      ) : null}
    </div>
  )
}

const OrderLineDraftCard = ({
  line,
  draftIndex,
  canRemove,
  onChange,
  onRemove,
  onDuplicate,
  onApplyProduct,
  onSelectSpec,
  onToggleSpecialOption,
  onOpenSourceProduct
}: {
  line: OrderLineDraft
  draftIndex: number
  canRemove: boolean
  onChange: (patch: Partial<OrderLineDraft>) => void
  onRemove: () => void
  onDuplicate: () => void
  onApplyProduct: (productId: string) => void
  onSelectSpec: (specId: string) => void
  onToggleSpecialOption: (option: string, checked: boolean) => void
  onOpenSourceProduct: () => void
}) => {
  const product = getDraftProduct(line)
  const selectedSpec = getSelectedSpec(line, product)
  const quote = buildOrderLineDraftQuote(line)
  const completeness = getOrderLineCompleteness(buildDraftCompletenessInput(line))
  const needsEngraving = hasEngravingRequirement({
    engraveText: line.engraveText,
    selectedSpecialOptions: line.selectedSpecialOptions,
    engraveImageFiles: line.engraveImageFiles,
    engravePltFiles: line.engravePltFiles
  })
  const nextConfirmStatus = getCustomerServiceNextLineStatus({
    requiresDesign: line.needsDesign,
    requiresModeling: line.needsModeling
  })
  const handleEngraveImageUpload = (files: FileList | null) => {
    onChange({ engraveImageFiles: buildDraftUploadedFiles(files, `${line.id}-engrave-image`) })
  }
  const handleEngravePltUpload = (files: FileList | null) => {
    onChange({ engravePltFiles: buildDraftUploadedFiles(files, `${line.id}-engrave-plt`) })
  }
  const handleCustomerConfirm = () => {
    if (!completeness.complete) {
      return
    }
    onChange({ lineStatus: nextConfirmStatus })
  }

  return (
    <div className="subtle-panel">
      <div className="row wrap" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="row wrap">
          <strong>销售草稿 {draftIndex + 1}</strong>
          <StatusTag value={getOrderLineLineStatusLabel(line.lineStatus)} />
          <StatusTag value={completeness.complete ? '资料完整' : '资料缺失'} />
        </div>
        <div className="row wrap">
          <button type="button" className="button secondary small" onClick={handleCustomerConfirm} disabled={!completeness.complete}>
            标记客服确认完成
          </button>
          <button type="button" className="button ghost small" onClick={onDuplicate}>
            复制销售
          </button>
          <button type="button" className="button ghost small" onClick={onRemove} disabled={!canRemove}>
            删除销售
          </button>
        </div>
      </div>
      <div className="text-caption">
        资料完整度 {completeness.completed}/{completeness.total} · {completeness.summary}
        {completeness.complete ? ` · 确认后进入「${getOrderLineLineStatusLabel(nextConfirmStatus)}」` : ''}
      </div>
      <div className="field-grid three">
        <ProductReferenceSelector selectedProductId={line.sourceProductId} onApplyProduct={onApplyProduct} />
        <label className="field-control">
          <span className="field-label">货号</span>
          <input aria-label="货号" className="input" value={line.productionTaskNo} readOnly />
        </label>
        <label className="field-control">
          <span className="field-label">款式名称</span>
          <input aria-label="款式名称" className="input" value={line.productName} readOnly={Boolean(line.sourceProductId)} onChange={(event) => onChange({ productName: event.target.value })} />
        </label>
        <label className="field-control">
          <span className="field-label">品类</span>
          <input className="input" value={line.category} onChange={(event) => onChange({ category: event.target.value })} />
        </label>
        <label className="field-control">
          <span className="field-label">版本号</span>
          <input className="input" value={line.versionNo} onChange={(event) => onChange({ versionNo: event.target.value })} />
        </label>
      </div>

      {product ? (
        <div className="row wrap spacer-top" style={{ justifyContent: 'space-between' }}>
          <div className="text-caption">
            来源款式：{product.name} · {product.code} · {product.version}
          </div>
          <button type="button" className="button ghost small" onClick={onOpenSourceProduct}>
            查看来源款式
          </button>
        </div>
      ) : null}

      <div className="field-grid three spacer-top">
        <label className="field-control">
          <span className="field-label">规格</span>
          {product?.specMode === 'single_axis' ? (
            <select aria-label="规格" className="select" value={line.selectedSpecId || ''} onChange={(event) => onSelectSpec(event.target.value)}>
              <option value="">请选择{product.specName || '规格'}</option>
              {product.specs
                .filter((spec) => spec.status === 'enabled')
                .map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.specValue}
                  </option>
                ))}
            </select>
          ) : (
            <input aria-label="规格" className="input" value={line.spec} onChange={(event) => onChange({ spec: event.target.value })} />
          )}
        </label>
        <label className="field-control">
          <span className="field-label">材质</span>
          {product ? (
            <select className="select" value={line.material} onChange={(event) => onChange({ material: event.target.value })}>
              {product.supportedMaterials.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          ) : (
            <input className="input" value={line.material} onChange={(event) => onChange({ material: event.target.value })} />
          )}
        </label>
        <label className="field-control">
          <span className="field-label">工艺</span>
          {product ? (
            <select className="select" value={line.process} onChange={(event) => onChange({ process: event.target.value })}>
              {product.supportedProcesses.map((process) => (
                <option key={process} value={process}>
                  {process}
                </option>
              ))}
            </select>
          ) : (
            <input className="input" value={line.process} onChange={(event) => onChange({ process: event.target.value })} />
          )}
        </label>
        <label className="field-control">
          <span className="field-label">特殊需求备注</span>
          <input className="input" value={line.specialRequirement} onChange={(event) => onChange({ specialRequirement: event.target.value })} />
        </label>
        <label className="field-control">
          <span className="field-label">印记内容</span>
          <input className="input" value={line.engraveText} onChange={(event) => onChange({ engraveText: event.target.value })} />
        </label>
        {needsEngraving ? (
          <>
            <label className="field-control">
              <span className="field-label">刻字参考图</span>
              <input aria-label="刻字参考图" className="input" type="file" accept="image/*,.pdf" multiple onChange={(event) => handleEngraveImageUpload(event.target.files)} />
              <span className="text-caption">{line.engraveImageFiles.length > 0 ? line.engraveImageFiles.map((file) => file.name).join(' / ') : '未上传'}</span>
            </label>
            <label className="field-control">
              <span className="field-label">刻字 PLT 文件</span>
              <input aria-label="刻字 PLT 文件" className="input" type="file" accept=".plt" multiple onChange={(event) => handleEngravePltUpload(event.target.files)} />
              <span className="text-caption">{line.engravePltFiles.length > 0 ? line.engravePltFiles.map((file) => file.name).join(' / ') : '未上传'}</span>
            </label>
          </>
        ) : null}
        <label className="field-control">
          <span className="field-label">负责人</span>
          <input className="input" value={line.ownerName} onChange={(event) => onChange({ ownerName: event.target.value })} />
        </label>
        <label className="field-control">
          <span className="field-label">承诺交期</span>
          <input className="input" type="date" value={line.promisedDate} onChange={(event) => onChange({ promisedDate: event.target.value })} />
        </label>
        {product ? (
          <div className="field-control">
            <span className="field-label">特殊需求选项</span>
            {product.supportedSpecialOptions.map((option) => (
              <label key={option} className="row" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={line.selectedSpecialOptions.includes(option)}
                  onChange={(event) => onToggleSpecialOption(option, event.target.checked)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        ) : null}
        <div className="field-control">
          <span className="field-label">销售设置</span>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" checked={line.needsDesign} onChange={(event) => onChange({ needsDesign: event.target.checked })} />
            <span>是否需要设计</span>
          </label>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" checked={line.needsModeling} onChange={(event) => onChange({ needsModeling: event.target.checked })} />
            <span>是否需要建模</span>
          </label>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" checked={line.needsWax} onChange={(event) => onChange({ needsWax: event.target.checked })} />
            <span>是否需要出蜡</span>
          </label>
          <label className="row" style={{ gap: 8 }}>
            <input type="checkbox" checked={line.urgent} onChange={(event) => onChange({ urgent: event.target.checked })} />
            <span>是否加急</span>
          </label>
        </div>
      </div>

      <div className="spacer-top">
        <OrderLineDraftQuotePanel product={product} selectedSpec={selectedSpec} quote={quote} />
      </div>
    </div>
  )
}

export const PurchaseDraftOrderLinesSection = ({
  orderLines,
  onAdd,
  onRemove,
  onDuplicate,
  onChange,
  onApplyProduct,
  onSelectSpec,
  onToggleSpecialOption
}: {
  orderLines: OrderLineDraft[]
  onAdd: () => void
  onRemove: (lineId: string) => void
  onDuplicate: (lineId: string) => void
  onChange: (lineId: string, patch: Partial<OrderLineDraft>) => void
  onApplyProduct: (lineId: string, productId: string) => void
  onSelectSpec: (lineId: string, specId: string) => void
  onToggleSpecialOption: (lineId: string, option: string, checked: boolean) => void
}) => {
  const [sourceProductLineId, setSourceProductLineId] = useState('')
  const sourceProductLine = orderLines.find((line) => line.id === sourceProductLineId)
  const sourceProductLineIndex = sourceProductLine ? orderLines.findIndex((line) => line.id === sourceProductLine.id) : -1
  const sourceProduct = sourceProductLine ? getDraftProduct(sourceProductLine) : undefined
  const sourceProductCompareValue =
    sourceProductLine && sourceProductLineIndex >= 0 ? buildDraftSourceProductCompareValue(sourceProductLine) : undefined

  return (
    <>
      <SectionCard
        title="销售区域"
        actions={
          <button type="button" className="button primary small" onClick={onAdd}>
            添加销售
          </button>
        }
      >
        <div className="stack">
          <div className="subtle-panel">
            <strong>本次购买共 {orderLines.length} 条销售</strong>
            <div className="text-caption">每张卡代表一件商品，保存草稿时会拆成独立销售。</div>
          </div>
          {orderLines.map((line, index) => (
            <OrderLineDraftCard
              key={line.id}
              line={line}
              draftIndex={index}
              canRemove={orderLines.length > 1}
              onChange={(patch) => onChange(line.id, patch)}
              onRemove={() => onRemove(line.id)}
              onDuplicate={() => onDuplicate(line.id)}
              onApplyProduct={(productId) => onApplyProduct(line.id, productId)}
              onSelectSpec={(specId) => onSelectSpec(line.id, specId)}
              onToggleSpecialOption={(option, checked) => onToggleSpecialOption(line.id, option, checked)}
              onOpenSourceProduct={() => setSourceProductLineId(line.id)}
            />
          ))}
        </div>
      </SectionCard>
      <SourceProductDrawer
        open={Boolean(sourceProductLineId)}
        product={sourceProduct}
        compareValue={sourceProductCompareValue}
        onClose={() => setSourceProductLineId('')}
      />
    </>
  )
}
