import { Link } from 'react-router-dom'
import { PageContainer, PageHeader, RiskTag, SectionCard, StatusTag, SummaryCard } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { buildManagementDashboardMetrics } from '@/services/management/managementDashboard'

const formatCurrency = (value?: number) => `¥${Math.round(value ?? 0).toLocaleString('zh-CN')}`
const formatPercent = (value?: number) => `${value ?? 0}%`

export const ManagementDashboardPage = () => {
  const { purchases, orderLines } = useAppData()
  const metrics = buildManagementDashboardMetrics(purchases, orderLines)

  return (
    <PageContainer>
      <PageHeader
        title="管理看板"
        className="compact-page-header"
        actions={
          <div className="row wrap">
            <Link to="/order-lines" className="button secondary">
              商品行中心
            </Link>
            <Link to="/finance" className="button secondary">
              财务中心
            </Link>
          </div>
        }
      />

      <div className="stack spacer-top">
        <SummaryCard title="业务总览">
          <div className="summary-grid three">
            <MetricBlock label="今日新增购买记录" value={metrics.businessOverview.todayPurchaseCount} />
            <MetricBlock label="本月新增购买记录" value={metrics.businessOverview.monthPurchaseCount} />
            <MetricBlock label="进行中购买记录" value={metrics.businessOverview.activePurchaseCount} />
            <MetricBlock label="进行中商品行" value={metrics.businessOverview.activeOrderLineCount} />
            <MetricBlock label="待发货商品行" value={metrics.businessOverview.readyToShipLineCount} />
            <MetricBlock label="已完成商品行" value={metrics.businessOverview.completedLineCount} />
            <MetricBlock label="售后中商品行" value={metrics.businessOverview.afterSalesLineCount} />
          </div>
        </SummaryCard>

        <SectionCard title="商品行状态分布" className="compact-card">
          <div className="summary-grid three">
            {metrics.statusDistribution.map((item) => (
              <div key={item.status} className="subtle-panel">
                <div className="row wrap" style={{ justifyContent: 'space-between' }}>
                  <StatusTag value={item.label} />
                  <strong>{item.count}</strong>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="summary-grid two">
          <SectionCard title="生产风险" className="compact-card">
            <div className="summary-grid two">
              <MetricBlock label="逾期商品行" value={metrics.productionRisks.overdueCount} danger />
              <MetricBlock label="即将逾期商品行" value={metrics.productionRisks.dueSoonCount} />
              <MetricBlock label="阻塞商品行" value={metrics.productionRisks.blockedCount} danger />
              <MetricBlock label="工厂未回传" value={metrics.productionRisks.pendingFactoryReturnCount} />
              <MetricBlock label="设计未完成" value={metrics.productionRisks.designIncompleteCount} />
              <MetricBlock label="建模未完成" value={metrics.productionRisks.modelingIncompleteCount} />
              <MetricBlock label="资料不完整" value={metrics.productionRisks.incompleteInfoCount} danger />
            </div>
          </SectionCard>

          <SectionCard title="财务概览" className="compact-card">
            <div className="summary-grid two">
              <MetricBlock label="本月销售额" value={formatCurrency(metrics.financeOverview.monthlySalesAmount)} />
              <MetricBlock label="已收定金" value={formatCurrency(metrics.financeOverview.confirmedDepositAmount)} />
              <MetricBlock label="待收尾款" value={formatCurrency(metrics.financeOverview.pendingBalanceAmount)} />
              <MetricBlock label="待确认工厂结算" value={metrics.financeOverview.pendingFactorySettlementCount} />
              <MetricBlock label="财务异常数量" value={metrics.financeOverview.financeAbnormalCount} danger />
              <MetricBlock label="预估毛利" value={formatCurrency(metrics.financeOverview.estimatedGrossProfit)} />
              <MetricBlock label="预估毛利率" value={formatPercent(metrics.financeOverview.estimatedGrossProfitRate)} />
            </div>
          </SectionCard>
        </div>

        <div className="summary-grid two">
          <SectionCard title="角色负载" className="compact-card">
            <div className="stack">
              {metrics.roleWorkload.map((item) => (
                <div key={item.role} className="subtle-panel row wrap" style={{ justifyContent: 'space-between' }}>
                  <span>{item.role}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="工厂表现" className="compact-card">
            <div className="table-shell">
              <table className="table">
                <thead>
                  <tr>
                    <th>工厂</th>
                    <th>任务</th>
                    <th>生产中</th>
                    <th>已完成</th>
                    <th>风险</th>
                    <th>平均周期</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.factoryPerformance.map((factory) => (
                    <tr key={factory.factoryId}>
                      <td>{factory.factoryId}</td>
                      <td>{factory.taskCount}</td>
                      <td>{factory.inProductionCount}</td>
                      <td>{factory.completedCount}</td>
                      <td>
                        <div className="row wrap">
                          {factory.overdueCount > 0 ? <RiskTag value={`逾期 ${factory.overdueCount}`} /> : null}
                          {factory.abnormalCount > 0 ? <RiskTag value={`异常 ${factory.abnormalCount}`} /> : null}
                          {factory.overdueCount === 0 && factory.abnormalCount === 0 ? <StatusTag value="正常" /> : null}
                        </div>
                      </td>
                      <td>{factory.averageCycleDays ? `${factory.averageCycleDays} 天` : '数据不足'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  )
}

const MetricBlock = ({ label, value, danger = false }: { label: string; value: string | number; danger?: boolean }) => (
  <div className="subtle-panel">
    <div className="text-caption">{label}</div>
    <div className="quote-value">{value}</div>
    {danger ? <RiskTag value="需关注" /> : null}
  </div>
)
