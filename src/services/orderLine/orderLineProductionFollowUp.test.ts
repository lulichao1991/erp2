import { describe, expect, it } from 'vitest'
import { orderLinesMock } from '@/mocks/order-lines'
import { purchasesMock } from '@/mocks/purchases'
import { buildProductionCompletionReviewChecks, buildProductionFollowUpRows, filterProductionFollowUpRowsByTab } from '@/services/orderLine/orderLineProductionFollowUp'
import { approveFactoryReturn, approveProductionReview, dispatchToFactory, returnFactoryFeedback, startFactoryProduction, submitFactoryReturn } from '@/services/orderLine/orderLineWorkflow'

describe('orderLineProductionFollowUp', () => {
  const rows = buildProductionFollowUpRows(orderLinesMock, purchasesMock)

  it('builds follow-up rows from current order lines and purchases', () => {
    expect(rows.some((row) => row.line.id === 'ol-zhang-earring-review-001' && row.purchaseNo === 'PUR-202604-001')).toBe(true)
    expect(rows.some((row) => row.line.id === 'oi-ring-001' && row.productionStatusLabel === '生产中')).toBe(true)
    expect(rows.some((row) => row.line.id === 'ol-zhang-completion-review-001' && row.completionReviewSeverity === 'pass')).toBe(true)
  })

  it('filters rows by merchandiser review, dispatch, producing, completion review and risk tabs', () => {
    expect(filterProductionFollowUpRowsByTab(rows, 'review').map((row) => row.line.id)).toContain('ol-zhang-earring-review-001')
    expect(filterProductionFollowUpRowsByTab(rows, 'dispatch').map((row) => row.line.id)).toContain('ol-zhang-brooch-blocked-001')
    expect(filterProductionFollowUpRowsByTab(rows, 'producing').map((row) => row.line.id)).toContain('oi-ring-001')
    expect(filterProductionFollowUpRowsByTab(rows, 'completion_review').map((row) => row.line.id)).toEqual(['ol-zhang-completion-review-001'])
    expect(filterProductionFollowUpRowsByTab(rows, 'risk').map((row) => row.line.id)).toContain('ol-zhang-brooch-blocked-001')
  })

  it('builds completion review checks from factory returned data', () => {
    const line = orderLinesMock.find((item) => item.id === 'ol-zhang-completion-review-001')!
    const checks = buildProductionCompletionReviewChecks(line)

    expect(checks.find((check) => check.key === 'material')).toMatchObject({
      actual: '18K金',
      severity: 'pass'
    })
    expect(checks.find((check) => check.key === 'net_weight')).toMatchObject({
      expected: '5.6g',
      actual: '5.6g',
      severity: 'pass'
    })
  })

  it('keeps v2 production workflow rows in the expected queues', () => {
    const baseLine = {
      ...orderLinesMock.find((item) => item.id === 'ol-zhang-earring-review-001')!,
      lineStatus: 'pending_merchandiser_review' as const,
      productionStatus: 'not_started' as const,
      factoryStatus: 'not_assigned' as const
    }
    const reviewed = approveProductionReview(baseLine)
    const dispatched = dispatchToFactory(reviewed)
    const producing = startFactoryProduction(dispatched)
    const returned = submitFactoryReturn(producing)
    const financePending = approveFactoryReturn(returned)
    const rejected = returnFactoryFeedback(returned)

    const workflowRows = buildProductionFollowUpRows([baseLine, reviewed, dispatched, producing, returned, financePending, rejected], purchasesMock)

    expect(filterProductionFollowUpRowsByTab(workflowRows, 'review').map((row) => row.line)).toContain(baseLine)
    expect(filterProductionFollowUpRowsByTab(workflowRows, 'dispatch').map((row) => row.line)).toEqual(expect.arrayContaining([reviewed, dispatched]))
    expect(filterProductionFollowUpRowsByTab(workflowRows, 'producing').map((row) => row.line)).toContain(producing)
    expect(filterProductionFollowUpRowsByTab(workflowRows, 'completion_review').map((row) => row.line)).toContain(returned)
    expect(filterProductionFollowUpRowsByTab(workflowRows, 'risk').map((row) => row.line)).toContain(rejected)
    expect(workflowRows.find((row) => row.line === dispatched)?.factoryStatusLabel).toBe('待工厂接收')
    expect(workflowRows.some((row) => row.line === financePending)).toBe(false)
  })
})
