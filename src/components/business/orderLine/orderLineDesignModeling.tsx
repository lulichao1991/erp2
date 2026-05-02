import { useEffect, useState } from 'react'
import { InfoField } from '@/components/common'
import { DetailSection } from '@/components/business/orderLine/orderLineDetailSection'
import { designStatusOptions, modelingStatusOptions } from '@/components/business/orderLine/orderLineOptions'
import {
  designWorkflowStatusLabelMap,
  getOrderLineDesignStatus,
  getOrderLineModelingStatus,
  modelingWorkflowStatusLabelMap
} from '@/services/orderLine/orderLineWorkflow'
import { buildOrderLineDesignModelingDraft, type OrderLineDesignModelingDraft } from '@/services/orderLine/orderLineWorkspace'
import type { OrderLine, OrderLineUploadedFile, OrderLineWorkflowDesignStatus, OrderLineWorkflowModelingStatus } from '@/types/order-line'

export type OrderLineDesignModelingUpdateHandler = (lineId: string, draft: OrderLineDesignModelingDraft) => void

const TextList = ({ values, empty = '—' }: { values?: string[]; empty?: string }) => (values && values.length > 0 ? values.join(' / ') : empty)

const buildUploadedFiles = (files: FileList | null, prefix: string): OrderLineUploadedFile[] =>
  Array.from(files ?? []).map((file, index) => ({
    id: `${prefix}-${Date.now()}-${index}`,
    name: file.name,
    url: `mock-upload:${encodeURIComponent(file.name)}`
  }))

const getUploadedFileNames = (files?: OrderLineUploadedFile[], fallback?: string) => {
  const names = files?.map((file) => file.name).filter(Boolean) ?? []
  const fallbackName = fallback?.trim()

  return names.length > 0 ? names : fallbackName ? [fallbackName] : []
}

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

export const OrderLineDesignModelingSection = ({
  line,
  onUpdateDesignModeling
}: {
  line: OrderLine
  onUpdateDesignModeling?: OrderLineDesignModelingUpdateHandler
}) => {
  const { editing, draft, message, updateDraft, handleEdit, handleCancel, markSaved } = useEditableSectionDraft(line, buildOrderLineDesignModelingDraft)

  const handleSave = () => {
    if (!onUpdateDesignModeling) {
      return
    }

    onUpdateDesignModeling(line.id, draft)
    markSaved('已保存设计建模信息')
  }

  const handleModelingFileUpload = (files: FileList | null) => {
    updateDraft('modelingFiles', buildUploadedFiles(files, `${line.id}-modeling`))
  }

  const handleWaxFileUpload = (files: FileList | null) => {
    updateDraft('waxFiles', buildUploadedFiles(files, `${line.id}-wax`))
  }

  return (
    <DetailSection
      title="设计建模"
      actions={
        !editing ? (
          <button type="button" className="button ghost small" aria-label="编辑设计建模" onClick={handleEdit} disabled={!onUpdateDesignModeling}>
            编辑
          </button>
        ) : null
      }
    >
      {editing ? (
        <div className="stack">
          <div className="field-grid three order-line-design-modeling-edit-grid">
            <label className="field-control">
              <span className="field-label">设计状态</span>
              <select className="select" value={draft.designStatus} onChange={(event) => updateDraft('designStatus', event.target.value as OrderLineWorkflowDesignStatus)}>
                {designStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">建模状态</span>
              <select className="select" value={draft.modelingStatus} onChange={(event) => updateDraft('modelingStatus', event.target.value as OrderLineWorkflowModelingStatus)}>
                {modelingStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">设计负责人</span>
              <input className="input" value={draft.assignedDesignerName} onChange={(event) => updateDraft('assignedDesignerName', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">设计人 ID</span>
              <input className="input" value={draft.assignedDesignerId} onChange={(event) => updateDraft('assignedDesignerId', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">建模人 ID</span>
              <input className="input" value={draft.assignedModelerId} onChange={(event) => updateDraft('assignedModelerId', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">建模文件上传</span>
              <input aria-label="建模文件上传" className="input" type="file" accept=".3dm,.stl,.obj,.step,.zip,.rar,.pdf" multiple onChange={(event) => handleModelingFileUpload(event.target.files)} />
              <span className="text-caption">{draft.modelingFiles.length > 0 ? draft.modelingFiles.map((file) => file.name).join(' / ') : '未上传'}</span>
            </label>
            <label className="field-control">
              <span className="field-label">出蜡文件上传</span>
              <input aria-label="出蜡文件上传" className="input" type="file" accept=".stl,.3dm,.obj,.step,.zip,.rar,.pdf" multiple onChange={(event) => handleWaxFileUpload(event.target.files)} />
              <span className="text-caption">{draft.waxFiles.length > 0 ? draft.waxFiles.map((file) => file.name).join(' / ') : '未上传'}</span>
            </label>
            <label className="field-control">
              <span className="field-label">设计流转备注</span>
              <textarea className="textarea" value={draft.designNote} onChange={(event) => updateDraft('designNote', event.target.value)} />
            </label>
          </div>
          <div className="row">
            <button type="button" className="button primary small" onClick={handleSave}>
              保存设计建模
            </button>
            <button type="button" className="button secondary small" onClick={handleCancel}>
              取消编辑
            </button>
          </div>
        </div>
      ) : (
        <div className="info-grid order-line-drawer-grid">
          <InfoField label="设计状态" value={designWorkflowStatusLabelMap[getOrderLineDesignStatus(line)]} />
          <InfoField label="建模状态" value={modelingWorkflowStatusLabelMap[getOrderLineModelingStatus(line)]} />
          <InfoField label="设计负责人" value={line.designInfo?.assignedDesigner || '—'} />
          <InfoField label="设计人 ID" value={line.assignedDesignerId || '—'} />
          <InfoField label="建模人 ID" value={line.assignedModelerId || '—'} />
          <InfoField label="建模文件" value={<TextList values={getUploadedFileNames(line.modelingFiles, line.designInfo?.modelingFileUrl)} />} />
          <InfoField label="出蜡文件" value={<TextList values={getUploadedFileNames(line.waxFiles, line.designInfo?.waxFileUrl)} />} />
          <InfoField label="设计流转备注" value={line.designInfo?.designNote || '—'} />
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
