import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  EmptyState,
  FileList as AssetFileList,
  InfoField,
  InfoGrid,
  PageHeader,
  RecordTimeline,
  RiskTag,
  SectionCard,
  StatusTag,
  SummaryCard,
  TimePressureBadge,
  VersionBadge
} from '@/components/common'
import { useOrderQuote } from '@/hooks/useOrderQuote'
import { buildQuoteResult } from '@/services/quote/quoteService'
import {
  getAllowedNextStatuses,
  getOrderBusinessStageKey,
  getOrderStatusDescription,
  getOrderPriorityLabel,
  getOrderStatusLabel,
  orderBusinessStages,
  getSuggestedTaskTypeForOrderStatus,
  isTaskOpenStatus,
  getTaskAssigneeRoleLabel,
  getTaskStatusLabel,
  getTaskTypeLabel
} from '@/services/workflow/workflowMeta'
import { calculateOrderFinanceSummary, getOrderFinanceTransactionLabel } from '@/services/order/orderFinance'
import type { Order, OrderItem, OrderItemUploadedFile, OrderStatus, TimelineRecord } from '@/types/order'
import type { Product } from '@/types/product'
import type { QuoteResult } from '@/types/quote'
import type { Task, TaskAssigneeRole, TaskStatus, TaskType } from '@/types/task'

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')
const orderTaskTypeOptions: TaskType[] = ['order_process', 'design_modeling', 'production_prep', 'factory_production', 'after_sales']

export type OrderLineListRow = {
  order: Order
  item: OrderItem
}

export type OrderInfoCardKey = 'customer_platform' | 'delivery' | 'summary' | 'finance'
export type OrderItemBlockKey = 'spec_pricing' | 'factory_production' | 'customer' | 'design' | 'outsource' | 'factory'
export type OrderInfoDraft = {
  ownerName: string
  customerName: string
  customerPhone: string
  platformCustomerId: string
  sourceChannel: string
  hasAdditionalContact: boolean
  isPositiveReview: boolean
  customerAddress: string
  customerRemark: string
  paymentDate: string
  expectedDate: string
  plannedDate: string
  promisedDate: string
  remark: string
}

export const createOrderInfoDraft = (order: Order): OrderInfoDraft => ({
  ownerName: order.ownerName || '',
  customerName: order.customerName || '',
  customerPhone: order.customerPhone || '',
  platformCustomerId: order.platformCustomerId || '',
  sourceChannel: order.sourceChannel || '',
  hasAdditionalContact: order.hasAdditionalContact ?? false,
  isPositiveReview: order.isPositiveReview ?? false,
  customerAddress: order.customerAddress || '',
  customerRemark: order.customerRemark || '',
  paymentDate: order.paymentDate || '',
  expectedDate: order.expectedDate || '',
  plannedDate: order.plannedDate || '',
  promisedDate: order.promisedDate || '',
  remark: order.remark || ''
})

const getTimePressure = (promisedDate?: string) => {
  if (!promisedDate) {
    return { label: '待确认交期', variant: 'normal' as const }
  }

  const promised = new Date(promisedDate)
  const now = new Date()
  const diffDays = Math.ceil((promised.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { label: `已超时 ${Math.abs(diffDays)} 天`, variant: 'overdue' as const }
  }

  if (diffDays <= 3) {
    return { label: `剩余 ${diffDays} 天`, variant: 'dueSoon' as const }
  }

  return { label: `剩余 ${diffDays} 天`, variant: 'normal' as const }
}

const createUploadedOrderFiles = (files: File[], prefix: string): OrderItemUploadedFile[] =>
  files.map((file, index) => ({
    id: `${prefix}-${Date.now()}-${index}`,
    name: file.name,
    url: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : ''
  }))

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && Boolean(target.closest('button, a, input, select, textarea, label'))

const buildOrderItemHeaderSummary = (item: OrderItem, isFactoryView: boolean) => {
  const summaryParts = [
    item.selectedMaterial || item.actualRequirements?.material ? `材质 ${item.selectedMaterial || item.actualRequirements?.material}` : null,
    item.selectedProcess || item.actualRequirements?.process ? `工艺 ${item.selectedProcess || item.actualRequirements?.process}` : null,
    item.selectedSpecValue ? `规格 ${item.selectedSpecValue}` : null,
    item.actualRequirements?.sizeNote ? `尺寸 ${item.actualRequirements.sizeNote}` : null,
    isFactoryView && item.itemSku ? `货号 ${item.itemSku}` : null
  ].filter(Boolean)

  return summaryParts.length > 0 ? summaryParts.join(' / ') : '待补充参数'
}

const getOrderItemRemarkSummary = (item: OrderItem) => item.actualRequirements?.remark || '—'
const getOrderItemFinalQuoteValue = (item: OrderItem, quote?: QuoteResult) => {
  if (typeof item.finalDisplayQuote === 'number') {
    return item.finalDisplayQuote
  }
  if (typeof quote?.systemQuote !== 'number') {
    return undefined
  }
  return quote.systemQuote + (item.manualAdjustment || 0)
}

const getOrderItemStatusTone = (status?: string) => {
  switch (status) {
    case '待确认':
      return 'pending'
    case '设计确认中':
      return 'design'
    case '待下厂':
      return 'outsource'
    case '生产中':
      return 'producing'
    case '待回传':
      return 'feedback'
    case '待发货':
      return 'shipping'
    default:
      return 'pending'
  }
}

export const buildReferencedOrderItem = (item: OrderItem, product: Product): OrderItem => ({
  ...item,
  name: product.name,
  itemSku: item.itemSku || product.code,
  status: '待确认',
  isReferencedProduct: true,
  sourceProduct: {
    sourceProductId: product.id,
    sourceProductCode: product.code,
    sourceProductName: product.name,
    sourceProductVersion: product.version
  },
  selectedSpecValue: undefined,
  selectedSpecSnapshot: undefined,
  selectedMaterial: product.defaultMaterial,
  selectedProcess: product.defaultProcess,
  selectedSpecialOptions: [],
  actualRequirements: {
    ...item.actualRequirements,
    material: product.defaultMaterial,
    process: product.defaultProcess
  },
  quote: buildQuoteResult({
    selectedSpec: undefined,
    selectedMaterial: product.defaultMaterial,
    selectedProcess: product.defaultProcess,
    selectedSpecialOptions: [],
    rules: product.priceRules,
    specRequired: product.isSpecRequired
  })
})

export const recalculateOrderItem = (item: OrderItem, product?: Product): OrderItem => {
  if (!product) {
    return item
  }

  return {
    ...item,
    quote: buildQuoteResult({
      selectedSpec: item.selectedSpecSnapshot,
      selectedMaterial: item.selectedMaterial,
      selectedProcess: item.selectedProcess,
      selectedSpecialOptions: item.selectedSpecialOptions,
      rules: product.priceRules,
      specRequired: product.isSpecRequired
    })
  }
}

export const OrderListHeader = () => (
  <PageHeader
    title="旧订单兼容"
    className="compact-page-header"
    actions={
      <>
        <Link to="/order-lines" className="button secondary">
          商品行中心
        </Link>
        <Link to="/purchases/new" className="button secondary">
          新建购买记录
        </Link>
        <Link to="/orders/new" className="button primary">
          新建旧交易记录
        </Link>
      </>
    }
  />
)

export const OrderQuickStats = ({ rows }: { rows: OrderLineListRow[] }) => {
  const stats = [
    { label: '全部商品任务', value: rows.length },
    { label: '待确认', value: rows.filter((entry) => entry.item.status === '待确认').length },
    { label: '设计确认中', value: rows.filter((entry) => entry.item.status === '设计确认中').length },
    { label: '待发货', value: rows.filter((entry) => entry.item.status === '待发货').length },
    { label: '售后中', value: rows.filter((entry) => entry.item.status === '售后中').length },
    { label: '已引用模板', value: rows.filter((entry) => entry.item.isReferencedProduct).length }
  ]

  return (
    <div className="stats-grid compact-stats">
      {stats.map((item) => (
        <div key={item.label} className="stat-card compact-stat">
          <div className="stat-card-label">{item.label}</div>
          <div className="stat-card-value">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

type OrderFilterValue = {
  keyword: string
  status: 'all' | string
  owner: string
}

export const OrderFilterBar = ({
  value,
  onChange
}: {
  value: OrderFilterValue
  onChange: (next: OrderFilterValue) => void
}) => (
  <SectionCard title="搜索与筛选" description="当前一行代表一条商品任务，可按交易编号、商品任务名称和负责人快速定位。" className="compact-card">
    <div className="field-grid three">
      <div className="field-control">
        <label className="field-label">搜索交易编号 / 平台单号 / 客户 / 商品任务</label>
        <input className="input" value={value.keyword} onChange={(event) => onChange({ ...value, keyword: event.target.value })} />
      </div>
      <div className="field-control">
        <label className="field-label">商品任务状态</label>
        <select className="select" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value as OrderFilterValue['status'] })}>
          <option value="all">全部状态</option>
          <option value="待确认">待确认</option>
          <option value="设计确认中">设计确认中</option>
          <option value="待发货">待发货</option>
          <option value="售后中">售后中</option>
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">商品任务负责人</label>
        <input className="input" value={value.owner} onChange={(event) => onChange({ ...value, owner: event.target.value })} placeholder="例如：张晨" />
      </div>
    </div>
  </SectionCard>
)

export const OrderTable = ({ rows }: { rows: OrderLineListRow[] }) => (
  <div className="table-shell">
    <table className="table">
      <thead>
        <tr>
          <th>风险</th>
          <th>交易编号</th>
          <th>客户</th>
          <th>商品任务</th>
          <th>来源模板 / 规格</th>
          <th>商品任务状态</th>
          <th>承诺交期</th>
          <th>负责人</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ order, item }) => {
          const pressure = getTimePressure(order.promisedDate)
          return (
            <tr key={`${order.id}-${item.id}`}>
              <td>{order.riskTags.length > 0 ? <RiskTag value={order.riskTags[0]} /> : <span className="text-muted">—</span>}</td>
              <td>
                <div className="stack" style={{ gap: 6 }}>
                  <Link to={`/orders/${order.id}`} className="text-price">
                    {order.orderNo}
                  </Link>
                  <span className="text-caption">{order.platformOrderNo || '无平台单号'}</span>
                </div>
              </td>
              <td>
                <div>{order.customerName || '—'}</div>
                <div className="text-caption">{order.customerPhone || '—'}</div>
              </td>
              <td>
                <div>{item.name}</div>
                <div className="text-caption">{item.itemSku || '待维护货号'}</div>
              </td>
              <td>
                <div>{item.sourceProduct?.sourceProductName || '未引用模板'}</div>
                <div className="text-caption">{item.selectedSpecValue || '未选规格'}</div>
              </td>
              <td>
                <div className="stack" style={{ gap: 6 }}>
                  <StatusTag value={item.status || '待确认'} />
                  <span className="text-caption">{getOrderPriorityLabel(order.priority)}</span>
                </div>
              </td>
              <td>
                <div>{order.promisedDate || '—'}</div>
                <div className="spacer-top">
                  <TimePressureBadge label={pressure.label} variant={pressure.variant} />
                </div>
              </td>
              <td>{item.currentOwner || order.ownerName}</td>
              <td>
                <div className="row wrap">
                  <Link to={`/orders/${order.id}`} className="button ghost small">
                    查看交易详情
                  </Link>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

export const OrderSummaryCard = ({
  order,
  role = 'operations',
  visibleInfoCards = ['customer_platform', 'delivery', 'summary'],
  hideCommercialInfo = false,
  editable = false,
  isEditing = false,
  editDraft,
  onEditDraftChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  actions
}: {
  order: Order
  role?: TaskAssigneeRole
  visibleInfoCards?: OrderInfoCardKey[]
  hideCommercialInfo?: boolean
  editable?: boolean
  isEditing?: boolean
  editDraft?: OrderInfoDraft
  onEditDraftChange?: (next: OrderInfoDraft) => void
  onStartEdit?: () => void
  onCancelEdit?: () => void
  onSaveEdit?: () => void
  actions?: ReactNode
}) => {
  const pressure = getTimePressure(order.promisedDate)
  const isFactoryView = role === 'factory'
  const currentDraft = editDraft ?? createOrderInfoDraft(order)
  const updateDraft = (patch: Partial<OrderInfoDraft>) => {
    if (!onEditDraftChange) {
      return
    }
    onEditDraftChange({ ...currentDraft, ...patch })
  }
  const summaryActions = editable
    ? isEditing
      ? (
          <>
            <button type="button" className="button secondary small" onClick={onCancelEdit}>
              取消
            </button>
            <button type="button" className="button primary small" onClick={onSaveEdit}>
              保存修改
            </button>
          </>
        )
      : (
          <button type="button" className="button secondary small" onClick={onStartEdit}>
            编辑交易信息
          </button>
        )
    : actions
  const topMetaFields = [
    !hideCommercialInfo ? { label: '交易类型', value: order.orderType } : null,
    !hideCommercialInfo ? { label: '负责人', value: currentDraft.ownerName || '—' } : null,
    { label: '客户期望时间', value: currentDraft.expectedDate || '—' },
    { label: '计划交期', value: currentDraft.plannedDate || '—' },
    { label: '承诺交期', value: currentDraft.promisedDate || '—' }
  ].filter(Boolean) as Array<{ label: string; value: ReactNode }>
  const baseSections = [
    visibleInfoCards.includes('customer_platform') && !hideCommercialInfo
      ? {
          key: 'customer_platform',
          title: '客户与平台',
          fields: [
            { label: '客户姓名', value: currentDraft.customerName || '—' },
            { label: '平台ID', value: currentDraft.platformCustomerId || '—' },
            { label: '联系电话', value: currentDraft.customerPhone || '—' },
            { label: '来源渠道', value: currentDraft.sourceChannel || '—' },
            { label: '是否添加联系方式', value: currentDraft.hasAdditionalContact ? '是' : '否' },
            { label: '是否好评', value: currentDraft.isPositiveReview ? '是' : '否' },
            { label: '平台原始地址', value: currentDraft.customerAddress || '—' },
            { label: '客户备注', value: currentDraft.customerRemark || '—' }
          ]
        }
      : null,
    visibleInfoCards.includes('delivery')
      ? {
          key: 'delivery',
          title: '时间与交付',
          fields: [
            { label: '交易登记时间', value: order.registeredAt || '—' },
            ...(!hideCommercialInfo ? [{ label: '付款时间', value: currentDraft.paymentDate || '—' }] : [])
          ]
        }
      : null,
    visibleInfoCards.includes('summary')
      ? {
          key: 'summary',
          title: '交易摘要',
          fields: [
            { label: '最近活动', value: order.latestActivityAt || '—' },
            { label: '交易备注', value: currentDraft.remark || '—' }
          ]
        }
      : null
  ].filter(Boolean) as Array<{ key: string; title: string; fields: Array<{ label: string; value: ReactNode }> }>
  const flattenedFields = baseSections.flatMap((section) => section.fields)
  const summaryPreviewLimit = order.items.length <= 4 ? order.items.length : order.items.length <= 6 ? 6 : 8
  const summaryItems = order.items.slice(0, summaryPreviewLimit)
  const remainingItemCount = Math.max(order.items.length - summaryItems.length, 0)
  const productListClassName = `order-summary-product-list${summaryItems.length > 1 ? ' compact-grid' : ''}`

  return (
    <section className="summary-card order-summary-shell">
      <div className="order-summary-compact">
        <div className="stack order-summary-hero">
          <div>
            <h2 style={{ margin: 0 }}>{order.orderNo}</h2>
            <p className="text-muted">{order.platformOrderNo || '未维护平台单号'}</p>
          </div>
          <div className="row wrap">
            <StatusTag value={getOrderStatusLabel(order.status)} />
            {order.priority === 'normal' ? <StatusTag value={getOrderPriorityLabel(order.priority)} /> : <RiskTag value={getOrderPriorityLabel(order.priority)} />}
            <TimePressureBadge label={pressure.label} variant={pressure.variant} />
            {order.riskTags.map((item) => (
              <RiskTag key={item} value={item} />
            ))}
          </div>
          {summaryActions ? <div className="row wrap order-summary-actions">{summaryActions}</div> : null}
        </div>
        <div className="order-summary-side">
          {isEditing && !hideCommercialInfo ? (
            <div className="order-summary-inline-meta order-summary-inline-meta-edit">
              <div className="field-control order-summary-inline-editor">
                <label className="field-label" htmlFor="order-summary-owner-name">
                  负责人
                </label>
                <input
                  id="order-summary-owner-name"
                  className="input"
                  value={currentDraft.ownerName}
                  onChange={(event) => updateDraft({ ownerName: event.target.value })}
                />
              </div>
              <div className="field-control order-summary-inline-editor">
                <label className="field-label" htmlFor="order-summary-expected-date">
                  客户期望时间
                </label>
                <input
                  id="order-summary-expected-date"
                  className="input"
                  type="date"
                  value={currentDraft.expectedDate}
                  onChange={(event) => updateDraft({ expectedDate: event.target.value })}
                />
              </div>
              <div className="field-control order-summary-inline-editor">
                <label className="field-label" htmlFor="order-summary-planned-date">
                  计划交期
                </label>
                <input
                  id="order-summary-planned-date"
                  className="input"
                  type="date"
                  value={currentDraft.plannedDate}
                  onChange={(event) => updateDraft({ plannedDate: event.target.value })}
                />
              </div>
              <div className="field-control order-summary-inline-editor">
                <label className="field-label" htmlFor="order-summary-promised-date">
                  承诺交期
                </label>
                <input
                  id="order-summary-promised-date"
                  className="input"
                  type="date"
                  value={currentDraft.promisedDate}
                  onChange={(event) => updateDraft({ promisedDate: event.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="order-summary-inline-meta">
              {topMetaFields.map((field) => (
                <div key={field.label} className="order-summary-inline-item">
                  <span className="order-summary-metric-label">{field.label}</span>
                  <strong className="order-summary-inline-value">{field.value}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="order-summary-product-block">
            <span className="order-summary-metric-label">{isFactoryView ? `生产货号 / 商品任务（${order.items.length}）` : `商品任务（${order.items.length}）`}</span>
            <ul className={productListClassName}>
              {summaryItems.map((item) => (
                <li key={item.id} className="order-summary-product-item">
                  <div className="order-summary-product-copy">
                    <strong>{item.name}</strong>
                    <span className="text-caption">{buildOrderItemHeaderSummary(item, isFactoryView)}</span>
                  </div>
                </li>
              ))}
              {remainingItemCount > 0 ? (
                <li className="order-summary-product-item more">
                  <div className="order-summary-product-copy">
                    <strong>还有 {remainingItemCount} 条商品任务</strong>
                    <span className="text-caption">下方商品任务区可查看全部任务明细。</span>
                  </div>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
      {isEditing && !hideCommercialInfo ? (
        <div className="spacer-top order-summary-edit-shell">
          <div className="field-grid four order-summary-edit-grid">
            <div className="field-control">
              <label className="field-label" htmlFor="order-summary-customer-name">
                客户姓名
              </label>
              <input
                id="order-summary-customer-name"
                className="input"
                value={currentDraft.customerName}
                onChange={(event) => updateDraft({ customerName: event.target.value })}
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="order-summary-customer-phone">
                联系电话
              </label>
              <input
                id="order-summary-customer-phone"
                className="input"
                value={currentDraft.customerPhone}
                onChange={(event) => updateDraft({ customerPhone: event.target.value })}
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="order-summary-platform-id">
                平台ID
              </label>
              <input
                id="order-summary-platform-id"
                className="input"
                value={currentDraft.platformCustomerId}
                onChange={(event) => updateDraft({ platformCustomerId: event.target.value })}
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="order-summary-source-channel">
                来源渠道
              </label>
              <input
                id="order-summary-source-channel"
                className="input"
                value={currentDraft.sourceChannel}
                onChange={(event) => updateDraft({ sourceChannel: event.target.value })}
              />
            </div>
            <div className="field-control order-summary-boolean-pair">
              <div className="order-summary-boolean-item">
                <label className="field-label">是否添加联系方式</label>
                <div className="boolean-toggle-group" role="radiogroup" aria-label="是否添加联系方式">
                  <button
                    type="button"
                    className={`button small ${currentDraft.hasAdditionalContact ? 'primary' : 'secondary'}`}
                    aria-pressed={currentDraft.hasAdditionalContact}
                    onClick={() => updateDraft({ hasAdditionalContact: true })}
                  >
                    是
                  </button>
                  <button
                    type="button"
                    className={`button small ${currentDraft.hasAdditionalContact ? 'secondary' : 'primary'}`}
                    aria-pressed={!currentDraft.hasAdditionalContact}
                    onClick={() => updateDraft({ hasAdditionalContact: false })}
                  >
                    否
                  </button>
                </div>
              </div>
              <div className="order-summary-boolean-item">
                <label className="field-label">是否好评</label>
                <div className="boolean-toggle-group" role="radiogroup" aria-label="是否好评">
                  <button
                    type="button"
                    className={`button small ${currentDraft.isPositiveReview ? 'primary' : 'secondary'}`}
                    aria-pressed={currentDraft.isPositiveReview}
                    onClick={() => updateDraft({ isPositiveReview: true })}
                  >
                    是
                  </button>
                  <button
                    type="button"
                    className={`button small ${currentDraft.isPositiveReview ? 'secondary' : 'primary'}`}
                    aria-pressed={!currentDraft.isPositiveReview}
                    onClick={() => updateDraft({ isPositiveReview: false })}
                  >
                    否
                  </button>
                </div>
              </div>
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="order-summary-payment-date">
                付款时间
              </label>
              <input
                id="order-summary-payment-date"
                className="input"
                type="datetime-local"
                value={currentDraft.paymentDate ? currentDraft.paymentDate.replace(' ', 'T') : ''}
                onChange={(event) => updateDraft({ paymentDate: event.target.value.replace('T', ' ') })}
              />
            </div>
          </div>
          <div className="field-grid two order-summary-edit-text-grid">
            <div className="field-control">
              <label className="field-label" htmlFor="order-summary-customer-address">
                平台原始地址
              </label>
              <textarea
                id="order-summary-customer-address"
                className="textarea"
                value={currentDraft.customerAddress}
                onChange={(event) => updateDraft({ customerAddress: event.target.value })}
              />
            </div>
            <div className="field-control">
              <label className="field-label" htmlFor="order-summary-customer-remark">
                客户备注
              </label>
              <textarea
                id="order-summary-customer-remark"
                className="textarea"
                value={currentDraft.customerRemark}
                onChange={(event) => updateDraft({ customerRemark: event.target.value })}
              />
            </div>
            <div className="field-control order-summary-edit-text-full">
              <label className="field-label" htmlFor="order-summary-remark">
                交易备注
              </label>
              <textarea
                id="order-summary-remark"
                className="textarea"
                value={currentDraft.remark}
                onChange={(event) => updateDraft({ remark: event.target.value })}
              />
            </div>
          </div>
          <div className="text-caption order-summary-readonly-note">只读字段：交易登记时间、最近活动</div>
        </div>
      ) : flattenedFields.length > 0 ? (
        <div className="spacer-top order-summary-flat-details">
          <dl className="order-summary-flat-list">
            {flattenedFields.map((field) => (
              <div key={field.label} className="order-summary-flat-item">
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  )
}

export const OrderInfoCardGroup = ({
  order,
  visibleCards = ['customer_platform', 'delivery', 'summary'],
  hideCommercialInfo = false
}: {
  order: Order
  visibleCards?: OrderInfoCardKey[]
  hideCommercialInfo?: boolean
}) => {
  const [isFinanceExpanded, setIsFinanceExpanded] = useState(false)
  const financeSummary = calculateOrderFinanceSummary(order)
  const cards = [
    visibleCards.includes('finance') ? (
      <SummaryCard key="finance" title="财务信息">
        <InfoGrid columns={3}>
          <InfoField label="系统参考价" value={formatPrice(financeSummary.referencePrice)} />
          <InfoField label="交易成交价" value={formatPrice(financeSummary.dealPrice)} />
          <InfoField label="定金" value={formatPrice(financeSummary.depositAmount)} />
          <InfoField label="尾款" value={formatPrice(financeSummary.balanceAmount)} />
          <InfoField label="累计收款" value={formatPrice(financeSummary.totalReceived)} />
          <InfoField label="累计退款" value={formatPrice(financeSummary.totalRefunded)} />
          <InfoField label="累计净收款" value={formatPrice(financeSummary.netReceived)} />
          <InfoField label="是否开过发票" value={order.finance?.invoiced ? '是' : '否'} />
          <InfoField label="财务备注" value={order.finance?.remark || '—'} />
        </InfoGrid>
        <div className="subtle-panel spacer-top">
          <div
            className="row wrap finance-panel-toggle"
            style={{ justifyContent: 'space-between', marginBottom: 12 }}
            role="button"
            tabIndex={0}
            aria-expanded={isFinanceExpanded}
            aria-label={`${isFinanceExpanded ? '收起' : '展开'}财务流水`}
            onClick={(event) => {
              if (isInteractiveTarget(event.target)) {
                return
              }
              setIsFinanceExpanded((current) => !current)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setIsFinanceExpanded((current) => !current)
              }
            }}
          >
            <div className="stack" style={{ gap: 4 }}>
              <strong>财务流水</strong>
              <span className="text-caption">{order.finance?.transactions.length || 0} 条</span>
            </div>
            <button
              type="button"
              className="button secondary small"
              onClick={(event) => {
                event.stopPropagation()
                setIsFinanceExpanded((current) => !current)
              }}
            >
              {isFinanceExpanded ? '收起流水' : '展开流水'}
            </button>
          </div>
          {isFinanceExpanded ? order.finance?.transactions.length ? (
            <ul className="list-reset stack">
              {order.finance.transactions.map((transaction) => (
                <li key={transaction.id} className="row wrap" style={{ justifyContent: 'space-between' }}>
                  <div className="stack" style={{ gap: 4 }}>
                    <strong>{getOrderFinanceTransactionLabel(transaction.type)}</strong>
                    <span className="text-caption">
                      {transaction.occurredAt}
                      {transaction.note ? ` · ${transaction.note}` : ''}
                    </span>
                  </div>
                  <span className="text-price">{formatPrice(transaction.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted">暂无财务流水记录。</div>
          ) : (
            <div
              className="text-muted collapsible-placeholder-trigger"
              role="button"
              tabIndex={0}
              aria-expanded={isFinanceExpanded}
              aria-label={`${isFinanceExpanded ? '收起' : '展开'}财务流水`}
              onClick={() => setIsFinanceExpanded((current) => !current)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setIsFinanceExpanded((current) => !current)
                }
              }}
            >
              默认收起财务流水，点击“展开流水”查看收款、退款和售后补款明细。
            </div>
          )}
        </div>
      </SummaryCard>
    ) : null
  ].filter(Boolean)

  if (cards.length === 0) {
    return null
  }

  return (
    <div className="field-grid three" style={{ gridTemplateColumns: `repeat(${Math.max(cards.length, 1)}, minmax(0, 1fr))` }}>
      {cards}
    </div>
  )
}

export const OrderBusinessStageHeaderStrip = ({ order }: { order: Order }) => {
  const currentBusinessStage = getOrderBusinessStageKey(order.status)
  const currentStageIndex = currentBusinessStage ? orderBusinessStages.findIndex((stage) => stage.key === currentBusinessStage) : -1

  return (
    <div className="order-header-stage-banner">
      <ol className="status-flow-stage-list order-header-stage-list">
        {orderBusinessStages.map((stage, index) => {
          const state =
            currentStageIndex > index ? 'completed' : currentStageIndex === index && order.status !== 'cancelled' ? 'current' : 'upcoming'

          return (
            <li key={stage.key} className={`status-flow-stage-item order-header-stage-item status-flow-stage-item--${state}`}>
              <span className="status-flow-stage-node order-header-stage-node" aria-hidden="true">
                {state === 'completed' ? '✓' : index + 1}
              </span>
              <span className="status-flow-stage-content">
                <span className="status-flow-stage-title">{stage.title}</span>
                <span className="status-flow-stage-caption">{stage.caption}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export const OrderStatusFlowSection = ({
  order,
  tasks,
  readOnly = false,
  onTransition,
  onTransitionWithSuggestedTask
}: {
  order: Order
  tasks: Task[]
  readOnly?: boolean
  onTransition: (nextStatus: OrderStatus) => void
  onTransitionWithSuggestedTask: (nextStatus: OrderStatus, taskType: TaskType) => void
}) => {
  const nextStatuses = getAllowedNextStatuses(order.status)
  const activeTasks = tasks.filter((task) => isTaskOpenStatus(task.status))
  const activeTaskCount = activeTasks.length
  const currentBusinessStage = getOrderBusinessStageKey(order.status)
  const currentStageIndex = currentBusinessStage ? orderBusinessStages.findIndex((stage) => stage.key === currentBusinessStage) : -1
  const isTerminalAlert = order.status === 'after_sales' || order.status === 'cancelled'

  return (
    <SectionCard title="交易推进区" description="这里记录交易记录层的公共阶段；若新阶段存在典型动作，可一键同时创建建议任务。">
      <div className="stack">
        <div className="status-flow-shell">
          <div className="status-flow-shell-title">业务阶段</div>
          <div className="status-flow-scroll">
            <ol className="status-flow-stage-list">
              {orderBusinessStages.map((stage, index) => {
                const state =
                  currentStageIndex > index ? 'completed' : currentStageIndex === index && order.status !== 'cancelled' ? 'current' : 'upcoming'

                return (
                  <li key={stage.key} className={`status-flow-stage-item status-flow-stage-item--${state}`}>
                    <div className="status-flow-stage-node">{state === 'completed' ? '✓' : index + 1}</div>
                    <div className="status-flow-stage-content">
                      <div className="status-flow-stage-title">{stage.title}</div>
                      <div className="status-flow-stage-caption">{stage.caption}</div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

        {isTerminalAlert ? (
          <div className={order.status === 'cancelled' ? 'danger-alert' : 'warning-alert'}>
            <div className="row wrap">
              <StatusTag value={getOrderStatusLabel(order.status)} />
              {order.priority === 'normal' ? <StatusTag value={getOrderPriorityLabel(order.priority)} /> : <RiskTag value={getOrderPriorityLabel(order.priority)} />}
            </div>
            <div className="spacer-top text-muted">{getOrderStatusDescription(order.status)}</div>
          </div>
        ) : null}

        <div className="field-grid three">
          <div className="subtle-panel stack" style={{ gap: 8 }}>
            <span className="text-caption">当前阶段</span>
            <div className="row wrap">
              <StatusTag value={getOrderStatusLabel(order.status)} />
              {order.priority === 'normal' ? <StatusTag value={getOrderPriorityLabel(order.priority)} /> : <RiskTag value={getOrderPriorityLabel(order.priority)} />}
            </div>
            <div className="text-muted">{getOrderStatusDescription(order.status)}</div>
          </div>
          <div className="subtle-panel stack" style={{ gap: 8 }}>
            <span className="text-caption">最近活动</span>
            <strong>{order.latestActivityAt || '—'}</strong>
            <div className="text-muted">状态变更、任务更新和报价动作都会回写到时间线。</div>
          </div>
          <div className="subtle-panel stack" style={{ gap: 8 }}>
            <span className="text-caption">活跃任务</span>
            <strong>{activeTaskCount} 个</strong>
            <div className="text-muted">{activeTaskCount > 0 ? '建议先检查是否存在阻塞性未完成任务，再继续推进。' : '当前没有活跃任务，可继续判断是否进入下一阶段。'}</div>
          </div>
        </div>

        {readOnly ? (
          <div className="subtle-panel role-view-note">
            <strong>当前角色以查看为主</strong>
            <div className="text-muted spacer-top">交易阶段仍可完整查看，但状态推进与建议任务创建仅在客服或跟单/运营视角下开放。</div>
          </div>
        ) : nextStatuses.length > 0 ? (
          <div className="field-grid three">
            {nextStatuses.map((nextStatus) => {
              const suggestedTaskType = getSuggestedTaskTypeForOrderStatus(nextStatus)
              const hasSuggestedOpenTask = suggestedTaskType
                ? activeTasks.some((task) => task.type === suggestedTaskType)
                : false

              return (
                <div key={nextStatus} className="subtle-panel stack" style={{ gap: 10 }}>
                  <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                    <strong>{getOrderStatusLabel(nextStatus)}</strong>
                    <StatusTag value={getOrderStatusLabel(nextStatus)} />
                  </div>
                  <div className="text-muted">{getOrderStatusDescription(nextStatus)}</div>
                  {suggestedTaskType ? (
                    <div className="text-caption">
                      建议任务：{getTaskTypeLabel(suggestedTaskType)}
                      {hasSuggestedOpenTask ? ' · 当前已存在相关活跃任务' : ' · 当前尚未创建相关任务'}
                    </div>
                  ) : (
                    <div className="text-caption">该阶段当前不强制建议新建任务。</div>
                  )}
                  <div className="row wrap">
                    <button type="button" className="button secondary small" onClick={() => onTransition(nextStatus)}>
                      推进到{getOrderStatusLabel(nextStatus)}
                    </button>
                    {suggestedTaskType && !hasSuggestedOpenTask ? (
                      <button type="button" className="button primary small" onClick={() => onTransitionWithSuggestedTask(nextStatus, suggestedTaskType)}>
                        推进并创建{getTaskTypeLabel(suggestedTaskType)}任务
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState title="当前状态已无后续流转动作" description="该交易记录已进入终态或当前阶段没有定义新的后续状态。" />
        )}
      </div>
    </SectionCard>
  )
}

export const OrderTaskSection = ({
  tasks,
  readOnly = false,
  canCreateTask = true,
  onCreateTask,
  onUpdateTask
}: {
  tasks: Task[]
  readOnly?: boolean
  canCreateTask?: boolean
  onCreateTask: (type: TaskType) => void
  onUpdateTask: (taskId: string, status: TaskStatus) => void
}) => (
  <SectionCard
    title="关联任务区"
    description="交易记录进入业务流转后，任务中心负责承接交易节点与商品任务动作；这里展示与当前记录直接相关的任务。"
    actions={
      <Link to="/tasks" className="button ghost small">
        打开任务中心
      </Link>
    }
  >
    <div className="stack">
      {readOnly ? (
        <div className="subtle-panel role-view-note">
          <strong>当前角色以查看任务为主</strong>
          <div className="text-muted spacer-top">如需派发新任务或直接改任务状态，请切换到客服、跟单/运营或任务中心处理。</div>
        </div>
      ) : canCreateTask ? (
        <div className="row wrap">
          {orderTaskTypeOptions.map((type) => (
            <button key={type} type="button" className="button secondary small" onClick={() => onCreateTask(type)}>
              新建{getTaskTypeLabel(type)}
            </button>
          ))}
        </div>
      ) : (
        <div className="subtle-panel role-view-note">
          <strong>当前角色只处理既有任务</strong>
          <div className="text-muted spacer-top">工厂视角只接收并完成已经分派的生产任务，不额外新建任务。</div>
        </div>
      )}
      {tasks.length > 0 ? (
        <div className="stack">
          {[...tasks]
            .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
            .map((task) => (
              <div key={task.id} className="subtle-panel stack">
                <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                  <div className="stack" style={{ gap: 6 }}>
                    <div className="row wrap">
                      <strong>{task.title}</strong>
                      <StatusTag value={getTaskStatusLabel(task.status)} />
                    </div>
                    <div className="text-caption">
                      {getTaskTypeLabel(task.type)} · {getTaskAssigneeRoleLabel(task.assigneeRole)} · {task.assigneeName || '待分配'}
                    </div>
                  </div>
                  <div className="row wrap">
                    <Link to={`/tasks/${task.id}`} className="button ghost small">
                      查看任务
                    </Link>
                    {!readOnly && task.status === 'todo' ? (
                      <button type="button" className="button secondary small" onClick={() => onUpdateTask(task.id, 'in_progress')}>
                        开始处理
                      </button>
                    ) : null}
                    {!readOnly && task.status !== 'done' && task.status !== 'closed' ? (
                      <button type="button" className="button primary small" onClick={() => onUpdateTask(task.id, 'done')}>
                        标记完成
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="field-grid three">
                  <InfoField label="关联商品任务" value={task.orderItemName || '交易级任务'} />
                  <InfoField label="截止时间" value={task.dueAt || '未设置'} />
                  <InfoField label="最近更新时间" value={task.updatedAt} />
                </div>
                {task.description ? <div className="text-muted">{task.description}</div> : null}
              </div>
            ))}
        </div>
      ) : (
        <EmptyState title="当前交易记录还没有关联任务" description="可以从这里直接派发交易处理、设计建模、生产准备或售后任务。" />
      )}
    </div>
  </SectionCard>
)

export const CustomerSpecBlock = ({
  item,
  onChange,
  embedded = false
}: {
  item: OrderItem
  onChange: (next: OrderItem) => void
  embedded?: boolean
}) => {
  const engravingSelected = item.selectedSpecialOptions?.includes('刻字')
  const engraveImageFiles = item.actualRequirements?.engraveImageFiles ?? []
  const engravePltFiles = item.actualRequirements?.engravePltFiles ?? []

  const updateRequirements = (patch: Partial<OrderItem['actualRequirements']>) =>
    onChange({
      ...item,
      actualRequirements: {
        ...item.actualRequirements,
        ...patch
      }
    })

  const content = (
    <>
      <div className="field-grid two">
        {engravingSelected ? (
          <div className="field-control">
            <label className="field-label" htmlFor={`engrave-text-${item.id}`}>
              刻字内容
            </label>
            <textarea
              id={`engrave-text-${item.id}`}
              className="textarea"
              value={item.actualRequirements?.engraveText || ''}
              onChange={(event) => updateRequirements({ engraveText: event.target.value })}
            />
          </div>
        ) : null}
        <div className="field-control">
          <label className="field-label" htmlFor={`customer-remark-${item.id}`}>
            备注
          </label>
          <textarea
            id={`customer-remark-${item.id}`}
            className="textarea"
            value={item.actualRequirements?.remark || ''}
            onChange={(event) => updateRequirements({ remark: event.target.value })}
          />
        </div>
      </div>

      {engravingSelected ? (
        <div className="stack spacer-top">
          <div className="subtle-panel stack">
            <strong>刻字文件</strong>
            <div className="text-muted">选择了“刻字”后，需要同步补充刻字内容，并上传刻字图片文件与 PLT 文件供生产核对。</div>
            <div className="field-grid two">
              <div className="field-control">
                <label className="field-label" htmlFor={`engrave-image-upload-${item.id}`}>
                  上传刻字图片
                </label>
                <input
                  id={`engrave-image-upload-${item.id}`}
                  className="input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? [])
                    if (files.length === 0) {
                      return
                    }

                    updateRequirements({
                      engraveImageFiles: [...engraveImageFiles, ...createUploadedOrderFiles(files, `engrave-image-${item.id}`)]
                    })
                    event.currentTarget.value = ''
                  }}
                />
              </div>
              <div className="field-control">
                <label className="field-label" htmlFor={`engrave-plt-upload-${item.id}`}>
                  上传刻字PLT文件
                </label>
                <input
                  id={`engrave-plt-upload-${item.id}`}
                  className="input"
                  type="file"
                  accept=".plt,.PLT"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? [])
                    if (files.length === 0) {
                      return
                    }

                    updateRequirements({
                      engravePltFiles: [...engravePltFiles, ...createUploadedOrderFiles(files, `engrave-plt-${item.id}`)]
                    })
                    event.currentTarget.value = ''
                  }}
                />
              </div>
            </div>
          </div>

          {engraveImageFiles.length > 0 ? (
            <AssetFileList
              title="刻字图片文件"
              files={engraveImageFiles.map((file) => ({
                id: file.id,
                name: file.name,
                url: file.url
              }))}
            />
          ) : (
            <div className="text-muted">暂无刻字图片文件。</div>
          )}

          {engravePltFiles.length > 0 ? (
            <AssetFileList
              title="刻字PLT文件"
              files={engravePltFiles.map((file) => ({
                id: file.id,
                name: file.name,
                url: file.url
              }))}
            />
          ) : (
            <div className="text-muted">暂无刻字PLT文件。</div>
          )}
        </div>
      ) : null}
    </>
  )

  return embedded ? content : <SectionCard title="商品任务需求" description="记录当前商品任务的备注与刻字资料。">{content}</SectionCard>
}

export const DesignInfoBlock = ({
  item,
  onChange,
  embedded = false
}: {
  item: OrderItem
  onChange: (next: OrderItem) => void
  embedded?: boolean
}) => {
  const content = (
    <>
      <div className="field-grid four">
        <div className="field-control">
          <label className="field-label">设计状态</label>
          <select
            className="select"
            value={item.designInfo?.designStatus || '待设计'}
            onChange={(event) =>
              onChange({
                ...item,
                designInfo: {
                  ...item.designInfo,
                  designStatus: event.target.value
                }
              })
            }
          >
            <option value="待设计">待设计</option>
            <option value="打版中">打版中</option>
            <option value="客户确认中">客户确认中</option>
            <option value="已确认">已确认</option>
          </select>
        </div>
        <div className="field-control">
          <label className="field-label">设计负责人</label>
          <input
            className="input"
            value={item.designInfo?.assignedDesigner || ''}
            onChange={(event) =>
              onChange({
                ...item,
                designInfo: {
                  ...item.designInfo,
                  assignedDesigner: event.target.value
                }
              })
            }
          />
        </div>
        <div className="field-control">
          <label className="field-label">设计截止时间</label>
          <input
            className="input"
            value={item.designInfo?.designDeadline || ''}
            onChange={(event) =>
              onChange({
                ...item,
                designInfo: {
                  ...item.designInfo,
                  designDeadline: event.target.value
                }
              })
            }
          />
        </div>
        <label className="subtle-panel row" style={{ alignSelf: 'end' }}>
          <input
            type="checkbox"
            checked={Boolean(item.designInfo?.requiresRemodeling)}
            onChange={(event) =>
              onChange({
                ...item,
                designInfo: {
                  ...item.designInfo,
                  requiresRemodeling: event.target.checked
                }
              })
            }
          />
          <span>需重新建模</span>
        </label>
      </div>
      <div className="spacer-top">
        <div className="field-control">
          <label className="field-label">设计说明</label>
          <textarea
            className="textarea"
            value={item.designInfo?.designNote || ''}
            onChange={(event) =>
              onChange({
                ...item,
                designInfo: {
                  ...item.designInfo,
                  designNote: event.target.value
                }
              })
            }
          />
        </div>
      </div>
    </>
  )

  return embedded ? content : <SectionCard title="设计建模区" description="记录设计建模的最小工作流状态，不接后端也能演示协同骨架。">{content}</SectionCard>
}

export const OutsourceInfoBlock = ({
  item,
  onChange,
  embedded = false
}: {
  item: OrderItem
  onChange: (next: OrderItem) => void
  embedded?: boolean
}) => {
  const content = (
    <>
      <div className="field-grid three">
        <div className="field-control">
          <label className="field-label">委外状态</label>
          <select
            className="select"
            value={item.outsourceInfo?.outsourceStatus || '未委外'}
            onChange={(event) =>
              onChange({
                ...item,
                outsourceInfo: {
                  ...item.outsourceInfo,
                  outsourceStatus: event.target.value
                }
              })
            }
          >
            <option value="未委外">未委外</option>
            <option value="待下发">待下发</option>
            <option value="生产中">生产中</option>
            <option value="已回传">已回传</option>
          </select>
        </div>
        <div className="field-control">
          <label className="field-label">供应商</label>
          <input
            className="input"
            value={item.outsourceInfo?.supplierName || ''}
            onChange={(event) =>
              onChange({
                ...item,
                outsourceInfo: {
                  ...item.outsourceInfo,
                  supplierName: event.target.value
                }
              })
            }
          />
        </div>
        <div className="field-control">
          <label className="field-label">计划回传日期</label>
          <input
            className="input"
            value={item.outsourceInfo?.plannedDeliveryDate || ''}
            onChange={(event) =>
              onChange({
                ...item,
                outsourceInfo: {
                  ...item.outsourceInfo,
                  plannedDeliveryDate: event.target.value
                }
              })
            }
          />
        </div>
      </div>
      <div className="spacer-top">
        <div className="field-control">
          <label className="field-label">委外备注</label>
          <textarea
            className="textarea"
            value={item.outsourceInfo?.outsourceNote || ''}
            onChange={(event) =>
              onChange({
                ...item,
                outsourceInfo: {
                  ...item.outsourceInfo,
                  outsourceNote: event.target.value
                }
              })
            }
          />
        </div>
      </div>
    </>
  )

  return embedded ? content : <SectionCard title="跟单委外区" description="记录跟单与委外的最小交接信息。">{content}</SectionCard>
}

export const FactoryFeedbackBlock = ({
  item,
  onChange,
  embedded = false
}: {
  item: OrderItem
  onChange: (next: OrderItem) => void
  embedded?: boolean
}) => {
  const idPrefix = `factory-feedback-${item.id}`
  const content = (
    <>
      <div className="field-grid three">
        <div className="field-control">
          <label className="field-label" htmlFor={`${idPrefix}-status`}>
            工厂状态
          </label>
          <select
            id={`${idPrefix}-status`}
            className="select"
            value={item.factoryFeedback?.factoryStatus || '待回传'}
            onChange={(event) =>
              onChange({
                ...item,
                factoryFeedback: {
                  ...item.factoryFeedback,
                  factoryStatus: event.target.value
                }
              })
            }
          >
            <option value="待回传">待回传</option>
            <option value="生产中">生产中</option>
            <option value="已回传">已回传</option>
            <option value="有异常">有异常</option>
          </select>
        </div>
        <div className="field-control">
          <label className="field-label" htmlFor={`${idPrefix}-weight`}>
            回传重量
          </label>
          <input
            id={`${idPrefix}-weight`}
            className="input"
            value={item.factoryFeedback?.returnedWeight || ''}
            onChange={(event) =>
              onChange({
                ...item,
                factoryFeedback: {
                  ...item.factoryFeedback,
                  returnedWeight: event.target.value
                }
              })
            }
          />
        </div>
        <div className="field-control">
          <label className="field-label" htmlFor={`${idPrefix}-quality`}>
            质检结论
          </label>
          <input
            id={`${idPrefix}-quality`}
            className="input"
            value={item.factoryFeedback?.qualityResult || ''}
            onChange={(event) =>
              onChange({
                ...item,
                factoryFeedback: {
                  ...item.factoryFeedback,
                  qualityResult: event.target.value
                }
              })
            }
          />
        </div>
      </div>
      <div className="spacer-top">
        <div className="field-control">
          <label className="field-label" htmlFor={`${idPrefix}-note`}>
            工厂备注
          </label>
          <textarea
            id={`${idPrefix}-note`}
            className="textarea"
            value={item.factoryFeedback?.factoryNote || ''}
            onChange={(event) =>
              onChange({
                ...item,
                factoryFeedback: {
                  ...item.factoryFeedback,
                  factoryNote: event.target.value
                }
              })
            }
          />
        </div>
      </div>
    </>
  )

  return embedded ? content : <SectionCard title="工厂回传区" description="记录工厂回传状态、重量和质检结论，先做前端可演示版。">{content}</SectionCard>
}

export const OrderItemSpecPricingBlock = ({
  item,
  product,
  onChange
}: {
  item: OrderItem
  product?: Product
  onChange: (next: OrderItem) => void
}) => {
  const quote = useOrderQuote(item, product) ?? item.quote

  if (!product) {
    return (
      <div className="placeholder-block">
        当前还没有引用来源产品，规格与报价区将在引用后自动激活。
      </div>
    )
  }

  const updateItem = (patch: Partial<OrderItem>) => {
    onChange(
      recalculateOrderItem(
        {
          ...item,
          ...patch
        },
        product
      )
    )
  }

  return (
    <div className="stack">
      <div className="field-grid four">
        <div className="field-control">
          <label className="field-label">货号</label>
          <input className="input" value={item.itemSku} onChange={(event) => updateItem({ itemSku: event.target.value })} />
        </div>
        <div className="field-control">
          <label className="field-label">{product.specName || '规格值'}</label>
          <select
            className="select"
            value={item.selectedSpecValue || ''}
            onChange={(event) => {
              const nextSpec = product.specs.find((spec) => spec.specValue === event.target.value)
              updateItem({
                selectedSpecValue: event.target.value || undefined,
                selectedSpecSnapshot: nextSpec
              })
            }}
          >
            <option value="">请选择规格</option>
            {product.specs.map((spec) => (
              <option key={spec.id} value={spec.specValue}>
                {spec.specValue}
              </option>
            ))}
          </select>
        </div>
        <div className="field-control">
          <label className="field-label">材质</label>
          <select
            className="select"
            value={item.selectedMaterial || ''}
            onChange={(event) =>
              updateItem({
                selectedMaterial: event.target.value,
                actualRequirements: { ...item.actualRequirements, material: event.target.value }
              })
            }
          >
            <option value="">请选择材质</option>
            {product.supportedMaterials.map((material) => (
              <option key={material} value={material}>
                {material}
              </option>
            ))}
          </select>
        </div>
        <div className="field-control">
          <label className="field-label">工艺</label>
          <select
            className="select"
            value={item.selectedProcess || ''}
            onChange={(event) =>
              updateItem({
                selectedProcess: event.target.value,
                actualRequirements: { ...item.actualRequirements, process: event.target.value }
              })
            }
          >
            <option value="">请选择工艺</option>
            {product.supportedProcesses.map((process) => (
              <option key={process} value={process}>
                {process}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-control">
        <label className="field-label">特殊需求</label>
        <div className="row wrap">
          {product.supportedSpecialOptions.map((option) => {
            const active = item.selectedSpecialOptions?.includes(option)
            return (
              <label key={option} className={`tag ${active ? 'status-enabled' : 'reference-off'}`}>
                <input
                  type="checkbox"
                  checked={Boolean(active)}
                  onChange={(event) => {
                    const current = item.selectedSpecialOptions ?? []
                    const nextOptions = event.target.checked ? [...current, option] : current.filter((entry) => entry !== option)
                    updateItem({
                      selectedSpecialOptions: nextOptions
                    })
                  }}
                  style={{ marginRight: 6 }}
                />
                {option}
              </label>
            )
          })}
        </div>
      </div>

      <div className="subtle-panel order-item-spec-panel">
        {item.selectedSpecSnapshot ? (
          <div className="order-item-spec-grid">
            {item.selectedSpecSnapshot.sizeFields.map((field) => (
              <div key={field.key} className="order-item-spec-cell">
                <span className="order-item-spec-label">{field.label}</span>
                <div className="order-item-spec-value">
                  {field.value}
                  {field.unit || ''}
                </div>
              </div>
            ))}
            <div className="order-item-spec-cell">
              <span className="order-item-spec-label">参考重量</span>
              <div className="order-item-spec-value">{item.selectedSpecSnapshot.referenceWeight ? `${item.selectedSpecSnapshot.referenceWeight} g` : '—'}</div>
            </div>
          </div>
        ) : (
          <div className="text-muted">选择规格后自动带出参数摘要。</div>
        )}
      </div>

      <div className="quote-hero">
        <div className="subtle-panel">
          <div className="text-caption">规格基础价</div>
          <div className="quote-value">{formatPrice(quote?.basePrice)}</div>
        </div>
        <div className="subtle-panel">
          <div className="text-caption">固定加价合计</div>
          <div className="quote-value">{formatPrice(quote?.priceAdjustments.reduce((sum, entry) => sum + entry.delta, 0))}</div>
        </div>
        <div className="subtle-panel">
          <div className="text-caption">系统参考报价</div>
          <div className="quote-value">{formatPrice(quote?.systemQuote)}</div>
        </div>
      </div>

      <div className="subtle-panel order-item-adjustment-panel">
        {quote?.priceAdjustments.length ? (
          <ul className="list-reset order-item-adjustment-list">
            {quote.priceAdjustments.map((adjustment) => (
              <li key={`${adjustment.type}-${adjustment.ruleKey}`} className="order-item-adjustment-row">
                <span className="order-item-adjustment-label">
                  {adjustment.type} · {adjustment.ruleKey}
                </span>
                <span className="text-price order-item-adjustment-price">{formatPrice(adjustment.delta)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-muted">当前没有命中固定加价规则。</div>
        )}
      </div>

      {quote?.warnings.length ? (
        <div className="warning-alert">
          <strong>报价提醒</strong>
          <ul className="spacer-top">
            {quote.warnings.map((warning) => (
              <li key={`${warning.code}-${warning.message}`}>{warning.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export const OrderItemFactoryProductionBlock = ({
  item,
  embedded = false,
  showEngravingFiles = true
}: {
  item: OrderItem
  embedded?: boolean
  showEngravingFiles?: boolean
}) => {
  const engraveImageFiles = item.actualRequirements?.engraveImageFiles ?? []
  const engravePltFiles = item.actualRequirements?.engravePltFiles ?? []
  const engravingSelected =
    item.selectedSpecialOptions?.includes('刻字') ||
    Boolean(item.actualRequirements?.engraveText) ||
    engraveImageFiles.length > 0 ||
    engravePltFiles.length > 0

  const content = (
    <>
      <div className="stack">
        <div className="field-grid four">
          <InfoField label="货号" value={item.itemSku || '待维护'} />
          <InfoField label="来源产品编码" value={item.sourceProduct?.sourceProductCode || '待引用模板'} />
          <InfoField label="规格" value={item.selectedSpecValue || '未选规格'} />
          <InfoField label="数量" value={`${item.quantity || 1} 件`} />
        </div>
        <div className="field-grid three">
          <InfoField label="材质" value={item.selectedMaterial || item.actualRequirements?.material || '未设置'} />
          <InfoField label="工艺" value={item.selectedProcess || item.actualRequirements?.process || '未设置'} />
          <InfoField label="特殊需求" value={item.selectedSpecialOptions?.join(' / ') || item.actualRequirements?.specialNotes?.join(' / ') || '无'} />
        </div>
        {item.selectedSpecSnapshot ? (
          <div className="subtle-panel">
            <strong>生产参数</strong>
            <div className="field-grid four spacer-top">
              {item.selectedSpecSnapshot.sizeFields.map((field) => (
                <InfoField
                  key={field.key}
                  label={field.label}
                  value={
                    <>
                      {field.value}
                      {field.unit || ''}
                    </>
                  }
                />
              ))}
              <InfoField label="参考重量" value={item.selectedSpecSnapshot.referenceWeight ? `${item.selectedSpecSnapshot.referenceWeight} g` : '—'} />
            </div>
          </div>
        ) : (
          <div className="placeholder-block">当前还没有规格参数，请上游先确认来源模板与规格。</div>
        )}
        {engravingSelected ? (
          <div className="subtle-panel stack">
            <strong>刻字生产信息</strong>
            <div className="field-grid two">
              <InfoField label="刻字内容" value={item.actualRequirements?.engraveText || '待客服补充'} />
              <InfoField label="刻字文件数量" value={`图片 ${engraveImageFiles.length} 个 / PLT ${engravePltFiles.length} 个`} />
            </div>
            {showEngravingFiles ? (
              <>
                {engraveImageFiles.length > 0 ? (
                  <AssetFileList
                    title="刻字图片文件"
                    files={engraveImageFiles.map((file) => ({
                      id: file.id,
                      name: file.name,
                      url: file.url
                    }))}
                  />
                ) : (
                  <div className="text-muted">暂无刻字图片文件。</div>
                )}
                {engravePltFiles.length > 0 ? (
                  <AssetFileList
                    title="刻字PLT文件"
                    files={engravePltFiles.map((file) => ({
                      id: file.id,
                      name: file.name,
                      url: file.url
                    }))}
                  />
                ) : (
                  <div className="text-muted">暂无刻字PLT文件。</div>
                )}
              </>
            ) : (
              <div className="text-muted">刻字文件已收敛到下方“文件与刻字资料区”统一查看。</div>
            )}
          </div>
        ) : null}
        <div className="field-grid two">
          <InfoField label="尺寸/规格备注" value={item.actualRequirements?.sizeNote || '—'} />
          <InfoField label="生产备注" value={item.actualRequirements?.remark || '—'} />
        </div>
      </div>
    </>
  )

  return embedded ? content : <SectionCard title="工厂生产区" description="工厂视角只保留货号、规格参数、材质/工艺与生产备注，不展示客户与价格。">{content}</SectionCard>
}

const orderItemBlockMeta: Record<OrderItemBlockKey, { title: string; description: string }> = {
  spec_pricing: {
    title: '规格与报价区',
    description: '选择规格、材质、工艺与特殊需求，并查看参数与系统参考报价。'
  },
  factory_production: {
    title: '工厂生产区',
    description: '工厂视角只保留货号、规格参数、材质/工艺与生产备注，不展示客户与价格。'
  },
  customer: {
    title: '商品任务需求',
    description: '记录当前商品任务的备注、刻字资料与交付要求。'
  },
  design: {
    title: '设计建模区',
    description: '记录设计建模的最小工作流状态，不接后端也能演示协同骨架。'
  },
  outsource: {
    title: '跟单委外区',
    description: '记录跟单与委外的最小交接信息。'
  },
  factory: {
    title: '工厂回传区',
    description: '记录工厂回传状态、重量和质检结论，先做前端可演示版。'
  }
}

const OrderItemCollapsibleSection = ({
  title,
  description,
  expanded,
  onToggle,
  children
}: {
  title: string
  description: string
  expanded: boolean
  onToggle: () => void
  children: ReactNode
}) => (
  <SectionCard
    className={`compact-card order-item-block-card ${expanded ? 'is-expanded' : 'is-collapsed'}`}
    title={title}
    description={expanded ? description : undefined}
    onHeaderClick={onToggle}
    headerAriaLabel={`${expanded ? '收起' : '展开'}${title}`}
    headerExpanded={expanded}
    actions={
      <button type="button" className="button ghost small" onClick={onToggle}>
        {expanded ? '收起本区' : '展开本区'}
      </button>
    }
  >
    {expanded ? children : null}
  </SectionCard>
)

export const OrderItemCard = ({
  item,
  product,
  allowReference = true,
  allowOpenSource = true,
  defaultExpanded = true,
  defaultExpandedBlocks = ['spec_pricing'],
  visibleBlocks = ['spec_pricing', 'customer', 'design', 'outsource', 'factory'],
  hideCommercialInfo = false,
  onReference,
  onOpenSource,
  onChange,
  onRemove,
  disableRemove = false
}: {
  item: OrderItem
  product?: Product
  allowReference?: boolean
  allowOpenSource?: boolean
  defaultExpanded?: boolean
  defaultExpandedBlocks?: OrderItemBlockKey[]
  visibleBlocks?: OrderItemBlockKey[]
  hideCommercialInfo?: boolean
  onReference: () => void
  onOpenSource: () => void
  onChange: (next: OrderItem) => void
  onRemove?: () => void
  disableRemove?: boolean
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [expandedBlocks, setExpandedBlocks] = useState<OrderItemBlockKey[]>(defaultExpandedBlocks)
  const visibleBlockSet = new Set(visibleBlocks)
  const expandedBlockSet = new Set(expandedBlocks)
  const selectedSpecSummary = item.selectedSpecValue || item.selectedSpecSnapshot?.specValue || '未选规格'
  const engravingSummary = item.actualRequirements?.engraveText || (item.selectedSpecialOptions?.includes('刻字') ? '待填写' : '无')
  const materialSummary = item.selectedMaterial || item.actualRequirements?.material || '未设置'
  const processSummary = item.selectedProcess || item.actualRequirements?.process || '未设置'
  const remarkSummary = getOrderItemRemarkSummary(item)
  const finalQuoteValue = getOrderItemFinalQuoteValue(item, item.quote)
  const commercialSummaryValue = formatPrice(finalQuoteValue)
  const displayStatus = item.status || '待确认'
  const statusTone = getOrderItemStatusTone(displayStatus)

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  useEffect(() => {
    setExpandedBlocks(defaultExpandedBlocks)
  }, [defaultExpandedBlocks])

  const toggleBlock = (blockKey: OrderItemBlockKey) => {
    setExpandedBlocks((current) => (current.includes(blockKey) ? current.filter((item) => item !== blockKey) : [...current, blockKey]))
  }

  const toggleExpanded = () => setExpanded((current) => !current)
  const collapseAllBlocks = () => setExpandedBlocks([])
  const openVisibleBlockCount = expandedBlocks.filter((block) => visibleBlockSet.has(block)).length

  return (
    <SectionCard
      className="compact-card order-item-card"
      title={
        item.isReferencedProduct && item.sourceProduct ? (
          <div className="order-item-title-line">
            <div className="order-item-title-primary">
              {allowOpenSource ? (
                <button
                  type="button"
                  className="title-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpenSource()
                  }}
                  aria-label={`打开来源产品：${item.name}`}
                >
                  {item.name}
                </button>
              ) : (
                <strong>{item.name}</strong>
              )}
              <VersionBadge value={item.sourceProduct.sourceProductVersion} />
            </div>
            <div className="order-item-title-secondary">
              <span className="order-item-inline-meta">货号 {item.itemSku || '待维护'}</span>
              <span className={`order-item-status-pill ${statusTone}`}>{displayStatus}</span>
            </div>
          </div>
        ) : (
          <div className="order-item-title-line">
            <div className="order-item-title-primary">
              <strong>{item.name}</strong>
            </div>
            <div className="order-item-title-secondary">
              <span className="order-item-inline-meta">货号 {item.itemSku || '待维护'}</span>
              <span className={`order-item-status-pill ${statusTone}`}>{displayStatus}</span>
            </div>
          </div>
        )
      }
      actions={
        <div className="row wrap order-item-card-actions">
          {allowReference ? (
            <button
              className="button secondary small"
              onClick={(event) => {
                event.stopPropagation()
                onReference()
              }}
            >
              {item.isReferencedProduct ? '更改商品' : '引用产品'}
            </button>
          ) : null}
          <button
            type="button"
            className="button ghost small"
            onClick={(event) => {
              event.stopPropagation()
              toggleExpanded()
            }}
          >
            {expanded ? '收起' : '展开'}
          </button>
          {onRemove ? (
            <button
              type="button"
              className="button ghost small danger"
              disabled={disableRemove}
              onClick={(event) => {
                event.stopPropagation()
                onRemove()
              }}
            >
              删除商品
            </button>
          ) : null}
        </div>
      }
    >
      <div className="stack">
        <div
          className="order-item-summary-grid order-item-summary-grid-clickable"
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-label={`${expanded ? '收起' : '展开'}商品：${item.name}`}
          onClick={(event) => {
            if (isInteractiveTarget(event.target)) {
              return
            }
            toggleExpanded()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              toggleExpanded()
            }
          }}
        >
          <div className="order-item-summary-item">
            <span className="text-caption">尺寸</span>
            <strong>{selectedSpecSummary}</strong>
          </div>
          <div className="order-item-summary-item">
            <span className="text-caption">材质</span>
            <strong>{materialSummary}</strong>
          </div>
          <div className="order-item-summary-item">
            <span className="text-caption">工艺</span>
            <strong>{processSummary}</strong>
          </div>
          <div className="order-item-summary-item">
            <span className="text-caption">刻字</span>
            <strong>{engravingSummary}</strong>
          </div>
          <div className={`order-item-summary-item ${hideCommercialInfo ? '' : 'emphasis'}`}>
            <span className="text-caption">{hideCommercialInfo ? '货号' : '成交价'}</span>
            {hideCommercialInfo ? (
              <strong>{item.itemSku || '待维护'}</strong>
            ) : (
              <input
                className="input order-item-price-input"
                type="number"
                step="1"
                value={item.finalDisplayQuote ?? ''}
                placeholder={typeof finalQuoteValue === 'number' ? String(finalQuoteValue) : '输入成交价'}
                aria-label={`${item.name}成交价`}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) =>
                  onChange({
                    ...item,
                    finalDisplayQuote: event.target.value === '' ? undefined : Number(event.target.value)
                  })
                }
              />
            )}
          </div>
          <div className="order-item-summary-item full-width">
            <span className="text-caption">备注</span>
            <strong>{remarkSummary}</strong>
          </div>
        </div>

        {expanded ? (
          <>
            {!item.isReferencedProduct || !item.sourceProduct ? (
              <EmptyState
                title="当前商品还没有来源产品"
                description="先通过产品引用选择器把标准模板接进来，后续规格与报价区才能开始联动。"
                action={
                  allowReference ? (
                    <button className="button primary" onClick={onReference}>
                      引用产品
                    </button>
                  ) : undefined
                }
              />
            ) : null}
            <div className="order-item-block-stack">
              {visibleBlockSet.has('spec_pricing') ? (
                <OrderItemCollapsibleSection
                  title={orderItemBlockMeta.spec_pricing.title}
                  description={orderItemBlockMeta.spec_pricing.description}
                  expanded={expandedBlockSet.has('spec_pricing')}
                  onToggle={() => toggleBlock('spec_pricing')}
                >
                  <OrderItemSpecPricingBlock item={item} product={product} onChange={onChange} />
                </OrderItemCollapsibleSection>
              ) : null}
              {visibleBlockSet.has('factory_production') ? (
                <OrderItemCollapsibleSection
                  title={orderItemBlockMeta.factory_production.title}
                  description={orderItemBlockMeta.factory_production.description}
                  expanded={expandedBlockSet.has('factory_production')}
                  onToggle={() => toggleBlock('factory_production')}
                >
                  <OrderItemFactoryProductionBlock item={item} embedded />
                </OrderItemCollapsibleSection>
              ) : null}
              {visibleBlockSet.has('customer') ? (
                <OrderItemCollapsibleSection
                  title={orderItemBlockMeta.customer.title}
                  description={orderItemBlockMeta.customer.description}
                  expanded={expandedBlockSet.has('customer')}
                  onToggle={() => toggleBlock('customer')}
                >
                  <CustomerSpecBlock item={item} onChange={onChange} embedded />
                </OrderItemCollapsibleSection>
              ) : null}
              {visibleBlockSet.has('design') ? (
                <OrderItemCollapsibleSection
                  title={orderItemBlockMeta.design.title}
                  description={orderItemBlockMeta.design.description}
                  expanded={expandedBlockSet.has('design')}
                  onToggle={() => toggleBlock('design')}
                >
                  <DesignInfoBlock item={item} onChange={onChange} embedded />
                </OrderItemCollapsibleSection>
              ) : null}
              {visibleBlockSet.has('outsource') ? (
                <OrderItemCollapsibleSection
                  title={orderItemBlockMeta.outsource.title}
                  description={orderItemBlockMeta.outsource.description}
                  expanded={expandedBlockSet.has('outsource')}
                  onToggle={() => toggleBlock('outsource')}
                >
                  <OutsourceInfoBlock item={item} onChange={onChange} embedded />
                </OrderItemCollapsibleSection>
              ) : null}
              {visibleBlockSet.has('factory') ? (
                <OrderItemCollapsibleSection
                  title={orderItemBlockMeta.factory.title}
                  description={orderItemBlockMeta.factory.description}
                  expanded={expandedBlockSet.has('factory')}
                  onToggle={() => toggleBlock('factory')}
                >
                  <FactoryFeedbackBlock item={item} onChange={onChange} embedded />
                </OrderItemCollapsibleSection>
              ) : null}
            </div>
            {openVisibleBlockCount > 1 ? (
              <div className="order-item-bottom-actions">
                <button
                  type="button"
                  className="button ghost small"
                  onClick={(event) => {
                    event.stopPropagation()
                    collapseAllBlocks()
                  }}
                >
                  一键收起区块
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </SectionCard>
  )
}

export const OrderItemsSection = ({
  order,
  renderItem,
  onAddItem
}: {
  order: Order
  renderItem: (item: OrderItem, index: number) => ReactNode
  onAddItem?: () => void
}) => (
  <SectionCard
    title="商品任务区"
    description="这里按商品任务拆开展示；一张卡代表一件商品任务。"
    className="compact-card order-items-section"
    actions={
      onAddItem ? (
        <button className="button primary small" onClick={onAddItem}>
          新增商品任务
        </button>
      ) : undefined
    }
  >
    <div className="stack">
      {order.items.map((item, index) => (
        <div key={item.id}>{renderItem(item, index)}</div>
      ))}
    </div>
  </SectionCard>
)

export const LogisticsSection = () => (
  <SectionCard title="物流记录区" description="物流默认按商品任务关联；当前先保留展示占位。">
    <div className="placeholder-block">首轮先保留物流记录展示占位，后续补弹窗和记录流转。</div>
  </SectionCard>
)

export const AfterSalesSection = () => (
  <SectionCard title="售后记录区" description="售后默认按商品任务关联；当前先保留展示占位。">
    <div className="placeholder-block">首轮先保留售后记录展示占位，后续补详情与编辑弹窗。</div>
  </SectionCard>
)

export const OrderAttachmentSection = () => (
  <SectionCard title="交易附件区">
    <div className="placeholder-block">交易记录与商品任务侧文件先以区块和展示占位为主，不做复杂上传管理。</div>
  </SectionCard>
)

export const OperationTimelineSection = ({ timeline = [] }: { timeline?: TimelineRecord[] }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <SectionCard
      title="操作日志区"
      onHeaderClick={() => setExpanded((current) => !current)}
      headerAriaLabel={`${expanded ? '收起' : '展开'}操作日志区`}
      headerExpanded={expanded}
      actions={
        <button type="button" className="button ghost small" onClick={() => setExpanded((current) => !current)}>
          {expanded ? '收起日志' : '展开日志'}
        </button>
      }
    >
      {expanded ? (
        <RecordTimeline
          items={[...timeline]
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
            .map((record) => ({
              id: record.id,
              title: record.title,
              meta: <span className="text-caption">{record.createdAt}</span>,
              description: (
                <div className="stack" style={{ gap: 6 }}>
                  {record.description ? <div>{record.description}</div> : null}
                  <div className="text-caption">处理人：{record.actorName}</div>
                </div>
              ),
              extra: record.relatedTaskId ? (
                <Link to={`/tasks/${record.relatedTaskId}`} className="inline-link-button">
                  查看关联任务
                </Link>
              ) : undefined
            }))}
        />
      ) : null}
    </SectionCard>
  )
}
