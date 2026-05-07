import { Link } from 'react-router-dom'
import { EmptyState, StatusTag } from '@/components/common'
import {
  buildInventoryLocationSummaries,
  buildInventoryOrderLineMovementSummary,
  getInventoryReservedQuantity,
  getInventoryWorkbenchBadges,
  inventoryConditionLabelMap,
  inventoryMovementTypeLabelMap,
  inventorySourceTypeLabelMap,
  inventoryStatusLabelMap,
  type InventoryRow
} from '@/services/inventory/inventorySelectors'
import { getOrderLineGoodsNo } from '@/services/orderLine/orderLineIdentity'
import { getOrderLineDetailPath } from '@/services/orderLine/orderLineRoutes'
import type { InventoryBatch, InventoryMovement } from '@/types/inventory'
import type { OrderLine } from '@/types/order-line'

const categoryLabelMap: Record<string, string> = {
  ring: '戒指',
  pendant: '吊坠',
  necklace: '项链',
  earring: '耳饰',
  bracelet: '手链',
  other: '其他'
}

const formatWeight = (weight?: number) => (typeof weight === 'number' ? `${weight}g` : '待补充')
const formatCurrency = (value?: number) => `¥${Math.round(value ?? 0).toLocaleString('zh-CN')}`
const formatOrderLineOption = (line: OrderLine) => [getOrderLineGoodsNo(line), line.name].filter(Boolean).join(' / ')

const getOrderLineDisplay = (orderLines: OrderLine[], orderLineId?: string) => {
  const line = orderLines.find((candidate) => candidate.id === orderLineId)
  return line ? formatOrderLineOption(line) : orderLineId
}

export const InventoryLocationSummaryTable = ({ summaries }: { summaries: ReturnType<typeof buildInventoryLocationSummaries> }) => (
  <div className="table-wrap">
    <table className="data-table">
      <thead>
        <tr>
          <th>库位</th>
          <th>库存款数</th>
          <th>总数</th>
          <th>可用</th>
          <th>已占用</th>
          <th>待质检</th>
        </tr>
      </thead>
      <tbody>
        {summaries.map((summary) => (
          <tr key={summary.location}>
            <td>
              <strong>{summary.location}</strong>
            </td>
            <td>{summary.skuCount}</td>
            <td>{summary.totalQuantity}</td>
            <td>{summary.availableQuantity}</td>
            <td>{summary.reservedQuantity}</td>
            <td>{summary.needsReviewCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const InventoryTable = ({ rows, selectedId, onSelect }: { rows: InventoryRow[]; selectedId?: string; onSelect: (id: string) => void }) => (
  <div className="table-wrap">
    <table className="data-table">
      <thead>
        <tr>
          <th>库存商品</th>
          <th>来源 / 关联</th>
          <th>规格与数量</th>
          <th>库位</th>
          <th>状态</th>
          <th>入库信息</th>
          <th>备注</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.item.id} className={selectedId === row.item.id ? 'selected-row' : undefined}>
            <td>
              <strong>{row.item.inventoryCode}</strong>
              <span className="muted-block">{row.item.name}</span>
              <span className="muted-block">{categoryLabelMap[row.item.category || 'other'] || row.item.category || '其他'}</span>
            </td>
            <td>
              <StatusTag value={row.sourceLabel} />
              <span className="muted-block">{row.linkedSummary}</span>
              <InventoryLinks row={row} />
            </td>
            <td>
              <strong>{row.item.quantity} 件</strong>
              <span className="muted-block">可用 {row.item.availableQuantity} 件</span>
              <span className="muted-block">已占用 {getInventoryReservedQuantity(row.item)} 件</span>
              <span className="muted-block">
                {[row.item.material, row.item.size, formatWeight(row.item.weight)].filter(Boolean).join(' / ')}
              </span>
              {typeof row.item.valuationAmount === 'number' ? <span className="muted-block">估值 ¥{Math.round(row.item.valuationAmount).toLocaleString('zh-CN')}</span> : null}
              <span className="muted-block">{row.item.craftRequirements || '工艺待补充'}</span>
            </td>
            <td>{row.item.warehouseLocation}</td>
            <td>
              <div className="tag-list">
                <StatusTag value={inventoryStatusLabelMap[row.item.status]} />
                <StatusTag value={inventoryConditionLabelMap[row.item.condition]} />
                <StatusTag value={inventorySourceTypeLabelMap[row.item.sourceType]} />
                {getInventoryWorkbenchBadges(row).map((badge) => (
                  <StatusTag key={badge} value={badge} />
                ))}
              </div>
            </td>
            <td>
              <strong>{row.item.receivedAt}</strong>
              <span className="muted-block">库管：{row.item.keeperName}</span>
            </td>
            <td>{row.item.remark || '无'}</td>
            <td>
              <button type="button" className="button ghost small" onClick={() => onSelect(row.item.id)}>
                查看详情
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const InventoryDetail = ({ row, movements, batches, orderLines }: { row: InventoryRow; movements: InventoryMovement[]; batches: InventoryBatch[]; orderLines: OrderLine[] }) => (
  <div className="stack">
    <div className="info-grid">
      <div>
        <span className="info-label">库存编号</span>
        <strong>{row.item.inventoryCode}</strong>
      </div>
      <div>
        <span className="info-label">库存商品</span>
        <strong>{row.item.name}</strong>
      </div>
      <div>
        <span className="info-label">来源类型</span>
        <StatusTag value={row.sourceLabel} />
      </div>
      <div>
        <span className="info-label">状态</span>
        <StatusTag value={row.statusLabel} />
      </div>
      <div>
        <span className="info-label">成色</span>
        <StatusTag value={row.conditionLabel} />
      </div>
      <div>
        <span className="info-label">数量</span>
        <strong>
          总数 {row.item.quantity} / 可用 {row.item.availableQuantity} / 已占用 {getInventoryReservedQuantity(row.item)}
        </strong>
      </div>
      <div>
        <span className="info-label">库位</span>
        <strong>{row.item.warehouseLocation}</strong>
      </div>
      <div>
        <span className="info-label">入库时间</span>
        <strong>{row.item.receivedAt}</strong>
      </div>
      {typeof row.item.valuationAmount === 'number' ? (
        <div>
          <span className="info-label">财务估值</span>
          <strong>¥{Math.round(row.item.valuationAmount).toLocaleString('zh-CN')}</strong>
        </div>
      ) : null}
      {row.item.sourcePaymentRecordId ? (
        <div>
          <span className="info-label">收款流水</span>
          <strong>{row.item.sourcePaymentRecordId}</strong>
        </div>
      ) : null}
    </div>

    <div className="subtle-panel">
      <strong>来源追溯</strong>
      <p className="text-muted">{row.linkedSummary}</p>
      <InventoryLinks row={row} />
    </div>

    <OrderLineMovementSummary movements={movements} orderLines={orderLines} />

    <div>
      <strong>FIFO 批次</strong>
      {batches.length > 0 ? <InventoryBatchTable batches={batches} /> : <EmptyState title="暂无 FIFO 批次" description="当前库存还没有可追溯批次。" />}
    </div>

    <div>
      <strong>该库存流转记录</strong>
      {movements.length > 0 ? <MovementTable movements={movements} orderLines={orderLines} /> : <EmptyState title="暂无流转记录" description="当前库存还没有单独的流转记录。" />}
    </div>
  </div>
)

const InventoryBatchTable = ({ batches }: { batches: InventoryBatch[] }) => (
  <div className="table-wrap">
    <table className="data-table">
      <thead>
        <tr>
          <th>批次</th>
          <th>入库时间</th>
          <th>数量</th>
          <th>剩余</th>
          <th>单位成本</th>
          <th>批次总成本</th>
        </tr>
      </thead>
      <tbody>
        {batches
          .slice()
          .sort((left, right) => left.receivedAt.localeCompare(right.receivedAt) || left.id.localeCompare(right.id))
          .map((batch) => (
            <tr key={batch.id}>
              <td>{batch.id}</td>
              <td>{batch.receivedAt}</td>
              <td>{batch.quantity}</td>
              <td>{batch.remainingQuantity}</td>
              <td>{formatCurrency(batch.unitCostAmount)}</td>
              <td>{formatCurrency(batch.totalCostAmount)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
)

const OrderLineMovementSummary = ({ movements, orderLines }: { movements: InventoryMovement[]; orderLines: OrderLine[] }) => {
  const summaries = buildInventoryOrderLineMovementSummary(movements, orderLines)

  if (summaries.length === 0) {
    return (
      <div className="subtle-panel">
        <strong>销售占用 / 出库追溯</strong>
        <p className="text-muted">当前库存还没有关联销售的占用、释放或出库记录。</p>
      </div>
    )
  }

  return (
    <div className="subtle-panel">
      <strong>销售占用 / 出库追溯</strong>
      <p className="text-muted">这里只做库存追溯，不改写销售状态。</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>关联销售</th>
              <th>占用</th>
              <th>释放</th>
              <th>出库</th>
              <th>FIFO成本</th>
              <th>最近流转</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary.orderLineId}>
                <td>
                  <strong>{summary.orderLineDisplay}</strong>
                  <span className="muted-block">{summary.movementCount} 条关联流水</span>
                </td>
                <td>{summary.reserveQuantity} 件</td>
                <td>{summary.releaseQuantity} 件</td>
                <td>{summary.outboundQuantity} 件</td>
                <td>{formatCurrency(summary.fifoCostAmount)}</td>
                <td>{summary.latestOccurredAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const InventoryLinks = ({ row }: { row: InventoryRow }) => (
  <div className="row wrap compact-row">
    {row.item.productId ? (
      <Link to={`/products/${row.item.productId}`} className="button ghost small" onClick={(event) => event.stopPropagation()}>
        查看款式模板
      </Link>
    ) : null}
    {row.item.purchaseId ? (
      <Link to={`/purchases/${row.item.purchaseId}`} className="button ghost small" onClick={(event) => event.stopPropagation()}>
        查看购买记录
      </Link>
    ) : null}
    {row.item.orderLineId ? (
      <Link to={getOrderLineDetailPath(row.item.orderLineId)} className="button ghost small" onClick={(event) => event.stopPropagation()}>
        查看销售中心
      </Link>
    ) : null}
    {row.item.customerId ? (
      <Link to={`/customers/${row.item.customerId}`} className="button ghost small" onClick={(event) => event.stopPropagation()}>
        查看客户详情
      </Link>
    ) : null}
  </div>
)

export const MovementTable = ({ movements, orderLines }: { movements: InventoryMovement[]; orderLines: OrderLine[] }) => (
  <div className="table-wrap">
    <table className="data-table">
      <thead>
        <tr>
          <th>时间</th>
          <th>库存编号</th>
          <th>类型</th>
          <th>数量</th>
          <th>状态 / 库位</th>
          <th>关联销售</th>
          <th>FIFO 成本</th>
          <th>操作人</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        {movements.map((movement) => (
          <tr key={movement.id}>
            <td>{movement.occurredAt}</td>
            <td>{movement.inventoryCode}</td>
            <td>
              <StatusTag value={inventoryMovementTypeLabelMap[movement.type]} />
            </td>
            <td>{movement.quantity}</td>
            <td>
              <span className="muted-block">
                {movement.fromStatus ? inventoryStatusLabelMap[movement.fromStatus] : '无'} → {movement.toStatus ? inventoryStatusLabelMap[movement.toStatus] : '无'}
              </span>
              <span className="muted-block">
                {movement.fromLocation || '无库位'} → {movement.toLocation || '无库位'}
              </span>
            </td>
            <td>
              {movement.relatedOrderLineId ? (
                <>
                  <strong>{getOrderLineDisplay(orderLines, movement.relatedOrderLineId)}</strong>
                  <span className="muted-block">库存追溯，不推进状态</span>
                </>
              ) : (
                '未关联'
              )}
            </td>
            <td>
              {movement.fifoCostAmount ? (
                <>
                  <strong>{formatCurrency(movement.fifoCostAmount)}</strong>
                  <span className="muted-block">
                    {movement.fifoLayers?.map((layer) => `${layer.batchId} ${layer.quantity}件×${formatCurrency(layer.unitCostAmount)}`).join(' / ') || '无批次'}
                  </span>
                </>
              ) : (
                '无'
              )}
            </td>
            <td>{movement.operatorName}</td>
            <td>{movement.note || '无'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)
