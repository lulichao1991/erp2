import { Link } from 'react-router-dom'
import { EmptyState, InfoField, InfoGrid, RecordTimeline, SectionCard, StatusTag } from '@/components/common'
import { afterSalesMock, logisticsMock } from '@/mocks'
import type { Customer } from '@/types/customer'
import type { OrderLine } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'

type PurchaseLineRow = {
  line: OrderLine
  purchase: Purchase
}

const purchaseAggregateStatusLabelMap: Record<string, string> = {
  draft: '草稿',
  in_progress: '进行中',
  partially_shipped: '部分发货',
  completed: '已完成',
  after_sales: '售后中',
  exception: '异常',
  cancelled: '已取消'
}

const orderLineStatusLabelMap: Record<string, string> = {
  draft: '草稿',
  pending_confirm: '待确认',
  pending_measurement: '待量尺',
  pending_design: '待设计',
  designing: '设计中',
  pending_outsource: '待下厂',
  in_production: '生产中',
  pending_factory_feedback: '待工厂回传',
  pending_shipment: '待发货',
  shipped: '已发货',
  after_sales: '售后中',
  completed: '已完成',
  cancelled: '已取消'
}

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')

const getPurchaseAggregateStatusLabel = (status?: string) => (status ? purchaseAggregateStatusLabelMap[status] || status : '待确认')

const getOrderLineStatusLabel = (status?: string) => (status ? orderLineStatusLabelMap[status] || status : '待确认')

const getParameterSummary = (line: OrderLine) =>
  [
    line.selectedSpecValue ? `规格 ${line.selectedSpecValue}` : null,
    line.selectedMaterial ? `材质 ${line.selectedMaterial}` : line.actualRequirements?.material ? `材质 ${line.actualRequirements.material}` : null,
    line.selectedProcess ? `工艺 ${line.selectedProcess}` : line.actualRequirements?.process ? `工艺 ${line.actualRequirements.process}` : null,
    line.actualRequirements?.sizeNote ? `尺寸 ${line.actualRequirements.sizeNote}` : null
  ]
    .filter(Boolean)
    .join(' / ') || '待补充参数'

const getPaymentSummary = (purchase: Purchase) => {
  const transactions = purchase.finance?.transactions ?? []
  const receivedAmount = transactions
    .filter((item) => item.type === 'deposit_received' || item.type === 'balance_received' || item.type === 'after_sales_payment')
    .reduce((sum, item) => sum + item.amount, 0)
  const receivableAmount = purchase.finance?.dealPrice ?? purchase.orderLines.reduce((sum, line) => sum + (line.finalDisplayQuote || line.quote?.systemQuote || 0), 0)
  const pendingAmount = Math.max(receivableAmount - receivedAmount, 0)

  return {
    receivableAmount,
    receivedAmount,
    pendingAmount,
    paymentStatus: pendingAmount === 0 ? '已付清' : receivedAmount > 0 ? '部分收款' : '待收款',
    paymentMethod: purchase.sourceChannel === 'taobao' ? '淘宝平台' : purchase.sourceChannel || '待确认',
    canShip: pendingAmount === 0
  }
}

export const PurchaseSummarySection = ({ purchase, customer }: { purchase: Purchase; customer?: Customer }) => (
  <SectionCard title="购买记录摘要" description="购买记录只汇总一次购买的公共信息；商品推进以商品行为准。">
    <InfoGrid columns={3}>
      <InfoField label="购买记录编号" value={purchase.purchaseNo} />
      <InfoField label="平台订单号" value={purchase.platformOrderNo || '—'} />
      <InfoField label="渠道" value={purchase.sourceChannel} />
      <InfoField label="客户姓名" value={customer?.name || '—'} />
      <InfoField label="付款时间" value={purchase.paymentAt || '—'} />
      <InfoField label="客服负责人" value={purchase.ownerName || '待分配'} />
      <InfoField label="商品行数量" value={purchase.orderLines.length} />
      <InfoField label="聚合状态" value={<StatusTag value={getPurchaseAggregateStatusLabel(purchase.aggregateStatus)} />} />
    </InfoGrid>
  </SectionCard>
)

export const PurchaseCustomerSection = ({ purchase, customer }: { purchase: Purchase; customer?: Customer }) => (
  <SectionCard title="客户与收货信息">
    <InfoGrid columns={3}>
      <InfoField label="客户姓名" value={customer?.name || '—'} />
      <InfoField label="手机" value={customer?.phone || '—'} />
      <InfoField label="微信" value={customer?.wechat || '—'} />
      <InfoField label="收件人" value={purchase.recipientName || customer?.defaultRecipientName || '—'} />
      <InfoField label="收件手机号" value={purchase.recipientPhone || customer?.defaultRecipientPhone || '—'} />
      <InfoField label="收件地址" value={purchase.recipientAddress || customer?.defaultRecipientAddress || '—'} />
      <InfoField label="客户备注" value={customer?.remark || '—'} />
    </InfoGrid>
  </SectionCard>
)

export const PurchasePaymentSection = ({ purchase }: { purchase: Purchase }) => {
  const summary = getPaymentSummary(purchase)

  return (
    <SectionCard title="付款总览" description="第一版只展示购买记录层面的付款汇总，不展开复杂财务中心。">
      <InfoGrid columns={3}>
        <InfoField label="应收总额" value={formatPrice(summary.receivableAmount)} />
        <InfoField label="已收金额" value={formatPrice(summary.receivedAmount)} />
        <InfoField label="待收金额" value={formatPrice(summary.pendingAmount)} />
        <InfoField label="付款状态" value={<StatusTag value={summary.paymentStatus} />} />
        <InfoField label="付款方式" value={summary.paymentMethod} />
        <InfoField label="是否允许发货" value={summary.canShip ? '是' : '否'} />
        <InfoField label="财务备注" value={purchase.finance?.remark || '—'} />
      </InfoGrid>
    </SectionCard>
  )
}

export const PurchaseOrderLineTable = ({
  rows,
  onOpenOrderLine
}: {
  rows: PurchaseLineRow[]
  onOpenOrderLine: (row: PurchaseLineRow) => void
}) => (
  <SectionCard
    title="本次商品行列表"
    description="直接展示本次购买下的所有商品行，避免把多件商品折叠成一条摘要。"
    actions={
      <Link to="/order-lines" className="button secondary small">
        返回商品行中心
      </Link>
    }
  >
    {rows.length > 0 ? (
      <div className="table-shell">
        <table className="table">
          <thead>
            <tr>
              <th>商品行编号</th>
              <th>商品名称</th>
              <th>状态</th>
              <th>当前负责人</th>
              <th>承诺交期</th>
              <th>参数摘要</th>
              <th>物流状态</th>
              <th>售后状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ line, purchase }) => {
              const logisticsRecord = logisticsMock.find((item) => item.orderLineId === line.id)
              const afterSalesCase = afterSalesMock.find((item) => item.orderLineId === line.id && item.status !== 'closed')

              return (
                <tr key={line.id}>
                  <td>{line.lineCode || line.id}</td>
                  <td>
                    <div>{line.name}</div>
                    <div className="text-caption">{line.sourceProduct?.sourceProductName || '非模板定制'}</div>
                  </td>
                  <td>
                    <StatusTag value={getOrderLineStatusLabel(String(line.status))} />
                  </td>
                  <td>{line.currentOwner || purchase.ownerName || '待分配'}</td>
                  <td>{line.promisedDate || purchase.promisedDate || '—'}</td>
                  <td>{getParameterSummary(line)}</td>
                  <td>{logisticsRecord ? `物流 ${logisticsRecord.trackingNo || '已创建'}` : '无物流'}</td>
                  <td>{afterSalesCase ? `售后 ${afterSalesCase.status || 'open'}` : '无售后'}</td>
                  <td>
                    <button type="button" className="button ghost small" onClick={() => onOpenOrderLine({ line, purchase })}>
                      查看商品行
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <EmptyState title="暂无商品行" description="当前购买记录还没有关联商品行。" />
    )}
  </SectionCard>
)

export const PurchaseNotesTimelineSection = ({ purchase }: { purchase: Purchase }) => (
  <SectionCard title="备注与日志">
    <div className="stack">
      <InfoGrid columns={2}>
        <InfoField label="购买备注" value={purchase.remark || '—'} />
        <InfoField label="最新动态时间" value={purchase.latestActivityAt || '—'} />
      </InfoGrid>
      <RecordTimeline
        items={purchase.timeline.map((item) => ({
          id: item.id,
          title: item.title,
          meta: item.createdAt,
          description: item.description || '—'
        }))}
      />
    </div>
  </SectionCard>
)
