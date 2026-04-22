import { describe, expect, it } from 'vitest'
import { mockProducts } from '@/mocks/products'
import { buildQuoteResult } from '@/utils/quote/buildQuoteResult'
import { matchPriceRules } from '@/utils/quote/matchPriceRules'

const ringProduct = mockProducts[0]
const ringSpec = ringProduct.specs.find((item) => item.specValue === '16号')

describe('matchPriceRules', () => {
  it('matches material, process, and special options', () => {
    const result = matchPriceRules({
      selectedMaterial: '18K金',
      selectedProcess: '微镶',
      selectedSpecialOptions: ['刻字'],
      rules: ringProduct.priceRules
    })

    expect(result.adjustments).toEqual([
      { type: 'material', ruleKey: '18K金', delta: 300 },
      { type: 'process', ruleKey: '微镶', delta: 200 },
      { type: 'special', ruleKey: '刻字', delta: 50 }
    ])
    expect(result.warnings).toHaveLength(0)
  })

  it('returns warning when a selected option has no matching rule', () => {
    const result = matchPriceRules({
      selectedMaterial: '足金',
      selectedProcess: '亮面',
      selectedSpecialOptions: ['未知需求'],
      rules: ringProduct.priceRules
    })

    expect(result.adjustments).toEqual([])
    expect(result.warnings[0]?.code).toBe('missing_rule')
  })
})

describe('buildQuoteResult', () => {
  it('returns waiting_spec when required spec is missing', () => {
    const result = buildQuoteResult({
      selectedSpec: undefined,
      selectedMaterial: '18K金',
      selectedProcess: '微镶',
      selectedSpecialOptions: ['刻字'],
      rules: ringProduct.priceRules,
      specRequired: true
    })

    expect(result.status).toBe('waiting_spec')
    expect(result.warnings[0]?.code).toBe('waiting_spec')
  })

  it('returns ready quote when spec and rules are complete', () => {
    const result = buildQuoteResult({
      selectedSpec: ringSpec,
      selectedMaterial: '18K金',
      selectedProcess: '微镶',
      selectedSpecialOptions: ['刻字'],
      rules: ringProduct.priceRules,
      specRequired: true
    })

    expect(result.status).toBe('ready')
    expect(result.basePrice).toBe(1450)
    expect(result.systemQuote).toBe(2000)
  })

  it('returns warning when selected spec has no base price', () => {
    const result = buildQuoteResult({
      selectedSpec: { ...ringSpec!, basePrice: undefined },
      selectedMaterial: '18K金',
      selectedProcess: '微镶',
      selectedSpecialOptions: [],
      rules: ringProduct.priceRules,
      specRequired: true
    })

    expect(result.status).toBe('warning')
    expect(result.warnings.some((warning) => warning.code === 'missing_base_price')).toBe(true)
  })
})
