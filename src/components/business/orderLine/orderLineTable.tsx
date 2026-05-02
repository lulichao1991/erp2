import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { CopyableText, EmptyState, LargeModal, RiskTag, StatusTag, TimePressureBadge } from '@/components/common'
import { afterSalesMock, customersMock, logisticsMock } from '@/mocks'
import { mockProducts } from '@/mocks/products'
import { getAfterSalesStatusLabel, activeAfterSalesStatuses } from '@/components/business/orderLine/orderLineOptions'
import {
  getOrderLineFactoryStatus,
  getOrderLineFinanceStatus,
  getOrderLineLineStatus,
  getOrderLineLineStatusLabel,
  getOrderLineProductionStatus
} from '@/services/orderLine/orderLineWorkflow'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { getOrderLineRisks, getProductionDelayStatus } from '@/services/orderLine/orderLineRiskSelectors'
import type { OrderLine } from '@/types/order-line'
import type { OrderLineRow } from '@/services/orderLine/orderLineWorkspace'
import type { AfterSalesCase, LogisticsRecord } from '@/types/supporting-records'

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

const getFactorySummary = (line: OrderLine) =>
  line.outsourceInfo?.supplierName && line.outsourceInfo.supplierName !== '待定' ? line.outsourceInfo.supplierName : '待确认工厂'

const getLineRiskLabels = (line: OrderLine, afterSalesCases: AfterSalesCase[] = afterSalesMock) => {
  return getOrderLineRisks(line, { afterSalesCases, dueDate: line.promisedDate }).map((risk) => risk.label)
}

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && Boolean(target.closest('a, button, input, select, textarea, label'))

const getOrderLineDisplayName = (line: OrderLine) => line.name || '未命名款式'

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
