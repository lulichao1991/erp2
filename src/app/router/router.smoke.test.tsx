import { cleanup, render, screen, within } from '@testing-library/react'
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
  window.localStorage.clear()
})

describe('router smoke', () => {
  it('renders product detail route', () => {
    renderRoute('/products/p-ring-001')
    expect(screen.getByRole('heading', { name: '产品详情' })).toBeInTheDocument()
    expect(screen.getAllByText('山形素圈戒指').length).toBeGreaterThan(0)
  })

  it('manages global dictionary from product list and reuses it in product create', async () => {
    const user = userEvent.setup()
    renderRoute('/products')

    await user.click(screen.getByRole('button', { name: '字典配置' }))
    expect(screen.getByRole('heading', { name: '字典配置' })).toBeInTheDocument()

    const styleDictionarySection = screen.getByText('风格标签').closest('.subtle-panel')
    expect(styleDictionarySection).not.toBeNull()

    await user.type(screen.getByLabelText('风格标签字典新增'), '学院风')
    await user.click(within(styleDictionarySection as HTMLElement).getByRole('button', { name: '加入字典' }))

    cleanup()

    renderRoute('/products/new')
    const styleDropdown = screen.getByRole('button', { name: '风格标签' })
    await user.click(styleDropdown)

    expect(screen.getByRole('checkbox', { name: '学院风' })).toBeInTheDocument()
  })

  it('manages size parameter dictionary from product list and reuses it in product create', async () => {
    const user = userEvent.setup()
    renderRoute('/products')

    await user.click(screen.getByRole('button', { name: '字典配置' }))

    const sizeParameterSection = screen.getByText('尺寸参数字典').closest('.subtle-panel')
    expect(sizeParameterSection).not.toBeNull()

    await user.click(within(sizeParameterSection as HTMLElement).getByRole('button', { name: '新增尺寸参数' }))

    const parameterNameInputs = screen.getAllByLabelText(/尺寸参数显示名称-/)
    const parameterUnitInputs = screen.getAllByLabelText(/尺寸参数默认单位-/)
    const latestNameInput = parameterNameInputs[parameterNameInputs.length - 1] as HTMLElement
    const latestUnitInput = parameterUnitInputs[parameterUnitInputs.length - 1] as HTMLElement

    await user.type(latestNameInput, '吊坠高度')
    await user.type(latestUnitInput, 'mm')

    const pendantCheckboxes = screen.getAllByRole('checkbox', { name: '吊坠' })
    await user.click(pendantCheckboxes[pendantCheckboxes.length - 1] as HTMLElement)
    await user.click(within(sizeParameterSection as HTMLElement).getByRole('button', { name: '保存尺寸参数字典' }))

    cleanup()

    renderRoute('/products/new')
    await user.selectOptions(screen.getByLabelText('品类'), 'pendant')
    await user.click(screen.getByRole('button', { name: '新增规格行' }))

    const firstSpec = screen.getByText('规格行 1').closest('.subtle-panel')
    expect(firstSpec).not.toBeNull()

    await user.click(within(firstSpec as HTMLElement).getByRole('button', { name: '新增参数' }))
    await user.selectOptions(screen.getByLabelText('规格行1-参数名称-1'), '吊坠高度')

    expect(screen.getByLabelText('规格行1-参数名称-1')).toHaveValue('吊坠高度')
    expect(screen.getByLabelText('规格行1-单位-1')).toHaveValue('mm')
  })

  it('supports default option selection and custom addition in product create form', async () => {
    const user = userEvent.setup()
    renderRoute('/products/new')

    const styleDropdown = screen.getByRole('button', { name: '风格标签' })
    await user.click(styleDropdown)
    await user.click(screen.getByRole('checkbox', { name: '街头风' }))
    expect(styleDropdown).toHaveTextContent('街头风')

    const materialDropdown = screen.getByRole('button', { name: '支持材质' })
    await user.click(materialDropdown)
    await user.click(screen.getByRole('checkbox', { name: '足金' }))
    expect(screen.getByLabelText('默认材质')).toHaveValue('足金')

    await user.type(screen.getByLabelText('风格标签自定义补充'), '先锋感')
    await user.click(screen.getByRole('button', { name: '仅添加风格标签到当前产品' }))

    expect(styleDropdown).toHaveTextContent('先锋感')
  })

  it('reuses global dictionary option in another product create session', async () => {
    const user = userEvent.setup()
    renderRoute('/products/new')

    const firstStyleDropdown = screen.getByRole('button', { name: '风格标签' })
    await user.click(firstStyleDropdown)
    await user.type(screen.getByLabelText('风格标签自定义补充'), '先锋感')
    await user.click(screen.getByRole('button', { name: '加入风格标签到全局字典' }))

    cleanup()

    renderRoute('/products/new')
    const secondStyleDropdown = screen.getByRole('button', { name: '风格标签' })
    await user.click(secondStyleDropdown)

    expect(screen.getByRole('checkbox', { name: '先锋感' })).toBeInTheDocument()
  })

  it('reuses first spec row field structure when adding another spec row', async () => {
    const user = userEvent.setup()
    renderRoute('/products/new')

    await user.click(screen.getByRole('button', { name: '新增规格行' }))

    const firstSpec = screen.getByText('规格行 1').closest('.subtle-panel')
    expect(firstSpec).not.toBeNull()

    await user.click(within(firstSpec as HTMLElement).getByRole('button', { name: '新增参数' }))

    expect(screen.queryByLabelText('规格行1-字段标识-1')).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('规格行1-参数名称-1'), '面宽')
    await user.type(screen.getByLabelText('规格行1-值-1'), '3.2')
    expect(screen.getByLabelText('规格行1-单位-1')).toHaveValue('mm')

    await user.click(screen.getByRole('button', { name: '新增规格行' }))

    expect(screen.queryByLabelText('规格行2-字段标识-1')).not.toBeInTheDocument()
    expect(screen.getByLabelText('规格行2-参数名称-1')).toHaveValue('面宽')
    expect(screen.getByLabelText('规格行2-单位-1')).toHaveValue('mm')
    expect(screen.getByLabelText('规格行2-值-1')).toHaveValue('')
  })

  it('renders order detail with product picker modal from query', () => {
    renderRoute('/orders/o-202604-001?modal=product-picker&itemId=oi-ring-001')
    expect(screen.getByRole('heading', { name: '订单详情' })).toBeInTheDocument()
    expect(screen.getByText('产品引用选择器')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认引用' })).toBeInTheDocument()
  })

  it('renders order create with helper form controls', () => {
    renderRoute('/orders/new')

    expect(screen.getByLabelText('订单类型')).toHaveValue('平台定制')
    expect(screen.getByLabelText('客服负责人')).toHaveValue('待分配')
    expect(screen.getByLabelText('付款时间')).toHaveAttribute('type', 'datetime-local')
    expect(screen.getByLabelText('客户期望时间')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('承诺交期')).toHaveAttribute('type', 'date')
  })

  it('renders order detail with source product drawer from query', () => {
    renderRoute('/orders/o-202604-001?drawer=source-product&itemId=oi-ring-001')
    expect(screen.getByText('来源产品详情')).toBeInTheDocument()
    expect(screen.getByText('订单参数对比')).toBeInTheDocument()
  })

  it('shows full spec matrix in source product drawer detail tab', () => {
    renderRoute('/orders/o-202604-001?drawer=source-product&itemId=oi-ring-001')

    expect(screen.getByText('完整规格参数表')).toBeInTheDocument()
    expect(screen.getAllByText('10号').length).toBeGreaterThan(0)
    expect(screen.getAllByText('16号').length).toBeGreaterThan(0)
    expect(screen.getAllByText('面宽').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/¥ 1,280/).length).toBeGreaterThan(0)
  })

  it('opens product reference records drawer from product detail', async () => {
    const user = userEvent.setup()
    renderRoute('/products/p-ring-001')

    await user.click(screen.getByRole('button', { name: '查看全部引用记录' }))

    expect(screen.getByText('产品引用记录')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'SO-202604-001' }).length).toBeGreaterThan(0)
  })

  it('opens product version history drawer from product detail', async () => {
    const user = userEvent.setup()
    renderRoute('/products/p-ring-001')

    await user.click(screen.getByRole('button', { name: '查看版本记录' }))

    expect(screen.getByText('产品版本记录')).toBeInTheDocument()
    expect(screen.getByText('v3 · 陈设计')).toBeInTheDocument()
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
