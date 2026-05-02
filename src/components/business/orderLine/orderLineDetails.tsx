import { useEffect, useState } from 'react'
import { InfoField } from '@/components/common'
import { DetailSection } from '@/components/business/orderLine/orderLineDetailSection'
import { categoryLabelMap, categoryOptions, priorityOptions } from '@/components/business/orderLine/orderLineOptions'
import { hasEngravingRequirement } from '@/services/orderLine/orderLineCustomerService'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { buildOrderLineDetailsDraft, type OrderLineDetailsDraft } from '@/services/orderLine/orderLineWorkspace'
import type { OrderLine, OrderLinePriority, OrderLineUploadedFile } from '@/types/order-line'

export type OrderLineDetailsUpdateHandler = (lineId: string, draft: OrderLineDetailsDraft) => void

const splitTextList = (value: string) =>
  value
    .split(/[,，/、\n]/)
    .map((item) => item.trim())
    .filter(Boolean)

const TextList = ({ values, empty = '—' }: { values?: string[]; empty?: string }) => (values && values.length > 0 ? values.join(' / ') : empty)

const buildUploadedFiles = (files: FileList | null, prefix: string): OrderLineUploadedFile[] =>
  Array.from(files ?? []).map((file, index) => ({
    id: `${prefix}-${Date.now()}-${index}`,
    name: file.name,
    url: `mock-upload:${encodeURIComponent(file.name)}`
  }))

const getOrderLineDisplayName = (line: OrderLine) => line.name || '未命名款式'

export const OrderLineDetailsSection = ({
  line,
  onUpdateLineDetails,
  onOpenSourceProduct
}: {
  line: OrderLine
  onUpdateLineDetails?: OrderLineDetailsUpdateHandler
  onOpenSourceProduct?: () => void
}) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<OrderLineDetailsDraft>(() => buildOrderLineDetailsDraft(line))
  const [message, setMessage] = useState('')
  const draftSpecialOptions = splitTextList(draft.selectedSpecialOptionsText)
  const draftNeedsEngraving = hasEngravingRequirement({
    engraveText: draft.engraveText,
    selectedSpecialOptions: draftSpecialOptions,
    engraveImageFiles: draft.engraveImageFiles,
    engravePltFiles: draft.engravePltFiles
  })
  const needsEngraving = hasEngravingRequirement({
    engraveText: line.actualRequirements?.engraveText,
    selectedSpecialOptions: line.selectedSpecialOptions,
    engraveImageFiles: line.actualRequirements?.engraveImageFiles,
    engravePltFiles: line.actualRequirements?.engravePltFiles
  })

  useEffect(() => {
    setDraft(buildOrderLineDetailsDraft(line))
    setEditing(false)
    setMessage('')
  }, [line.id])

  const updateDraft = <K extends keyof OrderLineDetailsDraft>(field: K, value: OrderLineDetailsDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const handleEdit = () => {
    setDraft(buildOrderLineDetailsDraft(line))
    setMessage('')
    setEditing(true)
  }

  const handleCancel = () => {
    setDraft(buildOrderLineDetailsDraft(line))
    setEditing(false)
    setMessage('')
  }

  const handleSave = () => {
    if (!onUpdateLineDetails) {
      return
    }

    onUpdateLineDetails(line.id, draft)
    setEditing(false)
    setMessage('已保存定制参数')
  }

  const handleEngraveImageUpload = (files: FileList | null) => {
    updateDraft('engraveImageFiles', buildUploadedFiles(files, `${line.id}-engrave-image`))
  }

  const handleEngravePltUpload = (files: FileList | null) => {
    updateDraft('engravePltFiles', buildUploadedFiles(files, `${line.id}-engrave-plt`))
  }

  return (
    <DetailSection
      title="定制参数"
      actions={
        !editing ? (
          <button type="button" className="button ghost small" aria-label="编辑定制参数" onClick={handleEdit} disabled={!onUpdateLineDetails}>
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
              <span className="field-label">款式名称</span>
              <input className="input" value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">版本号</span>
              <input className="input" value={draft.versionNo} onChange={(event) => updateDraft('versionNo', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">品类</span>
              <select className="select" value={draft.category} onChange={(event) => updateDraft('category', event.target.value)}>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">规格</span>
              <input className="input" value={draft.selectedSpecValue} onChange={(event) => updateDraft('selectedSpecValue', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">材质</span>
              <input className="input" value={draft.selectedMaterial} onChange={(event) => updateDraft('selectedMaterial', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">工艺</span>
              <input className="input" value={draft.selectedProcess} onChange={(event) => updateDraft('selectedProcess', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">特殊需求</span>
              <input className="input" value={draft.selectedSpecialOptionsText} onChange={(event) => updateDraft('selectedSpecialOptionsText', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">刻字 / 印记</span>
              <input className="input" value={draft.engraveText} onChange={(event) => updateDraft('engraveText', event.target.value)} />
            </label>
            {draftNeedsEngraving ? (
              <>
                <label className="field-control">
                  <span className="field-label">刻字参考图</span>
                  <input aria-label="刻字参考图" className="input" type="file" accept="image/*,.pdf" multiple onChange={(event) => handleEngraveImageUpload(event.target.files)} />
                  <span className="text-caption">{draft.engraveImageFiles.length > 0 ? draft.engraveImageFiles.map((file) => file.name).join(' / ') : '未上传'}</span>
                </label>
                <label className="field-control">
                  <span className="field-label">刻字 PLT 文件</span>
                  <input aria-label="刻字 PLT 文件" className="input" type="file" accept=".plt" multiple onChange={(event) => handleEngravePltUpload(event.target.files)} />
                  <span className="text-caption">{draft.engravePltFiles.length > 0 ? draft.engravePltFiles.map((file) => file.name).join(' / ') : '未上传'}</span>
                </label>
              </>
            ) : null}
            <label className="field-control">
              <span className="field-label">当前负责人</span>
              <input className="input" value={draft.currentOwner} onChange={(event) => updateDraft('currentOwner', event.target.value)} />
            </label>
            <label className="field-control">
              <span className="field-label">承诺交期</span>
              <input className="input" value={draft.promisedDate} onChange={(event) => updateDraft('promisedDate', event.target.value)} placeholder="YYYY-MM-DD" />
            </label>
            <label className="field-control">
              <span className="field-label">是否加急</span>
              <select className="select" value={draft.priority} onChange={(event) => updateDraft('priority', event.target.value as OrderLinePriority)}>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">是否需要设计</span>
              <select className="select" value={draft.requiresDesign ? 'true' : 'false'} onChange={(event) => updateDraft('requiresDesign', event.target.value === 'true')}>
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">是否需要建模</span>
              <select className="select" value={draft.requiresModeling ? 'true' : 'false'} onChange={(event) => updateDraft('requiresModeling', event.target.value === 'true')}>
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">是否需要出蜡</span>
              <select className="select" value={draft.requiresWax ? 'true' : 'false'} onChange={(event) => updateDraft('requiresWax', event.target.value === 'true')}>
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </label>
            <label className="field-control">
              <span className="field-label">特殊需求备注</span>
              <textarea className="textarea" value={draft.customerRemark} onChange={(event) => updateDraft('customerRemark', event.target.value)} />
            </label>
          </div>
          <div className="row">
            <button type="button" className="button primary small" onClick={handleSave}>
              保存需求
            </button>
            <button type="button" className="button secondary small" onClick={handleCancel}>
              取消编辑
            </button>
          </div>
        </div>
      ) : (
        <div className="info-grid order-line-drawer-grid">
          <InfoField label="货号" value={getOrderLineGoodsNo(line, '—')} />
          <InfoField
            label="款式名称"
            value={
              line.sourceProduct?.sourceProductCode && onOpenSourceProduct ? (
                <button type="button" className="inline-link-button" aria-label={`查看来源款式：${getOrderLineDisplayName(line)}`} onClick={onOpenSourceProduct}>
                  {getOrderLineDisplayName(line)}
                </button>
              ) : (
                getOrderLineDisplayName(line)
              )
            }
          />
          <InfoField label="来源款式编号" value={line.sourceProduct?.sourceProductCode || '—'} />
          <InfoField label="版本号" value={line.versionNo || line.sourceProduct?.sourceProductVersion || '—'} />
          <InfoField label="品类" value={categoryLabelMap[line.category || 'other'] || line.category || '其他'} />
          <InfoField label="规格" value={line.selectedSpecValue || '—'} />
          <InfoField label="材质" value={line.selectedMaterial || line.actualRequirements?.material || '—'} />
          <InfoField label="工艺" value={line.selectedProcess || line.actualRequirements?.process || '—'} />
          <InfoField label="特殊需求" value={<TextList values={line.selectedSpecialOptions || line.actualRequirements?.specialNotes} />} />
          <InfoField label="刻字 / 印记" value={line.actualRequirements?.engraveText || '—'} />
          {needsEngraving ? (
            <>
              <InfoField label="刻字参考图" value={<TextList values={line.actualRequirements?.engraveImageFiles?.map((file) => file.name)} />} />
              <InfoField label="刻字 PLT 文件" value={<TextList values={line.actualRequirements?.engravePltFiles?.map((file) => file.name)} />} />
            </>
          ) : null}
          <InfoField label="特殊需求备注" value={line.actualRequirements?.remark || '—'} />
          <InfoField label="是否加急" value={line.isUrgent || line.priority === 'urgent' ? '加急' : line.priority === 'vip' ? 'VIP' : line.priority === 'high' ? '高优先' : '否'} />
          <InfoField label="当前负责人" value={line.currentOwner || '待分配'} />
          <InfoField label="是否需要设计" value={(line.requiresDesign ?? line.designInfo?.requiresRemodeling) ? '是' : '否'} />
          <InfoField label="是否需要建模" value={(line.requiresModeling ?? line.designInfo?.requiresRemodeling) ? '是' : '否'} />
          <InfoField label="是否需要出蜡" value={line.requiresWax ? '是' : '否'} />
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
