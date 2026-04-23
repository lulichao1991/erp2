import { mockProducts } from '@/mocks/products'
import type { Order } from '@/types/order'
import { buildQuoteResult } from '@/utils/quote/buildQuoteResult'

const ringProduct = mockProducts[0]
const pendantProduct = mockProducts[1]

const ringSpec = ringProduct.specs.find((item) => item.specValue === '16号')
const pendantSpec = pendantProduct.specs.find((item) => item.specValue === '小号')

export const mockOrders: Order[] = [
  {
    id: 'o-202604-001',
    orderNo: 'SO-202604-001',
    platformOrderNo: 'AMZ-9938201',
    orderType: '销售订单',
    ownerName: '张晨',
    hasAdditionalContact: true,
    isPositiveReview: false,
    platformCustomerId: 'tb_linxiaojie_2218',
    sourceChannel: '淘宝',
    registeredAt: '2026-04-21 10:46',
    customerName: '林小姐',
    customerPhone: '13800001234',
    customerAddress: '上海市徐汇区漕溪北路 188 号',
    customerRemark: '礼盒卡片请备注生日快乐',
    status: 'pending_design',
    priority: 'urgent',
    riskTags: ['交期紧张'],
    promisedDate: '2026-04-28',
    expectedDate: '2026-04-26',
    plannedDate: '2026-04-24',
    paymentDate: '2026-04-21 10:45',
    finance: {
      dealPrice: 8500,
      depositAmount: 5000,
      balanceAmount: 3500,
      invoiced: false,
      remark: '活动成交价以客服确认口径为准，平台与线下退款需分别记录。',
      transactions: [
        {
          id: 'finance-o1-001',
          type: 'deposit_received',
          amount: 5000,
          occurredAt: '2026-04-21 10:45',
          note: '客户首笔定金'
        },
        {
          id: 'finance-o1-002',
          type: 'balance_received',
          amount: 3500,
          occurredAt: '2026-04-27 14:00',
          note: '发货前补齐尾款'
        },
        {
          id: 'finance-o1-003',
          type: 'platform_refund',
          amount: 100,
          occurredAt: '2026-04-29 18:20',
          note: '确认收货前平台退差'
        },
        {
          id: 'finance-o1-004',
          type: 'platform_refund',
          amount: 100,
          occurredAt: '2026-05-05 12:00',
          note: '好评返现活动'
        },
        {
          id: 'finance-o1-005',
          type: 'offline_refund',
          amount: 100,
          occurredAt: '2026-05-06 09:30',
          note: '线下补退差额'
        },
        {
          id: 'finance-o1-006',
          type: 'after_sales_payment',
          amount: 500,
          occurredAt: '2026-06-20 11:10',
          note: '售后追加改版补款'
        },
        {
          id: 'finance-o1-007',
          type: 'after_sales_refund',
          amount: 200,
          occurredAt: '2026-06-22 16:00',
          note: '售后退款'
        }
      ]
    },
    remark: '客户希望先确认戒指尺寸',
    latestActivityAt: '2026-04-22 11:20',
    items: [
      {
        id: 'oi-ring-001',
        name: '山形素圈戒指',
        itemSku: 'RING-SH-016',
        quantity: 1,
        status: '待确认',
        isReferencedProduct: true,
        sourceProduct: {
          sourceProductId: ringProduct.id,
          sourceProductCode: ringProduct.code,
          sourceProductName: ringProduct.name,
          sourceProductVersion: ringProduct.version,
          sourceSpecValue: '16号'
        },
        selectedSpecValue: '16号',
        selectedSpecSnapshot: ringSpec,
        selectedMaterial: '18K金',
        selectedProcess: '微镶',
        selectedSpecialOptions: ['刻字'],
        actualRequirements: {
          material: '18K金',
          process: '微镶',
          engraveText: 'L&Y',
          engraveImageFiles: [
            {
              id: 'engrave-image-ring-001',
              name: '戒指内圈刻字示意图.jpg',
              url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="%23f4efe7"/><text x="24" y="96" font-size="28" fill="%2330465d">L%26Y Inner Ring</text></svg>'
            }
          ],
          engravePltFiles: [
            {
              id: 'engrave-plt-ring-001',
              name: '戒指内圈刻字排版.plt',
              url: 'data:text/plain;charset=utf-8,IN%3BSP1%3BPA0%2C0%3BPD120%2C0%2C120%2C80%2C0%2C80%3BPU%3BL%26Y%3B'
            }
          ],
          sizeNote: '戒围偏紧时可微调',
          specialNotes: ['刻字靠内圈中部'],
          remark: '优先保证面宽一致性'
        },
        designInfo: {
          designStatus: '客户确认中',
          assignedDesigner: '陈设计',
          requiresRemodeling: false,
          designDeadline: '2026-04-23',
          designNote: '保持山形轮廓，内圈刻字需预留中段区域。'
        },
        outsourceInfo: {
          outsourceStatus: '待下发',
          supplierName: '苏州金工厂',
          plannedDeliveryDate: '2026-04-26',
          outsourceNote: '确认圈号后即可下发打样。'
        },
        factoryFeedback: {
          factoryStatus: '待回传',
          returnedWeight: '',
          qualityResult: '',
          factoryNote: '等待设计稿最终确认。'
        },
        quote: buildQuoteResult({
          selectedSpec: ringSpec,
          selectedMaterial: '18K金',
          selectedProcess: '微镶',
          selectedSpecialOptions: ['刻字'],
          rules: ringProduct.priceRules,
          specRequired: true
        }),
        manualAdjustment: 80,
        manualAdjustmentReason: '客户要求加厚内圈，先预留人工调整空间',
        finalDisplayQuote: 2080
      },
      {
        id: 'oi-pendant-001',
        name: '如意吊坠',
        itemSku: 'PDT-RY-S',
        quantity: 1,
        status: '设计确认中',
        isReferencedProduct: true,
        sourceProduct: {
          sourceProductId: pendantProduct.id,
          sourceProductCode: pendantProduct.code,
          sourceProductName: pendantProduct.name,
          sourceProductVersion: pendantProduct.version,
          sourceSpecValue: '小号'
        },
        selectedSpecValue: '小号',
        selectedSpecSnapshot: pendantSpec,
        selectedMaterial: '足银',
        selectedProcess: '珐琅',
        selectedSpecialOptions: ['加急'],
        actualRequirements: {
          material: '足银',
          process: '珐琅',
          specialNotes: ['配浅青色礼盒'],
          remark: '样式保持圆润边缘'
        },
        designInfo: {
          designStatus: '待设计',
          assignedDesigner: '王设计',
          requiresRemodeling: true,
          designDeadline: '2026-04-24',
          designNote: '珐琅色板待客户终版确认。'
        },
        outsourceInfo: {
          outsourceStatus: '未委外',
          supplierName: '',
          plannedDeliveryDate: '',
          outsourceNote: ''
        },
        factoryFeedback: {
          factoryStatus: '待回传',
          returnedWeight: '',
          qualityResult: '',
          factoryNote: ''
        },
        quote: buildQuoteResult({
          selectedSpec: pendantSpec,
          selectedMaterial: '足银',
          selectedProcess: '珐琅',
          selectedSpecialOptions: ['加急'],
          rules: pendantProduct.priceRules,
          specRequired: true
        }),
        finalDisplayQuote: 1280
      }
    ],
    timeline: [
      {
        id: 'tl-order-001-created',
        orderId: 'o-202604-001',
        type: 'order_created',
        title: '创建订单',
        description: '订单已录入基础信息并进入系统。',
        actorName: '张晨',
        createdAt: '2026-04-21 10:45'
      },
      {
        id: 'tl-order-001-reference',
        orderId: 'o-202604-001',
        type: 'product_referenced',
        title: '引用来源产品',
        description: '为戒指和吊坠分别引用了标准模板，保留版本快照。',
        actorName: '张晨',
        createdAt: '2026-04-21 11:02',
        relatedOrderItemId: 'oi-ring-001'
      },
      {
        id: 'tl-order-001-quote',
        orderId: 'o-202604-001',
        type: 'quote_recalculated',
        title: '重新计算系统参考报价',
        description: '已根据 16号 / 18K金 / 微镶 / 刻字生成系统参考报价。',
        actorName: '张晨',
        createdAt: '2026-04-21 11:10',
        relatedOrderItemId: 'oi-ring-001'
      },
      {
        id: 'tl-order-001-status',
        orderId: 'o-202604-001',
        type: 'status_changed',
        title: '订单进入待设计/建模',
        description: '吊坠需补充设计确认，订单状态从待确认切换为待设计/建模。',
        actorName: '张晨',
        createdAt: '2026-04-22 11:20'
      }
    ]
  },
  {
    id: 'o-202604-002',
    orderNo: 'SO-202604-002',
    platformOrderNo: 'SHOP-001293',
    orderType: '销售订单',
    ownerName: '苏琳',
    hasAdditionalContact: false,
    isPositiveReview: true,
    platformCustomerId: 'offline_wang_0302',
    sourceChannel: '线下门店',
    registeredAt: '2026-04-22 08:30',
    customerName: '王先生',
    customerPhone: '13900005678',
    customerAddress: '杭州市滨江区江南大道 999 号',
    customerRemark: '到店复尺后再排产',
    status: 'pending_confirm',
    priority: 'high',
    riskTags: ['需复尺'],
    promisedDate: '2026-05-02',
    expectedDate: '2026-04-30',
    plannedDate: '2026-04-28',
    paymentDate: '2026-04-22 08:30',
    finance: {
      dealPrice: 3200,
      depositAmount: 1000,
      balanceAmount: undefined,
      invoiced: true,
      remark: '门店先收定金，复尺后再确认尾款与排产。',
      transactions: [
        {
          id: 'finance-o2-001',
          type: 'deposit_received',
          amount: 1000,
          occurredAt: '2026-04-22 08:30',
          note: '门店收定金'
        }
      ]
    },
    latestActivityAt: '2026-04-22 08:35',
    items: [
      {
        id: 'oi-new-001',
        name: '待引用产品商品',
        itemSku: 'SKU-DRAFT-001',
        quantity: 1,
        status: '待确认',
        isReferencedProduct: false,
        actualRequirements: {
          remark: '客户想先看可选模板'
        },
        designInfo: {
          designStatus: '待设计',
          assignedDesigner: '',
          requiresRemodeling: false,
          designDeadline: '',
          designNote: ''
        },
        outsourceInfo: {
          outsourceStatus: '未委外',
          supplierName: '',
          plannedDeliveryDate: '',
          outsourceNote: ''
        },
        factoryFeedback: {
          factoryStatus: '待回传',
          returnedWeight: '',
          qualityResult: '',
          factoryNote: ''
        },
        selectedSpecialOptions: [],
        quote: {
          basePrice: undefined,
          priceAdjustments: [],
          systemQuote: undefined,
          status: 'idle',
          warnings: []
        }
      }
    ],
    timeline: [
      {
        id: 'tl-order-002-created',
        orderId: 'o-202604-002',
        type: 'order_created',
        title: '创建订单',
        description: '订单已创建，等待补充客户复尺和来源模板。',
        actorName: '苏琳',
        createdAt: '2026-04-22 08:30'
      },
      {
        id: 'tl-order-002-remark',
        orderId: 'o-202604-002',
        type: 'remark_updated',
        title: '补充客户备注',
        description: '记录到店复尺后再排产。',
        actorName: '苏琳',
        createdAt: '2026-04-22 08:35'
      }
    ]
  }
]
