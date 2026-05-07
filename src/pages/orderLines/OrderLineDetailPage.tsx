import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SourceProductDrawer, type SourceProductCompareValue } from '@/components/business/sourceProduct'
import {
  OrderLineAfterSalesCreateForm,
  OrderLineAfterSalesRecordItem,
  OrderLineDesignModelingSection,
  OrderLineDetailsSection,
  OrderLineLogisticsCreateForm,
  OrderLineLogisticsRecordItem,
  OrderLineLogSection,
  OrderLineOutsourceSection,
  OrderLineProductionSection,
  OrderLineStatusUpdatePanel
} from '@/components/business/orderLine'
import { DetailSection } from '@/components/business/orderLine/orderLineDetailSection'
import { CopyableText, EmptyState, InfoField, InfoGrid, PageContainer, PageHeader, RiskTag, StatusTag } from '@/components/common'
import { financePaymentRecordsMock } from '@/mocks/finance-payment-records'
import { useAppData } from '@/hooks/useAppData'
import { useOrderLineWorkspaceState } from '@/hooks/useOrderLineWorkspaceState'
import { buildFinanceCostCard, calculateFinancePaymentSummary, calculateFinanceSummary } from '@/services/orderLine/orderLineFinance'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { getOrderLineRisks } from '@/services/orderLine/orderLineRiskSelectors'
import {
  getOrderLineFinanceStatus,
  getOrderLineLineStatusLabel,
  getOrderLineProductionStatus,
  getOrderLineV2WorkflowStep,
  getOrderLineWorkflowActionState,
  productionWorkflowStatusLabelMap
} from '@/services/orderLine/orderLineWorkflow'
import { getOrderLineAfterSalesCases, getOrderLineLogisticsRecords } from '@/services/orderLine/orderLineWorkspace'
import type { OrderLine, OrderLineFinanceStatus, OrderLineLog } from '@/types/order-line'
import type { Purchase } from '@/types/purchase'
import type { AfterSalesCase } from '@/types/supporting-records'

const formatPrice = (value?: number) => (typeof value === 'number' ? `¥ ${value.toLocaleString('zh-CN')}` : '—')

const orderLineFinanceSummaryLabelMap: Record<OrderLineFinanceStatus, string> = {
  not_required: '暂未进入核算',
  pending: '待财务核算',
  confirmed: '财务已核算',
  abnormal: '财务异常'
}

const getOrderLineRegisteredAt = (lineLogs: OrderLineLog[], purchase?: Purchase) =>
  lineLogs.find((log) => log.actionType === 'created')?.createdAt ||
  purchase?.timeline.find((item) => item.type === 'purchase_created')?.createdAt ||
  purchase?.paymentAt ||
  '—'

const getOrderLineDisplayName = (line: OrderLine) => line.name || '未命名款式'

const buildOrderLineSourceProductCompareValue = (line: OrderLine): SourceProductCompareValue => ({
  sourceLabel: `${getOrderLineGoodsNo(line)} ${getOrderLineDisplayName(line)}`,
  specValue: line.selectedSpecValue || line.sourceProduct?.sourceSpecValue,
  material: line.selectedMaterial || line.actualRequirements?.material,
  process: line.selectedProcess || line.actualRequirements?.process,
  specialOptions: line.selectedSpecialOptions
})

const getLineRiskLabels = (line: OrderLine, afterSalesCases: AfterSalesCase[]) =>
  getOrderLineRisks(line, { afterSalesCases, dueDate: line.promisedDate }).map((risk) => risk.label)

export const OrderLineDetailPage = () => {
  const { orderLineId } = useParams()
  const appData = useAppData()
  const workspace = useOrderLineWorkspaceState()
  const row = workspace.rows.find(({ line }) => line.id === orderLineId)
  const line = row?.line
  const purchase = row?.purchase
  const customer = appData.customers.find((item) => item.id === line?.customerId || item.id === purchase?.customerId)
  const [sourceProductOpen, setSourceProductOpen] = useState(false)
  const [logisticsFormOpen, setLogisticsFormOpen] = useState(false)
  const [afterSalesFormOpen, setAfterSalesFormOpen] = useState(false)

  useEffect(() => {
    setSourceProductOpen(false)
    setLogisticsFormOpen(false)
    setAfterSalesFormOpen(false)
  }, [line?.id])

  if (!row || !line) {
    return (
      <PageContainer>
        <PageHeader
          title="销售详情"
          className="compact-page-header"
          actions={
            <Link to="/order-lines" className="button secondary">
              返回销售中心
            </Link>
          }
        />
        <EmptyState title="未找到销售" description="当前销售不存在，可能是链接失效或 mock 数据尚未包含该记录。" />
      </PageContainer>
    )
  }

  const lineLogs = workspace.logs.filter((log) => log.orderLineId === line.id)
  const lineLogisticsRecords = getOrderLineLogisticsRecords(workspace.logisticsRecords, line.id)
  const lineAfterSalesCases = getOrderLineAfterSalesCases(workspace.afterSalesCases, line.id)
  const sourceProduct = appData.products.find((product) => product.id === line.sourceProduct?.sourceProductId || product.id === line.productId)
  const sourceProductCompareValue = buildOrderLineSourceProductCompareValue(line)
  const workflowStep = getOrderLineV2WorkflowStep(line)
  const actionState = getOrderLineWorkflowActionState(line)
  const riskLabels = getLineRiskLabels(line, workspace.afterSalesCases)
  const paymentSummary = calculateFinancePaymentSummary(line, financePaymentRecordsMock)
  const costCard = buildFinanceCostCard(line, financePaymentRecordsMock, appData.inventoryItems, appData.inventoryMovements)
  const financeSummary = calculateFinanceSummary(line, financePaymentRecordsMock, appData.inventoryItems, appData.inventoryMovements)
  const linkedInventoryItems = appData.inventoryItems.filter((item) => item.orderLineId === line.id)
  const linkedInventoryMovements = appData.inventoryMovements.filter((movement) => movement.relatedOrderLineId === line.id)
  const purchaseLink = purchase ? (
    <Link to={`/purchases/${purchase.id}`} className="button secondary small">
      打开购买记录
    </Link>
  ) : (
    '—'
  )

  return (
    <PageContainer>
      <PageHeader
        title="销售详情"
        className="compact-page-header"
        actions={
          <div className="row wrap">
            {purchaseLink}
            <Link to="/order-lines" className="button secondary">
              返回销售中心
            </Link>
          </div>
        }
      />

      <div className="section-stack order-line-detail-page">
        <div className="subtle-panel">
          <div className="row wrap" style={{ justifyContent: 'space-between' }}>
            <div className="stack" style={{ gap: 6 }}>
              <strong>{getOrderLineGoodsNo(line)} · {getOrderLineDisplayName(line)}</strong>
              <div className="text-caption">单件销售详情页，承接状态推进、物流、售后、设计建模、生产、工厂回传、库存追溯和财务摘要。</div>
            </div>
            <StatusTag value={getOrderLineLineStatusLabel(line.lineStatus || 'draft')} />
          </div>
        </div>

        <DetailSection title="顶部摘要">
          <InfoGrid columns={3}>
            <InfoField label="货号" value={<CopyableText value={getOrderLineGoodsNo(line, '')} label="货号" />} />
            <InfoField label="款式名称" value={getOrderLineDisplayName(line)} />
            <InfoField label="购买记录" value={purchase ? <Link to={`/purchases/${purchase.id}`}>{purchase.purchaseNo}</Link> : '—'} />
            <InfoField label="客户" value={customer?.name || '—'} />
            <InfoField label="客户 ID" value={<CopyableText value={customer?.id || line.customerId || purchase?.customerId} label="客户 ID" />} />
            <InfoField label="当前负责人" value={line.currentOwner || purchase?.ownerName || '待分配'} />
            <InfoField label="登记时间" value={getOrderLineRegisteredAt(lineLogs, purchase)} />
            <InfoField label="承诺交期" value={line.promisedDate || purchase?.promisedDate || '—'} />
            <InfoField label="生产状态" value={productionWorkflowStatusLabelMap[getOrderLineProductionStatus(line)]} />
            <InfoField
              label="风险标签"
              value={
                riskLabels.length > 0 ? (
                  <div className="row wrap">
                    {riskLabels.map((label) => (
                      <RiskTag key={label} value={label} />
                    ))}
                  </div>
                ) : (
                  '—'
                )
              }
            />
          </InfoGrid>
        </DetailSection>

        {workflowStep ? (
          <DetailSection title="当前步骤">
            <InfoGrid columns={3}>
              <InfoField label="当前阶段" value={<StatusTag value={workflowStep.stageLabel} />} />
              <InfoField label="负责角色" value={workflowStep.ownerRoleLabel} />
              <InfoField label="下一步动作" value={workflowStep.nextActionLabel} />
            </InfoGrid>
            <div className="text-caption spacer-top">{workflowStep.description}</div>
            {actionState.canCompleteOrderLine ? (
              <div className="workbench-actions inline spacer-top">
                <button type="button" className="button primary small" onClick={() => workspace.handleCompleteOrderLine(line.id)}>
                  完成销售
                </button>
              </div>
            ) : null}
          </DetailSection>
        ) : null}

        <DetailSection title="客户与购买入口">
          <InfoGrid columns={3}>
            <InfoField label="购买记录编号" value={purchase ? <Link to={`/purchases/${purchase.id}`}>{purchase.purchaseNo}</Link> : '—'} />
            <InfoField label="平台订单号" value={purchase?.platformOrderNo || '—'} />
            <InfoField label="来源平台" value={purchase?.sourceChannel || '—'} />
            <InfoField label="客户姓名" value={customer?.name || '—'} />
            <InfoField label="客户手机" value={customer?.phone || '—'} />
            <InfoField label="客户微信" value={customer?.wechat || '—'} />
          </InfoGrid>
        </DetailSection>

        <DetailSection title="财务摘要">
          <InfoGrid columns={3}>
            <InfoField label="系统参考报价" value={formatPrice(line.quote?.systemQuote)} />
            <InfoField label="成交价" value={formatPrice(line.lineSalesAmount ?? line.quote?.systemQuote)} />
            <InfoField label="已收金额" value={formatPrice(paymentSummary.receivedAmount)} />
            <InfoField label="待收金额" value={formatPrice(paymentSummary.pendingAmount)} />
            <InfoField label="退款金额" value={formatPrice(paymentSummary.refundedAmount)} />
            <InfoField label="财务状态" value={orderLineFinanceSummaryLabelMap[getOrderLineFinanceStatus(line)]} />
            <InfoField label="FIFO库存成本" value={formatPrice(costCard.inventoryFifoCostAmount)} />
            <InfoField label="成本合计" value={formatPrice(costCard.totalCost)} />
            <InfoField label="预估毛利" value={`${formatPrice(financeSummary.estimatedGrossProfit)} / ${financeSummary.estimatedGrossProfitRate}%`} />
            <InfoField label="财务备注" value={line.financeNote || '—'} />
          </InfoGrid>
        </DetailSection>

        <DetailSection title="库存追溯">
          <InfoGrid columns={3}>
            <InfoField label="关联库存资产" value={`${linkedInventoryItems.length} 个`} />
            <InfoField label="关联库存流水" value={`${linkedInventoryMovements.length} 条`} />
            <InfoField label="FIFO成本" value={formatPrice(costCard.inventoryFifoCostAmount)} />
          </InfoGrid>
          {linkedInventoryItems.length > 0 ? (
            <div className="row wrap spacer-top">
              {linkedInventoryItems.map((item) => (
                <span key={item.id} className="tag version">
                  {item.inventoryCode} · {item.status}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-caption spacer-top">当前销售暂无直接关联库存资产。</div>
          )}
        </DetailSection>

        <OrderLineStatusUpdatePanel line={line} onStatusChange={workspace.handleStatusChange} />
        <OrderLineLogSection logs={lineLogs} />
        <OrderLineDetailsSection line={line} onUpdateLineDetails={workspace.handleUpdateLineDetails} onOpenSourceProduct={sourceProduct ? () => setSourceProductOpen(true) : undefined} />
        <OrderLineDesignModelingSection line={line} onUpdateDesignModeling={workspace.handleUpdateDesignModelingInfo} />
        <OrderLineOutsourceSection line={line} onUpdateOutsourceInfo={workspace.handleUpdateOutsourceInfo} />
        <OrderLineProductionSection line={line} onUpdateProductionInfo={workspace.handleUpdateProductionInfo} />

        <DetailSection title="物流 / 售后">
          <div className="stack">
            <div className="subtle-panel">
              <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                <strong>物流记录</strong>
                <button type="button" className="button ghost small" onClick={() => setLogisticsFormOpen((current) => !current)}>
                  新增物流
                </button>
              </div>
              {logisticsFormOpen ? (
                <div className="spacer-top">
                  <OrderLineLogisticsCreateForm line={line} purchase={purchase} onAddLogistics={workspace.handleAddLogistics} onCancel={() => setLogisticsFormOpen(false)} />
                </div>
              ) : null}
              {lineLogisticsRecords.length > 0 ? (
                <ul className="list-reset stack spacer-top">
                  {lineLogisticsRecords.map((record) => (
                    <OrderLineLogisticsRecordItem key={record.id} record={record} onUpdateLogistics={workspace.handleUpdateLogistics} onVoidLogistics={workspace.handleVoidLogistics} />
                  ))}
                </ul>
              ) : (
                <EmptyState title="暂无物流记录" description="当前销售还没有关联物流记录。" />
              )}
            </div>

            <div className="subtle-panel">
              <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                <strong>售后记录</strong>
                <button type="button" className="button ghost small" onClick={() => setAfterSalesFormOpen((current) => !current)}>
                  新增售后
                </button>
              </div>
              {afterSalesFormOpen ? (
                <div className="spacer-top">
                  <OrderLineAfterSalesCreateForm line={line} purchase={purchase} onAddAfterSales={workspace.handleAddAfterSales} onCancel={() => setAfterSalesFormOpen(false)} />
                </div>
              ) : null}
              {lineAfterSalesCases.length > 0 ? (
                <ul className="list-reset stack spacer-top">
                  {lineAfterSalesCases.map((record) => (
                    <OrderLineAfterSalesRecordItem key={record.id} record={record} onUpdateAfterSales={workspace.handleUpdateAfterSales} onCloseAfterSales={workspace.handleCloseAfterSales} />
                  ))}
                </ul>
              ) : (
                <EmptyState title="暂无售后记录" description="当前销售还没有关联售后记录。" />
              )}
            </div>
          </div>
        </DetailSection>
      </div>

      <SourceProductDrawer
        open={sourceProductOpen}
        product={sourceProduct}
        compareValue={sourceProductCompareValue}
        onClose={() => setSourceProductOpen(false)}
      />
    </PageContainer>
  )
}
