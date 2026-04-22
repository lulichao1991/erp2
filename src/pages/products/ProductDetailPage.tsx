import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { AppBreadcrumb } from '@/app/layout/AppBreadcrumb'
import {
  ProductAnchorNav,
  ProductAssetsSection,
  ProductBasicInfoSection,
  ProductCustomRuleSection,
  ProductHeaderBar,
  ProductParamConfigSection,
  ProductPriceRuleSection,
  ProductProductionRefSection,
  ProductSummaryCard
} from '@/components/business/product'
import { EmptyState, PageContainer } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'

export const ProductDetailPage = () => {
  const { productId } = useParams()
  const { getProduct } = useAppData()
  const product = getProduct(productId)

  const anchors = useMemo(
    () => [
      { id: 'basic', label: '基础信息' },
      { id: 'params', label: '参数配置' },
      { id: 'pricing', label: '价格规则' },
      { id: 'custom', label: '定制规则' },
      { id: 'production', label: '生产参考' },
      { id: 'assets', label: '图片与文件' }
    ],
    []
  )

  if (!product) {
    return (
      <PageContainer>
        <EmptyState title="未找到产品" description="当前产品可能已被删除，或链接中的产品 ID 不存在。" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <AppBreadcrumb
        items={[
          { label: '产品管理', to: '/products' },
          { label: '产品详情' },
          { label: product.name }
        ]}
      />
      <ProductHeaderBar product={product} />
      <div className="editor-shell">
        <ProductAnchorNav activeAnchor="basic" anchors={anchors} />
        <div className="section-stack">
          <ProductSummaryCard product={product} />
          <ProductBasicInfoSection product={product} />
          <ProductParamConfigSection product={product} />
          <ProductPriceRuleSection product={product} />
          <ProductCustomRuleSection product={product} />
          <ProductProductionRefSection product={product} />
          <ProductAssetsSection product={product} />
        </div>
      </div>
    </PageContainer>
  )
}
