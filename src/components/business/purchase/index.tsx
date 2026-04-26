import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { SourceProductDrawer, type SourceProductCompareValue } from '@/components/business/sourceProduct'
import { EmptyState, InfoField, InfoGrid, RecordTimeline, SectionCard, StatusTag, TimePressureBadge } from '@/components/common'
import { afterSalesMock, logisticsMock } from '@/mocks'
import { mockProducts } from '@/mocks/products'
import {
  getOrderLineFactoryStatus,
  getOrderLineLineStatus,
  getOrderLineLineStatusLabel,
  factoryWorkflowStatusLabelMap
} from '@/services/orderLine/orderLineWorkflow'
import { getCustomerServiceNextLineStatus, getOrderLineCompleteness } from '@/services/orderLine/orderLineCustomerService'
import type { Customer } from '@/types/customer'
import type { OrderLine, OrderLineLineStatus } from '@/types/order-line'
import type { Product, ProductCategory, ProductSpecRow } from '@/types/product'
import type { Purchase } from '@/types/purchase'
import type { QuoteResult } from '@/types/quote'
import type { AfterSalesCase, LogisticsRecord } from '@/types/supporting-records'
import { buildQuoteResult } from '@/utils/quote/buildQuoteResult'

type PurchaseLineRow = {
  line: OrderLine
  purchase: Purchase
}

export type PurchaseDraftFormValue = {
  channel: string
  platformOrderNo: string
  paymentAt: string
  ownerName: string
  remark: string
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

export type OrderLineDraft = {
  id: string
  lineCode: string
  productionTaskNo: string
  skuCode: string
  sourceProductId?: string
  sourceProductCode?: string
  sourceProductName?: string
  sourceProductVersion?: string
  selectedSpecId?: string
  selectedSpecialOptions: string[]
  productName: string
  category: string
  styleName: string
  versionNo: string
  spec: string
  material: string
  process: string
  sizeNote: string
  engraveText: string
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
  commonInfo: Pick<PurchaseDraftFormValue, 'channel' | 'platformOrderNo' | 'paymentAt' | 'ownerName' | 'remark'>
  customerShippingInfo: Pick<
    PurchaseDraftFormValue,
    'customerName' | 'customerPhone' | 'customerWechat' | 'recipientName' | 'recipientPhone' | 'recipientAddress' | 'customerRemark'
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
  tempLineNo: string
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
  | 'styleName'
  | 'versionNo'
  | 'skuCode'
  | 'productionTaskNo'
  | 'spec'
  | 'material'
  | 'process'
  | 'needsDesign'
  | 'needsModeling'
  | 'needsWax'
>

const defaultPurchaseDraft: PurchaseDraftFormValue = {
  channel: 'taobao',
  platformOrderNo: '',
  paymentAt: '',
  ownerName: '客服A',
  remark: '',
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
}

let draftLineSeed = 1

const createOrderLineDraftId = () => `order-line-draft-${draftLineSeed++}`

const createOrderLineDraft = (): OrderLineDraft => ({
  id: createOrderLineDraftId(),
  lineCode: '',
  productionTaskNo: '',
  skuCode: '',
  selectedSpecialOptions: [],
  productName: '',
  category: '',
  styleName: '',
  versionNo: '',
  spec: '',
  material: '',
  process: '',
  sizeNote: '',
  engraveText: '',
  specialRequirement: '',
  needsDesign: true,
  needsModeling: false,
  needsWax: false,
  urgent: false,
  lineStatus: 'draft',
  ownerName: '客服A',
  promisedDate: ''
})

const duplicateOrderLineDraft = (line: OrderLineDraft): OrderLineDraft => ({
  ...line,
  id: createOrderLineDraftId(),
  lineCode: '',
  productionTaskNo: '',
  lineStatus: 'draft'
})

const getTempLineNo = (index: number) => `TEMP-${String(index + 1).padStart(2, '0')}`

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

const getReferableProducts = () => mockProducts.filter((product) => product.isReferable)

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
      styleName: '',
      versionNo: '',
      skuCode: '',
      productionTaskNo: '',
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
    productName: product.shortName || product.name,
    category: getProductCategoryLabel(product.category),
    styleName: product.shortName || product.name,
    versionNo: product.version,
    skuCode: product.code,
    productionTaskNo: product.code,
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
  size: line.spec || line.sizeNote,
  craftRequirements: line.process,
  productionTaskNo: line.productionTaskNo
})

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

const buildDraftSourceProductCompareValue = (line: OrderLineDraft, tempLineNo: string): SourceProductCompareValue => ({
  sourceLabel: `${line.lineCode || tempLineNo} ${line.styleName || line.productName || line.sourceProductName || '未命名商品行'}`,
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
      platformOrderNo: draft.platformOrderNo,
      paymentAt: draft.paymentAt,
      ownerName: draft.ownerName,
      remark: draft.remark
    },
    customerShippingInfo: {
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
    const tempLineNo = line.lineCode.trim() || getTempLineNo(index)
    const skuCode = line.skuCode.trim()

    return {
      ...line,
      lineCode: tempLineNo,
      productionTaskNo: line.productionTaskNo.trim() || skuCode || tempLineNo,
      skuCode: skuCode || line.productionTaskNo.trim() || tempLineNo,
      tempLineNo,
      specParameterSummary: getSpecParameterSummary(getSelectedSpec(line, getDraftProduct(line))),
      quoteResult: buildOrderLineDraftQuote(line)
    }
  })
})

const validatePurchaseDraft = (
  draft: PurchaseDraftFormValue,
  paymentSummary: ReturnType<typeof getPurchaseDraftPaymentSummary>,
  orderLines: OrderLineDraft[]
) => {
  if (!draft.customerName.trim()) {
    return '请填写客户姓名。'
  }

  if (paymentSummary.receivedAmount > paymentSummary.receivableAmount) {
    return '已收金额不能大于应收总额。'
  }

  const missingNameIndex = orderLines.findIndex((line) => !line.productName.trim())
  if (missingNameIndex >= 0) {
    return `商品行 ${getTempLineNo(missingNameIndex)} 需要填写商品名称。`
  }

  const missingSpecIndex = orderLines.findIndex((line) => {
    const product = getDraftProduct(line)
    return Boolean(line.sourceProductId && product?.isSpecRequired && !line.selectedSpecId)
  })
  if (missingSpecIndex >= 0) {
    return `商品行 ${getTempLineNo(missingSpecIndex)} 引用产品时需要选择规格。`
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

const factoryStatusLabelMap: Record<string, string> = {
  not_started: '未开始',
  in_progress: '生产中',
  pending_feedback: '待回传',
  completed: '已完成',
  issue: '异常'
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

const getFactoryStatusLabel = (status?: string) => (status ? factoryStatusLabelMap[status] || factoryWorkflowStatusLabelMap[status as keyof typeof factoryWorkflowStatusLabelMap] || status : '待确认')

const getAfterSalesStatusLabel = (status?: string) => (status ? afterSalesStatusLabelMap[status] || status : '待处理')

const getTimePressure = (promisedDate?: string) => {
  if (!promisedDate) {
    return { label: '待确认交期', variant: 'normal' as const }
  }

  const promised = new Date(`${promisedDate}T23:59:59`)
  const now = new Date()
  const diffDays = Math.ceil((promised.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { label: `已超时 ${Math.abs(diffDays)} 天`, variant: 'overdue' as const }
  }

  if (diffDays <= 3) {
    return { label: `剩余 ${diffDays} 天`, variant: 'dueSoon' as const }
  }

  return { label: `剩余 ${diffDays} 天`, variant: 'normal' as const }
}

const isActiveLogisticsRecord = (record?: LogisticsRecord) => record?.recordStatus !== 'voided'

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && Boolean(target.closest('a, button, input, select, textarea, label'))

const activeAfterSalesStatuses = new Set(['open', 'processing', 'in_progress', 'waiting_return'])

const findCurrentAfterSalesCase = (records: AfterSalesCase[], orderLineId: string) =>
  records.find((item) => item.orderLineId === orderLineId && item.status && activeAfterSalesStatuses.has(item.status)) ||
  records.find((item) => item.orderLineId === orderLineId)

const getParameterSummary = (line: OrderLine) =>
  [
    line.selectedSpecValue ? `规格 ${line.selectedSpecValue}` : null,
    line.selectedMaterial ? `材质 ${line.selectedMaterial}` : line.actualRequirements?.material ? `材质 ${line.actualRequirements.material}` : null,
    line.selectedProcess ? `工艺 ${line.selectedProcess}` : line.actualRequirements?.process ? `工艺 ${line.actualRequirements.process}` : null,
    line.actualRequirements?.sizeNote ? `尺寸 ${line.actualRequirements.sizeNote}` : null
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
  const receivableAmount = purchase.finance?.dealPrice ?? purchase.orderLines.reduce((sum, line) => sum + (line.finalDisplayQuote || line.quote?.systemQuote || 0), 0)
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

export const PurchaseSummarySection = ({ purchase, customer }: { purchase: Purchase; customer?: Customer }) => {
  const paymentSummary = getPaymentSummary(purchase)

  return (
    <SectionCard title="购买记录摘要" description="Purchase 是一次购买的归组对象；OrderLine 才是设计、生产、物流和售后的执行对象。">
      <InfoGrid columns={3}>
        <InfoField label="购买记录编号" value={purchase.purchaseNo} />
        <InfoField label="客户" value={customer?.name || '—'} />
        <InfoField label="渠道" value={purchase.sourceChannel} />
        <InfoField label="平台订单号" value={purchase.platformOrderNo || '—'} />
        <InfoField label="商品行数量" value={`${purchase.orderLines.length} 条`} />
        <InfoField label="聚合状态" value={<StatusTag value={getPurchaseAggregateStatusLabel(purchase.aggregateStatus)} />} />
        <InfoField label="付款摘要" value={`${formatPrice(paymentSummary.receivedAmount)} / ${formatPrice(paymentSummary.receivableAmount)}`} />
        <InfoField label="付款状态" value={<StatusTag value={paymentSummary.paymentStatus} />} />
        <InfoField label="客服负责人" value={purchase.ownerName || '待分配'} />
        <InfoField label="当前整体提示" value="本页只做购买记录归组；每条商品行独立推进执行。" />
      </InfoGrid>
    </SectionCard>
  )
}

export const PurchaseCustomerSection = ({ purchase, customer }: { purchase: Purchase; customer?: Customer }) => (
  <SectionCard title="客户与收货信息">
    <InfoGrid columns={3}>
      <InfoField label="客户姓名" value={customer?.name || '—'} />
      <InfoField label="手机" value={customer?.phone || '—'} />
      <InfoField label="微信" value={customer?.wechat || '—'} />
      <InfoField label="收件人" value={purchase.recipientName || customer?.defaultRecipientName || '—'} />
      <InfoField label="收件手机号" value={purchase.recipientPhone || customer?.defaultRecipientPhone || '—'} />
      <InfoField label="收件地址" value={purchase.recipientAddress || customer?.defaultRecipientAddress || '—'} />
      <InfoField label="客户备注" value={customer?.remark || '—'} />
    </InfoGrid>
  </SectionCard>
)

export const PurchasePaymentSection = ({ purchase }: { purchase: Purchase }) => {
  const summary = getPaymentSummary(purchase)

  return (
    <SectionCard title="付款总览" description="第一版只展示购买记录层面的付款汇总，不展开复杂财务中心。">
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
    title="本次商品行列表"
    description="直接展示本次购买下的所有商品行，避免把多件商品折叠成一条摘要。"
    actions={
      <Link to="/order-lines" className="button secondary small">
        返回商品行中心
      </Link>
    }
  >
    {rows.length > 0 ? (
      <div className="table-shell">
        <table className="table">
          <thead>
            <tr>
              <th>商品行编号</th>
              <th>商品名称</th>
              <th>状态</th>
              <th>当前负责人</th>
              <th>承诺交期</th>
              <th>参数摘要</th>
              <th>报价摘要</th>
              <th>物流状态</th>
              <th>售后状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ line, purchase }) => {
              const logisticsRecord = logisticsRecords.find((item) => item.orderLineId === line.id && isActiveLogisticsRecord(item))
              const afterSalesCase = findCurrentAfterSalesCase(afterSalesCases, line.id)
              const pressure = getTimePressure(line.promisedDate || purchase.promisedDate)
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
                    <div>{line.lineCode || line.id}</div>
                    <div className="text-caption">生产任务 {line.productionTaskNo || line.skuCode || line.itemSku || '待生成'}</div>
                  </td>
                  <td>
                    <div>{line.name}</div>
                    <div className="text-caption">{line.styleName || line.sourceProduct?.sourceProductName || '非模板定制'} · {line.versionNo || line.sourceProduct?.sourceProductVersion || '无版本'}</div>
                  </td>
                  <td>
                    <StatusTag value={getOrderLineStatusLabel(getOrderLineLineStatus(line))} />
                    <div className="text-caption">工厂 {getFactoryStatusLabel(getOrderLineFactoryStatus(line))}</div>
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
                    <div className="text-caption">{line.sourceProduct?.sourceProductName || '手动填写'}</div>
                  </td>
                  <td>
                    <div>{formatPrice(line.finalDisplayQuote || line.quote?.systemQuote)}</div>
                    <div className="text-caption">系统参考 {formatPrice(line.quote?.systemQuote)}</div>
                  </td>
                  <td>
                    <StatusTag value={logisticsRecord ? `物流 ${logisticsRecord.trackingNo || '已创建'}` : '无物流'} />
                  </td>
                  <td>
                    <StatusTag value={afterSalesCase ? `售后 ${getAfterSalesStatusLabel(afterSalesCase.status)}` : '无售后'} />
                  </td>
                  <td>
                    <button type="button" className="button ghost small" onClick={() => onOpenOrderLine(row)}>
                      查看商品行
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyState title="暂无商品行" description="当前购买记录还没有关联商品行。" />
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
  const [purchaseDraft, setPurchaseDraft] = useState<PurchaseDraftFormValue>(defaultPurchaseDraft)
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
      setErrorMessage('至少需要保留 1 条商品行。')
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
      setErrorMessage('至少需要保留 1 条商品行。')
      setSuccessMessage('')
      return
    }

    const validationError = validatePurchaseDraft(purchaseDraft, paymentSummary, orderLineDrafts)
    if (validationError) {
      setErrorMessage(validationError)
      setSuccessMessage('')
      return
    }

    const payload = buildDraftPayload(purchaseDraft, paymentSummary, orderLineDrafts)
    console.log('purchaseDraft', payload.purchaseDraft)
    console.log('orderLineDrafts', payload.orderLineDrafts)
    setSuccessMessage(`已生成购买记录草稿：1 笔购买记录 + ${orderLineDrafts.length} 条商品行`)
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
        <span className="field-label">客户姓名（必填）</span>
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
    return <div className="text-caption">未引用产品时保留手动填写，暂不生成系统参考报价。</div>
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

export const OrderLineDraftCard = ({
  line,
  tempLineNo,
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
  tempLineNo: string
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
  const nextConfirmStatus = getCustomerServiceNextLineStatus({
    requiresDesign: line.needsDesign,
    requiresModeling: line.needsModeling
  })
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
          <strong>商品行 {line.lineCode || tempLineNo}</strong>
          <StatusTag value={getOrderLineLineStatusLabel(line.lineStatus)} />
          <StatusTag value={completeness.complete ? '资料完整' : '资料缺失'} />
        </div>
        <div className="row wrap">
          <button type="button" className="button secondary small" onClick={handleCustomerConfirm} disabled={!completeness.complete}>
            标记客服确认完成
          </button>
          <button type="button" className="button ghost small" onClick={onDuplicate}>
            复制商品行
          </button>
          <button type="button" className="button ghost small" onClick={onRemove} disabled={!canRemove}>
            删除商品行
          </button>
        </div>
      </div>
      <div className="text-caption">
        资料完整度 {completeness.completed}/{completeness.total} · {completeness.summary}
        {completeness.complete ? ` · 确认后进入「${getOrderLineLineStatusLabel(nextConfirmStatus)}」` : ''}
      </div>
      <div className="field-grid three">
        <label className="field-control">
          <span className="field-label">引用产品</span>
          <select className="select" value={line.sourceProductId || ''} onChange={(event) => onApplyProduct(event.target.value)}>
            <option value="">不引用产品，手动填写</option>
            {referableProducts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-control">
          <span className="field-label">商品行编号</span>
          <input className="input" value={line.lineCode} onChange={(event) => onChange({ lineCode: event.target.value })} placeholder={tempLineNo} />
        </label>
        <label className="field-control">
          <span className="field-label">生产任务编号</span>
          <input className="input" value={line.productionTaskNo} onChange={(event) => onChange({ productionTaskNo: event.target.value })} placeholder="默认同商品行编号 / 货号" />
        </label>
        <label className="field-control">
          <span className="field-label">商品名称（必填）</span>
          <input aria-label="商品名称" className="input" value={line.productName} onChange={(event) => onChange({ productName: event.target.value })} />
        </label>
        <label className="field-control">
          <span className="field-label">品类</span>
          <input className="input" value={line.category} onChange={(event) => onChange({ category: event.target.value })} />
        </label>
        <label className="field-control">
          <span className="field-label">款式名称</span>
          <input className="input" value={line.styleName} onChange={(event) => onChange({ styleName: event.target.value })} />
        </label>
        <label className="field-control">
          <span className="field-label">版本号</span>
          <input className="input" value={line.versionNo} onChange={(event) => onChange({ versionNo: event.target.value })} />
        </label>
        <label className="field-control">
          <span className="field-label">货号 / SKU</span>
          <input className="input" value={line.skuCode} onChange={(event) => onChange({ skuCode: event.target.value })} />
        </label>
      </div>

      {product ? (
        <div className="row wrap spacer-top" style={{ justifyContent: 'space-between' }}>
          <div className="text-caption">
            来源产品：{product.name} · {product.code} · {product.version}
          </div>
          <button type="button" className="button ghost small" onClick={onOpenSourceProduct}>
            查看来源产品
          </button>
        </div>
      ) : null}

      <div className="field-grid three spacer-top">
        <label className="field-control">
          <span className="field-label">规格{product?.isSpecRequired ? '（必选）' : ''}</span>
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
          <span className="field-label">尺寸备注</span>
          <input className="input" value={line.sizeNote} onChange={(event) => onChange({ sizeNote: event.target.value })} />
        </label>
        <label className="field-control">
          <span className="field-label">印记内容</span>
          <input className="input" value={line.engraveText} onChange={(event) => onChange({ engraveText: event.target.value })} />
        </label>
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
          <span className="field-label">商品行设置</span>
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
    sourceProductLine && sourceProductLineIndex >= 0 ? buildDraftSourceProductCompareValue(sourceProductLine, getTempLineNo(sourceProductLineIndex)) : undefined

  return (
    <>
      <SectionCard
        title="商品行区域"
        actions={
          <button type="button" className="button primary small" onClick={onAdd}>
            添加商品行
          </button>
        }
      >
        <div className="stack">
          <div className="subtle-panel">
            <strong>本次购买共 {orderLines.length} 条商品行</strong>
            <div className="text-caption">每张卡代表一件商品，保存草稿时会拆成独立商品行。</div>
          </div>
          {orderLines.map((line, index) => (
            <OrderLineDraftCard
              key={line.id}
              line={line}
              tempLineNo={getTempLineNo(index)}
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
