import { useEffect, useState } from 'react'
import { InfoField } from '@/components/common'
import { DetailSection } from '@/components/business/orderLine/orderLineDetailSection'
import { getOutsourceStatusLabel, outsourceStatusOptions } from '@/components/business/orderLine/orderLineOptions'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { buildOrderLineOutsourceDraft, type OrderLineOutsourceDraft } from '@/services/orderLine/orderLineWorkspace'
import type { OrderLine } from '@/types/order-line'

export type OrderLineOutsourceUpdateHandler = (lineId: string, draft: OrderLineOutsourceDraft) => void

const getFactorySummary = (line: OrderLine) =>
  line.outsourceInfo?.supplierName && line.outsourceInfo.supplierName !== '待定' ? line.outsourceInfo.supplierName : '待确认工厂'

const useEditableSectionDraft = <Draft,>(line: OrderLine, buildDraft: (line: OrderLine) => Draft) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => buildDraft(line))
  const [message, setMessage] = useState('')

  useEffect(() => {
    setDraft(buildDraft(line))
    setEditing(false)
    setMessage('')
  }, [buildDraft, line.id])

  const updateDraft = <K extends keyof Draft>(field: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleEdit = () => {
    setDraft(buildDraft(line))
    setMessage('')
    setEditing(true)
  }

  const handleCancel = () => {
    setDraft(buildDraft(line))
    setEditing(false)
    setMessage('')
  }

  const markSaved = (successMessage: string) => {
    setEditing(false)
    setMessage(successMessage)
  }

  return { editing, draft, message, updateDraft, handleEdit, handleCancel, markSaved }
}

export const OrderLineOutsourceSection = ({
  line,
  onUpdateOutsourceInfo
}: {
  line: OrderLine
  onUpdateOutsourceInfo?: OrderLineOutsourceUpdateHandler
}) => {
  const { editing, draft, message, updateDraft, handleEdit, handleCancel, markSaved } = useEditableSectionDraft(line, buildOrderLineOutsourceDraft)

  const handleSave = () => {
    if (!onUpdateOutsourceInfo) {
      return
    }

    onUpdateOutsourceInfo(line.id, draft)
    markSaved('已保存跟单 / 下厂信息')
  }

  return (
    <DetailSection
      title="跟单 / 下厂"
      actions={
        !editing ? (
          <button type="button" className="button ghost small" aria-label="编辑跟单 / 下厂信息" onClick={handleEdit} disabled={!onUpdateOutsourceInfo}>
            编辑
          </button>
        ) : null
      }
    >
      {editing ? (
        <div className="stack">
          <div className="field-grid three">
            <label className="field-control">
              <span className="field-label">货号</span>
              <input className="input" value={draft.productionTaskNo} onChange={(event) => updateDraft('productionTaskNo', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">跟单负责人</span>
              <input className="input" value={draft.followUpOwner} onChange={(event) => updateDraft('followUpOwner', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">工厂名称</span>
              <input className="input" value={draft.supplierName} onChange={(event) => updateDraft('supplierName', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">下厂时间</span>
              <input className="input" value={draft.outsourcedAt} onChange={(event) => updateDraft('outsourcedAt', event.target.value)} placeholder="YYYY-MM-DD" />
            </label>
            <label className="field-control">
              <span className="field-label">工厂计划交期</span>
              <input className="input" value={draft.plannedDeliveryDate} onChange={(event) => updateDraft('plannedDeliveryDate', event.target.value)} placeholder="YYYY-MM-DD" />
            </label>
            <label className="field-control">
              <span className="field-label">委外状态</span>
              <select className="select" value={draft.outsourceStatus} onChange={(event) => updateDraft('outsourceStatus', event.target.value)}>
                {outsourceStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">跟单备注 / 委外备注</span>
              <textarea className="textarea" value={draft.outsourceNote} onChange={(event) => updateDraft('outsourceNote', event.target.value)} />
            </label>
          </div>
          <div className="row">
            <button type="button" className="button primary small" onClick={handleSave}>
              保存跟单
            </button>
            <button type="button" className="button secondary small" onClick={handleCancel}>
              取消编辑
            </button>
          </div>
        </div>
      ) : (
        <div className="info-grid order-line-drawer-grid">
          <InfoField label="货号" value={getOrderLineGoodsNo(line, '—')} />
          <InfoField label="跟单负责人" value={line.currentOwner || '待分配'} />
          <InfoField label="工厂" value={getFactorySummary(line)} />
          <InfoField label="下厂时间" value={line.outsourceInfo?.outsourcedAt || '待补充'} />
          <InfoField label="工厂计划交期" value={line.outsourceInfo?.plannedDeliveryDate || line.expectedDate || '—'} />
          <InfoField label="委外状态" value={getOutsourceStatusLabel(String(line.outsourceInfo?.outsourceStatus || ''))} />
          <InfoField label="跟单备注 / 委外备注" value={line.outsourceInfo?.outsourceNote || '—'} />
        </div>
      )}
      {message ? (
        <div role="status" className="success-alert spacer-top">
          {message}
        </div>
      ) : null}
    </DetailSection>
  )
}
