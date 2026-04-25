import { Link, useParams } from 'react-router-dom'
import {
  CustomerAfterSalesSection,
  CustomerBasicSection,
  CustomerOrderLinesSection,
  CustomerPurchasesSection,
  buildCustomerOverview
} from '@/components/business/customer'
import { EmptyState, PageContainer, PageHeader } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { afterSalesMock, customersMock } from '@/mocks'

export const CustomerDetailPage = () => {
  const { customerId } = useParams()
  const customer = customersMock.find((item) => item.id === customerId)
  const appData = useAppData()

  if (!customer) {
    return (
      <PageContainer>
        <EmptyState title="未找到客户" description="当前客户不存在，可能是链接失效或 mock 数据尚未包含该记录。" />
      </PageContainer>
    )
  }

  const overview = buildCustomerOverview({
    customer,
    purchases: appData.purchases,
    orderLines: appData.orderLines,
    afterSalesCases: afterSalesMock
  })

  return (
    <PageContainer>
      <PageHeader
        title="客户详情"
        className="compact-page-header"
        actions={
          <Link to="/customers" className="button secondary">
            返回客户中心
          </Link>
        }
      />
      <p className="text-muted">客户详情只做历史归集；购买执行仍进入购买记录和商品行中心。</p>
      <div className="stack">
        <CustomerBasicSection overview={overview} />
        <CustomerPurchasesSection purchases={overview.purchases} />
        <CustomerOrderLinesSection orderLines={overview.orderLines} />
        <CustomerAfterSalesSection cases={overview.afterSalesCases} />
      </div>
    </PageContainer>
  )
}
