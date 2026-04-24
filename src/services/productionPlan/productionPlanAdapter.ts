import type { Order, OrderItem, TimelineRecord } from '@/types/order'
import type { Product, ProductCategory, ProductAssetFile } from '@/types/product'
import type { ProductionPlanDetail, ProductionPlanFile, ProductionPlanFileGroup, ProductionPlanRow, ProductionPlanStage } from '@/types/productionPlan'
import type { Task } from '@/types/task'

const productCategoryLabelMap: Record<ProductCategory, string> = {
  ring: '戒指',
  pendant: '吊坠',
  necklace: '项链',
  earring: '耳饰',
  bracelet: '手链',
  other: '其他'
}

const productionPlanStageLabelMap: Record<ProductionPlanStage, string> = {
  pending_receive: '待接收',
  ready_to_produce: '待生产',
  in_production: '生产中',
  pending_report: '待回传',
  reported: '已回传',
  issue: '异常'
}

const toProductionPlanFiles = (files: ProductAssetFile[]): ProductionPlanFile[] =>
  files.map((file) => ({
    id: file.id,
    name: file.name,
    url: file.url,
    version: file.version
  }))

const buildProductionPlanFileGroups = (orderItem: OrderItem, sourceProduct: Product): ProductionPlanFileGroup[] => {
  const engraveImageFiles = orderItem.actualRequirements?.engraveImageFiles ?? []
  const engravePltFiles = orderItem.actualRequirements?.engravePltFiles ?? []
  const fileGroups: ProductionPlanFileGroup[] = []

  if (sourceProduct.assets.modelFiles.length > 0) {
    fileGroups.push({
      title: '建模文件',
      files: toProductionPlanFiles(sourceProduct.assets.modelFiles)
    })
  }

  if (sourceProduct.assets.craftFiles.length > 0) {
    fileGroups.push({
      title: '工艺图',
      files: toProductionPlanFiles(sourceProduct.assets.craftFiles)
    })
  }

  if (sourceProduct.assets.sizeFiles.length > 0) {
    fileGroups.push({
      title: '尺寸图',
      files: toProductionPlanFiles(sourceProduct.assets.sizeFiles)
    })
  }

  if (sourceProduct.assets.otherFiles.length > 0) {
    fileGroups.push({
      title: '补充说明文件',
      files: toProductionPlanFiles(sourceProduct.assets.otherFiles)
    })
  }

  if (engraveImageFiles.length > 0) {
    fileGroups.push({
      title: '刻字图片',
      files: engraveImageFiles.map((file) => ({
        id: file.id,
        name: file.name,
        url: file.url
      }))
    })
  }

  if (engravePltFiles.length > 0) {
    fileGroups.push({
      title: '刻字 PLT 文件',
      files: engravePltFiles.map((file) => ({
        id: file.id,
        name: file.name,
        url: file.url
      }))
    })
  }

  return fileGroups
}

const buildProductionTimeline = (order: Order, task: Task, orderItem: OrderItem): TimelineRecord[] =>
  [...order.timeline]
    .filter((record) => record.relatedTaskId === task.id || record.relatedOrderItemId === orderItem.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

const buildProductionPlanRow = (task: Task, order: Order, orderItem: OrderItem, sourceProduct: Product): ProductionPlanRow => {
  const stage = getProductionPlanStage(task, orderItem)
  const purchaseId = order.id
  const purchaseNo = order.orderNo
  const orderLineId = orderItem.id
  const orderLineCode = orderItem.lineCode || orderItem.itemSku || orderItem.id
  const orderLineName = orderItem.name || task.orderItemName || sourceProduct.name

  return {
    taskId: task.id,
    purchaseId,
    purchaseNo,
    orderLineId,
    orderLineCode,
    orderLineName,
    orderId: purchaseId,
    orderNo: purchaseNo,
    orderItemId: orderLineId,
    goodsNo: orderItem.itemSku || sourceProduct.code,
    styleName: orderLineName,
    sourceProductId: sourceProduct.id,
    sourceProductCode: sourceProduct.code,
    sourceProductVersion: orderItem.sourceProduct?.sourceProductVersion || sourceProduct.version,
    category: sourceProduct.category,
    categoryLabel: getProductionPlanCategoryLabel(sourceProduct.category),
    specValue: orderItem.selectedSpecValue,
    material: orderItem.selectedMaterial || orderItem.actualRequirements?.material,
    process: orderItem.selectedProcess || orderItem.actualRequirements?.process,
    engraveText: orderItem.actualRequirements?.engraveText,
    quantity: orderItem.quantity || 1,
    isUrgent: task.priority === 'urgent',
    assignedAt: task.createdAt,
    plannedDueDate: task.dueAt || order.plannedDate || order.promisedDate,
    assigneeName: task.assigneeName,
    taskStatus: task.status,
    stage,
    stageLabel: getProductionPlanStageLabel(stage)
  }
}

export const getProductionPlanStage = (task: Task, orderItem: OrderItem): ProductionPlanStage => {
  const factoryStatus = orderItem.factoryFeedback?.factoryStatus

  if (factoryStatus === '有异常') {
    return 'issue'
  }

  if (task.status === 'done' || factoryStatus === '已回传') {
    return 'reported'
  }

  if (factoryStatus === '生产中') {
    return 'in_production'
  }

  if (task.status === 'todo') {
    return 'pending_receive'
  }

  if (task.status === 'in_progress' && factoryStatus !== '生产中') {
    return 'ready_to_produce'
  }

  if (task.status === 'pending_confirm' || factoryStatus === '待回传') {
    return 'pending_report'
  }

  return 'pending_receive'
}

export const getProductionPlanStageLabel = (stage: ProductionPlanStage) => productionPlanStageLabelMap[stage]

export const getProductionPlanCategoryLabel = (category: ProductCategory) => productCategoryLabelMap[category]

export const getProductionPlanTasks = (tasks: Task[]) => tasks.filter((task) => task.type === 'factory_production')

export const buildProductionPlanRows = ({
  tasks,
  orders,
  products
}: {
  tasks: Task[]
  orders: Order[]
  products: Product[]
}) =>
  getProductionPlanTasks(tasks)
    .flatMap((task) => {
      const order = orders.find((item) => item.id === task.orderId)
      const orderItem = order?.items.find((item) => item.id === task.orderItemId)
      const sourceProduct = products.find((item) => item.id === orderItem?.sourceProduct?.sourceProductId)

      if (!order || !orderItem || !sourceProduct) {
        return []
      }

      return [buildProductionPlanRow(task, order, orderItem, sourceProduct)]
    })
    .sort((left, right) => {
      if (left.isUrgent !== right.isUrgent) {
        return left.isUrgent ? -1 : 1
      }

      return (left.plannedDueDate || left.assignedAt).localeCompare(right.plannedDueDate || right.assignedAt)
    })

export const buildProductionPlanDetail = ({
  taskId,
  tasks,
  orders,
  products
}: {
  taskId?: string
  tasks: Task[]
  orders: Order[]
  products: Product[]
}): ProductionPlanDetail | undefined => {
  const task = tasks.find((item) => item.id === taskId && item.type === 'factory_production')
  if (!task) {
    return undefined
  }

  const order = orders.find((item) => item.id === task.orderId)
  const orderItem = order?.items.find((item) => item.id === task.orderItemId)
  const sourceProduct = products.find((item) => item.id === orderItem?.sourceProduct?.sourceProductId)

  if (!order || !orderItem || !sourceProduct) {
    return undefined
  }

  const row = buildProductionPlanRow(task, order, orderItem, sourceProduct)

  return {
    purchaseId: row.purchaseId,
    purchaseNo: row.purchaseNo,
    orderLineId: row.orderLineId,
    orderLineCode: row.orderLineCode,
    orderLineName: row.orderLineName,
    row,
    task,
    order,
    orderItem,
    sourceProduct,
    timeline: buildProductionTimeline(order, task, orderItem),
    fileGroups: buildProductionPlanFileGroups(orderItem, sourceProduct),
    referenceImages: sourceProduct.assets.detailImages
  }
}
