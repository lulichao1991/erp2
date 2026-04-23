import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageContainer, PageHeader, StatusTag, SummaryCard } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { getOrderStatusLabel, getTaskStatusLabel, getTaskTypeLabel } from '@/services/workflow/workflowMeta'

export const DashboardPage = () => {
  const { orders, products, tasks } = useAppData()

  const openTasks = useMemo(() => tasks.filter((item) => !['done', 'closed'].includes(item.status)), [tasks])
  const recentTasks = useMemo(() => [...tasks].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 3), [tasks])

  return (
    <PageContainer>
      <PageHeader title="协同概览" className="compact-page-header" />
      <div className="hero-placeholder">
        <h2>产品中心 → 订单中心 → 任务中心</h2>
        <p>从工作台可以快速进入三个主模块，演示从产品标准模板到订单协同，再到任务推进的完整骨架。</p>
        <div className="row wrap" style={{ justifyContent: 'center', marginTop: 20 }}>
          <Link to="/products" className="button primary">
            进入产品管理
          </Link>
          <Link to="/orders" className="button secondary">
            进入订单中心
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
              <div className="text-caption">订单中心</div>
              <div className="quote-value">{orders.length} 个订单</div>
              <div className="text-muted">当前待确认 {orders.filter((item) => item.status === 'pending_confirm').length} 单，待设计 {orders.filter((item) => item.status === 'pending_design').length} 单。</div>
            </div>
            <div>
              <div className="text-caption">任务中心</div>
              <div className="quote-value">{openTasks.length} 个待推进任务</div>
              <div className="text-muted">承接订单处理、设计建模、生产准备和售后处理。</div>
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
                      {task.orderNo} · {getTaskTypeLabel(task.type)} · {task.assigneeName || '待分配'}
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
        <SummaryCard title="订单阶段概览">
          <div className="summary-grid three">
            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="subtle-panel">
                <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                  <strong>{order.orderNo}</strong>
                  <StatusTag value={getOrderStatusLabel(order.status)} />
                </div>
                <div className="spacer-top text-caption">{order.customerName || '未维护客户姓名'}</div>
                <div className="spacer-top text-muted">最近活动：{order.latestActivityAt || '—'}</div>
                <div className="spacer-top">
                  <Link to={`/orders/${order.id}`} className="button ghost small">
                    查看订单
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
