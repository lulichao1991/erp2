import { useMemo, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SourceProductDrawer, type SourceProductCompareValue } from '@/components/business/sourceProduct'
import { EmptyState, InfoField, InfoGrid, RiskTag, SectionCard, SideDrawer, StatusTag, TimePressureBadge, VersionBadge } from '@/components/common'
import { afterSalesMock, customersMock, logisticsMock, purchasesMock } from '@/mocks'
import { mockProducts } from '@/mocks/products'
import type { OrderLine, OrderLineStatus } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'

export type OrderLineCenterFilters = {
  keyword: string
  status: 'all' | OrderLineStatus | string
  owner: string
}

export type OrderLineRow = {
  line: OrderLine
  purchase?: Purchase
}

const statusLabelMap: Record<string, string> = {
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

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending_confirm', label: '待确认' },
  { value: 'pending_design', label: '待设计' },
  { value: 'designing', label: '设计中' },
  { value: 'pending_outsource', label: '待下厂' },
  { value: 'in_production', label: '生产中' },
  { value: 'pending_shipment', label: '待发货' },
  { value: 'after_sales', label: '售后中' },
  { value: 'completed', label: '已完成' }
]

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')

const getStatusLabel = (status?: string) => (status ? statusLabelMap[status] || status : '待确认')

const designStatusLabelMap: Record<string, string> = {
  not_required: '不需要设计',
  pending: '待设计',
  in_progress: '设计中',
  completed: '已完成',
  delivered: '已交付',
  rework: '返工中'
}

const factoryStatusLabelMap: Record<string, string> = {
  not_started: '未开始',
  in_progress: '生产中',
  pending_feedback: '待回传',
  completed: '已完成',
  issue: '异常'
}

const afterSalesStatusLabelMap: Record<string, string> = {
  open: '待处理',
  in_progress: '处理中',
  closed: '已关闭'
}

const afterSalesTypeLabelMap: Record<string, string> = {
  repair: '维修',
  resize: '改圈/改尺寸',
  refund: '退款',
  exchange: '换货',
  other: '其他'
}

const getDesignStatusLabel = (status?: string) => (status ? designStatusLabelMap[status] || status : '待确认')
const getFactoryStatusLabel = (status?: string) => (status ? factoryStatusLabelMap[status] || status : '待确认')
const getAfterSalesStatusLabel = (status?: string) => (status ? afterSalesStatusLabelMap[status] || status : '待处理')
const getAfterSalesTypeLabel = (type?: string) => (type ? afterSalesTypeLabelMap[type] || type : '未分类')

const getTimePressure = (promisedDate?: string) => {
  if (!promisedDate) {
    return { label: '待确认交期', variant: 'normal' as const, overdue: false }
  }

  const promised = new Date(`${promisedDate}T23:59:59`)
  const now = new Date()
  const diffDays = Math.ceil((promised.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { label: `已超时 ${Math.abs(diffDays)} 天`, variant: 'overdue' as const, overdue: true }
  }

  if (diffDays <= 3) {
    return { label: `剩余 ${diffDays} 天`, variant: 'dueSoon' as const, overdue: false }
  }

  return { label: `剩余 ${diffDays} 天`, variant: 'normal' as const, overdue: false }
}

const getParameterSummary = (line: OrderLine) =>
  [
    line.selectedSpecValue ? `规格 ${line.selectedSpecValue}` : null,
    line.selectedMaterial ? `材质 ${line.selectedMaterial}` : line.actualRequirements?.material ? `材质 ${line.actualRequirements.material}` : null,
    line.selectedProcess ? `工艺 ${line.selectedProcess}` : line.actualRequirements?.process ? `工艺 ${line.actualRequirements.process}` : null,
    line.actualRequirements?.sizeNote ? `尺寸 ${line.actualRequirements.sizeNote}` : null
  ]
    .filter(Boolean)
    .join(' / ') || '待补充参数'

const getFactorySummary = (line: OrderLine) =>
  line.outsourceInfo?.supplierName && line.outsourceInfo.supplierName !== '待定' ? line.outsourceInfo.supplierName : '待确认工厂'

const getLineRiskLabels = (line: OrderLine) => {
  const hasOpenAfterSales = afterSalesMock.some((item) => item.orderLineId === line.id && item.status !== 'closed')
  const pressure = getTimePressure(line.promisedDate)

  return [
    hasOpenAfterSales ? '售后跟进' : null,
    pressure.overdue ? '已超时' : null,
    line.priority === 'urgent' ? '加急' : null,
    line.priority === 'vip' ? 'VIP' : null
  ].filter((item): item is string => Boolean(item))
}

const isInteractiveTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && Boolean(target.closest('a, button, input, select, textarea, label'))

const TextList = ({ values, empty = '—' }: { values?: string[]; empty?: string }) => (values && values.length > 0 ? values.join(' / ') : empty)

const buildOrderLineSourceProductCompareValue = (line: OrderLine): SourceProductCompareValue => ({
  sourceLabel: `${line.lineCode || line.id} ${line.name}`,
  specValue: line.selectedSpecValue || line.sourceProduct?.sourceSpecValue,
  material: line.selectedMaterial || line.actualRequirements?.material,
  process: line.selectedProcess || line.actualRequirements?.process,
  specialOptions: line.selectedSpecialOptions
})

const DetailSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <SectionCard title={title} className="compact-card">
    {children}
  </SectionCard>
)

const buildRows = (): OrderLineRow[] =>
  purchasesMock.flatMap((purchase) =>
    purchase.orderLines.map((line) => ({
      line,
      purchase
    }))
  )

export const OrderLineQuickStats = ({ rows }: { rows: OrderLineRow[] }) => {
  const stats = [
    { label: '全部商品行', value: rows.length },
    { label: '待确认', value: rows.filter(({ line }) => line.status === 'pending_confirm').length },
    { label: '待设计', value: rows.filter(({ line }) => line.status === 'pending_design' || line.status === 'designing').length },
    { label: '待下厂', value: rows.filter(({ line }) => line.status === 'pending_outsource').length },
    { label: '生产中', value: rows.filter(({ line }) => line.status === 'in_production').length },
    { label: '待发货', value: rows.filter(({ line }) => line.status === 'pending_shipment').length },
    { label: '售后中', value: rows.filter(({ line }) => line.status === 'after_sales' || afterSalesMock.some((item) => item.orderLineId === line.id && item.status !== 'closed')).length },
    { label: '已超时', value: rows.filter(({ line }) => getTimePressure(line.promisedDate).overdue).length }
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

export const OrderLineFilterBar = ({
  value,
  onChange
}: {
  value: OrderLineCenterFilters
  onChange: (next: OrderLineCenterFilters) => void
}) => (
  <SectionCard title="搜索与筛选" description="按商品行编号、商品名称、客户、购买记录和负责人快速定位。">
    <div className="field-grid three">
      <div className="field-control">
        <label className="field-label">搜索商品行编号 / 商品名称 / 客户 / 购买记录</label>
        <input
          className="input"
          value={value.keyword}
          onChange={(event) => onChange({ ...value, keyword: event.target.value })}
          placeholder="例如：山形戒指 / 张三 / PUR-202604-001"
        />
      </div>
      <div className="field-control">
        <label className="field-label">状态筛选</label>
        <select className="select" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">负责人筛选</label>
        <input
          className="input"
          value={value.owner}
          onChange={(event) => onChange({ ...value, owner: event.target.value })}
          placeholder="例如：王客服 / 陈设计"
        />
      </div>
    </div>
  </SectionCard>
)

export const OrderLineTable = ({
  rows,
  onOpenDetail
}: {
  rows: OrderLineRow[]
  onOpenDetail?: (row: OrderLineRow) => void
}) => (
  <div className="table-shell">
    <table className="table">
      <thead>
        <tr>
          <th>风险</th>
          <th>商品行编号</th>
          <th>商品名称</th>
          <th>客户</th>
          <th>所属购买记录</th>
          <th>参数摘要</th>
          <th>状态</th>
          <th>当前负责人</th>
          <th>承诺交期</th>
          <th>工厂</th>
          <th>物流 / 售后</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ line, purchase }) => {
          const row = { line, purchase }
          const customer = customersMock.find((item) => item.id === line.customerId || item.id === purchase?.customerId)
          const logistics = logisticsMock.find((item) => item.orderLineId === line.id)
          const afterSales = afterSalesMock.find((item) => item.orderLineId === line.id && item.status !== 'closed')
          const pressure = getTimePressure(line.promisedDate)
          const riskLabels = getLineRiskLabels(line)
          const handleRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
            if (!onOpenDetail || isInteractiveTarget(event.target)) {
              return
            }
            onOpenDetail(row)
          }
          const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
            if (!onOpenDetail || isInteractiveTarget(event.target)) {
              return
            }
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onOpenDetail(row)
            }
          }

          return (
            <tr key={line.id} role={onOpenDetail ? 'button' : undefined} tabIndex={onOpenDetail ? 0 : undefined} onClick={handleRowClick} onKeyDown={handleRowKeyDown}>
              <td>
                {riskLabels.length > 0 ? (
                  <div className="row wrap">
                    {riskLabels.map((label) => (
                      <RiskTag key={label} value={label} />
                    ))}
                  </div>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td>
                <div className="stack" style={{ gap: 6 }}>
                  <strong>{line.lineCode || line.id}</strong>
                  <span className="text-caption">{line.sourceProduct?.sourceProductCode || '未引用模板'}</span>
                </div>
              </td>
              <td>
                <div>{line.name}</div>
                <div className="text-caption">{line.sourceProduct?.sourceProductName || '非模板定制'}</div>
              </td>
              <td>
                <div>{customer?.name || '—'}</div>
                <div className="text-caption">{customer?.phone || '—'}</div>
              </td>
              <td>
                {purchase ? (
                  <Link to={`/purchases/${purchase.id}`} className="text-price">
                    {purchase.purchaseNo}
                  </Link>
                ) : (
                  <span className="text-muted">—</span>
                )}
                <div className="text-caption">{purchase?.platformOrderNo || '无平台单号'}</div>
              </td>
              <td>
                <div>{getParameterSummary(line)}</div>
                <div className="text-caption">参考报价 {formatPrice(line.quote?.systemQuote)}</div>
              </td>
              <td>
                <StatusTag value={getStatusLabel(String(line.status))} />
              </td>
              <td>{line.currentOwner || purchase?.ownerName || '待分配'}</td>
              <td>
                <div>{line.promisedDate || purchase?.promisedDate || '—'}</div>
                <div className="spacer-top">
                  <TimePressureBadge label={pressure.label} variant={pressure.variant} />
                </div>
              </td>
              <td>{getFactorySummary(line)}</td>
              <td>
                <div>{logistics ? `物流 ${logistics.trackingNo}` : '未发货'}</div>
                <div className="text-caption">{afterSales ? `售后 ${afterSales.status || 'open'}` : '无售后'}</div>
              </td>
              <td>
                <button type="button" className="button ghost small" onClick={() => onOpenDetail?.(row)}>
                  查看
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

export const OrderLineDetailDrawer = ({
  open,
  row,
  onClose
}: {
  open: boolean
  row?: OrderLineRow
  onClose: () => void
}) => {
  const [sourceProductOpen, setSourceProductOpen] = useState(false)
  const line = row?.line
  const purchase = row?.purchase
  const customer = customersMock.find((item) => item.id === line?.customerId || item.id === purchase?.customerId)
  const logisticsRecords = line ? logisticsMock.filter((item) => item.orderLineId === line.id) : []
  const afterSalesCases = line ? afterSalesMock.filter((item) => item.orderLineId === line.id) : []
  const riskLabels = line ? getLineRiskLabels(line) : []
  const sourceProduct = line ? mockProducts.find((product) => product.id === line.sourceProduct?.sourceProductId || product.id === line.productId) : undefined
  const sourceProductCompareValue = line ? buildOrderLineSourceProductCompareValue(line) : undefined
  const handleClose = () => {
    setSourceProductOpen(false)
    onClose()
  }

  return (
    <SideDrawer open={open} title="商品行详情" onClose={handleClose}>
      {!line ? (
        <EmptyState title="未选择商品行" description="请选择一条商品行查看详情。" />
      ) : (
        <div className="stack">
          <DetailSection title="顶部摘要">
            <InfoGrid columns={3}>
              <InfoField label="商品行编号" value={line.lineCode || line.id} />
              <InfoField label="商品名称" value={line.name} />
              <InfoField label="当前状态" value={<StatusTag value={getStatusLabel(String(line.status))} />} />
              <InfoField label="当前负责人" value={line.currentOwner || purchase?.ownerName || '待分配'} />
              <InfoField label="客户姓名" value={customer?.name || '—'} />
              <InfoField label="所属购买记录编号" value={purchase?.purchaseNo || '—'} />
              <InfoField label="承诺交期" value={line.promisedDate || purchase?.promisedDate || '—'} />
              <InfoField
                label="风险标签"
                value={
                  riskLabels.length > 0 ? (
                    <div className="row wrap">
                      {riskLabels.map((label) => (
                        <RiskTag key={label} value={label} />
                      ))}
                    </div>
                  ) : (
                    '—'
                  )
                }
              />
            </InfoGrid>
          </DetailSection>

          <DetailSection title="来源产品">
            <InfoGrid columns={3}>
              <InfoField label="是否引用产品" value={line.isReferencedProduct ? '是' : '否'} />
              <InfoField label="来源产品名称" value={line.sourceProduct?.sourceProductName || '未引用产品'} />
              <InfoField label="来源产品编号" value={line.sourceProduct?.sourceProductCode || '—'} />
              <InfoField label="来源产品版本" value={line.sourceProduct?.sourceProductVersion ? <VersionBadge value={line.sourceProduct.sourceProductVersion} /> : '—'} />
              <InfoField label="所选规格" value={line.selectedSpecValue || line.sourceProduct?.sourceSpecValue || '—'} />
              <InfoField
                label="来源产品入口"
                value={
                  <button type="button" className="button ghost small" onClick={() => setSourceProductOpen(true)} disabled={!sourceProduct}>
                    查看来源产品
                  </button>
                }
              />
            </InfoGrid>
          </DetailSection>

          <DetailSection title="规格与报价">
            <InfoGrid columns={3}>
              <InfoField label="规格" value={line.selectedSpecValue || '—'} />
              <InfoField label="材质" value={line.selectedMaterial || line.actualRequirements?.material || '—'} />
              <InfoField label="工艺" value={line.selectedProcess || line.actualRequirements?.process || '—'} />
              <InfoField label="特殊需求" value={<TextList values={line.selectedSpecialOptions} />} />
              <InfoField label="系统参考报价" value={formatPrice(line.quote?.systemQuote)} />
              <InfoField label="成交价" value={formatPrice(line.finalDisplayQuote)} />
            </InfoGrid>
          </DetailSection>

          <DetailSection title="实际需求">
            <InfoGrid columns={2}>
              <InfoField label="尺寸备注" value={line.actualRequirements?.sizeNote || '—'} />
              <InfoField label="印记 / 刻字" value={line.actualRequirements?.engraveText || '—'} />
              <InfoField label="特殊说明" value={<TextList values={line.actualRequirements?.specialNotes} />} />
              <InfoField label="客服备注" value={line.actualRequirements?.remark || '—'} />
              <InfoField label="生产备注" value={line.productionInfo?.factoryNote || line.outsourceInfo?.outsourceNote || '—'} />
            </InfoGrid>
          </DetailSection>

          <DetailSection title="设计建模摘要">
            <InfoGrid columns={3}>
              <InfoField label="是否需要设计" value={line.designInfo?.requiresRemodeling ? '是' : line.designInfo?.designStatus === 'not_required' ? '否' : '待确认'} />
              <InfoField label="设计状态" value={getDesignStatusLabel(String(line.designInfo?.designStatus || ''))} />
              <InfoField label="设计负责人" value={line.designInfo?.assignedDesigner || '—'} />
              <InfoField label="建模文件" value={line.designInfo?.modelingFileUrl || '暂无文件'} />
              <InfoField label="出蜡文件" value={line.designInfo?.waxFileUrl || '暂无文件'} />
              <InfoField label="设计备注" value={line.designInfo?.designNote || '—'} />
            </InfoGrid>
          </DetailSection>

          <DetailSection title="跟单下厂摘要">
            <InfoGrid columns={3}>
              <InfoField label="工厂" value={getFactorySummary(line)} />
              <InfoField label="下厂时间" value={line.sourceProduct?.snapshotAt || '待补充'} />
              <InfoField label="生产任务编号 / 货号" value={line.itemSku || line.lineCode || '—'} />
              <InfoField label="工厂计划交期" value={line.outsourceInfo?.plannedDeliveryDate || line.expectedDate || '—'} />
              <InfoField label="跟单状态" value={line.outsourceInfo?.outsourceStatus || '—'} />
              <InfoField label="跟单备注" value={line.outsourceInfo?.outsourceNote || '—'} />
            </InfoGrid>
          </DetailSection>

          <DetailSection title="工厂回传摘要">
            <InfoGrid columns={3}>
              <InfoField label="工厂状态" value={getFactoryStatusLabel(String(line.productionInfo?.factoryStatus || ''))} />
              <InfoField label="实际材质" value={line.actualRequirements?.material || line.selectedMaterial || '—'} />
              <InfoField label="总重" value={line.productionInfo?.returnedWeight || '—'} />
              <InfoField label="净重" value="—" />
              <InfoField label="质检结果" value={line.productionInfo?.qualityResult || '—'} />
              <InfoField label="工厂备注" value={line.productionInfo?.factoryNote || '—'} />
            </InfoGrid>
          </DetailSection>

          <DetailSection title="物流 / 售后摘要">
            <div className="stack">
              <div className="subtle-panel">
                <strong>物流记录</strong>
                {logisticsRecords.length > 0 ? (
                  <ul className="list-reset stack spacer-top">
                    {logisticsRecords.map((record) => (
                      <li key={record.id}>
                        <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                          <span>{record.carrier || '未填写承运商'}</span>
                          <span className="text-price">{record.trackingNo || '无单号'}</span>
                        </div>
                        <div className="text-caption">{record.shippedAt || '未发货'} · {record.note || '—'}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="暂无物流记录" description="当前商品行还没有关联物流记录。" />
                )}
              </div>
              <div className="subtle-panel">
                <strong>售后记录</strong>
                {afterSalesCases.length > 0 ? (
                  <ul className="list-reset stack spacer-top">
                    {afterSalesCases.map((record) => (
                      <li key={record.id}>
                        <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                          <span>{getAfterSalesTypeLabel(record.type)}</span>
                          <StatusTag value={getAfterSalesStatusLabel(record.status)} />
                        </div>
                        <div className="text-caption">{record.createdAt || '未记录时间'} · {record.note || '—'}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="暂无售后记录" description="当前商品行还没有关联售后记录。" />
                )}
              </div>
            </div>
          </DetailSection>

          <DetailSection title="购买记录入口">
            <InfoGrid columns={2}>
              <InfoField label="所属购买记录编号" value={purchase?.purchaseNo || '—'} />
              <InfoField
                label="查看购买记录"
                value={
                  purchase ? (
                    <Link to={`/purchases/${purchase.id}`} className="button secondary small">
                      打开购买记录
                    </Link>
                  ) : (
                    '—'
                  )
                }
              />
            </InfoGrid>
          </DetailSection>
          <SourceProductDrawer
            open={sourceProductOpen}
            product={sourceProduct}
            compareValue={sourceProductCompareValue}
            onClose={() => setSourceProductOpen(false)}
          />
        </div>
      )}
    </SideDrawer>
  )
}

export const useOrderLineCenterRows = (filters: OrderLineCenterFilters) => {
  const rows = useMemo(buildRows, [])

  return useMemo(
    () =>
      rows.filter(({ line, purchase }) => {
        const customer = customersMock.find((item) => item.id === line.customerId || item.id === purchase?.customerId)
        const keyword = filters.keyword.trim().toLowerCase()
        const matchesKeyword =
          keyword.length === 0 ||
          [
            line.lineCode,
            line.id,
            line.name,
            line.sourceProduct?.sourceProductName,
            customer?.name,
            customer?.phone,
            purchase?.purchaseNo,
            purchase?.platformOrderNo
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(keyword)
        const matchesStatus = filters.status === 'all' || line.status === filters.status
        const matchesOwner = filters.owner.trim().length === 0 || (line.currentOwner || purchase?.ownerName || '').includes(filters.owner.trim())

        return matchesKeyword && matchesStatus && matchesOwner
      }),
    [filters, rows]
  )
}

export const useAllOrderLineCenterRows = () => useMemo(buildRows, [])
