import { useEffect, useMemo, useState } from 'react'
import {
  addAfterSalesCase,
  addLogisticsRecord,
  applyOrderLineDesignModelingDraft,
  applyOrderLineDetailsDraft,
  applyOrderLineOutsourceDraft,
  applyOrderLineProductionDraft,
  buildOrderLineAfterSalesCloseLog,
  buildOrderLineAfterSalesEditLog,
  buildOrderLineAfterSalesLog,
  buildOrderLineDesignModelingLog,
  buildOrderLineDetailsLog,
  buildOrderLineLogisticsEditLog,
  buildOrderLineLogisticsLog,
  buildOrderLineLogisticsVoidLog,
  buildOrderLineOutsourceLog,
  buildOrderLineProductionLog,
  buildOrderLineStatusLog,
  closeAfterSalesCaseInList,
  updateAfterSalesCaseInList,
  updateLogisticsRecordInList,
  voidLogisticsRecordInList,
  type OrderLineAfterSalesCloseHandler,
  type OrderLineAfterSalesCreateHandler,
  type OrderLineAfterSalesUpdateHandler,
  type OrderLineDesignModelingUpdateHandler,
  type OrderLineDetailsUpdateHandler,
  type OrderLineLogisticsCreateHandler,
  type OrderLineLogisticsUpdateHandler,
  type OrderLineLogisticsVoidHandler,
  type OrderLineOutsourceUpdateHandler,
  type OrderLineProductionUpdateHandler,
  type OrderLineRow,
  type OrderLineStatusUpdateHandler,
  buildOrderLineRowsFromData
} from '@/services/orderLine/orderLineWorkspace'
import { useAppData } from '@/hooks/useAppData'
import { afterSalesMock, logisticsMock, orderLineLogsMock } from '@/mocks'
import { buildOrderLineStatusPatch } from '@/services/orderLine/orderLineWorkflow'
import { getOrderLineLineStatus } from '@/services/orderLine/orderLineWorkflow'
import type { OrderLineLog } from '@/types/order-line'
import type { AfterSalesCase, LogisticsRecord } from '@/types/supporting-records'

type UseOrderLineWorkspaceStateOptions = {
  purchaseId?: string
}

export const useOrderLineWorkspaceState = ({ purchaseId }: UseOrderLineWorkspaceStateOptions = {}) => {
  const appData = useAppData()
  const rows = useMemo(
    () => buildOrderLineRowsFromData(appData.orderLines, appData.purchases, purchaseId),
    [appData.orderLines, appData.purchases, purchaseId]
  )
  const [logs, setLogs] = useState<OrderLineLog[]>(orderLineLogsMock)
  const [logisticsRecords, setLogisticsRecords] = useState<LogisticsRecord[]>(logisticsMock)
  const [afterSalesCases, setAfterSalesCases] = useState<AfterSalesCase[]>(afterSalesMock)
  const [selectedLineId, setSelectedLineId] = useState<string>()

  const selectedRow = rows.find(({ line }) => line.id === selectedLineId)

  useEffect(() => {
    setLogs(orderLineLogsMock)
    setLogisticsRecords(logisticsMock)
    setAfterSalesCases(afterSalesMock)
    setSelectedLineId(undefined)
  }, [purchaseId])

  const openOrderLineDetail = (row: OrderLineRow) => {
    setSelectedLineId(row.line.id)
  }

  const closeOrderLineDetail = () => {
    setSelectedLineId(undefined)
  }

  const appendLog = (log: OrderLineLog) => {
    setLogs((current) => [log, ...current])
  }

  const handleStatusChange: OrderLineStatusUpdateHandler = (lineId, nextStatus) => {
    const currentRow = rows.find(({ line }) => line.id === lineId)
    if (!currentRow || getOrderLineLineStatus(currentRow.line) === nextStatus) {
      return
    }

    appData.updateOrderLine(lineId, (current) => ({ ...current, ...buildOrderLineStatusPatch(nextStatus) }))
    appendLog(buildOrderLineStatusLog({ line: currentRow.line, purchase: currentRow.purchase, nextStatus }))
  }

  const handleAddLogistics: OrderLineLogisticsCreateHandler = (record) => {
    const currentRow = rows.find(({ line }) => line.id === record.orderLineId)
    setLogisticsRecords((current) => addLogisticsRecord(current, record))

    if (currentRow) {
      appendLog(buildOrderLineLogisticsLog({ line: currentRow.line, purchase: currentRow.purchase, record }))
    }
  }

  const handleUpdateLogistics: OrderLineLogisticsUpdateHandler = (recordId, draft) => {
    const currentRecord = logisticsRecords.find((record) => record.id === recordId)
    const currentRow = rows.find(({ line }) => line.id === currentRecord?.orderLineId)
    if (!currentRecord || !currentRow) {
      return
    }

    setLogisticsRecords((current) => updateLogisticsRecordInList(current, recordId, draft))
    appendLog(buildOrderLineLogisticsEditLog({ line: currentRow.line, purchase: currentRow.purchase, record: currentRecord }))
  }

  const handleVoidLogistics: OrderLineLogisticsVoidHandler = (recordId, voidReason) => {
    const currentRecord = logisticsRecords.find((record) => record.id === recordId)
    const currentRow = rows.find(({ line }) => line.id === currentRecord?.orderLineId)
    if (!currentRecord || !currentRow) {
      return
    }

    setLogisticsRecords((current) => voidLogisticsRecordInList(current, recordId, voidReason))
    appendLog(buildOrderLineLogisticsVoidLog({ line: currentRow.line, purchase: currentRow.purchase, record: currentRecord, voidReason }))
  }

  const handleAddAfterSales: OrderLineAfterSalesCreateHandler = (record) => {
    const currentRow = rows.find(({ line }) => line.id === record.orderLineId)
    setAfterSalesCases((current) => addAfterSalesCase(current, record))

    if (currentRow) {
      appendLog(buildOrderLineAfterSalesLog({ line: currentRow.line, purchase: currentRow.purchase, record }))
    }
  }

  const handleUpdateAfterSales: OrderLineAfterSalesUpdateHandler = (recordId, draft) => {
    const currentRecord = afterSalesCases.find((record) => record.id === recordId)
    const currentRow = rows.find(({ line }) => line.id === currentRecord?.orderLineId)
    if (!currentRecord || !currentRow) {
      return
    }

    setAfterSalesCases((current) => updateAfterSalesCaseInList(current, recordId, draft))
    appendLog(buildOrderLineAfterSalesEditLog({ line: currentRow.line, purchase: currentRow.purchase, record: currentRecord }))
  }

  const handleCloseAfterSales: OrderLineAfterSalesCloseHandler = (recordId) => {
    const currentRecord = afterSalesCases.find((record) => record.id === recordId)
    const currentRow = rows.find(({ line }) => line.id === currentRecord?.orderLineId)
    if (!currentRecord || !currentRow) {
      return
    }

    setAfterSalesCases((current) => closeAfterSalesCaseInList(current, recordId))
    appendLog(buildOrderLineAfterSalesCloseLog({ line: currentRow.line, purchase: currentRow.purchase, record: currentRecord }))
  }

  const handleUpdateLineDetails: OrderLineDetailsUpdateHandler = (lineId, draft) => {
    const currentRow = rows.find(({ line }) => line.id === lineId)
    if (!currentRow) {
      return
    }

    appData.updateOrderLine(lineId, (current) => applyOrderLineDetailsDraft(current, draft))
    appendLog(buildOrderLineDetailsLog({ line: currentRow.line, purchase: currentRow.purchase }))
  }

  const handleUpdateDesignModelingInfo: OrderLineDesignModelingUpdateHandler = (lineId, draft) => {
    const currentRow = rows.find(({ line }) => line.id === lineId)
    if (!currentRow) {
      return
    }

    appData.updateOrderLine(lineId, (current) => applyOrderLineDesignModelingDraft(current, draft))
    appendLog(buildOrderLineDesignModelingLog({ line: currentRow.line, purchase: currentRow.purchase }))
  }

  const handleUpdateOutsourceInfo: OrderLineOutsourceUpdateHandler = (lineId, draft) => {
    const currentRow = rows.find(({ line }) => line.id === lineId)
    if (!currentRow) {
      return
    }

    appData.updateOrderLine(lineId, (current) => applyOrderLineOutsourceDraft(current, draft))
    appendLog(buildOrderLineOutsourceLog({ line: currentRow.line, purchase: currentRow.purchase }))
  }

  const handleUpdateProductionInfo: OrderLineProductionUpdateHandler = (lineId, draft) => {
    const currentRow = rows.find(({ line }) => line.id === lineId)
    if (!currentRow) {
      return
    }

    appData.updateOrderLine(lineId, (current) => applyOrderLineProductionDraft(current, draft))
    appendLog(buildOrderLineProductionLog({ line: currentRow.line, purchase: currentRow.purchase }))
  }

  return {
    rows,
    logs,
    logisticsRecords,
    afterSalesCases,
    selectedLineId,
    selectedRow,
    openOrderLineDetail,
    closeOrderLineDetail,
    appendLog,
    handleStatusChange,
    handleAddLogistics,
    handleUpdateLogistics,
    handleVoidLogistics,
    handleAddAfterSales,
    handleUpdateAfterSales,
    handleCloseAfterSales,
    handleUpdateLineDetails,
    handleUpdateDesignModelingInfo,
    handleUpdateOutsourceInfo,
    handleUpdateProductionInfo
  }
}
