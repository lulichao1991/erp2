import { createContext, useContext, useMemo, useState } from 'react'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import { getOrderList } from '@/services/order/orderQueries'
import {
  addProductFieldOption,
  getProductFieldOptions,
  removeProductFieldOption,
  saveProductFieldOptions,
  saveSizeParameterDefinitions
} from '@/services/product/productFieldOptions'
import { createEmptyProduct, getProductList } from '@/services/product/productQueries'
import { buildQuoteResult } from '@/services/quote/quoteService'
import { createTaskDraft, getTaskList } from '@/services/task/taskQueries'
import { getOrderStatusLabel, getTaskStatusLabel } from '@/services/workflow/workflowMeta'
import type { Order, OrderItem, OrderStatus, TimelineRecord } from '@/types/order'
import type { OrderLine, OrderLineProductionInfo } from '@/types/order-line'
import type { Product } from '@/types/product'
import type { ProductFieldOptionKey, ProductFieldOptions, ProductSizeParameterDefinition } from '@/services/product/productFieldOptions'
import type { Purchase, PurchaseTimelineRecord } from '@/types/purchase'
import type { Task, TaskAssigneeRole, TaskType } from '@/types/task'

const formatCurrentTime = () => new Date().toISOString().slice(0, 16).replace('T', ' ')
const currentUserRoleStorageKey = 'erp-demo-current-role'

const getInitialCurrentUserRole = (): TaskAssigneeRole => {
  if (typeof window === 'undefined') {
    return 'operations'
  }

  const rawValue = window.localStorage.getItem(currentUserRoleStorageKey)
  if (rawValue === 'customer_service' || rawValue === 'designer' || rawValue === 'operations' || rawValue === 'factory' || rawValue === 'management') {
    return rawValue
  }

  return 'operations'
}

type AppDataContextValue = {
  // Current mainline state. New modules should prefer these objects.
  products: Product[]
  purchases: Purchase[]
  orderLines: OrderLine[]
  tasks: Task[]
  productFieldOptions: ProductFieldOptions
  currentUserRole: TaskAssigneeRole
  getProduct: (productId?: string) => Product | undefined
  getPurchase: (purchaseId?: string) => Purchase | undefined
  getOrderLine: (orderLineId?: string) => OrderLine | undefined
  getTask: (taskId?: string) => Task | undefined
  setCurrentUserRole: (role: TaskAssigneeRole) => void
  saveProduct: (payload: Product) => Product
  updateProduct: (productId: string, updater: (current: Product) => Product) => Product | undefined
  createEmptyProduct: () => Product
  addGlobalProductFieldOption: (field: ProductFieldOptionKey, value: string) => void
  removeGlobalProductFieldOption: (field: ProductFieldOptionKey, value: string) => void
  saveGlobalSizeParameterDefinitions: (definitions: ProductSizeParameterDefinition[]) => void
  updateOrderLineProductionInfo: (orderLineId: string, productionInfo: OrderLineProductionInfo) => OrderLine | undefined

  // Legacy /orders compatibility state and APIs. Keep these for the old route only.
  orders: Order[]
  getOrder: (orderId?: string) => Order | undefined
  getTasksByOrder: (orderId?: string) => Task[]
  saveOrder: (payload: Order) => Order
  updateOrder: (orderId: string, updater: (current: Order) => Order) => Order | undefined
  transitionOrderStatus: (payload: { orderId: string; nextStatus: OrderStatus; reason?: string }) => Order | undefined
  updateOrderItem: (orderId: string, itemId: string, updater: (current: OrderItem) => OrderItem) => Order | undefined
  removeOrderItem: (payload: { orderId: string; itemId: string }) => Order | undefined
  createTaskFromOrder: (payload: { orderId: string; type: TaskType; orderItemId?: string; orderItemName?: string }) => Task | undefined
  updateTask: (taskId: string, updater: (current: Task) => Task) => Task | undefined
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  // Current mainline mock state.
  const [products, setProducts] = useState<Product[]>(() => getProductList())
  const [purchases, setPurchases] = useState<Purchase[]>(() => structuredClone(purchasesMock))
  const [orderLines, setOrderLines] = useState<OrderLine[]>(() => structuredClone(orderLinesMock))

  // Legacy /orders compatibility state. Do not expand usage from new modules.
  const [orders, setOrders] = useState<Order[]>(() => getOrderList())
  const [tasks, setTasks] = useState<Task[]>(() => getTaskList())
  const [productFieldOptions, setProductFieldOptions] = useState<ProductFieldOptions>(() => getProductFieldOptions())
  const [currentUserRole, setCurrentUserRoleState] = useState<TaskAssigneeRole>(() => getInitialCurrentUserRole())

  const value = useMemo<AppDataContextValue>(
    () => ({
      products,
      purchases,
      orderLines,
      orders,
      tasks,
      productFieldOptions,
      currentUserRole,
      getProduct: (productId) => products.find((item) => item.id === productId),
      getPurchase: (purchaseId) => purchases.find((item) => item.id === purchaseId),
      getOrderLine: (orderLineId) => orderLines.find((item) => item.id === orderLineId),
      getOrder: (orderId) => orders.find((item) => item.id === orderId),
      getTask: (taskId) => tasks.find((item) => item.id === taskId),
      getTasksByOrder: (orderId) => tasks.filter((item) => item.orderId === orderId),
      setCurrentUserRole: (role) => {
        setCurrentUserRoleState(role)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(currentUserRoleStorageKey, role)
        }
      },
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
      addGlobalProductFieldOption: (field, rawValue) => {
        setProductFieldOptions((current) => saveProductFieldOptions(addProductFieldOption(current, field, rawValue)))
      },
      removeGlobalProductFieldOption: (field, rawValue) => {
        setProductFieldOptions((current) => saveProductFieldOptions(removeProductFieldOption(current, field, rawValue)))
      },
      saveGlobalSizeParameterDefinitions: (definitions) => {
        setProductFieldOptions((current) => saveProductFieldOptions(saveSizeParameterDefinitions(current, definitions)))
      },
      updateOrderLineProductionInfo: (orderLineId, productionInfo) => {
        const found = orderLines.find((item) => item.id === orderLineId)
        if (!found) {
          return undefined
        }

        const nextOrderLine: OrderLine = {
          ...found,
          productionInfo: {
            ...found.productionInfo,
            ...productionInfo
          }
        }

        setOrderLines((current) => current.map((item) => (item.id === orderLineId ? nextOrderLine : item)))
        return nextOrderLine
      },

      // Legacy /orders compatibility APIs. New Purchase + OrderLine flows should not call these
      // except as an explicit fallback while a page still renders old compatibility data.
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
      transitionOrderStatus: ({ orderId, nextStatus, reason }) => {
        const order = orders.find((item) => item.id === orderId)
        if (!order || order.status === nextStatus) {
          return order
        }

        const currentTime = formatCurrentTime()
        const nextOrder: Order = {
          ...order,
          status: nextStatus,
          latestActivityAt: currentTime,
          timeline: [
            ...order.timeline,
            {
              id: `timeline-status-${orderId}-${currentTime}`,
              orderId,
              type: 'status_changed',
              title: `订单阶段更新为${getOrderStatusLabel(nextStatus)}`,
              description: reason || `订单阶段已从${getOrderStatusLabel(order.status)}切换为${getOrderStatusLabel(nextStatus)}。`,
              actorName: '当前用户',
              createdAt: currentTime
            }
          ]
        }

        setOrders((current) => current.map((item) => (item.id === orderId ? nextOrder : item)))
        return nextOrder
      },
      updateOrderItem: (orderId, itemId, updater) => {
        const order = orders.find((item) => item.id === orderId)
        if (!order) {
          return undefined
        }

        const currentTime = formatCurrentTime()
        const nextTimelineRecords: TimelineRecord[] = []

        const nextOrder: Order = {
          ...order,
          items: order.items.map((item) => {
            if (item.id !== itemId) {
              return item
            }
            let nextItem = updater(item)
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

            if (!item.isReferencedProduct && nextItem.isReferencedProduct && nextItem.sourceProduct) {
              nextTimelineRecords.push({
                id: `timeline-reference-${orderId}-${itemId}-${currentTime}`,
                orderId,
                type: 'product_referenced',
                title: `商品 ${nextItem.name} 已引用来源产品`,
                description: `来源产品：${nextItem.sourceProduct.sourceProductName} ${nextItem.sourceProduct.sourceProductVersion}`,
                actorName: '当前用户',
                createdAt: currentTime,
                relatedOrderItemId: itemId
              })
            }

            if (item.selectedSpecValue !== nextItem.selectedSpecValue && nextItem.selectedSpecValue) {
              nextTimelineRecords.push({
                id: `timeline-spec-${orderId}-${itemId}-${currentTime}`,
                orderId,
                type: 'spec_changed',
                title: `商品 ${nextItem.name} 切换规格`,
                description: `规格已切换为 ${nextItem.selectedSpecValue}。`,
                actorName: '当前用户',
                createdAt: currentTime,
                relatedOrderItemId: itemId
              })
            }

            if (item.quote?.systemQuote !== nextItem.quote?.systemQuote && typeof nextItem.quote?.systemQuote === 'number') {
              nextTimelineRecords.push({
                id: `timeline-quote-${orderId}-${itemId}-${currentTime}`,
                orderId,
                type: 'quote_recalculated',
                title: `商品 ${nextItem.name} 重算系统参考报价`,
                description: `当前系统参考报价为 ¥ ${nextItem.quote.systemQuote.toLocaleString('zh-CN')}。`,
                actorName: '当前用户',
                createdAt: currentTime,
                relatedOrderItemId: itemId
              })
            }

            if (item.factoryFeedback?.factoryStatus !== nextItem.factoryFeedback?.factoryStatus && nextItem.factoryFeedback?.factoryStatus) {
              nextTimelineRecords.push({
                id: `timeline-factory-${orderId}-${itemId}-${currentTime}`,
                orderId,
                type: 'remark_updated',
                title: `商品 ${nextItem.name} 工厂状态更新为${nextItem.factoryFeedback.factoryStatus}`,
                description: `工厂执行状态已切换为 ${nextItem.factoryFeedback.factoryStatus}。`,
                actorName: '当前用户',
                createdAt: currentTime,
                relatedOrderItemId: itemId
              })
            }

            return nextItem
          })
        }

        if (nextTimelineRecords.length > 0) {
          nextOrder.latestActivityAt = currentTime
          nextOrder.timeline = [...nextOrder.timeline, ...nextTimelineRecords]
        }

        setOrders((current) => current.map((item) => (item.id === orderId ? nextOrder : item)))
        return nextOrder
      },
      removeOrderItem: ({ orderId, itemId }) => {
        const order = orders.find((item) => item.id === orderId)
        if (!order) {
          return undefined
        }

        const targetItem = order.items.find((item) => item.id === itemId)
        if (!targetItem || order.items.length <= 1) {
          return order
        }

        const currentTime = formatCurrentTime()
        const nextOrder: Order = {
          ...order,
          items: order.items.filter((item) => item.id !== itemId),
          latestActivityAt: currentTime,
          timeline: [
            ...order.timeline.filter((record) => record.relatedOrderItemId !== itemId),
            {
              id: `timeline-item-removed-${orderId}-${itemId}-${currentTime}`,
              orderId,
              type: 'remark_updated',
              title: `删除订单商品 ${targetItem.name}`,
              description: '该商品及其关联的订单时间线摘要已从当前订单视图中移除。',
              actorName: '当前用户',
              createdAt: currentTime
            }
          ]
        }

        setOrders((current) => current.map((item) => (item.id === orderId ? nextOrder : item)))
        setTasks((current) => current.filter((task) => !(task.orderId === orderId && task.orderItemId === itemId)))
        return nextOrder
      },
      createTaskFromOrder: ({ orderId, type, orderItemId, orderItemName }) => {
        const order = orders.find((item) => item.id === orderId)
        if (!order) {
          return undefined
        }

        const nextTask = createTaskDraft({
          orderId,
          orderNo: order.orderNo,
          type,
          orderItemId,
          orderItemName
        })

        const timelineRecord: TimelineRecord = {
          id: `timeline-task-created-${nextTask.id}`,
          orderId,
          type: 'task_created',
          title: `创建${nextTask.title}`,
          description: orderItemName ? `已关联订单商品：${orderItemName}` : '已创建订单级任务。',
          actorName: nextTask.createdBy,
          createdAt: nextTask.createdAt,
          relatedTaskId: nextTask.id,
          relatedOrderItemId: orderItemId
        }

        setTasks((current) => [...current, nextTask])
        setOrders((current) =>
          current.map((item) =>
            item.id === orderId
              ? {
                  ...item,
                  latestActivityAt: nextTask.createdAt,
                  timeline: [...item.timeline, timelineRecord]
                }
              : item
          )
        )

        return nextTask
      },
      updateTask: (taskId, updater) => {
        const found = tasks.find((item) => item.id === taskId)
        if (!found) {
          return undefined
        }

        const currentTime = formatCurrentTime()
        const updated = updater(found)
        const nextTask: Task = {
          ...updated,
          updatedAt: currentTime,
          updatedBy: updated.updatedBy || '当前用户',
          completedAt: updated.status === 'done' ? updated.completedAt || currentTime : undefined
        }

        const purchaseId = nextTask.purchaseId || nextTask.transactionId || nextTask.orderId
        const orderLineId = nextTask.orderLineId || nextTask.orderItemId
        const timelineRecord: PurchaseTimelineRecord = {
          id: `timeline-task-update-${nextTask.id}-${currentTime}`,
          purchaseId,
          transactionId: nextTask.transactionId,
          orderId: nextTask.orderId,
          type: nextTask.status === 'done' ? 'task_completed' : 'task_updated',
          title: nextTask.status === 'done' ? `完成${nextTask.title}` : `更新${nextTask.title}`,
          description:
            nextTask.status === 'done'
              ? `任务已完成，当前责任人：${nextTask.assigneeName || '待分配'}`
              : `任务状态更新为${getTaskStatusLabel(nextTask.status)}，当前责任人：${nextTask.assigneeName || '待分配'}`,
          actorName: nextTask.updatedBy,
          createdAt: currentTime,
          relatedTaskId: nextTask.id,
          relatedOrderLineId: orderLineId
        }

        setTasks((current) => current.map((item) => (item.id === taskId ? nextTask : item)))
        setPurchases((current) =>
          current.map((item) =>
            item.id === purchaseId
              ? {
                  ...item,
                  latestActivityAt: currentTime,
                  timeline: [...item.timeline, timelineRecord]
                }
              : item
          )
        )

        return nextTask
      }
    }),
    [currentUserRole, orderLines, orders, productFieldOptions, products, purchases, tasks]
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
