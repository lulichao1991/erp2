import { describe, expect, it } from 'vitest'
import interfaceReadinessDocs from '../../../docs/frontend/interface-readiness.md?raw'
import orderLineTypesSource from '../../types/order-line.ts?raw'

const runtimeSourceModules = import.meta.glob('../../**/*.{ts,tsx}', {
  eager: true,
  import: 'default',
  query: '?raw'
})

const legacyRuntimePatterns = [
  { label: 'legacy /orders route', pattern: /['"`]\/orders(?:\/|['"`])/ },
  { label: 'legacy OrderItem model', pattern: /\bOrderItem\b/ },
  { label: 'legacy TransactionRecord model', pattern: /\bTransactionRecord\b/ },
  { label: 'removed designInfo.designStatus field', pattern: /\bdesignInfo\.designStatus\b/ },
  { label: 'removed productionInfo.factoryStatus field', pattern: /\bproductionInfo\.factoryStatus\b/ }
]

const runtimeSourceEntries = () =>
  Object.entries(runtimeSourceModules)
    .map(([path, source]) => ({
      path: path.replace('../../', 'src/').replace('../', 'src/services/'),
      source: String(source)
    }))
    .filter(({ path }) => !path.endsWith('.test.ts') && !path.endsWith('.test.tsx'))

const getRuntimeSource = (path: string) => runtimeSourceEntries().find((entry) => entry.path === path)?.source || ''

const getExportBlock = (source: string, helperName: string) => {
  const exportStart = source.indexOf(`export const ${helperName}`)

  if (exportStart < 0) {
    return ''
  }

  const nextExportStart = source.indexOf('\nexport const ', exportStart + 1)
  return source.slice(exportStart, nextExportStart < 0 ? source.length : nextExportStart)
}

describe('current workflow guards', () => {
  it('keeps legacy order runtime concepts out of source files', () => {
    const violations = runtimeSourceEntries().flatMap(({ path, source }) =>
      legacyRuntimePatterns
        .filter(({ pattern }) => pattern.test(source))
        .map(({ label }) => `${path}: ${label}`)
    )

    expect(violations).toEqual([])
  })

  it('keeps OrderLine workflow status on lineStatus instead of restoring status', () => {
    const orderLineBlock = orderLineTypesSource.match(/export type OrderLine = \{[\s\S]*?\n\}/)?.[0]

    expect(orderLineBlock).toBeTruthy()
    expect(orderLineBlock).not.toMatch(/^\s+status\?:/m)
    expect(orderLineBlock).toMatch(/^\s+lineStatus\?:/m)
  })

  it('keeps core OrderLine workflow status fields as frozen unions', () => {
    const orderLineBlock = orderLineTypesSource.match(/export type OrderLine = \{[\s\S]*?\n\}/)?.[0]
    const productionInfoBlock = orderLineTypesSource.match(/export type OrderLineProductionInfo = \{[\s\S]*?\n\}/)?.[0]
    const outsourceInfoBlock = orderLineTypesSource.match(/export type OrderLineOutsourceInfo = \{[\s\S]*?\n\}/)?.[0]
    const frozenStatusFields = [
      ['lineStatus', 'OrderLineLineStatus'],
      ['designStatus', 'OrderLineWorkflowDesignStatus'],
      ['modelingStatus', 'OrderLineWorkflowModelingStatus'],
      ['productionStatus', 'OrderLineWorkflowProductionStatus'],
      ['factoryStatus', 'OrderLineFactoryStatus'],
      ['financeStatus', 'OrderLineFinanceStatus']
    ]

    expect(orderLineBlock).toBeTruthy()
    frozenStatusFields.forEach(([field, typeName]) => {
      expect(orderLineBlock).toMatch(new RegExp(`^\\s+${field}\\?: ${typeName}$`, 'm'))
      expect(orderLineBlock).not.toMatch(new RegExp(`^\\s+${field}\\?: .*\\|\\s*string`, 'm'))
    })

    expect(productionInfoBlock).toMatch(/^\s+feedbackStatus\?: OrderLineProductionFeedbackStatus$/m)
    expect(productionInfoBlock).not.toMatch(/^\s+feedbackStatus\?: .*\|\s*string/m)
    expect(outsourceInfoBlock).toMatch(/^\s+outsourceStatus\?: OrderLineOutsourceStatus$/m)
    expect(outsourceInfoBlock).not.toMatch(/^\s+outsourceStatus\?: .*\|\s*string/m)
  })

  it('keeps buildOrderLineStatusPatch out of business action surfaces', () => {
    const allowedManualDebugEntrypoints = new Set(['src/hooks/useOrderLineWorkspaceState.ts'])
    const checkedRuntimePrefixes = ['src/pages/', 'src/components/', 'src/hooks/', 'src/services/orderLine/']
    const violations = runtimeSourceEntries()
      .filter(({ path }) => checkedRuntimePrefixes.some((prefix) => path.startsWith(prefix)))
      .filter(({ source }) => /buildOrderLineStatusPatch\s*\(/.test(source))
      .filter(({ path, source }) => !(allowedManualDebugEntrypoints.has(path) && source.includes('manual-status-demo-only')))
      .map(({ path }) => path)

    expect(violations).toEqual([])
  })

  it('keeps task updates as sidecar collaboration records', () => {
    const appDataSource = getRuntimeSource('src/hooks/useAppData.tsx')
    const updateTaskBlock = appDataSource.match(/updateTask: \(taskId, updater\) => \{[\s\S]*?\n      \}/)?.[0]

    expect(updateTaskBlock).toBeTruthy()
    expect(updateTaskBlock).not.toMatch(/\bsetOrderLines\b/)
    expect(updateTaskBlock).not.toMatch(/\bupdateOrderLine\b/)
    expect(updateTaskBlock).not.toMatch(/\blineStatus\b/)
  })

  it('keeps sidecar helpers from returning OrderLine workflow mutations', () => {
    const workspaceSource = getRuntimeSource('src/services/orderLine/orderLineWorkspace.ts')
    const inventorySource = getRuntimeSource('src/services/inventory/inventorySelectors.ts')
    const workspaceSidecarHelperNames = [
      'addLogisticsRecord',
      'updateLogisticsRecordInList',
      'voidLogisticsRecordInList',
      'addAfterSalesCase',
      'updateAfterSalesCaseInList',
      'closeAfterSalesCaseInList'
    ]
    const inventorySidecarHelperNames = [
      'applyInventoryMovement',
      'applyInventoryReview',
      'applyInventoryStocktake'
    ]

    ;[...workspaceSidecarHelperNames, ...inventorySidecarHelperNames].forEach((helperName) => {
      expect(workspaceSource + inventorySource).not.toMatch(new RegExp(`export const ${helperName}[^\\n]*: OrderLine\\b`))
    })

    workspaceSidecarHelperNames.forEach((helperName) => {
      const helperBlock = getExportBlock(workspaceSource, helperName)

      expect(helperBlock).toBeTruthy()
      expect(helperBlock).not.toMatch(/\blineStatus\b/)
      expect(helperBlock).not.toMatch(/\bproductionStatus\b/)
      expect(helperBlock).not.toMatch(/\bfactoryStatus\b/)
      expect(helperBlock).not.toMatch(/\bfinanceStatus\b/)
      expect(helperBlock).not.toMatch(/\bready_to_ship\b/)
      expect(helperBlock).not.toMatch(/\bcompleted\b/)
    })

    inventorySidecarHelperNames.forEach((helperName) => {
      const helperBlock = getExportBlock(inventorySource, helperName)

      expect(helperBlock).toBeTruthy()
      expect(helperBlock).not.toMatch(/\blineStatus\b/)
      expect(helperBlock).not.toMatch(/\bproductionStatus\b/)
      expect(helperBlock).not.toMatch(/\bfactoryStatus\b/)
      expect(helperBlock).not.toMatch(/\bfinanceStatus\b/)
      expect(helperBlock).not.toMatch(/\bready_to_ship\b/)
      expect(helperBlock).not.toMatch(/\bcompleted\b/)
    })
  })

  it('keeps future interface contracts from allowing legacy workflow re-entry', () => {
    const disallowedContractPhrases = [
      '允许恢复 `/orders`',
      '可以恢复 `/orders`',
      '允许恢复 `OrderLine.status`',
      '可以恢复 `OrderLine.status`',
      '允许恢复 `productionInfo.factoryStatus`',
      '可以恢复 `productionInfo.factoryStatus`',
      'buildOrderLineStatusPatch` 属于 future command contract'
    ]

    disallowedContractPhrases.forEach((phrase) => {
      expect(interfaceReadinessDocs).not.toContain(phrase)
    })

    expect(interfaceReadinessDocs).toContain('真实接口接入前，后端字段必须先映射到 current model')
    expect(interfaceReadinessDocs).toContain('页面或接口层不得重新手拼 `lineStatus`')
    expect(interfaceReadinessDocs).toContain('buildOrderLineStatusPatch` 不属于 future command contract')
    expect(interfaceReadinessDocs).toContain('物流、售后、库存和任务是旁路记录契约')
  })
})
