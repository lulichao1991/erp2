import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer, PageHeader, StatusTag, SummaryCard } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { getOrderLineLineStatus } from '@/services/orderLine/orderLineWorkflow'
import { getTaskStatusLabel, getTaskTypeLabel } from '@/services/workflow/workflowMeta'
import type { Task } from '@/types/task'

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

const getTaskPurchaseNo = (task: Task) => task.purchaseNo || task.transactionNo || '未关联购买记录'

export const DashboardPage = () => {
  const { orderLines, products, purchases, tasks } = useAppData()

  const openTasks = useMemo(() => tasks.filter((item) => !['done', 'closed'].includes(item.status)), [tasks])
  const recentTasks = useMemo(() => [...tasks].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 3), [tasks])
  const pendingConfirmLineCount = useMemo(() => orderLines.filter((item) => getOrderLineLineStatus(item) === 'pending_customer_confirmation').length, [orderLines])
  const pendingDesignLineCount = useMemo(() => orderLines.filter((item) => getOrderLineLineStatus(item) === 'pending_design').length, [orderLines])

  return (
    <PageContainer>
      <PageHeader title="协同概览" className="compact-page-header" />
      <div className="hero-placeholder">
        <h2>产品管理 → 商品行中心 → 任务中心</h2>
        <p>从工作台可以快速进入三个主模块，演示从产品标准模板到购买记录与商品行协同，再到任务推进的完整骨架。</p>
        <div className="row wrap" style={{ justifyContent: 'center', marginTop: 20 }}>
          <Link to="/products" className="button primary">
            进入产品管理
          </Link>
          <Link to="/order-lines" className="button secondary">
            进入商品行中心
          </Link>
          <Link to="/tasks" className="button secondary">
            进入任务中心
          </Link>
        </div>
      </div>
      <div className="stack spacer-top">
        <SummaryCard title="当前交付重点">
          <div className="summary-grid three">
            <div>
              <div className="text-caption">产品中心</div>
              <div className="quote-value">{products.length} 个模板</div>
              <div className="text-muted">持续维护规格明细、价格规则和标准档案。</div>
            </div>
            <div>
              <div className="text-caption">商品行中心</div>
              <div className="quote-value">{orderLines.length} 条商品行</div>
              <div className="text-muted">当前待确认 {pendingConfirmLineCount} 条商品行，待设计 {pendingDesignLineCount} 条商品行；购买记录 {purchases.length} 笔。</div>
            </div>
            <div>
              <div className="text-caption">任务中心</div>
              <div className="quote-value">{openTasks.length} 个待推进任务</div>
              <div className="text-muted">承接购买处理、设计建模、生产准备和售后处理。</div>
            </div>
          </div>
        </SummaryCard>
        <SummaryCard title="最近推进事项">
          <div className="stack">
            {recentTasks.map((task) => (
              <div key={task.id} className="subtle-panel">
                <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                  <div className="stack" style={{ gap: 6 }}>
                    <strong>{task.title}</strong>
                    <div className="text-caption">
                      {getTaskPurchaseNo(task)} · {task.type === 'order_process' ? '购买处理' : getTaskTypeLabel(task.type)} · {task.assigneeName || '待分配'}
                    </div>
                  </div>
                  <div className="row wrap">
                    <StatusTag value={getTaskStatusLabel(task.status)} />
                    <Link to={`/tasks/${task.id}`} className="button ghost small">
                      查看任务
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {recentTasks.length === 0 ? <div className="text-muted">当前还没有任务记录。</div> : null}
          </div>
        </SummaryCard>
        <SummaryCard title="购买记录概览">
          <div className="summary-grid three">
            {purchases.slice(0, 3).map((purchase) => (
              <div key={purchase.id} className="subtle-panel">
                <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                  <strong>{purchase.purchaseNo}</strong>
                  <StatusTag value={getPurchaseAggregateStatusLabel(purchase.aggregateStatus)} />
                </div>
                <div className="spacer-top text-caption">{purchase.recipientName || '未维护收件人'}</div>
                <div className="spacer-top text-muted">商品行：{orderLines.filter((line) => line.purchaseId === purchase.id || line.transactionId === purchase.id).length} 条</div>
                <div className="spacer-top text-muted">最近活动：{purchase.latestActivityAt || '—'}</div>
                <div className="spacer-top">
                  <Link to={`/purchases/${purchase.id}`} className="button ghost small">
                    查看购买记录
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </SummaryCard>
      </div>
    </PageContainer>
  )
}
