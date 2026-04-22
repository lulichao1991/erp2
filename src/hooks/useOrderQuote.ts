import { useMemo } from 'react'
import { buildQuoteResult } from '@/services/quote/quoteService'
import type { OrderItem } from '@/types/order'
import type { Product } from '@/types/product'

export const useOrderQuote = (item: OrderItem, product?: Product) =>
  useMemo(() => {
    if (!product) {
      return item.quote
    }

    return buildQuoteResult({
      selectedSpec: item.selectedSpecSnapshot,
      selectedMaterial: item.selectedMaterial,
      selectedProcess: item.selectedProcess,
      selectedSpecialOptions: item.selectedSpecialOptions,
      rules: product.priceRules,
      specRequired: product.isSpecRequired
    })
  }, [item, product])
