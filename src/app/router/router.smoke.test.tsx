import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

  it('renders order detail with product picker modal from query', () => {
    renderRoute('/orders/o-202604-001?modal=product-picker&itemId=oi-ring-001')
    expect(screen.getAllByText('设计建模').length).toBeGreaterThan(0)
    expect(screen.getByText('产品引用选择器')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认引用' })).toBeInTheDocument()
  })

  it('renders order-line center as one row per product', () => {
    renderRoute('/order-lines')

    expect(screen.getByRole('heading', { name: '商品行中心' })).toBeInTheDocument()
    expect(screen.getByText('一行代表一件商品，支持独立推进设计、生产、发货与售后。')).toBeInTheDocument()
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.getByText('山形吊坠')).toBeInTheDocument()
    expect(screen.getByText('定制项链')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'PUR-202604-001' }).length).toBeGreaterThan(0)
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
    await user.click(screen.getByRole('button', { name: '关闭' }))

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
    await user.selectOptions(screen.getByLabelText('目标状态'), 'pending_shipment')
    await user.click(screen.getByRole('button', { name: '更新状态' }))

    expect(screen.getByRole('status')).toHaveTextContent('已将状态从 生产中 更新为 待发货')
    expect(within(ringRow as HTMLElement).getByText('待发货')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('待发货')).toBeInTheDocument()
    expect(within(necklaceRow as HTMLElement).getByText('设计中')).toBeInTheDocument()
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
  })

  it('renders purchase routes without replacing legacy orders routes', () => {
    renderRoute('/purchases/o-202604-001')

    expect(screen.getByRole('heading', { name: '购买记录详情' })).toBeInTheDocument()
    expect(screen.getByText('购买记录详情是归组页，用来查看一次购买的公共信息和本次购买下的所有商品行。')).toBeInTheDocument()
    expect(screen.getByText('PUR-202604-001')).toBeInTheDocument()
    expect(screen.getByText('客户与收货信息')).toBeInTheDocument()
    expect(screen.getByText('付款总览')).toBeInTheDocument()
    expect(screen.getByText('商品行数量')).toBeInTheDocument()
    expect(screen.getByText('本次商品行列表')).toBeInTheDocument()
    expect(screen.getByText('山形戒指')).toBeInTheDocument()
    expect(screen.getByText('山形吊坠')).toBeInTheDocument()
    expect(screen.getByText('定制项链')).toBeInTheDocument()
    expect(screen.getByText('生产中')).toBeInTheDocument()
    expect(screen.getByText('待发货')).toBeInTheDocument()
    expect(screen.getByText('设计中')).toBeInTheDocument()
    expect(screen.getByText('备注与日志')).toBeInTheDocument()
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

    expect(screen.getByRole('status')).toHaveTextContent('已将状态从 设计中 更新为 已完成')
    expect(within(necklaceRow as HTMLElement).getByText('已完成')).toBeInTheDocument()
    expect(within(ringRow as HTMLElement).getByText('生产中')).toBeInTheDocument()
    expect(within(pendantRow as HTMLElement).getByText('待发货')).toBeInTheDocument()
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

    await user.selectOptions(within(firstLineCard as HTMLElement).getByLabelText('规格'), 'spec-ring-16')
    await user.selectOptions(within(firstLineCard as HTMLElement).getByLabelText('材质'), '18K金')
    await user.selectOptions(within(firstLineCard as HTMLElement).getByLabelText('工艺'), '微镶')
    await user.click(within(firstLineCard as HTMLElement).getByRole('checkbox', { name: '刻字' }))
    expect(within(firstLineCard as HTMLElement).getByText(/面宽 3.8mm/)).toBeInTheDocument()
    expect(within(firstLineCard as HTMLElement).getByText('¥ 2,000')).toBeInTheDocument()

    await user.click(within(firstLineCard as HTMLElement).getByRole('button', { name: '查看来源产品' }))
    expect(screen.getByText('来源产品详情')).toBeInTheDocument()
    expect(screen.getByText('PD-RING-001')).toBeInTheDocument()
    expect(screen.getByText('商品行参数对比')).toBeInTheDocument()
    expect(screen.getAllByText('16号').length).toBeGreaterThan(0)
    expect(screen.getAllByText('已调整').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: '关闭' }))

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
    await user.click(screen.getByRole('button', { name: '关闭' }))

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

  it('expands order item when clicking summary area', async () => {
    const user = userEvent.setup()
    renderRoute('/orders/o-202604-001')

    await user.click(screen.getByRole('button', { name: '展开商品：山形吊坠' }))

    expect(screen.getByRole('button', { name: '收起商品：山形吊坠' })).toBeInTheDocument()
  })

  it('collapses opened order item blocks with one action', async () => {
    const user = userEvent.setup()
    renderRoute('/orders/o-202604-001')

    await user.click(screen.getByRole('button', { name: '一键收起区块' }))

    expect(screen.getAllByText('展开本区').length).toBeGreaterThan(0)
    expect(screen.queryByText('当前已收起，点击“展开本区”查看或编辑这一部分内容。')).not.toBeInTheDocument()
  })

  it('shows engraving fields and supports uploading engraving files in order detail', async () => {
    const user = userEvent.setup()
    renderRoute('/orders/o-202604-001')

    expect(screen.getByLabelText('刻字内容')).toHaveValue('ZS')
    expect(screen.getByText('戒指内圈刻字示意图.jpg')).toBeInTheDocument()
    expect(screen.getByText('戒指内圈刻字排版.plt')).toBeInTheDocument()

    const imageFile = new File(['mock image'], '客户补充刻字图.jpg', { type: 'image/jpeg' })
    const pltFile = new File(['IN;SP1;'], '客户补充刻字版式.plt', { type: 'application/octet-stream' })

    await user.upload(screen.getByLabelText('上传刻字图片'), imageFile)
    await user.upload(screen.getByLabelText('上传刻字PLT文件'), pltFile)

    expect(screen.getByText('客户补充刻字图.jpg')).toBeInTheDocument()
    expect(screen.getByText('客户补充刻字版式.plt')).toBeInTheDocument()
  })

  it('renders order create with helper form controls', () => {
    renderRoute('/orders/new')
    const registeredAtInput = screen.getByLabelText('交易登记时间') as HTMLInputElement

    expect(screen.getByLabelText('交易类型')).toHaveValue('销售订单')
    expect(screen.getByLabelText('负责人')).toHaveValue('待分配')
    expect(screen.getByLabelText('平台ID')).toHaveValue('')
    expect(screen.getByLabelText('来源渠道')).toHaveValue('')
    expect(screen.getByLabelText('是否添加联系方式')).toHaveValue('no')
    expect(screen.getByLabelText('是否好评')).toHaveValue('no')
    expect(registeredAtInput.value).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)
    expect(screen.getByLabelText('付款时间')).toHaveAttribute('type', 'datetime-local')
    expect(screen.getByLabelText('客户期望时间')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('计划交期')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('承诺交期')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('交易成交价')).toBeInTheDocument()
    expect(screen.getByText('财务流水')).toBeInTheDocument()
  })

  it('renders task list route', () => {
    renderRoute('/tasks')

    expect(screen.getByRole('heading', { name: '任务中心' })).toBeInTheDocument()
    expect(screen.getByText('确认戒指最终圈号')).toBeInTheDocument()
  })

  it('renders task detail route', () => {
    renderRoute('/tasks/task-order-001')

    expect(screen.getByRole('heading', { name: '任务详情' })).toBeInTheDocument()
    expect(screen.getByText('顶部任务概览')).toBeInTheDocument()
    expect(screen.getAllByText('SO-202604-001').length).toBeGreaterThan(0)
  })

  it('renders production plan list route without requiring factory role', () => {
    renderRoute('/production-plan')

    expect(screen.getByRole('heading', { name: '工厂生产计划' })).toBeInTheDocument()
    expect(screen.getByText('RING-SH-016')).toBeInTheDocument()
    expect(screen.queryByText('页面说明')).not.toBeInTheDocument()
  })

  it('renders production plan detail route', () => {
    renderRoute('/production-plan/task-factory-001')

    expect(screen.getByRole('heading', { name: '生产任务详情' })).toBeInTheDocument()
    expect(screen.getByText('来源追溯')).toBeInTheDocument()
    expect(screen.getAllByText('RING-SH-016').length).toBeGreaterThan(0)
  })

  it('renders order detail with source product drawer from query', () => {
    renderRoute('/orders/o-202604-001?drawer=source-product&itemId=oi-ring-001')
    expect(screen.getByText('来源产品详情')).toBeInTheDocument()
    expect(screen.getByText('商品任务参数对比')).toBeInTheDocument()
  })

  it('renders business stage stepper in order detail', () => {
    renderRoute('/orders/o-202604-001')

    expect(screen.getAllByText('业务阶段').length).toBeGreaterThan(0)
    expect(screen.getAllByText('设计建模').length).toBeGreaterThan(0)
    expect(screen.getAllByText('客服接单').length).toBeGreaterThan(0)
    expect(screen.getAllByText('跟单下厂').length).toBeGreaterThan(0)
  })

  it('renders customer and collapsed finance fields in order detail', () => {
    renderRoute('/orders/o-202604-001')

    expect(screen.queryByText('订单基础信息')).not.toBeInTheDocument()
    expect(screen.queryByText('顶部订单概览')).not.toBeInTheDocument()
    expect(screen.getAllByText('SO-202604-001').length).toBeGreaterThan(0)
    expect(screen.queryByText('客户与平台')).not.toBeInTheDocument()
    expect(screen.queryByText('时间与交付')).not.toBeInTheDocument()
    expect(screen.queryByText('订单摘要')).not.toBeInTheDocument()
    expect(screen.queryByText('客户与平台信息')).not.toBeInTheDocument()
    expect(screen.queryByText('时间与交付信息')).not.toBeInTheDocument()
    expect(screen.queryByText('订单摘要信息')).not.toBeInTheDocument()
    expect(screen.getAllByText('客户期望时间').length).toBe(1)
    expect(screen.getAllByText('计划交期').length).toBe(1)
    expect(screen.getAllByText('承诺交期').length).toBe(1)
    expect(screen.getAllByText('交易类型').length).toBe(1)
    expect(screen.getAllByText('负责人').length).toBe(1)
    expect(screen.queryByText('平台单号')).not.toBeInTheDocument()
    expect(screen.getAllByText('tb_linxiaojie_2218').length).toBeGreaterThan(0)
    expect(screen.getAllByText('淘宝').length).toBeGreaterThan(0)
    expect(screen.getAllByText('是否添加联系方式').length).toBe(1)
    expect(screen.getAllByText('是否好评').length).toBe(1)
    expect(screen.getAllByText('是').length).toBeGreaterThan(0)
    expect(screen.getAllByText('否').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2026-04-24').length).toBeGreaterThan(0)
    expect(screen.getAllByText('山形戒指').length).toBeGreaterThan(0)
    expect(screen.getByText('材质 18K金 / 工艺 微镶 / 规格 16号 / 尺寸 戒围 16 号，内圈略加厚')).toBeInTheDocument()
    expect(screen.getByText('财务信息')).toBeInTheDocument()
    expect(screen.getAllByText('¥ 8,500').length).toBeGreaterThan(0)
    expect(screen.getAllByText('¥ 5,000').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '展开流水' })).toBeInTheDocument()
    expect(screen.getByText('默认收起财务流水，点击“展开流水”查看收款、退款和售后补款明细。')).toBeInTheDocument()
    expect(screen.queryByText('定金收款')).not.toBeInTheDocument()
    expect(screen.queryByText('售后补款')).not.toBeInTheDocument()
  })

  it('expands finance transactions in order detail on demand', async () => {
    const user = userEvent.setup()
    renderRoute('/orders/o-202604-001')

    await user.click(screen.getByRole('button', { name: '展开流水' }))

    expect(screen.getByRole('button', { name: '收起流水' })).toBeInTheDocument()
    expect(screen.getByText('定金收款')).toBeInTheDocument()
    expect(screen.getByText('售后补款')).toBeInTheDocument()
  })

  it('switches to factory role and shows factory-focused order detail view', async () => {
    const user = userEvent.setup()
    renderRoute('/orders/o-202604-001')

    await user.selectOptions(screen.getByLabelText('角色模式'), 'factory')

    expect(screen.getAllByText('物流交付').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: '新增商品' })).not.toBeInTheDocument()
    expect(screen.getByText('工厂生产区')).toBeInTheDocument()
    expect(screen.getAllByText('货号').length).toBeGreaterThan(0)
    expect(screen.getByText('工厂回传区')).toBeInTheDocument()
    expect(screen.getByText('刻字生产信息')).toBeInTheDocument()
    expect(screen.getAllByText('ZS').length).toBeGreaterThan(0)
    expect(screen.getByText('戒指内圈刻字示意图.jpg')).toBeInTheDocument()
    expect(screen.getByText('戒指内圈刻字排版.plt')).toBeInTheDocument()
    expect(screen.queryByText('确认戒指最终圈号')).not.toBeInTheDocument()
    expect(screen.queryByText('商品任务需求')).not.toBeInTheDocument()
    expect(screen.queryByText('物流记录区')).not.toBeInTheDocument()
    expect(screen.queryByText('系统参考报价')).not.toBeInTheDocument()
  })

  it('shows production plan nav only for factory role', async () => {
    const user = userEvent.setup()
    renderRoute('/orders/o-202604-001')

    expect(screen.queryByRole('link', { name: /生产/ })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('角色模式'), 'factory')

    expect(screen.getByRole('link', { name: /生产/ })).toBeInTheDocument()
  })

  it('updates production plan status actions and writes timeline records', async () => {
    const user = userEvent.setup()
    renderRoute('/production-plan/task-factory-001')

    await user.click(screen.getByRole('button', { name: '接收任务' }))

    expect(screen.getAllByText('待生产').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '开始生产' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '开始生产' }))

    expect(screen.getByLabelText('工厂状态')).toHaveValue('生产中')
    expect(screen.getByText('商品 山形戒指 工厂状态更新为生产中')).toBeInTheDocument()
  })

  it('collapses non-primary item blocks by default in operations view', async () => {
    const user = userEvent.setup()
    renderRoute('/orders/o-202604-001')

    await user.selectOptions(screen.getByLabelText('角色模式'), 'operations')

    expect(screen.getByText('商品任务区')).toBeInTheDocument()
    expect(screen.queryByText('商品协同区')).not.toBeInTheDocument()
    expect(screen.queryByText('来源模板')).not.toBeInTheDocument()
    expect(screen.getAllByText('成交价').length).toBeGreaterThan(0)
    expect(screen.getAllByText('刻字').length).toBeGreaterThan(0)
    expect(screen.getAllByText('待确认').length).toBeGreaterThan(0)
    expect(screen.getByText('设计确认中')).toBeInTheDocument()
    expect(screen.queryByText('尺寸 / 规格备注')).not.toBeInTheDocument()
    expect(screen.queryByText('特殊需求（逗号分隔）')).not.toBeInTheDocument()
    expect(screen.getByText('规格与报价区')).toBeInTheDocument()
    expect(screen.getByText('商品任务需求')).toBeInTheDocument()
    expect(screen.getByText('设计建模区')).toBeInTheDocument()
    expect(screen.getAllByText('展开本区').length).toBeGreaterThan(0)
    expect(screen.queryByText('当前已收起，点击“展开本区”查看或编辑这一部分内容。')).not.toBeInTheDocument()
  })

  it('advances order status from order detail flow section', async () => {
    const user = userEvent.setup()
    renderRoute('/orders/o-202604-001')

    await user.click(screen.getByRole('button', { name: '推进到待生产准备' }))

    expect(screen.getAllByText('待生产准备').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: '推进到待发货' })).toBeInTheDocument()
  })

  it('advances order status and creates suggested task together', async () => {
    const user = userEvent.setup()
    renderRoute('/orders/o-202604-001')

    await user.click(screen.getByRole('button', { name: '推进并创建生产准备任务' }))

    expect(screen.getAllByText('待生产准备').length).toBeGreaterThan(0)
    expect(screen.getByText('生产准备任务')).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: '打开来源产品：山形戒指' }))

    expect(screen.getByText('来源产品详情')).toBeInTheDocument()
    expect(screen.getByText('模板原始详情')).toBeInTheDocument()
  })

  it('opens source product drawer when clicking source banner name', async () => {
    const user = userEvent.setup()
    renderRoute('/orders/o-202604-001')

    await user.click(screen.getByRole('button', { name: '打开来源产品：山形戒指' }))

    expect(screen.getByText('来源产品详情')).toBeInTheDocument()
  })
})
