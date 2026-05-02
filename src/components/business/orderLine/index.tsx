import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { SourceProductDrawer, type SourceProductCompareValue } from '@/components/business/sourceProduct'
import { CopyableText, EmptyState, InfoField, LargeModal, RiskTag, SideDrawer, StatusTag, TimePressureBadge } from '@/components/common'
import { afterSalesMock, customersMock, logisticsMock } from '@/mocks'
import { mockProducts } from '@/mocks/products'
import {
  getOrderLineFactoryStatus,
  getOrderLineFinanceStatus,
  getOrderLineDesignStatus,
  getOrderLineLineStatus,
  getOrderLineModelingStatus,
  getOrderLineLineStatusLabel,
  getOrderLineProductionStatus,
  productionWorkflowStatusLabelMap,
  designWorkflowStatusLabelMap,
  modelingWorkflowStatusLabelMap
} from '@/services/orderLine/orderLineWorkflow'
import { hasEngravingRequirement } from '@/services/orderLine/orderLineCustomerService'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { getOrderLineRisks, getProductionDelayStatus } from '@/services/orderLine/orderLineRiskSelectors'
import {
  buildOrderLineDesignModelingDraft,
  buildOrderLineDetailsDraft,
  buildOrderLineOutsourceDraft,
  buildOrderLineProductionDraft,
  type OrderLineCenterFilters,
  type OrderLineDesignModelingDraft,
  type OrderLineDetailsDraft,
  type OrderLineOutsourceDraft,
  type OrderLineProductionDraft,
  type OrderLineRow
} from '@/services/orderLine/orderLineWorkspace'
import {
  activeAfterSalesStatuses,
  categoryLabelMap,
  categoryOptions,
  designStatusOptions,
  getAfterSalesStatusLabel,
  getFeedbackStatusLabel,
  getOutsourceStatusLabel,
  modelingStatusOptions,
  outsourceStatusOptions,
  priorityOptions,
  productionStatusOptions,
  quickViewOptions,
  statusFilterOptions
} from '@/components/business/orderLine/orderLineOptions'
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
  OrderLineLineStatus,
  OrderLineLog,
  OrderLinePriority,
  OrderLineWorkflowDesignStatus,
  OrderLineWorkflowModelingStatus,
  OrderLineUploadedFile
} from '@/types/order-line'
import type { Product } from '@/types/product'
import type { Customer } from '@/types/customer'
import type { Purchase } from '@/types/purchase'
import type { AfterSalesCase, LogisticsRecord } from '@/types/supporting-records'

export type { OrderLineCenterFilters, OrderLineRow } from '@/services/orderLine/orderLineWorkspace'

type OrderLineDetailsUpdateHandler = (lineId: string, draft: OrderLineDetailsDraft) => void
type OrderLineDesignModelingUpdateHandler = (lineId: string, draft: OrderLineDesignModelingDraft) => void

type OrderLineOutsourceUpdateHandler = (lineId: string, draft: OrderLineOutsourceDraft) => void

type OrderLineProductionUpdateHandler = (lineId: string, draft: OrderLineProductionDraft) => void

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

const getFactorySummary = (line: OrderLine) =>
  line.outsourceInfo?.supplierName && line.outsourceInfo.supplierName !== '待定' ? line.outsourceInfo.supplierName : '待确认工厂'

const getProductionTotalWeight = (line: OrderLine) => line.productionInfo?.totalWeight || ''

const getLineRiskLabels = (line: OrderLine, afterSalesCases: AfterSalesCase[] = afterSalesMock) => {
  return getOrderLineRisks(line, { afterSalesCases, dueDate: line.promisedDate }).map((risk) => risk.label)
}

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && Boolean(target.closest('a, button, input, select, textarea, label'))

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

const buildOrderLineSourceProductCompareValue = (line: OrderLine): SourceProductCompareValue => ({
  sourceLabel: `${getOrderLineGoodsNo(line)} ${getOrderLineDisplayName(line)}`,
  specValue: line.selectedSpecValue || line.sourceProduct?.sourceSpecValue,
  material: line.selectedMaterial || line.actualRequirements?.material,
  process: line.selectedProcess || line.actualRequirements?.process,
  specialOptions: line.selectedSpecialOptions
})

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

const getUploadedFileNames = (files?: OrderLineUploadedFile[], fallback?: string) => {
  const names = files?.map((file) => file.name).filter(Boolean) ?? []
  const fallbackName = fallback?.trim()

  return names.length > 0 ? names : fallbackName ? [fallbackName] : []
}

const OrderLineDetailsSection = ({
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

const OrderLineOutsourceSection = ({
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

const OrderLineDesignModelingSection = ({
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

const OrderLineProductionSection = ({
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

export const OrderLineFilterBar = ({
  value,
  onChange
}: {
  value: OrderLineCenterFilters
  onChange: (next: OrderLineCenterFilters) => void
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  return (
    <section className="section-card compact-card order-line-filter-card" aria-label="销售筛选">
      <div className="order-line-filter-toolbar">
        <div className="order-line-filter-strip">
          {quickViewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`button small ${value.quickView === option.value ? 'primary' : 'ghost'}`}
              onClick={() => onChange({ ...value, quickView: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button type="button" className="button secondary small" onClick={() => setAdvancedOpen((current) => !current)}>
          {advancedOpen ? '收起筛选' : '展开筛选'}
        </button>
      </div>
      <div className="order-line-filter-primary">
        <div className="field-control">
          <label className="field-label">搜索货号 / 款式名称 / 客户 / 购买记录 / 平台单号</label>
          <input
            className="input"
            aria-label="搜索货号 / 款式名称 / 客户 / 购买记录 / 平台单号"
            value={value.keyword}
            onChange={(event) => onChange({ ...value, keyword: event.target.value })}
            placeholder="例如：RING-SH-016 / 山形素圈戒指 / 张三"
          />
        </div>
        <div className="field-control">
          <label className="field-label">状态筛选</label>
          <select className="select" aria-label="状态筛选" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}>
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {advancedOpen ? (
        <div className="field-grid three order-line-filter-advanced">
          <div className="field-control">
            <label className="field-label">品类筛选</label>
            <select className="select" aria-label="品类筛选" value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value })}>
              <option value="all">全部品类</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field-control">
            <label className="field-label">负责人筛选</label>
            <input
              className="input"
              aria-label="负责人筛选"
              value={value.owner}
              onChange={(event) => onChange({ ...value, owner: event.target.value })}
              placeholder="例如：王客服 / 陈设计"
            />
          </div>
          <div className="field-control">
            <label className="field-label">是否加急</label>
            <select className="select" aria-label="是否加急筛选" value={value.urgent} onChange={(event) => onChange({ ...value, urgent: event.target.value as OrderLineCenterFilters['urgent'] })}>
              <option value="all">全部</option>
              <option value="yes">加急</option>
              <option value="no">非加急</option>
            </select>
          </div>
          <div className="field-control">
            <label className="field-label">是否售后中</label>
            <select className="select" aria-label="是否售后中" value={value.afterSales} onChange={(event) => onChange({ ...value, afterSales: event.target.value as OrderLineCenterFilters['afterSales'] })}>
              <option value="all">全部</option>
              <option value="yes">售后中</option>
              <option value="no">无活跃售后</option>
            </select>
          </div>
          <div className="field-control">
            <label className="field-label">是否超期</label>
            <select className="select" aria-label="是否超期" value={value.overdue} onChange={(event) => onChange({ ...value, overdue: event.target.value as OrderLineCenterFilters['overdue'] })}>
              <option value="all">全部</option>
              <option value="yes">已超期</option>
              <option value="no">未超期</option>
            </select>
          </div>
          <div className="field-control">
            <label className="field-label">工厂筛选</label>
            <input
              className="input"
              aria-label="工厂筛选"
              value={value.factory}
              onChange={(event) => onChange({ ...value, factory: event.target.value })}
              placeholder="例如：苏州金工厂"
            />
          </div>
          <div className="field-control">
            <label className="field-label">购买记录筛选</label>
            <input
              className="input"
              aria-label="购买记录筛选"
              value={value.purchase}
              onChange={(event) => onChange({ ...value, purchase: event.target.value })}
              placeholder="例如：PUR-202604-001"
            />
          </div>
          <div className="field-control">
            <label className="field-label">客户筛选</label>
            <input
              className="input"
              aria-label="客户筛选"
              value={value.customer}
              onChange={(event) => onChange({ ...value, customer: event.target.value })}
              placeholder="例如：张三 / 手机号"
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}

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
