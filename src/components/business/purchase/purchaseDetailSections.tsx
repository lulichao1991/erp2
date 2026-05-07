import { Link } from 'react-router-dom'
import type { KeyboardEvent, MouseEvent } from 'react'
import { EmptyState, InfoField, InfoGrid, RecordTimeline, SectionCard, StatusTag, TimePressureBadge } from '@/components/common'
import { afterSalesMock, logisticsMock } from '@/mocks'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { getProductionDelayStatus } from '@/services/orderLine/orderLineRiskSelectors'
import { getOrderLineLineStatus, getOrderLineLineStatusLabel } from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'
import type { AfterSalesCase, LogisticsRecord } from '@/types/supporting-records'

type PurchaseLineRow = {
  line: OrderLine
  purchase: Purchase
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
