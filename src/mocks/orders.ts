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
    orderType: '平台定制',
    ownerName: '张晨',
    customerName: '林小姐',
    customerPhone: '13800001234',
    customerAddress: '上海市徐汇区漕溪北路 188 号',
    customerRemark: '礼盒卡片请备注生日快乐',
    status: '进行中',
    riskTags: ['交期紧张'],
    promisedDate: '2026-04-28',
    expectedDate: '2026-04-26',
    paymentDate: '2026-04-21 10:45',
    remark: '客户希望先确认戒指尺寸',
    items: [
      {
        id: 'oi-ring-001',
        name: '山形素圈戒指',
        quantity: 1,
        status: '待打样',
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
        })
      },
      {
        id: 'oi-pendant-001',
        name: '如意吊坠',
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
        })
      }
    ]
  },
  {
    id: 'o-202604-002',
    orderNo: 'SO-202604-002',
    platformOrderNo: 'SHOP-001293',
    orderType: '门店定制',
    ownerName: '苏琳',
    customerName: '王先生',
    customerPhone: '13900005678',
    customerAddress: '杭州市滨江区江南大道 999 号',
    customerRemark: '到店复尺后再排产',
    status: '待处理',
    riskTags: ['需复尺'],
    promisedDate: '2026-05-02',
    expectedDate: '2026-04-30',
    paymentDate: '2026-04-22 08:30',
    items: [
      {
        id: 'oi-new-001',
        name: '待引用产品商品',
        quantity: 1,
        status: '待引用',
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
    ]
  }
]
