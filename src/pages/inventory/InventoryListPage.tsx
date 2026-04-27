import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageContainer, PageHeader, SectionCard, StatusTag } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { customersMock, inventoryItemsMock, inventoryMovementsMock } from '@/mocks'
import {
  applyInventoryMovement,
  applyInventoryReview,
  applyInventoryStocktake,
  buildInventoryOrderLineMovementSummary,
  buildInventoryRows,
  buildInventorySummary,
  filterInventoryRows,
  getInventoryReservedQuantity,
  getInventoryWorkbenchBadges,
  inventoryConditionLabelMap,
  inventoryMovementTypeLabelMap,
  inventorySourceTypeLabelMap,
  inventoryStatusLabelMap,
  type InventoryFilters,
  type InventoryQuickView,
  type InventoryRow
} from '@/services/inventory/inventorySelectors'
import type { InventoryItem, InventoryItemCondition, InventoryItemSourceType, InventoryItemStatus, InventoryMovement, InventoryMovementType } from '@/types/inventory'
import type { OrderLine } from '@/types/order-line'

const categoryLabelMap: Record<string, string> = {
  ring: '戒指',
  pendant: '吊坠',
  necklace: '项链',
  earring: '耳饰',
  bracelet: '手链',
  other: '其他'
}

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
  { value: 'needs_review', label: '待检 / 瑕疵', description: '需要库管复核' },
  { value: 'reserved', label: '已占用', description: '已被预占的库存' },
  { value: 'pending_outbound', label: '待出库', description: '已关联商品行的占用库存' },
  { value: 'pending_stocktake', label: '待盘点', description: '待检、瑕疵或占用异常库存' },
  { value: 'low_stock', label: '低库存', description: '常备库存需补货' },
  { value: 'unavailable', label: '不可用', description: '无可用数量或已出库/报废' }
]

const formatWeight = (weight?: number) => (typeof weight === 'number' ? `${weight}g` : '待补充')
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

const formatOrderLineOption = (line: OrderLine) => [line.lineCode || line.productionTaskNo || line.id, line.name].filter(Boolean).join(' / ')

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

export const InventoryListPage = () => {
  const appData = useAppData()
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => structuredClone(inventoryItemsMock))
  const [movements, setMovements] = useState<InventoryMovement[]>(() => structuredClone(inventoryMovementsMock))
  const [filters, setFilters] = useState<InventoryFilters>(initialFilters)
  const [movementDraft, setMovementDraft] = useState<MovementDraft>(() => createMovementDraft(inventoryItemsMock[0]))
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>(() => createReviewDraft(inventoryItemsMock[0]))
  const [stocktakeDraft, setStocktakeDraft] = useState<StocktakeDraft>(() => createStocktakeDraft(inventoryItemsMock[0]))
  const [inboundDraft, setInboundDraft] = useState<InboundDraft>(initialInboundDraft)
  const [movementFilters, setMovementFilters] = useState<MovementFilters>(initialMovementFilters)
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState(inventoryItemsMock[0]?.id ?? '')
  const [formMessage, setFormMessage] = useState('')

  const rows = useMemo(
    () =>
      buildInventoryRows({
        inventoryItems,
        products: appData.products,
        purchases: appData.purchases,
        orderLines: appData.orderLines,
        customers: customersMock
      }),
    [appData.orderLines, appData.products, appData.purchases, inventoryItems]
  )
  const visibleRows = useMemo(() => filterInventoryRows(rows, filters), [filters, rows])
  const summary = useMemo(() => buildInventorySummary(rows), [rows])
  const selectedRow = useMemo(() => rows.find((row) => row.item.id === selectedInventoryItemId) ?? visibleRows[0] ?? rows[0], [rows, selectedInventoryItemId, visibleRows])
  const selectedMovements = useMemo(() => movements.filter((movement) => movement.inventoryItemId === selectedRow?.item.id), [movements, selectedRow])
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
      })
      setInventoryItems((current) => current.map((item) => (item.id === currentItem.id ? result.item : item)))
      setMovements((current) => [result.movement, ...current])
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
      setInventoryItems((current) => current.map((item) => (item.id === currentItem.id ? result.item : item)))
      setMovements((current) => [result.movement, ...current])
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
      setFormMessage('请填写入库商品名称。')
      return
    }
    if (quantity <= 0) {
      setFormMessage('入库数量必须大于 0。')
      return
    }

    const currentTime = formatCurrentTime()
    const id = `inventory-new-${Date.now()}`
    const sourcePrefix = inboundDraft.sourceType === 'design_sample' ? 'DS' : inboundDraft.sourceType === 'customer_return' ? 'RT' : inboundDraft.sourceType === 'stock_purchase' ? 'ST' : 'OT'
    const item: InventoryItem = {
      id,
      inventoryCode: `INV-${sourcePrefix}-${Date.now().toString().slice(-6)}`,
      name: inboundDraft.name.trim(),
      category: inboundDraft.category as InventoryItem['category'],
      sourceType: inboundDraft.sourceType,
      sourceLabel: inventorySourceTypeLabelMap[inboundDraft.sourceType],
      material: inboundDraft.material.trim() || undefined,
      size: inboundDraft.size.trim() || undefined,
      quantity,
      availableQuantity: quantity,
      warehouseLocation: inboundDraft.location.trim() || '待分配库位',
      ownerDepartment: inboundDraft.sourceType === 'design_sample' ? 'design' : inboundDraft.sourceType === 'customer_return' ? 'customer_service' : 'warehouse',
      condition: inboundDraft.sourceType === 'design_sample' ? 'sample' : inboundDraft.sourceType === 'customer_return' ? 'returned' : 'new',
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

    setInventoryItems((current) => [item, ...current])
    setMovements((current) => [movement, ...current])
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
      setInventoryItems((current) => current.map((item) => (item.id === currentItem.id ? result.item : item)))
      setMovements((current) => [result.movement, ...current])
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
            查看商品行中心
          </Link>
        }
      />
      <p className="text-muted">仓库商品管理是库存资产台账，记录设计留样、客户退货、常备采购和其他库存；它可以关联 Product / Purchase / OrderLine，但不替代产品模板或商品行执行流。</p>

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

      <SectionCard title="库存筛选" description="按来源、状态、成色、库位和关联对象快速定位库存。">
        <div className="filter-grid">
          <label>
            <span>搜索库存编号 / 商品 / 关联对象</span>
            <input value={filters.keyword} onChange={(event) => updateFilter('keyword', event.target.value)} placeholder="输入库存编号、商品名称、购买记录或商品行" />
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

      <div className="two-column-grid">
        <SectionCard title="入库登记" description="用于设计留样、客户退货、常备采购或其他库存的前端 mock 入库。">
          <div className="filter-grid">
            <label>
              <span>商品名称</span>
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

        <SectionCard title="库存流转" description="占用、释放、出库、报废和库位调整只更新库存台账，不推进商品行状态。">
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
              <span>关联商品行</span>
              <select value={movementDraft.relatedOrderLineId} onChange={(event) => updateMovementDraft('relatedOrderLineId', event.target.value)}>
                <option value="">不关联商品行</option>
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

      <SectionCard title="库存台账" description="库管视角只管理库存资产，不推进商品行生产、财务或售后状态。">
        {visibleRows.length > 0 ? <InventoryTable rows={visibleRows} selectedId={selectedRow?.item.id} onSelect={setSelectedInventoryItemId} /> : <EmptyState title="暂无库存记录" description="当前筛选条件下没有库存商品，请放宽筛选或切回全部来源。" />}
      </SectionCard>

      <SectionCard title="库存详情与来源追溯" description="查看单件库存的来源、关联对象和该库存自己的流转记录。">
        {selectedRow ? <InventoryDetail row={selectedRow} movements={selectedMovements} orderLines={appData.orderLines} /> : <EmptyState title="未选择库存" description="请选择一条库存记录查看详情。" />}
      </SectionCard>

      <SectionCard title="库存质检处置" description="用于客户退货、瑕疵件和待检修库存的库管复核；只更新库存资产，不推进商品行状态。">
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

      <SectionCard title="库存盘点" description="按实盘总数和实盘可用数调整库存台账，并生成调整流水；不推进商品行状态。">
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

      <SectionCard title="库存流转记录" description="记录入库、占用、释放、出库、报废和库位调整；筛选只影响台账查看，不改变库存或商品行状态。">
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
            <span>关联商品行筛选</span>
            <select value={movementFilters.relatedOrderLineId} onChange={(event) => updateMovementFilter('relatedOrderLineId', event.target.value)}>
              <option value="">全部商品行关联</option>
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

const InventoryTable = ({ rows, selectedId, onSelect }: { rows: InventoryRow[]; selectedId?: string; onSelect: (id: string) => void }) => (
  <div className="table-wrap">
    <table className="data-table">
      <thead>
        <tr>
          <th>库存商品</th>
          <th>来源 / 关联</th>
          <th>规格与数量</th>
          <th>库位</th>
          <th>状态</th>
          <th>入库信息</th>
          <th>备注</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.item.id} className={selectedId === row.item.id ? 'selected-row' : undefined}>
            <td>
              <strong>{row.item.inventoryCode}</strong>
              <span className="muted-block">{row.item.name}</span>
              <span className="muted-block">{categoryLabelMap[row.item.category || 'other'] || row.item.category || '其他'}</span>
            </td>
            <td>
              <StatusTag value={row.sourceLabel} />
              <span className="muted-block">{row.linkedSummary}</span>
              <InventoryLinks row={row} />
            </td>
            <td>
              <strong>{row.item.quantity} 件</strong>
              <span className="muted-block">可用 {row.item.availableQuantity} 件</span>
              <span className="muted-block">已占用 {getInventoryReservedQuantity(row.item)} 件</span>
              <span className="muted-block">
                {[row.item.material, row.item.size, formatWeight(row.item.weight)].filter(Boolean).join(' / ')}
              </span>
              <span className="muted-block">{row.item.craftRequirements || '工艺待补充'}</span>
            </td>
            <td>{row.item.warehouseLocation}</td>
            <td>
              <div className="tag-list">
                <StatusTag value={inventoryStatusLabelMap[row.item.status]} />
                <StatusTag value={inventoryConditionLabelMap[row.item.condition]} />
                <StatusTag value={inventorySourceTypeLabelMap[row.item.sourceType]} />
                {getInventoryWorkbenchBadges(row).map((badge) => (
                  <StatusTag key={badge} value={badge} />
                ))}
              </div>
            </td>
            <td>
              <strong>{row.item.receivedAt}</strong>
              <span className="muted-block">库管：{row.item.keeperName}</span>
            </td>
            <td>{row.item.remark || '无'}</td>
            <td>
              <button type="button" className="button ghost small" onClick={() => onSelect(row.item.id)}>
                查看详情
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const InventoryDetail = ({ row, movements, orderLines }: { row: InventoryRow; movements: InventoryMovement[]; orderLines: OrderLine[] }) => (
  <div className="stack">
    <div className="info-grid">
      <div>
        <span className="info-label">库存编号</span>
        <strong>{row.item.inventoryCode}</strong>
      </div>
      <div>
        <span className="info-label">库存商品</span>
        <strong>{row.item.name}</strong>
      </div>
      <div>
        <span className="info-label">来源类型</span>
        <StatusTag value={row.sourceLabel} />
      </div>
      <div>
        <span className="info-label">状态</span>
        <StatusTag value={row.statusLabel} />
      </div>
      <div>
        <span className="info-label">成色</span>
        <StatusTag value={row.conditionLabel} />
      </div>
      <div>
        <span className="info-label">数量</span>
        <strong>
          总数 {row.item.quantity} / 可用 {row.item.availableQuantity} / 已占用 {getInventoryReservedQuantity(row.item)}
        </strong>
      </div>
      <div>
        <span className="info-label">库位</span>
        <strong>{row.item.warehouseLocation}</strong>
      </div>
      <div>
        <span className="info-label">入库时间</span>
        <strong>{row.item.receivedAt}</strong>
      </div>
    </div>

    <div className="subtle-panel">
      <strong>来源追溯</strong>
      <p className="text-muted">{row.linkedSummary}</p>
      <InventoryLinks row={row} />
    </div>

    <OrderLineMovementSummary movements={movements} orderLines={orderLines} />

    <div>
      <strong>该库存流转记录</strong>
      {movements.length > 0 ? <MovementTable movements={movements} orderLines={orderLines} /> : <EmptyState title="暂无流转记录" description="当前库存还没有单独的流转记录。" />}
    </div>
  </div>
)

const OrderLineMovementSummary = ({ movements, orderLines }: { movements: InventoryMovement[]; orderLines: OrderLine[] }) => {
  const summaries = buildInventoryOrderLineMovementSummary(movements, orderLines)

  if (summaries.length === 0) {
    return (
      <div className="subtle-panel">
        <strong>商品行占用 / 出库追溯</strong>
        <p className="text-muted">当前库存还没有关联商品行的占用、释放或出库记录。</p>
      </div>
    )
  }

  return (
    <div className="subtle-panel">
      <strong>商品行占用 / 出库追溯</strong>
      <p className="text-muted">这里只做库存追溯，不改写商品行状态。</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>关联商品行</th>
              <th>占用</th>
              <th>释放</th>
              <th>出库</th>
              <th>最近流转</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary.orderLineId}>
                <td>
                  <strong>{summary.orderLineDisplay}</strong>
                  <span className="muted-block">{summary.movementCount} 条关联流水</span>
                </td>
                <td>{summary.reserveQuantity} 件</td>
                <td>{summary.releaseQuantity} 件</td>
                <td>{summary.outboundQuantity} 件</td>
                <td>{summary.latestOccurredAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const InventoryLinks = ({ row }: { row: InventoryRow }) => (
  <div className="row wrap compact-row">
    {row.item.productId ? (
      <Link to={`/products/${row.item.productId}`} className="button ghost small" onClick={(event) => event.stopPropagation()}>
        查看产品模板
      </Link>
    ) : null}
    {row.item.purchaseId ? (
      <Link to={`/purchases/${row.item.purchaseId}`} className="button ghost small" onClick={(event) => event.stopPropagation()}>
        查看购买记录
      </Link>
    ) : null}
    {row.item.orderLineId ? (
      <Link to="/order-lines" className="button ghost small" onClick={(event) => event.stopPropagation()}>
        查看商品行中心
      </Link>
    ) : null}
    {row.item.customerId ? (
      <Link to={`/customers/${row.item.customerId}`} className="button ghost small" onClick={(event) => event.stopPropagation()}>
        查看客户详情
      </Link>
    ) : null}
  </div>
)

const MovementTable = ({ movements, orderLines }: { movements: InventoryMovement[]; orderLines: OrderLine[] }) => (
  <div className="table-wrap">
    <table className="data-table">
      <thead>
        <tr>
          <th>时间</th>
          <th>库存编号</th>
          <th>类型</th>
          <th>数量</th>
          <th>状态 / 库位</th>
          <th>关联商品行</th>
          <th>操作人</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        {movements.map((movement) => (
          <tr key={movement.id}>
            <td>{movement.occurredAt}</td>
            <td>{movement.inventoryCode}</td>
            <td>
              <StatusTag value={inventoryMovementTypeLabelMap[movement.type]} />
            </td>
            <td>{movement.quantity}</td>
            <td>
              <span className="muted-block">
                {movement.fromStatus ? inventoryStatusLabelMap[movement.fromStatus] : '无'} → {movement.toStatus ? inventoryStatusLabelMap[movement.toStatus] : '无'}
              </span>
              <span className="muted-block">
                {movement.fromLocation || '无库位'} → {movement.toLocation || '无库位'}
              </span>
            </td>
            <td>
              {movement.relatedOrderLineId ? (
                <>
                  <strong>{getOrderLineDisplay(orderLines, movement.relatedOrderLineId)}</strong>
                  <span className="muted-block">库存追溯，不推进状态</span>
                </>
              ) : (
                '未关联'
              )}
            </td>
            <td>{movement.operatorName}</td>
            <td>{movement.note || '无'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
