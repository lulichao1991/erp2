import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { SourceProductDrawer, type SourceProductCompareValue } from '@/components/business/sourceProduct'
import { CopyableText, EmptyState, InfoField, InfoGrid, RecordTimeline, SectionCard, StatusTag, TimePressureBadge } from '@/components/common'
import { afterSalesMock, logisticsMock } from '@/mocks'
import { mockProducts } from '@/mocks/products'
import {
  getOrderLineLineStatus,
  getOrderLineLineStatusLabel
} from '@/services/orderLine/orderLineWorkflow'
import { getCustomerServiceNextLineStatus, getOrderLineCompleteness, hasEngravingRequirement } from '@/services/orderLine/orderLineCustomerService'
import { generateGoodsNumber } from '@/services/orderLine/goodsNumber'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { getProductionDelayStatus } from '@/services/orderLine/orderLineRiskSelectors'
import { getReferableProducts } from '@/services/product/productQueries'
import type { Customer } from '@/types/customer'
import type { OrderLine, OrderLineLineStatus, OrderLineUploadedFile } from '@/types/order-line'
import type { Product, ProductCategory, ProductSpecRow } from '@/types/product'
import type { Purchase } from '@/types/purchase'
import type { QuoteResult } from '@/types/quote'
import type { AfterSalesCase, LogisticsRecord } from '@/types/supporting-records'
import { buildQuoteResult } from '@/utils/quote/buildQuoteResult'

type PurchaseLineRow = {
  line: OrderLine
  purchase: Purchase
}

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
  lineStatus: OrderLineLineStatus | string
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
): {
  purchaseDraft: PurchaseDraftPayload
  orderLineDrafts: OrderLineDraftPayload[]
} => ({
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

const afterSalesStatusLabelMap: Record<string, string> = {
  open: '待处理',
  processing: '处理中',
  in_progress: '处理中',
  waiting_return: '待寄回',
  resolved: '已解决',
  closed: '已关闭'
}

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')

const getPurchaseAggregateStatusLabel = (status?: string) => (status ? purchaseAggregateStatusLabelMap[status] || status : '待确认')

const getOrderLineStatusLabel = getOrderLineLineStatusLabel

const getAfterSalesStatusLabel = (status?: string) => (status ? afterSalesStatusLabelMap[status] || status : '待处理')

const getOrderLineDealPrice = (line: OrderLine) => line.lineSalesAmount ?? line.quote?.systemQuote

const getOrderLinePaidAmount = (line: OrderLine) => {
  const depositAmount = line.allocatedDepositAmount ?? 0
  const finalPaymentAmount = line.financeStatus === 'confirmed' || line.financeLocked ? line.allocatedFinalPaymentAmount ?? 0 : 0
  const paidAmount = depositAmount + finalPaymentAmount

  return paidAmount > 0 ? paidAmount : undefined
}

const getTimePressure = (line: OrderLine, promisedDate?: string) => getProductionDelayStatus(line, new Date(), promisedDate, { respectCompleted: false })

const isActiveLogisticsRecord = (record?: LogisticsRecord) => record?.recordStatus !== 'voided'

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && Boolean(target.closest('a, button, input, select, textarea, label'))

const activeAfterSalesStatuses = new Set(['open', 'processing', 'in_progress', 'waiting_return'])

const findCurrentAfterSalesCase = (records: AfterSalesCase[], orderLineId: string) =>
  records.find((item) => item.orderLineId === orderLineId && item.status && activeAfterSalesStatuses.has(item.status)) ||
  records.find((item) => item.orderLineId === orderLineId)

const getParameterSummary = (line: OrderLine) =>
  [
    line.selectedSpecValue || null,
    line.selectedMaterial || line.actualRequirements?.material || null,
    line.selectedProcess || line.actualRequirements?.process || null,
    line.actualRequirements?.remark || null
  ]
    .filter(Boolean)
    .join(' / ') || '待补充参数'

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

export const PurchaseOrderLineTable = ({
  rows,
  onOpenOrderLine,
  logisticsRecords = logisticsMock,
  afterSalesCases = afterSalesMock
}: {
  rows: PurchaseLineRow[]
  onOpenOrderLine: (row: PurchaseLineRow) => void
  logisticsRecords?: LogisticsRecord[]
  afterSalesCases?: AfterSalesCase[]
}) => (
  <SectionCard
    title="本次销售列表"
    actions={
      <Link to="/order-lines" className="button secondary small">
        返回销售中心
      </Link>
    }
  >
    {rows.length > 0 ? (
      <div className="table-shell">
        <table className="table">
          <thead>
            <tr>
              <th>货号 / 款式</th>
              <th>状态</th>
              <th>当前负责人</th>
              <th>承诺交期</th>
              <th>参数摘要</th>
              <th>实付款 / 成交价</th>
              <th>物流状态</th>
              <th>售后状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ line, purchase }) => {
              const logisticsRecord = logisticsRecords.find((item) => item.orderLineId === line.id && isActiveLogisticsRecord(item))
              const afterSalesCase = findCurrentAfterSalesCase(afterSalesCases, line.id)
              const pressure = getTimePressure(line, line.promisedDate || purchase.promisedDate)
              const goodsNo = getOrderLineGoodsNo(line)
              const versionLabel = line.versionNo || line.sourceProduct?.sourceProductVersion
              const paidAmount = getOrderLinePaidAmount(line)
              const dealPrice = getOrderLineDealPrice(line)
              const row = { line, purchase }
              const handleRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
                if (isInteractiveTarget(event.target)) {
                  return
                }
                onOpenOrderLine(row)
              }
              const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
                if (isInteractiveTarget(event.target)) {
                  return
                }
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onOpenOrderLine(row)
                }
              }

              return (
                <tr key={line.id} role="button" tabIndex={0} onClick={handleRowClick} onKeyDown={handleRowKeyDown}>
                  <td>
                    <div className="stack order-line-goods-no-cell">
                      <strong>{goodsNo}</strong>
                      <span>{line.name}</span>
                      {versionLabel ? <span className="text-caption">{versionLabel}</span> : null}
                    </div>
                  </td>
                  <td>
                    <StatusTag value={getOrderLineStatusLabel(getOrderLineLineStatus(line))} />
                  </td>
                  <td>{line.currentOwner || purchase.ownerName || '待分配'}</td>
                  <td>
                    <div>{line.promisedDate || purchase.promisedDate || '—'}</div>
                    <div className="spacer-top">
                      <TimePressureBadge label={pressure.label} variant={pressure.variant} />
                    </div>
                  </td>
                  <td>
                    <div>{getParameterSummary(line)}</div>
                  </td>
                  <td>
                    <div className="order-line-price-stack">
                      <div className="order-line-price-paid">
                        <span className="text-caption">实付</span>
                        <strong>{formatPrice(paidAmount)}</strong>
                      </div>
                      <div className="order-line-price-deal">
                        <span className="text-caption">成交价</span>
                        <span>{formatPrice(dealPrice)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusTag value={logisticsRecord ? `物流 ${logisticsRecord.trackingNo || '已创建'}` : '无物流'} />
                  </td>
                  <td>
                    <StatusTag value={afterSalesCase ? `售后 ${getAfterSalesStatusLabel(afterSalesCase.status)}` : '无售后'} />
                  </td>
                  <td>
                    <button type="button" className="button ghost small" onClick={() => onOpenOrderLine(row)}>
                      查看销售
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyState title="暂无销售" description="当前购买记录还没有关联销售。" />
    )}
  </SectionCard>
)

export const PurchaseNotesTimelineSection = ({ purchase }: { purchase: Purchase }) => (
  <SectionCard title="备注与日志">
    <div className="stack">
      <InfoGrid columns={2}>
        <InfoField label="购买备注" value={purchase.remark || '—'} />
        <InfoField label="最新动态时间" value={purchase.latestActivityAt || '—'} />
      </InfoGrid>
      <RecordTimeline
        items={purchase.timeline.map((item) => ({
          id: item.id,
          title: item.title,
          meta: item.createdAt,
          description: item.description || '—'
        }))}
      />
    </div>
  </SectionCard>
)

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

  const saveDraft = () => {
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
    console.log('purchaseDraft', payload.purchaseDraft)
    console.log('orderLineDrafts', payload.orderLineDrafts)
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
  const referableProducts = getReferableProducts()
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
        <label className="field-control">
          <span className="field-label">引用款式</span>
          <select className="select" value={line.sourceProductId || ''} onChange={(event) => onApplyProduct(event.target.value)}>
            <option value="">不引用款式，手动填写</option>
            {referableProducts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
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
