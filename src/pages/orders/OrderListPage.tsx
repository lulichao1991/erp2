import { useMemo, useState } from 'react'
import { OrderFilterBar, OrderListHeader, OrderQuickStats, OrderTable } from '@/components/business/order'
import { PageContainer } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'

export const OrderListPage = () => {
  const { orders } = useAppData()
  const [filters, setFilters] = useState({
    keyword: '',
    status: 'all',
    owner: ''
  })

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesKeyword =
          filters.keyword.trim().length === 0 ||
          [order.orderNo, order.platformOrderNo, order.customerName].filter(Boolean).join(' ').toLowerCase().includes(filters.keyword.toLowerCase())
        const matchesStatus = filters.status === 'all' || order.status.includes(filters.status)
        const matchesOwner = filters.owner.trim().length === 0 || order.ownerName.includes(filters.owner.trim())
        return matchesKeyword && matchesStatus && matchesOwner
      }),
    [filters, orders]
  )

  return (
    <PageContainer>
      <OrderListHeader />
      <div className="stack">
        <OrderQuickStats orders={orders} />
        <OrderFilterBar value={filters} onChange={setFilters} />
        <OrderTable orders={filteredOrders} />
      </div>
    </PageContainer>
  )
}
