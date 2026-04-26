import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TaskDetailPage } from '@/pages/tasks/TaskDetailPage'
import { TaskListPage } from '@/pages/tasks/TaskListPage'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import { mockTasks } from '@/mocks/tasks'

const mockUseAppData = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useAppData', () => ({
  useAppData: mockUseAppData
}))

const createCurrentOnlyAppData = () => ({
  currentUserRole: 'merchandiser',
  tasks: mockTasks,
  purchases: purchasesMock,
  orderLines: orderLinesMock,
  getTask: vi.fn((taskId?: string) => mockTasks.find((task) => task.id === taskId)),
  getPurchase: vi.fn((purchaseId?: string) => purchasesMock.find((purchase) => purchase.id === purchaseId)),
  getOrderLine: vi.fn((orderLineId?: string) => orderLinesMock.find((orderLine) => orderLine.id === orderLineId)),
  updateTask: vi.fn()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('task timeline current-only flow', () => {
  it('renders the task list without legacy orders input', () => {
    mockUseAppData.mockReturnValue(createCurrentOnlyAppData())
    const { container } = render(
      <MemoryRouter>
        <TaskListPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: '任务中心' })).toBeInTheDocument()
    expect(screen.getByText('确认戒指最终圈号')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'SO-202604-001' })[0]).toHaveAttribute('href', '/purchases/o-202604-001')
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('renders task detail and current purchase timeline without legacy orders input', () => {
    mockUseAppData.mockReturnValue(createCurrentOnlyAppData())
    const { container } = render(
      <MemoryRouter initialEntries={['/tasks/task-order-001']}>
        <Routes>
          <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: '任务详情' })).toBeInTheDocument()
    expect(screen.getByText('任务相关时间线')).toBeInTheDocument()
    expect(screen.getByText('山形戒指进入生产')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'SO-202604-001' })[0]).toHaveAttribute('href', '/purchases/o-202604-001')
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('updates task status through current task API', async () => {
    const user = userEvent.setup()
    const appData = createCurrentOnlyAppData()
    mockUseAppData.mockReturnValue(appData)

    render(
      <MemoryRouter initialEntries={['/tasks/task-order-001']}>
        <Routes>
          <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: '标记完成' }))

    expect(appData.updateTask).toHaveBeenCalledWith('task-order-001', expect.any(Function))
  })
})
