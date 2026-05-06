import {
  financeWorkflowStatusLabelMap,
  getOrderLineFactoryStatus,
  getOrderLineFinanceStatus,
  getOrderLineLineStatus
} from '@/services/orderLine/orderLineWorkflow'
import { findPurchaseForOrderLine, getOrderLinePurchaseId } from '@/services/orderLine/orderLineIdentity'
import { getFinanceRiskStatus } from '@/services/orderLine/orderLineRiskSelectors'
import type { FinancePaymentRecord } from '@/types/finance'
import type { InventoryItem, InventoryMovement } from '@/types/inventory'
import type { OrderLine } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'

export type FinanceTab = 'balance' | 'payment_review' | 'settlement' | 'costing' | 'abnormal' | 'confirmed'

type FinancePaymentSummary = {
  dueAmount: number
  receivedAmount: number
  refundedAmount: number
  paidAmount: number
  pendingAmount: number
  paymentStatusLabel: string
  paymentRiskLabels: string[]
  pendingPaymentReviewCount: number
  paymentRecords: FinancePaymentRecord[]
}

type FinanceCostCard = {
  salesAmount: number
  materialCost: number
  stoneCost: number
  factorySettlementAmount: number
  logisticsCost: number
  afterSalesCost: number
  totalCost: number
  oldGoldOffsetAmount: number
  oldGoldValuationAmount: number
  oldGoldRecognizedCostAmount: number
  inventoryFifoCostAmount: number
  oldGoldInventoryCodes: string[]
  estimatedGrossProfit: number
  estimatedGrossProfitRate: number
}

export type FinanceRow = {
  line: OrderLine
  purchase?: Purchase
  purchaseNo: string
  salesAmount: number
  dueAmount: number
  receivedAmount: number
  refundedAmount: number
  paidAmount: number
  pendingAmount: number
  paymentStatusLabel: string
  paymentRiskLabels: string[]
  pendingPaymentReviewCount: number
  paymentRecords: FinancePaymentRecord[]
  costCard: FinanceCostCard
  factorySettlementAmount: number
  estimatedGrossProfit: number
  estimatedGrossProfitRate: number
  financeStatusLabel: string
  isLocked: boolean
  riskLabels: string[]
}

export const financeTabs: Array<{ value: FinanceTab; label: string }> = [
  { value: 'balance', label: '待收款' },
  { value: 'payment_review', label: '补款 / 退款' },
  { value: 'settlement', label: '待工厂结算确认' },
  { value: 'costing', label: '待成本核算' },
  { value: 'abnormal', label: '财务异常' },
  { value: 'confirmed', label: '已确认' }
]

export const getLineSalesAmount = (line: OrderLine) => line.lineSalesAmount ?? line.quote?.systemQuote ?? 0

const getFactorySettlementAmount = (line: OrderLine) =>
  line.factorySettlementAmount ?? line.productionData?.totalLaborCost ?? ((line.productionData?.baseLaborCost ?? 0) + (line.productionData?.extraLaborCost ?? 0) || 0)

const getFinancePaymentRecordsForLine = (paymentRecords: FinancePaymentRecord[], orderLineId: string) =>
  paymentRecords.filter((record) => record.orderLineId === orderLineId)

const isRefundPaymentRecord = (record: FinancePaymentRecord) => record.method === 'refund' || record.recordType === 'refund'

const isAdjustmentPaymentRecord = (record: FinancePaymentRecord) => record.recordType === 'supplement' || isRefundPaymentRecord(record)

const isPendingReviewPaymentRecord = (record: FinancePaymentRecord) => isAdjustmentPaymentRecord(record) && record.reviewStatus !== 'reviewed'

const getFinancePaymentRiskLabels = (paymentRecords: FinancePaymentRecord[]) => {
  const labels: string[] = []

  if (paymentRecords.some((record) => isRefundPaymentRecord(record) && !record.reason?.trim())) {
    labels.push('退款原因未填写')
  }

  return labels
}

const getOldGoldPaymentRecords = (paymentRecords: FinancePaymentRecord[]) => paymentRecords.filter((record) => record.method === 'old_gold')

const findOldGoldInventoryItem = (record: FinancePaymentRecord, inventoryItems: InventoryItem[]) =>
  inventoryItems.find(
    (item) =>
      item.sourceType === 'old_gold' &&
      (item.id === record.inventoryItemId ||
        item.inventoryCode === record.inventoryCode ||
        item.sourcePaymentRecordId === record.id)
  )

const getOldGoldInventoryCodes = (paymentRecords: FinancePaymentRecord[], inventoryItems: InventoryItem[]) => {
  const inventoryCodes = new Set<string>()

  getOldGoldPaymentRecords(paymentRecords).forEach((record) => {
    if (record.inventoryCode) {
      inventoryCodes.add(record.inventoryCode)
    }
    const linkedItem = record.inventoryItemId ? inventoryItems.find((item) => item.id === record.inventoryItemId) : undefined
    if (linkedItem?.inventoryCode) {
      inventoryCodes.add(linkedItem.inventoryCode)
    }
    const sourcedItem = findOldGoldInventoryItem(record, inventoryItems)
    if (sourcedItem?.inventoryCode) {
      inventoryCodes.add(sourcedItem.inventoryCode)
    }
  })

  return Array.from(inventoryCodes)
}

const getOldGoldValuationAmount = (paymentRecords: FinancePaymentRecord[], inventoryItems: InventoryItem[]) => {
  const inventoryItemIds = new Set<string>()

  return getOldGoldPaymentRecords(paymentRecords).reduce((sum, record) => {
    const linkedItem = findOldGoldInventoryItem(record, inventoryItems)

    if (!linkedItem || inventoryItemIds.has(linkedItem.id)) {
      return sum
    }

    inventoryItemIds.add(linkedItem.id)
    return sum + (linkedItem.valuationAmount ?? 0)
  }, 0)
}

const getFallbackPaidAmount = (line: OrderLine) => {
  const depositAmount = line.allocatedDepositAmount ?? 0
  const confirmedFinalPayment = line.financeStatus === 'confirmed' || line.financeLocked ? line.allocatedFinalPaymentAmount ?? 0 : 0

  return depositAmount + confirmedFinalPayment
}

export const calculateFinancePaymentSummary = (line: OrderLine, paymentRecords: FinancePaymentRecord[] = []): FinancePaymentSummary => {
  const dueAmount = getLineSalesAmount(line)
  const linePaymentRecords = getFinancePaymentRecordsForLine(paymentRecords, line.id)
  const receivedAmount =
    linePaymentRecords.length > 0 ? linePaymentRecords.filter((record) => !isRefundPaymentRecord(record)).reduce((sum, record) => sum + Math.max(0, record.amount), 0) : getFallbackPaidAmount(line)
  const refundedAmount = linePaymentRecords.filter(isRefundPaymentRecord).reduce((sum, record) => sum + Math.max(0, record.amount), 0)
  const paidAmount = Math.max(receivedAmount - refundedAmount, 0)
  const pendingAmount = Math.max(dueAmount - paidAmount, 0)
  const paymentRiskLabels = getFinancePaymentRiskLabels(linePaymentRecords)
  const pendingPaymentReviewCount = linePaymentRecords.filter(isPendingReviewPaymentRecord).length
  const paymentStatusLabel =
    dueAmount <= 0
      ? '待确认应收'
      : paymentRiskLabels.length > 0
        ? '退款待补原因'
        : pendingPaymentReviewCount > 0
          ? '补退款待复核'
          : refundedAmount > 0
            ? '有退款'
            : pendingAmount === 0
              ? '已收齐'
              : paidAmount > 0
                ? '部分收款'
                : '待收款'

  return {
    dueAmount,
    receivedAmount,
    refundedAmount,
    paidAmount,
    pendingAmount,
    paymentStatusLabel,
    paymentRiskLabels,
    pendingPaymentReviewCount,
    paymentRecords: linePaymentRecords
  }
}

const getInventoryFifoCostAmount = (line: OrderLine, inventoryMovements: InventoryMovement[] = []) =>
  inventoryMovements
    .filter((movement) => movement.type === 'outbound' && movement.relatedOrderLineId === line.id)
    .reduce((sum, movement) => sum + (movement.fifoCostAmount ?? 0), 0)

export const buildFinanceCostCard = (line: OrderLine, paymentRecords: FinancePaymentRecord[] = [], inventoryItems: InventoryItem[] = [], inventoryMovements: InventoryMovement[] = []): FinanceCostCard => {
  const salesAmount = getLineSalesAmount(line)
  const materialCost = line.materialCost ?? 0
  const stoneCost = (line.mainStoneCost ?? line.productionData?.mainStoneAmount ?? 0) + (line.sideStoneCost ?? line.productionData?.sideStoneAmount ?? 0)
  const factorySettlementAmount = getFactorySettlementAmount(line)
  const logisticsCost = line.logisticsCost ?? 0
  const afterSalesCost = line.afterSalesCost ?? 0
  const inventoryFifoCostAmount = getInventoryFifoCostAmount(line, inventoryMovements)
  const oldGoldRecords = getOldGoldPaymentRecords(getFinancePaymentRecordsForLine(paymentRecords, line.id))
  const oldGoldOffsetAmount = oldGoldRecords.reduce((sum, record) => sum + Math.max(0, record.amount), 0)
  const oldGoldValuationAmount = getOldGoldValuationAmount(oldGoldRecords, inventoryItems)
  const oldGoldRecognizedCostAmount = 0
  const totalCost = materialCost + stoneCost + factorySettlementAmount + logisticsCost + afterSalesCost + inventoryFifoCostAmount
  const estimatedGrossProfit = salesAmount - totalCost
  const estimatedGrossProfitRate = salesAmount > 0 ? Number(((estimatedGrossProfit / salesAmount) * 100).toFixed(1)) : 0

  return {
    salesAmount,
    materialCost,
    stoneCost,
    factorySettlementAmount,
    logisticsCost,
    afterSalesCost,
    totalCost,
    oldGoldOffsetAmount,
    oldGoldValuationAmount,
    oldGoldRecognizedCostAmount,
    inventoryFifoCostAmount,
    oldGoldInventoryCodes: getOldGoldInventoryCodes(oldGoldRecords, inventoryItems),
    estimatedGrossProfit,
    estimatedGrossProfitRate
  }
}

export const calculateFinanceSummary = (line: OrderLine) => {
  const costCard = buildFinanceCostCard(line)

  return {
    salesAmount: costCard.salesAmount,
    factorySettlementAmount: costCard.factorySettlementAmount,
    estimatedGrossProfit: costCard.estimatedGrossProfit,
    estimatedGrossProfitRate: costCard.estimatedGrossProfitRate
  }
}

export const getFinanceRiskLabels = (line: OrderLine) => getFinanceRiskStatus(line).labels

export const isFinanceLineLocked = (line: OrderLine) => line.financeStatus === 'confirmed' || Boolean(line.financeLocked)

export const buildFinanceRows = (orderLines: OrderLine[], purchases: Purchase[], paymentRecords: FinancePaymentRecord[] = [], inventoryItems: InventoryItem[] = [], inventoryMovements: InventoryMovement[] = []): FinanceRow[] =>
  orderLines.map((line) => {
    const purchase = findPurchaseForOrderLine(line, purchases)
    const financeStatus = getOrderLineFinanceStatus(line)
    const costCard = buildFinanceCostCard(line, paymentRecords, inventoryItems, inventoryMovements)
    const paymentSummary = calculateFinancePaymentSummary(line, paymentRecords)
    const financeRiskLabels = [...getFinanceRiskLabels(line), ...paymentSummary.paymentRiskLabels]

    return {
      line,
      purchase,
      purchaseNo: purchase?.purchaseNo || getOrderLinePurchaseId(line) || '未关联购买记录',
      salesAmount: costCard.salesAmount,
      factorySettlementAmount: costCard.factorySettlementAmount,
      estimatedGrossProfit: costCard.estimatedGrossProfit,
      estimatedGrossProfitRate: costCard.estimatedGrossProfitRate,
      costCard,
      ...paymentSummary,
      financeStatusLabel: financeWorkflowStatusLabelMap[financeStatus],
      isLocked: isFinanceLineLocked(line),
      riskLabels: financeRiskLabels
    }
  })

export const filterFinanceRowsByTab = (rows: FinanceRow[], tab: FinanceTab) =>
  rows.filter((row) => {
    const financeStatus = getOrderLineFinanceStatus(row.line)
    const lineStatus = getOrderLineLineStatus(row.line)
    const factoryStatus = getOrderLineFactoryStatus(row.line)

    switch (tab) {
      case 'balance':
        return row.pendingAmount > 0
      case 'payment_review':
        return row.pendingPaymentReviewCount > 0
      case 'settlement':
        return lineStatus === 'pending_finance_confirmation' && factoryStatus === 'returned' && financeStatus === 'pending'
      case 'costing':
        return lineStatus === 'pending_finance_confirmation' && financeStatus === 'pending' && row.riskLabels.length === 0
      case 'abnormal':
        return financeStatus === 'abnormal' || row.riskLabels.length > 0
      case 'confirmed':
        return financeStatus === 'confirmed' || Boolean(row.line.financeLocked)
      default:
        return false
    }
  })
