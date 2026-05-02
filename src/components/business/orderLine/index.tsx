import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { SourceProductDrawer, type SourceProductCompareValue } from '@/components/business/sourceProduct'
import { CopyableText, EmptyState, InfoField, LargeModal, RiskTag, SideDrawer, StatusTag, TimePressureBadge } from '@/components/common'
import { afterSalesMock, customersMock, logisticsMock } from '@/mocks'
import { mockProducts } from '@/mocks/products'
import {
  getOrderLineFactoryStatus,
  getOrderLineFinanceStatus,
  getOrderLineLineStatus,
  getOrderLineLineStatusLabel,
  getOrderLineProductionStatus,
  productionWorkflowStatusLabelMap
} from '@/services/orderLine/orderLineWorkflow'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { getOrderLineRisks, getProductionDelayStatus } from '@/services/orderLine/orderLineRiskSelectors'
import { type OrderLineRow } from '@/services/orderLine/orderLineWorkspace'
import {
  activeAfterSalesStatuses,
  categoryLabelMap,
  getAfterSalesStatusLabel
} from '@/components/business/orderLine/orderLineOptions'
import {
  OrderLineDetailsSection,
  type OrderLineDetailsUpdateHandler
} from '@/components/business/orderLine/orderLineDetails'
import {
  OrderLineDesignModelingSection,
  type OrderLineDesignModelingUpdateHandler
} from '@/components/business/orderLine/orderLineDesignModeling'
import {
  OrderLineOutsourceSection,
  type OrderLineOutsourceUpdateHandler
} from '@/components/business/orderLine/orderLineOutsource'
import {
  OrderLineProductionSection,
  type OrderLineProductionUpdateHandler
} from '@/components/business/orderLine/orderLineProduction'
import {
  OrderLineLogisticsCreateForm,
  OrderLineLogisticsRecordItem,
  type OrderLineLogisticsCreateHandler,
  type OrderLineLogisticsUpdateHandler,
  type OrderLineLogisticsVoidHandler
} from '@/components/business/orderLine/orderLineLogistics'
import {
  OrderLineAfterSalesCreateForm,
  OrderLineAfterSalesRecordItem,
  type OrderLineAfterSalesCloseHandler,
  type OrderLineAfterSalesCreateHandler,
  type OrderLineAfterSalesUpdateHandler
} from '@/components/business/orderLine/orderLineAfterSales'
import { DetailSection } from '@/components/business/orderLine/orderLineDetailSection'
import {
  OrderLineLogSection,
  OrderLineStatusUpdatePanel,
  type OrderLineStatusUpdateHandler
} from '@/components/business/orderLine/orderLineStatusLog'
import type {
  OrderLine,
  OrderLineFinanceStatus,
  OrderLineLineStatus,
  OrderLineLog
} from '@/types/order-line'
import type { Product } from '@/types/product'
import type { Customer } from '@/types/customer'
import type { Purchase } from '@/types/purchase'
import type { AfterSalesCase, LogisticsRecord } from '@/types/supporting-records'

export type { OrderLineCenterFilters, OrderLineRow } from '@/services/orderLine/orderLineWorkspace'
export { OrderLineFilterBar } from '@/components/business/orderLine/orderLineFilter'

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')

const getOrderLineDealPrice = (line: OrderLine) => line.lineSalesAmount ?? line.quote?.systemQuote

const getOrderLinePaidAmount = (line: OrderLine) => {
  const depositAmount = line.allocatedDepositAmount ?? 0
  const finalPaymentAmount = getOrderLineFinanceStatus(line) === 'confirmed' || line.financeLocked ? line.allocatedFinalPaymentAmount ?? 0 : 0
  const paidAmount = depositAmount + finalPaymentAmount

  return paidAmount > 0 ? paidAmount : undefined
}

const getStatusLabel = getOrderLineLineStatusLabel

const isActiveLogisticsRecord = (record?: LogisticsRecord) => record?.recordStatus !== 'voided'
const findCurrentLogisticsRecord = (records: LogisticsRecord[], orderLineId: string) => records.find((item) => item.orderLineId === orderLineId && isActiveLogisticsRecord(item))

const isActiveAfterSalesCase = (record?: AfterSalesCase) => Boolean(record?.status && activeAfterSalesStatuses.has(record.status))

const findCurrentAfterSalesCase = (records: AfterSalesCase[], orderLineId: string) =>
  records.find((item) => item.orderLineId === orderLineId && isActiveAfterSalesCase(item)) || records.find((item) => item.orderLineId === orderLineId)

const getTimePressure = (line: OrderLine, promisedDate?: string) => getProductionDelayStatus(line, new Date(), promisedDate, { respectCompleted: false })

const getParameterSummary = (line: OrderLine) => {
  const spec = line.selectedSpecValue?.trim()
  const specialRemark = line.actualRequirements?.remark?.trim()

  return (
    [
      spec || null,
      line.selectedMaterial || line.actualRequirements?.material || null,
      line.selectedProcess || line.actualRequirements?.process || null,
      specialRemark || null
    ]
      .filter(Boolean)
      .join(' / ') || '待补充参数'
  )
}

const getOrderLineRegisteredAt = (lineLogs: OrderLineLog[], purchase?: Purchase) =>
  lineLogs.find((log) => log.actionType === 'created')?.createdAt ||
  purchase?.timeline.find((item) => item.type === 'purchase_created')?.createdAt ||
  purchase?.paymentAt ||
  '—'

const orderLineFinanceSummaryLabelMap: Record<OrderLineFinanceStatus, string> = {
  not_required: '暂未进入核算',
  pending: '待财务核算',
  confirmed: '财务已核算',
  abnormal: '财务异常'
}

const getFactorySummary = (line: OrderLine) =>
  line.outsourceInfo?.supplierName && line.outsourceInfo.supplierName !== '待定' ? line.outsourceInfo.supplierName : '待确认工厂'

const getLineRiskLabels = (line: OrderLine, afterSalesCases: AfterSalesCase[] = afterSalesMock) => {
  return getOrderLineRisks(line, { afterSalesCases, dueDate: line.promisedDate }).map((risk) => risk.label)
}

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && Boolean(target.closest('a, button, input, select, textarea, label'))

const getOrderLineDisplayName = (line: OrderLine) => line.name || '未命名款式'

const buildOrderLineSourceProductCompareValue = (line: OrderLine): SourceProductCompareValue => ({
  sourceLabel: `${getOrderLineGoodsNo(line)} ${getOrderLineDisplayName(line)}`,
  specValue: line.selectedSpecValue || line.sourceProduct?.sourceSpecValue,
  material: line.selectedMaterial || line.actualRequirements?.material,
  process: line.selectedProcess || line.actualRequirements?.process,
  specialOptions: line.selectedSpecialOptions
})

export const OrderLineQuickStats = ({ rows, afterSalesCases = afterSalesMock }: { rows: OrderLineRow[]; afterSalesCases?: AfterSalesCase[] }) => {
  const stats = [
    { label: '全部销售', value: rows.length },
    { label: '待客服确认', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'pending_customer_confirmation').length },
    { label: '待设计', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'pending_design').length },
    { label: '待建模', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'pending_modeling').length },
    { label: '待跟单审核', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'pending_merchandiser_review').length },
    { label: '生产中', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'in_production').length },
    { label: '待财务确认', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'pending_finance_confirmation').length },
    { label: '售后中', value: rows.filter(({ line }) => getOrderLineLineStatus(line) === 'after_sales' || afterSalesCases.some((item) => item.orderLineId === line.id && isActiveAfterSalesCase(item))).length },
    { label: '已超时', value: rows.filter(({ line }) => getTimePressure(line, line.promisedDate).overdue).length }
  ]

  return (
    <div className="stats-grid compact-stats">
      {stats.map((item) => (
        <div key={item.label} className="stat-card compact-stat">
          <div className="stat-card-label">{item.label}</div>
          <div className="stat-card-value">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

export const OrderLineTable = ({
  rows,
  onOpenDetail,
  logisticsRecords = logisticsMock,
  afterSalesCases = afterSalesMock
}: {
  rows: OrderLineRow[]
  onOpenDetail?: (row: OrderLineRow) => void
  logisticsRecords?: LogisticsRecord[]
  afterSalesCases?: AfterSalesCase[]
}) => {
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; alt: string } | null>(null)

  return (
    <>
      <div className="table-shell">
        <table className="table order-line-table">
          <thead>
            <tr>
              <th>风险</th>
              <th>货号</th>
              <th>款式</th>
              <th>客户</th>
              <th>参数摘要</th>
              <th>状态</th>
              <th>负责人</th>
              <th>承诺交期</th>
              <th>价格</th>
              <th>物流 / 售后</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <EmptyState title="暂无匹配销售" description="当前筛选条件下没有销售，请放宽筛选或切回全部销售。" />
                </td>
              </tr>
            ) : null}
            {rows.map(({ line, purchase }) => {
          const row = { line, purchase }
          const customer = customersMock.find((item) => item.id === line.customerId || item.id === purchase?.customerId)
          const product = mockProducts.find((item) => item.id === line.productId || item.id === line.sourceProduct?.sourceProductId)
          const coverImage = product?.coverImage
          const versionLabel = line.versionNo || line.sourceProduct?.sourceProductVersion || '无版本'
          const styleLabel = getOrderLineDisplayName(line)
          const goodsNo = getOrderLineGoodsNo(line)
          const logistics = findCurrentLogisticsRecord(logisticsRecords, line.id)
          const afterSales = findCurrentAfterSalesCase(afterSalesCases, line.id)
          const pressure = getTimePressure(line, line.promisedDate)
          const riskLabels = getLineRiskLabels(line, afterSalesCases)
          const paidAmount = getOrderLinePaidAmount(line)
          const dealPrice = getOrderLineDealPrice(line)
          const handleRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
            if (!onOpenDetail || isInteractiveTarget(event.target)) {
              return
            }
            onOpenDetail(row)
          }
          const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
            if (!onOpenDetail || isInteractiveTarget(event.target)) {
              return
            }
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onOpenDetail(row)
            }
          }

          return (
            <tr key={line.id} role={onOpenDetail ? 'button' : undefined} tabIndex={onOpenDetail ? 0 : undefined} onClick={handleRowClick} onKeyDown={handleRowKeyDown}>
              <td>
                {riskLabels.length > 0 ? (
                  <div className="row wrap">
                    {riskLabels.map((label) => (
                      <RiskTag key={label} value={label} />
                    ))}
                  </div>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td>
                <div className="stack order-line-goods-no-cell">
                  <strong>
                    <CopyableText value={goodsNo} label="货号">
                      {goodsNo}
                    </CopyableText>
                  </strong>
                  <span>{styleLabel}</span>
                  <span className="text-caption">{versionLabel}</span>
                </div>
              </td>
              <td>
                <div className="order-line-product-preview compact">
                  {coverImage ? (
                    <button
                      type="button"
                      className="order-line-product-preview-button"
                      aria-label={`查看${styleLabel}缩略图`}
                      onClick={() => setPreviewImage({ src: coverImage, title: `${styleLabel} · ${goodsNo}`, alt: `${styleLabel}缩略图` })}
                    >
                      <img className="order-line-product-thumb" src={coverImage} alt={`${styleLabel}缩略图`} />
                    </button>
                  ) : (
                    <span className="order-line-product-thumb-placeholder" aria-hidden="true">
                      {styleLabel.slice(0, 1) || '款'}
                    </span>
                  )}
                </div>
              </td>
              <td>
                <div>
                  <CopyableText value={customer?.name} label="客户姓名">
                    {customer?.name || '—'}
                  </CopyableText>
                </div>
                <div className="text-caption">
                  <CopyableText value={customer?.id || line.customerId || purchase?.customerId} label="客户 ID">
                    {customer?.id || line.customerId || purchase?.customerId || '—'}
                  </CopyableText>
                </div>
              </td>
              <td>
                <div className="stack" style={{ gap: 4 }}>
                  <span>{getParameterSummary(line)}</span>
                </div>
              </td>
              <td>
                <StatusTag value={getStatusLabel(getOrderLineLineStatus(line))} />
              </td>
              <td>
                <div>
                  <span className="text-caption">客服：</span>
                  <span>{purchase?.ownerName || '待分配'}</span>
                </div>
                <div>
                  <span className="text-caption">当前：</span>
                  <span>{line.currentOwner || purchase?.ownerName || '待分配'}</span>
                </div>
                {getOrderLineLineStatus(line) === 'pending_factory_production' ||
                getOrderLineLineStatus(line) === 'in_production' ||
                getOrderLineLineStatus(line) === 'factory_returned' ||
                getOrderLineProductionStatus(line) === 'in_production' ||
                getOrderLineFactoryStatus(line) !== 'not_assigned' ? (
                  <div className="text-caption">{getFactorySummary(line)}</div>
                ) : null}
              </td>
              <td>
                <div>{line.promisedDate || purchase?.promisedDate || '—'}</div>
                <div className="spacer-top">
                  <TimePressureBadge label={pressure.label} variant={pressure.variant} />
                </div>
              </td>
              <td>
                <div className="order-line-price-stack">
                  <div className="order-line-price-paid">
                    <span className="text-caption">已付</span>
                    <strong>{formatPrice(paidAmount)}</strong>
                  </div>
                  <div className="order-line-price-deal">
                    <span className="text-caption">成交</span>
                    <span>{formatPrice(dealPrice)}</span>
                  </div>
                </div>
              </td>
              <td>
                <div className="stack" style={{ gap: 4 }}>
                  <StatusTag value={logistics ? '物流已创建' : '未发货'} />
                  <span className="text-caption">{afterSales ? `售后 ${getAfterSalesStatusLabel(afterSales.status)}` : '无售后'}</span>
                </div>
              </td>
              <td>
                <button type="button" className="button ghost small" onClick={() => onOpenDetail?.(row)}>
                  查看
                </button>
              </td>
            </tr>
          )
            })}
          </tbody>
        </table>
      </div>
      <LargeModal open={Boolean(previewImage)} title={previewImage?.title || '款式预览'} onClose={() => setPreviewImage(null)}>
        {previewImage ? (
          <div className="order-line-image-preview-modal">
            <img src={previewImage.src} alt={previewImage.alt} />
          </div>
        ) : null}
      </LargeModal>
    </>
  )
}

export const OrderLineDetailDrawer = ({
  open,
  row,
  onClose,
  onStatusChange,
  logs = [],
  logisticsRecords = logisticsMock,
  afterSalesCases = afterSalesMock,
  customers = customersMock,
  products = mockProducts,
  onUpdateLineDetails,
  onUpdateDesignModeling,
  onUpdateOutsourceInfo,
  onAddLogistics,
  onAddAfterSales,
  onUpdateProductionInfo,
  onUpdateLogistics,
  onVoidLogistics,
  onUpdateAfterSales,
  onCloseAfterSales
}: {
  open: boolean
  row?: OrderLineRow
  onClose: () => void
  onStatusChange?: OrderLineStatusUpdateHandler
  onUpdateLineDetails?: OrderLineDetailsUpdateHandler
  onUpdateOutsourceInfo?: OrderLineOutsourceUpdateHandler
  onUpdateProductionInfo?: OrderLineProductionUpdateHandler
  logs?: OrderLineLog[]
  logisticsRecords?: LogisticsRecord[]
  afterSalesCases?: AfterSalesCase[]
  customers?: Customer[]
  products?: Product[]
  onAddLogistics?: OrderLineLogisticsCreateHandler
  onAddAfterSales?: OrderLineAfterSalesCreateHandler
  onUpdateLogistics?: OrderLineLogisticsUpdateHandler
  onVoidLogistics?: OrderLineLogisticsVoidHandler
  onUpdateAfterSales?: OrderLineAfterSalesUpdateHandler
  onCloseAfterSales?: OrderLineAfterSalesCloseHandler
  onUpdateDesignModeling?: OrderLineDesignModelingUpdateHandler
}) => {
  const [sourceProductOpen, setSourceProductOpen] = useState(false)
  const [logisticsFormOpen, setLogisticsFormOpen] = useState(false)
  const [afterSalesFormOpen, setAfterSalesFormOpen] = useState(false)
  const line = row?.line
  const purchase = row?.purchase
  const customer = customers.find((item) => item.id === line?.customerId || item.id === purchase?.customerId)
  const lineLogisticsRecords = line ? logisticsRecords.filter((item) => item.orderLineId === line.id) : []
  const lineAfterSalesCases = line ? afterSalesCases.filter((item) => item.orderLineId === line.id) : []
  const riskLabels = line ? getLineRiskLabels(line, afterSalesCases) : []
  const lineLogs = line ? logs.filter((log) => log.orderLineId === line.id) : []
  const sourceProduct = line ? products.find((product) => product.id === line.sourceProduct?.sourceProductId || product.id === line.productId) : undefined
  const sourceProductCompareValue = line ? buildOrderLineSourceProductCompareValue(line) : undefined
  const listPrice = line?.quote?.systemQuote ?? line?.lineSalesAmount
  const dealPrice = line?.lineSalesAmount ?? line?.quote?.systemQuote
  const depositAmount = line?.allocatedDepositAmount
  const finalPaymentAmount =
    line?.allocatedFinalPaymentAmount ??
    (typeof dealPrice === 'number' && typeof depositAmount === 'number' ? Math.max(dealPrice - depositAmount, 0) : undefined)
  useEffect(() => {
    setLogisticsFormOpen(false)
    setAfterSalesFormOpen(false)
  }, [line?.id])
  const handleClose = () => {
    setSourceProductOpen(false)
    setLogisticsFormOpen(false)
    setAfterSalesFormOpen(false)
    onClose()
  }

  return (
    <SideDrawer
      open={open}
      title={
        <div className="order-line-drawer-title">
          <h2 className="section-card-title">销售详情</h2>
          {purchase ? (
            <div className="order-line-drawer-purchase-entry" aria-label="购买记录入口">
              <span className="text-caption">{purchase.purchaseNo}</span>
              <Link to={`/purchases/${purchase.id}`} className="button secondary small">
                打开购买记录
              </Link>
            </div>
          ) : null}
        </div>
      }
      onClose={handleClose}
    >
      {!line ? (
        <EmptyState title="未选择销售" description="请选择一条销售查看详情。" />
      ) : (
        <div className="stack order-line-detail-stack">
          <DetailSection title="顶部摘要">
            <div className="info-grid order-line-top-summary-grid">
              <InfoField label="货号" value={<CopyableText value={getOrderLineGoodsNo(line, '')} label="货号" />} />
              <InfoField label="款式名称" value={getOrderLineDisplayName(line)} />
              <InfoField label="客服负责人" value={purchase?.ownerName || '待分配'} />
              <InfoField label="当前负责人" value={line.currentOwner || purchase?.ownerName || '待分配'} />
              <InfoField label="客户姓名" value={<CopyableText value={customer?.name} label="客户姓名" />} />
              <InfoField label="客户 ID" value={<CopyableText value={customer?.id || line.customerId || purchase?.customerId} label="客户 ID" />} />
              <InfoField label="客户付款时间" value={purchase?.paymentAt || '—'} />
              <InfoField label="登记时间" value={getOrderLineRegisteredAt(lineLogs, purchase)} />
              <InfoField label="承诺交期" value={line.promisedDate || purchase?.promisedDate || '—'} />
              <InfoField label="生产状态" value={productionWorkflowStatusLabelMap[getOrderLineProductionStatus(line)]} />
              <InfoField
                label="风险标签"
                value={
                  riskLabels.length > 0 ? (
                    <div className="row wrap">
                      {riskLabels.map((label) => (
                        <RiskTag key={label} value={label} />
                      ))}
                    </div>
                  ) : (
                    '—'
                  )
                }
              />
            </div>
          </DetailSection>

          <DetailSection title="价格与财务">
            <div className="info-grid order-line-drawer-grid">
              <InfoField label="系统参考报价" value={formatPrice(line.quote?.systemQuote)} />
              <InfoField label="标价" value={formatPrice(listPrice)} />
              <InfoField label="成交价" value={formatPrice(dealPrice)} />
              <InfoField label="定金" value={formatPrice(depositAmount)} />
              <InfoField label="尾款" value={formatPrice(finalPaymentAmount)} />
              <InfoField label="财务核算状态" value={orderLineFinanceSummaryLabelMap[getOrderLineFinanceStatus(line)]} />
              <InfoField label="财务备注" value={line.financeNote || '—'} />
            </div>
          </DetailSection>

          <OrderLineStatusUpdatePanel line={line} onStatusChange={onStatusChange} />
          <OrderLineLogSection logs={lineLogs} />
          <OrderLineDetailsSection line={line} onUpdateLineDetails={onUpdateLineDetails} onOpenSourceProduct={sourceProduct ? () => setSourceProductOpen(true) : undefined} />

          <OrderLineDesignModelingSection line={line} onUpdateDesignModeling={onUpdateDesignModeling} />

          <OrderLineOutsourceSection line={line} onUpdateOutsourceInfo={onUpdateOutsourceInfo} />
          <OrderLineProductionSection line={line} onUpdateProductionInfo={onUpdateProductionInfo} />

          <DetailSection title="物流 / 售后摘要">
            <div className="stack">
              <div className="subtle-panel">
                <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                  <strong>物流记录</strong>
                  <button type="button" className="button ghost small" onClick={() => setLogisticsFormOpen((current) => !current)} disabled={!onAddLogistics}>
                    新增物流
                  </button>
                </div>
                {logisticsFormOpen && onAddLogistics ? (
                  <div className="spacer-top">
                    <OrderLineLogisticsCreateForm line={line} purchase={purchase} onAddLogistics={onAddLogistics} onCancel={() => setLogisticsFormOpen(false)} />
                  </div>
                ) : null}
                {lineLogisticsRecords.length > 0 ? (
                  <ul className="list-reset stack spacer-top">
                    {lineLogisticsRecords.map((record) => (
                      <OrderLineLogisticsRecordItem key={record.id} record={record} onUpdateLogistics={onUpdateLogistics} onVoidLogistics={onVoidLogistics} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="暂无物流记录" description="当前销售还没有关联物流记录。" />
                )}
              </div>
              <div className="subtle-panel">
                <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                  <strong>售后记录</strong>
                  <button type="button" className="button ghost small" onClick={() => setAfterSalesFormOpen((current) => !current)} disabled={!onAddAfterSales}>
                    新增售后
                  </button>
                </div>
                {afterSalesFormOpen && onAddAfterSales ? (
                  <div className="spacer-top">
                    <OrderLineAfterSalesCreateForm line={line} purchase={purchase} onAddAfterSales={onAddAfterSales} onCancel={() => setAfterSalesFormOpen(false)} />
                  </div>
                ) : null}
                {lineAfterSalesCases.length > 0 ? (
                  <ul className="list-reset stack spacer-top">
                    {lineAfterSalesCases.map((record) => (
                      <OrderLineAfterSalesRecordItem key={record.id} record={record} onUpdateAfterSales={onUpdateAfterSales} onCloseAfterSales={onCloseAfterSales} />
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="暂无售后记录" description="当前销售还没有关联售后记录。" />
                )}
              </div>
            </div>
          </DetailSection>
          <SourceProductDrawer
            open={sourceProductOpen}
            product={sourceProduct}
            compareValue={sourceProductCompareValue}
            onClose={() => setSourceProductOpen(false)}
          />
        </div>
      )}
    </SideDrawer>
  )
}
