import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  OrderLineFilterBar,
  OrderLineDetailDrawer,
  OrderLineQuickStats,
  OrderLineTable,
  useAllOrderLineCenterRows,
  useOrderLineCenterRows,
  type OrderLineCenterFilters,
  type OrderLineRow
} from '@/components/business/orderLine'
import { PageContainer, PageHeader } from '@/components/common'

export const OrderLineListPage = () => {
  const [filters, setFilters] = useState<OrderLineCenterFilters>({
    keyword: '',
    status: 'all',
    owner: ''
  })
  const [selectedRow, setSelectedRow] = useState<OrderLineRow>()
  const allRows = useAllOrderLineCenterRows()
  const filteredRows = useOrderLineCenterRows(filters)

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
        <OrderLineQuickStats rows={allRows} />
        <OrderLineFilterBar value={filters} onChange={setFilters} />
        <OrderLineTable rows={filteredRows} onOpenDetail={setSelectedRow} />
      </div>
      <OrderLineDetailDrawer open={Boolean(selectedRow)} row={selectedRow} onClose={() => setSelectedRow(undefined)} />
    </PageContainer>
  )
}
