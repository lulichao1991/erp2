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

const defaultOrderTypeOptions = ['平台定制', '门店定制', '私域定制']

const toDateTimeInputValue = (value?: string) => (value ? value.replace(' ', 'T').slice(0, 16) : '')

const fromDateTimeInputValue = (value: string) => (value ? value.replace('T', ' ') : '')

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
  const orderTypeOptions = useMemo(
    () => Array.from(new Set([...defaultOrderTypeOptions, ...appData.orders.map((item) => item.orderType), order.orderType].filter(Boolean))),
    [appData.orders, order.orderType]
  )
  const ownerOptions = useMemo(
    () => Array.from(new Set(['待分配', ...appData.orders.map((item) => item.ownerName), order.ownerName].filter(Boolean))),
    [appData.orders, order.ownerName]
  )

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
              <label className="field-label" htmlFor="order-type">
                订单类型
              </label>
              <select
                id="order-type"
                className="select"
                value={order.orderType}
                onChange={(event) => updateOrderField('orderType', event.target.value)}
              >
                {orderTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="text-caption text-muted">先提供常用订单类型，后续可继续补平台字典。</span>
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="platform-order-no">
                平台订单编号
              </label>
              <input
                id="platform-order-no"
                className="input"
                value={order.platformOrderNo || ''}
                onChange={(event) => updateOrderField('platformOrderNo', event.target.value)}
                placeholder="例如：AMZ-9938201 / SHOP-001293"
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="order-owner">
                客服负责人
              </label>
              <select
                id="order-owner"
                className="select"
                value={order.ownerName}
                onChange={(event) => updateOrderField('ownerName', event.target.value)}
              >
                {ownerOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="text-caption text-muted">当前先用常用负责人列表，后续再升级为可搜索选择。</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="客户信息区">
          <div className="field-grid two">
            <div className="field-control">
              <label className="field-label" htmlFor="customer-name">
                客户姓名
              </label>
              <input
                id="customer-name"
                className="input"
                value={order.customerName || ''}
                onChange={(event) => updateOrderField('customerName', event.target.value)}
                placeholder="例如：林小姐"
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="customer-phone">
                联系方式
              </label>
              <input
                id="customer-phone"
                className="input"
                type="tel"
                value={order.customerPhone || ''}
                onChange={(event) => updateOrderField('customerPhone', event.target.value)}
                placeholder="例如：13800001234"
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="customer-address">
                平台原始地址
              </label>
              <input
                id="customer-address"
                className="input"
                value={order.customerAddress || ''}
                onChange={(event) => updateOrderField('customerAddress', event.target.value)}
                placeholder="可直接粘贴平台同步过来的原始地址"
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="customer-remark">
                客户备注
              </label>
              <input
                id="customer-remark"
                className="input"
                value={order.customerRemark || ''}
                onChange={(event) => updateOrderField('customerRemark', event.target.value)}
                placeholder="例如：礼盒卡片、加急、先确认尺寸"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="时间信息区">
          <div className="field-grid three">
            <div className="field-control">
              <label className="field-label" htmlFor="payment-date">
                付款时间
              </label>
              <input
                id="payment-date"
                className="input"
                type="datetime-local"
                value={toDateTimeInputValue(order.paymentDate)}
                onChange={(event) => updateOrderField('paymentDate', fromDateTimeInputValue(event.target.value))}
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="expected-date">
                客户期望时间
              </label>
              <input
                id="expected-date"
                className="input"
                type="date"
                value={order.expectedDate || ''}
                onChange={(event) => updateOrderField('expectedDate', event.target.value)}
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="promised-date">
                承诺交期
              </label>
              <input
                id="promised-date"
                className="input"
                type="date"
                value={order.promisedDate || ''}
                onChange={(event) => updateOrderField('promisedDate', event.target.value)}
              />
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
