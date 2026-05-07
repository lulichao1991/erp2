import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageContainer, PageHeader, SectionCard, StatusTag } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { InventoryDetail, InventoryLocationSummaryTable, InventoryTable, MovementTable } from './InventoryListSections'
import {
  applyInventoryMovement,
  applyInventoryReview,
  applyInventoryStocktake,
  buildInventoryLocationSummaries,
  buildInventoryRows,
  buildInventorySummary,
  filterInventoryRows,
  getInventoryWorkbenchBadges,
  inventoryConditionLabelMap,
  inventoryMovementTypeLabelMap,
  inventorySourceTypeLabelMap,
  inventoryStatusLabelMap,
  type InventoryFilters,
  type InventoryQuickView
} from '@/services/inventory/inventorySelectors'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import type { InventoryBatch, InventoryItem, InventoryItemCondition, InventoryItemSourceType, InventoryItemStatus, InventoryMovement, InventoryMovementType } from '@/types/inventory'
import type { OrderLine } from '@/types/order-line'

const initialFilters: InventoryFilters = {
  keyword: '',
  quickView: 'all',
  sourceType: 'all',
  status: 'all',
  condition: 'all',
  location: ''
}

const sourceOptions: Array<{ value: InventoryItemSourceType | 'all'; label: string }> = [
  { value: 'all', label: '全部来源' },
  { value: 'design_sample', label: '设计留样' },
  { value: 'customer_return', label: '客户退货' },
  { value: 'old_gold', label: '旧金抵扣' },
  { value: 'stock_purchase', label: '常备采购' },
  { value: 'consignment', label: '寄售库存' },
  { value: 'other', label: '其他库存' }
]

const statusOptions: Array<{ value: InventoryItemStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'in_stock', label: '在库' },
  { value: 'reserved', label: '已占用' },
  { value: 'outbound', label: '已出库' },
  { value: 'scrapped', label: '已报废' }
]

const conditionOptions: Array<{ value: InventoryItemCondition | 'all'; label: string }> = [
  { value: 'all', label: '全部成色' },
  { value: 'new', label: '全新' },
  { value: 'sample', label: '样品' },
  { value: 'returned', label: '退货' },
  { value: 'repair_needed', label: '待检修' },
  { value: 'defective', label: '瑕疵' }
]

const quickViewOptions: Array<{ value: InventoryQuickView; label: string; description: string }> = [
  { value: 'all', label: '全部库存', description: '所有库存资产' },
  { value: 'available', label: '可领用库存', description: '当前可被领用的库存' },
  { value: 'design_samples', label: '设计留样', description: '不售卖的设计样品' },
  { value: 'customer_returns', label: '客户退货', description: '退货入库与待检商品' },
  { value: 'old_gold', label: '旧金入库', description: '财务旧金抵扣形成的库存资产' },
  { value: 'needs_review', label: '待检 / 瑕疵', description: '需要库管复核' },
  { value: 'reserved', label: '已占用', description: '已被预占的库存' },
  { value: 'pending_outbound', label: '待出库', description: '已关联销售的占用库存' },
  { value: 'pending_stocktake', label: '待盘点', description: '待检、瑕疵或占用异常库存' },
  { value: 'low_stock', label: '低库存', description: '常备库存需补货' },
  { value: 'unavailable', label: '不可用', description: '无可用数量或已出库/报废' }
]

const formatCurrentTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

type MovementDraft = {
  inventoryItemId: string
  type: InventoryMovementType
  quantity: string
  toLocation: string
  relatedOrderLineId: string
  operatorName: string
  note: string
}

type InboundDraft = {
  name: string
  sourceType: InventoryItemSourceType
  category: string
  material: string
  size: string
  quantity: string
  batchCostAmount: string
  location: string
  keeperName: string
  remark: string
}

type ReviewDraft = {
  condition: InventoryItemCondition
  status: InventoryItemStatus
  availableQuantity: string
  location: string
  operatorName: string
  note: string
}

type StocktakeDraft = {
  countedQuantity: string
  countedAvailableQuantity: string
  location: string
  operatorName: string
  reason: string
  note: string
}

type MovementFilters = {
  type: InventoryMovementType | 'all'
  relatedOrderLineId: string
  keyword: string
}

const createMovementDraft = (item?: InventoryItem): MovementDraft => ({
  inventoryItemId: item?.id || '',
  type: 'reserve',
  quantity: '1',
  toLocation: item?.warehouseLocation || '',
  relatedOrderLineId: '',
  operatorName: '周库管',
  note: ''
})

const formatOrderLineOption = (line: OrderLine) => [getOrderLineGoodsNo(line), line.name].filter(Boolean).join(' / ')

const getOrderLineDisplay = (orderLines: OrderLine[], orderLineId?: string) => {
  const line = orderLines.find((candidate) => candidate.id === orderLineId)
  return line ? formatOrderLineOption(line) : orderLineId
}

const createReviewDraft = (item?: InventoryItem): ReviewDraft => ({
  condition: item?.condition || 'new',
  status: item?.status || 'in_stock',
  availableQuantity: String(item?.availableQuantity ?? 0),
  location: item?.warehouseLocation || '',
  operatorName: '周库管',
  note: ''
})

const createStocktakeDraft = (item?: InventoryItem): StocktakeDraft => ({
  countedQuantity: String(item?.quantity ?? 0),
  countedAvailableQuantity: String(item?.availableQuantity ?? 0),
  location: item?.warehouseLocation || '',
  operatorName: '周库管',
  reason: '',
  note: ''
})

const initialInboundDraft: InboundDraft = {
  name: '',
  sourceType: 'stock_purchase',
  category: 'other',
  material: '',
  size: '',
  quantity: '1',
  batchCostAmount: '',
  location: 'C-常备库存-01',
  keeperName: '周库管',
  remark: ''
}

const initialMovementFilters: MovementFilters = {
  type: 'all',
  relatedOrderLineId: '',
  keyword: ''
}

const toPositiveInteger = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}

const toNonNegativeNumber = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

export const InventoryListPage = () => {
  const appData = useAppData()
  const inventoryItems = appData.inventoryItems
  const movements = appData.inventoryMovements
  const batches = appData.inventoryBatches
  const initialInventoryItem = inventoryItems[0]
  const [filters, setFilters] = useState<InventoryFilters>(initialFilters)
  const [movementDraft, setMovementDraft] = useState<MovementDraft>(() => createMovementDraft(initialInventoryItem))
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>(() => createReviewDraft(initialInventoryItem))
  const [stocktakeDraft, setStocktakeDraft] = useState<StocktakeDraft>(() => createStocktakeDraft(initialInventoryItem))
  const [inboundDraft, setInboundDraft] = useState<InboundDraft>(initialInboundDraft)
  const [movementFilters, setMovementFilters] = useState<MovementFilters>(initialMovementFilters)
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState(initialInventoryItem?.id ?? '')
  const [formMessage, setFormMessage] = useState('')

  const rows = useMemo(
    () =>
      buildInventoryRows({
        inventoryItems,
        products: appData.products,
        purchases: appData.purchases,
        orderLines: appData.orderLines,
        customers: appData.customers
      }),
    [appData.customers, appData.orderLines, appData.products, appData.purchases, inventoryItems]
  )
  const visibleRows = useMemo(() => filterInventoryRows(rows, filters), [filters, rows])
  const summary = useMemo(() => buildInventorySummary(rows), [rows])
  const locationSummaries = useMemo(() => buildInventoryLocationSummaries(rows), [rows])
  const selectedRow = useMemo(() => rows.find((row) => row.item.id === selectedInventoryItemId) ?? visibleRows[0] ?? rows[0], [rows, selectedInventoryItemId, visibleRows])
  const selectedMovements = useMemo(() => movements.filter((movement) => movement.inventoryItemId === selectedRow?.item.id), [movements, selectedRow])
  const selectedBatches = useMemo(() => batches.filter((batch) => batch.inventoryItemId === selectedRow?.item.id), [batches, selectedRow])
  const filteredMovements = useMemo(() => {
    const keyword = movementFilters.keyword.trim().toLowerCase()

    return movements.filter((movement) => {
      if (movementFilters.type !== 'all' && movement.type !== movementFilters.type) {
        return false
      }
      if (movementFilters.relatedOrderLineId && movement.relatedOrderLineId !== movementFilters.relatedOrderLineId) {
        return false
      }
      if (!keyword) {
        return true
      }

      const relatedOrderLine = getOrderLineDisplay(appData.orderLines, movement.relatedOrderLineId)
      return [movement.inventoryCode, movement.operatorName, movement.note, movement.fromLocation, movement.toLocation, relatedOrderLine].some((value) => value?.toLowerCase().includes(keyword))
    })
  }, [appData.orderLines, movementFilters, movements])

  const updateFilter = <K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) => {
    setFilters((current) => ({
      ...current,
      [key]: value
    }))
  }

  const updateMovementDraft = <K extends keyof MovementDraft>(key: K, value: MovementDraft[K]) => {
    setMovementDraft((current) => ({
      ...current,
      [key]: value
    }))
  }

  const updateInboundDraft = <K extends keyof InboundDraft>(key: K, value: InboundDraft[K]) => {
    setInboundDraft((current) => ({
      ...current,
      [key]: value
    }))
  }

  const updateReviewDraft = <K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) => {
    setReviewDraft((current) => ({
      ...current,
      [key]: value
    }))
  }

  const updateStocktakeDraft = <K extends keyof StocktakeDraft>(key: K, value: StocktakeDraft[K]) => {
    setStocktakeDraft((current) => ({
      ...current,
      [key]: value
    }))
  }

  const updateMovementFilter = <K extends keyof MovementFilters>(key: K, value: MovementFilters[K]) => {
    setMovementFilters((current) => ({
      ...current,
      [key]: value
    }))
  }

  useEffect(() => {
    if (selectedRow) {
      setReviewDraft(createReviewDraft(selectedRow.item))
      setStocktakeDraft(createStocktakeDraft(selectedRow.item))
    }
  }, [selectedRow])

  const submitMovement = () => {
    const currentItem = inventoryItems.find((item) => item.id === movementDraft.inventoryItemId)
    const quantity = toPositiveInteger(movementDraft.quantity)
    if (!currentItem) {
      setFormMessage('请先选择库存商品。')
      return
    }

    try {
      const result = applyInventoryMovement(currentItem, {
        type: movementDraft.type,
        quantity,
        operatorName: movementDraft.operatorName.trim() || '周库管',
        occurredAt: formatCurrentTime(),
        toLocation: movementDraft.toLocation,
        relatedOrderLineId: movementDraft.relatedOrderLineId || undefined,
        note: movementDraft.note
      }, batches)
      appData.updateInventoryItems((current) => current.map((item) => (item.id === currentItem.id ? result.item : item)))
      appData.updateInventoryMovements((current) => [result.movement, ...current])
      appData.updateInventoryBatches(() => result.batches)
      setMovementDraft(createMovementDraft(result.item))
      setFormMessage(`已登记${inventoryMovementTypeLabelMap[movementDraft.type]}：${currentItem.inventoryCode}`)
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : '库存流转失败，请检查数量。')
    }
  }

  const submitReview = () => {
    const currentItem = selectedRow?.item
    if (!currentItem) {
      setFormMessage('请先选择需要质检处置的库存。')
      return
    }

    try {
      const result = applyInventoryReview(currentItem, {
        condition: reviewDraft.condition,
        status: reviewDraft.status,
        availableQuantity: toPositiveInteger(reviewDraft.availableQuantity),
        operatorName: reviewDraft.operatorName.trim() || '周库管',
        occurredAt: formatCurrentTime(),
        toLocation: reviewDraft.location,
        note: reviewDraft.note
      })
      appData.updateInventoryItems((current) => current.map((item) => (item.id === currentItem.id ? result.item : item)))
      appData.updateInventoryMovements((current) => [result.movement, ...current])
      setSelectedInventoryItemId(result.item.id)
      setMovementDraft(createMovementDraft(result.item))
      setReviewDraft(createReviewDraft(result.item))
      setFormMessage(`已完成质检处置：${currentItem.inventoryCode}`)
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : '质检处置失败，请检查数量。')
    }
  }

  const submitInbound = () => {
    const quantity = toPositiveInteger(inboundDraft.quantity)
    if (!inboundDraft.name.trim()) {
      setFormMessage('请填写入库款式名称。')
      return
    }
    if (quantity <= 0) {
      setFormMessage('入库数量必须大于 0。')
      return
    }

    const currentTime = formatCurrentTime()
    const id = `inventory-new-${Date.now()}`
    const batchCostAmount = toNonNegativeNumber(inboundDraft.batchCostAmount)
    const sourcePrefix = inboundDraft.sourceType === 'design_sample' ? 'DS' : inboundDraft.sourceType === 'customer_return' ? 'RT' : inboundDraft.sourceType === 'old_gold' ? 'OG' : inboundDraft.sourceType === 'stock_purchase' ? 'ST' : 'OT'
    const item: InventoryItem = {
      id,
      inventoryCode: `INV-${sourcePrefix}-${Date.now().toString().slice(-6)}`,
      name: inboundDraft.name.trim(),
      category: inboundDraft.category as InventoryItem['category'],
      sourceType: inboundDraft.sourceType,
      sourceLabel: inventorySourceTypeLabelMap[inboundDraft.sourceType],
      material: inboundDraft.material.trim() || undefined,
      size: inboundDraft.size.trim() || undefined,
      valuationAmount: inboundDraft.sourceType === 'old_gold' && batchCostAmount > 0 ? batchCostAmount : undefined,
      quantity,
      availableQuantity: quantity,
      warehouseLocation: inboundDraft.location.trim() || '待分配库位',
      ownerDepartment: inboundDraft.sourceType === 'design_sample' ? 'design' : inboundDraft.sourceType === 'customer_return' ? 'customer_service' : 'warehouse',
      condition: inboundDraft.sourceType === 'design_sample' ? 'sample' : inboundDraft.sourceType === 'customer_return' || inboundDraft.sourceType === 'old_gold' ? 'returned' : 'new',
      status: 'in_stock',
      receivedAt: currentTime,
      keeperName: inboundDraft.keeperName.trim() || '周库管',
      remark: inboundDraft.remark.trim() || undefined
    }
    const movement: InventoryMovement = {
      id: `movement-${id}-inbound`,
      inventoryItemId: id,
      inventoryCode: item.inventoryCode,
      type: 'inbound',
      quantity,
      operatorName: item.keeperName,
      occurredAt: currentTime,
      toStatus: 'in_stock',
      toLocation: item.warehouseLocation,
      note: inboundDraft.remark || '新增入库登记。'
    }
    const batch: InventoryBatch = {
      id: `inventory-batch-${id}`,
      inventoryItemId: id,
      inventoryCode: item.inventoryCode,
      receivedAt: currentTime,
      quantity,
      remainingQuantity: quantity,
      unitCostAmount: quantity > 0 ? Number((batchCostAmount / quantity).toFixed(2)) : 0,
      totalCostAmount: batchCostAmount,
      sourceMovementId: movement.id
    }

    appData.updateInventoryItems((current) => [item, ...current])
    appData.updateInventoryMovements((current) => [movement, ...current])
    appData.updateInventoryBatches((current) => [batch, ...current])
    setSelectedInventoryItemId(item.id)
    setMovementDraft(createMovementDraft(item))
    setInboundDraft(initialInboundDraft)
    setFormMessage(`已新增入库：${item.inventoryCode}`)
  }

  const submitStocktake = () => {
    const currentItem = selectedRow?.item
    if (!currentItem) {
      setFormMessage('请先选择需要盘点的库存。')
      return
    }

    try {
      const result = applyInventoryStocktake(currentItem, {
        countedQuantity: toPositiveInteger(stocktakeDraft.countedQuantity),
        countedAvailableQuantity: toPositiveInteger(stocktakeDraft.countedAvailableQuantity),
        operatorName: stocktakeDraft.operatorName.trim() || '周库管',
        occurredAt: formatCurrentTime(),
        toLocation: stocktakeDraft.location,
        reason: stocktakeDraft.reason,
        note: stocktakeDraft.note
      })
      appData.updateInventoryItems((current) => current.map((item) => (item.id === currentItem.id ? result.item : item)))
      appData.updateInventoryMovements((current) => [result.movement, ...current])
      setSelectedInventoryItemId(result.item.id)
      setMovementDraft(createMovementDraft(result.item))
      setReviewDraft(createReviewDraft(result.item))
      setStocktakeDraft(createStocktakeDraft(result.item))
      setFormMessage(`已完成库存盘点：${currentItem.inventoryCode}`)
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : '库存盘点失败，请检查数量。')
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="仓库商品管理"
        className="compact-page-header"
        actions={
          <Link to="/order-lines" className="button secondary">
            查看销售中心
          </Link>
        }
      />

      <div className="stats-grid compact-stats">
        <div className="stat-card compact-stat">
          <span className="stat-card-label">库存款数</span>
          <span className="stat-card-value">{summary.skuCount}</span>
        </div>
        <div className="stat-card compact-stat">
          <span className="stat-card-label">库存总件数</span>
          <span className="stat-card-value">{summary.totalQuantity}</span>
        </div>
        <div className="stat-card compact-stat">
          <span className="stat-card-label">可用件数</span>
          <span className="stat-card-value">{summary.availableQuantity}</span>
        </div>
        <div className="stat-card compact-stat">
          <span className="stat-card-label">已占用件数</span>
          <span className="stat-card-value">{summary.reservedQuantity}</span>
        </div>
        <div className="stat-card compact-stat">
          <span className="stat-card-label">设计留样</span>
          <span className="stat-card-value">{summary.designSampleCount}</span>
        </div>
        <div className="stat-card compact-stat">
          <span className="stat-card-label">客户退货</span>
          <span className="stat-card-value">{summary.customerReturnCount}</span>
        </div>
        <div className="stat-card compact-stat">
          <span className="stat-card-label">旧金入库</span>
          <span className="stat-card-value">{summary.oldGoldCount}</span>
        </div>
        <div className="stat-card compact-stat">
          <span className="stat-card-label">待检 / 瑕疵</span>
          <span className="stat-card-value">{summary.needsReviewCount}</span>
        </div>
        <div className="stat-card compact-stat">
          <span className="stat-card-label">已占用</span>
          <span className="stat-card-value">{summary.reservedCount}</span>
        </div>
        <div className="stat-card compact-stat">
          <span className="stat-card-label">低库存</span>
          <span className="stat-card-value">{summary.lowStockCount}</span>
        </div>
        <div className="stat-card compact-stat">
          <span className="stat-card-label">不可用</span>
          <span className="stat-card-value">{summary.unavailableCount}</span>
        </div>
      </div>

      <SectionCard title="库管快捷视图" description="按库管日常关注点快速切换库存台账。">
        <div className="stats-grid compact-stats">
          {quickViewOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`stat-card compact-stat${filters.quickView === option.value ? ' selected' : ''}`}
              aria-label={option.label}
              onClick={() => updateFilter('quickView', option.value)}
            >
              <span className="stat-card-label">{option.label}</span>
              <span className="muted-block">{option.description}</span>
              <span className="stat-card-value">{filterInventoryRows(rows, { ...filters, quickView: option.value }).length}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="库位汇总" description="按库位汇总库存款数、总数、可用、占用和待检数量，方便库管快速扫库。">
        <InventoryLocationSummaryTable summaries={locationSummaries} />
      </SectionCard>

      <SectionCard title="库存筛选" description="按来源、状态、成色、库位和关联对象快速定位库存。">
        <div className="filter-grid">
          <label>
            <span>搜索库存编号 / 商品 / 关联对象</span>
            <input value={filters.keyword} onChange={(event) => updateFilter('keyword', event.target.value)} placeholder="输入库存编号、款式名称、购买记录或销售" />
          </label>
          <label>
            <span>来源筛选</span>
            <select value={filters.sourceType} onChange={(event) => updateFilter('sourceType', event.target.value as InventoryFilters['sourceType'])}>
              {sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>库存状态</span>
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value as InventoryFilters['status'])}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>成色筛选</span>
            <select value={filters.condition} onChange={(event) => updateFilter('condition', event.target.value as InventoryFilters['condition'])}>
              {conditionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>库位筛选</span>
            <input value={filters.location} onChange={(event) => updateFilter('location', event.target.value)} placeholder="例如 A-设计样品" />
          </label>
        </div>
      </SectionCard>

      <div className="two-column-grid inventory-form-grid">
        <SectionCard title="入库登记" description="用于设计留样、客户退货、常备采购或其他库存的前端 mock 入库。">
          <div className="filter-grid">
            <label>
              <span>款式名称</span>
              <input value={inboundDraft.name} onChange={(event) => updateInboundDraft('name', event.target.value)} placeholder="例如 设计留样戒指" />
            </label>
            <label>
              <span>入库来源</span>
              <select value={inboundDraft.sourceType} onChange={(event) => updateInboundDraft('sourceType', event.target.value as InventoryItemSourceType)}>
                {sourceOptions
                  .filter((option): option is { value: InventoryItemSourceType; label: string } => option.value !== 'all')
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>材质</span>
              <input value={inboundDraft.material} onChange={(event) => updateInboundDraft('material', event.target.value)} placeholder="18K金 / 银版 / 锆石" />
            </label>
            <label>
              <span>规格</span>
              <input value={inboundDraft.size} onChange={(event) => updateInboundDraft('size', event.target.value)} placeholder="16号 / 42cm" />
            </label>
            <label>
              <span>数量</span>
              <input type="number" min="1" value={inboundDraft.quantity} onChange={(event) => updateInboundDraft('quantity', event.target.value)} />
            </label>
            <label>
              <span>批次总成本 / 估值</span>
              <input type="number" min="0" value={inboundDraft.batchCostAmount} onChange={(event) => updateInboundDraft('batchCostAmount', event.target.value)} placeholder="例如 600" />
            </label>
            <label>
              <span>库位</span>
              <input value={inboundDraft.location} onChange={(event) => updateInboundDraft('location', event.target.value)} />
            </label>
            <label>
              <span>库管</span>
              <input value={inboundDraft.keeperName} onChange={(event) => updateInboundDraft('keeperName', event.target.value)} />
            </label>
            <label>
              <span>备注</span>
              <input value={inboundDraft.remark} onChange={(event) => updateInboundDraft('remark', event.target.value)} placeholder="入库说明" />
            </label>
          </div>
          <button type="button" className="button primary" onClick={submitInbound}>
            登记入库
          </button>
        </SectionCard>

        <SectionCard title="库存流转" description="占用、释放、出库、报废和库位调整只更新库存台账，不推进销售状态。">
          <div className="filter-grid">
            <label>
              <span>库存商品</span>
              <select value={movementDraft.inventoryItemId} onChange={(event) => updateMovementDraft('inventoryItemId', event.target.value)}>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.inventoryCode} / {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>操作类型</span>
              <select value={movementDraft.type} onChange={(event) => updateMovementDraft('type', event.target.value as InventoryMovementType)}>
                {Object.entries(inventoryMovementTypeLabelMap)
                  .filter(([value]) => value !== 'inbound')
                  .map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>数量</span>
              <input type="number" min="1" value={movementDraft.quantity} onChange={(event) => updateMovementDraft('quantity', event.target.value)} />
            </label>
            <label>
              <span>目标库位</span>
              <input value={movementDraft.toLocation} onChange={(event) => updateMovementDraft('toLocation', event.target.value)} placeholder="调整库位时填写" />
            </label>
            <label>
              <span>关联销售</span>
              <select value={movementDraft.relatedOrderLineId} onChange={(event) => updateMovementDraft('relatedOrderLineId', event.target.value)}>
                <option value="">不关联销售</option>
                {appData.orderLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {formatOrderLineOption(line)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>操作人</span>
              <input value={movementDraft.operatorName} onChange={(event) => updateMovementDraft('operatorName', event.target.value)} />
            </label>
            <label>
              <span>备注</span>
              <input value={movementDraft.note} onChange={(event) => updateMovementDraft('note', event.target.value)} placeholder="占用原因 / 出库说明" />
            </label>
          </div>
          <button type="button" className="button primary" onClick={submitMovement}>
            登记流转
          </button>
          {formMessage ? <p className="text-muted">{formMessage}</p> : null}
        </SectionCard>
      </div>

      <SectionCard title="库存台账" description="库管视角只管理库存资产，不推进销售生产、财务或售后状态。">
        {visibleRows.length > 0 ? <InventoryTable rows={visibleRows} selectedId={selectedRow?.item.id} onSelect={setSelectedInventoryItemId} /> : <EmptyState title="暂无库存记录" description="当前筛选条件下没有库存商品，请放宽筛选或切回全部来源。" />}
      </SectionCard>

      <SectionCard title="库存详情与来源追溯" description="查看单件库存的来源、关联对象和该库存自己的流转记录。">
        {selectedRow ? <InventoryDetail row={selectedRow} movements={selectedMovements} batches={selectedBatches} orderLines={appData.orderLines} /> : <EmptyState title="未选择库存" description="请选择一条库存记录查看详情。" />}
      </SectionCard>

      <SectionCard title="库存质检处置" description="用于客户退货、瑕疵件和待检修库存的库管复核；只更新库存资产，不推进销售状态。">
        {selectedRow ? (
          <div className="filter-grid">
            <label>
              <span>当前库存</span>
              <input value={`${selectedRow.item.inventoryCode} / ${selectedRow.item.name}`} readOnly />
            </label>
            <label>
              <span>处置后成色</span>
              <select value={reviewDraft.condition} onChange={(event) => updateReviewDraft('condition', event.target.value as InventoryItemCondition)}>
                {conditionOptions
                  .filter((option): option is { value: InventoryItemCondition; label: string } => option.value !== 'all')
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>处置后状态</span>
              <select value={reviewDraft.status} onChange={(event) => updateReviewDraft('status', event.target.value as InventoryItemStatus)}>
                {statusOptions
                  .filter((option): option is { value: InventoryItemStatus; label: string } => option.value !== 'all')
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>可用数量</span>
              <input type="number" min="0" value={reviewDraft.availableQuantity} onChange={(event) => updateReviewDraft('availableQuantity', event.target.value)} />
            </label>
            <label>
              <span>目标库位</span>
              <input value={reviewDraft.location} onChange={(event) => updateReviewDraft('location', event.target.value)} />
            </label>
            <label>
              <span>质检人</span>
              <input value={reviewDraft.operatorName} onChange={(event) => updateReviewDraft('operatorName', event.target.value)} />
            </label>
            <label>
              <span>质检结论</span>
              <input value={reviewDraft.note} onChange={(event) => updateReviewDraft('note', event.target.value)} placeholder="例如 质检通过 / 需维修 / 不可售" />
            </label>
            <div className="field-actions">
              <button type="button" className="button primary" onClick={submitReview}>
                保存质检处置
              </button>
            </div>
          </div>
        ) : (
          <EmptyState title="未选择库存" description="请选择一条库存记录后再做质检处置。" />
        )}
      </SectionCard>

      <SectionCard title="库存盘点" description="按实盘总数和实盘可用数调整库存台账，并生成调整流水；不推进销售状态。">
        {selectedRow ? (
          <div className="filter-grid">
            <label>
              <span>当前库存</span>
              <input value={`${selectedRow.item.inventoryCode} / ${selectedRow.item.name}`} readOnly />
            </label>
            <label>
              <span>实盘总数</span>
              <input type="number" min="0" value={stocktakeDraft.countedQuantity} onChange={(event) => updateStocktakeDraft('countedQuantity', event.target.value)} />
            </label>
            <label>
              <span>实盘可用数</span>
              <input type="number" min="0" value={stocktakeDraft.countedAvailableQuantity} onChange={(event) => updateStocktakeDraft('countedAvailableQuantity', event.target.value)} />
            </label>
            <label>
              <span>盘点后库位</span>
              <input value={stocktakeDraft.location} onChange={(event) => updateStocktakeDraft('location', event.target.value)} />
            </label>
            <label>
              <span>盘点人</span>
              <input value={stocktakeDraft.operatorName} onChange={(event) => updateStocktakeDraft('operatorName', event.target.value)} />
            </label>
            <label>
              <span>差异原因</span>
              <input value={stocktakeDraft.reason} onChange={(event) => updateStocktakeDraft('reason', event.target.value)} placeholder="例如 盘盈 / 盘亏 / 库位调整" />
            </label>
            <label>
              <span>盘点备注</span>
              <input value={stocktakeDraft.note} onChange={(event) => updateStocktakeDraft('note', event.target.value)} placeholder="盘点说明" />
            </label>
            <div className="field-actions">
              <button type="button" className="button primary" onClick={submitStocktake}>
                保存盘点
              </button>
            </div>
          </div>
        ) : (
          <EmptyState title="未选择库存" description="请选择一条库存记录后再做库存盘点。" />
        )}
      </SectionCard>

      <SectionCard title="库存流转记录" description="记录入库、占用、释放、出库、报废和库位调整；筛选只影响台账查看，不改变库存或销售状态。">
        <div className="filter-grid">
          <label>
            <span>流转类型筛选</span>
            <select value={movementFilters.type} onChange={(event) => updateMovementFilter('type', event.target.value as MovementFilters['type'])}>
              <option value="all">全部类型</option>
              {Object.entries(inventoryMovementTypeLabelMap).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>关联销售筛选</span>
            <select value={movementFilters.relatedOrderLineId} onChange={(event) => updateMovementFilter('relatedOrderLineId', event.target.value)}>
              <option value="">全部销售关联</option>
              {appData.orderLines.map((line) => (
                <option key={line.id} value={line.id}>
                  {formatOrderLineOption(line)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>流转记录搜索</span>
            <input value={movementFilters.keyword} onChange={(event) => updateMovementFilter('keyword', event.target.value)} placeholder="库存编号、备注、操作人或库位" />
          </label>
        </div>
        {filteredMovements.length > 0 ? <MovementTable movements={filteredMovements} orderLines={appData.orderLines} /> : <EmptyState title="暂无流转记录" description="当前筛选条件下没有库存流转记录。" />}
      </SectionCard>
    </PageContainer>
  )
}
