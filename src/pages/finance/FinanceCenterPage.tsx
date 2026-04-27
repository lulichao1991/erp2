import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageContainer, PageHeader, RiskTag, SectionCard, StatusTag } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { canPerformAction } from '@/services/access/roleCapabilities'
import {
  buildFinanceRows,
  calculateFinanceSummary,
  financeTabs,
  filterFinanceRowsByTab,
  type FinanceRow,
  type FinanceTab
} from '@/services/orderLine/orderLineFinance'
import { buildOrderLineStatusPatch } from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine } from '@/types/order-line'

type FinanceDraft = {
  factorySettlementAmount: string
  financeNote: string
  abnormalReason: string
}

const formatCurrentTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ')
const formatCurrency = (value?: number) => `¥${Math.round(value ?? 0).toLocaleString('zh-CN')}`
const toDraftValue = (value?: number) => (typeof value === 'number' ? String(value) : '')
const toNumberOrUndefined = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && value.trim() !== '' ? parsed : undefined
}

const createFinanceDraft = (line: OrderLine): FinanceDraft => ({
  factorySettlementAmount: toDraftValue(line.factorySettlementAmount ?? line.productionData?.totalLaborCost),
  financeNote: line.financeNote ?? '',
  abnormalReason: line.financeAbnormalReason ?? ''
})

export const FinanceCenterPage = () => {
  const appData = useAppData()
  const [activeTab, setActiveTab] = useState<FinanceTab>('settlement')
  const [drafts, setDrafts] = useState<Record<string, FinanceDraft>>({})
  const [expandedLineId, setExpandedLineId] = useState<string>('')

  const rows = useMemo(() => buildFinanceRows(appData.orderLines, appData.purchases), [appData.orderLines, appData.purchases])
  const visibleRows = useMemo(() => filterFinanceRowsByTab(rows, activeTab), [activeTab, rows])
  const purchase = appData.getPurchase('o-202604-001')
  const canConfirmFinance = canPerformAction(appData.currentUserRole, 'finance_confirm')

  const getDraft = (line: OrderLine) => drafts[line.id] ?? createFinanceDraft(line)
  const updateDraft = (line: OrderLine, patch: Partial<FinanceDraft>) => {
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

  const confirmDeposit = () => {
    if (!purchase) {
      return
    }
    appData.updatePurchase(purchase.id, (current) => ({
      ...current,
      finance: current.finance
        ? {
            ...current.finance,
            depositStatus: 'confirmed',
            financeNote: current.finance.financeNote || '定金已确认。'
          }
        : current.finance
    }))
  }

  const confirmFinalPayment = () => {
    if (!purchase) {
      return
    }
    appData.updatePurchase(purchase.id, (current) => ({
      ...current,
      finance: current.finance
        ? {
            ...current.finance,
            finalPaymentStatus: 'confirmed',
            financeNote: '尾款已确认。'
          }
        : current.finance
    }))
  }

  const confirmSettlement = (row: FinanceRow) => {
    const line = row.line
    const draft = getDraft(line)
    const factorySettlementAmount = toNumberOrUndefined(draft.factorySettlementAmount) ?? row.factorySettlementAmount
    const summary = calculateFinanceSummary({
      ...line,
      factorySettlementAmount
    })
    patchLine(line.id, {
      ...buildOrderLineStatusPatch('ready_to_ship'),
      factorySettlementAmount,
      estimatedGrossProfit: summary.estimatedGrossProfit,
      estimatedGrossProfitRate: summary.estimatedGrossProfitRate,
      financeStatus: 'confirmed',
      financeConfirmedAt: formatCurrentTime(),
      financeNote: draft.financeNote || '财务已确认工厂结算。',
      financeLocked: true
    })
    setActiveTab('confirmed')
  }

  const markAbnormal = (row: FinanceRow) => {
    const line = row.line
    const draft = getDraft(line)
    patchLine(line.id, {
      financeStatus: 'abnormal',
      financeAbnormalReason: draft.abnormalReason || '财务标记异常，等待复核。',
      financeNote: draft.financeNote || line.financeNote,
      financeLocked: false
    })
    setActiveTab('abnormal')
  }

  const lockFinance = (line: OrderLine) => {
    patchLine(line.id, {
      financeLocked: true,
      financeNote: getDraft(line).financeNote || line.financeNote || '财务数据已锁定。'
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="财务中心"
        className="compact-page-header"
        actions={
          <Link to="/order-lines" className="button secondary">
            查看商品行中心
          </Link>
        }
      />

      <SectionCard title="购买记录收款摘要" className="compact-card">
        <div className="stats-grid compact-stats">
          <div className="stat-card compact-stat">
            <span className="stat-card-label">应收金额</span>
            <span className="stat-card-value">{formatCurrency(purchase?.finance?.dealPrice)}</span>
          </div>
          <div className="stat-card compact-stat">
            <span className="stat-card-label">已收定金</span>
            <span className="stat-card-value">{formatCurrency(purchase?.finance?.depositAmount)}</span>
          </div>
          <div className="stat-card compact-stat">
            <span className="stat-card-label">待确认尾款</span>
            <span className="stat-card-value">{formatCurrency(purchase?.finance?.balanceAmount)}</span>
          </div>
        </div>
        <div className="row wrap spacer-top">
          <StatusTag value={`定金：${purchase?.finance?.depositStatus === 'confirmed' ? '已确认' : '待确认'}`} />
          <StatusTag value={`尾款：${purchase?.finance?.finalPaymentStatus === 'confirmed' ? '已确认' : '待确认'}`} />
          <button type="button" className="button secondary small" onClick={confirmDeposit} disabled={!canConfirmFinance}>
            确认定金
          </button>
          <button type="button" className="button secondary small" onClick={confirmFinalPayment} disabled={!canConfirmFinance}>
            确认尾款
          </button>
        </div>
      </SectionCard>

      <div className="stack spacer-top">
        <div className="stats-grid compact-stats">
          {financeTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`stat-card compact-stat${activeTab === tab.value ? ' selected' : ''}`}
              aria-label={`切换到${tab.label}`}
              onClick={() => setActiveTab(tab.value)}
            >
              <span className="stat-card-label">{tab.label}</span>
              <span className="stat-card-value">{filterFinanceRowsByTab(rows, tab.value).length}</span>
            </button>
          ))}
        </div>

        <SectionCard title={financeTabs.find((tab) => tab.value === activeTab)?.label || '财务任务'} className="compact-card">
          {visibleRows.length > 0 ? (
            <FinanceTable
              rows={visibleRows}
              getDraft={getDraft}
              onDraftChange={updateDraft}
              onConfirmSettlement={confirmSettlement}
              onMarkAbnormal={markAbnormal}
              onLock={lockFinance}
              expandedLineId={expandedLineId}
              onToggleLine={(lineId) => setExpandedLineId((current) => (current === lineId ? '' : lineId))}
              canEdit={canConfirmFinance}
            />
          ) : (
            <EmptyState title="暂无财务任务" description="当前视图下没有需要处理的商品行。" />
          )}
        </SectionCard>
      </div>
    </PageContainer>
  )
}

const FinanceTable = ({
  rows,
  getDraft,
  onDraftChange,
  onConfirmSettlement,
  onMarkAbnormal,
  onLock,
  expandedLineId,
  onToggleLine,
  canEdit
}: {
  rows: FinanceRow[]
  getDraft: (line: OrderLine) => FinanceDraft
  onDraftChange: (line: OrderLine, patch: Partial<FinanceDraft>) => void
  onConfirmSettlement: (row: FinanceRow) => void
  onMarkAbnormal: (row: FinanceRow) => void
  onLock: (line: OrderLine) => void
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
              <strong>{line.productionTaskNo || line.lineCode}</strong>
              <span>{line.name}</span>
              <span className="text-caption">{row.purchaseNo}</span>
            </span>
            <span className="workbench-task-meta">
              <span>销售 {formatCurrency(row.salesAmount)}</span>
              <span>结算 {formatCurrency(row.factorySettlementAmount)}</span>
              <span>毛利 {formatCurrency(row.estimatedGrossProfit)}</span>
            </span>
            <span className="workbench-task-tags">
              <StatusTag value={row.financeStatusLabel} />
              {row.riskLabels.slice(0, 2).map((risk) => (
                <RiskTag key={risk} value={risk} />
              ))}
              {row.riskLabels.length === 0 ? <StatusTag value="无异常" /> : null}
            </span>
            <span className="workbench-task-toggle">{isExpanded ? '收起' : '展开'}</span>
          </button>

          {isExpanded ? (
            <div className="workbench-task-detail">
              <div className="workbench-detail-grid">
                <section className="workbench-detail-block">
                  <h3>工厂回传</h3>
                  <span>总重：{line.productionData?.totalWeight ?? '待回传'}</span>
                  <span>净金重：{line.productionData?.netMetalWeight ?? '待回传'}</span>
                  <span>材质：{line.productionData?.actualMaterial || '待回传'}</span>
                  <span className="text-caption">工费：{formatCurrency(line.productionData?.totalLaborCost)}</span>
                </section>
                <section className="workbench-detail-block">
                  <h3>销售 / 成本</h3>
                  <span>销售金额：{formatCurrency(row.salesAmount)}</span>
                  <span>工厂结算：{formatCurrency(row.factorySettlementAmount)}</span>
                  <span className="text-caption">定金分摊：{formatCurrency(line.allocatedDepositAmount)}</span>
                  <span className="text-caption">尾款分摊：{formatCurrency(line.allocatedFinalPaymentAmount)}</span>
                  <span className="text-caption">毛利率 {row.estimatedGrossProfitRate}%</span>
                </section>
                <section className="workbench-detail-block wide">
                  <h3>财务处理</h3>
                  <div className="row wrap">{row.riskLabels.length > 0 ? row.riskLabels.map((risk) => <RiskTag key={risk} value={risk} />) : <StatusTag value="无异常" />}</div>
                  {line.financeAbnormalReason ? <div className="text-caption">{line.financeAbnormalReason}</div> : null}
                  <div className="field-grid three spacer-top">
                    <label className="field-control">
                      <span className="field-label">工厂结算金额</span>
                      <input className="input" aria-label={`工厂结算金额-${line.id}`} value={draft.factorySettlementAmount} onChange={(event) => onDraftChange(line, { factorySettlementAmount: event.target.value })} />
                    </label>
                    <label className="field-control">
                      <span className="field-label">财务备注</span>
                      <textarea className="textarea" aria-label={`财务备注-${line.id}`} value={draft.financeNote} onChange={(event) => onDraftChange(line, { financeNote: event.target.value })} />
                    </label>
                    <label className="field-control">
                      <span className="field-label">异常原因</span>
                      <input className="input" aria-label={`异常原因-${line.id}`} value={draft.abnormalReason} onChange={(event) => onDraftChange(line, { abnormalReason: event.target.value })} />
                    </label>
                  </div>
                </section>
              </div>
              <div className="workbench-actions inline">
                <button type="button" className="button secondary small" onClick={() => onConfirmSettlement(row)} disabled={!canEdit}>
                  确认工厂结算
                </button>
                <button type="button" className="button ghost small" onClick={() => onMarkAbnormal(row)} disabled={!canEdit}>
                  标记财务异常
                </button>
                <button type="button" className="button secondary small" onClick={() => onLock(line)} disabled={!canEdit}>
                  锁定财务数据
                </button>
              </div>
            </div>
          ) : null}
        </article>
      )
    })}
  </div>
)
