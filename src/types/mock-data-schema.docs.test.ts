import { describe, expect, it } from 'vitest'
import interfaceReadinessDocs from '../../docs/frontend/interface-readiness.md?raw'
import mockDataSchemaDocs from '../../docs/frontend/mock-data-schema.md?raw'

const typeFileModules = import.meta.glob('./*.ts', {
  eager: true,
  import: 'default',
  query: '?raw'
})

const documentedDomainTypes = [
  { file: 'customer.ts', sections: ['Customer'] },
  { file: 'purchase.ts', sections: ['Purchase'] },
  { file: 'finance.ts', sections: ['FinancePaymentRecord'] },
  { file: 'order-line.ts', sections: ['OrderLine'] },
  { file: 'product.ts', sections: ['Product', 'ProductSpecRow', 'ProductPriceRule', 'ProductSnapshot'] },
  { file: 'quote.ts', sections: ['QuoteResult'] },
  { file: 'inventory.ts', sections: ['InventoryItem', 'InventoryBatch'] },
  { file: 'supporting-records.ts', sections: ['LogisticsRecord', 'AfterSalesCase'] },
  { file: 'task.ts', sections: ['Task'] }
]

const supportTypeFilesWithoutSchemaSections = ['common.ts', 'productionPlan.ts']

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const extractRuntimeTypeFiles = () =>
  Object.keys(typeFileModules)
    .map((path) => path.replace('./', ''))
    .filter((file) => !file.endsWith('.test.ts'))
    .sort()

describe('mock data schema type documentation', () => {
  it('keeps current domain type files covered by mock-data-schema sections', () => {
    const runtimeTypeFiles = extractRuntimeTypeFiles()
    const expectedTypeFiles = [...documentedDomainTypes.map((typeDoc) => typeDoc.file), ...supportTypeFilesWithoutSchemaSections].sort()

    expect(runtimeTypeFiles).toEqual(expectedTypeFiles)

    documentedDomainTypes.forEach((typeDoc) => {
      typeDoc.sections.forEach((section) => {
        expect(mockDataSchemaDocs).toMatch(new RegExp(`^## \\d+\\. ${escapeRegExp(section)}\\b`, 'm'))
      })
    })
  })

  it('keeps PRD naming and interface readiness contracts documented', () => {
    expect(mockDataSchemaDocs).toContain('## 当前 PRD 命名映射')
    expect(mockDataSchemaDocs).toContain('## 前端字段契约')
    expect(mockDataSchemaDocs).toContain('`order` | `Purchase`')
    expect(mockDataSchemaDocs).toContain('`item` / `work_order` | `OrderLine.productionTaskNo` + `OrderLine`')
    expect(mockDataSchemaDocs).toContain('`style_template` | `Product`')
    expect(mockDataSchemaDocs).toContain('`payment` | `FinancePaymentRecord`')
    expect(mockDataSchemaDocs).toContain('`inventory_batch` | `InventoryBatch`')
    expect(mockDataSchemaDocs).toContain('`logistics` / `after_sales` | `LogisticsRecord` / `AfterSalesCase`')
    expect(mockDataSchemaDocs).toContain('`ProductVariant` 当前由 `ProductSpecRow` 承载')
    expect(mockDataSchemaDocs).toContain('`FactoryFeedback` 当前由 `OrderLine.productionInfo / productionData` 承载')
    expect(mockDataSchemaDocs).toContain('`FinanceRecord` 当前由 `FinancePaymentRecord + OrderLine.financeStatus')
    expect(mockDataSchemaDocs).toContain('真实接口可以承接 V2 workflow 动作结果字段')
    expect(mockDataSchemaDocs).toContain('`buildOrderLineStatusPatch` 只允许手动状态面板')

    expect(interfaceReadinessDocs).toContain('# Interface Readiness')
    expect(interfaceReadinessDocs).toContain('## 隐式模型映射')
    expect(interfaceReadinessDocs).toContain('## 字段契约矩阵')
    expect(interfaceReadinessDocs).toContain('| 工厂回传 | `OrderLine.productionInfo / productionData` |')
    expect(interfaceReadinessDocs).toContain('| 财务确认 | `FinancePaymentRecord` + `OrderLine.finance*` |')
    expect(interfaceReadinessDocs).toContain('## V2 workflow 动作契约')
    expect(interfaceReadinessDocs).toContain('`logistics` / `after_sales` | `LogisticsRecord` / `AfterSalesCase`')
    expect(interfaceReadinessDocs).toContain('`OrderLine.lineStatus` 仍是主工作流状态')
    expect(interfaceReadinessDocs).toContain('不得恢复 `OrderLine.status`、`productionInfo.factoryStatus`')
    expect(interfaceReadinessDocs).toContain('`LogisticsRecord / AfterSalesCase` 必须 `orderLineId` 优先关联')
    expect(interfaceReadinessDocs).toContain('FIFO 成本只来自共享库存状态中关联销售的 `InventoryMovement.type = outbound`')
    expect(interfaceReadinessDocs).toContain('不恢复 legacy `/orders`')
  })
})
