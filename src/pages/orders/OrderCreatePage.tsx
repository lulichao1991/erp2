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
import { calculateOrderFinanceSummary, getOrderFinanceTransactionLabel } from '@/services/order/orderFinance'
import { addOrderSourceChannel, getOrderSourceChannels } from '@/services/order/orderFieldOptions'
import { createDraftOrderItem, createOrderDraft } from '@/services/order/orderQueries'
import type { OrderFinanceTransactionType } from '@/types/order'

const defaultOrderTypeOptions = ['销售订单', '内部订单']
const financeTransactionTypeOptions: OrderFinanceTransactionType[] = [
  'deposit_received',
  'balance_received',
  'platform_refund',
  'offline_refund',
  'after_sales_payment',
  'after_sales_refund'
]

const toDateTimeInputValue = (value?: string) => (value ? value.replace(' ', 'T').slice(0, 16) : '')

const fromDateTimeInputValue = (value: string) => (value ? value.replace('T', ' ') : '')

const createFinanceTransactionDraft = (index: number) => ({
  id: `finance-${Date.now()}-${index}`,
  type: 'deposit_received' as OrderFinanceTransactionType,
  amount: 0,
  occurredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  note: ''
})

export const OrderCreatePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const appData = useAppData()
  const [order, setOrder] = useState(() => createOrderDraft())
  const [sourceChannels, setSourceChannels] = useState(() => getOrderSourceChannels())
  const [customSourceChannel, setCustomSourceChannel] = useState('')
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
  const sourceChannelOptions = useMemo(
    () => Array.from(new Set([...sourceChannels, ...appData.orders.map((item) => item.sourceChannel), order.sourceChannel].filter(Boolean))),
    [appData.orders, order.sourceChannel, sourceChannels]
  )
  const ownerOptions = useMemo(
    () => Array.from(new Set(['待分配', ...appData.orders.map((item) => item.ownerName), order.ownerName].filter(Boolean))),
    [appData.orders, order.ownerName]
  )
  const financeSummary = useMemo(() => calculateOrderFinanceSummary(order), [order])

  const updateOrderField = (
    key:
      | 'orderType'
      | 'platformOrderNo'
      | 'ownerName'
      | 'hasAdditionalContact'
      | 'isPositiveReview'
      | 'platformCustomerId'
      | 'sourceChannel'
      | 'registeredAt'
      | 'customerName'
      | 'customerPhone'
      | 'customerAddress'
      | 'customerRemark'
      | 'paymentDate'
      | 'expectedDate'
      | 'plannedDate'
      | 'promisedDate',
    value: string | boolean
  ) => setOrder((current) => ({ ...current, [key]: value }))

  const updateFinanceField = (key: 'dealPrice' | 'depositAmount' | 'balanceAmount', rawValue: string) =>
    setOrder((current) => ({
      ...current,
      finance: {
        ...current.finance,
        transactions: current.finance?.transactions ?? [],
        [key]: rawValue === '' ? undefined : Number(rawValue)
      }
    }))

  const updateFinanceMeta = (key: 'invoiced' | 'remark', value: boolean | string) =>
    setOrder((current) => ({
      ...current,
      finance: {
        ...current.finance,
        transactions: current.finance?.transactions ?? [],
        [key]: value
      }
    }))

  const addFinanceTransaction = () =>
    setOrder((current) => ({
      ...current,
      finance: {
        ...current.finance,
        transactions: [...(current.finance?.transactions ?? []), createFinanceTransactionDraft((current.finance?.transactions ?? []).length + 1)]
      }
    }))

  const updateFinanceTransaction = (
    transactionId: string,
    patch: Partial<{
      type: OrderFinanceTransactionType
      amount: number
      occurredAt: string
      note: string
    }>
  ) =>
    setOrder((current) => ({
      ...current,
      finance: {
        ...current.finance,
        transactions: (current.finance?.transactions ?? []).map((transaction) =>
          transaction.id === transactionId ? { ...transaction, ...patch } : transaction
        )
      }
    }))

  const removeFinanceTransaction = (transactionId: string) =>
    setOrder((current) => ({
      ...current,
      finance: {
        ...current.finance,
        transactions: (current.finance?.transactions ?? []).filter((transaction) => transaction.id !== transactionId)
      }
    }))

  const updateItem = (itemId: string, nextItem: typeof order.items[number]) =>
    setOrder((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === itemId ? nextItem : item))
    }))

  const handleAddItem = () =>
    setOrder((current) => ({
      ...current,
      items: [...current.items, createDraftOrderItem(current.items.length + 1)]
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
      status: order.status || 'draft'
    })
    navigate(`/orders/${saved.id}`)
  }

  const handleAddSourceChannel = () => {
    const nextChannels = addOrderSourceChannel(customSourceChannel, sourceChannels)
    setSourceChannels(nextChannels)
    updateOrderField('sourceChannel', customSourceChannel.trim())
    setCustomSourceChannel('')
  }

  return (
    <PageContainer>
      <AppBreadcrumb items={[{ label: '商品任务中心', to: '/orders' }, { label: '新建交易记录' }]} />
      <PageHeader
        title="新建交易记录"
        actions={
          <>
            <button className="button secondary" onClick={() => navigate('/orders')}>
              返回商品任务中心
            </button>
            <button className="button primary" onClick={handleSave}>
              创建交易记录
            </button>
          </>
        }
      />

      <div className="stack">
        <SectionCard title="交易公共信息区" description="这里维护一次购买的公共信息；下方每张商品卡代表一条独立商品任务。">
          <div className="field-grid three">
            <div className="field-control">
              <label className="field-label" htmlFor="order-type">
                交易类型
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
              <span className="text-caption text-muted">销售订单用于对外销售场景，内部订单用于研发或内部设计流转。</span>
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
                负责人
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
            <div className="field-control">
              <label className="field-label" htmlFor="platform-customer-id">
                平台ID
              </label>
              <input
                id="platform-customer-id"
                className="input"
                value={order.platformCustomerId || ''}
                onChange={(event) => updateOrderField('platformCustomerId', event.target.value)}
                placeholder="例如：tb_linxiaojie_2218"
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="source-channel">
                来源渠道
              </label>
              <select
                id="source-channel"
                className="select"
                value={order.sourceChannel || ''}
                onChange={(event) => updateOrderField('sourceChannel', event.target.value)}
              >
                <option value="">请选择来源渠道</option>
                {sourceChannelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="row wrap spacer-top">
                <input
                  className="input"
                  value={customSourceChannel}
                  onChange={(event) => setCustomSourceChannel(event.target.value)}
                  placeholder="补充新渠道，例如：视频号"
                />
                <button className="button secondary" type="button" onClick={handleAddSourceChannel} disabled={customSourceChannel.trim().length === 0}>
                  加入渠道候选
                </button>
              </div>
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="registered-at">
                交易登记时间
              </label>
              <input id="registered-at" className="input" value={order.registeredAt || ''} readOnly />
              <span className="text-caption text-muted">新建交易记录时系统自动生成，不需要客服手动输入。</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="客户与收件信息区" description="客户信息沉淀在交易记录层，用于给下方多个商品任务复用。">
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
            <div className="field-control">
              <label className="field-label" htmlFor="has-additional-contact">
                是否添加联系方式
              </label>
              <select
                id="has-additional-contact"
                className="select"
                value={order.hasAdditionalContact ? 'yes' : 'no'}
                onChange={(event) => updateOrderField('hasAdditionalContact', event.target.value === 'yes')}
              >
                <option value="no">否</option>
                <option value="yes">是</option>
              </select>
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="is-positive-review">
                是否好评
              </label>
              <select
                id="is-positive-review"
                className="select"
                value={order.isPositiveReview ? 'yes' : 'no'}
                onChange={(event) => updateOrderField('isPositiveReview', event.target.value === 'yes')}
              >
                <option value="no">否</option>
                <option value="yes">是</option>
              </select>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="时间与交付区">
          <div className="field-grid four">
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
              <label className="field-label" htmlFor="planned-date">
                计划交期
              </label>
              <input
                id="planned-date"
                className="input"
                type="date"
                value={order.plannedDate || ''}
                onChange={(event) => updateOrderField('plannedDate', event.target.value)}
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

        <SectionCard title="交易财务信息区" description="这里记录整笔交易的收退款与成交信息，系统参考价仅作内部参考。">
          <div className="field-grid four">
            <div className="field-control">
              <label className="field-label" htmlFor="reference-price">
                系统参考价
              </label>
              <input id="reference-price" className="input" value={financeSummary.referencePrice ? `${financeSummary.referencePrice}` : ''} readOnly />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="deal-price">
                交易成交价
              </label>
              <input
                id="deal-price"
                className="input"
                type="number"
                min="0"
                value={order.finance?.dealPrice ?? ''}
                onChange={(event) => updateFinanceField('dealPrice', event.target.value)}
                placeholder="例如：8500"
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="deposit-amount">
                定金
              </label>
              <input
                id="deposit-amount"
                className="input"
                type="number"
                min="0"
                value={order.finance?.depositAmount ?? ''}
                onChange={(event) => updateFinanceField('depositAmount', event.target.value)}
                placeholder="例如：5000"
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="balance-amount">
                尾款
              </label>
              <input
                id="balance-amount"
                className="input"
                type="number"
                min="0"
                value={order.finance?.balanceAmount ?? ''}
                onChange={(event) => updateFinanceField('balanceAmount', event.target.value)}
                placeholder="例如：3500"
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="total-received">
                累计收款
              </label>
              <input id="total-received" className="input" value={financeSummary.totalReceived ? `${financeSummary.totalReceived}` : ''} readOnly />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="total-refunded">
                累计退款
              </label>
              <input id="total-refunded" className="input" value={financeSummary.totalRefunded ? `${financeSummary.totalRefunded}` : ''} readOnly />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="net-received">
                累计净收款
              </label>
              <input id="net-received" className="input" value={financeSummary.netReceived ? `${financeSummary.netReceived}` : ''} readOnly />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="finance-invoiced">
                是否开过发票
              </label>
              <select
                id="finance-invoiced"
                className="select"
                value={order.finance?.invoiced ? 'yes' : 'no'}
                onChange={(event) => updateFinanceMeta('invoiced', event.target.value === 'yes')}
              >
                <option value="no">否</option>
                <option value="yes">是</option>
              </select>
            </div>
          </div>

          <div className="field-control spacer-top">
            <label className="field-label" htmlFor="finance-remark">
              财务备注
            </label>
            <textarea
              id="finance-remark"
              className="textarea"
              value={order.finance?.remark || ''}
              onChange={(event) => updateFinanceMeta('remark', event.target.value)}
              placeholder="例如：活动价成交，平台与线下退款需要拆开记录。"
            />
          </div>

          <div className="subtle-panel spacer-top">
            <div className="row wrap" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>财务流水</strong>
              <button className="button secondary small" type="button" onClick={addFinanceTransaction}>
                新增财务流水
              </button>
            </div>
            {order.finance?.transactions.length ? (
              <div className="stack">
                {order.finance.transactions.map((transaction, index) => (
                  <div key={transaction.id} className="subtle-panel">
                    <div className="field-grid four">
                      <div className="field-control">
                        <label className="field-label" htmlFor={`finance-type-${transaction.id}`}>
                          流水类型
                        </label>
                        <select
                          id={`finance-type-${transaction.id}`}
                          className="select"
                          aria-label={`财务流水类型-${index + 1}`}
                          value={transaction.type}
                          onChange={(event) =>
                            updateFinanceTransaction(transaction.id, {
                              type: event.target.value as OrderFinanceTransactionType
                            })
                          }
                        >
                          {financeTransactionTypeOptions.map((option) => (
                            <option key={option} value={option}>
                              {getOrderFinanceTransactionLabel(option)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field-control">
                        <label className="field-label" htmlFor={`finance-amount-${transaction.id}`}>
                          金额
                        </label>
                        <input
                          id={`finance-amount-${transaction.id}`}
                          className="input"
                          type="number"
                          min="0"
                          aria-label={`财务流水金额-${index + 1}`}
                          value={transaction.amount}
                          onChange={(event) =>
                            updateFinanceTransaction(transaction.id, {
                              amount: event.target.value === '' ? 0 : Number(event.target.value)
                            })
                          }
                        />
                      </div>
                      <div className="field-control">
                        <label className="field-label" htmlFor={`finance-time-${transaction.id}`}>
                          发生时间
                        </label>
                        <input
                          id={`finance-time-${transaction.id}`}
                          className="input"
                          type="datetime-local"
                          aria-label={`财务流水时间-${index + 1}`}
                          value={toDateTimeInputValue(transaction.occurredAt)}
                          onChange={(event) =>
                            updateFinanceTransaction(transaction.id, {
                              occurredAt: fromDateTimeInputValue(event.target.value)
                            })
                          }
                        />
                      </div>
                      <div className="field-control">
                        <label className="field-label" htmlFor={`finance-note-${transaction.id}`}>
                          备注
                        </label>
                        <input
                          id={`finance-note-${transaction.id}`}
                          className="input"
                          aria-label={`财务流水备注-${index + 1}`}
                          value={transaction.note || ''}
                          onChange={(event) =>
                            updateFinanceTransaction(transaction.id, {
                              note: event.target.value
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="row wrap spacer-top" style={{ justifyContent: 'flex-end' }}>
                      <button className="button ghost small" type="button" onClick={() => removeFinanceTransaction(transaction.id)}>
                        删除流水
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted">暂无财务流水，可先记录定金、尾款、平台退款和售后补退款。</div>
            )}
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
        <OperationTimelineSection timeline={order.timeline} />
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
