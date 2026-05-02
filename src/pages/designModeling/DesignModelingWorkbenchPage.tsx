import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageContainer, PageHeader, SectionCard, StatusTag } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { canPerformAction } from '@/services/access/roleCapabilities'
import {
  buildDesignModelingRows,
  designModelingTabs,
  filterDesignModelingRowsByTab,
  type DesignModelingRow,
  type DesignModelingTab
} from '@/services/orderLine/orderLineDesignModeling'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { buildOrderLineStatusPatch } from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine, OrderLineUploadedFile } from '@/types/order-line'

type RowDraft = {
  designNote: string
  modelingNote: string
  revisionReason: string
  waxFileName: string
  waxFactorySentAt: string
}

const formatCurrentTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

const createMockFile = (lineId: string, name: string, kind: 'design' | 'modeling' | 'wax'): OrderLineUploadedFile => ({
  id: `${kind}-file-${lineId}-${Date.now()}`,
  name,
  url: `data:text/plain;charset=utf-8,${encodeURIComponent(name)}`
})

const getRequirementSummary = (line: OrderLine) =>
  [line.selectedMaterial || line.actualRequirements?.material, line.selectedSpecValue, line.selectedProcess || line.actualRequirements?.process]
    .filter(Boolean)
    .join(' / ') || '待补充'

export const DesignModelingWorkbenchPage = () => {
  const appData = useAppData()
  const [activeTab, setActiveTab] = useState<DesignModelingTab>('pending_design')
  const [rowDrafts, setRowDrafts] = useState<Record<string, RowDraft>>({})
  const [expandedLineId, setExpandedLineId] = useState<string>('')

  const rows = useMemo(() => buildDesignModelingRows(appData.orderLines), [appData.orderLines])
  const visibleRows = useMemo(() => filterDesignModelingRowsByTab(rows, activeTab), [activeTab, rows])
  const canUpdateDesignModeling = canPerformAction(appData.currentUserRole, 'design_modeling_update')

  const getDraft = (line: OrderLine): RowDraft => ({
    designNote: rowDrafts[line.id]?.designNote ?? line.designNote ?? line.designInfo?.designNote ?? '',
    modelingNote: rowDrafts[line.id]?.modelingNote ?? line.modelingNote ?? '',
    revisionReason: rowDrafts[line.id]?.revisionReason ?? line.revisionReason ?? '',
    waxFileName: rowDrafts[line.id]?.waxFileName ?? '',
    waxFactorySentAt: rowDrafts[line.id]?.waxFactorySentAt ?? line.waxFactorySentAt ?? ''
  })

  const updateDraft = (line: OrderLine, patch: Partial<RowDraft>) => {
    setRowDrafts((current) => ({
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

  const claimDesign = (line: OrderLine) => {
    patchLine(line.id, {
      assignedDesignerId: line.assignedDesignerId || 'designer-current',
      designStatus: line.designStatus === 'completed' ? 'completed' : 'pending'
    })
  }

  const markDesignInProgress = (line: OrderLine) => {
    patchLine(line.id, {
      ...buildOrderLineStatusPatch('pending_design'),
      assignedDesignerId: line.assignedDesignerId || 'designer-current',
      designStatus: 'in_progress'
    })
  }

  const completeDesign = (line: OrderLine) => {
    const draft = getDraft(line)
    patchLine(line.id, {
      ...buildOrderLineStatusPatch(line.requiresModeling ? 'pending_modeling' : 'pending_merchandiser_review'),
      designStatus: 'completed',
      modelingStatus: line.requiresModeling ? 'pending' : line.modelingStatus,
      designNote: draft.designNote,
      designCompletedAt: line.designCompletedAt || formatCurrentTime()
    })
    setActiveTab(line.requiresModeling ? 'pending_modeling' : 'completed')
  }

  const claimModeling = (line: OrderLine) => {
    patchLine(line.id, {
      assignedModelerId: line.assignedModelerId || 'modeler-current',
      modelingStatus: line.modelingStatus === 'completed' ? 'completed' : 'pending'
    })
  }

  const markModelingInProgress = (line: OrderLine) => {
    patchLine(line.id, {
      ...buildOrderLineStatusPatch('pending_modeling'),
      assignedModelerId: line.assignedModelerId || 'modeler-current',
      modelingStatus: 'in_progress'
    })
  }

  const completeModeling = (line: OrderLine) => {
    const draft = getDraft(line)
    patchLine(line.id, {
      ...buildOrderLineStatusPatch('pending_merchandiser_review'),
      modelingStatus: 'completed',
      modelingNote: draft.modelingNote,
      modelingCompletedAt: line.modelingCompletedAt || formatCurrentTime()
    })
    setActiveTab('completed')
  }

  const requestRevision = (line: OrderLine) => {
    const draft = getDraft(line)
    if (line.requiresDesign) {
      patchLine(line.id, {
        ...buildOrderLineStatusPatch('pending_design'),
        designStatus: 'revision_requested',
        revisionReason: draft.revisionReason || '需要重新调整设计稿'
      })
      setActiveTab('revision')
      return
    }

    patchLine(line.id, {
      ...buildOrderLineStatusPatch('pending_modeling'),
      modelingStatus: 'revision_requested',
      revisionReason: draft.revisionReason || '需要重新调整建模文件'
    })
    setActiveTab('revision')
  }

  const recordWaxFile = (line: OrderLine) => {
    const draft = getDraft(line)
    const fileName = draft.waxFileName.trim()
    if (!fileName && !draft.waxFactorySentAt) {
      return
    }

    patchLine(line.id, {
      waxFiles: fileName ? [...(line.waxFiles ?? []), createMockFile(line.id, fileName, 'wax')] : line.waxFiles,
      waxFactorySentAt: draft.waxFactorySentAt || line.waxFactorySentAt
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="设计 / 建模工作台"
        className="compact-page-header"
        actions={
          <Link to="/order-lines" className="button secondary">
            返回销售中心
          </Link>
        }
      />

      <div className="stack">
        <div className="stats-grid compact-stats">
          {designModelingTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`stat-card compact-stat${activeTab === tab.value ? ' selected' : ''}`}
              aria-label={`切换到${tab.label}`}
              onClick={() => setActiveTab(tab.value)}
            >
              <span className="stat-card-label">{tab.label}</span>
              <span className="stat-card-value">{filterDesignModelingRowsByTab(rows, tab.value).length}</span>
            </button>
          ))}
        </div>

        <SectionCard title={designModelingTabs.find((tab) => tab.value === activeTab)?.label || '设计建模任务'} className="compact-card">
          {visibleRows.length > 0 ? (
            <DesignModelingTable
              rows={visibleRows}
              getDraft={getDraft}
              onDraftChange={updateDraft}
              onClaimDesign={claimDesign}
              onDesignInProgress={markDesignInProgress}
              onDesignComplete={completeDesign}
              onClaimModeling={claimModeling}
              onModelingInProgress={markModelingInProgress}
              onModelingComplete={completeModeling}
              onRevision={requestRevision}
              onRecordWax={recordWaxFile}
              expandedLineId={expandedLineId}
              onToggleLine={(lineId) => setExpandedLineId((current) => (current === lineId ? '' : lineId))}
              canEdit={canUpdateDesignModeling}
            />
          ) : (
            <EmptyState title="暂无设计建模任务" description="当前视图下没有需要处理的销售。" />
          )}
        </SectionCard>
      </div>
    </PageContainer>
  )
}

const DesignModelingTable = ({
  rows,
  getDraft,
  onDraftChange,
  onClaimDesign,
  onDesignInProgress,
  onDesignComplete,
  onClaimModeling,
  onModelingInProgress,
  onModelingComplete,
  onRevision,
  onRecordWax,
  expandedLineId,
  onToggleLine,
  canEdit
}: {
  rows: DesignModelingRow[]
  getDraft: (line: OrderLine) => RowDraft
  onDraftChange: (line: OrderLine, patch: Partial<RowDraft>) => void
  onClaimDesign: (line: OrderLine) => void
  onDesignInProgress: (line: OrderLine) => void
  onDesignComplete: (line: OrderLine) => void
  onClaimModeling: (line: OrderLine) => void
  onModelingInProgress: (line: OrderLine) => void
  onModelingComplete: (line: OrderLine) => void
  onRevision: (line: OrderLine) => void
  onRecordWax: (line: OrderLine) => void
  expandedLineId: string
  onToggleLine: (lineId: string) => void
  canEdit: boolean
}) => (
  <div className="workbench-task-list">
    {rows.map((row) => {
      const line = row.line
      const draft = getDraft(line)
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
              <span>设计 {line.assignedDesignerId || '未分配'}</span>
              <span>建模 {line.assignedModelerId || '未分配'}</span>
              <span>文件 {(line.designFiles?.length ?? 0) + (line.modelingFiles?.length ?? 0) + (line.waxFiles?.length ?? 0)}</span>
            </span>
            <span className="workbench-task-tags">
              <StatusTag value={row.designStatusLabel} />
              <StatusTag value={row.modelingStatusLabel} />
              {line.revisionReason ? <StatusTag value="需修改" /> : null}
            </span>
            <span className="workbench-task-toggle">{isExpanded ? '收起' : '展开'}</span>
          </button>

          {isExpanded ? (
            <div className="workbench-task-detail">
              <div className="workbench-detail-grid">
                <section className="workbench-detail-block">
                  <h3>生产需求</h3>
                  <p>{getRequirementSummary(line)}</p>
                  <span className="text-caption">{line.actualRequirements?.engraveText ? `印记：${line.actualRequirements.engraveText}` : '无印记'}</span>
                  <span className="text-caption">{line.actualRequirements?.specialNotes?.join(' / ') || line.actualRequirements?.remark || '无特殊备注'}</span>
                </section>
                <section className="workbench-detail-block">
                  <h3>文件与出蜡</h3>
                  <div className="text-caption">设计文件 {line.designFiles?.length ?? 0} / 建模文件 {line.modelingFiles?.length ?? 0} / 出蜡文件 {line.waxFiles?.length ?? 0}</div>
                  <label className="field-control spacer-top">
                    <span className="field-label">出蜡文件名</span>
                    <input className="input" aria-label={`出蜡文件-${line.id}`} value={draft.waxFileName} onChange={(event) => onDraftChange(line, { waxFileName: event.target.value })} />
                  </label>
                  <label className="field-control spacer-top">
                    <span className="field-label">发送出蜡厂时间</span>
                    <input className="input" aria-label={`发送出蜡厂时间-${line.id}`} value={draft.waxFactorySentAt} onChange={(event) => onDraftChange(line, { waxFactorySentAt: event.target.value })} />
                  </label>
                  <button type="button" className="button ghost small spacer-top" onClick={() => onRecordWax(line)} disabled={!canEdit}>
                    记录出蜡资料
                  </button>
                </section>
                <section className="workbench-detail-block wide">
                  <h3>备注与修改</h3>
                  <div className="field-grid three">
                    <label className="field-control">
                      <span className="field-label">设计备注</span>
                      <textarea className="textarea" aria-label={`设计备注-${line.id}`} value={draft.designNote} onChange={(event) => onDraftChange(line, { designNote: event.target.value })} />
                    </label>
                    <label className="field-control">
                      <span className="field-label">建模备注</span>
                      <textarea className="textarea" aria-label={`建模备注-${line.id}`} value={draft.modelingNote} onChange={(event) => onDraftChange(line, { modelingNote: event.target.value })} />
                    </label>
                    <label className="field-control">
                      <span className="field-label">修改原因</span>
                      <input className="input" aria-label={`修改原因-${line.id}`} value={draft.revisionReason} onChange={(event) => onDraftChange(line, { revisionReason: event.target.value })} />
                    </label>
                  </div>
                </section>
              </div>
              <div className="workbench-actions inline">
                <button type="button" className="button secondary small" onClick={() => onClaimDesign(line)} disabled={!canEdit}>
                  领取设计任务
                </button>
                <button type="button" className="button secondary small" onClick={() => onDesignInProgress(line)} disabled={!canEdit}>
                  标记设计中
                </button>
                <button type="button" className="button secondary small" onClick={() => onDesignComplete(line)} disabled={!canEdit}>
                  标记设计完成
                </button>
                <button type="button" className="button secondary small" onClick={() => onClaimModeling(line)} disabled={!canEdit}>
                  领取建模任务
                </button>
                <button type="button" className="button secondary small" onClick={() => onModelingInProgress(line)} disabled={!canEdit}>
                  标记建模中
                </button>
                <button type="button" className="button secondary small" onClick={() => onModelingComplete(line)} disabled={!canEdit}>
                  标记建模完成
                </button>
                <button type="button" className="button ghost small" onClick={() => onRevision(line)} disabled={!canEdit}>
                  标记需修改
                </button>
              </div>
            </div>
          ) : null}
        </article>
      )
    })}
  </div>
)
