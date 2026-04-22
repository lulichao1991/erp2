import type { Product } from '@/types/product'

const svgData = (title: string, color: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${color}" />
          <stop offset="1" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" rx="28" fill="url(#g)" />
      <circle cx="620" cy="180" r="110" fill="rgba(255,255,255,0.18)" />
      <text x="72" y="270" font-size="54" font-family="Arial" font-weight="700" fill="#1F2937">${title}</text>
      <text x="72" y="340" font-size="24" font-family="Arial" fill="#4B5563">Mock Product Cover</text>
    </svg>`
  )}`

export const mockProducts: Product[] = [
  {
    id: 'p-ring-001',
    code: 'PD-RING-001',
    name: '山形素圈戒指',
    shortName: '山形戒指',
    category: 'ring',
    series: '山形系列',
    styleTags: ['极简', '山形'],
    sceneTags: ['日常佩戴'],
    status: 'enabled',
    isReferable: true,
    version: 'v3',
    updatedAt: '2026-04-20 18:20',
    coverImage: svgData('山形素圈戒指', '#e4edf8'),
    galleryImages: [svgData('山形素圈戒指', '#e4edf8'), svgData('戒指细节', '#dbeafe')],
    supportedMaterials: ['足金', '18K金'],
    defaultMaterial: '足金',
    supportedProcesses: ['亮面', '微镶'],
    defaultProcess: '亮面',
    supportedSpecialOptions: ['刻字', '加急'],
    specMode: 'single_axis',
    specName: '圈号',
    specDisplayType: 'tags',
    isSpecRequired: true,
    specs: [
      {
        id: 'spec-ring-10',
        productId: 'p-ring-001',
        specValue: '10号',
        sortOrder: 1,
        status: 'enabled',
        basePrice: 1280,
        referenceWeight: 4.8,
        sizeFields: [
          { key: 'faceWidth', label: '面宽', value: '3.2', unit: 'mm' },
          { key: 'bottomWidth', label: '底宽', value: '2.1', unit: 'mm' },
          { key: 'faceThickness', label: '面厚', value: '1.6', unit: 'mm' },
          { key: 'bottomThickness', label: '底厚', value: '1.3', unit: 'mm' }
        ]
      },
      {
        id: 'spec-ring-16',
        productId: 'p-ring-001',
        specValue: '16号',
        sortOrder: 2,
        status: 'enabled',
        basePrice: 1450,
        referenceWeight: 5.6,
        sizeFields: [
          { key: 'faceWidth', label: '面宽', value: '3.8', unit: 'mm' },
          { key: 'bottomWidth', label: '底宽', value: '2.4', unit: 'mm' },
          { key: 'faceThickness', label: '面厚', value: '1.9', unit: 'mm' },
          { key: 'bottomThickness', label: '底厚', value: '1.5', unit: 'mm' }
        ]
      }
    ],
    priceRules: [
      { id: 'rule-ring-material-18k', productId: 'p-ring-001', type: 'material', ruleKey: '18K金', delta: 300, enabled: true },
      { id: 'rule-ring-process-micro', productId: 'p-ring-001', type: 'process', ruleKey: '微镶', delta: 200, enabled: true },
      { id: 'rule-ring-special-engrave', productId: 'p-ring-001', type: 'special', ruleKey: '刻字', delta: 50, enabled: true },
      { id: 'rule-ring-special-rush', productId: 'p-ring-001', type: 'special', ruleKey: '加急', delta: 120, enabled: true }
    ],
    customRules: {
      canResize: true,
      canChangeMaterial: true,
      canEngrave: true,
      canChangeProcess: true,
      canRevise: true,
      requiresRemodeling: false,
      requiresMeasureTool: true
    },
    productionReference: {
      standardMaterial: '足金',
      defaultLeadTimeDays: 10,
      suggestedLeadTimeDays: 12,
      referenceLaborCost: 260,
      productionNotes: ['山形面需复检面厚一致性', '镜面抛光后需复测底厚']
    },
    assets: {
      detailImages: [svgData('戒指侧视图', '#f0f9ff')],
      modelFiles: [{ id: 'model-ring-1', name: 'ring-v3.stl', type: 'model', version: 'v3', url: '#' }],
      craftFiles: [{ id: 'craft-ring-1', name: '抛光工艺说明.pdf', type: 'craft', version: 'v1', url: '#' }],
      sizeFiles: [{ id: 'size-ring-1', name: '圈号尺寸参考.pdf', type: 'size', version: 'v2', url: '#' }],
      otherFiles: [{ id: 'other-ring-1', name: '包装备注.docx', type: 'other', url: '#' }]
    }
  },
  {
    id: 'p-pendant-001',
    code: 'PD-PENDANT-001',
    name: '如意吊坠',
    shortName: '如意吊坠',
    category: 'pendant',
    series: '如意系列',
    styleTags: ['国风', '轻奢'],
    sceneTags: ['礼赠'],
    status: 'enabled',
    isReferable: true,
    version: 'v2',
    updatedAt: '2026-04-18 11:10',
    coverImage: svgData('如意吊坠', '#fff7e6'),
    galleryImages: [svgData('如意吊坠', '#fff7e6'), svgData('吊坠细节', '#fde68a')],
    supportedMaterials: ['足银', '18K金'],
    defaultMaterial: '足银',
    supportedProcesses: ['镜面', '珐琅'],
    defaultProcess: '镜面',
    supportedSpecialOptions: ['加急', '附赠礼盒'],
    specMode: 'single_axis',
    specName: '档位',
    specDisplayType: 'select',
    isSpecRequired: true,
    specs: [
      {
        id: 'spec-pendant-s',
        productId: 'p-pendant-001',
        specValue: '小号',
        sortOrder: 1,
        status: 'enabled',
        basePrice: 980,
        referenceWeight: 2.3,
        sizeFields: [
          { key: 'length', label: '长', value: '16', unit: 'mm' },
          { key: 'width', label: '宽', value: '8', unit: 'mm' },
          { key: 'thickness', label: '厚', value: '2.2', unit: 'mm' }
        ]
      },
      {
        id: 'spec-pendant-m',
        productId: 'p-pendant-001',
        specValue: '中号',
        sortOrder: 2,
        status: 'enabled',
        basePrice: 1220,
        referenceWeight: 3.1,
        sizeFields: [
          { key: 'length', label: '长', value: '20', unit: 'mm' },
          { key: 'width', label: '宽', value: '10', unit: 'mm' },
          { key: 'thickness', label: '厚', value: '2.5', unit: 'mm' }
        ]
      },
      {
        id: 'spec-pendant-l',
        productId: 'p-pendant-001',
        specValue: '大号',
        sortOrder: 3,
        status: 'enabled',
        basePrice: 1460,
        referenceWeight: 4.5,
        sizeFields: [
          { key: 'length', label: '长', value: '24', unit: 'mm' },
          { key: 'width', label: '宽', value: '12', unit: 'mm' },
          { key: 'thickness', label: '厚', value: '2.9', unit: 'mm' }
        ]
      }
    ],
    priceRules: [
      { id: 'rule-pendant-material-18k', productId: 'p-pendant-001', type: 'material', ruleKey: '18K金', delta: 280, enabled: true },
      { id: 'rule-pendant-process-enamel', productId: 'p-pendant-001', type: 'process', ruleKey: '珐琅', delta: 180, enabled: true },
      { id: 'rule-pendant-special-rush', productId: 'p-pendant-001', type: 'special', ruleKey: '加急', delta: 120, enabled: true },
      { id: 'rule-pendant-special-gift', productId: 'p-pendant-001', type: 'special', ruleKey: '附赠礼盒', delta: 40, enabled: true }
    ],
    customRules: {
      canResize: false,
      canChangeMaterial: true,
      canEngrave: false,
      canChangeProcess: true,
      canRevise: true,
      requiresRemodeling: true,
      requiresMeasureTool: false
    },
    productionReference: {
      standardMaterial: '足银',
      defaultLeadTimeDays: 8,
      suggestedLeadTimeDays: 10,
      referenceLaborCost: 180,
      productionNotes: ['珐琅工艺需二次烘烤', '吊环位置需复核平衡']
    },
    assets: {
      detailImages: [svgData('吊坠背面', '#fffbeb')],
      modelFiles: [{ id: 'model-pendant-1', name: 'pendant-v2.obj', type: 'model', version: 'v2', url: '#' }],
      craftFiles: [{ id: 'craft-pendant-1', name: '珐琅工艺卡.pdf', type: 'craft', version: 'v1', url: '#' }],
      sizeFiles: [{ id: 'size-pendant-1', name: '档位尺寸图.pdf', type: 'size', version: 'v1', url: '#' }],
      otherFiles: [{ id: 'other-pendant-1', name: '质检提醒.txt', type: 'other', url: '#' }]
    }
  }
]
