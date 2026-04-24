import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addAfterSalesCase,
  addLogisticsRecord,
  buildOrderLineAfterSalesCloseLog,
  buildOrderLineAfterSalesEditLog,
  buildOrderLineAfterSalesLog,
  buildOrderLineDetailsLog,
  buildOrderLineLogisticsEditLog,
  buildOrderLineLogisticsLog,
  buildOrderLineLogisticsVoidLog,
  buildOrderLineOutsourceLog,
  buildOrderLineProductionLog,
  buildOrderLineStatusLog,
  closeAfterSalesCaseInList,
  buildOrderLineRows,
  filterOrderLineRows,
  OrderLineFilterBar,
  OrderLineDetailDrawer,
  OrderLineQuickStats,
  OrderLineTable,
  updateAfterSalesCaseInList,
  updateOrderLineDetailsInRows,
  updateOrderLineOutsourceInfoInRows,
  updateOrderLineProductionInfoInRows,
  updateOrderLineStatusInRows,
  updateLogisticsRecordInList,
  voidLogisticsRecordInList,
  type OrderLineAfterSalesCreateHandler,
  type OrderLineAfterSalesCloseHandler,
  type OrderLineAfterSalesUpdateHandler,
  type OrderLineCenterFilters,
  type OrderLineDetailsUpdateHandler,
  type OrderLineLogisticsCreateHandler,
  type OrderLineLogisticsUpdateHandler,
  type OrderLineLogisticsVoidHandler,
  type OrderLineOutsourceUpdateHandler,
  type OrderLineProductionUpdateHandler,
  type OrderLineStatusUpdateHandler
} from '@/components/business/orderLine'
import { PageContainer, PageHeader } from '@/components/common'
import { afterSalesMock, logisticsMock, orderLineLogsMock } from '@/mocks'
import type { OrderLineLog } from '@/types/order-line'
import type { AfterSalesCase, LogisticsRecord } from '@/types/supporting-records'

export const OrderLineListPage = () => {
  const [filters, setFilters] = useState<OrderLineCenterFilters>({
    keyword: '',
    status: 'all',
    owner: ''
  })
  const [rows, setRows] = useState(buildOrderLineRows)
  const [logs, setLogs] = useState<OrderLineLog[]>(orderLineLogsMock)
  const [logisticsRecords, setLogisticsRecords] = useState<LogisticsRecord[]>(logisticsMock)
  const [afterSalesCases, setAfterSalesCases] = useState<AfterSalesCase[]>(afterSalesMock)
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

  const handleUpdateLogistics: OrderLineLogisticsUpdateHandler = (recordId, draft) => {
    const currentRecord = logisticsRecords.find((record) => record.id === recordId)
    const currentRow = rows.find(({ line }) => line.id === currentRecord?.orderLineId)
    if (!currentRecord || !currentRow) {
      return
    }

    setLogisticsRecords((current) => updateLogisticsRecordInList(current, recordId, draft))
    setLogs((current) => [buildOrderLineLogisticsEditLog({ line: currentRow.line, purchase: currentRow.purchase, record: currentRecord }), ...current])
  }

  const handleVoidLogistics: OrderLineLogisticsVoidHandler = (recordId, voidReason) => {
    const currentRecord = logisticsRecords.find((record) => record.id === recordId)
    const currentRow = rows.find(({ line }) => line.id === currentRecord?.orderLineId)
    if (!currentRecord || !currentRow) {
      return
    }

    setLogisticsRecords((current) => voidLogisticsRecordInList(current, recordId, voidReason))
    setLogs((current) => [buildOrderLineLogisticsVoidLog({ line: currentRow.line, purchase: currentRow.purchase, record: currentRecord, voidReason }), ...current])
  }

  const handleAddAfterSales: OrderLineAfterSalesCreateHandler = (record) => {
    const currentRow = rows.find(({ line }) => line.id === record.orderLineId)
    setAfterSalesCases((current) => addAfterSalesCase(current, record))

    if (currentRow) {
      setLogs((current) => [buildOrderLineAfterSalesLog({ line: currentRow.line, purchase: currentRow.purchase, record }), ...current])
    }
  }

  const handleUpdateAfterSales: OrderLineAfterSalesUpdateHandler = (recordId, draft) => {
    const currentRecord = afterSalesCases.find((record) => record.id === recordId)
    const currentRow = rows.find(({ line }) => line.id === currentRecord?.orderLineId)
    if (!currentRecord || !currentRow) {
      return
    }

    setAfterSalesCases((current) => updateAfterSalesCaseInList(current, recordId, draft))
    setLogs((current) => [buildOrderLineAfterSalesEditLog({ line: currentRow.line, purchase: currentRow.purchase, record: currentRecord }), ...current])
  }

  const handleCloseAfterSales: OrderLineAfterSalesCloseHandler = (recordId) => {
    const currentRecord = afterSalesCases.find((record) => record.id === recordId)
    const currentRow = rows.find(({ line }) => line.id === currentRecord?.orderLineId)
    if (!currentRecord || !currentRow) {
      return
    }

    setAfterSalesCases((current) => closeAfterSalesCaseInList(current, recordId))
    setLogs((current) => [buildOrderLineAfterSalesCloseLog({ line: currentRow.line, purchase: currentRow.purchase, record: currentRecord }), ...current])
  }

  const handleUpdateLineDetails: OrderLineDetailsUpdateHandler = (lineId, draft) => {
    const currentRow = rows.find(({ line }) => line.id === lineId)
    if (!currentRow) {
      return
    }

    setRows((current) => updateOrderLineDetailsInRows(current, lineId, draft))
    setLogs((current) => [buildOrderLineDetailsLog({ line: currentRow.line, purchase: currentRow.purchase }), ...current])
  }

  const handleUpdateOutsourceInfo: OrderLineOutsourceUpdateHandler = (lineId, draft) => {
    const currentRow = rows.find(({ line }) => line.id === lineId)
    if (!currentRow) {
      return
    }

    setRows((current) => updateOrderLineOutsourceInfoInRows(current, lineId, draft))
    setLogs((current) => [buildOrderLineOutsourceLog({ line: currentRow.line, purchase: currentRow.purchase }), ...current])
  }

  const handleUpdateProductionInfo: OrderLineProductionUpdateHandler = (lineId, draft) => {
    const currentRow = rows.find(({ line }) => line.id === lineId)
    if (!currentRow) {
      return
    }

    setRows((current) => updateOrderLineProductionInfoInRows(current, lineId, draft))
    setLogs((current) => [buildOrderLineProductionLog({ line: currentRow.line, purchase: currentRow.purchase }), ...current])
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
        <OrderLineQuickStats rows={rows} afterSalesCases={afterSalesCases} />
        <OrderLineFilterBar value={filters} onChange={setFilters} />
        <OrderLineTable
          rows={filteredRows}
          logisticsRecords={logisticsRecords}
          afterSalesCases={afterSalesCases}
          onOpenDetail={(row) => setSelectedLineId(row.line.id)}
        />
      </div>
      <OrderLineDetailDrawer
        open={Boolean(selectedRow)}
        row={selectedRow}
        onClose={() => setSelectedLineId(undefined)}
        onStatusChange={handleStatusChange}
        onUpdateLineDetails={handleUpdateLineDetails}
        onUpdateOutsourceInfo={handleUpdateOutsourceInfo}
        onUpdateProductionInfo={handleUpdateProductionInfo}
        logs={logs}
        logisticsRecords={logisticsRecords}
        afterSalesCases={afterSalesCases}
        onAddLogistics={handleAddLogistics}
        onAddAfterSales={handleAddAfterSales}
        onUpdateLogistics={handleUpdateLogistics}
        onVoidLogistics={handleVoidLogistics}
        onUpdateAfterSales={handleUpdateAfterSales}
        onCloseAfterSales={handleCloseAfterSales}
      />
    </PageContainer>
  )
}
