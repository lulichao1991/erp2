import {
  getOrderLineFactoryStatus,
  getOrderLineLineStatus,
  getOrderLineProductionStatus,
  orderLineLineStatusLabelMap,
  productionWorkflowStatusLabelMap,
  factoryWorkflowStatusLabelMap
} from '@/services/orderLine/orderLineWorkflow'
import { findPurchaseForOrderLine, getOrderLinePurchaseId } from '@/services/orderLine/orderLineIdentity'
import { getProductionDelayStatus } from '@/services/orderLine/orderLineRiskSelectors'
import type { OrderLine } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'

export type ProductionFollowUpTab = 'review' | 'dispatch' | 'producing' | 'factory_return' | 'completion_review' | 'risk'

type ProductionCompletionReviewSeverity = 'pass' | 'warning' | 'critical'

type ProductionCompletionReviewCheck = {
  key: string
  label: string
  expected: string
  actual: string
  severity: ProductionCompletionReviewSeverity
}

export type ProductionFollowUpRow = {
  line: OrderLine
  purchase?: Purchase
  purchaseNo: string
  lineStatusLabel: string
  productionStatusLabel: string
  factoryStatusLabel: string
  completionReviewChecks: ProductionCompletionReviewCheck[]
  completionReviewSeverity: ProductionCompletionReviewSeverity
  isOverdue: boolean
  isRisk: boolean
}

export const productionFollowUpTabs: Array<{ value: ProductionFollowUpTab; label: string }> = [
  { value: 'review', label: '待跟单审核' },
  { value: 'dispatch', label: '待下发生产' },
  { value: 'producing', label: '生产中' },
  { value: 'factory_return', label: '待工厂回传' },
  { value: 'completion_review', label: '完工待审核' },
  { value: 'risk', label: '异常 / 逾期' }
]

const parseWeight = (value?: string) => {
  const weightText = value?.match(/\d+(\.\d+)?/)?.[0]
  return weightText ? Number(weightText) : undefined
}

const formatWeight = (value?: number) => (typeof value === 'number' ? `${value}g` : '未填写')

const buildReviewCheck = (
  key: string,
  label: string,
  expected: string,
  actual: string,
  severity: ProductionCompletionReviewSeverity
): ProductionCompletionReviewCheck => ({
  key,
  label,
  expected,
  actual,
  severity
})

const getCompletionReviewSeverity = (checks: ProductionCompletionReviewCheck[]): ProductionCompletionReviewSeverity => {
  if (checks.some((check) => check.severity === 'critical')) {
    return 'critical'
  }
  if (checks.some((check) => check.severity === 'warning')) {
    return 'warning'
  }
  return 'pass'
}

export const buildProductionCompletionReviewChecks = (line: OrderLine): ProductionCompletionReviewCheck[] => {
  const expectedMaterial = line.selectedMaterial || line.actualRequirements?.material || line.sourceProduct?.defaultMaterial || '未填写'
  const actualMaterial = line.productionData?.actualMaterial || line.productionInfo?.actualMaterial || ''
  const expectedWeight = line.selectedSpecSnapshot?.referenceWeight
  const actualWeight = line.productionData?.netMetalWeight ?? parseWeight(line.productionInfo?.netWeight)
  const finishedImageCount = line.productionData?.finishedImageUrls?.length ?? 0
  const settlementFileCount = line.productionData?.settlementFileUrls?.length ?? 0
  const weightDifference = typeof expectedWeight === 'number' && typeof actualWeight === 'number' ? Math.abs(expectedWeight - actualWeight) : undefined

  return [
    buildReviewCheck(
      'material',
      '材质',
      expectedMaterial,
      actualMaterial || '未回传',
      !actualMaterial ? 'warning' : expectedMaterial !== '未填写' && actualMaterial !== expectedMaterial ? 'critical' : 'pass'
    ),
    buildReviewCheck(
      'net_weight',
      '净金重',
      formatWeight(expectedWeight),
      formatWeight(actualWeight),
      typeof actualWeight !== 'number' || typeof expectedWeight !== 'number' ? 'warning' : (weightDifference ?? 0) <= 0.3 ? 'pass' : (weightDifference ?? 0) <= 0.8 ? 'warning' : 'critical'
    ),
    buildReviewCheck('finished_images', '成品照片', '至少 1 张', `${finishedImageCount} 张`, finishedImageCount > 0 ? 'pass' : 'warning'),
    buildReviewCheck('settlement_files', '结算附件', '至少 1 份', `${settlementFileCount} 份`, settlementFileCount > 0 ? 'pass' : 'warning')
  ]
}

const isProductionFollowUpOverdue = (line: OrderLine) => {
  return getProductionDelayStatus(line, new Date(), line.factoryPlannedDueDate).overdue
}

const isProductionFollowUpRisk = (line: OrderLine) => {
  const productionStatus = getOrderLineProductionStatus(line)
  return productionStatus === 'blocked' || productionStatus === 'delayed' || isProductionFollowUpOverdue(line)
}

export const buildProductionFollowUpRows = (orderLines: OrderLine[], purchases: Purchase[]): ProductionFollowUpRow[] =>
  orderLines
    .filter((line) => {
      const lineStatus = getOrderLineLineStatus(line)
      const productionStatus = getOrderLineProductionStatus(line)
      const factoryStatus = getOrderLineFactoryStatus(line)

      return (
        lineStatus === 'pending_merchandiser_review' ||
        lineStatus === 'pending_factory_production' ||
        lineStatus === 'in_production' ||
        lineStatus === 'factory_returned' ||
        productionStatus === 'pending_dispatch' ||
        productionStatus === 'dispatched' ||
        productionStatus === 'in_production' ||
        factoryStatus === 'accepted' ||
        factoryStatus === 'in_production' ||
        isProductionFollowUpRisk(line)
      )
    })
    .map((line) => {
      const purchase = findPurchaseForOrderLine(line, purchases)
      const lineStatus = getOrderLineLineStatus(line)
      const productionStatus = getOrderLineProductionStatus(line)
      const factoryStatus = getOrderLineFactoryStatus(line)
      const isOverdue = isProductionFollowUpOverdue(line)
      const isCompletionReview = lineStatus === 'factory_returned'
      const completionReviewChecks = isCompletionReview ? buildProductionCompletionReviewChecks(line) : []
      const completionReviewSeverity = isCompletionReview ? getCompletionReviewSeverity(completionReviewChecks) : 'pass'

      return {
        line,
        purchase,
        purchaseNo: purchase?.purchaseNo || getOrderLinePurchaseId(line) || '未关联购买记录',
        lineStatusLabel: orderLineLineStatusLabelMap[lineStatus],
        productionStatusLabel: productionWorkflowStatusLabelMap[productionStatus],
        factoryStatusLabel: factoryWorkflowStatusLabelMap[factoryStatus],
        completionReviewChecks,
        completionReviewSeverity,
        isOverdue,
        isRisk: productionStatus === 'blocked' || productionStatus === 'delayed' || isOverdue || (isCompletionReview && completionReviewSeverity === 'critical')
      }
    })

export const filterProductionFollowUpRowsByTab = (rows: ProductionFollowUpRow[], tab: ProductionFollowUpTab) =>
  rows.filter((row) => {
    const lineStatus = getOrderLineLineStatus(row.line)
    const productionStatus = getOrderLineProductionStatus(row.line)
    const factoryStatus = getOrderLineFactoryStatus(row.line)
    const isBlockedOrAbnormal = productionStatus === 'blocked' || productionStatus === 'delayed' || factoryStatus === 'abnormal'

    switch (tab) {
      case 'review':
        return lineStatus === 'pending_merchandiser_review'
      case 'dispatch':
        return !isBlockedOrAbnormal && (lineStatus === 'pending_factory_production' || productionStatus === 'pending_dispatch')
      case 'producing':
        return !isBlockedOrAbnormal && (lineStatus === 'in_production' || productionStatus === 'in_production')
      case 'factory_return':
        return !isBlockedOrAbnormal && productionStatus === 'in_production' && factoryStatus !== 'returned'
      case 'completion_review':
        return lineStatus === 'factory_returned'
      case 'risk':
        return row.isRisk
      default:
        return false
    }
  })

export const canReturnProductionToCustomerService = (line: OrderLine) => {
  const lineStatus = getOrderLineLineStatus(line)
  const productionStatus = getOrderLineProductionStatus(line)

  return (
    (lineStatus === 'pending_merchandiser_review' || lineStatus === 'pending_factory_production') &&
    productionStatus !== 'in_production' &&
    productionStatus !== 'completed' &&
    productionStatus !== 'blocked'
  )
}

export const canReturnProductionToDesignOrModeling = (line: OrderLine) =>
  canReturnProductionToCustomerService(line) && Boolean(line.requiresDesign || line.requiresModeling)
