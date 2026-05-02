import { Link, useParams } from 'react-router-dom'
import { OrderLineDetailDrawer, type OrderLineRow } from '@/components/business/orderLine'
import {
  PurchaseCustomerSection,
  PurchaseNotesTimelineSection,
  PurchaseOrderLineTable,
  PurchasePaymentSection,
  PurchaseSummarySection
} from '@/components/business/purchase'
import { EmptyState, PageContainer, PageHeader } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { useOrderLineWorkspaceState } from '@/hooks/useOrderLineWorkspaceState'
import type { Purchase } from '@/types/purchase'

export const PurchaseDetailPage = () => {
  const { purchaseId } = useParams()
  const appData = useAppData()
  const purchase = appData.getPurchase(purchaseId)
  const customer = appData.getCustomer(purchase?.customerId)
  const workspace = useOrderLineWorkspaceState({ purchaseId })
  const purchaseRows = workspace.rows.filter((row): row is OrderLineRow & { purchase: Purchase } => Boolean(row.purchase))

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
            返回销售中心
          </Link>
        }
      />
      <div className="stack">
        <PurchaseSummarySection purchase={purchase} customer={customer} />
        <PurchaseCustomerSection purchase={purchase} customer={customer} />
        <PurchasePaymentSection purchase={purchase} />
        <PurchaseOrderLineTable
          rows={purchaseRows}
          logisticsRecords={workspace.logisticsRecords}
          afterSalesCases={workspace.afterSalesCases}
          onOpenOrderLine={workspace.openOrderLineDetail}
        />
        <PurchaseNotesTimelineSection purchase={purchase} />
      </div>
      <OrderLineDetailDrawer
        open={Boolean(workspace.selectedRow)}
        row={workspace.selectedRow}
        onClose={workspace.closeOrderLineDetail}
        onStatusChange={workspace.handleStatusChange}
        onUpdateLineDetails={workspace.handleUpdateLineDetails}
        onUpdateDesignModeling={workspace.handleUpdateDesignModelingInfo}
        onUpdateOutsourceInfo={workspace.handleUpdateOutsourceInfo}
        onUpdateProductionInfo={workspace.handleUpdateProductionInfo}
        logs={workspace.logs}
        logisticsRecords={workspace.logisticsRecords}
        afterSalesCases={workspace.afterSalesCases}
        customers={appData.customers}
        products={appData.products}
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
