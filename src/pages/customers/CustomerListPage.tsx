import { CustomerListTable, buildCustomerOverview } from '@/components/business/customer'
import { PageContainer, PageHeader, SectionCard } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { afterSalesMock, customersMock } from '@/mocks'

export const CustomerListPage = () => {
  const appData = useAppData()
  const overviews = customersMock.map((customer) =>
    buildCustomerOverview({
      customer,
      purchases: appData.purchases,
      orderLines: appData.orderLines,
      afterSalesCases: afterSalesMock
    })
  )

  return (
    <PageContainer>
      <PageHeader title="客户中心" className="compact-page-header" />
      <SectionCard title="客户列表" description="基于 Customer + Purchase + OrderLine 聚合，不回退到旧订单中心模型。">
        <CustomerListTable overviews={overviews} />
      </SectionCard>
    </PageContainer>
  )
}
