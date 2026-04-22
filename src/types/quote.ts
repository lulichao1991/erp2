import type { ProductPriceRule, ProductPriceRuleType, ProductSpecRow } from '@/types/product'

export type QuoteWarningCode = 'waiting_spec' | 'missing_base_price' | 'missing_rule'

export type QuoteWarning = {
  code: QuoteWarningCode
  message: string
}

export type PriceAdjustment = {
  type: ProductPriceRuleType
  ruleKey: string
  delta: number
}

export type QuoteResult = {
  basePrice?: number
  priceAdjustments: PriceAdjustment[]
  systemQuote?: number
  status: 'idle' | 'waiting_spec' | 'calculating' | 'ready' | 'warning' | 'conflict'
  warnings: QuoteWarning[]
}

export type BuildQuoteInput = {
  selectedSpec?: ProductSpecRow
  selectedMaterial?: string
  selectedProcess?: string
  selectedSpecialOptions?: string[]
  rules: ProductPriceRule[]
  specRequired?: boolean
}
