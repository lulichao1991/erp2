import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  filterOrderLineRows,
  OrderLineFilterBar,
  OrderLineDetailDrawer,
  OrderLineQuickStats,
  OrderLineTable,
  type OrderLineCenterFilters
} from '@/components/business/orderLine'
import { PageContainer, PageHeader } from '@/components/common'
import { useOrderLineWorkspaceState } from '@/hooks/useOrderLineWorkspaceState'

export const OrderLineListPage = () => {
  const [filters, setFilters] = useState<OrderLineCenterFilters>({
    keyword: '',
    status: 'all',
    owner: '',
    category: 'all',
    urgent: 'all',
    afterSales: 'all',
    overdue: 'all',
    factory: '',
    purchase: '',
    customer: '',
    quickView: 'all'
  })
  const workspace = useOrderLineWorkspaceState()
  const filteredRows = useMemo(() => filterOrderLineRows(workspace.rows, filters, workspace.afterSalesCases), [filters, workspace.afterSalesCases, workspace.rows])

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
        <OrderLineQuickStats rows={workspace.rows} afterSalesCases={workspace.afterSalesCases} />
        <OrderLineFilterBar value={filters} onChange={setFilters} />
        <OrderLineTable
          rows={filteredRows}
          logisticsRecords={workspace.logisticsRecords}
          afterSalesCases={workspace.afterSalesCases}
          onOpenDetail={workspace.openOrderLineDetail}
        />
      </div>
      <OrderLineDetailDrawer
        open={Boolean(workspace.selectedRow)}
        row={workspace.selectedRow}
        onClose={workspace.closeOrderLineDetail}
        onStatusChange={workspace.handleStatusChange}
        onUpdateLineDetails={workspace.handleUpdateLineDetails}
        onUpdateOutsourceInfo={workspace.handleUpdateOutsourceInfo}
        onUpdateProductionInfo={workspace.handleUpdateProductionInfo}
        logs={workspace.logs}
        logisticsRecords={workspace.logisticsRecords}
        afterSalesCases={workspace.afterSalesCases}
        onAddLogistics={workspace.handleAddLogistics}
        onAddAfterSales={workspace.handleAddAfterSales}
        onUpdateLogistics={workspace.handleUpdateLogistics}
        onVoidLogistics={workspace.handleVoidLogistics}
        onUpdateAfterSales={workspace.handleUpdateAfterSales}
        onCloseAfterSales={workspace.handleCloseAfterSales}
      />
    </PageContainer>
  )
}
