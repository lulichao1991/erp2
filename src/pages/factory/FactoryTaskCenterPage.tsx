import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageContainer, PageHeader, SectionCard, StatusTag } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { canPerformAction } from '@/services/access/roleCapabilities'
import {
  buildFactoryTaskRows,
  currentFactoryId,
  currentFactoryName,
  factoryTaskTabs,
  filterFactoryTaskRowsByTab,
  type FactoryTaskRow,
  type FactoryTaskTab
} from '@/services/orderLine/orderLineFactory'
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
  [line.actualRequirements?.material || line.selectedMaterial, line.actualRequirements?.sizeNote || line.selectedSpecValue, line.actualRequirements?.process || line.selectedProcess].filter(Boolean).join(' / ') || '待补充'

export const FactoryTaskCenterPage = () => {
  const appData = useAppData()
  const [activeTab, setActiveTab] = useState<FactoryTaskTab>('pending_acceptance')
  const [drafts, setDrafts] = useState<Record<string, FactoryReturnDraft>>({})

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
        factoryStatus: 'in_progress',
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
        factoryStatus: 'in_progress',
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
        factoryStatus: 'pending_feedback',
        factoryNote: '生产完成，等待回传重量与结算资料。'
      }
    })
    setActiveTab('pending_return')
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
        factoryStatus: 'issue',
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
        factoryStatus: 'completed',
        actualMaterial: productionData.actualMaterial,
        totalWeight: productionData.totalWeight ? `${productionData.totalWeight}g` : line.productionInfo?.totalWeight,
        netWeight: productionData.netMetalWeight ? `${productionData.netMetalWeight}g` : line.productionInfo?.netWeight,
        returnedWeight: productionData.totalWeight ? `${productionData.totalWeight}g` : line.productionInfo?.returnedWeight,
        laborCostDetail: productionData.totalLaborCost ? `${productionData.totalLaborCost}` : line.productionInfo?.laborCostDetail,
        factoryShippedAt: returnedAt,
        qualityResult: '待跟单 / 财务确认',
        factoryNote: draft.factoryNote || '工厂已回传生产数据。'
      }
    })
    setActiveTab('returned')
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
      <p className="text-muted">当前工厂：{currentFactoryName}。本页只显示分配给当前工厂的商品行生产任务，不展示客户联系方式、地址、销售价格、定金、尾款、利润或财务备注。</p>

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
              canEdit={canSubmitFactoryReturn}
            />
          ) : (
            <EmptyState title="暂无工厂任务" description="当前视图下没有分配给本工厂的商品行。" />
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
  canEdit: boolean
}) => (
  <div className="table-shell">
    <table className="table">
      <thead>
        <tr>
          <th>生产任务</th>
          <th>生产资料</th>
          <th>文件</th>
          <th>状态</th>
          <th>工厂回传</th>
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
                <strong>{line.productionTaskNo || line.lineCode}</strong>
                <div>{line.name}</div>
                <div className="text-caption">{[line.skuCode, line.styleName, line.versionNo].filter(Boolean).join(' / ')}</div>
                <div className="text-caption">交期：{line.factoryPlannedDueDate || '待确认'}</div>
                {line.isUrgent ? <StatusTag value="加急" /> : null}
              </td>
              <td>
                <div>{getRequirementSummary(line)}</div>
                <div className="text-caption">{line.actualRequirements?.engraveText ? `印记：${line.actualRequirements.engraveText}` : '无印记'}</div>
                <div className="text-caption">{line.actualRequirements?.specialNotes?.join(' / ') || line.actualRequirements?.remark || '无特殊生产备注'}</div>
              </td>
              <td>
                <div className="text-caption">设计文件：{line.designFiles?.map((file) => file.name).join('、') || '无'}</div>
                <div className="text-caption">建模文件：{line.modelingFiles?.map((file) => file.name).join('、') || '无'}</div>
                <div className="text-caption">出蜡文件：{line.waxFiles?.map((file) => file.name).join('、') || '无'}</div>
              </td>
              <td>
                <div className="stack">
                  <StatusTag value={row.productionStatusLabel} />
                  <StatusTag value={row.factoryStatusLabel} />
                </div>
              </td>
              <td>
                <div className="grid two-column-grid">
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
                <label className="field-control spacer-top">
                  <span className="field-label">工厂备注</span>
                  <textarea className="textarea" aria-label={`工厂备注-${line.id}`} value={draft.factoryNote} onChange={(event) => onDraftChange(line, { factoryNote: event.target.value })} />
                </label>
              </td>
              <td>
                <div className="row wrap">
                  <button type="button" className="button secondary small" onClick={() => onAccept(line)} disabled={!canEdit}>
                    接收任务
                  </button>
                  <button type="button" className="button secondary small" onClick={() => onStart(line)} disabled={!canEdit}>
                    标记开始生产
                  </button>
                  <button type="button" className="button secondary small" onClick={() => onComplete(line)} disabled={!canEdit}>
                    标记生产完成
                  </button>
                  <button type="button" className="button secondary small" onClick={() => onSubmitReturn(line)} disabled={!canEdit}>
                    提交回传
                  </button>
                  <button type="button" className="button ghost small" onClick={() => onAbnormal(line)} disabled={!canEdit}>
                    标记异常
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

const FactoryInput = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="field-control">
    <span className="field-label">{label}</span>
    <input className="input" aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} />
  </label>
)
