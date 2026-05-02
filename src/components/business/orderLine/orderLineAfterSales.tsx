import { useEffect, useState } from 'react'
import { StatusTag } from '@/components/common'
import {
  buildOrderLineAfterSalesCase,
  buildOrderLineAfterSalesDraft,
  type OrderLineAfterSalesDraft
} from '@/services/orderLine/orderLineWorkspace'
import { defaultAfterSalesDraft, getAfterSalesStatusLabel, getAfterSalesTypeLabel } from '@/components/business/orderLine/orderLineOptions'
import type { OrderLine } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'
import type { AfterSalesCase, AfterSalesCaseStatus, AfterSalesCaseType } from '@/types/supporting-records'

export type OrderLineAfterSalesCreateHandler = (record: AfterSalesCase) => void
export type OrderLineAfterSalesUpdateHandler = (recordId: string, draft: OrderLineAfterSalesDraft) => void
export type OrderLineAfterSalesCloseHandler = (recordId: string) => void

const getAfterSalesReason = (record: AfterSalesCase) => record.reason || record.remark || '—'
const getAfterSalesRemark = (record: AfterSalesCase) => record.remark || '—'

const OrderLineAfterSalesDraftForm = ({
  initialDraft,
  saveLabel,
  onSave,
  onCancel
}: {
  initialDraft: OrderLineAfterSalesDraft
  saveLabel: string
  onSave: (draft: OrderLineAfterSalesDraft) => void
  onCancel: () => void
}) => {
  const [draft, setDraft] = useState<OrderLineAfterSalesDraft>(initialDraft)

  useEffect(() => {
    setDraft(initialDraft)
  }, [initialDraft])

  const updateDraft = <K extends keyof OrderLineAfterSalesDraft>(field: K, value: OrderLineAfterSalesDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleSave = () => {
    onSave(draft)
    onCancel()
  }

  return (
    <div className="subtle-panel">
      <div className="field-grid three">
        <label className="field-control">
          <span className="field-label">售后类型</span>
          <select className="select" value={draft.type} onChange={(event) => updateDraft('type', event.target.value as AfterSalesCaseType)}>
            <option value="resize">改圈/改尺寸</option>
            <option value="repair">维修</option>
            <option value="repolish">返工抛光</option>
            <option value="remake">重做</option>
            <option value="resend">补发</option>
            <option value="other">其他</option>
          </select>
        </label>
        <label className="field-control">
          <span className="field-label">售后状态</span>
          <select className="select" value={draft.status} onChange={(event) => updateDraft('status', event.target.value as AfterSalesCaseStatus)}>
            <option value="open">待处理</option>
            <option value="processing">处理中</option>
            <option value="waiting_return">待寄回</option>
            <option value="resolved">已解决</option>
            <option value="closed">已关闭</option>
          </select>
        </label>
        <label className="field-control">
          <span className="field-label">售后负责人</span>
          <input className="input" value={draft.responsibleParty} onChange={(event) => updateDraft('responsibleParty', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">创建时间</span>
          <input className="input" type="datetime-local" value={draft.createdAt} onChange={(event) => updateDraft('createdAt', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">关闭时间</span>
          <input className="input" type="datetime-local" value={draft.closedAt} onChange={(event) => updateDraft('closedAt', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">售后原因</span>
          <input className="input" value={draft.reason} onChange={(event) => updateDraft('reason', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">售后备注</span>
          <textarea className="textarea" value={draft.remark} onChange={(event) => updateDraft('remark', event.target.value)} />
        </label>
      </div>
      <div className="row spacer-top">
        <button type="button" className="button primary small" onClick={handleSave}>
          {saveLabel}
        </button>
        <button type="button" className="button secondary small" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  )
}

export const OrderLineAfterSalesCreateForm = ({
  line,
  purchase,
  onAddAfterSales,
  onCancel
}: {
  line: OrderLine
  purchase?: Purchase
  onAddAfterSales: OrderLineAfterSalesCreateHandler
  onCancel: () => void
}) => (
  <OrderLineAfterSalesDraftForm
    initialDraft={defaultAfterSalesDraft}
    saveLabel="保存售后"
    onSave={(draft) => onAddAfterSales(buildOrderLineAfterSalesCase({ line, purchase, draft }))}
    onCancel={onCancel}
  />
)

export const OrderLineAfterSalesRecordItem = ({
  record,
  onUpdateAfterSales,
  onCloseAfterSales
}: {
  record: AfterSalesCase
  onUpdateAfterSales?: OrderLineAfterSalesUpdateHandler
  onCloseAfterSales?: OrderLineAfterSalesCloseHandler
}) => {
  const [editing, setEditing] = useState(false)
  const isClosed = record.status === 'closed'

  useEffect(() => {
    setEditing(false)
  }, [record.id])

  if (editing) {
    return (
      <OrderLineAfterSalesDraftForm
        initialDraft={buildOrderLineAfterSalesDraft(record)}
        saveLabel="保存售后修改"
        onSave={(draft) => {
          onUpdateAfterSales?.(record.id, draft)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <li>
      <div className="row wrap" style={{ justifyContent: 'space-between' }}>
        <span>{getAfterSalesTypeLabel(record.type)}</span>
        <StatusTag value={getAfterSalesStatusLabel(record.status)} />
      </div>
      <div className="text-caption">
        {record.createdAt || '未记录时间'} · {record.responsibleParty || '未分配'}
        {record.closedAt ? ` · 关闭 ${record.closedAt}` : ''}
      </div>
      <div>{getAfterSalesReason(record)}</div>
      <div className="text-caption">{getAfterSalesRemark(record)}</div>
      <div className="row spacer-top">
        <button type="button" className="button ghost small" onClick={() => setEditing(true)} disabled={!onUpdateAfterSales}>
          编辑
        </button>
        <button type="button" className="button ghost small" onClick={() => onCloseAfterSales?.(record.id)} disabled={!onCloseAfterSales || isClosed}>
          关闭
        </button>
      </div>
    </li>
  )
}
