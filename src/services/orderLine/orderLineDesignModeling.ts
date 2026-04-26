import {
  designWorkflowStatusLabelMap,
  getOrderLineDesignStatus,
  getOrderLineLineStatus,
  getOrderLineModelingStatus,
  modelingWorkflowStatusLabelMap
} from '@/services/orderLine/orderLineWorkflow'
import type { OrderLine } from '@/types/order-line'

export type DesignModelingTab = 'pending_design' | 'designing' | 'pending_modeling' | 'modeling' | 'revision' | 'completed'

export type DesignModelingRow = {
  line: OrderLine
  designStatusLabel: string
  modelingStatusLabel: string
  fileCount: number
}

export const designModelingTabs: Array<{ value: DesignModelingTab; label: string }> = [
  { value: 'pending_design', label: '待设计' },
  { value: 'designing', label: '设计中' },
  { value: 'pending_modeling', label: '待建模' },
  { value: 'modeling', label: '建模中' },
  { value: 'revision', label: '待修改' },
  { value: 'completed', label: '已完成' }
]

export const isDesignModelingLine = (line: OrderLine) =>
  Boolean(line.requiresDesign || line.requiresModeling || line.requiresWax || getOrderLineDesignStatus(line) === 'revision_requested' || getOrderLineModelingStatus(line) === 'revision_requested')

export const buildDesignModelingRows = (orderLines: OrderLine[]): DesignModelingRow[] =>
  orderLines.filter(isDesignModelingLine).map((line) => {
    const designStatus = getOrderLineDesignStatus(line)
    const modelingStatus = getOrderLineModelingStatus(line)

    return {
      line,
      designStatusLabel: designWorkflowStatusLabelMap[designStatus],
      modelingStatusLabel: modelingWorkflowStatusLabelMap[modelingStatus],
      fileCount: (line.designFiles?.length ?? 0) + (line.modelingFiles?.length ?? 0) + (line.waxFiles?.length ?? 0)
    }
  })

export const filterDesignModelingRowsByTab = (rows: DesignModelingRow[], tab: DesignModelingTab) =>
  rows.filter(({ line }) => {
    const designStatus = getOrderLineDesignStatus(line)
    const modelingStatus = getOrderLineModelingStatus(line)
    const lineStatus = getOrderLineLineStatus(line)

    switch (tab) {
      case 'pending_design':
        return Boolean(line.requiresDesign) && (designStatus === 'pending' || lineStatus === 'pending_design')
      case 'designing':
        return designStatus === 'in_progress'
      case 'pending_modeling':
        return Boolean(line.requiresModeling) && (modelingStatus === 'pending' || lineStatus === 'pending_modeling')
      case 'modeling':
        return modelingStatus === 'in_progress'
      case 'revision':
        return designStatus === 'revision_requested' || modelingStatus === 'revision_requested'
      case 'completed':
        return (
          (!line.requiresDesign || designStatus === 'completed') &&
          (!line.requiresModeling || modelingStatus === 'completed') &&
          (line.requiresDesign || line.requiresModeling || line.requiresWax)
        )
      default:
        return false
    }
  })
