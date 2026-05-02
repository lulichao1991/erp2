import { useEffect, useState } from 'react'
import { InfoField } from '@/components/common'
import { DetailSection } from '@/components/business/orderLine/orderLineDetailSection'
import { getFeedbackStatusLabel, productionStatusOptions } from '@/components/business/orderLine/orderLineOptions'
import { buildOrderLineProductionDraft, type OrderLineProductionDraft } from '@/services/orderLine/orderLineWorkspace'
import type { OrderLine } from '@/types/order-line'

export type OrderLineProductionUpdateHandler = (lineId: string, draft: OrderLineProductionDraft) => void

const getProductionTotalWeight = (line: OrderLine) => line.productionInfo?.totalWeight || ''

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

export const OrderLineProductionSection = ({
  line,
  onUpdateProductionInfo
}: {
  line: OrderLine
  onUpdateProductionInfo?: OrderLineProductionUpdateHandler
}) => {
  const { editing, draft, message, updateDraft, handleEdit, handleCancel, markSaved } = useEditableSectionDraft(line, buildOrderLineProductionDraft)

  const handleSave = () => {
    if (!onUpdateProductionInfo) {
      return
    }

    onUpdateProductionInfo(line.id, draft)
    markSaved('已保存工厂回传信息')
  }

  return (
    <DetailSection
      title="工厂回传"
      actions={
        !editing ? (
          <button type="button" className="button ghost small" aria-label="编辑工厂回传信息" onClick={handleEdit} disabled={!onUpdateProductionInfo}>
            编辑
          </button>
        ) : null
      }
    >
      {editing ? (
        <div className="stack">
          <div className="field-grid three">
            <label className="field-control">
              <span className="field-label">工厂状态</span>
              <select className="select" value={draft.feedbackStatus} onChange={(event) => updateDraft('feedbackStatus', event.target.value)}>
                {productionStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">实际材质</span>
              <input className="input" value={draft.actualMaterial} onChange={(event) => updateDraft('actualMaterial', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">总重</span>
              <input className="input" value={draft.totalWeight} onChange={(event) => updateDraft('totalWeight', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">净重</span>
              <input className="input" value={draft.netWeight} onChange={(event) => updateDraft('netWeight', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">主石信息</span>
              <input className="input" value={draft.mainStoneInfo} onChange={(event) => updateDraft('mainStoneInfo', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">辅石信息</span>
              <input className="input" value={draft.sideStoneInfo} onChange={(event) => updateDraft('sideStoneInfo', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">工费明细</span>
              <input className="input" value={draft.laborCostDetail} onChange={(event) => updateDraft('laborCostDetail', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">工厂出货日期</span>
              <input className="input" value={draft.factoryShippedAt} onChange={(event) => updateDraft('factoryShippedAt', event.target.value)} placeholder="YYYY-MM-DD" />
            </label>
            <label className="field-control">
              <span className="field-label">质检结果</span>
              <input className="input" value={draft.qualityResult} onChange={(event) => updateDraft('qualityResult', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">工厂备注</span>
              <textarea className="textarea" value={draft.factoryNote} onChange={(event) => updateDraft('factoryNote', event.target.value)} />
            </label>
          </div>
          <div className="row">
            <button type="button" className="button primary small" onClick={handleSave}>
              保存回传
            </button>
            <button type="button" className="button secondary small" onClick={handleCancel}>
              取消编辑
            </button>
          </div>
        </div>
      ) : (
        <div className="info-grid order-line-drawer-grid">
          <InfoField label="工厂状态" value={getFeedbackStatusLabel(String(line.productionInfo?.feedbackStatus || ''))} />
          <InfoField label="实际材质" value={line.productionInfo?.actualMaterial || line.actualRequirements?.material || line.selectedMaterial || '—'} />
          <InfoField label="总重" value={getProductionTotalWeight(line) || '—'} />
          <InfoField label="净重" value={line.productionInfo?.netWeight || '—'} />
          <InfoField label="主石信息" value={line.productionInfo?.mainStoneInfo || '—'} />
          <InfoField label="辅石信息" value={line.productionInfo?.sideStoneInfo || '—'} />
          <InfoField label="工费明细" value={line.productionInfo?.laborCostDetail || '—'} />
          <InfoField label="工厂出货日期" value={line.productionInfo?.factoryShippedAt || '—'} />
          <InfoField label="质检结果" value={line.productionInfo?.qualityResult || '—'} />
          <InfoField label="工厂备注" value={line.productionInfo?.factoryNote || '—'} />
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
