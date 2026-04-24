import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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
  OrderLineDetailDrawer,
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
  type OrderLineDetailsUpdateHandler,
  type OrderLineLogisticsCreateHandler,
  type OrderLineLogisticsUpdateHandler,
  type OrderLineLogisticsVoidHandler,
  type OrderLineOutsourceUpdateHandler,
  type OrderLineProductionUpdateHandler,
  type OrderLineStatusUpdateHandler
} from '@/components/business/orderLine'
import {
  PurchaseCustomerSection,
  PurchaseNotesTimelineSection,
  PurchaseOrderLineTable,
  PurchasePaymentSection,
  PurchaseSummarySection
} from '@/components/business/purchase'
import { EmptyState, PageContainer, PageHeader } from '@/components/common'
import { afterSalesMock, customersMock, logisticsMock, orderLineLogsMock, orderLinesMock, purchasesMock } from '@/mocks'
import type { OrderLineLog } from '@/types/order-line'
import type { AfterSalesCase, LogisticsRecord } from '@/types/supporting-records'

export const PurchaseDetailPage = () => {
  const { purchaseId } = useParams()
  const purchase = purchasesMock.find((item) => item.id === purchaseId)
  const customer = customersMock.find((item) => item.id === purchase?.customerId)
  const [selectedOrderLineId, setSelectedOrderLineId] = useState<string>()

  const initialOrderLineRows = useMemo(() => {
    if (!purchase) {
      return []
    }

    return orderLinesMock
      .filter((line) => line.purchaseId === purchase.id || line.transactionId === purchase.id)
      .map((line) => ({
        line,
        purchase
      }))
  }, [purchase])
  const [orderLineRows, setOrderLineRows] = useState(initialOrderLineRows)
  const [orderLineLogs, setOrderLineLogs] = useState<OrderLineLog[]>(orderLineLogsMock)
  const [logisticsRecords, setLogisticsRecords] = useState<LogisticsRecord[]>(logisticsMock)
  const [afterSalesCases, setAfterSalesCases] = useState<AfterSalesCase[]>(afterSalesMock)
  const selectedOrderLineRow = orderLineRows.find(({ line }) => line.id === selectedOrderLineId)

  useEffect(() => {
    setOrderLineRows(initialOrderLineRows)
    setOrderLineLogs(orderLineLogsMock)
    setLogisticsRecords(logisticsMock)
    setAfterSalesCases(afterSalesMock)
    setSelectedOrderLineId(undefined)
  }, [initialOrderLineRows])

  const handleStatusChange: OrderLineStatusUpdateHandler = (lineId, nextStatus) => {
    const currentRow = orderLineRows.find(({ line }) => line.id === lineId)
    if (!currentRow || currentRow.line.status === nextStatus) {
      return
    }

    setOrderLineRows((current) => updateOrderLineStatusInRows(current, lineId, nextStatus))
    setOrderLineLogs((current) => [buildOrderLineStatusLog({ line: currentRow.line, purchase: currentRow.purchase, nextStatus }), ...current])
  }

  const handleAddLogistics: OrderLineLogisticsCreateHandler = (record) => {
    const currentRow = orderLineRows.find(({ line }) => line.id === record.orderLineId)
    setLogisticsRecords((current) => addLogisticsRecord(current, record))

    if (currentRow) {
      setOrderLineLogs((current) => [buildOrderLineLogisticsLog({ line: currentRow.line, purchase: currentRow.purchase, record }), ...current])
    }
  }

  const handleUpdateLogistics: OrderLineLogisticsUpdateHandler = (recordId, draft) => {
    const currentRecord = logisticsRecords.find((record) => record.id === recordId)
    const currentRow = orderLineRows.find(({ line }) => line.id === currentRecord?.orderLineId)
    if (!currentRecord || !currentRow) {
      return
    }

    setLogisticsRecords((current) => updateLogisticsRecordInList(current, recordId, draft))
    setOrderLineLogs((current) => [buildOrderLineLogisticsEditLog({ line: currentRow.line, purchase: currentRow.purchase, record: currentRecord }), ...current])
  }

  const handleVoidLogistics: OrderLineLogisticsVoidHandler = (recordId, voidReason) => {
    const currentRecord = logisticsRecords.find((record) => record.id === recordId)
    const currentRow = orderLineRows.find(({ line }) => line.id === currentRecord?.orderLineId)
    if (!currentRecord || !currentRow) {
      return
    }

    setLogisticsRecords((current) => voidLogisticsRecordInList(current, recordId, voidReason))
    setOrderLineLogs((current) => [buildOrderLineLogisticsVoidLog({ line: currentRow.line, purchase: currentRow.purchase, record: currentRecord, voidReason }), ...current])
  }

  const handleAddAfterSales: OrderLineAfterSalesCreateHandler = (record) => {
    const currentRow = orderLineRows.find(({ line }) => line.id === record.orderLineId)
    setAfterSalesCases((current) => addAfterSalesCase(current, record))

    if (currentRow) {
      setOrderLineLogs((current) => [buildOrderLineAfterSalesLog({ line: currentRow.line, purchase: currentRow.purchase, record }), ...current])
    }
  }

  const handleUpdateAfterSales: OrderLineAfterSalesUpdateHandler = (recordId, draft) => {
    const currentRecord = afterSalesCases.find((record) => record.id === recordId)
    const currentRow = orderLineRows.find(({ line }) => line.id === currentRecord?.orderLineId)
    if (!currentRecord || !currentRow) {
      return
    }

    setAfterSalesCases((current) => updateAfterSalesCaseInList(current, recordId, draft))
    setOrderLineLogs((current) => [buildOrderLineAfterSalesEditLog({ line: currentRow.line, purchase: currentRow.purchase, record: currentRecord }), ...current])
  }

  const handleCloseAfterSales: OrderLineAfterSalesCloseHandler = (recordId) => {
    const currentRecord = afterSalesCases.find((record) => record.id === recordId)
    const currentRow = orderLineRows.find(({ line }) => line.id === currentRecord?.orderLineId)
    if (!currentRecord || !currentRow) {
      return
    }

    setAfterSalesCases((current) => closeAfterSalesCaseInList(current, recordId))
    setOrderLineLogs((current) => [buildOrderLineAfterSalesCloseLog({ line: currentRow.line, purchase: currentRow.purchase, record: currentRecord }), ...current])
  }

  const handleUpdateLineDetails: OrderLineDetailsUpdateHandler = (lineId, draft) => {
    const currentRow = orderLineRows.find(({ line }) => line.id === lineId)
    if (!currentRow) {
      return
    }

    setOrderLineRows((current) => updateOrderLineDetailsInRows(current, lineId, draft))
    setOrderLineLogs((current) => [buildOrderLineDetailsLog({ line: currentRow.line, purchase: currentRow.purchase }), ...current])
  }

  const handleUpdateOutsourceInfo: OrderLineOutsourceUpdateHandler = (lineId, draft) => {
    const currentRow = orderLineRows.find(({ line }) => line.id === lineId)
    if (!currentRow) {
      return
    }

    setOrderLineRows((current) => updateOrderLineOutsourceInfoInRows(current, lineId, draft))
    setOrderLineLogs((current) => [buildOrderLineOutsourceLog({ line: currentRow.line, purchase: currentRow.purchase }), ...current])
  }

  const handleUpdateProductionInfo: OrderLineProductionUpdateHandler = (lineId, draft) => {
    const currentRow = orderLineRows.find(({ line }) => line.id === lineId)
    if (!currentRow) {
      return
    }

    setOrderLineRows((current) => updateOrderLineProductionInfoInRows(current, lineId, draft))
    setOrderLineLogs((current) => [buildOrderLineProductionLog({ line: currentRow.line, purchase: currentRow.purchase }), ...current])
  }

  if (!purchase) {
    return (
      <PageContainer>
        <EmptyState title="未找到购买记录" description="当前购买记录不存在，可能是链接失效或 mock 数据尚未包含该记录。" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="购买记录详情"
        className="compact-page-header"
        actions={
          <Link to="/order-lines" className="button secondary">
            返回商品行中心
          </Link>
        }
      />
      <p className="text-muted">购买记录详情是归组页，用来查看一次购买的公共信息和本次购买下的所有商品行。</p>
      <div className="stack">
        <PurchaseSummarySection purchase={purchase} customer={customer} />
        <PurchaseCustomerSection purchase={purchase} customer={customer} />
        <PurchasePaymentSection purchase={purchase} />
        <PurchaseOrderLineTable
          rows={orderLineRows}
          logisticsRecords={logisticsRecords}
          afterSalesCases={afterSalesCases}
          onOpenOrderLine={(row) => setSelectedOrderLineId(row.line.id)}
        />
        <PurchaseNotesTimelineSection purchase={purchase} />
      </div>
      <OrderLineDetailDrawer
        open={Boolean(selectedOrderLineRow)}
        row={selectedOrderLineRow}
        onClose={() => setSelectedOrderLineId(undefined)}
        onStatusChange={handleStatusChange}
        onUpdateLineDetails={handleUpdateLineDetails}
        onUpdateOutsourceInfo={handleUpdateOutsourceInfo}
        onUpdateProductionInfo={handleUpdateProductionInfo}
        logs={orderLineLogs}
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
