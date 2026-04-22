import { createContext, useContext, useMemo, useState } from 'react'
import { getOrderList } from '@/services/order/orderQueries'
import { createEmptyProduct, getProductList } from '@/services/product/productQueries'
import { buildQuoteResult } from '@/services/quote/quoteService'
import type { Order, OrderItem } from '@/types/order'
import type { Product } from '@/types/product'

type AppDataContextValue = {
  products: Product[]
  orders: Order[]
  getProduct: (productId?: string) => Product | undefined
  getOrder: (orderId?: string) => Order | undefined
  saveProduct: (payload: Product) => Product
  updateProduct: (productId: string, updater: (current: Product) => Product) => Product | undefined
  createEmptyProduct: () => Product
  saveOrder: (payload: Order) => Order
  updateOrder: (orderId: string, updater: (current: Order) => Order) => Order | undefined
  updateOrderItem: (orderId: string, itemId: string, updater: (current: OrderItem) => OrderItem) => Order | undefined
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(() => getProductList())
  const [orders, setOrders] = useState<Order[]>(() => getOrderList())

  const value = useMemo<AppDataContextValue>(
    () => ({
      products,
      orders,
      getProduct: (productId) => products.find((item) => item.id === productId),
      getOrder: (orderId) => orders.find((item) => item.id === orderId),
      saveProduct: (payload) => {
        setProducts((current) => {
          const exists = current.some((item) => item.id === payload.id)
          if (!exists) {
            return [...current, payload]
          }
          return current.map((item) => (item.id === payload.id ? payload : item))
        })
        return payload
      },
      updateProduct: (productId, updater) => {
        const found = products.find((item) => item.id === productId)
        if (!found) {
          return undefined
        }
        const next = updater(found)
        setProducts((current) => current.map((item) => (item.id === productId ? next : item)))
        return next
      },
      createEmptyProduct: () => createEmptyProduct(),
      saveOrder: (payload) => {
        setOrders((current) => {
          const exists = current.some((item) => item.id === payload.id)
          if (!exists) {
            return [...current, payload]
          }
          return current.map((item) => (item.id === payload.id ? payload : item))
        })
        return payload
      },
      updateOrder: (orderId, updater) => {
        const found = orders.find((item) => item.id === orderId)
        if (!found) {
          return undefined
        }
        const next = updater(found)
        setOrders((current) => current.map((item) => (item.id === orderId ? next : item)))
        return next
      },
      updateOrderItem: (orderId, itemId, updater) => {
        const order = orders.find((item) => item.id === orderId)
        if (!order) {
          return undefined
        }

        const nextOrder: Order = {
          ...order,
          items: order.items.map((item) => {
            if (item.id !== itemId) {
              return item
            }
            const nextItem = updater(item)
            if (nextItem.isReferencedProduct && nextItem.sourceProduct) {
              const product = products.find((entry) => entry.id === nextItem.sourceProduct?.sourceProductId)
              if (product) {
                nextItem.quote = buildQuoteResult({
                  selectedSpec: nextItem.selectedSpecSnapshot,
                  selectedMaterial: nextItem.selectedMaterial,
                  selectedProcess: nextItem.selectedProcess,
                  selectedSpecialOptions: nextItem.selectedSpecialOptions,
                  rules: product.priceRules,
                  specRequired: product.isSpecRequired
                })
              }
            }
            return nextItem
          })
        }

        setOrders((current) => current.map((item) => (item.id === orderId ? nextOrder : item)))
        return nextOrder
      }
    }),
    [orders, products]
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export const useAppData = () => {
  const context = useContext(AppDataContext)

  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider')
  }

  return context
}
