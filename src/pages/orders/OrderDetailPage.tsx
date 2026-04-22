import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AppBreadcrumb } from '@/app/layout/AppBreadcrumb'
import { ProductPickerModal, SourceProductDrawer } from '@/components/business/bridge'
import {
  AfterSalesSection,
  buildReferencedOrderItem,
  LogisticsSection,
  OperationTimelineSection,
  OrderAttachmentSection,
  OrderInfoCardGroup,
  OrderItemCard,
  OrderItemsSection,
  OrderSummaryCard,
  recalculateOrderItem
} from '@/components/business/order'
import { EmptyState, PageContainer, PageHeader } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { useDrawerState } from '@/hooks/useDrawerState'
import { useModalState } from '@/hooks/useModalState'

export const OrderDetailPage = () => {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const appData = useAppData()
  const order = appData.getOrder(orderId)
  const modal = useModalState()
  const drawer = useDrawerState()

  const pickerItemId = searchParams.get('itemId')
  const drawerItemId = searchParams.get('itemId')

  const pickerItem = order?.items.find((item) => item.id === pickerItemId)
  const drawerItem = order?.items.find((item) => item.id === drawerItemId)
  const drawerProduct = appData.getProduct(drawerItem?.sourceProduct?.sourceProductId)

  const referableProducts = useMemo(() => appData.products.filter((item) => item.isReferable), [appData.products])

  if (!order) {
    return (
      <PageContainer>
        <EmptyState title="未找到订单" description="当前订单不存在，可能是链接失效或 mock 数据尚未包含该订单。" />
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
      items: [
        ...current.items,
        {
          id: `item-${Date.now()}`,
          name: `新商品 ${current.items.length + 1}`,
          quantity: 1,
          status: '待引用',
          isReferencedProduct: false,
          selectedSpecialOptions: [],
          actualRequirements: {},
          designInfo: {
            designStatus: '待设计',
            assignedDesigner: '',
            requiresRemodeling: false,
            designDeadline: '',
            designNote: ''
          },
          outsourceInfo: {
            outsourceStatus: '未委外',
            supplierName: '',
            plannedDeliveryDate: '',
            outsourceNote: ''
          },
          factoryFeedback: {
            factoryStatus: '待回传',
            returnedWeight: '',
            qualityResult: '',
            factoryNote: ''
          },
          quote: {
            basePrice: undefined,
            priceAdjustments: [],
            systemQuote: undefined,
            status: 'idle',
            warnings: []
          }
        }
      ]
    }))
  }

  return (
    <PageContainer>
      <AppBreadcrumb items={[{ label: '订单中心', to: '/orders' }, { label: '订单详情' }, { label: order.orderNo }]} />
      <PageHeader
        title="订单详情"
        subtitle="订单详情页采用顶部概览、订单级信息区、商品协同区和记录区四层结构，不做超长大表单。"
      />
      <div className="stack">
        <OrderSummaryCard order={order} />
        <OrderInfoCardGroup order={order} />
        <OrderItemsSection
          order={order}
          onAddItem={handleAddItem}
          renderItem={(item) => (
            <OrderItemCard
              item={item}
              product={appData.getProduct(item.sourceProduct?.sourceProductId)}
              onReference={() => modal.open('product-picker', { itemId: item.id })}
              onOpenSource={() => drawer.open('source-product', { itemId: item.id })}
              onChange={(nextItem) =>
                appData.updateOrderItem(order.id, nextItem.id, () => recalculateOrderItem(nextItem, appData.getProduct(nextItem.sourceProduct?.sourceProductId)))
              }
            />
          )}
        />
        <LogisticsSection />
        <AfterSalesSection />
        <OrderAttachmentSection />
        <OperationTimelineSection />
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
