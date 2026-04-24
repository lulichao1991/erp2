import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  buildOrderLineRows,
  filterOrderLineRows,
  OrderLineFilterBar,
  OrderLineDetailDrawer,
  OrderLineQuickStats,
  OrderLineTable,
  updateOrderLineStatusInRows,
  type OrderLineCenterFilters,
  type OrderLineStatusUpdateHandler
} from '@/components/business/orderLine'
import { PageContainer, PageHeader } from '@/components/common'

export const OrderLineListPage = () => {
  const [filters, setFilters] = useState<OrderLineCenterFilters>({
    keyword: '',
    status: 'all',
    owner: ''
  })
  const [rows, setRows] = useState(buildOrderLineRows)
  const [selectedLineId, setSelectedLineId] = useState<string>()
  const filteredRows = useMemo(() => filterOrderLineRows(rows, filters), [filters, rows])
  const selectedRow = rows.find(({ line }) => line.id === selectedLineId)

  const handleStatusChange: OrderLineStatusUpdateHandler = (lineId, nextStatus) => {
    setRows((current) => updateOrderLineStatusInRows(current, lineId, nextStatus))
  }

  return (
    <PageContainer>
      <PageHeader
        title="商品行中心"
        className="compact-page-header"
        actions={
          <Link to="/purchases/new" className="button primary">
            新建购买记录
          </Link>
        }
      />
      <p className="text-muted">一行代表一件商品，支持独立推进设计、生产、发货与售后。</p>
      <div className="stack">
        <OrderLineQuickStats rows={rows} />
        <OrderLineFilterBar value={filters} onChange={setFilters} />
        <OrderLineTable rows={filteredRows} onOpenDetail={(row) => setSelectedLineId(row.line.id)} />
      </div>
      <OrderLineDetailDrawer
        open={Boolean(selectedRow)}
        row={selectedRow}
        onClose={() => setSelectedLineId(undefined)}
        onStatusChange={handleStatusChange}
      />
    </PageContainer>
  )
}
