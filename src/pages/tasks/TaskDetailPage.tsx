import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppBreadcrumb } from '@/app/layout/AppBreadcrumb'
import { TaskInfoCardGroup, TaskSummaryCard } from '@/components/business/task'
import { EmptyState, PageContainer, PageHeader, SectionCard } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { getAllowedNextStatuses, getOrderStatusLabel } from '@/services/workflow/workflowMeta'
import type { TaskStatus } from '@/types/task'

const toDateTimeInputValue = (value?: string) => (value ? value.replace(' ', 'T').slice(0, 16) : '')
const fromDateTimeInputValue = (value: string) => (value ? value.replace('T', ' ') : '')

export const TaskDetailPage = () => {
  const navigate = useNavigate()
  const { taskId } = useParams()
  const appData = useAppData()
  const currentRole = appData.currentUserRole
  const hideCommercialInfo = currentRole === 'factory'
  const task = appData.getTask(taskId)
  const order = appData.getOrder(task?.orderId)
  const [form, setForm] = useState(() =>
    task
      ? {
          assigneeName: task.assigneeName,
          dueAt: task.dueAt || '',
          description: task.description || '',
          remark: task.remark || ''
        }
      : {
          assigneeName: '',
          dueAt: '',
          description: '',
          remark: ''
        }
  )

  const orderTimeline = useMemo(
    () => (order?.timeline ?? []).filter((record) => record.relatedTaskId === task?.id).sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [order?.timeline, task?.id]
  )
  const orderNextStatuses = order ? getAllowedNextStatuses(order.status) : []

  if (!task) {
    return (
      <PageContainer>
        <EmptyState title="未找到任务" description="当前任务不存在，可能是链接失效或 mock 数据尚未包含该任务。" />
      </PageContainer>
    )
  }

  const handleSave = () => {
    appData.updateTask(task.id, (current) => ({
      ...current,
      assigneeName: form.assigneeName,
      dueAt: form.dueAt,
      description: form.description,
      remark: form.remark
    }))
  }

  const handleStatusChange = (status: TaskStatus) => {
    appData.updateTask(task.id, (current) => ({
      ...current,
      assigneeName: form.assigneeName,
      dueAt: form.dueAt,
      description: form.description,
      remark: form.remark,
      status
    }))
  }

  return (
    <PageContainer>
      <AppBreadcrumb items={[{ label: '任务中心', to: '/tasks' }, { label: '任务详情' }, { label: task.title }]} />
      <PageHeader
        title="任务详情"
        actions={
          <>
            <button className="button secondary" onClick={() => navigate('/tasks')}>
              返回列表
            </button>
            {order ? (
              <button className="button secondary" onClick={() => navigate('/order-lines')}>
                查看商品行
              </button>
            ) : null}
            <button className="button primary" onClick={handleSave}>
              保存任务
            </button>
          </>
        }
      />
      <div className="stack">
        <TaskSummaryCard task={task} />
        <TaskInfoCardGroup task={task} order={order} hideCommercialInfo={hideCommercialInfo} />
        <SectionCard
          title="任务处理区"
          description="当前先支持责任人、截止时间、描述备注和基础状态流转，后续再补审批和权限。"
        >
          <div className="stack">
            <div className="field-grid two">
              <div className="field-control">
                <label className="field-label" htmlFor="task-assignee-name">
                  责任人
                </label>
                <input
                  id="task-assignee-name"
                  className="input"
                  value={form.assigneeName}
                  onChange={(event) => setForm((current) => ({ ...current, assigneeName: event.target.value }))}
                  placeholder="例如：张晨 / 王设计"
                />
              </div>
              <div className="field-control">
                <label className="field-label" htmlFor="task-due-at">
                  截止时间
                </label>
                <input
                  id="task-due-at"
                  type="datetime-local"
                  className="input"
                  value={toDateTimeInputValue(form.dueAt)}
                  onChange={(event) => setForm((current) => ({ ...current, dueAt: fromDateTimeInputValue(event.target.value) }))}
                />
              </div>
              <div className="field-control">
                <label className="field-label" htmlFor="task-description">
                  任务描述
                </label>
                <textarea
                  id="task-description"
                  className="textarea"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </div>
              <div className="field-control">
                <label className="field-label" htmlFor="task-remark">
                  跟进备注
                </label>
                <textarea id="task-remark" className="textarea" value={form.remark} onChange={(event) => setForm((current) => ({ ...current, remark: event.target.value }))} />
              </div>
            </div>
            <div className="row wrap">
              <button type="button" className="button secondary" onClick={() => handleStatusChange('todo')}>
                标记待处理
              </button>
              <button type="button" className="button secondary" onClick={() => handleStatusChange('in_progress')}>
                标记进行中
              </button>
              <button type="button" className="button secondary" onClick={() => handleStatusChange('pending_confirm')}>
                标记待确认
              </button>
              <button type="button" className="button primary" onClick={() => handleStatusChange('done')}>
                标记完成
              </button>
              <button type="button" className="button secondary" onClick={() => handleStatusChange('closed')}>
                关闭任务
              </button>
            </div>
          </div>
        </SectionCard>
        {order && !hideCommercialInfo ? (
          <SectionCard title="商品行推进建议" description="任务完成不等于购买记录或商品行自动完成；这里只给出当前购买记录的可推进方向，仍由业务人员手动判断是否推进。">
            <div className="stack">
              <div className="text-muted">
                {task.status === 'done' ? '当前任务已完成，可以结合购买记录活跃任务和资料完整度继续推进阶段。' : '建议先完成当前任务，再判断购买记录是否适合推进到下一阶段。'}
              </div>
              <div className="row wrap">
                <button type="button" className="button secondary" onClick={() => navigate('/order-lines')}>
                  查看商品行
                </button>
                {task.status === 'done'
                  ? orderNextStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className="button primary"
                        onClick={() => {
                          appData.transitionOrderStatus({
                            orderId: order.id,
                            nextStatus: status,
                            reason: `任务「${task.title}」已完成，购买记录阶段推进到${getOrderStatusLabel(status)}。`
                          })
                          navigate('/order-lines')
                        }}
                      >
                        推进到{getOrderStatusLabel(status)}
                      </button>
                    ))
                  : null}
              </div>
            </div>
          </SectionCard>
        ) : null}
        <SectionCard title="任务相关时间线" description="这里只筛当前任务关联到购买记录时间线里的记录，方便核对任务是否推动了购买记录节点。">
          {orderTimeline.length > 0 ? (
            <div className="stack">
              {orderTimeline.map((record) => (
                <div key={record.id} className="subtle-panel stack" style={{ gap: 6 }}>
                  <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                    <strong>{record.title}</strong>
                    <span className="text-caption">{record.createdAt}</span>
                  </div>
                  {record.description ? <div>{record.description}</div> : null}
                  <div className="text-caption">处理人：{record.actorName}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="当前任务还没有关联时间线" description="后续任务更新、完成或购买记录状态变化后，会逐步沉淀到这里。" />
          )}
        </SectionCard>
      </div>
    </PageContainer>
  )
}
