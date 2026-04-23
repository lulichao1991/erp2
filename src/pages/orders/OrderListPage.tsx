import { useMemo, useState } from 'react'
import { OrderFilterBar, OrderListHeader, OrderQuickStats, OrderTable } from '@/components/business/order'
import { PageContainer } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import type { OrderStatus } from '@/types/order'

export const OrderListPage = () => {
  const { orders } = useAppData()
  const [filters, setFilters] = useState<{
    keyword: string
    status: 'all' | OrderStatus
    owner: string
  }>({
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
        const matchesStatus = filters.status === 'all' || order.status === filters.status
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
