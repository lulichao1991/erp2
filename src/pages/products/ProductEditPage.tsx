import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppBreadcrumb } from '@/app/layout/AppBreadcrumb'
import {
  ProductBasicFormSection,
  ProductAssetsFormSection,
  ProductCustomRuleFormSection,
  ProductDesignVersionFormSection,
  ProductEditHeader,
  ProductEditSideNav,
  ProductParamFormSection,
  ProductPriceRuleFormSection,
  ProductProductionRefFormSection,
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
        <EmptyState title="未找到款式" description="当前款式不存在，无法进入编辑页。" />
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
      version: sourceProduct?.version ?? product.version,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    })
    navigate(`/products/${product.id}`)
  }

  const handleCreateDesignVersion = (nextProduct: Product) => {
    appData.saveProduct(nextProduct)
    navigate(`/products/${nextProduct.id}`)
  }

  return (
    <PageContainer>
      <AppBreadcrumb
        items={[
          { label: '款式管理', to: '/products' },
          { label: '款式详情', to: `/products/${product.id}` },
          { label: product.name || '未命名款式' },
          { label: '编辑款式' }
        ]}
      />
      <ProductEditHeader mode="edit" onSave={handleSave} hasUnsavedChanges />
      <div className="editor-shell">
        <ProductEditSideNav activeSection="basic-form" showVersionSection />
        <div className="section-stack">
          <ProductBasicFormSection
            product={product}
            setProduct={setDraftProduct}
            fieldOptions={appData.productFieldOptions}
            onAddGlobalOption={appData.addGlobalProductFieldOption}
          />
          <ProductDesignVersionFormSection product={product} onCreateVersion={handleCreateDesignVersion} />
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
          <ProductCustomRuleFormSection product={product} setProduct={setDraftProduct} />
          <ProductProductionRefFormSection product={product} setProduct={setDraftProduct} />
          <ProductAssetsFormSection product={product} setProduct={setDraftProduct} />
        </div>
      </div>
    </PageContainer>
  )
}
