import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppBreadcrumb } from '@/app/layout/AppBreadcrumb'
import { SourceProductDrawer, ProductPickerModal } from '@/components/business/bridge'
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
import { PageContainer, PageHeader, SectionCard } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { useDrawerState } from '@/hooks/useDrawerState'
import { useModalState } from '@/hooks/useModalState'
import { createOrderDraft } from '@/services/order/orderQueries'

export const OrderCreatePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const appData = useAppData()
  const [order, setOrder] = useState(() => createOrderDraft())
  const modal = useModalState()
  const drawer = useDrawerState()

  const pickerItemId = searchParams.get('itemId')
  const drawerItemId = searchParams.get('itemId')
  const selectedOrderItem = order.items.find((item) => item.id === pickerItemId)
  const drawerOrderItem = order.items.find((item) => item.id === drawerItemId)
  const drawerProduct = appData.getProduct(drawerOrderItem?.sourceProduct?.sourceProductId)

  const referableProducts = useMemo(() => appData.products.filter((item) => item.isReferable), [appData.products])

  const updateOrderField = (
    key:
      | 'orderType'
      | 'platformOrderNo'
      | 'ownerName'
      | 'customerName'
      | 'customerPhone'
      | 'customerAddress'
      | 'customerRemark'
      | 'paymentDate'
      | 'expectedDate'
      | 'promisedDate',
    value: string
  ) => setOrder((current) => ({ ...current, [key]: value }))

  const updateItem = (itemId: string, nextItem: typeof order.items[number]) =>
    setOrder((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === itemId ? nextItem : item))
    }))

  const handleAddItem = () =>
    setOrder((current) => ({
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

  const handleConfirmReference = (productId: string) => {
    const product = appData.getProduct(productId)
    if (!selectedOrderItem || !product) {
      return
    }

    updateItem(selectedOrderItem.id, buildReferencedOrderItem(selectedOrderItem, product))
    modal.close()
  }

  const handleSave = () => {
    const saved = appData.saveOrder({
      ...order,
      status: order.status || '草稿'
    })
    navigate(`/orders/${saved.id}`)
  }

  return (
    <PageContainer>
      <AppBreadcrumb items={[{ label: '订单中心', to: '/orders' }, { label: '新建订单' }]} />
      <PageHeader
        title="新建订单"
        subtitle="首轮先保证订单基础信息、商品明细、产品引用和规格报价都能在新建页演示。"
        actions={
          <>
            <button className="button secondary" onClick={() => navigate('/orders')}>
              返回列表
            </button>
            <button className="button primary" onClick={handleSave}>
              创建订单
            </button>
          </>
        }
      />

      <div className="stack">
        <SectionCard title="基础信息区">
          <div className="field-grid three">
            <div className="field-control">
              <label className="field-label">订单类型</label>
              <input className="input" value={order.orderType} onChange={(event) => updateOrderField('orderType', event.target.value)} />
            </div>
            <div className="field-control">
              <label className="field-label">平台订单编号</label>
              <input className="input" value={order.platformOrderNo || ''} onChange={(event) => updateOrderField('platformOrderNo', event.target.value)} />
            </div>
            <div className="field-control">
              <label className="field-label">客服负责人</label>
              <input className="input" value={order.ownerName} onChange={(event) => updateOrderField('ownerName', event.target.value)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="客户信息区">
          <div className="field-grid two">
            <div className="field-control">
              <label className="field-label">客户姓名</label>
              <input className="input" value={order.customerName || ''} onChange={(event) => updateOrderField('customerName', event.target.value)} />
            </div>
            <div className="field-control">
              <label className="field-label">联系方式</label>
              <input className="input" value={order.customerPhone || ''} onChange={(event) => updateOrderField('customerPhone', event.target.value)} />
            </div>
            <div className="field-control">
              <label className="field-label">平台原始地址</label>
              <input className="input" value={order.customerAddress || ''} onChange={(event) => updateOrderField('customerAddress', event.target.value)} />
            </div>
            <div className="field-control">
              <label className="field-label">客户备注</label>
              <input className="input" value={order.customerRemark || ''} onChange={(event) => updateOrderField('customerRemark', event.target.value)} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="时间信息区">
          <div className="field-grid three">
            <div className="field-control">
              <label className="field-label">付款时间</label>
              <input className="input" value={order.paymentDate || ''} onChange={(event) => updateOrderField('paymentDate', event.target.value)} />
            </div>
            <div className="field-control">
              <label className="field-label">客户期望时间</label>
              <input className="input" value={order.expectedDate || ''} onChange={(event) => updateOrderField('expectedDate', event.target.value)} />
            </div>
            <div className="field-control">
              <label className="field-label">承诺交期</label>
              <input className="input" value={order.promisedDate || ''} onChange={(event) => updateOrderField('promisedDate', event.target.value)} />
            </div>
          </div>
        </SectionCard>

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
                updateItem(nextItem.id, recalculateOrderItem(nextItem, appData.getProduct(nextItem.sourceProduct?.sourceProductId)))
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
      <SourceProductDrawer open={drawer.current === 'source-product'} product={drawerProduct} item={drawerOrderItem} onClose={drawer.close} />
    </PageContainer>
  )
}
