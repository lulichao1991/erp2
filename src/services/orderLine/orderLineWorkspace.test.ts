import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import {
  addAfterSalesCase,
  addLogisticsRecord,
  applyOrderLineDesignModelingDraft,
  applyOrderLineProductionDraft,
  buildOrderLineAfterSalesCase,
  buildOrderLineLogisticsRecord,
  buildOrderLineRowsFromData,
  closeAfterSalesCaseInList,
  getOrderLineActiveAfterSalesSummary,
  getOrderLineActiveAfterSalesCases,
  getOrderLineAfterSalesCases,
  getOrderLineLogisticsRecords,
  updateAfterSalesCaseInList,
  updateLogisticsRecordInList,
  voidLogisticsRecordInList
} from '@/services/orderLine/orderLineWorkspace'

describe('orderLineWorkspace', () => {
  it('builds rows from current order lines instead of embedded purchase copies', () => {
    const currentLines = orderLinesMock.map((line) =>
      line.id === 'oi-ring-001'
        ? {
            ...line,
            productionInfo: {
              ...line.productionInfo,
              factoryNote: 'current app data note'
            }
          }
        : line
    )

    const rows = buildOrderLineRowsFromData(currentLines, purchasesMock)
    const ringRow = rows.find((row) => row.line.id === 'oi-ring-001')

    expect(ringRow?.line.productionInfo?.factoryNote).toBe('current app data note')
    expect(ringRow?.purchase?.purchaseNo).toBe('PUR-202604-001')
  })

  it('keeps customization fields untouched when saving design-modeling draft', () => {
    const line = orderLinesMock.find((item) => item.id === 'oi-ring-001')
    expect(line).toBeTruthy()

    const nextLine = applyOrderLineDesignModelingDraft(line!, {
      designStatus: 'revision_requested',
      modelingStatus: 'completed',
      assignedDesignerId: 'designer-new',
      assignedModelerId: 'modeler-new',
      assignedDesignerName: '新设计',
      modelingFiles: [{ id: 'model-file-1', name: 'ring-model.stl', url: 'mock-upload:ring-model.stl' }],
      waxFiles: [{ id: 'wax-file-1', name: 'ring-wax.stl', url: 'mock-upload:ring-wax.stl' }],
      designNote: '仅更新设计建模信息'
    })

    expect(nextLine.selectedSpecValue).toBe(line!.selectedSpecValue)
    expect(nextLine.selectedMaterial).toBe(line!.selectedMaterial)
    expect(nextLine.selectedProcess).toBe(line!.selectedProcess)
    expect(nextLine.actualRequirements?.remark).toBe(line!.actualRequirements?.remark)
    expect(nextLine.designStatus).toBe('revision_requested')
    expect(nextLine.modelingFiles?.[0]?.name).toBe('ring-model.stl')
  })

  it('keeps completed factory feedback in merchandiser completion review before finance', () => {
    const line = orderLinesMock.find((item) => item.id === 'oi-ring-001')
    expect(line).toBeTruthy()

    const nextLine = applyOrderLineProductionDraft(line!, {
      feedbackStatus: 'completed',
      actualMaterial: '18K金',
      totalWeight: '5.6g',
      netWeight: '5.1g',
      mainStoneInfo: '',
      sideStoneInfo: '',
      laborCostDetail: '工费 680',
      factoryShippedAt: '2026-05-07',
      qualityResult: '通过',
      factoryNote: '戒指工厂回传完成'
    })

    expect(nextLine.lineStatus).toBe('factory_returned')
    expect(nextLine.factoryStatus).toBe('returned')
    expect(nextLine.productionStatus).toBe('completed')
    expect(nextLine.financeStatus).toBe('not_required')
  })

  it('keeps logistics helpers scoped to the current order line without changing workflow status', () => {
    const line = orderLinesMock.find((item) => item.id === 'oi-ring-001')
    const siblingLine = orderLinesMock.find((item) => item.id === 'oi-pendant-001')
    const purchase = purchasesMock.find((item) => item.id === line?.purchaseId)
    expect(line).toBeTruthy()
    expect(siblingLine).toBeTruthy()
    const originalLineStatus = line!.lineStatus
    const originalSiblingLineStatus = siblingLine!.lineStatus

    const record = buildOrderLineLogisticsRecord({
      line: line!,
      purchase,
      draft: {
        logisticsType: 'goods',
        direction: 'outbound',
        company: '顺丰',
        trackingNo: 'SF-V26-001',
        shippedAt: '2026-05-06 10:00',
        signedAt: '',
        remark: '单件销售发货'
      }
    })
    const records = addLogisticsRecord([], record)
    const editedRecords = updateLogisticsRecordInList(records, record.id, {
      logisticsType: 'goods',
      direction: 'outbound',
      company: '顺丰速运',
      trackingNo: 'SF-V26-001',
      shippedAt: '2026-05-06 10:00',
      signedAt: '2026-05-07 12:00',
      remark: '只更新物流记录'
    })
    const voidedRecords = voidLogisticsRecordInList(editedRecords, record.id, '测试作废', '2026-05-08 09:00')

    expect(record.orderLineId).toBe(line!.id)
    expect(getOrderLineLogisticsRecords(voidedRecords, line!.id)).toHaveLength(1)
    expect(getOrderLineLogisticsRecords(voidedRecords, siblingLine!.id)).toHaveLength(0)
    expect(voidedRecords[0]).toMatchObject({
      recordStatus: 'voided',
      voidReason: '测试作废',
      voidedAt: '2026-05-08 09:00'
    })
    expect(line!.lineStatus).toBe(originalLineStatus)
    expect(siblingLine!.lineStatus).toBe(originalSiblingLineStatus)
  })

  it('keeps after-sales helpers scoped to records and summarizes only active cases for the current line', () => {
    const line = orderLinesMock.find((item) => item.id === 'oi-ring-001')
    const siblingLine = orderLinesMock.find((item) => item.id === 'oi-pendant-001')
    const purchase = purchasesMock.find((item) => item.id === line?.purchaseId)
    expect(line).toBeTruthy()
    expect(siblingLine).toBeTruthy()
    const workflowSnapshot = {
      lineStatus: line!.lineStatus,
      productionStatus: line!.productionStatus,
      factoryStatus: line!.factoryStatus,
      financeStatus: line!.financeStatus
    }

    const record = buildOrderLineAfterSalesCase({
      line: line!,
      purchase,
      draft: {
        type: 'repair',
        reason: '戒圈轻微划痕',
        status: 'open',
        responsibleParty: '王客服',
        createdAt: '2026-05-06 09:00',
        closedAt: '',
        remark: '仅记录售后'
      }
    })
    const siblingRecord = buildOrderLineAfterSalesCase({
      line: siblingLine!,
      purchase,
      draft: {
        type: 'resize',
        reason: '调整尺寸',
        status: 'processing',
        responsibleParty: '王客服',
        createdAt: '2026-05-06 10:00',
        closedAt: '',
        remark: ''
      }
    })
    const records = addAfterSalesCase(addAfterSalesCase([], siblingRecord), record)
    const editedRecords = updateAfterSalesCaseInList(records, record.id, {
      type: 'repair',
      reason: '戒圈轻微划痕复核',
      status: 'processing',
      responsibleParty: '王客服',
      createdAt: '2026-05-06 09:00',
      closedAt: '',
      remark: '仍不推进主流程'
    })
    const activeSummary = getOrderLineActiveAfterSalesSummary(editedRecords, line!.id)
    const closedRecords = closeAfterSalesCaseInList(editedRecords, record.id, '2026-05-08 18:00')

    expect(getOrderLineAfterSalesCases(closedRecords, line!.id)).toHaveLength(1)
    expect(getOrderLineActiveAfterSalesCases(editedRecords, line!.id).map((item) => item.id)).toEqual([record.id])
    expect(getOrderLineAfterSalesCases(closedRecords, siblingLine!.id)).toHaveLength(1)
    expect(activeSummary).toEqual({
      activeCount: 1,
      hasActiveAfterSales: true,
      latestReason: '戒圈轻微划痕复核'
    })
    expect(getOrderLineActiveAfterSalesSummary(closedRecords, line!.id)).toMatchObject({
      activeCount: 0,
      hasActiveAfterSales: false
    })
    expect({
      lineStatus: line!.lineStatus,
      productionStatus: line!.productionStatus,
      factoryStatus: line!.factoryStatus,
      financeStatus: line!.financeStatus
    }).toEqual(workflowSnapshot)
  })

  it('does not complete a ready-to-ship line through logistics or after-sales sidecar records', () => {
    const line = {
      ...orderLinesMock.find((item) => item.id === 'oi-pendant-001')!,
      lineStatus: 'ready_to_ship' as const
    }
    const logisticsRecord = buildOrderLineLogisticsRecord({
      line,
      purchase: purchasesMock.find((item) => item.id === line.purchaseId),
      draft: {
        logisticsType: 'goods',
        direction: 'outbound',
        company: '顺丰',
        trackingNo: 'SF-READY-001',
        shippedAt: '2026-05-06 10:00',
        signedAt: '2026-05-07 12:00',
        remark: '发货记录不完成销售'
      }
    })
    const afterSalesCase = buildOrderLineAfterSalesCase({
      line,
      purchase: purchasesMock.find((item) => item.id === line.purchaseId),
      draft: {
        type: 'repair',
        reason: '旁路售后记录',
        status: 'closed',
        responsibleParty: '王客服',
        createdAt: '2026-05-06 09:00',
        closedAt: '2026-05-06 18:00',
        remark: ''
      }
    })

    expect(addLogisticsRecord([], logisticsRecord)[0].orderLineId).toBe(line.id)
    expect(addAfterSalesCase([], afterSalesCase)[0].orderLineId).toBe(line.id)
    expect(voidLogisticsRecordInList([logisticsRecord], logisticsRecord.id, '作废物流')[0].recordStatus).toBe('voided')
    expect(closeAfterSalesCaseInList([afterSalesCase], afterSalesCase.id)[0].status).toBe('closed')
    expect(line.lineStatus).toBe('ready_to_ship')
  })
})
