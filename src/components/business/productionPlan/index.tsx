import { Link } from 'react-router-dom'
import { FileList, InfoField, PageHeader, RiskTag, SectionCard, StatusTag } from '@/components/common'
import type { OrderLineProductionStatus } from '@/types/order-line'
import type { ProductSpecRow } from '@/types/product'
import type { ProductionPlanRow, ProductionPlanStage } from '@/types/productionPlan'

type ProductionPlanUploadedFile = {
  id: string
  name: string
  url: string
}

export type ProductionOrderLineInfo = {
  id: string
  goodsNo?: string
  sourceProductCode?: string
  selectedSpecValue?: string
  quantity?: number
  selectedMaterial?: string
  selectedProcess?: string
  selectedSpecialOptions?: string[]
  selectedSpecSnapshot?: ProductSpecRow
  actualRequirements?: {
    material?: string
    process?: string
    sizeNote?: string
    engraveText?: string
    specialNotes?: string[]
    remark?: string
    engraveImageFiles?: ProductionPlanUploadedFile[]
    engravePltFiles?: ProductionPlanUploadedFile[]
  }
}

export type ProductionFeedbackValue = {
  factoryStatus?: OrderLineProductionStatus | string
  returnedWeight?: string
  qualityResult?: string
  factoryNote?: string
}

export type ProductionPlanFilterValue = {
  keyword: string
  stage: 'all' | ProductionPlanStage
  urgent: 'all' | 'yes' | 'no'
  material: string
  category: string
}

const getUniqueValues = (values: Array<string | undefined>) =>
  Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean))) as string[]

const productionFeedbackStatusOptions: Array<{ value: OrderLineProductionStatus; label: string }> = [
  { value: 'not_started', label: '未开始' },
  { value: 'in_progress', label: '生产中' },
  { value: 'pending_feedback', label: '待回传' },
  { value: 'completed', label: '已回传' },
  { value: 'issue', label: '异常' }
]

const legacyProductionFeedbackStatusMap: Record<string, OrderLineProductionStatus> = {
  待回传: 'pending_feedback',
  生产中: 'in_progress',
  已回传: 'completed',
  有异常: 'issue'
}

export const normalizeProductionFeedbackStatus = (status?: string): OrderLineProductionStatus | undefined => {
  if (!status) {
    return undefined
  }

  return legacyProductionFeedbackStatusMap[status] || (productionFeedbackStatusOptions.some((option) => option.value === status) ? (status as OrderLineProductionStatus) : undefined)
}

export const getProductionFeedbackStatusLabel = (status?: string) => {
  const normalizedStatus = normalizeProductionFeedbackStatus(status)
  return productionFeedbackStatusOptions.find((option) => option.value === normalizedStatus)?.label || status || '待回传'
}

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
  sourceProductName,
  sourceProductId,
  factoryStatus
}: {
  row: ProductionPlanRow
  taskId: string
  taskTitle: string
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
    { label: '工厂状态', value: getProductionFeedbackStatusLabel(factoryStatus) }
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
            <span className="production-plan-trace-label">关联商品行</span>
            <strong className="production-plan-trace-value">
              <Link to="/order-lines">{row.orderLineName || row.styleName}</Link>
            </strong>
            <span className="text-caption">{row.orderLineCode}</span>
          </li>
          <li className="production-plan-trace-item">
            <span className="production-plan-trace-label">购买记录</span>
            <strong className="production-plan-trace-value">
              {row.purchaseId ? <Link to={`/purchases/${row.purchaseId}`}>{row.purchaseNo}</Link> : row.purchaseNo}
            </strong>
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

export const ProductionOrderLineInfoBlock = ({
  line,
  showEngravingFiles = true
}: {
  line: ProductionOrderLineInfo
  showEngravingFiles?: boolean
}) => {
  const engraveImageFiles = line.actualRequirements?.engraveImageFiles ?? []
  const engravePltFiles = line.actualRequirements?.engravePltFiles ?? []
  const engravingSelected =
    line.selectedSpecialOptions?.includes('刻字') ||
    Boolean(line.actualRequirements?.engraveText) ||
    engraveImageFiles.length > 0 ||
    engravePltFiles.length > 0

  return (
    <div className="stack">
      <div className="field-grid four">
        <InfoField label="货号" value={line.goodsNo || '待维护'} />
        <InfoField label="来源产品编码" value={line.sourceProductCode || '待引用模板'} />
        <InfoField label="规格" value={line.selectedSpecValue || '未选规格'} />
        <InfoField label="数量" value={`${line.quantity || 1} 件`} />
      </div>
      <div className="field-grid three">
        <InfoField label="材质" value={line.selectedMaterial || line.actualRequirements?.material || '未设置'} />
        <InfoField label="工艺" value={line.selectedProcess || line.actualRequirements?.process || '未设置'} />
        <InfoField label="特殊需求" value={line.selectedSpecialOptions?.join(' / ') || line.actualRequirements?.specialNotes?.join(' / ') || '无'} />
      </div>
      {line.selectedSpecSnapshot ? (
        <div className="subtle-panel">
          <strong>生产参数</strong>
          <div className="field-grid four spacer-top">
            {line.selectedSpecSnapshot.sizeFields.map((field) => (
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
            <InfoField label="参考重量" value={line.selectedSpecSnapshot.referenceWeight ? `${line.selectedSpecSnapshot.referenceWeight} g` : '—'} />
          </div>
        </div>
      ) : (
        <div className="placeholder-block">当前还没有规格参数，请上游先确认来源模板与规格。</div>
      )}
      {engravingSelected ? (
        <div className="subtle-panel stack">
          <strong>刻字生产信息</strong>
          <div className="field-grid two">
            <InfoField label="刻字内容" value={line.actualRequirements?.engraveText || '待客服补充'} />
            <InfoField label="刻字文件数量" value={`图片 ${engraveImageFiles.length} 个 / PLT ${engravePltFiles.length} 个`} />
          </div>
          {showEngravingFiles ? (
            <>
              {engraveImageFiles.length > 0 ? <FileList title="刻字图片文件" files={engraveImageFiles} /> : <div className="text-muted">暂无刻字图片文件。</div>}
              {engravePltFiles.length > 0 ? <FileList title="刻字PLT文件" files={engravePltFiles} /> : <div className="text-muted">暂无刻字PLT文件。</div>}
            </>
          ) : (
            <div className="text-muted">刻字文件已收敛到下方“文件与刻字资料区”统一查看。</div>
          )}
        </div>
      ) : null}
      <div className="field-grid two">
        <InfoField label="尺寸/规格备注" value={line.actualRequirements?.sizeNote || '—'} />
        <InfoField label="生产备注" value={line.actualRequirements?.remark || '—'} />
      </div>
    </div>
  )
}

export const ProductionFeedbackBlock = ({
  orderLineId,
  feedback,
  onChange
}: {
  orderLineId: string
  feedback?: ProductionFeedbackValue
  onChange: (next: ProductionFeedbackValue) => void
}) => {
  const idPrefix = `production-feedback-${orderLineId}`

  return (
    <>
      <div className="field-grid three">
        <div className="field-control">
          <label className="field-label" htmlFor={`${idPrefix}-status`}>
            工厂状态
          </label>
          <select
            id={`${idPrefix}-status`}
            className="select"
            value={normalizeProductionFeedbackStatus(feedback?.factoryStatus) || 'pending_feedback'}
            onChange={(event) =>
              onChange({
                ...feedback,
                factoryStatus: event.target.value as OrderLineProductionStatus
              })
            }
          >
            {productionFeedbackStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-control">
          <label className="field-label" htmlFor={`${idPrefix}-weight`}>
            回传重量
          </label>
          <input
            id={`${idPrefix}-weight`}
            className="input"
            value={feedback?.returnedWeight || ''}
            onChange={(event) =>
              onChange({
                ...feedback,
                returnedWeight: event.target.value
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
            value={feedback?.qualityResult || ''}
            onChange={(event) =>
              onChange({
                ...feedback,
                qualityResult: event.target.value
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
            value={feedback?.factoryNote || ''}
            onChange={(event) =>
              onChange({
                ...feedback,
                factoryNote: event.target.value
              })
            }
          />
        </div>
      </div>
    </>
  )
}

export const ProductionPlanTable = ({ rows }: { rows: ProductionPlanRow[] }) => (
  <div className="table-shell production-plan-table-shell">
    <table className="table production-plan-table">
      <thead>
        <tr>
          <th>货号</th>
          <th>商品行</th>
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
                <span className="text-caption">购买记录 {row.purchaseNo}</span>
              </div>
            </td>
            <td>
              <div className="production-plan-table-primary">
                <Link to="/order-lines" className="production-plan-table-link">
                  {row.orderLineName || row.styleName}
                </Link>
                <span className="text-caption">{row.orderLineCode}</span>
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
                <Link to="/order-lines" className="button ghost small">
                  查看商品行
                </Link>
                {row.purchaseId ? (
                  <Link to={`/purchases/${row.purchaseId}`} className="button ghost small">
                    查看购买记录
                  </Link>
                ) : null}
                <Link to={`/production-plan/${row.taskId}`} className="button ghost small">
                  生产详情
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
