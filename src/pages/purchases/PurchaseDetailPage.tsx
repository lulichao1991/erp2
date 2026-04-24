import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addAfterSalesCase,
  addLogisticsRecord,
  buildOrderLineAfterSalesLog,
  buildOrderLineDetailsLog,
  buildOrderLineLogisticsLog,
  buildOrderLineOutsourceLog,
  buildOrderLineProductionLog,
  buildOrderLineStatusLog,
  OrderLineDetailDrawer,
  updateOrderLineDetailsInRows,
  updateOrderLineOutsourceInfoInRows,
  updateOrderLineProductionInfoInRows,
  updateOrderLineStatusInRows,
  type OrderLineAfterSalesCreateHandler,
  type OrderLineDetailsUpdateHandler,
  type OrderLineLogisticsCreateHandler,
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

  const handleAddAfterSales: OrderLineAfterSalesCreateHandler = (record) => {
    const currentRow = orderLineRows.find(({ line }) => line.id === record.orderLineId)
    setAfterSalesCases((current) => addAfterSalesCase(current, record))

    if (currentRow) {
      setOrderLineLogs((current) => [buildOrderLineAfterSalesLog({ line: currentRow.line, purchase: currentRow.purchase, record }), ...current])
    }
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
      />
    </PageContainer>
  )
}
