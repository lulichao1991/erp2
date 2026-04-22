import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBreadcrumb } from '@/app/layout/AppBreadcrumb'
import {
  ProductBasicFormSection,
  ProductEditHeader,
  ProductEditSideNav,
  ProductParamFormSection,
  ProductPriceRuleFormSection,
  ProductSpecSection
} from '@/components/business/product'
import { PageContainer } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'

export const ProductCreatePage = () => {
  const navigate = useNavigate()
  const appData = useAppData()
  const [product, setProduct] = useState(() => appData.createEmptyProduct())

  const handleSave = () => {
    const saved = appData.saveProduct({
      ...product,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    })
    navigate(`/products/${saved.id}`)
  }

  return (
    <PageContainer>
      <AppBreadcrumb items={[{ label: '产品管理', to: '/products' }, { label: '新建产品' }]} />
      <ProductEditHeader mode="create" onSave={handleSave} hasUnsavedChanges />
      <div className="editor-shell">
        <ProductEditSideNav activeSection="basic-form" />
        <div className="section-stack">
          <ProductBasicFormSection product={product} setProduct={setProduct} />
          <ProductParamFormSection product={product} setProduct={setProduct} />
          <ProductSpecSection product={product} setProduct={setProduct} />
          <ProductPriceRuleFormSection product={product} setProduct={setProduct} />
        </div>
      </div>
    </PageContainer>
  )
}
