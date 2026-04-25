import { useMemo, useState } from 'react'
import { TaskFilterBar, TaskListHeader, TaskQuickStats, TaskTable } from '@/components/business/task'
import { PageContainer } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import type { TaskStatus, TaskType } from '@/types/task'

export const TaskListPage = () => {
  const { tasks } = useAppData()
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
    () =>
      tasks.filter((task) => {
        const matchesKeyword =
          filters.keyword.trim().length === 0 ||
          [task.title, task.purchaseNo, task.transactionNo, task.orderLineCode, task.orderLineName, task.description]
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
      }),
    [filters, tasks]
  )

  return (
    <PageContainer>
      <TaskListHeader />
      <div className="stack">
        <TaskQuickStats tasks={tasks} />
        <TaskFilterBar value={filters} onChange={setFilters} />
        <TaskTable tasks={filteredTasks} />
      </div>
    </PageContainer>
  )
}
