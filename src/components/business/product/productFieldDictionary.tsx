import { useEffect, useState, type KeyboardEvent } from 'react'
import { SideDrawer } from '@/components/common'
import type { ProductFieldOptionKey, ProductFieldOptions, ProductSizeParameterDefinition } from '@/services/product/productFieldOptions'
import type { Product } from '@/types/product'

const splitValues = (value: string) =>
  value
    .split(/[,\n，]/)
    .map((item) => item.trim())
    .filter(Boolean)

const productCategoryOptions: Array<{ value: Product['category']; label: string }> = [
  { value: 'ring', label: '戒指' },
  { value: 'pendant', label: '吊坠' },
  { value: 'necklace', label: '项链' },
  { value: 'earring', label: '耳饰' },
  { value: 'bracelet', label: '手链' },
  { value: 'other', label: '其他' }
]

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
