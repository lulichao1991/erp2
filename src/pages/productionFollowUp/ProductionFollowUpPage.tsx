import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageContainer, PageHeader, RiskTag, SectionCard, StatusTag } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import {
  buildProductionFollowUpRows,
  filterProductionFollowUpRowsByTab,
  productionFollowUpTabs,
  type ProductionFollowUpRow,
  type ProductionFollowUpTab
} from '@/services/orderLine/orderLineProductionFollowUp'
import { buildOrderLineStatusPatch } from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine } from '@/types/order-line'

type RowDraft = {
  factoryId: string
  factoryPlannedDueDate: string
}

const formatCurrentTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

const getLineSpecSummary = (line: OrderLine) =>
  [line.selectedMaterial || line.actualRequirements?.material, line.selectedSpecValue || line.actualRequirements?.sizeNote, line.selectedProcess || line.actualRequirements?.process]
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

  const rows = useMemo(() => buildProductionFollowUpRows(appData.orderLines, appData.purchases), [appData.orderLines, appData.purchases])
  const visibleRows = useMemo(() => filterProductionFollowUpRowsByTab(rows, activeTab), [activeTab, rows])

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
            查看商品行中心
          </Link>
        }
      />
      <p className="text-muted">跟单视图只围绕 OrderLine 推进生产审核、下发、生产中、待回传和异常处理。</p>

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
            />
          ) : (
            <EmptyState title="暂无商品行" description="当前视图下没有需要跟进的商品行。" />
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
  onReturnToDesignOrModeling
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
}) => (
  <div className="table-shell">
    <table className="table">
      <thead>
        <tr>
          <th>生产任务</th>
          <th>购买记录</th>
          <th>商品 / 规格</th>
          <th>需求</th>
          <th>工厂计划</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const line = row.line
          const draft = getDraft(line)

          return (
            <tr key={line.id}>
              <td>
                <strong>{line.productionTaskNo || line.lineCode || line.id}</strong>
                <div className="text-caption">{line.lineCode}</div>
              </td>
              <td>
                <Link to={row.purchase ? `/purchases/${row.purchase.id}` : '/purchases'} className="production-plan-table-link">
                  {row.purchaseNo}
                </Link>
                <div className="text-caption">跟单：{line.merchandiserId || '未分配'}</div>
              </td>
              <td>
                <strong>{line.name}</strong>
                <div className="text-caption">{[line.skuCode, line.styleName, line.versionNo].filter(Boolean).join(' / ') || '待维护 SKU'}</div>
                <div className="text-caption">{getLineSpecSummary(line)}</div>
              </td>
              <td>
                <div>{getProductionNeedSummary(line)}</div>
                <div className="text-caption">{line.actualRequirements?.remark || line.actualRequirements?.specialNotes?.join(' / ') || '无特殊备注'}</div>
              </td>
              <td>
                <div className="field-grid two">
                  <label className="field-control">
                    <span className="field-label">工厂</span>
                    <input
                      className="input"
                      aria-label={`工厂-${line.id}`}
                      value={draft.factoryId}
                      onChange={(event) => onDraftChange(line.id, { factoryId: event.target.value })}
                    />
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
                <button type="button" className="button ghost small spacer-top" onClick={() => onSaveFactoryPlan(line)}>
                  保存工厂计划
                </button>
              </td>
              <td>
                <div className="stack">
                  <StatusTag value={row.lineStatusLabel} />
                  <StatusTag value={row.productionStatusLabel} />
                  <StatusTag value={row.factoryStatusLabel} />
                  {row.isOverdue ? <RiskTag value="已逾期" /> : null}
                  {row.isRisk && !row.isOverdue ? <RiskTag value="异常/阻塞" /> : null}
                </div>
              </td>
              <td>
                <div className="row wrap">
                  <button type="button" className="button secondary small" onClick={() => onMaterialsReady(line)}>
                    标记资料已齐
                  </button>
                  <button type="button" className="button secondary small" onClick={() => onDispatchProduction(line)}>
                    下发生产
                  </button>
                  <button type="button" className="button secondary small" onClick={() => onMarkInProduction(line)}>
                    标记生产中
                  </button>
                  <button type="button" className="button ghost small" onClick={() => onMarkBlocked(line)}>
                    标记阻塞
                  </button>
                  <button type="button" className="button ghost small" onClick={() => onReturnToCustomerService(line)}>
                    退回客服补资料
                  </button>
                  <button type="button" className="button ghost small" onClick={() => onReturnToDesignOrModeling(line)}>
                    退回设计/建模修改
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)
