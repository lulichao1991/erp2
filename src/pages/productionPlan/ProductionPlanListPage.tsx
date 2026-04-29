import { useMemo, useState } from 'react'
import { AppBreadcrumb } from '@/app/layout/AppBreadcrumb'
import {
  ProductionPlanFilterBar,
  ProductionPlanListHeader,
  ProductionPlanQuickStats,
  ProductionPlanTable,
  type ProductionPlanFilterValue
} from '@/components/business/productionPlan'
import { EmptyState, PageContainer } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { buildProductionPlanRows } from '@/services/productionPlan/productionPlanAdapter'

export const ProductionPlanListPage = () => {
  const appData = useAppData()
  const [filters, setFilters] = useState<ProductionPlanFilterValue>({
    keyword: '',
    stage: 'all',
    urgent: 'all',
    material: '',
    category: ''
  })

  const rows = useMemo(
    () =>
      buildProductionPlanRows({
        tasks: appData.tasks,
        purchases: appData.purchases,
        orderLines: appData.orderLines,
        products: appData.products
      }),
    [appData.orderLines, appData.products, appData.purchases, appData.tasks]
  )

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesKeyword =
          filters.keyword.trim().length === 0 ||
          [row.goodsNo, row.orderLineName, row.orderLineCode, row.purchaseNo, row.sourceProductVersion, row.engraveText]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(filters.keyword.toLowerCase())
        const matchesStage = filters.stage === 'all' || row.stage === filters.stage
        const matchesUrgent =
          filters.urgent === 'all' ||
          (filters.urgent === 'yes' && row.isUrgent) ||
          (filters.urgent === 'no' && !row.isUrgent)
        const matchesMaterial = filters.material.length === 0 || row.material === filters.material
        const matchesCategory = filters.category.length === 0 || row.categoryLabel === filters.category

        return matchesKeyword && matchesStage && matchesUrgent && matchesMaterial && matchesCategory
      }),
    [filters, rows]
  )

  return (
    <PageContainer>
      <AppBreadcrumb items={[{ label: '生产计划' }]} />
      <ProductionPlanListHeader />
      <div className="stack production-plan-page-stack">
        <ProductionPlanQuickStats rows={rows} />
        <ProductionPlanFilterBar rows={rows} value={filters} onChange={setFilters} />
        {filteredRows.length > 0 ? (
          <ProductionPlanTable rows={filteredRows} />
        ) : (
          <EmptyState title="当前没有可展示的生产资料" description="请先保留或新增 factory_production mock 任务，再回到此页查看生产计划。" />
        )}
      </div>
    </PageContainer>
  )
}
