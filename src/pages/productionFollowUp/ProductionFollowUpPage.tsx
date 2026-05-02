import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageContainer, PageHeader, RiskTag, SectionCard, StatusTag } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { canPerformAction } from '@/services/access/roleCapabilities'
import {
  buildProductionFollowUpRows,
  filterProductionFollowUpRowsByTab,
  productionFollowUpTabs,
  type ProductionFollowUpRow,
  type ProductionFollowUpTab
} from '@/services/orderLine/orderLineProductionFollowUp'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { buildOrderLineStatusPatch } from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine } from '@/types/order-line'

type RowDraft = {
  factoryId: string
  factoryPlannedDueDate: string
}

const formatCurrentTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

const getLineSpecSummary = (line: OrderLine) =>
  [line.selectedMaterial || line.actualRequirements?.material, line.selectedSpecValue, line.selectedProcess || line.actualRequirements?.process]
    .filter(Boolean)
    .join(' / ') || '待补充'

const getProductionNeedSummary = (line: OrderLine) =>
  [
    line.requiresDesign ? '需设计' : null,
    line.requiresModeling ? '需建模' : null,
    line.requiresWax ? '需出蜡' : null,
    line.isUrgent || line.priority === 'urgent' ? '加急' : null
  ]
    .filter(Boolean)
    .join(' / ') || '常规生产'

export const ProductionFollowUpPage = () => {
  const appData = useAppData()
  const [activeTab, setActiveTab] = useState<ProductionFollowUpTab>('review')
  const [rowDrafts, setRowDrafts] = useState<Record<string, RowDraft>>({})
  const [expandedLineId, setExpandedLineId] = useState<string>('')

  const rows = useMemo(() => buildProductionFollowUpRows(appData.orderLines, appData.purchases), [appData.orderLines, appData.purchases])
  const visibleRows = useMemo(() => filterProductionFollowUpRowsByTab(rows, activeTab), [activeTab, rows])
  const canDispatchProduction = canPerformAction(appData.currentUserRole, 'production_dispatch')

  const getDraft = (line: OrderLine): RowDraft => ({
    factoryId: rowDrafts[line.id]?.factoryId ?? line.factoryId ?? '',
    factoryPlannedDueDate: rowDrafts[line.id]?.factoryPlannedDueDate ?? line.factoryPlannedDueDate ?? ''
  })

  const patchLine = (lineId: string, patch: Partial<OrderLine>) => {
    appData.updateOrderLine(lineId, (current) => ({
      ...current,
      ...patch
    }))
  }

  const updateDraft = (lineId: string, patch: Partial<RowDraft>) => {
    setRowDrafts((current) => ({
      ...current,
      [lineId]: {
        factoryId: current[lineId]?.factoryId ?? appData.getOrderLine(lineId)?.factoryId ?? '',
        factoryPlannedDueDate: current[lineId]?.factoryPlannedDueDate ?? appData.getOrderLine(lineId)?.factoryPlannedDueDate ?? '',
        ...patch
      }
    }))
  }

  const saveFactoryPlan = (line: OrderLine) => {
    const draft = getDraft(line)
    patchLine(line.id, {
      factoryId: draft.factoryId.trim() || undefined,
      factoryPlannedDueDate: draft.factoryPlannedDueDate || undefined
    })
  }

  const markMaterialsReady = (line: OrderLine) => {
    patchLine(line.id, {
      ...buildOrderLineStatusPatch('pending_factory_production'),
      productionStatus: 'pending_dispatch'
    })
    setActiveTab('dispatch')
  }

  const dispatchProduction = (line: OrderLine) => {
    const draft = getDraft(line)
    patchLine(line.id, {
      ...buildOrderLineStatusPatch('pending_factory_production'),
      factoryId: draft.factoryId.trim() || line.factoryId,
      factoryPlannedDueDate: draft.factoryPlannedDueDate || line.factoryPlannedDueDate,
      productionSentAt: line.productionSentAt || formatCurrentTime(),
      productionStatus: 'dispatched',
      factoryStatus: 'pending_acceptance'
    })
    setActiveTab('dispatch')
  }

  const markInProduction = (line: OrderLine) => {
    patchLine(line.id, {
      ...buildOrderLineStatusPatch('in_production'),
      productionStatus: 'in_production',
      factoryStatus: 'in_production'
    })
    setActiveTab('producing')
  }

  const markBlocked = (line: OrderLine) => {
    patchLine(line.id, {
      productionStatus: 'blocked',
      factoryStatus: 'abnormal'
    })
    setActiveTab('risk')
  }

  const returnToCustomerService = (line: OrderLine) => {
    patchLine(line.id, {
      ...buildOrderLineStatusPatch('pending_customer_confirmation'),
      productionStatus: 'not_started',
      factoryStatus: 'not_assigned'
    })
  }

  const returnToDesignOrModeling = (line: OrderLine) => {
    if (line.requiresDesign) {
      patchLine(line.id, {
        ...buildOrderLineStatusPatch('pending_design'),
        designStatus: 'revision_requested',
        productionStatus: 'not_started',
        factoryStatus: 'not_assigned'
      })
      return
    }

    patchLine(line.id, {
      ...buildOrderLineStatusPatch('pending_modeling'),
      modelingStatus: 'revision_requested',
      productionStatus: 'not_started',
      factoryStatus: 'not_assigned'
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="生产跟进"
        className="compact-page-header"
        actions={
          <Link to="/order-lines" className="button secondary">
            查看销售中心
          </Link>
        }
      />

      <div className="stack">
        <div className="stats-grid compact-stats">
          {productionFollowUpTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`stat-card compact-stat${activeTab === tab.value ? ' selected' : ''}`}
              aria-label={`切换到${tab.label}`}
              onClick={() => setActiveTab(tab.value)}
            >
              <span className="stat-card-label">{tab.label}</span>
              <span className="stat-card-value">{filterProductionFollowUpRowsByTab(rows, tab.value).length}</span>
            </button>
          ))}
        </div>

        <SectionCard title={productionFollowUpTabs.find((tab) => tab.value === activeTab)?.label || '生产跟进'} className="compact-card">
          {visibleRows.length > 0 ? (
            <ProductionFollowUpTable
              rows={visibleRows}
              getDraft={getDraft}
              onDraftChange={updateDraft}
              onSaveFactoryPlan={saveFactoryPlan}
              onMaterialsReady={markMaterialsReady}
              onDispatchProduction={dispatchProduction}
              onMarkInProduction={markInProduction}
              onMarkBlocked={markBlocked}
              onReturnToCustomerService={returnToCustomerService}
              onReturnToDesignOrModeling={returnToDesignOrModeling}
              expandedLineId={expandedLineId}
              onToggleLine={(lineId) => setExpandedLineId((current) => (current === lineId ? '' : lineId))}
              canEdit={canDispatchProduction}
            />
          ) : (
            <EmptyState title="暂无销售" description="当前视图下没有需要跟进的销售。" />
          )}
        </SectionCard>
      </div>
    </PageContainer>
  )
}

const ProductionFollowUpTable = ({
  rows,
  getDraft,
  onDraftChange,
  onSaveFactoryPlan,
  onMaterialsReady,
  onDispatchProduction,
  onMarkInProduction,
  onMarkBlocked,
  onReturnToCustomerService,
  onReturnToDesignOrModeling,
  expandedLineId,
  onToggleLine,
  canEdit
}: {
  rows: ProductionFollowUpRow[]
  getDraft: (line: OrderLine) => RowDraft
  onDraftChange: (lineId: string, patch: Partial<RowDraft>) => void
  onSaveFactoryPlan: (line: OrderLine) => void
  onMaterialsReady: (line: OrderLine) => void
  onDispatchProduction: (line: OrderLine) => void
  onMarkInProduction: (line: OrderLine) => void
  onMarkBlocked: (line: OrderLine) => void
  onReturnToCustomerService: (line: OrderLine) => void
  onReturnToDesignOrModeling: (line: OrderLine) => void
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
              <span className="text-caption">{[row.purchaseNo, line.sourceProduct?.sourceProductCode, getLineSpecSummary(line)].filter(Boolean).join(' / ')}</span>
            </span>
            <span className="workbench-task-meta">
              <span>跟单 {line.merchandiserId || '未分配'}</span>
              <span>工厂 {draft.factoryId || '未分配'}</span>
              <span>交期 {draft.factoryPlannedDueDate || '待确认'}</span>
            </span>
            <span className="workbench-task-tags">
              <StatusTag value={row.lineStatusLabel} />
              <StatusTag value={row.productionStatusLabel} />
              <StatusTag value={row.factoryStatusLabel} />
              {row.isOverdue ? <RiskTag value="已逾期" /> : null}
              {row.isRisk && !row.isOverdue ? <RiskTag value="异常/阻塞" /> : null}
            </span>
            <span className="workbench-task-toggle">{isExpanded ? '收起' : '展开'}</span>
          </button>

          {isExpanded ? (
            <div className="workbench-task-detail">
              <div className="workbench-detail-grid">
                <section className="workbench-detail-block">
                  <h3>购买记录</h3>
                  <Link to={row.purchase ? `/purchases/${row.purchase.id}` : '/purchases'} className="production-plan-table-link">
                    {row.purchaseNo}
                  </Link>
                  <span className="text-caption">货号：{getOrderLineGoodsNo(line)}</span>
                </section>
                <section className="workbench-detail-block">
                  <h3>生产需求</h3>
                  <p>{getProductionNeedSummary(line)}</p>
                  <span className="text-caption">{line.actualRequirements?.remark || line.actualRequirements?.specialNotes?.join(' / ') || '无特殊备注'}</span>
                </section>
                <section className="workbench-detail-block wide">
                  <h3>工厂计划</h3>
                  <div className="field-grid two">
                    <label className="field-control">
                      <span className="field-label">工厂</span>
                      <input className="input" aria-label={`工厂-${line.id}`} value={draft.factoryId} onChange={(event) => onDraftChange(line.id, { factoryId: event.target.value })} />
                    </label>
                    <label className="field-control">
                      <span className="field-label">计划交期</span>
                      <input
                        className="input"
                        aria-label={`计划交期-${line.id}`}
                        type="date"
                        value={draft.factoryPlannedDueDate}
                        onChange={(event) => onDraftChange(line.id, { factoryPlannedDueDate: event.target.value })}
                      />
                    </label>
                  </div>
                  <button type="button" className="button ghost small spacer-top" onClick={() => onSaveFactoryPlan(line)} disabled={!canEdit}>
                    保存工厂计划
                  </button>
                </section>
              </div>
              <div className="workbench-actions inline">
                <button type="button" className="button secondary small" onClick={() => onMaterialsReady(line)} disabled={!canEdit}>
                  标记资料已齐
                </button>
                <button type="button" className="button secondary small" onClick={() => onDispatchProduction(line)} disabled={!canEdit}>
                  下发生产
                </button>
                <button type="button" className="button secondary small" onClick={() => onMarkInProduction(line)} disabled={!canEdit}>
                  标记生产中
                </button>
                <button type="button" className="button ghost small" onClick={() => onMarkBlocked(line)} disabled={!canEdit}>
                  标记阻塞
                </button>
                <button type="button" className="button ghost small" onClick={() => onReturnToCustomerService(line)} disabled={!canEdit}>
                  退回客服补资料
                </button>
                <button type="button" className="button ghost small" onClick={() => onReturnToDesignOrModeling(line)} disabled={!canEdit}>
                  退回设计/建模修改
                </button>
              </div>
            </div>
          ) : null}
        </article>
      )
    })}
  </div>
)
