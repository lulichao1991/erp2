import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageContainer, PageHeader, RiskTag, SectionCard, StatusTag } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { financePaymentRecordsMock } from '@/mocks/finance-payment-records'
import { inventoryItemsMock, inventoryMovementsMock } from '@/mocks/inventory'
import { canPerformAction } from '@/services/access/roleCapabilities'
import {
  buildFinanceRows,
  calculateFinanceSummary,
  financeTabs,
  filterFinanceRowsByTab,
  isFinanceLineLocked,
  type FinanceRow,
  type FinanceTab
} from '@/services/orderLine/orderLineFinance'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { confirmFinance, lockFinance as lockFinanceWorkflow, markFinanceAbnormal } from '@/services/orderLine/orderLineWorkflow'
import type { FinancePaymentMethod, FinancePaymentRecord, FinancePaymentRecordType } from '@/types/finance'
import type { OrderLine } from '@/types/order-line'

type FinanceDraft = {
  factorySettlementAmount: string
  financeNote: string
  abnormalReason: string
  paymentAmount: string
  paymentMethod: FinancePaymentMethod
  paymentReason: string
  paymentNote: string
}

const formatCurrentTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ')
const formatCurrency = (value?: number) => `¥${Math.round(value ?? 0).toLocaleString('zh-CN')}`
const toDraftValue = (value?: number) => (typeof value === 'number' ? String(value) : '')
const toNumberOrUndefined = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && value.trim() !== '' ? parsed : undefined
}

const financePaymentMethodLabelMap: Record<FinancePaymentMethod, string> = {
  cash: '现金',
  transfer: '转账',
  platform: '平台',
  old_gold: '旧金抵扣',
  refund: '退款'
}

const financePaymentRecordTypeLabelMap: Record<FinancePaymentRecordType, string> = {
  deposit: '定金',
  final_payment: '尾款',
  supplement: '补款',
  refund: '退款',
  old_gold: '旧金'
}

const getRecordTypeForMethod = (method: FinancePaymentMethod): FinancePaymentRecordType => {
  if (method === 'refund') {
    return 'refund'
  }
  if (method === 'old_gold') {
    return 'old_gold'
  }
  return 'supplement'
}

const isRefundPaymentRecord = (record: FinancePaymentRecord) => record.method === 'refund' || record.recordType === 'refund'

const isAdjustmentPaymentRecord = (record: FinancePaymentRecord) => record.recordType === 'supplement' || isRefundPaymentRecord(record)

const formatPaymentRecord = (record: FinancePaymentRecord) => {
  const typeLabel = record.recordType ? financePaymentRecordTypeLabelMap[record.recordType] : financePaymentMethodLabelMap[record.method]
  const amount = isRefundPaymentRecord(record) ? `-${formatCurrency(record.amount)}` : formatCurrency(record.amount)
  const reasonText = record.reason?.trim() ? `，原因：${record.reason}` : isRefundPaymentRecord(record) ? '，原因待补' : ''
  const reviewText = isAdjustmentPaymentRecord(record) ? `，${record.reviewStatus === 'reviewed' ? '已复核' : '待复核'}` : ''
  return `${typeLabel} · ${financePaymentMethodLabelMap[record.method]} ${amount}${reasonText}${reviewText}`
}

const createFinanceDraft = (line: OrderLine): FinanceDraft => ({
  factorySettlementAmount: toDraftValue(line.factorySettlementAmount ?? line.productionData?.totalLaborCost),
  financeNote: line.financeNote ?? '',
  abnormalReason: line.financeAbnormalReason ?? '',
  paymentAmount: '',
  paymentMethod: 'transfer',
  paymentReason: '',
  paymentNote: ''
})

const getFinanceDashboardSummary = (rows: FinanceRow[]) => ({
  dueAmount: rows.reduce((sum, row) => sum + row.dueAmount, 0),
  receivedAmount: rows.reduce((sum, row) => sum + row.receivedAmount, 0),
  refundedAmount: rows.reduce((sum, row) => sum + row.refundedAmount, 0),
  netPaidAmount: rows.reduce((sum, row) => sum + row.paidAmount, 0),
  pendingAmount: rows.reduce((sum, row) => sum + row.pendingAmount, 0),
  pendingSettlementCount: rows.filter((row) => row.line.financeStatus === 'pending').length
})

export const FinanceCenterPage = () => {
  const appData = useAppData()
  const [activeTab, setActiveTab] = useState<FinanceTab>('settlement')
  const [drafts, setDrafts] = useState<Record<string, FinanceDraft>>({})
  const [expandedLineId, setExpandedLineId] = useState<string>('')
  const [paymentRecords, setPaymentRecords] = useState<FinancePaymentRecord[]>(() => structuredClone(financePaymentRecordsMock))

  const rows = useMemo(() => buildFinanceRows(appData.orderLines, appData.purchases, paymentRecords, inventoryItemsMock, inventoryMovementsMock), [appData.orderLines, appData.purchases, paymentRecords])
  const visibleRows = useMemo(() => filterFinanceRowsByTab(rows, activeTab), [activeTab, rows])
  const financeSummary = useMemo(() => getFinanceDashboardSummary(rows), [rows])
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

  const recordPayment = (row: FinanceRow) => {
    if (row.isLocked) {
      return
    }

    const line = row.line
    const draft = getDraft(line)
    const amount = toNumberOrUndefined(draft.paymentAmount)

    if (!amount || amount <= 0) {
      return
    }

    const occurredAt = formatCurrentTime()
    const recordType = getRecordTypeForMethod(draft.paymentMethod)
    const nextRecord: FinancePaymentRecord = {
      id: `finance-payment-${line.id}-${occurredAt.replace(/[^0-9]/g, '')}`,
      orderLineId: line.id,
      purchaseId: row.purchase?.id || line.purchaseId,
      amount,
      method: draft.paymentMethod,
      recordType,
      reviewStatus: recordType === 'supplement' || recordType === 'refund' ? 'pending' : undefined,
      occurredAt,
      reason: draft.paymentReason || undefined,
      note: draft.paymentNote || undefined
    }

    setPaymentRecords((current) => [...current, nextRecord])
    setDrafts((current) => ({
      ...current,
      [line.id]: {
        ...getDraft(line),
        paymentAmount: '',
        paymentReason: '',
        paymentNote: ''
      }
    }))
  }

  const completeRefundReason = (row: FinanceRow) => {
    if (row.isLocked) {
      return
    }

    const line = row.line
    const reason = getDraft(line).paymentReason.trim()

    if (!reason) {
      return
    }

    setPaymentRecords((current) =>
      current.map((record) =>
        record.orderLineId === line.id && isRefundPaymentRecord(record) && !record.reason?.trim()
          ? {
              ...record,
              reason
            }
          : record
      )
    )
    setDrafts((current) => ({
      ...current,
      [line.id]: {
        ...getDraft(line),
        paymentReason: ''
      }
    }))
  }

  const reviewAdjustmentRecords = (row: FinanceRow) => {
    if (row.isLocked || row.paymentRiskLabels.length > 0) {
      return
    }

    const reviewedAt = formatCurrentTime()

    setPaymentRecords((current) =>
      current.map((record) =>
        record.orderLineId === row.line.id && isAdjustmentPaymentRecord(record) && record.reviewStatus !== 'reviewed'
          ? {
              ...record,
              reviewStatus: 'reviewed',
              reviewedAt
            }
          : record
      )
    )
  }

  const resolveRefundException = (row: FinanceRow) => {
    if (row.isLocked) {
      return
    }

    const line = row.line
    const reason = getDraft(line).paymentReason.trim()

    if (!reason || !row.paymentRiskLabels.includes('退款原因未填写')) {
      return
    }

    const reviewedAt = formatCurrentTime()

    setPaymentRecords((current) =>
      current.map((record) => {
        if (record.orderLineId !== line.id || !isAdjustmentPaymentRecord(record)) {
          return record
        }

        return {
          ...record,
          reason: isRefundPaymentRecord(record) && !record.reason?.trim() ? reason : record.reason,
          reviewStatus: 'reviewed',
          reviewedAt
        }
      })
    )
    setDrafts((current) => ({
      ...current,
      [line.id]: {
        ...getDraft(line),
        paymentReason: ''
      }
    }))
  }

  const confirmSettlement = (row: FinanceRow) => {
    if (row.isLocked) {
      return
    }

    const line = row.line
    const draft = getDraft(line)
    const factorySettlementAmount = toNumberOrUndefined(draft.factorySettlementAmount) ?? row.factorySettlementAmount
    const summary = calculateFinanceSummary({
      ...line,
      factorySettlementAmount
    })
    patchLine(line.id, confirmFinance(line, {
      factorySettlementAmount,
      estimatedGrossProfit: summary.estimatedGrossProfit,
      estimatedGrossProfitRate: summary.estimatedGrossProfitRate,
      financeConfirmedAt: formatCurrentTime(),
      financeNote: draft.financeNote || '财务已确认工厂结算。'
    }))
    setActiveTab('confirmed')
  }

  const markAbnormal = (row: FinanceRow) => {
    if (row.isLocked) {
      return
    }

    const line = row.line
    const draft = getDraft(line)
    patchLine(line.id, markFinanceAbnormal(line, draft.abnormalReason || '财务标记异常，等待复核。', draft.financeNote || line.financeNote))
    setActiveTab('abnormal')
  }

  const lockFinance = (line: OrderLine) => {
    if (isFinanceLineLocked(line)) {
      return
    }

    patchLine(line.id, lockFinanceWorkflow(line, getDraft(line).financeNote || line.financeNote || '财务数据已锁定。'))
  }

  return (
    <PageContainer>
      <PageHeader
        title="财务中心"
        className="compact-page-header"
        actions={
          <Link to="/order-lines" className="button secondary">
            查看销售中心
          </Link>
        }
      />

      <SectionCard title="货号财务总览" className="compact-card">
        <div className="stats-grid compact-stats">
          <div className="stat-card compact-stat">
            <span className="stat-card-label">应收总额</span>
            <span className="stat-card-value">{formatCurrency(financeSummary.dueAmount)}</span>
          </div>
          <div className="stat-card compact-stat">
            <span className="stat-card-label">收款总额</span>
            <span className="stat-card-value">{formatCurrency(financeSummary.receivedAmount)}</span>
          </div>
          <div className="stat-card compact-stat">
            <span className="stat-card-label">退款总额</span>
            <span className="stat-card-value">{formatCurrency(financeSummary.refundedAmount)}</span>
          </div>
          <div className="stat-card compact-stat">
            <span className="stat-card-label">待收总额</span>
            <span className="stat-card-value">{formatCurrency(financeSummary.pendingAmount)}</span>
          </div>
          <div className="stat-card compact-stat">
            <span className="stat-card-label">待结算货号</span>
            <span className="stat-card-value">{financeSummary.pendingSettlementCount}</span>
          </div>
        </div>
        <div className="row wrap spacer-top">
          <StatusTag value="一行一货号" />
          <StatusTag value="Purchase 只做归组汇总" />
          <StatusTag value="旧金抵扣关联库存资产" />
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
              onRecordPayment={recordPayment}
              onCompleteRefundReason={completeRefundReason}
              onReviewAdjustmentRecords={reviewAdjustmentRecords}
              onResolveRefundException={resolveRefundException}
              onConfirmSettlement={confirmSettlement}
              onMarkAbnormal={markAbnormal}
              onLock={lockFinance}
              expandedLineId={expandedLineId}
              onToggleLine={(lineId) => setExpandedLineId((current) => (current === lineId ? '' : lineId))}
              canEdit={canConfirmFinance}
            />
          ) : (
            <EmptyState title="暂无财务任务" description="当前视图下没有需要处理的销售。" />
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
  onRecordPayment,
  onCompleteRefundReason,
  onReviewAdjustmentRecords,
  onResolveRefundException,
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
  onRecordPayment: (row: FinanceRow) => void
  onCompleteRefundReason: (row: FinanceRow) => void
  onReviewAdjustmentRecords: (row: FinanceRow) => void
  onResolveRefundException: (row: FinanceRow) => void
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
      const isReadOnly = !canEdit || row.isLocked

      return (
        <article key={line.id} className={`workbench-task-card${isExpanded ? ' expanded' : ''}`}>
          <button type="button" className="workbench-task-summary" aria-expanded={isExpanded} onClick={() => onToggleLine(line.id)}>
            <span className="workbench-task-main">
              <strong>{getOrderLineGoodsNo(line)}</strong>
              <span>{line.name}</span>
              <span className="text-caption">{row.purchaseNo}</span>
            </span>
            <span className="workbench-task-meta">
              <span>应收 {formatCurrency(row.dueAmount)}</span>
              <span>收款 {formatCurrency(row.receivedAmount)}</span>
              <span>退款 {formatCurrency(row.refundedAmount)}</span>
              <span>净收 {formatCurrency(row.paidAmount)}</span>
              <span>待收 {formatCurrency(row.pendingAmount)}</span>
              <span>结算 {formatCurrency(row.factorySettlementAmount)}</span>
              <span>毛利 {formatCurrency(row.estimatedGrossProfit)}</span>
            </span>
            <span className="workbench-task-tags">
              <StatusTag value={row.paymentStatusLabel} />
              {row.pendingPaymentReviewCount > 0 ? <StatusTag value={`待复核 ${row.pendingPaymentReviewCount}`} /> : null}
              <StatusTag value={row.financeStatusLabel} />
              {row.isLocked ? <StatusTag value="财务已锁定" /> : null}
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
                  <h3>收款 / 成本</h3>
                  <span>应收金额：{formatCurrency(row.dueAmount)}</span>
                  <span>收款合计：{formatCurrency(row.receivedAmount)}</span>
                  <span>退款合计：{formatCurrency(row.refundedAmount)}</span>
                  <span>净收金额：{formatCurrency(row.paidAmount)}</span>
                  <span>待收金额：{formatCurrency(row.pendingAmount)}</span>
                  <span>工厂结算：{formatCurrency(row.factorySettlementAmount)}</span>
                  <span className="text-caption">定金分摊：{formatCurrency(line.allocatedDepositAmount)}</span>
                  <span className="text-caption">尾款分摊：{formatCurrency(line.allocatedFinalPaymentAmount)}</span>
                  <span className="text-caption">毛利率 {row.estimatedGrossProfitRate}%</span>
                  <span className="text-caption">
                    收款流水：
                    {row.paymentRecords.length > 0
                      ? row.paymentRecords.map(formatPaymentRecord).join(' / ')
                      : '暂无'}
                  </span>
                </section>
                <section className="workbench-detail-block wide">
                  <h3>商品行成本卡</h3>
                  <div className="field-grid three">
                    <span>成交金额：{formatCurrency(row.costCard.salesAmount)}</span>
                    <span>材料成本：{formatCurrency(row.costCard.materialCost)}</span>
                    <span>主副石成本：{formatCurrency(row.costCard.stoneCost)}</span>
                    <span>工厂结算：{formatCurrency(row.costCard.factorySettlementAmount)}</span>
                    <span>FIFO库存领用成本：{formatCurrency(row.costCard.inventoryFifoCostAmount)}</span>
                    <span>物流成本：{formatCurrency(row.costCard.logisticsCost)}</span>
                    <span>售后成本：{formatCurrency(row.costCard.afterSalesCost)}</span>
                    <span>旧金计入成本：{formatCurrency(row.costCard.oldGoldRecognizedCostAmount)}</span>
                    <span>成本合计：{formatCurrency(row.costCard.totalCost)}</span>
                    <span>预估毛利：{formatCurrency(row.costCard.estimatedGrossProfit)}</span>
                    <span>毛利率：{row.costCard.estimatedGrossProfitRate}%</span>
                  </div>
                  <p className="text-caption">
                    旧金抵扣：{formatCurrency(row.costCard.oldGoldOffsetAmount)}
                    {row.costCard.oldGoldValuationAmount > 0 ? ` / 库存估值：${formatCurrency(row.costCard.oldGoldValuationAmount)}` : ''}
                    {row.costCard.oldGoldInventoryCodes.length > 0 ? ` / 入库资产：${row.costCard.oldGoldInventoryCodes.join('、')}` : row.costCard.oldGoldOffsetAmount > 0 ? ' / 待库管登记入库资产' : ''}
                    {row.costCard.oldGoldOffsetAmount > 0 ? ' / 抵扣流水不自动计入商品行成本' : ''}
                  </p>
                </section>
                <section className="workbench-detail-block wide">
                  <h3>财务处理</h3>
                  <div className="row wrap">{row.riskLabels.length > 0 ? row.riskLabels.map((risk) => <RiskTag key={risk} value={risk} />) : <StatusTag value="无异常" />}</div>
                  {row.isLocked ? <div className="text-caption">财务已锁定，收退款、结算金额、备注和异常处理当前只读。</div> : null}
                  {line.financeAbnormalReason ? <div className="text-caption">{line.financeAbnormalReason}</div> : null}
                  <div className="field-grid three spacer-top">
                    <label className="field-control">
                      <span className="field-label">本次收 / 退款金额</span>
                      <input className="input" aria-label={`本次收款金额-${line.id}`} value={draft.paymentAmount} onChange={(event) => onDraftChange(line, { paymentAmount: event.target.value })} disabled={isReadOnly} />
                    </label>
                    <label className="field-control">
                      <span className="field-label">收 / 退款方式</span>
                      <select className="select" aria-label={`收款方式-${line.id}`} value={draft.paymentMethod} onChange={(event) => onDraftChange(line, { paymentMethod: event.target.value as FinancePaymentMethod })} disabled={isReadOnly}>
                        {Object.entries(financePaymentMethodLabelMap).map(([method, label]) => (
                          <option key={method} value={method}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field-control">
                      <span className="field-label">收 / 退款原因</span>
                      <input className="input" aria-label={`收退款原因-${line.id}`} value={draft.paymentReason} onChange={(event) => onDraftChange(line, { paymentReason: event.target.value })} disabled={isReadOnly} />
                    </label>
                    <label className="field-control">
                      <span className="field-label">收 / 退款备注</span>
                      <input className="input" aria-label={`收款备注-${line.id}`} value={draft.paymentNote} onChange={(event) => onDraftChange(line, { paymentNote: event.target.value })} disabled={isReadOnly} />
                    </label>
                    <label className="field-control">
                      <span className="field-label">工厂结算金额</span>
                      <input className="input" aria-label={`工厂结算金额-${line.id}`} value={draft.factorySettlementAmount} onChange={(event) => onDraftChange(line, { factorySettlementAmount: event.target.value })} disabled={isReadOnly} />
                    </label>
                    <label className="field-control">
                      <span className="field-label">财务备注</span>
                      <textarea className="textarea" aria-label={`财务备注-${line.id}`} value={draft.financeNote} onChange={(event) => onDraftChange(line, { financeNote: event.target.value })} disabled={isReadOnly} />
                    </label>
                    <label className="field-control">
                      <span className="field-label">异常原因</span>
                      <input className="input" aria-label={`异常原因-${line.id}`} value={draft.abnormalReason} onChange={(event) => onDraftChange(line, { abnormalReason: event.target.value })} disabled={isReadOnly} />
                    </label>
                  </div>
                </section>
              </div>
              <div className="workbench-actions inline">
                <button type="button" className="button secondary small" onClick={() => onRecordPayment(row)} disabled={isReadOnly}>
                  记录收 / 退款
                </button>
                <button type="button" className="button secondary small" onClick={() => onCompleteRefundReason(row)} disabled={isReadOnly || !row.paymentRiskLabels.includes('退款原因未填写')}>
                  补齐退款原因
                </button>
                <button type="button" className="button secondary small" onClick={() => onReviewAdjustmentRecords(row)} disabled={isReadOnly || row.pendingPaymentReviewCount === 0 || row.paymentRiskLabels.length > 0}>
                  复核补 / 退款
                </button>
                <button type="button" className="button secondary small" onClick={() => onResolveRefundException(row)} disabled={isReadOnly || !row.paymentRiskLabels.includes('退款原因未填写') || !draft.paymentReason.trim()}>
                  解除退款异常
                </button>
                <button type="button" className="button secondary small" onClick={() => onConfirmSettlement(row)} disabled={isReadOnly}>
                  确认工厂结算
                </button>
                <button type="button" className="button ghost small" onClick={() => onMarkAbnormal(row)} disabled={isReadOnly}>
                  标记财务异常
                </button>
                <button type="button" className="button secondary small" onClick={() => onLock(line)} disabled={isReadOnly}>
                  {row.isLocked ? '财务已锁定' : '锁定财务数据'}
                </button>
              </div>
            </div>
          ) : null}
        </article>
      )
    })}
  </div>
)
