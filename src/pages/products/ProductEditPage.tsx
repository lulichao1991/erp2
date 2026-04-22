import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppBreadcrumb } from '@/app/layout/AppBreadcrumb'
import {
  ProductBasicFormSection,
  ProductEditHeader,
  ProductEditSideNav,
  ProductParamFormSection,
  ProductPriceRuleFormSection,
  ProductSpecSection
} from '@/components/business/product'
import { EmptyState, PageContainer } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import type { Product } from '@/types/product'

export const ProductEditPage = () => {
  const navigate = useNavigate()
  const { productId } = useParams()
  const appData = useAppData()
  const sourceProduct = appData.getProduct(productId)
  const [product, setProduct] = useState<Product | null>(sourceProduct ? structuredClone(sourceProduct) : null)

  useEffect(() => {
    setProduct(sourceProduct ? structuredClone(sourceProduct) : null)
  }, [sourceProduct])

  if (!product) {
    return (
      <PageContainer>
        <EmptyState title="未找到产品" description="当前产品不存在，无法进入编辑页。" />
      </PageContainer>
    )
  }

  const setDraftProduct: Dispatch<SetStateAction<Product>> = (value) => {
    setProduct((current) => {
      if (!current) {
        return current
      }

      return typeof value === 'function' ? (value as (previous: Product) => Product)(current) : value
    })
  }

  const handleSave = () => {
    appData.saveProduct({
      ...product,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    })
    navigate(`/products/${product.id}`)
  }

  return (
    <PageContainer>
      <AppBreadcrumb
        items={[
          { label: '产品管理', to: '/products' },
          { label: '产品详情', to: `/products/${product.id}` },
          { label: product.name || '未命名产品' },
          { label: '编辑产品' }
        ]}
      />
      <ProductEditHeader mode="edit" onSave={handleSave} hasUnsavedChanges />
      <div className="editor-shell">
        <ProductEditSideNav activeSection="basic-form" />
        <div className="section-stack">
          <ProductBasicFormSection
            product={product}
            setProduct={setDraftProduct}
            fieldOptions={appData.productFieldOptions}
            onAddGlobalOption={appData.addGlobalProductFieldOption}
          />
          <ProductParamFormSection
            product={product}
            setProduct={setDraftProduct}
            fieldOptions={appData.productFieldOptions}
            onAddGlobalOption={appData.addGlobalProductFieldOption}
          />
          <ProductSpecSection
            product={product}
            setProduct={setDraftProduct}
            sizeParameterDefinitions={appData.productFieldOptions.sizeParameterDefinitions}
          />
          <ProductPriceRuleFormSection product={product} setProduct={setDraftProduct} />
        </div>
      </div>
    </PageContainer>
  )
}
