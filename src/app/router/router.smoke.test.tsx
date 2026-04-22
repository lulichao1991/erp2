import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AppRouter } from '@/app/router'
import { AppDataProvider } from '@/hooks/useAppData'

const renderRoute = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AppDataProvider>
        <AppRouter />
      </AppDataProvider>
    </MemoryRouter>
  )

afterEach(() => {
  cleanup()
})

describe('router smoke', () => {
  it('renders product detail route', () => {
    renderRoute('/products/p-ring-001')
    expect(screen.getByRole('heading', { name: '产品详情' })).toBeInTheDocument()
    expect(screen.getAllByText('山形素圈戒指').length).toBeGreaterThan(0)
  })

  it('renders order detail with product picker modal from query', () => {
    renderRoute('/orders/o-202604-001?modal=product-picker&itemId=oi-ring-001')
    expect(screen.getByRole('heading', { name: '订单详情' })).toBeInTheDocument()
    expect(screen.getByText('产品引用选择器')).toBeInTheDocument()
  })

  it('renders order detail with source product drawer from query', () => {
    renderRoute('/orders/o-202604-001?drawer=source-product&itemId=oi-ring-001')
    expect(screen.getByText('来源产品详情')).toBeInTheDocument()
    expect(screen.getByText('订单参数对比')).toBeInTheDocument()
  })

  it('opens source product drawer when clicking order item name', async () => {
    const user = userEvent.setup()
    renderRoute('/orders/o-202604-001')

    await user.click(screen.getByRole('button', { name: '打开来源产品：山形素圈戒指' }))

    expect(screen.getByText('来源产品详情')).toBeInTheDocument()
    expect(screen.getByText('模板原始详情')).toBeInTheDocument()
  })

  it('opens source product drawer when clicking source banner name', async () => {
    const user = userEvent.setup()
    renderRoute('/orders/o-202604-001')

    await user.click(screen.getByRole('button', { name: '从来源产品条打开：山形素圈戒指' }))

    expect(screen.getByText('来源产品详情')).toBeInTheDocument()
  })
})
