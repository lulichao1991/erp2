import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppBreadcrumb } from '@/app/layout/AppBreadcrumb'
import {
  ProductionFeedbackBlock,
  getProductionFeedbackStatusLabel,
  ProductionOrderLineInfoBlock,
  ProductionPlanStatusBadge,
  ProductionPlanSummaryCard,
  type ProductionFeedbackValue
} from '@/components/business/productionPlan'
import { EmptyState, FileList, ImageGallery, InfoField, InfoGrid, PageContainer, PageHeader, RecordTimeline, SectionCard } from '@/components/common'
import { useAppData } from '@/hooks/useAppData'
import { buildProductionPlanDetail } from '@/services/productionPlan/productionPlanAdapter'

export const ProductionPlanDetailPage = () => {
  const navigate = useNavigate()
  const { taskId } = useParams()
  const appData = useAppData()

  const detail = useMemo(
    () =>
      buildProductionPlanDetail({
        taskId,
        tasks: appData.tasks,
        purchases: appData.purchases,
        orderLines: appData.orderLines,
        products: appData.products
      }),
    [appData.orderLines, appData.products, appData.purchases, appData.tasks, taskId]
  )

  if (!detail) {
    return (
      <PageContainer>
        <EmptyState title="未找到生产计划" description="当前任务不存在、不是工厂任务，或其关联销售 / 来源款式 mock 数据不完整。" />
      </PageContainer>
    )
  }

  const { row, task, orderLine, sourceProduct, timeline, fileGroups, referenceImages } = detail
  const productionFeedback = orderLine.productionInfo || {}
  const productionLineInfo = {
    id: detail.orderLineId || orderLine.id,
    goodsNo: row.goodsNo,
    sourceProductCode: row.sourceProductCode,
    selectedSpecValue: orderLine.selectedSpecValue,
    quantity: orderLine.quantity,
    selectedMaterial: orderLine.selectedMaterial,
    selectedProcess: orderLine.selectedProcess,
    selectedSpecialOptions: orderLine.selectedSpecialOptions,
    selectedSpecSnapshot: orderLine.selectedSpecSnapshot,
    actualRequirements: orderLine.actualRequirements
  }

  const updateProductionFeedback = (nextFeedback: ProductionFeedbackValue) => {
    if (detail.orderLineId) {
      appData.updateOrderLineProductionInfo(detail.orderLineId, nextFeedback)
    }
  }

  const updateTaskStatus = (status: typeof task.status) => {
    appData.updateTask(task.id, (current) => ({
      ...current,
      status,
      updatedBy: '当前用户'
    }))
  }

  const handleReceiveTask = () => {
    updateTaskStatus('in_progress')
  }

  const handleStartProduction = () => {
    updateProductionFeedback({
      ...productionFeedback,
      factoryStatus: 'in_progress'
    })
  }

  const handleMarkPendingReport = () => {
    updateProductionFeedback({
      ...productionFeedback,
      factoryStatus: 'pending_feedback'
    })
    updateTaskStatus('pending_confirm')
  }

  const handleSubmitReport = () => {
    updateProductionFeedback({
      ...productionFeedback,
      factoryStatus: 'completed'
    })
    updateTaskStatus('done')
  }

  const handleMarkIssue = () => {
    updateProductionFeedback({
      ...productionFeedback,
      factoryStatus: 'issue'
    })
  }

  return (
    <PageContainer>
      <AppBreadcrumb items={[{ label: '生产计划', to: '/production-plan' }, { label: '货号详情' }, { label: row.goodsNo }]} />
      <PageHeader
        title="货号详情"
        actions={
          <>
            <button className="button secondary" onClick={() => navigate('/production-plan')}>
              返回列表
            </button>
            <button className="button secondary" onClick={() => navigate(`/tasks/${task.id}`)}>
              查看原任务
            </button>
            <button className="button secondary" onClick={() => navigate('/order-lines')}>
              查看销售
            </button>
            {row.purchaseId ? (
              <button className="button secondary" onClick={() => navigate(`/purchases/${row.purchaseId}`)}>
                查看购买记录
              </button>
            ) : null}
          </>
        }
      />
      <div className="stack production-plan-page-stack">
        <ProductionPlanSummaryCard
          row={row}
          taskId={task.id}
          taskTitle={task.title}
          sourceProductName={sourceProduct.name}
          sourceProductId={sourceProduct.id}
          factoryStatus={productionFeedback.factoryStatus}
        />
        <div className="production-plan-detail-grid">
          <div className="production-plan-detail-main stack">
            <SectionCard title="生产参数" className="production-plan-section">
              <ProductionOrderLineInfoBlock line={productionLineInfo} showEngravingFiles={false} />
            </SectionCard>
            <SectionCard title="文件与刻字资料" className="production-plan-section">
              <div className="stack">
                {referenceImages.length > 0 ? <ImageGallery images={referenceImages} /> : <div className="text-muted">暂无参考图片。</div>}
                {fileGroups.length > 0 ? (
                  fileGroups.map((group) => <FileList key={group.title} title={group.title} files={group.files} />)
                ) : (
                  <div className="text-muted">当前没有可展示的生产文件或刻字资料。</div>
                )}
              </div>
            </SectionCard>
          </div>
          <div className="production-plan-detail-side stack">
            <SectionCard title="生产反馈与回传" className="production-plan-section">
              <div className="stack">
                <InfoGrid columns={2}>
                  <InfoField label="当前显示状态" value={<ProductionPlanStatusBadge stage={row.stage} />} />
                  <InfoField label="工厂状态" value={getProductionFeedbackStatusLabel(productionFeedback.factoryStatus)} />
                  <InfoField label="回传重量" value={productionFeedback.totalWeight || '—'} />
                  <InfoField label="质检结论" value={productionFeedback.qualityResult || '—'} />
                </InfoGrid>
                <ProductionFeedbackBlock orderLineId={detail.orderLineId || orderLine.id} feedback={productionFeedback} onChange={updateProductionFeedback} />
              </div>
            </SectionCard>
            <SectionCard title="状态操作" className="production-plan-section production-plan-action-card">
              <div className="row wrap production-plan-action-row">
                {row.stage === 'pending_receive' ? (
                  <button type="button" className="button primary" onClick={handleReceiveTask}>
                    接收任务
                  </button>
                ) : null}
                {row.stage === 'ready_to_produce' ? (
                  <button type="button" className="button primary" onClick={handleStartProduction}>
                    开始生产
                  </button>
                ) : null}
                {row.stage === 'in_production' ? (
                  <button type="button" className="button primary" onClick={handleMarkPendingReport}>
                    标记待回传
                  </button>
                ) : null}
                {row.stage === 'pending_report' ? (
                  <button type="button" className="button primary" onClick={handleSubmitReport}>
                    提交回传
                  </button>
                ) : null}
                {row.stage !== 'reported' ? (
                  <button type="button" className="button secondary" onClick={handleMarkIssue}>
                    异常反馈
                  </button>
                ) : null}
              </div>
            </SectionCard>
          </div>
        </div>
        <SectionCard title="时间线" className="production-plan-section">
          {timeline.length > 0 ? (
            <RecordTimeline
              items={timeline.map((record) => ({
                id: record.id,
                title: record.title,
                meta: <span className="text-caption">{record.createdAt}</span>,
                description: record.description,
                extra: <span className="text-caption">处理人：{record.actorName}</span>
              }))}
            />
          ) : (
            <EmptyState title="当前还没有相关时间线" description="后续工厂状态变化、任务完成或销售变更后，会继续沉淀到这里。" />
          )}
        </SectionCard>
      </div>
    </PageContainer>
  )
}
