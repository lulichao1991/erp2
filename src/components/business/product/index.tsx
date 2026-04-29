import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { Dispatch, KeyboardEvent, SetStateAction } from 'react'
import {
  FileList,
  ImageGallery,
  ImageThumb,
  InfoField,
  InfoGrid,
  PageHeader,
  RecordTimeline,
  ReferenceTag,
  RiskTag,
  SectionCard,
  SideDrawer,
  StatusTag,
  SummaryCard,
  VersionBadge
} from '@/components/common'
import type { ProductFieldOptionKey, ProductFieldOptions, ProductSizeParameterDefinition } from '@/services/product/productFieldOptions'
import type { Product, ProductPriceRule, ProductReferenceRecord, ProductSpecRow, ProductVersionRecord } from '@/types/product'

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

const buildSpecDraft = (product: Product): ProductSpecRow => {
  const sizeFieldTemplate = product.specs[0]?.sizeFields ?? []

  return {
    id: `spec-${Date.now()}`,
    productId: product.id,
    specValue: '',
    sortOrder: product.specs.length + 1,
    status: 'enabled',
    basePrice: 0,
    referenceWeight: 0,
    sizeFields: sizeFieldTemplate.map((field, index) => ({
      key: field.key || field.label || '',
      label: field.label,
      value: '',
      unit: field.unit ?? ''
    }))
  }
}

const mergeUniqueValues = (...groups: Array<string[] | undefined>) =>
  Array.from(new Set(groups.flatMap((group) => group ?? []).map((item) => item.trim()).filter(Boolean)))

const toggleArrayValue = (values: string[], target: string) =>
  values.includes(target) ? values.filter((item) => item !== target) : [...values, target]

const buildSelectOptions = (defaults: string[], selected: string[]) => mergeUniqueValues(defaults, selected)

const productCategoryOptions: Array<{ value: Product['category']; label: string }> = [
  { value: 'ring', label: '戒指' },
  { value: 'pendant', label: '吊坠' },
  { value: 'necklace', label: '项链' },
  { value: 'earring', label: '耳饰' },
  { value: 'bracelet', label: '手链' },
  { value: 'other', label: '其他' }
]

const referenceRecordStatusLabel: Record<ProductReferenceRecord['status'], string> = {
  referenced: '已引用',
  adjusted: '已调整',
  closed: '已关闭'
}

const versionRecordStatusLabel: Record<ProductVersionRecord['status'], string> = {
  published: '已发布',
  draft: '草稿'
}

const renderReferenceStatus = (status: ProductReferenceRecord['status']) =>
  status === 'adjusted' ? <RiskTag value={referenceRecordStatusLabel[status]} /> : <StatusTag value={referenceRecordStatusLabel[status]} />

const getReferencePurchaseLabel = (record: ProductReferenceRecord) => record.purchaseNo || record.transactionNo || '未关联购买记录'

const getReferenceOrderLineLabel = (record: ProductReferenceRecord) =>
  [record.orderLineCode, record.orderLineName].filter(Boolean).join(' · ') || '未关联销售'

const renderReferencePurchaseLink = (record: ProductReferenceRecord) =>
  record.purchaseId ? <Link to={`/purchases/${record.purchaseId}`}>{getReferencePurchaseLabel(record)}</Link> : getReferencePurchaseLabel(record)

const ProductOptionSelectorField = ({
  label,
  values,
  defaultOptions,
  onChange,
  onAddToGlobalDictionary,
  fieldKey,
  addLabel,
  triggerPlaceholder
}: {
  label: string
  values: string[]
  defaultOptions: string[]
  onChange: (next: string[]) => void
  onAddToGlobalDictionary: (field: ProductFieldOptionKey, value: string) => void
  fieldKey: ProductFieldOptionKey
  addLabel: string
  triggerPlaceholder: string
}) => {
  const [customValue, setCustomValue] = useState('')
  const [open, setOpen] = useState(false)
  const optionPool = buildSelectOptions(defaultOptions, values)

  const handleAddCustom = () => {
    const nextValues = mergeUniqueValues(values, splitValues(customValue))
    onChange(nextValues)
    setCustomValue('')
  }

  const handleAddToGlobalDictionary = () => {
    const additions = splitValues(customValue)

    if (additions.length === 0) {
      return
    }

    onChange(mergeUniqueValues(values, additions))
    additions.forEach((item) => onAddToGlobalDictionary(fieldKey, item))
    setCustomValue('')
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAddCustom()
    }
  }

  return (
    <div className="field-control multi-select-field">
      <label className="field-label">{label}</label>
      <button
        type="button"
        className={`select multi-select-trigger${open ? ' open' : ''}`}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <div className="multi-select-trigger-values">
          {values.length > 0 ? (
            values.map((value) => (
              <span key={value} className="multi-select-tag">
                {value}
              </span>
            ))
          ) : (
            <span className="multi-select-placeholder">{triggerPlaceholder}</span>
          )}
        </div>
        <span className="multi-select-caret">{open ? '▴' : '▾'}</span>
      </button>
      {open ? (
        <div className="multi-select-panel">
          <div className="multi-select-add-row">
            <input
              className="input"
              aria-label={`${label}自定义补充`}
              value={customValue}
              onChange={(event) => setCustomValue(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={addLabel}
            />
            <button
              type="button"
              className="button secondary small"
              aria-label={`仅添加${label}到当前产品`}
              onClick={handleAddCustom}
              disabled={splitValues(customValue).length === 0}
            >
              仅当前产品
            </button>
            <button
              type="button"
              className="button primary small"
              aria-label={`加入${label}到全局字典`}
              onClick={handleAddToGlobalDictionary}
              disabled={splitValues(customValue).length === 0}
            >
              加入全局字典
            </button>
          </div>
          <div className="text-muted">加入全局字典后，本机后续新建或编辑其他产品时也能看到这个选项。</div>
          <div className="multi-select-options">
            {optionPool.map((option) => {
              const selected = values.includes(option)

              return (
                <label key={option} className={`multi-select-option${selected ? ' active' : ''}`}>
                  <input type="checkbox" checked={selected} onChange={() => onChange(toggleArrayValue(values, option))} />
                  <span>{option}</span>
                </label>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

const optionSelectorProps = {
  styleTags: {
    addLabel: '补充风格标签，例如：先锋感、复古机能',
    triggerPlaceholder: '请选择风格标签，可多选'
  },
  sceneTags: {
    addLabel: '补充场景标签，例如：周年礼物、直播选品',
    triggerPlaceholder: '请选择场景标签，可多选'
  },
  supportedMaterials: {
    addLabel: '补充材质，例如：玫瑰金、925 银',
    triggerPlaceholder: '请选择支持材质，可多选'
  },
  supportedProcesses: {
    addLabel: '补充工艺，例如：手工錾刻、局部磨砂',
    triggerPlaceholder: '请选择支持工艺，可多选'
  },
  supportedSpecialOptions: {
    addLabel: '补充特殊需求，例如：附加祝福卡、加长链尾',
    triggerPlaceholder: '请选择支持特殊需求，可多选'
  }
} as const

const productFieldDictionaryMeta: Array<{
  key: ProductFieldOptionKey
  label: string
  description: string
  placeholder: string
}> = [
  {
    key: 'styleTags',
    label: '风格标签',
    description: '用于产品风格分类和快速筛选，适合由管理员统一维护。',
    placeholder: '例如：学院风、未来感'
  },
  {
    key: 'sceneTags',
    label: '场景标签',
    description: '用于礼赠、婚礼、节庆等使用场景，建议统一口径。',
    placeholder: '例如：生日礼物、情侣纪念'
  },
  {
    key: 'supportedMaterials',
    label: '支持材质',
    description: '用于产品可选材质，后续接后端时建议升级成共享材质字典。',
    placeholder: '例如：玫瑰金、925 银'
  },
  {
    key: 'supportedProcesses',
    label: '支持工艺',
    description: '用于产品可选工艺，建议由管理员维护常用工艺词库。',
    placeholder: '例如：手工錾刻、局部磨砂'
  },
  {
    key: 'supportedSpecialOptions',
    label: '特殊需求',
    description: '用于客服与购买记录 / 销售协同的特殊需求选项，后续可扩展到销售侧字典。',
    placeholder: '例如：附加祝福卡、延保服务'
  }
]

const ProductFieldDictionarySection = ({
  label,
  description,
  placeholder,
  values,
  onAdd,
  onRemove
}: {
  label: string
  description: string
  placeholder: string
  values: string[]
  onAdd: (value: string) => void
  onRemove: (value: string) => void
}) => {
  const [draftValue, setDraftValue] = useState('')

  const handleAdd = () => {
    const additions = splitValues(draftValue)

    if (additions.length === 0) {
      return
    }

    additions.forEach((item) => onAdd(item))
    setDraftValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="subtle-panel stack" style={{ gap: 12 }}>
      <div>
        <strong>{label}</strong>
        <div className="text-muted spacer-top">{description}</div>
      </div>
      <div className="dictionary-chip-list">
        {values.length > 0 ? (
          values.map((value) => (
            <div key={value} className="dictionary-chip">
              <span>{value}</span>
              <button type="button" className="button ghost small" onClick={() => onRemove(value)}>
                删除
              </button>
            </div>
          ))
        ) : (
          <div className="placeholder-block">当前还没有维护字典项。</div>
        )}
      </div>
      <div className="dictionary-add-row">
        <input
          className="input"
          aria-label={`${label}字典新增`}
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button type="button" className="button primary" onClick={handleAdd} disabled={splitValues(draftValue).length === 0}>
          加入字典
        </button>
      </div>
    </div>
  )
}

const ProductSizeParameterDictionarySection = ({
  values,
  onChange
}: {
  values: ProductSizeParameterDefinition[]
  onChange: (next: ProductSizeParameterDefinition[]) => void
}) => {
  const [draftValues, setDraftValues] = useState(values)

  useEffect(() => {
    setDraftValues(values)
  }, [values])

  return (
    <div className="subtle-panel stack" style={{ gap: 12 }}>
      <div>
        <strong>尺寸参数字典</strong>
        <div className="text-muted spacer-top">用于规格明细里的参数名称下拉，并可按品类筛选、自动带默认单位。</div>
      </div>
      <div className="stack" style={{ gap: 12 }}>
        {draftValues.map((item, index) => (
          <div key={`size-param-${index}`} className="subtle-panel stack" style={{ gap: 12 }}>
            <div className="field-grid three">
              <div className="field-control">
                <label className="field-label">显示名称</label>
                <input
                  className="input"
                  aria-label={`尺寸参数显示名称-${index + 1}`}
                  value={item.label}
                  onChange={(event) =>
                    setDraftValues(
                      draftValues.map((entry, currentIndex) => (currentIndex === index ? { ...entry, label: event.target.value } : entry))
                    )
                  }
                />
              </div>
              <div className="field-control">
                <label className="field-label">默认单位</label>
                <input
                  className="input"
                  aria-label={`尺寸参数默认单位-${index + 1}`}
                  value={item.unit}
                  onChange={(event) =>
                    setDraftValues(
                      draftValues.map((entry, currentIndex) => (currentIndex === index ? { ...entry, unit: event.target.value } : entry))
                    )
                  }
                />
              </div>
              <div className="field-control">
                <label className="field-label">操作</label>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setDraftValues(draftValues.filter((_, currentIndex) => currentIndex !== index))}
                >
                  删除
                </button>
              </div>
            </div>
            <div className="field-control">
              <label className="field-label">适用品类</label>
              <div className="row wrap">
                {productCategoryOptions.map((category) => {
                  const selected = item.categories.includes(category.value)

                  return (
                    <label key={`size-param-${index}-${category.value}`} className={`tag ${selected ? 'status-enabled' : 'reference-off'}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          setDraftValues(
                            draftValues.map((entry, currentIndex) => {
                              if (currentIndex !== index) {
                                return entry
                              }

                              return {
                                ...entry,
                                categories: selected
                                  ? entry.categories.filter((value) => value !== category.value)
                                  : [...entry.categories, category.value]
                              }
                            })
                          )
                        }
                      />
                      <span>{category.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="row wrap">
        <button
          type="button"
          className="button secondary"
          onClick={() =>
            setDraftValues([
              ...draftValues,
              {
                label: '',
                unit: '',
                categories: ['ring']
              }
            ])
          }
        >
          新增尺寸参数
        </button>
        <button type="button" className="button primary" onClick={() => onChange(draftValues)}>
          保存尺寸参数字典
        </button>
      </div>
    </div>
  )
}

export const ProductFieldDictionaryDrawer = ({
  open,
  fieldOptions,
  onClose,
  onAdd,
  onRemove,
  onSaveSizeParameters
}: {
  open: boolean
  fieldOptions: ProductFieldOptions
  onClose: () => void
  onAdd: (field: ProductFieldOptionKey, value: string) => void
  onRemove: (field: ProductFieldOptionKey, value: string) => void
  onSaveSizeParameters: (next: ProductSizeParameterDefinition[]) => void
}) => (
  <SideDrawer
    open={open}
    title="字典配置"
    onClose={onClose}
  >
    <div className="stack">
      <ProductSizeParameterDictionarySection values={fieldOptions.sizeParameterDefinitions} onChange={onSaveSizeParameters} />
      {productFieldDictionaryMeta.map((group) => (
        <ProductFieldDictionarySection
          key={group.key}
          label={group.label}
          description={group.description}
          placeholder={group.placeholder}
          values={fieldOptions[group.key]}
          onAdd={(value) => onAdd(group.key, value)}
          onRemove={(value) => onRemove(group.key, value)}
        />
      ))}
    </div>
  </SideDrawer>
)

export const ProductListHeader = ({ onOpenDictionary }: { onOpenDictionary?: () => void }) => (
  <PageHeader
    title="款式列表"
    className="compact-page-header"
    actions={
      <>
        {onOpenDictionary ? (
          <button type="button" className="button secondary" onClick={onOpenDictionary}>
            字典配置
          </button>
        ) : null}
        <Link to="/products/new" className="button primary">
          新建款式
        </Link>
      </>
    }
  />
)

export const ProductQuickStats = ({ products }: { products: Product[] }) => {
  const firstPrices = products.map((item) => item.specs[0]?.basePrice).filter((value): value is number => typeof value === 'number')
  const averagePrice = firstPrices.length > 0 ? Math.round(firstPrices.reduce((sum, item) => sum + item, 0) / firstPrices.length) : 0

  const stats = [
    { label: '全部款式', value: products.length },
    { label: '可引用', value: products.filter((item) => item.isReferable).length },
    { label: '启用中', value: products.filter((item) => item.status === 'enabled').length },
    { label: '单轴规格', value: products.filter((item) => item.specMode === 'single_axis').length },
    { label: '固定规则数', value: products.reduce((sum, item) => sum + item.priceRules.length, 0) },
    { label: '平均参考价', value: `¥ ${averagePrice}` }
  ]

  return (
    <div className="stats-grid compact-stats">
      {stats.map((item) => (
        <div key={item.label} className="stat-card compact-stat">
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
  <SectionCard title="搜索与筛选" className="compact-card">
    <div className="field-grid four">
      <div className="field-control">
        <label className="field-label">搜索款式名称 / 编号</label>
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
          <th>款式信息</th>
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
    title="款式详情"
    actions={
      <>
        <Link to={`/products/${product.id}/edit`} className="button primary">
          编辑款式
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
      <InfoField label="款式名称" value={product.name} />
      <InfoField label="款式编号" value={product.code} />
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

export const ProductReferenceRecordSection = ({
  product,
  onOpen
}: {
  product: Product
  onOpen: () => void
}) => (
  <SectionCard
    id="references"
    title="引用记录"
    description="查看哪些销售引用了当前模板，以及销售侧是否已经在模板基础上做过调整。"
    actions={
      <button type="button" className="button secondary small" onClick={onOpen}>
        查看全部引用记录
      </button>
    }
  >
    {product.referenceRecords.length > 0 ? (
      <div className="stack">
        {product.referenceRecords.slice(0, 2).map((record) => (
          <div key={record.id} className="subtle-panel">
            <div className="row wrap" style={{ justifyContent: 'space-between' }}>
              <div className="row wrap">
                <Link to="/order-lines" className="text-price">
                  {getReferenceOrderLineLabel(record)}
                </Link>
                <VersionBadge value={record.sourceVersion} />
                {renderReferenceStatus(record.status)}
              </div>
              <span className="text-caption">{record.referencedAt}</span>
            </div>
            <div className="spacer-top">
              <InfoGrid columns={2}>
                <InfoField label="购买记录" value={renderReferencePurchaseLink(record)} />
                <InfoField label="客户" value={record.customerName} />
                <InfoField label="销售" value={getReferenceOrderLineLabel(record)} />
                <InfoField label="引用规格" value={record.selectedSpecValue || '—'} />
                <InfoField label="备注" value={record.note || '—'} />
              </InfoGrid>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="placeholder-block">当前产品还没有被销售引用。</div>
    )}
  </SectionCard>
)

export const ProductVersionHistorySection = ({
  product,
  onOpen
}: {
  product: Product
  onOpen: () => void
}) => (
  <SectionCard
    id="versions"
    title="版本记录"
    description="查看款式模板版本演进、更新摘要和相关文件，首轮先做查看态。"
    actions={
      <button type="button" className="button secondary small" onClick={onOpen}>
        查看版本记录
      </button>
    }
  >
    {product.versionHistory.length > 0 ? (
      <div className="stack">
        {product.versionHistory.slice(0, 2).map((record) => (
          <div key={record.id} className="subtle-panel">
            <div className="row wrap" style={{ justifyContent: 'space-between' }}>
              <div className="row wrap">
                <VersionBadge value={record.version} />
                <StatusTag value={versionRecordStatusLabel[record.status]} />
              </div>
              <span className="text-caption">
                {record.updatedAt} · {record.operatorName}
              </span>
            </div>
            <div className="spacer-top stack" style={{ gap: 10 }}>
              <div>{record.summary}</div>
              <div className="row wrap">
                {record.relatedFiles.map((file) => (
                  <span key={file} className="tag version">
                    {file}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="placeholder-block">当前产品还没有版本记录。</div>
    )}
  </SectionCard>
)

export const ProductReferenceRecordsDrawer = ({
  open,
  product,
  onClose
}: {
  open: boolean
  product: Product
  onClose: () => void
}) => {
  const adjustedCount = product.referenceRecords.filter((record) => record.status === 'adjusted').length

  return (
    <SideDrawer
      open={open}
      title="产品引用记录"
      onClose={onClose}
    >
      <div className="stack">
        <div className="field-grid three">
          <div className="subtle-panel">
            <div className="text-caption">累计引用次数</div>
            <div className="quote-value">{product.referenceRecords.length}</div>
          </div>
          <div className="subtle-panel">
            <div className="text-caption">待重点核对</div>
            <div className="quote-value">{adjustedCount}</div>
          </div>
          <div className="subtle-panel">
            <div className="text-caption">当前模板版本</div>
            <div className="row wrap spacer-top">
              <VersionBadge value={product.version} />
            </div>
          </div>
        </div>
        {product.referenceRecords.length > 0 ? (
          product.referenceRecords.map((record) => (
            <div key={record.id} className="subtle-panel">
              <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                <div className="row wrap">
                  <Link to="/order-lines" className="text-price">
                    {getReferenceOrderLineLabel(record)}
                  </Link>
                  <VersionBadge value={record.sourceVersion} />
                  {renderReferenceStatus(record.status)}
                </div>
                <Link to="/order-lines" className="button ghost small">
                  查看销售
                </Link>
              </div>
              <div className="spacer-top">
                <InfoGrid columns={2}>
                  <InfoField label="购买记录" value={renderReferencePurchaseLink(record)} />
                  <InfoField label="客户" value={record.customerName} />
                  <InfoField label="销售" value={getReferenceOrderLineLabel(record)} />
                  <InfoField label="引用规格" value={record.selectedSpecValue || '—'} />
                  <InfoField label="引用时间" value={record.referencedAt} />
                </InfoGrid>
              </div>
              {record.note ? <div className="spacer-top text-muted">{record.note}</div> : null}
            </div>
          ))
        ) : (
          <div className="placeholder-block">当前产品还没有引用记录。</div>
        )}
      </div>
    </SideDrawer>
  )
}

export const ProductVersionHistoryDrawer = ({
  open,
  product,
  onClose
}: {
  open: boolean
  product: Product
  onClose: () => void
}) => (
  <SideDrawer
    open={open}
    title="产品版本记录"
    onClose={onClose}
  >
    <div className="stack">
      <div className="field-grid three">
        <div className="subtle-panel">
          <div className="text-caption">当前版本</div>
          <div className="row wrap spacer-top">
            <VersionBadge value={product.version} />
          </div>
        </div>
        <div className="subtle-panel">
          <div className="text-caption">版本数</div>
          <div className="quote-value">{product.versionHistory.length}</div>
        </div>
        <div className="subtle-panel">
          <div className="text-caption">最近更新</div>
          <div className="spacer-top">{product.versionHistory[0]?.updatedAt || '—'}</div>
        </div>
      </div>
      <RecordTimeline
        items={product.versionHistory.map((record) => ({
          id: record.id,
          title: `${record.version} · ${record.operatorName}`,
          meta: (
            <div className="row wrap">
              <StatusTag value={versionRecordStatusLabel[record.status]} />
              <span className="text-caption">{record.updatedAt}</span>
            </div>
          ),
          description: (
            <div className="stack" style={{ gap: 8 }}>
              <div>{record.summary}</div>
              <ul className="list-reset stack" style={{ gap: 8 }}>
                {record.changes.map((change) => (
                  <li key={change} className="text-muted">
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ),
          extra: (
            <div className="row wrap">
              {record.relatedFiles.map((file) => (
                <span key={file} className="tag version">
                  {file}
                </span>
              ))}
            </div>
          )
        }))}
      />
    </div>
  </SideDrawer>
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
    title={mode === 'create' ? '新建款式' : '编辑款式'}
    actions={
      <>
        <span className="topbar-pill">{hasUnsavedChanges ? '有未保存修改' : '已同步到当前页面状态'}</span>
        <button className="button primary" onClick={onSave}>
          {mode === 'create' ? '创建款式' : '保存修改'}
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
  setProduct,
  fieldOptions,
  onAddGlobalOption
}: {
  product: Product
  setProduct: Dispatch<SetStateAction<Product>>
  fieldOptions: ProductFieldOptions
  onAddGlobalOption: (field: ProductFieldOptionKey, value: string) => void
}) => (
  <SectionCard id="basic-form" title="基础信息">
    <div className="field-grid two">
      <div className="field-control">
        <label className="field-label">款式名称</label>
        <input className="input" value={product.name} onChange={(event) => setProduct((current) => ({ ...current, name: event.target.value }))} />
      </div>
      <div className="field-control">
        <label className="field-label">款式编号</label>
        <input className="input" value={product.code} onChange={(event) => setProduct((current) => ({ ...current, code: event.target.value }))} />
      </div>
      <div className="field-control">
        <label className="field-label">短名称</label>
        <input className="input" value={product.shortName || ''} onChange={(event) => setProduct((current) => ({ ...current, shortName: event.target.value }))} />
      </div>
      <div className="field-control">
        <label className="field-label">品类</label>
        <select
          className="select"
          aria-label="品类"
          value={product.category}
          onChange={(event) => setProduct((current) => ({ ...current, category: event.target.value as Product['category'] }))}
        >
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
      <ProductOptionSelectorField
        label="风格标签"
        values={product.styleTags}
        defaultOptions={fieldOptions.styleTags}
        fieldKey="styleTags"
        {...optionSelectorProps.styleTags}
        onAddToGlobalDictionary={onAddGlobalOption}
        onChange={(next) => setProduct((current) => ({ ...current, styleTags: next }))}
      />
      <ProductOptionSelectorField
        label="场景标签"
        values={product.sceneTags}
        defaultOptions={fieldOptions.sceneTags}
        fieldKey="sceneTags"
        {...optionSelectorProps.sceneTags}
        onAddToGlobalDictionary={onAddGlobalOption}
        onChange={(next) => setProduct((current) => ({ ...current, sceneTags: next }))}
      />
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
  setProduct,
  fieldOptions,
  onAddGlobalOption
}: {
  product: Product
  setProduct: Dispatch<SetStateAction<Product>>
  fieldOptions: ProductFieldOptions
  onAddGlobalOption: (field: ProductFieldOptionKey, value: string) => void
}) => {
  const materialOptions = product.supportedMaterials
  const processOptions = product.supportedProcesses

  return (
    <SectionCard id="param-form" title="参数配置">
      <div className="field-grid two">
        <ProductOptionSelectorField
          label="支持材质"
          values={product.supportedMaterials}
          defaultOptions={fieldOptions.supportedMaterials}
          fieldKey="supportedMaterials"
          {...optionSelectorProps.supportedMaterials}
          onAddToGlobalDictionary={onAddGlobalOption}
          onChange={(next) =>
            setProduct((current) => ({
              ...current,
              supportedMaterials: next,
              defaultMaterial: next.includes(current.defaultMaterial || '') ? current.defaultMaterial : next[0] || ''
            }))
          }
        />
        <div className="field-control">
          <label className="field-label">默认材质</label>
          <select
            className="select"
            aria-label="默认材质"
            value={product.defaultMaterial || ''}
            onChange={(event) => setProduct((current) => ({ ...current, defaultMaterial: event.target.value }))}
          >
            <option value="">未设置默认材质</option>
            {materialOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <ProductOptionSelectorField
          label="支持工艺"
          values={product.supportedProcesses}
          defaultOptions={fieldOptions.supportedProcesses}
          fieldKey="supportedProcesses"
          {...optionSelectorProps.supportedProcesses}
          onAddToGlobalDictionary={onAddGlobalOption}
          onChange={(next) =>
            setProduct((current) => ({
              ...current,
              supportedProcesses: next,
              defaultProcess: next.includes(current.defaultProcess || '') ? current.defaultProcess : next[0] || ''
            }))
          }
        />
        <div className="field-control">
          <label className="field-label">默认工艺</label>
          <select
            className="select"
            aria-label="默认工艺"
            value={product.defaultProcess || ''}
            onChange={(event) => setProduct((current) => ({ ...current, defaultProcess: event.target.value }))}
          >
            <option value="">未设置默认工艺</option>
            {processOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <ProductOptionSelectorField
          label="支持特殊需求"
          values={product.supportedSpecialOptions}
          defaultOptions={fieldOptions.supportedSpecialOptions}
          fieldKey="supportedSpecialOptions"
          {...optionSelectorProps.supportedSpecialOptions}
          onAddToGlobalDictionary={onAddGlobalOption}
          onChange={(next) => setProduct((current) => ({ ...current, supportedSpecialOptions: next }))}
        />
        <div className="field-control">
          <label className="field-label">规格模式</label>
          <select className="select" value={product.specMode} onChange={(event) => setProduct((current) => ({ ...current, specMode: event.target.value as Product['specMode'] }))}>
            <option value="none">无规格</option>
            <option value="single_axis">单轴规格</option>
          </select>
        </div>
      </div>
      <div className="spacer-top">
        <div className="field-grid three">
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
}

export const ProductSpecSection = ({
  product,
  setProduct,
  sizeParameterDefinitions
}: {
  product: Product
  setProduct: Dispatch<SetStateAction<Product>>
  sizeParameterDefinitions: ProductSizeParameterDefinition[]
}) => {
  const availableSizeParameterDefinitions = sizeParameterDefinitions.filter((item) => item.categories.includes(product.category))
  const getParameterDefinition = (label: string) => availableSizeParameterDefinitions.find((item) => item.label === label)
  const sizeParameterOptionPool = mergeUniqueValues(
    availableSizeParameterDefinitions.map((item) => item.label),
    product.specs.flatMap((item) => item.sizeFields.map((field) => field.label))
  )

  const addSpec = () =>
    setProduct((current) => ({
      ...current,
      specs: [...current.specs, buildSpecDraft(current)]
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
                  aria-label={`规格行${index + 1}-规格值`}
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
                  aria-label={`规格行${index + 1}-基础价格`}
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
                  aria-label={`规格行${index + 1}-参考重量`}
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
                  aria-label={`规格行${index + 1}-状态`}
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
                        sizeFields: [...spec.sizeFields, { key: '', label: '', value: '', unit: '' }]
                      })
                    }))
                  }
                >
                  新增参数
                </button>
              </div>
              <div className="stack">
                {spec.sizeFields.map((field, fieldIndex) => (
                  <div key={`${spec.id}-${fieldIndex}`} className="field-grid four">
                    <div className="field-control">
                      <label className="field-label">参数名称</label>
                      <select
                        className="select"
                        aria-label={`规格行${index + 1}-参数名称-${fieldIndex + 1}`}
                        value={field.label}
                        onChange={(event) =>
                          setProduct((current) => {
                            const nextLabel = event.target.value
                            const matchedDefinition = getParameterDefinition(nextLabel)
                            const nextFields = spec.sizeFields.map((item, currentIndex) =>
                              currentIndex === fieldIndex
                                ? {
                                    ...field,
                                    label: nextLabel,
                                    key: nextLabel,
                                    unit: matchedDefinition?.unit || field.unit || ''
                                  }
                                : item
                            )
                            return {
                              ...current,
                              specs: updateSpecAt(current.specs, index, { ...spec, sizeFields: nextFields })
                            }
                          })
                        }
                      >
                        <option value="">请选择参数名称</option>
                        {sizeParameterOptionPool.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field-control">
                      <label className="field-label">值</label>
                      <input
                        className="input"
                        aria-label={`规格行${index + 1}-值-${fieldIndex + 1}`}
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
                      <input
                        className="input"
                        aria-label={`规格行${index + 1}-单位-${fieldIndex + 1}`}
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
                    </div>
                    <div className="field-control">
                      <label className="field-label">操作</label>
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
                ))}
                {spec.sizeFields.length > 0 ? <div className="text-muted">参数名称来自款式管理里的“字典配置”，字段标识已隐藏为系统内部字段。</div> : null}
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
