import { useMemo, useState } from 'react'
import { TaskFilterBar, TaskListHeader, TaskQuickStats, TaskTable } from '@/components/business/task'
import { PageContainer } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { getTaskPurchaseNo } from '@/services/task/taskIdentity'
import type { TaskStatus, TaskType } from '@/types/task'

export const TaskListPage = () => {
  const { orderLines, tasks } = useAppData()
  const [filters, setFilters] = useState<{
    keyword: string
    type: 'all' | TaskType
    status: 'all' | TaskStatus
    assignee: string
  }>({
    keyword: '',
    type: 'all',
    status: 'all',
    assignee: ''
  })

  const filteredTasks = useMemo(
    () => {
      const orderLineById = new Map(orderLines.map((orderLine) => [orderLine.id, orderLine]))

      return tasks.filter((task) => {
        const orderLine = task.orderLineId ? orderLineById.get(task.orderLineId) : undefined
        const matchesKeyword =
          filters.keyword.trim().length === 0 ||
          [
            task.title,
            getTaskPurchaseNo(task, ''),
            task.orderLineName,
            orderLine ? getOrderLineGoodsNo(orderLine) : undefined,
            task.description
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(filters.keyword.toLowerCase())
        const matchesType = filters.type === 'all' || task.type === filters.type
        const matchesStatus = filters.status === 'all' || task.status === filters.status
        const matchesAssignee =
          filters.assignee.trim().length === 0 ||
          [task.assigneeName, task.createdBy, task.updatedBy].filter(Boolean).join(' ').includes(filters.assignee.trim())

        return matchesKeyword && matchesType && matchesStatus && matchesAssignee
      })
    },
    [filters, orderLines, tasks]
  )

  return (
    <PageContainer>
      <TaskListHeader />
      <div className="stack">
        <TaskQuickStats tasks={tasks} orderLines={orderLines} />
        <TaskFilterBar value={filters} onChange={setFilters} />
        <TaskTable tasks={filteredTasks} orderLines={orderLines} />
      </div>
    </PageContainer>
  )
}
