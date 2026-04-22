import { Link } from 'react-router-dom'
import type { Dispatch, SetStateAction } from 'react'
import {
  FileList,
  ImageGallery,
  ImageThumb,
  InfoField,
  InfoGrid,
  PageHeader,
  ReferenceTag,
  SectionCard,
  StatusTag,
  SummaryCard,
  VersionBadge
} from '@/components/common'
import type { Product, ProductPriceRule, ProductSpecRow } from '@/types/product'

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')

const splitValues = (value: string) =>
  value
    .split(/[,\n，]/)
    .map((item) => item.trim())
    .filter(Boolean)

const updateSpecAt = (specs: ProductSpecRow[], index: number, next: ProductSpecRow) =>
  specs.map((item, currentIndex) => (currentIndex === index ? next : item))

const updateRuleAt = (rules: ProductPriceRule[], index: number, next: ProductPriceRule) =>
  rules.map((item, currentIndex) => (currentIndex === index ? next : item))

export const ProductListHeader = () => (
  <PageHeader
    title="产品管理"
    subtitle="首轮先聚焦产品模板查看、规格维护和固定加价规则维护。"
    actions={
      <>
        <Link to="/products/new" className="button primary">
          新建产品
        </Link>
      </>
    }
  />
)

export const ProductQuickStats = ({ products }: { products: Product[] }) => {
  const firstPrices = products.map((item) => item.specs[0]?.basePrice).filter((value): value is number => typeof value === 'number')
  const averagePrice = firstPrices.length > 0 ? Math.round(firstPrices.reduce((sum, item) => sum + item, 0) / firstPrices.length) : 0

  const stats = [
    { label: '全部产品', value: products.length },
    { label: '可引用', value: products.filter((item) => item.isReferable).length },
    { label: '启用中', value: products.filter((item) => item.status === 'enabled').length },
    { label: '单轴规格', value: products.filter((item) => item.specMode === 'single_axis').length },
    { label: '固定规则数', value: products.reduce((sum, item) => sum + item.priceRules.length, 0) },
    { label: '平均参考价', value: `¥ ${averagePrice}` }
  ]

  return (
    <div className="stats-grid">
      {stats.map((item) => (
        <div key={item.label} className="stat-card">
          <div className="stat-card-label">{item.label}</div>
          <div className="stat-card-value">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

type ProductFilterValue = {
  keyword: string
  category: string
  status: string
  referable: string
}

export const ProductFilterBar = ({
  value,
  onChange
}: {
  value: ProductFilterValue
  onChange: (next: ProductFilterValue) => void
}) => (
  <SectionCard title="搜索与筛选" description="先支持名称 / 编号搜索，以及品类、状态、引用状态筛选。">
    <div className="field-grid four">
      <div className="field-control">
        <label className="field-label">搜索产品名称 / 编号</label>
        <input
          className="input"
          value={value.keyword}
          onChange={(event) => onChange({ ...value, keyword: event.target.value })}
          placeholder="例如：山形 / PD-RING-001"
        />
      </div>
      <div className="field-control">
        <label className="field-label">品类</label>
        <select className="select" value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value })}>
          <option value="all">全部品类</option>
          <option value="ring">戒指</option>
          <option value="pendant">吊坠</option>
          <option value="necklace">项链</option>
          <option value="earring">耳饰</option>
          <option value="bracelet">手链</option>
          <option value="other">其他</option>
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">状态</label>
        <select className="select" value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value })}>
          <option value="all">全部状态</option>
          <option value="enabled">启用</option>
          <option value="draft">草稿</option>
          <option value="disabled">禁用</option>
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">是否可引用</label>
        <select className="select" value={value.referable} onChange={(event) => onChange({ ...value, referable: event.target.value })}>
          <option value="all">全部</option>
          <option value="yes">可引用</option>
          <option value="no">不可引用</option>
        </select>
      </div>
    </div>
  </SectionCard>
)

export const ProductTable = ({ products }: { products: Product[] }) => (
  <div className="table-shell">
    <table className="table">
      <thead>
        <tr>
          <th>主图</th>
          <th>产品信息</th>
          <th>默认材质</th>
          <th>参考价格</th>
          <th>状态</th>
          <th>可引用</th>
          <th>版本</th>
          <th>最近更新</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td style={{ width: 160 }}>
              <div style={{ width: 120 }}>
                <ImageThumb src={product.coverImage} alt={product.name} />
              </div>
            </td>
            <td>
              <div className="stack" style={{ gap: 6 }}>
                <Link to={`/products/${product.id}`} className="text-price">
                  {product.name}
                </Link>
                <span className="text-caption">{product.code}</span>
                <div className="row wrap">
                  <span className="tag version">{product.category}</span>
                  {product.series ? <span className="text-caption">{product.series}</span> : null}
                </div>
              </div>
            </td>
            <td>{product.defaultMaterial || '—'}</td>
            <td className="price">{formatPrice(product.specs[0]?.basePrice)}</td>
            <td>
              <StatusTag value={product.status === 'enabled' ? '启用' : product.status === 'draft' ? '草稿' : '禁用'} />
            </td>
            <td>
              <ReferenceTag active={product.isReferable} />
            </td>
            <td>
              <VersionBadge value={product.version} />
            </td>
            <td>{product.updatedAt}</td>
            <td>
              <div className="row wrap">
                <Link to={`/products/${product.id}`} className="button ghost small">
                  查看
                </Link>
                <Link to={`/products/${product.id}/edit`} className="button secondary small">
                  编辑
                </Link>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const ProductHeaderBar = ({ product }: { product: Product }) => (
  <PageHeader
    title="产品详情"
    subtitle="查看产品模板原始资料、参数配置、价格规则和文件摘要。"
    actions={
      <>
        <Link to={`/products/${product.id}/edit`} className="button primary">
          编辑产品
        </Link>
        <Link to="/products" className="button secondary">
          返回列表
        </Link>
      </>
    }
  />
)

export const ProductSummaryCard = ({ product }: { product: Product }) => (
  <SummaryCard title="顶部摘要区">
    <div className="summary-grid three">
      <div className="stack">
        <div className="row wrap">
          <ImageThumb src={product.coverImage} alt={product.name} />
        </div>
      </div>
      <div className="stack">
        <div>
          <h2 style={{ margin: 0 }}>{product.name}</h2>
          <p className="text-muted">
            {product.code} · {product.category} · {product.series || '未分系列'}
          </p>
        </div>
        <div className="row wrap">
          <StatusTag value={product.status === 'enabled' ? '启用' : product.status === 'draft' ? '草稿' : '禁用'} />
          <ReferenceTag active={product.isReferable} />
          <VersionBadge value={product.version} />
        </div>
        <div className="quote-value">{formatPrice(product.specs[0]?.basePrice)}</div>
      </div>
      <div className="stack">
        <InfoField label="默认材质" value={product.defaultMaterial || '—'} />
        <InfoField label="默认工艺" value={product.defaultProcess || '—'} />
        <InfoField label="最近更新" value={product.updatedAt} />
      </div>
    </div>
  </SummaryCard>
)

export const ProductAnchorNav = ({
  activeAnchor,
  anchors
}: {
  activeAnchor: string
  anchors: Array<{ id: string; label: string }>
}) => (
  <div className="anchor-nav">
    {anchors.map((item) => (
      <a key={item.id} href={`#${item.id}`} className={`anchor-button${activeAnchor === item.id ? ' active' : ''}`}>
        {item.label}
      </a>
    ))}
  </div>
)

export const ProductBasicInfoSection = ({ product }: { product: Product }) => (
  <SectionCard id="basic" title="基础信息">
    <InfoGrid columns={3}>
      <InfoField label="产品名称" value={product.name} />
      <InfoField label="产品编号" value={product.code} />
      <InfoField label="品类" value={product.category} />
      <InfoField label="系列" value={product.series || '—'} />
      <InfoField label="风格标签" value={product.styleTags.join(' / ') || '—'} />
      <InfoField label="场景标签" value={product.sceneTags.join(' / ') || '—'} />
    </InfoGrid>
  </SectionCard>
)

export const ProductParamConfigSection = ({ product }: { product: Product }) => (
  <SectionCard id="params" title="参数配置">
    <InfoGrid columns={3}>
      <InfoField label="支持材质" value={product.supportedMaterials.join(' / ') || '—'} />
      <InfoField label="支持工艺" value={product.supportedProcesses.join(' / ') || '—'} />
      <InfoField label="特殊需求" value={product.supportedSpecialOptions.join(' / ') || '—'} />
      <InfoField label="规格模式" value={product.specMode === 'single_axis' ? '单轴规格' : '无规格'} />
      <InfoField label="规格名称" value={product.specName || '—'} />
      <InfoField label="规格展示" value={product.specDisplayType || '—'} />
    </InfoGrid>
    <div className="spacer-top">
      <div className="table-shell">
        <table className="table">
          <thead>
            <tr>
              <th>规格值</th>
              <th>参数摘要</th>
              <th>参考重量</th>
              <th>基础价格</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {product.specs.map((spec) => (
              <tr key={spec.id}>
                <td>{spec.specValue}</td>
                <td>{spec.sizeFields.map((field) => `${field.label} ${field.value}${field.unit ?? ''}`).join(' / ')}</td>
                <td>{spec.referenceWeight ? `${spec.referenceWeight} g` : '—'}</td>
                <td className="price">{formatPrice(spec.basePrice)}</td>
                <td>
                  <StatusTag value={spec.status === 'enabled' ? '启用' : '禁用'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </SectionCard>
)

export const ProductPriceRuleSection = ({ product }: { product: Product }) => (
  <SectionCard id="pricing" title="价格规则">
    <div className="table-shell">
      <table className="table">
        <thead>
          <tr>
            <th>规则类型</th>
            <th>规则项</th>
            <th>固定加价</th>
            <th>说明</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {product.priceRules.map((rule) => (
            <tr key={rule.id}>
              <td>{rule.type}</td>
              <td>{rule.ruleKey}</td>
              <td className="price">{formatPrice(rule.delta)}</td>
              <td>{rule.note || '—'}</td>
              <td>
                <StatusTag value={rule.enabled ? '启用' : '禁用'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </SectionCard>
)

export const ProductCustomRuleSection = ({ product }: { product: Product }) => (
  <SectionCard id="custom" title="定制规则">
    <div className="row wrap">
      {[
        { label: '支持改圈', active: product.customRules.canResize },
        { label: '支持换材质', active: product.customRules.canChangeMaterial },
        { label: '支持刻字', active: product.customRules.canEngrave },
        { label: '支持改工艺', active: product.customRules.canChangeProcess },
        { label: '允许修订', active: product.customRules.canRevise },
        { label: '需重新建模', active: product.customRules.requiresRemodeling },
        { label: '需测量工具', active: product.customRules.requiresMeasureTool }
      ].map(({ label, active }) => (
        <span key={label} className={`tag ${active ? 'status-enabled' : 'reference-off'}`}>
          {label}
        </span>
      ))}
    </div>
  </SectionCard>
)

export const ProductProductionRefSection = ({ product }: { product: Product }) => (
  <SectionCard id="production" title="生产参考">
    <InfoGrid columns={3}>
      <InfoField label="标准材质" value={product.productionReference.standardMaterial || '—'} />
      <InfoField label="默认工期" value={product.productionReference.defaultLeadTimeDays ? `${product.productionReference.defaultLeadTimeDays} 天` : '—'} />
      <InfoField label="建议工期" value={product.productionReference.suggestedLeadTimeDays ? `${product.productionReference.suggestedLeadTimeDays} 天` : '—'} />
      <InfoField label="参考人工费" value={formatPrice(product.productionReference.referenceLaborCost)} />
      <InfoField label="生产备注" value={product.productionReference.productionNotes?.join(' / ') || '—'} />
    </InfoGrid>
  </SectionCard>
)

export const ProductAssetsSection = ({ product }: { product: Product }) => (
  <SectionCard id="assets" title="图片与文件">
    <div className="stack">
      <ImageGallery images={[...product.galleryImages, ...product.assets.detailImages]} />
      <div className="field-grid two">
        <FileList title="建模文件" files={product.assets.modelFiles} />
        <FileList title="工艺文件" files={product.assets.craftFiles} />
        <FileList title="尺寸文件" files={product.assets.sizeFiles} />
        <FileList title="其他文件" files={product.assets.otherFiles} />
      </div>
    </div>
  </SectionCard>
)

export const ProductEditHeader = ({
  mode,
  onSave,
  hasUnsavedChanges
}: {
  mode: 'create' | 'edit'
  onSave: () => void
  hasUnsavedChanges: boolean
}) => (
  <PageHeader
    title={mode === 'create' ? '新建产品' : '编辑产品'}
    subtitle="首轮采用顶部保存区 + 左侧分区导航 + 右侧分区表单，优先把规格明细和固定加价规则维护能力做稳。"
    actions={
      <>
        <span className="topbar-pill">{hasUnsavedChanges ? '有未保存修改' : '已同步到当前页面状态'}</span>
        <button className="button primary" onClick={onSave}>
          {mode === 'create' ? '创建产品' : '保存修改'}
        </button>
      </>
    }
  />
)

export const ProductEditSideNav = ({ activeSection }: { activeSection: string }) => (
  <div className="editor-side-nav">
    {[
      ['basic-form', '基础信息'],
      ['param-form', '参数配置'],
      ['spec-form', '规格明细'],
      ['rule-form', '固定加价规则']
    ].map(([id, label]) => (
      <a key={id} href={`#${id}`} className={`anchor-button${activeSection === id ? ' active' : ''}`}>
        {label}
      </a>
    ))}
  </div>
)

export const ProductBasicFormSection = ({
  product,
  setProduct
}: {
  product: Product
  setProduct: Dispatch<SetStateAction<Product>>
}) => (
  <SectionCard id="basic-form" title="基础信息">
    <div className="field-grid two">
      <div className="field-control">
        <label className="field-label">产品名称</label>
        <input className="input" value={product.name} onChange={(event) => setProduct((current) => ({ ...current, name: event.target.value }))} />
      </div>
      <div className="field-control">
        <label className="field-label">产品编号</label>
        <input className="input" value={product.code} onChange={(event) => setProduct((current) => ({ ...current, code: event.target.value }))} />
      </div>
      <div className="field-control">
        <label className="field-label">短名称</label>
        <input className="input" value={product.shortName || ''} onChange={(event) => setProduct((current) => ({ ...current, shortName: event.target.value }))} />
      </div>
      <div className="field-control">
        <label className="field-label">品类</label>
        <select className="select" value={product.category} onChange={(event) => setProduct((current) => ({ ...current, category: event.target.value as Product['category'] }))}>
          <option value="ring">戒指</option>
          <option value="pendant">吊坠</option>
          <option value="necklace">项链</option>
          <option value="earring">耳饰</option>
          <option value="bracelet">手链</option>
          <option value="other">其他</option>
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">系列</label>
        <input className="input" value={product.series || ''} onChange={(event) => setProduct((current) => ({ ...current, series: event.target.value }))} />
      </div>
      <div className="field-control">
        <label className="field-label">状态</label>
        <select className="select" value={product.status} onChange={(event) => setProduct((current) => ({ ...current, status: event.target.value as Product['status'] }))}>
          <option value="draft">草稿</option>
          <option value="enabled">启用</option>
          <option value="disabled">禁用</option>
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">主图链接</label>
        <input className="input" value={product.coverImage || ''} onChange={(event) => setProduct((current) => ({ ...current, coverImage: event.target.value }))} />
      </div>
      <div className="field-control">
        <label className="field-label">版本</label>
        <input className="input" value={product.version} onChange={(event) => setProduct((current) => ({ ...current, version: event.target.value }))} />
      </div>
      <div className="field-control">
        <label className="field-label">风格标签（逗号分隔）</label>
        <input className="input" value={product.styleTags.join(', ')} onChange={(event) => setProduct((current) => ({ ...current, styleTags: splitValues(event.target.value) }))} />
      </div>
      <div className="field-control">
        <label className="field-label">场景标签（逗号分隔）</label>
        <input className="input" value={product.sceneTags.join(', ')} onChange={(event) => setProduct((current) => ({ ...current, sceneTags: splitValues(event.target.value) }))} />
      </div>
      <div className="field-control">
        <label className="field-label">是否可引用</label>
        <select className="select" value={product.isReferable ? 'yes' : 'no'} onChange={(event) => setProduct((current) => ({ ...current, isReferable: event.target.value === 'yes' }))}>
          <option value="yes">可引用</option>
          <option value="no">不可引用</option>
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">更新时间</label>
        <input className="input" value={product.updatedAt} onChange={(event) => setProduct((current) => ({ ...current, updatedAt: event.target.value }))} />
      </div>
    </div>
  </SectionCard>
)

export const ProductParamFormSection = ({
  product,
  setProduct
}: {
  product: Product
  setProduct: Dispatch<SetStateAction<Product>>
}) => (
  <SectionCard id="param-form" title="参数配置">
    <div className="field-grid three">
      <div className="field-control">
        <label className="field-label">支持材质</label>
        <input className="input" value={product.supportedMaterials.join(', ')} onChange={(event) => setProduct((current) => ({ ...current, supportedMaterials: splitValues(event.target.value) }))} />
      </div>
      <div className="field-control">
        <label className="field-label">默认材质</label>
        <input className="input" value={product.defaultMaterial || ''} onChange={(event) => setProduct((current) => ({ ...current, defaultMaterial: event.target.value }))} />
      </div>
      <div className="field-control">
        <label className="field-label">支持工艺</label>
        <input className="input" value={product.supportedProcesses.join(', ')} onChange={(event) => setProduct((current) => ({ ...current, supportedProcesses: splitValues(event.target.value) }))} />
      </div>
      <div className="field-control">
        <label className="field-label">默认工艺</label>
        <input className="input" value={product.defaultProcess || ''} onChange={(event) => setProduct((current) => ({ ...current, defaultProcess: event.target.value }))} />
      </div>
      <div className="field-control">
        <label className="field-label">支持特殊需求</label>
        <input className="input" value={product.supportedSpecialOptions.join(', ')} onChange={(event) => setProduct((current) => ({ ...current, supportedSpecialOptions: splitValues(event.target.value) }))} />
      </div>
      <div className="field-control">
        <label className="field-label">规格模式</label>
        <select className="select" value={product.specMode} onChange={(event) => setProduct((current) => ({ ...current, specMode: event.target.value as Product['specMode'] }))}>
          <option value="none">无规格</option>
          <option value="single_axis">单轴规格</option>
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">规格名称</label>
        <input className="input" value={product.specName || ''} onChange={(event) => setProduct((current) => ({ ...current, specName: event.target.value }))} />
      </div>
      <div className="field-control">
        <label className="field-label">规格展示方式</label>
        <select className="select" value={product.specDisplayType || 'tags'} onChange={(event) => setProduct((current) => ({ ...current, specDisplayType: event.target.value as Product['specDisplayType'] }))}>
          <option value="tags">标签</option>
          <option value="select">下拉</option>
        </select>
      </div>
      <div className="field-control">
        <label className="field-label">是否必选规格</label>
        <select className="select" value={product.isSpecRequired ? 'yes' : 'no'} onChange={(event) => setProduct((current) => ({ ...current, isSpecRequired: event.target.value === 'yes' }))}>
          <option value="yes">是</option>
          <option value="no">否</option>
        </select>
      </div>
    </div>
    <div className="spacer-top">
      <div className="field-grid four">
        {[
          ['canResize', '支持改圈'],
          ['canChangeMaterial', '支持换材质'],
          ['canEngrave', '支持刻字'],
          ['canChangeProcess', '支持改工艺'],
          ['canRevise', '允许修订'],
          ['requiresRemodeling', '需重新建模'],
          ['requiresMeasureTool', '需测量工具']
        ].map(([key, label]) => (
          <label key={key} className="subtle-panel row">
            <input
              type="checkbox"
              checked={Boolean(product.customRules[key as keyof Product['customRules']])}
              onChange={(event) =>
                setProduct((current) => ({
                  ...current,
                  customRules: {
                    ...current.customRules,
                    [key]: event.target.checked
                  }
                }))
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
    <div className="spacer-top">
      <div className="field-grid four">
        <div className="field-control">
          <label className="field-label">标准材质</label>
          <input
            className="input"
            value={product.productionReference.standardMaterial || ''}
            onChange={(event) =>
              setProduct((current) => ({
                ...current,
                productionReference: { ...current.productionReference, standardMaterial: event.target.value }
              }))
            }
          />
        </div>
        <div className="field-control">
          <label className="field-label">默认工期（天）</label>
          <input
            className="input"
            type="number"
            value={product.productionReference.defaultLeadTimeDays ?? 0}
            onChange={(event) =>
              setProduct((current) => ({
                ...current,
                productionReference: { ...current.productionReference, defaultLeadTimeDays: Number(event.target.value) }
              }))
            }
          />
        </div>
        <div className="field-control">
          <label className="field-label">建议工期（天）</label>
          <input
            className="input"
            type="number"
            value={product.productionReference.suggestedLeadTimeDays ?? 0}
            onChange={(event) =>
              setProduct((current) => ({
                ...current,
                productionReference: { ...current.productionReference, suggestedLeadTimeDays: Number(event.target.value) }
              }))
            }
          />
        </div>
        <div className="field-control">
          <label className="field-label">参考人工费</label>
          <input
            className="input"
            type="number"
            value={product.productionReference.referenceLaborCost ?? 0}
            onChange={(event) =>
              setProduct((current) => ({
                ...current,
                productionReference: { ...current.productionReference, referenceLaborCost: Number(event.target.value) }
              }))
            }
          />
        </div>
      </div>
    </div>
  </SectionCard>
)

export const ProductSpecSection = ({
  product,
  setProduct
}: {
  product: Product
  setProduct: Dispatch<SetStateAction<Product>>
}) => {
  const addSpec = () =>
    setProduct((current) => ({
      ...current,
      specs: [
        ...current.specs,
        {
          id: `spec-${Date.now()}`,
          productId: current.id,
          specValue: '',
          sortOrder: current.specs.length + 1,
          status: 'enabled',
          basePrice: 0,
          referenceWeight: 0,
          sizeFields: []
        }
      ]
    }))

  return (
    <SectionCard
      id="spec-form"
      title="规格明细"
      description="首轮只支持单轴规格，必须支持新增、复制、删除、启停和尺寸参数编辑。"
      actions={
        <button className="button primary small" onClick={addSpec}>
          新增规格行
        </button>
      }
    >
      <div className="stack">
        {product.specs.map((spec, index) => (
          <div key={spec.id} className="subtle-panel">
            <div className="row wrap" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>规格行 {index + 1}</strong>
              <div className="row wrap">
                <button
                  className="button secondary small"
                  onClick={() =>
                    setProduct((current) => ({
                      ...current,
                      specs: [
                        ...current.specs,
                        {
                          ...spec,
                          id: `spec-copy-${Date.now()}`,
                          specValue: `${spec.specValue || '新规格'}-副本`,
                          sortOrder: current.specs.length + 1
                        }
                      ]
                    }))
                  }
                >
                  复制
                </button>
                <button
                  className="button secondary small"
                  onClick={() =>
                    setProduct((current) => ({
                      ...current,
                      specs: current.specs.filter((item) => item.id !== spec.id).map((item, itemIndex) => ({ ...item, sortOrder: itemIndex + 1 }))
                    }))
                  }
                >
                  删除
                </button>
              </div>
            </div>
            <div className="field-grid four">
              <div className="field-control">
                <label className="field-label">规格值</label>
                <input
                  className="input"
                  value={spec.specValue}
                  onChange={(event) =>
                    setProduct((current) => ({
                      ...current,
                      specs: updateSpecAt(current.specs, index, { ...spec, specValue: event.target.value })
                    }))
                  }
                />
              </div>
              <div className="field-control">
                <label className="field-label">基础价格</label>
                <input
                  className="input"
                  type="number"
                  value={spec.basePrice ?? 0}
                  onChange={(event) =>
                    setProduct((current) => ({
                      ...current,
                      specs: updateSpecAt(current.specs, index, { ...spec, basePrice: Number(event.target.value) })
                    }))
                  }
                />
              </div>
              <div className="field-control">
                <label className="field-label">参考重量</label>
                <input
                  className="input"
                  type="number"
                  value={spec.referenceWeight ?? 0}
                  onChange={(event) =>
                    setProduct((current) => ({
                      ...current,
                      specs: updateSpecAt(current.specs, index, { ...spec, referenceWeight: Number(event.target.value) })
                    }))
                  }
                />
              </div>
              <div className="field-control">
                <label className="field-label">状态</label>
                <select
                  className="select"
                  value={spec.status}
                  onChange={(event) =>
                    setProduct((current) => ({
                      ...current,
                      specs: updateSpecAt(current.specs, index, { ...spec, status: event.target.value as ProductSpecRow['status'] })
                    }))
                  }
                >
                  <option value="enabled">启用</option>
                  <option value="disabled">禁用</option>
                </select>
              </div>
            </div>
            <div className="spacer-top">
              <div className="row wrap" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                <strong>尺寸参数</strong>
                <button
                  className="button secondary small"
                  onClick={() =>
                    setProduct((current) => ({
                      ...current,
                      specs: updateSpecAt(current.specs, index, {
                        ...spec,
                        sizeFields: [...spec.sizeFields, { key: `field-${Date.now()}`, label: '', value: '', unit: '' }]
                      })
                    }))
                  }
                >
                  新增参数
                </button>
              </div>
              <div className="stack">
                {spec.sizeFields.map((field, fieldIndex) => (
                  <div key={field.key} className="field-grid four">
                    <div className="field-control">
                      <label className="field-label">字段标识</label>
                      <input
                        className="input"
                        value={field.key}
                        onChange={(event) =>
                          setProduct((current) => {
                            const nextFields = spec.sizeFields.map((item, currentIndex) => (currentIndex === fieldIndex ? { ...field, key: event.target.value } : item))
                            return {
                              ...current,
                              specs: updateSpecAt(current.specs, index, { ...spec, sizeFields: nextFields })
                            }
                          })
                        }
                      />
                    </div>
                    <div className="field-control">
                      <label className="field-label">显示名称</label>
                      <input
                        className="input"
                        value={field.label}
                        onChange={(event) =>
                          setProduct((current) => {
                            const nextFields = spec.sizeFields.map((item, currentIndex) => (currentIndex === fieldIndex ? { ...field, label: event.target.value } : item))
                            return {
                              ...current,
                              specs: updateSpecAt(current.specs, index, { ...spec, sizeFields: nextFields })
                            }
                          })
                        }
                      />
                    </div>
                    <div className="field-control">
                      <label className="field-label">值</label>
                      <input
                        className="input"
                        value={field.value}
                        onChange={(event) =>
                          setProduct((current) => {
                            const nextFields = spec.sizeFields.map((item, currentIndex) => (currentIndex === fieldIndex ? { ...field, value: event.target.value } : item))
                            return {
                              ...current,
                              specs: updateSpecAt(current.specs, index, { ...spec, sizeFields: nextFields })
                            }
                          })
                        }
                      />
                    </div>
                    <div className="field-control">
                      <label className="field-label">单位</label>
                      <div className="row">
                        <input
                          className="input"
                          value={field.unit || ''}
                          onChange={(event) =>
                            setProduct((current) => {
                              const nextFields = spec.sizeFields.map((item, currentIndex) => (currentIndex === fieldIndex ? { ...field, unit: event.target.value } : item))
                              return {
                                ...current,
                                specs: updateSpecAt(current.specs, index, { ...spec, sizeFields: nextFields })
                              }
                            })
                          }
                        />
                        <button
                          className="button secondary small"
                          onClick={() =>
                            setProduct((current) => {
                              const nextFields = spec.sizeFields.filter((_, currentIndex) => currentIndex !== fieldIndex)
                              return {
                                ...current,
                                specs: updateSpecAt(current.specs, index, { ...spec, sizeFields: nextFields })
                              }
                            })
                          }
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {spec.sizeFields.length === 0 ? <div className="placeholder-block">当前规格还没有尺寸参数，请先新增。</div> : null}
              </div>
            </div>
          </div>
        ))}
        {product.specs.length === 0 ? <div className="placeholder-block">当前没有规格行，请先新增一条规格明细。</div> : null}
      </div>
    </SectionCard>
  )
}

export const ProductPriceRuleFormSection = ({
  product,
  setProduct
}: {
  product: Product
  setProduct: Dispatch<SetStateAction<Product>>
}) => {
  const addRule = () =>
    setProduct((current) => ({
      ...current,
      priceRules: [
        ...current.priceRules,
        {
          id: `rule-${Date.now()}`,
          productId: current.id,
          type: 'material',
          ruleKey: '',
          delta: 0,
          enabled: true
        }
      ]
    }))

  return (
    <SectionCard
      id="rule-form"
      title="固定加价规则"
      description="首轮只支持材质、工艺、特殊需求、其他四类固定加价规则。"
      actions={
        <button className="button primary small" onClick={addRule}>
          新增规则
        </button>
      }
    >
      <div className="stack">
        {product.priceRules.map((rule, index) => (
          <div key={rule.id} className="field-grid four subtle-panel">
            <div className="field-control">
              <label className="field-label">规则类型</label>
              <select
                className="select"
                value={rule.type}
                onChange={(event) =>
                  setProduct((current) => ({
                    ...current,
                    priceRules: updateRuleAt(current.priceRules, index, { ...rule, type: event.target.value as ProductPriceRule['type'] })
                  }))
                }
              >
                <option value="material">材质</option>
                <option value="process">工艺</option>
                <option value="special">特殊需求</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="field-control">
              <label className="field-label">规则键</label>
              <input
                className="input"
                value={rule.ruleKey}
                onChange={(event) =>
                  setProduct((current) => ({
                    ...current,
                    priceRules: updateRuleAt(current.priceRules, index, { ...rule, ruleKey: event.target.value })
                  }))
                }
              />
            </div>
            <div className="field-control">
              <label className="field-label">固定加价</label>
              <input
                className="input"
                type="number"
                value={rule.delta}
                onChange={(event) =>
                  setProduct((current) => ({
                    ...current,
                    priceRules: updateRuleAt(current.priceRules, index, { ...rule, delta: Number(event.target.value) })
                  }))
                }
              />
            </div>
            <div className="field-control">
              <label className="field-label">状态</label>
              <div className="row">
                <select
                  className="select"
                  value={rule.enabled ? 'enabled' : 'disabled'}
                  onChange={(event) =>
                    setProduct((current) => ({
                      ...current,
                      priceRules: updateRuleAt(current.priceRules, index, { ...rule, enabled: event.target.value === 'enabled' })
                    }))
                  }
                >
                  <option value="enabled">启用</option>
                  <option value="disabled">禁用</option>
                </select>
                <button
                  className="button secondary small"
                  onClick={() =>
                    setProduct((current) => ({
                      ...current,
                      priceRules: current.priceRules.filter((item) => item.id !== rule.id)
                    }))
                  }
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
        {product.priceRules.length === 0 ? <div className="placeholder-block">当前没有固定加价规则，请先新增。</div> : null}
      </div>
    </SectionCard>
  )
}
