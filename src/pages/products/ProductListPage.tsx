import { useMemo, useState } from 'react'
import { PageContainer } from '@/components/common'
import { ProductFieldDictionaryDrawer, ProductFilterBar, ProductListHeader, ProductQuickStats, ProductTable } from '@/components/business/product'
import { useAppData } from '@/hooks/useAppData'

export const ProductListPage = () => {
  const appData = useAppData()
  const { products } = appData
  const [dictionaryOpen, setDictionaryOpen] = useState(false)
  const [filters, setFilters] = useState({
    keyword: '',
    category: 'all',
    status: 'all',
    referable: 'all'
  })

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesKeyword =
          filters.keyword.trim().length === 0 ||
          [product.name, product.code, product.series].filter(Boolean).join(' ').toLowerCase().includes(filters.keyword.toLowerCase())
        const matchesCategory = filters.category === 'all' || product.category === filters.category
        const matchesStatus = filters.status === 'all' || product.status === filters.status
        const matchesReferable =
          filters.referable === 'all' || (filters.referable === 'yes' ? product.isReferable : !product.isReferable)
        return matchesKeyword && matchesCategory && matchesStatus && matchesReferable
      }),
    [filters, products]
  )

  return (
    <PageContainer>
      <ProductListHeader onOpenDictionary={() => setDictionaryOpen(true)} />
      <div className="stack">
        <ProductQuickStats products={products} />
        <ProductFilterBar value={filters} onChange={setFilters} />
        <ProductTable products={filteredProducts} />
      </div>
      <ProductFieldDictionaryDrawer
        open={dictionaryOpen}
        fieldOptions={appData.productFieldOptions}
        onClose={() => setDictionaryOpen(false)}
        onAdd={appData.addGlobalProductFieldOption}
        onRemove={appData.removeGlobalProductFieldOption}
        onSaveSizeParameters={appData.saveGlobalSizeParameterDefinitions}
      />
    </PageContainer>
  )
}
