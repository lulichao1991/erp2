import { Link } from 'react-router-dom'
import { EmptyState, InfoField, InfoGrid, SectionCard, StatusTag } from '@/components/common'
import type { Customer } from '@/types/customer'
import type { OrderLine } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'
import type { AfterSalesCase } from '@/types/supporting-records'

type CustomerOverview = {
  customer: Customer
  purchases: Purchase[]
  orderLines: OrderLine[]
  afterSalesCases: AfterSalesCase[]
  latestPurchaseAt: string
}

const channelLabelMap: Record<string, string> = {
  taobao: '淘宝',
  tmall: '天猫',
  xiaohongshu: '小红书',
  wechat: '微信',
  offline: '线下',
  other: '其他'
}

const orderLineStatusLabelMap: Record<string, string> = {
  draft: '草稿',
  pending_confirm: '待确认',
  pending_measurement: '待测量',
  pending_design: '待设计',
  designing: '设计中',
  pending_outsource: '待下厂',
  in_production: '生产中',
  pending_factory_feedback: '待工厂回传',
  pending_shipment: '待发货',
  shipped: '已发货',
  after_sales: '售后中',
  completed: '已完成',
  cancelled: '已取消',
  exception: '异常'
}

const formatChannels = (channels: string[]) => channels.map((channel) => channelLabelMap[channel] || channel).join(' / ') || '—'

const getLatestPurchaseAt = (customer: Customer, purchases: Purchase[]) => {
  const latest = purchases
    .map((purchase) => purchase.latestActivityAt || purchase.paymentAt || purchase.promisedDate || '')
    .filter(Boolean)
    .sort()

  return latest[latest.length - 1] || customer.lastTransactionAt || '—'
}

export const buildCustomerOverview = ({
  customer,
  purchases,
  orderLines,
  afterSalesCases
}: {
  customer: Customer
  purchases: Purchase[]
  orderLines: OrderLine[]
  afterSalesCases: AfterSalesCase[]
}): CustomerOverview => {
  const customerPurchases = purchases.filter((purchase) => purchase.customerId === customer.id)
  const purchaseIds = new Set(customerPurchases.map((purchase) => purchase.id))
  const customerOrderLines = orderLines.filter((line) => line.customerId === customer.id || (line.purchaseId && purchaseIds.has(line.purchaseId)))
  const orderLineIds = new Set(customerOrderLines.map((line) => line.id))
  const customerAfterSalesCases = afterSalesCases.filter((item) => item.customerId === customer.id || orderLineIds.has(item.orderLineId))

  return {
    customer,
    purchases: customerPurchases,
    orderLines: customerOrderLines,
    afterSalesCases: customerAfterSalesCases,
    latestPurchaseAt: getLatestPurchaseAt(customer, customerPurchases)
  }
}

export const CustomerListTable = ({ overviews }: { overviews: CustomerOverview[] }) => {
  if (overviews.length === 0) {
    return <EmptyState title="暂无客户" description="当前 mock 数据还没有客户记录。" />
  }

  return (
    <div className="table-shell">
      <table className="table">
        <thead>
          <tr>
            <th>客户姓名</th>
            <th>手机</th>
            <th>微信</th>
            <th>来源渠道</th>
            <th>历史购买</th>
            <th>历史商品行</th>
            <th>售后次数</th>
            <th>最近购买时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {overviews.map(({ customer, purchases, orderLines, afterSalesCases, latestPurchaseAt }) => (
            <tr key={customer.id}>
              <td>{customer.name || '未命名客户'}</td>
              <td>{customer.phone || '—'}</td>
              <td>{customer.wechat || '—'}</td>
              <td>{formatChannels(customer.sourceChannels)}</td>
              <td>{purchases.length}</td>
              <td>{orderLines.length}</td>
              <td>{afterSalesCases.length}</td>
              <td>{latestPurchaseAt}</td>
              <td>
                <Link to={`/customers/${customer.id}`} className="button ghost small">
                  查看客户
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const CustomerBasicSection = ({ overview }: { overview: CustomerOverview }) => {
  const { customer } = overview

  return (
    <SectionCard title="客户基础信息">
      <InfoGrid columns={3}>
        <InfoField label="客户姓名" value={customer.name || '—'} />
        <InfoField label="手机" value={customer.phone || '—'} />
        <InfoField label="微信" value={customer.wechat || '—'} />
        <InfoField label="来源渠道" value={formatChannels(customer.sourceChannels)} />
        <InfoField label="历史购买次数" value={overview.purchases.length} />
        <InfoField label="历史商品行数量" value={overview.orderLines.length} />
        <InfoField label="售后次数" value={overview.afterSalesCases.length} />
        <InfoField label="最近购买时间" value={overview.latestPurchaseAt} />
        <InfoField label="客户备注" value={customer.remark || '—'} />
      </InfoGrid>
    </SectionCard>
  )
}

export const CustomerPurchasesSection = ({ purchases }: { purchases: Purchase[] }) => (
  <SectionCard title="历史购买记录">
    {purchases.length > 0 ? (
      <div className="table-shell">
        <table className="table">
          <thead>
            <tr>
              <th>购买记录编号</th>
              <th>渠道</th>
              <th>平台订单号</th>
              <th>商品行数量</th>
              <th>最近动态</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td>
                  <Link to={`/purchases/${purchase.id}`} className="text-price">
                    {purchase.purchaseNo}
                  </Link>
                </td>
                <td>{channelLabelMap[purchase.sourceChannel] || purchase.sourceChannel}</td>
                <td>{purchase.platformOrderNo || '—'}</td>
                <td>{purchase.orderLineCount || purchase.orderLines.length}</td>
                <td>{purchase.latestActivityAt || purchase.paymentAt || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyState title="暂无购买记录" description="当前客户还没有购买记录。" />
    )}
  </SectionCard>
)

export const CustomerOrderLinesSection = ({ orderLines }: { orderLines: OrderLine[] }) => (
  <SectionCard title="历史商品行">
    {orderLines.length > 0 ? (
      <div className="table-shell">
        <table className="table">
          <thead>
            <tr>
              <th>商品行编号</th>
              <th>商品名称</th>
              <th>状态</th>
              <th>当前负责人</th>
              <th>承诺交期</th>
              <th>入口</th>
            </tr>
          </thead>
          <tbody>
            {orderLines.map((line) => (
              <tr key={line.id}>
                <td>{line.lineCode || line.id}</td>
                <td>{line.name}</td>
                <td>
                  <StatusTag value={orderLineStatusLabelMap[String(line.status)] || String(line.status)} />
                </td>
                <td>{line.currentOwner || '待分配'}</td>
                <td>{line.promisedDate || '—'}</td>
                <td>
                  <Link to="/order-lines" className="button ghost small">
                    查看商品行
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyState title="暂无商品行" description="当前客户还没有商品行记录。" />
    )}
  </SectionCard>
)

export const CustomerAfterSalesSection = ({ cases }: { cases: AfterSalesCase[] }) => (
  <SectionCard title="历史售后摘要">
    {cases.length > 0 ? (
      <div className="stack">
        {cases.map((item) => (
          <div key={item.id} className="subtle-panel">
            <div className="row wrap" style={{ justifyContent: 'space-between' }}>
              <strong>{item.reason || item.remark || '售后记录'}</strong>
              <StatusTag value={item.status || '待处理'} />
            </div>
            <div className="text-caption">
              商品行 {item.orderLineId} · 负责人 {item.responsibleParty || '待分配'} · {item.createdAt || '—'}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState title="暂无售后" description="当前客户还没有售后记录。" />
    )}
  </SectionCard>
)
