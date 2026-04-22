import type { ProductPriceRule } from '@/types/product'
import type { PriceAdjustment, QuoteWarning } from '@/types/quote'

type MatchPriceRulesInput = {
  selectedMaterial?: string
  selectedProcess?: string
  selectedSpecialOptions?: string[]
  rules: ProductPriceRule[]
}

type MatchPriceRulesResult = {
  adjustments: PriceAdjustment[]
  warnings: QuoteWarning[]
}

const buildMissingRuleWarning = (label: string) => ({
  code: 'missing_rule' as const,
  message: `${label} 当前没有匹配到固定加价规则，系统参考报价已按已命中的规则计算。`
})

export const matchPriceRules = ({
  selectedMaterial,
  selectedProcess,
  selectedSpecialOptions = [],
  rules
}: MatchPriceRulesInput): MatchPriceRulesResult => {
  const enabledRules = rules.filter((item) => item.enabled)
  const adjustments: PriceAdjustment[] = []
  const warnings: QuoteWarning[] = []

  const matchOne = (type: ProductPriceRule['type'], value: string | undefined) => {
    if (!value) {
      return
    }

    const matched = enabledRules.find((item) => item.type === type && item.ruleKey === value)

    if (!matched) {
      warnings.push(buildMissingRuleWarning(value))
      return
    }

    adjustments.push({
      type: matched.type,
      ruleKey: matched.ruleKey,
      delta: matched.delta
    })
  }

  matchOne('material', selectedMaterial)
  matchOne('process', selectedProcess)
  selectedSpecialOptions.forEach((option) => matchOne('special', option))

  return {
    adjustments,
    warnings
  }
}
