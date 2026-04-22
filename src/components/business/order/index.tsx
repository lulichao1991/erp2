import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  EmptyState,
  InfoField,
  InfoGrid,
  PageHeader,
  ReferenceTag,
  RiskTag,
  SectionCard,
  StatusTag,
  SummaryCard,
  TimePressureBadge,
  VersionBadge
} from '@/components/common'
import { useOrderQuote } from '@/hooks/useOrderQuote'
import { buildQuoteResult } from '@/services/quote/quoteService'
import type { Order, OrderItem } from '@/types/order'
import type { Product } from '@/types/product'

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')

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

export const buildReferencedOrderItem = (item: OrderItem, product: Product): OrderItem => ({
  ...item,
  name: product.name,
  status: '已引用模板',
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
    title="订单中心"
    subtitle="首轮先把订单列表、订单详情骨架和商品卡主链路打通。"
    actions={
      <Link to="/orders/new" className="button primary">
        新建订单
      </Link>
    }
  />
)

export const OrderQuickStats = ({ orders }: { orders: Order[] }) => {
  const stats = [
    { label: '全部订单', value: orders.length },
    { label: '待处理', value: orders.filter((item) => item.status.includes('待')).length },
    { label: '进行中', value: orders.filter((item) => item.status.includes('进行')).length },
    { label: '售后中', value: 0 },
    { label: '即将到期', value: orders.filter((item) => getTimePressure(item.promisedDate).variant === 'dueSoon').length },
    { label: '异常订单', value: orders.filter((item) => item.riskTags.length > 0).length }
  ]

  return (
    <div className="stats-grid">
      {stats.map((item) => (
        <div key={item.label} className="stat-card">
          <div className="stat-card-label">{item.label}</div>
          <div className="stat-card-value">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

type OrderFilterValue = {
  keyword: string
  status: string
  owner: string
}

export const OrderFilterBar = ({
  value,
  onChange
}: {
  value: OrderFilterValue
  onChange: (next: OrderFilterValue) => void
}) => (
  <SectionCard title="搜索与筛选" description="首轮先支持订单编号 / 客户姓名搜索，以及状态和负责人筛选。">
    <div className="field-grid three">
      <div className="field-control">
        <label className="field-label">搜索订单编号 / 客户姓名</label>
        <input className="input" value={value.keyword} onChange={(event) => onChange({ ...value, keyword: event.target.value })} />
      </div>
      <div className="field-control">
        <label className="field-label">当前状态</label>
        <select className="select" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}>
          <option value="all">全部状态</option>
          <option value="待处理">待处理</option>
          <option value="进行中">进行中</option>
          <option value="草稿">草稿</option>
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">当前负责人</label>
        <input className="input" value={value.owner} onChange={(event) => onChange({ ...value, owner: event.target.value })} placeholder="例如：张晨" />
      </div>
    </div>
  </SectionCard>
)

export const OrderTable = ({ orders }: { orders: Order[] }) => (
  <div className="table-shell">
    <table className="table">
      <thead>
        <tr>
          <th>风险</th>
          <th>订单编号</th>
          <th>订单类型</th>
          <th>客户</th>
          <th>商品摘要</th>
          <th>状态</th>
          <th>承诺交期</th>
          <th>负责人</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => {
          const pressure = getTimePressure(order.promisedDate)
          return (
            <tr key={order.id}>
              <td>{order.riskTags.length > 0 ? <RiskTag value={order.riskTags[0]} /> : <span className="text-muted">—</span>}</td>
              <td>
                <div className="stack" style={{ gap: 6 }}>
                  <Link to={`/orders/${order.id}`} className="text-price">
                    {order.orderNo}
                  </Link>
                  <span className="text-caption">{order.platformOrderNo || '无平台单号'}</span>
                </div>
              </td>
              <td>{order.orderType}</td>
              <td>
                <div>{order.customerName || '—'}</div>
                <div className="text-caption">{order.customerPhone || '—'}</div>
              </td>
              <td>
                <div>{order.items.length} 个商品</div>
                <div className="text-caption">{order.items.map((item) => item.name).join(' / ')}</div>
              </td>
              <td>
                <StatusTag value={order.status} />
              </td>
              <td>
                <div>{order.promisedDate || '—'}</div>
                <div className="spacer-top">
                  <TimePressureBadge label={pressure.label} variant={pressure.variant} />
                </div>
              </td>
              <td>{order.ownerName}</td>
              <td>
                <div className="row wrap">
                  <Link to={`/orders/${order.id}`} className="button ghost small">
                    查看详情
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

export const OrderSummaryCard = ({ order }: { order: Order }) => {
  const pressure = getTimePressure(order.promisedDate)

  return (
    <SummaryCard title="顶部订单概览">
      <div className="summary-grid three">
        <div className="stack">
          <div>
            <h2 style={{ margin: 0 }}>{order.orderNo}</h2>
            <p className="text-muted">{order.platformOrderNo || '未维护平台单号'}</p>
          </div>
          <div className="row wrap">
            <StatusTag value={order.status} />
            <TimePressureBadge label={pressure.label} variant={pressure.variant} />
            {order.riskTags.map((item) => (
              <RiskTag key={item} value={item} />
            ))}
          </div>
        </div>
        <InfoGrid columns={3}>
          <InfoField label="客户姓名" value={order.customerName || '—'} />
          <InfoField label="客服负责人" value={order.ownerName} />
          <InfoField label="商品数量" value={`${order.items.length} 个`} />
        </InfoGrid>
        <InfoGrid columns={3}>
          <InfoField label="平台付款时间" value={order.paymentDate || '—'} />
          <InfoField label="客户期望时间" value={order.expectedDate || '—'} />
          <InfoField label="承诺交期" value={order.promisedDate || '—'} />
        </InfoGrid>
      </div>
    </SummaryCard>
  )
}

export const OrderInfoCardGroup = ({ order }: { order: Order }) => (
  <div className="field-grid three">
    <SummaryCard title="客户与平台信息">
      <InfoGrid columns={2}>
        <InfoField label="客户姓名" value={order.customerName || '—'} />
        <InfoField label="联系电话" value={order.customerPhone || '—'} />
        <InfoField label="平台单号" value={order.platformOrderNo || '—'} />
        <InfoField label="平台原始地址" value={order.customerAddress || '—'} />
        <InfoField label="客户备注" value={order.customerRemark || '—'} />
      </InfoGrid>
    </SummaryCard>
    <SummaryCard title="时间与交付信息">
      <InfoGrid columns={2}>
        <InfoField label="付款时间" value={order.paymentDate || '—'} />
        <InfoField label="客户期望" value={order.expectedDate || '—'} />
        <InfoField label="承诺交期" value={order.promisedDate || '—'} />
        <InfoField label="当前阶段" value={order.status} />
      </InfoGrid>
    </SummaryCard>
    <SummaryCard title="订单摘要信息">
      <InfoGrid columns={2}>
        <InfoField label="订单类型" value={order.orderType} />
        <InfoField label="当前负责人" value={order.ownerName} />
        <InfoField label="风险摘要" value={order.riskTags.join(' / ') || '—'} />
        <InfoField label="整单备注" value={order.remark || '—'} />
      </InfoGrid>
    </SummaryCard>
  </div>
)

export const ProductReferenceBanner = ({
  item,
  onOpenSource
}: {
  item: OrderItem
  onOpenSource: () => void
}) => {
  if (!item.sourceProduct) {
    return null
  }

  return (
    <div className="banner">
      <div>
        <div className="row wrap">
          <button type="button" className="title-button" onClick={onOpenSource} aria-label={`从来源产品条打开：${item.sourceProduct.sourceProductName}`}>
            <strong>{item.sourceProduct.sourceProductName}</strong>
          </button>
          <VersionBadge value={item.sourceProduct.sourceProductVersion} />
          <ReferenceTag active />
        </div>
        <div className="text-caption">{item.sourceProduct.sourceProductCode}</div>
      </div>
      <button type="button" className="button secondary small" onClick={onOpenSource}>
        查看来源产品
      </button>
    </div>
  )
}

export const CustomerSpecBlock = ({
  item,
  onChange
}: {
  item: OrderItem
  onChange: (next: OrderItem) => void
}) => (
  <SectionCard title="客服需求区" description="记录当前订单商品的客服需求、刻字/尺寸说明和交付备注。">
    <div className="field-grid two">
      <div className="field-control">
        <label className="field-label">尺寸 / 规格备注</label>
        <textarea
          className="textarea"
          value={item.actualRequirements?.sizeNote || ''}
          onChange={(event) =>
            onChange({
              ...item,
              actualRequirements: {
                ...item.actualRequirements,
                sizeNote: event.target.value
              }
            })
          }
        />
      </div>
      <div className="field-control">
        <label className="field-label">刻字内容</label>
        <textarea
          className="textarea"
          value={item.actualRequirements?.engraveText || ''}
          onChange={(event) =>
            onChange({
              ...item,
              actualRequirements: {
                ...item.actualRequirements,
                engraveText: event.target.value
              }
            })
          }
        />
      </div>
      <div className="field-control">
        <label className="field-label">特殊需求（逗号分隔）</label>
        <input
          className="input"
          value={(item.actualRequirements?.specialNotes || []).join('，')}
          onChange={(event) =>
            onChange({
              ...item,
              actualRequirements: {
                ...item.actualRequirements,
                specialNotes: event.target.value
                  .split(/[，,\n]/)
                  .map((entry) => entry.trim())
                  .filter(Boolean)
              }
            })
          }
        />
      </div>
      <div className="field-control">
        <label className="field-label">客服备注</label>
        <textarea
          className="textarea"
          value={item.actualRequirements?.remark || ''}
          onChange={(event) =>
            onChange({
              ...item,
              actualRequirements: {
                ...item.actualRequirements,
                remark: event.target.value
              }
            })
          }
        />
      </div>
    </div>
  </SectionCard>
)

export const DesignInfoBlock = ({
  item,
  onChange
}: {
  item: OrderItem
  onChange: (next: OrderItem) => void
}) => (
  <SectionCard title="设计建模区" description="记录设计建模的最小工作流状态，不接后端也能演示协同骨架。">
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
  </SectionCard>
)

export const OutsourceInfoBlock = ({
  item,
  onChange
}: {
  item: OrderItem
  onChange: (next: OrderItem) => void
}) => (
  <SectionCard title="跟单委外区" description="记录跟单与委外的最小交接信息。">
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
  </SectionCard>
)

export const FactoryFeedbackBlock = ({
  item,
  onChange
}: {
  item: OrderItem
  onChange: (next: OrderItem) => void
}) => (
  <SectionCard title="工厂回传区" description="记录工厂回传状态、重量和质检结论，先做前端可演示版。">
    <div className="field-grid three">
      <div className="field-control">
        <label className="field-label">工厂状态</label>
        <select
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
        <label className="field-label">回传重量</label>
        <input
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
        <label className="field-label">质检结论</label>
        <input
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
        <label className="field-label">工厂备注</label>
        <textarea
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
  </SectionCard>
)

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
        <div className="field-control">
          <label className="field-label">数量</label>
          <input
            className="input"
            type="number"
            min={1}
            value={item.quantity}
            onChange={(event) => updateItem({ quantity: Number(event.target.value) || 1 })}
          />
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

      <div className="subtle-panel">
        <strong>规格参数自动带出</strong>
        {item.selectedSpecSnapshot ? (
          <div className="field-grid four spacer-top">
            {item.selectedSpecSnapshot.sizeFields.map((field) => (
              <div key={field.key} className="info-field">
                <span className="info-field-label">{field.label}</span>
                <div className="info-field-value">
                  {field.value}
                  {field.unit || ''}
                </div>
              </div>
            ))}
            <InfoField label="参考重量" value={item.selectedSpecSnapshot.referenceWeight ? `${item.selectedSpecSnapshot.referenceWeight} g` : '—'} />
          </div>
        ) : (
          <div className="text-muted spacer-top">选择规格后自动带出参数摘要。</div>
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

      <div className="subtle-panel">
        <strong>固定加价明细</strong>
        {quote?.priceAdjustments.length ? (
          <ul className="list-reset stack spacer-top">
            {quote.priceAdjustments.map((adjustment) => (
              <li key={`${adjustment.type}-${adjustment.ruleKey}`} className="row wrap" style={{ justifyContent: 'space-between' }}>
                <span>
                  {adjustment.type} · {adjustment.ruleKey}
                </span>
                <span className="text-price">{formatPrice(adjustment.delta)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-muted spacer-top">当前没有命中固定加价规则。</div>
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

export const OrderItemCard = ({
  item,
  product,
  onReference,
  onOpenSource,
  onChange
}: {
  item: OrderItem
  product?: Product
  onReference: () => void
  onOpenSource: () => void
  onChange: (next: OrderItem) => void
}) => (
  <SectionCard
    title={
      item.isReferencedProduct && item.sourceProduct ? (
        <div className="row wrap">
          <button type="button" className="title-button" onClick={onOpenSource} aria-label={`打开来源产品：${item.name}`}>
            {item.name}
          </button>
          <button type="button" className="inline-link-button text-caption" onClick={onOpenSource} aria-label={`查看来源产品：${item.name}`}>
            查看来源产品
          </button>
        </div>
      ) : (
        item.name
      )
    }
    description={`数量 ${item.quantity} · 当前状态 ${item.status}`}
    actions={
      <div className="row wrap">
        <StatusTag value={item.status} />
        <button className="button secondary small" onClick={onReference}>
          {item.isReferencedProduct ? '替换来源产品' : '引用产品'}
        </button>
      </div>
    }
  >
    <div className="stack">
      {item.isReferencedProduct && item.sourceProduct ? (
        <ProductReferenceBanner item={item} onOpenSource={onOpenSource} />
      ) : (
        <EmptyState
          title="当前商品还没有来源产品"
          description="先通过产品引用选择器把标准模板接进来，后续规格与报价区才能开始联动。"
          action={
            <button className="button primary" onClick={onReference}>
              引用产品
            </button>
          }
        />
      )}

      <SectionCard title="规格与报价区">
        <OrderItemSpecPricingBlock item={item} product={product} onChange={onChange} />
      </SectionCard>

      <CustomerSpecBlock item={item} onChange={onChange} />
      <DesignInfoBlock item={item} onChange={onChange} />
      <OutsourceInfoBlock item={item} onChange={onChange} />
      <FactoryFeedbackBlock item={item} onChange={onChange} />
    </div>
  </SectionCard>
)

export const OrderItemsSection = ({
  order,
  renderItem,
  onAddItem
}: {
  order: Order
  renderItem: (item: OrderItem) => ReactNode
  onAddItem?: () => void
}) => (
  <SectionCard
    title="商品协同区"
    description="商品卡是订单详情页的核心复用组件，来源产品条与规格报价区必须在这里完成。"
    actions={
      onAddItem ? (
        <button className="button primary small" onClick={onAddItem}>
          新增商品
        </button>
      ) : undefined
    }
  >
    <div className="stack">
      {order.items.map((item) => (
        <div key={item.id}>{renderItem(item)}</div>
      ))}
    </div>
  </SectionCard>
)

export const LogisticsSection = () => (
  <SectionCard title="物流记录区">
    <div className="placeholder-block">首轮先保留物流记录展示占位，后续补弹窗和记录流转。</div>
  </SectionCard>
)

export const AfterSalesSection = () => (
  <SectionCard title="售后记录区">
    <div className="placeholder-block">首轮先保留售后记录展示占位，后续补详情与编辑弹窗。</div>
  </SectionCard>
)

export const OrderAttachmentSection = () => (
  <SectionCard title="附件区">
    <div className="placeholder-block">订单侧文件先以区块和展示占位为主，不做复杂上传管理。</div>
  </SectionCard>
)

export const OperationTimelineSection = () => (
  <SectionCard title="日志记录区">
    <div className="placeholder-block">时间轴与操作日志先展示结构占位，保证后续能自然接入。</div>
  </SectionCard>
)
