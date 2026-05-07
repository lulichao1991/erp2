import { useState, type KeyboardEvent } from 'react'
import type { ProductFieldOptionKey } from '@/services/product/productFieldOptions'

const splitValues = (value: string) =>
  value
    .split(/[,\n，]/)
    .map((item) => item.trim())
    .filter(Boolean)

const mergeUniqueValues = (...groups: Array<string[] | undefined>) =>
  Array.from(new Set(groups.flatMap((group) => group ?? []).map((item) => item.trim()).filter(Boolean)))

const toggleArrayValue = (values: string[], target: string) =>
  values.includes(target) ? values.filter((item) => item !== target) : [...values, target]

const buildSelectOptions = (defaults: string[], selected: string[]) => mergeUniqueValues(defaults, selected)

export const ProductOptionSelectorField = ({
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
