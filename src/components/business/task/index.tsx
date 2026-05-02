import { Link } from 'react-router-dom'
import { InfoField, InfoGrid, PageHeader, RiskTag, SectionCard, StatusTag, SummaryCard } from '@/components/common'
import {
  getTaskAssigneeRoleLabel,
  getTaskPriorityLabel,
  getTaskStatusLabel,
  getTaskTypeLabel
} from '@/services/workflow/workflowMeta'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { getOrderLineTaskGroups } from '@/services/orderLine/orderLineWorkflow'
import { getTaskPurchaseId, getTaskPurchaseNo } from '@/services/task/taskIdentity'
import type { OrderLine } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'
import type { Task, TaskStatus, TaskType } from '@/types/task'

export const TaskListHeader = () => (
  <PageHeader
    title="任务中心"
    className="compact-page-header"
    actions={
      <Link to="/order-lines" className="button secondary">
        返回销售中心
      </Link>
    }
  />
)

export const TaskQuickStats = ({ tasks, orderLines = [] }: { tasks: Task[]; orderLines?: OrderLine[] }) => {
  const stats = [
    { label: '全部任务', value: tasks.length },
    { label: '待处理', value: tasks.filter((item) => item.status === 'todo').length },
    { label: '进行中', value: tasks.filter((item) => item.status === 'in_progress').length },
    { label: '待确认', value: tasks.filter((item) => item.status === 'pending_confirm').length },
    { label: '已完成', value: tasks.filter((item) => item.status === 'done').length },
    { label: '已逾期', value: tasks.filter((item) => item.status === 'overdue').length }
  ]

  return (
    <div className="stack">
      <div className="stats-grid compact-stats">
        {stats.map((item) => (
          <div key={item.label} className="stat-card compact-stat">
            <div className="stat-card-label">{item.label}</div>
            <div className="stat-card-value">{item.value}</div>
          </div>
        ))}
      </div>
      <SectionCard title="销售任务分组" description="按 OrderLine 状态生成任务分组，供后续客服、设计、跟单、工厂和财务视图复用。" className="compact-card">
        <div className="stats-grid compact-stats">
          {getOrderLineTaskGroups(orderLines).map((item) => (
            <div key={item.value} className="stat-card compact-stat">
              <div className="stat-card-label">{item.label}</div>
              <div className="stat-card-value">{item.count}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

type TaskFilterValue = {
  keyword: string
  type: 'all' | TaskType
  status: 'all' | TaskStatus
  assignee: string
}

const getCurrentTaskTypeLabel = (type: TaskType) => (type === 'order_process' ? '购买处理' : getTaskTypeLabel(type))

const getTaskOrderLineLabel = (task: Task) =>
  task.orderLineName || '购买记录级任务'

const purchaseAggregateStatusLabelMap: Record<string, string> = {
  draft: '草稿',
  in_progress: '进行中',
  partially_shipped: '部分发货',
  completed: '已完成',
  after_sales: '售后中',
  exception: '异常',
  cancelled: '已取消'
}

const getPurchaseAggregateStatusLabel = (status?: string) => (status ? purchaseAggregateStatusLabelMap[status] || status : '—')

const getOrderLineDisplayLabel = (task: Task, orderLine?: OrderLine) =>
  [orderLine ? getOrderLineGoodsNo(orderLine) : undefined, orderLine?.name || task.orderLineName].filter(Boolean).join(' · ') || '购买记录级任务'

const renderTaskPurchaseLink = (task: Task) => {
  const purchaseId = getTaskPurchaseId(task)
  const purchaseNo = getTaskPurchaseNo(task)

  return purchaseId ? <Link to={`/purchases/${purchaseId}`}>{purchaseNo}</Link> : purchaseNo
}

export const TaskFilterBar = ({
  value,
  onChange
}: {
  value: TaskFilterValue
  onChange: (next: TaskFilterValue) => void
}) => (
  <SectionCard title="搜索与筛选" className="compact-card">
    <div className="field-grid four">
      <div className="field-control">
        <label className="field-label">搜索任务 / 购买记录号</label>
        <input className="input" value={value.keyword} onChange={(event) => onChange({ ...value, keyword: event.target.value })} />
      </div>
      <div className="field-control">
        <label className="field-label">任务类型</label>
        <select className="select" value={value.type} onChange={(event) => onChange({ ...value, type: event.target.value as TaskFilterValue['type'] })}>
          <option value="all">全部类型</option>
          <option value="order_process">购买处理</option>
          <option value="design_modeling">设计建模</option>
          <option value="production_prep">生产准备</option>
          <option value="factory_production">工厂生产</option>
          <option value="after_sales">售后处理</option>
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">任务状态</label>
        <select className="select" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value as TaskFilterValue['status'] })}>
          <option value="all">全部状态</option>
          <option value="todo">待处理</option>
          <option value="in_progress">进行中</option>
          <option value="pending_confirm">待确认</option>
          <option value="done">已完成</option>
          <option value="closed">已关闭</option>
          <option value="overdue">已逾期</option>
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">当前责任人</label>
        <input className="input" value={value.assignee} onChange={(event) => onChange({ ...value, assignee: event.target.value })} placeholder="例如：张晨" />
      </div>
    </div>
  </SectionCard>
)

export const TaskTable = ({ tasks, orderLines = [] }: { tasks: Task[]; orderLines?: OrderLine[] }) => (
  <div className="table-shell">
    <table className="table">
      <thead>
        <tr>
          <th>优先级</th>
          <th>任务标题</th>
          <th>任务类型</th>
          <th>关联销售</th>
          <th>责任人</th>
          <th>截止时间</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => {
          const orderLine = orderLines.find((item) => item.id === task.orderLineId)
          const orderLineLabel = getOrderLineDisplayLabel(task, orderLine)

          return (
            <tr key={task.id}>
              <td>{task.priority === 'normal' ? <span className="text-muted">普通</span> : <RiskTag value={getTaskPriorityLabel(task.priority)} />}</td>
              <td>
                <div className="stack" style={{ gap: 6 }}>
                  <Link to={`/tasks/${task.id}`} className="text-price">
                    {task.title}
                  </Link>
                  <span className="text-caption">{orderLineLabel}</span>
                </div>
              </td>
              <td>{getCurrentTaskTypeLabel(task.type)}</td>
              <td>
                <div className="stack" style={{ gap: 6 }}>
                  <Link to="/order-lines">{orderLineLabel}</Link>
                  <span className="text-caption">{renderTaskPurchaseLink(task)}</span>
                </div>
              </td>
              <td>
                <div>{task.assigneeName || '待分配'}</div>
                <div className="text-caption">{getTaskAssigneeRoleLabel(task.assigneeRole)}</div>
              </td>
              <td>{task.dueAt || '未设置'}</td>
              <td>
                <StatusTag value={getTaskStatusLabel(task.status)} />
              </td>
              <td>
                <div className="row wrap">
                  <Link to={`/tasks/${task.id}`} className="button ghost small">
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

export const TaskSummaryCard = ({ task }: { task: Task }) => (
  <SummaryCard title="顶部任务概览">
    <div className="summary-grid three">
      <div className="stack">
        <div>
          <h2 style={{ margin: 0 }}>{task.title}</h2>
          <p className="text-muted">
            {getCurrentTaskTypeLabel(task.type)} · {getTaskPurchaseNo(task)}
          </p>
        </div>
        <div className="row wrap">
          <StatusTag value={getTaskStatusLabel(task.status)} />
          {task.priority === 'normal' ? <StatusTag value={getTaskPriorityLabel(task.priority)} /> : <RiskTag value={getTaskPriorityLabel(task.priority)} />}
        </div>
      </div>
      <InfoGrid columns={3}>
        <InfoField label="责任角色" value={getTaskAssigneeRoleLabel(task.assigneeRole)} />
        <InfoField label="责任人" value={task.assigneeName || '待分配'} />
        <InfoField label="截止时间" value={task.dueAt || '未设置'} />
      </InfoGrid>
      <InfoGrid columns={3}>
        <InfoField label="创建时间" value={task.createdAt} />
        <InfoField label="最近更新" value={task.updatedAt} />
        <InfoField label="完成时间" value={task.completedAt || '—'} />
      </InfoGrid>
    </div>
  </SummaryCard>
)

export const TaskInfoCardGroup = ({
  task,
  purchase,
  orderLine,
  hideCommercialInfo = false
}: {
  task: Task
  purchase?: Purchase
  orderLine?: OrderLine
  hideCommercialInfo?: boolean
}) => (
  <div className="field-grid three">
    <SummaryCard title="任务信息">
      <InfoGrid columns={2}>
        <InfoField label="任务类型" value={getCurrentTaskTypeLabel(task.type)} />
        <InfoField label="当前状态" value={getTaskStatusLabel(task.status)} />
        <InfoField label="优先级" value={getTaskPriorityLabel(task.priority)} />
        <InfoField label="责任角色" value={getTaskAssigneeRoleLabel(task.assigneeRole)} />
        <InfoField label="责任人" value={task.assigneeName || '待分配'} />
        <InfoField label="截止时间" value={task.dueAt || '未设置'} />
      </InfoGrid>
    </SummaryCard>
    <SummaryCard title="关联购买记录">
      <InfoGrid columns={2}>
        <InfoField label="购买记录编号" value={renderTaskPurchaseLink(task)} />
        <InfoField label="购买记录阶段" value={getPurchaseAggregateStatusLabel(purchase?.aggregateStatus)} />
        <InfoField label="购买记录负责人" value={purchase?.ownerName || '—'} />
        <InfoField label="关联销售" value={getOrderLineDisplayLabel(task, orderLine)} />
        {!hideCommercialInfo ? <InfoField label="收件人" value={purchase?.recipientName || '—'} /> : null}
        <InfoField label="风险标签" value={purchase?.riskTags.join(' / ') || '—'} />
      </InfoGrid>
    </SummaryCard>
    <SummaryCard title="处理说明">
      <InfoGrid columns={2}>
        <InfoField label="任务描述" value={task.description || '—'} />
        <InfoField label="跟进备注" value={task.remark || '—'} />
        <InfoField label="创建人" value={task.createdBy} />
        <InfoField label="最近更新人" value={task.updatedBy} />
      </InfoGrid>
    </SummaryCard>
  </div>
)
