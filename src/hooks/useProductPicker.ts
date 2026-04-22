import { useMemo, useState } from 'react'
import type { Product } from '@/types/product'

type ProductPickerFilters = {
  category: string
  status: string
  isReferable: 'all' | 'yes'
}

export const useProductPicker = (products: Product[]) => {
  const [keyword, setKeyword] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(products[0]?.id)
  const [filters, setFilters] = useState<ProductPickerFilters>({
    category: 'all',
    status: 'all',
    isReferable: 'yes'
  })

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesKeyword =
        keyword.trim().length === 0 ||
        [product.name, product.code, product.series].filter(Boolean).join(' ').toLowerCase().includes(keyword.toLowerCase())
      const matchesCategory = filters.category === 'all' || product.category === filters.category
      const matchesStatus = filters.status === 'all' || product.status === filters.status
      const matchesReferable = filters.isReferable === 'all' || product.isReferable
      return matchesKeyword && matchesCategory && matchesStatus && matchesReferable
    })
  }, [filters, keyword, products])

  const selectedProduct = filteredProducts.find((item) => item.id === selectedProductId) ?? filteredProducts[0]

  return {
    keyword,
    setKeyword,
    filters,
    setFilters,
    selectedProductId,
    setSelectedProductId,
    filteredProducts,
    selectedProduct
  }
}
