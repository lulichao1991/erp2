import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageContainer, PageHeader, SectionCard, StatusTag } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { customersMock, inventoryItemsMock } from '@/mocks'
import {
  buildInventoryRows,
  buildInventorySummary,
  filterInventoryRows,
  inventoryConditionLabelMap,
  inventorySourceTypeLabelMap,
  inventoryStatusLabelMap,
  type InventoryFilters,
  type InventoryRow
} from '@/services/inventory/inventorySelectors'
import type { InventoryItemCondition, InventoryItemSourceType, InventoryItemStatus } from '@/types/inventory'

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

const formatWeight = (weight?: number) => (typeof weight === 'number' ? `${weight}g` : '待补充')

export const InventoryListPage = () => {
  const appData = useAppData()
  const [filters, setFilters] = useState<InventoryFilters>(initialFilters)

  const rows = useMemo(
    () =>
      buildInventoryRows({
        inventoryItems: inventoryItemsMock,
        products: appData.products,
        purchases: appData.purchases,
        orderLines: appData.orderLines,
        customers: customersMock
      }),
    [appData.orderLines, appData.products, appData.purchases]
  )
  const visibleRows = useMemo(() => filterInventoryRows(rows, filters), [filters, rows])
  const summary = useMemo(() => buildInventorySummary(rows), [rows])

  const updateFilter = <K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) => {
    setFilters((current) => ({
      ...current,
      [key]: value
    }))
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
      </div>

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

      <SectionCard title="库存台账" description="库管视角只管理库存资产，不推进商品行生产、财务或售后状态。">
        {visibleRows.length > 0 ? <InventoryTable rows={visibleRows} /> : <EmptyState title="暂无库存记录" description="当前筛选条件下没有库存商品，请放宽筛选或切回全部来源。" />}
      </SectionCard>
    </PageContainer>
  )
}

const InventoryTable = ({ rows }: { rows: InventoryRow[] }) => (
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
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.item.id}>
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
              </div>
            </td>
            <td>
              <strong>{row.item.receivedAt}</strong>
              <span className="muted-block">库管：{row.item.keeperName}</span>
            </td>
            <td>{row.item.remark || '无'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

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
  </div>
)
