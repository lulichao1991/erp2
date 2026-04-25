import { createContext, useContext, useMemo, useState } from 'react'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import {
  addProductFieldOption,
  getProductFieldOptions,
  removeProductFieldOption,
  saveProductFieldOptions,
  saveSizeParameterDefinitions
} from '@/services/product/productFieldOptions'
import { createEmptyProduct, getProductList } from '@/services/product/productQueries'
import { getTaskList } from '@/services/task/taskQueries'
import { getTaskStatusLabel } from '@/services/workflow/workflowMeta'
import type { OrderLine, OrderLineProductionInfo } from '@/types/order-line'
import type { Product } from '@/types/product'
import type { ProductFieldOptionKey, ProductFieldOptions, ProductSizeParameterDefinition } from '@/services/product/productFieldOptions'
import type { Purchase, PurchaseTimelineRecord } from '@/types/purchase'
import type { Task, TaskAssigneeRole } from '@/types/task'

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
  updateTask: (taskId: string, updater: (current: Task) => Task) => Task | undefined
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  // Current mainline mock state.
  const [products, setProducts] = useState<Product[]>(() => getProductList())
  const [purchases, setPurchases] = useState<Purchase[]>(() => structuredClone(purchasesMock))
  const [orderLines, setOrderLines] = useState<OrderLine[]>(() => structuredClone(orderLinesMock))
  const [tasks, setTasks] = useState<Task[]>(() => getTaskList())
  const [productFieldOptions, setProductFieldOptions] = useState<ProductFieldOptions>(() => getProductFieldOptions())
  const [currentUserRole, setCurrentUserRoleState] = useState<TaskAssigneeRole>(() => getInitialCurrentUserRole())

  const value = useMemo<AppDataContextValue>(
    () => ({
      products,
      purchases,
      orderLines,
      tasks,
      productFieldOptions,
      currentUserRole,
      getProduct: (productId) => products.find((item) => item.id === productId),
      getPurchase: (purchaseId) => purchases.find((item) => item.id === purchaseId),
      getOrderLine: (orderLineId) => orderLines.find((item) => item.id === orderLineId),
      getTask: (taskId) => tasks.find((item) => item.id === taskId),
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

        const purchaseId = nextTask.purchaseId || nextTask.transactionId
        const orderLineId = nextTask.orderLineId
        const timelineRecord: PurchaseTimelineRecord = {
          id: `timeline-task-update-${nextTask.id}-${currentTime}`,
          purchaseId,
          transactionId: nextTask.transactionId,
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
    [currentUserRole, orderLines, productFieldOptions, products, purchases, tasks]
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
