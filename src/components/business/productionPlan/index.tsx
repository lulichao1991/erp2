import { Link } from 'react-router-dom'
import { PageHeader, RiskTag, SectionCard, StatusTag } from '@/components/common'
import type { ProductionPlanRow, ProductionPlanStage } from '@/types/productionPlan'

export type ProductionPlanFilterValue = {
  keyword: string
  stage: 'all' | ProductionPlanStage
  urgent: 'all' | 'yes' | 'no'
  material: string
  category: string
}

const getUniqueValues = (values: Array<string | undefined>) =>
  Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean))) as string[]

export const ProductionPlanStatusBadge = ({ stage }: { stage: ProductionPlanStage }) =>
  stage === 'issue' ? <RiskTag value="异常" /> : <StatusTag value={getProductionPlanStageLabel(stage)} />

export const getProductionPlanStageLabel = (stage: ProductionPlanStage) => {
  switch (stage) {
    case 'pending_receive':
      return '待接收'
    case 'ready_to_produce':
      return '待生产'
    case 'in_production':
      return '生产中'
    case 'pending_report':
      return '待回传'
    case 'reported':
      return '已回传'
    case 'issue':
      return '异常'
    default:
      return stage
  }
}

export const ProductionPlanListHeader = () => (
  <PageHeader
    title="工厂生产计划"
    className="compact-page-header"
    actions={
      <Link to="/tasks" className="button secondary">
        返回任务中心
      </Link>
    }
  />
)

export const ProductionPlanQuickStats = ({ rows }: { rows: ProductionPlanRow[] }) => {
  const stats = [
    { label: '全部任务', value: rows.length, tone: 'neutral' },
    { label: '待接收', value: rows.filter((item) => item.stage === 'pending_receive').length, tone: 'pending' },
    { label: '待生产', value: rows.filter((item) => item.stage === 'ready_to_produce').length, tone: 'ready' },
    { label: '生产中', value: rows.filter((item) => item.stage === 'in_production').length, tone: 'active' },
    { label: '待回传', value: rows.filter((item) => item.stage === 'pending_report').length, tone: 'review' },
    { label: '异常', value: rows.filter((item) => item.stage === 'issue').length, tone: 'issue' }
  ]

  return (
    <div className="stats-grid compact-stats production-plan-stats">
      {stats.map((item) => (
        <div key={item.label} className={`stat-card compact-stat production-plan-stat-card ${item.tone}`}>
          <div className="stat-card-label">{item.label}</div>
          <div className="stat-card-value">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

export const ProductionPlanSummaryCard = ({
  row,
  taskId,
  taskTitle,
  orderItemName,
  sourceProductName,
  sourceProductId,
  factoryStatus
}: {
  row: ProductionPlanRow
  taskId: string
  taskTitle: string
  orderItemName: string
  sourceProductName: string
  sourceProductId: string
  factoryStatus?: string
}) => {
  const topMetaFields = [
    { label: '任务编号', value: taskId },
    { label: '来源版本', value: row.sourceProductVersion },
    { label: '当前责任人', value: row.assigneeName || '待分配' },
    { label: '下发时间', value: row.assignedAt },
    { label: '计划交期', value: row.plannedDueDate || '未设置' },
    { label: '工厂状态', value: factoryStatus || '待回传' }
  ]
  const specSummary = [row.specValue, row.material, row.process].filter(Boolean).join(' / ') || '待补充'

  return (
    <section className="summary-card production-plan-summary-card">
      <div className="production-plan-summary-top">
        <div className="production-plan-summary-hero">
          <div className="production-plan-summary-heading">
            <div className="production-plan-summary-kicker">生产货号</div>
            <h2 className="production-plan-summary-code">{row.goodsNo}</h2>
            <p className="text-muted production-plan-summary-subtitle">{taskTitle}</p>
          </div>
          <div className="row wrap production-plan-summary-badges">
            <ProductionPlanStatusBadge stage={row.stage} />
            {row.isUrgent ? <RiskTag value="加急" /> : null}
          </div>
        </div>
        <div className="production-plan-summary-meta">
          <div className="production-plan-summary-meta-grid">
            {topMetaFields.map((field) => (
              <div key={field.label} className="production-plan-summary-meta-item">
                <span className="order-summary-metric-label">{field.label}</span>
                <strong className="order-summary-inline-value">{field.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="production-plan-trace-card">
        <div className="production-plan-trace-header">
          <span className="order-summary-metric-label">来源追溯</span>
        </div>
        <ul className="production-plan-trace-grid">
          <li className="production-plan-trace-item">
            <span className="production-plan-trace-label">关联订单</span>
            <strong className="production-plan-trace-value">
              <Link to={`/orders/${row.orderId}`}>{row.orderNo}</Link>
            </strong>
          </li>
          <li className="production-plan-trace-item">
            <span className="production-plan-trace-label">订单商品</span>
            <strong className="production-plan-trace-value">{orderItemName}</strong>
          </li>
          <li className="production-plan-trace-item">
            <span className="production-plan-trace-label">来源产品</span>
            <strong className="production-plan-trace-value">
              <Link to={`/products/${sourceProductId}`}>{sourceProductName}</Link>
            </strong>
          </li>
          <li className="production-plan-trace-item">
            <span className="production-plan-trace-label">规格 / 材质 / 工艺</span>
            <strong className="production-plan-trace-value">{specSummary}</strong>
          </li>
        </ul>
      </div>
    </section>
  )
}

export const ProductionPlanFilterBar = ({
  rows,
  value,
  onChange
}: {
  rows: ProductionPlanRow[]
  value: ProductionPlanFilterValue
  onChange: (next: ProductionPlanFilterValue) => void
}) => {
  const materialOptions = getUniqueValues(rows.map((item) => item.material))
  const categoryOptions = getUniqueValues(rows.map((item) => item.categoryLabel))

  return (
    <SectionCard title="搜索与筛选" className="compact-card production-plan-filter-card">
      <div className="field-grid four production-plan-filter-grid">
        <div className="field-control production-plan-filter-keyword">
          <label className="field-label">搜索货号 / 款式 / 版本 / 印记</label>
          <input className="input" value={value.keyword} onChange={(event) => onChange({ ...value, keyword: event.target.value })} />
        </div>
        <div className="field-control">
          <label className="field-label">当前状态</label>
          <select className="select" value={value.stage} onChange={(event) => onChange({ ...value, stage: event.target.value as ProductionPlanFilterValue['stage'] })}>
            <option value="all">全部状态</option>
            <option value="pending_receive">待接收</option>
            <option value="ready_to_produce">待生产</option>
            <option value="in_production">生产中</option>
            <option value="pending_report">待回传</option>
            <option value="reported">已回传</option>
            <option value="issue">异常</option>
          </select>
        </div>
        <div className="field-control">
          <label className="field-label">是否加急</label>
          <select className="select" value={value.urgent} onChange={(event) => onChange({ ...value, urgent: event.target.value as ProductionPlanFilterValue['urgent'] })}>
            <option value="all">全部</option>
            <option value="yes">仅加急</option>
            <option value="no">非加急</option>
          </select>
        </div>
        <div className="field-control">
          <label className="field-label">材质</label>
          <select className="select" value={value.material} onChange={(event) => onChange({ ...value, material: event.target.value })}>
            <option value="">全部材质</option>
            {materialOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="field-control">
          <label className="field-label">品类</label>
          <select className="select" value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value })}>
            <option value="">全部品类</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </SectionCard>
  )
}

export const ProductionPlanTable = ({ rows }: { rows: ProductionPlanRow[] }) => (
  <div className="table-shell production-plan-table-shell">
    <table className="table production-plan-table">
      <thead>
        <tr>
          <th>货号</th>
          <th>款式名称</th>
          <th>来源版本</th>
          <th>品类</th>
          <th>规格</th>
          <th>材质 / 工艺</th>
          <th>数量</th>
          <th>是否加急</th>
          <th>下发时间</th>
          <th>计划交期</th>
          <th>当前状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.taskId}>
            <td>
              <div className="production-plan-table-primary">
                <Link to={`/production-plan/${row.taskId}`} className="production-plan-table-link">
                  {row.goodsNo}
                </Link>
                <span className="text-caption">{row.orderNo}</span>
              </div>
            </td>
            <td>
              <div className="production-plan-table-primary">
                <strong>{row.styleName}</strong>
                <span className="text-caption">{row.sourceProductCode}</span>
              </div>
            </td>
            <td>
              <span className="tag version">{row.sourceProductVersion}</span>
            </td>
            <td>{row.categoryLabel}</td>
            <td>{row.specValue || '未选规格'}</td>
            <td>{[row.material, row.process].filter(Boolean).join(' / ') || '待补充'}</td>
            <td>{row.quantity}</td>
            <td>{row.isUrgent ? <RiskTag value="加急" /> : <span className="text-muted">否</span>}</td>
            <td>{row.assignedAt}</td>
            <td>{row.plannedDueDate || '未设置'}</td>
            <td>
              <ProductionPlanStatusBadge stage={row.stage} />
            </td>
            <td>
              <div className="row wrap">
                <Link to={`/production-plan/${row.taskId}`} className="button ghost small">
                  查看详情
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
