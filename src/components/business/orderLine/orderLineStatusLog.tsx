import { useEffect, useState } from 'react'
import { EmptyState, InfoField, RecordTimeline, StatusTag } from '@/components/common'
import { DetailSection } from '@/components/business/orderLine/orderLineDetailSection'
import { orderLineStatusOptions } from '@/components/business/orderLine/orderLineOptions'
import { getCustomerServiceNextLineStatus } from '@/services/orderLine/orderLineCustomerService'
import { getOrderLineCompleteness } from '@/services/orderLine/orderLineRiskSelectors'
import { getOrderLineLineStatus, getOrderLineLineStatusLabel } from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine, OrderLineLineStatus, OrderLineLog } from '@/types/order-line'

export type OrderLineStatusUpdateHandler = (lineId: string, nextStatus: OrderLineLineStatus | string) => void

const getStatusLabel = getOrderLineLineStatusLabel

export const OrderLineStatusUpdatePanel = ({
  line,
  onStatusChange
}: {
  line: OrderLine
  onStatusChange?: OrderLineStatusUpdateHandler
}) => {
  const currentLineStatus = getOrderLineLineStatus(line)
  const [nextStatus, setNextStatus] = useState(String(currentLineStatus))
  const [statusMessage, setStatusMessage] = useState('')
  const completeness = getOrderLineCompleteness(line)
  const customerConfirmStatus = getCustomerServiceNextLineStatus({
    requiresDesign: Boolean(line.requiresDesign),
    requiresModeling: Boolean(line.requiresModeling)
  })

  useEffect(() => {
    setNextStatus(String(getOrderLineLineStatus(line)))
  }, [line])

  useEffect(() => {
    setStatusMessage('')
  }, [line.id])

  const handleUpdate = () => {
    if (!onStatusChange) {
      setStatusMessage('当前入口暂不支持前端状态更新。')
      return
    }

    if (nextStatus === getOrderLineLineStatus(line)) {
      setStatusMessage('状态未变化。')
      return
    }

    const previousLabel = getStatusLabel(getOrderLineLineStatus(line))
    const nextLabel = getStatusLabel(nextStatus)
    onStatusChange(line.id, nextStatus)
    setStatusMessage(`已将状态从 ${previousLabel} 更新为 ${nextLabel}`)
  }

  const handleCustomerConfirm = () => {
    if (!onStatusChange || !completeness.complete) {
      return
    }

    if (customerConfirmStatus === getOrderLineLineStatus(line)) {
      setStatusMessage('当前销售已经在目标分流状态。')
      return
    }

    onStatusChange(line.id, customerConfirmStatus)
    setStatusMessage(`客服确认完成，已分流到 ${getStatusLabel(customerConfirmStatus)}`)
  }

  return (
    <DetailSection title="更新状态">
      <div className="field-grid three">
        <InfoField label="当前状态" value={<StatusTag value={getStatusLabel(getOrderLineLineStatus(line))} />} />
        <InfoField label="资料完整度" value={`${completeness.completed}/${completeness.total}`} />
        <InfoField label="资料检查" value={<StatusTag value={completeness.complete ? '资料完整' : '资料缺失'} />} />
        <label className="field-control">
          <span className="field-label">目标状态</span>
          <select className="select" aria-label="目标状态" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
            {orderLineStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="field-control">
          <span className="field-label">操作</span>
          <button type="button" className="button primary small" onClick={handleUpdate} disabled={!onStatusChange}>
            更新状态
          </button>
          <button type="button" className="button secondary small" onClick={handleCustomerConfirm} disabled={!onStatusChange || !completeness.complete}>
            客服确认完成
          </button>
        </div>
      </div>
      <div className="text-caption spacer-top">
        {completeness.summary}
        {completeness.complete ? `；客服确认后进入「${getStatusLabel(customerConfirmStatus)}」。` : '；请先补齐资料后再确认。'}
      </div>
      <div className="completeness-checklist" aria-label="资料完整度明细">
        {completeness.fieldStatuses.map((item) => (
          <span key={item.key} className={`completeness-pill ${item.complete ? 'complete' : 'missing'}`}>
            <span className="completeness-pill-status">{item.complete ? '已填' : '缺少'}</span>
            {item.label}
          </span>
        ))}
      </div>
      {statusMessage ? (
        <div role="status" className="success-alert spacer-top">
          {statusMessage}
        </div>
      ) : null}
    </DetailSection>
  )
}

export const OrderLineLogSection = ({ logs }: { logs: OrderLineLog[] }) => {
  const sortedLogs = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <DetailSection title="操作日志">
      {sortedLogs.length > 0 ? (
        <RecordTimeline
          items={sortedLogs.map((log) => {
            const displayNote = log.note || ''

            return {
              id: log.id,
              title: log.actionLabel,
              meta: `${log.createdAt} · ${log.operatorName}`,
              description:
                displayNote ||
                (log.fromStatus || log.toStatus
                  ? `状态：${log.fromStatus ? getStatusLabel(String(log.fromStatus)) : '—'} → ${log.toStatus ? getStatusLabel(String(log.toStatus)) : '—'}`
                  : '—')
            }
          })}
        />
      ) : (
        <EmptyState title="暂无操作日志" description="当前销售还没有记录操作。" />
      )}
    </DetailSection>
  )
}
