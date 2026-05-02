import { describe, expect, it } from 'vitest'
import mockDataSchemaDocs from '../../docs/frontend/mock-data-schema.md?raw'

const typeFileModules = import.meta.glob('./*.ts', {
  eager: true,
  import: 'default',
  query: '?raw'
})

const documentedDomainTypes = [
  { file: 'customer.ts', sections: ['Customer'] },
  { file: 'purchase.ts', sections: ['Purchase'] },
  { file: 'order-line.ts', sections: ['OrderLine'] },
  { file: 'product.ts', sections: ['Product', 'ProductSpecRow', 'ProductPriceRule', 'ProductSnapshot'] },
  { file: 'quote.ts', sections: ['QuoteResult'] },
  { file: 'inventory.ts', sections: ['InventoryItem'] },
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
})
