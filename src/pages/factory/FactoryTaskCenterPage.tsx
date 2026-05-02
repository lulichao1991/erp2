import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageContainer, PageHeader, SectionCard, StatusTag } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { canPerformAction } from '@/services/access/roleCapabilities'
import {
  buildFactoryTaskRows,
  currentFactoryId,
  factoryTaskTabs,
  filterFactoryTaskRowsByTab,
  type FactoryTaskRow,
  type FactoryTaskTab
} from '@/services/orderLine/orderLineFactory'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { buildOrderLineStatusPatch } from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine, OrderLineProductionData } from '@/types/order-line'

type FactoryReturnDraft = {
  totalWeight: string
  netMetalWeight: string
  actualMaterial: string
  materialLossNote: string
  mainStoneType: string
  mainStoneQuantity: string
  sideStoneType: string
  sideStoneCount: string
  baseLaborCost: string
  extraLaborCost: string
  extraLaborCostNote: string
  factoryNote: string
  finishedImageName: string
  settlementFileName: string
}

const formatCurrentTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

const toDraftValue = (value?: number) => (typeof value === 'number' ? String(value) : '')
const toNumberOrUndefined = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && value.trim() !== '' ? parsed : undefined
}

const createReturnDraft = (line: OrderLine): FactoryReturnDraft => ({
  totalWeight: toDraftValue(line.productionData?.totalWeight),
  netMetalWeight: toDraftValue(line.productionData?.netMetalWeight),
  actualMaterial: line.productionData?.actualMaterial ?? line.selectedMaterial ?? line.actualRequirements?.material ?? '',
  materialLossNote: line.productionData?.materialLossNote ?? '',
  mainStoneType: line.productionData?.mainStoneType ?? '',
  mainStoneQuantity: toDraftValue(line.productionData?.mainStoneQuantity),
  sideStoneType: line.productionData?.sideStoneType ?? '',
  sideStoneCount: toDraftValue(line.productionData?.sideStoneCount),
  baseLaborCost: toDraftValue(line.productionData?.baseLaborCost),
  extraLaborCost: toDraftValue(line.productionData?.extraLaborCost),
  extraLaborCostNote: line.productionData?.extraLaborCostNote ?? '',
  factoryNote: line.productionData?.factoryNote ?? line.productionInfo?.factoryNote ?? '',
  finishedImageName: line.productionData?.finishedImageUrls?.[0] ?? '',
  settlementFileName: line.productionData?.settlementFileUrls?.[0] ?? ''
})

const getRequirementSummary = (line: OrderLine) =>
  [line.actualRequirements?.material || line.selectedMaterial, line.selectedSpecValue, line.actualRequirements?.process || line.selectedProcess].filter(Boolean).join(' / ') || '待补充'

export const FactoryTaskCenterPage = () => {
  const appData = useAppData()
  const [activeTab, setActiveTab] = useState<FactoryTaskTab>('pending_acceptance')
  const [drafts, setDrafts] = useState<Record<string, FactoryReturnDraft>>({})
  const [expandedLineId, setExpandedLineId] = useState<string>('')
  const [expandedReturnLineId, setExpandedReturnLineId] = useState<string>('')

  const rows = useMemo(() => buildFactoryTaskRows(appData.orderLines, currentFactoryId), [appData.orderLines])
  const visibleRows = useMemo(() => filterFactoryTaskRowsByTab(rows, activeTab), [activeTab, rows])
  const canSubmitFactoryReturn = canPerformAction(appData.currentUserRole, 'factory_return_submit')

  const getDraft = (line: OrderLine) => drafts[line.id] ?? createReturnDraft(line)
  const updateDraft = (line: OrderLine, patch: Partial<FactoryReturnDraft>) => {
    setDrafts((current) => ({
      ...current,
      [line.id]: {
        ...getDraft(line),
        ...patch
      }
    }))
  }

  const patchLine = (lineId: string, patch: Partial<OrderLine>) => {
    appData.updateOrderLine(lineId, (current) => ({
      ...current,
      ...patch
    }))
  }

  const acceptTask = (line: OrderLine) => {
    patchLine(line.id, {
      factoryStatus: 'accepted',
      productionStatus: line.productionStatus === 'not_started' ? 'dispatched' : line.productionStatus,
      productionInfo: {
        ...line.productionInfo,
        feedbackStatus: 'in_progress',
        factoryNote: '工厂已接收任务。'
      }
    })
    setActiveTab('in_production')
  }

  const startProduction = (line: OrderLine) => {
    patchLine(line.id, {
      ...buildOrderLineStatusPatch('in_production'),
      factoryStatus: 'in_production',
      productionStatus: 'in_production',
      productionInfo: {
        ...line.productionInfo,
        feedbackStatus: 'in_progress',
        factoryNote: '工厂已开始生产。'
      }
    })
    setActiveTab('in_production')
  }

  const completeProduction = (line: OrderLine) => {
    const completedAt = formatCurrentTime()
    patchLine(line.id, {
      productionStatus: 'completed',
      productionCompletedAt: line.productionCompletedAt || completedAt,
      productionData: {
        ...line.productionData,
        completedAt,
        actualMaterial: line.productionData?.actualMaterial || line.selectedMaterial || line.actualRequirements?.material
      },
      productionInfo: {
        ...line.productionInfo,
        feedbackStatus: 'pending_feedback',
        factoryNote: '生产完成，等待回传重量与结算资料。'
      }
    })
    setActiveTab('pending_return')
    setExpandedLineId(line.id)
    setExpandedReturnLineId(line.id)
  }

  const markAbnormal = (line: OrderLine) => {
    const draft = getDraft(line)
    patchLine(line.id, {
      factoryStatus: 'abnormal',
      productionStatus: 'blocked',
      productionData: {
        ...line.productionData,
        factoryNote: draft.factoryNote || '工厂标记异常，等待跟单处理。'
      },
      productionInfo: {
        ...line.productionInfo,
        feedbackStatus: 'issue',
        factoryNote: draft.factoryNote || '工厂标记异常，等待跟单处理。'
      }
    })
    setActiveTab('abnormal')
  }

  const submitReturn = (line: OrderLine) => {
    const draft = getDraft(line)
    const baseLaborCost = toNumberOrUndefined(draft.baseLaborCost)
    const extraLaborCost = toNumberOrUndefined(draft.extraLaborCost)
    const totalLaborCost = (baseLaborCost ?? 0) + (extraLaborCost ?? 0)
    const returnedAt = formatCurrentTime()
    const productionData: OrderLineProductionData = {
      ...line.productionData,
      shippedAt: returnedAt,
      completedAt: line.productionData?.completedAt || line.productionCompletedAt || returnedAt,
      totalWeight: toNumberOrUndefined(draft.totalWeight),
      netMetalWeight: toNumberOrUndefined(draft.netMetalWeight),
      actualMaterial: draft.actualMaterial || line.selectedMaterial || line.actualRequirements?.material,
      materialLossNote: draft.materialLossNote,
      mainStoneType: draft.mainStoneType,
      mainStoneQuantity: toNumberOrUndefined(draft.mainStoneQuantity),
      sideStoneType: draft.sideStoneType,
      sideStoneCount: toNumberOrUndefined(draft.sideStoneCount),
      baseLaborCost,
      extraLaborCost,
      extraLaborCostNote: draft.extraLaborCostNote,
      totalLaborCost: totalLaborCost > 0 ? totalLaborCost : undefined,
      factoryNote: draft.factoryNote,
      finishedImageUrls: draft.finishedImageName ? [draft.finishedImageName] : line.productionData?.finishedImageUrls,
      settlementFileUrls: draft.settlementFileName ? [draft.settlementFileName] : line.productionData?.settlementFileUrls
    }

    patchLine(line.id, {
      ...buildOrderLineStatusPatch('factory_returned'),
      factoryStatus: 'returned',
      productionStatus: 'completed',
      financeStatus: 'pending',
      productionCompletedAt: line.productionCompletedAt || returnedAt,
      productionData,
      productionInfo: {
        ...line.productionInfo,
        feedbackStatus: 'completed',
        actualMaterial: productionData.actualMaterial,
        totalWeight: productionData.totalWeight ? `${productionData.totalWeight}g` : line.productionInfo?.totalWeight,
        netWeight: productionData.netMetalWeight ? `${productionData.netMetalWeight}g` : line.productionInfo?.netWeight,
        laborCostDetail: productionData.totalLaborCost ? `${productionData.totalLaborCost}` : line.productionInfo?.laborCostDetail,
        factoryShippedAt: returnedAt,
        qualityResult: '待跟单 / 财务确认',
        factoryNote: draft.factoryNote || '工厂已回传生产数据。'
      }
    })
    setActiveTab('returned')
    setExpandedReturnLineId('')
  }

  return (
    <PageContainer>
      <PageHeader
        title="工厂协同中心"
        className="compact-page-header"
        actions={
          <Link to="/production-follow-up" className="button secondary">
            返回生产跟进
          </Link>
        }
      />

      <div className="stack">
        <div className="stats-grid compact-stats">
          {factoryTaskTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`stat-card compact-stat${activeTab === tab.value ? ' selected' : ''}`}
              aria-label={`切换到${tab.label}`}
              onClick={() => setActiveTab(tab.value)}
            >
              <span className="stat-card-label">{tab.label}</span>
              <span className="stat-card-value">{filterFactoryTaskRowsByTab(rows, tab.value).length}</span>
            </button>
          ))}
        </div>

        <SectionCard title={factoryTaskTabs.find((tab) => tab.value === activeTab)?.label || '工厂任务'} className="compact-card">
          {visibleRows.length > 0 ? (
            <FactoryTaskTable
              rows={visibleRows}
              getDraft={getDraft}
              onDraftChange={updateDraft}
              onAccept={acceptTask}
              onStart={startProduction}
              onComplete={completeProduction}
              onAbnormal={markAbnormal}
              onSubmitReturn={submitReturn}
              expandedReturnLineId={expandedReturnLineId}
              expandedLineId={expandedLineId}
              onToggleLine={(lineId) => setExpandedLineId((current) => (current === lineId ? '' : lineId))}
              onToggleReturnDetails={(lineId) => setExpandedReturnLineId((current) => (current === lineId ? '' : lineId))}
              canEdit={canSubmitFactoryReturn}
            />
          ) : (
            <EmptyState title="暂无工厂任务" description="当前视图下没有分配给本工厂的销售。" />
          )}
        </SectionCard>
      </div>
    </PageContainer>
  )
}

const FactoryTaskTable = ({
  rows,
  getDraft,
  onDraftChange,
  onAccept,
  onStart,
  onComplete,
  onAbnormal,
  onSubmitReturn,
  expandedReturnLineId,
  expandedLineId,
  onToggleLine,
  onToggleReturnDetails,
  canEdit
}: {
  rows: FactoryTaskRow[]
  getDraft: (line: OrderLine) => FactoryReturnDraft
  onDraftChange: (line: OrderLine, patch: Partial<FactoryReturnDraft>) => void
  onAccept: (line: OrderLine) => void
  onStart: (line: OrderLine) => void
  onComplete: (line: OrderLine) => void
  onAbnormal: (line: OrderLine) => void
  onSubmitReturn: (line: OrderLine) => void
  expandedReturnLineId: string
  expandedLineId: string
  onToggleLine: (lineId: string) => void
  onToggleReturnDetails: (lineId: string) => void
  canEdit: boolean
}) => (
  <div className="workbench-task-list">
    {rows.map((row) => {
      const line = row.line
      const draft = getDraft(line)
      const canShowReturnForm = line.productionStatus === 'completed' || line.factoryStatus === 'returned'
      const isReturnExpanded = expandedReturnLineId === line.id
      const isExpanded = expandedLineId === line.id

      return (
        <article key={line.id} className={`workbench-task-card${isExpanded ? ' expanded' : ''}`}>
          <button type="button" className="workbench-task-summary" aria-expanded={isExpanded} onClick={() => onToggleLine(line.id)}>
            <span className="workbench-task-main">
              <strong>{getOrderLineGoodsNo(line)}</strong>
              <span>{line.name}</span>
              <span className="text-caption">{[line.sourceProduct?.sourceProductCode, line.versionNo].filter(Boolean).join(' / ') || getRequirementSummary(line)}</span>
            </span>
            <span className="workbench-task-meta">
              <span>交期 {line.factoryPlannedDueDate || '待确认'}</span>
              <span>文件 {(line.designFiles?.length ?? 0) + (line.modelingFiles?.length ?? 0) + (line.waxFiles?.length ?? 0)}</span>
            </span>
            <span className="workbench-task-tags">
              <StatusTag value={row.productionStatusLabel} />
              <StatusTag value={row.factoryStatusLabel} />
              {line.isUrgent ? <StatusTag value="加急" /> : null}
            </span>
            <span className="workbench-task-toggle">{isExpanded ? '收起' : '展开'}</span>
          </button>

          {isExpanded ? (
            <div className="workbench-task-detail">
              <div className="workbench-detail-grid">
                <section className="workbench-detail-block">
                  <h3>生产资料</h3>
                  <p>{getRequirementSummary(line)}</p>
                  <span className="text-caption">{line.actualRequirements?.engraveText ? `印记：${line.actualRequirements.engraveText}` : '无印记'}</span>
                  <span className="text-caption">{line.actualRequirements?.specialNotes?.join(' / ') || line.actualRequirements?.remark || '无特殊生产备注'}</span>
                </section>
                <section className="workbench-detail-block">
                  <h3>文件</h3>
                  <span className="text-caption">设计文件：{line.designFiles?.map((file) => file.name).join('、') || '无'}</span>
                  <span className="text-caption">建模文件：{line.modelingFiles?.map((file) => file.name).join('、') || '无'}</span>
                  <span className="text-caption">出蜡文件：{line.waxFiles?.map((file) => file.name).join('、') || '无'}</span>
                </section>
                <section className="workbench-detail-block wide">
                  <h3>工厂回传</h3>
                  {canShowReturnForm && isReturnExpanded ? (
                    <div className="factory-return-panel">
                      <div className="factory-return-panel-header">
                        <strong>回传详情</strong>
                        <button type="button" className="button ghost small" onClick={() => onToggleReturnDetails(line.id)}>
                          收起回传详情
                        </button>
                      </div>
                      <div className="factory-return-grid">
                        <FactoryInput label="总重" value={draft.totalWeight} onChange={(value) => onDraftChange(line, { totalWeight: value })} />
                        <FactoryInput label="净金重" value={draft.netMetalWeight} onChange={(value) => onDraftChange(line, { netMetalWeight: value })} />
                        <FactoryInput label="实际材质" value={draft.actualMaterial} onChange={(value) => onDraftChange(line, { actualMaterial: value })} />
                        <FactoryInput label="主石种类" value={draft.mainStoneType} onChange={(value) => onDraftChange(line, { mainStoneType: value })} />
                        <FactoryInput label="主石数量" value={draft.mainStoneQuantity} onChange={(value) => onDraftChange(line, { mainStoneQuantity: value })} />
                        <FactoryInput label="辅石种类" value={draft.sideStoneType} onChange={(value) => onDraftChange(line, { sideStoneType: value })} />
                        <FactoryInput label="辅石颗数" value={draft.sideStoneCount} onChange={(value) => onDraftChange(line, { sideStoneCount: value })} />
                        <FactoryInput label="基础工费" value={draft.baseLaborCost} onChange={(value) => onDraftChange(line, { baseLaborCost: value })} />
                        <FactoryInput label="附加工费" value={draft.extraLaborCost} onChange={(value) => onDraftChange(line, { extraLaborCost: value })} />
                        <FactoryInput label="成品图文件" value={draft.finishedImageName} onChange={(value) => onDraftChange(line, { finishedImageName: value })} />
                        <FactoryInput label="结算单文件" value={draft.settlementFileName} onChange={(value) => onDraftChange(line, { settlementFileName: value })} />
                      </div>
                      <label className="field-control">
                        <span className="field-label">工厂备注</span>
                        <textarea className="textarea" aria-label={`工厂备注-${line.id}`} value={draft.factoryNote} onChange={(event) => onDraftChange(line, { factoryNote: event.target.value })} />
                      </label>
                    </div>
                  ) : (
                    <div className="factory-return-summary">
                      <strong>{canShowReturnForm ? '可填写回传详情' : '待生产完成后回传'}</strong>
                      <span className="muted-block">
                        {canShowReturnForm ? '展开后填写重量、工费、附件和工厂备注。' : '先接收任务并标记开始生产，完成后再填写重量、工费和附件。'}
                      </span>
                      {canShowReturnForm ? (
                        <button type="button" className="button secondary small" onClick={() => onToggleReturnDetails(line.id)}>
                          展开回传详情
                        </button>
                      ) : null}
                    </div>
                  )}
                </section>
              </div>
              <div className="workbench-actions inline">
                <button type="button" className="button secondary small" onClick={() => onAccept(line)} disabled={!canEdit}>
                  接收任务
                </button>
                <button type="button" className="button secondary small" onClick={() => onStart(line)} disabled={!canEdit}>
                  标记开始生产
                </button>
                <button type="button" className="button secondary small" onClick={() => onComplete(line)} disabled={!canEdit}>
                  标记生产完成
                </button>
                <button type="button" className="button secondary small" onClick={() => onSubmitReturn(line)} disabled={!canEdit || !canShowReturnForm}>
                  提交回传
                </button>
                <button type="button" className="button ghost small" onClick={() => onAbnormal(line)} disabled={!canEdit}>
                  标记异常
                </button>
              </div>
            </div>
          ) : null}
        </article>
      )
    })}
  </div>
)

const FactoryInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="field-control">
    <span className="field-label">{label}</span>
    <input className="input" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} />
  </label>
)
