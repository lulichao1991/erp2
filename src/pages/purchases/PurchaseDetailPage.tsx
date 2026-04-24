import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { OrderLineDetailDrawer, updateOrderLineStatusInRows, type OrderLineStatusUpdateHandler } from '@/components/business/orderLine'
import {
  PurchaseCustomerSection,
  PurchaseNotesTimelineSection,
  PurchaseOrderLineTable,
  PurchasePaymentSection,
  PurchaseSummarySection
} from '@/components/business/purchase'
import { EmptyState, PageContainer, PageHeader } from '@/components/common'
import { customersMock, orderLinesMock, purchasesMock } from '@/mocks'

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
  const selectedOrderLineRow = orderLineRows.find(({ line }) => line.id === selectedOrderLineId)

  useEffect(() => {
    setOrderLineRows(initialOrderLineRows)
    setSelectedOrderLineId(undefined)
  }, [initialOrderLineRows])

  const handleStatusChange: OrderLineStatusUpdateHandler = (lineId, nextStatus) => {
    setOrderLineRows((current) => updateOrderLineStatusInRows(current, lineId, nextStatus))
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
        <PurchaseOrderLineTable rows={orderLineRows} onOpenOrderLine={(row) => setSelectedOrderLineId(row.line.id)} />
        <PurchaseNotesTimelineSection purchase={purchase} />
      </div>
      <OrderLineDetailDrawer
        open={Boolean(selectedOrderLineRow)}
        row={selectedOrderLineRow}
        onClose={() => setSelectedOrderLineId(undefined)}
        onStatusChange={handleStatusChange}
      />
    </PageContainer>
  )
}
