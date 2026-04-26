import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppRouter } from '@/app/router'
import { CustomerBasicSection, CustomerListTable, buildCustomerOverview } from '@/components/business/customer'
import { AppDataProvider } from '@/hooks/useAppData'
import { customerMock } from '@/mocks'

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
  vi.restoreAllMocks()
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

  it('renders order-line center as one row per product', () => {
    renderRoute('/order-lines')

    expect(screen.getByRole('heading', { name: '商品行中心' })).toBeInTheDocument()
    expect(screen.getByText('一行代表一件商品，支持独立推进设计、生产、发货与售后。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '全部商品行' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '待设计' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '待建模' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '待财务确认' })).toBeInTheDocument()
    expect(screen.getByLabelText('品类筛选')).toBeInTheDocument()
    expect(screen.getByLabelText('是否加急筛选')).toBeInTheDocument()
    expect(screen.getByLabelText('是否售后中')).toBeInTheDocument()
    expect(screen.getByLabelText('是否超期')).toBeInTheDocument()
    expect(screen.getByLabelText('工厂筛选')).toBeInTheDocument()
    expect(screen.getByLabelText('购买记录筛选')).toBeInTheDocument()
    expect(screen.getByLabelText('客户筛选')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '待建模' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '待财务确认' })).toBeInTheDocument()
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.getByText('山形吊坠')).toBeInTheDocument()
    expect(screen.getByText('定制项链')).toBeInTheDocument()
    expect(screen.getByText('手链蜡版确认')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'PUR-202604-001' }).length).toBeGreaterThan(0)
  })

  it('filters order-line center by category, owner, after-sales, urgent flag and keyword', async () => {
    const user = userEvent.setup()
    renderRoute('/order-lines')

    await user.selectOptions(screen.getByLabelText('品类筛选'), 'pendant')
    expect(screen.queryByText('山形戒指')).not.toBeInTheDocument()
    expect(screen.getByText('山形吊坠')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('品类筛选'), 'all')
    await user.click(screen.getByRole('button', { name: '待设计' }))
    expect(screen.getByText('定制项链')).toBeInTheDocument()
    expect(screen.queryByText('山形戒指')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '全部商品行' }))
    await user.selectOptions(screen.getByLabelText('状态筛选'), 'pending_modeling')
    expect(screen.getByText('手链蜡版确认')).toBeInTheDocument()
    expect(screen.queryByText('山形戒指')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('状态筛选'), 'all')
    await user.selectOptions(screen.getByLabelText('是否售后中'), 'yes')
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.queryByText('山形吊坠')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('是否售后中'), 'all')
    await user.selectOptions(screen.getByLabelText('是否加急筛选'), 'yes')
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.queryByText('山形吊坠')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('是否加急筛选'), 'all')
    await user.clear(screen.getByLabelText('负责人筛选'))
    await user.type(screen.getByLabelText('负责人筛选'), '陈设计')
    expect(screen.queryByText('山形戒指')).not.toBeInTheDocument()
    expect(screen.getByText('定制项链')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('负责人筛选'))
    await user.type(screen.getByLabelText('搜索商品行编号 / 商品名称 / 客户 / 购买记录 / 平台单号'), 'TB-9938201')
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.getByText('山形吊坠')).toBeInTheDocument()
    expect(screen.getByText('定制项链')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '售后中' }))
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.queryByText('山形吊坠')).not.toBeInTheDocument()
  })

  it('filters order-line center by factory, purchase and customer without legacy orders', async () => {
    const user = userEvent.setup()
    renderRoute('/order-lines')

    await user.type(screen.getByLabelText('工厂筛选'), '苏州金工厂')
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.queryByText('山形吊坠')).not.toBeInTheDocument()
    expect(screen.queryByText('定制项链')).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('工厂筛选'))
    await user.type(screen.getByLabelText('购买记录筛选'), 'PUR-202604-001')
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.getByText('山形吊坠')).toBeInTheDocument()
    expect(screen.getByText('定制项链')).toBeInTheDocument()
    expect(screen.getByText('手链蜡版确认')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('购买记录筛选'))
    await user.type(screen.getByLabelText('客户筛选'), '张三')
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.getByText('山形吊坠')).toBeInTheDocument()
    expect(screen.getByText('定制项链')).toBeInTheDocument()
    expect(screen.getByText('手链蜡版确认')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('客户筛选'))
    await user.type(screen.getByLabelText('客户筛选'), '不存在的客户')
    expect(screen.getByText('暂无匹配商品行')).toBeInTheDocument()
    expect(screen.getByText('当前筛选条件下没有商品行，请放宽筛选或切回全部商品行。')).toBeInTheDocument()
    expect(screen.queryByText('山形戒指')).not.toBeInTheDocument()
  })

  it('opens order-line detail drawer from view button and switches records from row click', async () => {
    const user = userEvent.setup()
    renderRoute('/order-lines')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    expect(ringRow).not.toBeNull()

    await user.click(within(ringRow as HTMLElement).getByRole('button', { name: '查看' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('顶部摘要')).toBeInTheDocument()
    expect(screen.getAllByText('山形戒指').length).toBeGreaterThan(0)
    expect(screen.getByText('售后记录')).toBeInTheDocument()
    expect(screen.getByText('改圈/改尺寸')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '打开购买记录' })).toHaveAttribute('href', '/purchases/o-202604-001')

    await user.click(screen.getByRole('button', { name: '查看来源产品' }))

    expect(screen.getByText('来源产品详情')).toBeInTheDocument()
    expect(screen.getByText('这里展示产品模板原始信息；查看或调整商品行不会修改产品模板。')).toBeInTheDocument()
    expect(screen.getByText('商品行参数对比')).toBeInTheDocument()
    expect(screen.getAllByText('PD-RING-001').length).toBeGreaterThan(0)

    const closeButtons = screen.getAllByRole('button', { name: '关闭' })
    await user.click(closeButtons[closeButtons.length - 1] as HTMLElement)
    await user.click(screen.getAllByRole('button', { name: '关闭' })[0] as HTMLElement)

    const pendantRow = screen.getByText('OL-202604-001-02').closest('tr')
    expect(pendantRow).not.toBeNull()
    await user.click(pendantRow as HTMLElement)

    expect(screen.getAllByText('山形吊坠').length).toBeGreaterThan(0)
    expect(screen.getByText('物流 SF202604280001')).toBeInTheDocument()
    expect(screen.getByText('顺丰速运')).toBeInTheDocument()
    expect(screen.getByText('暂无售后记录')).toBeInTheDocument()
  })

  it('updates one order-line status from the detail drawer', async () => {
    const user = userEvent.setup()
    renderRoute('/order-lines')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    const pendantRow = screen.getByText('OL-202604-001-02').closest('tr')
    const necklaceRow = screen.getByText('OL-202604-001-03').closest('tr')
    expect(ringRow).not.toBeNull()
    expect(pendantRow).not.toBeNull()
    expect(necklaceRow).not.toBeNull()

    await user.click(within(ringRow as HTMLElement).getByRole('button', { name: '查看' }))
    await user.selectOptions(screen.getByLabelText('目标状态'), 'ready_to_ship')
    await user.click(screen.getByRole('button', { name: '更新状态' }))

    expect(screen.getByRole('status')).toHaveTextContent('已将状态从 生产中 更新为 待发货')
    expect(screen.getByText('操作日志')).toBeInTheDocument()
    expect(screen.getByText('将商品行 OL-202604-001-01 从「生产中」改为「待发货」')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('待发货')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('待财务确认')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('待设计')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '关闭' })[0] as HTMLElement)
    await user.click(within(pendantRow as HTMLElement).getByRole('button', { name: '查看' }))
    expect(screen.queryByText('将商品行 OL-202604-001-01 从「生产中」改为「待发货」')).not.toBeInTheDocument()
    expect(screen.getByText('将商品行 OL-202604-001-02 从「生产中」改为「待发货」')).toBeInTheDocument()
  })

  it('edits basic order-line requirements from the detail drawer without changing siblings', async () => {
    const user = userEvent.setup()
    renderRoute('/order-lines')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    const pendantRow = screen.getByText('OL-202604-001-02').closest('tr')
    expect(ringRow).not.toBeNull()
    expect(pendantRow).not.toBeNull()

    await user.click(within(ringRow as HTMLElement).getByRole('button', { name: '查看' }))
    await user.click(screen.getByRole('button', { name: '编辑基础信息 / 实际需求' }))

    await user.clear(screen.getByLabelText('材质'))
    await user.type(screen.getByLabelText('材质'), '18K金')
    await user.clear(screen.getByLabelText('工艺'))
    await user.type(screen.getByLabelText('工艺'), '微镶')
    await user.clear(screen.getByLabelText('刻字 / 印记'))
    await user.type(screen.getByLabelText('刻字 / 印记'), 'RING-TEST')
    await user.clear(screen.getByLabelText('客服备注'))
    await user.type(screen.getByLabelText('客服备注'), '客户改为 18K 微镶')
    await user.clear(screen.getByLabelText('当前负责人'))
    await user.type(screen.getByLabelText('当前负责人'), '赵客服')
    await user.clear(screen.getByLabelText('承诺交期'))
    await user.type(screen.getByLabelText('承诺交期'), '2026-05-08')
    await user.selectOptions(screen.getByLabelText('是否加急'), 'urgent')
    await user.click(screen.getByRole('button', { name: '保存需求' }))

    expect(screen.getByRole('status')).toHaveTextContent('已保存商品行基础信息 / 实际需求')
    expect(screen.getByText('编辑商品行需求')).toBeInTheDocument()
    expect(screen.getByText('修改了商品行基础信息 / 实际需求')).toBeInTheDocument()
    expect(screen.getAllByText('18K金').length).toBeGreaterThan(0)
    expect(screen.getAllByText('微镶').length).toBeGreaterThan(0)
    expect(screen.getByText('RING-TEST')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('赵客服')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('2026-05-08')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText((content) => content.includes('材质 18K金') && content.includes('工艺 微镶'))).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('山形吊坠')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).queryByText('赵客服')).not.toBeInTheDocument()
  })

  it('edits outsource info from the detail drawer without changing siblings', async () => {
    const user = userEvent.setup()
    renderRoute('/order-lines')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    const pendantRow = screen.getByText('OL-202604-001-02').closest('tr')
    expect(ringRow).not.toBeNull()
    expect(pendantRow).not.toBeNull()

    await user.click(within(ringRow as HTMLElement).getByRole('button', { name: '查看' }))
    await user.click(screen.getByRole('button', { name: '编辑跟单 / 下厂信息' }))
    await user.clear(screen.getByLabelText('跟单负责人'))
    await user.type(screen.getByLabelText('跟单负责人'), '周跟单')
    await user.clear(screen.getByLabelText('工厂名称'))
    await user.type(screen.getByLabelText('工厂名称'), '深圳精工厂')
    await user.clear(screen.getByLabelText('下厂时间'))
    await user.type(screen.getByLabelText('下厂时间'), '2026-04-26')
    await user.clear(screen.getByLabelText('生产任务编号 / 货号'))
    await user.type(screen.getByLabelText('生产任务编号 / 货号'), 'SKU-RING-OUT-01')
    await user.clear(screen.getByLabelText('工厂计划交期'))
    await user.type(screen.getByLabelText('工厂计划交期'), '2026-05-06')
    await user.selectOptions(screen.getByLabelText('委外状态'), 'in_progress')
    await user.clear(screen.getByLabelText('跟单备注 / 委外备注'))
    await user.type(screen.getByLabelText('跟单备注 / 委外备注'), '戒指送深圳工厂加急排产')
    await user.click(screen.getByRole('button', { name: '保存跟单' }))

    expect(screen.getByRole('status')).toHaveTextContent('已保存跟单 / 下厂信息')
    expect(screen.getByText('编辑跟单 / 下厂信息')).toBeInTheDocument()
    expect(screen.getByText('修改了商品行跟单 / 下厂信息')).toBeInTheDocument()
    expect(screen.getAllByText('深圳精工厂').length).toBeGreaterThan(0)
    expect(screen.getAllByText('SKU-RING-OUT-01').length).toBeGreaterThan(0)
    expect(screen.getByText('戒指送深圳工厂加急排产')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('周跟单')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('深圳精工厂')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('杭州珐琅工作室')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).queryByText('周跟单')).not.toBeInTheDocument()
  })

  it('edits factory feedback from the detail drawer without changing siblings', async () => {
    const user = userEvent.setup()
    renderRoute('/order-lines')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    const pendantRow = screen.getByText('OL-202604-001-02').closest('tr')
    expect(ringRow).not.toBeNull()
    expect(pendantRow).not.toBeNull()

    await user.click(within(ringRow as HTMLElement).getByRole('button', { name: '查看' }))
    await user.click(screen.getByRole('button', { name: '编辑工厂回传信息' }))
    await user.selectOptions(screen.getByLabelText('工厂状态'), 'completed')
    await user.clear(screen.getByLabelText('实际材质'))
    await user.type(screen.getByLabelText('实际材质'), '18K金实做')
    await user.clear(screen.getByLabelText('总重'))
    await user.type(screen.getByLabelText('总重'), '5.6g')
    await user.clear(screen.getByLabelText('净重'))
    await user.type(screen.getByLabelText('净重'), '5.1g')
    await user.type(screen.getByLabelText('主石信息'), '主石 0.3ct')
    await user.type(screen.getByLabelText('辅石信息'), '辅石 6颗')
    await user.type(screen.getByLabelText('工费明细'), '工费 680')
    await user.type(screen.getByLabelText('工厂出货日期'), '2026-05-07')
    await user.clear(screen.getByLabelText('质检结果'))
    await user.type(screen.getByLabelText('质检结果'), '通过')
    await user.clear(screen.getByLabelText('工厂备注'))
    await user.type(screen.getByLabelText('工厂备注'), '戒指工厂回传完成')
    await user.click(screen.getByRole('button', { name: '保存回传' }))

    expect(screen.getByText('已保存工厂回传信息')).toBeInTheDocument()
    expect(screen.getByText('编辑工厂回传信息')).toBeInTheDocument()
    expect(screen.getByText('修改了商品行工厂回传信息')).toBeInTheDocument()
    expect(screen.getByText('18K金实做')).toBeInTheDocument()
    expect(screen.getByText('5.6g')).toBeInTheDocument()
    expect(screen.getByText('5.1g')).toBeInTheDocument()
    expect(screen.getByText('主石 0.3ct')).toBeInTheDocument()
    expect(screen.getAllByText('戒指工厂回传完成').length).toBeGreaterThan(0)
    expect(within(ringRow as HTMLElement).getByText('工厂 工厂已回传')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('工厂 工厂已回传')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '关闭' })[0] as HTMLElement)
    await user.click(within(pendantRow as HTMLElement).getByRole('button', { name: '查看' }))
    expect(screen.queryByText('戒指工厂回传完成')).not.toBeInTheDocument()
    expect(screen.getAllByText('质检通过，待发货。').length).toBeGreaterThan(0)
  })

  it('adds logistics to only the selected order line from the detail drawer', async () => {
    const user = userEvent.setup()
    renderRoute('/order-lines')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    const pendantRow = screen.getByText('OL-202604-001-02').closest('tr')
    const necklaceRow = screen.getByText('OL-202604-001-03').closest('tr')
    expect(ringRow).not.toBeNull()
    expect(pendantRow).not.toBeNull()
    expect(necklaceRow).not.toBeNull()

    await user.click(within(ringRow as HTMLElement).getByRole('button', { name: '查看' }))
    await user.click(screen.getByRole('button', { name: '新增物流' }))
    await user.selectOptions(screen.getByLabelText('物流类型'), 'goods')
    await user.selectOptions(screen.getByLabelText('物流方向'), 'outbound')
    await user.type(screen.getByLabelText('快递公司'), '顺丰速运')
    await user.type(screen.getByLabelText('运单号'), 'SF-RING-NEW-001')
    await user.type(screen.getByLabelText('物流备注'), '戒指单独发货')
    await user.click(screen.getByRole('button', { name: '保存物流' }))

    expect(screen.getByText('SF-RING-NEW-001')).toBeInTheDocument()
    expect(screen.getByText('为商品行 OL-202604-001-01 新增货品物流 SF-RING-NEW-001')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('物流 SF-RING-NEW-001')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('物流 SF202604280001')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('未发货')).toBeInTheDocument()

    const logisticsPanel = screen.getByText('物流记录').closest('.subtle-panel')
    expect(logisticsPanel).not.toBeNull()
    await user.click(within(logisticsPanel as HTMLElement).getByRole('button', { name: '编辑' }))
    await user.clear(screen.getByLabelText('运单号'))
    await user.type(screen.getByLabelText('运单号'), 'SF-RING-EDIT-001')
    await user.clear(screen.getByLabelText('物流备注'))
    await user.type(screen.getByLabelText('物流备注'), '戒指物流单号已修正')
    await user.click(screen.getByRole('button', { name: '保存物流修改' }))

    expect(screen.getByText('SF-RING-EDIT-001')).toBeInTheDocument()
    expect(screen.getByText('编辑物流')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('物流 SF-RING-EDIT-001')).toBeInTheDocument()

    await user.click(within(logisticsPanel as HTMLElement).getByRole('button', { name: '作废' }))
    await user.type(screen.getByLabelText('作废原因'), '客户要求暂缓发货')
    await user.click(screen.getByRole('button', { name: '确认作废' }))

    expect(screen.getByText('已作废')).toBeInTheDocument()
    expect(screen.getByText('作废物流')).toBeInTheDocument()
    expect(screen.getByText((content) => content.includes('作废原因') && content.includes('客户要求暂缓发货'))).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('未发货')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '关闭' })[0] as HTMLElement)
    await user.click(necklaceRow as HTMLElement)
    expect(screen.queryByText('SF-RING-EDIT-001')).not.toBeInTheDocument()
    expect(screen.getByText('暂无物流记录')).toBeInTheDocument()
  })

  it('adds after-sales to only the selected order line from the detail drawer', async () => {
    const user = userEvent.setup()
    renderRoute('/order-lines')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    const pendantRow = screen.getByText('OL-202604-001-02').closest('tr')
    const necklaceRow = screen.getByText('OL-202604-001-03').closest('tr')
    expect(ringRow).not.toBeNull()
    expect(pendantRow).not.toBeNull()
    expect(necklaceRow).not.toBeNull()

    await user.click(within(pendantRow as HTMLElement).getByRole('button', { name: '查看' }))
    await user.click(screen.getByRole('button', { name: '新增售后' }))
    await user.selectOptions(screen.getByLabelText('售后类型'), 'repolish')
    await user.selectOptions(screen.getByLabelText('售后状态'), 'processing')
    await user.clear(screen.getByLabelText('售后负责人'))
    await user.type(screen.getByLabelText('售后负责人'), '王客服')
    await user.type(screen.getByLabelText('售后原因'), '吊坠表面需要返工抛光')
    await user.type(screen.getByLabelText('售后备注'), '吊坠单独进入售后')
    await user.click(screen.getByRole('button', { name: '保存售后' }))

    expect(screen.getByText('返工抛光')).toBeInTheDocument()
    expect(screen.getByText('吊坠表面需要返工抛光')).toBeInTheDocument()
    expect(screen.getByText('为商品行 OL-202604-001-02 新增返工抛光售后：吊坠表面需要返工抛光')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('售后 处理中')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('售后 待处理')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('无售后')).toBeInTheDocument()

    const afterSalesPanel = screen.getByText('售后记录').closest('.subtle-panel')
    expect(afterSalesPanel).not.toBeNull()
    await user.click(within(afterSalesPanel as HTMLElement).getByRole('button', { name: '编辑' }))
    await user.clear(screen.getByLabelText('售后负责人'))
    await user.type(screen.getByLabelText('售后负责人'), '李售后')
    await user.clear(screen.getByLabelText('售后原因'))
    await user.type(screen.getByLabelText('售后原因'), '吊坠返工抛光已确认')
    await user.click(screen.getByRole('button', { name: '保存售后修改' }))

    expect(screen.getByText('吊坠返工抛光已确认')).toBeInTheDocument()
    expect(screen.getByText('编辑售后')).toBeInTheDocument()
    expect(screen.getByText(/李售后/)).toBeInTheDocument()

    await user.click(within(afterSalesPanel as HTMLElement).getByRole('button', { name: '关闭' }))
    expect(screen.getByText('关闭售后')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('售后 已关闭')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('售后 待处理')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '关闭' })[0] as HTMLElement)
    await user.click(necklaceRow as HTMLElement)
    expect(screen.queryByText('吊坠返工抛光已确认')).not.toBeInTheDocument()
    expect(screen.getByText('暂无售后记录')).toBeInTheDocument()
  })

  it('shows non-referenced custom order line details in drawer', async () => {
    const user = userEvent.setup()
    renderRoute('/order-lines')

    const necklaceRow = screen.getByText('OL-202604-001-03').closest('tr')
    expect(necklaceRow).not.toBeNull()

    await user.click(necklaceRow as HTMLElement)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('定制项链').length).toBeGreaterThan(0)
    expect(screen.getByText('未引用产品')).toBeInTheDocument()
    expect(screen.getAllByText('锁骨链 42cm').length).toBeGreaterThan(0)
    expect(screen.getByText('暂无物流记录')).toBeInTheDocument()
    expect(screen.getByText('暂无操作日志')).toBeInTheDocument()
  })

  it('renders purchase detail as the current grouping route', () => {
    renderRoute('/purchases/o-202604-001')

    expect(screen.getByRole('heading', { name: '购买记录详情' })).toBeInTheDocument()
    expect(screen.getByText('购买记录详情是归组页，用来查看一次购买的公共信息和本次购买下的所有商品行。')).toBeInTheDocument()
    expect(screen.getByText('PUR-202604-001')).toBeInTheDocument()
    expect(screen.getByText('客户与收货信息')).toBeInTheDocument()
    expect(screen.getByText('付款总览')).toBeInTheDocument()
    expect(screen.getByText('付款摘要')).toBeInTheDocument()
    expect(screen.getByText('当前整体提示')).toBeInTheDocument()
    expect(screen.getByText('本页只做购买记录归组；每条商品行独立推进执行。')).toBeInTheDocument()
    expect(screen.getByText('商品行数量')).toBeInTheDocument()
    expect(screen.getByText('本次商品行列表')).toBeInTheDocument()
    expect(screen.getByText('报价摘要')).toBeInTheDocument()
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.getByText('山形吊坠')).toBeInTheDocument()
    expect(screen.getByText('定制项链')).toBeInTheDocument()
    expect(screen.getByText('生产中')).toBeInTheDocument()
    expect(screen.getByText('待财务确认')).toBeInTheDocument()
    expect(screen.getByText('待设计')).toBeInTheDocument()
    expect(screen.getByText('手链蜡版确认')).toBeInTheDocument()
    expect(screen.getByText('待建模')).toBeInTheDocument()
    expect(screen.getByText('备注与日志')).toBeInTheDocument()
  })

  it('renders current workflow entry routes without using legacy orders as the main entry', () => {
    const entries = [
      { path: '/purchases', heading: '新建购买记录' },
      { path: '/purchases/new', heading: '新建购买记录' },
      { path: '/purchases/o-202604-001', heading: '购买记录详情' },
      { path: '/order-lines', heading: '商品行中心' },
      { path: '/customers', heading: '客户中心' },
      { path: '/customers/customer-zhang-001', heading: '客户详情' },
      { path: '/tasks', heading: '任务中心' },
      { path: '/inventory', heading: '仓库商品管理' },
      { path: '/production-plan', heading: '工厂生产计划' },
      { path: '/production-plan/task-factory-001', heading: '生产任务详情' }
    ]

    entries.forEach(({ path, heading }) => {
      const { container, unmount } = renderRoute(path)

      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
      expect(container.querySelector('a[href^="/orders"]')).toBeNull()

      unmount()
    })
  })

  it('opens order-line drawer from purchase detail line table', async () => {
    const user = userEvent.setup()
    renderRoute('/purchases/o-202604-001')

    const pendantRow = screen.getByText('OL-202604-001-02').closest('tr')
    expect(pendantRow).not.toBeNull()

    await user.click(within(pendantRow as HTMLElement).getByRole('button', { name: '查看商品行' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('山形吊坠').length).toBeGreaterThan(0)
    expect(screen.getByText('顺丰速运')).toBeInTheDocument()
    expect(screen.getByText('暂无售后记录')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '打开购买记录' })).toHaveAttribute('href', '/purchases/o-202604-001')
  })

  it('updates one order-line status from purchase detail without changing siblings', async () => {
    const user = userEvent.setup()
    renderRoute('/purchases/o-202604-001')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    const pendantRow = screen.getByText('OL-202604-001-02').closest('tr')
    const necklaceRow = screen.getByText('OL-202604-001-03').closest('tr')
    expect(ringRow).not.toBeNull()
    expect(pendantRow).not.toBeNull()
    expect(necklaceRow).not.toBeNull()

    await user.click(within(necklaceRow as HTMLElement).getByRole('button', { name: '查看商品行' }))
    await user.selectOptions(screen.getByLabelText('目标状态'), 'completed')
    await user.click(screen.getByRole('button', { name: '更新状态' }))

    expect(screen.getByRole('status')).toHaveTextContent('已将状态从 待设计 更新为 已完成')
    expect(screen.getByText('操作日志')).toBeInTheDocument()
    expect(screen.getByText('将商品行 OL-202604-001-03 从「待设计」改为「已完成」')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('已完成')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('生产中')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('待财务确认')).toBeInTheDocument()
  })

  it('edits order-line requirements from purchase detail and keeps siblings unchanged', async () => {
    const user = userEvent.setup()
    renderRoute('/purchases/o-202604-001')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    const pendantRow = screen.getByText('OL-202604-001-02').closest('tr')
    const necklaceRow = screen.getByText('OL-202604-001-03').closest('tr')
    expect(ringRow).not.toBeNull()
    expect(pendantRow).not.toBeNull()
    expect(necklaceRow).not.toBeNull()

    await user.click(within(necklaceRow as HTMLElement).getByRole('button', { name: '查看商品行' }))
    await user.click(screen.getByRole('button', { name: '编辑基础信息 / 实际需求' }))
    await user.clear(screen.getByLabelText('商品名称'))
    await user.type(screen.getByLabelText('商品名称'), '定制项链改版')
    await user.clear(screen.getByLabelText('材质'))
    await user.type(screen.getByLabelText('材质'), '铂金')
    await user.clear(screen.getByLabelText('当前负责人'))
    await user.type(screen.getByLabelText('当前负责人'), '李客服')
    await user.clear(screen.getByLabelText('承诺交期'))
    await user.type(screen.getByLabelText('承诺交期'), '2026-05-12')
    await user.click(screen.getByRole('button', { name: '保存需求' }))

    expect(screen.getAllByText('定制项链改版').length).toBeGreaterThan(0)
    expect(screen.getAllByText('铂金').length).toBeGreaterThan(0)
    expect(screen.getByText('修改了商品行基础信息 / 实际需求')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('定制项链改版')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('李客服')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('2026-05-12')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText((content) => content.includes('材质 铂金'))).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('山形戒指')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('山形吊坠')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).queryByText('李客服')).not.toBeInTheDocument()
  })

  it('edits outsource info from purchase detail and keeps siblings unchanged', async () => {
    const user = userEvent.setup()
    renderRoute('/purchases/o-202604-001')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    const necklaceRow = screen.getByText('OL-202604-001-03').closest('tr')
    expect(ringRow).not.toBeNull()
    expect(necklaceRow).not.toBeNull()

    await user.click(within(necklaceRow as HTMLElement).getByRole('button', { name: '查看商品行' }))
    await user.click(screen.getByRole('button', { name: '编辑跟单 / 下厂信息' }))
    await user.clear(screen.getByLabelText('跟单负责人'))
    await user.type(screen.getByLabelText('跟单负责人'), '吴跟单')
    await user.clear(screen.getByLabelText('工厂名称'))
    await user.type(screen.getByLabelText('工厂名称'), '广州链厂')
    await user.clear(screen.getByLabelText('下厂时间'))
    await user.type(screen.getByLabelText('下厂时间'), '2026-05-04')
    await user.clear(screen.getByLabelText('生产任务编号 / 货号'))
    await user.type(screen.getByLabelText('生产任务编号 / 货号'), 'SKU-NECK-OUT-01')
    await user.clear(screen.getByLabelText('工厂计划交期'))
    await user.type(screen.getByLabelText('工厂计划交期'), '2026-05-18')
    await user.selectOptions(screen.getByLabelText('委外状态'), 'pending')
    await user.clear(screen.getByLabelText('跟单备注 / 委外备注'))
    await user.type(screen.getByLabelText('跟单备注 / 委外备注'), '项链待广州链厂确认排产')
    await user.click(screen.getByRole('button', { name: '保存跟单' }))

    expect(screen.getByRole('status')).toHaveTextContent('已保存跟单 / 下厂信息')
    expect(screen.getByText('修改了商品行跟单 / 下厂信息')).toBeInTheDocument()
    expect(screen.getByText('广州链厂')).toBeInTheDocument()
    expect(screen.getAllByText('SKU-NECK-OUT-01').length).toBeGreaterThan(0)
    expect(within(necklaceRow as HTMLElement).getByText('吴跟单')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('山形戒指')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).queryByText('吴跟单')).not.toBeInTheDocument()
  })

  it('edits factory feedback from purchase detail and keeps siblings unchanged', async () => {
    const user = userEvent.setup()
    renderRoute('/purchases/o-202604-001')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    const necklaceRow = screen.getByText('OL-202604-001-03').closest('tr')
    expect(ringRow).not.toBeNull()
    expect(necklaceRow).not.toBeNull()

    await user.click(within(necklaceRow as HTMLElement).getByRole('button', { name: '查看商品行' }))
    await user.click(screen.getByRole('button', { name: '编辑工厂回传信息' }))
    await user.selectOptions(screen.getByLabelText('工厂状态'), 'pending_feedback')
    await user.clear(screen.getByLabelText('实际材质'))
    await user.type(screen.getByLabelText('实际材质'), '18K金回传')
    await user.clear(screen.getByLabelText('总重'))
    await user.type(screen.getByLabelText('总重'), '4.2g')
    await user.clear(screen.getByLabelText('净重'))
    await user.type(screen.getByLabelText('净重'), '4.0g')
    await user.type(screen.getByLabelText('主石信息'), '主石待确认')
    await user.type(screen.getByLabelText('工费明细'), '工费待核算')
    await user.type(screen.getByLabelText('工厂出货日期'), '2026-05-20')
    await user.clear(screen.getByLabelText('质检结果'))
    await user.type(screen.getByLabelText('质检结果'), '待复检')
    await user.clear(screen.getByLabelText('工厂备注'))
    await user.type(screen.getByLabelText('工厂备注'), '项链等待工厂补充照片')
    await user.click(screen.getByRole('button', { name: '保存回传' }))

    expect(screen.getByText('已保存工厂回传信息')).toBeInTheDocument()
    expect(screen.getByText('修改了商品行工厂回传信息')).toBeInTheDocument()
    expect(screen.getByText('18K金回传')).toBeInTheDocument()
    expect(screen.getByText('4.2g')).toBeInTheDocument()
    expect(screen.getAllByText('项链等待工厂补充照片').length).toBeGreaterThan(0)
    expect(within(necklaceRow as HTMLElement).getByText('工厂 工厂生产中')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('山形戒指')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).queryByText('项链等待工厂补充照片')).not.toBeInTheDocument()
  })

  it('adds logistics from purchase detail to only the selected order line', async () => {
    const user = userEvent.setup()
    renderRoute('/purchases/o-202604-001')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    const pendantRow = screen.getByText('OL-202604-001-02').closest('tr')
    const necklaceRow = screen.getByText('OL-202604-001-03').closest('tr')
    expect(ringRow).not.toBeNull()
    expect(pendantRow).not.toBeNull()
    expect(necklaceRow).not.toBeNull()

    await user.click(within(necklaceRow as HTMLElement).getByRole('button', { name: '查看商品行' }))
    await user.click(screen.getByRole('button', { name: '新增物流' }))
    await user.selectOptions(screen.getByLabelText('物流类型'), 'goods')
    await user.selectOptions(screen.getByLabelText('物流方向'), 'outbound')
    await user.type(screen.getByLabelText('快递公司'), '中通快递')
    await user.type(screen.getByLabelText('运单号'), 'ZT-NECK-NEW-001')
    await user.type(screen.getByLabelText('物流备注'), '项链单独发货')
    await user.click(screen.getByRole('button', { name: '保存物流' }))

    expect(screen.getByText('ZT-NECK-NEW-001')).toBeInTheDocument()
    expect(screen.getByText('为商品行 OL-202604-001-03 新增货品物流 ZT-NECK-NEW-001')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('物流 ZT-NECK-NEW-001')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('无物流')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('物流 SF202604280001')).toBeInTheDocument()

    const logisticsPanel = screen.getByText('物流记录').closest('.subtle-panel')
    expect(logisticsPanel).not.toBeNull()
    await user.click(within(logisticsPanel as HTMLElement).getByRole('button', { name: '编辑' }))
    await user.clear(screen.getByLabelText('运单号'))
    await user.type(screen.getByLabelText('运单号'), 'ZT-NECK-EDIT-001')
    await user.click(screen.getByRole('button', { name: '保存物流修改' }))

    expect(screen.getByText('ZT-NECK-EDIT-001')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('物流 ZT-NECK-EDIT-001')).toBeInTheDocument()

    await user.click(within(logisticsPanel as HTMLElement).getByRole('button', { name: '作废' }))
    await user.type(screen.getByLabelText('作废原因'), '项链改为到店自提')
    await user.click(screen.getByRole('button', { name: '确认作废' }))

    expect(screen.getByText('已作废')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('无物流')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('物流 SF202604280001')).toBeInTheDocument()
  })

  it('adds after-sales from purchase detail to only the selected order line', async () => {
    const user = userEvent.setup()
    renderRoute('/purchases/o-202604-001')

    const ringRow = screen.getByText('OL-202604-001-01').closest('tr')
    const pendantRow = screen.getByText('OL-202604-001-02').closest('tr')
    const necklaceRow = screen.getByText('OL-202604-001-03').closest('tr')
    expect(ringRow).not.toBeNull()
    expect(pendantRow).not.toBeNull()
    expect(necklaceRow).not.toBeNull()

    await user.click(within(necklaceRow as HTMLElement).getByRole('button', { name: '查看商品行' }))
    await user.click(screen.getByRole('button', { name: '新增售后' }))
    await user.selectOptions(screen.getByLabelText('售后类型'), 'repair')
    await user.selectOptions(screen.getByLabelText('售后状态'), 'waiting_return')
    await user.type(screen.getByLabelText('售后原因'), '项链扣头需要维修')
    await user.type(screen.getByLabelText('售后备注'), '等待客户寄回项链')
    await user.click(screen.getByRole('button', { name: '保存售后' }))

    expect(screen.getByText('项链扣头需要维修')).toBeInTheDocument()
    expect(screen.getByText('为商品行 OL-202604-001-03 新增维修售后：项链扣头需要维修')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('售后 待寄回')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('售后 待处理')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('无售后')).toBeInTheDocument()

    const afterSalesPanel = screen.getByText('售后记录').closest('.subtle-panel')
    expect(afterSalesPanel).not.toBeNull()
    await user.click(within(afterSalesPanel as HTMLElement).getByRole('button', { name: '编辑' }))
    await user.clear(screen.getByLabelText('售后原因'))
    await user.type(screen.getByLabelText('售后原因'), '项链扣头维修已受理')
    await user.click(screen.getByRole('button', { name: '保存售后修改' }))

    expect(screen.getByText('项链扣头维修已受理')).toBeInTheDocument()
    expect(screen.getByText('编辑售后')).toBeInTheDocument()

    await user.click(within(afterSalesPanel as HTMLElement).getByRole('button', { name: '关闭' }))
    expect(screen.getByText('关闭售后')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('售后 已关闭')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('售后 待处理')).toBeInTheDocument()
  })

  it('creates a purchase draft with multiple order-line cards', async () => {
    const user = userEvent.setup()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    renderRoute('/purchases/new')

    expect(screen.getByRole('heading', { name: '新建购买记录' })).toBeInTheDocument()
    expect(screen.getByText('先填写本次购买的公共信息，再逐件添加商品行。')).toBeInTheDocument()
    expect(screen.getByText('购买公共信息')).toBeInTheDocument()
    expect(screen.getByText('客户与收货信息')).toBeInTheDocument()
    expect(screen.getByText('付款信息')).toBeInTheDocument()
    expect(screen.getByText('商品行区域')).toBeInTheDocument()
    expect(screen.getByText('本次购买共 1 条商品行')).toBeInTheDocument()
    expect(screen.getByText('商品行 TEMP-01')).toBeInTheDocument()

    await user.type(screen.getByLabelText('平台订单号'), 'TB-202604-NEW')
    await user.type(screen.getByLabelText('客户姓名'), '张三')
    await user.type(screen.getByLabelText('应收总额'), '9000')
    await user.type(screen.getByLabelText('已收金额'), '3000')

    await user.click(screen.getByRole('button', { name: '添加商品行' }))
    await user.click(screen.getByRole('button', { name: '添加商品行' }))

    expect(screen.getByText('本次购买共 3 条商品行')).toBeInTheDocument()
    expect(screen.getByText('商品行 TEMP-01')).toBeInTheDocument()
    expect(screen.getByText('商品行 TEMP-02')).toBeInTheDocument()
    expect(screen.getByText('商品行 TEMP-03')).toBeInTheDocument()
    expect(screen.getByText('当前草稿：1 笔购买记录 + 3 条商品行。')).toBeInTheDocument()
    expect(screen.getByText('¥ 6,000')).toBeInTheDocument()

    const firstLineCard = screen.getByText('商品行 TEMP-01').closest('.subtle-panel')
    const secondLineCard = screen.getByText('商品行 TEMP-02').closest('.subtle-panel')
    const thirdLineCard = screen.getByText('商品行 TEMP-03').closest('.subtle-panel')
    expect(firstLineCard).not.toBeNull()
    expect(secondLineCard).not.toBeNull()
    expect(thirdLineCard).not.toBeNull()

    await user.selectOptions(within(firstLineCard as HTMLElement).getByLabelText('引用产品'), 'p-ring-001')
    expect(within(firstLineCard as HTMLElement).getByLabelText('商品名称')).toHaveValue('山形戒指')
    expect(within(firstLineCard as HTMLElement).getByText(/来源产品：山形素圈戒指/)).toBeInTheDocument()
    expect(within(firstLineCard as HTMLElement).getByText('请先选择规格')).toBeInTheDocument()
    expect(within(firstLineCard as HTMLElement).getByText(/资料完整度 5\/6/)).toBeInTheDocument()
    expect(within(firstLineCard as HTMLElement).getByRole('button', { name: '标记客服确认完成' })).toBeDisabled()

    await user.selectOptions(within(firstLineCard as HTMLElement).getByLabelText('规格'), 'spec-ring-16')
    await user.selectOptions(within(firstLineCard as HTMLElement).getByLabelText('材质'), '18K金')
    await user.selectOptions(within(firstLineCard as HTMLElement).getByLabelText('工艺'), '微镶')
    await user.click(within(firstLineCard as HTMLElement).getByRole('checkbox', { name: '刻字' }))
    expect(within(firstLineCard as HTMLElement).getByText(/面宽 3.8mm/)).toBeInTheDocument()
    expect(within(firstLineCard as HTMLElement).getByText('¥ 2,000')).toBeInTheDocument()
    expect(within(firstLineCard as HTMLElement).getByText(/资料完整度 6\/6/)).toBeInTheDocument()
    await user.click(within(firstLineCard as HTMLElement).getByRole('button', { name: '标记客服确认完成' }))
    expect(within(firstLineCard as HTMLElement).getByText('待设计')).toBeInTheDocument()

    await user.click(within(firstLineCard as HTMLElement).getByRole('button', { name: '查看来源产品' }))
    expect(screen.getByText('来源产品详情')).toBeInTheDocument()
    expect(screen.getByText('PD-RING-001')).toBeInTheDocument()
    expect(within(firstLineCard as HTMLElement).getByLabelText('货号 / SKU')).toHaveValue('PD-RING-001')
    expect(within(firstLineCard as HTMLElement).getByLabelText('生产任务编号')).toHaveValue('PD-RING-001')
    expect(within(firstLineCard as HTMLElement).getByLabelText('款式名称')).toHaveValue('山形戒指')
    expect(within(firstLineCard as HTMLElement).getByLabelText('版本号')).toHaveValue('v3')
    expect(screen.getByText('商品行参数对比')).toBeInTheDocument()
    expect(screen.getAllByText('16号').length).toBeGreaterThan(0)
    expect(screen.getAllByText('已调整').length).toBeGreaterThan(0)
    await user.click(screen.getAllByRole('button', { name: '关闭' })[0] as HTMLElement)

    await user.selectOptions(within(secondLineCard as HTMLElement).getByLabelText('引用产品'), 'p-pendant-001')
    expect(within(secondLineCard as HTMLElement).getByLabelText('商品名称')).toHaveValue('如意吊坠')
    expect(within(secondLineCard as HTMLElement).getByText(/来源产品：如意吊坠/)).toBeInTheDocument()

    await user.selectOptions(within(secondLineCard as HTMLElement).getByLabelText('规格'), 'spec-pendant-s')
    await user.selectOptions(within(secondLineCard as HTMLElement).getByLabelText('材质'), '18K金')
    await user.selectOptions(within(secondLineCard as HTMLElement).getByLabelText('工艺'), '珐琅')
    await user.click(within(secondLineCard as HTMLElement).getByRole('checkbox', { name: '附赠礼盒' }))
    expect(within(secondLineCard as HTMLElement).getByText(/长 16mm/)).toBeInTheDocument()
    expect(within(secondLineCard as HTMLElement).getByText('¥ 1,480')).toBeInTheDocument()

    await user.click(within(secondLineCard as HTMLElement).getByRole('button', { name: '查看来源产品' }))
    expect(screen.getByText('PD-PENDANT-001')).toBeInTheDocument()
    expect(screen.getAllByText('小号').length).toBeGreaterThan(0)
    await user.click(screen.getAllByRole('button', { name: '关闭' })[0] as HTMLElement)

    await user.type(within(thirdLineCard as HTMLElement).getByLabelText('商品名称'), '定制项链')

    await user.click(screen.getByRole('button', { name: '保存草稿' }))

    expect(screen.getByRole('status')).toHaveTextContent('已生成购买记录草稿：1 笔购买记录 + 3 条商品行')
    expect(logSpy).toHaveBeenCalledWith(
      'purchaseDraft',
      expect.objectContaining({
        commonInfo: expect.objectContaining({ platformOrderNo: 'TB-202604-NEW' }),
        customerShippingInfo: expect.objectContaining({ customerName: '张三' }),
        paymentInfo: expect.objectContaining({ pendingAmount: 6000, paymentStatus: '部分收款', canShip: false })
      })
    )
    expect(logSpy).toHaveBeenCalledWith(
      'orderLineDrafts',
      expect.arrayContaining([
        expect.objectContaining({
          tempLineNo: 'TEMP-01',
          sourceProductId: 'p-ring-001',
          selectedSpecId: 'spec-ring-16',
          productName: '山形戒指',
          productionTaskNo: 'PD-RING-001',
          skuCode: 'PD-RING-001',
          styleName: '山形戒指',
          versionNo: 'v3',
          lineStatus: 'pending_design',
          needsDesign: true,
          needsModeling: false,
          quoteResult: expect.objectContaining({ systemQuote: 2000 })
        }),
        expect.objectContaining({
          tempLineNo: 'TEMP-02',
          sourceProductId: 'p-pendant-001',
          selectedSpecId: 'spec-pendant-s',
          productName: '如意吊坠',
          quoteResult: expect.objectContaining({ systemQuote: 1480 })
        }),
        expect.objectContaining({ tempLineNo: 'TEMP-03', productName: '定制项链', quoteResult: undefined })
      ])
    )
  })

  it('validates, duplicates and removes purchase draft order-line cards', async () => {
    const user = userEvent.setup()
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    renderRoute('/purchases/new')

    await user.click(screen.getByRole('button', { name: '保存草稿' }))
    expect(screen.getByRole('alert')).toHaveTextContent('请填写客户姓名。')

    await user.type(screen.getByLabelText('客户姓名'), '李四')
    await user.type(screen.getByLabelText('已收金额'), '100')
    await user.click(screen.getByRole('button', { name: '保存草稿' }))
    expect(screen.getByRole('alert')).toHaveTextContent('已收金额不能大于应收总额。')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('应收总额'), '1000')
    await user.clear(screen.getByLabelText('已收金额'))
    await user.type(screen.getByLabelText('已收金额'), '1200')
    await user.click(screen.getByRole('button', { name: '保存草稿' }))
    expect(screen.getByRole('alert')).toHaveTextContent('已收金额不能大于应收总额。')

    await user.clear(screen.getByLabelText('已收金额'))
    await user.type(screen.getByLabelText('已收金额'), '500')
    await user.click(screen.getByRole('button', { name: '保存草稿' }))
    expect(screen.getByRole('alert')).toHaveTextContent('商品行 TEMP-01 需要填写商品名称。')

    const firstLineCard = screen.getByText('商品行 TEMP-01').closest('.subtle-panel')
    expect(firstLineCard).not.toBeNull()
    expect(within(firstLineCard as HTMLElement).getByRole('button', { name: '删除商品行' })).toBeDisabled()

    await user.selectOptions(within(firstLineCard as HTMLElement).getByLabelText('引用产品'), 'p-ring-001')
    await user.click(screen.getByRole('button', { name: '保存草稿' }))
    expect(screen.getByRole('alert')).toHaveTextContent('商品行 TEMP-01 引用产品时需要选择规格。')

    await user.selectOptions(within(firstLineCard as HTMLElement).getByLabelText('引用产品'), '')
    await user.type(within(firstLineCard as HTMLElement).getByLabelText('商品名称'), '手动定制戒指')
    await user.click(within(firstLineCard as HTMLElement).getByRole('button', { name: '复制商品行' }))

    expect(screen.getByText('本次购买共 2 条商品行')).toBeInTheDocument()
    const secondLineCard = screen.getByText('商品行 TEMP-02').closest('.subtle-panel')
    expect(secondLineCard).not.toBeNull()
    expect(within(secondLineCard as HTMLElement).getByLabelText('商品名称')).toHaveValue('手动定制戒指')

    await user.click(within(secondLineCard as HTMLElement).getByRole('button', { name: '删除商品行' }))
    expect(screen.getByText('本次购买共 1 条商品行')).toBeInTheDocument()
    expect(screen.queryByText('商品行 TEMP-02')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '保存草稿' }))
    expect(screen.getByRole('status')).toHaveTextContent('已生成购买记录草稿：1 笔购买记录 + 1 条商品行')
  })

  it('renders lightweight customer center list from current mainline data', () => {
    renderRoute('/customers')

    expect(screen.getByRole('heading', { name: '客户中心' })).toBeInTheDocument()
    expect(screen.getByText('客户中心第一版只读展示客户历史购买记录、商品行和售后摘要。')).toBeInTheDocument()
    expect(screen.getByText('当前购买记录')).toBeInTheDocument()
    expect(screen.getByText('当前商品行')).toBeInTheDocument()
    expect(screen.getByText('当前售后')).toBeInTheDocument()
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('13800001234')).toBeInTheDocument()
    expect(screen.getByText('zhangsan_jewelry')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '查看客户' })).toHaveAttribute('href', '/customers/customer-zhang-001')
  })

  it('renders customer detail with purchase, order-line and after-sales history', () => {
    renderRoute('/customers/customer-zhang-001')

    expect(screen.getByRole('heading', { name: '客户详情' })).toBeInTheDocument()
    expect(screen.getByText('客户详情只做历史归集；购买执行仍进入购买记录和商品行中心。')).toBeInTheDocument()
    expect(screen.getByText('客户基础信息')).toBeInTheDocument()
    expect(screen.getByText('当前购买记录数')).toBeInTheDocument()
    expect(screen.getByText('外部导入统计参考')).toBeInTheDocument()
    expect(screen.getByText('以下为客户 mock 保留的历史兼容字段，不作为当前系统内购买记录、商品行或售后列表的数量来源。')).toBeInTheDocument()
    expect(screen.getByText('历史购买记录')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PUR-202604-001' })).toHaveAttribute('href', '/purchases/o-202604-001')
    expect(screen.getByText('历史商品行')).toBeInTheDocument()
    expect(screen.getByText('OL-202604-001-01')).toBeInTheDocument()
    expect(screen.getByText('OL-202604-001-02')).toBeInTheDocument()
    expect(screen.getByText('OL-202604-001-03')).toBeInTheDocument()
    expect(screen.getByText('OL-202604-001-04')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '查看商品行' })[0]).toHaveAttribute('href', '/order-lines')
    expect(screen.getByText('历史售后摘要')).toBeInTheDocument()
    expect(screen.getByText('客户反馈戒围可能偏紧')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回客户中心' })).toHaveAttribute('href', '/customers')
  })

  it('shows current customer aggregation counts without stale total fallback', () => {
    const overview = buildCustomerOverview({
      customer: {
        ...customerMock,
        totalTransactionCount: 9,
        totalOrderLineCount: 8,
        totalAfterSalesCount: 7
      },
      purchases: [],
      orderLines: [],
      afterSalesCases: []
    })

    render(
      <MemoryRouter>
        <CustomerListTable overviews={[overview]} />
      </MemoryRouter>
    )

    const row = screen.getByText('张三').closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getAllByText('0')).toHaveLength(3)
    expect(within(row as HTMLElement).queryByText('9')).not.toBeInTheDocument()
    expect(within(row as HTMLElement).queryByText('8')).not.toBeInTheDocument()
    expect(within(row as HTMLElement).queryByText('7')).not.toBeInTheDocument()

    cleanup()

    render(<CustomerBasicSection overview={overview} />)

    expect(screen.getAllByText('0')).toHaveLength(3)
    expect(screen.queryByText('9')).not.toBeInTheDocument()
    expect(screen.queryByText('8')).not.toBeInTheDocument()
    expect(screen.queryByText('7')).not.toBeInTheDocument()
  })

  it('renders task list route', () => {
    const { container } = renderRoute('/tasks')

    expect(screen.getByRole('heading', { name: '任务中心' })).toBeInTheDocument()
    expect(screen.getByText('商品行任务分组')).toBeInTheDocument()
    expect(screen.getByText('待建模')).toBeInTheDocument()
    expect(screen.getByText('待财务确认')).toBeInTheDocument()
    expect(screen.getByText('确认戒指最终圈号')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '返回商品行中心' })).toHaveAttribute('href', '/order-lines')
    expect(screen.getAllByRole('link', { name: 'OL-202604-001-01 · 山形素圈戒指' })[0]).toHaveAttribute('href', '/order-lines')
    expect(screen.getAllByRole('link', { name: 'SO-202604-001' })[0]).toHaveAttribute('href', '/purchases/o-202604-001')
    expect(screen.queryByText('订单商品')).not.toBeInTheDocument()
    expect(screen.queryByText('返回订单')).not.toBeInTheDocument()
    expect(screen.queryByText('查看订单')).not.toBeInTheDocument()
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('renders task detail route', () => {
    const { container } = renderRoute('/tasks/task-order-001')

    expect(screen.getByRole('heading', { name: '任务详情' })).toBeInTheDocument()
    expect(screen.getByText('顶部任务概览')).toBeInTheDocument()
    expect(screen.getAllByText('SO-202604-001').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: '查看商品行' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'SO-202604-001' })[0]).toHaveAttribute('href', '/purchases/o-202604-001')
    expect(screen.queryByText('订单商品')).not.toBeInTheDocument()
    expect(screen.queryByText('返回订单')).not.toBeInTheDocument()
    expect(screen.queryByText('查看订单')).not.toBeInTheDocument()
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('writes task status updates to the current purchase timeline', async () => {
    const user = userEvent.setup()
    const { container } = renderRoute('/tasks/task-order-001')

    await user.click(screen.getByRole('button', { name: '标记完成' }))

    expect(await screen.findByText('完成确认戒指最终圈号')).toBeInTheDocument()
    expect(screen.getByText('任务已完成，当前责任人：张晨')).toBeInTheDocument()
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('renders production follow-up tabs from current order lines', async () => {
    const user = userEvent.setup()
    const { container } = renderRoute('/production-follow-up')

    expect(screen.getByRole('heading', { name: '生产跟进' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '切换到待跟单审核' })).toBeInTheDocument()
    expect(screen.getByText('复古耳钉')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '切换到待下发生产' }))
    expect(screen.getByText('胸针补石')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '切换到生产中' }))
    expect(screen.getByText('山形戒指')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '切换到异常 / 逾期' }))
    expect(screen.getByText('胸针补石')).toBeInTheDocument()
    expect(screen.getByText('已逾期')).toBeInTheDocument()
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('updates production follow-up status through current order-line state', async () => {
    const user = userEvent.setup()
    const { container } = renderRoute('/production-follow-up')

    await user.clear(screen.getByLabelText('工厂-ol-zhang-earring-review-001'))
    await user.type(screen.getByLabelText('工厂-ol-zhang-earring-review-001'), 'factory-demo-001')
    await user.type(screen.getByLabelText('计划交期-ol-zhang-earring-review-001'), '2026-05-06')
    await user.click(screen.getByRole('button', { name: '保存工厂计划' }))
    expect(screen.getByDisplayValue('factory-demo-001')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '标记资料已齐' }))
    expect(screen.getAllByText('待下发生产').length).toBeGreaterThan(0)
    expect(screen.getByText('复古耳钉')).toBeInTheDocument()

    const earringRow = screen.getByText('复古耳钉').closest('tr')
    expect(earringRow).not.toBeNull()

    await user.click(within(earringRow as HTMLElement).getByRole('button', { name: '下发生产' }))
    expect(screen.getAllByText('待工厂接收').length).toBeGreaterThan(0)

    await user.click(within(earringRow as HTMLElement).getByRole('button', { name: '标记生产中' }))
    expect(screen.getAllByText('生产中').length).toBeGreaterThan(0)
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('renders design modeling workbench from current order lines', async () => {
    const user = userEvent.setup()
    const { container } = renderRoute('/design-modeling')

    expect(screen.getByRole('heading', { name: '设计 / 建模工作台' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '切换到待设计' })).toBeInTheDocument()
    expect(screen.getByText('定制项链')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '切换到待建模' }))
    expect(screen.getByText('手链蜡版确认')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '切换到待修改' }))
    expect(screen.getByDisplayValue('客户要求吊牌山形弧线更柔和。')).toBeInTheDocument()

    expect(screen.queryByText('张三')).not.toBeInTheDocument()
    expect(screen.queryByText('8500')).not.toBeInTheDocument()
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('updates design and modeling status from the workbench', async () => {
    const user = userEvent.setup()
    const { container } = renderRoute('/design-modeling')

    await user.click(screen.getByRole('button', { name: '切换到待设计' }))
    const necklaceRow = screen.getByText('定制项链').closest('tr')
    expect(necklaceRow).not.toBeNull()

    await user.clear(within(necklaceRow as HTMLElement).getByLabelText('设计备注-ol-zhang-necklace-001'))
    await user.type(within(necklaceRow as HTMLElement).getByLabelText('设计备注-ol-zhang-necklace-001'), '第二版设计已确认')
    await user.click(within(necklaceRow as HTMLElement).getByRole('button', { name: '标记设计完成' }))

    expect(screen.getAllByText('待建模').length).toBeGreaterThan(0)
    expect(screen.getByText('定制项链')).toBeInTheDocument()
    const updatedNecklaceRow = screen.getByText('定制项链').closest('tr')
    expect(updatedNecklaceRow).not.toBeNull()

    await user.type(within(updatedNecklaceRow as HTMLElement).getByLabelText('出蜡文件-ol-zhang-necklace-001'), '项链出蜡文件.3dm')
    await user.type(within(updatedNecklaceRow as HTMLElement).getByLabelText('发送出蜡厂时间-ol-zhang-necklace-001'), '2026-05-04 10:00')
    await user.click(within(updatedNecklaceRow as HTMLElement).getByRole('button', { name: '记录出蜡资料' }))
    expect(within(updatedNecklaceRow as HTMLElement).getByText((_, node) => node?.textContent === '设计文件 0 / 建模文件 0 / 出蜡文件 1')).toBeInTheDocument()

    await user.click(within(updatedNecklaceRow as HTMLElement).getByRole('button', { name: '标记建模完成' }))
    expect(screen.getAllByText('已完成').length).toBeGreaterThan(0)
    expect(screen.getByText('定制项链')).toBeInTheDocument()
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('renders factory center without customer or finance fields', async () => {
    const user = userEvent.setup()
    const { container } = renderRoute('/factory')

    expect(screen.getByRole('heading', { name: '工厂协同中心' })).toBeInTheDocument()
    expect(screen.getByText('当前工厂：苏州金工厂。本页只显示分配给当前工厂的商品行生产任务，不展示客户联系方式、地址、销售价格、定金、尾款、利润或财务备注。')).toBeInTheDocument()
    expect(screen.getByText('山形胸针试产')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '切换到生产中' }))
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.queryByText('山形吊坠')).not.toBeInTheDocument()

    expect(screen.queryByText('张三')).not.toBeInTheDocument()
    expect(screen.queryByText('TB-9938201')).not.toBeInTheDocument()
    expect(screen.queryByText('8500')).not.toBeInTheDocument()
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('updates factory production return through current order-line state', async () => {
    const user = userEvent.setup()
    const { container } = renderRoute('/factory')

    const pendingRow = screen.getByText('山形胸针试产').closest('tr')
    expect(pendingRow).not.toBeNull()

    await user.click(within(pendingRow as HTMLElement).getByRole('button', { name: '接收任务' }))
    expect(screen.getAllByText('工厂已接收').length).toBeGreaterThan(0)

    const acceptedRow = screen.getByText('山形胸针试产').closest('tr')
    expect(acceptedRow).not.toBeNull()
    await user.click(within(acceptedRow as HTMLElement).getByRole('button', { name: '标记开始生产' }))
    expect(screen.getAllByText('工厂生产中').length).toBeGreaterThan(0)

    const producingRow = screen.getByText('山形胸针试产').closest('tr')
    expect(producingRow).not.toBeNull()
    await user.click(within(producingRow as HTMLElement).getByRole('button', { name: '标记生产完成' }))
    expect(screen.getAllByText('待回传').length).toBeGreaterThan(0)

    const returnRow = screen.getByText('山形胸针试产').closest('tr')
    expect(returnRow).not.toBeNull()
    await user.clear(within(returnRow as HTMLElement).getByLabelText('总重'))
    await user.type(within(returnRow as HTMLElement).getByLabelText('总重'), '5.2')
    await user.clear(within(returnRow as HTMLElement).getByLabelText('净金重'))
    await user.type(within(returnRow as HTMLElement).getByLabelText('净金重'), '4.8')
    await user.clear(within(returnRow as HTMLElement).getByLabelText('实际材质'))
    await user.type(within(returnRow as HTMLElement).getByLabelText('实际材质'), '18K金')
    await user.type(within(returnRow as HTMLElement).getByLabelText('基础工费'), '280')
    await user.type(within(returnRow as HTMLElement).getByLabelText('附加工费'), '60')
    await user.type(within(returnRow as HTMLElement).getByLabelText('成品图文件'), 'pin-finished.jpg')
    await user.type(within(returnRow as HTMLElement).getByLabelText('结算单文件'), 'pin-settlement.pdf')
    await user.type(within(returnRow as HTMLElement).getByLabelText('工厂备注-ol-zhang-factory-pending-001'), '生产数据已回传')
    await user.click(within(returnRow as HTMLElement).getByRole('button', { name: '提交回传' }))

    expect(screen.getAllByText('工厂已回传').length).toBeGreaterThan(0)
    expect(screen.getByText('山形胸针试产')).toBeInTheDocument()
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('renders finance center from current purchase and order-line data', async () => {
    const user = userEvent.setup()
    const { container } = renderRoute('/finance')

    expect(screen.getByRole('heading', { name: '财务中心' })).toBeInTheDocument()
    expect(screen.getByText('财务中心围绕 Purchase 金额汇总和 OrderLine 工厂回传数据做确认、异常标记和锁定，不推进设计、建模或生产状态。')).toBeInTheDocument()
    expect(screen.getByText('山形吊坠')).toBeInTheDocument()
    expect(screen.getByText('PUR-202604-001')).toBeInTheDocument()
    expect(screen.getByText('待确认尾款')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '切换到财务异常' }))
    expect(screen.getByText('胸针补石')).toBeInTheDocument()
    expect(screen.getByText('工厂异常')).toBeInTheDocument()

    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('confirms finance settlement and final payment without changing production ownership', async () => {
    const user = userEvent.setup()
    const { container } = renderRoute('/finance')

    await user.click(screen.getByRole('button', { name: '确认尾款' }))
    expect(screen.getByText('尾款：已确认')).toBeInTheDocument()

    const pendantRow = screen.getByText('山形吊坠').closest('tr')
    expect(pendantRow).not.toBeNull()
    await user.clear(within(pendantRow as HTMLElement).getByLabelText('工厂结算金额-oi-pendant-001'))
    await user.type(within(pendantRow as HTMLElement).getByLabelText('工厂结算金额-oi-pendant-001'), '560')
    await user.type(within(pendantRow as HTMLElement).getByLabelText('财务备注-oi-pendant-001'), '工厂结算确认')
    await user.click(within(pendantRow as HTMLElement).getByRole('button', { name: '确认工厂结算' }))

    expect(screen.getAllByText('财务已确认').length).toBeGreaterThan(0)
    expect(screen.getByText('山形吊坠')).toBeInTheDocument()
    expect(screen.queryByText('标记生产中')).not.toBeInTheDocument()
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('renders management dashboard from current workflow metrics', () => {
    const { container } = renderRoute('/management')

    expect(screen.getByRole('heading', { name: '管理看板' })).toBeInTheDocument()
    expect(screen.getByText('管理看板基于 Purchase 与 OrderLine 的 current workflow 汇总业务、生产、财务、角色负载和工厂表现，不参与具体录入。')).toBeInTheDocument()
    expect(screen.getByText('业务总览')).toBeInTheDocument()
    expect(screen.getByText('商品行状态分布')).toBeInTheDocument()
    expect(screen.getByText('生产风险')).toBeInTheDocument()
    expect(screen.getByText('财务概览')).toBeInTheDocument()
    expect(screen.getByText('角色负载')).toBeInTheDocument()
    expect(screen.getByText('工厂表现')).toBeInTheDocument()
    expect(screen.getByText('跟单待审核')).toBeInTheDocument()
    expect(screen.getByText('factory-suzhou-gold-001')).toBeInTheDocument()
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('switches mock roles and limits primary navigation by capability', async () => {
    const user = userEvent.setup()
    const { container } = renderRoute('/')
    const roleSelect = screen.getAllByLabelText('角色模式')[0]
    const sidebarNav = container.querySelector('.sidebar-nav')
    expect(sidebarNav).not.toBeNull()
    const nav = within(sidebarNav as HTMLElement)

    await user.selectOptions(roleSelect, 'factory')
    expect(nav.getByRole('link', { name: /工厂/ })).toBeInTheDocument()
    expect(nav.getByRole('link', { name: /生产/ })).toBeInTheDocument()
    expect(nav.queryByRole('link', { name: /仓库/ })).not.toBeInTheDocument()
    expect(nav.queryByRole('link', { name: /财务/ })).not.toBeInTheDocument()
    expect(nav.queryByRole('link', { name: /管理/ })).not.toBeInTheDocument()

    await user.selectOptions(roleSelect, 'warehouse')
    expect(nav.getByRole('link', { name: /仓库/ })).toBeInTheDocument()
    expect(nav.getByRole('link', { name: /商品行/ })).toBeInTheDocument()
    expect(nav.queryByRole('link', { name: /财务/ })).not.toBeInTheDocument()
    expect(nav.queryByRole('link', { name: /工厂/ })).not.toBeInTheDocument()

    await user.selectOptions(roleSelect, 'finance')
    expect(nav.getByRole('link', { name: /财务/ })).toBeInTheDocument()
    expect(nav.queryByRole('link', { name: /工厂/ })).not.toBeInTheDocument()

    await user.selectOptions(roleSelect, 'designer')
    expect(nav.getByRole('link', { name: /设计/ })).toBeInTheDocument()

    await user.selectOptions(roleSelect, 'modeler')
    expect(nav.getByRole('link', { name: /设计/ })).toBeInTheDocument()

    await user.selectOptions(roleSelect, 'merchandiser')
    expect(nav.getByRole('link', { name: /跟进/ })).toBeInTheDocument()

    await user.selectOptions(roleSelect, 'manager')
    expect(nav.getByRole('link', { name: /管理/ })).toBeInTheDocument()
  })

  it('renders inventory item management as warehouse ledger without legacy orders', async () => {
    const user = userEvent.setup()
    const { container } = renderRoute('/inventory')

    expect(screen.getByRole('heading', { name: '仓库商品管理' })).toBeInTheDocument()
    expect(screen.getByText('仓库商品管理是库存资产台账，记录设计留样、客户退货、常备采购和其他库存；它可以关联 Product / Purchase / OrderLine，但不替代产品模板或商品行执行流。')).toBeInTheDocument()
    expect(screen.getByText('库存台账')).toBeInTheDocument()
    expect(screen.getByText('入库登记')).toBeInTheDocument()
    expect(screen.getByText('库存流转')).toBeInTheDocument()
    expect(screen.getByText('库存流转记录')).toBeInTheDocument()
    expect(screen.getByText('库存详情与来源追溯')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '客户退货' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '待检 / 瑕疵' })).toBeInTheDocument()
    expect(screen.getAllByText('山形素圈戒指设计留样').length).toBeGreaterThan(0)
    expect(screen.getByText('客户退回山形戒指')).toBeInTheDocument()
    expect(screen.getByText('通用 18K 项链链身')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '查看购买记录' })).toHaveAttribute('href', '/purchases/o-202604-001')
    expect(screen.getAllByRole('link', { name: '查看产品模板' }).length).toBeGreaterThan(0)
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()

    await user.selectOptions(screen.getByLabelText('来源筛选'), 'customer_return')
    expect(screen.getByText('客户退回山形戒指')).toBeInTheDocument()
    expect(screen.getAllByText('INV-RT-202604-002').length).toBeGreaterThan(0)

    await user.selectOptions(screen.getByLabelText('来源筛选'), 'all')
    await user.type(screen.getByLabelText('库位筛选'), '常备链身')
    expect(screen.getByText('通用 18K 项链链身')).toBeInTheDocument()
    expect(screen.queryByText('客户退回山形戒指')).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('库位筛选'))
    await user.click(screen.getByRole('button', { name: '待检 / 瑕疵' }))
    expect(screen.getByText('客户退回山形戒指')).toBeInTheDocument()
    expect(screen.queryByText('通用 18K 项链链身')).not.toBeInTheDocument()

    const returnRow = screen
      .getAllByText('INV-RT-202604-002')
      .map((element) => element.closest('tr'))
      .find((row) => row && within(row).queryByRole('button', { name: '查看详情' }))
    expect(returnRow).not.toBeNull()
    await user.click(within(returnRow as HTMLElement).getByRole('button', { name: '查看详情' }))
    expect(screen.getByText('来源追溯')).toBeInTheDocument()
    expect(screen.getAllByText('产品：山形素圈戒指 / 商品行：OL-202604-001-01 / 购买记录：PUR-202604-001 / 客户：张三').length).toBeGreaterThan(0)
    expect(screen.getAllByText('客户退货入库，进入待检库位。').length).toBeGreaterThan(0)
  })

  it('records inventory inbound and movement actions locally', async () => {
    const user = userEvent.setup()
    renderRoute('/inventory')

    await user.type(screen.getByLabelText('商品名称'), '设计部门未售样戒')
    await user.selectOptions(screen.getByLabelText('入库来源'), 'design_sample')
    await user.type(screen.getByLabelText('材质'), '银版')
    const quantityInputs = screen.getAllByLabelText('数量')
    await user.clear(quantityInputs[0] as HTMLElement)
    await user.type(quantityInputs[0] as HTMLElement, '2')
    await user.click(screen.getByRole('button', { name: '登记入库' }))

    expect(screen.getByText(/已新增入库/)).toBeInTheDocument()
    expect(screen.getAllByText('设计部门未售样戒').length).toBeGreaterThan(0)

    const movementItemSelect = screen.getByLabelText('库存商品')
    await user.selectOptions(movementItemSelect, Array.from((movementItemSelect as HTMLSelectElement).options).find((option) => option.text.includes('设计部门未售样戒'))?.value || '')
    await user.selectOptions(screen.getByLabelText('操作类型'), 'reserve')
    await user.clear(screen.getAllByLabelText('数量')[1] as HTMLElement)
    await user.type(screen.getAllByLabelText('数量')[1] as HTMLElement, '1')
    await user.type(screen.getAllByLabelText('备注')[1] as HTMLElement, '为后续拍摄预占')
    await user.click(screen.getByRole('button', { name: '登记流转' }))

    expect(screen.getByText(/已登记占用/)).toBeInTheDocument()
    expect(screen.getAllByText('为后续拍摄预占').length).toBeGreaterThan(0)
  })

  it('renders production plan list route without requiring factory role', () => {
    const { container } = renderRoute('/production-plan')

    expect(screen.getByRole('heading', { name: '工厂生产计划' })).toBeInTheDocument()
    expect(screen.getByText('RING-SH-016')).toBeInTheDocument()
    expect(screen.getByText('购买记录 PUR-202604-001')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '山形戒指' })[0]).toHaveAttribute('href', '/order-lines')
    expect(screen.getByRole('link', { name: '查看商品行' })).toHaveAttribute('href', '/order-lines')
    expect(screen.getByRole('link', { name: '查看购买记录' })).toHaveAttribute('href', '/purchases/o-202604-001')
    expect(screen.queryByText('订单商品')).not.toBeInTheDocument()
    expect(screen.queryByText('查看订单')).not.toBeInTheDocument()
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
    expect(screen.queryByText('页面说明')).not.toBeInTheDocument()
  })

  it('renders production plan detail route', () => {
    const { container } = renderRoute('/production-plan/task-factory-001')

    expect(screen.getByRole('heading', { name: '生产任务详情' })).toBeInTheDocument()
    expect(screen.getByText('来源追溯')).toBeInTheDocument()
    expect(screen.getAllByText('PD-RING-001').length).toBeGreaterThan(0)
    expect(screen.getByText('购买记录')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PUR-202604-001' })).toHaveAttribute('href', '/purchases/o-202604-001')
    expect(screen.getAllByText('商品行').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '查看商品行' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查看购买记录' })).toBeInTheDocument()
    expect(screen.queryByText('订单商品')).not.toBeInTheDocument()
    expect(screen.queryByText('查看订单')).not.toBeInTheDocument()
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('updates production plan status actions through order-line production info', async () => {
    const user = userEvent.setup()
    const { container } = renderRoute('/production-plan/task-factory-001')

    expect(screen.getByLabelText('工厂状态')).toHaveValue('in_progress')
    expect(screen.getAllByText('生产中').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '标记待回传' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '标记待回传' }))

    expect(screen.getByLabelText('工厂状态')).toHaveValue('pending_feedback')
    expect(screen.getAllByText('待回传').length).toBeGreaterThan(0)

    await user.clear(screen.getByLabelText('回传重量'))
    await user.type(screen.getByLabelText('回传重量'), '5.8g')
    await user.clear(screen.getByLabelText('质检结论'))
    await user.type(screen.getByLabelText('质检结论'), '生产计划回传通过')
    await user.clear(screen.getByLabelText('工厂备注'))
    await user.type(screen.getByLabelText('工厂备注'), '生产计划详情页写回商品行生产信息')

    expect(screen.getByLabelText('回传重量')).toHaveValue('5.8g')
    expect(screen.getByLabelText('质检结论')).toHaveValue('生产计划回传通过')
    expect(screen.getByLabelText('工厂备注')).toHaveValue('生产计划详情页写回商品行生产信息')
    expect(container.querySelector('a[href^="/orders"]')).toBeNull()
  })

  it('opens product reference records drawer from product detail', async () => {
    const user = userEvent.setup()
    renderRoute('/products/p-ring-001')

    await user.click(screen.getByRole('button', { name: '查看全部引用记录' }))

    expect(screen.getByText('产品引用记录')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'OL-202604-001-01 · 山形素圈戒指' })[0]).toHaveAttribute('href', '/order-lines')
    expect(screen.getAllByRole('link', { name: 'SO-202604-001' })[0]).toHaveAttribute('href', '/purchases/o-202604-001')
    expect(screen.queryByText('订单商品')).not.toBeInTheDocument()
  })

  it('opens product version history drawer from product detail', async () => {
    const user = userEvent.setup()
    renderRoute('/products/p-ring-001')

    await user.click(screen.getByRole('button', { name: '查看版本记录' }))

    expect(screen.getByText('产品版本记录')).toBeInTheDocument()
    expect(screen.getByText('v3 · 陈设计')).toBeInTheDocument()
  })

})
