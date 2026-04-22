import type { BuildQuoteInput, QuoteResult } from '@/types/quote'
import { matchPriceRules } from '@/utils/quote/matchPriceRules'

export const buildQuoteResult = ({
  selectedSpec,
  selectedMaterial,
  selectedProcess,
  selectedSpecialOptions,
  rules,
  specRequired = true
}: BuildQuoteInput): QuoteResult => {
  if (specRequired && !selectedSpec) {
    return {
      basePrice: undefined,
      priceAdjustments: [],
      systemQuote: undefined,
      status: 'waiting_spec',
      warnings: [{ code: 'waiting_spec', message: '当前产品需要先选择规格后才能生成系统参考报价。' }]
    }
  }

  const basePrice = selectedSpec?.basePrice ?? 0
  const { adjustments, warnings } = matchPriceRules({
    selectedMaterial,
    selectedProcess,
    selectedSpecialOptions,
    rules
  })

  if (selectedSpec && typeof selectedSpec.basePrice !== 'number') {
    return {
      basePrice: undefined,
      priceAdjustments: adjustments,
      systemQuote: undefined,
      status: 'warning',
      warnings: [
        {
          code: 'missing_base_price',
          message: '当前规格没有维护基础价格，请先补齐基础价格后再确认系统参考报价。'
        },
        ...warnings
      ]
    }
  }

  const systemQuote = basePrice + adjustments.reduce((total, item) => total + item.delta, 0)

  return {
    basePrice,
    priceAdjustments: adjustments,
    systemQuote,
    status: warnings.length > 0 ? 'warning' : 'ready',
    warnings
  }
}
