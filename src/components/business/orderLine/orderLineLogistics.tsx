import { useEffect, useState } from 'react'
import { StatusTag } from '@/components/common'
import {
  buildOrderLineLogisticsDraft,
  buildOrderLineLogisticsRecord,
  type OrderLineLogisticsDraft
} from '@/services/orderLine/orderLineWorkspace'
import { defaultLogisticsDraft, logisticsDirectionLabelMap, logisticsTypeLabelMap } from '@/components/business/orderLine/orderLineOptions'
import type { OrderLine } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'
import type { LogisticsDirection, LogisticsRecord, LogisticsType } from '@/types/supporting-records'

export type OrderLineLogisticsCreateHandler = (record: LogisticsRecord) => void
export type OrderLineLogisticsUpdateHandler = (recordId: string, draft: OrderLineLogisticsDraft) => void
export type OrderLineLogisticsVoidHandler = (recordId: string, voidReason: string) => void

const getLogisticsCompany = (record: LogisticsRecord) => record.company || '未填写承运商'
const getLogisticsRemark = (record: LogisticsRecord) => record.remark || '—'
const getLogisticsSignedAt = (record: LogisticsRecord) => record.signedAt || ''

const OrderLineLogisticsDraftForm = ({
  initialDraft,
  saveLabel,
  onSave,
  onCancel
}: {
  initialDraft: OrderLineLogisticsDraft
  saveLabel: string
  onSave: (draft: OrderLineLogisticsDraft) => void
  onCancel: () => void
}) => {
  const [draft, setDraft] = useState<OrderLineLogisticsDraft>(initialDraft)

  useEffect(() => {
    setDraft(initialDraft)
  }, [initialDraft])

  const updateDraft = <K extends keyof OrderLineLogisticsDraft>(field: K, value: OrderLineLogisticsDraft[K]) => {
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
          <span className="field-label">物流类型</span>
          <select className="select" value={draft.logisticsType} onChange={(event) => updateDraft('logisticsType', event.target.value as LogisticsType)}>
            <option value="measurement_tool">量尺工具</option>
            <option value="goods">货品</option>
            <option value="after_sales">售后</option>
            <option value="other">其他</option>
          </select>
        </label>
        <label className="field-control">
          <span className="field-label">物流方向</span>
          <select className="select" value={draft.direction} onChange={(event) => updateDraft('direction', event.target.value as LogisticsDirection)}>
            <option value="outbound">发出</option>
            <option value="return">退回</option>
          </select>
        </label>
        <label className="field-control">
          <span className="field-label">快递公司</span>
          <input className="input" value={draft.company} onChange={(event) => updateDraft('company', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">运单号</span>
          <input className="input" value={draft.trackingNo} onChange={(event) => updateDraft('trackingNo', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">发货时间</span>
          <input className="input" type="datetime-local" value={draft.shippedAt} onChange={(event) => updateDraft('shippedAt', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">签收时间</span>
          <input className="input" type="datetime-local" value={draft.signedAt} onChange={(event) => updateDraft('signedAt', event.target.value)} />
        </label>
        <label className="field-control">
          <span className="field-label">物流备注</span>
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

export const OrderLineLogisticsCreateForm = ({
  line,
  purchase,
  onAddLogistics,
  onCancel
}: {
  line: OrderLine
  purchase?: Purchase
  onAddLogistics: OrderLineLogisticsCreateHandler
  onCancel: () => void
}) => (
  <OrderLineLogisticsDraftForm
    initialDraft={defaultLogisticsDraft}
    saveLabel="保存物流"
    onSave={(draft) => onAddLogistics(buildOrderLineLogisticsRecord({ line, purchase, draft }))}
    onCancel={onCancel}
  />
)

export const OrderLineLogisticsRecordItem = ({
  record,
  onUpdateLogistics,
  onVoidLogistics
}: {
  record: LogisticsRecord
  onUpdateLogistics?: OrderLineLogisticsUpdateHandler
  onVoidLogistics?: OrderLineLogisticsVoidHandler
}) => {
  const [editing, setEditing] = useState(false)
  const [voiding, setVoiding] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const isVoided = record.recordStatus === 'voided'

  useEffect(() => {
    setEditing(false)
    setVoiding(false)
    setVoidReason('')
  }, [record.id])

  if (editing) {
    return (
      <OrderLineLogisticsDraftForm
        initialDraft={buildOrderLineLogisticsDraft(record)}
        saveLabel="保存物流修改"
        onSave={(draft) => {
          onUpdateLogistics?.(record.id, draft)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <li>
      <div className="row wrap" style={{ justifyContent: 'space-between' }}>
        <span>{getLogisticsCompany(record)}</span>
        <div className="row wrap">
          {isVoided ? <StatusTag value="已作废" /> : null}
          <span className="text-price">{record.trackingNo || '无单号'}</span>
        </div>
      </div>
      <div className="text-caption">
        {logisticsTypeLabelMap[record.logisticsType || 'goods']} · {logisticsDirectionLabelMap[record.direction || 'outbound']} · {record.shippedAt || '未发货'}
        {getLogisticsSignedAt(record) ? ` · 签收 ${getLogisticsSignedAt(record)}` : ''} · {getLogisticsRemark(record)}
      </div>
      {isVoided ? (
        <div className="text-caption">作废时间 {record.voidedAt || '—'} · 作废原因 {record.voidReason || '—'}</div>
      ) : (
        <div className="row spacer-top">
          <button type="button" className="button ghost small" onClick={() => setEditing(true)} disabled={!onUpdateLogistics}>
            编辑
          </button>
          <button type="button" className="button ghost small" onClick={() => setVoiding((current) => !current)} disabled={!onVoidLogistics}>
            作废
          </button>
        </div>
      )}
      {voiding && !isVoided ? (
        <div className="subtle-panel spacer-top">
          <label className="field-control">
            <span className="field-label">作废原因</span>
            <textarea className="textarea" value={voidReason} onChange={(event) => setVoidReason(event.target.value)} />
          </label>
          <div className="row spacer-top">
            <button
              type="button"
              className="button primary small"
              onClick={() => {
                onVoidLogistics?.(record.id, voidReason)
                setVoiding(false)
                setVoidReason('')
              }}
            >
              确认作废
            </button>
            <button type="button" className="button secondary small" onClick={() => setVoiding(false)}>
              取消
            </button>
          </div>
        </div>
      ) : null}
    </li>
  )
}
