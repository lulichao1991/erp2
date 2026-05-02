import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SourceProductDrawer, type SourceProductCompareValue } from '@/components/business/sourceProduct'
import { CopyableText, EmptyState, InfoField, RiskTag, SideDrawer } from '@/components/common'
import { afterSalesMock, customersMock, logisticsMock } from '@/mocks'
import { mockProducts } from '@/mocks/products'
import {
  getOrderLineFinanceStatus,
  getOrderLineLineStatus,
  getOrderLineProductionStatus,
  productionWorkflowStatusLabelMap
} from '@/services/orderLine/orderLineWorkflow'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { getOrderLineRisks, getProductionDelayStatus } from '@/services/orderLine/orderLineRiskSelectors'
import { type OrderLineRow } from '@/services/orderLine/orderLineWorkspace'
import { activeAfterSalesStatuses } from '@/components/business/orderLine/orderLineOptions'
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
  OrderLineLog
} from '@/types/order-line'
import type { Product } from '@/types/product'
import type { Customer } from '@/types/customer'
import type { Purchase } from '@/types/purchase'
import type { AfterSalesCase, LogisticsRecord } from '@/types/supporting-records'

export type { OrderLineCenterFilters, OrderLineRow } from '@/services/orderLine/orderLineWorkspace'
export { OrderLineFilterBar } from '@/components/business/orderLine/orderLineFilter'
export { OrderLineTable } from '@/components/business/orderLine/orderLineTable'

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')

const isActiveAfterSalesCase = (record?: AfterSalesCase) => Boolean(record?.status && activeAfterSalesStatuses.has(record.status))

const getTimePressure = (line: OrderLine, promisedDate?: string) => getProductionDelayStatus(line, new Date(), promisedDate, { respectCompleted: false })

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

const getLineRiskLabels = (line: OrderLine, afterSalesCases: AfterSalesCase[] = afterSalesMock) => {
  return getOrderLineRisks(line, { afterSalesCases, dueDate: line.promisedDate }).map((risk) => risk.label)
}

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
