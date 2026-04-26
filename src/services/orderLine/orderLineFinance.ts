import {
  financeWorkflowStatusLabelMap,
  getOrderLineFactoryStatus,
  getOrderLineFinanceStatus,
  getOrderLineLineStatus
} from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'

export type FinanceTab = 'balance' | 'settlement' | 'costing' | 'abnormal' | 'confirmed'

export type FinanceRow = {
  line: OrderLine
  purchase?: Purchase
  purchaseNo: string
  salesAmount: number
  factorySettlementAmount: number
  estimatedGrossProfit: number
  estimatedGrossProfitRate: number
  financeStatusLabel: string
  riskLabels: string[]
}

export const financeTabs: Array<{ value: FinanceTab; label: string }> = [
  { value: 'balance', label: '待尾款确认' },
  { value: 'settlement', label: '待工厂结算确认' },
  { value: 'costing', label: '待成本核算' },
  { value: 'abnormal', label: '财务异常' },
  { value: 'confirmed', label: '已确认' }
]

export const getLineSalesAmount = (line: OrderLine) => line.lineSalesAmount ?? line.finalDisplayQuote ?? line.quote?.systemQuote ?? 0

export const getFactorySettlementAmount = (line: OrderLine) =>
  line.factorySettlementAmount ?? line.productionData?.totalLaborCost ?? ((line.productionData?.baseLaborCost ?? 0) + (line.productionData?.extraLaborCost ?? 0) || 0)

export const calculateFinanceSummary = (line: OrderLine) => {
  const salesAmount = getLineSalesAmount(line)
  const materialCost = line.materialCost ?? 0
  const stoneCost = (line.mainStoneCost ?? line.productionData?.mainStoneAmount ?? 0) + (line.sideStoneCost ?? line.productionData?.sideStoneAmount ?? 0)
  const factorySettlementAmount = getFactorySettlementAmount(line)
  const logisticsCost = line.logisticsCost ?? 0
  const afterSalesCost = line.afterSalesCost ?? 0
  const estimatedGrossProfit = salesAmount - materialCost - stoneCost - factorySettlementAmount - logisticsCost - afterSalesCost
  const estimatedGrossProfitRate = salesAmount > 0 ? Number(((estimatedGrossProfit / salesAmount) * 100).toFixed(1)) : 0

  return {
    salesAmount,
    factorySettlementAmount,
    estimatedGrossProfit,
    estimatedGrossProfitRate
  }
}

export const getFinanceRiskLabels = (line: OrderLine) => {
  const risks: string[] = []
  const financeStatus = getOrderLineFinanceStatus(line)
  const factoryStatus = getOrderLineFactoryStatus(line)
  const settlementAmount = getFactorySettlementAmount(line)
  const salesAmount = getLineSalesAmount(line)

  if (financeStatus === 'abnormal') {
    risks.push('财务异常')
  }
  if (factoryStatus === 'abnormal') {
    risks.push('工厂异常')
  }
  if ((factoryStatus === 'returned' || getOrderLineLineStatus(line) === 'factory_returned') && !line.productionData?.totalWeight) {
    risks.push('工厂未回传重量')
  }
  if (line.productionData?.totalWeight && line.productionData?.netMetalWeight && line.productionData.netMetalWeight > line.productionData.totalWeight) {
    risks.push('净金重大于总重')
  }
  if ((factoryStatus === 'returned' || getOrderLineLineStatus(line) === 'factory_returned') && settlementAmount <= 0) {
    risks.push('工厂结算金额为空')
  }
  if (salesAmount <= 0) {
    risks.push('销售金额为空')
  }

  return risks
}

export const buildFinanceRows = (orderLines: OrderLine[], purchases: Purchase[]): FinanceRow[] =>
  orderLines.map((line) => {
    const purchase = purchases.find((item) => item.id === line.purchaseId)
    const financeStatus = getOrderLineFinanceStatus(line)
    const summary = calculateFinanceSummary(line)

    return {
      line,
      purchase,
      purchaseNo: purchase?.purchaseNo || line.purchaseId || '未关联购买记录',
      ...summary,
      financeStatusLabel: financeWorkflowStatusLabelMap[financeStatus],
      riskLabels: getFinanceRiskLabels(line)
    }
  })

export const filterFinanceRowsByTab = (rows: FinanceRow[], tab: FinanceTab) =>
  rows.filter((row) => {
    const financeStatus = getOrderLineFinanceStatus(row.line)
    const lineStatus = getOrderLineLineStatus(row.line)
    const factoryStatus = getOrderLineFactoryStatus(row.line)
    const finalPaymentStatus = row.purchase?.finance?.finalPaymentStatus

    switch (tab) {
      case 'balance':
        return finalPaymentStatus !== 'confirmed'
      case 'settlement':
        return (factoryStatus === 'returned' || lineStatus === 'factory_returned' || lineStatus === 'pending_finance_confirmation') && financeStatus === 'pending'
      case 'costing':
        return financeStatus === 'pending' && row.riskLabels.length === 0
      case 'abnormal':
        return financeStatus === 'abnormal' || row.riskLabels.length > 0
      case 'confirmed':
        return financeStatus === 'confirmed' || Boolean(row.line.financeLocked)
      default:
        return false
    }
  })
