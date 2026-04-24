import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AppBreadcrumb } from '@/app/layout/AppBreadcrumb'
import { ProductPickerModal, SourceProductDrawer } from '@/components/business/bridge'
import {
  AfterSalesSection,
  buildReferencedOrderItem,
  createOrderInfoDraft,
  LogisticsSection,
  OperationTimelineSection,
  OrderAttachmentSection,
  OrderBusinessStageHeaderStrip,
  type OrderInfoCardKey,
  OrderInfoCardGroup,
  type OrderInfoDraft,
  type OrderItemBlockKey,
  OrderItemCard,
  OrderItemsSection,
  OrderStatusFlowSection,
  OrderSummaryCard,
  OrderTaskSection,
  recalculateOrderItem
} from '@/components/business/order'
import { EmptyState, PageContainer } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { useDrawerState } from '@/hooks/useDrawerState'
import { useModalState } from '@/hooks/useModalState'
import { createDraftOrderItem } from '@/services/order/orderQueries'
import { getOrderStatusLabel } from '@/services/workflow/workflowMeta'
import type { OrderStatus } from '@/types/order'
import type { TaskAssigneeRole, TaskType } from '@/types/task'

type OrderDetailRoleViewConfig = {
  visibleInfoCards: OrderInfoCardKey[]
  visibleItemBlocks: OrderItemBlockKey[]
  defaultExpandedItemCount: number
  defaultExpandedBlocks: OrderItemBlockKey[]
  canAddItems: boolean
  canReferenceProduct: boolean
  canCreateTask: boolean
  statusFlowReadOnly: boolean
  taskReadOnly: boolean
  hideCommercialInfo: boolean
  taskScope: 'all' | 'own_role'
  showLogistics: boolean
  showAfterSales: boolean
  showAttachments: boolean
  showTimeline: boolean
}

const emptyOrderInfoDraft: OrderInfoDraft = {
  ownerName: '',
  customerName: '',
  customerPhone: '',
  platformCustomerId: '',
  sourceChannel: '',
  hasAdditionalContact: false,
  isPositiveReview: false,
  customerAddress: '',
  customerRemark: '',
  paymentDate: '',
  expectedDate: '',
  plannedDate: '',
  promisedDate: '',
  remark: ''
}

const orderDetailRoleViewMap: Record<TaskAssigneeRole, OrderDetailRoleViewConfig> = {
  customer_service: {
    visibleInfoCards: ['customer_platform', 'delivery', 'summary', 'finance'],
    visibleItemBlocks: ['spec_pricing', 'customer'],
    defaultExpandedItemCount: 1,
    defaultExpandedBlocks: ['spec_pricing', 'customer'],
    canAddItems: true,
    canReferenceProduct: true,
    canCreateTask: true,
    statusFlowReadOnly: false,
    taskReadOnly: false,
    hideCommercialInfo: false,
    taskScope: 'all',
    showLogistics: false,
    showAfterSales: true,
    showAttachments: false,
    showTimeline: true
  },
  designer: {
    visibleInfoCards: ['delivery', 'summary'],
    visibleItemBlocks: ['spec_pricing', 'design'],
    defaultExpandedItemCount: 1,
    defaultExpandedBlocks: ['spec_pricing', 'design'],
    canAddItems: false,
    canReferenceProduct: false,
    canCreateTask: false,
    statusFlowReadOnly: true,
    taskReadOnly: true,
    hideCommercialInfo: false,
    taskScope: 'all',
    showLogistics: false,
    showAfterSales: false,
    showAttachments: true,
    showTimeline: true
  },
  operations: {
    visibleInfoCards: ['customer_platform', 'delivery', 'summary', 'finance'],
    visibleItemBlocks: ['spec_pricing', 'customer', 'design', 'outsource', 'factory'],
    defaultExpandedItemCount: 1,
    defaultExpandedBlocks: ['spec_pricing', 'customer'],
    canAddItems: true,
    canReferenceProduct: true,
    canCreateTask: true,
    statusFlowReadOnly: false,
    taskReadOnly: false,
    hideCommercialInfo: false,
    taskScope: 'all',
    showLogistics: true,
    showAfterSales: true,
    showAttachments: true,
    showTimeline: true
  },
  factory: {
    visibleInfoCards: ['delivery', 'summary'],
    visibleItemBlocks: ['factory_production', 'factory'],
    defaultExpandedItemCount: 1,
    defaultExpandedBlocks: ['factory_production', 'factory'],
    canAddItems: false,
    canReferenceProduct: false,
    canCreateTask: false,
    statusFlowReadOnly: true,
    taskReadOnly: false,
    hideCommercialInfo: true,
    taskScope: 'own_role',
    showLogistics: false,
    showAfterSales: false,
    showAttachments: false,
    showTimeline: true
  },
  management: {
    visibleInfoCards: ['delivery', 'summary', 'finance'],
    visibleItemBlocks: ['spec_pricing'],
    defaultExpandedItemCount: 0,
    defaultExpandedBlocks: ['spec_pricing'],
    canAddItems: false,
    canReferenceProduct: false,
    canCreateTask: false,
    statusFlowReadOnly: true,
    taskReadOnly: true,
    hideCommercialInfo: false,
    taskScope: 'all',
    showLogistics: false,
    showAfterSales: false,
    showAttachments: false,
    showTimeline: true
  }
}

export const OrderDetailPage = () => {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const appData = useAppData()
  const order = appData.getOrder(orderId)
  const modal = useModalState()
  const drawer = useDrawerState()
  const currentRole = appData.currentUserRole
  const roleView = orderDetailRoleViewMap[currentRole]

  const pickerItemId = searchParams.get('itemId')
  const drawerItemId = searchParams.get('itemId')
  const orderTasks = order ? appData.getTasksByOrder(order.id) : []
  const visibleOrderTasks =
    roleView.taskScope === 'own_role' ? orderTasks.filter((task) => task.assigneeRole === currentRole) : orderTasks
  const visibleTimeline = order ? (roleView.hideCommercialInfo ? order.timeline.filter((record) => record.type !== 'quote_recalculated') : order.timeline) : []
  const [orderEditDraft, setOrderEditDraft] = useState<OrderInfoDraft>(() => (order ? createOrderInfoDraft(order) : emptyOrderInfoDraft))
  const [isOrderSummaryEditing, setIsOrderSummaryEditing] = useState(false)

  const pickerItem = order?.items.find((item) => item.id === pickerItemId)
  const drawerItem = order?.items.find((item) => item.id === drawerItemId)
  const drawerProduct = appData.getProduct(drawerItem?.sourceProduct?.sourceProductId)

  const referableProducts = useMemo(() => appData.products.filter((item) => item.isReferable), [appData.products])

  useEffect(() => {
    if (!order) {
      setOrderEditDraft(emptyOrderInfoDraft)
      setIsOrderSummaryEditing(false)
      return
    }

    setOrderEditDraft(createOrderInfoDraft(order))
    setIsOrderSummaryEditing(false)
  }, [order])

  if (!order) {
    return (
      <PageContainer>
        <EmptyState title="未找到交易记录" description="当前交易记录不存在，可能是链接失效或 mock 数据尚未包含该记录。" />
      </PageContainer>
    )
  }

  const handleConfirmReference = (productId: string) => {
    const product = appData.getProduct(productId)
    if (!pickerItem || !product) {
      return
    }

    appData.updateOrderItem(order.id, pickerItem.id, () => buildReferencedOrderItem(pickerItem, product))
    modal.close()
  }

  const handleAddItem = () => {
    appData.updateOrder(order.id, (current) => ({
      ...current,
      items: [...current.items, createDraftOrderItem(current.items.length + 1)]
    }))
  }

  const handleTransitionStatus = (nextStatus: OrderStatus) => {
    appData.transitionOrderStatus({
      orderId: order.id,
      nextStatus
    })
  }

  const handleTransitionWithSuggestedTask = (nextStatus: OrderStatus, taskType: TaskType) => {
    appData.transitionOrderStatus({
      orderId: order.id,
      nextStatus,
      reason: `交易阶段已推进到${getOrderStatusLabel(nextStatus)}，并同步创建建议任务。`
    })
    appData.createTaskFromOrder({
      orderId: order.id,
      type: taskType
    })
  }

  const handleSaveOrderInfo = () => {
    appData.updateOrder(order.id, (current) => ({
      ...current,
      ownerName: orderEditDraft.ownerName,
      customerName: orderEditDraft.customerName,
      customerPhone: orderEditDraft.customerPhone,
      platformCustomerId: orderEditDraft.platformCustomerId,
      sourceChannel: orderEditDraft.sourceChannel,
      hasAdditionalContact: orderEditDraft.hasAdditionalContact,
      isPositiveReview: orderEditDraft.isPositiveReview,
      customerAddress: orderEditDraft.customerAddress,
      customerRemark: orderEditDraft.customerRemark,
      paymentDate: orderEditDraft.paymentDate,
      expectedDate: orderEditDraft.expectedDate,
      plannedDate: orderEditDraft.plannedDate,
      promisedDate: orderEditDraft.promisedDate,
      remark: orderEditDraft.remark,
      latestActivityAt: current.latestActivityAt
    }))
    setIsOrderSummaryEditing(false)
  }

  const handleCancelOrderInfoEdit = () => {
    setOrderEditDraft(createOrderInfoDraft(order))
    setIsOrderSummaryEditing(false)
  }

  const handleRemoveItem = (itemId: string) => {
    appData.removeOrderItem({ orderId: order.id, itemId })
    if (pickerItemId === itemId || drawerItemId === itemId) {
      modal.close()
      drawer.close()
    }
  }

  return (
    <PageContainer>
      <AppBreadcrumb items={[{ label: '商品任务中心', to: '/orders' }, { label: '交易记录详情' }, { label: order.orderNo }]} />
      <OrderBusinessStageHeaderStrip order={order} />
      <div className="stack">
        <div className="subtle-panel">上方展示交易记录公共信息，下方按商品任务卡分开展示执行、协同、物流与售后信息。</div>
        <OrderSummaryCard
          order={order}
          role={currentRole}
          visibleInfoCards={roleView.visibleInfoCards}
          hideCommercialInfo={roleView.hideCommercialInfo}
          editable={!roleView.hideCommercialInfo}
          isEditing={isOrderSummaryEditing}
          editDraft={orderEditDraft}
          onEditDraftChange={setOrderEditDraft}
          onStartEdit={() => setIsOrderSummaryEditing(true)}
          onCancelEdit={handleCancelOrderInfoEdit}
          onSaveEdit={handleSaveOrderInfo}
        />
        <OrderItemsSection
          order={order}
          onAddItem={roleView.canAddItems ? handleAddItem : undefined}
          renderItem={(item, index) => (
            <OrderItemCard
              item={item}
              product={appData.getProduct(item.sourceProduct?.sourceProductId)}
              allowReference={roleView.canReferenceProduct}
              allowOpenSource={!roleView.hideCommercialInfo}
              defaultExpanded={index < roleView.defaultExpandedItemCount}
              defaultExpandedBlocks={roleView.defaultExpandedBlocks}
              hideCommercialInfo={roleView.hideCommercialInfo}
              visibleBlocks={roleView.visibleItemBlocks}
              onReference={() => modal.open('product-picker', { itemId: item.id })}
              onOpenSource={() => drawer.open('source-product', { itemId: item.id })}
              onRemove={roleView.canAddItems ? () => handleRemoveItem(item.id) : undefined}
              disableRemove={order.items.length <= 1}
              onChange={(nextItem) =>
                appData.updateOrderItem(order.id, nextItem.id, () => recalculateOrderItem(nextItem, appData.getProduct(nextItem.sourceProduct?.sourceProductId)))
              }
            />
          )}
        />
        <OrderInfoCardGroup order={order} visibleCards={roleView.visibleInfoCards} hideCommercialInfo={roleView.hideCommercialInfo} />
        <OrderStatusFlowSection
          order={order}
          tasks={visibleOrderTasks}
          readOnly={roleView.statusFlowReadOnly}
          onTransition={handleTransitionStatus}
          onTransitionWithSuggestedTask={handleTransitionWithSuggestedTask}
        />
        <OrderTaskSection
          tasks={visibleOrderTasks}
          readOnly={roleView.taskReadOnly}
          canCreateTask={roleView.canCreateTask}
          onCreateTask={(type) => {
            appData.createTaskFromOrder({ orderId: order.id, type })
          }}
          onUpdateTask={(taskId, status) => {
            appData.updateTask(taskId, (current) => ({
              ...current,
              status
            }))
          }}
        />
        {roleView.showLogistics ? <LogisticsSection /> : null}
        {roleView.showAfterSales ? <AfterSalesSection /> : null}
        {roleView.showAttachments ? <OrderAttachmentSection /> : null}
        {roleView.showTimeline ? <OperationTimelineSection timeline={visibleTimeline} /> : null}
      </div>

      <ProductPickerModal
        open={modal.current === 'product-picker'}
        products={referableProducts}
        onClose={modal.close}
        onConfirm={(product) => handleConfirmReference(product.id)}
      />
      <SourceProductDrawer open={drawer.current === 'source-product'} product={drawerProduct} item={drawerItem} onClose={drawer.close} />
    </PageContainer>
  )
}
