import type { Order, OrderItem, TimelineRecord } from '@/types/order'
import type { OrderLine, OrderLineProductionStatus } from '@/types/order-line'
import type { Product, ProductCategory, ProductAssetFile } from '@/types/product'
import type { ProductionPlanDetail, ProductionPlanFile, ProductionPlanFileGroup, ProductionPlanRow, ProductionPlanStage } from '@/types/productionPlan'
import type { Purchase } from '@/types/purchase'
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

type ProductionPlanLineSource = OrderLine | OrderItem

type ProductionPlanTimelineRecord = TimelineRecord & {
  relatedOrderLineId?: string
}

type ProductionPlanSource = {
  task: Task
  purchase?: Purchase
  orderLine: ProductionPlanLineSource
  order?: Order
  orderItem?: OrderItem
  usesOrderLineInput: boolean
  sourceProduct: Product
}

const buildProductionPlanFileGroups = (orderLine: ProductionPlanLineSource, sourceProduct: Product): ProductionPlanFileGroup[] => {
  const actualRequirements = orderLine.actualRequirements as ProductionPlanLineSource['actualRequirements'] & {
    engraveImageFiles?: ProductAssetFile[]
    engravePltFiles?: ProductAssetFile[]
  }
  const engraveImageFiles = actualRequirements?.engraveImageFiles ?? []
  const engravePltFiles = actualRequirements?.engravePltFiles ?? []
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

const buildProductionTimeline = (source: ProductionPlanSource): TimelineRecord[] =>
  [...(source.purchase?.timeline ?? []), ...(source.order?.timeline ?? [])]
    .filter((record: ProductionPlanTimelineRecord) => record.relatedTaskId === source.task.id || record.relatedOrderLineId === source.orderLine.id || record.relatedOrderItemId === source.orderLine.id)
    .filter((record, index, records) => records.findIndex((item) => item.id === record.id) === index)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

const getLineFactoryFeedback = (orderLine: ProductionPlanLineSource) => {
  const line = orderLine as OrderItem & OrderLine
  return line.factoryFeedback || line.productionInfo
}

const getLineSku = (orderLine: ProductionPlanLineSource) => orderLine.itemSku || orderLine.lineCode

const legacyFactoryStatusMap: Record<string, OrderLineProductionStatus> = {
  待回传: 'pending_feedback',
  生产中: 'in_progress',
  已回传: 'completed',
  有异常: 'issue'
}

const normalizeFactoryStatus = (status?: string): OrderLineProductionStatus | undefined => {
  if (!status) {
    return undefined
  }

  return legacyFactoryStatusMap[status] || status as OrderLineProductionStatus
}

const buildProductionPlanRow = (source: ProductionPlanSource): ProductionPlanRow => {
  const { task, purchase, orderLine, order, orderItem, sourceProduct } = source
  const stage = getProductionPlanStage(task, orderItem || orderLine)
  const purchaseId = purchase?.id || order?.id || task.purchaseId || task.orderId
  const purchaseNo = purchase?.purchaseNo || order?.orderNo || task.purchaseNo || task.orderNo
  const orderLineId = orderLine.id
  const orderLineCode = orderLine.lineCode || getLineSku(orderLine) || task.orderLineCode || orderLine.id
  const orderLineName = orderLine.name || task.orderLineName || task.orderItemName || sourceProduct.name

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
    goodsNo: getLineSku(orderLine) || sourceProduct.code,
    styleName: orderLineName,
    sourceProductId: sourceProduct.id,
    sourceProductCode: sourceProduct.code,
    sourceProductVersion: orderLine.sourceProduct?.sourceProductVersion || sourceProduct.version,
    category: sourceProduct.category,
    categoryLabel: getProductionPlanCategoryLabel(sourceProduct.category),
    specValue: orderLine.selectedSpecValue,
    material: orderLine.selectedMaterial || orderLine.actualRequirements?.material,
    process: orderLine.selectedProcess || orderLine.actualRequirements?.process,
    engraveText: orderLine.actualRequirements?.engraveText,
    quantity: orderLine.quantity || 1,
    isUrgent: task.priority === 'urgent',
    assignedAt: task.createdAt,
    plannedDueDate: task.dueAt || orderLine.promisedDate || purchase?.promisedDate || order?.plannedDate || order?.promisedDate,
    assigneeName: task.assigneeName,
    taskStatus: task.status,
    stage,
    stageLabel: getProductionPlanStageLabel(stage)
  }
}

export const getProductionPlanStage = (task: Task, orderLine: ProductionPlanLineSource): ProductionPlanStage => {
  const factoryStatus = normalizeFactoryStatus(getLineFactoryFeedback(orderLine)?.factoryStatus)

  if (factoryStatus === 'issue') {
    return 'issue'
  }

  if (task.status === 'done' || factoryStatus === 'completed') {
    return 'reported'
  }

  if (factoryStatus === 'in_progress') {
    return 'in_production'
  }

  if (task.status === 'todo') {
    return 'pending_receive'
  }

  if (task.status === 'in_progress') {
    return 'ready_to_produce'
  }

  if (task.status === 'pending_confirm' || factoryStatus === 'pending_feedback') {
    return 'pending_report'
  }

  return 'pending_receive'
}

export const getProductionPlanStageLabel = (stage: ProductionPlanStage) => productionPlanStageLabelMap[stage]

export const getProductionPlanCategoryLabel = (category: ProductCategory) => productCategoryLabelMap[category]

export const getProductionPlanTasks = (tasks: Task[]) => tasks.filter((task) => task.type === 'factory_production')

const findPurchase = (task: Task, purchases: Purchase[]) =>
  purchases.find((item) => item.id === task.purchaseId)

const findOrderLine = (task: Task, purchase: Purchase | undefined, orderLines: OrderLine[]) => {
  const lineId = task.orderLineId
  if (!lineId) {
    return undefined
  }

  return orderLines.find((item) => item.id === lineId && (!purchase || item.purchaseId === purchase.id)) || purchase?.orderLines.find((item) => item.id === lineId)
}

const findLegacyOrder = (task: Task, orders: Order[]) =>
  orders.find((item) => item.id === task.orderId)

const findLegacyOrderItem = (task: Task, order: Order | undefined) =>
  order?.items.find((item) => item.id === task.orderItemId)

const buildCompatibleOrderItem = (orderLine: ProductionPlanLineSource): OrderItem => ({
  ...orderLine,
  itemSku: getLineSku(orderLine) || orderLine.id,
  factoryFeedback: getLineFactoryFeedback(orderLine)
})

const buildCompatibleOrder = (purchase: Purchase | undefined, order: Order | undefined, orderLine: ProductionPlanLineSource): Order => {
  if (order) {
    return order
  }

  const purchaseId = purchase?.id || orderLine.purchaseId || ''
  return {
    id: purchaseId,
    orderNo: purchase?.purchaseNo || '',
    orderType: String(purchase?.purchaseType || ''),
    ownerName: purchase?.ownerName || '',
    sourceChannel: String(purchase?.sourceChannel || ''),
    customerId: purchase?.customerId,
    status: 'pending_confirm',
    aggregateStatus: purchase?.aggregateStatus,
    priority: 'normal',
    riskTags: purchase?.riskTags || [],
    promisedDate: purchase?.promisedDate,
    expectedDate: purchase?.expectedDate,
    paymentDate: purchase?.paymentAt,
    paymentAt: purchase?.paymentAt,
    recipientName: purchase?.recipientName,
    recipientAddress: purchase?.recipientAddress,
    finance: purchase?.finance,
    items: [buildCompatibleOrderItem(orderLine)],
    orderLineCount: purchase?.orderLineCount,
    orderLines: purchase?.orderLines,
    remark: purchase?.remark,
    latestActivityAt: purchase?.latestActivityAt,
    timeline: (purchase?.timeline ?? []).map((record) => ({
      ...record,
      orderId: record.orderId || record.purchaseId,
      relatedOrderItemId: record.relatedOrderLineId
    }))
  }
}

const resolveProductionPlanSource = ({
  task,
  purchases = [],
  orderLines = [],
  orders = [],
  products
}: {
  task: Task
  purchases?: Purchase[]
  orderLines?: OrderLine[]
  orders?: Order[]
  products: Product[]
}): ProductionPlanSource | undefined => {
  const purchase = findPurchase(task, purchases)
  const orderLine = findOrderLine(task, purchase, orderLines)
  const order = findLegacyOrder(task, orders)
  const orderItem = findLegacyOrderItem(task, order)
  const line = orderLine || orderItem
  const sourceProduct = products.find((item) => item.id === line?.sourceProduct?.sourceProductId)

  if (!line || !sourceProduct) {
    return undefined
  }

  return {
    task,
    purchase,
    orderLine: line,
    order,
    orderItem,
    usesOrderLineInput: Boolean(orderLine),
    sourceProduct
  }
}

export const buildProductionPlanRows = ({
  tasks,
  purchases,
  orderLines,
  orders,
  products
}: {
  tasks: Task[]
  purchases?: Purchase[]
  orderLines?: OrderLine[]
  orders?: Order[]
  products: Product[]
}) =>
  getProductionPlanTasks(tasks)
    .flatMap((task) => {
      const source = resolveProductionPlanSource({ task, purchases, orderLines, orders, products })

      if (!source) {
        return []
      }

      return [buildProductionPlanRow(source)]
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
  purchases,
  orderLines,
  orders,
  products
}: {
  taskId?: string
  tasks: Task[]
  purchases?: Purchase[]
  orderLines?: OrderLine[]
  orders?: Order[]
  products: Product[]
}): ProductionPlanDetail | undefined => {
  const task = tasks.find((item) => item.id === taskId && item.type === 'factory_production')
  if (!task) {
    return undefined
  }

  const source = resolveProductionPlanSource({ task, purchases, orderLines, orders, products })

  if (!source) {
    return undefined
  }

  const row = buildProductionPlanRow(source)
  const order = buildCompatibleOrder(source.purchase, source.order, source.orderLine)
  const orderItem = source.usesOrderLineInput ? buildCompatibleOrderItem(source.orderLine) : source.orderItem || buildCompatibleOrderItem(source.orderLine)

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
    sourceProduct: source.sourceProduct,
    timeline: buildProductionTimeline(source),
    fileGroups: buildProductionPlanFileGroups(source.orderItem || source.orderLine, source.sourceProduct),
    referenceImages: source.sourceProduct.assets.detailImages
  }
}
