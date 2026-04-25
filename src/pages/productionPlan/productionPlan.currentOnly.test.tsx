import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProductionPlanDetailPage } from '@/pages/productionPlan/ProductionPlanDetailPage'
import { ProductionPlanListPage } from '@/pages/productionPlan/ProductionPlanListPage'
import { orderLinesMock } from '@/mocks/order-lines'
import { mockProducts } from '@/mocks/products'
import { purchasesMock } from '@/mocks/purchases'
import { mockTasks } from '@/mocks/tasks'

const mockUseAppData = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useAppData', () => ({
  useAppData: mockUseAppData
}))

const createCurrentOnlyAppData = () => ({
  tasks: mockTasks,
  purchases: purchasesMock,
  orderLines: orderLinesMock,
  orders: [],
  products: mockProducts,
  updateOrderLineProductionInfo: vi.fn(() => orderLinesMock[0]),
  updateOrderItem: vi.fn(),
  updateTask: vi.fn()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('productionPlan current-only flow', () => {
  it('renders the production plan list without legacy orders input', () => {
    mockUseAppData.mockReturnValue(createCurrentOnlyAppData())

    render(
      <MemoryRouter>
        <ProductionPlanListPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: '工厂生产计划' })).toBeInTheDocument()
    expect(screen.getByText('购买记录 PUR-202604-001')).toBeInTheDocument()
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.queryByText('SO-202604-001')).not.toBeInTheDocument()
  })

  it('updates production feedback through current order line state without calling legacy fallback', async () => {
    const user = userEvent.setup()
    const appData = createCurrentOnlyAppData()
    mockUseAppData.mockReturnValue(appData)

    render(
      <MemoryRouter initialEntries={['/production-plan/task-factory-001']}>
        <Routes>
          <Route path="/production-plan/:taskId" element={<ProductionPlanDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: '标记待回传' }))

    expect(appData.updateOrderLineProductionInfo).toHaveBeenCalledWith(
      'oi-ring-001',
      expect.objectContaining({
        factoryStatus: 'pending_feedback'
      })
    )
    expect(appData.updateOrderItem).not.toHaveBeenCalled()
  })
})
