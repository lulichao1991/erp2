import { useMemo, useState } from 'react'
import { OrderFilterBar, OrderListHeader, OrderQuickStats, OrderTable, type OrderLineListRow } from '@/components/business/order'
import { PageContainer } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'

export const OrderListPage = () => {
  const { orders } = useAppData()
  const [filters, setFilters] = useState<{
    keyword: string
    status: 'all' | string
    owner: string
  }>({
    keyword: '',
    status: 'all',
    owner: ''
  })

  const orderLineRows = useMemo<OrderLineListRow[]>(
    () =>
      orders.flatMap((order) =>
        order.items.map((item) => ({
          order,
          item
        }))
      ),
    [orders]
  )

  const filteredOrderLineRows = useMemo(
    () =>
      orderLineRows.filter(({ order, item }) => {
        const matchesKeyword =
          filters.keyword.trim().length === 0 ||
          [
            order.orderNo,
            order.platformOrderNo,
            order.customerName,
            item.name,
            item.itemSku,
            item.selectedSpecValue,
            item.sourceProduct?.sourceProductName
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(filters.keyword.toLowerCase())
        const matchesStatus = filters.status === 'all' || item.status === filters.status
        const matchesOwner = filters.owner.trim().length === 0 || (item.currentOwner || order.ownerName).includes(filters.owner.trim())
        return matchesKeyword && matchesStatus && matchesOwner
      }),
    [filters, orderLineRows]
  )

  return (
    <PageContainer>
      <OrderListHeader />
      <div className="stack">
        <OrderQuickStats rows={orderLineRows} />
        <OrderFilterBar value={filters} onChange={setFilters} />
        <OrderTable rows={filteredOrderLineRows} />
      </div>
    </PageContainer>
  )
}
