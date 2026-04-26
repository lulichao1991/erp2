import type { OrderLine, OrderLineProductionStatus } from '@/types/order-line'
import type { Product, ProductCategory, ProductAssetFile } from '@/types/product'
import type { ProductionPlanDetail, ProductionPlanFile, ProductionPlanFileGroup, ProductionPlanRow, ProductionPlanStage } from '@/types/productionPlan'
import type { Purchase, PurchaseTimelineRecord } from '@/types/purchase'
import type { Task } from '@/types/task'
import { getOrderLineFactoryStatus, getOrderLineProductionStatus } from '@/services/orderLine/orderLineWorkflow'

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

type ProductionPlanSource = {
  task: Task
  purchase: Purchase
  orderLine: OrderLine
  sourceProduct: Product
}

const buildProductionPlanFileGroups = (orderLine: OrderLine, sourceProduct: Product): ProductionPlanFileGroup[] => {
  const actualRequirements = orderLine.actualRequirements as OrderLine['actualRequirements'] & {
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

const buildProductionTimeline = (source: ProductionPlanSource): PurchaseTimelineRecord[] =>
  (source.purchase?.timeline ?? [])
    .filter((record) => record.relatedTaskId === source.task.id || record.relatedOrderLineId === source.orderLine.id)
    .filter((record, index, records) => records.findIndex((item) => item.id === record.id) === index)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

const getLineFactoryFeedback = (orderLine: OrderLine) => orderLine.productionInfo

const getLineSku = (orderLine: OrderLine) => orderLine.productionTaskNo || orderLine.skuCode || orderLine.itemSku || orderLine.sourceProduct?.sourceProductCode || orderLine.lineCode

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
  const { task, purchase, orderLine, sourceProduct } = source
  const stage = getProductionPlanStage(task, orderLine)
  const purchaseId = purchase.id
  const purchaseNo = purchase.purchaseNo
  const orderLineId = orderLine.id
  const orderLineCode = orderLine.lineCode || getLineSku(orderLine) || task.orderLineCode || orderLine.id
  const orderLineName = orderLine.name || task.orderLineName || sourceProduct.name

  return {
    taskId: task.id,
    purchaseId,
    purchaseNo,
    orderLineId,
    orderLineCode,
    orderLineName,
    goodsNo: getLineSku(orderLine) || sourceProduct.code,
    styleName: orderLine.styleName || orderLineName,
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
    isUrgent: Boolean(orderLine.isUrgent || orderLine.priority === 'urgent' || orderLine.priority === 'vip' || task.priority === 'urgent'),
    assignedAt: task.createdAt,
    plannedDueDate: task.dueAt || orderLine.promisedDate || purchase?.promisedDate,
    assigneeName: task.assigneeName,
    taskStatus: task.status,
    stage,
    stageLabel: getProductionPlanStageLabel(stage)
  }
}

export const getProductionPlanStage = (task: Task, orderLine: OrderLine): ProductionPlanStage => {
  const workflowFactoryStatus = getOrderLineFactoryStatus(orderLine)
  const workflowProductionStatus = getOrderLineProductionStatus(orderLine)
  const factoryStatus = normalizeFactoryStatus(getLineFactoryFeedback(orderLine)?.factoryStatus)

  if (workflowFactoryStatus === 'abnormal' || workflowProductionStatus === 'blocked' || factoryStatus === 'issue') {
    return 'issue'
  }

  if (task.status === 'done' || workflowFactoryStatus === 'returned' || workflowProductionStatus === 'completed' || factoryStatus === 'completed') {
    return 'reported'
  }

  if (task.status === 'pending_confirm' || factoryStatus === 'pending_feedback') {
    return 'pending_report'
  }

  if (workflowFactoryStatus === 'in_production' || workflowProductionStatus === 'in_production' || factoryStatus === 'in_progress') {
    return 'in_production'
  }

  if (workflowProductionStatus === 'pending_dispatch' || workflowProductionStatus === 'dispatched') {
    return 'ready_to_produce'
  }

  if (task.status === 'in_progress') {
    return 'ready_to_produce'
  }

  if (task.status === 'todo') {
    return 'pending_receive'
  }

  return 'pending_receive'
}

export const getProductionPlanStageLabel = (stage: ProductionPlanStage) => productionPlanStageLabelMap[stage]

export const getProductionPlanCategoryLabel = (category: ProductCategory) => productCategoryLabelMap[category]

export const getProductionPlanTasks = (tasks: Task[]) => tasks.filter((task) => task.type === 'factory_production')

const findPurchase = (task: Task, purchases: Purchase[]) =>
  purchases.find((item) => item.id === (task.purchaseId || task.transactionId))

const findOrderLine = (task: Task, purchase: Purchase | undefined, orderLines: OrderLine[]) => {
  const lineId = task.orderLineId
  if (!lineId) {
    return undefined
  }

  return orderLines.find((item) => item.id === lineId && (!purchase || item.purchaseId === purchase.id)) || purchase?.orderLines.find((item) => item.id === lineId)
}

const resolveProductionPlanSource = ({
  task,
  purchases = [],
  orderLines = [],
  products
}: {
  task: Task
  purchases?: Purchase[]
  orderLines?: OrderLine[]
  products: Product[]
}): ProductionPlanSource | undefined => {
  const purchase = findPurchase(task, purchases)
  const orderLine = findOrderLine(task, purchase, orderLines)
  const sourceProduct = products.find((item) => item.id === orderLine?.sourceProduct?.sourceProductId)

  if (!purchase || !orderLine || !sourceProduct) {
    return undefined
  }

  return {
    task,
    purchase,
    orderLine,
    sourceProduct
  }
}

export const buildProductionPlanRows = ({
  tasks,
  purchases,
  orderLines,
  products
}: {
  tasks: Task[]
  purchases?: Purchase[]
  orderLines?: OrderLine[]
  products: Product[]
}) =>
  getProductionPlanTasks(tasks)
    .flatMap((task) => {
      const source = resolveProductionPlanSource({ task, purchases, orderLines, products })

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
  products
}: {
  taskId?: string
  tasks: Task[]
  purchases?: Purchase[]
  orderLines?: OrderLine[]
  products: Product[]
}): ProductionPlanDetail | undefined => {
  const task = tasks.find((item) => item.id === taskId && item.type === 'factory_production')
  if (!task) {
    return undefined
  }

  const source = resolveProductionPlanSource({ task, purchases, orderLines, products })

  if (!source) {
    return undefined
  }

  const row = buildProductionPlanRow(source)

  return {
    purchaseId: row.purchaseId,
    purchaseNo: row.purchaseNo,
    orderLineId: row.orderLineId,
    orderLineCode: row.orderLineCode,
    orderLineName: row.orderLineName,
    row,
    task,
    orderLine: source.orderLine,
    sourceProduct: source.sourceProduct,
    timeline: buildProductionTimeline(source),
    fileGroups: buildProductionPlanFileGroups(source.orderLine, source.sourceProduct),
    referenceImages: source.sourceProduct.assets.detailImages
  }
}
