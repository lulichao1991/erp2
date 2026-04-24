import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addLogisticsRecord,
  buildOrderLineLogisticsLog,
  buildOrderLineStatusLog,
  buildOrderLineRows,
  filterOrderLineRows,
  OrderLineFilterBar,
  OrderLineDetailDrawer,
  OrderLineQuickStats,
  OrderLineTable,
  updateOrderLineStatusInRows,
  type OrderLineCenterFilters,
  type OrderLineLogisticsCreateHandler,
  type OrderLineStatusUpdateHandler
} from '@/components/business/orderLine'
import { PageContainer, PageHeader } from '@/components/common'
import { logisticsMock, orderLineLogsMock } from '@/mocks'
import type { OrderLineLog } from '@/types/order-line'
import type { LogisticsRecord } from '@/types/supporting-records'

export const OrderLineListPage = () => {
  const [filters, setFilters] = useState<OrderLineCenterFilters>({
    keyword: '',
    status: 'all',
    owner: ''
  })
  const [rows, setRows] = useState(buildOrderLineRows)
  const [logs, setLogs] = useState<OrderLineLog[]>(orderLineLogsMock)
  const [logisticsRecords, setLogisticsRecords] = useState<LogisticsRecord[]>(logisticsMock)
  const [selectedLineId, setSelectedLineId] = useState<string>()
  const filteredRows = useMemo(() => filterOrderLineRows(rows, filters), [filters, rows])
  const selectedRow = rows.find(({ line }) => line.id === selectedLineId)

  const handleStatusChange: OrderLineStatusUpdateHandler = (lineId, nextStatus) => {
    const currentRow = rows.find(({ line }) => line.id === lineId)
    if (!currentRow || currentRow.line.status === nextStatus) {
      return
    }

    setRows((current) => updateOrderLineStatusInRows(current, lineId, nextStatus))
    setLogs((current) => [buildOrderLineStatusLog({ line: currentRow.line, purchase: currentRow.purchase, nextStatus }), ...current])
  }

  const handleAddLogistics: OrderLineLogisticsCreateHandler = (record) => {
    const currentRow = rows.find(({ line }) => line.id === record.orderLineId)
    setLogisticsRecords((current) => addLogisticsRecord(current, record))

    if (currentRow) {
      setLogs((current) => [buildOrderLineLogisticsLog({ line: currentRow.line, purchase: currentRow.purchase, record }), ...current])
    }
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
        <OrderLineTable rows={filteredRows} logisticsRecords={logisticsRecords} onOpenDetail={(row) => setSelectedLineId(row.line.id)} />
      </div>
      <OrderLineDetailDrawer
        open={Boolean(selectedRow)}
        row={selectedRow}
        onClose={() => setSelectedLineId(undefined)}
        onStatusChange={handleStatusChange}
        logs={logs}
        logisticsRecords={logisticsRecords}
        onAddLogistics={handleAddLogistics}
      />
    </PageContainer>
  )
}
